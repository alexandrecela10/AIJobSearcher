"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CareersUrl {
  company: string;
  careersUrl: string;
  confidence: string;
}

interface JobListing {
  title: string;
  location: string;
  description: string;
  url: string;
}

interface CompanyJobResult {
  company: string;
  careersUrl: string;
  status: "success" | "no_matches" | "error";
  message?: string;
  jobs: Array<{
    job: JobListing;
    customizedCv: string;
    cvChanges: string[];
  }>;
}

export default function Step4Page() {
  const [careersUrls, setCareersUrls] = useState<CareersUrl[]>([]);
  const [criteria, setCriteria] = useState<any>(null);
  const [templateCvPath, setTemplateCvPath] = useState<string>("");
  const [results, setResults] = useState<CompanyJobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    // Load data from localStorage
    const savedCareersUrls = localStorage.getItem("careersUrls");
    const savedSubmission = localStorage.getItem("selectedSubmission");
    
    if (savedCareersUrls) {
      setCareersUrls(JSON.parse(savedCareersUrls));
    }
    
    if (savedSubmission) {
      const submission = JSON.parse(savedSubmission);
      setCriteria({
        roles: submission.roles,
        seniority: submission.seniority,
        cities: submission.cities,
        visa: submission.visa
      });
      setTemplateCvPath(submission.templatePath);
    }
  }, []);

  async function scrapeJobs() {
    if (careersUrls.length === 0) {
      setError("No careers URLs found. Please complete Step 3 first.");
      return;
    }

    if (!criteria) {
      setError("No search criteria found. Please complete Step 1 first.");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: careersUrls.length });

    try {
      const res = await fetch("/api/scrape-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careersUrls,
          criteria,
          templateCvPath
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setResults(data.results);
      setProgress({ current: careersUrls.length, total: careersUrls.length });

      // Save to localStorage for Step 5
      localStorage.setItem("jobResults", JSON.stringify(data.results));

    } catch (err: any) {
      setError(err.message || "Failed to scrape jobs");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-sleek py-12">
      <header className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Step 4: Match Jobs & Customize CVs</h1>
            <p className="mt-2 text-slate-300">Find matching jobs and create tailored CVs for each position.</p>
          </div>
          <Link href="/step3" className="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition">
            ← Back to Step 3
          </Link>
        </div>
      </header>

      {careersUrls.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-400">No careers URLs found. Please complete Step 3 first.</p>
          <Link href="/step3" className="btn-primary mt-4">
            Go to Step 3
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary */}
          <section className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Processing Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-400">{careersUrls.length}</div>
                <div className="text-sm text-slate-400">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-300">{criteria?.roles?.length || 0}</div>
                <div className="text-sm text-slate-400">Target Roles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-300">{criteria?.cities?.length || 0}</div>
                <div className="text-sm text-slate-400">Cities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-300">{criteria?.seniority || "N/A"}</div>
                <div className="text-sm text-slate-400">Seniority</div>
              </div>
            </div>

            <button
              onClick={scrapeJobs}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading 
                ? `Processing... (${progress.current}/${progress.total} companies)` 
                : "🔍 Find Jobs & Customize CVs"}
            </button>
          </section>

          {/* Error Display */}
          {error && (
            <div className="card p-4 border-red-500/50 bg-red-900/20">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {results.length > 0 && (
            <section className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Results Overview</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-green-900/20 border border-green-500/30">
                    <div className="text-2xl font-bold text-green-400">
                      {results.filter(r => r.status === "success").length}
                    </div>
                    <div className="text-sm text-slate-300">Successful Matches</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                    <div className="text-2xl font-bold text-yellow-400">
                      {results.filter(r => r.status === "no_matches").length}
                    </div>
                    <div className="text-sm text-slate-300">No Matches</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-900/20 border border-red-500/30">
                    <div className="text-2xl font-bold text-red-400">
                      {results.filter(r => r.status === "error").length}
                    </div>
                    <div className="text-sm text-slate-300">Errors</div>
                  </div>
                </div>
              </div>

              {/* Company Results */}
              {results.map((result, idx) => (
                <div key={idx} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-200">{result.company}</h3>
                      <a
                        href={result.careersUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-400 hover:text-brand-300"
                      >
                        {result.careersUrl} ↗
                      </a>
                    </div>
                    <span
                      className={`badge ${
                        result.status === "success"
                          ? "bg-green-800"
                          : result.status === "no_matches"
                          ? "bg-yellow-800"
                          : "bg-red-800"
                      }`}
                    >
                      {result.status === "success" ? `${result.jobs.length} jobs found` : result.status}
                    </span>
                  </div>

                  {result.message && (
                    <p className="text-slate-400 mb-4">{result.message}</p>
                  )}

                  {/* Job Listings */}
                  {result.jobs.length > 0 && (
                    <div className="space-y-4 mt-4">
                      {result.jobs.map((jobData, jobIdx) => (
                        <div key={jobIdx} className="border border-slate-700 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-slate-200">{jobData.job.title}</h4>
                              <p className="text-sm text-slate-400">{jobData.job.location}</p>
                            </div>
                            <a
                              href={jobData.job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-brand-400 hover:text-brand-300"
                            >
                              View Job ↗
                            </a>
                          </div>

                          <p className="text-sm text-slate-300 mb-3">{jobData.job.description}</p>

                          {/* CV Changes */}
                          <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
                            <h5 className="text-sm font-semibold text-slate-300 mb-2">CV Customizations:</h5>
                            <ul className="space-y-1">
                              {jobData.cvChanges.map((change, changeIdx) => (
                                <li key={changeIdx} className="text-xs text-slate-400 flex items-start">
                                  <span className="text-brand-400 mr-2">•</span>
                                  {change}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Customized CV Preview */}
                          <details className="text-sm">
                            <summary className="cursor-pointer text-brand-400 hover:text-brand-300">
                              View Customized CV
                            </summary>
                            <pre className="mt-2 p-3 bg-slate-900 rounded text-xs text-slate-300 overflow-x-auto">
                              {jobData.customizedCv}
                            </pre>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Next Step Button */}
              <div className="card p-6">
                <Link href="/step5" className="btn-primary w-full text-center block">
                  Continue to Step 5: Send Results via Email →
                </Link>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
