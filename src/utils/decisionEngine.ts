import { REGION_BRIEFING_CONTENT } from '../data/briefingData';
import type { RegionStatus } from '../types/mission';
import { INITIAL_SIMULATION_HOTSPOTS } from './gisEngine';
import { findRegionById } from './regionHelpers';
import {
  getSimulationEnvironmentPreset,
  type RiskEvaluationResult,
} from './riskEngine';
import {
  submitDecisionResultToScoringEngine,
  type ActionSuitabilityLevel,
  type DecisionScoreBreakdown,
  type MitigationActionId,
  type ScoringStorageAdapter,
  type ScoringSubmissionReceipt,
} from './scoringEngine';

export type LandCategory =
  | 'gambut-dalam'
  | 'gambut-pesisir-dangkal'
  | 'mineral-lembah'
  | 'perbukitan-ilalang'
  | 'hutan-lindung-konservasi';

export type MissionFirePhase =
  | 'kebakaran-aktif'
  | 'siaga-kritis-tanpa-api'
  | 'pencegahan-dini';

export interface MitigationActionSpec {
  id: MitigationActionId;
  code: string;
  label: string;
  shortLabel: string;
  roleCategory:
    | 'pencegahan-hidrologi'
    | 'pencegahan-fisik'
    | 'deteksi-dini'
    | 'penanggulangan-aktif';
  roleCategoryLabel: string;
  isPreventive: boolean;
  description: string;
  scientificMechanism: string;
  preventiveVsActiveRule: string;
  idealConditionsSummary: string;
}

export interface CaseConsiderationSpec {
  id: string;
  label: string;
  detail: string;
  isRelevantToCase: boolean;
  scientificHint: string;
}

export interface MissionEnvironmentalSnapshot {
  airTemperatureC: number;
  airHumidityPct: number;
  rainfallMm: number;
  peatMoisturePct: number;
  vegetationConditionPct: number;
  waterTableDepthCm: number | null;
  windSpeedKmh: number;
  windDirection: string;
  slopePct: number;
  distanceToWaterSourceKm: number;
  hasPeatSoil: boolean;
  hasCanalNetwork: boolean;
  settlementProximity: 'dekat' | 'sedang' | 'jauh';
  accessNote: string;
}

export interface MissionDecisionContext {
  regionId: string;
  regionName: string;
  missionId: string;
  missionCode: string;
  scenarioTitle: string;
  landType: string;
  landCategory: LandCategory;
  riskLevel: RegionStatus;
  firePhase: MissionFirePhase;
  firePhaseLabel: string;
  firePhaseDescription: string;
  handlingObjective: string;
  environmentalConditions: MissionEnvironmentalSnapshot;
  caseConsiderations: CaseConsiderationSpec[];
  liveRiskScore: number | null;
  liveRiskCategoryLabel: string | null;
  isSimulation: true;
}

export interface DecisionSelectionInput {
  actionId: MitigationActionId;
  selectedConsiderationIds?: string[];
  playerRationaleNote?: string;
}

export interface SuitabilityAssessment {
  level: ActionSuitabilityLevel;
  label: string;
  summary: string;
  isPreventiveNotReplacementForActiveFire: boolean;
}

export interface ScientificAnalysisOutput {
  actionMechanism: string;
  caseSpecificReasoning: string;
  preventiveVsActiveClarification: string;
  matchedFactors: string[];
  riskGaps: string[];
}

export interface SimulationConsequenceOutput {
  outcomeTier: 'positif' | 'parsial' | 'negatif';
  headline: string;
  narrative: string;
  projectedRiskDeltaLabel: string;
  projectedWaterTableEffect: string;
  projectedFireSpreadEffect: string;
  operationalImpact: string;
}

export interface DecisionScoreOutput {
  totalScore: number;
  maxScore: 100;
  isPerfectScore: boolean;
  scoreCappedDueToConditions: boolean;
  capReason: string | null;
  breakdown: DecisionScoreBreakdown;
  consideredRelevantCount: number;
  totalRelevantCount: number;
  selectedMisconceptionsCount: number;
  rubricNotes: string[];
}

export interface DecisionEvaluationResult {
  evaluatedAtIso: string;
  context: MissionDecisionContext;
  selectedAction: MitigationActionSpec;
  selectedConsiderationIds: string[];
  playerRationaleNote: string;
  suitability: SuitabilityAssessment;
  scientificAnalysis: ScientificAnalysisOutput;
  simulationConsequence: SimulationConsequenceOutput;
  decisionScore: DecisionScoreOutput;
  scoringReceipt: ScoringSubmissionReceipt;
}

export const MITIGATION_ACTIONS: Record<MitigationActionId, MitigationActionSpec> = {
  rewetting: {
    id: 'rewetting',
    code: 'ACT-01',
    label: 'Pembasahan kembali gambut (rewetting)',
    shortLabel: 'Pembasahan Gambut (Rewetting)',
    roleCategory: 'pencegahan-hidrologi',
    roleCategoryLabel: 'Mitigasi Pencegahan Hidrologis',
    isPreventive: true,
    description:
      'Memompa air dari sumber terdekat atau sumur bor pantau untuk menjenuhkan kembali lapisan gambut permukaan yang mulai mengering.',
    scientificMechanism:
      'Gambut tropis menjadi rentan terbakar dan bersifat hidrofobik jika kadar air turun di bawah ambang jenuh (~30–40%). Pembasahan kembali menaikkan kadar air pori gambut sehingga energi panas yang dibutuhkan untuk penyulutan meningkat drastis.',
    preventiveVsActiveRule:
      'Pembasahan gambut adalah tindakan pencegahan hidrologis sebelum api meluas; tindakan ini TIDAK dapat menggantikan respons pemadaman aktif oleh petugas berwenang apabila api atau bara sudah menyala.',
    idealConditionsSummary:
      'Efektif pada lahan gambut yang mengalami defisit lengas sebelum titik api aktif berkembang, dengan ketersediaan sumber air atau sumur bor.',
  },
  'canal-blocking': {
    id: 'canal-blocking',
    code: 'ACT-02',
    label: 'Sekat kanal (canal blocking)',
    shortLabel: 'Sekat Kanal (Canal Blocking)',
    roleCategory: 'pencegahan-hidrologi',
    roleCategoryLabel: 'Rekayasa Pencegahan Hidrologis',
    isPreventive: true,
    description:
      'Membangun tabat atau pintu air pada jaringan kanal drainase untuk menahan limpasan keluar dan menjaga tinggi muka air tanah gambut.',
    scientificMechanism:
      'Jaringan kanal drainase terbuka mempercepat penurunan tinggi muka air tanah (TMAT). Sekat kanal menahan aliran air sehingga TMAT terjaga mendekati batas aman -40 cm dan mencegah oksidasi lapisan gambut.',
    preventiveVsActiveRule:
      'Sekat kanal merupakan rekayasa pencegahan jangka menengah pada tata air gambut, BUKAN pengganti operasi pemadaman kebakaran aktif ketika api permukaan atau bara bawah tanah sudah berlangsung.',
    idealConditionsSummary:
      'Efektif pada bentang gambut berkanal drainase selama fase pra-kebakaran / siaga kekeringan, tidak relevan di lereng perbukitan mineral tanpa kanal.',
  },
  firebreak: {
    id: 'firebreak',
    code: 'ACT-03',
    label: 'Sekat bakar sesuai kondisi lokasi',
    shortLabel: 'Sekat Bakar Sesuai Lokasi',
    roleCategory: 'pencegahan-fisik',
    roleCategoryLabel: 'Mitigasi Pencegahan Fisik',
    isPreventive: true,
    description:
      'Membentuk jalur pemutus bahan bakar permukaan (sekat bersih atau sabuk vegetasi lembap) dengan orientasi yang disesuaikan terhadap angin, lereng, dan batas kawasan lindung.',
    scientificMechanism:
      'Memutus kesinambungan bahan bakar halus (serasah, ilalang, semak kering) agar radiasi dan konveksi nyala api tidak melompat ke petak berikutnya. Di lereng curam harus sejajar punggung/kontur atas; di gambut dalam tidak cukup tanpa pengendalian hidrologi bawah permukaan.',
    preventiveVsActiveRule:
      'Sekat bakar berfungsi sebagai penghalang pasif penjalaran api permukaan dan BUKAN pengganti pemadaman aktif oleh petugas berwenang apabila api sudah membakar petak target.',
    idealConditionsSummary:
      'Sangat efektif pada zona semak/ilalang berlereng, koridor penyangga kawasan lindung/permukiman, serta harus disesuaikan dengan vektor angin dominan.',
  },
  'monitoring-reporting': {
    id: 'monitoring-reporting',
    code: 'ACT-04',
    label: 'Pemantauan dan pelaporan',
    shortLabel: 'Pemantauan & Pelaporan',
    roleCategory: 'deteksi-dini',
    roleCategoryLabel: 'Deteksi Dini & Kesiapsiagaan',
    isPreventive: true,
    description:
      'Melaksanakan patroli lapangan, pengecekan parameter cuaca dan tinggi muka air, verifikasi titik panas satelit, serta pelaporan cepat ke posko pengendali.',
    scientificMechanism:
      'Deteksi dini memangkas jeda waktu antara munculnya gejala kekeringan atau percikan awal dengan intervensi lapangan, sehingga eskalasi luas area terbakar dapat ditekan sejak dini.',
    preventiveVsActiveRule:
      'Pemantauan dan pelaporan hanya menyediakan informasi dan peringatan dini; langkah ini TIDAK memadamkan api dan tidak boleh menggantikan tindakan pemadaman aktif saat kebakaran terjadi.',
    idealConditionsSummary:
      'Tepat untuk wilayah berstatus aman atau fase pencegahan dini untuk menjaga kesiagaan dan validasi data lapangan, tidak memadai sebagai aksi tunggal pada status bahaya aktif.',
  },
  'authorized-suppression': {
    id: 'authorized-suppression',
    code: 'ACT-05',
    label: 'Respons pemadaman oleh petugas yang berwenang',
    shortLabel: 'Respons Pemadaman Berwenang',
    roleCategory: 'penanggulangan-aktif',
    roleCategoryLabel: 'Penanggulangan Kebakaran Aktif',
    isPreventive: false,
    description:
      'Mengerahkan regu pemadam resmi terlatih (Manggala Agni, BPBD, Damkar, dan MPA terkoordinasi) dengan pompa bertekanan, tombak injeksi gambut, atau dukungan air taktis.',
    scientificMechanism:
      'Memutus tiga komponen segitiga api (panas, bahan bakar, oksigen) secara langsung melalui pendinginan bertekanan, pemutusan perimeter aktif, serta mopping-up bara di bawah permukaan tanah gambut.',
    preventiveVsActiveRule:
      'Wajib diprioritaskan ketika kebakaran aktif atau bara menyala terdeteksi karena tindakan mitigasi pencegahan tidak pernah bisa menggantikan pemadaman kebakaran aktif.',
    idealConditionsSummary:
      'Mutlak diperlukan pada fase kebakaran aktif dengan memperhatikan jarak sumber air, akses medan/lereng, dan tindak lanjut pencegahan pasca-pemadaman.',
  },
};

export const MITIGATION_ACTION_LIST: MitigationActionSpec[] = [
  MITIGATION_ACTIONS.rewetting,
  MITIGATION_ACTIONS['canal-blocking'],
  MITIGATION_ACTIONS.firebreak,
  MITIGATION_ACTIONS['monitoring-reporting'],
  MITIGATION_ACTIONS['authorized-suppression'],
];

interface RegionDecisionBlueprint {
  landCategory: LandCategory;
  firePhase: MissionFirePhase;
  handlingObjective: string;
  waterTableDepthCm: number | null;
  windSpeedKmh: number;
  windDirection: string;
  slopePct: number;
  distanceToWaterSourceKm: number;
  hasPeatSoil: boolean;
  hasCanalNetwork: boolean;
  settlementProximity: 'dekat' | 'sedang' | 'jauh';
  accessNote: string;
  caseConsiderations: CaseConsiderationSpec[];
}

