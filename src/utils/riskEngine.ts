export type RiskParameterKey =
  | 'airTemperatureC'
  | 'airHumidityPct'
  | 'rainfallMm'
  | 'peatMoisturePct'
  | 'vegetationConditionPct';

export type RiskCategory = 'rendah' | 'sedang' | 'tinggi';

export type RiskCalibrationStatus =
  | 'belum-dikalibrasi'
  | 'simulasi-sementara'
  | 'terkalibrasi-ilmiah';

export type ParameterPolarity = 'direct' | 'inverse';

export interface EnvironmentalParameterSpec {
  key: RiskParameterKey;
  label: string;
  shortLabel: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  polarity: ParameterPolarity;
  description: string;
  scientificBasis: string;
}

export type EnvironmentalParametersInput = Partial<
  Record<RiskParameterKey, number | string | null | undefined>
>;

export type ValidEnvironmentalParameters = Record<RiskParameterKey, number>;

export type RiskModelWeights = Record<RiskParameterKey, number>;

export interface RiskModelThresholds {
  /** Batas maksimum skor (0-100) untuk kategori Rendah */
  lowMax: number;
  /** Batas maksimum skor (0-100) untuk kategori Sedang; di atas nilai ini masuk kategori Tinggi */
  mediumMax: number;
}

export interface RiskModelConfig {
  id: string;
  name: string;
  calibrationStatus: RiskCalibrationStatus;
  isSimulationConfig: boolean;
  scientificMethodReference: string | null;
  notes: string;
  weights: RiskModelWeights | null;
  thresholds: RiskModelThresholds | null;
}

export interface ParameterValidationIssue {
  key: RiskParameterKey;
  label: string;
  reason: 'missing' | 'non-numeric' | 'out-of-range';
  message: string;
}

export interface ParameterValidationResult {
  isValid: boolean;
  issues: ParameterValidationIssue[];
  parsedValues: Partial<ValidEnvironmentalParameters>;
  validParameters: ValidEnvironmentalParameters | null;
}

export interface ModelConfigValidationResult {
  isReadyForCalculation: boolean;
  errors: string[];
  weightSum: number | null;
}

export interface NormalizedParameterResult {
  key: RiskParameterKey;
  label: string;
  rawValue: number;
  unit: string;
  /** Nilai terstandarisasi kontribusi kerawanan pada rentang [0, 1] */
  normalizedRisk: number;
  /** Persentase intensitas kerawanan parameter (0 - 100) */
  normalizedPercent: number;
  polarity: ParameterPolarity;
  formulaDescription: string;
}

export interface RiskContributingFactor {
  key: RiskParameterKey;
  label: string;
  rawValue: number;
  unit: string;
  normalizedRisk: number;
  weight: number;
  /** Kontribusi poin absolut terhadap skor total (0 - 100) */
  weightedPoints: number;
  /** Proporsi terhadap total skor yang terbentuk (0 - 100%) */
  shareOfTotalPct: number;
  influenceTier: 'dominan' | 'signifikan' | 'moderat' | 'terkendali';
}

export interface ParameterScientificExplanation {
  key: RiskParameterKey;
  label: string;
  observation: string;
  mechanism: string;
  interpretation: string;
}

export interface RiskScientificExplanation {
  overallHeadline: string;
  overallSummary: string;
  calibrationDisclosure: string;
  parameterExplanations: ParameterScientificExplanation[];
}

export interface RiskCategoryPresentation {
  category: RiskCategory;
  label: string;
  shortLabel: string;
  textClass: string;
  surfaceClass: string;
  borderClass: string;
  barClass: string;
}

export interface SimulationEnvironmentPreset {
  regionId: string;
  isSimulation: true;
  simulationTag: string;
  scenarioNote: string;
  parameters: ValidEnvironmentalParameters;
}

export interface RiskEvaluationOptions {
  dataSourceMode?: 'simulasi' | 'input-manual';
}

export interface RiskEvaluationResult {
  status: 'completed' | 'invalid-parameters' | 'awaiting-model-configuration';
  dataSourceMode: 'simulasi' | 'input-manual';
  isSimulationData: boolean;
  simulationNotice: string;
  parameterValidation: ParameterValidationResult;
  modelValidation: ModelConfigValidationResult;
  modelConfig: RiskModelConfig;
  normalizedParameters: NormalizedParameterResult[] | null;
  score: number | null;
  category: RiskCategory | null;
  categoryPresentation: RiskCategoryPresentation | null;
  contributingFactors: RiskContributingFactor[] | null;
  scientificExplanation: RiskScientificExplanation | null;
}

