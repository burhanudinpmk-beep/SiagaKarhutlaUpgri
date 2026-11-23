import crypto from 'node:crypto';
import {
  CHALLENGE_QUESTION_BANK,
  KALBAR_REGION_POLICIES,
  type BankQuestion,
  type DifficultyLevel,
  type QuizSubject,
  type RiskTier,
  type StemCategory,
} from './challengeBank.ts';
import {
  buildRandomizedChallengeDeck,
  sanitizeQuestionForClient,
  type PublicChallengeQuestion,
  type RandomizedQuestionEntry,
} from './questionRandomizer.ts';
import { signChallengeCompletionProof } from './signingUtils.ts';

export interface CreateSessionInput {
  regionId: string;
  missionId?: string;
  riskLevel?: RiskTier;
  questionCount?: 5 | 6 | 7;
  excludeQuestionIds?: readonly string[];
}

export interface SubmitAnswerInput {
  questionId: string;
  selectedOptionId: string;
}

export interface RecoverRetryWrongInput {
  regionId: string;
  missionId?: string;
  riskLevel?: RiskTier;
  questionIds: string[];
  previousAnswers: SubmitAnswerInput[];
  retryAnswers: SubmitAnswerInput[];
}

export interface StemCategoryResultSummary {
  correct: number;
  total: number;
  earnedWeight: number;
  totalWeight: number;
  normalizedScore: number;
}

export interface ChallengeCompletionSummary {
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
  stemBreakdown: Record<StemCategory, StemCategoryResultSummary>;
  completedAtIso: string;
  serverProof?: string;
}

export interface RevealedQuestionFeedback {
  questionId: string;
  subject: QuizSubject;
  topicTitle: string;
  hotspotTitle: string;
  selectedOptionId: string;
  isCorrect: boolean;
  correctOptionId: string;
  acuan: string[];
  explanation: string;
  stemChoInsight: string;
  earnedWeight: number;
  maxWeight: number;
  stemCategory: StemCategory;
  difficulty: DifficultyLevel;
  answeredAtMs: number;
}

export interface PublicChallengeSessionStart {
  sessionId: string;
  regionId: string;
  regionName: string;
  missionId: string;
  riskLevel: RiskTier;
  questionCount: 5 | 6 | 7;
  targetSeconds: number;
  startedAtIso: string;
  questions: PublicChallengeQuestion[];
}

export interface PublicChallengeSessionState extends PublicChallengeSessionStart {
  answeredCount: number;
  isCompleted: boolean;
  elapsedSeconds: number;
  revealedFeedback: Record<string, RevealedQuestionFeedback>;
  summary: ChallengeCompletionSummary | null;
}

export interface SubmitAnswerResult {
  sessionId: string;
  feedback: RevealedQuestionFeedback;
  answeredCount: number;
  totalQuestions: 5 | 6 | 7;
  isCompleted: boolean;
  elapsedSeconds: number;
  summary: ChallengeCompletionSummary | null;
}

export interface SubmitBatchResult {
  sessionId: string;
  feedbackList: RevealedQuestionFeedback[];
  answeredCount: number;
  totalQuestions: 5 | 6 | 7;
  isCompleted: boolean;
  elapsedSeconds: number;
  summary: ChallengeCompletionSummary | null;
}

interface InternalChallengeSession {
  sessionId: string;
  regionId: string;
  regionName: string;
  missionId: string;
  riskLevel: RiskTier;
  questionCount: 5 | 6 | 7;
  targetSeconds: number;
  startedAtMs: number;
  completedAtMs: number | null;
  entries: RandomizedQuestionEntry[];
  publicQuestions: PublicChallengeQuestion[];
  answers: Record<string, RevealedQuestionFeedback>;
}

export class ChallengeServiceError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ChallengeServiceError';
    this.statusCode = statusCode;
  }
}

const SESSION_TTL_MS = 45 * 60 * 1000;
const MAX_ACTIVE_SESSIONS = 500;
const sessionStore = new Map<string, InternalChallengeSession>();

