import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  FlaskConical,
  Lightbulb,
  Loader2,
  Lock,
  Printer,
  Ruler,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useGameProgress } from '../context/GameProgressContext';
import { buildSimulationUrl } from '../utils/briefingHelpers';
import { getStatusPresentation } from '../utils/regionHelpers';
import {
  buildComprehensiveStemReport,
  formatDurationId,
} from '../utils/stemReportEngine';
import { StemProgressionCharts } from '../components/report/StemProgressionCharts';

export function StemEvaluationReportPage() {
  const {
    isReady,
    playerName,
    playerProgress,
    simulationResultsByMission,
    missionAttempts,
    certificate,
  } = useGameProgress();

  const report = useMemo(
    () =>
      buildComprehensiveStemReport({
        playerName,
        simulationResultsByMission,
        missionAttempts,
        playerProgress,
        certificate,
      }),
    [
      certificate,
      missionAttempts,
      playerName,
      playerProgress,
      simulationResultsByMission,
    ]
  );

  if (!isReady) {
    return (
      <div className="py-16">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 rounded-2xl border border-[#CBD5E1] bg-white p-6 text-sm font-semibold text-[#0F172A]">
            <Loader2 className="h-5 w-5 animate-spin text-[#EA580C]" aria-hidden="true" />
            <span>Memuat data evaluasi STEM dan progres misi tersimpan...</span>
          </div>
        </div>
      </div>
    );
  }

  // Locked gate when fewer than all 8 required Kalbar missions are completed
  if (!report.isUnlocked) {
    const completionPct = Math.round(
      (report.completedRequiredCount / Math.max(1, report.totalRequiredCount)) * 100
    );

    return (
      <div className="py-10 sm:py-12">
        <div className="mx-auto max-w-[1280px] space-y-5 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/peta-kalbar"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-[#0F172A] transition-colors hover:bg-[#F1F5F9]"
            >
              <ArrowLeft className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
              <span>Kembali ke Peta Kalbar</span>
            </Link>
          </div>

          <section
            data-testid="stem-report-locked"
            aria-label="Gerbang Hasil Evaluasi STEM Terkunci"
            className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white shadow-md"
          >
            <div className="command-grid-dark border-b border-[#1E293B] bg-[#0F172A] p-6 text-[#F8FAFC] sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-[#F59E0B]/60 bg-[#78350F]/45 px-3 py-1 text-xs font-bold text-[#FCD34D]">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Evaluasi Akhir Terkunci Sebelum 8 Misi Wajib Selesai</span>
                  </div>

                  <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    Hasil Akhir Misi &amp; Evaluasi STEM
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-[#CBD5E1]">
                    Laporan perkembangan kemampuan, ulasan jawaban salah, rekomendasi
                    belajar, dan sertifikat digital terbuka otomatis setelah seluruh{' '}
                    <strong className="text-white">
                      {report.totalRequiredCount} titik api wajib
                    </strong>{' '}
                    Kalimantan Barat diselesaikan.
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2 rounded-xl border border-[#334155] bg-[#1E293B] p-4 lg:min-w-[270px]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    Komandan Misi Aktif
                  </span>
                  <span className="font-display text-sm font-extrabold text-white">
                    {report.playerName}
                  </span>
                  <div className="mt-1 flex w-full items-baseline justify-between border-t border-[#334155] pt-2">
                    <span className="text-xs text-[#CBD5E1]">Progres Misi</span>
                    <span className="font-mono text-sm font-bold text-[#F59E0B] tabular-nums">
                      {report.completedRequiredCount} / {report.totalRequiredCount} Selesai
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0F172A]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#EA580C] to-[#F59E0B] transition-all duration-300"
                      style={{ width: `${Math.max(4, completionPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Required Missions Checklist */}
              <div>
                <h2 className="font-display text-base font-extrabold text-[#0F172A]">
                  Daftar Titik Api Wajib Kalimantan Barat ({report.completedRequiredCount}/
                  {report.totalRequiredCount})
                </h2>
                <p className="mt-1 text-xs text-[#475569]">
                  Setiap titik api dinyatakan berhasil ditangani setelah menyelesaikan kuis
                  5–7 soal dengan minimal 70% jawaban benar.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2">
                  {report.missionRecaps
                    .filter((m) => m.isRequired)
                    .map((mission) => (
                      <article
                        key={mission.missionId}
                        className={`flex flex-col justify-between rounded-xl border p-4 ${
                          mission.isCompleted
                            ? 'border-[#A7F3D0] bg-[#ECFDF5]'
                            : 'border-[#E2E8F0] bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-[11px] font-bold text-[#EA580C]">
                              {mission.missionCode} · {mission.requiredQuestionCount} Soal Kuis
                            </p>
                            <h3 className="mt-0.5 font-display text-base font-extrabold text-[#0F172A]">
                              {mission.regionName}
                            </h3>
                            <p className="mt-0.5 text-xs text-[#475569]">{mission.landType}</p>
                          </div>

                          {mission.isCompleted ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-[#A7F3D0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#059669]">
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Selesai</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#475569]">
                              <Clock className="h-3.5 w-3.5 text-[#EA580C]" aria-hidden="true" />
                              <span>Belum Selesai</span>
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0] pt-3 text-xs">
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#334155]">
                            <span>
                              Kuis:{' '}
                              <strong className="font-mono text-[#0F172A]">
                                {mission.hasChallenge && mission.challengeTotal !== null
                                  ? `${mission.challengeCorrect ?? 0}/${mission.challengeTotal} benar`
                                  : 'Belum'}
                              </strong>
                            </span>
                            {mission.isCompleted && mission.overallScore !== null && (
                              <span className="font-mono font-bold text-[#059669] tabular-nums">
                                Skor {mission.overallScore}/100
                              </span>
                            )}
                          </div>

                          <Link
                            to={buildSimulationUrl(mission.regionId, mission.missionId)}
                            className="inline-flex items-center gap-1 font-bold text-[#EA580C] hover:underline"
                          >
                            <span>
                              {mission.isCompleted ? 'Ulangi Kuis' : 'Mulai Kuis'}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </article>
                    ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-5">
                <Link
                  to="/peta-kalbar"
                  data-testid="locked-back-to-map-btn"
                  className="game-btn-fire inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold"
                >
                  <Compass className="h-4 w-4" aria-hidden="true" />
                  <span>Kembali ke Peta Kalbar</span>
                </Link>

                <Link
                  to="/sertifikat"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F1F5F9]"
                >
                  <Award className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                  <span>Cek Status Sertifikat</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Unlocked State — Full Printable STEM Evaluation Report
  const stemPillars = [
    {
      code: 'S',
      label: 'Performa Science',
      sub: 'Sains Ekosistem Gambut & Kimia Api',
      score: report.metrics.science,
      icon: FlaskConical,
      barColor: '#059669',
    },
    {
      code: 'T',
      label: 'Performa Technology',
      sub: 'Pemetaan GIS & Deteksi Titik Panas',
      score: report.metrics.technology,
      icon: Cpu,
      barColor: '#0284C7',
    },
    {
      code: 'E',
      label: 'Performa Engineering',
      sub: 'Rekayasa Sekat Kanal & Sekat Bakar',
      score: report.metrics.engineering,
      icon: Wrench,
      barColor: '#1E293B',
    },
    {
      code: 'M',
      label: 'Performa Mathematics',
      sub: 'Pemodelan Risiko & Normalisasi Bobot',
      score: report.metrics.mathematics,
      icon: Ruler,
      barColor: '#EA580C',
    },
  ];

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="py-8 sm:py-10 print:bg-white print:py-0">
      <div
        data-testid="stem-report-unlocked"
        className="mx-auto max-w-[1280px] space-y-6 px-4 sm:px-6 lg:px-8 print:max-w-none print:px-0"
      >
        {/* Top Action Bar (hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            to="/peta-kalbar"
            data-testid="report-top-back-to-map-btn"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-[#0F172A] transition-colors hover:bg-[#F1F5F9]"
          >
            <ArrowLeft className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
            <span>Kembali ke Peta Kalbar</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/sertifikat"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-[#0F172A] transition-colors hover:bg-[#F1F5F9]"
            >
              <Award className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
              <span>Halaman Sertifikat</span>
            </Link>
            <button
              type="button"
              data-testid="print-stem-report-btn"
              onClick={() => window.print()}
              className="game-btn-fire inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Report Header & Player Identity */}
        <header className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm sm:p-8 print:border-[#CBD5E1] print-avoid-break">
          <div className="flex flex-col gap-5 border-b border-[#E2E8F0] pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-mono text-xs font-bold tracking-wider text-[#EA580C]">
                LAPORAN HASIL AKHIR MISI · SIAGA KARHUTLA KALIMANTAN BARAT
              </p>
              <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl">
                Hasil Evaluasi STEM &amp; Mitigasi Karhutla
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#475569]">
                Rekapitulasi menyeluruh performa kuis titik api dan penguasaan konsep STEM
                (Science, Technology, Engineering, dan Mathematics) di Provinsi Kalimantan
                Barat.
              </p>
            </div>

            <div className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-left lg:min-w-[290px]">
              <p className="text-[11px] font-bold text-[#1E293B]">
                Identitas Pemain Tercatat
              </p>
              <p
                data-testid="report-player-name"
                className="mt-0.5 font-display text-lg font-extrabold text-[#0F172A]"
              >
                {report.playerName}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0] pt-2 text-[11px] text-[#334155]">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <UserCheck className="h-3.5 w-3.5 text-[#059669]" aria-hidden="true" />
                  <span>Peserta Misi Kalbar</span>
                </span>
                <span className="font-mono">{todayFormatted}</span>
              </div>
            </div>
          </div>

          {/* Primary KPI Summary Grid */}
          <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-xs font-bold text-[#475569]">Jumlah Misi Selesai</p>
              <p
                data-testid="report-missions-completed"
                className="mt-1 font-mono text-2xl font-extrabold text-[#0F172A] tabular-nums"
              >
                {report.completedRequiredCount} / {report.totalRequiredCount}
              </p>
              <p className="mt-1 text-[11px] text-[#475569]">
                {report.totalCompletedMissions > report.completedRequiredCount
                  ? `Total ${report.totalCompletedMissions} sektor (termasuk pengayaan)`
                  : 'Seluruh misi wajib Kalbar selesai'}
              </p>
            </div>

            <div className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-4">
              <p className="text-xs font-bold text-[#059669]">Total Skor</p>
              <p
                data-testid="report-total-score"
                className="mt-1 font-mono text-2xl font-extrabold text-[#0F172A] tabular-nums"
              >
                {report.metrics.totalScore}
                <span className="text-sm font-semibold text-[#475569]"> / 100</span>
              </p>
              <p className="mt-1 text-[11px] font-bold text-[#059669]">
                {report.metrics.predicate.split('—')[0].trim()}
              </p>
            </div>

            <div className="rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-4">
              <p className="text-xs font-bold text-[#0369A1]">Akurasi Analisis</p>
              <p
                data-testid="report-analysis-accuracy"
                className="mt-1 font-mono text-2xl font-extrabold text-[#0F172A] tabular-nums"
              >
                {report.metrics.analysisAccuracy}
                <span className="text-sm font-semibold text-[#475569]"> / 100</span>
              </p>
              <p className="mt-1 text-[11px] text-[#0369A1] tabular-nums">
                {report.totalCorrectQuestions}/{report.totalAnsweredQuestions} soal benar (
                {report.metrics.answerAccuracy}%)
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-xs font-bold text-[#475569]">Ketepatan Keputusan</p>
              <p
                data-testid="report-decision-precision"
                className="mt-1 font-mono text-2xl font-extrabold text-[#0F172A] tabular-nums"
              >
                {report.metrics.decisionPrecision}
                <span className="text-sm font-semibold text-[#475569]"> / 100</span>
              </p>
              <p className="mt-1 text-[11px] text-[#475569]">
                Rata-rata capaian sektor
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-xs font-bold text-[#475569]">Waktu Penyelesaian</p>
              <p
                data-testid="report-completion-time"
                className="mt-1 font-mono text-2xl font-extrabold text-[#0F172A] tabular-nums"
              >
                {report.metrics.formattedTotalElapsedTime}
              </p>
              <p className="mt-1 text-[11px] text-[#475569] tabular-nums">
                Rata-rata {report.metrics.formattedAverageElapsedTime}/misi (skor{' '}
                {report.metrics.completionTimeScore}/100)
              </p>
            </div>
          </div>

          {/* 4 STEM Pillar Performance Cards */}
          <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {stemPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={pillar.code}
                  data-testid={`stem-pillar-card-${pillar.code}`}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg font-display text-xs font-extrabold text-white"
                        style={{ backgroundColor: pillar.barColor }}
                      >
                        {pillar.code}
                      </span>
                      <h2 className="font-display text-sm font-extrabold text-[#0F172A]">
                        {pillar.label}
                      </h2>
                    </div>
                    <Icon className="h-4 w-4 text-[#475569]" aria-hidden="true" />
                  </div>

                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-2xl font-extrabold text-[#0F172A] tabular-nums">
                      {pillar.score}
                      <span className="text-xs font-semibold text-[#475569]"> / 100</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#1E293B]">
                      {pillar.score >= 80
                        ? 'Unggul'
                        : pillar.score >= 70
                          ? 'Terampil'
                          : 'Perlu Penguatan'}
                    </span>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, Math.min(100, pillar.score))}%`,
                        backgroundColor: pillar.barColor,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[#475569]">{pillar.sub}</p>
                </article>
              );
            })}
          </div>
        </header>

        {/* Section 1: Grafik Perkembangan Kemampuan */}
        <section
          aria-label="Grafik Perkembangan Kemampuan"
          data-testid="progression-charts-section"
        >
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
            <h2 className="font-display text-lg font-extrabold text-[#0F172A]">
              1. Grafik Perkembangan Kemampuan &amp; Profil Empat Pilar STEM
            </h2>
          </div>

          <StemProgressionCharts
            progressionSeries={report.progressionSeries}
            stemMetrics={{
              science: report.metrics.science,
              technology: report.metrics.technology,
              engineering: report.metrics.engineering,
              mathematics: report.metrics.mathematics,
            }}
          />
        </section>

        {/* Section 2: Pembahasan Jawaban yang Salah */}
        <section
          aria-label="Pembahasan Jawaban yang Salah"
          data-testid="wrong-answers-section"
          className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm print-avoid-break"
        >
          <div className="flex flex-col gap-2 border-b border-[#E2E8F0] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-5 w-5 text-[#EA580C]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#0F172A]">
                  2. Pembahasan Jawaban yang Salah
                </h2>
                <p className="text-xs text-[#475569]">
                  Ulasan soal dari sesi terakhir masing-masing misi yang jawabannya perlu
                  diperbaiki beserta penjelasan ilmiahnya
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-[#0F172A] tabular-nums">
              {report.wrongAnswers.length} Jawaban Salah dari{' '}
              {report.totalAnsweredQuestions} Soal
            </span>
          </div>

          {report.wrongAnswers.length === 0 ? (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-4 text-xs text-[#059669]">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#059669]" aria-hidden="true" />
              <div>
                <p className="font-extrabold text-[#0F172A]">
                  Tidak Ada Jawaban Salah pada Sesi Tantangan Terakhir
                </p>
                <p className="mt-1 leading-relaxed text-[#065F46]">
                  Seluruh {report.totalAnsweredQuestions} pertanyaan tantangan STEM di{' '}
                  {report.totalCompletedMissions} misi yang diselesaikan terjawab dengan
                  tepat sesuai kunci jawaban resmi.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {report.wrongAnswers.map((item, idx) => (
                <article
                  key={item.id}
                  data-testid={`wrong-answer-item-${idx}`}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5 print-avoid-break"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-[#EA580C]">
                        #{idx + 1} · {item.missionCode} ({item.regionName})
                      </span>
                      <span className="rounded-md border border-[#CBD5E1] bg-white px-2 py-0.5 text-[11px] font-bold text-[#0F172A]">
                        {item.stemLabel}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#475569] tabular-nums">
                      Kesulitan: {item.difficulty} · Bobot: 0/{item.maxWeight}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-bold leading-relaxed text-[#0F172A]">
                    {item.questionPrompt}
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs">
                      <p className="inline-flex items-center gap-1.5 font-bold text-[#991B1B]">
                        <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Jawaban Anda (Belum Tepat)</span>
                      </p>
                      <p className="mt-1 text-[#7F1D1D]">{item.selectedOptionText}</p>
                    </div>

                    <div className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] p-3 text-xs">
                      <p className="inline-flex items-center gap-1.5 font-bold text-[#059669]">
                        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Jawaban Tepat</span>
                      </p>
                      <p className="mt-1 text-[#065F46]">{item.correctOptionText}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-[#E2E8F0] bg-white p-3 text-xs leading-relaxed text-[#334155]">
                    <strong className="font-bold text-[#0F172A]">
                      Pembahasan Ilmiah:
                    </strong>{' '}
                    {item.explanation}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Section 3: Rekomendasi Pembelajaran */}
        <section
          aria-label="Rekomendasi Pembelajaran"
          data-testid="learning-recommendations-section"
          className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm print-avoid-break"
        >
          <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-4">
            <Lightbulb className="h-5 w-5 text-[#F59E0B]" aria-hidden="true" />
            <div>
              <h2 className="font-display text-lg font-extrabold text-[#0F172A]">
                3. Rekomendasi Pembelajaran Personalisasi
              </h2>
              <p className="text-xs text-[#475569]">
                Disusun otomatis berdasarkan analisis skor S-T-E-M dan kesalahan jawaban
                pada tiap sektor
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {report.recommendations.map((rec) => {
              const priorityBadgeClass =
                rec.priority === 'prioritas'
                  ? 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]'
                  : rec.priority === 'pengayaan'
                    ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#059669]'
                    : 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]';

              return (
                <article
                  key={rec.id}
                  className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 print-avoid-break"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${priorityBadgeClass}`}
                      >
                        <Target className="h-3 w-3" aria-hidden="true" />
                        <span>{rec.priorityLabel}</span>
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-sm font-extrabold text-[#0F172A]">
                      {rec.focusArea}
                    </h3>
                    <p className="mt-1.5 text-xs font-semibold text-[#1E293B]">
                      {rec.evidenceText}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[#334155]">
                      {rec.actionableAdvice}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Section 4: Rekapitulasi Seluruh Misi */}
        <section
          aria-label="Rekapitulasi Seluruh Misi"
          data-testid="mission-recap-table"
          className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-2 border-b border-[#E2E8F0] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-extrabold text-[#0F172A]">
                4. Rekapitulasi Seluruh Misi Kalimantan Barat
              </h2>
              <p className="text-xs text-[#475569]">
                Rincian skor tantangan kuis, waktu penyelesaian, dan profil S-T-E-M pada
                setiap wilayah
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#059669] tabular-nums">
              {report.totalCompletedMissions} Misi Tercatat
            </span>
          </div>

          <div className="mt-4 overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[780px] border-collapse text-left text-xs print:min-w-0">
              <thead>
                <tr className="border-b border-[#CBD5E1] bg-[#F1F5F9] text-[11px] font-bold text-[#475569]">
                  <th className="px-3 py-2.5">Misi &amp; Wilayah</th>
                  <th className="px-3 py-2.5">Status &amp; Ekosistem</th>
                  <th className="px-3 py-2.5">Keputusan Mitigasi</th>
                  <th className="px-3 py-2.5">Tantangan &amp; Waktu</th>
                  <th className="px-3 py-2.5">S / T / E / M</th>
                  <th className="px-3 py-2.5 text-right">Skor Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {report.missionRecaps.map((row) => (
                  <tr key={row.missionId} className="align-top">
                    <td className="px-3 py-3">
                      <p className="font-mono text-[11px] font-bold text-[#EA580C]">
                        {row.missionCode}
                      </p>
                      <p className="font-bold text-[#0F172A]">{row.regionName}</p>
                    </td>
                    <td className="px-3 py-3 text-[#334155]">
                      <p className="font-bold text-[#0F172A]">
                        {getStatusPresentation(row.riskLevel).label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#475569]">{row.landType}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-[#0F172A]">
                        {row.decisionActionLabel ?? '—'}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-[#475569] tabular-nums">
                        {row.decisionSuitabilityLabel ?? '—'} ·{' '}
                        {row.decisionScore !== null ? `${row.decisionScore}/100` : '—'}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-[#0F172A] tabular-nums">
                      <p>
                        {row.challengeCorrect ?? 0}/{row.challengeTotal ?? 0} benar (
                        {row.analysisAccuracy ?? 0}/100)
                      </p>
                      <p className="mt-0.5 text-[#475569]">
                        Durasi:{' '}
                        {row.elapsedSeconds !== null
                          ? formatDurationId(row.elapsedSeconds)
                          : '—'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] text-[#0F172A] tabular-nums">
                      {row.stemScores
                        ? `${row.stemScores.science} / ${row.stemScores.technology} / ${row.stemScores.engineering} / ${row.stemScores.mathematics}`
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-sm font-extrabold text-[#059669] tabular-nums">
                      {row.overallScore !== null ? `${row.overallScore}/100` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Sertifikat Digital */}
        <section
          aria-label="Sertifikat Digital"
          data-testid="digital-certificate-section"
          className="rounded-2xl border-2 border-[#0F172A] bg-white p-6 shadow-md sm:p-8 print-avoid-break"
        >
          <div className="flex flex-col gap-3 border-b border-[#E2E8F0] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs font-bold tracking-wider text-[#EA580C]">
                5. SERTIFIKAT DIGITAL SIAGA KARHUTLA
              </p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-[#0F172A]">
                Pengakuan Kompetensi Mitigasi Kebakaran Hutan &amp; Lahan
              </h2>
            </div>

            <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1.5 font-mono text-xs font-bold text-[#059669]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>8 / 8 MISI WAJIB TERPENUHI</span>
            </span>
          </div>

          <div
            data-testid="embedded-digital-certificate"
            className="mt-5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-6 sm:p-8"
          >
            <p className="text-xs font-semibold text-[#475569]">
              Diberikan kepada peserta program simulasi mitigasi karhutla Kalbar:
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold text-[#0F172A] sm:text-3xl">
              {report.playerName}
            </p>
            <p className="mt-0.5 font-mono text-xs text-[#475569]">
              Peserta Mitigasi Kebakaran Hutan &amp; Lahan · Kalimantan Barat
            </p>

            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#334155]">
              Telah menyelesaikan seluruh{' '}
              <strong>{report.totalRequiredCount} misi wajib</strong> pemodelan
              kerawanan dan tantangan kuis mitigasi secara resmi di wilayah Provinsi
              Kalimantan Barat.
            </p>

            <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-[#E2E8F0] pt-5 sm:grid-cols-3">
              <div className="rounded-xl border border-[#CBD5E1] bg-white p-3.5">
                <dt className="text-[11px] font-semibold text-[#475569]">
                  Skor Akhir Rata-Rata
                </dt>
                <dd className="mt-1 font-mono text-xl font-extrabold text-[#0F172A] tabular-nums">
                  {report.certificate?.averageScore ?? report.metrics.totalScore} / 100
                </dd>
              </div>
              <div className="rounded-xl border border-[#CBD5E1] bg-white p-3.5">
                <dt className="text-[11px] font-semibold text-[#475569]">Predikat</dt>
                <dd className="mt-1 text-xs font-extrabold text-[#059669]">
                  {report.certificate?.predicate ?? report.metrics.predicate}
                </dd>
              </div>
              <div className="rounded-xl border border-[#CBD5E1] bg-white p-3.5">
                <dt className="text-[11px] font-semibold text-[#475569]">
                  Nomor &amp; Tanggal Terbit
                </dt>
                <dd className="mt-1 font-mono text-xs font-bold text-[#0F172A]">
                  {report.certificate?.certificateNumber ?? 'SKH-2026-TERVERIFIKASI'}
                </dd>
                <dd className="mt-0.5 text-[11px] text-[#475569]">
                  {new Date(
                    report.certificate?.issuedAtIso ?? Date.now()
                  ).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col gap-3 border-t border-[#E2E8F0] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-[#475569]">
                Status: Tervalidasi selesai 8/8 misi SIAGA KARHUTLA Kalimantan Barat
              </p>
              <Link
                to="/sertifikat"
                data-testid="report-open-certificate-btn"
                className="game-btn-fire inline-flex min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold print:hidden"
              >
                <Award className="h-4 w-4" aria-hidden="true" />
                <span>Buka &amp; Cetak Sertifikat</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom Navigation & Print Actions (hidden when printing) */}
        <footer className="flex flex-col gap-3 border-t border-[#E2E8F0] pt-6 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/peta-kalbar"
              data-testid="report-back-to-map-btn"
              className="game-btn-fire inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              <span>Kembali ke Peta Kalbar</span>
            </Link>

            <Link
              to="/sertifikat"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F1F5F9]"
            >
              <Award className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
              <span>Verifikasi Sertifikat</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="game-btn-forest inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span>Cetak / Simpan Laporan PDF</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
