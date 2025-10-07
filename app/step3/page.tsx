"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CareersUrl {
  company: string;
  careersUrl: string;
  confidence: string;
}

export default function Step3Page() {
  const [companies, setCompanies] = useState<string[]>([]);
  const [careersUrls, setCareersUrls] = useState<CareersUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Get companies from localStorage (saved from Step 2)
    const savedCompanies = localStorage.getItem("expandedCompanies");
    if (savedCompanies) {
      const parsed = JSON.parse(savedCompanies);
      setCompanies(parsed.allCompanies || []);
    }
  }, []);

  async function findCareersUrls() {
    if (companies.length === 0) {
      setError("No companies found. Please complete Step 2 first.");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const res = await fetch("/api/find-careers-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setCareersUrls(data.careersUrls);
      setProgress(100);

      // Save to localStorage for Step 4
      localStorage.setItem("careersUrls", JSON.stringify(data.careersUrls));

    } catch (err: any) {
      setError(err.message || "Failed to find careers URLs");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-sleek py-12">
      <header className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Step 3: Find Careers Pages</h1>
            <p className="mt-2 text-slate-300">Identify careers/jobs pages for all target companies.</p>
          </div>
          <Link href="/step2" className="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition">
            ← Back to Step 2
          </Link>
        </div>
      </header>

      {companies.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-400">No companies found. Please complete Step 2 first.</p>
          <Link href="/step2" className="btn-primary mt-4">
            Go to Step 2
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Companies Summary */}
          <section className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Companies to Process</h2>
            <div className="mb-4">
              <p className="text-slate-300">
                Found <span className="font-semibold text-brand-400">{companies.length}</span> companies from Step 2
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {companies.slice(0, 10).map((company, idx) => (
                <span key={idx} className="badge">{company}</span>
              ))}
              {companies.length > 10 && (
                <span className="badge bg-slate-700">+{companies.length - 10} more</span>
              )}
            </div>

            <button
              onClick={findCareersUrls}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? `Finding Careers URLs... (${progress}%)` : "🔍 Find Careers Pages"}
            </button>
          </section>

          {/* Error Display */}
          {error && (
            <div className="card p-4 border-red-500/50 bg-red-900/20">
              <p className="text-red-300">{error}</p>
              {error.includes("API key") && (
                <p className="text-sm text-red-400 mt-2">
                  Please set your OPENAI_API_KEY in .env.local
                </p>
              )}
            </div>
          )}

          {/* Results Display */}
          {careersUrls.length > 0 && (
            <section className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Careers Pages Found</h2>
              <div className="mb-4">
                <p className="text-slate-300">
                  Identified <span className="font-semibold text-brand-400">{careersUrls.length}</span> careers pages
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {careersUrls.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-200">{item.company}</h3>
                        <a
                          href={item.careersUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-brand-400 hover:text-brand-300 mt-1 inline-block"
                        >
                          {item.careersUrl} ↗
                        </a>
                      </div>
                      <span
                        className={`badge ${
                          item.confidence === "high"
                            ? "bg-green-800"
                            : item.confidence === "medium"
                            ? "bg-yellow-800"
                            : "bg-red-800"
                        }`}
                      >
                        {item.confidence} confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-4">
                <button className="btn-primary">
                  Continue to Step 4: Scrape Jobs →
                </button>
                <button
                  onClick={() => setCareersUrls([])}
                  className="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
                >
                  Try Again
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
