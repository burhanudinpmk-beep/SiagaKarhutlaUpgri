import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_KALBAR_REGIONS } from '../data/kalbarRegions';
import {
  evaluateMitigationDecision,
  getMissionDecisionContext,
  MITIGATION_ACTION_LIST,
} from './decisionEngine';
import {
  clearScoringHistory,
  getMissionScoringSummary,
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

test('all 5 required mitigation actions are registered in Decision Engine', () => {
  const ids = MITIGATION_ACTION_LIST.map((a) => a.id);
  assert.deepEqual(ids, [
    'rewetting',
    'canal-blocking',
    'firebreak',
    'monitoring-reporting',
    'authorized-suppression',
  ]);
});

test('all 14 Kalbar missions have distinct environmental contexts, land types, objectives, and case considerations', () => {
  const objectives = new Set<string>();
  for (const region of ALL_KALBAR_REGIONS) {
    const ctx = getMissionDecisionContext(region.id);
    assert.equal(ctx.regionId, region.id);
    assert.ok(ctx.landType.length > 0);
    assert.ok(ctx.handlingObjective.length > 20);
    assert.equal(ctx.caseConsiderations.length, 4);
    const relevantCount = ctx.caseConsiderations.filter((c) => c.isRelevantToCase).length;
    const misconceptionCount = ctx.caseConsiderations.filter(
      (c) => !c.isRelevantToCase
    ).length;
    assert.equal(relevantCount, 3);
    assert.equal(misconceptionCount, 1);
    objectives.add(ctx.handlingObjective);
  }
  assert.equal(objectives.size, 14);
});

test('never gives a perfect 100 score when right action is picked without considering case conditions', () => {
  const storage = createMemoryStorage();
  const kubuRayaCtx = getMissionDecisionContext('kubu-raya', 'sim-01');

  // Selecting the right action ('authorized-suppression') with zero case considerations
  const withoutConsiderations = evaluateMitigationDecision(
    kubuRayaCtx,
    {
      actionId: 'authorized-suppression',
      selectedConsiderationIds: [],
    },
    storage
  );

  assert.equal(withoutConsiderations.suitability.level, 'sangat-sesuai');
  assert.equal(withoutConsiderations.decisionScore.isPerfectScore, false);
  assert.equal(withoutConsiderations.decisionScore.scoreCappedDueToConditions, true);
  assert.ok(withoutConsiderations.decisionScore.totalScore <= 72);
  assert.ok(withoutConsiderations.decisionScore.capReason);

  // Selecting only 1 of 3 relevant conditions is still capped below 100
  const relevantIds = kubuRayaCtx.caseConsiderations
    .filter((c) => c.isRelevantToCase)
    .map((c) => c.id);
  const partialConsiderations = evaluateMitigationDecision(
    kubuRayaCtx,
    {
      actionId: 'authorized-suppression',
      selectedConsiderationIds: [relevantIds[0]],
    },
    storage
  );

  assert.equal(partialConsiderations.decisionScore.isPerfectScore, false);
  assert.ok(partialConsiderations.decisionScore.totalScore < 100);

  // Selecting all 3 relevant conditions and avoiding misconception reaches full 100
  const fullConsiderations = evaluateMitigationDecision(
    kubuRayaCtx,
    {
      actionId: 'authorized-suppression',
      selectedConsiderationIds: relevantIds,
    },
    storage
  );

  assert.equal(fullConsiderations.decisionScore.totalScore, 100);
  assert.equal(fullConsiderations.decisionScore.isPerfectScore, true);
});

test('preventive actions during active fire are explicitly flagged as NOT replacing active firefighting', () => {
  const storage = createMemoryStorage();
  const kubuRayaCtx = getMissionDecisionContext('kubu-raya', 'sim-01');
  assert.equal(kubuRayaCtx.firePhase, 'kebakaran-aktif');

  const preventiveIds = [
    'rewetting',
    'canal-blocking',
    'firebreak',
    'monitoring-reporting',
  ] as const;

  for (const actionId of preventiveIds) {
    const result = evaluateMitigationDecision(
      kubuRayaCtx,
      { actionId, selectedConsiderationIds: [] },
      storage
    );
    assert.equal(result.suitability.isPreventiveNotReplacementForActiveFire, true);
    assert.equal(result.simulationConsequence.outcomeTier, 'negatif');
    assert.ok(
      result.scientificAnalysis.preventiveVsActiveClarification.includes('TIDAK BISA') ||
        result.scientificAnalysis.preventiveVsActiveClarification.includes('TIDAK')
    );
    assert.ok(result.decisionScore.totalScore < 50);
  }
});

test('land type mismatch (canal-blocking on steep non-peat Bengkayang hill) is rejected as tidak-sesuai', () => {
  const storage = createMemoryStorage();
  const bengkayangCtx = getMissionDecisionContext('bengkayang');
  assert.equal(bengkayangCtx.environmentalConditions.hasPeatSoil, false);
  assert.equal(bengkayangCtx.environmentalConditions.slopePct, 18);

  const wrongHydro = evaluateMitigationDecision(
    bengkayangCtx,
    { actionId: 'canal-blocking', selectedConsiderationIds: [] },
    storage
  );
  assert.equal(wrongHydro.suitability.level, 'tidak-sesuai');
  assert.equal(wrongHydro.simulationConsequence.outcomeTier, 'negatif');

  const relevantIds = bengkayangCtx.caseConsiderations
    .filter((c) => c.isRelevantToCase)
    .map((c) => c.id);
  const rightFirebreak = evaluateMitigationDecision(
    bengkayangCtx,
    { actionId: 'firebreak', selectedConsiderationIds: relevantIds },
    storage
  );
  assert.equal(rightFirebreak.suitability.level, 'sangat-sesuai');
  assert.equal(rightFirebreak.decisionScore.totalScore, 100);
});

test('each Decision Engine evaluation automatically dispatches results to Scoring Engine', () => {
  const storage = createMemoryStorage();
  clearScoringHistory(undefined, undefined, storage);

  const sanggauCtx = getMissionDecisionContext('sanggau');
  const relevantIds = sanggauCtx.caseConsiderations
    .filter((c) => c.isRelevantToCase)
    .map((c) => c.id);

  const result = evaluateMitigationDecision(
    sanggauCtx,
    {
      actionId: 'monitoring-reporting',
      selectedConsiderationIds: relevantIds,
    },
    storage
  );

  assert.equal(result.scoringReceipt.accepted, true);
  assert.equal(result.scoringReceipt.record.actionId, 'monitoring-reporting');
  assert.equal(result.scoringReceipt.record.totalScore, result.decisionScore.totalScore);

  const storedSummary = getMissionScoringSummary('sanggau', sanggauCtx.missionId, storage);
  assert.equal(storedSummary.attemptsCount, 1);
  assert.equal(storedSummary.latestScore, result.decisionScore.totalScore);
});
