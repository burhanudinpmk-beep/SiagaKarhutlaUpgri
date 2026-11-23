import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  Loader2,
  MapPin,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type { RegionProfile } from '../../types/mission';
import {
  loadActiveHotspotByMissionId,
  markBriefingSeen,
  resolveMissionBriefing,
} from '../../utils/briefingHelpers';
import {
  submitChallengeResultToScoringEngine,
  type ChallengeScoringPayload,
  type ChallengeScoringReceipt,
} from '../../utils/scoringEngine';
import {
  playAllRegionsCompleteSfx,
  playButtonClickSfx,
  playMissionRetrySfx,
  playMissionStartSfx,
  playMissionSuccessSfx,
  playNextQuestionSfx,
  playOptionSelectSfx,
  playQuizCompleteSfx,
  setBgmMood,
} from '../../utils/soundEffects';
import {
  CERTIFICATE_REQUIRED_MISSIONS,
  useGameProgress,
} from '../../context/GameProgressContext';
import { FireStatusIllustration } from './FireStatusIllustration';

type StemCode = 'S' | 'T' | 'E' | 'M';
type DifficultyCode = 'mudah' | 'sedang' | 'sulit';

interface PublicOption {
  id: string;
  text: string;
}

interface PublicQuestion {
  id: string;
  orderIndex: number;
  subject?: 'Matematika' | 'Fisika';
  topicTitle?: string;
  hotspotTitle?: string;
  stemCategory: StemCode;
  stemLabel: string;
  difficulty: DifficultyCode;
  weight: number;
  prompt: string;
  options: PublicOption[];
}

interface SessionStartResponse {
  sessionId: string;
  regionId: string;
  regionName: string;
  missionId: string;
  riskLevel: 'bahaya' | 'waspada' | 'cukup-aman' | 'aman';
  questionCount: 5 | 6 | 7;
  targetSeconds: number;
  startedAtIso: string;
  questions: PublicQuestion[];
}

interface RevealedFeedback {
  questionId: string;
  subject?: 'Matematika' | 'Fisika';
  topicTitle?: string;
  hotspotTitle?: string;
  selectedOptionId: string;
  isCorrect: boolean;
  correctOptionId: string;
  acuan?: string[];
  explanation: string;
  stemChoInsight?: string;
  earnedWeight: number;
  maxWeight: number;
  stemCategory: StemCode;
  difficulty: DifficultyCode;
}

interface BatchSubmitResponse {
  sessionId: string;
  feedbackList: RevealedFeedback[];
  answeredCount: number;
  totalQuestions: 5 | 6 | 7;
  isCompleted: boolean;
  elapsedSeconds: number;
  summary: ChallengeScoringPayload | null;
}

interface SubmittedQuizState {
  feedbackList: RevealedFeedback[];
  summary: ChallengeScoringPayload;
  scoringReceipt: ChallengeScoringReceipt;
}

interface PersistedQuizDraft {
  session: SessionStartResponse;
  currentIndex: number;
  selectedAnswers: Record<string, string>;
  retryingQuestionIds?: string[] | null;
  lastPreviousAnswers?: Record<string, string>;
  submittedResult: SubmittedQuizState | null;
}

