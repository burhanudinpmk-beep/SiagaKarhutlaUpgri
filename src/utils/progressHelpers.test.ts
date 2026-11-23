import assert from 'node:assert/strict';
import test from 'node:test';
import {
  areAllRequiredMissionsCompleted,
  CERTIFICATE_REQUIRED_MISSIONS,
  computeAggregatedProgress,
  createEmptyPlayerProgress,
  deriveLocalCertificatePredicate,
  resolveProfileDisplayState,
} from './progressHelpers.ts';
import {
  clearScoringHistory,
  exportScoringEngineMaps,
  getMissionScoringSummary,
  hydrateScoringEngineFromRemote,
  type ChallengeScoreRecord,
  type DecisionScoreRecord,
  type ScoringStorageAdapter,
} from './scoringEngine.ts';

function createMemoryStorage(): ScoringStorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

test('CERTIFICATE_REQUIRED_MISSIONS berisi tepat 8 misi utama Kalbar dengan variasi 5, 6, dan 7 soal', () => {
  assert.equal(CERTIFICATE_REQUIRED_MISSIONS.length, 8);
  const counts = new Set(
    CERTIFICATE_REQUIRED_MISSIONS.map((m) => m.requiredQuestionCount)
  );
  assert.deepEqual([...counts].sort(), [5, 6, 7]);
});

test('areAllRequiredMissionsCompleted mengunci sertifikat sebelum seluruh 8 misi wajib selesai', () => {
  const seven = CERTIFICATE_REQUIRED_MISSIONS.slice(0, 7).map((m) => m.missionId);
  assert.equal(areAllRequiredMissionsCompleted(seven), false);

  const eight = CERTIFICATE_REQUIRED_MISSIONS.map((m) => m.missionId);
  assert.equal(areAllRequiredMissionsCompleted(eight), true);
  assert.match(deriveLocalCertificatePredicate(88), /Sangat Memuaskan/);
  assert.match(deriveLocalCertificatePredicate(74), /Memuaskan/);
});

test('resolveProfileDisplayState menyinkronkan nama pemain untuk navbar dan sertifikat tanpa login', () => {
  const defaultPlayer = resolveProfileDisplayState('');
  assert.equal(defaultPlayer.navbarLabel, 'Profil');
  assert.equal(defaultPlayer.hasCustomName, false);
  assert.equal(defaultPlayer.resolvedName, 'Peserta SIAGA KARHUTLA');

  const customPlayer = resolveProfileDisplayState('  Alya Putri Kalbar  ');
  assert.equal(customPlayer.navbarLabel, 'Alya Putri Kalbar');
  assert.equal(customPlayer.resolvedName, 'Alya Putri Kalbar');
  assert.equal(customPlayer.hasCustomName, true);
});

test('computeAggregatedProgress menghitung misi selesai, menghapus dari inProgress, dan merata-ratakan skor akhir', () => {
  const initial = {
    ...createEmptyPlayerProgress('student-1'),
    inProgressMissionIds: ['sim-01', 'sim-07'],
    activeRegionId: 'kubu-raya',
    activeMissionId: 'sim-01',
  };

  const next = computeAggregatedProgress({
    userId: 'student-1',
    existingProgress: initial,
    resultsMap: {
      'sim-07': {
        overallScore: 88,
        isMissionCompleted: true,
      },
      'sim-01': {
        overallScore: 0,
        isMissionCompleted: false,
        riskScore: 76,
      },
      'sim-04': {
        overallScore: 72,
        isMissionCompleted: true,
      },
    },
    activeRegionId: 'sanggau',
    activeMissionId: 'sim-07',
  });

  assert.deepEqual(next.completedMissionIds.sort(), ['sim-04', 'sim-07']);
  assert.deepEqual(next.inProgressMissionIds, ['sim-01']);
  assert.equal(next.totalCompletedMissions, 2);
  assert.equal(next.averageOverallScore, 80);
  assert.equal(next.activeRegionId, 'sanggau');
  assert.equal(next.activeMissionId, 'sim-07');
});

