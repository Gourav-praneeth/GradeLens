import Link from "next/link";

const TEAL = "#3db8a8";
const NAVY = "#1b2a41";

export function GradeLensMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 42.5 L8.5 53"
        stroke={TEAL}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M46.2 19.2 A16 16 0 1 0 17.2 39.4"
        stroke={TEAL}
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      <path
        d="M41.6 41.2 A16 16 0 0 0 46.2 19.2"
        stroke={NAVY}
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      <path
        d="M20.5 29.5 L27.2 37.2 L47 14"
        stroke={TEAL}
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand">
      <GradeLensMark />
      {compact ? (
        <span className="sr-only">GradeLens</span>
      ) : (
        <span className="brand-word">
          <span className="brand-grade">Grade</span>
          <span className="brand-lens">Lens</span>
        </span>
      )}
    </Link>
  );
}
