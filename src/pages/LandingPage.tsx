import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Compass,
  Flame,
  MapPin,
  ShieldCheck,
  UserCheck,
  Wind,
} from 'lucide-react';
import { DEFAULT_REGION_ID } from '../data/kalbarRegions';
import { SafeMediaFrame } from '../components/common/SafeMediaFrame';
import { StatusIndicator } from '../components/common/StatusIndicator';
import {
  CERTIFICATE_REQUIRED_MISSIONS,
  useGameProgress,
} from '../context/GameProgressContext';

const HERO_IMAGE_PATH = '/src/assets/images/hero_rescue_command_1795278470767.jpg';
const PEATLAND_IMAGE_PATH = '/src/assets/images/kalbar_peatland_aerial_1795268585223.jpg';

const REQUIRED_MISSION_ID_SET = new Set(
  CERTIFICATE_REQUIRED_MISSIONS.map((m) => m.missionId)
);

export function LandingPage() {
  const {
    playerName,
    hasCustomProfileName,
    playerProgress,
  } = useGameProgress();

  const totalRequired = CERTIFICATE_REQUIRED_MISSIONS.length;
  const completedCount = playerProgress.completedMissionIds.filter((id) =>
    REQUIRED_MISSION_ID_SET.has(id)
  ).length;
  const progressPct = Math.min(
    100,
    Math.round((completedCount / Math.max(1, totalRequired)) * 100)
  );

  const missionStages = [
    {
      num: '01',
      title: 'Pilih Titik Api di Peta',
      description:
        'Pantau sebaran titik api aktif di wilayah Kalimantan Barat dan tentukan sektor misi.',
      to: '/peta-kalbar',
      icon: MapPin,
      accent: 'text-[#EA580C] bg-[#FFF7ED] border-[#FDBA74]',
    },
    {
      num: '02',
      title: 'Briefing Komando',
      description:
        'Cek ringkasan sektor, target 70%, dan kesiapan tim sebelum terjun ke tantangan.',
      to: `/briefing/${DEFAULT_REGION_ID}`,
      icon: Compass,
      accent: 'text-[#0284C7] bg-[#F0F9FF] border-[#BAE6FD]',
    },
    {
      num: '03',
      title: 'Kuis Titik Api (5–7 Soal)',
      description:
        'Padamkan titik api dengan menjawab 5 hingga 7 pertanyaan mitigasi karhutla berbasis STEM.',
      to: `/simulasi/${DEFAULT_REGION_ID}`,
      icon: Flame,
      accent: 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]',
    },
    {
      num: '04',
      title: 'Hasil & Sertifikat',
      description:
        'Tinjau skor tiap sektor, pembahasan C-H-O, lalu buka laporan akhir dan sertifikat.',
      to: '/evaluasi-stem',
      icon: Award,
      accent: 'text-[#059669] bg-[#ECFDF5] border-[#A7F3D0]',
    },
  ];

  return (
    <div>
      {/* Hero Section: Slate Dark Structural Header + Ember Orange CTA */}
      <section className="relative overflow-hidden bg-[#0F172A] text-[#F8FAFC]">
        <div className="absolute inset-0">
          <SafeMediaFrame
            src={HERO_IMAGE_PATH}
            alt="Menara pantau komando penyelamatan kebakaran hutan Kalimantan Barat dengan kepulan asap di cakrawala"
            className="h-full w-full"
            fallbackTitle="Pos Komando Siaga Karhutla Kalimantan Barat"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/95 via-[#0F172A]/85 to-[#0F172A]/50"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent"
            aria-hidden="true"
          />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Left: Main Game Title, 2-Line Brief & Ember Orange CTA */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[#CBD5E1]">
                <Flame className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                <span>Edukasi Mitigasi Karhutla · Kalimantan Barat</span>
              </div>

              <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white [text-wrap:balance] sm:text-5xl lg:text-[3.75rem] lg:leading-[1.06]">
                SIAGA KARHUTLA
              </h1>

              <p className="mt-3 max-w-xl text-base font-medium leading-relaxed text-[#CBD5E1] line-clamp-2 sm:text-lg">
                Pantau titik api Kalimantan Barat dan selesaikan misi kuis mitigasi untuk
                menyelamatkan hutan tropis dan lahan gambut.
              </p>

              {/* Compact Visual Map + Fire Icon + Readiness Strip */}
              <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-[#334155] py-3 text-xs text-[#CBD5E1]">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <MapPin className="h-3.5 w-3.5 text-[#EA580C]" aria-hidden="true" />
                  <span>Peta 14 Kab/Kota Kalbar</span>
                </span>
                <span aria-hidden="true" className="text-[#475569]">·</span>
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Flame className="h-3.5 w-3.5 text-[#F59E0B]" aria-hidden="true" />
                  <span>15 Titik Api ({totalRequired} Misi Wajib)</span>
                </span>
                <span aria-hidden="true" className="text-[#475569]">·</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#BAE6FD]">
                  <Wind className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
                  <span>Target Lulus 70%</span>
                </span>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  to="/peta-kalbar"
                  data-testid="landing-start-mission-btn"
                  className="game-btn-fire inline-flex min-h-[50px] items-center gap-2.5 rounded-xl px-7 py-3 text-sm font-extrabold tracking-wide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F59E0B]"
                >
                  <Flame className="h-4 w-4" aria-hidden="true" />
                  <span>MULAI MISI</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <Link
                  to="/evaluasi-stem"
                  className="inline-flex min-h-[50px] items-center gap-2 rounded-xl border border-[#475569] bg-[#1E293B]/90 px-5 py-3 text-sm font-semibold text-[#F8FAFC] transition-colors duration-150 hover:border-[#94A3B8] hover:bg-[#334155] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F8FAFC]"
                >
                  <Award className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
                  <span>Hasil Akhir &amp; Sertifikat</span>
                </Link>
              </div>
            </div>

            {/* Right: Game Status Panel + Login / Demo Portal */}
            <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/95 p-5 shadow-2xl backdrop-blur-md lg:col-span-5 sm:p-6">
              <div className="flex items-center justify-between gap-2 border-b border-[#334155] pb-3.5">
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#F59E0B]">
                    Panel Status Komando
                  </p>
                  <p className="mt-0.5 text-xs text-[#CBD5E1]">
                    Progres Penanganan Titik Api
                  </p>
                </div>
                <span className="rounded-lg border border-[#EA580C]/50 bg-[#0F172A] px-2.5 py-1 font-mono text-xs font-bold text-white tabular-nums">
                  {completedCount}/{totalRequired} Misi
                </span>
              </div>

              {/* Animated Progress Track */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#CBD5E1]">
                  <span>Kesiapan Sektor Kalbar</span>
                  <span className="font-mono tabular-nums">{progressPct}%</span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#0F172A] ring-1 ring-[#334155]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#EA580C] to-[#F59E0B] transition-all duration-500"
                    style={{ width: `${Math.max(4, progressPct)}%` }}
                  />
                </div>
              </div>

              {/* Mini Radar Kalbar Visual Cue */}
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#334155] bg-[#0F172A]/80 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EA580C]/20 text-[#FB923C]">
                    <Flame className="karhutla-flame-anim h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="text-xs">
                    <p className="font-bold text-white">
                      {totalRequired - completedCount > 0
                        ? `${totalRequired - completedCount} Titik Api Menunggu`
                        : 'Seluruh Titik Api Terkendali'}
                    </p>
                    <p className="text-[11px] text-[#94A3B8]">
                      5–7 soal acak unik per sektor
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[11px] font-bold text-[#F59E0B] tabular-nums">
                  Skor {playerProgress.averageOverallScore}/100
                </span>
              </div>

              <div className="mt-4 space-y-3 border-t border-[#334155] pt-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <UserCheck className="h-4 w-4 text-[#34D399]" aria-hidden="true" />
                  <span className="truncate">
                    {hasCustomProfileName
                      ? `Pemain: ${playerName}`
                      : 'Pemain Siaga Kalbar'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#CBD5E1]">
                  Langsung bermain tanpa login. Progres misi &amp; skor tersimpan
                  otomatis di browser Anda.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    to="/peta-kalbar"
                    className="game-btn-fire inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold"
                  >
                    <span>Buka Peta Misi</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/profil"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#475569] bg-[#0F172A] px-3.5 py-2 text-xs font-semibold text-[#F8FAFC] hover:border-[#94A3B8]"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
                    <span>Profil</span>
                  </Link>
                  <Link
                    to="/sertifikat"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#475569] bg-[#0F172A] px-3.5 py-2 text-xs font-semibold text-[#F8FAFC] hover:border-[#94A3B8]"
                  >
                    <Award className="h-3.5 w-3.5 text-[#F59E0B]" aria-hidden="true" />
                    <span>Sertifikat</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Stage Game Mission Flow Cards */}
      <section className="border-b border-[#E2E8F0] bg-[#F8FAFC] py-12 sm:py-14">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#EA580C]">
                Alur Permainan Misi
              </p>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl">
                4 Langkah Padamkan Titik Api
              </h2>
            </div>
            <Link
              to="/peta-kalbar"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E293B] hover:text-[#EA580C]"
            >
              <span>Langsung ke Peta Kalbar</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {missionStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <Link
                  key={stage.num}
                  to={stage.to}
                  className="group flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-[#EA580C] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA580C]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-[#1E293B]">
                        TAHAP {stage.num}
                      </span>
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${stage.accent}`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-base font-bold text-[#0F172A] transition-colors group-hover:text-[#EA580C]">
                      {stage.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                      {stage.description}
                    </p>
                  </div>

                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#1E293B] group-hover:text-[#EA580C]">
                    <span>Buka Sektor</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compact Ecosystem & Fire Alert Levels Strip */}
      <section className="bg-[#F1F5F9] py-12 sm:py-14">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-stretch gap-8 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SafeMediaFrame
                src={PEATLAND_IMAGE_PATH}
                alt="Foto udara kawasan hutan gambut dan aliran sungai Kalimantan Barat"
                className="h-60 rounded-xl border border-[#E2E8F0] sm:h-72 lg:h-full"
                fallbackTitle="Lanskap Gambut Kalimantan Barat"
              />
            </div>

            <div className="flex flex-col justify-center lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0284C7]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>Tingkat Kerawanan Sektor</span>
              </div>
              <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-[#0F172A] [text-wrap:balance]">
                Kenali Status Titik Api Sebelum Bertindak
              </h2>

              <div className="mt-5 divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex flex-col gap-1.5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <StatusIndicator status="bahaya" variant="inline" />
                  <span className="text-xs text-[#475569]">
                    Prioritas tinggi (Merah) — selesaikan 7 soal kuis mitigasi.
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <StatusIndicator status="waspada" variant="inline" />
                  <span className="text-xs text-[#475569]">
                    Siaga transisi kemarau (Jingga) — selesaikan 6 soal kuis mitigasi.
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <StatusIndicator status="cukup-aman" variant="inline" />
                  <span className="text-xs text-[#475569]">
                    Pantauan preventif awal (Kuning) — selesaikan 5 soal kuis mitigasi.
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <StatusIndicator status="aman" variant="inline" />
                  <span className="text-xs text-[#475569]">
                    Titik api teratasi (Hijau) setelah skor kuis mencapai minimal 70%.
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to="/peta-kalbar"
                  className="game-btn-fire inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold"
                >
                  <span>Buka Peta Misi Kalbar</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
