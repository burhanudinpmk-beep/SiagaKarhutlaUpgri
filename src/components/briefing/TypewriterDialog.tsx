import { useEffect, useMemo, useState } from 'react';
import { FastForward, RotateCcw } from 'lucide-react';

interface TypewriterDialogProps {
  lines: string[];
  dialogKey: string;
  speakerName: string;
  speakerRole: string;
}

export function TypewriterDialog({
  lines,
  dialogKey,
  speakerName,
  speakerRole,
}: TypewriterDialogProps) {
  const fullText = useMemo(() => lines.join('\n\n'), [lines]);
  const [charIndex, setCharIndex] = useState<number>(0);
  const [replaySeed, setReplaySeed] = useState<number>(0);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setCharIndex(fullText.length);
      return;
    }

    setCharIndex(0);
    const interval = window.setInterval(() => {
      setCharIndex((prev) => {
        if (prev >= fullText.length) {
          window.clearInterval(interval);
          return prev;
        }
        return prev + 2;
      });
    }, 18);

    return () => window.clearInterval(interval);
  }, [dialogKey, fullText, prefersReducedMotion, replaySeed]);

  const isComplete = charIndex >= fullText.length;
  const visibleText = fullText.slice(0, charIndex);
  const paragraphs = visibleText.split('\n\n');

  const handleCompleteNow = () => {
    setCharIndex(fullText.length);
  };

  const handleReplay = () => {
    setReplaySeed((prev) => prev + 1);
  };

  return (
    <div className="rounded-xl border border-[#DCE3DE] bg-[#F6F8F6] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE3DE] pb-3">
        <div>
          <p className="font-display text-sm font-bold text-[#0D2818]">
            {speakerName}
          </p>
          <p className="text-xs text-[#4A5D52]">{speakerRole}</p>
        </div>

        <div className="flex items-center gap-2">
          {!isComplete ? (
            <button
              type="button"
              onClick={handleCompleteNow}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md border border-[#DCE3DE] bg-white px-3 py-1 text-xs font-medium text-[#0D2818] transition-colors hover:bg-[#EBF2EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14452F]"
            >
              <FastForward className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tampilkan Lengkap</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReplay}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md border border-[#DCE3DE] bg-white px-3 py-1 text-xs font-medium text-[#0D2818] transition-colors hover:bg-[#EBF2EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14452F]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Putar Ulang Dialog</span>
            </button>
          )}
        </div>
      </div>

      <div
        aria-live="polite"
        data-testid="typewriter-dialog-body"
        className="mt-4 min-h-[116px] space-y-3 text-sm leading-relaxed text-[#1E3127] sm:text-[15px]"
      >
        {paragraphs.map((para, idx) => {
          const isLastVisible = idx === paragraphs.length - 1;
          return (
            <p key={idx}>
              {para}
              {!isComplete && isLastVisible && (
                <span
                  aria-hidden="true"
                  className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 bg-[#14452F]"
                />
              )}
            </p>
          );
        })}
      </div>
    </div>
  );
}
