export type HelpField = {
  id: string;
  label: string;
  requirement: "Required" | "Optional" | "Automatic";
  description: string;
  example?: string;
  details?: string;
};

export type HelpSection = {
  id: string;
  title: string;
  summary: string;
  fields: HelpField[];
};

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "accounts",
    title: "Accounts and sign-in",
    summary: "Create an account, sign in, recover access, and configure your personal grading provider.",
    fields: [
      {
        id: "account-name",
        label: "Name",
        requirement: "Required",
        description: "Your display name. Course owners see this name when they manage teaching staff.",
        example: "Jordan Lee",
      },
      {
        id: "account-email",
        label: "University email",
        requirement: "Required",
        description: "The email used to sign in, receive staff invitations, verify the account, and reset the password.",
        example: "jordan@university.edu",
      },
      {
        id: "account-password",
        label: "Password",
        requirement: "Required",
        description: "Protects your account and must contain at least eight characters.",
        details: "Use a unique password that you do not reuse on another service.",
      },
      {
        id: "account-invite-code",
        label: "Invite code",
        requirement: "Optional",
        description: "Allows registration when the site administrator has enabled a shared signup code.",
        details: "A TA already invited by email can leave this blank and register with the invited address.",
      },
      {
        id: "account-remember",
        label: "Remember me",
        requirement: "Optional",
        description: "Keeps the session signed in for longer on a trusted device.",
      },
      {
        id: "account-new-password",
        label: "New password",
        requirement: "Required",
        description: "Replaces the old password after opening a valid password-reset link.",
      },
      {
        id: "account-provider",
        label: "Provider",
        requirement: "Required",
        description: "Chooses which AI provider grades your submissions: Groq, OpenAI, or Anthropic.",
        details: "Each instructor and TA chooses and pays for their own provider unless a server fallback is configured.",
      },
      {
        id: "account-api-key",
        label: "API key",
        requirement: "Required",
        description: "A secret credential issued by the selected AI provider.",
        details: "The key is encrypted at rest and is never shown in full after saving. Removing it disables that personal provider key.",
      },
    ],
  },
  {
    id: "courses",
    title: "Courses",
    summary: "Describe an offering and give it a visual identity. Only the course instructor can change these settings.",
    fields: [
      {
        id: "course-name",
        label: "Course name",
        requirement: "Required",
        description: "The full title shown on the dashboard and throughout the course workspace.",
        example: "Software Engineering",
      },
      {
        id: "course-code",
        label: "Course code",
        requirement: "Optional",
        description: "The short catalog identifier used to recognize the course quickly.",
        example: "CSE 230",
      },
      {
        id: "course-semester",
        label: "Semester / year",
        requirement: "Optional",
        description: "The term for this specific offering, selected from Spring, Summer, Fall, or Winter.",
        example: "Fall 2026",
      },
      {
        id: "course-description",
        label: "Description",
        requirement: "Optional",
        description: "A short explanation of what this offering covers.",
      },
      {
        id: "course-color",
        label: "Course color",
        requirement: "Required",
        description: "A distinctive visual marker used on the dashboard card and course navigation.",
        details: "Color is only an aid; the course name and code remain visible for accessibility.",
      },
      {
        id: "course-status",
        label: "Status",
        requirement: "Required",
        description: "Active keeps the course in current use. Archived marks a completed offering without deleting its records.",
      },
    ],
  },
  {
    id: "roster",
    title: "Roster and teaching staff",
    summary: "Add students individually or in bulk, find roster entries, and invite a TA.",
    fields: [
      {
        id: "roster-student-name",
        label: "Student name",
        requirement: "Required",
        description: "The name used to match uploaded filenames and display grades.",
        example: "Alex Chen",
      },
      {
        id: "roster-student-id",
        label: "Student ID",
        requirement: "Optional",
        description: "The institution identifier used for sorting and LMS exports.",
        example: "1234567890",
      },
      {
        id: "roster-student-email",
        label: "Student email",
        requirement: "Optional",
        description: "An email stored with the roster profile for reference.",
      },
      {
        id: "roster-import",
        label: "Import students",
        requirement: "Required",
        description: "Adds several students at once, with one student name on each line.",
        example: "Alex Chen\nJordan Lee",
      },
      {
        id: "roster-search",
        label: "Search students",
        requirement: "Optional",
        description: "Filters the current roster by the text you enter.",
      },
      {
        id: "roster-sort",
        label: "Sort roster",
        requirement: "Optional",
        description: "Orders students by name or student ID without changing their records.",
      },
      {
        id: "staff-ta-email",
        label: "TA email",
        requirement: "Required",
        description: "Invites a teaching assistant or adds an existing GradeLens user to the course.",
        details: "TAs can work with course content but cannot change instructor-only course settings.",
      },
    ],
  },
  {
    id: "assignments",
    title: "Assignments and source material",
    summary: "Create an assignment and provide the questions and official solutions used to build its rubric.",
    fields: [
      {
        id: "assignment-title",
        label: "Title",
        requirement: "Required",
        description: "The assignment name shown in lists and grade exports.",
        example: "Assignment 1",
      },
      {
        id: "assignment-course",
        label: "Course",
        requirement: "Required",
        description: "The course that owns the assignment, roster, rubric, and grades.",
      },
      {
        id: "assignment-description",
        label: "Short description",
        requirement: "Optional",
        description: "A brief summary shown on the assignment list.",
      },
      {
        id: "assignment-due",
        label: "Due date",
        requirement: "Optional",
        description: "The local date and time when student work is due.",
      },
      {
        id: "assignment-questions-text",
        label: "Questions",
        requirement: "Optional",
        description: "Paste the assignment questions as selectable text.",
        details: "Provide pasted text or attach a question file.",
      },
      {
        id: "assignment-questions-file",
        label: "Questions file",
        requirement: "Optional",
        description: "A PDF, TXT, or Markdown file containing assignment questions.",
        details: "Files are limited to 10 MB. Scanned PDFs without selectable text cannot be extracted.",
      },
      {
        id: "assignment-solutions-text",
        label: "Official solutions",
        requirement: "Optional",
        description: "Paste the authoritative solution the generated rubric should follow.",
        details: "Provide pasted text or attach a solution file.",
      },
      {
        id: "assignment-solutions-file",
        label: "Solutions file",
        requirement: "Optional",
        description: "A PDF, TXT, or Markdown file containing official solutions.",
        details: "Use selectable text and keep the file under 10 MB.",
      },
    ],
  },
  {
    id: "rubric",
    title: "Rubric",
    summary: "Define exactly how points are awarded before grading submissions.",
    fields: [
      {
        id: "rubric-criterion",
        label: "Criterion",
        requirement: "Required",
        description: "A concise name for one skill, answer part, or requirement being graded.",
        example: "Q1(a) — Processor comparison",
      },
      {
        id: "rubric-points",
        label: "Points",
        requirement: "Required",
        description: "The maximum score for the criterion, in half-point increments.",
        details: "The value must be at least 0.5.",
      },
      {
        id: "rubric-full-credit",
        label: "Full credit",
        requirement: "Required",
        description: "The evidence or reasoning a complete answer must contain.",
      },
    ],
  },
  {
    id: "grading",
    title: "Submissions and grading",
    summary: "Attach student work to the roster, run grading, and document instructor score changes.",
    fields: [
      {
        id: "submission-student",
        label: "Student on roster",
        requirement: "Optional",
        description: "Assigns uploads to a roster entry. Match from filename lets GradeLens infer the student automatically.",
      },
      {
        id: "submission-student-name",
        label: "Student name",
        requirement: "Required",
        description: "Labels a submission when there is no roster match.",
      },
      {
        id: "submission-files",
        label: "Files",
        requirement: "Required",
        description: "One or more student PDF, TXT, or Markdown submissions.",
        details: "Each file is limited to 10 MB and scanned PDFs require selectable text.",
      },
      {
        id: "grading-override-points",
        label: "Override points",
        requirement: "Required",
        description: "The instructor-selected score replacing the model score for one criterion.",
        details: "It must be between zero and the criterion maximum.",
      },
      {
        id: "grading-override-note",
        label: "Override note",
        requirement: "Required",
        description: "Records why a model-generated score was changed.",
        details: "A note is required whenever the score changes so the decision remains explainable.",
      },
    ],
  },
  {
    id: "feedback-exports",
    title: "Feedback, search, and exports",
    summary: "Find courses, report an issue privately, and choose an export destination.",
    fields: [
      {
        id: "dashboard-course-search",
        label: "Search courses",
        requirement: "Optional",
        description: "Filters courses by name, code, or semester.",
      },
      {
        id: "feedback-message",
        label: "Feedback message",
        requirement: "Required",
        description: "A private note to the GradeLens site administrator describing a problem or requested improvement.",
        details: "Messages must contain 10–4,000 characters. Other instructors and TAs cannot read them.",
      },
      {
        id: "feedback-page",
        label: "Current page",
        requirement: "Automatic",
        description: "GradeLens records the page where feedback was opened to help the administrator understand its context.",
      },
      {
        id: "export-format",
        label: "Export format",
        requirement: "Optional",
        description: "Choose GradeLens CSV, Canvas CSV, or Gradescope CSV based on where the grades will be used.",
        details: "Export links download data; they do not modify grades.",
      },
    ],
  },
];
