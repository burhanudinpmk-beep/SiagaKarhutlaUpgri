import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Flame,
  History,
  Lock,
  MapPin,
  RotateCcw,
  Save,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  CERTIFICATE_REQUIRED_MISSIONS,
  useGameProgress,
} from '../context/GameProgressContext';
import { playButtonClickSfx } from '../utils/soundEffects';

const REQUIRED_MISSION_ID_SET = new Set(
  CERTIFICATE_REQUIRED_MISSIONS.map((m) => m.missionId)
);

export function StudentProfilePage() {
  const {
    isReady,
    playerName,
    hasCustomProfileName,
    playerProgress,
    missionAttempts,
    certificate,
    isAllRequiredCompleted,
    updatePlayerName,
    resetGameProgress,
  } = useGameProgress();

  const [nameInput, setNameInput] = useState(hasCustomProfileName ? playerName : '');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  useEffect(() => {
    setNameInput(hasCustomProfileName ? playerName : '');
  }, [hasCustomProfileName, playerName]);

  const totalRequired = CERTIFICATE_REQUIRED_MISSIONS.length;
  const completedCount = playerProgress.completedMissionIds.filter((id) =>
    REQUIRED_MISSION_ID_SET.has(id)
  ).length;
  const progressPct = Math.min(
    100,
    Math.round((completedCount / Math.max(1, totalRequired)) * 100)
  );

  const handleSaveName = (e: FormEvent) => {
    e.preventDefault();
    setSaveNotice(null);
    setSaveError(null);
    setResetNotice(null);
    const trimmed = nameInput.trim();
    if (trimmed.length < 2) {
      setSaveError('Nama lengkap pada sertifikat minimal 2 karakter.');
      return;
    }

    playButtonClickSfx();
    try {
      const saved = updatePlayerName(trimmed);
      setNameInput(saved);
      setSaveNotice(
        'Nama pemain berhasil disimpan. Nama di Navbar, Hasil Akhir, dan Sertifikat otomatis diperbarui tanpa menghapus progres.'
      );
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan perubahan nama pemain.'
      );
    }
  };

  const handleConfirmReset = () => {
    playButtonClickSfx();
    resetGameProgress();
    setShowResetConfirm(false);
    setSaveNotice(null);
    setResetNotice(
      'Seluruh progres misi, skor kuis, dan riwayat permainan berhasil diatur ulang ke kondisi awal.'
    );
  };

  if (!isReady) {
    return (
      <div className="py-16">
        <div className="mx-auto max-w-[1140px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#CBD5E1] bg-white p-6 text-sm font-semibold text-[#0F172A]">
            Memuat identitas pemain &amp; riwayat progres misi...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-14">
      {/* Command Header */}
      <section className="command-grid-dark border-b border-[#1E293B] bg-[#0F172A] py-7 text-[#F8FAFC]">
        <div className="mx-auto max-w-[1140px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                Identitas Pemain &amp; Pengaturan Sertifikat
              </p>
              <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Profil Pemain SIAGA KARHUTLA
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-[#CBD5E1]">
                Atur nama lengkap Anda untuk ditampilkan pada Navbar, Laporan Evaluasi, dan
                Sertifikat Kelulusan. Progres 8 titik api tersimpan otomatis di browser
                Anda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/peta-kalbar"
                onClick={() => playButtonClickSfx()}
                className="game-btn-fire inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <span>Peta Misi Kalbar</span>
              </Link>

              {isAllRequiredCompleted ? (
                <Link
                  to="/sertifikat"
                  data-testid="profile-open-certificate-btn"
                  onClick={() => playButtonClickSfx()}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#059669] bg-[#059669] px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-[#047857]"
                >
                  <Award className="h-4 w-4" aria-hidden="true" />
                  <span>Buka Sertifikat</span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  data-testid="profile-open-certificate-disabled-btn"
                  title={`Selesaikan ${totalRequired - completedCount} titik api lagi untuk membuka sertifikat`}
                  className="inline-flex min-h-[40px] cursor-not-allowed items-center gap-2 rounded-xl border border-[#334155] bg-[#1E293B] px-4 py-2 text-xs font-bold text-[#94A3B8]"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Buka Sertifikat ({completedCount}/{totalRequired})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1140px] space-y-6 px-4 pt-7 sm:px-6 lg:px-8">
        {resetNotice && (
          <div
            role="status"
            data-testid="profile-reset-notice"
            className="flex items-center gap-2 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-3 text-xs font-semibold text-[#065F46]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{resetNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Player Identity & Progress Card */}
          <section
            aria-label="Identitas Pemain"
            className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm lg:col-span-5"
          >
            <div className="flex items-center gap-3.5 border-b border-[#E2E8F0] pb-4">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#CBD5E1] bg-[#0F172A] text-[#F59E0B]">
                <UserCheck className="h-6 w-6" aria-hidden="true" />
              </span>

              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#ECFDF5] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#059669]">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  <span>Identitas Pemain · Tersimpan Lokal</span>
                </span>
                <h2
                  data-testid="profile-account-display-name"
                  className="mt-1 truncate font-display text-lg font-extrabold text-[#0F172A]"
                >
                  {hasCustomProfileName ? playerName : 'Peserta SIAGA KARHUTLA'}
                </h2>
                <p className="mt-0.5 text-xs text-[#475569]">
                  Akses permainan langsung tanpa akun
                </p>
              </div>
            </div>

            {/* Mission Readiness KPI */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#475569]">
                  Titik Api Wajib Selesai
                </span>
                <span className="font-mono font-extrabold text-[#0F172A] tabular-nums">
                  {completedCount} / {totalRequired} Sektor ({progressPct}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#EA580C] to-[#059669] transition-all duration-300"
                  style={{ width: `${Math.max(4, progressPct)}%` }}
                />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 pt-1 text-xs">
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <dt className="text-[11px] font-semibold text-[#475569]">
                    Rata-Rata Skor
                  </dt>
                  <dd className="mt-1 font-mono text-xl font-extrabold text-[#0F172A] tabular-nums">
                    {playerProgress.averageOverallScore}/100
                  </dd>
                </div>
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <dt className="text-[11px] font-semibold text-[#475569]">
                    Status Sertifikat
                  </dt>
                  <dd
                    className={`mt-1 text-xs font-extrabold ${
                      isAllRequiredCompleted ? 'text-[#059669]' : 'text-[#B45309]'
                    }`}
                  >
                    {isAllRequiredCompleted
                      ? certificate?.certificateNumber ?? 'Terbuka (Siap Cetak)'
                      : `Terkunci (${completedCount}/${totalRequired})`}
                  </dd>
                </div>
              </dl>

              {/* Conscious Game Reset Control */}
              <div className="mt-4 border-t border-[#E2E8F0] pt-4">
                {!showResetConfirm ? (
                  <button
                    type="button"
                    data-testid="profile-reset-game-btn"
                    onClick={() => {
                      playButtonClickSfx();
                      setShowResetConfirm(true);
                    }}
                    className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2 text-xs font-bold text-[#B91C1C] transition-colors hover:bg-[#FEE2E2]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Mulai Ulang Permainan</span>
                  </button>
                ) : (
                  <div
                    data-testid="profile-reset-confirm-box"
                    className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3.5 text-xs"
                  >
                    <p className="font-bold text-[#991B1B]">
                      Hapus seluruh progres 8 titik api dan skor yang tersimpan?
                    </p>
                    <p className="mt-1 text-[11px] text-[#7F1D1D]">
                      Tindakan ini akan mengatur ulang seluruh misi ke status awal dan
                      mengunci kembali sertifikat.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        data-testid="profile-reset-confirm-btn"
                        onClick={handleConfirmReset}
                        className="inline-flex min-h-[34px] items-center justify-center rounded-lg bg-[#DC2626] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B91C1C]"
                      >
                        Ya, Mulai Ulang
                      </button>
                      <button
                        type="button"
                        data-testid="profile-reset-cancel-btn"
                        onClick={() => setShowResetConfirm(false)}
                        className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Editable Player / Certificate Name Card */}
          <section
            aria-label="Pengaturan Nama Pemain dan Sertifikat"
            className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm lg:col-span-7"
          >
            <div className="border-b border-[#E2E8F0] pb-4">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#EA580C]">
                Identitas &amp; Personalisasi Sertifikat
              </p>
              <h2 className="mt-1 font-display text-lg font-extrabold text-[#0F172A]">
                Nama Lengkap untuk Sertifikat Kelulusan
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                Masukkan dan ubah nama lengkap Anda kapan saja. Nama yang disimpan
                tersedia otomatis pada <strong>Navbar</strong>,{' '}
                <strong>Laporan Hasil Akhir</strong>, serta{' '}
                <strong>Pratinjau &amp; PDF Sertifikat</strong> tanpa menghapus progres
                permainan.
              </p>
            </div>

            <form
              data-testid="profile-cert-name-form"
              onSubmit={handleSaveName}
              className="mt-5 space-y-4"
            >
              <div>
                <label
                  htmlFor="profile-certificate-name-input"
                  className="block text-xs font-bold text-[#0F172A]"
                >
                  Nama Lengkap Pemain / Sertifikat
                </label>
                <input
                  id="profile-certificate-name-input"
                  data-testid="profile-cert-name-input"
                  type="text"
                  maxLength={120}
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    setSaveNotice(null);
                    setSaveError(null);
                  }}
                  placeholder="Contoh: Nadira Putri Rahmawati"
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-sm font-semibold text-[#0F172A] focus-visible:border-[#EA580C] focus-visible:outline-none"
                />
                <p className="mt-1 text-[11px] text-[#64748B]">
                  Pratinjau nama pada sertifikat:{' '}
                  <strong className="text-[#0F172A]">
                    {nameInput.trim() || playerName}
                  </strong>
                </p>
              </div>

              {saveError && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-xs font-semibold text-[#991B1B]"
                >
                  {saveError}
                </div>
              )}

              {saveNotice && (
                <div
                  data-testid="profile-cert-name-saved-notice"
                  className="flex items-center gap-2 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-3.5 py-2.5 text-xs font-semibold text-[#065F46]"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{saveNotice}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="submit"
                  data-testid="profile-cert-name-save-btn"
                  disabled={nameInput.trim().length < 2}
                  className="game-btn-fire inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2 text-xs font-extrabold disabled:opacity-50"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  <span>Simpan Nama Pemain</span>
                </button>

                {isAllRequiredCompleted ? (
                  <Link
                    to="/sertifikat"
                    onClick={() => playButtonClickSfx()}
                    className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-bold text-[#059669] hover:text-[#047857]"
                  >
                    <span>Buka &amp; Cetak PDF Sertifikat</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link
                    to="/sertifikat"
                    onClick={() => playButtonClickSfx()}
                    className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-bold text-[#475569] hover:text-[#EA580C]"
                  >
                    <span>Lihat Syarat 8 Titik Api Sertifikat</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </form>
          </section>
        </div>

        {/* Attempt History Summary */}
        <section
          aria-label="Riwayat Pengerjaan Kuis Terbaru"
          className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#EA580C]" aria-hidden="true" />
              <h2 className="font-display text-base font-extrabold text-[#0F172A]">
                Riwayat Pengerjaan Kuis Titik Api Terbaru
              </h2>
            </div>
            <span className="font-mono text-xs font-bold text-[#475569] tabular-nums">
              {missionAttempts.length} Percobaan Tercatat
            </span>
          </div>

          {missionAttempts.length === 0 ? (
            <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-[#0F172A]">
                  Belum Ada Riwayat Kuis Tercatat
                </p>
                <p className="mt-0.5 text-xs text-[#475569]">
                  Pilih titik api di Peta Kalimantan Barat dan selesaikan kuis 5–7 soal
                  untuk mencatat skor pertama Anda.
                </p>
              </div>
              <Link
                to="/peta-kalbar"
                className="game-btn-fire inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold"
              >
                <Flame className="h-4 w-4" aria-hidden="true" />
                <span>Mulai Misi Sekarang</span>
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {missionAttempts.slice(0, 6).map((attempt) => {
                const pct =
                  typeof attempt.correctCount === 'number' &&
                  typeof attempt.questionCount === 'number' &&
                  attempt.questionCount > 0
                    ? Math.round((attempt.correctCount / attempt.questionCount) * 100)
                    : attempt.compositeScore;
                const passed = pct >= 70;

                return (
                  <article
                    key={attempt.attemptId}
                    className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold uppercase text-[#EA580C]">
                        {attempt.regionId} · {attempt.missionId}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-extrabold tabular-nums ${
                          passed
                            ? 'bg-[#ECFDF5] text-[#059669]'
                            : 'bg-[#FFF7ED] text-[#C2410C]'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                    <p className="mt-2 font-semibold text-[#0F172A]">
                      {typeof attempt.correctCount === 'number'
                        ? `${attempt.correctCount}/${attempt.questionCount ?? 5} jawaban benar`
                        : `Skor gabungan ${attempt.compositeScore}/100`}
                    </p>
                    <p className="mt-1 text-[11px] text-[#64748B]">
                      {new Date(attempt.completedAtIso).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
