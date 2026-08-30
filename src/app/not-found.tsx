import Link from "next/link";

export default function NotFound() {
  return (
    <section className="card px-6 py-12 sm:px-10">
      <p className="text-lg font-semibold">Page not found</p>
      <p className="mt-2 text-sm text-muted">That assignment or submission is not in GradeLens.</p>
      <div className="mt-5">
        <Link href="/" className="btn btn-primary">
          Back to assignments
        </Link>
      </div>
    </section>
  );
}
