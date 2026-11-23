import type {
  ChallengeScoreRecord,
  DecisionScoreRecord,
  FiveMetricBreakdown,
  StemCompetencyScores,
} from '../utils/scoringEngine';

export interface StoredAnswerSummaryItem {
  questionId: string;
  questionPrompt?: string;
  selectedOptionId: string;
  selectedOptionText?: string;
  correctOptionId?: string;
  correctOptionText?: string;
  explanation?: string;
  isCorrect: boolean;
  stemCategory: string;
  difficulty: string;
  earnedWeight: number;
  maxWeight: number;
}

export interface StoredMissionAttempt {
  attemptId: string;
  userId: string;
  regionId: string;
  missionId: string;
  attemptType: 'challenge' | 'decision';
  sessionId?: string;
  questionCount?: number;
  correctCount?: number;
  accuracyScore?: number;
  analysisQualityScore?: number;
  completionTimeScore?: number;
  elapsedSeconds?: number;
  targetSeconds?: number;
  totalWeight?: number;
  earnedWeight?: number;
  compositeScore: number;
  selectedActionId?: string;
  suitabilityLabel?: string;
  answersSummary?: StoredAnswerSummaryItem[];
  serverProof?: string;
  completedAtIso: string;
}

export interface StoredSimulationResult {
  resultId: string;
  userId: string;
  regionId: string;
  regionName: string;
  missionId: string;
  missionCode?: string;
  riskScore?: number;
  riskCategory?: 'rendah' | 'sedang' | 'tinggi';
  decisionActionId?: string;
  decisionActionLabel?: string;
  decisionScore?: number;
  overallScore: number;
  fiveMetrics: FiveMetricBreakdown;
  stemScores?: StemCompetencyScores;
  latestDecisionRecord?: DecisionScoreRecord;
  latestChallengeRecord?: ChallengeScoreRecord;
  isMissionCompleted: boolean;
  challengeProof?: string;
}

export interface StoredPlayerProgress {
  userId: string;
  activeRegionId?: string;
  activeMissionId?: string;
  completedMissionIds: string[];
  inProgressMissionIds: string[];
  totalCompletedMissions: number;
  averageOverallScore: number;
  certificateId?: string;
}

export interface StoredCertificateRecord {
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
  serverVerified: boolean;
}

export function sanitizeStorageId(raw: string): string {
  return raw
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128);
}
