import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  Lock,
  MapPin,
  Printer,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  CERTIFICATE_REQUIRED_MISSIONS,
  useGameProgress,
} from '../context/GameProgressContext';
import { buildSimulationUrl } from '../utils/briefingHelpers';
import { deriveLocalCertificatePredicate } from '../utils/progressHelpers';
import { playButtonClickSfx } from '../utils/soundEffects';

interface PublicVerifiedCertificate {
  certificateNumber: string;
  studentName: string;
  predicate: string;
  averageScore: number;
  totalRequiredMissions: number;
  completedMissionIds: string[];
  issuedAtIso: string;
  validationDigest: string;
  serverVerified: boolean;
}

export function CertificatePage() {
  const {
    isReady,
    playerName,
    hasCustomProfileName,
    playerProgress,
    simulationResultsByMission,
    certificate,
    updatePlayerName,
  } = useGameProgress();

  const [nameInput, setNameInput] = useState(hasCustomProfileName ? playerName : '');
  const [nameFeedback, setNameFeedback] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const [verifyNumber, setVerifyNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    certificate?: PublicVerifiedCertificate;
    error?: string;
  } | null>(null);

  useEffect(() => {
    setNameInput(hasCustomProfileName ? playerName : '');
  }, [hasCustomProfileName, playerName]);

  const missionChecklist = CERTIFICATE_REQUIRED_MISSIONS.map((spec) => {
    const sim = simulationResultsByMission[spec.missionId];
    const hasChallenge = Boolean(sim?.latestChallengeRecord);
    const isCompleted = Boolean(
      (sim?.isMissionCompleted && hasChallenge) ||
        playerProgress.completedMissionIds.includes(spec.missionId)
    );

    return {
      ...spec,
      sim,
      hasDecision: Boolean(sim?.latestDecisionRecord),
      hasChallenge,
      isCompleted,
      overallScore: sim?.overallScore ?? null,
    };
  });

  const completedCount = missionChecklist.filter((m) => m.isCompleted).length;
  const totalRequired = CERTIFICATE_REQUIRED_MISSIONS.length;
  const allEightCompleted = completedCount === totalRequired;
  const progressPct = Math.round((completedCount / Math.max(1, totalRequired)) * 100);

  // Preview & PDF output ALWAYS share this exact name source so preview === print
  const displayedCertificateName = hasCustomProfileName
    ? playerName
    : certificate?.studentName || 'Peserta SIAGA KARHUTLA';
  const displayedAverageScore =
    certificate?.averageScore ?? playerProgress.averageOverallScore;
  const displayedPredicate =
    certificate?.predicate ?? deriveLocalCertificatePredicate(displayedAverageScore);

  const handleSaveCertName = (e: FormEvent) => {
    e.preventDefault();
    setNameFeedback(null);
    setNameError(null);
    const clean = nameInput.trim();
    if (clean.length < 2) {
      setNameError('Nama pada sertifikat minimal 2 karakter.');
      return;
    }

    playButtonClickSfx();
    try {
      const saved = updatePlayerName(clean);
      setNameInput(saved);
      setNameFeedback(
        'Nama sertifikat tersimpan dan langsung diperbarui pada pratinjau serta hasil cetak PDF.'
      );
    } catch (err) {
      setNameError(
        err instanceof Error ? err.message : 'Gagal memperbarui nama sertifikat.'
      );
    }
  };

  const handleVerifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = verifyNumber.trim().toUpperCase();
    if (!clean) return;
    playButtonClickSfx();
    setVerifying(true);
    setVerifyResult(null);
    try {
      const response = await fetch(
        `/api/certificates/verify/${encodeURIComponent(clean)}`
      );
      const data = (await response.json()) as {
        valid: boolean;
        certificate?: PublicVerifiedCertificate;
        error?: string;
      };
      setVerifyResult(data);
    } catch {
      setVerifyResult({
        valid: false,
        error: 'Gagal menghubungi layanan verifikasi sertifikat.',
      });
    } finally {
      setVerifying(false);
    }
  };

  if (!isReady) {
    return (
      <div className="py-16">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 rounded-2xl border border-[#CBD5E1] bg-white p-6 text-sm font-semibold text-[#0F172A]">
            <Loader2 className="h-5 w-5 animate-spin text-[#EA580C]" aria-hidden="true" />
            <span>Memuat progres sertifikat SIAGA KARHUTLA...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 print:pb-0">
      <section className="command-grid-dark border-b border-[#1E293B] bg-[#0F172A] py-7 text-[#F8FAFC] print:hidden">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                Apresiasi Penyelesaian Misi · Tanpa Login
              </p>
              <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Sertifikat Kelulusan SIAGA KARHUTLA
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#CBD5E1]">
                Sertifikat otomatis terbuka setelah Anda menyelesaikan seluruh 8 titik api
                wajib di Kalimantan Barat (minimal 70% jawaban benar pada kuis setiap titik
                api).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/profil"
                onClick={() => playButtonClickSfx()}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#475569] bg-[#1E293B] px-3.5 py-2 text-xs font-bold text-[#F8FAFC] transition-colors hover:border-[#94A3B8] hover:bg-[#334155]"
              >
                <Edit3 className="h-3.5 w-3.5 text-[#F59E0B]" aria-hidden="true" />
                <span>Profil Pemain</span>
              </Link>

              <Link
                to="/evaluasi-stem"
                onClick={() => playButtonClickSfx()}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#475569] bg-[#1E293B] px-3.5 py-2 text-xs font-bold text-[#F8FAFC] transition-colors hover:border-[#94A3B8] hover:bg-[#334155]"
              >
                <span>Hasil Akhir Misi</span>
              </Link>

              <span className="inline-flex items-center gap-2 rounded-xl border border-[#334155] bg-[#1E293B] px-3.5 py-2 text-xs font-bold text-[#F8FAFC]">
                <Award className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
                <span className="font-mono tabular-nums">
                  {completedCount} / {totalRequired} Misi
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 pt-7 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:pt-0">
        {!allEightCompleted ? (
          /* Locked State: Certificate cannot be opened/printed before 8/8 required missions complete */
          <section
            aria-label="Sertifikat Terkunci"
            data-testid="certificate-locked-card"
            className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm sm:p-8 print:hidden"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-lg border border-[#F59E0B]/50 bg-[#FFFBEB] px-3 py-1 text-xs font-bold text-[#B45309]">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sertifikat Belum Terbuka ({completedCount}/{totalRequired} Titik Api)</span>
                </div>

                <h2 className="mt-3 font-display text-xl font-extrabold text-[#0F172A] sm:text-2xl">
                  Selesaikan {totalRequired - completedCount} Titik Api Wajib Lagi untuk Membuka Sertifikat
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                  Tombol <strong>Buka Sertifikat</strong> dan cetak PDF akan otomatis aktif
                  begitu seluruh 8 titik api wajib Kalimantan Barat selesai dengan skor
                  minimal <strong>70%</strong> per misi. Tidak diperlukan login atau akun
                  Google.
                </p>

                <div className="mt-4 max-w-md">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                    <span>Progres Kelayakan Sertifikat</span>
                    <span className="font-mono tabular-nums">{progressPct}%</span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#EA580C] to-[#059669] transition-all duration-300"
                      style={{ width: `${Math.max(4, progressPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  disabled
                  data-testid="certificate-locked-btn"
                  className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F1F5F9] px-5 py-2.5 text-xs font-extrabold text-[#94A3B8]"
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <span>Buka Sertifikat (Terkunci)</span>
                </button>

                <Link
                  to="/peta-kalbar"
                  data-testid="certificate-continue-map-btn"
                  onClick={() => playButtonClickSfx()}
                  className="game-btn-fire inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold"
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  <span>Lanjutkan Misi di Peta Kalbar</span>
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Quick Certificate Name Editor right before printing (Always hidden in PDF Print) */}
            <section
              aria-label="Pengaturan Nama pada Sertifikat"
              data-testid="cert-name-editor"
              className="rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-sm sm:p-6 print:hidden"
            >
              <form
                onSubmit={handleSaveCertName}
                className="flex flex-col gap-3"
              >
                <div>
                  <label
                    htmlFor="certificate-name-quick-input"
                    className="block font-display text-sm font-extrabold text-[#0F172A]"
                  >
                    Nama Lengkap Tercetak pada Sertifikat
                  </label>
                  <p className="mt-0.5 text-xs text-[#475569]">
                    Masukkan atau perbarui nama lengkap Anda sebelum mencetak sertifikat.
                    Pratinjau dan PDF sertifikat otomatis mengikuti nama yang disimpan.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    id="certificate-name-quick-input"
                    data-testid="cert-name-input"
                    type="text"
                    maxLength={120}
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      setNameFeedback(null);
                      setNameError(null);
                    }}
                    placeholder="Masukkan nama lengkap Anda untuk sertifikat"
                    className="min-h-[42px] flex-1 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-sm font-semibold text-[#0F172A] focus-visible:border-[#EA580C] focus-visible:outline-none"
                  />
                  <button
                    type="submit"
                    data-testid="cert-name-save-btn"
                    disabled={nameInput.trim().length < 2}
                    className="game-btn-forest inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>Simpan Nama Sertifikat</span>
                  </button>
                </div>

                {nameError && (
                  <p className="text-xs font-semibold text-[#991B1B]">{nameError}</p>
                )}
                {nameFeedback && (
                  <p
                    data-testid="cert-name-saved-feedback"
                    className="text-xs font-semibold text-[#059669]"
                  >
                    {nameFeedback}
                  </p>
                )}
              </form>
            </section>

            {/* Unified Certificate Preview & PDF Print Sheet (Preserves existing official design) */}
            <section
              aria-label="Pratinjau dan Cetak Sertifikat SIAGA KARHUTLA"
              data-testid="official-certificate-card"
              className="mt-7 rounded-2xl border-2 border-[#0F172A] bg-white p-6 shadow-md sm:p-10 print:mt-0 print:border-2 print:shadow-none"
            >
              <div className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-6 sm:p-10 print-avoid-break">
                <div className="flex flex-col gap-4 border-b border-[#E2E8F0] pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-mono text-xs font-bold tracking-wider text-[#EA580C]">
                      SERTIFIKAT KOMPETENSI MITIGASI KARHUTLA
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0F172A] sm:text-3xl">
                      SIAGA KARHUTLA · KALIMANTAN BARAT
                    </h2>
                  </div>

                  <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1.5 font-mono text-xs font-bold text-[#059669]">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span>TERVALIDASI RESMI</span>
                  </span>
                </div>

                <div className="mt-8 text-center sm:text-left">
                  <p className="text-xs font-semibold text-[#475569]">
                    Diberikan kepada peserta simulasi dan mitigasi karhutla:
                  </p>
                  <p
                    data-testid="certificate-preview-student-name"
                    className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl"
                  >
                    {displayedCertificateName}
                  </p>
                  <p className="mt-1 font-mono text-xs text-[#475569]">
                    Peserta Mitigasi Kebakaran Hutan &amp; Lahan · Kalimantan Barat
                  </p>

                  <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[#334155]">
                    Telah menyelesaikan seluruh{' '}
                    <strong>{totalRequired} misi utama</strong> pemodelan kerawanan dan
                    tantangan kuis mitigasi di wilayah Provinsi Kalimantan Barat dengan
                    hasil resmi memenuhi standar kelulusan.
                  </p>
                </div>

                <dl className="mt-8 grid grid-cols-1 gap-4 border-t border-[#E2E8F0] pt-6 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#CBD5E1] bg-white p-4">
                    <dt className="text-[11px] font-semibold text-[#475569]">
                      Skor Akhir Rata-Rata
                    </dt>
                    <dd className="mt-1 font-mono text-2xl font-extrabold text-[#0F172A] tabular-nums">
                      {displayedAverageScore} / 100
                    </dd>
                  </div>
                  <div className="rounded-xl border border-[#CBD5E1] bg-white p-4">
                    <dt className="text-[11px] font-semibold text-[#475569]">
                      Predikat Kelulusan
                    </dt>
                    <dd className="mt-1 text-sm font-extrabold text-[#059669]">
                      {displayedPredicate}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-[#CBD5E1] bg-white p-4">
                    <dt className="text-[11px] font-semibold text-[#475569]">
                      Nomor &amp; Tanggal Terbit
                    </dt>
                    <dd className="mt-1 font-mono text-xs font-bold text-[#0F172A]">
                      {certificate?.certificateNumber ?? 'SKH-2026-TERVERIFIKASI'}
                    </dd>
                    <dd className="mt-0.5 text-[11px] text-[#475569]">
                      {new Date(certificate?.issuedAtIso ?? Date.now()).toLocaleDateString(
                        'id-ID',
                        {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-col gap-3 border-t border-[#E2E8F0] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#475569]">
                      Status Keaslian Sertifikat
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-[#0F172A]">
                      Tervalidasi oleh sistem SIAGA KARHUTLA Kalimantan Barat (8/8 Titik
                      Api Selesai).
                    </p>
                  </div>

                  <button
                    type="button"
                    data-testid="certificate-print-pdf-btn"
                    onClick={() => {
                      playButtonClickSfx();
                      window.print();
                    }}
                    className="game-btn-forest inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold print:hidden"
                  >
                    <Printer className="h-4 w-4" aria-hidden="true" />
                    <span>Cetak / Simpan PDF</span>
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Mission Checklist */}
        <section
          aria-label="Daftar 8 Misi Wajib Sertifikat"
          className="mt-7 rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm print:hidden"
        >
          <div className="flex flex-col gap-4 border-b border-[#E2E8F0] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-extrabold text-[#0F172A]">
                Kelengkapan 8 Misi Wajib Sertifikasi Kalbar
              </h2>
              <p className="mt-1 text-xs text-[#475569]">
                Setiap titik api dinyatakan berhasil ditangani bila kuis 5–7 soal mencapai
                minimal <strong>70% jawaban benar</strong>. Rata-rata skor saat ini:{' '}
                <strong className="font-mono text-[#0F172A]">
                  {playerProgress.averageOverallScore}/100
                </strong>
                .
              </p>
            </div>

            {allEightCompleted && (
              <span
                data-testid="certificate-ready-badge"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2 text-xs font-extrabold text-[#059669]"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>8 / 8 Misi Terpenuhi</span>
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {missionChecklist.map((item) => (
              <article
                key={item.missionId}
                className={`flex flex-col justify-between rounded-xl border p-4 ${
                  item.isCompleted
                    ? 'border-[#A7F3D0] bg-[#ECFDF5]'
                    : 'border-[#E2E8F0] bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] font-bold text-[#EA580C]">
                      {item.missionCode} · {item.requiredQuestionCount} Soal Kuis
                    </p>
                    <h3 className="mt-0.5 font-display text-base font-extrabold text-[#0F172A]">
                      {item.regionName}
                    </h3>
                  </div>

                  {item.isCompleted ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-[#A7F3D0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#059669]">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Selesai</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#475569]">
                      <Clock className="h-3.5 w-3.5 text-[#EA580C]" aria-hidden="true" />
                      <span>Belum Lengkap</span>
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0] pt-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#334155]">
                    <span>
                      Kuis:{' '}
                      <strong className="text-[#0F172A]">
                        {item.sim?.latestChallengeRecord
                          ? `${item.sim.latestChallengeRecord.correctCount}/${item.sim.latestChallengeRecord.questionCount} benar`
                          : item.isCompleted
                            ? 'Lulus (≥70%)'
                            : 'Belum'}
                      </strong>
                    </span>
                    {item.overallScore !== null && (
                      <span className="font-mono font-bold text-[#059669]">
                        Skor {item.overallScore}/100
                      </span>
                    )}
                  </div>

                  <Link
                    to={buildSimulationUrl(item.regionId, item.missionId)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#EA580C] hover:underline"
                  >
                    <span>{item.isCompleted ? 'Ulangi' : 'Mulai Kuis'}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Certificate Number Verification */}
        <section
          aria-label="Verifikasi Keaslian Sertifikat"
          className="mt-7 rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm print:hidden"
        >
          <h2 className="font-display text-base font-extrabold text-[#0F172A]">
            Verifikasi Keaslian Nomor Sertifikat
          </h2>
          <p className="mt-1 text-xs text-[#475569]">
            Masukkan nomor sertifikat (contoh format:{' '}
            <span className="font-mono">SKH-2026-XXXXXXXX</span>) untuk memeriksa
            keaslian nomor sertifikat SIAGA KARHUTLA.
          </p>

          <form
            onSubmit={handleVerifySubmit}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={verifyNumber}
              onChange={(e) => setVerifyNumber(e.target.value)}
              placeholder="SKH-2026-XXXXXXXX"
              aria-label="Nomor Sertifikat"
              className="min-h-[42px] flex-1 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 font-mono text-xs text-[#0F172A] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#EA580C]"
            />
            <button
              type="submit"
              disabled={verifying || !verifyNumber.trim()}
              className="game-btn-forest inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-50"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Cek Keaslian</span>
            </button>
          </form>

          {verifyResult && (
            <div
              className={`mt-4 rounded-xl border p-4 text-xs ${
                verifyResult.valid && verifyResult.certificate
                  ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]'
                  : 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]'
              }`}
            >
              {verifyResult.valid && verifyResult.certificate ? (
                <p>
                  <strong>Sertifikat Valid:</strong>{' '}
                  {verifyResult.certificate.certificateNumber} atas nama{' '}
                  <strong>{verifyResult.certificate.studentName}</strong> (Skor rata-rata{' '}
                  {verifyResult.certificate.averageScore}/100 ·{' '}
                  {verifyResult.certificate.predicate}).
                </p>
              ) : (
                <p>{verifyResult.error ?? 'Sertifikat tidak ditemukan.'}</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
