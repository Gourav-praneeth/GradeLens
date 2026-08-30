import type { Metadata } from "next";
import { IBM_Plex_Mono, Libre_Franklin, Source_Serif_4 } from "next/font/google";
import { AppSidebar } from "@/components/AppSidebar";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const franklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-franklin",
});

const literata = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-literata",
});

const plex = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "GradeLens",
  description: "Upload questions and solutions, generate a rubric, and grade with explained deductions.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${franklin.variable} ${literata.variable} ${plex.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {user ? (
          <div className="app-shell">
            <AppSidebar user={user} />
            <div className="min-w-0 flex-1">
              <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8">{children}</main>
            </div>
          </div>
        ) : (
          <main className="min-h-screen px-4">{children}</main>
        )}
      </body>
    </html>
  );
}
