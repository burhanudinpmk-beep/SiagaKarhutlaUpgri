import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { MapTileLayerId, SimulatedHotspot } from '../../types/mission';
import {
  getBoundaryStyle,
  getKalbarBounds,
  getKalbarGeoJson,
  getRegencyDisplayName,
  MAP_TILE_LAYERS,
  slugifyRegencyName,
} from '../../utils/gisEngine';
import {
  getScenarioProgressPresentation,
  getStatusPresentation,
} from '../../utils/regionHelpers';

interface KalbarLeafletMapProps {
  tileLayerId: MapTileLayerId;
  showBoundaries: boolean;
  hotspots: SimulatedHotspot[];
  selectedHotspotId: string;
  focusKey?: string;
  onSelectHotspot: (hotspotId: string) => void;
  onStartMission: (hotspot: SimulatedHotspot) => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getMarkerPalette(riskLevel: SimulatedHotspot['riskLevel']) {
  if (riskLevel === 'aman') {
    return {
      pinColor: '#059669',
      fillRgba: 'rgba(5, 150, 105, 0.18)',
      iconStroke: '#FFFFFF',
      iconFill: '#FFFFFF',
    };
  }
  if (riskLevel === 'cukup-aman') {
    return {
      pinColor: '#EAB308',
      fillRgba: 'rgba(234, 179, 8, 0.28)',
      iconStroke: '#0F172A',
      iconFill: '#0F172A',
    };
  }
  if (riskLevel === 'waspada') {
    return {
      pinColor: '#EA580C',
      fillRgba: 'rgba(234, 88, 12, 0.26)',
      iconStroke: '#FFFFFF',
      iconFill: '#FFFFFF',
    };
  }
  return {
    pinColor: '#DC2626',
    fillRgba: 'rgba(220, 38, 38, 0.28)',
    iconStroke: '#FFFFFF',
    iconFill: '#FFFFFF',
  };
}

function buildFireMarkerIcon(
  hotspot: SimulatedHotspot,
  isSelected: boolean
): L.DivIcon {
  const presentation = getStatusPresentation(hotspot.riskLevel);
  const progressInfo = getScenarioProgressPresentation(hotspot.scenarioStatus);
  const isAman = hotspot.riskLevel === 'aman';
  const palette = getMarkerPalette(hotspot.riskLevel);

  const innerSvg = isAman
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${palette.iconStroke}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="${palette.iconFill}" stroke="${palette.iconStroke}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;

  const pulseHtml = !isAman
    ? `<span class="karhutla-fire-pulse"></span><span class="karhutla-fire-pulse karhutla-fire-pulse-delayed"></span>`
    : '';

  return L.divIcon({
    className: 'karhutla-fire-wrapper',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -20],
    html: `
      <div
        class="karhutla-fire-node ${isSelected ? 'karhutla-fire-selected' : ''}"
        style="--radar-color: ${palette.pinColor}; --radar-fill: ${palette.fillRgba};"
        aria-label="${escapeHtml(hotspot.scenarioTitle)} · ${escapeHtml(hotspot.regionName)} (${escapeHtml(presentation.label)} · ${escapeHtml(progressInfo.label)})"
      >
        ${pulseHtml}
        <span class="karhutla-fire-pin">${innerSvg}</span>
      </div>
    `,
  });
}