function pruneExpiredSessions(nowMs: number): void {
  for (const [id, session] of sessionStore.entries()) {
    if (nowMs - session.startedAtMs > SESSION_TTL_MS) {
      sessionStore.delete(id);
    }
  }
  while (sessionStore.size >= MAX_ACTIVE_SESSIONS) {
    const oldestKey = sessionStore.keys().next().value;
    if (!oldestKey) break;
    sessionStore.delete(oldestKey);
  }
}

export function resolveQuestionCountForRisk(riskLevel: RiskTier): 5 | 6 | 7 {
  if (riskLevel === 'bahaya') return 7;
  if (riskLevel === 'waspada') return 6;
  return 5;
}

function isValidRiskTier(value: unknown): value is RiskTier {
  return (
    value === 'bahaya' ||
    value === 'waspada' ||
    value === 'cukup-aman' ||
    value === 'aman'
  );
}

function sanitizeMissionId(missionId: unknown, regionId: string): string {
  if (typeof missionId !== 'string') {
    return `sim-${regionId}`;
  }
  const trimmed = missionId.trim().slice(0, 64);
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return `sim-${regionId}`;
  }
  return trimmed.toLowerCase();
}

function buildFeedback(
  question: BankQuestion,
  selectedOptionId: string,
  nowMs: number
): RevealedQuestionFeedback {
  const isCorrect = selectedOptionId === question.correctOptionId;
  const earnedWeight = isCorrect ? question.weight : 0;

  return {
    questionId: question.id,
    subject: question.subject,
    topicTitle: question.topicTitle,
    hotspotTitle: question.hotspotTitle,
    selectedOptionId,
    isCorrect,
    correctOptionId: question.correctOptionId,
    acuan: [...question.acuan],
    explanation: question.explanation,
    stemChoInsight: question.stemChoInsight,
    earnedWeight,
    maxWeight: question.weight,
    stemCategory: question.stemCategory,
    difficulty: question.difficulty,
    answeredAtMs: nowMs,
  };
}

