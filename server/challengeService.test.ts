import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHALLENGE_QUESTION_BANK,
  KALBAR_REGION_POLICIES,
} from './challengeBank.ts';
import {
  ChallengeServiceError,
  clearChallengeSessionsForTest,
  createChallengeSession,
  getPublicSessionSnapshot,
  recoverAndRetryWrongChallenge,
  retryWrongChallengeAnswers,
  submitChallengeAnswer,
  submitChallengeBatch,
} from './challengeService.ts';

test('all 14 Kalbar regions produce sessions with 5, 6, or 7 questions and zero leaked answer keys', () => {
  clearChallengeSessionsForTest();
  const counts = new Set<number>();

  for (const regionId of Object.keys(KALBAR_REGION_POLICIES)) {
    const session = createChallengeSession({ regionId });
    counts.add(session.questionCount);
    assert.ok([5, 6, 7].includes(session.questionCount));
    assert.equal(session.questions.length, session.questionCount);
    assert.equal(session.targetSeconds, session.questionCount * 35);

    // Pastikan tidak ada kunci jawaban, penjelasan, atau insight C, H, O dalam payload JSON publik
    const serialized = JSON.stringify(session);
    assert.equal(serialized.includes('correctOptionId'), false);
    assert.equal(serialized.includes('explanation'), false);
    assert.equal(serialized.includes('stemChoInsight'), false);

    // Snapshot GET sebelum menjawab juga tidak boleh membocorkan kunci
    const snapshot = getPublicSessionSnapshot(session.sessionId);
    const snapSerialized = JSON.stringify(snapshot);
    assert.equal(snapSerialized.includes('correctOptionId'), false);
    assert.equal(snapSerialized.includes('explanation'), false);
    assert.equal(snapSerialized.includes('stemChoInsight'), false);
  }

  assert.deepEqual([...counts].sort(), [5, 6, 7]);
});

test('server verifies answers, reveals explanation only after answering, and rejects invalid/duplicate submissions', () => {
  clearChallengeSessionsForTest();
  let clockMs = 1_000_000;
  const session = createChallengeSession(
    { regionId: 'kubu-raya', missionId: 'sim-01', riskLevel: 'bahaya' },
    Math.random,
    () => clockMs
  );

  assert.equal(session.questionCount, 7);

  const firstQuestion = session.questions[0];
  const bankMatch = CHALLENGE_QUESTION_BANK.find((q) => q.id === firstQuestion.id)!;
  const wrongOption = firstQuestion.options.find(
    (o) => o.id !== bankMatch.correctOptionId
  )!;

  clockMs += 20_000;
  const wrongResult = submitChallengeAnswer(
    session.sessionId,
    { questionId: firstQuestion.id, selectedOptionId: wrongOption.id },
    () => clockMs
  );

  assert.equal(wrongResult.feedback.isCorrect, false);
  assert.equal(wrongResult.feedback.correctOptionId, bankMatch.correctOptionId);
  assert.equal(wrongResult.feedback.explanation, bankMatch.explanation);
  assert.equal(wrongResult.feedback.earnedWeight, 0);
  assert.equal(wrongResult.isCompleted, false);

  // Kirim ulang soal yang sama harus ditolak (409)
  assert.throws(
    () =>
      submitChallengeAnswer(session.sessionId, {
        questionId: firstQuestion.id,
        selectedOptionId: bankMatch.correctOptionId,
      }),
    (err: unknown) =>
      err instanceof ChallengeServiceError && err.statusCode === 409
  );

  // Opsi atau pertanyaan palsu harus ditolak (400)
  assert.throws(
    () =>
      submitChallengeAnswer(session.sessionId, {
        questionId: 'non-existent-question',
        selectedOptionId: 'a',
      }),
    (err: unknown) =>
      err instanceof ChallengeServiceError && err.statusCode === 400
  );
});

