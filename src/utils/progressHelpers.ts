import type {
  ChallengeScoreRecord,
  DecisionScoreRecord,
  FiveMetricBreakdown,
  StemCompetencyScores,
} from './scoringEngine';

export interface RequiredMissionSpec {
  missionId: string;
  regionId: string;
  regionName: string;
  missionCode: string;
  requiredQuestionCount: 5 | 6 | 7;
}

export const CERTIFICATE_REQUIRED_MISSIONS: ReadonlyArray<RequiredMissionSpec> = [
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

export const REQUIRED_MISSION_ID_SET = new Set(
  CERTIFICATE_REQUIRED_MISSIONS.map((m) => m.missionId)
);

export function areAllRequiredMissionsCompleted(completedMissionIds: string[]): boolean {
  const completedSet = new Set(
    completedMissionIds.map((id) => id.trim().toLowerCase())
  );
  return CERTIFICATE_REQUIRED_MISSIONS.every((spec) =>
    completedSet.has(spec.missionId)
  );
}

export function deriveLocalCertificatePredicate(averageScore: number): string {
  if (averageScore >= 85) {
    return 'Sangat Memuaskan — Komandan Mitigasi Karhutla Unggul';
  }
  if (averageScore >= 70) {
    return 'Memuaskan — Analis Mitigasi Karhutla Terampil';
  }
  return 'Kompeten — Pelaksana Siaga Karhutla Kalbar';
}

export interface ProfileDisplayState {
  resolvedName: string;
  navbarLabel: string;
  hasCustomName: boolean;
}

export function resolveProfileDisplayState(
  playerName?: string | null
): ProfileDisplayState {
  const custom = playerName?.trim().slice(0, 120) ?? '';
  return {
    resolvedName: custom || 'Peserta SIAGA KARHUTLA',
    navbarLabel: custom || 'Profil',
    hasCustomName: Boolean(custom),
  };
}

export interface ProgressSimulationSummaryInput {
  overallScore: number;
  isMissionCompleted: boolean;
  riskScore?: number;
  latestDecisionRecord?: DecisionScoreRecord;
  latestChallengeRecord?: ChallengeScoreRecord;
  fiveMetrics?: FiveMetricBreakdown;
  stemScores?: StemCompetencyScores;
}

export interface PlayerProgressRecord {
  userId: string;
  activeRegionId?: string;
  activeMissionId?: string;
  completedMissionIds: string[];
  inProgressMissionIds: string[];
  totalCompletedMissions: number;
  averageOverallScore: number;
  certificateId?: string;
}

export function createEmptyPlayerProgress(userId: string): PlayerProgressRecord {
  return {
    userId,
    completedMissionIds: [],
    inProgressMissionIds: [],
    totalCompletedMissions: 0,
    averageOverallScore: 0,
  };
}

export function computeAggregatedProgress(params: {
  userId: string;
  existingProgress: PlayerProgressRecord;
  resultsMap: Record<string, ProgressSimulationSummaryInput>;
  activeRegionId?: string;
  activeMissionId?: string;
  certificateId?: string;
}): PlayerProgressRecord {
  const {
    userId,
    existingProgress,
    resultsMap,
    activeRegionId,
    activeMissionId,
    certificateId,
  } = params;

  const completedSet = new Set<string>();
  const inProgressSet = new Set<string>(existingProgress.inProgressMissionIds);
  const completedScores: number[] = [];

  for (const [missionId, result] of Object.entries(resultsMap)) {
    if (result.isMissionCompleted) {
      completedSet.add(missionId);
      inProgressSet.delete(missionId);
      completedScores.push(result.overallScore);
    } else if (
      result.latestDecisionRecord ||
      result.latestChallengeRecord ||
      typeof result.riskScore === 'number'
    ) {
      inProgressSet.add(missionId);
    }
  }

  const completedMissionIds = Array.from(completedSet).slice(0, 30);
  const inProgressMissionIds = Array.from(inProgressSet).slice(0, 30);
  const averageOverallScore =
    completedScores.length > 0
      ? Math.round(
          completedScores.reduce((sum, s) => sum + s, 0) / completedScores.length
        )
      : existingProgress.averageOverallScore;

  return {
    userId,
    activeRegionId: activeRegionId ?? existingProgress.activeRegionId,
    activeMissionId: activeMissionId ?? existingProgress.activeMissionId,
    completedMissionIds,
    inProgressMissionIds,
    totalCompletedMissions: completedMissionIds.length,
    averageOverallScore,
    certificateId: certificateId ?? existingProgress.certificateId,
  };
}
