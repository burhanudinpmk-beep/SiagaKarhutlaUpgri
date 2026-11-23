import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { DEFAULT_REGION_ID } from '../../data/kalbarRegions';

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1E293B] bg-[#0F172A] text-[#F8FAFC] print:hidden">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="inline-flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#EA580C]/50 bg-[#1E293B] text-[#EA580C]">
                <Flame className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="font-display text-lg font-extrabold tracking-tight text-white">
                SIAGA KARHUTLA
              </p>
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#94A3B8]">
              Game edukasi simulasi dan pemantauan titik api kebakaran hutan dan
              lahan untuk wilayah ekosistem tropis Kalimantan Barat.
            </p>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1]">
              Navigasi Misi
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[#E2E8F0]">
              <li>
                <Link to="/" className="hover:text-[#F59E0B] hover:underline">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/peta-kalbar" className="hover:text-[#F59E0B] hover:underline">
                  Peta Titik Api Kalbar
                </Link>
              </li>
              <li>
                <Link
                  to={`/briefing/${DEFAULT_REGION_ID}`}
                  className="hover:text-[#F59E0B] hover:underline"
                >
                  Ruang Briefing Misi
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1]">
              Tantangan &amp; Sertifikasi
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[#E2E8F0]">
              <li>
                <Link
                  to={`/simulasi/${DEFAULT_REGION_ID}`}
                  className="hover:text-[#F59E0B] hover:underline"
                >
                  Kuis Titik Api (5–7 Soal)
                </Link>
              </li>
              <li>
                <Link
                  to="/sertifikat"
                  className="hover:text-[#F59E0B] hover:underline"
                >
                  Progres &amp; Sertifikat
                </Link>
              </li>
              <li>
                <Link
                  to="/evaluasi-stem"
                  className="hover:text-[#F59E0B] hover:underline"
                >
                  Hasil Akhir Misi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-[#1E293B] pt-6 text-xs text-[#94A3B8] sm:flex-row sm:items-center sm:justify-between">
          <p>SIAGA KARHUTLA · Edukasi Penanganan Kebakaran Hutan &amp; Lahan Kalimantan Barat</p>
          <p className="font-mono text-[#CBD5E1]">Kalimantan Barat · Simulasi Edukasi</p>
        </div>
      </div>
    </footer>
  );
}
