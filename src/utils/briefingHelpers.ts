import {
  FICTIONAL_COMMANDERS,
  REGION_BRIEFING_CONTENT,
} from '../data/briefingData';
import type {
  MissionBriefingPackage,
  SimulatedHotspot,
} from '../types/mission';
import { INITIAL_SIMULATION_HOTSPOTS } from './gisEngine';
import { findRegionById } from './regionHelpers';

const ACTIVE_HOTSPOTS_STORAGE_KEY = 'siaga_karhutla_active_hotspots_v1';
const BRIEFING_SEEN_STORAGE_KEY = 'siaga_karhutla_briefing_seen_v1';

export function hasSeenBriefing(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(BRIEFING_SEEN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markBriefingSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BRIEFING_SEEN_STORAGE_KEY, '1');
  } catch {
    // Ignore storage unavailability
  }
}

export function clearBriefingStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(BRIEFING_SEEN_STORAGE_KEY);
    window.localStorage.removeItem(ACTIVE_HOTSPOTS_STORAGE_KEY);
    window.sessionStorage.removeItem(BRIEFING_SEEN_STORAGE_KEY);
    window.sessionStorage.removeItem(ACTIVE_HOTSPOTS_STORAGE_KEY);
  } catch {
    // Ignore storage unavailability
  }
}

export function saveActiveHotspotsSession(hotspots: SimulatedHotspot[]): void {
  try {
    window.localStorage.setItem(
      ACTIVE_HOTSPOTS_STORAGE_KEY,
      JSON.stringify(hotspots)
    );
  } catch {
    // Ignore storage unavailability
  }
}

export function loadActiveHotspotByMissionId(
  missionId?: string | null
): SimulatedHotspot | undefined {
  if (!missionId) {
    return undefined;
  }
  const normalized = missionId.trim().toLowerCase();

  try {
    const raw = window.localStorage.getItem(ACTIVE_HOTSPOTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SimulatedHotspot[];
      if (Array.isArray(parsed)) {
        const match = parsed.find((h) => h.id.toLowerCase() === normalized);
        if (match) {
          return match;
        }
      }
    }
  } catch {
    // Fallback to initial hotspots
  }

  return INITIAL_SIMULATION_HOTSPOTS.find(
    (h) => h.id.toLowerCase() === normalized
  );
}

export function resolveMissionBriefing(
  regionId: string | undefined,
  missionId?: string | null,
  explicitHotspot?: SimulatedHotspot
): MissionBriefingPackage | undefined {
  const region = findRegionById(regionId);
  if (!region) {
    return undefined;
  }

  const content = REGION_BRIEFING_CONTENT[region.id];
  if (!content) {
    return undefined;
  }

  const matchedHotspot =
    explicitHotspot && explicitHotspot.regionId === region.id
      ? explicitHotspot
      : missionId
        ? INITIAL_SIMULATION_HOTSPOTS.find(
            (h) =>
              h.id.toLowerCase() === missionId.trim().toLowerCase() &&
              h.regionId === region.id
          )
        : INITIAL_SIMULATION_HOTSPOTS.find((h) => h.regionId === region.id);

  const resolvedMissionId =
    missionId?.trim() || matchedHotspot?.id || `sim-${region.id}`;
  const resolvedMissionCode =
    matchedHotspot?.code ?? content.defaultMissionCode;
  const resolvedLandType =
    matchedHotspot?.landType ?? content.defaultLandType;
  const resolvedScenarioTitle =
    matchedHotspot?.scenarioTitle ?? content.defaultScenarioTitle;
  const resolvedRiskLevel = matchedHotspot?.riskLevel ?? region.status;
  const resolvedChallengeCount =
    matchedHotspot?.challengeCount ??
    (region.status === 'bahaya' ? 7 : region.status === 'waspada' ? 6 : 5);

  const coordinateLabel = matchedHotspot
    ? `${matchedHotspot.lat.toFixed(4)}, ${matchedHotspot.lng.toFixed(4)}`
    : region.coordinates.latLon;

  const commander = FICTIONAL_COMMANDERS[content.commanderArchetype];

  const scenarioSpecificNote = matchedHotspot
    ? `Fokus skenario ${resolvedMissionCode} ("${resolvedScenarioTitle}") menyoroti karakter ${resolvedLandType} dengan ${resolvedChallengeCount} tantangan mitigasi.`
    : `Fokus skenario ${resolvedMissionCode} ("${resolvedScenarioTitle}") menyoroti karakter ${resolvedLandType}.`;

  const dialogLines = [
    content.dialogOpening,
    `${content.dialogTechnical} ${scenarioSpecificNote}`,
    content.dialogClosing,
  ];

  return {
    missionId: resolvedMissionId,
    missionCode: resolvedMissionCode,
    regionId: region.id,
    regionName: region.name,
    scenarioTitle: resolvedScenarioTitle,
    landType: resolvedLandType,
    riskLevel: resolvedRiskLevel,
    challengeCount: resolvedChallengeCount,
    coordinateLabel,
    commander,
    dialogLines,
    environmentSummary: content.environmentSummary,
    environmentMetrics: content.environmentMetrics,
    caseStudies: content.caseStudies,
  };
}

export function buildSimulationUrl(
  regionId: string,
  missionId?: string | null
): string {
  const base = `/simulasi/${regionId}`;
  if (!missionId || !missionId.trim()) {
    return base;
  }
  return `${base}?missionId=${encodeURIComponent(missionId.trim())}`;
}

export function buildBriefingUrl(
  regionId: string,
  missionId?: string | null
): string {
  const base = `/briefing/${regionId}`;
  if (!missionId || !missionId.trim()) {
    return base;
  }
  return `${base}?missionId=${encodeURIComponent(missionId.trim())}`;
}

export function buildResultUrl(
  regionId: string,
  missionId?: string | null
): string {
  const base = `/hasil/${regionId}`;
  if (!missionId || !missionId.trim()) {
    return base;
  }
  return `${base}?missionId=${encodeURIComponent(missionId.trim())}`;
}
