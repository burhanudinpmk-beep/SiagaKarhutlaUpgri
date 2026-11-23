import { AlertTriangle, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { RegionStatus } from '../../types/mission';
import { getStatusPresentation } from '../../utils/regionHelpers';

interface StatusIndicatorProps {
  status: RegionStatus;
  variant?: 'inline' | 'badge';
  showDescription?: boolean;
}

export function StatusIndicator({
  status,
  variant = 'badge',
  showDescription = false,
}: StatusIndicatorProps) {
  const presentation = getStatusPresentation(status);

  const Icon =
    status === 'bahaya'
      ? TriangleAlert
      : status === 'waspada'
        ? AlertTriangle
        : status === 'cukup-aman'
          ? ShieldAlert
          : ShieldCheck;

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap ${presentation.textClass}`}>
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{presentation.label}</span>
        {showDescription && (
          <span className="font-normal text-[#475569]">
            · {presentation.shortDescription}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold tracking-wide whitespace-nowrap shrink-0 ${presentation.surfaceClass} ${presentation.borderClass} ${presentation.textClass}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Status: {presentation.label}</span>
    </span>
  );
}