const REGION_DECISION_BLUEPRINTS: Record<string, RegionDecisionBlueprint> = {
  'kubu-raya': {
    landCategory: 'gambut-dalam',
    firePhase: 'kebakaran-aktif',
    handlingObjective:
      'Menghentikan penjalaran bara aktif di kubah gambut Kuala Dua dan mencegah paparan asap ke koridor permukiman serta Bandara Supadio.',
    waterTableDepthCm: -58,
    windSpeedKmh: 18,
    windDirection: 'Barat Daya ke Timur Laut',
    slopePct: 1,
    distanceToWaterSourceKm: 1.4,
    hasPeatSoil: true,
    hasCanalNetwork: true,
    settlementProximity: 'dekat',
    accessNote: 'Akses selang 1,4 km dari kanal primer Sungai Kapuas Kecil',
    caseConsiderations: [
      {
        id: 'kr-water-table',
        label: 'Perhitungkan kedalaman muka air gambut kritis (-58 cm) & bara bawah permukaan',
        detail: 'Gambut dalam mengalami smoldering di bawah permukaan yang butuh injeksi air bertekanan.',
        isRelevantToCase: true,
        scientificHint: 'Muka air < -40 cm memicu kebakaran gambut bawah permukaan.',
      },
      {
        id: 'kr-wind-corridor',
        label: 'Prioritaskan proteksi koridor permukiman & Bandara Supadio searah angin (18 km/jam)',
        detail: 'Arah angin barat daya mendorong asap langsung ke fasilitas vital.',
        isRelevantToCase: true,
        scientificHint: 'Vektor angin menentukan sisi perimeter yang harus diamankan lebih dahulu.',
      },
      {
        id: 'kr-water-access',
        label: 'Rencanakan estafet pompa dari kanal primer berjarak 1,4 km untuk mopping-up',
        detail: 'Kebutuhan tekanan air tinggi menuntut rangkaian pompa estafet ke lokasi bara.',
        isRelevantToCase: true,
        scientificHint: 'Jarak 1,4 km melebihi batas selang tunggal 600 m sehingga perlu pompa estafet.',
      },
      {
        id: 'kr-misconception-preventive',
        label: 'Cukup pasang sekat kanal tanpa pengerahan pemadaman aktif karena asap masih tipis',
        detail: 'Menggantikan operasi pemadaman aktif hanya dengan rekayasa hidrologis pencegahan.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: sekat kanal bersifat preventif dan tidak memadamkan bara yang sudah menyala.',
      },
    ],
  },
  ketapang: {
    landCategory: 'gambut-dalam',
    firePhase: 'kebakaran-aktif',
    handlingObjective:
      'Memadamkan titik api aktif di rawa gambut selatan Pawan–Kendawangan dengan keterbatasan jarak posko 14,5 km.',
    waterTableDepthCm: -64,
    windSpeedKmh: 19,
    windDirection: 'Tenggara ke Barat Laut',
    slopePct: 2,
    distanceToWaterSourceKm: 2.6,
    hasPeatSoil: true,
    hasCanalNetwork: true,
    settlementProximity: 'sedang',
    accessNote: 'Jarak posko terdekat 14,5 km di koridor Matan Hilir; butuh embung taktis',
    caseConsiderations: [
      {
        id: 'kt-logistics',
        label: 'Antisipasi waktu tempuh posko (14,5 km) dengan mobilisasi cepat & embung cadangan',
        detail: 'Keterlambatan logistik memperbesar luas perimeter api di lahan semak kering 47%.',
        isRelevantToCase: true,
        scientificHint: 'Jarak > 10 km menuntut pos aju dan cadangan air portabel.',
      },
      {
        id: 'kt-peat-drought',
        label: 'Perhitungkan defisit air gambut (-64 cm) & tutupan semak kering 47%',
        detail: 'Api permukaan di semak kering menyulut lapisan rawa gambut di bawahnya.',
        isRelevantToCase: true,
        scientificHint: 'Kombinasi api permukaan cepat dan bara gambut butuh pemadaman berlapis.',
      },
      {
        id: 'kt-water-supply',
        label: 'Pastikan pasokan air berkesinambungan dari titik sumber 2,6 km',
        detail: 'Pemadaman gambut selatan memerlukan volume air besar agar bara tidak menyala ulang.',
        isRelevantToCase: true,
        scientificHint: 'Volume air tidak memadai menyebabkan re-ignition pada smoldering.',
      },
      {
        id: 'kt-misconception-monitor',
        label: 'Tunda pengerahan petugas pemadam dan cukup lakukan pelaporan berkala harian',
        detail: 'Mengandalkan pemantauan pasif saat titik api aktif sudah menyala di koridor Pawan.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: pelaporan tidak memadamkan kebakaran aktif yang terus meluas.',
      },
    ],
  },
  'kayong-utara': {
    landCategory: 'gambut-dalam',
    firePhase: 'siaga-kritis-tanpa-api',
    handlingObjective:
      'Memulihkan kejenuhan air gambut penyangga Gunung Palung sebelum api permukaan menyala dari lahan semak luar batas konservasi.',
    waterTableDepthCm: -52,
    windSpeedKmh: 16,
    windDirection: 'Barat Laut ke Timur Laut (ke kaki gunung)',
    slopePct: 3,
    distanceToWaterSourceKm: 1.1,
    hasPeatSoil: true,
    hasCanalNetwork: true,
    settlementProximity: 'sedang',
    accessNote: 'Terdapat parit penyangga & pengaruh pasang surut sungai Teluk Batang',
    caseConsiderations: [
      {
        id: 'ku-hydrology',
        label: 'Manfaatkan siklus pasang surut Teluk Batang untuk menaikkan TMAT di atas -35 cm',
        detail: 'Muka air saat ini -52 cm di zona penyangga berjarak 2,3 km dari hutan konservasi.',
        isRelevantToCase: true,
        scientificHint: 'Pembasahan & pintu air pasang surut menstabilkan kelembapan gambut penyangga.',
      },
      {
        id: 'ku-conservation-buffer',
        label: 'Lindungi batas Taman Nasional Gunung Palung (2,3 km) searah angin laut 16 km/jam',
        detail: 'Angin siang mendorong potensi rambatan ke arah kaki pegunungan konservasi.',
        isRelevantToCase: true,
        scientificHint: 'Zona penyangga 2,3 km memerlukan kesiapan sekat pelindung vegetasi primer.',
      },
      {
        id: 'ku-readiness',
        label: 'Siagakan koordinasi petugas berwenang jika patroli mendeteksi percikan api',
        detail: 'Pencegahan hidrologis tetap perlu disandingkan dengan protokol eskalasi pemadaman.',
        isRelevantToCase: true,
        scientificHint: 'Pencegahan tidak menggantikan pemadaman jika penyulutan benar-benar terjadi.',
      },
      {
        id: 'ku-misconception-ignore-peat',
        label: 'Abaikan kondisi muka air tanah -52 cm karena kanopi Gunung Palung masih hijau',
        detail: 'Menganggap hutan konservasi aman tanpa memulihkan gambut penyangga di luar batas.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: kebakaran biasanya bermula dari lahan gambut terlantar di luar batas.',
      },
    ],
  },
  sintang: {
    landCategory: 'mineral-lembah',
    firePhase: 'siaga-kritis-tanpa-api',
    handlingObjective:
      'Memutus potensi rambatan api permukaan pada mosaik semak sekunder di sepanjang koridor jalan darat dan pertemuan Sungai Kapuas–Melawi.',
    waterTableDepthCm: null,
    windSpeedKmh: 13,
    windDirection: 'Selatan ke Utara',
    slopePct: 6,
    distanceToWaterSourceKm: 0.9,
    hasPeatSoil: false,
    hasCanalNetwork: false,
    settlementProximity: 'dekat',
    accessNote: 'Dekat Sungai Kapuas–Melawi (0,9 km), kepadatan perlintasan darat tinggi',
    caseConsiderations: [
      {
        id: 'st-road-corridor',
        label: 'Fokuskan pemutusan bahan bakar kering di sepanjang koridor jalan akses darat',
        detail: 'Lahan terbuka dan semak sekunder di tepi jalan memiliki risiko penyulutan tertinggi.',
        isRelevantToCase: true,
        scientificHint: 'Semak kering menyebarkan api permukaan jauh lebih cepat dibanding hutan sekunder lembap.',
      },
      {
        id: 'st-river-access',
        label: 'Manfaatkan akses sungai berjarak 0,9 km dan pos Masyarakat Peduli Api (MPA)',
        detail: 'Penyeberangan sungai memengaruhi waktu respons kendaraan pemadam berat.',
        isRelevantToCase: true,
        scientificHint: 'Perahu patroli & pompa portabel tepi sungai mempercepat intervensi awal.',
      },
      {
        id: 'st-mineral-soil',
        label: 'Sesuaikan strategi untuk tanah mineral & rawa lebak (bukan kubah gambut dalam)',
        detail: 'Dominasi vegetasi campuran dan tanah mineral tidak memerlukan sekat kanal gambut dalam.',
        isRelevantToCase: true,
        scientificHint: 'Intervensi sekat bakar lokal dan patroli koridor lebih sesuai daripada tabat gambut.',
      },
      {
        id: 'st-misconception-canal',
        label: 'Prioritaskan pembangunan sekat kanal gambut dalam di perbukitan lembah Melawi',
        detail: 'Menerapkan solusi hidrologi gambut dalam pada lahan mineral tanpa jaringan kanal.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: ekosistem lembah mineral tidak memiliki jaringan kanal drainase gambut.',
      },
    ],
  },
  sambas: {
    landCategory: 'gambut-pesisir-dangkal',
    firePhase: 'siaga-kritis-tanpa-api',
    handlingObjective:
      'Mengantisipasi penyebaran api permukaan akibat angin laut 22 km/jam pada lahan berpasir dan gambut dangkal pesisir Paloh–Subah.',
    waterTableDepthCm: -36,
    windSpeedKmh: 22,
    windDirection: 'Barat Laut ke Tenggara (angin laut)',
    slopePct: 2,
    distanceToWaterSourceKm: 1.5,
    hasPeatSoil: true,
    hasCanalNetwork: true,
    settlementProximity: 'sedang',
    accessNote: 'Saluran irigasi tersier pesisir tersedia, hembusan angin laut kuat',
    caseConsiderations: [
      {
        id: 'sb-wind-angle',
        label: 'Orientasikan jalur sekat bakar tegak lurus terhadap vektor angin laut (22 km/jam)',
        detail: 'Angin laut konsisten membentuk pola elips penjalaran memanjang ke arah daratan.',
        isRelevantToCase: true,
        scientificHint: 'Sekat tegak lurus arah angin paling efektif memotong muka api permukaan.',
      },
      {
        id: 'sb-sandy-moisture',
        label: 'Jaga tata air mikro saluran tersier karena tanah berpasir cepat mengering (31%)',
        detail: 'Daya ikat air lapisan berpasir rendah sehingga pengeringan siang berlangsung cepat.',
        isRelevantToCase: true,
        scientificHint: 'Pengaturan pintu air mikro menahan lengas petak pertanian tanpa bakar.',
      },
      {
        id: 'sb-mangrove-belt',
        label: 'Pertahankan zona penyangga menuju sabuk mangrove pantai barat (3,1 km)',
        detail: 'Sabuk pantai menjadi pelindung alami terhadap angin kencang dan abrasi.',
        isRelevantToCase: true,
        scientificHint: 'Vegetasi lembap tepi pantai berfungsi sebagai penghalang api alami.',
      },
      {
        id: 'sb-misconception-ignore-wind',
        label: 'Buat sekat bakar sejajar arah angin agar tidak terhalang hembusan laut',
        detail: 'Menempatkan jalur pemutus bahan bakar sejajar arah tiupan angin barat laut.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: sekat sejajar angin membiarkan lidah api dan bara terbang melaju lurus.',
      },
    ],
  },
  mempawah: {
    landCategory: 'gambut-pesisir-dangkal',
    firePhase: 'siaga-kritis-tanpa-api',
    handlingObjective:
      'Menjaga kestabilan tinggi muka air tanah antarblok gambut terfragmentasi di koridor Anjongan–Sungai Pinyuh tanpa memicu salinisasi berlebih.',
    waterTableDepthCm: -41,
    windSpeedKmh: 15,
    windDirection: 'Barat ke Timur',
    slopePct: 1,
    distanceToWaterSourceKm: 0.8,
    hasPeatSoil: true,
    hasCanalNetwork: true,
    settlementProximity: 'dekat',
    accessNote: 'Terhubung jalan lintas barat (0,6 km) dengan pintu air kanal tersier',
    caseConsiderations: [
      {
        id: 'mp-gate-control',
        label: 'Atur pintu air kanal satu arah pada TMAT -41 cm agar air tidak cepat surut',
        detail: 'Fragmentasi kanal membuat petak gambut mengering tidak merata antarblok.',
        isRelevantToCase: true,
        scientificHint: 'Sekat/pintu air menahan muka air tanah di atas batas kritis -40 cm.',
      },
      {
        id: 'mp-salinity',
        label: 'Cegah intrusi air payau berlebih ke petak budidaya (jarak muara 4,2 km)',
        detail: 'Pintu air satu arah menahan air tawar dari hulu tanpa memasukkan salinitas tinggi.',
        isRelevantToCase: true,
        scientificHint: 'Salinitas tinggi merusak vegetasi pertanian dan meningkatkan serasah mati.',
      },
      {
        id: 'mp-corridor-access',
        label: 'Petakan hidran kanal di sisi jalan lintas barat (0,6 km) untuk kesiapan respons',
        detail: 'Kepadatan lalu lintas dapat menghambat manuver tangki jika titik air tidak tepat.',
        isRelevantToCase: true,
        scientificHint: 'Akses sumber air di tepi koridor mempercepat mobilisasi darurat bila api muncul.',
      },
      {
        id: 'mp-misconception-drain',
        label: 'Buka seluruh pintu kanal agar air cepat mengalir keluar sebelum kemarau memuncak',
        detail: 'Menguras cadangan air parit di lahan gambut terfragmentasi.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: drainase terbuka justru mempercepat pengeringan gambut dan risiko terbakar.',
      },
    ],
  },
  bengkayang: {
    landCategory: 'perbukitan-ilalang',
    firePhase: 'siaga-kritis-tanpa-api',
    handlingObjective:
      'Memutus potensi rambatan cepat api permukaan pada lereng ilalang 18% di Sanggau Ledo sebelum mencapai punggung bukit.',
    waterTableDepthCm: null,
    windSpeedKmh: 17,
    windDirection: 'Lembah ke Puncak Lereng',
    slopePct: 18,
    distanceToWaterSourceKm: 1.9,
    hasPeatSoil: false,
    hasCanalNetwork: false,
    settlementProximity: 'sedang',
    accessNote: 'Lereng curam 18% pada elevasi 240 mdpl; sumber air lembah berjarak 1,9 km',
    caseConsiderations: [
      {
        id: 'bk-slope-physics',
        label: 'Tempatkan sekat bakar pada punggung bukit / sisi seberang puncak (lereng 18%)',
        detail: 'Konveksi panas dan kemiringan 18% mempercepat pemanasan awal ilalang di atas api.',
        isRelevantToCase: true,
        scientificHint: 'Menempatkan sekat di punggung bukit menghentikan efek cerobong angin lereng.',
      },
      {
        id: 'bk-non-peat',
        label: 'Kenali karakter non-gambut (ilalang & tanah mineral berlereng, bukan rawa berkanal)',
        detail: 'Kelembapan ilalang 29% cepat tersulut saat siang tanpa lapisan gambut dalam.',
        isRelevantToCase: true,
        scientificHint: 'Sekat kanal atau rewetting gambut tidak berlaku efektif di lereng mineral curam.',
      },
      {
        id: 'bk-gravity-water',
        label: 'Andalkan embung elevasi tinggi / pompa dorong bertingkat dari lembah 1,9 km',
        detail: 'Beda tinggi medan menyulitkan pompa tunggal dari dasar lembah.',
        isRelevantToCase: true,
        scientificHint: 'Kehilangan tekanan hidrostatis di medan miring menuntut perencanaan pasokan air atas.',
      },
      {
        id: 'bk-misconception-canal',
        label: 'Bangun sekat kanal gambut di sepanjang lereng curam 18% Sanggau Ledo',
        detail: 'Memaksakan teknik tabat gambut di lahan perbukitan mineral tanpa kanal.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: tidak ada jaringan kanal gambut dan air langsung mengalir turun mengikuti gravitasi.',
      },
    ],
  },
  landak: {
    landCategory: 'mineral-lembah',
    firePhase: 'siaga-kritis-tanpa-api',
    handlingObjective:
      'Melindungi tepi hutan sekunder (edge effect) Cagar Alam Mandor selama 14 hari tanpa hujan dengan jarak akses Sungai Landak.',
    waterTableDepthCm: null,
    windSpeedKmh: 12,
    windDirection: 'Barat Daya ke Timur Laut',
    slopePct: 5,
    distanceToWaterSourceKm: 0.6,
    hasPeatSoil: false,
    hasCanalNetwork: false,
    settlementProximity: 'sedang',
    accessNote: 'Debit Sungai Landak stabil; batas selang efektif pompa portabel 600 m',
    caseConsiderations: [
      {
        id: 'ld-edge-effect',
        label: 'Lindungi tepi Cagar Alam Mandor (1,7 km) dari pengeringan serasah akibat edge effect',
        detail: 'Paparan matahari dan angin di tepian terbuka mengeringkan serasah hutan sekunder (38%).',
        isRelevantToCase: true,
        scientificHint: 'Sabuk penyangga dan pembersihan bahan bakar tepi memutus lompatan api ke cagar alam.',
      },
      {
        id: 'ld-hose-limit',
        label: 'Petakan interval titik pompa ≤ 600 m sepanjang aliran Sungai Landak',
        detail: 'Kehilangan tekanan akibat gesekan membatasi jangkauan efektif selang portabel.',
        isRelevantToCase: true,
        scientificHint: 'Perhitungan jangkauan 600 m memastikan seluruh sabuk tepi tercover pasokan air.',
      },
      {
        id: 'ld-dry-streak',
        label: 'Tingkatkan kesiagaan MPA mengingat durasi 14 hari tanpa hujan terus berlanjut',
        detail: 'Akumulasi defisit hujan mendorong bahan bakar halus mendekati ambang penyulutan.',
        isRelevantToCase: true,
        scientificHint: 'Sinergi sekat fisik dan patroli MPA mencegah penyulutan di koridor Ngabang–Mandor.',
      },
      {
        id: 'ld-misconception-no-prep',
        label: 'Anggap Cagar Alam Mandor sepenuhnya kebal api karena masih ada kanopi pohon',
        detail: 'Mengabaikan kerentanan tepi hutan berpasir yang sudah 14 hari tanpa hujan.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: tepian hutan terfragmentasi justru sangat rentan menjadi jalur masuk api.',
      },
    ],
  },
  melawi: {
    landCategory: 'perbukitan-ilalang',
    firePhase: 'siaga-kritis-tanpa-api',
    handlingObjective:
      'Menutup titik buta pemantauan di lembah hangat Sungai Melawi dan melindungi sabuk penyangga Bukit Baka–Bukit Raya.',
    waterTableDepthCm: null,
    windSpeedKmh: 11,
    windDirection: 'Lembah Pinoh ke Perbukitan Selatan',
    slopePct: 14,
    distanceToWaterSourceKm: 1.2,
    hasPeatSoil: false,
    hasCanalNetwork: false,
    settlementProximity: 'sedang',
    accessNote: 'Jangkauan menara 8,5 km terhalang kontur bukit; tajuk atas masih lembap 67%',
    caseConsiderations: [
      {
        id: 'ml-blind-spot',
        label: 'Eliminasi titik buta (blind spot) lembah tertutup kontur di luar garis pandang menara',
        detail: 'Lembah hangat (33,4 °C) lebih kering daripada puncak bukit yang bertajuk lembap 67%.',
        isRelevantToCase: true,
        scientificHint: 'Kombinasi menara elevasi tinggi dan patroli lembah menutup celah deteksi dini.',
      },
      {
        id: 'ml-valley-buffer',
        label: 'Kelola bahan bakar perladangan lembah agar tidak melompat ke batas taman nasional (4,8 km)',
        detail: 'Pembukaan lahan tidak terkontrol di lembah dapat merambat naik ke zona penyangga.',
        isRelevantToCase: true,
        scientificHint: 'Sekat bakar vegetasi produktif di tepi ladang menahan api permukaan di lembah.',
      },
      {
        id: 'ml-gravity-hydrant',
        label: 'Manfaatkan hidran bergravitasi dari aliran perbukitan untuk titik rawan lembah',
        detail: 'Beda ketinggian lembah-perbukitan memungkinkan suplai air tanpa pompa berat.',
        isRelevantToCase: true,
        scientificHint: 'Rekayasa gravitasi mempermudah kesiapsiagaan di wilayah berakses darat terbatas.',
      },
      {
        id: 'ml-misconception-rewetting',
        label: 'Lakukan proyek pembasahan kubah gambut dalam di puncak Pegunungan Schwaner',
        detail: 'Menerapkan tindakan gambut pada ekosistem hutan perbukitan tanah mineral.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: Melawi didominasi tanah mineral berbukit, bukan kubah gambut dalam.',
      },
    ],
  },
  'kota-pontianak': {
    landCategory: 'gambut-pesisir-dangkal',
    firePhase: 'kebakaran-aktif',
    handlingObjective:
      'Memadamkan titik api awal pada gambut dangkal pinggiran kota (<500 m dari permukiman) dan melindungi kualitas udara perkotaan dari paparan PM2.5.',
    waterTableDepthCm: -32,
    windSpeedKmh: 10,
    windDirection: 'Utara ke Pusat Kota (inversi malam)',
    slopePct: 0.5,
    distanceToWaterSourceKm: 0.4,
    hasPeatSoil: true,
    hasCanalNetwork: true,
    settlementProximity: 'dekat',
    accessNote: 'Waktu respons Damkar 12 menit melalui jalan kota; tersedia sumur bor & parit',
    caseConsiderations: [
      {
        id: 'pt-urban-smoke',
        label: 'Prioritaskan pemadaman cepat karena permukiman berada < 500 m dan PM2.5 sensitif',
        detail: 'Inversi suhu malam memerangkap partikulat asap gambut di permukaan tanah kota.',
        isRelevantToCase: true,
        scientificHint: 'Pemadaman total mencegah akumulasi PM2.5 berbahaya di kawasan padat penduduk.',
      },
      {
        id: 'pt-borehole-water',
        label: 'Integrasikan pasokan sumur bor dalam saat parit pasang surut Kapuas sedang surut',
        detail: 'Muka air parit -32 cm berfluktuasi mengikuti pasang surut Sungai Kapuas Kecil.',
        isRelevantToCase: true,
        scientificHint: 'Sumur bor menjaga tekanan air pemadaman tetap stabil tanpa bergantung pasang.',
      },
      {
        id: 'pt-rapid-access',
        label: 'Manfaatkan waktu respons Damkar 12 menit untuk mopping-up lapisan gambut dangkal',
        detail: 'Akses jalan kota yang baik memungkinkan pengerahan armada bertekanan segera.',
        isRelevantToCase: true,
        scientificHint: 'Mopping-up menyeluruh memastikan bara gambut dangkal tidak menyala kembali malam hari.',
      },
      {
        id: 'pt-misconception-passive',
        label: 'Biarkan terbakar ringan karena luas petak kota kecil dan angin malam hanya 10 km/jam',
        detail: 'Meremehkan dampak partikulat gambut di kawasan padat penduduk saat inversi malam.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: angin lemah dan inversi malam justru memerangkap asap pekat di permukiman.',
      },
    ],
  },
  sanggau: {
    landCategory: 'hutan-lindung-konservasi',
    firePhase: 'pencegahan-dini',
    handlingObjective:
      'Mempertahankan status aman hutan lindung tanah mineral DAS Kapuas Tengah sekaligus menjaga kesiapan dukungan logistik lintas kabupaten.',
    waterTableDepthCm: null,
    windSpeedKmh: 8,
    windDirection: 'Timur ke Barat',
    slopePct: 7,
    distanceToWaterSourceKm: 0.7,
    hasPeatSoil: false,
    hasCanalNetwork: false,
    settlementProximity: 'sedang',
    accessNote: 'Pasokan air Kapuas Tengah melimpah; kelembapan kanopi stabil 74%',
    caseConsiderations: [
      {
        id: 'sg-canopy-stability',
        label: 'Pertahankan patroli pengawasan akses hutan agar kelembapan tajuk 74% tetap terjaga',
        detail: 'Suhu lantai hutan sejuk (27,8 °C) dan tanah mineral lempung menjaga ketahanan alami.',
        isRelevantToCase: true,
        scientificHint: 'Pemantauan dini menjaga kanopi tetap utuh dari gangguan pembukaan lahan ilegal.',
      },
      {
        id: 'sg-resource-allocation',
        label: 'Hindari pengerahan penuh armada pemadam darurat di zona aman agar siap bantu sektor bahaya',
        detail: 'Alokasi logistik strategis lintas sektor menjaga kapasitas respons untuk Kubu Raya/Ketapang.',
        isRelevantToCase: true,
        scientificHint: 'Efisiensi sumber daya mencegah kekosongan regu di wilayah kritis.',
      },
      {
        id: 'sg-ndvi-audit',
        label: 'Pantau indeks vegetasi koridor perkebunan terbuka sebagai indikator transisi kemarau',
        detail: 'Perubahan dini di tepi koridor budidaya menjadi sinyal awal peningkatan kerawanan.',
        isRelevantToCase: true,
        scientificHint: 'Deteksi perubahan tutupan dini lebih hemat biaya dibanding pemadaman darurat.',
      },
      {
        id: 'sg-misconception-canal',
        label: 'Bangun sekat kanal gambut dalam darurat meskipun wilayah berstatus aman dan bertanah mineral',
        detail: 'Mengalokasikan anggaran sekat kanal pada tanah mineral yang tidak memiliki kubah gambut.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: Sanggau didominasi tanah mineral (hanya 14% rawa lokal) dan berstatus aman.',
      },
    ],
  },
  sekadau: {
    landCategory: 'hutan-lindung-konservasi',
    firePhase: 'pencegahan-dini',
    handlingObjective:
      'Memastikan desa siaga api Belitang–Sekadau Hilir mempertahankan pengelolaan lahan tanpa bakar dan kesiapan tandon 5.000 liter.',
    waterTableDepthCm: null,
    windSpeedKmh: 9,
    windDirection: 'Tenggara ke Barat Laut',
    slopePct: 4,
    distanceToWaterSourceKm: 0.8,
    hasPeatSoil: false,
    hasCanalNetwork: false,
    settlementProximity: 'dekat',
    accessNote: 'Kesiapan tandon desa 85% dan jaringan anak sungai aktif berjarak 0,8 km',
    caseConsiderations: [
      {
        id: 'sk-village-patrol',
        label: 'Optimalkan pemantauan & pelaporan desa siaga api pada koridor pembukaan lahan kecil',
        detail: 'Kelembapan tanah mineral 68% aman, gangguan hanya berpotensi muncul dari kelalaian lokal.',
        isRelevantToCase: true,
        scientificHint: 'Patroli dan pelaporan komunitas menekan risiko pembakaran terbuka di tingkat tapak.',
      },
      {
        id: 'sk-tank-readiness',
        label: 'Audit kesiapan tandon air 5.000 liter (durasi ±20 menit pompa 250 L/menit) secara berkala',
        detail: 'Memastikan pasokan 15 menit pertama tetap siap di lokasi jauh dari tepi sungai.',
        isRelevantToCase: true,
        scientificHint: 'Kesiapan tandon menjamin jeda pengisian sebelum sumber air sungai dijangkau.',
      },
      {
        id: 'sk-natural-river',
        label: 'Manfaatkan sungai aktif (0,8 km) sebagai pembatas alami dan sumber air cadangan',
        detail: 'Aliran sungai membentuk sekat bakar alami antarpetak lahan budidaya.',
        isRelevantToCase: true,
        scientificHint: 'Memetakan sekat alami menghemat biaya rekayasa fisik yang tidak diperlukan.',
      },
      {
        id: 'sk-misconception-emergency',
        label: 'Kerahkan operasi pemadaman darurat skala penuh meski tidak ada titik api aktif',
        detail: 'Memobilisasi armada pemadaman penuh pada sektor aman berkelembapan tanah 68%.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: pengerahan darurat tanpa api aktif memboroskan sumber daya daerah rawan.',
      },
    ],
  },
  'kapuas-hulu': {
    landCategory: 'hutan-lindung-konservasi',
    firePhase: 'pencegahan-dini',
    handlingObjective:
      'Menjaga integritas daerah tangkapan air hulu Kalbar dan memantau penyusutan tepian danau musiman Danau Sentarum via telemetri surya.',
    waterTableDepthCm: null,
    windSpeedKmh: 7,
    windDirection: 'Pegunungan ke Lembah',
    slopePct: 9,
    distanceToWaterSourceKm: 0.5,
    hasPeatSoil: false,
    hasCanalNetwork: false,
    settlementProximity: 'jauh',
    accessNote: 'Wilayah terpencil terpantau pos surya & perairan Danau Sentarum',
    caseConsiderations: [
      {
        id: 'kh-sentarum-shore',
        label: 'Pantau penyusutan air musiman tepian Danau Sentarum pada citra GIS berkala',
        detail: 'Meski hutan pegunungan lembap (79%), tepian danau mengering menjadi padang rumput saat surut.',
        isRelevantToCase: true,
        scientificHint: 'Luas permukaan air menjadi indikator dini kerentanan tepian danau musiman.',
      },
      {
        id: 'kh-telemetry-power',
        label: 'Pastikan keandalan pos pemantau berdaya surya dan pelaporan radio wilayah terpencil',
        detail: 'Akses jaringan listrik dan jalan darat terbatas menuntut deteksi dini mandiri.',
        isRelevantToCase: true,
        scientificHint: 'Telemetri kontinu menjaga cakupan pantau 24 jam di koridor hulu.',
      },
      {
        id: 'kh-watershed-preserve',
        label: 'Hindari intervensi fisik berat yang mengganggu ekosistem inti taman nasional',
        detail: 'Tutupan tajuk 86% merupakan penyangga iklim mikro alami bagi seluruh DAS Kapuas.',
        isRelevantToCase: true,
        scientificHint: 'Konservasi pasif & pengawasan dini menjaga fungsi hidrologis tanpa merusak tajuk.',
      },
      {
        id: 'kh-misconception-clear',
        label: 'Buka jalur sekat bakar lebar di dalam zona inti hutan primer Betung Kerihun',
        detail: 'Membuka tajuk hutan hujan tropis yang sudah berkelembapan 86%.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: membuka kanopi hutan primer justru memasukkan radiasi matahari dan mengeringkan lantai hutan.',
      },
    ],
  },
  'kota-singkawang': {
    landCategory: 'hutan-lindung-konservasi',
    firePhase: 'pencegahan-dini',
    handlingObjective:
      'Menjaga kawasan resapan air Gunung Poteng tetap aman sekaligus mengawasi lahan semak pesisir Singkawang Selatan.',
    waterTableDepthCm: null,
    windSpeedKmh: 12,
    windDirection: 'Angin lembah–gunung berganti siang/malam',
    slopePct: 12,
    distanceToWaterSourceKm: 1.0,
    hasPeatSoil: false,
    hasCanalNetwork: false,
    settlementProximity: 'dekat',
    accessNote: 'Kontur lereng pesisir; kelurahan tangguh & hidran lereng selatan disiagakan',
    caseConsiderations: [
      {
        id: 'sw-poteng-catchment',
        label: 'Fokuskan pemantauan preventif pada kelurahan tangguh di kaki Gunung Poteng',
        detail: 'Menjaga tutupan lereng (kelembapan 73%) berarti melindungi sumber air bersih kota.',
        isRelevantToCase: true,
        scientificHint: 'Deteksi dini kelurahan tangguh mencegah gangguan vegetasi sejak gejala awal.',
      },
      {
        id: 'sw-south-shrub',
        label: 'Awasi transisi semak terbuka di Singkawang Selatan yang berbatasan dengan Bengkayang',
        detail: 'Kantong semak pesisir lebih cepat kering dibanding hutan lindung Gunung Poteng.',
        isRelevantToCase: true,
        scientificHint: 'Pemantauan terarah membedakan zona aman hutan lindung dari kantong semak selatan.',
      },
      {
        id: 'sw-slope-hydrant',
        label: 'Verifikasi kesiapan hidran kering di jalan menanjak sempit kaki bukit',
        detail: 'Truk besar sulit bermanuver sehingga koneksi hidran lereng wajib siap pakai.',
        isRelevantToCase: true,
        scientificHint: 'Audit kesiapan hidran memastikan respons cepat jika titik api muncul di lereng.',
      },
      {
        id: 'sw-misconception-peat',
        label: 'Terapkan rewetting gambut dalam di puncak lereng berbatu Gunung Poteng',
        detail: 'Memperlakukan hutan lindung pegunungan mineral sebagai kawasan gambut dalam.',
        isRelevantToCase: false,
        scientificHint: 'Keliru: Gunung Poteng merupakan hutan lindung pegunungan mineral, bukan kubah gambut.',
      },
    ],
  },
};

