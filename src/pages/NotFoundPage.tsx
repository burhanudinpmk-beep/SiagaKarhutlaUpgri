import { Link } from 'react-router-dom';
import { ArrowLeft, Flame, MapPin } from 'lucide-react';

interface NotFoundPageProps {
  title?: string;
  message?: string;
}

export function NotFoundPage({
  title = 'Halaman Tidak Ditemukan',
  message = 'Rute yang Anda akses tidak tersedia di dalam sistem navigasi SIAGA KARHUTLA.',
}: NotFoundPageProps) {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-lg px-4 text-center">
        <div className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white shadow-lg">
          <div className="bg-[#0F172A] px-6 py-5 text-[#F8FAFC]">
            <div className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
              <Flame className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
              <span>Navigasi Sektor</span>
            </div>
            <h1 className="mt-1.5 font-display text-2xl font-extrabold text-white">
              {title}
            </h1>
          </div>

          <div className="p-7">
            <p className="text-sm leading-relaxed text-[#475569]">
              {message}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/peta-kalbar"
                className="game-btn-fire inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <span>Buka Peta Kalbar</span>
              </Link>
              <Link
                to="/"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F1F5F9]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Kembali ke Beranda</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