test('normalized scoring stays fair across 5-question and 7-question missions', () => {
  clearChallengeSessionsForTest();

  const runPerfectSession = (regionId: string, expectedCount: 5 | 7) => {
    let clockMs = 5_000_000;
    const session = createChallengeSession(
      { regionId },
      Math.random,
      () => clockMs
    );
    assert.equal(session.questionCount, expectedCount);

    let lastResult = null;
    for (const pq of session.questions) {
      const bankMatch = CHALLENGE_QUESTION_BANK.find((q) => q.id === pq.id)!;
      clockMs += 25_000;
      lastResult = submitChallengeAnswer(
        session.sessionId,
        { questionId: pq.id, selectedOptionId: bankMatch.correctOptionId },
        () => clockMs
      );
    }

    assert.ok(lastResult?.isCompleted);
    assert.ok(lastResult?.summary);
    return lastResult.summary;
  };

  const sanggauSummary = runPerfectSession('sanggau', 5);
  const kubuRayaSummary = runPerfectSession('kubu-raya', 7);

  assert.equal(sanggauSummary.normalizedAccuracyScore, 100);
  assert.equal(kubuRayaSummary.normalizedAccuracyScore, 100);
  assert.equal(sanggauSummary.normalizedAnalysisQualityScore, 100);
  assert.equal(kubuRayaSummary.normalizedAnalysisQualityScore, 100);
  assert.equal(sanggauSummary.elapsedSeconds, 125);
  assert.equal(kubuRayaSummary.elapsedSeconds, 175);
});

test('explicit questionCount 5 with submitChallengeBatch reveals C/H/O insight only after Q5 submission', () => {
  clearChallengeSessionsForTest();
  let clockMs = 8_000_000;

  const session = createChallengeSession(
    { regionId: 'kubu-raya', missionId: 'sim-01', riskLevel: 'bahaya', questionCount: 5 },
    Math.random,
    () => clockMs
  );

  assert.equal(session.questionCount, 5);
  assert.equal(session.questions.length, 5);
  assert.equal(JSON.stringify(session).includes('stemChoInsight'), false);

  const answers = session.questions.map((pq, idx) => {
    const bankMatch = CHALLENGE_QUESTION_BANK.find((q) => q.id === pq.id)!;
    const picked =
      idx < 4
        ? bankMatch.correctOptionId
        : pq.options.find((o) => o.id !== bankMatch.correctOptionId)!.id;
    return { questionId: pq.id, selectedOptionId: picked };
  });

  clockMs += 45_000;
  const batchResult = submitChallengeBatch(session.sessionId, answers, () => clockMs);

  assert.equal(batchResult.isCompleted, true);
  assert.equal(batchResult.answeredCount, 5);
  assert.equal(batchResult.feedbackList.length, 5);
  assert.ok(batchResult.summary);
  assert.equal(batchResult.summary.correctCount, 4);
  assert.equal(batchResult.summary.questionCount, 5);
  assert.ok(batchResult.summary.serverProof);

  for (const fb of batchResult.feedbackList) {
    assert.ok(fb.explanation.length > 10);
    assert.ok(fb.stemChoInsight.length > 10);
  }

  assert.throws(
    () => submitChallengeBatch(session.sessionId, answers),
    (err: unknown) =>
      err instanceof ChallengeServiceError && err.statusCode === 409
  );
});

test('consecutive hotspots with variable counts (7, 6, 7) produce zero overlapping questions when excludeQuestionIds is passed', () => {
  clearChallengeSessionsForTest();
  const seenIds = new Set<string>();

  const targets: Array<{ regionId: string; expected: 5 | 6 | 7 }> = [
    { regionId: 'kubu-raya', expected: 7 },
    { regionId: 'sintang', expected: 6 },
    { regionId: 'ketapang', expected: 7 },
  ];

  for (const target of targets) {
    const session = createChallengeSession({
      regionId: target.regionId,
      excludeQuestionIds: Array.from(seenIds),
    });
    assert.equal(session.questionCount, target.expected);
    assert.equal(session.questions.length, target.expected);

    const localPrompts = new Set<string>();
    for (const q of session.questions) {
      assert.equal(
        seenIds.has(q.id),
        false,
        `Soal ${q.id} muncul ulang lintas titik api`
      );
      seenIds.add(q.id);
      localPrompts.add(q.prompt.trim().toLowerCase());
    }
    assert.equal(localPrompts.size, target.expected);
  }

  assert.equal(seenIds.size, 20);
});

