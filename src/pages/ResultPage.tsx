import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Compass,
  Cpu,
  FlaskConical,
  Ruler,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { buildSimulationUrl } from '../utils/briefingHelpers';
import {
  INITIAL_SIMULATION_HOTSPOTS,
  resolveEffectiveHotspotRisk,
} from '../utils/gisEngine';
import { findRegionById } from '../utils/regionHelpers';
import {
  getMissionScoringSummary,
  SCORING_ENGINE_UPDATED_EVENT,
  type MissionScoringSummary,
} from '../utils/scoringEngine';
import { MissionStepper } from '../components/layout/MissionStepper';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { NotFoundPage } from './NotFoundPage';
import {
  CERTIFICATE_REQUIRED_MISSIONS,
  useGameProgress,
} from '../context/GameProgressContext';

const REQUIRED_MISSION_ID_SET = new Set(
  CERTIFICATE_REQUIRED_MISSIONS.map((m) => m.missionId)
);

export function ResultPage() {
  const { regionId, missionId: paramMissionId } = useParams<{
    regionId: string;
    missionId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const missionId = paramMissionId ?? searchParams.get('missionId') ?? undefined;
  const region = findRegionById(regionId);
  const { playerProgress, certificate, isAllRequiredCompleted } = useGameProgress();

  const [scoringSummary, setScoringSummary] = useState<MissionScoringSummary | null>(
    () => (region ? getMissionScoringSummary(region.id, missionId) : null)
  );

  useEffect(() => {
    if (!region) {
      setScoringSummary(null);
      return;
    }
    const refresh = () => {
      setScoringSummary(getMissionScoringSummary(region.id, missionId));
    };
    refresh();
    window.addEventListener(SCORING_ENGINE_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(SCORING_ENGINE_UPDATED_EVENT, refresh);
  }, [region, missionId]);

  if (!region) {
    return (
      <NotFoundPage
        title="Laporan Evaluasi Wilayah Tidak Ditemukan"
        message={`Kode wilayah "${regionId ?? ''}" tidak terdaftar dalam laporan evaluasi STEM Kalimantan Barat.`}
      />
    );
  }

  const latestRecord = scoringSummary?.latestRecord ?? null;
  const latestChallenge = scoringSummary?.latestChallenge ?? null;
  const fiveMetrics = scoringSummary?.fiveMetrics ?? null;
  const stemScores = scoringSummary?.stemScores ?? null;
  const hasAnyEvaluation = Boolean(latestRecord || latestChallenge);
  const completedRequiredCount = playerProgress.completedMissionIds.filter((id) =>
    REQUIRED_MISSION_ID_SET.has(id)
  ).length;
  const cleanMissionId = missionId?.trim().toLowerCase() ?? `sim-${region.id}`;
  const matchedHotspot = INITIAL_SIMULATION_HOTSPOTS.find(
    (h) => h.id === cleanMissionId
  );
  const passedByQuiz = Boolean(
    latestChallenge &&
      latestChallenge.questionCount > 0 &&
      Math.round((latestChallenge.correctCount / latestChallenge.questionCount) * 100) >= 70
  );
  const isMissionSafe =
    playerProgress.completedMissionIds.includes(cleanMissionId) || passedByQuiz;
  const effectiveStatus = resolveEffectiveHotspotRisk(
    matchedHotspot?.riskLevel ?? region.status,
    isMissionSafe ? 'selesai' : 'belum-dikerjakan'
  );

  const stemPillars = [
    {
      code: 'S',
      title: 'Science (Sains Lingkungan)',
      focus: region.stemFocus.science,
      score: stemScores?.science ?? null,
      icon: FlaskConical,
    },
    {
      code: 'T',
      title: 'Technology (Teknologi GIS)',
      focus: region.stemFocus.technology,
      score: stemScores?.technology ?? null,
      icon: Cpu,
    },
    {
      code: 'E',
      title: 'Engineering (Rekayasa Mitigasi)',
      focus: region.stemFocus.engineering,
      score: stemScores?.engineering ?? null,
      icon: Wrench,
    },
    {
      code: 'M',
      title: 'Mathematics (Pemodelan & Rasio)',
      focus: region.stemFocus.mathematics,
      score: stemScores?.mathematics ?? null,
      icon: Ruler,
    },
  ];

  const rubricFramework = [
    {
      aspect: 'Akurasi Jawaban Tantangan STEM',
      indicator: latestChallenge
        ? `${latestChallenge.correctCount}/${latestChallenge.questionCount} soal benar (${latestChallenge.earnedWeight}/${latestChallenge.totalWeight} total bobot ternormalisasi)`
        : 'Penilaian soal acak terverifikasi yang dinormalisasi lintas 5, 6, atau 7 soal',
      statusLabel:
        fiveMetrics?.answerAccuracy !== null && fiveMetrics?.answerAccuracy !== undefined
          ? `${fiveMetrics.answerAccuracy}/100`
          : 'Menunggu Tantangan STEM',
    },
    {
      aspect: 'Kualitas Analisis & Pertimbangan Kasus',
      indicator: latestRecord
        ? `Verifikasi ${latestRecord.consideredConditionsCount}/${latestRecord.requiredConditionsCount} kondisi kasus + bobot tingkat kesulitan`
        : 'Kemampuan menganalisis soal sedang/sulit dan kondisi lingkungan spesifik sektor',
      statusLabel:
        fiveMetrics?.analysisQuality !== null && fiveMetrics?.analysisQuality !== undefined
          ? `${fiveMetrics.analysisQuality}/100`
          : 'Menunggu Analisis Misi',
    },
    {
      aspect: 'Ketepatan Keputusan Mitigasi',
      indicator: latestRecord
        ? `Pilihan: ${latestRecord.actionLabel} — ${latestRecord.suitabilityLabel}`
        : 'Kesesuaian sekat bakar, tata air gambut, dan batas pencegahan vs pemadaman aktif',
      statusLabel:
        fiveMetrics?.decisionPrecision !== null &&
        fiveMetrics?.decisionPrecision !== undefined
          ? `${fiveMetrics.decisionPrecision}/100`
          : latestChallenge
            ? 'Tercatat pada kuis'
            : 'Menunggu Penilaian',
    },
    {
      aspect: 'Efektivitas Tindakan dalam Model',
      indicator: latestRecord
        ? latestRecord.preventiveReplacementWarning
          ? 'Peringatan: tindakan pencegahan tidak menggantikan pemadaman aktif'
          : 'Tindakan selaras dengan fase api, jenis lahan, dan hidrologi sektor'
        : 'Dampak simulasi terhadap laju perambatan api dan tinggi muka air gambut',
      statusLabel:
        fiveMetrics?.modelEffectiveness !== null &&
        fiveMetrics?.modelEffectiveness !== undefined
          ? `${fiveMetrics.modelEffectiveness}/100`
          : latestChallenge
            ? 'Tercatat pada kuis'
            : 'Menunggu Penilaian',
    },
    {
      aspect: 'Waktu Penyelesaian Ternormalisasi',
      indicator: latestChallenge
        ? `${latestChallenge.elapsedSeconds} detik (target proporsional ${latestChallenge.targetSeconds} dtk untuk ${latestChallenge.questionCount} soal)`
        : 'Waktu kerja dinormalisasi adil terhadap jumlah soal (5, 6, atau 7)',
      statusLabel:
        fiveMetrics?.completionTime !== null && fiveMetrics?.completionTime !== undefined
          ? `${fiveMetrics.completionTime}/100`
          : 'Menunggu Tantangan STEM',
    },
  ];

  return (
    <div className="pb-16">
      <MissionStepper
        currentStage="hasil"
        regionId={region.id}
        regionName={region.name}
        missionId={missionId}
      />

      <div className="mx-auto max-w-[1280px] px-4 pt-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[#E2E8F0] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#EA580C]">
              Tahap 04 · Refleksi Kompetensi &amp; Hasil Evaluasi
            </p>
            <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl">
              Laporan Evaluasi STEM — {region.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#475569]">
              Ringkasan hasil penilaian untuk mitigasi karhutla di {region.name}.
            </p>
          </div>

          <StatusIndicator status={effectiveStatus} showDescription />
        </div>

        {/* Evaluation Result Card */}
        <section
          aria-label="Hasil Penilaian Misi"
          data-testid="result-scoring-summary"
          className="mt-8 rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 border-b border-[#E2E8F0] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#EA580C]">
                <Award className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#0F172A]">
                  Rekapitulasi Penilaian Sektor
                </h2>
                <p className="mt-0.5 text-xs text-[#475569]">
                  {scoringSummary?.readinessLabel ??
                    'Menunggu Penyelesaian Kuis Titik Api'}
                </p>
              </div>
            </div>

            {hasAnyEvaluation && scoringSummary && (
              <div className="flex items-baseline gap-4 font-mono tabular-nums">
                <div className="text-left sm:text-right">
                  <span className="block text-[11px] text-[#475569]">
                    Skor Gabungan Misi
                  </span>
                  <span className="text-3xl font-bold text-[#0F172A]">
                    {scoringSummary.overallScore}
                  </span>
                  <span className="text-xs text-[#475569]"> / 100</span>
                </div>
                <div className="border-l border-[#E2E8F0] pl-4 text-left sm:text-right">
                  <span className="block text-[11px] text-[#475569]">
                    {latestRecord ? 'Skor Keputusan' : 'Skor Tantangan STEM'}
                  </span>
                  <span className="text-xl font-bold text-[#1E293B]">
                    {latestRecord ? scoringSummary.latestScore : scoringSummary.bestScore}
                  </span>
                  <span className="text-xs text-[#475569]"> / 100</span>
                </div>
              </div>
            )}
          </div>

          {/* 5 Metric Dimensions */}
          {fiveMetrics && (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: 'Akurasi Jawaban',
                  value: fiveMetrics.answerAccuracy,
                  sub: latestChallenge
                    ? `${latestChallenge.correctCount}/${latestChallenge.questionCount} benar`
                    : 'Tantangan STEM',
                },
                {
                  label: 'Kualitas Analisis',
                  value: fiveMetrics.analysisQuality,
                  sub: 'Bobot soal + kondisi',
                },
                {
                  label: 'Ketepatan Keputusan',
                  value: fiveMetrics.decisionPrecision,
                  sub: latestRecord ? latestRecord.suitabilityLabel : 'Evaluasi Misi',
                },
                {
                  label: 'Efektivitas dalam Model',
                  value: fiveMetrics.modelEffectiveness,
                  sub: 'Dampak simulasi',
                },
                {
                  label: 'Waktu Penyelesaian',
                  value: fiveMetrics.completionTime,
                  sub: latestChallenge
                    ? `${latestChallenge.elapsedSeconds}s / ${latestChallenge.targetSeconds}s`
                    : 'Target proporsional',
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5"
                >
                  <p className="text-[11px] font-semibold text-[#475569]">{m.label}</p>
                  <p className="mt-1 font-mono text-xl font-bold text-[#0F172A] tabular-nums">
                    {m.value !== null ? `${m.value}/100` : '—'}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-[#475569]">{m.sub}</p>
                </div>
              ))}
            </div>
          )}

          {!hasAnyEvaluation || !scoringSummary ? (
            <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-extrabold text-[#0F172A]">
                  Belum Ada Hasil Kuis pada Titik Api Ini
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                  Mulai kuis 5–7 soal untuk wilayah {region.name} agar hasil dan
                  pembahasan tercatat di sistem.
                </p>
              </div>
              <Link
                to={buildSimulationUrl(region.id, missionId)}
                className="game-btn-fire inline-flex min-h-[42px] shrink-0 items-center justify-center rounded-xl px-5 py-2 text-xs font-extrabold"
              >
                Mulai Kuis Titik Api
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {latestRecord && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 lg:col-span-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#EA580C]">
                        Tindakan Terakhir Dipilih
                      </span>
                      <span className="font-mono text-[11px] text-[#475569]">
                        Percobaan ke-{scoringSummary.attemptsCount}
                      </span>
                    </div>
                    <p className="mt-1 font-display text-base font-extrabold text-[#0F172A]">
                      {latestRecord.actionLabel}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold">
                      {latestRecord.suitability === 'sangat-sesuai' ? (
                        <CheckCircle2
                          className="h-4 w-4 text-[#059669]"
                          aria-hidden="true"
                        />
                      ) : latestRecord.suitability === 'tidak-sesuai' ? (
                        <ShieldAlert
                          className="h-4 w-4 text-[#DC2626]"
                          aria-hidden="true"
                        />
                      ) : (
                        <AlertTriangle
                          className="h-4 w-4 text-[#D97706]"
                          aria-hidden="true"
                        />
                      )}
                      <span className="text-[#0F172A]">
                        {latestRecord.suitabilityLabel}
                      </span>
                    </div>
                    <p className="mt-2.5 text-xs leading-relaxed text-[#334155]">
                      <strong className="font-bold text-[#0F172A]">
                        Alasan Ilmiah:
                      </strong>{' '}
                      {latestRecord.scientificReasonSummary}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 lg:col-span-6">
                    <p className="text-xs font-bold text-[#0284C7]">
                      Konsekuensi Skenario Simulasi
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#334155]">
                      {latestRecord.simulationConsequenceSummary}
                    </p>
                    {latestRecord.preventiveReplacementWarning && (
                      <p className="mt-2.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[11px] font-bold text-[#991B1B]">
                        Catatan Kritis: Mitigasi pencegahan tidak dapat menggantikan
                        pemadaman kebakaran aktif.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {latestChallenge && (
                <div className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[#065F46]">
                      Ringkasan Kuis Terverifikasi
                    </span>
                    <span className="font-mono text-xs font-bold text-[#0F172A] tabular-nums">
                      {latestChallenge.questionCount} Soal · {latestChallenge.correctCount}{' '}
                      Benar · {latestChallenge.elapsedSeconds}s
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#047857]">
                    Total bobot diperoleh:{' '}
                    <strong className="font-mono text-[#0F172A]">
                      {latestChallenge.earnedWeight} / {latestChallenge.totalWeight}
                    </strong>{' '}
                    (Akurasi ternormalisasi {latestChallenge.normalizedAccuracyScore}/100,
                    Kualitas analisis {latestChallenge.normalizedAnalysisQualityScore}
                    /100, Skor waktu {latestChallenge.completionTimeScore}/100).
                  </p>
                </div>
              )}

              {scoringSummary.history.length > 1 && (
                <div>
                  <h3 className="text-xs font-bold text-[#0F172A]">
                    Riwayat Percobaan Keputusan pada Sektor Ini
                  </h3>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {scoringSummary.history.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.recordId}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#0F172A]">
                            #{scoringSummary.history.length - idx} · {item.actionLabel}
                          </p>
                          <p className="truncate text-[11px] text-[#475569]">
                            {item.suitabilityLabel}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono font-extrabold text-[#059669] tabular-nums">
                          {item.totalScore}/100
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 4 STEM Pillars Grid */}
        <section aria-label="Pilar Evaluasi STEM" className="mt-8">
          <h2 className="font-display text-lg font-extrabold text-[#0F172A]">
            Pemetaan Kompetensi STEM Sektor {region.name}
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            {stemPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={pillar.code}
                  className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F172A] font-display text-sm font-extrabold text-white">
                        {pillar.code}
                      </span>
                      <h3 className="font-display text-base font-extrabold text-[#0F172A]">
                        {pillar.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {pillar.score !== null && (
                        <span className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-0.5 font-mono text-xs font-extrabold text-[#1E293B] tabular-nums">
                          {pillar.score}/100
                        </span>
                      )}
                      <Icon className="h-5 w-5 text-[#EA580C]" aria-hidden="true" />
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[#334155]">
                    {pillar.focus}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Rubric Structure Table */}
        <section
          aria-label="Struktur Rubrik Penilaian Misi"
          className="mt-8 rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-extrabold text-[#0F172A]">
                Kerangka Rubrik 5 Dimensi Penilaian
              </h2>
              <p className="mt-1 text-xs text-[#475569]">
                Rubrik terisi otomatis berdasarkan capaian kuis dan pemetaan kompetensi
                sektor.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-xs font-bold tracking-wide text-[#475569]">
                  <th className="py-3 pr-4">Dimensi Penilaian</th>
                  <th className="px-4 py-3">Indikator Capaian Sektor</th>
                  <th className="py-3 pl-4">Capaian Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {rubricFramework.map((row) => (
                  <tr key={row.aspect}>
                    <td className="py-3.5 pr-4 font-bold text-[#0F172A]">
                      {row.aspect}
                    </td>
                    <td className="px-4 py-3.5 text-[#334155]">{row.indicator}</td>
                    <td className="py-3.5 pl-4 font-mono text-xs font-semibold text-[#1E293B]">
                      {row.statusLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Progres Sertifikasi & Sinkronisasi */}
        <section
          aria-label="Progres Sertifikat SIAGA KARHUTLA"
          className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#CBD5E1] bg-[#F1F5F9] p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-xs font-bold text-[#EA580C]">
              Tersimpan Otomatis di Browser (LocalStorage)
            </p>
            <h2 className="mt-1 font-display text-base font-extrabold text-[#0F172A]">
              Progres Sertifikat: {completedRequiredCount} /{' '}
              {CERTIFICATE_REQUIRED_MISSIONS.length} Misi Wajib Selesai
            </h2>
            <p className="mt-0.5 text-xs text-[#334155]">
              {isAllRequiredCompleted
                ? certificate
                  ? `Seluruh 8/8 titik api selesai (${certificate.certificateNumber}). Sertifikat siap dibuka.`
                  : 'Seluruh 8/8 titik api wajib selesai! Tombol Buka Sertifikat sudah aktif.'
                : 'Selesaikan kuis pada 8 titik api wajib Kalbar untuk mengaktifkan sertifikat.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/evaluasi-stem"
              className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
            >
              <span>Buka Hasil Akhir Misi</span>
            </Link>
            {isAllRequiredCompleted ? (
              <Link
                to="/sertifikat"
                data-testid="result-open-certificate-btn"
                className="game-btn-fire inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold"
              >
                <Award className="h-4 w-4" aria-hidden="true" />
                <span>Buka Sertifikat</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                data-testid="result-open-certificate-disabled-btn"
                className="inline-flex min-h-[42px] shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-[#94A3B8]"
              >
                <Award className="h-4 w-4" aria-hidden="true" />
                <span>Buka Sertifikat (Terkunci)</span>
              </button>
            )}
          </div>
        </section>

        {/* Closing Navigation Actions */}
        <div className="mt-8 flex flex-col gap-3 border-t border-[#E2E8F0] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={buildSimulationUrl(region.id, missionId)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F1F5F9]"
            >
              <ArrowLeft className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
              <span>Kembali ke Kuis Titik Api</span>
            </Link>

            <Link
              to="/"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F1F5F9]"
            >
              Ke Beranda
            </Link>
          </div>

          <Link
            to="/peta-kalbar"
            className="game-btn-fire inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            <span>Pilih Wilayah Misi Lainnya</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
