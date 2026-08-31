import type { Metadata } from "next";
import { IBM_Plex_Mono, Libre_Franklin, Source_Serif_4 } from "next/font/google";
import { TopBar } from "@/components/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { isSiteOperator } from "@/lib/siteOperator";
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
  description: "A professional workspace for instructors to run courses and grade with explained deductions.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const isAdmin = user ? await isSiteOperator(user) : false;

  return (
    <html lang="en" className={`${franklin.variable} ${literata.variable} ${plex.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {user ? (
          <div className="app-shell">
            <TopBar user={user} isAdmin={isAdmin} search={{ action: "/", placeholder: "Search courses" }} />
            {children}
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
