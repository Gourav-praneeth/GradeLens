import Link from "next/link";
import { CourseForm } from "@/components/CourseForm";

export default function NewCoursePage() {
  return (
    <div className="page-wrap space-y-5">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-ink hover:underline">
          Courses
        </Link>
        <h1 className="mt-2 font-read text-3xl font-semibold tracking-tight">Add course</h1>
        <p className="mt-1 text-sm text-muted">Set the name, code, and semester. Add students and staff after you open the course.</p>
      </div>
      <section className="card px-5 py-6 sm:px-8">
        <CourseForm />
      </section>
    </div>
  );
}