export const RISK_PARAMETER_ORDER: RiskParameterKey[] = [
  'airTemperatureC',
  'airHumidityPct',
  'rainfallMm',
  'peatMoisturePct',
  'vegetationConditionPct',
];

export const ENVIRONMENTAL_PARAMETER_SPECS: Record<
  RiskParameterKey,
  EnvironmentalParameterSpec
> = {
  airTemperatureC: {
    key: 'airTemperatureC',
    label: 'Suhu Udara',
    shortLabel: 'Suhu Udara',
    unit: '°C',
    min: 15,
    max: 45,
    step: 0.5,
    polarity: 'direct',
    description: 'Suhu udara permukaan di sekitar lokasi pemantauan.',
    scientificBasis:
      'Kenaikan suhu udara meningkatkan defisit tekanan uap (VPD), mempercepat penguapan kadar air bahan bakar halus (serasah & semak kering), serta menurunkan energi ambang penyulutan api.',
  },
  airHumidityPct: {
    key: 'airHumidityPct',
    label: 'Kelembapan Udara',
    shortLabel: 'Kelembapan Udara (RH)',
    unit: '%',
    min: 10,
    max: 100,
    step: 1,
    polarity: 'inverse',
    description: 'Kelembapan relatif udara atmosfer di dekat permukaan lahan.',
    scientificBasis:
      'Kelembapan relatif rendah menurunkan kadar air kesetimbangan pada serasah dan daun kering sehingga api permukaan lebih mudah menyala dan menjalar cepat.',
  },
  rainfallMm: {
    key: 'rainfallMm',
    label: 'Curah Hujan',
    shortLabel: 'Curah Hujan Harian',
    unit: 'mm/hari',
    min: 0,
    max: 150,
    step: 1,
    polarity: 'inverse',
    description: 'Intensitas curah hujan harian atau rata-rata dasarian lokal.',
    scientificBasis:
      'Presipitasi membasahi bahan bakar permukaan secara langsung serta mengisi kembali simpanan air tanah; kondisi tanpa hujan memperpanjang fase pengeringan bahan bakar.',
  },
  peatMoisturePct: {
    key: 'peatMoisturePct',
    label: 'Kelembapan Gambut',
    shortLabel: 'Kelembapan Gambut',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    polarity: 'inverse',
    description: 'Kadar air relatif lapisan gambut permukaan hingga zona perakaran.',
    scientificBasis:
      'Gambut tropis bersifat mudah terbakar apabila kadar air turun di bawah kondisi jenuh hidrologisnya; gambut kering memicu kebakaran bawah permukaan (smoldering) yang sulit dipadamkan.',
  },
  vegetationConditionPct: {
    key: 'vegetationConditionPct',
    label: 'Kondisi Vegetasi',
    shortLabel: 'Kondisi & Kelembapan Vegetasi',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    polarity: 'inverse',
    description:
      'Indeks kesehatan tajuk & kelembapan vegetasi (0% = semak kering kritis, 100% = kanopi hutan hujan lembap rapat).',
    scientificBasis:
      'Kanopi hutan lembap menahan radiasi matahari langsung dan menjaga iklim mikro tetap sejuk, sedangkan vegetasi terdegradasi atau semak kering menjadi bahan bakar kontinyu yang cepat terbakar.',
  },
};

/**
 * Template model ilmiah kosong.
 * Bobot dan ambang batas sengaja dibiarkan null agar dapat diisi setelah pengguna
 * menetapkan metode dan referensi ilmiah resmi (tidak menentukan bobot/ambang sembarangan).
 */
export const UNCONFIGURED_SCIENTIFIC_MODEL_CONFIG: RiskModelConfig = {
  id: 'scientific-template-unconfigured',
  name: 'Template Model Ilmiah (Menunggu Referensi)',
  calibrationStatus: 'belum-dikalibrasi',
  isSimulationConfig: false,
  scientificMethodReference: null,
  notes:
    'Bobot parameter dan ambang batas kategori belum diisi. Lengkapi konfigurasi model setelah metode pembobotan dan referensi ilmiah ditetapkan.',
  weights: null,
  thresholds: null,
};

/**
 * Konfigurasi simulasi netral sementara (bobot seragam 0,20 dan ambang kuantil netral 33/66).
 * Hanya digunakan saat mode simulasi edukasi aktif sebelum bobot ilmiah final dimasukkan.
 */
