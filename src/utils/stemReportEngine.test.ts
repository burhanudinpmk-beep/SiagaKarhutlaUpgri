import assert from 'node:assert/strict';
import test from 'node:test';
import { CERTIFICATE_REQUIRED_MISSIONS } from './progressHelpers.ts';
import {
  buildComprehensiveStemReport,
  formatDurationId,
  type ReportAttemptInput,
  type ReportSimulationResultInput,
} from './stemReportEngine.ts';
import type { ChallengeScoreRecord, DecisionScoreRecord } from './scoringEngine.ts';

function buildCompletedMissionsMap(opts?: {
  count?: number;
  lowEngineeringOnLast?: boolean;
  preventiveWarningOnFirst?: boolean;
}): {
  simMap: Record<string, ReportSimulationResultInput>;
  attempts: ReportAttemptInput[];
} {
  const count = opts?.count ?? 8;
  const simMap: Record<string, ReportSimulationResultInput> = {};
  const attempts: ReportAttemptInput[] = [];

  CERTIFICATE_REQUIRED_MISSIONS.slice(0, count).forEach((spec, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === count - 1;
    const decisionScore = 70 + idx * 3;
    const analysisQuality = 72 + idx * 2;
    const answerAccuracy = 75 + idx * 2;
    const completionTimeScore = 82;
    const overallScore = Math.round(
      answerAccuracy * 0.25 +
        analysisQuality * 0.2 +
        decisionScore * 0.25 +
        decisionScore * 0.2 +
        completionTimeScore * 0.1
    );
    const engScore = opts?.lowEngineeringOnLast && isLast ? 48 : 80 + idx;
    const timestamp = `2026-11-21T0${idx + 1}:00:00.000Z`;

    const decisionRecord: DecisionScoreRecord = {
      recordId: `dec-${spec.missionId}`,
      regionId: spec.regionId,
      regionName: spec.regionName,
      missionId: spec.missionId,
      missionCode: spec.missionCode,
      scenarioTitle: `Skenario ${spec.regionName}`,
      landType: 'Gambut Dalam',
      riskLevel: 'bahaya',
      actionId: 'rewetting',
      actionLabel: 'Pembasahan kembali gambut (rewetting)',
      suitability: 'sangat-sesuai',
      suitabilityLabel: 'Sangat Sesuai',
      totalScore: decisionScore,
      maxPossibleScore: 100,
      scoreBreakdown: {
        actionSuitabilityPoints: 55,
        caseConditionPoints: 25,
        penaltyPoints: 0,
      },
      consideredConditionsCount: 3,
      requiredConditionsCount: 3,
      preventiveReplacementWarning: Boolean(opts?.preventiveWarningOnFirst && isFirst),
      scientificReasonSummary: 'Menjaga tinggi muka air tanah gambut.',
      simulationConsequenceSummary: 'Kelembapan permukaan meningkat.',
      rubricNotes: [],
      stemScores: {
        science: 82 + idx,
        technology: 78 + idx,
        engineering: engScore,
        mathematics: 80 + idx,
      },
      submittedAtIso: timestamp,
    };

    const challengeRecord: ChallengeScoreRecord = {
      recordId: `chl-${spec.missionId}`,
      sessionId: `sess-${spec.missionId}`,
      regionId: spec.regionId,
      regionName: spec.regionName,
      missionId: spec.missionId,
      questionCount: spec.requiredQuestionCount,
      answeredCount: spec.requiredQuestionCount,
      correctCount: spec.requiredQuestionCount - (isLast ? 1 : 0),
      totalWeight: spec.requiredQuestionCount * 1.5,
      earnedWeight: (spec.requiredQuestionCount - (isLast ? 1 : 0)) * 1.5,
      normalizedAccuracyScore: answerAccuracy,
      normalizedAnalysisQualityScore: analysisQuality,
      elapsedSeconds: 60 + idx * 10,
      targetSeconds: spec.requiredQuestionCount * 35,
      completionTimeScore,
      compositeChallengeScore: overallScore,
      stemBreakdown: {
        S: { correct: 2, total: 2, earnedWeight: 3, totalWeight: 3, normalizedScore: 84 },
        T: { correct: 1, total: 1, earnedWeight: 1.5, totalWeight: 1.5, normalizedScore: 80 },
        E: {
          correct: isLast ? 0 : 1,
          total: 1,
          earnedWeight: isLast ? 0 : 1.5,
          totalWeight: 1.5,
          normalizedScore: engScore,
        },
        M: { correct: 1, total: 1, earnedWeight: 1.5, totalWeight: 1.5, normalizedScore: 82 },
      },
      completedAtIso: timestamp,
      serverProof: 'a'.repeat(64),
    };

    simMap[spec.missionId] = {
      resultId: `res-${spec.missionId}`,
      regionId: spec.regionId,
      regionName: spec.regionName,
      missionId: spec.missionId,
      missionCode: spec.missionCode,
      decisionActionId: 'rewetting',
      decisionActionLabel: 'Pembasahan kembali gambut (rewetting)',
      decisionScore,
      overallScore,
      fiveMetrics: {
        answerAccuracy,
        analysisQuality,
        decisionPrecision: decisionScore,
        modelEffectiveness: decisionScore,
        completionTime: completionTimeScore,
      },
      stemScores: {
        science: 83,
        technology: 79,
        engineering: engScore,
        mathematics: 81,
      },
      latestDecisionRecord: decisionRecord,
      latestChallengeRecord: challengeRecord,
      isMissionCompleted: true,
      challengeProof: 'a'.repeat(64),
    };

    attempts.push({
      attemptId: `att-chl-${spec.missionId}`,
      regionId: spec.regionId,
      missionId: spec.missionId,
      attemptType: 'challenge',
      questionCount: spec.requiredQuestionCount,
      correctCount: challengeRecord.correctCount,
      accuracyScore: answerAccuracy,
      analysisQualityScore: analysisQuality,
      completionTimeScore,
      elapsedSeconds: challengeRecord.elapsedSeconds,
      compositeScore: overallScore,
      completedAtIso: timestamp,
      answersSummary: isLast
        ? [
            {
              questionId: `q-${spec.missionId}-eng`,
              questionPrompt: 'Mengapa sekat kanal dibangun berseri pada kubah gambut?',
              selectedOptionId: 'opt-wrong',
              selectedOptionText: 'Untuk mempercepat pengeringan lahan pertanian',
              correctOptionId: 'opt-right',
              correctOptionText: 'Untuk menahan laju drainase dan menjaga TMAT tetap basah',
              explanation:
                'Sekat kanal bertahap menahan air hujan agar kubah gambut tidak mengalami oksidasi dan kekeringan ekstrem.',
              isCorrect: false,
              stemCategory: 'E',
              difficulty: 'sulit',
              earnedWeight: 0,
              maxWeight: 2,
            },
          ]
        : [],
    });
  });

  return { simMap, attempts };
}