function buildPopupHtml(hotspot: SimulatedHotspot): string {
  const riskInfo = getStatusPresentation(hotspot.riskLevel);
  const progressInfo = getScenarioProgressPresentation(hotspot.scenarioStatus);
  const isCompleted = hotspot.scenarioStatus === 'selesai';
  const minCorrect = Math.ceil(hotspot.challengeCount * 0.7);
  const riskTextColor =
    hotspot.riskLevel === 'cukup-aman' ? '#A16207' : riskInfo.markerFill;

  return `
    <div style="padding: 14px; background: #FFFFFF; color: #0F172A;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
        <span style="font-family: IBM Plex Mono, monospace; font-size: 11px; font-weight: 700; color: #475569;">
          ${escapeHtml(hotspot.code)}
        </span>
        <span style="font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 6px; background: ${riskInfo.markerFill}; color: ${hotspot.riskLevel === 'cukup-aman' ? '#0F172A' : '#FFFFFF'};">
          ${escapeHtml(riskInfo.label)}
        </span>
      </div>
      <h3 style="margin: 0 0 2px 0; font-family: Plus Jakarta Sans, sans-serif; font-size: 15px; font-weight: 800; color: #0F172A;">
        ${escapeHtml(hotspot.regionName)}
      </h3>
      <p style="margin: 0 0 10px 0; font-size: 12px; color: #475569;">
        ${escapeHtml(hotspot.scenarioTitle)}
      </p>
      <div style="border-top: 1px solid #E2E8F0; padding-top: 8px; display: grid; gap: 5px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <span style="color: #475569;">Jenis lahan</span>
          <strong style="color: #0F172A; text-align: right;">${escapeHtml(hotspot.landType)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <span style="color: #475569;">Status titik api</span>
          <strong style="color: ${riskTextColor}; text-align: right;">${escapeHtml(riskInfo.label)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <span style="color: #475569;">Status kuis</span>
          <strong style="color: ${isCompleted ? '#047857' : '#0F172A'}; text-align: right;">${escapeHtml(progressInfo.label)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <span style="color: #475569;">Tantangan</span>
          <strong style="color: #0284C7; font-variant-numeric: tabular-nums;">${hotspot.challengeCount} Soal Kuis</strong>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <span style="color: #475569;">Target Aman</span>
          <strong style="color: #047857; font-variant-numeric: tabular-nums;">Min. 70% (${minCorrect}/${hotspot.challengeCount} benar)</strong>
        </div>
      </div>
      <button
        type="button"
        data-start-mission-id="${escapeHtml(hotspot.id)}"
        style="margin-top: 12px; width: 100%; padding: 9px 12px; border-radius: 9px; border: none; background: #EA580C; box-shadow: 0 2px 0 #9A3412; color: #FFFFFF; font-size: 12px; font-weight: 800; letter-spacing: 0.02em; cursor: pointer;"
      >
        ${isCompleted ? 'ULANGI KUIS TITIK INI' : 'MULAI MISI'}
      </button>
    </div>
  `;
}

