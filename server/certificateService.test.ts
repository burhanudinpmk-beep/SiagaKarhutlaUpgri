import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CertificateValidationError,
  issueValidatedCertificate,
  REQUIRED_CERTIFICATE_MISSIONS,
  verifyCertificateRecord,
  type MissionEvidencePayload,
} from './certificateService.ts';
import {
  signChallengeCompletionProof,
  verifyChallengeCompletionProof,
  type ChallengeProofInput,
} from './signingUtils.ts';

const TEST_SECRET = 'test-siaga-karhutla-secret-key-2026-kalbar';
const TEST_PLAYER_ID = 'player_kalbar_001';
const TEST_PLAYER_NAME = 'Rafi Pratama';

function buildValidEvidence(
  secret: string = TEST_SECRET
): MissionEvidencePayload[] {
  return REQUIRED_CERTIFICATE_MISSIONS.map((spec, idx) => {
    const challengeSummary: ChallengeProofInput = {
      sessionId: `sess-${spec.missionId}-${idx}`,
      regionId: spec.regionId,
      missionId: spec.missionId,
      questionCount: spec.requiredQuestionCount,
      correctCount: spec.requiredQuestionCount - 1,
      normalizedAccuracyScore: 86,
      normalizedAnalysisQualityScore: 84,
      elapsedSeconds: spec.requiredQuestionCount * 24,
      completedAtIso: '2026-11-21T10:00:00.000Z',
    };

    const challengeProof = signChallengeCompletionProof(challengeSummary, secret);

    return {
      missionId: spec.missionId,
      regionId: spec.regionId,
      decisionActionId: idx % 2 === 0 ? 'rewetting' : 'canal-blocking',
      decisionScore: 88,
      overallScore: 87,
      challengeSummary,
      challengeProof,
    };
  });
}

test('signChallengeCompletionProof & verifyChallengeCompletionProof menerima bukti sah dan menolak manipulasi', () => {
  const input: ChallengeProofInput = {
    sessionId: 'sess-sim-07',
    regionId: 'sanggau',
    missionId: 'sim-07',
    questionCount: 5,
    correctCount: 5,
    normalizedAccuracyScore: 100,
    normalizedAnalysisQualityScore: 100,
    elapsedSeconds: 95,
    completedAtIso: '2026-11-21T10:00:00.000Z',
  };

  const proof = signChallengeCompletionProof(input, TEST_SECRET);
  assert.match(proof, /^[a-f0-9]{64}$/);
  assert.equal(verifyChallengeCompletionProof(input, proof, TEST_SECRET), true);

  // Manipulasi akurasi harus ditolak
  assert.equal(
    verifyChallengeCompletionProof(
      { ...input, normalizedAccuracyScore: 99 },
      proof,
      TEST_SECRET
    ),
    false
  );

  // Manipulasi wilayah atau misi harus ditolak
  assert.equal(
    verifyChallengeCompletionProof(
      { ...input, regionId: 'ketapang' },
      proof,
      TEST_SECRET
    ),
    false
  );
  assert.equal(
    verifyChallengeCompletionProof(
      { ...input, missionId: 'sim-02' },
      proof,
      TEST_SECRET
    ),
    false
  );
});

test('issueValidatedCertificate menolak payload bukan array atau belum lengkap 8 misi (400)', () => {
  assert.throws(
    () =>
      issueValidatedCertificate({
        playerId: TEST_PLAYER_ID,
        playerName: TEST_PLAYER_NAME,
        missionEvidence: null as unknown as MissionEvidencePayload[],
        signingSecret: TEST_SECRET,
        skipDiskPersistence: true,
      }),
    (err: unknown) =>
      err instanceof CertificateValidationError && err.statusCode === 400
  );

  const partial = buildValidEvidence().slice(0, 7);
  assert.throws(
    () =>
      issueValidatedCertificate({
        playerId: TEST_PLAYER_ID,
        playerName: TEST_PLAYER_NAME,
        missionEvidence: partial,
        signingSecret: TEST_SECRET,
        skipDiskPersistence: true,
      }),
    (err: unknown) =>
      err instanceof CertificateValidationError &&
      err.statusCode === 400 &&
      err.message.includes(REQUIRED_CERTIFICATE_MISSIONS[7].missionCode)
  );
});

test('issueValidatedCertificate menolak bukti wilayah tidak konsisten, aksi invalid, dan tanda tangan palsu', () => {
  const wrongRegion = buildValidEvidence();
  wrongRegion[0].regionId = 'sintang';

  assert.throws(
    () =>
      issueValidatedCertificate({
        playerId: TEST_PLAYER_ID,
        playerName: TEST_PLAYER_NAME,
        missionEvidence: wrongRegion,
        signingSecret: TEST_SECRET,
        skipDiskPersistence: true,
      }),
    (err: unknown) =>
      err instanceof CertificateValidationError && err.statusCode === 400
  );

  const invalidAction = buildValidEvidence();
  invalidAction[1].decisionActionId = 'burn-anyway';

  assert.throws(
    () =>
      issueValidatedCertificate({
        playerId: TEST_PLAYER_ID,
        playerName: TEST_PLAYER_NAME,
        missionEvidence: invalidAction,
        signingSecret: TEST_SECRET,
        skipDiskPersistence: true,
      }),
    (err: unknown) =>
      err instanceof CertificateValidationError && err.statusCode === 400
  );

  const forgedProof = buildValidEvidence();
  forgedProof[2].challengeProof = '0'.repeat(64);

  assert.throws(
    () =>
      issueValidatedCertificate({
        playerId: TEST_PLAYER_ID,
        playerName: TEST_PLAYER_NAME,
        missionEvidence: forgedProof,
        signingSecret: TEST_SECRET,
        skipDiskPersistence: true,
      }),
    (err: unknown) =>
      err instanceof CertificateValidationError && err.statusCode === 403
  );
});