function computeNormalizedSummary(
  session: InternalChallengeSession,
  nowMs: number
): ChallengeCompletionSummary {
  const totalQuestions = session.questionCount;
  const answeredList = Object.values(session.answers);
  const answeredCount = answeredList.length;
  const correctCount = answeredList.filter((a) => a.isCorrect).length;

  let totalWeight = 0;
  let earnedWeight = 0;

  // Kualitas analisis memberi penekanan pada soal tingkat 'sedang' (1.5x) & 'sulit' (2.2x)
  let totalAnalyticalCapacity = 0;
  let earnedAnalyticalCapacity = 0;

  const stemAccumulators: Record<
    StemCategory,
    { correct: number; total: number; earnedWeight: number; totalWeight: number }
  > = {
    S: { correct: 0, total: 0, earnedWeight: 0, totalWeight: 0 },
    T: { correct: 0, total: 0, earnedWeight: 0, totalWeight: 0 },
    E: { correct: 0, total: 0, earnedWeight: 0, totalWeight: 0 },
    M: { correct: 0, total: 0, earnedWeight: 0, totalWeight: 0 },
  };

  for (const entry of session.entries) {
    const q = entry.question;
    const answer = session.answers[q.id];
    const analyticalFactor =
      q.difficulty === 'sulit' ? 2.2 : q.difficulty === 'sedang' ? 1.5 : 1.0;

    totalWeight += q.weight;
    totalAnalyticalCapacity += q.weight * analyticalFactor;

    const bucket = stemAccumulators[q.stemCategory];
    bucket.total += 1;
    bucket.totalWeight += q.weight;

    if (answer?.isCorrect) {
      earnedWeight += q.weight;
      earnedAnalyticalCapacity += q.weight * analyticalFactor;
      bucket.correct += 1;
      bucket.earnedWeight += q.weight;
    }
  }

  const normalizedAccuracyScore =
    totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const normalizedAnalysisQualityScore =
    totalAnalyticalCapacity > 0
      ? Math.round((earnedAnalyticalCapacity / totalAnalyticalCapacity) * 100)
      : 0;

  const referenceEndMs = session.completedAtMs ?? nowMs;
  const elapsedSeconds = Math.max(
    1,
    Math.round((referenceEndMs - session.startedAtMs) / 1000)
  );

  const stemBreakdown: Record<StemCategory, StemCategoryResultSummary> = {
    S: {
      ...stemAccumulators.S,
      normalizedScore:
        stemAccumulators.S.totalWeight > 0
          ? Math.round(
              (stemAccumulators.S.earnedWeight / stemAccumulators.S.totalWeight) *
                100
            )
          : normalizedAccuracyScore,
    },
    T: {
      ...stemAccumulators.T,
      normalizedScore:
        stemAccumulators.T.totalWeight > 0
          ? Math.round(
              (stemAccumulators.T.earnedWeight / stemAccumulators.T.totalWeight) *
                100
            )
          : normalizedAccuracyScore,
    },
    E: {
      ...stemAccumulators.E,
      normalizedScore:
        stemAccumulators.E.totalWeight > 0
          ? Math.round(
              (stemAccumulators.E.earnedWeight / stemAccumulators.E.totalWeight) *
                100
            )
          : normalizedAccuracyScore,
    },
    M: {
      ...stemAccumulators.M,
      normalizedScore:
        stemAccumulators.M.totalWeight > 0
          ? Math.round(
              (stemAccumulators.M.earnedWeight / stemAccumulators.M.totalWeight) *
                100
            )
          : normalizedAccuracyScore,
    },
  };

  const completedAtIso = new Date(referenceEndMs).toISOString();
  const isCompleted = answeredCount >= totalQuestions;
  const serverProof = isCompleted
    ? signChallengeCompletionProof({
        sessionId: session.sessionId,
        regionId: session.regionId,
        missionId: session.missionId,
        questionCount: totalQuestions,
        correctCount,
        normalizedAccuracyScore,
        normalizedAnalysisQualityScore,
        elapsedSeconds,
        completedAtIso,
      })
    : undefined;

  return {
    sessionId: session.sessionId,
    regionId: session.regionId,
    regionName: session.regionName,
    missionId: session.missionId,
    questionCount: totalQuestions,
    answeredCount,
    correctCount,
    totalWeight: Number(totalWeight.toFixed(2)),
    earnedWeight: Number(earnedWeight.toFixed(2)),
    normalizedAccuracyScore,
    normalizedAnalysisQualityScore,
    elapsedSeconds,
    targetSeconds: session.targetSeconds,
    stemBreakdown,
    completedAtIso,
    serverProof,
  };
}

