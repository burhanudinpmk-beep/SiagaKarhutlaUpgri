import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useParams, useSearchParams } from 'react-router-dom';
import {
  Award,
  BarChart3,
  Compass,
  Flame,
  Home,
  Map as MapIcon,
  Menu,
  Music,
  SlidersHorizontal,
  Target,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { buildMissionRoutes } from '../../utils/regionHelpers';
import {
  CERTIFICATE_REQUIRED_MISSIONS,
  useGameProgress,
} from '../../context/GameProgressContext';
import {
  BGM_MOOD_LABELS,
  getAudioState,
  playButtonClickSfx,
  setMusicEnabled,
  setMusicVolume,
  setSfxEnabled,
  setSfxVolume,
  subscribeAudioState,
  unlockAndPlayMusic,
  type AudioStateSnapshot,
} from '../../utils/soundEffects';

export function TopNavBar() {
  const { regionId, missionId: paramMissionId } = useParams<{
    regionId?: string;
    missionId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const missionId = paramMissionId ?? searchParams.get('missionId') ?? undefined;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [audioPopoverOpen, setAudioPopoverOpen] = useState(false);
  const [audioState, setAudioState] = useState<AudioStateSnapshot>(() =>
    getAudioState()
  );
  const audioPopoverRef = useRef<HTMLDivElement | null>(null);
  const routes = buildMissionRoutes(regionId, missionId);

  const {
    navbarProfileLabel,
    hasCustomProfileName,
    playerProgress,
  } = useGameProgress();

  const completedRequiredCount = useMemo(() => {
    const requiredSet = new Set(
      CERTIFICATE_REQUIRED_MISSIONS.map((m) => m.missionId)
    );
    return playerProgress.completedMissionIds.filter((id) =>
      requiredSet.has(id.toLowerCase())
    ).length;
  }, [playerProgress.completedMissionIds]);

  useEffect(() => {
    return subscribeAudioState(setAudioState);
  }, []);

  useEffect(() => {
    if (!audioPopoverOpen) return;
    const onOutsideClick = (e: MouseEvent) => {
      if (
        audioPopoverRef.current &&
        !audioPopoverRef.current.contains(e.target as Node)
      ) {
        setAudioPopoverOpen(false);
      }
    };
    window.addEventListener('mousedown', onOutsideClick);
    return () => window.removeEventListener('mousedown', onOutsideClick);
  }, [audioPopoverOpen]);

  const navItems = [
    { to: routes.home, label: 'Beranda', icon: Home, end: true },
    { to: routes.map, label: 'Peta Kalbar', icon: MapIcon, end: false },
    { to: routes.briefing, label: 'Briefing', icon: Compass, end: false },
    { to: routes.simulation, label: 'Kuis Misi', icon: Target, end: false },
    { to: '/evaluasi-stem', label: 'Hasil Akhir', icon: BarChart3, end: false },
    { to: '/sertifikat', label: 'Sertifikat', icon: Award, end: false },
  ];

  const closeMenu = () => setMobileMenuOpen(false);

  const isAllMuted = !audioState.musicEnabled && !audioState.sfxEnabled;
  const musicPct = Math.round(audioState.musicVolume * 100);
  const sfxPct = Math.round(audioState.sfxVolume * 100);

  return (
    <header className="sticky top-0 z-40 border-b border-[#1E293B] bg-[#0F172A]/95 text-[#F8FAFC] backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-2 px-4 sm:px-6 lg:px-5 2xl:px-8">
        {/* Zone 1: Brand Mark */}
        <Link
          to={routes.home}
          onClick={() => {
            closeMenu();
            playButtonClickSfx();
          }}
          className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA580C]"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#EA580C]/50 bg-[#1E293B] text-[#EA580C]">
            <Flame className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-display text-base font-extrabold tracking-tight text-white 2xl:text-lg">
            SIAGA KARHUTLA
          </span>
        </Link>

        {/* Zone 2: Single-Line Navigation Links */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden items-center gap-3 2xl:gap-5 lg:flex"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                onClick={() => playButtonClickSfx()}
                className={({ isActive }) =>
                  `relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap py-1 text-xs font-semibold transition-colors duration-150 2xl:text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA580C] ${
                    isActive
                      ? 'text-[#F59E0B] after:absolute after:inset-x-0 after:-bottom-[19px] after:h-[3px] after:rounded-t-full after:bg-[#EA580C]'
                      : 'text-[#CBD5E1] hover:text-white'
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Zone 3: Audio, Mission Progress, Account & Primary CTA */}
        <div className="flex shrink-0 items-center gap-1.5 2xl:gap-2">
          <div className="relative" ref={audioPopoverRef}>
            <button
              type="button"
              data-testid="audio-panel-toggle-btn"
              onClick={() => {
                setAudioPopoverOpen((prev) => !prev);
                playButtonClickSfx();
              }}
              aria-expanded={audioPopoverOpen}
              aria-label="Pengaturan Audio Musik & Efek Suara"
              title="Pengaturan Audio Musik & Efek Suara"
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
                audioPopoverOpen
                  ? 'border-[#EA580C] bg-[#1E293B] text-white'
                  : 'border-[#334155] bg-[#1E293B] text-[#E2E8F0] hover:border-[#EA580C] hover:text-white'
              }`}
            >
              {isAllMuted ? (
                <VolumeX className="h-4 w-4 text-[#94A3B8]" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
              )}
              <span className="hidden text-[11px] xl:inline">Audio</span>
            </button>

            {audioPopoverOpen && (
              <div
                data-testid="audio-control-panel"
                role="dialog"
                aria-label="Kontrol Audio Permainan"
                className="absolute right-0 z-50 mt-2 w-[305px] rounded-2xl border border-[#334155] bg-[#0F172A] p-4 text-[#F8FAFC] shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-2.5">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                    <span className="font-display text-xs font-extrabold tracking-wide text-white">
                      Kontrol Audio Permainan
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAudioPopoverOpen(false)}
                    aria-label="Tutup kontrol audio"
                    className="rounded-md p-1 text-[#94A3B8] hover:bg-[#1E293B] hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-3 rounded-xl border border-[#334155] bg-[#1E293B] px-3 py-2 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#E2E8F0]">
                      <Music className="h-3.5 w-3.5 text-[#F59E0B]" aria-hidden="true" />
                      <span>{BGM_MOOD_LABELS[audioState.activeMood]}</span>
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        audioState.isPlaying ? 'text-[#34D399]' : 'text-[#94A3B8]'
                      }`}
                    >
                      {audioState.isPlaying
                        ? 'AKTIF'
                        : audioState.musicEnabled
                          ? 'SIAP'
                          : 'MATI'}
                    </span>
                  </div>
                  {audioState.needsInteractionToStart && audioState.musicEnabled && (
                    <button
                      type="button"
                      onClick={() => unlockAndPlayMusic()}
                      className="mt-2 w-full rounded-lg bg-[#EA580C] px-2.5 py-1 text-[11px] font-extrabold text-white hover:bg-[#C2410C]"
                    >
                      Mulai Musik Latar
                    </button>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-testid="audio-music-toggle"
                    aria-pressed={audioState.musicEnabled}
                    onClick={() => setMusicEnabled(!audioState.musicEnabled)}
                    className={`flex min-h-[38px] items-center justify-between rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                      audioState.musicEnabled
                        ? 'border-[#059669] bg-[#059669]/20 text-[#A7F3D0]'
                        : 'border-[#334155] bg-[#1E293B] text-[#94A3B8]'
                    }`}
                  >
                    <span>Musik</span>
                    <span className="font-mono text-[11px]">
                      {audioState.musicEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="audio-sfx-toggle"
                    aria-pressed={audioState.sfxEnabled}
                    onClick={() => {
                      const next = !audioState.sfxEnabled;
                      setSfxEnabled(next);
                      if (next) playButtonClickSfx();
                    }}
                    className={`flex min-h-[38px] items-center justify-between rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                      audioState.sfxEnabled
                        ? 'border-[#EA580C]/70 bg-[#EA580C]/20 text-[#FED7AA]'
                        : 'border-[#334155] bg-[#1E293B] text-[#94A3B8]'
                    }`}
                  >
                    <span>Efek (SFX)</span>
                    <span className="font-mono text-[11px]">
                      {audioState.sfxEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>

                <div className="mt-3.5 space-y-3 border-t border-[#1E293B] pt-3">
                  <label className="block">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#CBD5E1]">
                      <span>Volume Musik Latar</span>
                      <span className="font-mono font-bold text-[#F59E0B] tabular-nums">
                        {musicPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={2}
                      data-testid="audio-music-slider"
                      value={musicPct}
                      onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
                      className="mt-1.5 h-2 w-full cursor-pointer accent-[#EA580C]"
                    />
                    {audioState.activeMood === 'kuis' && (
                      <p className="mt-1 text-[10px] text-[#7DD3FC]">
                        Mode kuis aktif: volume musik diturunkan otomatis ke ~
                        {Math.round(audioState.effectiveMusicVolume * 100)}% agar tetap fokus.
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#CBD5E1]">
                      <span>Volume Efek Suara (SFX)</span>
                      <span className="font-mono font-bold text-[#F59E0B] tabular-nums">
                        {sfxPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={2}
                      data-testid="audio-sfx-slider"
                      value={sfxPct}
                      onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
                      className="mt-1.5 h-2 w-full cursor-pointer accent-[#F59E0B]"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/sertifikat"
            onClick={() => playButtonClickSfx()}
            aria-label={`Progres misi ${completedRequiredCount} dari ${CERTIFICATE_REQUIRED_MISSIONS.length}`}
            className="hidden items-center gap-1.5 rounded-lg border border-[#334155] bg-[#1E293B] px-2.5 py-1.5 font-mono text-xs font-semibold text-[#E2E8F0] transition-colors hover:border-[#F59E0B] hover:text-white sm:inline-flex"
          >
            <Award className="h-3.5 w-3.5 text-[#F59E0B]" aria-hidden="true" />
            <span className="tabular-nums">
              {completedRequiredCount}/{CERTIFICATE_REQUIRED_MISSIONS.length}
            </span>
          </Link>

          <Link
            to="/profil"
            data-testid="nav-profile-link"
            onClick={() => playButtonClickSfx()}
            title={
              hasCustomProfileName
                ? `Profil Pemain: ${navbarProfileLabel}`
                : 'Profil Pemain & Nama Sertifikat'
            }
            className={`hidden min-h-[36px] max-w-[168px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors sm:inline-flex ${
              hasCustomProfileName
                ? 'border-[#059669]/60 bg-[#059669]/20 text-[#A7F3D0] hover:border-[#34D399] hover:text-white'
                : 'border-[#334155] bg-[#1E293B] text-[#E2E8F0] hover:border-[#64748B] hover:text-white'
            }`}
          >
            <User
              className={`h-3.5 w-3.5 shrink-0 ${
                hasCustomProfileName ? 'text-[#34D399]' : 'text-[#38BDF8]'
              }`}
              aria-hidden="true"
            />
            <span className="truncate">{navbarProfileLabel}</span>
          </Link>

          <Link
            to={routes.map}
            onClick={() => playButtonClickSfx()}
            className="game-btn-fire hidden shrink-0 whitespace-nowrap rounded-lg px-3 2xl:px-3.5 py-2 text-xs font-extrabold tracking-wide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F59E0B] md:inline-flex"
          >
            MULAI MISI
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-[#F8FAFC] transition-colors hover:border-[#EA580C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA580C] lg:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="border-t border-[#1E293B] bg-[#0F172A] px-4 py-4 lg:hidden"
        >
          <nav aria-label="Navigasi Seluler" className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  onClick={() => {
                    closeMenu();
                    playButtonClickSfx();
                  }}
                  className={({ isActive }) =>
                    `flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border border-[#EA580C]/50 bg-[#1E293B] font-bold text-[#F59E0B]'
                        : 'text-[#CBD5E1] hover:bg-[#1E293B] hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <NavLink
              to="/profil"
              onClick={() => {
                closeMenu();
                playButtonClickSfx();
              }}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border border-[#EA580C]/50 bg-[#1E293B] font-bold text-[#F59E0B]'
                    : 'text-[#CBD5E1] hover:bg-[#1E293B] hover:text-white'
                }`
              }
            >
              <User className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {hasCustomProfileName
                  ? `Profil: ${navbarProfileLabel}`
                  : 'Profil & Nama Sertifikat'}
              </span>
            </NavLink>

            <div className="mt-2 flex flex-col gap-2 border-t border-[#1E293B] pt-3">
              <Link
                to={routes.map}
                onClick={() => {
                  closeMenu();
                  playButtonClickSfx();
                }}
                className="game-btn-fire flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-extrabold tracking-wide"
              >
                MULAI MISI
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
