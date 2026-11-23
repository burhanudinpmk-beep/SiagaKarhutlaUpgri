import { KALBAR_REGIONS } from '../data/kalbarRegions';
import { CERTIFICATE_REQUIRED_MISSIONS } from './progressHelpers';
import type {
  ChallengeScoreRecord,
  DecisionScoreRecord,
  FiveMetricBreakdown,
  StemCompetencyScores,
} from './scoringEngine';

export interface ReportAnswerSummaryInput {
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

export interface ReportAttemptInput {
  attemptId: string;
  regionId: string;
  missionId: string;
  attemptType: 'challenge' | 'decision';
  questionCount?: number;
  correctCount?: number;
  accuracyScore?: number;
  analysisQualityScore?: number;
  completionTimeScore?: number;
  elapsedSeconds?: number;
  compositeScore: number;
  answersSummary?: ReportAnswerSummaryInput[];
  completedAtIso: string;
}

export interface ReportSimulationResultInput {
  resultId: string;
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

export interface ReportProgressInput {
  completedMissionIds: string[];
  inProgressMissionIds: string[];
  totalCompletedMissions: number;
  averageOverallScore: number;
}

export interface ReportCertificateInput {
  certificateId: string;
  certificateNumber: string;
  studentName: string;
  averageScore: number;
  predicate: string;
  issuedAtIso: string;
  validationDigest: string;
  serverVerified: boolean;
}

export interface BuildStemReportParams {
  playerName: string;
  simulationResultsByMission: Record<string, ReportSimulationResultInput>;
  missionAttempts: ReportAttemptInput[];
  playerProgress?: ReportProgressInput;
  certificate?: ReportCertificateInput | null;
}

export interface MissionRecapRow {
  missionId: string;
  missionCode: string;
  regionId: string;
  regionName: string;
  riskLevel: 'bahaya' | 'waspada' | 'cukup-aman' | 'aman';
  landType: string;
  requiredQuestionCount: number;
  isRequired: boolean;
  isCompleted: boolean;
  hasDecision: boolean;
  hasChallenge: boolean;
  hasServerProof: boolean;
  decisionActionLabel: string | null;
  decisionSuitabilityLabel: string | null;
  decisionScore: number | null;
  challengeCorrect: number | null;
  challengeTotal: number | null;
  answerAccuracy: number | null;
  analysisAccuracy: number | null;
  completionTimeScore: number | null;
  elapsedSeconds: number | null;
  stemScores: StemCompetencyScores | null;
  overallScore: number | null;
  preventiveReplacementWarning: boolean;
  completedAtIso: string | null;
}

export interface AbilityProgressionPoint {
  orderIndex: number;
  missionId: string;
  missionCode: string;
  regionName: string;
  shortLabel: string;
  overallScore: number;
  analysisAccuracy: number;
  decisionPrecision: number;
  completionTimeScore: number;
  completedAtIso: string;
}

export interface WrongAnswerReviewItem {
  id: string;
  missionId: string;
  missionCode: string;
  regionId: string;
  regionName: string;
  questionId: string;
  questionPrompt: string;
  stemCategory: 'S' | 'T' | 'E' | 'M';
  stemLabel: string;
  difficulty: string;
  selectedOptionId: string;
  selectedOptionText: string;
  correctOptionId: string;
  correctOptionText: string;
  explanation: string;
  earnedWeight: number;
  maxWeight: number;
}

export interface LearningRecommendationItem {
  id: string;
  focusArea: string;
  priority: 'prioritas' | 'penguatan' | 'pengayaan';
  priorityLabel: string;
  evidenceText: string;
  actionableAdvice: string;
}

export interface ComprehensiveStemReport {
  isUnlocked: boolean;
  playerName: string;
  completedRequiredCount: number;
  totalRequiredCount: number;
  totalCompletedMissions: number;
  totalCorrectQuestions: number;
  totalAnsweredQuestions: number;
  metrics: {
    totalScore: number;
    analysisAccuracy: number;
    answerAccuracy: number;
    decisionPrecision: number;
    completionTimeScore: number;
    totalElapsedSeconds: number;
    averageElapsedSeconds: number;
    formattedTotalElapsedTime: string;
    formattedAverageElapsedTime: string;
    science: number;
    technology: number;
    engineering: number;
    mathematics: number;
    predicate: string;
  };
  progressionSeries: AbilityProgressionPoint[];
  wrongAnswers: WrongAnswerReviewItem[];
  recommendations: LearningRecommendationItem[];
  missionRecaps: MissionRecapRow[];
  certificate: ReportCertificateInput | null;
}

const STEM_CATEGORY_LABELS: Record<'S' | 'T' | 'E' | 'M', string> = {
  S: 'Science (Sains Lingkungan)',
  T: 'Technology (Teknologi GIS)',
  E: 'Engineering (Rekayasa Mitigasi)',
  M: 'Mathematics (Pemodelan & Rasio)',
};

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function normalizeStemCode(raw: string): 'S' | 'T' | 'E' | 'M' {
  const upper = raw.trim().toUpperCase();
  if (upper === 'T' || upper === 'E' || upper === 'M') return upper;
  return 'S';
}

export function formatDurationId(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}j ${minutes}m ${seconds}d`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}d`;
  }
  return `${seconds} detik`;
}

