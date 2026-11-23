import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Flame,
  Info,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { RegionProfile } from '../../types/mission';
import { buildResultUrl } from '../../utils/briefingHelpers';
import {
  evaluateMitigationDecision,
  getFirePhasePresentation,
  getMissionDecisionContext,
  MITIGATION_ACTION_LIST,
  type DecisionEvaluationResult,
} from '../../utils/decisionEngine';
import type { RiskEvaluationResult } from '../../utils/riskEngine';
import {
  getMissionScoringSummary,
  SCORING_ENGINE_UPDATED_EVENT,
  type ActionSuitabilityLevel,
  type MissionScoringSummary,
  type MitigationActionId,
} from '../../utils/scoringEngine';
import { useGameProgress } from '../../context/GameProgressContext';

interface DecisionEnginePanelProps {
  region: RegionProfile;
  missionId?: string;
  liveRiskEvaluation?: RiskEvaluationResult | null;
}

const SUITABILITY_STYLE: Record<
  ActionSuitabilityLevel,
  { textClass: string; surfaceClass: string; borderClass: string }
> = {
  'sangat-sesuai': {
    textClass: 'text-[#047857]',
    surfaceClass: 'bg-[#ECFDF5]',
    borderClass: 'border-[#A7F3D0]',
  },
  'sesuai-bersyarat': {
    textClass: 'text-[#14452F]',
    surfaceClass: 'bg-[#EBF2EE]',
    borderClass: 'border-[#B7C9BE]',
  },
  'kurang-tepat': {
    textClass: 'text-[#B45309]',
    surfaceClass: 'bg-[#FFFBEB]',
    borderClass: 'border-[#FDE68A]',
  },
  'tidak-sesuai': {
    textClass: 'text-[#B91C1C]',
    surfaceClass: 'bg-[#FEF2F2]',
    borderClass: 'border-[#FECACA]',
  },
};

const OUTCOME_STYLE: Record<
  'positif' | 'parsial' | 'negatif',
  { label: string; textClass: string; surfaceClass: string; borderClass: string }
> = {
  positif: {
    label: 'Dampak Simulasi Terkendali',
    textClass: 'text-[#047857]',
    surfaceClass: 'bg-[#ECFDF5]',
    borderClass: 'border-[#A7F3D0]',
  },
  parsial: {
    label: 'Dampak Simulasi Parsial',
    textClass: 'text-[#B45309]',
    surfaceClass: 'bg-[#FFFBEB]',
    borderClass: 'border-[#FDE68A]',
  },
  negatif: {
    label: 'Eskalasi Risiko Simulasi',
    textClass: 'text-[#B91C1C]',
    surfaceClass: 'bg-[#FEF2F2]',
    borderClass: 'border-[#FECACA]',
  },
};

