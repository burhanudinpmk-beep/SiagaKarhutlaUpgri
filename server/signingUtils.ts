import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SIGNING_KEY_FILE = path.join(ROOT_DIR, '.siaga-karhutla-signing.key');

let cachedSigningKey: string | null = null;

export function getServerSigningSecret(): string {
  const envSecret = process.env.SIAGA_SIGNING_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }

  if (cachedSigningKey) {
    return cachedSigningKey;
  }

  try {
    if (fs.existsSync(SIGNING_KEY_FILE)) {
      const existing = fs.readFileSync(SIGNING_KEY_FILE, 'utf8').trim();
      if (existing.length >= 32) {
        cachedSigningKey = existing;
        return existing;
      }
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SIGNING_KEY_FILE, generated, { mode: 0o600 });
    cachedSigningKey = generated;
    return generated;
  } catch {
    cachedSigningKey = crypto.randomBytes(32).toString('hex');
    return cachedSigningKey;
  }
}

export function computeHmacHex(
  payload: string,
  secret: string = getServerSigningSecret()
): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyHmacHex(
  payload: string,
  expectedHex: string,
  secret: string = getServerSigningSecret()
): boolean {
  if (typeof expectedHex !== 'string' || !/^[a-f0-9]{64}$/i.test(expectedHex)) {
    return false;
  }
  const actualHex = computeHmacHex(payload, secret);
  const actualBuf = Buffer.from(actualHex, 'hex');
  const expectedBuf = Buffer.from(expectedHex.toLowerCase(), 'hex');
  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

export interface ChallengeProofInput {
  sessionId: string;
  regionId: string;
  missionId: string;
  questionCount: number;
  correctCount: number;
  normalizedAccuracyScore: number;
  normalizedAnalysisQualityScore: number;
  elapsedSeconds: number;
  completedAtIso: string;
}

export function buildChallengeProofPayload(input: ChallengeProofInput): string {
  return [
    'challenge-v1',
    input.sessionId,
    input.regionId,
    input.missionId,
    String(input.questionCount),
    String(input.correctCount),
    String(input.normalizedAccuracyScore),
    String(input.normalizedAnalysisQualityScore),
    String(input.elapsedSeconds),
    input.completedAtIso,
  ].join('|');
}

export function signChallengeCompletionProof(
  input: ChallengeProofInput,
  secret?: string
): string {
  return computeHmacHex(buildChallengeProofPayload(input), secret);
}

export function verifyChallengeCompletionProof(
  input: ChallengeProofInput,
  proofHex: string,
  secret?: string
): boolean {
  return verifyHmacHex(buildChallengeProofPayload(input), proofHex, secret);
}