export function createChallengeSession(
  input: CreateSessionInput,
  rng: () => number = Math.random,
  nowProvider: () => number = () => Date.now()
): PublicChallengeSessionStart {
  if (!input || typeof input.regionId !== 'string') {
    throw new ChallengeServiceError(400, 'regionId wajib disertakan.');
  }

  const normalizedRegionId = input.regionId.trim().toLowerCase();
  const policy = KALBAR_REGION_POLICIES[normalizedRegionId];
  if (!policy) {
    throw new ChallengeServiceError(
      400,
      `Wilayah "${input.regionId}" tidak terdaftar pada sistem misi Kalbar.`
    );
  }

  const riskLevel: RiskTier = isValidRiskTier(input.riskLevel)
    ? input.riskLevel
    : policy.defaultRisk;
  const questionCount: 5 | 6 | 7 =
    input.questionCount === 5 || input.questionCount === 6 || input.questionCount === 7
      ? input.questionCount
      : resolveQuestionCountForRisk(riskLevel);
  const missionId = sanitizeMissionId(input.missionId, policy.regionId);
  const missionTags = Array.from(new Set([...policy.missionTags, riskLevel, missionId]));
  const excludeQuestionIds = Array.isArray(input.excludeQuestionIds)
    ? input.excludeQuestionIds
        .filter((id): id is string => typeof id === 'string')
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 200)
    : [];

  const deck = buildRandomizedChallengeDeck(
    CHALLENGE_QUESTION_BANK,
    {
      regionId: policy.regionId,
      missionId,
      missionTags,
      questionCount,
      excludeQuestionIds,
    },
    rng
  );

  const nowMs = nowProvider();
  pruneExpiredSessions(nowMs);

  const sessionId = crypto.randomUUID();
  const targetSeconds = questionCount * 35;

  const session: InternalChallengeSession = {
    sessionId,
    regionId: policy.regionId,
    regionName: policy.regionName,
    missionId,
    riskLevel,
    questionCount,
    targetSeconds,
    startedAtMs: nowMs,
    completedAtMs: null,
    entries: deck.entries,
    publicQuestions: deck.publicQuestions,
    answers: {},
  };

  sessionStore.set(sessionId, session);

  return {
    sessionId: session.sessionId,
    regionId: session.regionId,
    regionName: session.regionName,
    missionId: session.missionId,
    riskLevel: session.riskLevel,
    questionCount: session.questionCount,
    targetSeconds: session.targetSeconds,
    startedAtIso: new Date(session.startedAtMs).toISOString(),
    questions: session.publicQuestions,
  };
}

export function getPublicSessionSnapshot(
  sessionId: string,
  nowProvider: () => number = () => Date.now()
): PublicChallengeSessionState {
  const cleanId = sessionId.trim();
  const session = sessionStore.get(cleanId);
  if (!session) {
    throw new ChallengeServiceError(404, 'Sesi tantangan tidak ditemukan atau sudah kedaluwarsa.');
  }

  const nowMs = nowProvider();
  const answeredCount = Object.keys(session.answers).length;
  const isCompleted = answeredCount >= session.questionCount;
  const elapsedSeconds = Math.max(
    0,
    Math.round(((session.completedAtMs ?? nowMs) - session.startedAtMs) / 1000)
  );

  const revealedFeedback: Record<string, RevealedQuestionFeedback> = {};
  for (const [qId, fb] of Object.entries(session.answers)) {
    revealedFeedback[qId] = { ...fb };
  }

  return {
    sessionId: session.sessionId,
    regionId: session.regionId,
    regionName: session.regionName,
    missionId: session.missionId,
    riskLevel: session.riskLevel,
    questionCount: session.questionCount,
    targetSeconds: session.targetSeconds,
    startedAtIso: new Date(session.startedAtMs).toISOString(),
    questions: session.publicQuestions,
    answeredCount,
    isCompleted,
    elapsedSeconds,
    revealedFeedback,
    summary: isCompleted ? computeNormalizedSummary(session, nowMs) : null,
  };
}