function deriveOverallPredicate(totalScore: number): string {
  if (totalScore >= 85) {
    return 'Sangat Memuaskan — Komandan Mitigasi Karhutla Unggul';
  }
  if (totalScore >= 70) {
    return 'Memuaskan — Analis Mitigasi Karhutla Terampil';
  }
  if (totalScore >= 55) {
    return 'Kompeten — Pelaksana Siaga Karhutla Kalbar';
  }
  return 'Perlu Pendampingan — Penguatan Konsep Mitigasi STEM';
}

function resolveStemScoresFromSimulation(
  sim: ReportSimulationResultInput | undefined
): StemCompetencyScores | null {
  if (!sim) return null;
  if (sim.stemScores) return sim.stemScores;
  if (sim.latestChallengeRecord?.stemBreakdown) {
    const b = sim.latestChallengeRecord.stemBreakdown;
    return {
      science: Math.round(b.S.normalizedScore),
      technology: Math.round(b.T.normalizedScore),
      engineering: Math.round(b.E.normalizedScore),
      mathematics: Math.round(b.M.normalizedScore),
    };
  }
  return sim.latestDecisionRecord?.stemScores ?? null;
}

function resolveCompletedTimestamp(sim: ReportSimulationResultInput | undefined): string | null {
  if (!sim) return null;
  const challengeTime = sim.latestChallengeRecord?.completedAtIso ?? '';
  const decisionTime = sim.latestDecisionRecord?.submittedAtIso ?? '';
  if (!challengeTime && !decisionTime) return null;
  return challengeTime >= decisionTime ? challengeTime : decisionTime;
}

