import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="28" height="28">
          <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
          <path d="M13.2 21 V11.4 h4.1 c2.4 0 3.9 1.4 3.9 3.5 0 2.2-1.5 3.6-3.9 3.6 H15.4 V21 Z M15.4 16.8 h1.8 c1.2 0 1.9-.7 1.9-1.8 0-1.1-.7-1.8-1.9-1.8 h-1.8 Z" />
        </svg>
      </span>
      {compact ? <span className="sr-only">GradeLens</span> : <span className="brand-word">GradeLens</span>}
    </Link>
  );
}
