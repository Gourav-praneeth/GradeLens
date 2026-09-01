import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { getCurrentUser } from "@/lib/auth";
import { HELP_SECTIONS } from "@/lib/helpContent";

export default async function HelpPage() {
  const user = await getCurrentUser();
  return (
    <div className={user ? "page-wrap space-y-5" : "min-h-screen bg-canvas px-4 py-10 sm:px-6"}>
      <div className={user ? "space-y-5" : "mx-auto w-full max-w-6xl space-y-5"}>
        {user ? null : <BrandMark />}
        <header className="help-hero">
          <p className="text-xs font-bold uppercase tracking-widest text-mark">GradeLens field guide</p>
          <h1 className="mt-2 font-read text-4xl font-semibold tracking-tight">What every field means</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Find what to enter, why GradeLens needs it, and who can change it—from account setup through final grade export.
          </p>
          {user ? null : (
            <Link href="/login" className="btn btn-primary mt-5">
              Sign in
            </Link>
          )}
        </header>

        <nav className="help-toc card" aria-label="Help topics">
          {HELP_SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </nav>

        <div className="space-y-5">
          {HELP_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="card scroll-mt-6 px-5 py-6 sm:px-7">
              <div className="max-w-3xl">
                <h2 className="font-read text-2xl font-semibold">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{section.summary}</p>
              </div>
              <div className="help-field-grid mt-5">
                {section.fields.map((field) => (
                  <article key={field.id} className="help-field">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">{field.label}</h3>
                      <span className={`help-requirement help-requirement-${field.requirement.toLowerCase()}`}>
                        {field.requirement}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{field.description}</p>
                    {field.example ? (
                      <p className="mt-3 whitespace-pre-line text-sm">
                        <span className="font-semibold">Example:</span> {field.example}
                      </p>
                    ) : null}
                    {field.details ? <p className="mt-3 border-l-2 border-line pl-3 text-xs leading-5 text-muted">{field.details}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