export function getFirePhasePresentation(phase: MissionFirePhase): {
  label: string;
  description: string;
  badgeClass: string;
} {
  if (phase === 'kebakaran-aktif') {
    return {
      label: 'Kebakaran / Bara Aktif Terdeteksi',
      description:
        'Titik api atau bara bawah permukaan aktif terpantau di sektor simulasi. Pemadaman oleh petugas berwenang mutlak diperlukan dan tidak dapat digantikan oleh mitigasi pencegahan.',
      badgeClass: 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]',
    };
  }
  if (phase === 'siaga-kritis-tanpa-api') {
    return {
      label: 'Siaga Kritis Pra-Kebakaran (Belum Ada Api Aktif)',
      description:
        'Kekeringan bahan bakar atau defisit muka air tanah berada pada level rawan tinggi/menengah, namun api aktif belum menyala sehingga mitigasi pencegahan tepat sasaran sangat menentukan.',
      badgeClass: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]',
    };
  }
  return {
    label: 'Pencegahan Dini & Pengawasan Ekosistem',
    description:
      'Kelembapan kanopi dan tanah masih terjaga aman. Fokus diarahkan pada pemantauan dini, kesiapsiagaan infrastruktur desa, dan efisiensi alokasi sumber daya lintas wilayah.',
    badgeClass: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]',
  };
}