test('formatDurationId memformat durasi detik ke format bahasa Indonesia yang bersih', () => {
  assert.equal(formatDurationId(45), '45 detik');
  assert.equal(formatDurationId(125), '2m 5d');
  assert.equal(formatDurationId(3665), '1j 1m 5d');
});

test('buildComprehensiveStemReport tetap terkunci (isUnlocked=false) sebelum seluruh 8 misi wajib selesai', () => {
  const { simMap, attempts } = buildCompletedMissionsMap({ count: 5 });

  const report = buildComprehensiveStemReport({
    playerName: 'Nadia Putri',
    simulationResultsByMission: simMap,
    missionAttempts: attempts,
  });

  assert.equal(report.isUnlocked, false);
  assert.equal(report.completedRequiredCount, 5);
  assert.equal(report.totalRequiredCount, 8);
  assert.equal(report.playerName, 'Nadia Putri');
  assert.equal(report.missionRecaps.length, 8);
});

test('buildComprehensiveStemReport terbuka (isUnlocked=true) saat 8 misi wajib selesai dan seluruh metrik berasal dari data tersimpan', () => {
  const { simMap, attempts } = buildCompletedMissionsMap({
    count: 8,
    lowEngineeringOnLast: true,
    preventiveWarningOnFirst: true,
  });

  const report = buildComprehensiveStemReport({
    playerName: 'Bima Sakti',
    simulationResultsByMission: simMap,
    missionAttempts: attempts,
  });

  assert.equal(report.isUnlocked, true);
  assert.equal(report.completedRequiredCount, 8);
  assert.equal(report.playerName, 'Bima Sakti');
  assert.ok(report.metrics.totalScore > 0);
  assert.ok(report.metrics.analysisAccuracy > 0);
  assert.ok(report.metrics.decisionPrecision > 0);
  // Total elapsed: 60+70+80+90+100+110+120+130 = 760 detik = 12m 40d
  assert.equal(report.metrics.totalElapsedSeconds, 760);
  assert.equal(report.metrics.formattedTotalElapsedTime, '12m 40d');

  // S, T, E, M berasal dari rata-rata skor tersimpan
  assert.equal(report.metrics.science, 83);
  assert.equal(report.metrics.technology, 79);
  assert.equal(report.metrics.mathematics, 81);
  // Last mission had engineering 48, 7 others 80..86 -> average = (80+81+82+83+84+85+86+48)/8 = 78.625 -> 79
  assert.equal(report.metrics.engineering, 79);

  // Grafik perkembangan kemampuan terurut kronologis 8 titik
  assert.equal(report.progressionSeries.length, 8);
  assert.equal(report.progressionSeries[0].missionCode, CERTIFICATE_REQUIRED_MISSIONS[0].missionCode);
  assert.equal(report.progressionSeries[7].missionCode, CERTIFICATE_REQUIRED_MISSIONS[7].missionCode);

  // Pembahasan jawaban salah mengekstrak soal salah dengan penjelasan ilmiah
  assert.equal(report.wrongAnswers.length, 1);
  assert.equal(report.wrongAnswers[0].missionCode, CERTIFICATE_REQUIRED_MISSIONS[7].missionCode);
  assert.equal(report.wrongAnswers[0].stemCategory, 'E');
  assert.match(report.wrongAnswers[0].explanation, /Sekat kanal bertahap/);

  // Rekomendasi pembelajaran merujuk kelemahan Engineering & peringatan pencegahan vs api aktif
  assert.ok(report.recommendations.some((r) => r.focusArea.includes('Engineering')));
  assert.ok(
    report.recommendations.some((r) => r.id === 'rec-decision-active-fire-boundary')
  );
});

