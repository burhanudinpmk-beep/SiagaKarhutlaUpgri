import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  Layers,
  Map as MapIcon,
  Shuffle,
  Target,
  UserCheck,
} from 'lucide-react';
import type {
  MapTileLayerId,
  RegionStatus,
  ScenarioProgressStatus,
  SimulatedHotspot,
} from '../types/mission';
import {
  computeMissionProgress,
  filterHotspotsByRisk,
  filterHotspotsByZone,
  generateRandomizedHotspots,
  INITIAL_SIMULATION_HOTSPOTS,
  KALBAR_GAME_ZONES,
  KALBAR_GEOJSON_METADATA,
  resolveEffectiveHotspotRisk,
  TILE_LAYER_LIST,
  type KalbarZoneId,
} from '../utils/gisEngine';
import { ALL_KALBAR_REGIONS } from '../data/kalbarRegions';
import {
  getScenarioProgressPresentation,
  getStatusPresentation,
} from '../utils/regionHelpers';
import {
  buildBriefingUrl,
  buildSimulationUrl,
  hasSeenBriefing,
  saveActiveHotspotsSession,
} from '../utils/briefingHelpers';
import { playButtonClickSfx, playMissionStartSfx } from '../utils/soundEffects';
import { KalbarLeafletMap } from '../components/map/KalbarLeafletMap';
import { StatusIndicator } from '../components/common/StatusIndicator';
import {
  CERTIFICATE_REQUIRED_MISSIONS,
  useGameProgress,
} from '../context/GameProgressContext';
import type { StoredSimulationResult } from '../types/progress';

type RiskFilter = RegionStatus | 'semua';

const ZONE_FILTER_OPTIONS: { id: KalbarZoneId; label: string }[] = [
  { id: 'semua', label: 'Semua Wilayah' },
  ...KALBAR_GAME_ZONES.map((z) => ({ id: z.id as KalbarZoneId, label: z.shortLabel })),
];

const SORTED_KALBAR_REGIONS = [...ALL_KALBAR_REGIONS].sort((a, b) =>
  a.name.localeCompare(b.name, 'id')
);

const REQUIRED_MISSION_ID_SET = new Set(
  CERTIFICATE_REQUIRED_MISSIONS.map((m) => m.missionId)
);

function deriveHotspotStatus(
  hotspotId: string,
  resultsByMission: Record<string, StoredSimulationResult>
): ScenarioProgressStatus {
  const sim = resultsByMission[hotspotId.toLowerCase()];
  if (!sim) return 'belum-dikerjakan';
  if (sim.isMissionCompleted) return 'selesai';
  if (sim.latestChallengeRecord) return 'sedang-berjalan';
  return 'belum-dikerjakan';
}

function getHotspotQuizScorePct(
  hotspotId: string,
  resultsByMission: Record<string, StoredSimulationResult>
): number | null {
  const challenge = resultsByMission[hotspotId.toLowerCase()]?.latestChallengeRecord;
  if (!challenge || !challenge.questionCount) return null;
  return Math.round((challenge.correctCount / challenge.questionCount) * 100);
}

