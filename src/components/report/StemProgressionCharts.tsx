import type { AbilityProgressionPoint } from '../../utils/stemReportEngine';

interface StemProgressionChartsProps {
  progressionSeries: AbilityProgressionPoint[];
  stemMetrics: {
    science: number;
    technology: number;
    engineering: number;
    mathematics: number;
  };
}

export function StemProgressionCharts({
  progressionSeries,
  stemMetrics,
}: StemProgressionChartsProps) {
  // SVG layout coordinates for Progression Line Chart
  const svgW = 640;
  const svgH = 270;
  const padLeft = 44;
  const padRight = 20;
  const padTop = 22;
  const padBottom = 42;
  const plotW = svgW - padLeft - padRight;
  const plotH = svgH - padTop - padBottom;

  const count = progressionSeries.length;
  const getX = (idx: number) =>
    count <= 1 ? padLeft + plotW / 2 : padLeft + (idx / (count - 1)) * plotW;
  const getY = (score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    return padTop + plotH - (clamped / 100) * plotH;
  };

  const buildPolyline = (
    extractor: (pt: AbilityProgressionPoint) => number
  ): string =>
    progressionSeries
      .map((pt, idx) => `${getX(idx).toFixed(1)},${getY(extractor(pt)).toFixed(1)}`)
      .join(' ');

  const buildAreaPath = (
    extractor: (pt: AbilityProgressionPoint) => number
  ): string => {
    if (progressionSeries.length === 0) return '';
    const coords = progressionSeries.map((pt, idx) => ({
      x: getX(idx),
      y: getY(extractor(pt)),
    }));
    const start = `M ${coords[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)}`;
    const lines = coords
      .map((c) => `L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');
    const end = `L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;
    return `${start} ${lines} ${end}`;
  };

  const stemBars = [
    {
      code: 'S',
      label: 'Science',
      sub: 'Ekologi & Kimia Pembakaran',
      value: stemMetrics.science,
      fill: '#059669',
    },
    {
      code: 'T',
      label: 'Technology',
      sub: 'Analisis GIS & Citra Spasial',
      value: stemMetrics.technology,
      fill: '#0284C7',
    },
    {
      code: 'E',
      label: 'Engineering',
      sub: 'Rekayasa Sekat & Hidrologi',
      value: stemMetrics.engineering,
      fill: '#1E293B',
    },
    {
      code: 'M',
      label: 'Mathematics',
      sub: 'Pemodelan Rasio & Pembobotan',
      value: stemMetrics.mathematics,
      fill: '#EA580C',
    },
  ];

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left: Chronological Ability Progression SVG Line Chart */}
      <div className="rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-sm lg:col-span-7 print-avoid-break">
        <div className="flex flex-col gap-2 border-b border-[#E2E8F0] pb-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-base font-extrabold text-[#0F172A]">
              Tren Perkembangan Kemampuan Lintas Misi
            </h3>
            <p className="text-xs text-[#475569]">
              Urutan kronologis penyelesaian misi dari sesi pertama hingga terakhir
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#334155]">
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="10" aria-hidden="true">
                <line x1="0" y1="5" x2="16" y2="5" stroke="#1E293B" strokeWidth="2.5" />
                <circle cx="8" cy="5" r="3" fill="#1E293B" />
              </svg>
              <span>Total Skor</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="10" aria-hidden="true">
                <line
                  x1="0"
                  y1="5"
                  x2="16"
                  y2="5"
                  stroke="#0284C7"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
                <rect x="5.5" y="2.5" width="5" height="5" fill="#0284C7" />
              </svg>
              <span>Akurasi Analisis</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="10" aria-hidden="true">
                <line
                  x1="0"
                  y1="5"
                  x2="16"
                  y2="5"
                  stroke="#EA580C"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                />
                <polygon points="8,1.5 11.5,5 8,8.5 4.5,5" fill="#EA580C" />
              </svg>
              <span>Ketepatan Keputusan</span>
            </span>
          </div>
        </div>

        <div className="mt-4">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            role="img"
            aria-label="Grafik garis perkembangan total skor, akurasi analisis, dan ketepatan keputusan pemain lintas misi"
            className="h-auto w-full overflow-visible"
          >
            {yTicks.map((tick) => {
              const y = getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgW - padRight}
                    y2={y}
                    stroke={tick === 75 ? '#CBD5E1' : '#F1F5F9'}
                    strokeWidth={tick === 75 ? '1.2' : '1'}
                    strokeDasharray={tick === 75 ? '4 4' : undefined}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-[#475569] font-mono text-[10px]"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {progressionSeries.length > 1 && (
              <path
                d={buildAreaPath((p) => p.overallScore)}
                fill="#1E293B"
                fillOpacity="0.08"
              />
            )}

            {progressionSeries.length > 1 && (
              <polyline
                fill="none"
                stroke="#EA580C"
                strokeWidth="2"
                strokeDasharray="3 3"
                points={buildPolyline((p) => p.decisionPrecision)}
              />
            )}

            {progressionSeries.length > 1 && (
              <polyline
                fill="none"
                stroke="#0284C7"
                strokeWidth="2"
                strokeDasharray="5 3"
                points={buildPolyline((p) => p.analysisAccuracy)}
              />
            )}

            {progressionSeries.length > 1 && (
              <polyline
                fill="none"
                stroke="#1E293B"
                strokeWidth="2.75"
                points={buildPolyline((p) => p.overallScore)}
              />
            )}

            {progressionSeries.map((pt, idx) => {
              const cx = getX(idx);
              const yOverall = getY(pt.overallScore);
              const yAnalysis = getY(pt.analysisAccuracy);
              const yDecision = getY(pt.decisionPrecision);
              return (
                <g key={pt.missionId}>
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={padTop + plotH}
                    stroke="#F8FAFC"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${cx},${yDecision - 4} ${cx + 4},${yDecision} ${cx},${yDecision + 4} ${cx - 4},${yDecision}`}
                    fill="#EA580C"
                  />
                  <rect
                    x={cx - 3.5}
                    y={yAnalysis - 3.5}
                    width="7"
                    height="7"
                    fill="#0284C7"
                  />
                  <circle
                    cx={cx}
                    cy={yOverall}
                    r="4.5"
                    fill="#1E293B"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <text
                    x={cx}
                    y={Math.max(12, yOverall - 9)}
                    textAnchor="middle"
                    className="fill-[#0F172A] font-mono text-[10px] font-bold"
                  >
                    {pt.overallScore}
                  </text>
                  <text
                    x={cx}
                    y={svgH - 18}
                    textAnchor="middle"
                    className="fill-[#0F172A] font-mono text-[10px] font-semibold"
                  >
                    #{pt.orderIndex}
                  </text>
                  <text
                    x={cx}
                    y={svgH - 5}
                    textAnchor="middle"
                    className="fill-[#475569] font-mono text-[9px]"
                  >
                    {pt.shortLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right: 4-Pillar STEM Competency Benchmark Chart */}
      <div className="rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-sm lg:col-span-5 print-avoid-break">
        <div className="border-b border-[#E2E8F0] pb-3.5">
          <h3 className="font-display text-base font-extrabold text-[#0F172A]">
            Profil Kompetensi Empat Pilar STEM
          </h3>
          <p className="text-xs text-[#475569]">
            Perbandingan performa S-T-E-M terhadap ambang kemahiran (75/100)
          </p>
        </div>

        <div className="mt-4 space-y-4">
          {stemBars.map((bar) => (
            <div key={bar.code} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <span className="font-display text-sm font-bold text-[#0F172A]">
                    {bar.label}
                  </span>
                  <span className="ml-2 text-[11px] text-[#475569]">{bar.sub}</span>
                </div>
                <span className="font-mono text-sm font-bold text-[#0F172A] tabular-nums">
                  {bar.value}/100
                </span>
              </div>

              {/* Print-safe inline SVG progress bar with 75 benchmark line */}
              <svg
                viewBox="0 0 400 18"
                role="img"
                aria-label={`Skor ${bar.label}: ${bar.value} dari 100`}
                className="h-[18px] w-full"
              >
                <rect
                  x="0"
                  y="3"
                  width="400"
                  height="12"
                  rx="4"
                  fill="#F1F5F9"
                />
                <rect
                  x="0"
                  y="3"
                  width={Math.max(4, Math.min(400, (bar.value / 100) * 400))}
                  height="12"
                  rx="4"
                  fill={bar.fill}
                />
                {/* Benchmark 75 line */}
                <line
                  x1="300"
                  y1="0"
                  x2="300"
                  y2="18"
                  stroke="#0F172A"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              </svg>
            </div>
          ))}
        </div>

        <p className="mt-4 border-t border-[#E2E8F0] pt-3 text-[11px] text-[#475569]">
          Garis putus vertikal menandai acuan capaian terampil (<strong className="font-mono text-[#0F172A]">75/100</strong>) berdasarkan akumulasi seluruh misi yang diselesaikan.
        </p>
      </div>
    </div>
  );
}