export function getMissionDecisionContext(
  regionId: string | undefined,
  missionId?: string | null,
  liveRiskEvaluation?: RiskEvaluationResult | null
): MissionDecisionContext {
  const region = findRegionById(regionId) ?? findRegionById('kubu-raya')!;
  const blueprint =
    REGION_DECISION_BLUEPRINTS[region.id] ?? REGION_DECISION_BLUEPRINTS['kubu-raya'];
  const briefing = REGION_BRIEFING_CONTENT[region.id];
  const preset = getSimulationEnvironmentPreset(region.id);

  const matchedHotspot = missionId
    ? INITIAL_SIMULATION_HOTSPOTS.find(
        (h) =>
          h.id.toLowerCase() === missionId.trim().toLowerCase() &&
          h.regionId === region.id
      )
    : INITIAL_SIMULATION_HOTSPOTS.find((h) => h.regionId === region.id);

  const resolvedMissionId =
    missionId?.trim() || matchedHotspot?.id || `sim-${region.id}`;
  const resolvedMissionCode =
    matchedHotspot?.code ?? briefing?.defaultMissionCode ?? `SIM-${region.id.toUpperCase()}`;
  const resolvedScenarioTitle =
    matchedHotspot?.scenarioTitle ??
    briefing?.defaultScenarioTitle ??
    `Simulasi Mitigasi ${region.name}`;
  const resolvedLandType =
    matchedHotspot?.landType ?? briefing?.defaultLandType ?? region.biomeType;

  // Gabungkan parameter live dari Risk Engine bila tersedia & valid
  const liveParams =
    liveRiskEvaluation?.parameterValidation.validParameters ?? preset.parameters;
  const liveRiskScore =
    liveRiskEvaluation?.status === 'completed' ? liveRiskEvaluation.score : null;
  const liveRiskCategory =
    liveRiskEvaluation?.status === 'completed' ? liveRiskEvaluation.category : null;

  const effectiveRiskLevel: RegionStatus =
    liveRiskCategory === 'tinggi'
      ? 'bahaya'
      : liveRiskCategory === 'sedang'
        ? 'waspada'
        : liveRiskCategory === 'rendah'
          ? 'aman'
          : matchedHotspot?.riskLevel ?? region.status;

  // Jika pengguna di Risk Engine menaikkan kekeringan secara ekstrem ke Tinggi di sektor non-aktif,
  // fase tetap jelas: bila aslinya pencegahan-dini dan menjadi tinggi -> siaga-kritis-tanpa-api;
  // bila pengguna menurunkan kelembapan hingga rendah di sektor siaga -> tetap pakai fase kontekstual atau sesuaikan.
  let effectiveFirePhase: MissionFirePhase = blueprint.firePhase;
  if (blueprint.firePhase === 'pencegahan-dini' && effectiveRiskLevel !== 'aman') {
    effectiveFirePhase = 'siaga-kritis-tanpa-api';
  }

  const phaseMeta = getFirePhasePresentation(effectiveFirePhase);

  return {
    regionId: region.id,
    regionName: region.name,
    missionId: resolvedMissionId,
    missionCode: resolvedMissionCode,
    scenarioTitle: resolvedScenarioTitle,
    landType: resolvedLandType,
    landCategory: blueprint.landCategory,
    riskLevel: effectiveRiskLevel,
    firePhase: effectiveFirePhase,
    firePhaseLabel: phaseMeta.label,
    firePhaseDescription: phaseMeta.description,
    handlingObjective: blueprint.handlingObjective,
    environmentalConditions: {
      airTemperatureC: liveParams.airTemperatureC,
      airHumidityPct: liveParams.airHumidityPct,
      rainfallMm: liveParams.rainfallMm,
      peatMoisturePct: liveParams.peatMoisturePct,
      vegetationConditionPct: liveParams.vegetationConditionPct,
      waterTableDepthCm: blueprint.waterTableDepthCm,
      windSpeedKmh: blueprint.windSpeedKmh,
      windDirection: blueprint.windDirection,
      slopePct: blueprint.slopePct,
      distanceToWaterSourceKm: blueprint.distanceToWaterSourceKm,
      hasPeatSoil: blueprint.hasPeatSoil,
      hasCanalNetwork: blueprint.hasCanalNetwork,
      settlementProximity: blueprint.settlementProximity,
      accessNote: blueprint.accessNote,
    },
    caseConsiderations: blueprint.caseConsiderations,
    liveRiskScore,
    liveRiskCategoryLabel:
      liveRiskEvaluation?.categoryPresentation?.label ?? null,
    isSimulation: true,
  };
}