export function submitChallengeAnswer(
  sessionId: string,
  input: SubmitAnswerInput,
  nowProvider: () => number = () => Date.now()
): SubmitAnswerResult {
  const cleanId = sessionId.trim();
  const session = sessionStore.get(cleanId);
  if (!session) {
    throw new ChallengeServiceError(404, 'Sesi tantangan tidak ditemukan atau sudah kedaluwarsa.');
  }

  if (
    !input ||
    typeof input.questionId !== 'string' ||
    typeof input.selectedOptionId !== 'string'
  ) {
    throw new ChallengeServiceError(
      400,
      'questionId dan selectedOptionId wajib dikirimkan.'
    );
  }

  const questionId = input.questionId.trim();
  const selectedOptionId = input.selectedOptionId.trim();

  const matchedEntry = session.entries.find((e) => e.question.id === questionId);
  if (!matchedEntry) {
    throw new ChallengeServiceError(
      400,
      'Pertanyaan tidak termasuk dalam sesi tantangan ini.'
    );
  }

  if (session.answers[questionId]) {
    throw new ChallengeServiceError(
      409,
      'Pertanyaan ini sudah dijawab sebelumnya pada sesi aktif.'
    );
  }

  const optionValid = matchedEntry.question.options.some(
    (opt) => opt.id === selectedOptionId
  );
  if (!optionValid) {
    throw new ChallengeServiceError(400, 'Pilihan jawaban tidak valid.');
  }

  const nowMs = nowProvider();
  const feedback = buildFeedback(matchedEntry.question, selectedOptionId, nowMs);
  session.answers[questionId] = feedback;

  const answeredCount = Object.keys(session.answers).length;
  const isCompleted = answeredCount >= session.questionCount;
  if (isCompleted && session.completedAtMs === null) {
    session.completedAtMs = nowMs;
  }

  const elapsedSeconds = Math.max(
    1,
    Math.round(((session.completedAtMs ?? nowMs) - session.startedAtMs) / 1000)
  );

  return {
    sessionId: session.sessionId,
    feedback,
    answeredCount,
    totalQuestions: session.questionCount,
    isCompleted,
    elapsedSeconds,
    summary: isCompleted ? computeNormalizedSummary(session, nowMs) : null,
  };
}

export function submitChallengeBatch(
  sessionId: string,
  answers: SubmitAnswerInput[],
  nowProvider: () => number = () => Date.now()
): SubmitBatchResult {
  const cleanId = sessionId.trim();
  const session = sessionStore.get(cleanId);
  if (!session) {
    throw new ChallengeServiceError(404, 'Sesi kuis tidak ditemukan atau sudah kedaluwarsa.');
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    throw new ChallengeServiceError(400, 'Daftar jawaban kuis wajib dikirimkan.');
  }

  if (Object.keys(session.answers).length >= session.questionCount) {
    throw new ChallengeServiceError(409, 'Sesi kuis ini sudah diselesaikan sebelumnya.');
  }

  const seenQuestionIds = new Set<string>();
  const validatedEntries: Array<{
    questionId: string;
    selectedOptionId: string;
    entry: RandomizedQuestionEntry;
  }> = [];

  for (const item of answers) {
    if (
      !item ||
      typeof item.questionId !== 'string' ||
      typeof item.selectedOptionId !== 'string'
    ) {
      throw new ChallengeServiceError(
        400,
        'Setiap item jawaban wajib menyertakan questionId dan selectedOptionId.'
      );
    }

    const questionId = item.questionId.trim();
    const selectedOptionId = item.selectedOptionId.trim();

    if (seenQuestionIds.has(questionId)) {
      throw new ChallengeServiceError(400, 'Terdapat duplikasi questionId dalam pengiriman.');
    }
    seenQuestionIds.add(questionId);

    const matchedEntry = session.entries.find((e) => e.question.id === questionId);
    if (!matchedEntry) {
      throw new ChallengeServiceError(
        400,
        'Pertanyaan tidak termasuk dalam sesi kuis ini.'
      );
    }

    if (session.answers[questionId]) {
      throw new ChallengeServiceError(
        409,
        'Sebagian pertanyaan sudah pernah dikirimkan pada sesi aktif.'
      );
    }

    const optionValid = matchedEntry.question.options.some(
      (opt) => opt.id === selectedOptionId
    );
    if (!optionValid) {
      throw new ChallengeServiceError(400, 'Pilihan jawaban tidak valid.');
    }

    validatedEntries.push({
      questionId,
      selectedOptionId,
      entry: matchedEntry,
    });
  }

  const nowMs = nowProvider();
  const feedbackList: RevealedQuestionFeedback[] = [];

  for (const item of validatedEntries) {
    const feedback = buildFeedback(item.entry.question, item.selectedOptionId, nowMs);
    session.answers[item.questionId] = feedback;
    feedbackList.push(feedback);
  }

  const answeredCount = Object.keys(session.answers).length;
  const isCompleted = answeredCount >= session.questionCount;
  if (isCompleted && session.completedAtMs === null) {
    session.completedAtMs = nowMs;
  }

  const elapsedSeconds = Math.max(
    1,
    Math.round(((session.completedAtMs ?? nowMs) - session.startedAtMs) / 1000)
  );

  return {
    sessionId: session.sessionId,
    feedbackList,
    answeredCount,
    totalQuestions: session.questionCount,
    isCompleted,
    elapsedSeconds,
    summary: isCompleted ? computeNormalizedSummary(session, nowMs) : null,
  };
}

