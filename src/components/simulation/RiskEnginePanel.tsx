import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  Info,
  RotateCcw,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import type { RegionProfile } from '../../types/mission';
import {
  createConfiguredRiskModel,
  ENVIRONMENTAL_PARAMETER_SPECS,
  evaluateFireRisk,
  getSimulationEnvironmentPreset,
  RISK_PARAMETER_ORDER,
  SIMULATION_PROVISIONAL_MODEL_CONFIG,
  UNCONFIGURED_SCIENTIFIC_MODEL_CONFIG,
  type EnvironmentalParametersInput,
  type RiskEvaluationResult,
  type RiskModelConfig,
  type RiskModelThresholds,
  type RiskModelWeights,
  type RiskParameterKey,
} from '../../utils/riskEngine';

interface RiskEnginePanelProps {
  region: RegionProfile;
  missionId?: string;
  onEvaluationChange?: (evaluation: RiskEvaluationResult) => void;
}

type DataSourceMode = 'simulasi' | 'input-manual';
type ModelSelectionMode = 'simulasi-sementara' | 'template-kosong' | 'kustom-ilmiah';

const INFLUENCE_TIER_STYLE: Record<
  'dominan' | 'signifikan' | 'moderat' | 'terkendali',
  { label: string; textClass: string; surfaceClass: string }
> = {
  dominan: {
    label: 'Dominan',
    textClass: 'text-[#B91C1C]',
    surfaceClass: 'bg-[#FEF2F2] border-[#FECACA]',
  },
  signifikan: {
    label: 'Signifikan',
    textClass: 'text-[#B45309]',
    surfaceClass: 'bg-[#FFFBEB] border-[#FDE68A]',
  },
  moderat: {
    label: 'Moderat',
    textClass: 'text-[#14452F]',
    surfaceClass: 'bg-[#EBF2EE] border-[#DCE3DE]',
  },
  terkendali: {
    label: 'Terkendali',
    textClass: 'text-[#047857]',
    surfaceClass: 'bg-[#ECFDF5] border-[#A7F3D0]',
  },
};

function toStringInputs(
  params: Record<RiskParameterKey, number>
): Record<RiskParameterKey, string> {
  return {
    airTemperatureC: String(params.airTemperatureC),
    airHumidityPct: String(params.airHumidityPct),
    rainfallMm: String(params.rainfallMm),
    peatMoisturePct: String(params.peatMoisturePct),
    vegetationConditionPct: String(params.vegetationConditionPct),
  };
}

