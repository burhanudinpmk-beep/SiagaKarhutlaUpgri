import type { RegionStatus } from '../types/mission';

export type MitigationActionId =
  | 'rewetting'
  | 'canal-blocking'
  | 'firebreak'
  | 'monitoring-reporting'
  | 'authorized-suppression';

export type ActionSuitabilityLevel =
  | 'sangat-sesuai'
  | 'sesuai-bersyarat'
  | 'kurang-tepat'
  | 'tidak-sesuai';

export interface DecisionScoreBreakdown {
  actionSuitabilityPoints: number;
  caseConditionPoints: number;
  penaltyPoints: number;
}

export interface StemCompetencyScores {
  science: number;
  technology: number;
  engineering: number;
  mathematics: number;
}

export interface DecisionScoringPayload {
  regionId: string;
  regionName: string;
  missionId: string;
  missionCode: string;
  scenarioTitle: string;
  landType: string;
  riskLevel: RegionStatus;
  actionId: MitigationActionId;
  actionLabel: string;
  suitability: ActionSuitabilityLevel;
  suitabilityLabel: string;
  totalScore: number;
  scoreBreakdown: DecisionScoreBreakdown;
  consideredConditionsCount: number;
  requiredConditionsCount: number;
  preventiveReplacementWarning: boolean;
  scientificReasonSummary: string;
  simulationConsequenceSummary: string;
  rubricNotes: string[];
  stemWeights?: Partial<StemCompetencyScores>;
}

export interface DecisionScoreRecord {
  recordId: string;
  regionId: string;
  regionName: string;
  missionId: string;
  missionCode: string;
  scenarioTitle: string;
  landType: string;
  riskLevel: RegionStatus;
  actionId: MitigationActionId;
  actionLabel: string;
  suitability: ActionSuitabilityLevel;
  suitabilityLabel: string;
  totalScore: number;
  maxPossibleScore: 100;
  scoreBreakdown: DecisionScoreBreakdown;
  consideredConditionsCount: number;
  requiredConditionsCount: number;
  preventiveReplacementWarning: boolean;
  scientificReasonSummary: string;
  simulationConsequenceSummary: string;
  rubricNotes: string[];
  stemScores: StemCompetencyScores;
  submittedAtIso: string;
}

export interface ChallengeStemBucket {
  correct: number;
  total: number;
  earnedWeight: number;
  totalWeight: number;
  normalizedScore: number;
}

export interface ChallengeScoringPayload {
  sessionId: string;
  regionId: string;
  regionName: string;
  missionId: string;
  questionCount: 5 | 6 | 7;
  answeredCount: number;
  correctCount: number;
  totalWeight: number;
  earnedWeight: number;
  normalizedAccuracyScore: number;
  normalizedAnalysisQualityScore: number;
  elapsedSeconds: number;
  targetSeconds: number;
  stemBreakdown: {
    S: ChallengeStemBucket;
    T: ChallengeStemBucket;
    E: ChallengeStemBucket;
    M: ChallengeStemBucket;
  };
  completedAtIso: string;
  serverProof?: string;
}

export interface ChallengeScoreRecord extends ChallengeScoringPayload {
  recordId: string;
  completionTimeScore: number;
  compositeChallengeScore: number;
}

export interface FiveMetricBreakdown {
  answerAccuracy: number | null;
  analysisQuality: number | null;
  decisionPrecision: number | null;
  modelEffectiveness: number | null;
  completionTime: number | null;
}

export type ScoringReadinessTier =
  | 'optimal'
  | 'baik'
  | 'perlu-perbaikan'
  | 'belum-dievaluasi';

export interface MissionScoringSummary {
  regionId: string;
  regionName: string;
  missionId: string;
  missionCode: string;
  attemptsCount: number;
  latestRecord: DecisionScoreRecord | null;
  latestChallenge: ChallengeScoreRecord | null;
  challengeAttemptsCount: number;
  hasDecisionEvaluation: boolean;
  hasChallengeEvaluation: boolean;
  bestScore: number;
  latestScore: number;
  averageScore: number;
  overallScore: number;
  fiveMetrics: FiveMetricBreakdown;
  readinessTier: ScoringReadinessTier;
  readinessLabel: string;
  stemScores: StemCompetencyScores | null;
  history: DecisionScoreRecord[];
  challengeHistory: ChallengeScoreRecord[];
}

