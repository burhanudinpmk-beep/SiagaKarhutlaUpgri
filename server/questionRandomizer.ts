import type {
  BankQuestion,
  ChallengeOption,
  DifficultyLevel,
  QuizSubject,
  StemCategory,
  StemCategoryLabel,
} from './challengeBank.ts';

/**
 * Modul pengacakan soal & opsi jawaban.
 * Terpisah secara ketat dari logika penilaian (scoringEngine / challengeService).
 * Tidak menyimpan atau menghitung skor, bobot capaian, maupun waktu penyelesaian.
 */

export interface PublicChallengeQuestion {
  id: string;
  orderIndex: number;
  subject: QuizSubject;
  topicTitle: string;
  stemCategory: StemCategory;
  stemLabel: StemCategoryLabel;
  difficulty: DifficultyLevel;
  weight: 1 | 1.5 | 2;
  prompt: string;
  options: ChallengeOption[];
}

export interface RandomizedQuestionEntry {
  orderIndex: number;
  question: BankQuestion;
  shuffledOptions: ChallengeOption[];
}

export interface RandomizeDeckInput {
  regionId: string;
  missionId?: string;
  missionTags?: readonly string[];
  questionCount: number;
  excludeQuestionIds?: readonly string[];
}

export interface RandomizedDeckOutput {
  entries: RandomizedQuestionEntry[];
  publicQuestions: PublicChallengeQuestion[];
}

export function shuffleArray<T>(
  items: readonly T[],
  rng: () => number = Math.random
): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function normalizePromptKey(prompt: string): string {
  return prompt.trim().toLowerCase().replace(/\s+/g, ' ');
}

function countTagRelevance(
  question: BankQuestion,
  regionId: string,
  missionId: string | undefined,
  missionTags: readonly string[]
): number {
  let relevance = 0;
  if (missionId && question.hotspotId === missionId) {
    relevance += 6;
  }
  if (question.missionTags.includes(regionId)) {
    relevance += 4;
  }
  for (const tag of missionTags) {
    if (question.missionTags.includes(tag)) {
      relevance += 1;
    }
  }
  return relevance;
}

/**
 * Mengambil N soal unik dari bank soal sesuai relevansi misi sambil menjaga keragaman Matematika & Fisika (STEM),
 * memprioritaskan soal yang belum muncul di titik api lain (excludeQuestionIds),
 * lalu mengacak urutan soal dan urutan opsi jawaban (A–D).
 */
