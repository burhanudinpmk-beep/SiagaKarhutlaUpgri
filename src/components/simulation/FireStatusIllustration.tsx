interface FireStatusIllustrationProps {
  mode: 'active' | 'extinguished' | 'burning';
  className?: string;
}

export function FireStatusIllustration({
  mode,
  className = '',
}: FireStatusIllustrationProps) {
  if (mode === 'extinguished') {
    return (
      <div
        className={`relative inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] shadow-xs ${className}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" className="h-12 w-12 overflow-visible">
          <circle cx="32" cy="36" r="20" fill="#0284C7" fillOpacity="0.14" />
          <path
            d="M14 48 C22 43, 42 43, 50 48"
            fill="none"
            stroke="#0284C7"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <g className="karhutla-extinguish-anim">
            <path
              d="M32 18 C36 25, 42 30, 40 38 C39 43, 36 46, 32 46 C28 46, 25 43, 24 38 C22 30, 28 25, 32 18 Z"
              fill="#EA580C"
            />
            <path
              d="M32 27 C34 31, 37 34, 36 39 C35 42, 33.5 43.5, 32 43.5 C30.5 43.5, 29 42, 28 39 C27 34, 30 31, 32 27 Z"
              fill="#F59E0B"
            />
          </g>
          <circle cx="46" cy="20" r="9" fill="#059669" stroke="#FFFFFF" strokeWidth="2" />
          <path
            d="M42 20 L45 23 L50 17"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (mode === 'burning') {
    return (
      <div
        className={`relative inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#FECACA] bg-[#FEF2F2] shadow-xs ${className}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" className="h-12 w-12 overflow-visible">
          <g className="karhutla-smoke-anim">
            <circle cx="28" cy="14" r="5" fill="#64748B" fillOpacity="0.45" />
            <circle cx="36" cy="11" r="6" fill="#475569" fillOpacity="0.35" />
          </g>
          <ellipse cx="32" cy="50" rx="16" ry="4" fill="#DC2626" fillOpacity="0.25" />
          <g className="karhutla-flame-anim">
            <path
              d="M32 13 C38 22, 46 29, 44 41 C43 47, 38 51, 32 51 C26 51, 21 47, 20 41 C18 29, 26 22, 32 13 Z"
              fill="#DC2626"
            />
            <path
              d="M32 23 C36 29, 40 33, 39 41 C38 45, 35.5 48, 32 48 C28.5 48, 26 45, 25 41 C24 33, 28 29, 32 23 Z"
              fill="#EA580C"
            />
            <path
              d="M32 32 C34.5 36, 36 39, 35 43 C34.5 45, 33.2 46.5, 32 46.5 C30.8 46.5, 29.5 45, 29 43 C28 39, 29.5 36, 32 32 Z"
              fill="#F59E0B"
            />
          </g>
        </svg>
      </div>
    );
  }

  // Active quiz fire icon inside Slate command header
  return (
    <div
      className={`relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#EA580C]/45 bg-[#1E293B] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" className="h-9 w-9 overflow-visible">
        <g className="karhutla-smoke-anim">
          <circle cx="22" cy="11" r="3.5" fill="#CBD5E1" fillOpacity="0.3" />
          <circle cx="27" cy="9" r="4" fill="#CBD5E1" fillOpacity="0.22" />
        </g>
        <g className="karhutla-flame-anim">
          <path
            d="M24 11 C29 18, 34 23, 33 32 C32 37, 28.5 40, 24 40 C19.5 40, 16 37, 15 32 C14 23, 19 18, 24 11 Z"
            fill="#EA580C"
          />
          <path
            d="M24 20 C27 24, 30 27, 29 33 C28.5 36, 26.5 38, 24 38 C21.5 38, 19.5 36, 19 33 C18 27, 21 24, 24 20 Z"
            fill="#F59E0B"
          />
        </g>
      </svg>
    </div>
  );
}