export function buildComprehensiveStemReport(
  params: BuildStemReportParams
): ComprehensiveStemReport {
  const {
    playerName,
    simulationResultsByMission,
    missionAttempts,
    certificate = null,
  } = params;

  const regionLookup = new Map(KALBAR_REGIONS.map((r) => [r.id, r]));
  const requiredMissionIds = new Set(
    CERTIFICATE_REQUIRED_MISSIONS.map((m) => m.missionId)
  );

  // Build rows for all 8 required Kalbar missions first
  const requiredRows: MissionRecapRow[] = CERTIFICATE_REQUIRED_MISSIONS.map((spec) => {
    const sim = simulationResultsByMission[spec.missionId];
    const regionMeta = regionLookup.get(spec.regionId);
    const decision = sim?.latestDecisionRecord;
    const challenge = sim?.latestChallengeRecord;
    const hasDecision = Boolean(decision);
    const hasChallenge = Boolean(challenge);
    const hasServerProof = Boolean(sim?.challengeProof || challenge?.serverProof);
    const isCompleted = Boolean(sim?.isMissionCompleted && hasChallenge);

    return {
      missionId: spec.missionId,
      missionCode: spec.missionCode,
      regionId: spec.regionId,
      regionName: spec.regionName,
      riskLevel: regionMeta?.status ?? 'waspada',
      landType: regionMeta?.biomeType ?? 'Ekosistem Kalimantan Barat',
      requiredQuestionCount: spec.requiredQuestionCount,
      isRequired: true,
      isCompleted,
      hasDecision,
      hasChallenge,
      hasServerProof,
      decisionActionLabel: decision?.actionLabel ?? sim?.decisionActionLabel ?? null,
      decisionSuitabilityLabel: decision?.suitabilityLabel ?? null,
      decisionScore: decision?.totalScore ?? sim?.decisionScore ?? null,
      challengeCorrect: challenge?.correctCount ?? null,
      challengeTotal: challenge?.questionCount ?? null,
      answerAccuracy: sim?.fiveMetrics?.answerAccuracy ?? challenge?.normalizedAccuracyScore ?? null,
      analysisAccuracy:
        sim?.fiveMetrics?.analysisQuality ??
        challenge?.normalizedAnalysisQualityScore ??
        null,
      completionTimeScore:
        sim?.fiveMetrics?.completionTime ?? challenge?.completionTimeScore ?? null,
      elapsedSeconds: challenge?.elapsedSeconds ?? null,
      stemScores: resolveStemScoresFromSimulation(sim),
      overallScore: isCompleted || hasDecision || hasChallenge ? sim?.overallScore ?? null : null,
      preventiveReplacementWarning: Boolean(decision?.preventiveReplacementWarning),
      completedAtIso: resolveCompletedTimestamp(sim),
    };
  });

  // Include any additional completed/attempted non-required regions (e.g. Bengkayang, Pontianak)
  const extraRows: MissionRecapRow[] = [];
  for (const [missionId, sim] of Object.entries(simulationResultsByMission)) {
    if (requiredMissionIds.has(missionId)) continue;
    const decision = sim.latestDecisionRecord;
    const challenge = sim.latestChallengeRecord;
    const hasDecision = Boolean(decision);
    const hasChallenge = Boolean(challenge);
    if (!hasDecision && !hasChallenge) continue;

    const regionMeta = regionLookup.get(sim.regionId);
    const isCompleted = Boolean(sim.isMissionCompleted && hasChallenge);
    extraRows.push({
      missionId,
      missionCode: sim.missionCode ?? missionId.toUpperCase(),
      regionId: sim.regionId,
      regionName: sim.regionName || regionMeta?.name || sim.regionId,
      riskLevel: regionMeta?.status ?? 'waspada',
      landType: regionMeta?.biomeType ?? 'Ekosistem Kalimantan Barat',
      requiredQuestionCount: challenge?.questionCount ?? 5,
      isRequired: false,
      isCompleted,
      hasDecision,
      hasChallenge,
      hasServerProof: Boolean(sim.challengeProof || challenge?.serverProof),
      decisionActionLabel: decision?.actionLabel ?? sim.decisionActionLabel ?? null,
      decisionSuitabilityLabel: decision?.suitabilityLabel ?? null,
      decisionScore: decision?.totalScore ?? sim.decisionScore ?? null,
      challengeCorrect: challenge?.correctCount ?? null,
      challengeTotal: challenge?.questionCount ?? null,
      answerAccuracy: sim.fiveMetrics?.answerAccuracy ?? challenge?.normalizedAccuracyScore ?? null,
      analysisAccuracy:
        sim.fiveMetrics?.analysisQuality ??
        challenge?.normalizedAnalysisQualityScore ??
        null,
      completionTimeScore:
        sim.fiveMetrics?.completionTime ?? challenge?.completionTimeScore ?? null,
      elapsedSeconds: challenge?.elapsedSeconds ?? null,
      stemScores: resolveStemScoresFromSimulation(sim),
      overallScore: sim.overallScore,
      preventiveReplacementWarning: Boolean(decision?.preventiveReplacementWarning),
      completedAtIso: resolveCompletedTimestamp(sim),
    });
  }

  const missionRecaps = [...requiredRows, ...extraRows];
  const completedRequiredRows = requiredRows.filter((r) => r.isCompleted);
  const completedAllRows = missionRecaps.filter((r) => r.isCompleted);

  const completedRequiredCount = completedRequiredRows.length;
  const totalRequiredCount = CERTIFICATE_REQUIRED_MISSIONS.length;
  const isUnlocked = completedRequiredCount === totalRequiredCount;

  // Aggregate metrics strictly from saved completed missions (or active evaluated missions)
  const metricSourceRows = completedAllRows.length > 0 ? completedAllRows : [];

  const totalScore = avg(
    metricSourceRows
      .map((r) => r.overallScore)
      .filter((v): v is number => typeof v === 'number')
  );
  const analysisAccuracy = avg(
    metricSourceRows
      .map((r) => r.analysisAccuracy)
      .filter((v): v is number => typeof v === 'number')
  );
  const answerAccuracy = avg(
    metricSourceRows
      .map((r) => r.answerAccuracy)
      .filter((v): v is number => typeof v === 'number')
  );
  const decisionScoreValues = metricSourceRows
    .map((r) => r.decisionScore)
    .filter((v): v is number => typeof v === 'number');
  const decisionPrecision =
    decisionScoreValues.length > 0 ? avg(decisionScoreValues) : answerAccuracy;
  const completionTimeScore = avg(
    metricSourceRows
      .map((r) => r.completionTimeScore)
      .filter((v): v is number => typeof v === 'number')
  );

  const elapsedValues = metricSourceRows
    .map((r) => r.elapsedSeconds)
    .filter((v): v is number => typeof v === 'number');
  const totalElapsedSeconds = elapsedValues.reduce((sum, s) => sum + s, 0);
  const averageElapsedSeconds =
    elapsedValues.length > 0 ? Math.round(totalElapsedSeconds / elapsedValues.length) : 0;

  const totalCorrectQuestions = metricSourceRows.reduce(
    (sum, r) => sum + (r.challengeCorrect ?? 0),
    0
  );
  const totalAnsweredQuestions = metricSourceRows.reduce(
    (sum, r) => sum + (r.challengeTotal ?? 0),
    0
  );

  const stemRows = metricSourceRows
    .map((r) => r.stemScores)
    .filter((s): s is StemCompetencyScores => Boolean(s));

  const science = avg(stemRows.map((s) => s.science));
  const technology = avg(stemRows.map((s) => s.technology));
  const engineering = avg(stemRows.map((s) => s.engineering));
  const mathematics = avg(stemRows.map((s) => s.mathematics));

  // Build chronological ability progression chart points
  const progressionSeries: AbilityProgressionPoint[] = [...completedAllRows]
    .sort((a, b) => {
      const timeA = a.completedAtIso ?? '';
      const timeB = b.completedAtIso ?? '';
      if (timeA && timeB && timeA !== timeB) {
        return timeA.localeCompare(timeB);
      }
      return a.missionCode.localeCompare(b.missionCode);
    })
    .map((row, idx) => ({
      orderIndex: idx + 1,
      missionId: row.missionId,
      missionCode: row.missionCode,
      regionName: row.regionName,
      shortLabel: row.missionCode.replace(/^SIM-(?:KB-)?/, ''),
      overallScore: row.overallScore ?? 0,
      analysisAccuracy: row.analysisAccuracy ?? 0,
      decisionPrecision: row.decisionScore ?? 0,
      completionTimeScore: row.completionTimeScore ?? 0,
      completedAtIso: row.completedAtIso ?? '',
    }));

  // Extract wrong answers from the latest saved challenge attempt per mission
  const latestChallengeAttemptByMission = new Map<string, ReportAttemptInput>();
  const sortedAttempts = [...missionAttempts].sort((a, b) =>
    (b.completedAtIso ?? '').localeCompare(a.completedAtIso ?? '')
  );
  for (const attempt of sortedAttempts) {
    if (attempt.attemptType !== 'challenge') continue;
    const key = attempt.missionId.trim().toLowerCase();
    if (!latestChallengeAttemptByMission.has(key)) {
      latestChallengeAttemptByMission.set(key, attempt);
    }
  }

  const wrongAnswers: WrongAnswerReviewItem[] = [];
  for (const row of missionRecaps) {
    if (!row.isCompleted) continue;
    const latestAttempt = latestChallengeAttemptByMission.get(row.missionId);
    if (!latestAttempt || !Array.isArray(latestAttempt.answersSummary)) {
      continue;
    }

    for (const ans of latestAttempt.answersSummary) {
      if (ans.isCorrect) continue;
      const stemCode = normalizeStemCode(ans.stemCategory);
      wrongAnswers.push({
        id: `${row.missionId}::${ans.questionId}`,
        missionId: row.missionId,
        missionCode: row.missionCode,
        regionId: row.regionId,
        regionName: row.regionName,
        questionId: ans.questionId,
        questionPrompt:
          ans.questionPrompt?.trim() ||
          `Pertanyaan evaluasi sektor ${row.regionName} (${ans.questionId})`,
        stemCategory: stemCode,
        stemLabel: STEM_CATEGORY_LABELS[stemCode],
        difficulty: ans.difficulty || 'sedang',
        selectedOptionId: ans.selectedOptionId,
        selectedOptionText:
          ans.selectedOptionText?.trim() || `Opsi ${ans.selectedOptionId}`,
        correctOptionId: ans.correctOptionId ?? '',
        correctOptionText:
          ans.correctOptionText?.trim() ||
          (ans.correctOptionId ? `Opsi ${ans.correctOptionId}` : 'Terverifikasi pada sesi'),
        explanation:
          ans.explanation?.trim() ||
          'Tinjau ulang prinsip ekologi lahan, parameter lingkungan, dan mekanisme mitigasi pada sektor ini.',
        earnedWeight: ans.earnedWeight,
        maxWeight: ans.maxWeight,
      });
    }
  }

  // Generate personalized learning recommendations based strictly on saved performance data
  const recommendations: LearningRecommendationItem[] = [];
  if (metricSourceRows.length > 0) {
    const stemItems: Array<{
      code: 'S' | 'T' | 'E' | 'M';
      label: string;
      score: number;
      wrongCount: number;
      adviceLow: string;
      adviceStrong: string;
    }> = [
      {
        code: 'S',
        label: 'Science (Sains Ekosistem & Gambut)',
        score: science,
        wrongCount: wrongAnswers.filter((w) => w.stemCategory === 'S').length,
        adviceLow:
          'Perkuat pemahaman hubungan Tinggi Muka Air Tanah (TMAT), sifat hidrofobik gambut kering, dan risiko bara bawah permukaan (smoldering) pada wilayah Kubu Raya dan Ketapang.',
        adviceStrong:
          'Pemahaman sains ekologi tropis Anda sudah kuat; lanjutkan membandingkan respons ekosistem gambut pesisir dengan hutan mineral pedalaman.',
      },
      {
        code: 'T',
        label: 'Technology (Teknologi GIS & Pemantauan)',
        score: technology,
        wrongCount: wrongAnswers.filter((w) => w.stemCategory === 'T').length,
        adviceLow:
          'Latih pembacaan berlapis GeoJSON batas kabupaten, citra satelit/topografi, serta verifikasi silang koordinat titik panas sebelum mengambil keputusan lapangan.',
        adviceStrong:
          'Interpretasi lapisan spasial GIS sudah akurat; pertahankan kebiasaan memvalidasi data sensor sebelum menentukan skenario.',
      },
      {
        code: 'E',
        label: 'Engineering (Rekayasa Mitigasi Karhutla)',
        score: engineering,
        wrongCount: wrongAnswers.filter((w) => w.stemCategory === 'E').length,
        adviceLow:
          'Fokuskan evaluasi pada kesesuaian rekayasa tapak: sekat kanal dan pembasahan gambut khusus untuk kubah gambut, sedangkan sekat bakar disesuaikan dengan lereng dan tanah mineral.',
        adviceStrong:
          'Ketepatan rekayasa mitigasi fisik dan hidrologis sudah konsisten lintas tipe lahan yang berbeda.',
      },
      {
        code: 'M',
        label: 'Mathematics (Pemodelan & Normalisasi Skor)',
        score: mathematics,
        wrongCount: wrongAnswers.filter((w) => w.stemCategory === 'M').length,
        adviceLow:
          'Tinjau ulang perhitungan bobot multi-parameter kerawanan, rasio penurunan indeks risiko, dan konversi laju perambatan api terhadap kecepatan angin serta kemiringan lereng.',
        adviceStrong:
          'Pemodelan kuantitatif dan analisis rasio kerawanan telah dikuasai dengan presisi tinggi.',
      },
    ];
    const stemRanking = [...stemItems].sort(
      (a, b) => a.score - b.score || b.wrongCount - a.wrongCount
    );

    const weakest = stemRanking[0];
    recommendations.push({
      id: `rec-stem-weakest-${weakest.code}`,
      focusArea: `Penguatan Pilar ${weakest.label}`,
      priority: weakest.score < 70 || weakest.wrongCount > 0 ? 'prioritas' : 'penguatan',
      priorityLabel:
        weakest.score < 70 || weakest.wrongCount > 0
          ? 'Prioritas Utama'
          : 'Penguatan Terarah',
      evidenceText: `Skor rata-rata pilar ${weakest.code} tercatat ${weakest.score}/100 dengan ${weakest.wrongCount} jawaban perlu diperbaiki dari sesi tersimpan.`,
      actionableAdvice: weakest.adviceLow,
    });

    const secondWeakest = stemRanking[1];
    if (secondWeakest && (secondWeakest.score < 80 || secondWeakest.wrongCount > 0)) {
      recommendations.push({
        id: `rec-stem-second-${secondWeakest.code}`,
        focusArea: `Pendalaman ${secondWeakest.label}`,
        priority: 'penguatan',
        priorityLabel: 'Penguatan Sektor',
        evidenceText: `Skor pilar ${secondWeakest.code} berada di ${secondWeakest.score}/100 (${secondWeakest.wrongCount} kekeliruan soal).`,
        actionableAdvice: secondWeakest.adviceLow,
      });
    }

    const preventiveWarningMissions = metricSourceRows.filter(
      (r) => r.preventiveReplacementWarning
    );
    const lowDecisionMissions = metricSourceRows
      .filter((r) => (r.decisionScore ?? 0) < 75)
      .sort((a, b) => (a.decisionScore ?? 0) - (b.decisionScore ?? 0));

    if (preventiveWarningMissions.length > 0) {
      recommendations.push({
        id: 'rec-decision-active-fire-boundary',
        focusArea: 'Batas Pencegahan vs Pemadaman Kebakaran Aktif',
        priority: 'prioritas',
        priorityLabel: 'Evaluasi Kritis Keputusan',
        evidenceText: `Terdeteksi pada ${preventiveWarningMissions.map((m) => m.missionCode).join(', ')} pemilihan tindakan pencegahan saat fase api aktif.`,
        actionableAdvice:
          'Ingat prinsip operasional SIAGA KARHUTLA: pembasahan gambut, sekat kanal, sekat bakar, dan patroli bersifat pencegahan prakebakaran dan bukan pengganti respons pemadaman oleh petugas berwenang ketika api sudah menyala.',
      });
    } else if (lowDecisionMissions.length > 0) {
      const target = lowDecisionMissions[0];
      recommendations.push({
        id: 'rec-decision-case-conditions',
        focusArea: 'Kalibrasi Pertimbangan Kondisi Kasus',
        priority: 'penguatan',
        priorityLabel: 'Ketepatan Strategis',
        evidenceText: `Rata-rata ketepatan keputusan ${decisionPrecision}/100; skor terendah terdapat pada ${target.missionCode} (${target.regionName}: ${target.decisionScore}/100).`,
        actionableAdvice:
          'Sebelum mengirim keputusan, periksa seluruh indikator suhu, RH, TMAT gambut, kecepatan angin, dan jarak sumber air agar pemilihan kondisi kasus selaras dengan karakteristik sektor.',
      });
    }

    if (totalScore >= 85 && wrongAnswers.length === 0) {
      recommendations.push({
        id: 'rec-enrichment-mastery',
        focusArea: 'Pengayaan Pemodelan Risiko Sektor Kustom',
        priority: 'pengayaan',
        priorityLabel: 'Pengayaan Lanjutan',
        evidenceText: `Total skor komprehensif mencapai ${totalScore}/100 dengan 0 kekeliruan soal pada 8 misi wajib.`,
        actionableAdvice:
          'Uji sensitivitas bobot parameter secara mandiri pada skenario pemodelan ilmiah untuk mensimulasikan skenario El Niño ekstrem di wilayah Kalimantan Barat.',
      });
    } else if (completionTimeScore < 65) {
      recommendations.push({
        id: 'rec-pacing-accuracy',
        focusArea: 'Keseimbangan Ketelitian Analisis & Durasi Kerja',
        priority: 'penguatan',
        priorityLabel: 'Manajemen Waktu',
        evidenceText: `Skor waktu penyelesaian ternormalisasi tercatat ${completionTimeScore}/100 (total durasi ${formatDurationId(totalElapsedSeconds)}).`,
        actionableAdvice:
          'Pertahankan pembacaan parameter di Ruang Briefing sebelum memulai sesi tantangan agar analisis soal berbobot sulit tetap akurat dalam target waktu ideal.',
      });
    }
  }

  return {
    isUnlocked,
    playerName,
    completedRequiredCount,
    totalRequiredCount,
    totalCompletedMissions: completedAllRows.length,
    totalCorrectQuestions,
    totalAnsweredQuestions,
    metrics: {
      totalScore,
      analysisAccuracy,
      answerAccuracy,
      decisionPrecision,
      completionTimeScore,
      totalElapsedSeconds,
      averageElapsedSeconds,
      formattedTotalElapsedTime: formatDurationId(totalElapsedSeconds),
      formattedAverageElapsedTime: formatDurationId(averageElapsedSeconds),
      science,
      technology,
      engineering,
      mathematics,
      predicate: deriveOverallPredicate(totalScore),
    },
    progressionSeries,
    wrongAnswers,
    recommendations,
    missionRecaps,
    certificate,
  };
}