export interface ScoringSubmissionReceipt {
  accepted: boolean;
  engineName: 'SIAGA KARHUTLA Scoring Engine';
  record: DecisionScoreRecord;
  missionSummary: MissionScoringSummary;
  message: string;
}

export interface ChallengeScoringReceipt {
  accepted: boolean;
  engineName: 'SIAGA KARHUTLA Scoring Engine';
  challengeRecord: ChallengeScoreRecord;
  missionSummary: MissionScoringSummary;
  message: string;
}

export interface ScoringStorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const SCORING_STORAGE_KEY = 'siaga_karhutla_scoring_records_v1';
const CHALLENGE_STORAGE_KEY = 'siaga_karhutla_challenge_records_v1';
export const SCORING_ENGINE_UPDATED_EVENT = 'siaga-karhutla:scoring-updated';

let inMemoryFallbackStore: Record<string, DecisionScoreRecord[]> = {};
let inMemoryChallengeFallbackStore: Record<string, ChallengeScoreRecord[]> = {};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getDefaultStorage(): ScoringStorageAdapter | null {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage;
  }
  return null;
}

function getMissionKey(regionId: string, missionId?: string | null): string {
  const cleanRegion = regionId.trim().toLowerCase();
  const cleanMission = missionId?.trim().toLowerCase() || `sim-${cleanRegion}`;
  return `${cleanRegion}::${cleanMission}`;
}

function loadStoreMap<T>(
  storageKey: string,
  fallbackStore: Record<string, T[]>,
  storage?: ScoringStorageAdapter | null
): Record<string, T[]> {
  const targetStorage = storage === undefined ? getDefaultStorage() : storage;
  if (!targetStorage) {
    return fallbackStore;
  }
  try {
    const raw = targetStorage.getItem(storageKey);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, T[]>;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    // Fallback to empty object if storage corrupted
  }
  return {};
}

function saveStoreMap<T>(
  storageKey: string,
  map: Record<string, T[]>,
  assignFallback: (next: Record<string, T[]>) => void,
  storage?: ScoringStorageAdapter | null
): void {
  const targetStorage = storage === undefined ? getDefaultStorage() : storage;
  if (!targetStorage) {
    assignFallback(map);
    return;
  }
  try {
    targetStorage.setItem(storageKey, JSON.stringify(map));
  } catch {
    assignFallback(map);
  }
}

/**
 * Menghitung skor waktu penyelesaian yang dinormalisasi terhadap jumlah soal (targetSeconds = N * 35 detik).
 * Skor waktu dimodulasi oleh akurasi jawaban agar klik cepat tanpa pemahaman tidak menghasilkan nilai waktu tinggi.
 */
export function computeNormalizedCompletionTimeScore(params: {
  elapsedSeconds: number;
  targetSeconds: number;
  normalizedAccuracyScore: number;
}): number {
  const safeTarget = Math.max(30, params.targetSeconds);
  const safeElapsed = Math.max(1, params.elapsedSeconds);
  const accuracyFactor = Math.max(0, Math.min(1, params.normalizedAccuracyScore / 100));

  let rawPaceScore = 100;
  if (safeElapsed <= safeTarget) {
    rawPaceScore = 100;
  } else {
    const overtimeRatio = (safeElapsed - safeTarget) / safeTarget;
    rawPaceScore = Math.max(35, 100 - overtimeRatio * 55);
  }

  // Modulasi akurasi: 25% dasar kecepatan + 75% proporsional terhadap ketepatan jawaban
  const modulated = rawPaceScore * (0.25 + 0.75 * accuracyFactor);
  return clampScore(modulated);
}

/**
 * Menghitung efektivitas tindakan dalam model simulasi berdasarkan:
 * kesesuaian tindakan, kepatuhan aturan pencegahan vs pemadaman aktif, dan kalibrasi kondisi kasus.
 */
