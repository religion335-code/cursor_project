export function GrillBowl({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="180" cy="300" rx="120" ry="18" fill="rgba(28,20,16,0.18)" />
      <path
        d="M70 168c8-70 48-118 110-118s102 48 110 118c4 32-18 48-54 56H124c-36-8-58-24-54-56z"
        fill="#f7f1e6"
      />
      <path
        d="M86 170c7-58 40-98 94-98s87 40 94 98c3 22-16 36-46 42H132c-30-6-49-20-46-42z"
        fill="#fffaf3"
      />
      <path
        d="M108 154c18-28 44-36 72-28 26 8 52 4 78-16-8 38-40 70-78 74-36 4-64-10-72-30z"
        fill="#9a3412"
      />
      <path
        d="M124 142c16-10 40-12 58-4 22 10 40 8 62-8-10 28-36 48-62 50-28 2-50-16-58-38z"
        fill="#c2410c"
      />
      <path
        d="M140 136c12 6 28 8 40 2 8 10 6 20-4 24-18 6-34-8-36-26z"
        fill="#ea580c"
        opacity="0.9"
      />
      <rect x="78" y="212" width="204" height="22" rx="4" fill="#5b3a24" />
      <rect x="70" y="228" width="220" height="58" rx="10" fill="#3d2914" />
      <rect x="70" y="228" width="220" height="14" rx="6" fill="#2a1b10" />
      <circle cx="118" cy="268" r="6" fill="#ea580c" />
      <circle cx="180" cy="274" r="5" fill="#f59e0b" />
      <circle cx="242" cy="268" r="6" fill="#c2410c" />
      <path d="M150 72c8-22 18-34 22-46" stroke="#d6d3d1" strokeWidth="6" strokeLinecap="round" />
      <path d="M188 68c2-20 12-36 14-50" stroke="#e7e5e4" strokeWidth="5" strokeLinecap="round" />
      <path d="M220 80c10-18 16-30 28-40" stroke="#d6d3d1" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
