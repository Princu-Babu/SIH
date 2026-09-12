import React from 'react';

/**
 * Official State Emblem of India (Lion Capital of Ashoka with "सत्यमेव जयते")
 * Conforms to the State Emblem of India (Prohibition of Improper Use) Act, 2005
 * and GIGW 3.0 government branding guidelines.
 */
export default function StateEmblem({
  className = '',
  size = 'md',
  color = '#1e3a5f', // Official Ashoka Navy
  showMotto = true,
}) {
  const sizeMap = {
    xs: { width: 28, height: 36 },
    sm: { width: 36, height: 46 },
    md: { width: 48, height: 62 },
    lg: { width: 64, height: 82 },
    xl: { width: 80, height: 102 },
  };

  const dims = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`inline-flex flex-col items-center justify-center shrink-0 ${className}`}
      title="State Emblem of India | भारत का राज्य प्रतीक"
      aria-label="State Emblem of India"
    >
      <svg
        width={dims.width}
        height={dims.height}
        viewBox="0 0 160 205"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible select-none"
      >
        <defs>
          <filter id="emblemShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.12" />
          </filter>
        </defs>

        <g filter="url(#emblemShadow)">
          {/* ============================================================ */}
          {/* TOP LION CAPITAL - 3 VISIBLE LIONS (Center, Left, Right)     */}
          {/* ============================================================ */}

          {/* --- LEFT LION (Profile Facing Left) --- */}
          {/* Head & Mane */}
          <path
            d="M 45 42 C 38 32 30 25 24 32 C 18 39 19 50 25 58 C 21 62 17 68 18 75 C 19 82 25 87 32 89 C 34 94 38 100 45 104 C 47 98 48 90 47 82 Z"
            fill={color}
          />
          {/* Left Lion Snout & Jaw */}
          <path
            d="M 23 45 C 17 46 12 50 14 56 C 16 62 21 63 26 60 Z"
            fill={color}
          />
          {/* Left Lion Ear */}
          <path
            d="M 33 26 C 30 23 27 25 28 29 C 30 33 34 33 35 30 Z"
            fill={color}
          />

          {/* --- RIGHT LION (Profile Facing Right) --- */}
          {/* Head & Mane */}
          <path
            d="M 115 42 C 122 32 130 25 136 32 C 142 39 141 50 135 58 C 139 62 143 68 142 75 C 141 82 135 87 128 89 C 126 94 122 100 115 104 C 113 98 112 90 113 82 Z"
            fill={color}
          />
          {/* Right Lion Snout & Jaw */}
          <path
            d="M 137 45 C 143 46 148 50 146 56 C 144 62 139 63 134 60 Z"
            fill={color}
          />
          {/* Right Lion Ear */}
          <path
            d="M 127 26 C 130 23 133 25 132 29 C 130 33 126 33 125 30 Z"
            fill={color}
          />

          {/* --- CENTRAL LION (Facing Forward) --- */}
          {/* Main Crown & Mane Outlines */}
          <path
            d="M 52 28 C 52 14 62 8 80 8 C 98 8 108 14 108 28 C 115 28 122 35 120 46 C 118 55 111 60 108 64 C 112 72 110 83 103 91 C 98 97 92 101 80 102 C 68 101 62 97 57 91 C 50 83 48 72 52 64 C 49 60 42 55 40 46 C 38 35 45 28 52 28 Z"
            fill={color}
          />

          {/* Inner Mane Curls (Layered relief) */}
          <path
            d="M 80 14 C 73 14 68 18 67 25 C 73 23 79 23 80 28 C 81 23 87 23 93 25 C 92 18 87 14 80 14 Z"
            fill="#ffffff"
            opacity="0.25"
          />
          <path
            d="M 60 38 C 55 42 54 50 58 56 C 62 52 63 46 62 41 Z"
            fill="#ffffff"
            opacity="0.3"
          />
          <path
            d="M 100 38 C 105 42 106 50 102 56 C 98 52 97 46 98 41 Z"
            fill="#ffffff"
            opacity="0.3"
          />

          {/* Ears */}
          <path d="M 58 18 C 55 12 62 10 65 16 Z" fill={color} stroke="#ffffff" strokeWidth="1" />
          <path d="M 102 18 C 105 12 98 10 95 16 Z" fill={color} stroke="#ffffff" strokeWidth="1" />

          {/* Face Structure: Forehead, Brow & Nose Bridge */}
          <path
            d="M 68 28 C 73 26 87 26 92 28 C 94 34 91 42 90 48 C 86 46 74 46 70 48 C 69 42 66 34 68 28 Z"
            fill={color}
          />
          {/* Eyes */}
          <ellipse cx="73" cy="38" rx="3.5" ry="2.2" fill="#ffffff" />
          <circle cx="73" cy="38" r="1.5" fill={color} />
          <ellipse cx="87" cy="38" rx="3.5" ry="2.2" fill="#ffffff" />
          <circle cx="87" cy="38" r="1.5" fill={color} />

          {/* Snout & Whiskers Pad */}
          <path
            d="M 75 46 C 77 44 83 44 85 46 C 88 49 92 53 90 57 C 88 61 82 62 80 58 C 78 62 72 61 70 57 C 68 53 72 49 75 46 Z"
            fill="#ffffff"
            opacity="0.9"
          />
          {/* Nose */}
          <path d="M 77 46 L 83 46 L 80 50 Z" fill={color} />
          {/* Open Mouth & Fangs */}
          <path
            d="M 74 58 C 76 64 84 64 86 58 C 84 60 76 60 74 58 Z"
            fill={color}
          />
          {/* Chin & Beard Tufts */}
          <path
            d="M 76 65 C 78 69 82 69 84 65 C 83 71 77 71 76 65 Z"
            fill="#ffffff"
            opacity="0.8"
          />

          {/* Chest & Forelegs */}
          {/* Left Lion Chest */}
          <path
            d="M 38 88 C 42 96 48 104 54 110 L 48 116 C 40 108 34 98 32 89 Z"
            fill={color}
          />
          {/* Central Lion Chest & Paws */}
          <path
            d="M 58 92 C 64 84 74 82 80 82 C 86 82 96 84 102 92 C 104 100 101 110 98 116 L 62 116 C 59 110 56 100 58 92 Z"
            fill={color}
          />
          {/* Right Lion Chest */}
          <path
            d="M 122 88 C 118 96 112 104 106 110 L 112 116 C 120 108 126 98 128 89 Z"
            fill={color}
          />

          {/* Vertical Chest Grooves */}
          <line x1="72" y1="90" x2="70" y2="114" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" />
          <line x1="80" y1="86" x2="80" y2="114" stroke="#ffffff" strokeWidth="1.2" opacity="0.5" />
          <line x1="88" y1="90" x2="90" y2="114" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" />

          {/* ============================================================ */}
          {/* ABACUS / FRIEZE (Base platform with Chakra, Bull & Horse)    */}
          {/* ============================================================ */}

          {/* Upper Platform Rim */}
          <rect x="20" y="116" width="120" height="5" rx="1.5" fill={color} />

          {/* Middle Frieze Band */}
          <rect x="24" y="121" width="112" height="28" fill={color} />

          {/* Central Ashoka Chakra on Abacus */}
          <g transform="translate(80, 135)">
            <circle cx="0" cy="0" r="11" fill="#ffffff" />
            <circle cx="0" cy="0" r="9.5" fill="none" stroke={color} strokeWidth="1.2" />
            <circle cx="0" cy="0" r="2.2" fill={color} />
            {/* 24 Spokes */}
            {[...Array(24)].map((_, i) => (
              <line
                key={`spoke-${i}`}
                x1="0"
                y1="0"
                x2={9.5 * Math.cos((i * 15 * Math.PI) / 180)}
                y2={9.5 * Math.sin((i * 15 * Math.PI) / 180)}
                stroke={color}
                strokeWidth="0.75"
              />
            ))}
          </g>

          {/* Galloping Horse on the Left of Chakra */}
          <g transform="translate(42, 134) scale(0.65)">
            <path
              d="M -16 6 C -14 0 -10 -4 -4 -5 C -1 -9 4 -12 8 -10 C 11 -8 10 -4 7 -2 C 8 2 7 6 5 9 C 3 11 -2 11 -5 9 C -8 11 -12 11 -16 6 Z"
              fill="#ffffff"
            />
            {/* Horse Legs (Galloping stride) */}
            <path d="M 4 8 L 8 16 M -4 8 L -8 15 M 1 7 L 3 14 M -7 7 L -13 13" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            {/* Mane & Tail */}
            <path d="M -14 4 C -18 3 -21 7 -20 12" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </g>

          {/* Charging Bull on the Right of Chakra */}
          <g transform="translate(118, 134) scale(0.65)">
            <path
              d="M 16 5 C 13 -1 8 -4 2 -4 C -2 -7 -8 -7 -11 -4 C -13 -2 -12 2 -9 4 C -10 8 -8 11 -5 12 C 0 13 8 12 11 9 C 14 9 15 7 16 5 Z"
              fill="#ffffff"
            />
            {/* Bull Horns & Hump */}
            <path d="M -11 -4 C -13 -8 -9 -9 -8 -6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Bull Legs (Standing planted) */}
            <path d="M -6 10 L -6 16 M -2 10 L -1 16 M 6 9 L 6 16 M 11 8 L 12 16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            {/* Bull Tail */}
            <path d="M 15 4 C 18 6 17 12 16 15" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>

          {/* Lower Platform Rim & Steps */}
          <rect x="20" y="149" width="120" height="5" rx="1" fill={color} />
          <rect x="26" y="154" width="108" height="4" rx="1" fill={color} opacity="0.9" />
          <rect x="32" y="158" width="96" height="3" rx="1" fill={color} opacity="0.75" />

          {/* ============================================================ */}
          {/* NATIONAL MOTTO: सत्यमेव जयते (Satyameva Jayate)              */}
          {/* ============================================================ */}
          {showMotto && (
            <g transform="translate(80, 185)">
              {/* Devanagari Inscription: सत्यमेव जयते */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fill={color}
                fontSize="17.5"
                fontWeight="900"
                fontFamily="'Noto Sans Devanagari', 'Mangal', 'Yashomudra', 'Gargi', 'Devanagari MT', sans-serif"
                letterSpacing="1.2px"
              >
                सत्यमेव जयते
              </text>
              {/* Decorative underline */}
              <line x1="-36" y1="5" x2="36" y2="5" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
