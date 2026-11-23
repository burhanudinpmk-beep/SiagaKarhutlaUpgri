import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  StoredAnswerSummaryItem,
  StoredCertificateRecord,
  StoredMissionAttempt,
  StoredPlayerProgress,
  StoredSimulationResult,
} from '../types/progress';
import { sanitizeStorageId } from '../types/progress';
import {
  clearScoringHistory,
  getAllMissionScoringSummaries,
  getMissionScoringSummary,
  hydrateScoringEngineFromRemote,
  type ChallengeScoreRecord,
  type DecisionScoreRecord,
} from '../utils/scoringEngine';
import type { DecisionEvaluationResult } from '../utils/decisionEngine';
import type { RiskEvaluationResult } from '../utils/riskEngine';
import { findRegionById } from '../utils/regionHelpers';
import { clearBriefingStorage } from '../utils/briefingHelpers';
import type { ScenarioProgressStatus } from '../types/mission';
import {
  areAllRequiredMissionsCompleted,
  CERTIFICATE_REQUIRED_MISSIONS,
  computeAggregatedProgress,
  createEmptyPlayerProgress,
  deriveLocalCertificatePredicate,
  resolveProfileDisplayState,
  type RequiredMissionSpec,
} from '../utils/progressHelpers';

export { CERTIFICATE_REQUIRED_MISSIONS, computeAggregatedProgress };
export type { RequiredMissionSpec };

const PLAYER_ID_STORAGE_KEY = 'siaga_karhutla_player_id_v1';
const PLAYER_NAME_STORAGE_KEY = 'siaga_karhutla_player_name_v1';
const PLAYER_STATE_STORAGE_KEY = 'siaga_karhutla_player_state_v1';
const MAP_STATUS_STORAGE_KEY = 'siaga_karhutla_sim_status_v1';
const LEGACY_NAME_STORAGE_KEY = 'siaga_karhutla_guest_cert_name_v1';
const LEGACY_GUEST_STATE_KEY = 'siaga_karhutla_guest_state_v1';
const LEGACY_AUTH_MODE_KEY = 'siaga_karhutla_auth_mode_v1';

const QUIZ_DRAFT_PREFIXES = [
  'siaga_karhutla_active_quiz_v1::',
  'siaga_karhutla_active_quiz_v2::',
];
const USED_QUESTIONS_STORAGE_KEYS = [
  'siaga_karhutla_used_questions_v1',
  'siaga_karhutla_used_questions_v2',
];

interface PlayerPersistedState {
  progress: StoredPlayerProgress;
  simulationResultsByMission: Record<string, StoredSimulationResult>;
  missionAttempts: StoredMissionAttempt[];
  certificate: StoredCertificateRecord | null;
}

export interface GameProgressContextValue {
  isReady: boolean;
  playerId: string;
  playerName: string;
  certificateName: string;
  navbarProfileLabel: string;
  hasCustomProfileName: boolean;
  playerProgress: StoredPlayerProgress;
  simulationResultsByMission: Record<string, StoredSimulationResult>;
  missionAttempts: StoredMissionAttempt[];
  certificate: StoredCertificateRecord | null;
  isAllRequiredCompleted: boolean;
  updatePlayerName: (nextName: string) => string;
  recordRiskPrediction: (
    regionId: string,
    missionId: string,
    evaluation: RiskEvaluationResult
  ) => void;
  recordDecisionEvaluation: (decisionResult: DecisionEvaluationResult) => void;
  recordChallengeCompletion: (params: {
    challengeRecord: ChallengeScoreRecord;
    answersSummary?: StoredAnswerSummaryItem[];
  }) => void;
  updateMissionCursor: (regionId: string, missionId: string) => void;
  ensureCertificateIssued: () => Promise<StoredCertificateRecord>;
  resetGameProgress: () => void;
}

const GameProgressContext = createContext<GameProgressContextValue | null>(null);

