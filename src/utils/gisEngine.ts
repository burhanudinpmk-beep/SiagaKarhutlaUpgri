import type { Feature, Geometry, MultiPolygon, Polygon, Position } from 'geojson';
import {
  KALBAR_REGENCIES_GEOJSON,
  type KalbarRegencyProperties,
} from '../data/kalbarRegenciesGeoJson';
import type {
  MapTileLayerId,
  RegionStatus,
  ScenarioProgressStatus,
  SimulatedHotspot,
  TileLayerConfig,
} from '../types/mission';

export const KALBAR_GEOJSON_METADATA = {
  datasetName: KALBAR_REGENCIES_GEOJSON.name,
  source: KALBAR_REGENCIES_GEOJSON.source,
  regencyCount: KALBAR_REGENCIES_GEOJSON.features.length,
  crs: 'WGS 84 (EPSG:4326)',
};

export const MAP_TILE_LAYERS: Record<MapTileLayerId, TileLayerConfig> = {
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    description: 'Citra satelit permukaan bumi (Esri World Imagery)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 17,
  },
  topographic: {
    id: 'topographic',
    label: 'Topographic',
    description: 'Kontur elevasi & jaringan medan (OpenTopoMap)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
    subdomains: 'abc',
  },
  'dark-tactical': {
    id: 'dark-tactical',
    label: 'Dark Tactical',
    description: 'Peta taktis kontras gelap (Esri World Dark Gray)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Dark Tactical: Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16,
  },
};

export const TILE_LAYER_LIST: TileLayerConfig[] = [
  MAP_TILE_LAYERS.topographic,
  MAP_TILE_LAYERS.satellite,
  MAP_TILE_LAYERS['dark-tactical'],
];

export function getKalbarGeoJson() {
  return KALBAR_REGENCIES_GEOJSON;
}