test('issueValidatedCertificate menerbitkan sertifikat SKH valid tanpa login ketika 8 misi terverifikasi dan menolak manipulasi record', () => {
  const fixedDate = new Date('2026-11-21T12:00:00.000Z');
  const cert = issueValidatedCertificate({
    playerId: TEST_PLAYER_ID,
    playerName: TEST_PLAYER_NAME,
    missionEvidence: buildValidEvidence(),
    signingSecret: TEST_SECRET,
    now: fixedDate,
    skipDiskPersistence: true,
  });

  assert.equal(cert.userId, TEST_PLAYER_ID);
  assert.equal(cert.studentName, TEST_PLAYER_NAME);
  assert.equal(cert.serverVerified, true);
  assert.equal(cert.totalRequiredMissions, 8);
  assert.equal(cert.completedMissionIds.length, 8);
  assert.match(cert.certificateNumber, /^SKH-2026-[A-F0-9]{8}$/);
  assert.match(cert.validationDigest, /^[a-f0-9]{64}$/);
  assert.equal(cert.averageScore, 87);
  assert.match(cert.predicate, /Sangat Memuaskan/);

  assert.equal(verifyCertificateRecord(cert, TEST_SECRET), true);

  // Manipulasi skor rata-rata atau pemilik harus membatalkan verifikasi digest
  assert.equal(
    verifyCertificateRecord({ ...cert, averageScore: 100 }, TEST_SECRET),
    false
  );
  assert.equal(
    verifyCertificateRecord({ ...cert, userId: 'attacker_uid' }, TEST_SECRET),
    false
  );
});

test('issueValidatedCertificate membatasi inflasi overallScore di luar batas komponen terverifikasi server', () => {
  const inflatedEvidence = REQUIRED_CERTIFICATE_MISSIONS.map((spec, idx) => {
    const challengeSummary: ChallengeProofInput = {
      sessionId: `sess-low-${spec.missionId}-${idx}`,
      regionId: spec.regionId,
      missionId: spec.missionId,
      questionCount: spec.requiredQuestionCount,
      correctCount: 2,
      normalizedAccuracyScore: 40,
      normalizedAnalysisQualityScore: 40,
      elapsedSeconds: spec.requiredQuestionCount * 40,
      completedAtIso: '2026-11-21T10:00:00.000Z',
    };
    return {
      missionId: spec.missionId,
      regionId: spec.regionId,
      decisionActionId: 'monitoring-reporting',
      decisionScore: 40,
      overallScore: 100, // mencoba klaim 100 meski komponen 40
      challengeSummary,
      challengeProof: signChallengeCompletionProof(challengeSummary, TEST_SECRET),
    };
  });

  const cert = issueValidatedCertificate({
    playerId: TEST_PLAYER_ID,
    playerName: TEST_PLAYER_NAME,
    missionEvidence: inflatedEvidence,
    signingSecret: TEST_SECRET,
    skipDiskPersistence: true,
  });

  assert.equal(cert.averageScore, 55);
  assert.doesNotMatch(cert.predicate, /Sangat Memuaskan/);
});

test('issueValidatedCertificate menerima bukti kuis 5 soal tanpa Decision Engine', () => {
  const quizOnlyEvidence: MissionEvidencePayload[] = REQUIRED_CERTIFICATE_MISSIONS.map(
    (spec, idx) => {
      const challengeSummary: ChallengeProofInput = {
        sessionId: `sess-quiz-${spec.missionId}-${idx}`,
        regionId: spec.regionId,
        missionId: spec.missionId,
        questionCount: 5,
        correctCount: 4,
        normalizedAccuracyScore: 80,
        normalizedAnalysisQualityScore: 82,
        elapsedSeconds: 90,
        completedAtIso: '2026-11-21T10:00:00.000Z',
      };
      return {
        missionId: spec.missionId,
        regionId: spec.regionId,
        decisionActionId: 'quiz-mitigation',
        overallScore: 81,
        challengeSummary,
        challengeProof: signChallengeCompletionProof(challengeSummary, TEST_SECRET),
      };
    }
  );

  const cert = issueValidatedCertificate({
    playerId: TEST_PLAYER_ID,
    playerName: TEST_PLAYER_NAME,
    missionEvidence: quizOnlyEvidence,
    signingSecret: TEST_SECRET,
    skipDiskPersistence: true,
  });

  assert.equal(cert.serverVerified, true);
  assert.equal(cert.totalRequiredMissions, 8);
  assert.equal(cert.averageScore, 81);
  assert.equal(verifyCertificateRecord(cert, TEST_SECRET), true);
});

test('issueValidatedCertificate menggunakan certificateName kustom bila diisi dan membersihkan whitespace', () => {
  const customCert = issueValidatedCertificate({
    playerId: TEST_PLAYER_ID,
    playerName: TEST_PLAYER_NAME,
    missionEvidence: buildValidEvidence(),
    certificateName: '  Rafi Pratama Putra, S.Kom.  ',
    signingSecret: TEST_SECRET,
    skipDiskPersistence: true,
  });

  assert.equal(customCert.studentName, 'Rafi Pratama Putra, S.Kom.');
  assert.equal(verifyCertificateRecord(customCert, TEST_SECRET), true);

  const blankCert = issueValidatedCertificate({
    playerId: TEST_PLAYER_ID,
    playerName: TEST_PLAYER_NAME,
    missionEvidence: buildValidEvidence(),
    certificateName: '   ',
    signingSecret: TEST_SECRET,
    skipDiskPersistence: true,
  });

  assert.equal(blankCert.studentName, TEST_PLAYER_NAME);
});