/**
 * Memperbaiki hanya soal yang masih salah pada sesi yang sudah pernah dikirim.
 * Mengembalikan seluruh feedbackList terurut dan ringkasan skor baru beserta serverProof sah.
 */
export function retryWrongChallengeAnswers(
  sessionId: string,
  retryAnswers: SubmitAnswerInput[],
  nowProvider: () => number = () => Date.now()
): SubmitBatchResult {
  const cleanId = sessionId.trim();
  const session = sessionStore.get(cleanId);
  if (!session) {
    throw new ChallengeServiceError(404, 'Sesi kuis tidak ditemukan atau sudah kedaluwarsa.');
  }

  if (Object.keys(session.answers).length < session.questionCount) {
    throw new ChallengeServiceError(
      400,
      'Sesi kuis belum diselesaikan sehingga belum dapat mengulang soal yang salah.'
    );
  }

  if (!Array.isArray(retryAnswers) || retryAnswers.length === 0) {
    throw new ChallengeServiceError(400, 'Daftar jawaban perbaikan wajib dikirimkan.');
  }

  const seenQuestionIds = new Set<string>();
  const validatedRetries: Array<{
    questionId: string;
    selectedOptionId: string;
    entry: RandomizedQuestionEntry;
  }> = [];

  for (const item of retryAnswers) {
    if (
      !item ||
      typeof item.questionId !== 'string' ||
      typeof item.selectedOptionId !== 'string'
    ) {
      throw new ChallengeServiceError(
        400,
        'Setiap item perbaikan wajib menyertakan questionId dan selectedOptionId.'
      );
    }

    const questionId = item.questionId.trim();
    const selectedOptionId = item.selectedOptionId.trim();

    if (seenQuestionIds.has(questionId)) {
      throw new ChallengeServiceError(400, 'Terdapat duplikasi questionId dalam pengiriman ulang.');
    }
    seenQuestionIds.add(questionId);

    const matchedEntry = session.entries.find((e) => e.question.id === questionId);
    if (!matchedEntry) {
      throw new ChallengeServiceError(400, 'Pertanyaan tidak termasuk dalam sesi kuis ini.');
    }

    const priorFeedback = session.answers[questionId];
    if (!priorFeedback || priorFeedback.isCorrect) {
      throw new ChallengeServiceError(
        400,
        'Hanya soal yang sebelumnya salah yang dapat dijawab ulang.'
      );
    }

    const optionValid = matchedEntry.question.options.some(
      (opt) => opt.id === selectedOptionId
    );
    if (!optionValid) {
      throw new ChallengeServiceError(400, 'Pilihan jawaban perbaikan tidak valid.');
    }

    validatedRetries.push({
      questionId,
      selectedOptionId,
      entry: matchedEntry,
    });
  }

  const nowMs = nowProvider();
  for (const item of validatedRetries) {
    session.answers[item.questionId] = buildFeedback(
      item.entry.question,
      item.selectedOptionId,
      nowMs
    );
  }
  session.completedAtMs = nowMs;

  const feedbackList = session.entries.map((e) => session.answers[e.question.id]);
  const elapsedSeconds = Math.max(
    1,
    Math.round((session.completedAtMs - session.startedAtMs) / 1000)
  );

  return {
    sessionId: session.sessionId,
    feedbackList,
    answeredCount: session.questionCount,
    totalQuestions: session.questionCount,
    isCompleted: true,
    elapsedSeconds,
    summary: computeNormalizedSummary(session, nowMs),
  };
}

