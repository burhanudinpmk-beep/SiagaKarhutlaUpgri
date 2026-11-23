export type BgmMood =
  | 'beranda'
  | 'peta'
  | 'briefing'
  | 'kuis'
  | 'hasil'
  | 'hasil-retry';

export interface AudioStateSnapshot {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number; // 0..1 (default 0.22 -> ~10% on quiz via 0.45 multiplier)
  sfxVolume: number; // 0..1 (default 0.18)
  activeMood: BgmMood;
  effectiveMusicVolume: number;
  isPlaying: boolean;
  needsInteractionToStart: boolean;
}

interface PersistedAudioPrefs {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

const AUDIO_PREFS_KEY = 'siaga_karhutla_audio_prefs_v2';
const LEGACY_MUTED_KEY = 'siaga_karhutla_sound_muted_v1';

const BGM_TRACKS: Record<BgmMood, string> = {
  beranda: '/audio/bgm-beranda.mp3',
  peta: '/audio/bgm-peta.mp3',
  briefing: '/audio/bgm-briefing.mp3',
  kuis: '/audio/bgm-kuis.mp3',
  hasil: '/audio/bgm-hasil.mp3',
  'hasil-retry': '/audio/bgm-hasil-retry.mp3',
};

export const BGM_MOOD_LABELS: Record<BgmMood, string> = {
  beranda: 'Beranda Komando',
  peta: 'Peta Eksplorasi Kalbar',
  briefing: 'Ruang Briefing',
  kuis: 'Fokus Kuis (Volume Pelan)',
  hasil: 'Keberhasilan Misi',
  'hasil-retry': 'Refleksi & Coba Lagi',
};

function clampVolume(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

function loadAudioPrefs(): PersistedAudioPrefs {
  if (typeof window === 'undefined') {
    return {
      musicEnabled: true,
      sfxEnabled: true,
      musicVolume: 0.22,
      sfxVolume: 0.18,
    };
  }
  try {
    const raw = window.localStorage.getItem(AUDIO_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedAudioPrefs>;
      return {
        musicEnabled: parsed.musicEnabled ?? true,
        sfxEnabled: parsed.sfxEnabled ?? true,
        musicVolume: clampVolume(Number(parsed.musicVolume), 0.22),
        sfxVolume: clampVolume(Number(parsed.sfxVolume), 0.18),
      };
    }
    const legacyMuted = window.localStorage.getItem(LEGACY_MUTED_KEY) === '1';
    return {
      musicEnabled: !legacyMuted,
      sfxEnabled: !legacyMuted,
      musicVolume: 0.22,
      sfxVolume: 0.18,
    };
  } catch {
    return {
      musicEnabled: true,
      sfxEnabled: true,
      musicVolume: 0.22,
      sfxVolume: 0.18,
    };
  }
}

function saveAudioPrefs(prefs: PersistedAudioPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(prefs));
    window.localStorage.setItem(
      LEGACY_MUTED_KEY,
      !prefs.musicEnabled && !prefs.sfxEnabled ? '1' : '0'
    );
  } catch {
    // ignore storage errors
  }
}

let prefs: PersistedAudioPrefs = loadAudioPrefs();
let activeMood: BgmMood = 'beranda';
let currentAudio: HTMLAudioElement | null = null;
let currentAudioMood: BgmMood | null = null;
let fadeTimerId: number | null = null;
let needsInteractionToStart = false;
let gestureListenerAttached = false;
let audioCtx: AudioContext | null = null;

const subscribers = new Set<(state: AudioStateSnapshot) => void>();

export function computeEffectiveMusicVolume(
  mood: BgmMood,
  baseVolume: number,
  enabled: boolean
): number {
  if (!enabled || baseVolume <= 0) return 0;
  // Soften background music automatically on the quiz page (~10% default vs 22% elsewhere)
  const multiplier = mood === 'kuis' ? 0.45 : 1;
  return Math.max(0, Math.min(1, Number((baseVolume * multiplier).toFixed(3))));
}

export function getAudioState(): AudioStateSnapshot {
  const effectiveMusicVolume = computeEffectiveMusicVolume(
    activeMood,
    prefs.musicVolume,
    prefs.musicEnabled
  );
  const isPlaying = Boolean(
    currentAudio && !currentAudio.paused && prefs.musicEnabled && effectiveMusicVolume > 0
  );
  return {
    musicEnabled: prefs.musicEnabled,
    sfxEnabled: prefs.sfxEnabled,
    musicVolume: prefs.musicVolume,
    sfxVolume: prefs.sfxVolume,
    activeMood,
    effectiveMusicVolume,
    isPlaying,
    needsInteractionToStart,
  };
}

function notifySubscribers(): void {
  const snapshot = getAudioState();
  for (const listener of subscribers) {
    listener(snapshot);
  }
}

