export type RegionStatus = 'bahaya' | 'waspada' | 'cukup-aman' | 'aman';

export type MissionStageId = 'peta' | 'briefing' | 'simulasi' | 'hasil';

export type MapTileLayerId = 'satellite' | 'topographic' | 'dark-tactical';

export type ScenarioProgressStatus =
  | 'belum-dikerjakan'
  | 'sedang-berjalan'
  | 'selesai';

export type CommanderArchetype = 'coastal' | 'southern' | 'central' | 'northern';

export interface MapCoordinate {
  /** Horizontal coordinate inside the 800x620 SVG viewport */
  x: number;
  /** Vertical coordinate inside the 800x620 SVG viewport */
  y: number;
  /** Geographic coordinate label for formal GIS display */
  latLon: string;
}

export interface RegionProfile {
  id: string;
  name: string;
  capital: string;
  status: RegionStatus;
  biomeType: string;
  peatlandShare: string;
  hotspotReferenceCount: number;
  areaKm2: string;
  elevationProfile: string;
  coordinates: MapCoordinate;
  summary: string;
  briefingObjectives: string[];
  strategicAssets: string[];
  stemFocus: {
    science: string;
    technology: string;
    engineering: string;
    mathematics: string;
  };
}

export interface GisLayerSpec {
  id: string;
  label: string;
  category: string;
  description: string;
  defaultVisible: boolean;
}

export interface StatusPresentation {
  status: RegionStatus;
  label: string;
  shortDescription: string;
  textClass: string;
  surfaceClass: string;
  borderClass: string;
  markerFill: string;
  markerRing: string;
}

export interface TileLayerConfig {
  id: MapTileLayerId;
  label: string;
  description: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
}

export interface SimulatedHotspot {
  id: string;
  code: string;
  isSimulation: true;
  simulationLabel: string;
  regionId: string;
  regionName: string;
  scenarioTitle: string;
  landType: string;
  scenarioStatus: ScenarioProgressStatus;
  riskLevel: RegionStatus;
  challengeCount: number;
  lat: number;
  lng: number;
}

export interface CommanderProfile {
  id: string;
  name: string;
  fictionalRole: string;
  sectorLabel: string;
  disclaimer: string;
  isFictional: true;
  archetype: CommanderArchetype;
}

export interface EnvironmentConditionMetric {
  label: string;
  value: string;
  note: string;
}

export interface CaseStudyItem {
  id: string;
  code: string;
  title: string;
  category: string;
  narrative: string;
  stemFocusLabel: string;
  keyQuestion: string;
}

export interface MissionBriefingPackage {
  missionId: string;
  missionCode: string;
  regionId: string;
  regionName: string;
  scenarioTitle: string;
  landType: string;
  riskLevel: RegionStatus;
  challengeCount: number;
  coordinateLabel: string;
  commander: CommanderProfile;
  dialogLines: string[];
  environmentSummary: string;
  environmentMetrics: EnvironmentConditionMetric[];
  caseStudies: [CaseStudyItem, CaseStudyItem];
}