/**
 * Memulihkan sesi dari daftar questionIds bila server sempat restart sebelum pengguna menekan
 * tombol "Ulangi Soal yang Salah", lalu langsung menilai jawaban perbaikan secara sah.
 */
export function recoverAndRetryWrongChallenge(
  input: RecoverRetryWrongInput,
  nowProvider: () => number = () => Date.now()
): SubmitBatchResult {
  if (!input || typeof input.regionId !== 'string') {
    throw new ChallengeServiceError(400, 'regionId wajib disertakan.');
  }
  const normalizedRegionId = input.regionId.trim().toLowerCase();
  const policy = KALBAR_REGION_POLICIES[normalizedRegionId];
  if (!policy) {
    throw new ChallengeServiceError(400, `Wilayah "${input.regionId}" tidak terdaftar.`);
  }

  if (
    !Array.isArray(input.questionIds) ||
    ![5, 6, 7].includes(input.questionIds.length)
  ) {
    throw new ChallengeServiceError(400, 'questionIds tidak valid (harus 5, 6, atau 7 soal).');
  }

  const bankById = new Map(CHALLENGE_QUESTION_BANK.map((q) => [q.id, q]));
  const entries: RandomizedQuestionEntry[] = [];
  for (let idx = 0; idx < input.questionIds.length; idx++) {
    const q = bankById.get(input.questionIds[idx]);
    if (!q) {
      throw new ChallengeServiceError(400, `Soal ${input.questionIds[idx]} tidak ditemukan.`);
    }
    entries.push({
      orderIndex: idx + 1,
      question: q,
      shuffledOptions: [...q.options],
    });
  }

  const nowMs = nowProvider();
  const questionCount = entries.length as 5 | 6 | 7;
  const riskLevel: RiskTier = isValidRiskTier(input.riskLevel)
    ? input.riskLevel
    : policy.defaultRisk;
  const missionId = sanitizeMissionId(input.missionId, policy.regionId);
  const sessionId = crypto.randomUUID();

  const mergedAnswers = new Map<string, string>();
  for (const prev of input.previousAnswers ?? []) {
    if (prev?.questionId && prev?.selectedOptionId) {
      mergedAnswers.set(prev.questionId.trim(), prev.selectedOptionId.trim());
    }
  }
  for (const retry of input.retryAnswers ?? []) {
    if (retry?.questionId && retry?.selectedOptionId) {
      mergedAnswers.set(retry.questionId.trim(), retry.selectedOptionId.trim());
    }
  }

  const answersMap: Record<string, RevealedQuestionFeedback> = {};
  for (const entry of entries) {
    const picked = mergedAnswers.get(entry.question.id);
    if (!picked || !entry.question.options.some((o) => o.id === picked)) {
      throw new ChallengeServiceError(400, 'Pilihan jawaban pemulihan tidak lengkap atau tidak valid.');
    }
    answersMap[entry.question.id] = buildFeedback(entry.question, picked, nowMs);
  }

  const session: InternalChallengeSession = {
    sessionId,
    regionId: policy.regionId,
    regionName: policy.regionName,
    missionId,
    riskLevel,
    questionCount,
    targetSeconds: questionCount * 35,
    startedAtMs: nowMs - questionCount * 20_000,
    completedAtMs: nowMs,
    entries,
    publicQuestions: entries.map((e) =>
      sanitizeQuestionForClient(e.question, e.shuffledOptions, e.orderIndex)
    ),
    answers: answersMap,
  };

  sessionStore.set(sessionId, session);
  const feedbackList = entries.map((e) => answersMap[e.question.id]);

  return {
    sessionId,
    feedbackList,
    answeredCount: questionCount,
    totalQuestions: questionCount,
    isCompleted: true,
    elapsedSeconds: questionCount * 20,
    summary: computeNormalizedSummary(session, nowMs),
  };
}

export function clearChallengeSessionsForTest(): void {
  sessionStore.clear();
}
