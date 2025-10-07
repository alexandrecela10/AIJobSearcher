import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Searcher",
  description: "Match job listings and customize CVs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(90rem_50rem_at_80%_-10%,rgba(56,116,255,0.25),transparent),radial-gradient(60rem_30rem_at_-10%_20%,rgba(24,64,255,0.15),transparent)]" />
        {children}
      </body>
    </html>
  );
}
