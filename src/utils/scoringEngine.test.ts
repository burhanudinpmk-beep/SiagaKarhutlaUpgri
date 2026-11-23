import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearScoringHistory,
  computeNormalizedCompletionTimeScore,
  getAllMissionScoringSummaries,
  getMissionScoringSummary,
  submitChallengeResultToScoringEngine,
  submitDecisionResultToScoringEngine,
  type ChallengeScoringPayload,
  type ScoringStorageAdapter,
} from './scoringEngine';

function createMemoryStorage(): ScoringStorageAdapter {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

test('submitDecisionResultToScoringEngine records decisions, derives STEM competencies, and computes summary', () => {
  const storage = createMemoryStorage();
  clearScoringHistory(undefined, undefined, storage);

  const receipt1 = submitDecisionResultToScoringEngine(
    {
      regionId: 'kubu-raya',
      regionName: 'Kabupaten Kubu Raya',
      missionId: 'sim-01',
      missionCode: 'SIM-KB-01',
      scenarioTitle: 'Pengendalian Kubah Gambut Kuala Dua',
      landType: 'Lahan Gambut Dalam',
      riskLevel: 'bahaya',
      actionId: 'canal-blocking',
      actionLabel: 'Sekat kanal (canal blocking)',
      suitability: 'kurang-tepat',
      suitabilityLabel: 'Kurang Tepat',
      totalScore: 42,
      scoreBreakdown: {
        actionSuitabilityPoints: 26,
        caseConditionPoints: 26,
        penaltyPoints: 10,
      },
      consideredConditionsCount: 2,
      requiredConditionsCount: 3,
      preventiveReplacementWarning: true,
      scientificReasonSummary: 'Pencegahan tidak menggantikan pemadaman aktif.',
      simulationConsequenceSummary: 'Api terus menyebar saat tabat dipasang.',
      rubricNotes: ['Kesesuaian kurang tepat'],
    },
    storage
  );

  assert.equal(receipt1.accepted, true);
  assert.equal(receipt1.record.totalScore, 42);
  assert.equal(receipt1.missionSummary.attemptsCount, 1);
  assert.equal(receipt1.missionSummary.readinessTier, 'perlu-perbaikan');

  const receipt2 = submitDecisionResultToScoringEngine(
    {
      regionId: 'kubu-raya',
      regionName: 'Kabupaten Kubu Raya',
      missionId: 'sim-01',
      missionCode: 'SIM-KB-01',
      scenarioTitle: 'Pengendalian Kubah Gambut Kuala Dua',
      landType: 'Lahan Gambut Dalam',
      riskLevel: 'bahaya',
      actionId: 'authorized-suppression',
      actionLabel: 'Respons pemadaman oleh petugas yang berwenang',
      suitability: 'sangat-sesuai',
      suitabilityLabel: 'Sangat Sesuai',
      totalScore: 95,
      scoreBreakdown: {
        actionSuitabilityPoints: 60,
        caseConditionPoints: 35,
        penaltyPoints: 0,
      },
      consideredConditionsCount: 3,
      requiredConditionsCount: 3,
      preventiveReplacementWarning: false,
      scientificReasonSummary: 'Pemadaman aktif memutus segitiga api.',
      simulationConsequenceSummary: 'Api dikendalikan sebelum mencapai permukiman.',
      rubricNotes: ['Kesesuaian optimal'],
    },
    storage
  );

  assert.equal(receipt2.missionSummary.attemptsCount, 2);
  assert.equal(receipt2.missionSummary.latestScore, 95);
  assert.equal(receipt2.missionSummary.bestScore, 95);
  assert.equal(receipt2.missionSummary.averageScore, 69);
  assert.equal(receipt2.missionSummary.readinessTier, 'optimal');
  assert.ok(receipt2.missionSummary.stemScores);
  assert.ok(receipt2.missionSummary.stemScores.engineering >= 90);

  const fetched = getMissionScoringSummary('kubu-raya', 'sim-01', storage);
  assert.equal(fetched.attemptsCount, 2);
  assert.equal(fetched.latestRecord?.actionId, 'authorized-suppression');

  const all = getAllMissionScoringSummaries(storage);
  assert.equal(all.length, 1);
  assert.equal(all[0].regionId, 'kubu-raya');
});

test('scoringEngine calculates all 5 metrics fairly across 5-question and 7-question missions', () => {
  const storage = createMemoryStorage();
  clearScoringHistory(undefined, undefined, storage);

  const makePerfectChallenge = (
    regionId: string,
    missionId: string,
    questionCount: 5 | 7
  ): ChallengeScoringPayload => ({
    sessionId: `sess-${regionId}`,
    regionId,
    regionName: regionId,
    missionId,
    questionCount,
    answeredCount: questionCount,
    correctCount: questionCount,
    totalWeight: questionCount * 1.5,
    earnedWeight: questionCount * 1.5,
    normalizedAccuracyScore: 100,
    normalizedAnalysisQualityScore: 100,
    elapsedSeconds: questionCount * 30,
    targetSeconds: questionCount * 35,
    stemBreakdown: {
      S: { correct: 1, total: 1, earnedWeight: 1.5, totalWeight: 1.5, normalizedScore: 100 },
      T: { correct: 1, total: 1, earnedWeight: 1.5, totalWeight: 1.5, normalizedScore: 100 },
      E: { correct: 1, total: 1, earnedWeight: 1.5, totalWeight: 1.5, normalizedScore: 100 },
      M: { correct: 2, total: 2, earnedWeight: 3, totalWeight: 3, normalizedScore: 100 },
    },
    completedAtIso: new Date().toISOString(),
  });

  // 5-soal Sanggau + keputusan optimal
  submitDecisionResultToScoringEngine(
    {
      regionId: 'sanggau',
      regionName: 'Kabupaten Sanggau',
      missionId: 'sim-07',
      missionCode: 'SIM-KB-07',
      scenarioTitle: 'Patroli Preventif DAS Kapuas Tengah',
      landType: 'Tanah Mineral & Hutan Lindung',
      riskLevel: 'aman',
      actionId: 'monitoring-reporting',
      actionLabel: 'Pemantauan dan pelaporan',
      suitability: 'sangat-sesuai',
      suitabilityLabel: 'Sangat Sesuai',
      totalScore: 100,
      scoreBreakdown: {
        actionSuitabilityPoints: 60,
        caseConditionPoints: 40,
        penaltyPoints: 0,
      },
      consideredConditionsCount: 3,
      requiredConditionsCount: 3,
      preventiveReplacementWarning: false,
      scientificReasonSummary: 'Pemantauan rutin menjaga stabilitas hutan lindung.',
      simulationConsequenceSummary: 'Status aman terjaga.',
      rubricNotes: ['Optimal'],
    },
    storage
  );
  const sanggauReceipt = submitChallengeResultToScoringEngine(
    makePerfectChallenge('sanggau', 'sim-07', 5),
    storage
  );

  // 7-soal Kubu Raya + keputusan optimal
  submitDecisionResultToScoringEngine(
    {
      regionId: 'kubu-raya',
      regionName: 'Kabupaten Kubu Raya',
      missionId: 'sim-01',
      missionCode: 'SIM-KB-01',
      scenarioTitle: 'Pengendalian Kubah Gambut Kuala Dua',
      landType: 'Lahan Gambut Dalam',
      riskLevel: 'bahaya',
      actionId: 'authorized-suppression',
      actionLabel: 'Respons pemadaman oleh petugas yang berwenang',
      suitability: 'sangat-sesuai',
      suitabilityLabel: 'Sangat Sesuai',
      totalScore: 100,
      scoreBreakdown: {
        actionSuitabilityPoints: 60,
        caseConditionPoints: 40,
        penaltyPoints: 0,
      },
      consideredConditionsCount: 3,
      requiredConditionsCount: 3,
      preventiveReplacementWarning: false,
      scientificReasonSummary: 'Pemadaman aktif memutus segitiga api.',
      simulationConsequenceSummary: 'Api dikendalikan.',
      rubricNotes: ['Optimal'],
    },
    storage
  );
  const kubuReceipt = submitChallengeResultToScoringEngine(
    makePerfectChallenge('kubu-raya', 'sim-01', 7),
    storage
  );

  assert.equal(sanggauReceipt.missionSummary.overallScore, 100);
  assert.equal(kubuReceipt.missionSummary.overallScore, 100);

  const m5 = sanggauReceipt.missionSummary.fiveMetrics;
  const m7 = kubuReceipt.missionSummary.fiveMetrics;
  assert.deepEqual(m5, {
    answerAccuracy: 100,
    analysisQuality: 100,
    decisionPrecision: 100,
    modelEffectiveness: 100,
    completionTime: 100,
  });
  assert.deepEqual(m7, m5);
});

test('completion time score prevents fast blind clicking from earning high time scores', () => {
  const blindFastClick = computeNormalizedCompletionTimeScore({
    elapsedSeconds: 5,
    targetSeconds: 210,
    normalizedAccuracyScore: 0,
  });
  const accurateTimely = computeNormalizedCompletionTimeScore({
    elapsedSeconds: 150,
    targetSeconds: 210,
    normalizedAccuracyScore: 100,
  });

  assert.ok(blindFastClick <= 25);
  assert.equal(accurateTimely, 100);
});