export function subscribeAudioState(
  listener: (state: AudioStateSnapshot) => void
): () => void {
  subscribers.add(listener);
  listener(getAudioState());
  return () => {
    subscribers.delete(listener);
  };
}

function clearActiveFade(): void {
  if (fadeTimerId !== null && typeof window !== 'undefined') {
    window.clearInterval(fadeTimerId);
    fadeTimerId = null;
  }
}

function stopAndReleaseAudio(el: HTMLAudioElement | null): void {
  if (!el) return;
  try {
    el.pause();
    el.currentTime = 0;
  } catch {
    // ignore cleanup errors
  }
}

function rampAudioVolume(
  el: HTMLAudioElement,
  targetVolume: number,
  durationMs = 360,
  onDone?: () => void
): void {
  clearActiveFade();
  if (typeof window === 'undefined' || durationMs <= 0) {
    el.volume = Math.max(0, Math.min(1, targetVolume));
    onDone?.();
    return;
  }

  const startVol = el.volume;
  const clampedTarget = Math.max(0, Math.min(1, targetVolume));
  const steps = Math.max(4, Math.round(durationMs / 30));
  let step = 0;

  fadeTimerId = window.setInterval(() => {
    step += 1;
    const ratio = Math.min(1, step / steps);
    const nextVol = startVol + (clampedTarget - startVol) * ratio;
    el.volume = Math.max(0, Math.min(1, nextVol));

    if (ratio >= 1) {
      clearActiveFade();
      onDone?.();
    }
  }, 30);
}

function attachGestureUnlockListeners(): void {
  if (typeof window === 'undefined' || gestureListenerAttached) return;
  gestureListenerAttached = true;

  const unlockHandler = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      void audioCtx.resume().catch(() => {});
    }
    if (prefs.musicEnabled && (!currentAudio || currentAudio.paused)) {
      void syncBgmPlayback(false);
    }
  };

  window.addEventListener('pointerdown', unlockHandler, { passive: true });
  window.addEventListener('keydown', unlockHandler, { passive: true });
}

async function syncBgmPlayback(fromExplicitUserAction: boolean): Promise<void> {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  attachGestureUnlockListeners();

  const targetVolume = computeEffectiveMusicVolume(
    activeMood,
    prefs.musicVolume,
    prefs.musicEnabled
  );

  // Stop playback when music disabled or volume is 0
  if (!prefs.musicEnabled || targetVolume <= 0) {
    needsInteractionToStart = false;
    if (currentAudio && !currentAudio.paused) {
      const closing = currentAudio;
      currentAudio = null;
      currentAudioMood = null;
      rampAudioVolume(closing, 0, 220, () => {
        stopAndReleaseAudio(closing);
        notifySubscribers();
      });
    } else {
      stopAndReleaseAudio(currentAudio);
      currentAudio = null;
      currentAudioMood = null;
      notifySubscribers();
    }
    return;
  }

  // Same track already loaded: never restart from beginning, just smoothly adjust volume
  if (currentAudio && currentAudioMood === activeMood) {
    if (currentAudio.paused) {
      try {
        currentAudio.volume = 0.001;
        await currentAudio.play();
        needsInteractionToStart = false;
        rampAudioVolume(currentAudio, targetVolume, 360);
      } catch {
        if (!fromExplicitUserAction) {
          needsInteractionToStart = true;
        }
      }
    } else {
      needsInteractionToStart = false;
      rampAudioVolume(currentAudio, targetVolume, 280);
    }
    notifySubscribers();
    return;
  }

  // Switching to a different track: fade out & immediately replace single active element
  const previousAudio = currentAudio;
  clearActiveFade();
  if (previousAudio) {
    stopAndReleaseAudio(previousAudio);
    currentAudio = null;
    currentAudioMood = null;
  }

  const nextAudio = new Audio(BGM_TRACKS[activeMood]);
  nextAudio.loop = true;
  nextAudio.preload = 'auto';
  nextAudio.volume = 0.001;
  currentAudio = nextAudio;
  currentAudioMood = activeMood;

  try {
    await nextAudio.play();
    // Guard against rapid mood change while awaiting play()
    if (currentAudio !== nextAudio) {
      stopAndReleaseAudio(nextAudio);
      return;
    }
    needsInteractionToStart = false;
    rampAudioVolume(nextAudio, targetVolume, 420);
  } catch {
    needsInteractionToStart = true;
  }
  notifySubscribers();
}

export function setBgmMood(mood: BgmMood, fromExplicitUserAction = false): void {
  if (activeMood === mood && currentAudio && !currentAudio.paused) {
    return;
  }
  activeMood = mood;
  void syncBgmPlayback(fromExplicitUserAction);
}

