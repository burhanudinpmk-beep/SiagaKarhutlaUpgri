import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import {
  ChallengeServiceError,
  createChallengeSession,
  getPublicSessionSnapshot,
  recoverAndRetryWrongChallenge,
  retryWrongChallengeAnswers,
  submitChallengeAnswer,
  submitChallengeBatch,
} from './server/challengeService.ts';
import { KALBAR_REGION_POLICIES } from './server/challengeBank.ts';
import {
  CertificateValidationError,
  issueValidatedCertificate,
  lookupCertificateByNumber,
  REQUIRED_CERTIFICATE_MISSIONS,
  type MissionEvidencePayload,
} from './server/certificateService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const HOST = '0.0.0.0';

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '128kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'siaga-karhutla-api' });
  });

  app.get('/api/master/missions', (_req, res) => {
    res.json({
      requiredForCertificateCount: REQUIRED_CERTIFICATE_MISSIONS.length,
      requiredMissions: REQUIRED_CERTIFICATE_MISSIONS,
      regions: Object.values(KALBAR_REGION_POLICIES),
    });
  });

  app.post('/api/challenges/session', (req, res) => {
    try {
      const body = req.body as {
        regionId?: string;
        missionId?: string;
        riskLevel?: 'bahaya' | 'waspada' | 'cukup-aman' | 'aman';
        questionCount?: 5 | 6 | 7;
        excludeQuestionIds?: unknown[];
      };
      const excludeQuestionIds = Array.isArray(body?.excludeQuestionIds)
        ? body.excludeQuestionIds
            .filter((id): id is string => typeof id === 'string')
            .slice(0, 200)
        : [];
      const session = createChallengeSession({
        regionId: body?.regionId ?? '',
        missionId: body?.missionId,
        riskLevel: body?.riskLevel,
        questionCount: body?.questionCount,
        excludeQuestionIds,
      });
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof ChallengeServiceError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Gagal membuat sesi tantangan.' });
    }
  });

  app.get('/api/challenges/session/:sessionId', (req, res) => {
    try {
      const snapshot = getPublicSessionSnapshot(req.params.sessionId);
      res.json(snapshot);
    } catch (error) {
      if (error instanceof ChallengeServiceError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Gagal memuat sesi tantangan.' });
    }
  });

  app.post('/api/challenges/session/:sessionId/answer', (req, res) => {
    try {
      const body = req.body as {
        questionId?: string;
        selectedOptionId?: string;
      };
      const result = submitChallengeAnswer(req.params.sessionId, {
        questionId: body?.questionId ?? '',
        selectedOptionId: body?.selectedOptionId ?? '',
      });
      res.json(result);
    } catch (error) {
      if (error instanceof ChallengeServiceError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Gagal memverifikasi jawaban.' });
    }
  });

  app.post('/api/challenges/session/:sessionId/submit', (req, res) => {
    try {
      const body = req.body as {
        answers?: Array<{ questionId?: string; selectedOptionId?: string }>;
      };
      const answers = Array.isArray(body?.answers)
        ? body.answers.map((a) => ({
            questionId: a?.questionId ?? '',
            selectedOptionId: a?.selectedOptionId ?? '',
          }))
        : [];
      const result = submitChallengeBatch(req.params.sessionId, answers);
      res.json(result);
    } catch (error) {
      if (error instanceof ChallengeServiceError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Gagal memverifikasi jawaban kuis.' });
    }
  });

  app.post('/api/challenges/session/:sessionId/retry-wrong', (req, res) => {
    try {
      const body = req.body as {
        answers?: Array<{ questionId?: string; selectedOptionId?: string }>;
      };
      const answers = Array.isArray(body?.answers)
        ? body.answers.map((a) => ({
            questionId: a?.questionId ?? '',
            selectedOptionId: a?.selectedOptionId ?? '',
          }))
        : [];
      const result = retryWrongChallengeAnswers(req.params.sessionId, answers);
      res.json(result);
    } catch (error) {
      if (error instanceof ChallengeServiceError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Gagal memverifikasi perbaikan jawaban kuis.' });
    }
  });

  app.post('/api/challenges/session/retry-recover', (req, res) => {
    try {
      const body = req.body as {
        regionId?: string;
        missionId?: string;
        riskLevel?: 'bahaya' | 'waspada' | 'cukup-aman' | 'aman';
        questionIds?: unknown[];
        previousAnswers?: Array<{ questionId?: string; selectedOptionId?: string }>;
        retryAnswers?: Array<{ questionId?: string; selectedOptionId?: string }>;
      };
      const result = recoverAndRetryWrongChallenge({
        regionId: body?.regionId ?? '',
        missionId: body?.missionId,
        riskLevel: body?.riskLevel,
        questionIds: Array.isArray(body?.questionIds)
          ? body.questionIds.filter((id): id is string => typeof id === 'string')
          : [],
        previousAnswers: Array.isArray(body?.previousAnswers)
          ? body.previousAnswers.map((a) => ({
              questionId: a?.questionId ?? '',
              selectedOptionId: a?.selectedOptionId ?? '',
            }))
          : [],
        retryAnswers: Array.isArray(body?.retryAnswers)
          ? body.retryAnswers.map((a) => ({
              questionId: a?.questionId ?? '',
              selectedOptionId: a?.selectedOptionId ?? '',
            }))
          : [],
      });
      res.json(result);
    } catch (error) {
      if (error instanceof ChallengeServiceError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Gagal memulihkan dan memeriksa perbaikan kuis.' });
    }
  });

  app.post('/api/certificates/issue', (req, res) => {
    try {
      const body = req.body as {
        playerId?: string;
        playerName?: string;
        missionEvidence?: MissionEvidencePayload[];
        certificateName?: string;
      };

      const certificate = issueValidatedCertificate({
        playerId: body?.playerId,
        playerName: body?.playerName,
        missionEvidence: body?.missionEvidence ?? [],
        certificateName: body?.certificateName,
      });

      res.status(201).json({ certificate });
    } catch (error) {
      if (error instanceof CertificateValidationError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({
        error: 'Terjadi kesalahan saat memvalidasi dan menerbitkan sertifikat.',
      });
    }
  });

  app.get('/api/certificates/verify/:certificateNumber', (req, res) => {
    const found = lookupCertificateByNumber(req.params.certificateNumber ?? '');
    if (!found) {
      res.status(404).json({
        valid: false,
        error: 'Nomor sertifikat tidak ditemukan atau tanda tangan tidak valid.',
      });
      return;
    }

    res.json({
      valid: true,
      certificate: {
        certificateNumber: found.certificateNumber,
        studentName: found.studentName,
        predicate: found.predicate,
        averageScore: found.averageScore,
        totalRequiredMissions: found.totalRequiredMissions,
        completedMissionIds: found.completedMissionIds,
        issuedAtIso: found.issuedAtIso,
        validationDigest: found.validationDigest,
        serverVerified: found.serverVerified,
      },
    });
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Endpoint API tidak ditemukan.' });
        return;
      }
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        next();
      }
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`SIAGA KARHUTLA server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SIAGA KARHUTLA server:', err);
  process.exit(1);
});
