import { Link } from 'react-router-dom';
import { Check, ChevronRight, Radio } from 'lucide-react';
import type { MissionStageId } from '../../types/mission';
import { buildMissionRoutes } from '../../utils/regionHelpers';

interface MissionStepperProps {
  currentStage: MissionStageId;
  regionId: string;
  regionName: string;
  missionId?: string;
}

export function MissionStepper({
  currentStage,
  regionId,
  regionName,
  missionId,
}: MissionStepperProps) {
  const routes = buildMissionRoutes(regionId, missionId);

  const steps: { id: MissionStageId; num: string; label: string; to: string }[] = [
    { id: 'peta', num: '01', label: 'Peta Kalbar', to: routes.map },
    { id: 'briefing', num: '02', label: 'Briefing', to: routes.briefing },
    { id: 'simulasi', num: '03', label: 'Kuis Misi', to: routes.simulation },
    { id: 'hasil', num: '04', label: 'Hasil Akhir', to: '/evaluasi-stem' },
  ];

  const activeIndex = steps.findIndex((s) => s.id === currentStage);

  return (
    <div className="border-b border-[#E2E8F0] bg-white">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-2 text-xs text-[#475569]">
          <Radio className="h-3.5 w-3.5 shrink-0 text-[#EA580C]" aria-hidden="true" />
          <span className="font-bold text-[#0F172A]">Sektor Aktif</span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold text-[#1E293B]">{regionName}</span>
        </div>

        <nav aria-label="Tahapan Misi" className="overflow-x-auto">
          <ol className="flex items-center gap-1.5 sm:gap-2">
            {steps.map((step, index) => {
              const isCurrent = step.id === currentStage;
              const isCompleted = index < activeIndex;

              return (
                <li key={step.id} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <Link
                    to={step.to}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`inline-flex min-h-[36px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA580C] ${
                      isCurrent
                        ? 'bg-[#EA580C] font-bold text-white shadow-xs'
                        : isCompleted
                          ? 'border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857] hover:bg-white'
                          : 'border border-transparent bg-[#F1F5F9] text-[#475569] hover:border-[#CBD5E1] hover:bg-white hover:text-[#0F172A]'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5 text-[#059669]" aria-hidden="true" />
                    ) : (
                      <span className="font-mono text-[11px] tabular-nums opacity-90">
                        {step.num}
                      </span>
                    )}
                    <span>{step.label}</span>
                  </Link>
                  {index < steps.length - 1 && (
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}