export function RiskEnginePanel({
  region,
  missionId,
  onEvaluationChange,
}: RiskEnginePanelProps) {
  const simulationPreset = useMemo(
    () => getSimulationEnvironmentPreset(region.id),
    [region.id]
  );

  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>('simulasi');
  const [rawInputs, setRawInputs] = useState<Record<RiskParameterKey, string>>(() =>
    toStringInputs(simulationPreset.parameters)
  );

  const [modelMode, setModelMode] =
    useState<ModelSelectionMode>('simulasi-sementara');

  const [customWeights, setCustomWeights] = useState<Record<RiskParameterKey, string>>({
    airTemperatureC: '0.20',
    airHumidityPct: '0.20',
    rainfallMm: '0.20',
    peatMoisturePct: '0.20',
    vegetationConditionPct: '0.20',
  });
  const [customThresholds, setCustomThresholds] = useState<{
    lowMax: string;
    mediumMax: string;
  }>({
    lowMax: '33',
    mediumMax: '66',
  });
  const [customReference, setCustomReference] = useState<string>('');

  // Sinkronkan kembali data simulasi saat wilayah berubah dan mode sedang di Data Simulasi
  useEffect(() => {
    if (dataSourceMode === 'simulasi') {
      setRawInputs(toStringInputs(simulationPreset.parameters));
    }
  }, [simulationPreset, dataSourceMode]);

  const handleSelectDataMode = (nextMode: DataSourceMode) => {
    setDataSourceMode(nextMode);
    if (nextMode === 'simulasi') {
      setRawInputs(toStringInputs(simulationPreset.parameters));
    }
  };

  const handleResetToSimulation = () => {
    setDataSourceMode('simulasi');
    setRawInputs(toStringInputs(simulationPreset.parameters));
  };

  const handleParamInputChange = (key: RiskParameterKey, value: string) => {
    setDataSourceMode('input-manual');
    setRawInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const activeModelSelection = useMemo<{
    config: RiskModelConfig;
    customConfigError: string | null;
  }>(() => {
    if (modelMode === 'simulasi-sementara') {
      return {
        config: SIMULATION_PROVISIONAL_MODEL_CONFIG,
        customConfigError: null,
      };
    }

    if (modelMode === 'template-kosong') {
      return {
        config: UNCONFIGURED_SCIENTIFIC_MODEL_CONFIG,
        customConfigError: null,
      };
    }

    const parsedWeights = {} as RiskModelWeights;
    for (const key of RISK_PARAMETER_ORDER) {
      const val = Number(customWeights[key]);
      if (!Number.isFinite(val)) {
        return {
          config: UNCONFIGURED_SCIENTIFIC_MODEL_CONFIG,
          customConfigError: `Bobot ${ENVIRONMENTAL_PARAMETER_SPECS[key].label} harus berupa angka valid.`,
        };
      }
      parsedWeights[key] = val;
    }

    const lowMax = Number(customThresholds.lowMax);
    const mediumMax = Number(customThresholds.mediumMax);
    const thresholds: RiskModelThresholds = { lowMax, mediumMax };

    if (!customReference.trim()) {
      return {
        config: {
          ...UNCONFIGURED_SCIENTIFIC_MODEL_CONFIG,
          id: 'custom-scientific-pending-ref',
          name: 'Konfigurasi Ilmiah Kustom (Referensi Belum Diisi)',
          weights: parsedWeights,
          thresholds,
        },
        customConfigError:
          'Isi metode atau referensi ilmiah agar konfigurasi terkalibrasi lengkap.',
      };
    }

    try {
      const configured = createConfiguredRiskModel({
        id: 'user-scientific-model',
        name: 'Model Ilmiah Terkalibrasi Pengguna',
        weights: parsedWeights,
        thresholds,
        scientificMethodReference: customReference,
      });
      return { config: configured, customConfigError: null };
    } catch (error) {
      return {
        config: {
          ...UNCONFIGURED_SCIENTIFIC_MODEL_CONFIG,
          id: 'custom-scientific-invalid',
          name: 'Konfigurasi Ilmiah Kustom (Perlu Penyesuaian)',
          weights: parsedWeights,
          thresholds,
        },
        customConfigError:
          error instanceof Error ? error.message : 'Konfigurasi model tidak valid.',
      };
    }
  }, [modelMode, customWeights, customThresholds, customReference]);

  const evaluation = useMemo(() => {
    const inputPayload: EnvironmentalParametersInput =
      dataSourceMode === 'simulasi' ? simulationPreset.parameters : rawInputs;
    return evaluateFireRisk(inputPayload, activeModelSelection.config, {
      dataSourceMode,
    });
  }, [dataSourceMode, simulationPreset.parameters, rawInputs, activeModelSelection.config]);

  useEffect(() => {
    onEvaluationChange?.(evaluation);
  }, [evaluation, onEvaluationChange]);

  const activeCategoryStyle = evaluation.categoryPresentation;

  return (
    <section
      id="panel-analisis-risiko"
      aria-label="Panel Analisis Risk Engine"
      className="mt-8 rounded-xl border border-[#DCE3DE] bg-white p-6"
    >
      {/* Header Panel Risk Engine */}
      <div className="flex flex-col gap-4 border-b border-[#DCE3DE] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#14452F]">
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
            <span>
              Modul Terpisah · Risk Engine ({missionId ? `Misi ${missionId}` : region.name})
            </span>
          </div>
          <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight text-[#0D2818] sm:text-2xl">
            Panel Analisis Kerawanan Lingkungan — {region.name}
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#4A5D52]">
            Menjalankan validasi parameter lingkungan, normalisasi skala [0–1], kalkulasi skor
            berdasarkan konfigurasi bobot model, klasifikasi kategori (Rendah/Sedang/Tinggi),
            peringkat faktor dominan, serta penjelasan ilmiah secara terpisah dari Simulation
            Engine.
          </p>
        </div>

        {/* Status Kategori Hasil */}
        <div className="shrink-0">
          {activeCategoryStyle && evaluation.score !== null ? (
            <div
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold ${activeCategoryStyle.surfaceClass} ${activeCategoryStyle.borderClass} ${activeCategoryStyle.textClass}`}
            >
              {evaluation.category === 'tinggi' ? (
                <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : evaluation.category === 'sedang' ? (
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>
                {activeCategoryStyle.label} · Skor {evaluation.score.toFixed(1)}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#DCE3DE] bg-[#F6F8F6] px-3.5 py-2 text-xs font-semibold text-[#4A5D52]">
              <Info className="h-4 w-4 shrink-0 text-[#14452F]" aria-hidden="true" />
              <span>
                {evaluation.status === 'invalid-parameters'
                  ? 'Validasi Parameter Diperlukan'
                  : 'Menunggu Konfigurasi Bobot & Ambang Ilmiah'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mode Data Simulasi Notice */}
      <div
        role="note"
        aria-label="Keterangan Mode Data Simulasi Risk Engine"
        className="mt-5 flex flex-col gap-2 rounded-lg border border-[#DCE3DE] bg-[#F6F8F6] px-4 py-3 text-xs text-[#33463B] sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-2.5 sm:items-center">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#14452F] sm:mt-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-[#0D2818]">
              {simulationPreset.simulationTag}:
            </strong>{' '}
            {evaluation.simulationNotice}
          </span>
        </div>
        <span className="shrink-0 font-mono text-[11px] font-medium text-[#14452F]">
          {dataSourceMode === 'simulasi' ? 'Preset Wilayah Aktif' : 'Input Uji Simulasi'}
        </span>
      </div>

      {/* Main Risk Engine Workspace: Left Input & Config, Right Calculation & Scientific Output */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column (5 cols): 5 Environmental Parameters + Model Configuration */}
        <div className="space-y-6 lg:col-span-5">
          {/* Data Source Selector + 5 Environmental Parameters */}
          <div className="rounded-xl border border-[#DCE3DE] bg-[#F6F8F6] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-[#0D2818]">
                1. Parameter Lingkungan Awal
              </h3>
              <button
                type="button"
                onClick={handleResetToSimulation}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md border border-[#DCE3DE] bg-white px-2.5 py-1 text-xs font-medium text-[#0D2818] transition-colors hover:bg-[#EBF2EE]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Muat Data Simulasi</span>
              </button>
            </div>

            <div
              role="group"
              aria-label="Mode sumber data parameter"
              className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-[#DCE3DE] bg-white p-1"
            >
              <button
                type="button"
                onClick={() => handleSelectDataMode('simulasi')}
                aria-pressed={dataSourceMode === 'simulasi'}
                className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  dataSourceMode === 'simulasi'
                    ? 'bg-[#14452F] text-white'
                    : 'text-[#4A5D52] hover:bg-[#F6F8F6] hover:text-[#0D2818]'
                }`}
              >
                Data Simulasi Wilayah
              </button>
              <button
                type="button"
                onClick={() => handleSelectDataMode('input-manual')}
                aria-pressed={dataSourceMode === 'input-manual'}
                className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  dataSourceMode === 'input-manual'
                    ? 'bg-[#14452F] text-white'
                    : 'text-[#4A5D52] hover:bg-[#F6F8F6] hover:text-[#0D2818]'
                }`}
              >
                Ubah Nilai Simulasi
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-[#4A5D52]">
              {dataSourceMode === 'simulasi'
                ? simulationPreset.scenarioNote
                : 'Ubah nilai numerik atau geser pengatur untuk menguji validasi rentang serta sensitivitas skor Risk Engine.'}
            </p>

            {/* Parameter Inputs */}
            <div className="mt-4 space-y-3.5">
              {RISK_PARAMETER_ORDER.map((key) => {
                const spec = ENVIRONMENTAL_PARAMETER_SPECS[key];
                const issue = evaluation.parameterValidation.issues.find(
                  (item) => item.key === key
                );
                const inputId = `risk-param-${key}`;
                const numericForSlider = Number(rawInputs[key]);
                const safeSliderValue = Number.isFinite(numericForSlider)
                  ? Math.min(spec.max, Math.max(spec.min, numericForSlider))
                  : spec.min;

                return (
                  <div
                    key={key}
                    className={`rounded-lg border bg-white p-3.5 ${
                      issue ? 'border-[#FECACA]' : 'border-[#DCE3DE]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={inputId}
                        className="text-xs font-semibold text-[#0D2818]"
                      >
                        {spec.label}
                      </label>
                      <span className="font-mono text-[11px] text-[#4A5D52] tabular-nums">
                        Rentang {spec.min}–{spec.max} {spec.unit}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                      <input
                        type="range"
                        aria-label={`Pengatur ${spec.label}`}
                        min={spec.min}
                        max={spec.max}
                        step={spec.step}
                        value={safeSliderValue}
                        onChange={(e) => handleParamInputChange(key, e.target.value)}
                        className="h-1.5 w-full min-w-0 flex-1 cursor-pointer accent-[#14452F]"
                      />

                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        <input
                          id={inputId}
                          type="number"
                          step={spec.step}
                          value={rawInputs[key]}
                          onChange={(e) => handleParamInputChange(key, e.target.value)}
                          aria-invalid={Boolean(issue)}
                          className="min-h-[36px] w-20 rounded-md border border-[#DCE3DE] bg-[#F6F8F6] px-2.5 py-1 text-right font-mono text-xs font-semibold text-[#0D2818] tabular-nums focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#14452F]"
                        />
                        <span className="min-w-[3.25rem] text-xs text-[#4A5D52] whitespace-nowrap">
                          {spec.unit}
                        </span>
                      </div>
                    </div>

                    {issue && (
                      <p role="alert" className="mt-1.5 text-[11px] font-medium text-[#B91C1C]">
                        {issue.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Configuration Panel (Weights & Thresholds Ready for Scientific Input) */}
          <div className="rounded-xl border border-[#DCE3DE] bg-[#F6F8F6] p-5">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#14452F]" aria-hidden="true" />
              <h3 className="font-display text-base font-bold text-[#0D2818]">
                2. Konfigurasi Bobot &amp; Ambang Batas Model
              </h3>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#4A5D52]">
              Bobot dan ambang batas tidak ditetapkan secara sembarangan. Pilih mode simulasi
              netral sementara, template ilmiah kosong, atau isi langsung sesuai referensi ilmiah.
            </p>

            <div
              role="group"
              aria-label="Pilihan konfigurasi model Risk Engine"
              className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-3"
            >
              <button
                type="button"
                onClick={() => setModelMode('simulasi-sementara')}
                aria-pressed={modelMode === 'simulasi-sementara'}
                className={`min-h-[38px] rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  modelMode === 'simulasi-sementara'
                    ? 'border-[#14452F] bg-[#14452F] text-white'
                    : 'border-[#DCE3DE] bg-white text-[#4A5D52] hover:text-[#0D2818]'
                }`}
              >
                Simulasi Netral
              </button>
              <button
                type="button"
                onClick={() => setModelMode('template-kosong')}
                aria-pressed={modelMode === 'template-kosong'}
                className={`min-h-[38px] rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  modelMode === 'template-kosong'
                    ? 'border-[#14452F] bg-[#14452F] text-white'
                    : 'border-[#DCE3DE] bg-white text-[#4A5D52] hover:text-[#0D2818]'
                }`}
              >
                Template Kosong
              </button>
              <button
                type="button"
                onClick={() => setModelMode('kustom-ilmiah')}
                aria-pressed={modelMode === 'kustom-ilmiah'}
                className={`min-h-[38px] rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  modelMode === 'kustom-ilmiah'
                    ? 'border-[#14452F] bg-[#14452F] text-white'
                    : 'border-[#DCE3DE] bg-white text-[#4A5D52] hover:text-[#0D2818]'
                }`}
              >
                Isi Bobot Ilmiah
              </button>
            </div>

            {modelMode === 'simulasi-sementara' && (
              <div className="mt-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3.5 text-xs text-[#92400E]">
                <p className="font-semibold">Konfigurasi Simulasi Sementara (Bobot Netral 0,20)</p>
                <p className="mt-1 leading-relaxed">
                  Seluruh 5 parameter diberi bobot seragam 0,20 dan ambang batas sementara (≤33
                  Rendah, ≤66 Sedang, &gt;66 Tinggi) hanya untuk demonstrasi simulasi sampai
                  metode dan referensi ilmiah resmi dimasukkan.
                </p>
              </div>
            )}

            {modelMode === 'template-kosong' && (
              <div className="mt-3 rounded-lg border border-[#DCE3DE] bg-white p-3.5 text-xs text-[#33463B]">
                <p className="font-semibold text-[#0D2818]">
                  Template Ilmiah Belum Dikalibrasi
                </p>
                <p className="mt-1 leading-relaxed text-[#4A5D52]">
                  {UNCONFIGURED_SCIENTIFIC_MODEL_CONFIG.notes} Validasi dan normalisasi
                  parameter tetap berjalan sambil menunggu input bobot serta ambang batas.
                </p>
              </div>
            )}

            {modelMode === 'kustom-ilmiah' && (
              <div className="mt-3 space-y-3 rounded-lg border border-[#DCE3DE] bg-white p-4">
                <div>
                  <label
                    htmlFor="custom-scientific-ref"
                    className="block text-xs font-semibold text-[#0D2818]"
                  >
                    Metode &amp; Referensi Ilmiah
                  </label>
                  <input
                    id="custom-scientific-ref"
                    type="text"
                    placeholder="Contoh: Metode FWI / Pembobotan AHP Karhutla Gambut..."
                    value={customReference}
                    onChange={(e) => setCustomReference(e.target.value)}
                    className="mt-1.5 min-h-[38px] w-full rounded-md border border-[#DCE3DE] bg-[#F6F8F6] px-3 py-1.5 text-xs text-[#0D2818] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#14452F]"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#0D2818]">
                    Bobot Tiap Parameter (Total harus = 1,00)
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {RISK_PARAMETER_ORDER.map((key) => (
                      <label
                        key={key}
                        className="flex items-center justify-between gap-2 rounded-md border border-[#DCE3DE] bg-[#F6F8F6] px-2.5 py-1.5 text-xs"
                      >
                        <span className="truncate text-[#33463B]">
                          {ENVIRONMENTAL_PARAMETER_SPECS[key].shortLabel}
                        </span>
                        <input
                          type="number"
                          step="0.05"
                          min="0.01"
                          max="0.99"
                          value={customWeights[key]}
                          onChange={(e) =>
                            setCustomWeights((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="w-16 rounded border border-[#DCE3DE] bg-white px-1.5 py-0.5 text-right font-mono text-xs font-semibold text-[#0D2818]"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <label className="block text-xs">
                    <span className="font-semibold text-[#0D2818]">Batas Maks. Rendah</span>
                    <input
                      type="number"
                      min="1"
                      max="98"
                      value={customThresholds.lowMax}
                      onChange={(e) =>
                        setCustomThresholds((prev) => ({
                          ...prev,
                          lowMax: e.target.value,
                        }))
                      }
                      className="mt-1 min-h-[36px] w-full rounded-md border border-[#DCE3DE] bg-[#F6F8F6] px-2.5 font-mono text-xs font-semibold text-[#0D2818]"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-[#0D2818]">Batas Maks. Sedang</span>
                    <input
                      type="number"
                      min="2"
                      max="99"
                      value={customThresholds.mediumMax}
                      onChange={(e) =>
                        setCustomThresholds((prev) => ({
                          ...prev,
                          mediumMax: e.target.value,
                        }))
                      }
                      className="mt-1 min-h-[36px] w-full rounded-md border border-[#DCE3DE] bg-[#F6F8F6] px-2.5 font-mono text-xs font-semibold text-[#0D2818]"
                    />
                  </label>
                </div>

                {activeModelSelection.customConfigError && (
                  <p role="alert" className="text-xs font-medium text-[#B91C1C]">
                    {activeModelSelection.customConfigError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Normalization, Score & Category, Factors, Scientific Explanations */}
        <div className="space-y-6 lg:col-span-7">
          {/* Validation Error Banner if parameters invalid */}
          {evaluation.status === 'invalid-parameters' && (
            <div
              role="alert"
              className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-5 text-sm text-[#B91C1C]"
            >
              <h3 className="font-display text-base font-bold">
                Pemeriksaan Kelengkapan &amp; Validitas Parameter Gagal
              </h3>
              <p className="mt-1 text-xs">
                Perbaiki nilai parameter berikut sebelum Risk Engine melanjutkan normalisasi dan
                kalkulasi skor kerawanan:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs">
                {evaluation.parameterValidation.issues.map((issue) => (
                  <li key={issue.key}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Awaiting Model Config Notice */}
          {evaluation.status === 'awaiting-model-configuration' && (
            <div className="rounded-xl border border-[#DCE3DE] bg-[#F6F8F6] p-5">
              <h3 className="font-display text-base font-bold text-[#0D2818]">
                Menunggu Konfigurasi Bobot &amp; Ambang Batas Ilmiah
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#4A5D52]">
                Seluruh 5 parameter lingkungan telah tervalidasi dan dinormalisasi di bawah ini.
                Perhitungan skor akhir dan klasifikasi kategori ditahan hingga bobot, ambang
                batas, dan referensi ilmiah dilengkapi.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-[#33463B]">
                {evaluation.modelValidation.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Score & Category Result Card */}
          {evaluation.status === 'completed' &&
            evaluation.score !== null &&
            evaluation.categoryPresentation &&
            evaluation.modelConfig.thresholds && (
              <div
                data-testid="risk-score-summary"
                className="rounded-xl border border-[#DCE3DE] bg-[#F6F8F6] p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#14452F]">
                      3. Skor Indeks Kerawanan &amp; Kategori
                    </p>
                    <div className="mt-1 flex items-baseline gap-2.5">
                      <span className="font-mono text-4xl font-bold text-[#0D2818] tabular-nums">
                        {evaluation.score.toFixed(1)}
                      </span>
                      <span className="font-mono text-sm text-[#4A5D52]">/ 100</span>
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold ${evaluation.categoryPresentation.surfaceClass} ${evaluation.categoryPresentation.borderClass} ${evaluation.categoryPresentation.textClass}`}
                  >
                    {evaluation.category === 'tinggi' ? (
                      <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : evaluation.category === 'sedang' ? (
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>{evaluation.categoryPresentation.label}</span>
                  </div>
                </div>

                {/* Progress Bar with Threshold Markers */}
                <div className="mt-4">
                  <div className="h-3 w-full overflow-hidden rounded-full border border-[#DCE3DE] bg-white">
                    <div
                      className={`h-full transition-all duration-300 ${evaluation.categoryPresentation.barClass}`}
                      style={{ width: `${Math.min(100, Math.max(2, evaluation.score))}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-[#4A5D52] tabular-nums">
                    <span>0 (Minimal)</span>
                    <span>
                      Rendah ≤ {evaluation.modelConfig.thresholds.lowMax} · Sedang ≤{' '}
                      {evaluation.modelConfig.thresholds.mediumMax} · Tinggi &gt;{' '}
                      {evaluation.modelConfig.thresholds.mediumMax}
                    </span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            )}

          {/* 4. Parameter Normalization Results */}
          {evaluation.normalizedParameters && (
            <div className="rounded-xl border border-[#DCE3DE] bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#14452F]" aria-hidden="true" />
                  <h3 className="font-display text-base font-bold text-[#0D2818]">
                    4. Hasil Normalisasi Parameter [0,00 – 1,00]
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#4A5D52]">
                  Skala Kerawanan Relatif
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {evaluation.normalizedParameters.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-lg border border-[#DCE3DE] bg-[#F6F8F6] p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#0D2818]">{item.label}</span>
                      <div className="flex items-center gap-3 font-mono tabular-nums">
                        <span className="text-[#4A5D52]">
                          Nilai: {item.rawValue} {item.unit}
                        </span>
                        <span className="font-bold text-[#14452F]">
                          Norm: {item.normalizedRisk.toFixed(2)} ({item.normalizedPercent}%)
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[#14452F] transition-all duration-300"
                        style={{ width: `${item.normalizedPercent}%` }}
                      />
                    </div>

                    <p className="mt-1.5 font-mono text-[11px] text-[#4A5D52]">
                      {item.formulaDescription}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Contributing Factors Breakdown */}
          {evaluation.contributingFactors && (
            <div className="rounded-xl border border-[#DCE3DE] bg-white p-5">
              <h3 className="font-display text-base font-bold text-[#0D2818]">
                5. Peringkat Faktor yang Memengaruhi Hasil
              </h3>
              <p className="mt-1 text-xs text-[#4A5D52]">
                Diurutkan dari kontributor terbesar terhadap skor kerawanan berdasarkan nilai
                ternormalisasi dan bobot model aktif.
              </p>

              <ol className="mt-4 divide-y divide-[#DCE3DE]">
                {evaluation.contributingFactors.map((factor, index) => {
                  const tier = INFLUENCE_TIER_STYLE[factor.influenceTier];
                  return (
                    <li
                      key={factor.key}
                      className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#EBF2EE] font-mono text-xs font-bold text-[#0D2818] tabular-nums">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#0D2818]">
                            {factor.label}
                          </p>
                          <p className="font-mono text-[11px] text-[#4A5D52] tabular-nums">
                            {factor.rawValue} {factor.unit} · Bobot {factor.weight.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:justify-end">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tier.surfaceClass} ${tier.textClass}`}
                        >
                          {tier.label}
                        </span>
                        <div className="text-right font-mono tabular-nums">
                          <p className="text-xs font-bold text-[#0D2818]">
                            +{factor.weightedPoints.toFixed(1)} poin
                          </p>
                          <p className="text-[11px] text-[#4A5D52]">
                            {factor.shareOfTotalPct}% dari skor
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* 6. Scientific Explanations */}
          {evaluation.scientificExplanation && (
            <div className="rounded-xl border border-[#DCE3DE] bg-white p-5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#14452F]" aria-hidden="true" />
                <h3 className="font-display text-base font-bold text-[#0D2818]">
                  6. Penjelasan Ilmiah Hasil Analisis
                </h3>
              </div>

              <div className="mt-3 rounded-lg border border-[#DCE3DE] bg-[#F6F8F6] p-4">
                <p className="font-display text-sm font-bold text-[#0D2818]">
                  {evaluation.scientificExplanation.overallHeadline}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#24382D]">
                  {evaluation.scientificExplanation.overallSummary}
                </p>
                <p className="mt-2.5 border-t border-[#DCE3DE] pt-2 text-[11px] text-[#4A5D52]">
                  {evaluation.scientificExplanation.calibrationDisclosure}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {evaluation.scientificExplanation.parameterExplanations.map((item) => (
                  <article
                    key={item.key}
                    className="rounded-lg border border-[#DCE3DE] p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-[#0D2818]">{item.label}</h4>
                      <span className="font-mono text-[11px] font-medium text-[#14452F] tabular-nums">
                        {item.observation}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#24382D]">
                      {item.interpretation}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#4A5D52]">
                      <strong className="font-semibold text-[#33463B]">Dasar Fisik:</strong>{' '}
                      {item.mechanism}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
