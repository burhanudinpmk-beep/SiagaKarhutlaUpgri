import type { CommanderProfile } from '../../types/mission';

interface MissionCommanderVectorProps {
  commander: CommanderProfile;
}

export function MissionCommanderVector({
  commander,
}: MissionCommanderVectorProps) {
  const { archetype } = commander;

  const isFemale = archetype === 'southern' || archetype === 'northern';
  const hasGlasses = archetype === 'southern' || archetype === 'central';
  const hasFieldCap = archetype === 'coastal';

  const skinTone =
    archetype === 'coastal'
      ? '#C8926E'
      : archetype === 'southern'
        ? '#D9A784'
        : archetype === 'central'
          ? '#BE8562'
          : '#DFB393';

  const skinShadow =
    archetype === 'coastal'
      ? '#AD7654'
      : archetype === 'southern'
        ? '#BD8A69'
        : archetype === 'central'
          ? '#A46D4D'
          : '#C49576';

  const jacketPrimary =
    archetype === 'coastal'
      ? '#14452F'
      : archetype === 'southern'
        ? '#1B5E3F'
        : archetype === 'central'
          ? '#0D2818'
          : '#164E35';

  return (
    <div className="overflow-hidden rounded-xl border border-[#DCE3DE] bg-[#0D2818]">
      <svg
        viewBox="0 0 240 240"
        role="img"
        aria-label={`Ilustrasi vektor ${commander.name}, ${commander.fictionalRole}`}
        className="block h-auto w-full"
      >
        <defs>
          <linearGradient id="cmdBackdrop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#091D12" />
            <stop offset="100%" stopColor="#14452F" />
          </linearGradient>
        </defs>

        {/* Backdrop & Topographic Contour Lines */}
        <rect width="240" height="240" fill="url(#cmdBackdrop)" />
        <g fill="none" stroke="rgba(180, 215, 195, 0.14)" strokeWidth="1.2">
          <path d="M -10 175 Q 60 140 130 165 T 255 150" />
          <path d="M -10 198 Q 75 162 145 186 T 255 174" />
          <path d="M 15 45 Q 70 28 118 52 T 230 38" />
          <circle cx="195" cy="52" r="24" />
          <circle cx="195" cy="52" r="36" strokeDasharray="3 4" />
        </g>

        {/* Subtle Rainforest Canopy Silhouette */}
        <path
          d="M0 240 L0 195 Q25 182 48 192 Q78 175 108 190 Q142 178 178 194 Q210 180 240 192 L240 240 Z"
          fill="#0B2215"
          opacity="0.7"
        />

        {/* Shoulders & Field Jacket */}
        <path
          d="M 42 240 C 44 192, 72 170, 120 170 C 168 170, 196 192, 198 240 Z"
          fill={jacketPrimary}
          stroke="#091D12"
          strokeWidth="2"
        />

        {/* Inner Shirt Collar */}
        <polygon points="102,170 120,202 138,170" fill="#EBF2EE" />
        <path
          d="M 96 171 L 114 208 L 120 202 L 105 170 Z"
          fill="#246B49"
        />
        <path
          d="M 144 171 L 126 208 L 120 202 L 135 170 Z"
          fill="#246B49"
        />

        {/* Field Utility Strap & Lanyard */}
        <rect x="74" y="182" width="12" height="58" rx="3" fill="#091D12" opacity="0.55" />
        <rect x="154" y="182" width="12" height="58" rx="3" fill="#091D12" opacity="0.55" />
        <rect x="76" y="200" width="8" height="14" rx="2" fill="#8FB39E" />

        {/* Regional Compass Emblem on Chest */}
        <circle cx="152" cy="212" r="9" fill="#091D12" stroke="#8FB39E" strokeWidth="1.3" />
        <polygon points="152,205 155,212 152,219 149,212" fill="#EBF2EE" />

        {/* Neck */}
        <rect x="106" y="144" width="28" height="32" rx="10" fill={skinShadow} />

        {/* Back Hair for Female Archetypes */}
        {isFemale && archetype === 'northern' && (
          <path
            d="M 76 105 C 74 140, 74 162, 86 172 L 154 172 C 166 162, 166 140, 164 105 Z"
            fill="#1D2320"
          />
        )}
        {isFemale && archetype === 'southern' && (
          <circle cx="120" cy="64" r="18" fill="#1B211E" />
        )}

        {/* Ears */}
        <ellipse cx="83" cy="116" rx="6" ry="10" fill={skinShadow} />
        <ellipse cx="157" cy="116" rx="6" ry="10" fill={skinShadow} />

        {/* Head */}
        <rect
          x="85"
          y="72"
          width="70"
          height="84"
          rx="32"
          fill={skinTone}
          stroke="#091D12"
          strokeWidth="1.5"
        />

        {/* Hair / Headwear */}
        {hasFieldCap ? (
          <g>
            <path
              d="M 82 95 C 82 64, 158 64, 158 95 Z"
              fill="#14452F"
              stroke="#091D12"
              strokeWidth="1.5"
            />
            <path d="M 80 94 Q 120 86 168 96 Q 130 102 80 94 Z" fill="#0D2818" />
            <circle cx="120" cy="78" r="4" fill="#9FD1B5" />
          </g>
        ) : (
          <path
            d="M 83 102 C 82 64, 158 64, 157 102 C 145 84, 102 84, 83 102 Z"
            fill="#1C221F"
          />
        )}

        {/* Eyebrows & Eyes */}
        <g stroke="#1C221F" strokeLinecap="round">
          <path d="M 97 105 Q 104 102 111 105" strokeWidth="2.4" fill="none" />
          <path d="M 129 105 Q 136 102 143 105" strokeWidth="2.4" fill="none" />
        </g>
        <circle cx="104" cy="114" r="3.2" fill="#111A15" />
        <circle cx="136" cy="114" r="3.2" fill="#111A15" />
        <circle cx="105" cy="113" r="1" fill="#FFFFFF" />
        <circle cx="137" cy="113" r="1" fill="#FFFFFF" />

        {/* Optional Glasses */}
        {hasGlasses && (
          <g fill="none" stroke="#0D2818" strokeWidth="2">
            <rect x="93" y="107" width="22" height="14" rx="3.5" fill="rgba(255,255,255,0.08)" />
            <rect x="125" y="107" width="22" height="14" rx="3.5" fill="rgba(255,255,255,0.08)" />
            <line x1="115" y1="113" x2="125" y2="113" />
          </g>
        )}

        {/* Nose & Confident Calm Expression */}
        <path
          d="M 120 115 L 118 128 L 123 129"
          fill="none"
          stroke={skinShadow}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 110 138 Q 120 144 130 138"
          fill="none"
          stroke="#6E4433"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Field Radio Headset Microphone for Coastal/Northern */}
        {(archetype === 'coastal' || archetype === 'northern') && (
          <g>
            <rect x="77" y="108" width="6" height="15" rx="3" fill="#091D12" />
            <path
              d="M 80 121 Q 92 142 107 142"
              fill="none"
              stroke="#091D12"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="108" cy="142" r="2.8" fill="#8FB39E" />
          </g>
        )}
      </svg>
    </div>
  );
}