export function computeModelEffectivenessScore(
  decision: DecisionScoreRecord | null
): number | null {
  if (!decision) return null;

  const baseSuitabilityEffectiveness =
    decision.suitability === 'sangat-sesuai'
      ? 86
      : decision.suitability === 'sesuai-bersyarat'
        ? 68
        : decision.suitability === 'kurang-tepat'
          ? 38
          : 18;

  const conditionRatio =
    decision.requiredConditionsCount > 0
      ? Math.min(1, decision.consideredConditionsCount / decision.requiredConditionsCount)
      : 0;

  const conditionBoost = Math.round(conditionRatio * 14);
  const preventivePenalty = decision.preventiveReplacementWarning ? 18 : 0;

  return clampScore(baseSuitabilityEffectiveness + conditionBoost - preventivePenalty);
}

/**
 * Menghitung 5 dimensi utama penilaian Scoring Engine:
 * 1. Akurasi jawaban
 * 2. Kualitas analisis
 * 3. Ketepatan keputusan
 * 4. Efektivitas tindakan dalam model
 * 5. Waktu penyelesaian
 */
export function computeFiveScoringMetrics(params: {
  latestDecision: DecisionScoreRecord | null;
  latestChallenge: ChallengeScoreRecord | null;
}): FiveMetricBreakdown {
  const { latestDecision, latestChallenge } = params;

  const answerAccuracy = latestChallenge
    ? clampScore(latestChallenge.normalizedAccuracyScore)
    : null;

  const decisionPrecision = latestDecision ? clampScore(latestDecision.totalScore) : null;

  const modelEffectiveness = computeModelEffectivenessScore(latestDecision);

  const completionTime = latestChallenge
    ? clampScore(latestChallenge.completionTimeScore)
    : null;

  let analysisQuality: number | null = null;
  const decisionConditionRatioPct =
    latestDecision && latestDecision.requiredConditionsCount > 0
      ? clampScore(
          (Math.min(
            latestDecision.consideredConditionsCount,
            latestDecision.requiredConditionsCount
          ) /
            latestDecision.requiredConditionsCount) *
            100 -
            Math.min(25, latestDecision.scoreBreakdown.penaltyPoints)
        )
      : null;

  if (latestChallenge && decisionConditionRatioPct !== null) {
    analysisQuality = clampScore(
      latestChallenge.normalizedAnalysisQualityScore * 0.65 +
        decisionConditionRatioPct * 0.35
    );
  } else if (latestChallenge) {
    analysisQuality = clampScore(latestChallenge.normalizedAnalysisQualityScore);
  } else if (decisionConditionRatioPct !== null) {
    analysisQuality = decisionConditionRatioPct;
  }

  return {
    answerAccuracy,
    analysisQuality,
    decisionPrecision,
    modelEffectiveness,
    completionTime,
  };
}

export function deriveStemCompetencyScores(
  payload: DecisionScoringPayload
): StemCompetencyScores {
  const base = clampScore(payload.totalScore);
  const conditionRatio =
    payload.requiredConditionsCount > 0
      ? Math.min(1, payload.consideredConditionsCount / payload.requiredConditionsCount)
      : 0;

  const suitabilityBonus =
    payload.suitability === 'sangat-sesuai'
      ? 6
      : payload.suitability === 'sesuai-bersyarat'
        ? 2
        : payload.suitability === 'kurang-tepat'
          ? -6
          : -14;

  const science = clampScore(
    (payload.stemWeights?.science ?? base + suitabilityBonus * 0.5) -
      (payload.preventiveReplacementWarning ? 8 : 0)
  );
  const technology = clampScore(
    payload.stemWeights?.technology ?? base * 0.88 + conditionRatio * 12
  );
  const engineering = clampScore(
    payload.stemWeights?.engineering ?? base + suitabilityBonus
  );
  const mathematics = clampScore(
    payload.stemWeights?.mathematics ?? base * 0.8 + conditionRatio * 20
  );

  return {
    science,
    technology,
    engineering,
    mathematics,
  };
}