export function MapPage() {
  const navigate = useNavigate();
  const {
    playerName,
    hasCustomProfileName,
    playerProgress,
    simulationResultsByMission,
    updateMissionCursor,
  } = useGameProgress();

  const [tileLayerId, setTileLayerId] = useState<MapTileLayerId>('topographic');
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [zoneFilter, setZoneFilter] = useState<KalbarZoneId>('semua');
  const [regencyFilter, setRegencyFilter] = useState<string>('semua');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('semua');

  const derivedStatusMap = useMemo(() => {
    const map: Record<string, ScenarioProgressStatus> = {};
    for (const spot of INITIAL_SIMULATION_HOTSPOTS) {
      map[spot.id] = deriveHotspotStatus(spot.id, simulationResultsByMission);
    }
    return map;
  }, [simulationResultsByMission]);

  // Keep base hotspots with their initial risk tiers (Bahaya / Waspada / Cukup Aman)
  const [baseHotspots, setBaseHotspots] = useState<SimulatedHotspot[]>(() =>
    INITIAL_SIMULATION_HOTSPOTS.map((spot) => ({ ...spot }))
  );

  // Derive effective hotspot status & risk dynamically: resolves to 'aman' ONLY once score >= 70% ('selesai')
  const hotspots = useMemo<SimulatedHotspot[]>(() => {
    return baseHotspots.map((spot) => {
      const scenarioStatus = deriveHotspotStatus(spot.id, simulationResultsByMission);
      return {
        ...spot,
        scenarioStatus,
        riskLevel: resolveEffectiveHotspotRisk(spot.riskLevel, scenarioStatus),
      };
    });
  }, [baseHotspots, simulationResultsByMission]);

  const [selectedHotspotId, setSelectedHotspotId] = useState<string>(
    playerProgress.activeMissionId || INITIAL_SIMULATION_HOTSPOTS[0].id
  );
  const [shuffleCount, setShuffleCount] = useState<number>(0);

  useEffect(() => {
    saveActiveHotspotsSession(hotspots);
  }, [hotspots]);

  const areaHotspots = useMemo(() => {
    const byZone = filterHotspotsByZone(hotspots, zoneFilter);
    if (regencyFilter === 'semua') return byZone;
    return byZone.filter((spot) => spot.regionId === regencyFilter);
  }, [hotspots, regencyFilter, zoneFilter]);

  const filteredHotspots = useMemo(
    () => filterHotspotsByRisk(areaHotspots, riskFilter),
    [areaHotspots, riskFilter]
  );

  const selectedHotspot = useMemo(() => {
    const inFiltered = filteredHotspots.find((h) => h.id === selectedHotspotId);
    return inFiltered ?? filteredHotspots[0] ?? areaHotspots[0] ?? hotspots[0];
  }, [areaHotspots, filteredHotspots, hotspots, selectedHotspotId]);

  const progress = useMemo(() => computeMissionProgress(hotspots), [hotspots]);

  const zoneCounts = useMemo(() => {
    const counts: Record<KalbarZoneId, number> = {
      semua: hotspots.length,
      'barat-gambut': filterHotspotsByZone(hotspots, 'barat-gambut').length,
      'selatan-konservasi': filterHotspotsByZone(hotspots, 'selatan-konservasi').length,
      'tengah-hulu': filterHotspotsByZone(hotspots, 'tengah-hulu').length,
    };
    return counts;
  }, [hotspots]);

  const regencyCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const spot of hotspots) {
      map[spot.regionId] = (map[spot.regionId] ?? 0) + 1;
    }
    return map;
  }, [hotspots]);

  const riskCounts = useMemo(() => {
    return areaHotspots.reduce(
      (acc, h) => {
        acc.total += 1;
        if (h.riskLevel === 'cukup-aman') {
          acc.cukupAman += 1;
        } else {
          acc[h.riskLevel] += 1;
        }
        return acc;
      },
      { total: 0, bahaya: 0, waspada: 0, cukupAman: 0, aman: 0 }
    );
  }, [areaHotspots]);

  const completedRequiredCount = playerProgress.completedMissionIds.filter((id) =>
    REQUIRED_MISSION_ID_SET.has(id)
  ).length;
  const totalRequiredCount = CERTIFICATE_REQUIRED_MISSIONS.length;
  const allMissionsCompleted = completedRequiredCount >= totalRequiredCount;
  const overallProgressPct = Math.min(
    100,
    Math.round((completedRequiredCount / Math.max(1, totalRequiredCount)) * 100)
  );

  const handleZoneChange = (nextZone: KalbarZoneId) => {
    playButtonClickSfx();
    setZoneFilter(nextZone);
    setRegencyFilter('semua');
    const nextAreaList = filterHotspotsByZone(hotspots, nextZone);
    const nextList = filterHotspotsByRisk(nextAreaList, riskFilter);
    if (nextList.length > 0 && !nextList.some((h) => h.id === selectedHotspotId)) {
      setSelectedHotspotId(nextList[0].id);
    }
  };

  const handleRegencyChange = (nextRegencyId: string) => {
    playButtonClickSfx();
    setRegencyFilter(nextRegencyId);
    if (nextRegencyId !== 'semua') {
      setZoneFilter('semua');
    }
    const nextAreaList =
      nextRegencyId === 'semua'
        ? hotspots
        : hotspots.filter((h) => h.regionId === nextRegencyId);
    const nextList = filterHotspotsByRisk(nextAreaList, riskFilter);
    if (nextList.length > 0 && !nextList.some((h) => h.id === selectedHotspotId)) {
      setSelectedHotspotId(nextList[0].id);
    }
  };

  const handleFilterChange = (nextFilter: RiskFilter) => {
    playButtonClickSfx();
    setRiskFilter(nextFilter);
    const nextList = filterHotspotsByRisk(areaHotspots, nextFilter);
    if (nextList.length > 0 && !nextList.some((h) => h.id === selectedHotspotId)) {
      setSelectedHotspotId(nextList[0].id);
    }
  };

  const handleRandomizeHotspots = () => {
    playButtonClickSfx();
    const randomized = generateRandomizedHotspots(15, Math.random, derivedStatusMap);
    setBaseHotspots(randomized);
    setZoneFilter('semua');
    setRegencyFilter('semua');
    setRiskFilter('semua');
    if (randomized.length > 0) {
      setSelectedHotspotId(randomized[0].id);
    }
    setShuffleCount((c) => c + 1);
  };

  const handleStartMission = (hotspot: SimulatedHotspot) => {
    playMissionStartSfx();
    void updateMissionCursor(hotspot.regionId, hotspot.id);
    saveActiveHotspotsSession(hotspots);
    if (!hasSeenBriefing()) {
      navigate(buildBriefingUrl(hotspot.regionId, hotspot.id));
    } else {
      navigate(buildSimulationUrl(hotspot.regionId, hotspot.id));
    }
  };

  const filterTabs: { id: RiskFilter; label: string; count: number }[] = [
    { id: 'semua', label: 'Semua', count: riskCounts.total },
    { id: 'bahaya', label: 'Bahaya', count: riskCounts.bahaya },
    { id: 'waspada', label: 'Waspada', count: riskCounts.waspada },
    { id: 'cukup-aman', label: 'Cukup Aman', count: riskCounts.cukupAman },
    { id: 'aman', label: 'Aman', count: riskCounts.aman },
  ];

  const selectedProgressInfo = getScenarioProgressPresentation(
    selectedHotspot.scenarioStatus
  );
  const selectedQuizScorePct = getHotspotQuizScorePct(
    selectedHotspot.id,
    simulationResultsByMission
  );
  const selectedMinCorrect = Math.ceil(selectedHotspot.challengeCount * 0.7);

  return (
    <div className="pb-12">
      {/* Compact Command Header Strip */}
      <section className="command-grid-dark border-b border-[#1E293B] bg-[#0F172A] py-6 text-[#F8FAFC]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                <Flame className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                <span>Tahap 01 · Pusat Pemantauan 15 Titik Api Kalbar</span>
              </div>
              <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Peta Sebaran Titik Api Kalimantan Barat
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-[#CBD5E1]">
                Titik api tersebar merata di seluruh 14 kabupaten/kota Kalimantan Barat. Pilih
                sektor mana saja lalu selesaikan kuis 5–7 soal (target minimal 70% benar untuk
                mengubah status wilayah menjadi Aman).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#CBD5E1] tabular-nums">
              <span>
                <strong className="font-mono font-bold text-white">
                  {KALBAR_GEOJSON_METADATA.regencyCount}
                </strong>{' '}
                Kab/Kota
              </span>
              <span aria-hidden="true" className="text-[#475569]">·</span>
              <span>
                <strong className="font-mono font-bold text-[#FCA5A5]">
                  {riskCounts.bahaya}
                </strong>{' '}
                Bahaya
              </span>
              <span aria-hidden="true" className="text-[#475569]">·</span>
              <span>
                <strong className="font-mono font-bold text-[#FDBA74]">
                  {riskCounts.waspada}
                </strong>{' '}
                Waspada
              </span>
              <span aria-hidden="true" className="text-[#475569]">·</span>
              <span>
                <strong className="font-mono font-bold text-[#FDE047]">
                  {riskCounts.cukupAman}
                </strong>{' '}
                Cukup Aman
              </span>
              <span aria-hidden="true" className="text-[#475569]">·</span>
              <span>
                <strong className="font-mono font-bold text-[#34D399]">
                  {riskCounts.aman}
                </strong>{' '}
                Aman (≥70%)
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 pt-6 sm:px-6 lg:px-8">
        {/* All Missions Completed Banner */}
        {allMissionsCompleted && (
          <div
            data-testid="map-all-completed-banner"
            className="mb-5 flex flex-col gap-4 rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#059669]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-base font-extrabold text-[#0F172A]">
                  Seluruh {totalRequiredCount} Titik Api Wajib Berhasil Diamankan
                </h2>
                <p className="mt-0.5 text-xs text-[#065F46]">
                  Semua sektor wajib di Kalimantan Barat telah mencapai minimal 70% jawaban
                  benar. Buka hasil akhir misi untuk melihat evaluasi dan sertifikat.
                </p>
              </div>
            </div>
            <Link
              to="/evaluasi-stem"
              data-testid="map-view-final-result-btn"
              className="game-btn-fire inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold"
            >
              <span>Lihat Hasil Akhir Misi</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        {/* Progress & Sync Strip */}
        <div
          data-testid="map-sync-status-strip"
          className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3.5 text-xs text-[#0F172A] shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#1E293B]">
                <UserCheck className="h-4 w-4 shrink-0 text-[#059669]" aria-hidden="true" />
                <span>
                  {hasCustomProfileName
                    ? `Pemain: ${playerName} · Progres tersimpan di browser`
                    : 'Pemain Aktif · Progres & skor tersimpan otomatis di browser'}
                </span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold tabular-nums text-[#0F172A]">
                {completedRequiredCount} / {totalRequiredCount} Sektor Wajib Aman
              </span>
              <Link
                to="/evaluasi-stem"
                data-testid="map-stem-report-link"
                className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition-colors ${
                  allMissionsCompleted
                    ? 'bg-[#EA580C] text-white hover:bg-[#C2410C]'
                    : 'border border-[#CBD5E1] bg-[#F8FAFC] text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <span>Hasil Akhir Misi</span>
              </Link>
              <Link
                to="/sertifikat"
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 font-bold text-[#1E293B] transition-colors hover:bg-[#F1F5F9]"
              >
                <Award className="h-3.5 w-3.5 text-[#EA580C]" aria-hidden="true" />
                <span>Sertifikat</span>
              </Link>
            </div>
          </div>

          <div
            aria-label="Progres penyelesaian titik api"
            className="h-2.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#DC2626] via-[#EA580C] to-[#059669] transition-all duration-300"
              style={{ width: `${Math.max(3, overallProgressPct)}%` }}
            />
          </div>
        </div>

        {/* GIS Controls Toolbar + City Focus Filter */}
        <div className="mt-4 space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                <Layers className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
                <span>Layer Peta:</span>
              </div>

              <div
                role="group"
                aria-label="Pilihan layer peta"
                className="grid w-full grid-cols-3 gap-1 rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] p-1 sm:inline-flex sm:w-auto"
              >
                {TILE_LAYER_LIST.map((layer) => {
                  const active = tileLayerId === layer.id;
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => {
                        playButtonClickSfx();
                        setTileLayerId(layer.id);
                      }}
                      aria-pressed={active}
                      className={`min-h-[34px] shrink-0 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA580C] ${
                        active
                          ? 'bg-[#0F172A] text-white'
                          : 'text-[#475569] hover:bg-white hover:text-[#0F172A]'
                      }`}
                    >
                      {layer.label}
                    </button>
                  );
                })}
              </div>

              <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9]">
                <input
                  type="checkbox"
                  checked={showBoundaries}
                  onChange={(e) => {
                    playButtonClickSfx();
                    setShowBoundaries(e.target.checked);
                  }}
                  className="h-4 w-4 rounded border-[#94A3B8] accent-[#EA580C]"
                />
                <span>Batas Kab/Kota</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#475569]">
                <Info className="h-3.5 w-3.5 shrink-0 text-[#0284C7]" aria-hidden="true" />
                <span>Target Aman: Min. 70% benar</span>
                {shuffleCount > 0 && (
                  <span className="font-mono font-bold text-[#EA580C] tabular-nums">
                    · Acak #{shuffleCount}
                  </span>
                )}
              </span>

              <button
                type="button"
                onClick={handleRandomizeHotspots}
                className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-1.5 text-xs font-bold text-[#1E293B] transition-colors hover:border-[#0F172A] hover:bg-[#0F172A] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
              >
                <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Acak Titik &amp; Tingkat Risiko</span>
              </button>
            </div>
          </div>

          {/* Filter Zona & 14 Kabupaten/Kota Kalimantan Barat */}
          <div className="flex flex-col gap-3 border-t border-[#E2E8F0] pt-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A]">
                Sebaran 14 Kab/Kota (15 Sektor):
              </span>
              <div
                role="group"
                aria-label="Filter zona titik api Kalimantan Barat"
                className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:flex lg:flex-wrap lg:items-center"
              >
                {ZONE_FILTER_OPTIONS.map((opt) => {
                  const active = zoneFilter === opt.id && regencyFilter === 'semua';
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      data-testid={`zone-filter-${opt.id}`}
                      aria-pressed={active}
                      onClick={() => handleZoneChange(opt.id)}
                      className={`min-h-[36px] rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                        active
                          ? 'border-[#EA580C] bg-[#EA580C] text-white'
                          : 'border-[#CBD5E1] bg-[#F8FAFC] text-[#1E293B] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      {opt.label} ({zoneCounts[opt.id]})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="map-regency-filter"
                className="shrink-0 text-xs font-bold text-[#0F172A]"
              >
                Kab/Kota:
              </label>
              <select
                id="map-regency-filter"
                data-testid="map-regency-select"
                value={regencyFilter}
                onChange={(e) => handleRegencyChange(e.target.value)}
                className="min-h-[36px] rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0F172A] focus-visible:border-[#EA580C] focus-visible:outline-none"
              >
                <option value="semua">Semua 14 Kab/Kota ({hotspots.length})</option>
                {SORTED_KALBAR_REGIONS.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name} ({regencyCounts[region.id] ?? 0})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Two-Zone Map Stage & Tactical Mission Control Panel */}
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Leaflet Map + Risk Indicator Legend */}
          <div className="space-y-3 lg:col-span-7 xl:col-span-8">
            <KalbarLeafletMap
              tileLayerId={tileLayerId}
              showBoundaries={showBoundaries}
              hotspots={filteredHotspots}
              selectedHotspotId={selectedHotspot.id}
              focusKey={`${zoneFilter}::${regencyFilter}::${shuffleCount}`}
              onSelectHotspot={(id) => {
                playButtonClickSfx();
                setSelectedHotspotId(id);
              }}
              onStartMission={handleStartMission}
            />

            <div
              data-testid="map-progress-legend"
              className="flex flex-col gap-2.5 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-xs text-[#475569] shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A]">
                  <span className="inline-block h-3 w-3 rounded-full bg-[#DC2626] ring-2 ring-[#FECACA]" aria-hidden="true" />
                  <span>Bahaya (7 Soal)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A]">
                  <span className="inline-block h-3 w-3 rounded-full bg-[#EA580C] ring-2 ring-[#FDBA74]" aria-hidden="true" />
                  <span>Waspada (6 Soal)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A]">
                  <span className="inline-block h-3 w-3 rounded-full bg-[#EAB308] ring-2 ring-[#FEF08A]" aria-hidden="true" />
                  <span>Cukup Aman (5 Soal)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A]">
                  <span className="inline-block h-3 w-3 rounded-full bg-[#059669] ring-2 ring-[#A7F3D0]" aria-hidden="true" />
                  <span>Aman (Skor Kuis ≥70%)</span>
                </span>
              </div>

              <div className="border-t border-[#E2E8F0] pt-2 text-[11px] text-[#475569]">
                <strong className="font-semibold text-[#0F172A]">Aturan Status Wilayah:</strong>{' '}
                Semua titik api awalnya berstatus <strong>Bahaya</strong> (Merah),{' '}
                <strong>Waspada</strong> (Jingga), atau <strong>Cukup Aman</strong> (Kuning). Status
                berubah menjadi <strong>Aman</strong> (Hijau) setelah kuis diselesaikan dengan skor minimal 70%.
              </div>
            </div>
          </div>

          {/* Right Column: Tactical Selected Hotspot Card + Sector List */}
          <div className="flex flex-col gap-5 lg:col-span-5 xl:col-span-4">
            <section
              aria-label="Detail Titik Api Terpilih"
              className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white shadow-md"
            >
              {/* Dark Slate Tactical Header */}
              <div className="bg-[#0F172A] px-5 py-4 text-[#F8FAFC]">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] font-bold text-[#F59E0B]">
                      {selectedHotspot.code} · {selectedHotspot.regionName}
                    </p>
                    <h2 className="mt-0.5 font-display text-lg font-extrabold text-white">
                      {selectedHotspot.scenarioTitle}
                    </h2>
                  </div>
                  <StatusIndicator status={selectedHotspot.riskLevel} />
                </div>
                <p className="mt-1 text-xs text-[#CBD5E1]">
                  {selectedHotspot.landType}
                </p>
              </div>

              <div className="p-5">
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-3">
                    <dt className="text-[11px] font-semibold text-[#0369A1]">Jumlah Soal</dt>
                    <dd className="mt-0.5 font-mono font-bold tabular-nums text-[#0F172A]">
                      {selectedHotspot.challengeCount} Soal Kuis
                    </dd>
                  </div>
                  <div className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-3">
                    <dt className="text-[11px] font-semibold text-[#047857]">Target Aman</dt>
                    <dd className="mt-0.5 font-mono font-bold tabular-nums text-[#047857]">
                      Min. 70% ({selectedMinCorrect}/{selectedHotspot.challengeCount} benar)
                    </dd>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                    <dt className="text-[11px] font-semibold text-[#475569]">Progres Kuis</dt>
                    <dd className={`mt-0.5 font-bold ${selectedProgressInfo.textClass}`}>
                      {selectedProgressInfo.label}
                      {selectedQuizScorePct !== null && (
                        <span className="ml-1 font-mono tabular-nums">
                          ({selectedQuizScorePct}%)
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                    <dt className="text-[11px] font-semibold text-[#475569]">Koordinat</dt>
                    <dd className="mt-0.5 font-mono font-semibold tabular-nums text-[#0F172A]">
                      {selectedHotspot.lat.toFixed(3)}, {selectedHotspot.lng.toFixed(3)}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  data-testid="map-start-selected-mission-btn"
                  onClick={() => handleStartMission(selectedHotspot)}
                  className="game-btn-fire mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold tracking-wide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA580C]"
                >
                  <Flame className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {selectedHotspot.scenarioStatus === 'sedang-berjalan'
                      ? 'PERBAIKI KUIS TITIK INI'
                      : selectedHotspot.scenarioStatus === 'selesai'
                        ? 'ULANGI KUIS TITIK INI'
                        : 'MULAI MISI'}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </section>

            {/* Daftar Titik Api */}
            <section
              aria-label="Daftar Titik Api dan Status Penanganan"
              className="flex flex-col rounded-2xl border border-[#CBD5E1] bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 px-1 pb-3">
                <div className="flex items-center gap-2">
                  <MapIcon className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                  <h2 className="font-display text-sm font-extrabold text-[#0F172A]">
                    Daftar Titik Api
                  </h2>
                </div>
                <span className="font-mono text-xs font-bold tabular-nums text-[#059669]">
                  {progress.completed}/{progress.total} Aman
                </span>
              </div>

              {/* Filter by Risk Level */}
              <div
                role="group"
                aria-label="Filter status titik api"
                className="flex flex-wrap gap-1 rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] p-1"
              >
                {filterTabs.map((tab) => {
                  const active = riskFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleFilterChange(tab.id)}
                      aria-pressed={active}
                      className={`min-h-[32px] flex-1 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA580C] ${
                        active
                          ? 'bg-[#0F172A] text-white'
                          : 'text-[#475569] hover:bg-white hover:text-[#0F172A]'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  );
                })}
              </div>

              {filteredHotspots.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center text-xs text-[#475569]">
                  Tidak ada titik api pada kategori ini. Klik <strong>Semua</strong> atau{' '}
                  <strong>Acak Titik</strong>.
                </div>
              ) : (
                <ul className="mt-3 max-h-[330px] divide-y divide-[#E2E8F0] overflow-y-auto pr-1">
                  {filteredHotspots.map((spot) => {
                    const isSelected = spot.id === selectedHotspot.id;
                    const riskInfo = getStatusPresentation(spot.riskLevel);
                    const progressInfo = getScenarioProgressPresentation(
                      spot.scenarioStatus
                    );
                    const scorePct = getHotspotQuizScorePct(
                      spot.id,
                      simulationResultsByMission
                    );

                    return (
                      <li key={spot.id} className="py-1.5 first:pt-0 last:pb-0">
                        <button
                          type="button"
                          data-testid={`map-hotspot-item-${spot.id}`}
                          onClick={() => {
                            playButtonClickSfx();
                            setSelectedHotspotId(spot.id);
                          }}
                          aria-pressed={isSelected}
                          className={`flex min-h-[56px] w-full flex-col gap-1.5 rounded-xl p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA580C] ${
                            isSelected
                              ? 'bg-[#FFF7ED] ring-2 ring-[#EA580C]'
                              : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className="truncate text-xs font-extrabold text-[#0F172A]">
                              {spot.scenarioTitle}
                            </span>
                            <span
                              className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${riskInfo.surfaceClass} ${riskInfo.borderClass} ${riskInfo.textClass}`}
                            >
                              {riskInfo.label}
                            </span>
                          </div>

                          <div className="flex w-full items-center justify-between gap-2 text-[11px] text-[#475569]">
                            <span className="truncate">{spot.regionName}</span>
                            <span className="shrink-0 font-mono font-semibold tabular-nums text-[#0284C7]">
                              {spot.challengeCount} Soal
                            </span>
                          </div>

                          <div className="flex w-full items-center justify-between gap-2 text-[11px]">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${progressInfo.textClass}`}
                            >
                              {spot.scenarioStatus === 'selesai' ? (
                                <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                              ) : spot.scenarioStatus === 'sedang-berjalan' ? (
                                <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                              ) : (
                                <Target className="h-3 w-3 shrink-0 text-[#EA580C]" aria-hidden="true" />
                              )}
                              <span>
                                {progressInfo.label}
                                {scorePct !== null ? ` · ${scorePct}%` : ''}
                              </span>
                            </span>
                            <span className="font-mono text-[10px] text-[#64748B]">
                              {spot.code}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