export function selectMissionQuestions(
  bank: readonly BankQuestion[],
  regionId: string,
  missionTags: readonly string[],
  targetCount: number,
  rng: () => number = Math.random,
  excludeQuestionIds: readonly string[] = [],
  missionId?: string
): BankQuestion[] {
  // Deduplikasi bank soal berdasarkan id agar bank selalu bersih
  const seenBankIds = new Set<string>();
  const uniqueByIdBank: BankQuestion[] = [];
  for (const q of bank) {
    if (seenBankIds.has(q.id)) {
      continue;
    }
    seenBankIds.add(q.id);
    uniqueByIdBank.push(q);
  }

  const uniquePromptCapacity = new Set(
    uniqueByIdBank.map((q) => normalizePromptKey(q.prompt))
  ).size;
  const safeCount = Math.max(1, Math.min(targetCount, uniquePromptCapacity));

  const excludeSet = new Set(
    excludeQuestionIds.map((id) => id.trim()).filter(Boolean)
  );
  const excludePromptKeys = new Set<string>();
  for (const q of uniqueByIdBank) {
    if (excludeSet.has(q.id)) {
      excludePromptKeys.add(normalizePromptKey(q.prompt));
    }
  }

  const sortByRelevance = (items: readonly BankQuestion[]) =>
    shuffleArray(items, rng).sort((a, b) => {
      const relB = countTagRelevance(b, regionId, missionId, missionTags);
      const relA = countTagRelevance(a, regionId, missionId, missionTags);
      return relB - relA;
    });

  const unseenPool = sortByRelevance(
    uniqueByIdBank.filter(
      (q) =>
        !excludeSet.has(q.id) &&
        !excludePromptKeys.has(normalizePromptKey(q.prompt))
    )
  );
  const unseenIdSet = new Set(unseenPool.map((q) => q.id));
  const fallbackPool = sortByRelevance(
    uniqueByIdBank.filter((q) => !unseenIdSet.has(q.id))
  );

  // Pastikan tidak pernah ada ID atau teks pertanyaan kembar di dalam satu titik api
  const picked: BankQuestion[] = [];
  const usedIds = new Set<string>();
  const usedPrompts = new Set<string>();
  const categories: StemCategory[] = shuffleArray(['S', 'T', 'E', 'M'], rng);

  const tryPick = (q: BankQuestion): boolean => {
    const promptKey = normalizePromptKey(q.prompt);
    if (usedIds.has(q.id) || usedPrompts.has(promptKey)) {
      return false;
    }
    picked.push(q);
    usedIds.add(q.id);
    usedPrompts.add(promptKey);
    return true;
  };

  // Jaga keragaman S, T, E, M (Fisika & Matematika) dari soal yang belum pernah muncul
  for (const cat of categories) {
    if (picked.length >= safeCount) break;
    const candidate = unseenPool.find(
      (q) =>
        q.stemCategory === cat &&
        !usedIds.has(q.id) &&
        !usedPrompts.has(normalizePromptKey(q.prompt))
    );
    if (candidate) {
      tryPick(candidate);
    }
  }

  for (const q of unseenPool) {
    if (picked.length >= safeCount) break;
    tryPick(q);
  }

  // Hanya jika pool soal baru tidak cukup (< safeCount), lengkapi dari fallbackPool
  if (picked.length < safeCount) {
    for (const cat of categories) {
      if (picked.length >= safeCount) break;
      const candidate = fallbackPool.find(
        (q) =>
          q.stemCategory === cat &&
          !usedIds.has(q.id) &&
          !usedPrompts.has(normalizePromptKey(q.prompt))
      );
      if (candidate) {
        tryPick(candidate);
      }
    }

    for (const q of fallbackPool) {
      if (picked.length >= safeCount) break;
      tryPick(q);
    }
  }

  // Acak ulang urutan final soal yang terpilih agar tidak berurutan sama antar titik
  return shuffleArray(picked, rng);
}

/**
 * Menghapus kunci jawaban (correctOptionId), acuan, pembahasan, dan insight sebelum dikirim ke browser.
 */
export function sanitizeQuestionForClient(
  question: BankQuestion,
  shuffledOptions: readonly ChallengeOption[],
  orderIndex: number
): PublicChallengeQuestion {
  return {
    id: question.id,
    orderIndex,
    subject: question.subject,
    topicTitle: question.topicTitle,
    stemCategory: question.stemCategory,
    stemLabel: question.stemLabel,
    difficulty: question.difficulty,
    weight: question.weight,
    prompt: question.prompt,
    options: shuffledOptions.map((opt) => ({
      id: opt.id,
      text: opt.text,
    })),
  };
}

export function buildRandomizedChallengeDeck(
  bank: readonly BankQuestion[],
  input: RandomizeDeckInput,
  rng: () => number = Math.random
): RandomizedDeckOutput {
  const missionTags = input.missionTags ?? [];
  const selected = selectMissionQuestions(
    bank,
    input.regionId,
    missionTags,
    input.questionCount,
    rng,
    input.excludeQuestionIds ?? [],
    input.missionId
  );

  const entries: RandomizedQuestionEntry[] = selected.map((question, idx) => ({
    orderIndex: idx + 1,
    question,
    shuffledOptions: shuffleArray(question.options, rng),
  }));

  const publicQuestions: PublicChallengeQuestion[] = entries.map((entry) =>
    sanitizeQuestionForClient(entry.question, entry.shuffledOptions, entry.orderIndex)
  );

  return {
    entries,
    publicQuestions,
  };
}