function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return 'player_kalbar_default';
  try {
    const existing = window.localStorage.getItem(PLAYER_ID_STORAGE_KEY)?.trim();
    if (existing && existing.length >= 3) {
      return existing;
    }
    const generated = `player_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    window.localStorage.setItem(PLAYER_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return 'player_kalbar_default';
  }
}

function loadInitialPlayerName(): string {
  if (typeof window === 'undefined') return '';
  try {
    const saved = window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY)?.trim();
    if (saved) return saved.slice(0, 120);
    const legacy = window.localStorage.getItem(LEGACY_NAME_STORAGE_KEY)?.trim();
    if (legacy) {
      const clean = legacy.slice(0, 120);
      window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, clean);
      return clean;
    }
  } catch {
    // ignore storage errors
  }
  return '';
}

function loadPersistedState(playerId: string): PlayerPersistedState {
  if (typeof window === 'undefined') {
    return {
      progress: createEmptyPlayerProgress(playerId),
      simulationResultsByMission: {},
      missionAttempts: [],
      certificate: null,
    };
  }

  try {
    window.sessionStorage.removeItem(LEGACY_AUTH_MODE_KEY);
    window.sessionStorage.removeItem(LEGACY_GUEST_STATE_KEY);
  } catch {
    // ignore
  }

  try {
    const raw = window.localStorage.getItem(PLAYER_STATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlayerPersistedState>;
      if (parsed && parsed.progress && parsed.simulationResultsByMission) {
        const resultsMap = parsed.simulationResultsByMission;
        const recomputedProgress = computeAggregatedProgress({
          userId: playerId,
          existingProgress: {
            ...createEmptyPlayerProgress(playerId),
            ...parsed.progress,
            userId: playerId,
          },
          resultsMap,
          certificateId: parsed.certificate?.certificateId ?? parsed.progress.certificateId,
        });
        return {
          progress: recomputedProgress,
          simulationResultsByMission: resultsMap,
          missionAttempts: Array.isArray(parsed.missionAttempts)
            ? parsed.missionAttempts
            : [],
          certificate: parsed.certificate ?? null,
        };
      }
    }
  } catch {
    // ignore corrupted localStorage
  }

  return {
    progress: createEmptyPlayerProgress(playerId),
    simulationResultsByMission: {},
    missionAttempts: [],
    certificate: null,
  };
}

function savePersistedState(state: PlayerPersistedState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PLAYER_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

function clearQuizStorage(): void {
  if (typeof window === 'undefined') return;
  const stores = [window.localStorage, window.sessionStorage];
  for (const store of stores) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key && QUIZ_DRAFT_PREFIXES.some((prefix) => key.startsWith(prefix))) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        store.removeItem(key);
      }
      for (const usedKey of USED_QUESTIONS_STORAGE_KEYS) {
        store.removeItem(usedKey);
      }
    } catch {
      // ignore storage errors
    }
  }
}

function syncMapHotspotStatuses(progress: StoredPlayerProgress): void {
  if (typeof window === 'undefined') return;
  try {
    const statusMap: Record<string, ScenarioProgressStatus> = {};
    for (const id of progress.inProgressMissionIds) {
      statusMap[id] = 'sedang-berjalan';
    }
    for (const id of progress.completedMissionIds) {
      statusMap[id] = 'selesai';
    }
    window.localStorage.setItem(MAP_STATUS_STORAGE_KEY, JSON.stringify(statusMap));
  } catch {
    // ignore storage errors
  }
}

function buildLocalFallbackCertificate(params: {
  playerId: string;
  studentName: string;
  averageScore: number;
  existingCertificateNumber?: string;
  existingIssuedAtIso?: string;
}): StoredCertificateRecord {
  const year = new Date().getUTCFullYear();
  const shortHash = sanitizeStorageId(params.playerId)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-8)
    .padStart(8, 'K');
  return {
    certificateId: `cert_${params.playerId}`,
    userId: params.playerId,
    studentName: params.studentName,
    certificateNumber: params.existingCertificateNumber || `SKH-${year}-${shortHash}`,
    completedMissionIds: CERTIFICATE_REQUIRED_MISSIONS.map((m) => m.missionId),
    totalRequiredMissions: CERTIFICATE_REQUIRED_MISSIONS.length,
    averageScore: params.averageScore,
    predicate: deriveLocalCertificatePredicate(params.averageScore),
    issuedAtIso: params.existingIssuedAtIso || new Date().toISOString(),
    validationDigest: 'local-browser-progress-verified',
    serverVerified: false,
  };
}

export function GameProgressProvider({ children }: { children: ReactNode }) {
  const [playerId] = useState<string>(() => getOrCreatePlayerId());
  const [rawPlayerName, setRawPlayerName] = useState<string>(() =>
    loadInitialPlayerName()
  );

  const [initialState] = useState<PlayerPersistedState>(() =>
    loadPersistedState(playerId)
  );

  const [playerProgress, setPlayerProgress] = useState<StoredPlayerProgress>(
    initialState.progress
  );
  const [simulationResultsByMission, setSimulationResultsByMission] = useState<
    Record<string, StoredSimulationResult>
  >(initialState.simulationResultsByMission);
  const [missionAttempts, setMissionAttempts] = useState<StoredMissionAttempt[]>(
    initialState.missionAttempts
  );
  const [certificate, setCertificate] = useState<StoredCertificateRecord | null>(
    initialState.certificate
  );
  const [isReady, setIsReady] = useState(false);

  // Hydrate Scoring Engine and map status once on mount
  useEffect(() => {
    const decisionRecords: DecisionScoreRecord[] = [];
    const challengeRecords: ChallengeScoreRecord[] = [];
    for (const sim of Object.values(initialState.simulationResultsByMission)) {
      if (sim.latestDecisionRecord) decisionRecords.push(sim.latestDecisionRecord);
      if (sim.latestChallengeRecord) challengeRecords.push(sim.latestChallengeRecord);
    }
    if (decisionRecords.length > 0 || challengeRecords.length > 0) {
      hydrateScoringEngineFromRemote({ decisionRecords, challengeRecords });
    }
    syncMapHotspotStatuses(initialState.progress);
    setIsReady(true);
  }, [initialState]);

  const profileDisplay = useMemo(
    () => resolveProfileDisplayState(rawPlayerName),
    [rawPlayerName]
  );

  const certificateName = profileDisplay.resolvedName;
  const navbarProfileLabel = profileDisplay.navbarLabel;
  const hasCustomProfileName = profileDisplay.hasCustomName;

  const isAllRequiredCompleted = useMemo(
    () => areAllRequiredMissionsCompleted(playerProgress.completedMissionIds),
    [playerProgress.completedMissionIds]
  );

  const persistState = useCallback(
    (next: {
      progress: StoredPlayerProgress;
      simulationResultsByMission: Record<string, StoredSimulationResult>;
      missionAttempts: StoredMissionAttempt[];
      certificate: StoredCertificateRecord | null;
    }) => {
      setPlayerProgress(next.progress);
      setSimulationResultsByMission(next.simulationResultsByMission);
      setMissionAttempts(next.missionAttempts);
      setCertificate(next.certificate);
      syncMapHotspotStatuses(next.progress);
      savePersistedState(next);
    },
    []
  );

  const issueCertificateInternal = useCallback(
    async (
      resultsMap: Record<string, StoredSimulationResult>,
      progress: StoredPlayerProgress,
      attempts: StoredMissionAttempt[],
      nameForCert: string,
      existingCert: StoredCertificateRecord | null
    ): Promise<StoredCertificateRecord> => {
      if (!areAllRequiredMissionsCompleted(progress.completedMissionIds)) {
        throw new Error(
          'Selesaikan seluruh 8 titik api wajib terlebih dahulu sebelum membuka sertifikat.'
        );
      }

      const allScoringSummaries = getAllMissionScoringSummaries();
      const missionEvidence = CERTIFICATE_REQUIRED_MISSIONS.map((spec) => {
        const stored = resultsMap[spec.missionId];
        const localSummary = allScoringSummaries.find(
          (s) => s.missionId.toLowerCase() === spec.missionId
        );
        const decisionRecord =
          stored?.latestDecisionRecord ?? localSummary?.latestRecord;
        const challengeRecord =
          stored?.latestChallengeRecord ?? localSummary?.latestChallenge;

        if (!challengeRecord || !challengeRecord.serverProof) {
          return null;
        }

        return {
          missionId: spec.missionId,
          regionId: spec.regionId,
          decisionActionId: decisionRecord?.actionId ?? 'quiz-mitigation',
          decisionScore:
            decisionRecord?.totalScore ?? challengeRecord.normalizedAccuracyScore,
          overallScore: stored?.overallScore ?? localSummary?.overallScore ?? 0,
          challengeSummary: {
            sessionId: challengeRecord.sessionId,
            regionId: challengeRecord.regionId,
            missionId: challengeRecord.missionId,
            questionCount: challengeRecord.questionCount,
            correctCount: challengeRecord.correctCount,
            normalizedAccuracyScore: challengeRecord.normalizedAccuracyScore,
            normalizedAnalysisQualityScore:
              challengeRecord.normalizedAnalysisQualityScore,
            elapsedSeconds: challengeRecord.elapsedSeconds,
            completedAtIso: challengeRecord.completedAtIso,
          },
          challengeProof: challengeRecord.serverProof,
        };
      }).filter(Boolean);

      let resolvedCert: StoredCertificateRecord | null = null;

      if (missionEvidence.length === CERTIFICATE_REQUIRED_MISSIONS.length) {
        try {
          const response = await fetch('/api/certificates/issue', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              playerId,
              playerName: nameForCert,
              certificateName: nameForCert,
              missionEvidence,
            }),
          });
          if (response.ok) {
            const data = (await response.json()) as {
              certificate?: StoredCertificateRecord;
            };
            if (data.certificate) {
              resolvedCert = data.certificate;
            }
          }
        } catch {
          // Use local verified progress fallback below
        }
      }

      if (!resolvedCert) {
        resolvedCert = buildLocalFallbackCertificate({
          playerId,
          studentName: nameForCert,
          averageScore: progress.averageOverallScore,
          existingCertificateNumber: existingCert?.certificateNumber,
          existingIssuedAtIso: existingCert?.issuedAtIso,
        });
      }

      const nextProgress: StoredPlayerProgress = {
        ...progress,
        certificateId: resolvedCert.certificateId,
      };

      persistState({
        progress: nextProgress,
        simulationResultsByMission: resultsMap,
        missionAttempts: attempts,
        certificate: resolvedCert,
      });

      return resolvedCert;
    },
    [persistState, playerId]
  );

  // Auto-issue certificate automatically as soon as 8/8 required missions are complete
  useEffect(() => {
    if (!isReady || !isAllRequiredCompleted) return;
    if (certificate && certificate.studentName === certificateName) return;

    void issueCertificateInternal(
      simulationResultsByMission,
      playerProgress,
      missionAttempts,
      certificateName,
      certificate
    ).catch(() => {
      // Non-fatal
    });
  }, [
    certificate,
    certificateName,
    isAllRequiredCompleted,
    isReady,
    issueCertificateInternal,
    missionAttempts,
    playerProgress,
    simulationResultsByMission,
  ]);

  const updatePlayerName = useCallback(
    (nextName: string): string => {
      const cleanName = nextName.trim().slice(0, 120);
      if (cleanName.length < 2) {
        throw new Error('Nama lengkap pada sertifikat minimal terdiri dari 2 karakter.');
      }

      setRawPlayerName(cleanName);
      try {
        window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, cleanName);
      } catch {
        // ignore storage errors
      }

      if (certificate) {
        const updatedCert: StoredCertificateRecord = {
          ...certificate,
          studentName: cleanName,
        };
        persistState({
          progress: playerProgress,
          simulationResultsByMission,
          missionAttempts,
          certificate: updatedCert,
        });
      }

      return cleanName;
    },
    [
      certificate,
      missionAttempts,
      persistState,
      playerProgress,
      simulationResultsByMission,
    ]
  );

  const updateMissionCursor = useCallback(
    (regionId: string, missionId: string) => {
      const cleanMissionId = missionId.trim().toLowerCase();
      const alreadyTracked =
        playerProgress.completedMissionIds.includes(cleanMissionId) ||
        playerProgress.inProgressMissionIds.includes(cleanMissionId);

      if (
        playerProgress.activeRegionId === regionId &&
        playerProgress.activeMissionId === cleanMissionId &&
        alreadyTracked
      ) {
        return;
      }

      const inProgressSet = new Set(playerProgress.inProgressMissionIds);
      if (!playerProgress.completedMissionIds.includes(cleanMissionId)) {
        inProgressSet.add(cleanMissionId);
      }

      const nextProgress: StoredPlayerProgress = {
        ...playerProgress,
        userId: playerId,
        activeRegionId: regionId,
        activeMissionId: cleanMissionId,
        inProgressMissionIds: Array.from(inProgressSet).slice(0, 30),
      };

      persistState({
        progress: nextProgress,
        simulationResultsByMission,
        missionAttempts,
        certificate,
      });
    },
    [
      certificate,
      missionAttempts,
      persistState,
      playerId,
      playerProgress,
      simulationResultsByMission,
    ]
  );

  const recordRiskPrediction = useCallback(
    (regionId: string, missionId: string, evaluation: RiskEvaluationResult) => {
      if (
        evaluation.status !== 'completed' ||
        evaluation.score === null ||
        !evaluation.category
      ) {
        return;
      }

      const cleanMissionId = missionId.trim().toLowerCase();
      const cleanRegionId = regionId.trim().toLowerCase();
      const regionName = findRegionById(cleanRegionId)?.name ?? cleanRegionId;
      const existing = simulationResultsByMission[cleanMissionId];
      const summary = getMissionScoringSummary(cleanRegionId, cleanMissionId);

      if (
        existing &&
        existing.riskScore === Math.round(evaluation.score) &&
        existing.riskCategory === evaluation.category
      ) {
        return;
      }

      const updatedResult: StoredSimulationResult = {
        resultId: sanitizeStorageId(`${playerId}_${cleanMissionId}`),
        userId: playerId,
        regionId: cleanRegionId,
        regionName,
        missionId: cleanMissionId,
        missionCode:
          existing?.missionCode ??
          CERTIFICATE_REQUIRED_MISSIONS.find((m) => m.missionId === cleanMissionId)
            ?.missionCode,
        riskScore: Math.round(evaluation.score),
        riskCategory: evaluation.category,
        decisionActionId: existing?.decisionActionId,
        decisionActionLabel: existing?.decisionActionLabel,
        decisionScore: existing?.decisionScore,
        overallScore: summary.overallScore || existing?.overallScore || 0,
        fiveMetrics: summary.fiveMetrics,
        stemScores: summary.stemScores ?? existing?.stemScores,
        latestDecisionRecord: summary.latestRecord ?? existing?.latestDecisionRecord,
        latestChallengeRecord: summary.latestChallenge ?? existing?.latestChallengeRecord,
        isMissionCompleted: Boolean(
          existing?.isMissionCompleted ||
            ((summary.latestRecord ?? existing?.latestDecisionRecord) &&
              (summary.latestChallenge ?? existing?.latestChallengeRecord))
        ),
        challengeProof: summary.latestChallenge?.serverProof ?? existing?.challengeProof,
      };

      const nextResults = {
        ...simulationResultsByMission,
        [cleanMissionId]: updatedResult,
      };
      const nextProgress = computeAggregatedProgress({
        userId: playerId,
        existingProgress: playerProgress,
        resultsMap: nextResults,
        activeRegionId: cleanRegionId,
        activeMissionId: cleanMissionId,
      });

      persistState({
        progress: nextProgress,
        simulationResultsByMission: nextResults,
        missionAttempts,
        certificate,
      });
    },
    [
      certificate,
      missionAttempts,
      persistState,
      playerId,
      playerProgress,
      simulationResultsByMission,
    ]
  );

  const recordDecisionEvaluation = useCallback(
    (decisionResult: DecisionEvaluationResult) => {
      const record = decisionResult.scoringReceipt.record;
      const summary = decisionResult.scoringReceipt.missionSummary;
      const cleanMissionId = record.missionId.trim().toLowerCase();
      const cleanRegionId = record.regionId.trim().toLowerCase();
      const existing = simulationResultsByMission[cleanMissionId];

      const newAttempt: StoredMissionAttempt = {
        attemptId: sanitizeStorageId(record.recordId),
        userId: playerId,
        regionId: cleanRegionId,
        missionId: cleanMissionId,
        attemptType: 'decision',
        sessionId: record.recordId,
        compositeScore: record.totalScore,
        selectedActionId: record.actionId,
        suitabilityLabel: record.suitabilityLabel,
        completedAtIso: record.submittedAtIso,
      };

      const hasChallenge = Boolean(
        summary.latestChallenge ?? existing?.latestChallengeRecord
      );

      const updatedResult: StoredSimulationResult = {
        resultId: sanitizeStorageId(`${playerId}_${cleanMissionId}`),
        userId: playerId,
        regionId: cleanRegionId,
        regionName: record.regionName,
        missionId: cleanMissionId,
        missionCode: record.missionCode,
        riskScore: existing?.riskScore,
        riskCategory: existing?.riskCategory,
        decisionActionId: record.actionId,
        decisionActionLabel: record.actionLabel,
        decisionScore: record.totalScore,
        overallScore: summary.overallScore,
        fiveMetrics: summary.fiveMetrics,
        stemScores: summary.stemScores ?? existing?.stemScores,
        latestDecisionRecord: record,
        latestChallengeRecord:
          summary.latestChallenge ?? existing?.latestChallengeRecord,
        isMissionCompleted: Boolean(existing?.isMissionCompleted || hasChallenge),
        challengeProof: summary.latestChallenge?.serverProof ?? existing?.challengeProof,
      };

      const nextResults = {
        ...simulationResultsByMission,
        [cleanMissionId]: updatedResult,
      };
      const nextAttempts = [newAttempt, ...missionAttempts].slice(0, 60);
      const nextProgress = computeAggregatedProgress({
        userId: playerId,
        existingProgress: playerProgress,
        resultsMap: nextResults,
        activeRegionId: cleanRegionId,
        activeMissionId: cleanMissionId,
      });

      persistState({
        progress: nextProgress,
        simulationResultsByMission: nextResults,
        missionAttempts: nextAttempts,
        certificate,
      });
    },
    [
      certificate,
      missionAttempts,
      persistState,
      playerId,
      playerProgress,
      simulationResultsByMission,
    ]
  );

  const recordChallengeCompletion = useCallback(
    (params: {
      challengeRecord: ChallengeScoreRecord;
      answersSummary?: StoredAnswerSummaryItem[];
    }) => {
      const { challengeRecord, answersSummary } = params;
      const cleanMissionId = challengeRecord.missionId.trim().toLowerCase();
      const cleanRegionId = challengeRecord.regionId.trim().toLowerCase();
      const existing = simulationResultsByMission[cleanMissionId];
      const summary = getMissionScoringSummary(cleanRegionId, cleanMissionId);

      const newAttempt: StoredMissionAttempt = {
        attemptId: sanitizeStorageId(challengeRecord.recordId),
        userId: playerId,
        regionId: cleanRegionId,
        missionId: cleanMissionId,
        attemptType: 'challenge',
        sessionId: challengeRecord.sessionId,
        questionCount: challengeRecord.questionCount,
        correctCount: challengeRecord.correctCount,
        accuracyScore: challengeRecord.normalizedAccuracyScore,
        analysisQualityScore: challengeRecord.normalizedAnalysisQualityScore,
        completionTimeScore: challengeRecord.completionTimeScore,
        elapsedSeconds: challengeRecord.elapsedSeconds,
        targetSeconds: challengeRecord.targetSeconds,
        totalWeight: challengeRecord.totalWeight,
        earnedWeight: challengeRecord.earnedWeight,
        compositeScore: challengeRecord.compositeChallengeScore,
        answersSummary,
        serverProof: challengeRecord.serverProof,
        completedAtIso: challengeRecord.completedAtIso,
      };

      const quizPercentage = Math.round(
        (challengeRecord.correctCount / Math.max(1, challengeRecord.questionCount)) * 100
      );
      const passedQuiz = quizPercentage >= 70;
      const isMissionCompleted = passedQuiz;

      const updatedResult: StoredSimulationResult = {
        resultId: sanitizeStorageId(`${playerId}_${cleanMissionId}`),
        userId: playerId,
        regionId: cleanRegionId,
        regionName: challengeRecord.regionName,
        missionId: cleanMissionId,
        missionCode:
          existing?.missionCode ??
          CERTIFICATE_REQUIRED_MISSIONS.find((m) => m.missionId === cleanMissionId)
            ?.missionCode,
        riskScore: existing?.riskScore,
        riskCategory: existing?.riskCategory,
        decisionActionId:
          summary.latestRecord?.actionId ?? existing?.decisionActionId,
        decisionActionLabel:
          summary.latestRecord?.actionLabel ?? existing?.decisionActionLabel,
        decisionScore:
          summary.latestRecord?.totalScore ?? existing?.decisionScore,
        overallScore: summary.overallScore,
        fiveMetrics: summary.fiveMetrics,
        stemScores: summary.stemScores ?? existing?.stemScores,
        latestDecisionRecord:
          summary.latestRecord ?? existing?.latestDecisionRecord,
        latestChallengeRecord: challengeRecord,
        isMissionCompleted,
        challengeProof: challengeRecord.serverProof,
      };

      const nextResults = {
        ...simulationResultsByMission,
        [cleanMissionId]: updatedResult,
      };
      const nextAttempts = [newAttempt, ...missionAttempts].slice(0, 60);
      const nextProgress = computeAggregatedProgress({
        userId: playerId,
        existingProgress: playerProgress,
        resultsMap: nextResults,
        activeRegionId: cleanRegionId,
        activeMissionId: cleanMissionId,
      });

      persistState({
        progress: nextProgress,
        simulationResultsByMission: nextResults,
        missionAttempts: nextAttempts,
        certificate,
      });
    },
    [
      certificate,
      missionAttempts,
      persistState,
      playerId,
      playerProgress,
      simulationResultsByMission,
    ]
  );

  const ensureCertificateIssued = useCallback(async () => {
    return issueCertificateInternal(
      simulationResultsByMission,
      playerProgress,
      missionAttempts,
      certificateName,
      certificate
    );
  }, [
    certificate,
    certificateName,
    issueCertificateInternal,
    missionAttempts,
    playerProgress,
    simulationResultsByMission,
  ]);

  const resetGameProgress = useCallback(() => {
    clearScoringHistory();
    clearBriefingStorage();
    clearQuizStorage();
    const freshProgress = createEmptyPlayerProgress(playerId);
    persistState({
      progress: freshProgress,
      simulationResultsByMission: {},
      missionAttempts: [],
      certificate: null,
    });
  }, [persistState, playerId]);

  const value = useMemo<GameProgressContextValue>(
    () => ({
      isReady,
      playerId,
      playerName: certificateName,
      certificateName,
      navbarProfileLabel,
      hasCustomProfileName,
      playerProgress,
      simulationResultsByMission,
      missionAttempts,
      certificate,
      isAllRequiredCompleted,
      updatePlayerName,
      recordRiskPrediction,
      recordDecisionEvaluation,
      recordChallengeCompletion,
      updateMissionCursor,
      ensureCertificateIssued,
      resetGameProgress,
    }),
    [
      isReady,
      playerId,
      certificateName,
      navbarProfileLabel,
      hasCustomProfileName,
      playerProgress,
      simulationResultsByMission,
      missionAttempts,
      certificate,
      isAllRequiredCompleted,
      updatePlayerName,
      recordRiskPrediction,
      recordDecisionEvaluation,
      recordChallengeCompletion,
      updateMissionCursor,
      ensureCertificateIssued,
      resetGameProgress,
    ]
  );

  return (
    <GameProgressContext.Provider value={value}>
      {children}
    </GameProgressContext.Provider>
  );
}

export function useGameProgress(): GameProgressContextValue {
  const ctx = useContext(GameProgressContext);
  if (!ctx) {
    throw new Error('useGameProgress harus digunakan di dalam GameProgressProvider.');
  }
  return ctx;
}