interface ActionEvaluationRuleOutput {
  suitabilityLevel: ActionSuitabilityLevel;
  suitabilityLabel: string;
  suitabilitySummary: string;
  baseActionPoints: number; // Max 60
  isPreventiveReplacementAttempt: boolean;
  caseSpecificReasoning: string;
  matchedFactors: string[];
  riskGaps: string[];
  consequenceOutcomeTier: 'positif' | 'parsial' | 'negatif';
  consequenceHeadline: string;
  consequenceNarrative: string;
  projectedRiskDeltaLabel: string;
  projectedWaterTableEffect: string;
  projectedFireSpreadEffect: string;
  operationalImpact: string;
  stemWeights: {
    science: number;
    technology: number;
    engineering: number;
    mathematics: number;
  };
}

function evaluateActionAgainstContext(
  context: MissionDecisionContext,
  action: MitigationActionSpec
): ActionEvaluationRuleOutput {
  const env = context.environmentalConditions;
  const isActiveFire = context.firePhase === 'kebakaran-aktif';
  const isCriticalPreFire = context.firePhase === 'siaga-kritis-tanpa-api';
  const isEarlyPrevention = context.firePhase === 'pencegahan-dini';

  // ATURAN MUTLAK 1: Pada fase kebakaran aktif, tindakan preventif BUKAN pengganti pemadaman aktif.
  if (isActiveFire) {
    if (action.id === 'authorized-suppression') {
      const peatNote = env.hasPeatSoil
        ? `Karena lokasi berupa ${context.landType} (kelembapan gambut ${env.peatMoisturePct}%, TMAT ${env.waterTableDepthCm ?? 'kritis'} cm), regu berwenang harus melakukan injeksi air ke bawah permukaan (mopping-up) agar bara smoldering tidak menyala ulang.`
        : `Regu pemadam memutus perimeter api permukaan dan mengamankan jalur dekat permukiman (${env.settlementProximity}).`;

      return {
        suitabilityLevel: 'sangat-sesuai',
        suitabilityLabel: 'Sangat Sesuai — Respons Wajib Kebakaran Aktif',
        suitabilitySummary:
          'Pengerahan petugas berwenang merupakan satu-satunya respons yang sah dan efektif untuk menghentikan api/bara yang sudah aktif, yang selanjutnya perlu ditindaklanjuti dengan pemulihan hidrologis.',
        baseActionPoints: 60,
        isPreventiveReplacementAttempt: false,
        caseSpecificReasoning: `${peatNote} Sumber air berjarak ${env.distanceToWaterSourceKm} km dan kecepatan angin ${env.windSpeedKmh} km/jam (${env.windDirection}) menentukan tata letak selang dan prioritas perimeter hilir angin.`,
        matchedFactors: [
          `Fase ${context.firePhaseLabel} menuntut pemutusan segitiga api aktif`,
          `Kondisi bahan bakar (${env.peatMoisturePct}% kelembapan) dan angin ${env.windSpeedKmh} km/jam ditangani langsung`,
          `Koordinasi sumber air (${env.distanceToWaterSourceKm} km) memandu taktik lapangan`,
        ],
        riskGaps: [
          'Pemadaman aktif tetap membutuhkan tindak lanjut pencegahan hidrologis pasca-padam agar gambut tidak terbakar ulang.',
        ],
        consequenceOutcomeTier: 'positif',
        consequenceHeadline: 'Api & Bara Aktif Berhasil Dikendalikan oleh Regu Berwenang',
        consequenceNarrative: `Dalam skenario simulasi ${context.regionName}, regu terlatih Manggala Agni/BPBD/Damkar segera mengamankan sisi hilir angin (${env.windDirection}) dan memadamkan titik nyala aktif. Setelah api padam, lokasi diserahkan untuk jadwal pembasahan/sekat kanal lanjutan.`,
        projectedRiskDeltaLabel: 'Api aktif terlokalisasi; perlu pemulihan pasca-padam',
        projectedWaterTableEffect: env.hasPeatSoil
          ? 'Penjenuhan lokal di titik bara; pemulihan TMAT menyeluruh tetap butuh rewetting/sekat kanal pasca-padam'
          : 'Pendinginan lapisan permukaan tanah mineral tercapai',
        projectedFireSpreadEffect:
          'Penjalaran api ke koridor permukiman dan aset vital berhasil dihentikan',
        operationalImpact:
          'Risiko paparan asap akut terhadap warga dan fasilitas publik ditekan secara signifikan.',
        stemWeights: {
          science: 92,
          technology: 88,
          engineering: 94,
          mathematics: 90,
        },
      };
    }

    // Pemain memilih tindakan preventif saat kebakaran aktif sedang terjadi!
    const isHydroAction =
      action.id === 'rewetting' || action.id === 'canal-blocking';
    const soilMismatch = isHydroAction && !env.hasPeatSoil;

    return {
      suitabilityLevel: soilMismatch ? 'tidak-sesuai' : 'kurang-tepat',
      suitabilityLabel: soilMismatch
        ? 'Tidak Sesuai — Salah Tipe Lahan & Mengabaikan Api Aktif'
        : 'Kurang Tepat — Pencegahan Tidak Menggantikan Pemadaman Aktif',
      suitabilitySummary:
        'Skenario berada pada fase kebakaran/bara aktif. Memilih tindakan mitigasi pencegahan tanpa respons pemadaman oleh petugas berwenang tidak akan menghentikan nyala api yang sedang berlangsung.',
      baseActionPoints: soilMismatch ? 16 : 26,
      isPreventiveReplacementAttempt: true,
      caseSpecificReasoning: `${action.preventiveVsActiveRule} Pada kondisi ${context.regionName} (suhu ${env.airTemperatureC} °C, RH ${env.airHumidityPct}%, angin ${env.windSpeedKmh} km/jam menuju ${env.windDirection}), proses pencegahan pasif terlalu lambat menghadapi laju rambatan energi panas aktif.`,
      matchedFactors: soilMismatch
        ? []
        : [
            `Relevan secara jangka panjang sebagai pendamping pada ${context.landType}, namun keliru jika menggantikan pemadaman aktif`,
          ],
      riskGaps: [
        'PELANGGARAN PRINSIP MITIGASI: Tindakan pencegahan diperlakukan seolah-olah menggantikan pemadaman kebakaran aktif',
        `Api aktif terus terdorong angin ${env.windSpeedKmh} km/jam (${env.windDirection}) sementara intervensi pencegahan belum memutus segitiga api`,
      ],
      consequenceOutcomeTier: 'negatif',
      consequenceHeadline: 'Eskalasi Kebakaran Aktif Akibat Keterlambatan Respons Pemadaman',
      consequenceNarrative: `Dalam simulasi ${context.regionName}, hanya mengandalkan "${action.label}" saat bara/api sudah menyala menyebabkan regu pemadam berwenang terlambat dimobilisasi. Api menjalar mengikuti angin ${env.windSpeedKmh} km/jam dan meningkatkan konsentrasi asap ke wilayah sekitar.`,
      projectedRiskDeltaLabel: 'Meningkat (Eskalasi Luas Terbakar & Asap)',
      projectedWaterTableEffect: env.hasPeatSoil
        ? 'Lapisan gambut atas terus teroksidasi dan terbakar sebelum air sempat menjenuhkan zona bara'
        : 'Tidak berpengaruh terhadap penahanan nyala api aktif',
      projectedFireSpreadEffect:
        'Perimeter api meluas tidak terkendali dan mengancam koridor penyangga terdekat',
      operationalImpact:
        'Memaksa pengerahan darurat yang lebih berat dan memperpanjang durasi krisis kabut asap.',
      stemWeights: {
        science: 48,
        technology: 55,
        engineering: 45,
        mathematics: 50,
      },
    };
  }

  // FASE 2: SIAGA KRITIS PRA-KEBAKARAN (BELUM ADA API AKTIF)
  if (isCriticalPreFire) {
    // Kasus A: Lahan Gambut (Kubu Raya/Ketapang/Kayong Utara/Mempawah/Sambas/Pontianak)
    if (env.hasPeatSoil) {
      if (action.id === 'canal-blocking') {
        const deepPeatBonus = context.landCategory === 'gambut-dalam';
        return {
          suitabilityLevel: 'sangat-sesuai',
          suitabilityLabel: 'Sangat Sesuai — Intervensi Hidrologis Gambut',
          suitabilitySummary:
            'Pembangunan atau pengaturan sekat kanal sangat tepat untuk menahan penurunan muka air tanah gambut sebelum penyulutan terjadi.',
          baseActionPoints: 58,
          isPreventiveReplacementAttempt: false,
          caseSpecificReasoning: `Pada ${context.landType} dengan TMAT ${env.waterTableDepthCm ?? -45} cm dan keberadaan jaringan kanal drainase, sekat kanal memperlambat aliran keluar air tanah dan menjaga zona kapiler tetap basah di atas ambang kritis -40 cm.`,
          matchedFactors: [
            `Kecocokan tipe lahan (${context.landType}) dengan jaringan kanal aktif`,
            `Menjawab masalah defisit tinggi muka air tanah (${env.waterTableDepthCm ?? -45} cm)`,
            'Mencegah gambut memasuki fase hidrofobik sebelum percikan api terjadi',
          ],
          riskGaps: [
            'Perlu dipadukan dengan kesiapan regu berwenang bila sewaktu-waktu muncul titik api terbuka.',
          ],
          consequenceOutcomeTier: 'positif',
          consequenceHeadline: 'Muka Air Tanah Gambut Stabil Menahan Kekeringan Musiman',
          consequenceNarrative: `Dalam simulasi ${context.regionName}, sekat kanal menahan air di petak-petak gambut kritis. Laju penurunan TMAT melambat dan kelembapan lapisan permukaan (${env.peatMoisturePct}%) berangsur pulih tanpa memicu oksidasi lanjutan.`,
          projectedRiskDeltaLabel: deepPeatBonus
            ? 'Menurun Signifikan (Stabilitas Hidrologis Terjaga)'
            : 'Menurun Moderat (Tata Air Blok Terkendali)',
          projectedWaterTableEffect:
            'Tinggi muka air tanah gambut naik bertahap menuju zona aman (-35 cm s.d. -25 cm)',
          projectedFireSpreadEffect:
            'Kerentanan penyalaan bawah permukaan (smoldering) berkurang drastis',
          operationalImpact:
            'Mengurangi beban pemadaman darurat di puncak kemarau, tetap disarankan menjaga patroli pintu air.',
          stemWeights: {
            science: 94,
            technology: 88,
            engineering: 96,
            mathematics: 88,
          },
        };
      }

      if (action.id === 'rewetting') {
        return {
          suitabilityLevel: 'sangat-sesuai',
          suitabilityLabel: 'Sangat Sesuai — Pemulihan Kelembapan Gambut',
          suitabilitySummary:
            'Pembasahan kembali gambut menaikkan kadar air lapisan atas yang sudah mengalami defisit hujan sebelum titik api terbentuk.',
          baseActionPoints: 57,
          isPreventiveReplacementAttempt: false,
          caseSpecificReasoning: `Kelembapan gambut sebesar ${env.peatMoisturePct}% disertai curah hujan rendah (${env.rainfallMm} mm/hari) membuat gambut rentan mengering. Pemompaan air dari sumber ${env.distanceToWaterSourceKm} km secara langsung memulihkan kadar air permukaan dan mengurangi potensi sulutan.`,
          matchedFactors: [
            `Kesesuaian langsung dengan kadar air gambut rendah (${env.peatMoisturePct}%)`,
            `Sumber air berjarak ${env.distanceToWaterSourceKm} km memungkinkan operasi pompa pembasahan`,
            'Tepat dijalankan pada fase siaga pra-kebakaran sebelum nyala api aktif muncul',
          ],
          riskGaps: [
            'Tanpa sekat kanal pendamping, air hasil pembasahan dapat cepat mengalir keluar kembali.',
          ],
          consequenceOutcomeTier: 'positif',
          consequenceHeadline: 'Kelembapan Lapisan Gambut Permukaan Pulih di Zona Rawan',
          consequenceNarrative: `Simulasi di ${context.regionName} menunjukkan operasi pembasahan berhasil menjenuhkan serasah dan gambut permukaan di blok prioritas sehingga potensi penyulutan awal menurun tajam.`,
          projectedRiskDeltaLabel: 'Menurun Signifikan (Kelembapan Permukaan Meningkat)',
          projectedWaterTableEffect:
            'Kadar air gambut permukaan meningkat ±15–22% dan mencegah sifat hidrofobik',
          projectedFireSpreadEffect:
            'Lapisan permukaan tidak mudah tersulut percikan api ringan',
          operationalImpact:
            'Perlu dikombinasikan dengan penahanan air kanal agar efisiensi pemompaan terjaga.',
          stemWeights: {
            science: 95,
            technology: 86,
            engineering: 92,
            mathematics: 87,
          },
        };
      }

      if (action.id === 'firebreak') {
        const windSensitive = env.windSpeedKmh >= 18;
        return {
          suitabilityLevel: windSensitive ? 'sangat-sesuai' : 'sesuai-bersyarat',
          suitabilityLabel: windSensitive
            ? 'Sangat Sesuai — Proteksi Angin & Zona Penyangga'
            : 'Sesuai Bersyarat — Perlu Pendamping Hidrologis Gambut',
          suitabilitySummary:
            'Sekat bakar yang diarahkan sesuai vektor angin sangat berguna melindungi batas kawasan lindung/permukiman, namun pada lahan gambut tetap harus dibarengi kontrol tata air.',
          baseActionPoints: windSensitive ? 54 : 49,
          isPreventiveReplacementAttempt: false,
          caseSpecificReasoning: `Angin ${env.windSpeedKmh} km/jam (${env.windDirection}) berpotensi membawa api permukaan dengan cepat di semak pesisir/penyangga. Sekat bakar memutus bahan bakar permukaan, tetapi pada tanah gambut (${env.peatMoisturePct}%) api bawah tanah tetap bisa merambat di bawah jalur bersih jika muka air tidak dinaikkan.`,
          matchedFactors: [
            `Memperhitungkan kecepatan angin (${env.windSpeedKmh} km/jam) dan batas kawasan`,
            `Melindungi koridor permukiman (${env.settlementProximity}) dari api permukaan`,
          ],
          riskGaps: [
            'Sekat bakar permukaan pada tanah gambut tidak menahan rambatan bara di bawah permukaan tanah tanpa pembasahan/sekat kanal.',
          ],
          consequenceOutcomeTier: 'parsial',
          consequenceHeadline: 'Jalur Permukaan Terputus, Namun Gambut Masih Kering di Bawahnya',
          consequenceNarrative: `Di ${context.regionName}, sekat bakar berhasil memutus kesinambungan semak kering di permukaan searah angin ${env.windDirection}. Namun kelembapan gambut (${env.peatMoisturePct}%) tetap membutuhkan dukungan tata air agar tidak rawan terbakar di bawah tanah.`,
          projectedRiskDeltaLabel: 'Menurun Moderat (Risiko Permukaan Terbatas)',
          projectedWaterTableEffect:
            'Tidak mengubah tinggi muka air tanah gambut secara langsung',
          projectedFireSpreadEffect:
            'Rambatan api permukaan tertahan pada sabuk penyangga, risiko bawah permukaan masih ada',
          operationalImpact:
            'Memberikan batas pertahanan fisik yang baik bagi kawasan lindung dan permukiman.',
          stemWeights: {
            science: 84,
            technology: 88,
            engineering: 90,
            mathematics: 85,
          },
        };
      }

      if (action.id === 'monitoring-reporting') {
        return {
          suitabilityLevel: 'kurang-tepat',
          suitabilityLabel: 'Kurang Tepat — Fase Siaga Kritis Butuh Intervensi Fisik/Hidrologis',
          suitabilitySummary:
            'Pemantauan saja tidak memperbaiki kondisi gambut kering atau menahan muka air tanah pada status siaga kritis.',
          baseActionPoints: 34,
          isPreventiveReplacementAttempt: false,
          caseSpecificReasoning: `Dengan suhu ${env.airTemperatureC} °C, RH ${env.airHumidityPct}%, dan kelembapan gambut ${env.peatMoisturePct}%, kondisi sudah melewati fase pengawasan pasif. Tanpa rewetting, sekat kanal, atau sekat bakar, bahan bakar akan terus mengering menuju titik kritis penyulutan.`,
          matchedFactors: [
            'Membantu memperbarui data observasi lapangan secara berkala',
          ],
          riskGaps: [
            `Tidak menaikkan kelembapan gambut (${env.peatMoisturePct}%) atau TMAT (${env.waterTableDepthCm ?? -40} cm)`,
            'Kerentanan kebakaran tetap tinggi apabila ada sumber percikan api',
          ],
          consequenceOutcomeTier: 'parsial',
          consequenceHeadline: 'Data Terpantau Akurat, Namun Defisit Air Gambut Berlanjut',
          consequenceNarrative: `Simulasi di ${context.regionName} menunjukkan laporan pengawasan tersampaikan cepat, tetapi karena tidak ada tindakan fisik atau hidrologis, gambut terus kehilangan kadar air setiap siang hari.`,
          projectedRiskDeltaLabel: 'Stagnan / Cenderung Naik Bertahap',
          projectedWaterTableEffect: 'TMAT terus turun akibat evaporasi siang hari',
          projectedFireSpreadEffect:
            'Bahan bakar kering tetap kontinyu apabila terjadi penyulutan',
          operationalImpact:
            'Posko memiliki informasi terkini tetapi masih rentan terhadap lonjakan titik api mendadak.',
          stemWeights: {
            science: 68,
            technology: 82,
            engineering: 50,
            mathematics: 70,
          },
        };
      }

      // authorized-suppression saat belum ada api aktif di gambut siaga kritis
      return {
        suitabilityLevel: 'sesuai-bersyarat',
        suitabilityLabel: 'Sesuai Bersyarat — Kesiapsiagaan Regu (Belum Ada Api Aktif)',
        suitabilitySummary:
          'Menyiagakan regu berwenang menjaga respons cepat, namun tanpa api aktif tindakan utama seharusnya difokuskan pada pembasahan/sekat kanal agar api tidak pernah muncul.',
        baseActionPoints: 42,
        isPreventiveReplacementAttempt: false,
        caseSpecificReasoning: `Belum ada nyala api aktif pada fase ${context.firePhaseLabel}. Mengandalkan mobilisasi pemadaman penuh sebelum api muncul kurang efisien secara sumber daya dibanding menaikkan TMAT (${env.waterTableDepthCm ?? -40} cm) melalui pencegahan hidrologis.`,
        matchedFactors: [
          'Menjamin waktu respons sangat singkat jika terjadi penyulutan mendadak',
        ],
        riskGaps: [
          'Belum mengatasi akar masalah kekeringan gambut atau defisit muka air tanah',
          'Menguras kesiapan regu pemadam sebelum kejadian kebakaran aktual',
        ],
        consequenceOutcomeTier: 'parsial',
        consequenceHeadline: 'Regu Siaga di Lokasi, Tetapi Gambut Tetap Rentan Mengering',
        consequenceNarrative: `Di ${context.regionName}, personel pemadam sudah siaga dengan selang dan pompa, tetapi karena tata air gambut tidak ditahan atau dibasahi, bahan bakar permukaan tetap kering.`,
        projectedRiskDeltaLabel: 'Stagnan (Kesiapan Tinggi, Kerentanan Lahan Tetap)',
        projectedWaterTableEffect: 'Tidak mengubah kadar air gambut secara berkelanjutan',
        projectedFireSpreadEffect: 'Pemadaman awal siap, tetapi peluang sulutan tetap tinggi',
        operationalImpact:
          'Biaya operasional regu tinggi sementara intervensi akar masalah hidrologis tertunda.',
        stemWeights: {
          science: 70,
          technology: 74,
          engineering: 72,
          mathematics: 68,
        },
      };
    }

    // Kasus B: Lahan Non-Gambut Siaga Kritis (Bengkayang lereng 18%, Sintang lembah, Landak tepi cagar, Melawi perbukitan)
    if (action.id === 'firebreak') {
      return {
        suitabilityLevel: 'sangat-sesuai',
        suitabilityLabel: 'Sangat Sesuai — Pemutus Bahan Bakar Sesuai Topografi',
        suitabilitySummary:
          'Sekat bakar yang dirancang mengikuti kontur medan dan arah angin sangat efektif untuk mengendalikan potensi api permukaan pada tanah mineral, semak sekunder, atau lereng ilalang.',
        baseActionPoints: 60,
        isPreventiveReplacementAttempt: false,
        caseSpecificReasoning: `Pada ${context.landType} (kemiringan ${env.slopePct}%, kelembapan vegetasi ${env.vegetationConditionPct}%, tanpa lapisan gambut dalam), penjalaran api didominasi bahan bakar permukaan. Penempatan sekat bakar ${env.slopePct >= 10 ? 'di punggung bukit / memotong lereng' : 'di tepi koridor akses dan batas cagar alam'} memutus rambatan nyala secara efektif.`,
        matchedFactors: [
          `Cocok untuk karakter non-gambut (${context.landType}) dengan kemiringan ${env.slopePct}%`,
          `Mengamankan zona penyangga terhadap laju angin ${env.windSpeedKmh} km/jam`,
          'Efisiensi tinggi tanpa memboroskan teknik hidrologi gambut yang tidak relevan',
        ],
        riskGaps: [
          'Perlu pemeliharaan kebersihan jalur sekat bakar dan koordinasi petugas bila api muncul.',
        ],
        consequenceOutcomeTier: 'positif',
        consequenceHeadline: 'Jalur Sekat Bakar Terkalibrasi Medan Memutus Risiko Rambatan',
        consequenceNarrative: `Simulasi di ${context.regionName} menunjukkan pembentukan sekat bakar sesuai kondisi medan (${env.slopePct >= 10 ? 'kontur punggung bukit' : 'koridor tepi hutan/jalan'}) memutus kesinambungan ilalang dan semak kering secara aman.`,
        projectedRiskDeltaLabel: 'Menurun Signifikan (Kontinuitas Bahan Bakar Terputus)',
        projectedWaterTableEffect:
          'Tidak berlaku (dominan tanah mineral non-gambut)',
        projectedFireSpreadEffect:
          'Potensi loncatan api menuju kawasan lindung atau puncak lereng berhasil dibatasi',
        operationalImpact:
          'Memberikan koridor kerja yang aman bagi tim patroli maupun regu pemadam bila diperlukan.',
        stemWeights: {
          science: 92,
          technology: 90,
          engineering: 96,
          mathematics: 92,
        },
      };
    }

    if (action.id === 'rewetting' || action.id === 'canal-blocking') {
      return {
        suitabilityLevel: 'tidak-sesuai',
        suitabilityLabel: 'Tidak Sesuai — Lahan Non-Gambut / Tanpa Jaringan Kanal',
        suitabilitySummary: `${action.label} tidak sesuai secara ilmiah pada ${context.landType} karena wilayah ini bukan ekosistem gambut berkanal drainase.`,
        baseActionPoints: 18,
        isPreventiveReplacementAttempt: false,
        caseSpecificReasoning: `${context.regionName} memiliki karakter ${context.landType} dengan kemiringan ${env.slopePct}% dan dominasi tanah mineral tanpa jaringan kanal gambut (hasPeatSoil = false). Air dari upaya pembasahan atau tabat akan mengalir turun mengikuti kontur lereng tanpa tersimpan seperti pada pori gambut.`,
        matchedFactors: [],
        riskGaps: [
          `Ketidaksesuaian ekologi: ${action.label} ditujukan untuk hidrologi gambut, bukan lereng/tanah mineral`,
          `Ilalang dan semak kering (${env.vegetationConditionPct}%) di permukaan tetap tersambung tanpa pemutus fisik`,
        ],
        consequenceOutcomeTier: 'negatif',
        consequenceHeadline: 'Rekayasa Hidrologi Gambut Gagal Menahan Kerawanan Tanah Mineral',
        consequenceNarrative: `Pada simulasi ${context.regionName}, upaya "${action.label}" tidak efektif karena air segera meresap atau mengalir turun pada kemiringan ${env.slopePct}%. Semak kering di permukaan tetap utuh dan berisiko terbakar cepat.`,
        projectedRiskDeltaLabel: 'Tidak Berubah / Risiko Permukaan Tetap Tinggi',
        projectedWaterTableEffect:
          'Air mengalir sebagai limpasan permukaan tanpa menahan kelembapan jangka panjang',
        projectedFireSpreadEffect:
          'Jalur semak dan ilalang kering tetap menjadi koridor penjalaran cepat',
        operationalImpact:
          'Pemborosan peralatan pompa dan tenaga kerja pada metode yang tidak cocok dengan jenis lahan.',
        stemWeights: {
          science: 40,
          technology: 55,
          engineering: 38,
          mathematics: 52,
        },
      };
    }

    if (action.id === 'monitoring-reporting') {
      return {
        suitabilityLevel: 'sesuai-bersyarat',
        suitabilityLabel: 'Sesuai Bersyarat — Perlu Disertai Sekat Fisik di Koridor Rawan',
        suitabilitySummary:
          'Pemantauan dan pelaporan mempercepat deteksi dini titik buta/koridor jalan, tetapi pada status waspada/siaga kritis tetap perlu dukungan pemutusan bahan bakar.',
        baseActionPoints: 46,
        isPreventiveReplacementAttempt: false,
        caseSpecificReasoning: `Di ${context.regionName}, deteksi dini melalui menara pengawas dan pos MPA sangat membantu memangkas waktu respons pada akses ${env.accessNote}. Namun, tanpa pemutusan bahan bakar permukaan (sekat bakar), kelanjutan hari tanpa hujan tetap menjaga potensi rambatan tinggi.`,
        matchedFactors: [
          'Menutup celah deteksi dini di jalur perlintasan atau titik buta kontur',
          'Mempercepat pelaporan ke posko berwenang saat gejala penyulutan muncul',
        ],
        riskGaps: [
          'Tidak mengurangi beban atau kesinambungan bahan bakar kering di lapangan',
        ],
        consequenceOutcomeTier: 'parsial',
        consequenceHeadline: 'Cakupan Deteksi Membaik, Bahan Bakar Permukaan Masih Tersambung',
        consequenceNarrative: `Simulasi di ${context.regionName} menunjukkan patroli dan pelaporan mampu memantau kondisi koridor lebih rapat, namun jalur ilalang atau tepi hutan masih memerlukan sekat bakar fisik.`,
        projectedRiskDeltaLabel: 'Menurun Ringan (Kesiagaan Deteksi Meningkat)',
        projectedWaterTableEffect: 'Tidak berlaku pada tanah mineral',
        projectedFireSpreadEffect:
          'Jeda waktu deteksi lebih singkat, tetapi laju rambatan fisik belum diputus',
        operationalImpact:
          'Meningkatkan akurasi koordinasi MPA sambil menunggu penguatan sekat fisik.',
        stemWeights: {
          science: 76,
          technology: 88,
          engineering: 68,
          mathematics: 78,
        },
      };
    }

    // authorized-suppression pada non-gambut siaga kritis
    return {
      suitabilityLevel: 'sesuai-bersyarat',
      suitabilityLabel: 'Sesuai Bersyarat — Kesiagaan Regu (Belum Ada Kebakaran Aktif)',
      suitabilitySummary:
        'Menempatkan regu berwenang menjaga respons bila muncul percikan, tetapi pada fase belum terbakar intervensi sekat bakar fisik lebih tepat guna.',
      baseActionPoints: 42,
      isPreventiveReplacementAttempt: false,
      caseSpecificReasoning: `Belum ada kebakaran aktif di ${context.regionName}. Menggerakkan unit pemadam penuh ke lereng atau lembah tanpa api aktif kurang optimal dibanding membangun sekat bakar sesuai topografi terlebih dahulu.`,
      matchedFactors: [
        'Menyiapkan rute akses pompa dan titik pengambilan air sejak awal',
      ],
      riskGaps: [
        'Alokasi sumber daya pemadam belum berbasis kejadian api aktual',
        'Bahan bakar permukaan kering masih belum diputus secara fisik',
      ],
      consequenceOutcomeTier: 'parsial',
      consequenceHeadline: 'Regu Siaga di Koridor, Namun Sekat Fisik Belum Terbangun',
      consequenceNarrative: `Personel pemadam siap merespons di ${context.regionName}, tetapi jalur semak kering tetap utuh sehingga regu berisiko harus memadamkan garis api yang lebih panjang jika terjadi penyulutan.`,
      projectedRiskDeltaLabel: 'Stagnan (Siaga Pasif)',
      projectedWaterTableEffect: 'Tidak berlaku pada tanah mineral',
      projectedFireSpreadEffect: 'Garis bahan bakar masih kontinyu',
      operationalImpact:
        'Kesiapan taktis terjaga dengan biaya siaga yang lebih tinggi.',
      stemWeights: {
        science: 72,
        technology: 75,
        engineering: 74,
        mathematics: 70,
      },
    };
  }

  // FASE 3: PENCEGAHAN DINI / WILAYAH AMAN (Sanggau, Sekadau, Kapuas Hulu, Kota Singkawang)
  if (isEarlyPrevention) {
    if (action.id === 'monitoring-reporting') {
      return {
        suitabilityLevel: 'sangat-sesuai',
        suitabilityLabel: 'Sangat Sesuai — Optimal untuk Wilayah Aman & Pencegahan Dini',
        suitabilitySummary:
          'Pemantauan dan pelaporan terstruktur adalah langkah paling efisien dan proporsional untuk menjaga stabilitas sektor aman sekaligus menyiapkan cadangan dukungan ke wilayah rawan.',
        baseActionPoints: 60,
        isPreventiveReplacementAttempt: false,
        caseSpecificReasoning: `Pada ${context.regionName} dengan kelembapan vegetasi ${env.vegetationConditionPct}%, kelembapan udara ${env.airHumidityPct}%, dan curah hujan ${env.rainfallMm} mm/hari, ekosistem tanah mineral dan hutan lindung masih stabil. Patroli preventif, audit tandon/hidran, dan pemantauan GIS menjaga deteksi dini tanpa mengganggu tajuk hutan atau memboroskan regu pemadam darurat.`,
        matchedFactors: [
          `Proporsional terhadap status aman (${env.vegetationConditionPct}% kondisi vegetasi, RH ${env.airHumidityPct}%)`,
          'Menjaga kesiapan logistik agar unit pemadam utama dapat membantu kabupaten berstatus bahaya',
          'Melindungi integritas tajuk hutan lindung tanpa pembukaan lahan berlebih',
        ],
        riskGaps: [
          'Tetap wajib mengaktifkan prosedur eskalasi cepat ke petugas berwenang apabila patroli menemukan pembukaan lahan dengan api.',
        ],
        consequenceOutcomeTier: 'positif',
        consequenceHeadline: 'Stabilitas Ekosistem Terjaga & Sumber Daya Lintas Sektor Efisien',
        consequenceNarrative: `Simulasi di ${context.regionName} menunjukkan patroli komunitas, telemetri, dan audit infrastruktur air menjaga zero-hotspot secara konsisten. Kapasitas cadangan dapat dialokasikan untuk mendukung wilayah bahaya di selatan Kalbar.`,
        projectedRiskDeltaLabel: 'Tetap Rendah & Terkendali',
        projectedWaterTableEffect:
          'Kelembapan tanah mineral dan daerah tangkapan air tetap stabil',
        projectedFireSpreadEffect:
          'Nihil penyulutan tidak terpantau; deteksi dini berjalan 24 jam',
        operationalImpact:
          'Efisiensi anggaran dan kesiapan logistik provinsi meningkat secara signifikan.',
        stemWeights: {
          science: 92,
          technology: 95,
          engineering: 88,
          mathematics: 94,
        },
      };
    }

    if (action.id === 'firebreak') {
      return {
        suitabilityLevel: 'sesuai-bersyarat',
        suitabilityLabel: 'Sesuai Bersyarat — Hanya untuk Kantong Semak Terbuka di Tepian',
        suitabilitySummary:
          'Pemeliharaan batas lahan terbuka di pinggir desa/perkebunan dapat bermanfaat, namun membuka jalur sekat bakar di dalam hutan lindung yang lembap justru merusak tajuk penahan iklim mikro.',
        baseActionPoints: 45,
        isPreventiveReplacementAttempt: false,
        caseSpecificReasoning: `Hutan lindung ${context.regionName} memiliki kelembapan tajuk tinggi (${env.vegetationConditionPct}% vegetasi). Pembukaan jalur sekat di kawasan inti justru menciptakan edge effect yang memasukkan radiasi matahari; sekat hanya relevan pada kantong semak terbuka di perbatasan budidaya.`,
        matchedFactors: [
          'Dapat diterapkan secara selektif hanya pada kantong semak tepian non-hutan primer',
        ],
        riskGaps: [
          'Berisiko merusak tutupan kanopi penahan kekeringan apabila diterapkan di dalam kawasan hutan lindung',
        ],
        consequenceOutcomeTier: 'parsial',
        consequenceHeadline: 'Batas Ladang Terkelola, Waspadai Pembukaan Kanopi Berlebih',
        consequenceNarrative: `Jika dibatasi pada tepi ladang terbuka di ${context.regionName}, sekat membantu memutus semak; namun pembersihan berlebihan di zona hutan lindung berpotensi menurunkan kelembapan lantai hutan.`,
        projectedRiskDeltaLabel: 'Netral / Perlu Pengawasan Edge Effect',
        projectedWaterTableEffect: 'Tidak berdampak langsung',
        projectedFireSpreadEffect: 'Terbatas pada koridor tepi budidaya',
        operationalImpact:
          'Membutuhkan tenaga pembersihan tambahan pada wilayah berisiko rendah.',
        stemWeights: {
          science: 74,
          technology: 78,
          engineering: 76,
          mathematics: 72,
        },
      };
    }

    if (action.id === 'rewetting' || action.id === 'canal-blocking') {
      return {
        suitabilityLevel: 'tidak-sesuai',
        suitabilityLabel: 'Tidak Sesuai — Tanah Mineral Aman Tanpa Kebutuhan Tata Air Gambut',
        suitabilitySummary: `${action.label} tidak sesuai untuk ${context.regionName} karena wilayah ini berstatus aman dengan dominasi tanah mineral dan hutan lindung.`,
        baseActionPoints: 20,
        isPreventiveReplacementAttempt: false,
        caseSpecificReasoning: `${context.regionName} didominasi ${context.landType} dengan curah hujan ${env.rainfallMm} mm/hari dan tidak memiliki jaringan kanal drainase gambut kritis. Menerapkan rekayasa hidrologi gambut di sini tidak menjawab kebutuhan ekologis sektor.`,
        matchedFactors: [],
        riskGaps: [
          `Tidak ada lahan gambut terdrainase kritis di sektor utama ${context.regionName}`,
          'Mengalihkan dana dan peralatan dari sektor gambut selatan/pesisir yang sangat membutuhkan',
        ],
        consequenceOutcomeTier: 'negatif',
        consequenceHeadline: 'Salah Sasaran Ekosistem & Pemborosan Alokasi Sumber Daya',
        consequenceNarrative: `Simulasi di ${context.regionName} menunjukkan proyek "${action.label}" tidak memberikan manfaat mitigasi tambahan di tanah mineral lembap, sementara wilayah rawan seperti Kubu Raya dan Ketapang kekurangan peralatan pompa.`,
        projectedRiskDeltaLabel: 'Tidak Efisien (Salah Alokasi)',
        projectedWaterTableEffect: 'Tidak relevan dengan hidrologi tanah mineral berlereng',
        projectedFireSpreadEffect: 'Tidak memberikan pengurangan risiko yang berarti',
        operationalImpact:
          'Menurunkan efektivitas koordinasi sumber daya tingkat provinsi.',
        stemWeights: {
          science: 44,
          technology: 55,
          engineering: 42,
          mathematics: 50,
        },
      };
    }

    // authorized-suppression di wilayah aman tanpa api
    return {
      suitabilityLevel: 'kurang-tepat',
      suitabilityLabel: 'Kurang Tepat — Pengerahan Pemadaman Penuh Tanpa Api Aktif',
      suitabilitySummary:
        'Menggerakkan operasi pemadaman darurat penuh di sektor aman tanpa titik api aktif menyebabkan misalokasi regu dari wilayah berstatus bahaya.',
      baseActionPoints: 32,
      isPreventiveReplacementAttempt: false,
      caseSpecificReasoning: `Dengan kondisi lingkungan sejuk (${env.airTemperatureC} °C, RH ${env.airHumidityPct}%, hujan ${env.rainfallMm} mm/hari) dan nol titik api aktif, tugas utama sektor aman adalah pemantauan preventif dan dukungan cadangan, bukan operasi pemadaman darurat.`,
      matchedFactors: [
        'Protokol komando regu berwenang tetap penting bila terjadi kondisi darurat, tetapi bukan untuk pengerahan rutin di zona aman',
      ],
      riskGaps: [
        'Mengikat armada pemadam di sektor rendah risiko saat sektor bahaya membutuhkan bantuan',
      ],
      consequenceOutcomeTier: 'parsial',
      consequenceHeadline: 'Ketimpangan Distribusi Regu Pemadam Antarwilayah Kalbar',
      consequenceNarrative: `Dalam simulasi ${context.regionName}, pengerahan tim pemadam darurat di wilayah kondusif membuat cadangan bantuan untuk wilayah selatan/pesisir berkurang saat puncak kemarau.`,
      projectedRiskDeltaLabel: 'Stagnan di Lokal, Risiko Kekurangan Regu di Sektor Lain',
      projectedWaterTableEffect: 'Tidak relevan',
      projectedFireSpreadEffect: 'Tidak ada api aktif yang dipadamkan',
      operationalImpact:
        'Efisiensi logistik provinsi menurun akibat penempatan armada tidak proporsional.',
      stemWeights: {
        science: 64,
        technology: 68,
        engineering: 62,
        mathematics: 60,
      },
    };
  }

  // Fallback defensif
  return {
    suitabilityLevel: 'sesuai-bersyarat',
    suitabilityLabel: 'Sesuai Bersyarat',
    suitabilitySummary: 'Perlu penyesuaian kondisi lokal.',
    baseActionPoints: 45,
    isPreventiveReplacementAttempt: false,
    caseSpecificReasoning: 'Evaluasi disesuaikan dengan parameter kondisi lapangan.',
    matchedFactors: [],
    riskGaps: [],
    consequenceOutcomeTier: 'parsial',
    consequenceHeadline: 'Hasil Parsial',
    consequenceNarrative: 'Tindakan membutuhkan kalibrasi kondisi lokal.',
    projectedRiskDeltaLabel: 'Moderat',
    projectedWaterTableEffect: 'Terbatas',
    projectedFireSpreadEffect: 'Terbatas',
    operationalImpact: 'Perlu peninjauan lanjut.',
    stemWeights: { science: 70, technology: 70, engineering: 70, mathematics: 70 },
  };
}

