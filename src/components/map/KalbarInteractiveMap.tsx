import type { RegionProfile } from '../../types/mission';
import { getStatusPresentation } from '../../utils/regionHelpers';

interface KalbarInteractiveMapProps {
  regions: RegionProfile[];
  selectedRegionId: string;
  onSelectRegion: (regionId: string) => void;
  layers?: {
    showBoundary?: boolean;
    showPeatland?: boolean;
    showRivers?: boolean;
    showHotspots?: boolean;
  };
}

export function KalbarInteractiveMap({
  regions,
  selectedRegionId,
  onSelectRegion,
  layers = {
    showBoundary: true,
    showPeatland: true,
    showRivers: true,
    showHotspots: true,
  },
}: KalbarInteractiveMapProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[#DCE3DE] bg-[#0B2315]">
      <svg
        viewBox="0 0 800 620"
        role="img"
        aria-label="Peta interaktif wilayah Kalimantan Barat beserta status kerawanan kebakaran hutan dan lahan"
        className="block h-auto w-full select-none"
      >
        <defs>
          <linearGradient id="kalbarSeaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#081C11" />
            <stop offset="100%" stopColor="#0D2A1A" />
          </linearGradient>
          <linearGradient id="kalbarLandGrad" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#164A32" />
            <stop offset="55%" stopColor="#14402B" />
            <stop offset="100%" stopColor="#0F3322" />
          </linearGradient>
          <pattern id="gisGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(180, 215, 195, 0.08)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Maritime & Coordinate Backdrop */}
        <rect width="800" height="620" fill="url(#kalbarSeaGrad)" />
        <rect width="800" height="620" fill="url(#gisGrid)" />

        {/* Coordinate Graticule Labels */}
        <g fill="#6E9480" fontSize="10" fontFamily="IBM Plex Mono, monospace">
          <text x="16" y="34">1°30′ LU</text>
          <text x="16" y="294">0°00′ KHATULISTIWA</text>
          <text x="16" y="534">2°00′ LS</text>
          <text x="165" y="604">109° BT</text>
          <text x="365" y="604">111° BT</text>
          <text x="585" y="604">113° BT</text>
        </g>

        {/* Equator Line */}
        <line
          x1="0"
          y1="300"
          x2="800"
          y2="300"
          stroke="rgba(220, 238, 226, 0.22)"
          strokeWidth="1"
          strokeDasharray="6 6"
        />

        {/* West Kalimantan Provincial Silhouette */}
        <path
          d="M 145 78 L 210 66 L 265 110 L 325 138 L 410 152 L 500 135 L 595 118 L 690 142 L 735 205 L 705 270 L 650 315 L 580 345 L 520 390 L 455 445 L 415 510 L 365 568 L 285 572 L 245 520 L 220 455 L 185 395 L 155 340 L 140 265 L 132 185 Z"
          fill="url(#kalbarLandGrad)"
          stroke={layers.showBoundary ? '#4F8B69' : '#215B3E'}
          strokeWidth={layers.showBoundary ? '2.2' : '1'}
        />

        {/* Ecological Peatland Zones (Structural Layer) */}
        {layers.showPeatland && (
          <g opacity="0.55">
            <ellipse
              cx="208"
              cy="358"
              rx="48"
              ry="34"
              fill="#205C3E"
              stroke="#6AA884"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <ellipse
              cx="305"
              cy="505"
              rx="60"
              ry="42"
              fill="#205C3E"
              stroke="#6AA884"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <ellipse
              cx="180"
              cy="132"
              rx="38"
              ry="26"
              fill="#205C3E"
              stroke="#6AA884"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <ellipse
              cx="592"
              cy="208"
              rx="45"
              ry="28"
              fill="#1E6247"
              stroke="#7BC49B"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          </g>
        )}

        {/* Major River Networks: Sungai Kapuas, Melawi, Pawan */}
        {layers.showRivers && (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Sungai Kapuas */}
            <path
              d="M 162 342 C 215 338, 255 305, 315 280 C 375 256, 435 282, 488 272 C 555 258, 608 216, 678 188"
              stroke="#4AA3BA"
              strokeWidth="3.2"
              opacity="0.82"
            />
            {/* Sungai Melawi */}
            <path
              d="M 475 284 C 505 318, 535 335, 578 345"
              stroke="#4AA3BA"
              strokeWidth="2.1"
              opacity="0.72"
            />
            {/* Sungai Pawan */}
            <path
              d="M 255 510 C 305 505, 345 485, 392 452"
              stroke="#4AA3BA"
              strokeWidth="2.1"
              opacity="0.72"
            />
            {/* Sungai Sambas */}
            <path
              d="M 148 134 C 175 126, 205 122, 240 128"
              stroke="#4AA3BA"
              strokeWidth="1.8"
              opacity="0.72"
            />
          </g>
        )}

        {/* Subtle Geographic Watermark Label in Sea Area */}
        <text
          x="52"
          y="482"
          fill="#4A725C"
          fontSize="11"
          fontWeight="600"
          fontFamily="Plus Jakarta Sans, sans-serif"
          letterSpacing="0.08em"
        >
          LAUT NATUNA SELATAN
        </text>

        {/* Interactive Region Nodes */}
        {regions.map((region) => {
          const isSelected = region.id === selectedRegionId;
          const presentation = getStatusPresentation(region.status);
          const { x, y } = region.coordinates;

          return (
            <g
              key={region.id}
              transform={`translate(${x}, ${y})`}
              role="button"
              tabIndex={0}
              aria-label={`Pilih ${region.name}, status ${presentation.label}`}
              aria-pressed={isSelected}
              onClick={() => onSelectRegion(region.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRegion(region.id);
                }
              }}
              className="cursor-pointer outline-none focus:outline-none"
            >
              {/* Selection Halo */}
              {isSelected && (
                <circle
                  r="24"
                  fill="rgba(255, 255, 255, 0.12)"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              )}

              {/* Hotspot Reference Ring (shown when hotspot layer is active or always as region node) */}
              {layers.showHotspots && (
                <circle
                  r="16"
                  fill={presentation.markerFill}
                  fillOpacity="0.22"
                  stroke={presentation.markerRing}
                  strokeWidth="1.2"
                />
              )}

              {/* Distinct Geometric Symbol per Status (accessible beyond hue) */}
              {region.status === 'bahaya' && (
                <polygon
                  points="0,-10 9,7 -9,7"
                  fill={presentation.markerFill}
                  stroke="#FFFFFF"
                  strokeWidth="1.75"
                />
              )}
              {region.status === 'waspada' && (
                <polygon
                  points="0,-10 10,0 0,10 -10,0"
                  fill={presentation.markerFill}
                  stroke="#FFFFFF"
                  strokeWidth="1.75"
                />
              )}
              {region.status === 'cukup-aman' && (
                <rect
                  x="-7.5"
                  y="-7.5"
                  width="15"
                  height="15"
                  rx="3"
                  fill={presentation.markerFill}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              )}
              {region.status === 'aman' && (
                <circle
                  r="8.5"
                  fill={presentation.markerFill}
                  stroke="#FFFFFF"
                  strokeWidth="1.75"
                />
              )}

              {/* Region Label Box */}
              <g transform="translate(0, 20)">
                <rect
                  x="-58"
                  y="0"
                  width="116"
                  height="22"
                  rx="4"
                  fill={isSelected ? '#FFFFFF' : 'rgba(15, 23, 42, 0.92)'}
                  stroke={isSelected ? '#FFFFFF' : '#475569'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="14.5"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  fill={isSelected ? '#0F172A' : '#F8FAFC'}
                >
                  {region.name.replace('Kabupaten ', '')}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Bottom Legend Bar inside Map Frame */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1E293B] bg-[#0F172A] px-4 py-2.5 text-xs text-[#E2E8F0]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="-10 -10 20 20" aria-hidden="true">
              <polygon points="0,-8 8,6 -8,6" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.5" />
            </svg>
            <span>Bahaya</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="-10 -10 20 20" aria-hidden="true">
              <polygon points="0,-8 8,0 0,8 -8,0" fill="#EA580C" stroke="#FFFFFF" strokeWidth="1.5" />
            </svg>
            <span>Waspada</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="-10 -10 20 20" aria-hidden="true">
              <rect x="-6.5" y="-6.5" width="13" height="13" rx="2" fill="#EAB308" stroke="#0F172A" strokeWidth="1.2" />
            </svg>
            <span>Cukup Aman</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="-10 -10 20 20" aria-hidden="true">
              <circle r="7" fill="#059669" stroke="#FFFFFF" strokeWidth="1.5" />
            </svg>
            <span>Aman (≥70%)</span>
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#94A3B8]">
          Skema Spasial Kalimantan Barat
        </span>
      </div>
    </div>
  );
}
