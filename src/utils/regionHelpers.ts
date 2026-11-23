import { ALL_KALBAR_REGIONS, DEFAULT_REGION_ID, KALBAR_REGIONS } from '../data/kalbarRegions';
import type {
  RegionProfile,
  RegionStatus,
  ScenarioProgressStatus,
  StatusPresentation,
} from '../types/mission';

const STATUS_MAP: Record<RegionStatus, StatusPresentation> = {
  bahaya: {
    status: 'bahaya',
    label: 'Bahaya',
    shortDescription: 'Kerawanan tinggi — prioritas mitigasi segera',
    textClass: 'text-[#B91C1C]',
    surfaceClass: 'bg-[#FEF2F2]',
    borderClass: 'border-[#FECACA]',
    markerFill: '#DC2626',
    markerRing: '#FCA5A5',
  },
  waspada: {
    status: 'waspada',
    label: 'Waspada',
    shortDescription: 'Kerawanan menengah — pemantauan intensif',
    textClass: 'text-[#C2410C]',
    surfaceClass: 'bg-[#FFF7ED]',
    borderClass: 'border-[#FDBA74]',
    markerFill: '#EA580C',
    markerRing: '#FDBA74',
  },
  'cukup-aman': {
    status: 'cukup-aman',
    label: 'Cukup Aman',
    shortDescription: 'Kondisi terkendali bersyarat — selesaikan kuis (≥70%) agar Aman',
    textClass: 'text-[#A16207]',
    surfaceClass: 'bg-[#FEFCE8]',
    borderClass: 'border-[#FDE047]',
    markerFill: '#EAB308',
    markerRing: '#FEF08A',
  },
  aman: {
    status: 'aman',
    label: 'Aman',
    shortDescription: 'Wilayah berhasil diamankan (skor ≥70%) — patroli preventif',
    textClass: 'text-[#047857]',
    surfaceClass: 'bg-[#ECFDF5]',
    borderClass: 'border-[#A7F3D0]',
    markerFill: '#059669',
    markerRing: '#6EE7B7',
  },
};

export interface ScenarioProgressPresentation {
  status: ScenarioProgressStatus;
  label: string;
  textClass: string;
  surfaceClass: string;
  borderClass: string;
}

const SCENARIO_PROGRESS_MAP: Record<
  ScenarioProgressStatus,
  ScenarioProgressPresentation
> = {
  'belum-dikerjakan': {
    status: 'belum-dikerjakan',
    label: 'Belum Dikerjakan',
    textClass: 'text-[#475569]',
    surfaceClass: 'bg-[#F1F5F9]',
    borderClass: 'border-[#CBD5E1]',
  },
  'sedang-berjalan': {
    status: 'sedang-berjalan',
    label: 'Perlu Penanganan Ulang',
    textClass: 'text-[#C2410C]',
    surfaceClass: 'bg-[#FFF7ED]',
    borderClass: 'border-[#FDBA74]',
  },
  selesai: {
    status: 'selesai',
    label: 'Berhasil Ditangani',
    textClass: 'text-[#047857]',
    surfaceClass: 'bg-[#ECFDF5]',
    borderClass: 'border-[#A7F3D0]',
  },
};

export function getStatusPresentation(status: RegionStatus): StatusPresentation {
  return STATUS_MAP[status];
}

export function getScenarioProgressPresentation(
  status: ScenarioProgressStatus
): ScenarioProgressPresentation {
  return SCENARIO_PROGRESS_MAP[status];
}

export function findRegionById(
  regionId: string | undefined,
  regions: RegionProfile[] = ALL_KALBAR_REGIONS
): RegionProfile | undefined {
  if (!regionId) {
    return undefined;
  }
  const normalized = regionId.trim().toLowerCase();
  return regions.find((region) => region.id === normalized);
}

export function filterRegionsByStatus(
  regions: RegionProfile[] = KALBAR_REGIONS,
  filter: RegionStatus | 'semua'
): RegionProfile[] {
  if (filter === 'semua') {
    return regions;
  }
  return regions.filter((region) => region.status === filter);
}

export interface StatusSummaryCounts {
  total: number;
  bahaya: number;
  waspada: number;
  cukupAman: number;
  aman: number;
}

export function computeStatusSummary(regions: RegionProfile[]): StatusSummaryCounts {
  return regions.reduce<StatusSummaryCounts>(
    (acc, region) => {
      acc.total += 1;
      if (region.status === 'cukup-aman') {
        acc.cukupAman += 1;
      } else {
        acc[region.status] += 1;
      }
      return acc;
    },
    { total: 0, bahaya: 0, waspada: 0, cukupAman: 0, aman: 0 }
  );
}

export function buildMissionRoutes(regionId?: string, missionId?: string | null) {
  const safeRegionId = findRegionById(regionId)?.id ?? DEFAULT_REGION_ID;
  const suffix =
    missionId && missionId.trim()
      ? `?missionId=${encodeURIComponent(missionId.trim())}`
      : '';
  return {
    home: '/',
    map: '/peta-kalbar',
    briefing: `/briefing/${safeRegionId}${suffix}`,
    simulation: `/simulasi/${safeRegionId}${suffix}`,
    result: `/hasil/${safeRegionId}${suffix}`,
  };
}