/**
 * Mengevaluasi pilihan tindakan mitigasi pemain secara penuh:
 * 1. Memeriksa kesesuaian tindakan terhadap kondisi kasus & tipe lahan.
 * 2. Menyusun alasan ilmiah dan menegaskan batas pencegahan vs pemadaman aktif.
 * 3. Menghasilkan konsekuensi skenario simulasi.
 * 4. Menghitung skor keputusan (TIDAK pernah memberi nilai sempurna bila kondisi kasus diabaikan).
 * 5. Mengirimkan hasil ke Scoring Engine.
 */
export function evaluateMitigationDecision(
  context: MissionDecisionContext,
  input: DecisionSelectionInput,
  storage?: ScoringStorageAdapter | null
): DecisionEvaluationResult {
  const action = MITIGATION_ACTIONS[input.actionId];
  if (!action) {
    throw new Error(`Tindakan mitigasi "${String(input.actionId)}" tidak dikenal.`);
  }

  const rule = evaluateActionAgainstContext(context, action);

  // Analisis pertimbangan kondisi kasus oleh pemain
  const validIds = new Set(context.caseConsiderations.map((c) => c.id));
  const uniqueSelectedIds = Array.from(
    new Set((input.selectedConsiderationIds ?? []).filter((id) => validIds.has(id)))
  );

  const relevantSpecs = context.caseConsiderations.filter((c) => c.isRelevantToCase);
  const misconceptionSpecs = context.caseConsiderations.filter(
    (c) => !c.isRelevantToCase
  );

  const consideredRelevant = relevantSpecs.filter((c) =>
    uniqueSelectedIds.includes(c.id)
  );
  const selectedMisconceptions = misconceptionSpecs.filter((c) =>
    uniqueSelectedIds.includes(c.id)
  );

  const totalRelevantCount = relevantSpecs.length;
  const consideredRelevantCount = consideredRelevant.length;
  const selectedMisconceptionsCount = selectedMisconceptions.length;

  // Skor pertimbangan kondisi kasus (maks 40 poin)
  const conditionRatio =
    totalRelevantCount > 0 ? consideredRelevantCount / totalRelevantCount : 0;
  const caseConditionPoints = Math.round(conditionRatio * 40);

  // Penalti bila memilih asumsi keliru (misconception) atau menggantikan pemadaman aktif
  const misconceptionPenalty = selectedMisconceptionsCount * 14;
  const activeReplacementPenalty = rule.isPreventiveReplacementAttempt ? 10 : 0;
  const totalPenalty = misconceptionPenalty + activeReplacementPenalty;

  let rawTotal = rule.baseActionPoints + caseConditionPoints - totalPenalty;

  // ATURAN KETAT: Jangan memberikan nilai sempurna (100) hanya karena pemain memilih
  // tindakan yang benar tanpa mempertimbangkan kondisi kasus secara utuh.
  let scoreCappedDueToConditions = false;
  let capReason: string | null = null;

  if (consideredRelevantCount < totalRelevantCount) {
    const maxCapWithoutFullConditions =
      consideredRelevantCount === 0
        ? 72
        : Math.min(88, 72 + Math.round(conditionRatio * 16));
    if (rawTotal > maxCapWithoutFullConditions) {
      rawTotal = maxCapWithoutFullConditions;
    }
    scoreCappedDueToConditions = true;
    const missedLabels = relevantSpecs
      .filter((c) => !uniqueSelectedIds.includes(c.id))
      .map((c) => c.label);
    capReason = `Nilai tidak dapat mencapai skor sempurna (maks. ${maxCapWithoutFullConditions}/100) karena ${totalRelevantCount - consideredRelevantCount} kondisi spesifik kasus belum dipertimbangkan: ${missedLabels.join('; ')}.`;
  } else if (selectedMisconceptionsCount > 0) {
    if (rawTotal >= 100) {
      rawTotal = 86;
    }
    scoreCappedDueToConditions = true;
    capReason = `Terdapat ${selectedMisconceptionsCount} asumsi kondisi lapangan yang keliru sehingga nilai mendapat penalti dan tidak sempurna.`;
  } else if (rule.suitabilityLevel !== 'sangat-sesuai') {
    if (rawTotal >= 100) {
      rawTotal = 88;
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(rawTotal)));

  const rubricNotes: string[] = [
    `Kesesuaian tindakan (${rule.suitabilityLabel}): +${rule.baseActionPoints}/60 poin.`,
    `Pertimbangan kondisi kasus (${consideredRelevantCount}/${totalRelevantCount} faktor kunci terverifikasi): +${caseConditionPoints}/40 poin.`,
  ];

  if (totalPenalty > 0) {
    rubricNotes.push(
      `Penalti kekeliruan prinsip/kondisi (${selectedMisconceptionsCount} asumsi keliru${rule.isPreventiveReplacementAttempt ? ' + penggantian pemadaman aktif' : ''}): -${totalPenalty} poin.`
    );
  }
  if (capReason) {
    rubricNotes.push(capReason);
  }

  const preventiveVsActiveClarification = rule.isPreventiveReplacementAttempt
    ? `PERINGATAN BATAS PREVENTIF vs AKTIF: "${action.label}" adalah tindakan mitigasi pencegahan. Pada fase kebakaran/bara aktif di ${context.regionName}, tindakan pencegahan TIDAK BISA dan TIDAK BOLEH dijadikan pengganti respons pemadaman oleh petugas yang berwenang.`
    : action.preventiveVsActiveRule;

  const matchedFactors = [
    ...rule.matchedFactors,
    ...consideredRelevant.map((c) => `Kondisi kasus diperhitungkan: ${c.label}`),
  ];

  const missedCaseFactors = relevantSpecs
    .filter((c) => !uniqueSelectedIds.includes(c.id))
    .map((c) => `Kondisi kasus belum ditinjau: ${c.label}`);

  const riskGaps = [
    ...rule.riskGaps,
    ...missedCaseFactors,
    ...selectedMisconceptions.map((m) => `Asumsi keliru dipilih: ${m.label} (${m.scientificHint})`),
  ];

  const scientificAnalysis: ScientificAnalysisOutput = {
    actionMechanism: action.scientificMechanism,
    caseSpecificReasoning: rule.caseSpecificReasoning,
    preventiveVsActiveClarification,
    matchedFactors,
    riskGaps,
  };

  const simulationConsequence: SimulationConsequenceOutput = {
    outcomeTier:
      rule.consequenceOutcomeTier === 'positif' &&
      (consideredRelevantCount === 0 || selectedMisconceptionsCount > 0)
        ? 'parsial'
        : rule.consequenceOutcomeTier,
    headline:
      rule.consequenceOutcomeTier === 'positif' &&
      consideredRelevantCount === 0
        ? `${rule.consequenceHeadline} (Efektivitas Tertahan Tanpa Penyesuaian Lokasi)`
        : rule.consequenceHeadline,
    narrative:
      rule.consequenceOutcomeTier === 'positif' &&
      consideredRelevantCount < totalRelevantCount
        ? `${rule.consequenceNarrative} Catatan simulasi: karena sebagian kondisi spesifik lokasi belum diperhitungkan saat pengambilan keputusan, penyesuaian operasional di lapangan masih membutuhkan koreksi tambahan.`
        : rule.consequenceNarrative,
    projectedRiskDeltaLabel: rule.projectedRiskDeltaLabel,
    projectedWaterTableEffect: rule.projectedWaterTableEffect,
    projectedFireSpreadEffect: rule.projectedFireSpreadEffect,
    operationalImpact: rule.operationalImpact,
  };

  const decisionScore: DecisionScoreOutput = {
    totalScore: finalScore,
    maxScore: 100,
    isPerfectScore: finalScore === 100,
    scoreCappedDueToConditions,
    capReason,
    breakdown: {
      actionSuitabilityPoints: rule.baseActionPoints,
      caseConditionPoints,
      penaltyPoints: totalPenalty,
    },
    consideredRelevantCount,
    totalRelevantCount,
    selectedMisconceptionsCount,
    rubricNotes,
  };

  const suitability: SuitabilityAssessment = {
    level: rule.suitabilityLevel,
    label: rule.suitabilityLabel,
    summary: rule.suitabilitySummary,
    isPreventiveNotReplacementForActiveFire: rule.isPreventiveReplacementAttempt,
  };

  // Langkah 5: Kirim hasil evaluasi keputusan ke Scoring Engine
  const scoringReceipt = submitDecisionResultToScoringEngine(
    {
      regionId: context.regionId,
      regionName: context.regionName,
      missionId: context.missionId,
      missionCode: context.missionCode,
      scenarioTitle: context.scenarioTitle,
      landType: context.landType,
      riskLevel: context.riskLevel,
      actionId: action.id,
      actionLabel: action.label,
      suitability: suitability.level,
      suitabilityLabel: suitability.label,
      totalScore: finalScore,
      scoreBreakdown: decisionScore.breakdown,
      consideredConditionsCount: consideredRelevantCount,
      requiredConditionsCount: totalRelevantCount,
      preventiveReplacementWarning: rule.isPreventiveReplacementAttempt,
      scientificReasonSummary: rule.caseSpecificReasoning,
      simulationConsequenceSummary: simulationConsequence.narrative,
      rubricNotes,
      stemWeights: rule.stemWeights,
    },
    storage
  );

  return {
    evaluatedAtIso: new Date().toISOString(),
    context,
    selectedAction: action,
    selectedConsiderationIds: uniqueSelectedIds,
    playerRationaleNote: input.playerRationaleNote?.trim() ?? '',
    suitability,
    scientificAnalysis,
    simulationConsequence,
    decisionScore,
    scoringReceipt,
  };
}