test('buildComprehensiveStemReport terbuka (isUnlocked=true) pada alur kuis 5 soal tanpa Decision Engine', () => {
  const simMap: Record<string, ReportSimulationResultInput> = {};
  const attempts: ReportAttemptInput[] = [];

  CERTIFICATE_REQUIRED_MISSIONS.forEach((spec, idx) => {
    const timestamp = `2026-11-21T0${idx + 1}:00:00.000Z`;
    const challengeRecord: ChallengeScoreRecord = {
      recordId: `chl-q5-${spec.missionId}`,
      sessionId: `sess-q5-${spec.missionId}`,
      regionId: spec.regionId,
      regionName: spec.regionName,
      missionId: spec.missionId,
      questionCount: 5,
      answeredCount: 5,
      correctCount: 4,
      totalWeight: 7.5,
      earnedWeight: 6,
      normalizedAccuracyScore: 80,
      normalizedAnalysisQualityScore: 80,
      elapsedSeconds: 75,
      targetSeconds: 175,
      completionTimeScore: 85,
      compositeChallengeScore: 81,
      stemBreakdown: {
        S: { correct: 1, total: 1, earnedWeight: 1.5, totalWeight: 1.5, normalizedScore: 100 },
        T: { correct: 1, total: 1, earnedWeight: 1.5, totalWeight: 1.5, normalizedScore: 100 },
        E: { correct: 1, total: 1, earnedWeight: 1.5, totalWeight: 1.5, normalizedScore: 100 },
        M: { correct: 1, total: 2, earnedWeight: 1.5, totalWeight: 3, normalizedScore: 50 },
      },
      completedAtIso: timestamp,
      serverProof: 'b'.repeat(64),
    };

    simMap[spec.missionId] = {
      resultId: `res-q5-${spec.missionId}`,
      regionId: spec.regionId,
      regionName: spec.regionName,
      missionId: spec.missionId,
      missionCode: spec.missionCode,
      overallScore: 81,
      fiveMetrics: {
        answerAccuracy: 80,
        analysisQuality: 80,
        decisionPrecision: null,
        modelEffectiveness: null,
        completionTime: 85,
      },
      stemScores: {
        science: 100,
        technology: 100,
        engineering: 100,
        mathematics: 50,
      },
      latestChallengeRecord: challengeRecord,
      isMissionCompleted: true,
      challengeProof: 'b'.repeat(64),
    };

    attempts.push({
      attemptId: `att-q5-${spec.missionId}`,
      regionId: spec.regionId,
      missionId: spec.missionId,
      attemptType: 'challenge',
      questionCount: 5,
      correctCount: 4,
      accuracyScore: 80,
      analysisQualityScore: 80,
      completionTimeScore: 85,
      elapsedSeconds: 75,
      compositeScore: 81,
      completedAtIso: timestamp,
    });
  });

  const report = buildComprehensiveStemReport({
    playerName: 'Sari Wulandari',
    simulationResultsByMission: simMap,
    missionAttempts: attempts,
  });

  assert.equal(report.isUnlocked, true);
  assert.equal(report.completedRequiredCount, 8);
  assert.equal(report.totalCorrectQuestions, 32);
  assert.equal(report.totalAnsweredQuestions, 40);
  assert.equal(report.metrics.decisionPrecision, 80);
  assert.equal(report.metrics.totalScore, 81);
});