function mergeStemCompetencyScores(
  decisionStem: StemCompetencyScores | null,
  challenge: ChallengeScoreRecord | null
): StemCompetencyScores | null {
  if (!decisionStem && !challenge) return null;

  if (decisionStem && !challenge) {
    return decisionStem;
  }

  if (!decisionStem && challenge) {
    return {
      science: clampScore(challenge.stemBreakdown.S.normalizedScore),
      technology: clampScore(challenge.stemBreakdown.T.normalizedScore),
      engineering: clampScore(challenge.stemBreakdown.E.normalizedScore),
      mathematics: clampScore(challenge.stemBreakdown.M.normalizedScore),
    };
  }

  const d = decisionStem!;
  const c = challenge!.stemBreakdown;
  return {
    science: clampScore(d.science * 0.5 + c.S.normalizedScore * 0.5),
    technology: clampScore(d.technology * 0.5 + c.T.normalizedScore * 0.5),
    engineering: clampScore(d.engineering * 0.5 + c.E.normalizedScore * 0.5),
    mathematics: clampScore(d.mathematics * 0.5 + c.M.normalizedScore * 0.5),
  };
}

export function classifyScoringReadiness(
  score: number,
  attemptsCount: number,
  hasChallengeEvaluation = false
): {
  tier: ScoringReadinessTier;
  label: string;
} {
  if (attemptsCount === 0 && !hasChallengeEvaluation) {
    return {
      tier: 'belum-dievaluasi',
      label: 'Menunggu Keputusan Simulasi & Tantangan STEM',
    };
  }
  if (score >= 85) {
    return {
      tier: 'optimal',
      label: 'Kompetensi Mitigasi & Analisis STEM Optimal',
    };
  }
  if (score >= 65) {
    return {
      tier: 'baik',
      label: 'Kompetensi Cukup Baik (Perlu Penajaman Kondisi Kasus & Analisis)',
    };
  }
  return {
    tier: 'perlu-perbaikan',
    label: 'Perlu Evaluasi Ulang Strategi Mitigasi & Pemahaman STEM',
  };
}

function computeOverallScoreFromFiveMetrics(
  fiveMetrics: FiveMetricBreakdown,
  latestDecision: DecisionScoreRecord | null,
  latestChallenge: ChallengeScoreRecord | null
): number {
  if (
    fiveMetrics.answerAccuracy !== null &&
    fiveMetrics.analysisQuality !== null &&
    fiveMetrics.decisionPrecision !== null &&
    fiveMetrics.modelEffectiveness !== null &&
    fiveMetrics.completionTime !== null
  ) {
    return clampScore(
      fiveMetrics.answerAccuracy * 0.25 +
        fiveMetrics.analysisQuality * 0.2 +
        fiveMetrics.decisionPrecision * 0.25 +
        fiveMetrics.modelEffectiveness * 0.2 +
        fiveMetrics.completionTime * 0.1
    );
  }
  if (latestDecision) {
    return latestDecision.totalScore;
  }
  if (latestChallenge) {
    return latestChallenge.compositeChallengeScore;
  }
  return 0;
}

