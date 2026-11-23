import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeHmacHex,
  verifyChallengeCompletionProof,
  verifyHmacHex,
  type ChallengeProofInput,
} from './signingUtils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CERT_STORE_PATH = path.join(ROOT_DIR, '.siaga-karhutla-certs.json');

export const REQUIRED_CERTIFICATE_MISSIONS: ReadonlyArray<{
  missionId: string;
  regionId: string;
  regionName: string;
  missionCode: string;
  requiredQuestionCount: 5 | 6 | 7;
}> = [
  {
    missionId: 'sim-01',
    regionId: 'kubu-raya',
    regionName: 'Kabupaten Kubu Raya',
    missionCode: 'SIM-KKR-01',
    requiredQuestionCount: 7,
  },
  {
    missionId: 'sim-02',
    regionId: 'ketapang',
    regionName: 'Kabupaten Ketapang',
    missionCode: 'SIM-KTP-01',
    requiredQuestionCount: 7,
  },
  {
    missionId: 'sim-03',
    regionId: 'kayong-utara',
    regionName: 'Kabupaten Kayong Utara',
    missionCode: 'SIM-KYU-01',
    requiredQuestionCount: 7,
  },
  {
    missionId: 'sim-04',
    regionId: 'kota-singkawang',
    regionName: 'Kota Singkawang',
    missionCode: 'SIM-SKW-01',
    requiredQuestionCount: 7,
  },
  {
    missionId: 'sim-06',
    regionId: 'kota-pontianak',
    regionName: 'Kota Pontianak',
    missionCode: 'SIM-PTK-01',
    requiredQuestionCount: 6,
  },
  {
    missionId: 'sim-07',
    regionId: 'sintang',
    regionName: 'Kabupaten Sintang',
    missionCode: 'SIM-STG-01',
    requiredQuestionCount: 6,
  },
  {
    missionId: 'sim-13',
    regionId: 'sanggau',
    regionName: 'Kabupaten Sanggau',
    missionCode: 'SIM-SGG-01',
    requiredQuestionCount: 5,
  },
  {
    missionId: 'sim-15',
    regionId: 'kapuas-hulu',
    regionName: 'Kabupaten Kapuas Hulu',
    missionCode: 'SIM-KPH-01',
    requiredQuestionCount: 5,
  },
];

const VALID_ACTIONS = new Set([
  'rewetting',
  'canal-blocking',
  'firebreak',
  'monitoring-reporting',
  'authorized-suppression',
  'quiz-mitigation',
]);

export interface MissionEvidencePayload {
  missionId: string;
  regionId: string;
  decisionActionId?: string;
  decisionScore?: number;
  overallScore: number;
  challengeSummary: ChallengeProofInput;
  challengeProof: string;
}

export interface IssuedCertificateRecord {
  certificateId: string;
  userId: string;
  studentName: string;
  certificateNumber: string;
  completedMissionIds: string[];
  totalRequiredMissions: number;
  averageScore: number;
  predicate: string;
  issuedAtIso: string;
  validationDigest: string;
  serverVerified: true;
}

export class CertificateValidationError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'CertificateValidationError';
    this.statusCode = statusCode;
  }
}

interface PersistedCertRegistry {
  byNumber: Record<string, IssuedCertificateRecord>;
  byUserId: Record<string, IssuedCertificateRecord>;
}