export const SIMULATION_PROVISIONAL_MODEL_CONFIG: RiskModelConfig = {
  id: 'simulation-provisional-equal-weight',
  name: 'Konfigurasi Mode Simulasi Sementara (Bobot Netral 0,20)',
  calibrationStatus: 'simulasi-sementara',
  isSimulationConfig: true,
  scientificMethodReference: null,
  notes:
    'Menggunakan pembobotan netral seragam (0,20 per parameter) dan ambang sementara (≤33 Rendah, ≤66 Sedang, >66 Tinggi) hanya untuk demonstrasi simulasi. Ganti melalui konfigurasi model ilmiah setelah referensi metode tersedia.',
  weights: {
    airTemperatureC: 0.2,
    airHumidityPct: 0.2,
    rainfallMm: 0.2,
    peatMoisturePct: 0.2,
    vegetationConditionPct: 0.2,
  },
  thresholds: {
    lowMax: 33,
    mediumMax: 66,
  },
};

export interface CreateConfiguredRiskModelInput {
  id: string;
  name: string;
  weights: RiskModelWeights;
  thresholds: RiskModelThresholds;
  scientificMethodReference: string;
  notes?: string;
}

/**
 * Membentuk konfigurasi model Risk Engine terkalibrasi dari bobot, ambang batas,
 * dan referensi ilmiah yang diberikan pengguna.
 */
export function createConfiguredRiskModel(
  input: CreateConfiguredRiskModelInput
): RiskModelConfig {
  const candidate: RiskModelConfig = {
    id: input.id.trim() || 'custom-scientific-model',
    name: input.name.trim() || 'Model Kerawanan Terkalibrasi',
    calibrationStatus: 'terkalibrasi-ilmiah',
    isSimulationConfig: false,
    scientificMethodReference: input.scientificMethodReference.trim() || null,
    notes:
      input.notes?.trim() ??
      'Konfigurasi bobot dan ambang batas berdasarkan metode serta referensi ilmiah yang ditetapkan.',
    weights: { ...input.weights },
    thresholds: { ...input.thresholds },
  };

  const validation = validateRiskModelConfig(candidate);
  if (!validation.isReadyForCalculation) {
    throw new Error(
      `Konfigurasi model ilmiah tidak valid: ${validation.errors.join('; ')}`
    );
  }
  if (!candidate.scientificMethodReference) {
    throw new Error(
      'Referensi atau metode ilmiah wajib diisi untuk model terkalibrasi.'
    );
  }

  return candidate;
}

const RISK_CATEGORY_PRESENTATIONS: Record<
  RiskCategory,
  RiskCategoryPresentation
> = {
  rendah: {
    category: 'rendah',
    label: 'Kategori Rendah',
    shortLabel: 'Rendah',
    textClass: 'text-[#047857]',
    surfaceClass: 'bg-[#ECFDF5]',
    borderClass: 'border-[#A7F3D0]',
    barClass: 'bg-[#059669]',
  },
  sedang: {
    category: 'sedang',
    label: 'Kategori Sedang',
    shortLabel: 'Sedang',
    textClass: 'text-[#B45309]',
    surfaceClass: 'bg-[#FFFBEB]',
    borderClass: 'border-[#FDE68A]',
    barClass: 'bg-[#D97706]',
  },
  tinggi: {
    category: 'tinggi',
    label: 'Kategori Tinggi',
    shortLabel: 'Tinggi',
    textClass: 'text-[#B91C1C]',
    surfaceClass: 'bg-[#FEF2F2]',
    borderClass: 'border-[#FECACA]',
    barClass: 'bg-[#DC2626]',
  },
};

export function getRiskCategoryPresentation(
  category: RiskCategory
): RiskCategoryPresentation {
  return RISK_CATEGORY_PRESENTATIONS[category];
}

/**
 * 1 & 2. Menerima parameter lingkungan serta memeriksa kelengkapan dan validitas nilai.
 */
