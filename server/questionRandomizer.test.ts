import test from 'node:test';
import assert from 'node:assert/strict';
import { CHALLENGE_QUESTION_BANK } from './challengeBank.ts';
import { buildRandomizedChallengeDeck } from './questionRandomizer.ts';

function makeSeededRng(seedStart: number): () => number {
  let seed = seedStart;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

test('buildRandomizedChallengeDeck returns exact question counts 5, 6, and 7 with zero answer keys in public payload', () => {
  for (const count of [5, 6, 7] as const) {
    const deck = buildRandomizedChallengeDeck(
      CHALLENGE_QUESTION_BANK,
      {
        regionId: 'kubu-raya',
        missionTags: ['kubu-raya', 'gambut', 'bahaya'],
        questionCount: count,
      },
      makeSeededRng(100 + count)
    );

    assert.equal(deck.entries.length, count);
    assert.equal(deck.publicQuestions.length, count);

    const uniqueIds = new Set(deck.publicQuestions.map((q) => q.id));
    assert.equal(uniqueIds.size, count);

    for (const pq of deck.publicQuestions) {
      assert.ok(['S', 'T', 'E', 'M'].includes(pq.stemCategory));
      assert.ok(['mudah', 'sedang', 'sulit'].includes(pq.difficulty));
      assert.ok([1, 1.5, 2].includes(pq.weight));
      assert.equal(pq.options.length, 4);

      const record = pq as unknown as Record<string, unknown>;
      assert.equal('correctOptionId' in record, false);
      assert.equal('explanation' in record, false);
    }
  }
});

test('buildRandomizedChallengeDeck randomizes both question order and answer option positions', () => {
  const orderSignatures = new Set<string>();
  const firstOptionPositions = new Set<string>();

  for (let seed = 1; seed <= 12; seed++) {
    const deck = buildRandomizedChallengeDeck(
      CHALLENGE_QUESTION_BANK,
      {
        regionId: 'ketapang',
        missionTags: ['ketapang', 'gambut', 'bahaya'],
        questionCount: 7,
      },
      makeSeededRng(seed * 7919)
    );

    orderSignatures.add(deck.publicQuestions.map((q) => q.id).join(','));
    for (const q of deck.publicQuestions) {
      firstOptionPositions.add(`${q.id}:${q.options.map((o) => o.id).join('')}`);
    }
  }

  assert.ok(orderSignatures.size > 1, 'Urutan soal harus teracak antar sesi');
  assert.ok(firstOptionPositions.size > 7, 'Posisi opsi jawaban harus teracak');
});

test('75-question bank has 45 Matematika + 30 Fisika with zero duplicate prompts and prioritizes hotspot-relevant questions', () => {
  assert.equal(CHALLENGE_QUESTION_BANK.length, 75);
  assert.equal(
    CHALLENGE_QUESTION_BANK.filter((q) => q.subject === 'Matematika').length,
    45
  );
  assert.equal(
    CHALLENGE_QUESTION_BANK.filter((q) => q.subject === 'Fisika').length,
    30
  );

  const uniquePrompts = new Set(
    CHALLENGE_QUESTION_BANK.map((q) => q.prompt.trim().toLowerCase())
  );
  assert.equal(uniquePrompts.size, 64);

  const singkawangDeck = buildRandomizedChallengeDeck(
    CHALLENGE_QUESTION_BANK,
    {
      regionId: 'kota-singkawang',
      missionId: 'sim-01',
      missionTags: ['kota-singkawang', 'sim-01', 'bahaya'],
      questionCount: 7,
    },
    makeSeededRng(42)
  );

  const kubuRayaDeck = buildRandomizedChallengeDeck(
    CHALLENGE_QUESTION_BANK,
    {
      regionId: 'kubu-raya',
      missionId: 'sim-06',
      missionTags: ['kubu-raya', 'sim-06', 'bahaya'],
      questionCount: 7,
    },
    makeSeededRng(42)
  );

  const singkawangIds = singkawangDeck.publicQuestions.map((q) => q.id);
  const kubuRayaIds = kubuRayaDeck.publicQuestions.map((q) => q.id);

  assert.ok(
    singkawangIds.some((id) => id.startsWith('q-sim-01-') || id.startsWith('q-sim-02-') || id.startsWith('q-sim-03-') || id.startsWith('q-sim-04-') || id.startsWith('q-sim-05-')),
    'Misi Kota Singkawang harus memprioritaskan soal wilayah Singkawang'
  );
  assert.ok(
    kubuRayaIds.some((id) => id.startsWith('q-sim-06-') || id.startsWith('q-sim-07-') || id.startsWith('q-sim-08-') || id.startsWith('q-sim-09-') || id.startsWith('q-sim-10-')),
    'Misi Kubu Raya harus memprioritaskan soal wilayah Kubu Raya'
  );
});

test('buildRandomizedChallengeDeck eliminates duplicate prompts/IDs and avoids previously served excludeQuestionIds', () => {
  const duplicatePromptBank = [
    ...CHALLENGE_QUESTION_BANK,
    {
      ...CHALLENGE_QUESTION_BANK[0],
      id: 'q-duplicate-copy-id',
    },
  ];

  const firstDeck = buildRandomizedChallengeDeck(
    duplicatePromptBank,
    {
      regionId: 'kubu-raya',
      missionTags: ['kubu-raya', 'gambut', 'bahaya'],
      questionCount: 7,
    },
    makeSeededRng(17)
  );

  const firstPromptSet = new Set(
    firstDeck.publicQuestions.map((q) => q.prompt.trim().toLowerCase())
  );
  assert.equal(firstPromptSet.size, 7);

  const secondDeck = buildRandomizedChallengeDeck(
    duplicatePromptBank,
    {
      regionId: 'ketapang',
      missionTags: ['ketapang', 'gambut', 'bahaya'],
      questionCount: 7,
      excludeQuestionIds: firstDeck.publicQuestions.map((q) => q.id),
    },
    makeSeededRng(17)
  );

  const firstIds = new Set(firstDeck.publicQuestions.map((q) => q.id));
  for (const q of secondDeck.publicQuestions) {
    assert.equal(
      firstIds.has(q.id),
      false,
      `Soal ${q.id} tidak boleh terulang di titik api kedua saat soal baru masih tersedia`
    );
  }
});