function buildSummaryFromHistories(
  regionId: string,
  missionId: string,
  decisionHistory: DecisionScoreRecord[],
  challengeHistory: ChallengeScoreRecord[]
): MissionScoringSummary {
  const latestRecord = decisionHistory[0] ?? null;
  const latestChallenge = challengeHistory[0] ?? null;
  const fiveMetrics = computeFiveScoringMetrics({
    latestDecision: latestRecord,
    latestChallenge,
  });
  const overallScore = computeOverallScoreFromFiveMetrics(
    fiveMetrics,
    latestRecord,
    latestChallenge
  );
  const stemScores = mergeStemCompetencyScores(
    latestRecord?.stemScores ?? null,
    latestChallenge
  );

  if (!latestRecord && !latestChallenge) {
    const readiness = classifyScoringReadiness(0, 0, false);
    return {
      regionId,
      regionName: regionId,
      missionId,
      missionCode: missionId.toUpperCase(),
      attemptsCount: 0,
      latestRecord: null,
      latestChallenge: null,
      challengeAttemptsCount: 0,
      hasDecisionEvaluation: false,
      hasChallengeEvaluation: false,
      bestScore: 0,
      latestScore: 0,
      averageScore: 0,
      overallScore: 0,
      fiveMetrics,
      readinessTier: readiness.tier,
      readinessLabel: readiness.label,
      stemScores: null,
      history: [],
      challengeHistory: [],
    };
  }

  const bestDecisionScore =
    decisionHistory.length > 0
      ? Math.max(...decisionHistory.map((item) => item.totalScore))
      : 0;
  const latestDecisionScore = latestRecord ? latestRecord.totalScore : 0;
  const averageDecisionScore =
    decisionHistory.length > 0
      ? Math.round(
          decisionHistory.reduce((sum, item) => sum + item.totalScore, 0) /
            decisionHistory.length
        )
      : 0;

  const bestChallengeScore =
    challengeHistory.length > 0
      ? Math.max(...challengeHistory.map((item) => item.compositeChallengeScore))
      : 0;

  const resolvedLatestScore = latestRecord
    ? latestDecisionScore
    : latestChallenge?.compositeChallengeScore ?? 0;
  const resolvedBestScore = latestRecord
    ? Math.max(bestDecisionScore, overallScore)
    : bestChallengeScore;
  const resolvedAverageScore = latestRecord
    ? averageDecisionScore
    : latestChallenge
      ? Math.round(
          challengeHistory.reduce((sum, item) => sum + item.compositeChallengeScore, 0) /
            challengeHistory.length
        )
      : 0;

  const readiness = classifyScoringReadiness(
    overallScore,
    decisionHistory.length,
    challengeHistory.length > 0
  );

  return {
    regionId: latestRecord?.regionId ?? latestChallenge?.regionId ?? regionId,
    regionName:
      latestRecord?.regionName ?? latestChallenge?.regionName ?? regionId,
    missionId: latestRecord?.missionId ?? latestChallenge?.missionId ?? missionId,
    missionCode:
      latestRecord?.missionCode ?? missionId.toUpperCase(),
    attemptsCount: decisionHistory.length,
    latestRecord,
    latestChallenge,
    challengeAttemptsCount: challengeHistory.length,
    hasDecisionEvaluation: decisionHistory.length > 0,
    hasChallengeEvaluation: challengeHistory.length > 0,
    bestScore: resolvedBestScore,
    latestScore: resolvedLatestScore,
    averageScore: resolvedAverageScore,
    overallScore,
    fiveMetrics,
    readinessTier: readiness.tier,
    readinessLabel: readiness.label,
    stemScores,
    history: decisionHistory,
    challengeHistory,
  };
}

function dispatchScoringUpdatedEvent(detail: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(
      new CustomEvent(SCORING_ENGINE_UPDATED_EVENT, { detail })
    );
  }
}

/**
 * Menerima hasil evaluasi keputusan dari Decision Engine dan mencatatnya
 * ke dalam riwayat penilaian Scoring Engine.
 */