export function DecisionEnginePanel({
  region,
  missionId,
  liveRiskEvaluation,
}: DecisionEnginePanelProps) {
  const decisionContext = useMemo(
    () => getMissionDecisionContext(region.id, missionId, liveRiskEvaluation),
    [region.id, missionId, liveRiskEvaluation]
  );

  const phasePresentation = useMemo(
    () => getFirePhasePresentation(decisionContext.firePhase),
    [decisionContext.firePhase]
  );

  const [selectedActionId, setSelectedActionId] = useState<MitigationActionId | null>(
    null
  );
  const [selectedConsiderationIds, setSelectedConsiderationIds] = useState<string[]>(
    []
  );
  const [rationaleNote, setRationaleNote] = useState('');
  const [evaluationResult, setEvaluationResult] =
    useState<DecisionEvaluationResult | null>(null);
  const [scoringSummary, setScoringSummary] = useState<MissionScoringSummary>(() =>
    getMissionScoringSummary(region.id, decisionContext.missionId)
  );
  const outputRef = useRef<HTMLDivElement | null>(null);
  const { recordDecisionEvaluation } = useGameProgress();

  // Reset pilihan & sinkronkan riwayat tersimpan saat berpindah wilayah atau saat state dipulihkan
  useEffect(() => {
    setSelectedActionId(null);
    setSelectedConsiderationIds([]);
    setRationaleNote('');
    setEvaluationResult(null);
    const refresh = () => {
      setScoringSummary(
        getMissionScoringSummary(region.id, decisionContext.missionId)
      );
    };
    refresh();
    window.addEventListener(SCORING_ENGINE_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(SCORING_ENGINE_UPDATED_EVENT, refresh);
  }, [region.id, decisionContext.missionId]);

  const toggleConsideration = (id: string) => {
    setSelectedConsiderationIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmitDecision = () => {
    if (!selectedActionId) {
      return;
    }
    const result = evaluateMitigationDecision(decisionContext, {
      actionId: selectedActionId,
      selectedConsiderationIds,
      playerRationaleNote: rationaleNote,
    });
    setEvaluationResult(result);
    setScoringSummary(result.scoringReceipt.missionSummary);
    void recordDecisionEvaluation(result);
    window.requestAnimationFrame(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleResetSelection = () => {
    setSelectedActionId(null);
    setSelectedConsiderationIds([]);
    setRationaleNote('');
    setEvaluationResult(null);
  };

  const env = decisionContext.environmentalConditions;

  return (
    <section
      id="panel-keputusan-mitigasi"
      aria-label="Panel Decision Engine Mitigasi Karhutla"
      className="mt-8 rounded-xl border border-[#DCE3DE] bg-white p-6"
    >
      {/* Header Panel */}
      <div className="flex flex-col gap-4 border-b border-[#DCE3DE] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#14452F]">
            <Compass className="h-4 w-4" aria-hidden="true" />
            <span>
              Decision Engine · {decisionContext.missionCode} ({region.name})
            </span>
          </div>
          <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight text-[#0D2818] sm:text-2xl">
            Panel Pemilihan Tindakan Mitigasi — {decisionContext.scenarioTitle}
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#4A5D52]">
            Tentukan strategi mitigasi yang sesuai dengan kondisi lingkungan, jenis
            lahan, fase kebakaran, dan tujuan penanganan misi sebelum mengirimkan hasil
            ke Scoring Engine.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end shrink-0">
          <span
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold ${phasePresentation.badgeClass}`}
          >
            {decisionContext.firePhase === 'kebakaran-aktif' ? (
              <Flame className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : decisionContext.firePhase === 'siaga-kritis-tanpa-api' ? (
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{decisionContext.firePhaseLabel}</span>
          </span>

          {scoringSummary.attemptsCount > 0 && (
            <span
              data-testid="scoring-engine-badge"
              className="font-mono text-[11px] font-medium text-[#14452F]"
            >
              Scoring Engine: Skor Terakhir {scoringSummary.latestScore}/100 · Terbaik{' '}
              {scoringSummary.bestScore}/100 ({scoringSummary.attemptsCount} percobaan)
            </span>
          )}
        </div>
      </div>

      {/* Konteks Kasus Misi (Kondisi Lingkungan, Jenis Lahan, Tujuan Penanganan) */}
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-[#DCE3DE] bg-[#F6F8F6] p-5 lg:grid-cols-12">
        <div className="space-y-2.5 lg:col-span-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-[#DCE3DE] bg-white px-2.5 py-1 text-xs font-semibold text-[#0D2818]">
              Jenis Lahan: {decisionContext.landType}
            </span>
            {decisionContext.liveRiskScore !== null && (
              <span className="rounded-md border border-[#DCE3DE] bg-white px-2.5 py-1 font-mono text-xs font-semibold text-[#14452F] tabular-nums">
                Risk Engine: {decisionContext.liveRiskScore.toFixed(1)} (
                {decisionContext.liveRiskCategoryLabel})
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#14452F]">
              Tujuan Penanganan Misi
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[#0D2818]">
              {decisionContext.handlingObjective}
            </p>
          </div>
          <p className="text-xs leading-relaxed text-[#4A5D52]">
            {decisionContext.firePhaseDescription}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:col-span-6">
          <div className="rounded-lg border border-[#DCE3DE] bg-white p-3">
            <p className="text-[11px] text-[#4A5D52]">Suhu / RH</p>
            <p className="mt-0.5 font-mono text-xs font-bold text-[#0D2818] tabular-nums">
              {env.airTemperatureC} °C / {env.airHumidityPct}%
            </p>
          </div>
          <div className="rounded-lg border border-[#DCE3DE] bg-white p-3">
            <p className="text-[11px] text-[#4A5D52]">Curah Hujan</p>
            <p className="mt-0.5 font-mono text-xs font-bold text-[#0D2818] tabular-nums">
              {env.rainfallMm} mm/hari
            </p>
          </div>
          <div className="rounded-lg border border-[#DCE3DE] bg-white p-3">
            <p className="text-[11px] text-[#4A5D52]">
              {env.hasPeatSoil ? 'Kelembapan Gambut' : 'Vegetasi / Tanah'}
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold text-[#0D2818] tabular-nums">
              {env.hasPeatSoil
                ? `${env.peatMoisturePct}% (TMAT ${env.waterTableDepthCm ?? '-'} cm)`
                : `Veg. ${env.vegetationConditionPct}% (Mineral)`}
            </p>
          </div>
          <div className="rounded-lg border border-[#DCE3DE] bg-white p-3">
            <p className="text-[11px] text-[#4A5D52]">Angin Dominan</p>
            <p className="mt-0.5 font-mono text-xs font-bold text-[#0D2818] tabular-nums">
              {env.windSpeedKmh} km/jam
            </p>
          </div>
          <div className="rounded-lg border border-[#DCE3DE] bg-white p-3">
            <p className="text-[11px] text-[#4A5D52]">Kemiringan Lereng</p>
            <p className="mt-0.5 font-mono text-xs font-bold text-[#0D2818] tabular-nums">
              {env.slopePct}%
            </p>
          </div>
          <div className="rounded-lg border border-[#DCE3DE] bg-white p-3">
            <p className="text-[11px] text-[#4A5D52]">Jarak Sumber Air</p>
            <p className="mt-0.5 font-mono text-xs font-bold text-[#0D2818] tabular-nums">
              {env.distanceToWaterSourceKm} km
            </p>
          </div>
        </div>
      </div>

      {/* Prinsip Batas Mitigasi Pencegahan vs Pemadaman Aktif */}
      <div
        role="note"
        aria-label="Prinsip Batas Pencegahan dan Pemadaman Aktif"
        className="mt-4 flex items-start gap-2.5 rounded-lg border border-[#DCE3DE] bg-white px-4 py-3 text-xs leading-relaxed text-[#33463B]"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#14452F]" aria-hidden="true" />
        <span>
          <strong className="font-semibold text-[#0D2818]">
            Prinsip Operasional:
          </strong>{' '}
          Tindakan mitigasi pencegahan (pembasahan kembali gambut, sekat kanal, sekat
          bakar, serta pemantauan dan pelaporan) berfungsi menurunkan kerawanan sebelum
          api menyala dan{' '}
          <strong className="font-semibold text-[#0D2818]">
            bukan pengganti respons pemadaman kebakaran aktif
          </strong>{' '}
          oleh petugas yang berwenang.
        </span>
      </div>

      {/* Workspace 2 Kolom: Kiri Pemilihan & Kondisi, Kanan Output Evaluasi & Scoring */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Kiri (6 col): Pilih Tindakan + Pertimbangan Kondisi Kasus */}
        <div className="space-y-6 lg:col-span-6">
          <div>
            <h3 className="font-display text-base font-bold text-[#0D2818]">
              1. Pilih Tindakan Mitigasi Utama
            </h3>
            <p className="mt-1 text-xs text-[#4A5D52]">
              Pilih salah satu dari lima tindakan berikut sesuai kondisi sektor{' '}
              {region.name}.
            </p>

            <div className="mt-3 space-y-2.5">
              {MITIGATION_ACTION_LIST.map((action) => {
                const isSelected = selectedActionId === action.id;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => setSelectedActionId(action.id)}
                    aria-pressed={isSelected}
                    className={`w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14452F] ${
                      isSelected
                        ? 'border-[#14452F] bg-[#EBF2EE]'
                        : 'border-[#DCE3DE] bg-[#F6F8F6] hover:bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold text-[#0D2818]">
                        {action.label}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                          action.isPreventive
                            ? 'border-[#DCE3DE] bg-white text-[#14452F]'
                            : 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
                        }`}
                      >
                        {action.roleCategoryLabel}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#4A5D52]">
                      {action.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pertimbangan Kondisi Kasus */}
          <div className="rounded-xl border border-[#DCE3DE] bg-[#F6F8F6] p-5">
            <div className="flex items-center gap-2">
              <ClipboardCheck
                className="h-4 w-4 text-[#14452F]"
                aria-hidden="true"
              />
              <h3 className="font-display text-base font-bold text-[#0D2818]">
                2. Verifikasi Pertimbangan Kondisi Kasus
              </h3>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#4A5D52]">
              Skor keputusan tidak diberikan nilai sempurna hanya dari pilihan tindakan;
              tandai kondisi lapangan yang benar-benar relevan untuk kasus ini dan hindari
              asumsi yang keliru.
            </p>

            <div className="mt-3.5 space-y-2.5">
              {decisionContext.caseConsiderations.map((item) => {
                const checked = selectedConsiderationIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      checked
                        ? 'border-[#14452F] bg-white'
                        : 'border-[#DCE3DE] bg-white/70 hover:bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleConsideration(item.id)}
                      className="mt-1 h-4 w-4 rounded border-[#8EA096] text-[#14452F] accent-[#14452F]"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0D2818]">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#4A5D52]">
                        {item.detail}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-4">
              <label
                htmlFor="decision-rationale-note"
                className="block text-xs font-semibold text-[#0D2818]"
              >
                Catatan Alasan Strategis Pemain (Opsional)
              </label>
              <textarea
                id="decision-rationale-note"
                rows={2}
                value={rationaleNote}
                onChange={(e) => setRationaleNote(e.target.value)}
                placeholder="Ringkas alasan pemilihan tindakan berdasarkan kondisi sektor..."
                className="mt-1.5 w-full rounded-lg border border-[#DCE3DE] bg-white px-3 py-2 text-xs text-[#0D2818] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#14452F]"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={!selectedActionId}
                onClick={handleSubmitDecision}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#14452F] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0D2818] disabled:cursor-not-allowed disabled:bg-[#8EA096]"
              >
                <span>Evaluasi Keputusan &amp; Kirim ke Scoring Engine</span>
              </button>

              <button
                type="button"
                onClick={handleResetSelection}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#DCE3DE] bg-white px-3.5 py-2.5 text-xs font-medium text-[#0D2818] transition-colors hover:bg-[#EBF2EE]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kanan (6 col): Hasil Evaluasi Decision Engine (5 Langkah) */}
        <div ref={outputRef} className="scroll-mt-20 space-y-5 lg:col-span-6">
          {!evaluationResult ? (
            scoringSummary.latestRecord ? (
              <div
                data-testid="decision-restored-summary"
                className="flex flex-col gap-4 rounded-xl border border-[#B7C9BE] bg-[#EBF2EE] p-6"
              >
                <div>
                  <p className="font-mono text-xs font-semibold text-[#14452F]">
                    DATA KEPUTUSAN DIPULIHKAN
                  </p>
                  <h3 className="mt-1.5 font-display text-lg font-bold text-[#0D2818]">
                    Keputusan Terakhir Tersimpan ({scoringSummary.latestRecord.actionLabel}
                    , Skor {scoringSummary.latestRecord.totalScore}/100)
                  </h3>
                  <p className="mt-2 text-xs font-semibold text-[#14452F]">
                    Status Kesesuaian: {scoringSummary.latestRecord.suitabilityLabel} ·
                    Skor Terbaik {scoringSummary.bestScore}/100 ({scoringSummary.attemptsCount}{' '}
                    percobaan)
                  </p>
                  <p className="mt-3 rounded-lg border border-[#DCE3DE] bg-white p-3.5 text-xs leading-relaxed text-[#24382D]">
                    <strong className="font-semibold text-[#0D2818]">
                      Alasan Ilmiah Tersimpan:
                    </strong>{' '}
                    {scoringSummary.latestRecord.scientificReasonSummary}
                  </p>
                  <p className="mt-2.5 rounded-lg border border-[#DCE3DE] bg-white p-3.5 text-xs leading-relaxed text-[#24382D]">
                    <strong className="font-semibold text-[#0D2818]">
                      Konsekuensi Model:
                    </strong>{' '}
                    {scoringSummary.latestRecord.simulationConsequenceSummary}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#B7C9BE] pt-4">
                  <span className="text-[11px] text-[#33463B]">
                    Anda tetap dapat memilih tindakan baru di sebelah kiri untuk menguji
                    skenario ulang.
                  </span>
                  <Link
                    to={buildResultUrl(region.id, missionId)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#14452F] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0D2818]"
                  >
                    <span>Lihat di Evaluasi STEM</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col justify-center rounded-xl border border-dashed border-[#B7C9BE] bg-[#F6F8F6] p-8 text-center">
                <p className="font-display text-base font-bold text-[#0D2818]">
                  Belum Ada Keputusan Dievaluasi pada Sesi Ini
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[#4A5D52]">
                  Pilih salah satu dari 5 tindakan mitigasi di sebelah kiri, tinjau
                  pertimbangan kondisi kasus di {region.name}, lalu tekan{' '}
                  <strong className="font-semibold text-[#0D2818]">
                    Evaluasi Keputusan &amp; Kirim ke Scoring Engine
                  </strong>{' '}
                  untuk melihat pemeriksaan kesesuaian, alasan ilmiah, konsekuensi
                  simulasi, dan rincian skor.
                </p>
              </div>
            )
          ) : (
            <div
              data-testid="decision-evaluation-output"
              className="space-y-5"
            >
              {/* 1 & 4. Kesesuaian Tindakan & Skor Keputusan */}
              <div className="rounded-xl border border-[#DCE3DE] bg-[#F6F8F6] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#14452F]">
                      1. Pemeriksaan Kesesuaian &amp; 4. Skor Keputusan
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold text-[#0D2818]">
                      {evaluationResult.selectedAction.label}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <span
                      data-testid="decision-score-value"
                      className="font-mono text-3xl font-bold text-[#0D2818] tabular-nums"
                    >
                      {evaluationResult.decisionScore.totalScore}
                    </span>
                    <span className="font-mono text-sm text-[#4A5D52]"> / 100</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold ${
                      SUITABILITY_STYLE[evaluationResult.suitability.level].surfaceClass
                    } ${
                      SUITABILITY_STYLE[evaluationResult.suitability.level].borderClass
                    } ${
                      SUITABILITY_STYLE[evaluationResult.suitability.level].textClass
                    }`}
                  >
                    {evaluationResult.suitability.level === 'sangat-sesuai' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : evaluationResult.suitability.level === 'tidak-sesuai' ? (
                      <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>{evaluationResult.suitability.label}</span>
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#24382D]">
                  {evaluationResult.suitability.summary}
                </p>

                {evaluationResult.suitability
                  .isPreventiveNotReplacementForActiveFire && (
                  <div
                    role="alert"
                    className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs font-medium text-[#B91C1C]"
                  >
                    {
                      evaluationResult.scientificAnalysis
                        .preventiveVsActiveClarification
                    }
                  </div>
                )}

                {evaluationResult.decisionScore.capReason && (
                  <div
                    role="note"
                    className="mt-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3 text-xs font-medium text-[#92400E]"
                  >
                    {evaluationResult.decisionScore.capReason}
                  </div>
                )}

                {/* Rincian Poin */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono text-xs tabular-nums">
                  <div className="rounded-lg border border-[#DCE3DE] bg-white p-2.5">
                    <p className="text-[11px] text-[#4A5D52]">Kesesuaian</p>
                    <p className="mt-0.5 font-bold text-[#0D2818]">
                      +{evaluationResult.decisionScore.breakdown.actionSuitabilityPoints}
                      /60
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#DCE3DE] bg-white p-2.5">
                    <p className="text-[11px] text-[#4A5D52]">Kondisi Kasus</p>
                    <p className="mt-0.5 font-bold text-[#0D2818]">
                      +{evaluationResult.decisionScore.breakdown.caseConditionPoints}
                      /40
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#DCE3DE] bg-white p-2.5">
                    <p className="text-[11px] text-[#4A5D52]">Penalti</p>
                    <p className="mt-0.5 font-bold text-[#B91C1C]">
                      -{evaluationResult.decisionScore.breakdown.penaltyPoints}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Alasan Ilmiah */}
              <div className="rounded-xl border border-[#DCE3DE] bg-white p-5">
                <h4 className="font-display text-sm font-bold text-[#0D2818]">
                  2. Alasan Ilmiah &amp; Kesesuaian Ekosistem
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-[#24382D]">
                  {evaluationResult.scientificAnalysis.caseSpecificReasoning}
                </p>
                <p className="mt-2 rounded-lg border border-[#DCE3DE] bg-[#F6F8F6] p-3 text-[11px] leading-relaxed text-[#33463B]">
                  <strong className="font-semibold text-[#0D2818]">
                    Mekanisme Dasar:
                  </strong>{' '}
                  {evaluationResult.scientificAnalysis.actionMechanism}
                </p>

                {evaluationResult.scientificAnalysis.riskGaps.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-[#B45309]">
                      Catatan Celah &amp; Kondisi yang Perlu Diperhatikan:
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-[#4A5D52]">
                      {evaluationResult.scientificAnalysis.riskGaps.map((gap) => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 3. Konsekuensi dalam Skenario Simulasi */}
              <div className="rounded-xl border border-[#DCE3DE] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-display text-sm font-bold text-[#0D2818]">
                    3. Konsekuensi dalam Skenario Simulasi
                  </h4>
                  <span
                    className={`rounded-md border px-2.5 py-0.5 text-[11px] font-semibold ${
                      OUTCOME_STYLE[evaluationResult.simulationConsequence.outcomeTier]
                        .surfaceClass
                    } ${
                      OUTCOME_STYLE[evaluationResult.simulationConsequence.outcomeTier]
                        .borderClass
                    } ${
                      OUTCOME_STYLE[evaluationResult.simulationConsequence.outcomeTier]
                        .textClass
                    }`}
                  >
                    {
                      OUTCOME_STYLE[evaluationResult.simulationConsequence.outcomeTier]
                        .label
                    }
                  </span>
                </div>

                <p className="mt-2 text-xs font-bold text-[#0D2818]">
                  {evaluationResult.simulationConsequence.headline}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#24382D]">
                  {evaluationResult.simulationConsequence.narrative}
                </p>

                <dl className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                  <div className="rounded-lg border border-[#DCE3DE] bg-[#F6F8F6] p-2.5">
                    <dt className="font-semibold text-[#0D2818]">
                      Proyeksi Kerawanan
                    </dt>
                    <dd className="mt-0.5 text-[#4A5D52]">
                      {evaluationResult.simulationConsequence.projectedRiskDeltaLabel}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-[#DCE3DE] bg-[#F6F8F6] p-2.5">
                    <dt className="font-semibold text-[#0D2818]">
                      Dampak Hidrologis / Tanah
                    </dt>
                    <dd className="mt-0.5 text-[#4A5D52]">
                      {evaluationResult.simulationConsequence.projectedWaterTableEffect}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-[#DCE3DE] bg-[#F6F8F6] p-2.5">
                    <dt className="font-semibold text-[#0D2818]">
                      Dinamika Penjalaran Api
                    </dt>
                    <dd className="mt-0.5 text-[#4A5D52]">
                      {evaluationResult.simulationConsequence.projectedFireSpreadEffect}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-[#DCE3DE] bg-[#F6F8F6] p-2.5">
                    <dt className="font-semibold text-[#0D2818]">
                      Implikasi Operasional
                    </dt>
                    <dd className="mt-0.5 text-[#4A5D52]">
                      {evaluationResult.simulationConsequence.operationalImpact}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* 5. Konfirmasi Pengiriman ke Scoring Engine */}
              <div
                data-testid="scoring-engine-receipt"
                className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#047857]">
                      5. Terkirim ke Scoring Engine
                    </p>
                    <p className="mt-1 text-xs text-[#065F46]">
                      {evaluationResult.scoringReceipt.message}
                    </p>
                  </div>
                  <Link
                    to={buildResultUrl(region.id, missionId)}
                    className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#14452F] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0D2818]"
                  >
                    <span>Lihat di Evaluasi STEM</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