function loadCertRegistry(): PersistedCertRegistry {
  try {
    if (!fs.existsSync(CERT_STORE_PATH)) {
      return { byNumber: {}, byUserId: {} };
    }
    const raw = fs.readFileSync(CERT_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as PersistedCertRegistry;
    if (parsed && parsed.byNumber && parsed.byUserId) {
      return parsed;
    }
  } catch {
    // fallback empty
  }
  return { byNumber: {}, byUserId: {} };
}

function saveCertRegistry(registry: PersistedCertRegistry): void {
  try {
    fs.writeFileSync(CERT_STORE_PATH, JSON.stringify(registry, null, 2), {
      mode: 0o600,
    });
  } catch {
    // Non-fatal in ephemeral read-only fs if applicable
  }
}

export function buildCertificateDigestPayload(params: {
  userId: string;
  certificateNumber: string;
  completedMissionIds: string[];
  averageScore: number;
  issuedAtIso: string;
}): string {
  return [
    'cert-v1',
    params.userId,
    params.certificateNumber,
    params.completedMissionIds.join(','),
    String(params.averageScore),
    params.issuedAtIso,
  ].join('|');
}

export function deriveCertificatePredicate(averageScore: number): string {
  if (averageScore >= 85) {
    return 'Sangat Memuaskan — Komandan Mitigasi Karhutla Unggul';
  }
  if (averageScore >= 70) {
    return 'Memuaskan — Analis Mitigasi Karhutla Terampil';
  }
  return 'Kompeten — Pelaksana Siaga Karhutla Kalbar';
}

function sanitizePlayerId(raw?: string): string {
  const clean = (raw ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 64);
  return clean.length >= 3 ? clean : 'player_kalbar_default';
}

export function issueValidatedCertificate(params: {
  playerId?: string;
  playerName?: string;
  missionEvidence: MissionEvidencePayload[];
  certificateName?: string;
  signingSecret?: string;
  now?: Date;
  skipDiskPersistence?: boolean;
}): IssuedCertificateRecord {
  const {
    playerId: rawPlayerId,
    playerName: rawPlayerName,
    missionEvidence,
    certificateName,
    signingSecret,
    now = new Date(),
    skipDiskPersistence = false,
  } = params;

  const playerId = sanitizePlayerId(rawPlayerId);

  if (!Array.isArray(missionEvidence)) {
    throw new CertificateValidationError(
      400,
      'Daftar bukti penyelesaian misi wajib dikirimkan sebagai array.'
    );
  }

  const sanitizedCertificateName =
    typeof certificateName === 'string' && certificateName.trim().length >= 2
      ? certificateName.trim().slice(0, 120)
      : typeof rawPlayerName === 'string' && rawPlayerName.trim().length >= 2
        ? rawPlayerName.trim().slice(0, 120)
        : 'Peserta SIAGA KARHUTLA';

  const registry = skipDiskPersistence
    ? { byNumber: {}, byUserId: {} }
    : loadCertRegistry();

  if (registry.byUserId[playerId]) {
    const existing = registry.byUserId[playerId];
    if (existing.studentName !== sanitizedCertificateName) {
      const updated: IssuedCertificateRecord = {
        ...existing,
        studentName: sanitizedCertificateName,
      };
      registry.byUserId[playerId] = updated;
      registry.byNumber[updated.certificateNumber] = updated;
      if (!skipDiskPersistence) {
        saveCertRegistry(registry);
      }
      return updated;
    }
    return existing;
  }

  const evidenceByMissionId = new Map<string, MissionEvidencePayload>();
  for (const item of missionEvidence) {
    if (!item || typeof item.missionId !== 'string') {
      continue;
    }
    const cleanMissionId = item.missionId.trim().toLowerCase();
    evidenceByMissionId.set(cleanMissionId, item);
  }

  const missingMissions: string[] = [];
  const validatedMissionIds: string[] = [];
  const missionScores: number[] = [];

  for (const required of REQUIRED_CERTIFICATE_MISSIONS) {
    const evidence = evidenceByMissionId.get(required.missionId);
    if (!evidence) {
      missingMissions.push(required.missionCode);
      continue;
    }

    if (evidence.regionId?.trim().toLowerCase() !== required.regionId) {
      throw new CertificateValidationError(
        400,
        `Bukti wilayah untuk misi ${required.missionCode} tidak konsisten.`
      );
    }

    const actionId = evidence.decisionActionId ?? 'quiz-mitigation';
    if (!VALID_ACTIONS.has(actionId)) {
      throw new CertificateValidationError(
        400,
        `Tindakan untuk misi ${required.missionCode} tidak valid.`
      );
    }

    const challenge = evidence.challengeSummary;
    if (
      !challenge ||
      challenge.regionId !== required.regionId ||
      challenge.missionId !== required.missionId ||
      ![5, 6, 7].includes(challenge.questionCount)
    ) {
      throw new CertificateValidationError(
        400,
        `Ringkasan kuis STEM untuk misi ${required.missionCode} tidak lengkap atau tidak sesuai.`
      );
    }

    const proofValid = verifyChallengeCompletionProof(
      challenge,
      evidence.challengeProof,
      signingSecret
    );
    if (!proofValid) {
      throw new CertificateValidationError(
        403,
        `Bukti tanda tangan server untuk tantangan misi ${required.missionCode} gagal diverifikasi.`
      );
    }

    const isQuizOnly = actionId === 'quiz-mitigation';
    if (!isQuizOnly) {
      if (
        typeof evidence.decisionScore !== 'number' ||
        !Number.isFinite(evidence.decisionScore) ||
        evidence.decisionScore < 0 ||
        evidence.decisionScore > 100
      ) {
        throw new CertificateValidationError(
          400,
          `Skor Decision Engine untuk misi ${required.missionCode} di luar rentang 0-100.`
        );
      }
    }

    const serverRecomputedOverall = isQuizOnly
      ? Math.round(
          Math.max(
            0,
            Math.min(
              100,
              challenge.normalizedAccuracyScore * 0.65 +
                challenge.normalizedAnalysisQualityScore * 0.35
            )
          )
        )
      : Math.round(
          Math.max(
            0,
            Math.min(
              100,
              challenge.normalizedAccuracyScore * 0.35 +
                challenge.normalizedAnalysisQualityScore * 0.25 +
                (evidence.decisionScore ?? 0) * 0.4
            )
          )
        );

    const declaredOverall =
      typeof evidence.overallScore === 'number' &&
      Number.isFinite(evidence.overallScore)
        ? Math.max(0, Math.min(100, Math.round(evidence.overallScore)))
        : serverRecomputedOverall;

    // Cegah manipulasi skor jauh melampaui batas wajar perhitungan komponen
    const verifiedScore = Math.min(declaredOverall, Math.min(100, serverRecomputedOverall + 15));

    validatedMissionIds.push(required.missionId);
    missionScores.push(verifiedScore);
  }

  if (missingMissions.length > 0) {
    throw new CertificateValidationError(
      400,
      `Belum semua 8 misi wajib diselesaikan dan terverifikasi backend. Misi tersisa: ${missingMissions.join(', ')}.`
    );
  }

  const averageScore = Math.round(
    missionScores.reduce((sum, s) => sum + s, 0) / missionScores.length
  );

  const year = now.getUTCFullYear();
  const suffix = crypto
    .createHash('sha256')
    .update(`${playerId}:${now.toISOString()}:${crypto.randomBytes(4).toString('hex')}`)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();

  const certificateNumber = `SKH-${year}-${suffix}`;
  const certificateId = `cert_${playerId}`;
  const issuedAtIso = now.toISOString();
  const predicate = deriveCertificatePredicate(averageScore);

  const validationDigest = computeHmacHex(
    buildCertificateDigestPayload({
      userId: playerId,
      certificateNumber,
      completedMissionIds: validatedMissionIds,
      averageScore,
      issuedAtIso,
    }),
    signingSecret
  );

  const certificate: IssuedCertificateRecord = {
    certificateId,
    userId: playerId,
    studentName: sanitizedCertificateName,
    certificateNumber,
    completedMissionIds: validatedMissionIds,
    totalRequiredMissions: REQUIRED_CERTIFICATE_MISSIONS.length,
    averageScore,
    predicate,
    issuedAtIso,
    validationDigest,
    serverVerified: true,
  };

  if (!skipDiskPersistence) {
    registry.byNumber[certificateNumber] = certificate;
    registry.byUserId[playerId] = certificate;
    saveCertRegistry(registry);
  }

  return certificate;
}

export function verifyCertificateRecord(
  cert: IssuedCertificateRecord,
  signingSecret?: string
): boolean {
  if (!cert || cert.serverVerified !== true) return false;
  return verifyHmacHex(
    buildCertificateDigestPayload({
      userId: cert.userId,
      certificateNumber: cert.certificateNumber,
      completedMissionIds: cert.completedMissionIds,
      averageScore: cert.averageScore,
      issuedAtIso: cert.issuedAtIso,
    }),
    cert.validationDigest,
    signingSecret
  );
}

export function lookupCertificateByNumber(
  certificateNumber: string
): IssuedCertificateRecord | null {
  const clean = certificateNumber.trim().toUpperCase();
  if (!/^SKH-[0-9]{4}-[A-Z0-9]{6,12}$/.test(clean)) {
    return null;
  }
  const registry = loadCertRegistry();
  const found = registry.byNumber[clean];
  if (!found) {
    return null;
  }
  return verifyCertificateRecord(found) ? found : null;
}
