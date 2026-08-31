type IconName =
  | "overview"
  | "assignments"
  | "roster"
  | "grades"
  | "calendar"
  | "analytics"
  | "staff"
  | "settings"
  | "help"
  | "feedback"
  | "inbox"
  | "account"
  | "signout"
  | "panel";

export function RailIcon({ name }: { name: IconName }) {
  return (
    <svg className="rail-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      {name === "overview" ? (
        <>
          <rect x="4" y="4" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13" y="4" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="4" y="13" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13" y="13" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </>
      ) : null}
      {name === "assignments" ? (
        <>
          <rect x="6" y="5" width="12" height="15" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 9h6M9 12.5h6M9 16h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : null}
      {name === "roster" ? (
        <>
          <circle cx="9" cy="9" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5 18c.4-2.4 2.2-3.6 4-3.6s3.6 1.2 4 3.6M14.2 16.4c.9-1.2 2.2-1.8 3.5-1.8 1.4 0 2.6.7 3.1 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : null}
      {name === "grades" ? (
        <>
          <rect x="4" y="5" width="16" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 10h16M10 5v14" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </>
      ) : null}
      {name === "calendar" ? (
        <>
          <rect x="4" y="6" width="16" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 4v4M16 4v4M4 11h16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : null}
      {name === "analytics" ? (
        <path d="M5 18V11M10 18V7M15 18v-5M20 18V8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ) : null}
      {name === "staff" ? (
        <>
          <circle cx="12" cy="8" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6.5 19c.6-3 2.6-4.5 5.5-4.5s4.9 1.5 5.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : null}
      {name === "settings" ? (
        <>
          <circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 4.5v2.2M12 17.3v2.2M4.5 12h2.2M17.3 12h2.2M6.6 6.6l1.6 1.6M15.8 15.8l1.6 1.6M6.6 17.4l1.6-1.6M15.8 8.2l1.6-1.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : null}
      {name === "help" ? (
        <>
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9.4 9.4a2.6 2.6 0 1 1 3.4 3.3c-.7.4-1.1 1-.1 1.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="17.2" r="0.8" fill="currentColor" />
        </>
      ) : null}
      {name === "feedback" ? (
        <>
          <path d="M5 6.5h14v10.2H9.2L5 20.2V6.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8.5 10.2h7M8.5 13.4h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : null}
      {name === "inbox" ? (
        <>
          <path d="M4.5 8h15v11h-15z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M4.5 8 12 13.5 19.5 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </>
      ) : null}
      {name === "account" ? (
        <>
          <circle cx="12" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6 19.2c.7-3.2 2.8-4.7 6-4.7s5.3 1.5 6 4.7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : null}
      {name === "signout" ? (
        <path d="M10 5H7.5A1.5 1.5 0 0 0 6 6.5v11A1.5 1.5 0 0 0 7.5 19H10M10 12h9M16 8.5 19.5 12 16 15.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      {name === "panel" ? (
        <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </svg>
  );
}

export const railIconFor: Record<string, IconName> = {
  overview: "overview",
  assignments: "assignments",
  roster: "roster",
  grades: "grades",
  calendar: "calendar",
  analytics: "analytics",
  staff: "staff",
  settings: "settings",
};