export function validateEnvironmentalParameters(
  input: EnvironmentalParametersInput
): ParameterValidationResult {
  const issues: ParameterValidationIssue[] = [];
  const parsedValues: Partial<ValidEnvironmentalParameters> = {};

  for (const key of RISK_PARAMETER_ORDER) {
    const spec = ENVIRONMENTAL_PARAMETER_SPECS[key];
    const raw = input[key];

    if (
      raw === undefined ||
      raw === null ||
      (typeof raw === 'string' && raw.trim() === '')
    ) {
      issues.push({
        key,
        label: spec.label,
        reason: 'missing',
        message: `${spec.label} belum diisi (rentang valid ${spec.min}–${spec.max} ${spec.unit}).`,
      });
      continue;
    }

    const numericValue = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(numericValue)) {
      issues.push({
        key,
        label: spec.label,
        reason: 'non-numeric',
        message: `${spec.label} harus berupa angka valid.`,
      });
      continue;
    }

    parsedValues[key] = numericValue;

    if (numericValue < spec.min || numericValue > spec.max) {
      issues.push({
        key,
        label: spec.label,
        reason: 'out-of-range',
        message: `${spec.label} (${numericValue} ${spec.unit}) berada di luar batas wajar ${spec.min}–${spec.max} ${spec.unit}.`,
      });
    }
  }

  const isValid = issues.length === 0;
  return {
    isValid,
    issues,
    parsedValues,
    validParameters: isValid
      ? (parsedValues as ValidEnvironmentalParameters)
      : null,
  };
}

/**
 * Memeriksa kelengkapan & konsistensi matematis konfigurasi bobot dan ambang batas model.
 */
