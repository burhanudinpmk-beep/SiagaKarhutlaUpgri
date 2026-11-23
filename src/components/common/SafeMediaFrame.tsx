import { useState } from 'react';
import { Trees } from 'lucide-react';

interface SafeMediaFrameProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackTitle?: string;
}

export function SafeMediaFrame({
  src,
  alt,
  className = '',
  imgClassName = '',
  fallbackTitle = 'Lanskap Hutan Kalimantan Barat',
}: SafeMediaFrameProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0D2818] via-[#14452F] to-[#1B5E3F] p-6 text-center text-white ${className}`}
        role="img"
        aria-label={alt}
      >
        <Trees className="mb-3 h-10 w-10 text-emerald-200" aria-hidden="true" />
        <p className="font-display text-sm font-semibold tracking-tight text-white">
          {fallbackTitle}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#0D2818] ${className}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`h-full w-full object-cover ${imgClassName}`}
      />
    </div>
  );
}