export function slugifyRegencyName(shapeName: string): string {
  return shapeName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function isPointInRing(lng: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function isPointInPolygonCoords(
  lng: number,
  lat: number,
  rings: Position[][]
): boolean {
  if (rings.length === 0 || !isPointInRing(lng, lat, rings[0])) {
    return false;
  }
  for (let i = 1; i < rings.length; i++) {
    if (isPointInRing(lng, lat, rings[i])) {
      return false;
    }
  }
  return true;
}

export function isPointInFeature(
  lat: number,
  lng: number,
  feature: Feature<Geometry, KalbarRegencyProperties>
): boolean {
  const { geometry } = feature;
  if (!geometry) {
    return false;
  }
  if (geometry.type === 'Polygon') {
    return isPointInPolygonCoords(lng, lat, (geometry as Polygon).coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry as MultiPolygon).coordinates.some((poly) =>
      isPointInPolygonCoords(lng, lat, poly)
    );
  }
  return false;
}

export function findRegencyAtCoordinate(
  lat: number,
  lng: number
): { shapeName: string; regionId: string } | undefined {
  for (const feature of KALBAR_REGENCIES_GEOJSON.features) {
    if (isPointInFeature(lat, lng, feature)) {
      const shapeName = feature.properties.shapeName;
      return {
        shapeName,
        regionId: slugifyRegencyName(shapeName),
      };
    }
  }
  return undefined;
}

export function isPointInsideKalbar(lat: number, lng: number): boolean {
  return findRegencyAtCoordinate(lat, lng) !== undefined;
}

function extractPositions(geometry: Geometry): Position[] {
  if (geometry.type === 'Polygon') {
    return (geometry as Polygon).coordinates.flat();
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry as MultiPolygon).coordinates.flat(2);
  }
  return [];
}

export function getFeatureBoundingBox(
  feature: Feature<Geometry, KalbarRegencyProperties>
): [[number, number], [number, number]] {
  const positions = extractPositions(feature.geometry);
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const [lng, lat] of positions) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

export function getKalbarBounds(): [[number, number], [number, number]] {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const feature of KALBAR_REGENCIES_GEOJSON.features) {
    const [[fMinLat, fMinLng], [fMaxLat, fMaxLng]] = getFeatureBoundingBox(feature);
    if (fMinLat < minLat) minLat = fMinLat;
    if (fMaxLat > maxLat) maxLat = fMaxLat;
    if (fMinLng < minLng) minLng = fMinLng;
    if (fMaxLng > maxLng) maxLng = fMaxLng;
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

export function getRegencyDisplayName(shapeName: string): string {
  if (shapeName.startsWith('Kota ')) {
    return shapeName;
  }
  return `Kabupaten ${shapeName}`;
}

interface RegencyScenarioTemplate {
  landTypes: string[];
  defaultRisk: RegionStatus;
  challenges: number;
  safeAnchor: [number, number]; // [lat, lng] guaranteed inside polygon
  scenarios: string[];
}

const REGENCY_TEMPLATES: Record<string, RegencyScenarioTemplate> = {
  'kubu-raya': {
    landTypes: ['Lahan Gambut Dalam', 'Delta Gambut Pesisir'],
    defaultRisk: 'bahaya',
    challenges: 7,
    safeAnchor: [-0.26, 109.48],
    scenarios: ['Pengendalian Kubah Gambut Kuala Dua', 'Sekat Kanal Sektor Rasau Jaya'],
  },
  ketapang: {
    landTypes: ['Rawa Gambut Selatan', 'Semak Belukar Lahan Kering'],
    defaultRisk: 'bahaya',
    challenges: 7,
    safeAnchor: [-1.72, 110.35],
    scenarios: ['Koridor Pemantauan Pawan–Kendawangan', 'Pengamanan Gambut Matan Hilir'],
  },
  'kayong-utara': {
    landTypes: ['Gambut Penyangga Konservasi', 'Lahan Basah Pesisir'],
    defaultRisk: 'bahaya',
    challenges: 7,
    safeAnchor: [-1.14, 110.05],
    scenarios: ['Penyangga Taman Nasional Gunung Palung', 'Tata Air Gambut Simpang Hilir'],
  },
  sintang: {
    landTypes: ['Lembah Aluvial & Semak Sekunder', 'Gambut Tipis Lembah Melawi'],
    defaultRisk: 'waspada',
    challenges: 6,
    safeAnchor: [0.12, 111.68],
    scenarios: ['Pemantauan Koridor Pertemuan Kapuas–Melawi', 'Deteksi Lahan Terbuka Sintang Timur'],
  },
  sambas: {
    landTypes: ['Lahan Basah Pesisir', 'Gambut Dangkal Produktif'],
    defaultRisk: 'waspada',
    challenges: 6,
    safeAnchor: [1.38, 109.35],
    scenarios: ['Pengawasan Angin Pesisir Paloh–Sambas', 'Sekat Vegetasi Sektor Subah'],
  },
  mempawah: {
    landTypes: ['Gambut Terfragmentasi Pesisir', 'Lahan Pertanian Kering'],
    defaultRisk: 'waspada',
    challenges: 6,
    safeAnchor: [0.35, 109.12],
    scenarios: ['Pengaturan Pintu Air Gambut Anjongan', 'Patroli Koridor Sungai Pinyuh'],
  },
  bengkayang: {
    landTypes: ['Perbukitan Semak & Ilalang', 'Lahan Kering Terbuka'],
    defaultRisk: 'waspada',
    challenges: 6,
    safeAnchor: [0.95, 109.52],
    scenarios: ['Mitigasi Lereng Sanggau Ledo', 'Pengamanan Sabuk Perbatasan Utara'],
  },
  landak: {
    landTypes: ['Hutan Sekunder Terbuka', 'Rawa Lembah DAS Landak'],
    defaultRisk: 'waspada',
    challenges: 6,
    safeAnchor: [0.42, 109.85],
    scenarios: ['Penyangga Cagar Alam Mandor', 'Pemantauan Hulu Sungai Landak'],
  },
  melawi: {
    landTypes: ['Hutan Perbukitan Sekunder', 'Lembah Sungai Melawi'],
    defaultRisk: 'waspada',
    challenges: 6,
    safeAnchor: [-0.45, 111.82],
    scenarios: ['Penyangga Bukit Baka–Bukit Raya', 'Pos Pantau Elevasi Nanga Pinoh'],
  },
  'kota-pontianak': {
    landTypes: ['Gambut Dangkal Perkotaan', 'Koridor Drainase Muara Kapuas'],
    defaultRisk: 'waspada',
    challenges: 6,
    safeAnchor: [-0.0296, 109.3281],
    scenarios: ['Pengendalian Gambut Pinggiran Utara', 'Proteksi Kualitas Udara Khatulistiwa'],
  },
  sanggau: {
    landTypes: ['Tanah Mineral & Hutan Lindung', 'Perkebunan Campuran'],
    defaultRisk: 'cukup-aman',
    challenges: 5,
    safeAnchor: [0.22, 110.55],
    scenarios: ['Patroli Preventif DAS Kapuas Tengah', 'Audit Kelembapan Kanopi Sektor Parindu'],
  },
  sekadau: {
    landTypes: ['Lembah Sungai Mineral', 'Hutan Rakyat Terkelola'],
    defaultRisk: 'cukup-aman',
    challenges: 5,
    safeAnchor: [0.05, 110.95],
    scenarios: ['Kesiapsiagaan Desa Siaga Api Belitang', 'Pemantauan Cadangan Air Sekadau'],
  },
  'kapuas-hulu': {
    landTypes: ['Hutan Hujan Tropis Hulu', 'Lahan Basah Danau Sentarum'],
    defaultRisk: 'cukup-aman',
    challenges: 5,
    safeAnchor: [0.85, 112.92],
    scenarios: ['Konservasi Daerah Tangkapan Hulu Kapuas', 'Audit Penyangga Danau Sentarum'],
  },
  'kota-singkawang': {
    landTypes: ['Hutan Lindung Pegunungan Poteng', 'Semak Pesisir Selatan'],
    defaultRisk: 'waspada',
    challenges: 6,
    safeAnchor: [0.89, 109.02],
    scenarios: ['Proteksi Hutan Lindung Gunung Poteng', 'Siaga Sektor Singkawang Selatan'],
  },
};

export const INITIAL_SIMULATION_HOTSPOTS: SimulatedHotspot[] = [
  // Zona Barat & Gambut Pesisir + Selatan (Bahaya — 7 Soal)
  {
    id: 'sim-01',
    code: 'SIM-KKR-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'kubu-raya',
    regionName: 'Kabupaten Kubu Raya',
    scenarioTitle: 'Titik Api 1 – Kec. Sungai Raya (Gambut Kuala Dua)',
    landType: 'Lahan Gambut Dalam',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'bahaya',
    challengeCount: 7,
    lat: -0.12,
    lng: 109.48,
  },
  {
    id: 'sim-02',
    code: 'SIM-KTP-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'ketapang',
    regionName: 'Kabupaten Ketapang',
    scenarioTitle: 'Titik Api 2 – Koridor Pawan–Matan Hilir',
    landType: 'Rawa Gambut Selatan',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'bahaya',
    challengeCount: 7,
    lat: -1.72,
    lng: 110.35,
  },
  {
    id: 'sim-03',
    code: 'SIM-KYU-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'kayong-utara',
    regionName: 'Kabupaten Kayong Utara',
    scenarioTitle: 'Titik Api 3 – Penyangga Gunung Palung',
    landType: 'Gambut Penyangga Konservasi',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'bahaya',
    challengeCount: 7,
    lat: -1.14,
    lng: 110.05,
  },
  {
    id: 'sim-04',
    code: 'SIM-SKW-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'kota-singkawang',
    regionName: 'Kota Singkawang',
    scenarioTitle: 'Titik Api 4 – Kel. Pasiran & Gunung Poteng',
    landType: 'Semak Pesisir & Lahan Terbuka',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'bahaya',
    challengeCount: 7,
    lat: 0.8912,
    lng: 109.0254,
  },
  {
    id: 'sim-05',
    code: 'SIM-KKR-02',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'kubu-raya',
    regionName: 'Kabupaten Kubu Raya',
    scenarioTitle: 'Titik Api 5 – Kec. Rasau Jaya',
    landType: 'Delta Gambut Pesisir & Kanal Pertanian',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'bahaya',
    challengeCount: 7,
    lat: -0.36,
    lng: 109.52,
  },

  // Sebaran Tengah, Utara & Perkotaan (Waspada — 6 Soal)
  {
    id: 'sim-06',
    code: 'SIM-PTK-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'kota-pontianak',
    regionName: 'Kota Pontianak',
    scenarioTitle: 'Titik Api 6 – Kec. Pontianak Utara (Khatulistiwa)',
    landType: 'Gambut Dangkal Perkotaan',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'waspada',
    challengeCount: 6,
    lat: -0.0296,
    lng: 109.3281,
  },
  {
    id: 'sim-07',
    code: 'SIM-STG-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'sintang',
    regionName: 'Kabupaten Sintang',
    scenarioTitle: 'Titik Api 7 – Koridor Pertemuan Kapuas–Melawi',
    landType: 'Lembah Aluvial & Semak Sekunder',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'waspada',
    challengeCount: 6,
    lat: 0.08,
    lng: 111.5,
  },
  {
    id: 'sim-08',
    code: 'SIM-SBS-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'sambas',
    regionName: 'Kabupaten Sambas',
    scenarioTitle: 'Titik Api 8 – Pesisir Paloh–Sambas',
    landType: 'Lahan Basah Pesisir & Gambut Dangkal',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'waspada',
    challengeCount: 6,
    lat: 1.38,
    lng: 109.35,
  },
  {
    id: 'sim-09',
    code: 'SIM-MPW-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'mempawah',
    regionName: 'Kabupaten Mempawah',
    scenarioTitle: 'Titik Api 9 – Koridor Sungai Pinyuh–Anjongan',
    landType: 'Gambut Terfragmentasi Pesisir',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'waspada',
    challengeCount: 6,
    lat: 0.35,
    lng: 109.12,
  },
  {
    id: 'sim-10',
    code: 'SIM-BKY-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'bengkayang',
    regionName: 'Kabupaten Bengkayang',
    scenarioTitle: 'Titik Api 10 – Lereng Sanggau Ledo',
    landType: 'Perbukitan Semak & Ilalang',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'waspada',
    challengeCount: 6,
    lat: 0.95,
    lng: 109.52,
  },

  // Sektor Penyangga Tengah & Hulu Kapuas (Cukup Aman — 5 Soal)
  {
    id: 'sim-11',
    code: 'SIM-LDK-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'landak',
    regionName: 'Kabupaten Landak',
    scenarioTitle: 'Titik Api 11 – Penyangga Cagar Alam Mandor',
    landType: 'Hutan Sekunder & Rawa Lembah Landak',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'cukup-aman',
    challengeCount: 5,
    lat: 0.42,
    lng: 109.85,
  },
  {
    id: 'sim-12',
    code: 'SIM-MLW-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'melawi',
    regionName: 'Kabupaten Melawi',
    scenarioTitle: 'Titik Api 12 – Lembah Sungai Melawi (Nanga Pinoh)',
    landType: 'Hutan Perbukitan Sekunder',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'cukup-aman',
    challengeCount: 5,
    lat: -0.45,
    lng: 111.82,
  },
  {
    id: 'sim-13',
    code: 'SIM-SGG-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'sanggau',
    regionName: 'Kabupaten Sanggau',
    scenarioTitle: 'Titik Api 13 – Patroli DAS Kapuas Tengah',
    landType: 'Tanah Mineral & Hutan Lindung',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'cukup-aman',
    challengeCount: 5,
    lat: 0.22,
    lng: 110.55,
  },
  {
    id: 'sim-14',
    code: 'SIM-SKD-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'sekadau',
    regionName: 'Kabupaten Sekadau',
    scenarioTitle: 'Titik Api 14 – Desa Siaga Api Belitang',
    landType: 'Lembah Sungai Mineral',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'cukup-aman',
    challengeCount: 5,
    lat: 0.05,
    lng: 110.95,
  },
  {
    id: 'sim-15',
    code: 'SIM-KPH-01',
    isSimulation: true,
    simulationLabel: 'Titik Api Simulasi',
    regionId: 'kapuas-hulu',
    regionName: 'Kabupaten Kapuas Hulu',
    scenarioTitle: 'Titik Api 15 – Penyangga Danau Sentarum',
    landType: 'Hutan Hujan Tropis & Lahan Basah Hulu',
    scenarioStatus: 'belum-dikerjakan',
    riskLevel: 'cukup-aman',
    challengeCount: 5,
    lat: 0.85,
    lng: 112.92,
  },
];

/**
 * Mengembalikan status kerawanan efektif pada peta:
 * Titik api awal (Bahaya/Waspada/Cukup Aman) berubah menjadi 'aman' (Hijau)
 * HANYA setelah kuis diselesaikan dengan skor minimal 70% ('selesai').
 */
export function resolveEffectiveHotspotRisk(
  initialRisk: RegionStatus,
  scenarioStatus: ScenarioProgressStatus
): RegionStatus {
  if (scenarioStatus === 'selesai') {
    return 'aman';
  }
  return initialRisk === 'aman' ? 'cukup-aman' : initialRisk;
}

function samplePointInsideFeature(
  feature: Feature<Geometry, KalbarRegencyProperties>,
  fallback: [number, number],
  rng: () => number
): [number, number] {
  const [[minLat, minLng], [maxLat, maxLng]] = getFeatureBoundingBox(feature);

  for (let attempt = 0; attempt < 60; attempt++) {
    const lat = minLat + rng() * (maxLat - minLat);
    const lng = minLng + rng() * (maxLng - minLng);
    if (isPointInFeature(lat, lng, feature)) {
      return [Number(lat.toFixed(4)), Number(lng.toFixed(4))];
    }
  }

  if (isPointInFeature(fallback[0], fallback[1], feature)) {
    return fallback;
  }

  const positions = extractPositions(feature.geometry);
  if (positions.length > 0) {
    const [lng, lat] = positions[Math.floor(positions.length / 2)];
    return [Number(lat.toFixed(4)), Number(lng.toFixed(4))];
  }

  return fallback;
}

const INITIAL_RISK_CYCLE: RegionStatus[] = ['bahaya', 'waspada', 'cukup-aman'];

export function generateRandomizedHotspots(
  count = 15,
  rng: () => number = Math.random,
  existingStatusMap?: Record<string, ScenarioProgressStatus>
): SimulatedHotspot[] {
  const baseHotspots = [...INITIAL_SIMULATION_HOTSPOTS];

  // Fisher-Yates shuffle agar urutan & distribusi risiko/jumlah soal (5, 6, 7) teracak
  for (let i = baseHotspots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [baseHotspots[i], baseHotspots[j]] = [baseHotspots[j], baseHotspots[i]];
  }

  const featuresByRegionId = new Map<string, Feature<Geometry, KalbarRegencyProperties>>();
  for (const feat of KALBAR_REGENCIES_GEOJSON.features) {
    featuresByRegionId.set(slugifyRegencyName(feat.properties.shapeName), feat);
  }

  const targetCount = Math.max(1, Math.min(count, baseHotspots.length));
  const result: SimulatedHotspot[] = [];

  for (let idx = 0; idx < targetCount; idx++) {
    const spot = baseHotspots[idx];
    const feat = featuresByRegionId.get(spot.regionId);
    const [lat, lng] = feat
      ? samplePointInsideFeature(feat, [spot.lat, spot.lng], rng)
      : [spot.lat, spot.lng];

    // Variasikan status awal (hanya Bahaya, Waspada, Cukup Aman — TIDAK pernah langsung Aman)
    const rotatedRisk =
      INITIAL_RISK_CYCLE[(idx + Math.floor(rng() * INITIAL_RISK_CYCLE.length)) % INITIAL_RISK_CYCLE.length];
    const challengeCount =
      rotatedRisk === 'bahaya' ? 7 : rotatedRisk === 'waspada' ? 6 : 5;
    const scenarioStatus = existingStatusMap?.[spot.id] ?? 'belum-dikerjakan';

    result.push({
      ...spot,
      scenarioStatus,
      riskLevel: rotatedRisk,
      challengeCount,
      lat,
      lng,
    });
  }

  return result;
}

export function filterHotspotsByRisk(
  hotspots: SimulatedHotspot[],
  filter: RegionStatus | 'semua'
): SimulatedHotspot[] {
  if (filter === 'semua') {
    return hotspots;
  }
  return hotspots.filter((spot) => spot.riskLevel === filter);
}

export type KalbarZoneId = 'semua' | 'barat-gambut' | 'selatan-konservasi' | 'tengah-hulu';

export interface KalbarGameZoneMeta {
  id: Exclude<KalbarZoneId, 'semua'>;
  label: string;
  shortLabel: string;
  description: string;
  regencyIds: string[];
}

export const KALBAR_GAME_ZONES: KalbarGameZoneMeta[] = [
  {
    id: 'barat-gambut',
    label: 'Zona Barat & Gambut Pesisir',
    shortLabel: 'Barat & Gambut',
    description: 'Kubu Raya, Sambas, Mempawah, Pontianak, Singkawang, Bengkayang',
    regencyIds: [
      'kubu-raya',
      'mempawah',
      'sambas',
      'kota-pontianak',
      'kota-singkawang',
      'bengkayang',
    ],
  },
  {
    id: 'selatan-konservasi',
    label: 'Zona Selatan & Konservasi',
    shortLabel: 'Selatan & Konservasi',
    description: 'Ketapang, Kayong Utara, Landak',
    regencyIds: ['ketapang', 'kayong-utara', 'landak'],
  },
  {
    id: 'tengah-hulu',
    label: 'Zona Tengah & Hulu Kapuas',
    shortLabel: 'Tengah & Hulu',
    description: 'Sanggau, Sintang, Kapuas Hulu, Sekadau, Melawi',
    regencyIds: ['sanggau', 'sintang', 'kapuas-hulu', 'sekadau', 'melawi'],
  },
];

export function getZoneIdForRegion(
  regionId: string
): Exclude<KalbarZoneId, 'semua'> {
  const normalized = regionId.trim().toLowerCase();
  const matched = KALBAR_GAME_ZONES.find((z) =>
    z.regencyIds.includes(normalized)
  );
  return matched?.id ?? 'tengah-hulu';
}

export function filterHotspotsByZone(
  hotspots: SimulatedHotspot[],
  zoneId: KalbarZoneId
): SimulatedHotspot[] {
  if (zoneId === 'semua') return hotspots;
  return hotspots.filter((spot) => getZoneIdForRegion(spot.regionId) === zoneId);
}

export interface MissionProgressSummary {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export function computeMissionProgress(
  hotspots: SimulatedHotspot[]
): MissionProgressSummary {
  return hotspots.reduce<MissionProgressSummary>(
    (acc, spot) => {
      acc.total += 1;
      if (spot.scenarioStatus === 'selesai') acc.completed += 1;
      else if (spot.scenarioStatus === 'sedang-berjalan') acc.inProgress += 1;
      else acc.pending += 1;
      return acc;
    },
    { total: 0, completed: 0, inProgress: 0, pending: 0 }
  );
}

export function getBoundaryStyle(
  tileLayerId: MapTileLayerId,
  isSelectedRegency: boolean
) {
  if (tileLayerId === 'dark-tactical') {
    return {
      color: isSelectedRegency ? '#F59E0B' : '#64748B',
      weight: isSelectedRegency ? 2.4 : 1.3,
      fillColor: isSelectedRegency ? '#EA580C' : '#334155',
      fillOpacity: isSelectedRegency ? 0.24 : 0.14,
    };
  }
  if (tileLayerId === 'satellite') {
    return {
      color: isSelectedRegency ? '#F59E0B' : '#E2E8F0',
      weight: isSelectedRegency ? 2.5 : 1.4,
      fillColor: isSelectedRegency ? '#EA580C' : '#0284C7',
      fillOpacity: isSelectedRegency ? 0.24 : 0.10,
    };
  }
  return {
    color: isSelectedRegency ? '#EA580C' : '#475569',
    weight: isSelectedRegency ? 2.4 : 1.3,
    fillColor: isSelectedRegency ? '#EA580C' : '#0284C7',
    fillOpacity: isSelectedRegency ? 0.16 : 0.06,
  };
}