export function validateRiskModelConfig(
  config: RiskModelConfig
): ModelConfigValidationResult {
  const errors: string[] = [];
  let weightSum: number | null = null;

  if (!config.weights) {
    errors.push(
      'Konfigurasi bobot parameter belum diisi (menunggu metode & referensi ilmiah).'
    );
  } else {
    let sum = 0;
    let allFinitePositive = true;

    for (const key of RISK_PARAMETER_ORDER) {
      const spec = ENVIRONMENTAL_PARAMETER_SPECS[key];
      const w = config.weights[key];
      if (typeof w !== 'number' || !Number.isFinite(w) || w <= 0 || w > 1) {
        errors.push(
          `Bobot ${spec.label} harus bernilai numerik di antara > 0 hingga 1.`
        );
        allFinitePositive = false;
      } else {
        sum += w;
      }
    }

    if (allFinitePositive) {
      weightSum = Number(sum.toFixed(4));
      if (Math.abs(sum - 1) > 0.001) {
        errors.push(
          `Total seluruh bobot parameter saat ini ${weightSum.toFixed(2)}, harus berjumlah tepat 1,00.`
        );
      }
    }
  }

  if (!config.thresholds) {
    errors.push(
      'Konfigurasi ambang batas kategori (Rendah / Sedang / Tinggi) belum diisi.'
    );
  } else {
    const { lowMax, mediumMax } = config.thresholds;
    if (
      !Number.isFinite(lowMax) ||
      !Number.isFinite(mediumMax) ||
      lowMax <= 0 ||
      mediumMax >= 100 ||
      lowMax >= mediumMax
    ) {
      errors.push(
        'Ambang batas harus memenuhi syarat 0 < Batas Rendah < Batas Sedang < 100.'
      );
    }
  }

  return {
    isReadyForCalculation: errors.length === 0,
    errors,
    weightSum,
  };
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

/**
 * 3. Melakukan normalisasi seluruh parameter lingkungan ke skala kontribusi kerawanan [0, 1].
 */
export function normalizeEnvironmentalParameters(
  params: ValidEnvironmentalParameters
): NormalizedParameterResult[] {
  return RISK_PARAMETER_ORDER.map((key) => {
    const spec = ENVIRONMENTAL_PARAMETER_SPECS[key];
    const rawValue = params[key];
    const span = spec.max - spec.min;

    const rawRatio =
      spec.polarity === 'direct'
        ? (rawValue - spec.min) / span
        : (spec.max - rawValue) / span;

    const normalizedRisk = Number(clamp01(rawRatio).toFixed(4));
    const normalizedPercent = Number((normalizedRisk * 100).toFixed(1));

    const formulaDescription =
      spec.polarity === 'direct'
        ? `(${rawValue} - ${spec.min}) / (${spec.max} - ${spec.min}) = ${normalizedRisk.toFixed(2)} (korelasi searah)`
        : `(${spec.max} - ${rawValue}) / (${spec.max} - ${spec.min}) = ${normalizedRisk.toFixed(2)} (korelasi berlawanan)`;

    return {
      key,
      label: spec.label,
      rawValue,
      unit: spec.unit,
      normalizedRisk,
      normalizedPercent,
      polarity: spec.polarity,
      formulaDescription,
    };
  });
}

/**
 * 4. Menghitung skor kerawanan (0 - 100) berdasarkan konfigurasi bobot model.
 */
export function calculateVulnerabilityScore(
  normalizedParams: NormalizedParameterResult[],
  weights: RiskModelWeights
): number {
  const weightedSum = normalizedParams.reduce((acc, item) => {
    const weight = weights[item.key];
    return acc + item.normalizedRisk * weight;
  }, 0);

  return Number(Math.min(100, Math.max(0, weightedSum * 100)).toFixed(2));
}

/**
 * 5. Mengklasifikasikan skor kerawanan ke kategori rendah, sedang, atau tinggi
 *    berdasarkan konfigurasi ambang batas.
 */
export function classifyRiskCategory(
  score: number,
  thresholds: RiskModelThresholds
): RiskCategory {
  if (score <= thresholds.lowMax) {
    return 'rendah';
  }
  if (score <= thresholds.mediumMax) {
    return 'sedang';
  }
  return 'tinggi';
}

/**
 * 6. Mengidentifikasi dan mengurutkan faktor lingkungan yang paling memengaruhi hasil.
 */
export function analyzeContributingFactors(
  normalizedParams: NormalizedParameterResult[],
  weights: RiskModelWeights,
  totalScore: number
): RiskContributingFactor[] {
  const ranked = normalizedParams.map((item) => {
    const weight = weights[item.key];
    const weightedPoints = Number((item.normalizedRisk * weight * 100).toFixed(2));
    const shareOfTotalPct =
      totalScore > 0
        ? Number(((weightedPoints / totalScore) * 100).toFixed(1))
        : Number((weight * 100).toFixed(1));

    let influenceTier: RiskContributingFactor['influenceTier'] = 'terkendali';
    if (item.normalizedRisk >= 0.72) {
      influenceTier = 'dominan';
    } else if (item.normalizedRisk >= 0.5) {
      influenceTier = 'signifikan';
    } else if (item.normalizedRisk >= 0.28) {
      influenceTier = 'moderat';
    }

    return {
      key: item.key,
      label: item.label,
      rawValue: item.rawValue,
      unit: item.unit,
      normalizedRisk: item.normalizedRisk,
      weight,
      weightedPoints,
      shareOfTotalPct,
      influenceTier,
    };
  });

  return ranked.sort((a, b) => b.weightedPoints - a.weightedPoints);
}

/**
 * 7. Menyusun penjelasan ilmiah untuk skor kategori keseluruhan serta setiap parameter.
 */
export function generateScientificExplanations(
  params: ValidEnvironmentalParameters,
  normalizedParams: NormalizedParameterResult[],
  category: RiskCategory,
  factors: RiskContributingFactor[],
  config: RiskModelConfig
): RiskScientificExplanation {
  const topTwo = factors.slice(0, 2);
  const topDriverNames = topTwo.map((f) => f.label).join(' dan ');
  const normalizedMap = Object.fromEntries(
    normalizedParams.map((item) => [item.key, item])
  ) as Record<RiskParameterKey, NormalizedParameterResult>;

  let overallHeadline = '';
  let overallSummary = '';

  if (category === 'tinggi') {
    overallHeadline =
      'Potensi Kerawanan Kebakaran Tinggi — Keseimbangan Kelembapan Tertekan';
    overallSummary = `Kombinasi parameter lingkungan menghasilkan skor kerawanan tinggi yang terutama dipicu oleh ${topDriverNames}. Kondisi termal tinggi serta berkurangnya cadangan air pada permukaan dan lapisan organik mempercepat pengeringan bahan bakar dan meningkatkan peluang penyulutan berantai.`;
  } else if (category === 'sedang') {
    overallHeadline =
      'Potensi Kerawanan Kebakaran Sedang — Fase Transisi Kekeringan Bahan Bakar';
    overallSummary = `Hasil analisis menunjukkan tingkat kerawanan sedang dengan kontributor utama ${topDriverNames}. Sebagian penyangga kelembapan masih bekerja, namun penurunan lanjutan pada curah hujan atau kelembapan udara dapat mendorong kerawanan ke tingkat kritis.`;
  } else {
    overallHeadline =
      'Potensi Kerawanan Kebakaran Rendah — Penyangga Kelembapan Ekosistem Terjaga';
    overallSummary = `Interaksi lima parameter lingkungan menunjukkan kondisi relatif lembap dan stabil. Meski demikian, faktor ${factors[0].label} tetap menjadi komponen yang perlu dipantau karena memiliki kontribusi relatif terbesar di sektor ini.`;
  }

  const calibrationDisclosure = config.isSimulationConfig
    ? `Catatan Konfigurasi: ${config.notes}`
    : `Referensi Ilmiah Aktif: ${config.scientificMethodReference ?? 'Belum ditentukan'}`;

  const parameterExplanations: ParameterScientificExplanation[] =
    RISK_PARAMETER_ORDER.map((key) => {
      const spec = ENVIRONMENTAL_PARAMETER_SPECS[key];
      const norm = normalizedMap[key];
      const val = params[key];

      let interpretation = '';
      if (key === 'airTemperatureC') {
        interpretation =
          norm.normalizedRisk >= 0.65
            ? `Suhu ${val} ${spec.unit} memperbesar laju penguapan kelembapan permukaan dan memanaskan serasah hingga mendekati titik kering kritis.`
            : norm.normalizedRisk >= 0.4
              ? `Suhu ${val} ${spec.unit} memberikan tekanan termal moderat pada lapisan bahan bakar permukaan saat tengah hari.`
              : `Suhu ${val} ${spec.unit} masih berada pada kisaran yang relatif sejuk sehingga laju pengeringan bahan bakar berlangsung lambat.`;
      } else if (key === 'airHumidityPct') {
        interpretation =
          norm.normalizedRisk >= 0.65
            ? `Kelembapan udara ${val}${spec.unit} menandakan atmosfer kering yang cepat menyerap uap air dari dedaunan mati dan semak terbuka.`
            : norm.normalizedRisk >= 0.4
              ? `Kelembapan udara ${val}${spec.unit} berada pada zona transisi; bahan bakar halus mulai mudah mengering pada siang hari.`
              : `Kelembapan udara ${val}${spec.unit} cukup tinggi untuk menahan laju penguapan dan menghambat penyulutan awal.`;
      } else if (key === 'rainfallMm') {
        interpretation =
          norm.normalizedRisk >= 0.75
            ? `Curah hujan ${val} ${spec.unit} menunjukkan minimnya pasokan air permukaan sehingga defisit lengas terus terakumulasi.`
            : norm.normalizedRisk >= 0.45
              ? `Curah hujan ${val} ${spec.unit} belum sepenuhnya mengompensasi penguapan harian pada lahan terbuka.`
              : `Curah hujan ${val} ${spec.unit} memberikan pembasahan efektif yang menjenuhkan lapisan serasah permukaan.`;
      } else if (key === 'peatMoisturePct') {
        interpretation =
          norm.normalizedRisk >= 0.65
            ? `Kadar air gambut ${val}${spec.unit} berisiko memicu sifat hidrofobik sementara dan kebakaran bawah permukaan (smoldering) yang persisten.`
            : norm.normalizedRisk >= 0.4
              ? `Kelembapan gambut ${val}${spec.unit} memerlukan perhatian hidrologis agar penurunan muka air tanah tidak berlanjut.`
              : `Kelembapan gambut ${val}${spec.unit} masih cukup basah untuk mempertahankan daya tahan lapisan organik terhadap penyalaan.`;
      } else {
        interpretation =
          norm.normalizedRisk >= 0.65
            ? `Indeks kondisi vegetasi ${val}${spec.unit} mencerminkan dominasi semak kering atau kanopi terbuka dengan kesinambungan bahan bakar tinggi.`
            : norm.normalizedRisk >= 0.4
              ? `Indeks kondisi vegetasi ${val}${spec.unit} menunjukkan tegakan sekunder campuran dengan kantong lahan terbuka yang mulai rentan.`
              : `Indeks kondisi vegetasi ${val}${spec.unit} menandakan tajuk hutan masih rapat dan lembap sehingga efektif meredam radiasi serta angin permukaan.`;
      }

      return {
        key,
        label: spec.label,
        observation: `${val} ${spec.unit} (indeks kerawanan parameter ${norm.normalizedPercent}%)`,
        mechanism: spec.scientificBasis,
        interpretation,
      };
    });

  return {
    overallHeadline,
    overallSummary,
    calibrationDisclosure,
    parameterExplanations,
  };
}

/**
 * Orkestrator utama Risk Engine: menjalankan validasi -> normalisasi -> perhitungan skor ->
 * klasifikasi kategori -> analisis faktor -> penjelasan ilmiah secara terpisah dari Simulation Engine.
 */
export function evaluateFireRisk(
  input: EnvironmentalParametersInput,
  config: RiskModelConfig,
  options: RiskEvaluationOptions = {}
): RiskEvaluationResult {
  const dataSourceMode = options.dataSourceMode ?? 'simulasi';
  const isSimulationData =
    dataSourceMode === 'simulasi' || config.isSimulationConfig;
  const simulationNotice =
    dataSourceMode === 'simulasi'
      ? 'Mode Data Simulasi: nilai parameter lingkungan merupakan skenario latihan edukasi untuk pembelajaran analisis kerawanan, bukan pengukuran sensor lapangan real-time.'
      : 'Mode Input Manual Simulasi: parameter dimasukkan pengguna untuk menguji respons Risk Engine (bukan laporan resmi BMKG/KLHK).';

  const parameterValidation = validateEnvironmentalParameters(input);
  const modelValidation = validateRiskModelConfig(config);

  if (!parameterValidation.isValid || !parameterValidation.validParameters) {
    return {
      status: 'invalid-parameters',
      dataSourceMode,
      isSimulationData,
      simulationNotice,
      parameterValidation,
      modelValidation,
      modelConfig: config,
      normalizedParameters: null,
      score: null,
      category: null,
      categoryPresentation: null,
      contributingFactors: null,
      scientificExplanation: null,
    };
  }

  const normalizedParameters = normalizeEnvironmentalParameters(
    parameterValidation.validParameters
  );

  if (
    !modelValidation.isReadyForCalculation ||
    !config.weights ||
    !config.thresholds
  ) {
    return {
      status: 'awaiting-model-configuration',
      dataSourceMode,
      isSimulationData,
      simulationNotice,
      parameterValidation,
      modelValidation,
      modelConfig: config,
      normalizedParameters,
      score: null,
      category: null,
      categoryPresentation: null,
      contributingFactors: null,
      scientificExplanation: null,
    };
  }

  const score = calculateVulnerabilityScore(normalizedParameters, config.weights);
  const category = classifyRiskCategory(score, config.thresholds);
  const categoryPresentation = getRiskCategoryPresentation(category);
  const contributingFactors = analyzeContributingFactors(
    normalizedParameters,
    config.weights,
    score
  );
  const scientificExplanation = generateScientificExplanations(
    parameterValidation.validParameters,
    normalizedParameters,
    category,
    contributingFactors,
    config
  );

  return {
    status: 'completed',
    dataSourceMode,
    isSimulationData,
    simulationNotice,
    parameterValidation,
    modelValidation,
    modelConfig: config,
    normalizedParameters,
    score,
    category,
    categoryPresentation,
    contributingFactors,
    scientificExplanation,
  };
}

/**
 * Preset data lingkungan mode simulasi untuk 14 kabupaten/kota Kalimantan Barat.
 * Seluruh entri ditandai eksplisit sebagai DATA SIMULASI.
 */
export const SIMULATION_ENVIRONMENT_PRESETS: Record<
  string,
  SimulationEnvironmentPreset
> = {
  'kubu-raya': {
    regionId: 'kubu-raya',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · SEKTOR DELTA GAMBUT',
    scenarioNote:
      'Skenario puncak musim kering pada kubah gambut Kuala Dua dengan muka air kanal menurun.',
    parameters: {
      airTemperatureC: 35.5,
      airHumidityPct: 44,
      rainfallMm: 2,
      peatMoisturePct: 24,
      vegetationConditionPct: 38,
    },
  },
  ketapang: {
    regionId: 'ketapang',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · SEKTOR GAMBUT SELATAN',
    scenarioNote:
      'Skenario defisit hujan beruntun di koridor Pawan–Kendawangan dengan tutupan semak kering.',
    parameters: {
      airTemperatureC: 36.0,
      airHumidityPct: 42,
      rainfallMm: 1,
      peatMoisturePct: 22,
      vegetationConditionPct: 34,
    },
  },
  'kayong-utara': {
    regionId: 'kayong-utara',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · PENYANGGA KONSERVASI',
    scenarioNote:
      'Skenario gambut pesisir Simpang Hilir pada hari tanpa hujan dengan kelembapan udara rendah.',
    parameters: {
      airTemperatureC: 34.5,
      airHumidityPct: 48,
      rainfallMm: 3,
      peatMoisturePct: 27,
      vegetationConditionPct: 45,
    },
  },
  sintang: {
    regionId: 'sintang',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · LEMBAH KAPUAS–MELAWI',
    scenarioNote:
      'Skenario transisi musim pada mosaik hutan sekunder dan lahan terbuka lembah aluvial.',
    parameters: {
      airTemperatureC: 32.5,
      airHumidityPct: 58,
      rainfallMm: 12,
      peatMoisturePct: 54,
      vegetationConditionPct: 52,
    },
  },
  sambas: {
    regionId: 'sambas',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · PESISIR UTARA',
    scenarioNote:
      'Skenario hembusan angin laut siang hari pada lahan basah dan gambut dangkal pesisir.',
    parameters: {
      airTemperatureC: 33.0,
      airHumidityPct: 60,
      rainfallMm: 14,
      peatMoisturePct: 50,
      vegetationConditionPct: 56,
    },
  },
  mempawah: {
    regionId: 'mempawah',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · PESISIR BARAT',
    scenarioNote:
      'Skenario gambut terfragmentasi di sepanjang koridor sungai pesisir Mempawah.',
    parameters: {
      airTemperatureC: 33.0,
      airHumidityPct: 57,
      rainfallMm: 10,
      peatMoisturePct: 48,
      vegetationConditionPct: 50,
    },
  },
  bengkayang: {
    regionId: 'bengkayang',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · PERBUKITAN BARAT LAUT',
    scenarioNote:
      'Skenario lahan terbuka dan ilalang lereng perbukitan Bengkayang pada siang kering.',
    parameters: {
      airTemperatureC: 31.5,
      airHumidityPct: 61,
      rainfallMm: 18,
      peatMoisturePct: 62,
      vegetationConditionPct: 49,
    },
  },
  landak: {
    regionId: 'landak',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · CEKUNGAN DAS LANDAK',
    scenarioNote:
      'Skenario hutan sekunder dan lahan budidaya dengan curah hujan sedang.',
    parameters: {
      airTemperatureC: 31.0,
      airHumidityPct: 64,
      rainfallMm: 22,
      peatMoisturePct: 60,
      vegetationConditionPct: 58,
    },
  },
  melawi: {
    regionId: 'melawi',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · LEMBAH SUNGAI MELAWI',
    scenarioNote:
      'Skenario penyangga pegunungan Schwaner dengan variasi kelembapan lembah.',
    parameters: {
      airTemperatureC: 30.5,
      airHumidityPct: 66,
      rainfallMm: 24,
      peatMoisturePct: 64,
      vegetationConditionPct: 62,
    },
  },
  'kota-pontianak': {
    regionId: 'kota-pontianak',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · GAMBUT PERKOTAAN',
    scenarioNote:
      'Skenario lahan gambut dangkal pinggiran kota khatulistiwa dengan pemanasan siang tinggi.',
    parameters: {
      airTemperatureC: 34.0,
      airHumidityPct: 55,
      rainfallMm: 9,
      peatMoisturePct: 42,
      vegetationConditionPct: 44,
    },
  },
  sanggau: {
    regionId: 'sanggau',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · TANAH MINERAL & HUTAN LINDUNG',
    scenarioNote:
      'Skenario sektor aman dengan dominasi tanah mineral lembap dan tajuk hutan terjaga.',
    parameters: {
      airTemperatureC: 27.5,
      airHumidityPct: 80,
      rainfallMm: 62,
      peatMoisturePct: 78,
      vegetationConditionPct: 82,
    },
  },
  sekadau: {
    regionId: 'sekadau',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · LEMBAH SEKADAU',
    scenarioNote:
      'Skenario kondusif dengan pasokan hujan lokal memadai dan kelembapan tajuk baik.',
    parameters: {
      airTemperatureC: 28.0,
      airHumidityPct: 78,
      rainfallMm: 58,
      peatMoisturePct: 76,
      vegetationConditionPct: 80,
    },
  },
  'kapuas-hulu': {
    regionId: 'kapuas-hulu',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · HULU KONSERVASI SENTARUM',
    scenarioNote:
      'Skenario hutan hujan tropis pegunungan hulu dengan kelembapan kanopi dan tanah tinggi.',
    parameters: {
      airTemperatureC: 26.0,
      airHumidityPct: 86,
      rainfallMm: 78,
      peatMoisturePct: 84,
      vegetationConditionPct: 90,
    },
  },
  'kota-singkawang': {
    regionId: 'kota-singkawang',
    isSimulation: true,
    simulationTag: 'DATA SIMULASI · PESISIR & GUNUNG POTENG',
    scenarioNote:
      'Skenario kota pesisir dengan pengaruh penahan kelembapan hutan lindung Gunung Poteng.',
    parameters: {
      airTemperatureC: 28.5,
      airHumidityPct: 77,
      rainfallMm: 54,
      peatMoisturePct: 74,
      vegetationConditionPct: 79,
    },
  },
};

export function getSimulationEnvironmentPreset(
  regionId: string | undefined
): SimulationEnvironmentPreset {
  const normalized = regionId?.trim().toLowerCase() ?? 'kubu-raya';
  return (
    SIMULATION_ENVIRONMENT_PRESETS[normalized] ??
    SIMULATION_ENVIRONMENT_PRESETS['kubu-raya']
  );
}