test('retryWrongChallengeAnswers allows retrying only missed questions until 100% and reveals full acuan + C/H/O', () => {
  clearChallengeSessionsForTest();
  let clockMs = 9_000_000;

  const session = createChallengeSession(
    { regionId: 'kota-singkawang', missionId: 'sim-03', riskLevel: 'cukup-aman', questionCount: 5 },
    Math.random,
    () => clockMs
  );

  // Answer Q1-Q3 right, Q4-Q5 wrong
  const initialAnswers = session.questions.map((pq, idx) => {
    const bankMatch = CHALLENGE_QUESTION_BANK.find((q) => q.id === pq.id)!;
    const picked =
      idx < 3
        ? bankMatch.correctOptionId
        : pq.options.find((o) => o.id !== bankMatch.correctOptionId)!.id;
    return { questionId: pq.id, selectedOptionId: picked };
  });

  clockMs += 50_000;
  const firstBatch = submitChallengeBatch(session.sessionId, initialAnswers, () => clockMs);
  assert.equal(firstBatch.summary?.correctCount, 3);
  assert.ok(firstBatch.feedbackList.every((fb) => fb.acuan.length > 0));

  // Attempting to retry a question that was already correct must throw 400
  assert.throws(
    () =>
      retryWrongChallengeAnswers(session.sessionId, [
        { questionId: session.questions[0].id, selectedOptionId: initialAnswers[0].selectedOptionId },
      ]),
    (err: unknown) => err instanceof ChallengeServiceError && err.statusCode === 400
  );

  // Fix only Q4 and Q5
  const retryPayload = session.questions.slice(3).map((pq) => {
    const bankMatch = CHALLENGE_QUESTION_BANK.find((q) => q.id === pq.id)!;
    return { questionId: pq.id, selectedOptionId: bankMatch.correctOptionId };
  });

  clockMs += 20_000;
  const retried = retryWrongChallengeAnswers(session.sessionId, retryPayload, () => clockMs);
  assert.equal(retried.feedbackList.length, 5);
  assert.equal(retried.summary?.correctCount, 5);
  assert.equal(retried.summary?.normalizedAccuracyScore, 100);
  assert.ok(retried.summary?.serverProof);
});

test('recoverAndRetryWrongChallenge restores expired session and computes updated summary', () => {
  clearChallengeSessionsForTest();
  const sampleQuestions = CHALLENGE_QUESTION_BANK.slice(0, 5);
  const previousAnswers = sampleQuestions.map((q, idx) => ({
    questionId: q.id,
    selectedOptionId:
      idx === 0
        ? q.options.find((o) => o.id !== q.correctOptionId)!.id
        : q.correctOptionId,
  }));
  const retryAnswers = [
    {
      questionId: sampleQuestions[0].id,
      selectedOptionId: sampleQuestions[0].correctOptionId,
    },
  ];

  const recovered = recoverAndRetryWrongChallenge({
    regionId: 'kota-singkawang',
    missionId: 'sim-01',
    riskLevel: 'bahaya',
    questionIds: sampleQuestions.map((q) => q.id),
    previousAnswers,
    retryAnswers,
  });

  assert.equal(recovered.feedbackList.length, 5);
  assert.equal(recovered.summary?.correctCount, 5);
  assert.equal(recovered.summary?.normalizedAccuracyScore, 100);
  assert.ok(recovered.summary?.serverProof);
});