export function getBgmMoodForRoute(pathname: string): BgmMood {
  if (pathname === '/' || pathname === '') return 'beranda';
  if (pathname.startsWith('/peta-kalbar') || pathname.startsWith('/profil')) return 'peta';
  if (pathname.startsWith('/briefing')) return 'briefing';
  if (pathname.startsWith('/simulasi')) return 'kuis';
  if (
    pathname.startsWith('/hasil') ||
    pathname.startsWith('/evaluasi-stem') ||
    pathname.startsWith('/sertifikat')
  ) {
    return activeMood === 'hasil-retry' ? 'hasil-retry' : 'hasil';
  }
  return 'beranda';
}

export function setMusicEnabled(enabled: boolean): void {
  prefs = { ...prefs, musicEnabled: enabled };
  saveAudioPrefs(prefs);
  void syncBgmPlayback(true);
  notifySubscribers();
}

export function setSfxEnabled(enabled: boolean): void {
  prefs = { ...prefs, sfxEnabled: enabled };
  saveAudioPrefs(prefs);
  notifySubscribers();
}

export function setMusicVolume(volume: number): void {
  const nextVol = clampVolume(volume, prefs.musicVolume);
  prefs = {
    ...prefs,
    musicVolume: nextVol,
    musicEnabled: nextVol > 0 ? prefs.musicEnabled : prefs.musicEnabled,
  };
  saveAudioPrefs(prefs);
  void syncBgmPlayback(true);
  notifySubscribers();
}

export function setSfxVolume(volume: number): void {
  prefs = { ...prefs, sfxVolume: clampVolume(volume, prefs.sfxVolume) };
  saveAudioPrefs(prefs);
  notifySubscribers();
}

export function unlockAndPlayMusic(): void {
  if (!prefs.musicEnabled) {
    prefs = { ...prefs, musicEnabled: true };
    saveAudioPrefs(prefs);
  }
  void syncBgmPlayback(true);
}

// Legacy compatibility helpers
export function isSoundMuted(): boolean {
  return !prefs.musicEnabled && !prefs.sfxEnabled;
}

export function setSoundMuted(muted: boolean): void {
  prefs = {
    ...prefs,
    musicEnabled: !muted,
    sfxEnabled: !muted,
  };
  saveAudioPrefs(prefs);
  void syncBgmPlayback(true);
  notifySubscribers();
}

// --- Lightweight Synthesized SFX (Respects sfxEnabled & sfxVolume) ---
function getSfxContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!prefs.sfxEnabled || prefs.sfxVolume <= 0) return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  relativeGain = 0.25,
  delaySec = 0
): void {
  try {
    const ctx = getSfxContext();
    if (!ctx) return;

    const scaledPeak = Math.max(0.002, Math.min(0.35, prefs.sfxVolume * relativeGain));
    const startTime = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(scaledPeak, startTime + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + durationSec + 0.02);
  } catch {
    // Ignore hardware or autoplay errors
  }
}

export function playButtonClickSfx(): void {
  playTone(620, 0.055, 'triangle', 0.16);
}

/**
 * Neutral tactile confirmation when picking an option during the quiz.
 * Intentionally carries NO right/wrong pitch cue.
 */
export function playOptionSelectSfx(): void {
  playTone(500, 0.075, 'triangle', 0.2);
}

export function playMissionStartSfx(): void {
  playTone(440, 0.09, 'triangle', 0.22, 0);
  playTone(554.37, 0.1, 'triangle', 0.22, 0.06);
  playTone(659.25, 0.16, 'sine', 0.24, 0.12);
}

export function playNextQuestionSfx(): void {
  playTone(587.33, 0.075, 'sine', 0.2, 0);
  playTone(739.99, 0.1, 'sine', 0.2, 0.05);
}

export function playQuizCompleteSfx(): void {
  playTone(523.25, 0.09, 'sine', 0.22, 0);
  playTone(659.25, 0.12, 'sine', 0.22, 0.07);
}

export function playMissionSuccessSfx(): void {
  playTone(523.25, 0.12, 'triangle', 0.26, 0);
  playTone(659.25, 0.12, 'triangle', 0.26, 0.09);
  playTone(783.99, 0.16, 'triangle', 0.28, 0.18);
  playTone(1046.5, 0.28, 'sine', 0.28, 0.28);
}

export function playAllRegionsCompleteSfx(): void {
  playTone(523.25, 0.11, 'triangle', 0.26, 0);
  playTone(659.25, 0.11, 'triangle', 0.26, 0.09);
  playTone(783.99, 0.12, 'triangle', 0.26, 0.18);
  playTone(1046.5, 0.18, 'triangle', 0.3, 0.27);
  playTone(1318.5, 0.32, 'sine', 0.3, 0.38);
}

export function playMissionRetrySfx(): void {
  playTone(440, 0.14, 'sine', 0.22, 0);
  playTone(392, 0.22, 'sine', 0.2, 0.12);
}
