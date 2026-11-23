import { useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Flame, MapPin, ShieldAlert } from 'lucide-react';
import {
  buildSimulationUrl,
  loadActiveHotspotByMissionId,
  markBriefingSeen,
  resolveMissionBriefing,
} from '../utils/briefingHelpers';
import { findRegionById } from '../utils/regionHelpers';
import { playMissionStartSfx } from '../utils/soundEffects';
import { MissionStepper } from '../components/layout/MissionStepper';
import { SafeMediaFrame } from '../components/common/SafeMediaFrame';
import { NotFoundPage } from './NotFoundPage';

const BRIEFING_ILLUSTRATION_PATH =
  '/src/assets/images/briefing_patrol_deck_1795278472548.jpg';

export function BriefingPage() {
  const { regionId, missionId: paramMissionId } = useParams<{
    regionId: string;
    missionId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const missionId = paramMissionId ?? searchParams.get('missionId') ?? undefined;
  const activeHotspot = useMemo(
    () => loadActiveHotspotByMissionId(missionId),
    [missionId]
  );

  const region = findRegionById(regionId);
  const briefing = useMemo(
    () => resolveMissionBriefing(regionId, missionId, activeHotspot),
    [regionId, missionId, activeHotspot]
  );

  if (!region || !briefing) {
    return (
      <NotFoundPage
        title="Wilayah Briefing Tidak Ditemukan"
        message={`Kode wilayah "${regionId ?? ''}" tidak terdaftar dalam sektor pemantauan Kalimantan Barat.`}
      />
    );
  }

  const handleStartMission = () => {
    markBriefingSeen();
    playMissionStartSfx();
    navigate(buildSimulationUrl(briefing.regionId, briefing.missionId));
  };

  return (
    <div className="pb-14">
      <MissionStepper
        currentStage="briefing"
        regionId={briefing.regionId}
        regionName={briefing.regionName}
        missionId={briefing.missionId}
      />

      <div className="mx-auto max-w-[1040px] px-4 pt-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white shadow-lg">
          <div className="grid grid-cols-1 items-stretch lg:grid-cols-12">
            {/* Illustration: Tim Penanganan & Peta Komando */}
            <div className="relative min-h-[250px] bg-[#0F172A] lg:col-span-6 lg:min-h-[430px]">
              <SafeMediaFrame
                src={BRIEFING_ILLUSTRATION_PATH}
                alt={`Ilustrasi tim respons karhutla menyiapkan operasi pada peta wilayah ${briefing.regionName}`}
                className="h-full w-full lg:h-full"
                fallbackTitle={`Pos Komando ${briefing.regionName}`}
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/25 to-transparent"
                aria-hidden="true"
              />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC]">
                  <MapPin className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                  <span>Sektor {briefing.regionName}</span>
                </div>
                <span className="rounded-md border border-[#475569] bg-[#0F172A]/85 px-2.5 py-1 font-mono text-[11px] font-bold text-[#F59E0B]">
                  SIAGA TIM
                </span>
              </div>
            </div>

            {/* Concise Pre-Mission Command Deck */}
            <div className="flex flex-col justify-between bg-white p-6 sm:p-8 lg:col-span-6">
              <div>
                <div className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#EA580C]">
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  <span>Ruang Briefing Misi</span>
                </div>
                <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[#0F172A] [text-wrap:balance] sm:text-3xl">
                  {briefing.regionName}
                </h1>

                <dl className="mt-6 divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-sm">
                  <div className="flex items-center justify-between gap-4 py-3.5">
                    <dt className="text-[#475569]">Wilayah Dipilih</dt>
                    <dd className="text-right font-bold text-[#0F172A]">
                      {briefing.regionName}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3.5">
                    <dt className="text-[#475569]">Jumlah Soal Kuis</dt>
                    <dd className="inline-flex items-center gap-1.5 font-mono font-bold text-[#EA580C] tabular-nums">
                      <Flame className="h-4 w-4" aria-hidden="true" />
                      <span>{briefing.challengeCount} Soal</span>
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <dt className="shrink-0 text-[#475569]">Misi</dt>
                    <dd className="font-semibold text-[#0F172A] sm:text-right">
                      Selesaikan tantangan kuis untuk membantu menangani titik api.
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3.5">
                    <dt className="text-[#475569]">Target Keberhasilan</dt>
                    <dd className="inline-flex items-center gap-1.5 font-bold text-[#059669]">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>Minimal 70% jawaban benar.</span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-7 flex flex-col gap-3">
                <button
                  type="button"
                  data-testid="briefing-start-mission-btn"
                  onClick={handleStartMission}
                  className="game-btn-fire inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold tracking-wide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA580C]"
                >
                  <Flame className="h-4 w-4" aria-hidden="true" />
                  <span>MULAI MISI</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <Link
                  to="/peta-kalbar"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-sm font-semibold text-[#1E293B] transition-colors hover:bg-[#F1F5F9]"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Kembali ke Peta Kalbar</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