interface ChallengeQuizPanelProps {
  region: RegionProfile;
  missionId?: string;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const QUIZ_DRAFT_PREFIX = 'siaga_karhutla_active_quiz_v2::';
const USED_QUESTIONS_STORAGE_KEY = 'siaga_karhutla_used_questions_v2';

function buildDraftKey(regionId: string, missionId: string): string {
  return `${QUIZ_DRAFT_PREFIX}${regionId.trim().toLowerCase()}::${missionId.trim().toLowerCase()}`;
}

function loadUsedQuestionMap(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(USED_QUESTIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    const cleaned: Record<string, string[]> = {};
    for (const [mId, list] of Object.entries(parsed)) {
      if (Array.isArray(list)) {
        cleaned[mId] = list.filter((item): item is string => typeof item === 'string');
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

function collectExcludeQuestionIds(currentMissionId: string): string[] {
  const normalizedCurrent = currentMissionId.trim().toLowerCase();
  const map = loadUsedQuestionMap();
  const excluded = new Set<string>();
  for (const [mId, ids] of Object.entries(map)) {
    if (mId.toLowerCase() === normalizedCurrent) continue;
    for (const qId of ids) {
      excluded.add(qId);
    }
  }
  return Array.from(excluded);
}

function recordUsedQuestionIds(currentMissionId: string, questionIds: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const map = loadUsedQuestionMap();
    map[currentMissionId.trim().toLowerCase()] = questionIds;
    window.localStorage.setItem(USED_QUESTIONS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

function loadQuizDraft(
  key: string,
  expectedQuestionCount: 5 | 6 | 7
): PersistedQuizDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedQuizDraft;
    if (
      parsed &&
      parsed.session &&
      Array.isArray(parsed.session.questions) &&
      [5, 6, 7].includes(parsed.session.questions.length) &&
      parsed.session.questions.length === parsed.session.questionCount
    ) {
      if (!parsed.submittedResult && parsed.session.questionCount !== expectedQuestionCount) {
        return null;
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveQuizDraft(key: string, draft: PersistedQuizDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Ignore storage quota errors
  }
}

function clearQuizDraft(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

export function ChallengeQuizPanel({
  region,
  missionId,
}: ChallengeQuizPanelProps) {
  const navigate = useNavigate();
  const { playerProgress, recordChallengeCompletion } = useGameProgress();

  const activeHotspot = useMemo(
    () => loadActiveHotspotByMissionId(missionId),
    [missionId]
  );

  const briefing = useMemo(
    () => resolveMissionBriefing(region.id, missionId, activeHotspot),
    [region.id, missionId, activeHotspot]
  );

  const effectiveMissionId = briefing?.missionId ?? `sim-${region.id}`;
  const effectiveRiskLevel = activeHotspot?.riskLevel ?? briefing?.riskLevel ?? region.status;
  const rawQuestionCount =
    activeHotspot?.challengeCount ??
    briefing?.challengeCount ??
    (effectiveRiskLevel === 'bahaya' ? 7 : effectiveRiskLevel === 'waspada' ? 6 : 5);
  const targetQuestionCount: 5 | 6 | 7 =
    rawQuestionCount === 7 ? 7 : rawQuestionCount === 6 ? 6 : 5;
  const hotspotLabel = activeHotspot
    ? `${activeHotspot.regionName} · ${activeHotspot.scenarioTitle}`
    : region.name;
  const draftKey = useMemo(
    () => buildDraftKey(region.id, effectiveMissionId),
    [region.id, effectiveMissionId]
  );

  const [session, setSession] = useState<SessionStartResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [retryingQuestionIds, setRetryingQuestionIds] = useState<string[] | null>(null);
  const [lastPreviousAnswers, setLastPreviousAnswers] = useState<Record<string, string>>({});
  const [submittedResult, setSubmittedResult] = useState<SubmittedQuizState | null>(null);

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startFreshSession = useCallback(async (fromRetryButton = false) => {
    setIsLoadingSession(true);
    setErrorMessage(null);
    clearQuizDraft(draftKey);
    setSubmittedResult(null);
    setRetryingQuestionIds(null);
    setLastPreviousAnswers({});
    setSelectedAnswers({});
    setCurrentIndex(0);
    if (fromRetryButton) {
      setBgmMood('kuis', true);
      playMissionStartSfx();
    }

    try {
      const excludeQuestionIds = collectExcludeQuestionIds(effectiveMissionId);
      const response = await fetch('/api/challenges/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionId: region.id,
          missionId: effectiveMissionId,
          riskLevel: effectiveRiskLevel,
          questionCount: targetQuestionCount,
          excludeQuestionIds,
        }),
      });
      const data = (await response.json()) as SessionStartResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyiapkan kuis titik api.');
      }
      recordUsedQuestionIds(
        effectiveMissionId,
        data.questions.map((q) => q.id)
      );
      setSession(data);
      saveQuizDraft(draftKey, {
        session: data,
        currentIndex: 0,
        selectedAnswers: {},
        retryingQuestionIds: null,
        lastPreviousAnswers: {},
        submittedResult: null,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memulai kuis.'
      );
    } finally {
      setIsLoadingSession(false);
    }
  }, [draftKey, effectiveMissionId, effectiveRiskLevel, region.id, targetQuestionCount]);

  // Restore saved draft or auto-start a fresh session
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const existingDraft = loadQuizDraft(draftKey, targetQuestionCount);
      if (existingDraft) {
        recordUsedQuestionIds(
          effectiveMissionId,
          existingDraft.session.questions.map((q) => q.id)
        );
        if (existingDraft.submittedResult) {
          if (!cancelled) {
            setSession(existingDraft.session);
            setCurrentIndex(existingDraft.currentIndex);
            setSelectedAnswers(existingDraft.selectedAnswers ?? {});
            setRetryingQuestionIds(existingDraft.retryingQuestionIds ?? null);
            setLastPreviousAnswers(existingDraft.lastPreviousAnswers ?? {});
            setSubmittedResult(existingDraft.submittedResult);
            setIsLoadingSession(false);
          }
          return;
        }

        // If user was in wrong-only retry mode, restore locally without needing active server session
        if (
          existingDraft.retryingQuestionIds &&
          existingDraft.retryingQuestionIds.length > 0 &&
          !cancelled
        ) {
          setSession(existingDraft.session);
          setRetryingQuestionIds(existingDraft.retryingQuestionIds);
          setLastPreviousAnswers(existingDraft.lastPreviousAnswers ?? {});
          setSelectedAnswers(existingDraft.selectedAnswers ?? {});
          setCurrentIndex(
            Math.min(
              existingDraft.retryingQuestionIds.length - 1,
              Math.max(0, existingDraft.currentIndex ?? 0)
            )
          );
          setSubmittedResult(null);
          setIsLoadingSession(false);
          return;
        }

        try {
          const check = await fetch(
            `/api/challenges/session/${encodeURIComponent(existingDraft.session.sessionId)}`
          );
          if (check.ok && !cancelled) {
            setSession(existingDraft.session);
            setRetryingQuestionIds(null);
            setLastPreviousAnswers({});
            setCurrentIndex(
              Math.min(
                existingDraft.session.questions.length - 1,
                Math.max(0, existingDraft.currentIndex ?? 0)
              )
            );
            setSelectedAnswers(existingDraft.selectedAnswers ?? {});
            setSubmittedResult(null);
            setIsLoadingSession(false);
            return;
          }
        } catch {
          // Fall through to start a fresh session if backend restarted
        }
      }

      if (!cancelled) {
        await startFreshSession();
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [draftKey, effectiveMissionId, startFreshSession, targetQuestionCount]);

  useEffect(() => {
    if (!session) return;
    saveQuizDraft(draftKey, {
      session,
      currentIndex,
      selectedAnswers,
      retryingQuestionIds,
      lastPreviousAnswers,
      submittedResult,
    });
  }, [
    currentIndex,
    draftKey,
    lastPreviousAnswers,
    retryingQuestionIds,
    selectedAnswers,
    session,
    submittedResult,
  ]);

  const activeQuestions = useMemo(() => {
    if (!session) return [];
    if (!retryingQuestionIds || retryingQuestionIds.length === 0) {
      return session.questions;
    }
    const idSet = new Set(retryingQuestionIds);
    return session.questions.filter((q) => idSet.has(q.id));
  }, [session, retryingQuestionIds]);

  const safeIndex = Math.min(
    Math.max(0, currentIndex),
    Math.max(0, activeQuestions.length - 1)
  );
  const currentQuestion = activeQuestions[safeIndex] ?? null;
  const currentSelectedOptionId = currentQuestion
    ? selectedAnswers[currentQuestion.id] ?? null
    : null;
  const isLastQuestion =
    activeQuestions.length > 0 && safeIndex === activeQuestions.length - 1;
  const isRetryWrongMode = Boolean(
    retryingQuestionIds && retryingQuestionIds.length > 0
  );

  const finalizeBatchOutcome = useCallback(
    (currentSession: SessionStartResponse, data: BatchSubmitResponse) => {
      if (!data.summary) return;
      const receipt = submitChallengeResultToScoringEngine(data.summary);

      const answersSummary = data.feedbackList.map((fb) => {
        const matchedQuestion = currentSession.questions.find(
          (q) => q.id === fb.questionId
        );
        const selectedOpt = matchedQuestion?.options.find(
          (o) => o.id === fb.selectedOptionId
        );
        const correctOpt = matchedQuestion?.options.find(
          (o) => o.id === fb.correctOptionId
        );
        return {
          questionId: fb.questionId,
          questionPrompt: matchedQuestion?.prompt,
          selectedOptionId: fb.selectedOptionId,
          selectedOptionText: selectedOpt?.text,
          correctOptionId: fb.correctOptionId,
          correctOptionText: correctOpt?.text,
          explanation: fb.explanation,
          isCorrect: fb.isCorrect,
          stemCategory: fb.stemCategory,
          difficulty: fb.difficulty,
          earnedWeight: fb.earnedWeight,
          maxWeight: fb.maxWeight,
        };
      });

      void recordChallengeCompletion({
        challengeRecord: receipt.challengeRecord,
        answersSummary,
      });

      const scorePct = Math.round(
        (data.summary.correctCount / Math.max(1, data.summary.questionCount)) * 100
      );
      playQuizCompleteSfx();

      const requiredIds = new Set(
        CERTIFICATE_REQUIRED_MISSIONS.map((m) => m.missionId)
      );
      const completedRequiredSet = new Set(
        playerProgress.completedMissionIds
          .map((id) => id.toLowerCase())
          .filter((id) => requiredIds.has(id))
      );
      if (scorePct >= 70) {
        if (requiredIds.has(effectiveMissionId.toLowerCase())) {
          completedRequiredSet.add(effectiveMissionId.toLowerCase());
        }
        setBgmMood('hasil', true);
        if (completedRequiredSet.size >= CERTIFICATE_REQUIRED_MISSIONS.length) {
          playAllRegionsCompleteSfx();
        } else {
          playMissionSuccessSfx();
        }
      } else {
        setBgmMood('hasil-retry', true);
        playMissionRetrySfx();
      }

      if (data.sessionId && data.sessionId !== currentSession.sessionId) {
        setSession({ ...currentSession, sessionId: data.sessionId });
      }
      setRetryingQuestionIds(null);
      setSubmittedResult({
        feedbackList: data.feedbackList,
        summary: data.summary,
        scoringReceipt: receipt,
      });
    },
    [effectiveMissionId, playerProgress.completedMissionIds, recordChallengeCompletion]
  );

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion || isSubmitting || submittedResult) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
    playOptionSelectSfx();
  };

  const handleSubmitAnswers = async () => {
    if (!session) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isRetryWrongMode && retryingQuestionIds) {
        const retryAnswers = activeQuestions.map((q) => ({
          questionId: q.id,
          selectedOptionId: selectedAnswers[q.id] ?? q.options[0]?.id ?? '',
        }));

        let response = await fetch(
          `/api/challenges/session/${encodeURIComponent(session.sessionId)}/retry-wrong`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: retryAnswers }),
          }
        );

        // Recover gracefully if server restarted and cleared in-memory sessions
        if (response.status === 404) {
          const previousAnswers = session.questions.map((q) => ({
            questionId: q.id,
            selectedOptionId:
              lastPreviousAnswers[q.id] ??
              selectedAnswers[q.id] ??
              q.options[0]?.id ??
              '',
          }));
          response = await fetch('/api/challenges/session/retry-recover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              regionId: region.id,
              missionId: effectiveMissionId,
              riskLevel: effectiveRiskLevel,
              questionIds: session.questions.map((q) => q.id),
              previousAnswers,
              retryAnswers,
            }),
          });
        }

        const data = (await response.json()) as BatchSubmitResponse & { error?: string };
        if (!response.ok || !data.summary) {
          throw new Error(data.error || 'Gagal memeriksa perbaikan jawaban kuis.');
        }

        finalizeBatchOutcome(session, data);
        return;
      }

      const answersPayload = session.questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: selectedAnswers[q.id] ?? q.options[0]?.id ?? '',
      }));

      const response = await fetch(
        `/api/challenges/session/${encodeURIComponent(session.sessionId)}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: answersPayload }),
        }
      );

      const data = (await response.json()) as BatchSubmitResponse & { error?: string };
      if (!response.ok || !data.summary) {
        throw new Error(data.error || 'Gagal memeriksa hasil kuis.');
      }

      finalizeBatchOutcome(session, data);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat mengirim kuis.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartRetryWrongQuestions = () => {
    if (!session || !submittedResult) return;
    const wrongIds = submittedResult.feedbackList
      .filter((fb) => !fb.isCorrect)
      .map((fb) => fb.questionId);
    if (wrongIds.length === 0) return;

    const prevMap: Record<string, string> = {};
    for (const fb of submittedResult.feedbackList) {
      prevMap[fb.questionId] = fb.selectedOptionId;
    }

    const nextSelected = { ...prevMap, ...selectedAnswers };
    for (const wrongId of wrongIds) {
      delete nextSelected[wrongId];
    }

    setLastPreviousAnswers(prevMap);
    setSelectedAnswers(nextSelected);
    setRetryingQuestionIds(wrongIds);
    setSubmittedResult(null);
    setCurrentIndex(0);
    setErrorMessage(null);
    setBgmMood('kuis', true);
    playMissionStartSfx();
  };

  const handleContinue = () => {
    if (!session || !currentSelectedOptionId || isSubmitting) return;
    if (!isLastQuestion) {
      playNextQuestionSfx();
      setCurrentIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1));
      return;
    }
    void handleSubmitAnswers();
  };

  const handlePrevious = () => {
    if (safeIndex > 0 && !isSubmitting) {
      playButtonClickSfx();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleBackToMap = () => {
    playButtonClickSfx();
    markBriefingSeen();
    navigate('/peta-kalbar');
  };

  if (isLoadingSession) {
    return (
      <section
        aria-label="Memuat Kuis Titik Api"
        data-testid="challenge-quiz-panel"
        className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white p-8 shadow-sm"
      >
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#EA580C]" aria-hidden="true" />
          <p className="font-display text-base font-extrabold text-[#0F172A]">
            Menyiapkan {targetQuestionCount} Soal Kuis Titik Api...
          </p>
          <p className="text-xs text-[#475569]">{hotspotLabel}</p>
        </div>
      </section>
    );
  }

  if (errorMessage && !session) {
    return (
      <section
        aria-label="Kesalahan Memuat Kuis"
        data-testid="challenge-quiz-panel"
        className="rounded-2xl border border-[#FECACA] bg-white p-8 shadow-sm"
      >
        <p className="text-sm font-bold text-[#B91C1C]">{errorMessage}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void startFreshSession()}
            className="game-btn-fire inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Muat Ulang Kuis</span>
          </button>
          <button
            type="button"
            onClick={handleBackToMap}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Kembali ke Peta</span>
          </button>
        </div>
      </section>
    );
  }

  // Post-Quiz Results & Complete Explanations View
  if (session && submittedResult) {
    const { summary, feedbackList } = submittedResult;
    const scorePct = Math.round(
      (summary.correctCount / Math.max(1, summary.questionCount)) * 100
    );
    const wrongCount = Math.max(0, summary.questionCount - summary.correctCount);
    const minCorrectRequired = Math.ceil(summary.questionCount * 0.7);
    const passed = scorePct >= 70;
    const perfect = wrongCount === 0;

    const requiredIds = new Set(
      CERTIFICATE_REQUIRED_MISSIONS.map((m) => m.missionId)
    );
    const completedRequiredSet = new Set(
      playerProgress.completedMissionIds
        .map((id) => id.toLowerCase())
        .filter((id) => requiredIds.has(id))
    );
    if (passed && requiredIds.has(effectiveMissionId.toLowerCase())) {
      completedRequiredSet.add(effectiveMissionId.toLowerCase());
    }
    const allMissionsComplete =
      completedRequiredSet.size >= CERTIFICATE_REQUIRED_MISSIONS.length;

    return (
      <section
        aria-label="Hasil Kuis dan Pembahasan Lengkap"
        data-testid="challenge-completion-summary"
        className="quiz-result-enter space-y-6"
      >
        <div
          className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
            passed ? 'border-[#A7F3D0]' : 'border-[#FECACA]'
          }`}
        >
          <div
            className={`border-b px-6 py-6 sm:px-8 ${
              passed
                ? 'border-[#A7F3D0] bg-[#ECFDF5]'
                : 'border-[#FECACA] bg-[#FEF2F2]'
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <FireStatusIllustration
                  mode={passed ? 'extinguished' : 'burning'}
                />
                <div>
                  <p className="text-xs font-semibold text-[#475569]">
                    {hotspotLabel}
                  </p>
                  <h1
                    data-testid="quiz-status-heading"
                    className={`mt-1 font-display text-2xl font-extrabold sm:text-3xl ${
                      passed ? 'text-[#047857]' : 'text-[#B91C1C]'
                    }`}
                  >
                    {perfect
                      ? 'Wilayah Aman · Semua Jawaban Benar!'
                      : passed
                        ? 'Wilayah Aman (≥70%) · Masih Bisa Disempurnakan'
                        : 'Status Belum Aman · Perlu Perbaikan'}
                  </h1>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#475569]">
                    {perfect
                      ? 'Seluruh soal berhasil dijawab dengan benar (100%). Status titik api pada peta kini Aman (Hijau).'
                      : passed
                        ? `Target minimal 70% (${minCorrectRequired}/${summary.questionCount} soal) telah tercapai sehingga status titik api berubah menjadi Aman. Anda masih dapat mengulang ${wrongCount} soal yang salah agar benar semua (100%).`
                        : `Target untuk mengubah status titik api menjadi Aman adalah minimal 70% (${minCorrectRequired} dari ${summary.questionCount} soal benar). Ulangi ${wrongCount} soal yang salah untuk memperbaiki skor Anda.`}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-left sm:text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Skor Akhir
                </span>
                <p
                  data-testid="quiz-final-score"
                  className={`font-mono text-4xl font-extrabold tabular-nums ${
                    passed ? 'text-[#047857]' : 'text-[#DC2626]'
                  }`}
                >
                  {scorePct}%
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
                <dt className="text-[11px] font-semibold text-[#475569]">Skor Akhir</dt>
                <dd className="mt-1 font-mono text-xl font-extrabold text-[#0F172A] tabular-nums">
                  {scorePct}%
                </dd>
              </div>
              <div className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-3.5">
                <dt className="text-[11px] font-semibold text-[#047857]">Jawaban Benar</dt>
                <dd
                  data-testid="quiz-correct-count"
                  className="mt-1 font-mono text-xl font-extrabold text-[#047857] tabular-nums"
                >
                  {summary.correctCount}
                </dd>
              </div>
              <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3.5">
                <dt className="text-[11px] font-semibold text-[#B91C1C]">Jawaban Salah</dt>
                <dd
                  data-testid="quiz-wrong-count"
                  className="mt-1 font-mono text-xl font-extrabold text-[#B91C1C] tabular-nums"
                >
                  {wrongCount}
                </dd>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
                <dt className="text-[11px] font-semibold text-[#475569]">Status Wilayah</dt>
                <dd
                  className={`mt-1 text-sm font-extrabold ${
                    passed ? 'text-[#047857]' : 'text-[#C2410C]'
                  }`}
                >
                  {passed ? 'Aman (≥70%)' : `Perlu ≥70% (${minCorrectRequired}/${summary.questionCount})`}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {wrongCount > 0 && (
                <button
                  type="button"
                  data-testid="quiz-retry-wrong-btn"
                  onClick={handleStartRetryWrongQuestions}
                  className="game-btn-fire inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA580C]"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Ulangi Soal yang Salah ({wrongCount} Soal)</span>
                </button>
              )}

              <button
                type="button"
                data-testid="quiz-back-to-map-btn"
                onClick={handleBackToMap}
                className={`${wrongCount === 0 ? 'game-btn-fire' : 'game-btn-forest'} inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA580C]`}
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <span>KEMBALI KE PETA</span>
              </button>

              <button
                type="button"
                data-testid="quiz-retry-btn"
                onClick={() => void startFreshSession(true)}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-xs font-bold text-[#1E293B] transition-colors hover:bg-[#F1F5F9]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Coba Sesi Acak Baru</span>
              </button>

              {allMissionsComplete && (
                <>
                  <Link
                    to="/evaluasi-stem"
                    data-testid="quiz-final-result-btn"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#059669] bg-[#ECFDF5] px-5 py-2.5 text-sm font-extrabold text-[#047857] transition-colors hover:bg-[#059669] hover:text-white"
                  >
                    <Award className="h-4 w-4" aria-hidden="true" />
                    <span>Hasil Akhir Misi</span>
                  </Link>
                  <Link
                    to="/sertifikat"
                    data-testid="quiz-open-certificate-btn"
                    className="game-btn-fire inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold"
                  >
                    <Award className="h-4 w-4" aria-hidden="true" />
                    <span>Buka Sertifikat</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <section
          aria-label="Penjelasan Lengkap Soal dan Jawaban"
          data-testid="quiz-explanations-section"
          className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="border-b border-[#E2E8F0] pb-4">
            <h2 className="font-display text-lg font-extrabold text-[#0F172A]">
              Penjelasan Lengkap Soal &amp; Jawaban ({summary.questionCount} Soal)
            </h2>
            <p className="mt-1 text-xs text-[#475569]">
              Berikut kunci jawaban, acuan kategori risiko karhutla, pembahasan langkah demi
              langkah, serta kaitan unsur pembakaran Karbon (C), Hidrogen (H), dan Oksigen (O).
            </p>
          </div>

          <div className="mt-5 space-y-5">
            {session.questions.map((question, idx) => {
              const fb = feedbackList.find((item) => item.questionId === question.id);
              if (!fb) return null;
              const selectedOpt = question.options.find(
                (o) => o.id === fb.selectedOptionId
              );
              const correctOpt = question.options.find(
                (o) => o.id === fb.correctOptionId
              );
              const subject = fb.subject ?? question.subject;
              const topicTitle = fb.topicTitle ?? question.topicTitle;

              return (
                <article
                  key={question.id}
                  data-testid={`quiz-review-item-${idx}`}
                  className={`rounded-2xl border p-5 ${
                    fb.isCorrect
                      ? 'border-[#CBD5E1] bg-[#F8FAFC]'
                      : 'border-[#FECACA] bg-[#FEF2F2]/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#334155]">
                        Soal {idx + 1}/{session.questionCount}
                      </span>
                      {subject && (
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                            subject === 'Matematika'
                              ? 'border-[#BAE6FD] bg-[#F0F9FF] text-[#0369A1]'
                              : 'border-[#FDBA74] bg-[#FFF7ED] text-[#C2410C]'
                          }`}
                        >
                          {subject}
                        </span>
                      )}
                      {topicTitle && (
                        <span className="text-[11px] font-semibold text-[#64748B]">
                          · {topicTitle}
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-extrabold ${
                        fb.isCorrect
                          ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]'
                          : 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
                      }`}
                    >
                      {fb.isCorrect ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          <span>Benar</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          <span>Salah</span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="mt-3 font-display text-sm font-bold leading-snug text-[#0F172A] sm:text-base">
                    {question.prompt}
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-[#E2E8F0] bg-white p-3.5 text-xs sm:grid-cols-2">
                    <div>
                      <span className="font-bold text-[#475569]">Jawaban Anda:</span>
                      <p
                        className={`mt-0.5 font-semibold ${
                          fb.isCorrect ? 'text-[#047857]' : 'text-[#B91C1C]'
                        }`}
                      >
                        {selectedOpt?.text ?? fb.selectedOptionId}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-[#047857]">Jawaban Benar:</span>
                      <p className="mt-0.5 font-bold text-[#047857]">
                        {correctOpt?.text ?? fb.correctOptionId}
                      </p>
                    </div>
                  </div>

                  {fb.acuan && fb.acuan.length > 0 && (
                    <div
                      data-testid={`quiz-acuan-${idx}`}
                      className="mt-3 rounded-xl border border-[#E2E8F0] bg-white p-3.5 text-xs text-[#334155]"
                    >
                      <p className="font-bold text-[#0F172A]">Acuan Ketentuan Risiko:</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {fb.acuan.map((line, lineIdx) => (
                          <li key={lineIdx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div
                    data-testid={`quiz-explanation-${idx}`}
                    className="mt-3 rounded-xl border border-[#E2E8F0] bg-white p-3.5 text-xs leading-relaxed text-[#334155]"
                  >
                    <p className="font-bold text-[#0F172A]">Pembahasan:</p>
                    <p className="mt-1">{fb.explanation}</p>
                  </div>

                  {fb.stemChoInsight && (
                    <div
                      data-testid={`quiz-cho-insight-${idx}`}
                      className="mt-3 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-3.5 text-xs leading-relaxed text-[#0F172A]"
                    >
                      <p className="inline-flex items-center gap-1.5 font-bold text-[#0369A1]">
                        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Kaitan Unsur C, H, dan O</span>
                      </p>
                      <p className="mt-1">{fb.stemChoInsight}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </section>
    );
  }

  // Active Interactive Quiz View (Normal or Wrong-Only Retry Mode)
  if (!session || !currentQuestion) {
    return null;
  }

  const totalActive = activeQuestions.length;
  const progressRatio = (safeIndex + 1) / Math.max(1, totalActive);
  const remainingQuestions = Math.max(0, totalActive - (safeIndex + 1));
  const minCorrectRequired = Math.ceil(session.questionCount * 0.7);

  return (
    <section
      aria-label="Kuis Titik Api SIAGA KARHUTLA"
      data-testid="challenge-quiz-panel"
      className="w-full overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white shadow-sm"
    >
      {/* Clean Dark Slate Mission Header */}
      <div className="border-b border-[#1E293B] bg-[#0F172A] px-5 py-5 text-[#F8FAFC] sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <FireStatusIllustration mode="active" />
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                <Flame className="h-3.5 w-3.5 text-[#EA580C]" aria-hidden="true" />
                <span>
                  {isRetryWrongMode
                    ? 'Mode Perbaikan · Ulangi Soal yang Salah'
                    : 'Misi Penanganan Titik Api'}
                </span>
              </p>
              <h1 className="mt-0.5 font-display text-lg font-extrabold text-white sm:text-xl lg:text-2xl">
                {hotspotLabel}
              </h1>
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[#CBD5E1]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
                <span>
                  Target Status Aman: Minimal 70% ({minCorrectRequired} dari{' '}
                  {session.questionCount} soal benar)
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              data-testid="quiz-remaining-counter"
              className="rounded-xl border border-[#334155] bg-[#1E293B] px-3 py-2 text-xs font-semibold text-[#CBD5E1] tabular-nums"
            >
              {remainingQuestions === 0
                ? 'Soal Terakhir'
                : `Tersisa ${remainingQuestions} soal`}
            </span>
            <div
              data-testid="quiz-question-counter"
              className="rounded-xl border border-[#EA580C]/60 bg-[#1E293B] px-4 py-2 font-mono text-sm font-extrabold text-[#F59E0B] tabular-nums"
            >
              {safeIndex + 1}/{totalActive}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={safeIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalActive}
          aria-label={`Progres soal ${safeIndex + 1} dari ${totalActive}`}
          className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#1E293B]"
        >
          <div
            className="h-full w-full origin-left rounded-full bg-gradient-to-r from-[#EA580C] to-[#F59E0B] transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${progressRatio})` }}
          />
        </div>
      </div>

      <div className="p-5 sm:p-8 lg:px-10 lg:py-8">
        {isRetryWrongMode && (
          <div className="mb-4 rounded-xl border border-[#FDBA74] bg-[#FFF7ED] px-4 py-3 text-xs font-semibold text-[#9A3412]">
            Anda sedang memperbaiki <strong>{totalActive} soal</strong> yang sebelumnya masih
            salah. Jawaban soal yang sudah benar sebelumnya tetap tersimpan.
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-xs font-semibold text-[#B91C1C]"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => void startFreshSession(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DC2626] bg-white px-3 py-1 font-bold text-[#B91C1C] hover:bg-[#FEF2F2]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Mulai Sesi Baru</span>
            </button>
          </div>
        )}

        <div key={currentQuestion.id} className="quiz-question-enter">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {currentQuestion.subject && (
              <span
                className={`rounded-md border px-2.5 py-1 text-xs font-extrabold ${
                  currentQuestion.subject === 'Matematika'
                    ? 'border-[#BAE6FD] bg-[#F0F9FF] text-[#0369A1]'
                    : 'border-[#FDBA74] bg-[#FFF7ED] text-[#C2410C]'
                }`}
              >
                {currentQuestion.subject}
              </span>
            )}
            {currentQuestion.topicTitle && (
              <span className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#475569]">
                {currentQuestion.topicTitle}
              </span>
            )}
          </div>

          <h2
            data-testid="challenge-question-prompt"
            className="font-display text-xl font-extrabold leading-snug text-[#0F172A] sm:text-2xl lg:text-[1.5rem]"
          >
            {currentQuestion.prompt}
          </h2>

          <div
            className="mt-6 space-y-3.5"
            role="radiogroup"
            aria-label={`Pilihan jawaban soal ${safeIndex + 1}`}
          >
            {currentQuestion.options.map((option, idx) => {
              const isSelected = currentSelectedOptionId === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isSubmitting}
                  data-testid={`challenge-option-${idx}`}
                  onClick={() => handleSelectOption(option.id)}
                  className={`flex min-h-[64px] h-auto w-full items-center gap-4 rounded-xl border-2 px-4 py-4 text-left transition-all duration-150 active:translate-y-[1px] sm:px-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA580C] ${
                    isSelected
                      ? 'border-[#EA580C] bg-[#FFF7ED] shadow-[0_3px_0_#EA580C]'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] shadow-[0_2px_0_#CBD5E1] hover:border-[#0F172A] hover:bg-white'
                  }`}
                >
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-extrabold transition-colors ${
                      isSelected
                        ? 'bg-[#EA580C] text-white'
                        : 'bg-[#1E293B] text-white'
                    }`}
                  >
                    {OPTION_LETTERS[idx] ?? idx + 1}
                  </span>
                  <span className="flex-1 text-sm font-semibold leading-relaxed text-[#0F172A] sm:text-base">
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-[#E2E8F0] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {safeIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F1F5F9] disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Sebelumnya</span>
              </button>
            ) : (
              <Link
                to="/peta-kalbar"
                onClick={() => playButtonClickSfx()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F1F5F9]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Peta Kalbar</span>
              </Link>
            )}

            {!currentSelectedOptionId && (
              <p
                data-testid="quiz-selection-hint"
                className="text-xs font-semibold text-[#64748B]"
              >
                Pilih salah satu jawaban (A–D) terlebih dahulu untuk melanjutkan.
              </p>
            )}
          </div>

          <button
            type="button"
            data-testid="quiz-continue-btn"
            onClick={handleContinue}
            disabled={!currentSelectedOptionId || isSubmitting}
            className="game-btn-fire inline-flex min-h-[48px] min-w-[190px] items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-extrabold tracking-wide disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA580C]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Memeriksa...</span>
              </>
            ) : (
              <>
                <span>{isLastQuestion ? 'SELESAI & CEK HASIL' : 'LANJUTKAN'}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
