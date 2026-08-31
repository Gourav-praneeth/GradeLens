import { CourseSidebar } from "@/components/CourseSidebar";

export function CourseWorkspace({
  course,
  isAdmin = false,
  children,
}: {
  course: { id: string; name: string; code: string | null; accent: string };
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="course-workspace">
      <CourseSidebar course={course} isAdmin={isAdmin} />
      <div className="min-w-0 flex-1">
        <div className="page-wrap">{children}</div>
      </div>
    </div>
  );
}