export function KalbarLeafletMap({
  tileLayerId,
  showBoundaries,
  hotspots,
  selectedHotspotId,
  focusKey,
  onSelectHotspot,
  onStartMission,
}: KalbarLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersByIdRef = useRef<Record<string, L.Marker>>({});
  const lastFocusKeyRef = useRef<string | undefined>(undefined);
  const prevSelectedIdRef = useRef<string | null>(selectedHotspotId);

  const onSelectRef = useRef(onSelectHotspot);
  const onStartRef = useRef(onStartMission);
  onSelectRef.current = onSelectHotspot;
  onStartRef.current = onStartMission;

  const hotspotsRef = useRef(hotspots);
  hotspotsRef.current = hotspots;

  const selectedHotspot = hotspots.find((h) => h.id === selectedHotspotId);
  const selectedRegionId = selectedHotspot?.regionId;

  // Initialize Leaflet map once
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) {
      return;
    }

    const kalbarBounds = L.latLngBounds(getKalbarBounds());
    const paddedMaxBounds = kalbarBounds.pad(0.28);

    const map = L.map(container, {
      center: [-0.2, 111.1],
      zoom: 7,
      minZoom: 5,
      maxZoom: 15,
      zoomSnap: 0.5,
      maxBounds: paddedMaxBounds,
      maxBoundsViscosity: 0.75,
      zoomControl: true,
      attributionControl: true,
      fadeAnimation: false,
    });

    if (hotspotsRef.current.length > 0) {
      const spotBounds = L.latLngBounds(
        hotspotsRef.current.map((h) => [h.lat, h.lng] as [number, number])
      );
      map.fitBounds(spotBounds.pad(0.24), { padding: [36, 36], maxZoom: 7 });
    } else {
      map.fitBounds(kalbarBounds, { padding: [24, 24], maxZoom: 7 });
    }

    const routesGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    routesLayerRef.current = routesGroup;
    markersLayerRef.current = markersGroup;

    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest<HTMLButtonElement>('[data-start-mission-id]');
      if (!btn) return;
      const hotspotId = btn.dataset.startMissionId;
      if (!hotspotId) return;
      const matched = hotspotsRef.current.find((h) => h.id === hotspotId);
      if (matched) {
        onStartRef.current(matched);
      }
    };
    container.addEventListener('click', handlePopupClick);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('click', handlePopupClick);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      geoJsonLayerRef.current = null;
      routesLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Refocus bounds whenever zone/regency/shuffle focusKey changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusKey || lastFocusKeyRef.current === focusKey) return;
    const isInitialCall = lastFocusKeyRef.current === undefined;
    lastFocusKeyRef.current = focusKey;
    if (isInitialCall) return;

    if (hotspots.length > 0) {
      const bounds = L.latLngBounds(
        hotspots.map((h) => [h.lat, h.lng] as [number, number])
      );
      const isShowingAll = focusKey.startsWith('semua::semua::');
      map.fitBounds(bounds.pad(isShowingAll ? 0.24 : 0.16), {
        padding: [36, 36],
        maxZoom: isShowingAll ? 7 : 10,
      });
    } else {
      map.fitBounds(L.latLngBounds(getKalbarBounds()), {
        padding: [24, 24],
        maxZoom: 7,
      });
    }
  }, [focusKey, hotspots]);

  // Switch tile layer when tileLayerId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = MAP_TILE_LAYERS[tileLayerId];
    const nextLayer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
      ...(cfg.subdomains ? { subdomains: cfg.subdomains } : {}),
    });
    nextLayer.addTo(map);
    tileLayerRef.current = nextLayer;
  }, [tileLayerId]);

  // Render & style GeoJSON regency boundaries
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    if (!showBoundaries) return;

    const geoLayer = L.geoJSON(getKalbarGeoJson(), {
      style: (feature) => {
        const name = feature?.properties?.shapeName ?? '';
        const regionId = slugifyRegencyName(name);
        return getBoundaryStyle(tileLayerId, regionId === selectedRegionId);
      },
      onEachFeature: (feature, layer) => {
        const shapeName = feature.properties?.shapeName ?? 'Wilayah Kalbar';
        const displayName = getRegencyDisplayName(shapeName);
        layer.bindTooltip(displayName, {
          sticky: true,
          direction: 'top',
          className: 'text-xs font-semibold',
        });

        layer.on('mouseover', () => {
          if (layer instanceof L.Path) {
            layer.setStyle({ weight: 2.6, fillOpacity: 0.34 });
          }
        });
        layer.on('mouseout', () => {
          geoLayer.resetStyle(layer);
        });
      },
    });

    geoLayer.addTo(map);
    geoJsonLayerRef.current = geoLayer;
  }, [showBoundaries, tileLayerId, selectedRegionId]);

  // Render subtle city corridor lines & fire-icon markers
  useEffect(() => {
    const routesGroup = routesLayerRef.current;
    const markersGroup = markersLayerRef.current;
    if (!markersGroup) return;

    if (routesGroup) {
      routesGroup.clearLayers();
      // Connect hotspots strictly within the same regency so cross-city zigzags do not clutter the map
      const byRegion = new Map<string, [number, number][]>();
      for (const spot of hotspots) {
        const list = byRegion.get(spot.regionId) ?? [];
        list.push([spot.lat, spot.lng]);
        byRegion.set(spot.regionId, list);
      }
      for (const coords of byRegion.values()) {
        if (coords.length > 1) {
          L.polyline(coords, {
            color: '#F59E0B',
            weight: 1.5,
            opacity: 0.36,
            dashArray: '5 7',
            interactive: false,
          }).addTo(routesGroup);
        }
      }
    }

    markersGroup.clearLayers();
    markersByIdRef.current = {};

    for (const spot of hotspots) {
      const isSelected = spot.id === selectedHotspotId;
      const marker = L.marker([spot.lat, spot.lng], {
        icon: buildFireMarkerIcon(spot, isSelected),
        zIndexOffset: isSelected ? 500 : 100,
      });

      marker.bindPopup(buildPopupHtml(spot), {
        className: 'karhutla-leaflet-popup',
        maxWidth: 295,
      });

      marker.on('click', () => {
        onSelectRef.current(spot.id);
      });

      marker.addTo(markersGroup);
      markersByIdRef.current[spot.id] = marker;
    }
  }, [hotspots, selectedHotspotId]);

  // Pan map smoothly only when user actively switches selected hotspot
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedHotspot) return;
    if (prevSelectedIdRef.current === selectedHotspot.id) return;
    prevSelectedIdRef.current = selectedHotspot.id;

    const marker = markersByIdRef.current[selectedHotspot.id];
    if (marker) {
      map.panTo([selectedHotspot.lat, selectedHotspot.lng], {
        animate: true,
        duration: 0.45,
      });
    }
  }, [selectedHotspot]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#CBD5E1] bg-[#0F172A] shadow-sm">
      <div
        ref={containerRef}
        data-testid="kalbar-leaflet-map"
        className="h-[430px] w-full sm:h-[520px] lg:h-[600px]"
        aria-label="Peta geografis interaktif Provinsi Kalimantan Barat"
      />
    </div>
  );
}