export function submitDecisionResultToScoringEngine(
  payload: DecisionScoringPayload,
  storage?: ScoringStorageAdapter | null
): ScoringSubmissionReceipt {
  const cleanScore = clampScore(payload.totalScore);
  const stemScores = deriveStemCompetencyScores({
    ...payload,
    totalScore: cleanScore,
  });

  const submittedAtIso = new Date().toISOString();
  const recordId = `scr-${payload.regionId}-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;

  const record: DecisionScoreRecord = {
    recordId,
    regionId: payload.regionId,
    regionName: payload.regionName,
    missionId: payload.missionId,
    missionCode: payload.missionCode,
    scenarioTitle: payload.scenarioTitle,
    landType: payload.landType,
    riskLevel: payload.riskLevel,
    actionId: payload.actionId,
    actionLabel: payload.actionLabel,
    suitability: payload.suitability,
    suitabilityLabel: payload.suitabilityLabel,
    totalScore: cleanScore,
    maxPossibleScore: 100,
    scoreBreakdown: { ...payload.scoreBreakdown },
    consideredConditionsCount: payload.consideredConditionsCount,
    requiredConditionsCount: payload.requiredConditionsCount,
    preventiveReplacementWarning: payload.preventiveReplacementWarning,
    scientificReasonSummary: payload.scientificReasonSummary,
    simulationConsequenceSummary: payload.simulationConsequenceSummary,
    rubricNotes: [...payload.rubricNotes],
    stemScores,
    submittedAtIso,
  };

  const decisionMap = loadStoreMap<DecisionScoreRecord>(
    SCORING_STORAGE_KEY,
    inMemoryFallbackStore,
    storage
  );
  const challengeMap = loadStoreMap<ChallengeScoreRecord>(
    CHALLENGE_STORAGE_KEY,
    inMemoryChallengeFallbackStore,
    storage
  );

  const key = getMissionKey(payload.regionId, payload.missionId);
  const existing = Array.isArray(decisionMap[key]) ? decisionMap[key] : [];
  const nextHistory = [record, ...existing].slice(0, 12);
  decisionMap[key] = nextHistory;
  saveStoreMap(
    SCORING_STORAGE_KEY,
    decisionMap,
    (next) => {
      inMemoryFallbackStore = next;
    },
    storage
  );

  const challengeHistory = Array.isArray(challengeMap[key]) ? challengeMap[key] : [];
  const missionSummary = buildSummaryFromHistories(
    payload.regionId,
    payload.missionId,
    nextHistory,
    challengeHistory
  );

  dispatchScoringUpdatedEvent({
    regionId: payload.regionId,
    missionId: payload.missionId,
    record,
  });

  return {
    accepted: true,
    engineName: 'SIAGA KARHUTLA Scoring Engine',
    record,
    missionSummary,
    message: `Hasil keputusan "${payload.actionLabel}" (skor ${cleanScore}/100) berhasil dikirim dan tercatat di Scoring Engine.`,
  };
}

/**
 * Menerima hasil tantangan STEM terverifikasi backend dan menghitung skor ternormalisasi
 * (akurasi jawaban, kualitas analisis, serta waktu penyelesaian) untuk Scoring Engine.
 */
export function submitChallengeResultToScoringEngine(
  payload: ChallengeScoringPayload,
  storage?: ScoringStorageAdapter | null
): ChallengeScoringReceipt {
  const completionTimeScore = computeNormalizedCompletionTimeScore({
    elapsedSeconds: payload.elapsedSeconds,
    targetSeconds: payload.targetSeconds,
    normalizedAccuracyScore: payload.normalizedAccuracyScore,
  });

  const normalizedAccuracyScore = clampScore(payload.normalizedAccuracyScore);
  const normalizedAnalysisQualityScore = clampScore(
    payload.normalizedAnalysisQualityScore
  );

  const compositeChallengeScore = clampScore(
    normalizedAccuracyScore * 0.5 +
      normalizedAnalysisQualityScore * 0.35 +
      completionTimeScore * 0.15
  );

  const challengeRecord: ChallengeScoreRecord = {
    ...payload,
    normalizedAccuracyScore,
    normalizedAnalysisQualityScore,
    recordId: `chl-${payload.regionId}-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`,
    completionTimeScore,
    compositeChallengeScore,
  };

  const decisionMap = loadStoreMap<DecisionScoreRecord>(
    SCORING_STORAGE_KEY,
    inMemoryFallbackStore,
    storage
  );
  const challengeMap = loadStoreMap<ChallengeScoreRecord>(
    CHALLENGE_STORAGE_KEY,
    inMemoryChallengeFallbackStore,
    storage
  );

  const key = getMissionKey(payload.regionId, payload.missionId);
  const existingChallenges = Array.isArray(challengeMap[key])
    ? challengeMap[key]
    : [];
  const nextChallengeHistory = [challengeRecord, ...existingChallenges].slice(0, 12);
  challengeMap[key] = nextChallengeHistory;
  saveStoreMap(
    CHALLENGE_STORAGE_KEY,
    challengeMap,
    (next) => {
      inMemoryChallengeFallbackStore = next;
    },
    storage
  );

  const decisionHistory = Array.isArray(decisionMap[key]) ? decisionMap[key] : [];
  const missionSummary = buildSummaryFromHistories(
    payload.regionId,
    payload.missionId,
    decisionHistory,
    nextChallengeHistory
  );

  dispatchScoringUpdatedEvent({
    regionId: payload.regionId,
    missionId: payload.missionId,
    challengeRecord,
  });

  return {
    accepted: true,
    engineName: 'SIAGA KARHUTLA Scoring Engine',
    challengeRecord,
    missionSummary,
    message: `Hasil tantangan ${payload.questionCount} soal (${payload.correctCount}/${payload.questionCount} benar, akurasi berbobot ${normalizedAccuracyScore}/100) tercatat di Scoring Engine.`,
  };
}

function findMatchingHistory<T extends { submittedAtIso?: string; completedAtIso?: string }>(
  storeMap: Record<string, T[]>,
  regionId: string,
  missionId?: string | null
): T[] {
  const exactKey = getMissionKey(regionId, missionId);
  const exact = storeMap[exactKey];
  if (exact && exact.length > 0) {
    return exact;
  }

  if (!missionId) {
    const prefix = `${regionId.trim().toLowerCase()}::`;
    return Object.entries(storeMap)
      .filter(([k]) => k.startsWith(prefix))
      .flatMap(([, records]) => records)
      .sort((a, b) =>
        (b.submittedAtIso ?? b.completedAtIso ?? '').localeCompare(
          a.submittedAtIso ?? a.completedAtIso ?? ''
        )
      );
  }

  return [];
}

export function getMissionScoringSummary(
  regionId: string,
  missionId?: string | null,
  storage?: ScoringStorageAdapter | null
): MissionScoringSummary {
  const decisionMap = loadStoreMap<DecisionScoreRecord>(
    SCORING_STORAGE_KEY,
    inMemoryFallbackStore,
    storage
  );
  const challengeMap = loadStoreMap<ChallengeScoreRecord>(
    CHALLENGE_STORAGE_KEY,
    inMemoryChallengeFallbackStore,
    storage
  );

  const decisionHistory = findMatchingHistory(decisionMap, regionId, missionId);
  const challengeHistory = findMatchingHistory(challengeMap, regionId, missionId);

  return buildSummaryFromHistories(
    regionId.trim().toLowerCase(),
    missionId?.trim() || `sim-${regionId.trim().toLowerCase()}`,
    decisionHistory,
    challengeHistory
  );
}

export function getAllMissionScoringSummaries(
  storage?: ScoringStorageAdapter | null
): MissionScoringSummary[] {
  const decisionMap = loadStoreMap<DecisionScoreRecord>(
    SCORING_STORAGE_KEY,
    inMemoryFallbackStore,
    storage
  );
  const challengeMap = loadStoreMap<ChallengeScoreRecord>(
    CHALLENGE_STORAGE_KEY,
    inMemoryChallengeFallbackStore,
    storage
  );

  const allKeys = new Set([
    ...Object.keys(decisionMap),
    ...Object.keys(challengeMap),
  ]);

  const summaries: MissionScoringSummary[] = [];
  for (const key of allKeys) {
    const decisionHistory = Array.isArray(decisionMap[key]) ? decisionMap[key] : [];
    const challengeHistory = Array.isArray(challengeMap[key]) ? challengeMap[key] : [];
    if (decisionHistory.length === 0 && challengeHistory.length === 0) {
      continue;
    }
    const [regionId, missionId] = key.split('::');
    summaries.push(
      buildSummaryFromHistories(
        decisionHistory[0]?.regionId ?? challengeHistory[0]?.regionId ?? regionId,
        decisionHistory[0]?.missionId ?? challengeHistory[0]?.missionId ?? missionId,
        decisionHistory,
        challengeHistory
      )
    );
  }

  return summaries.sort((a, b) => {
    const timeB =
      b.latestRecord?.submittedAtIso ?? b.latestChallenge?.completedAtIso ?? '';
    const timeA =
      a.latestRecord?.submittedAtIso ?? a.latestChallenge?.completedAtIso ?? '';
    return timeB.localeCompare(timeA);
  });
}

export function clearScoringHistory(
  regionId?: string,
  missionId?: string | null,
  storage?: ScoringStorageAdapter | null
): void {
  if (!regionId) {
    saveStoreMap<DecisionScoreRecord>(
      SCORING_STORAGE_KEY,
      {},
      (next) => {
        inMemoryFallbackStore = next;
      },
      storage
    );
    saveStoreMap<ChallengeScoreRecord>(
      CHALLENGE_STORAGE_KEY,
      {},
      (next) => {
        inMemoryChallengeFallbackStore = next;
      },
      storage
    );
    inMemoryFallbackStore = {};
    inMemoryChallengeFallbackStore = {};
    return;
  }

  const key = getMissionKey(regionId, missionId);
  const decisionMap = loadStoreMap<DecisionScoreRecord>(
    SCORING_STORAGE_KEY,
    inMemoryFallbackStore,
    storage
  );
  const challengeMap = loadStoreMap<ChallengeScoreRecord>(
    CHALLENGE_STORAGE_KEY,
    inMemoryChallengeFallbackStore,
    storage
  );

  delete decisionMap[key];
  delete challengeMap[key];

  saveStoreMap(
    SCORING_STORAGE_KEY,
    decisionMap,
    (next) => {
      inMemoryFallbackStore = next;
    },
    storage
  );
  saveStoreMap(
    CHALLENGE_STORAGE_KEY,
    challengeMap,
    (next) => {
      inMemoryChallengeFallbackStore = next;
    },
    storage
  );
}

export function exportScoringEngineMaps(
  storage?: ScoringStorageAdapter | null
): {
  decisionMap: Record<string, DecisionScoreRecord[]>;
  challengeMap: Record<string, ChallengeScoreRecord[]>;
} {
  return {
    decisionMap: loadStoreMap<DecisionScoreRecord>(
      SCORING_STORAGE_KEY,
      inMemoryFallbackStore,
      storage
    ),
    challengeMap: loadStoreMap<ChallengeScoreRecord>(
      CHALLENGE_STORAGE_KEY,
      inMemoryChallengeFallbackStore,
      storage
    ),
  };
}

export function hydrateScoringEngineFromRemote(
  params: {
    decisionRecords: DecisionScoreRecord[];
    challengeRecords: ChallengeScoreRecord[];
  },
  storage?: ScoringStorageAdapter | null
): void {
  const decisionMap: Record<string, DecisionScoreRecord[]> = {};
  const challengeMap: Record<string, ChallengeScoreRecord[]> = {};

  for (const rec of params.decisionRecords) {
    if (!rec || !rec.regionId) continue;
    const key = getMissionKey(rec.regionId, rec.missionId);
    const list = decisionMap[key] ?? [];
    list.push(rec);
    decisionMap[key] = list
      .sort((a, b) => (b.submittedAtIso ?? '').localeCompare(a.submittedAtIso ?? ''))
      .slice(0, 12);
  }

  for (const rec of params.challengeRecords) {
    if (!rec || !rec.regionId) continue;
    const key = getMissionKey(rec.regionId, rec.missionId);
    const list = challengeMap[key] ?? [];
    list.push(rec);
    challengeMap[key] = list
      .sort((a, b) => (b.completedAtIso ?? '').localeCompare(a.completedAtIso ?? ''))
      .slice(0, 12);
  }

  saveStoreMap(
    SCORING_STORAGE_KEY,
    decisionMap,
    (next) => {
      inMemoryFallbackStore = next;
    },
    storage
  );
  saveStoreMap(
    CHALLENGE_STORAGE_KEY,
    challengeMap,
    (next) => {
      inMemoryChallengeFallbackStore = next;
    },
    storage
  );

  dispatchScoringUpdatedEvent({ hydratedFromRemote: true });
}