test('hydrateScoringEngineFromRemote & exportScoringEngineMaps memulihkan hasil Decision & Tantangan STEM pasca refresh', () => {
  const storage = createMemoryStorage();
  clearScoringHistory(undefined, undefined, storage);

  const decisionRec: DecisionScoreRecord = {
    recordId: 'scr-sanggau-1',
    regionId: 'sanggau',
    regionName: 'Kabupaten Sanggau',
    missionId: 'sim-07',
    missionCode: 'SIM-KB-07',
    scenarioTitle: 'Koridor Kebun & Pertanian Lahan Kering Sanggau',
    landType: 'Tanah Mineral & Lahan Pertanian Campuran',
    riskLevel: 'aman',
    actionId: 'firebreak',
    actionLabel: 'Sekat bakar sesuai kondisi lokasi',
    suitability: 'sangat-sesuai',
    suitabilityLabel: 'Sangat Sesuai',
    totalScore: 90,
    maxPossibleScore: 100,
    scoreBreakdown: {
      actionSuitabilityPoints: 58,
      caseConditionPoints: 32,
      penaltyPoints: 0,
    },
    consideredConditionsCount: 3,
    requiredConditionsCount: 3,
    preventiveReplacementWarning: false,
    scientificReasonSummary: 'Sekat bakar memutus bahan bakar permukaan.',
    simulationConsequenceSummary: 'Laju penjalaran api permukaan menurun drastis.',
    rubricNotes: ['Sesuai kondisi tanah mineral'],
    stemScores: {
      science: 90,
      technology: 88,
      engineering: 92,
      mathematics: 86,
    },
    submittedAtIso: '2026-11-21T09:00:00.000Z',
  };

  const challengeRec: ChallengeScoreRecord = {
    recordId: 'chl-sanggau-1',
    sessionId: 'sess-sanggau-1',
    regionId: 'sanggau',
    regionName: 'Kabupaten Sanggau',
    missionId: 'sim-07',
    questionCount: 5,
    answeredCount: 5,
    correctCount: 5,
    totalWeight: 7.5,
    earnedWeight: 7.5,
    normalizedAccuracyScore: 100,
    normalizedAnalysisQualityScore: 100,
    elapsedSeconds: 90,
    targetSeconds: 175,
    completionTimeScore: 100,
    compositeChallengeScore: 100,
    stemBreakdown: {
      S: { correct: 2, total: 2, earnedWeight: 3, totalWeight: 3, normalizedScore: 100 },
      T: { correct: 1, total: 1, earnedWeight: 1.5, totalWeight: 1.5, normalizedScore: 100 },
      E: { correct: 1, total: 1, earnedWeight: 1.5, totalWeight: 1.5, normalizedScore: 100 },
      M: { correct: 1, total: 1, earnedWeight: 1.5, totalWeight: 1.5, normalizedScore: 100 },
    },
    completedAtIso: '2026-11-21T09:05:00.000Z',
    serverProof: 'a'.repeat(64),
  };

  hydrateScoringEngineFromRemote(
    {
      decisionRecords: [decisionRec],
      challengeRecords: [challengeRec],
    },
    storage
  );

  const summary = getMissionScoringSummary('sanggau', 'sim-07', storage);
  assert.equal(summary.hasDecisionEvaluation, true);
  assert.equal(summary.hasChallengeEvaluation, true);
  assert.equal(summary.latestRecord?.actionId, 'firebreak');
  assert.equal(summary.latestChallenge?.serverProof, 'a'.repeat(64));
  assert.ok(summary.overallScore >= 85);

  const exported = exportScoringEngineMaps(storage);
  assert.equal(exported.decisionMap['sanggau::sim-07']?.length, 1);
  assert.equal(exported.challengeMap['sanggau::sim-07']?.length, 1);
});
