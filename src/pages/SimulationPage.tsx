import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { findRegionById } from '../utils/regionHelpers';
import { MissionStepper } from '../components/layout/MissionStepper';
import { ChallengeQuizPanel } from '../components/simulation/ChallengeQuizPanel';
import { NotFoundPage } from './NotFoundPage';
import { useGameProgress } from '../context/GameProgressContext';

export function SimulationPage() {
  const { regionId, missionId: paramMissionId } = useParams<{
    regionId: string;
    missionId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const missionId = paramMissionId ?? searchParams.get('missionId') ?? undefined;
  const region = findRegionById(regionId);
  const { updateMissionCursor } = useGameProgress();

  const effectiveMissionId = missionId?.trim() || (region ? `sim-${region.id}` : '');
  const activeRegionId = region?.id;

  useEffect(() => {
    if (activeRegionId && effectiveMissionId) {
      void updateMissionCursor(activeRegionId, effectiveMissionId);
    }
  }, [activeRegionId, effectiveMissionId, updateMissionCursor]);

  if (!region) {
    return (
      <NotFoundPage
        title="Wilayah Kuis Misi Tidak Ditemukan"
        message={`Kode wilayah "${regionId ?? ''}" tidak terdaftar dalam misi SIAGA KARHUTLA Kalimantan Barat.`}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-16">
      <MissionStepper
        currentStage="simulasi"
        regionId={region.id}
        regionName={region.name}
        missionId={missionId}
      />

      <div className="mx-auto box-border w-[92%] max-w-[1450px] pt-5 sm:pt-6">
        <ChallengeQuizPanel region={region} missionId={missionId} />
      </div>
    </div>
  );
}
