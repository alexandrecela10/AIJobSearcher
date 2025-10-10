"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface JobResult {
  company: string;
  careersUrl: string;
  status: "success" | "no_matches" | "error";
  message?: string;
  jobs: Array<{
    job: {
      title: string;
      location: string;
      description: string;
      url: string;
    };
    customizedCv: string;
    cvChanges: string[];
  }>;
}

export default function Step5Page() {
  const [results, setResults] = useState<JobResult[]>([]);
  const [criteria, setCriteria] = useState<any>(null);
  const [email, setEmail] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load job results from Step 4
    const savedResults = localStorage.getItem("jobResults");
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    }

    // Load criteria from Step 4
    const savedSubmission = localStorage.getItem("selectedSubmission");
    if (savedSubmission) {
      const submission = JSON.parse(savedSubmission);
      setCriteria({
        roles: submission.roles,
        seniority: submission.seniority,
        cities: submission.cities,
        visa: submission.visa
      });
      setEmail(submission.email || "");
    }
  }, []);

  async function sendEmail() {
    if (!email) {
      setError("Email address is required");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          criteria,
          results
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  }

  const successfulMatches = results.filter(r => r.status === "success");
  const totalJobs = successfulMatches.reduce((sum, r) => sum + r.jobs.length, 0);

  return (
    <main className="container-sleek py-12">
      <header className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Step 5: Send Results</h1>
            <p className="mt-2 text-slate-300">Review and email your job matches with customized CVs</p>
          </div>
          <Link href="/step4" className="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition">
            ← Back to Step 4
          </Link>
        </div>
      </header>

      {results.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-400">No job results found. Please complete Step 4 first.</p>
          <Link href="/step4" className="btn-primary mt-4">
            Go to Step 4
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Card */}
          <section className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Email Summary</h2>
            
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="label">Send to Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-900/20 border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400">{successfulMatches.length}</div>
                  <div className="text-sm text-slate-300">Companies</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-400">{totalJobs}</div>
                  <div className="text-sm text-slate-300">Job Matches</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-900/20 border border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-400">{totalJobs}</div>
                  <div className="text-sm text-slate-300">Customized CVs</div>
                </div>
              </div>

              {/* Search Criteria */}
              {criteria && (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Your Search Criteria</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-400">Roles:</span>
                      <span className="ml-2 text-slate-200">{criteria.roles?.join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Seniority:</span>
                      <span className="ml-2 text-slate-200">{criteria.seniority}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Cities:</span>
                      <span className="ml-2 text-slate-200">{criteria.cities?.join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Visa:</span>
                      <span className="ml-2 text-slate-200">{criteria.visa ? "Required" : "Not required"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Send Button */}
              {!sent ? (
                <button
                  onClick={sendEmail}
                  disabled={sending || !email}
                  className="btn-primary w-full"
                >
                  {sending ? "Sending..." : `📧 Send ${totalJobs} Job Matches to Email`}
                </button>
              ) : (
                <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/30 text-center">
                  <p className="text-green-300 font-semibold">✅ Email sent successfully!</p>
                  <p className="text-sm text-slate-300 mt-1">Check your inbox at {email}</p>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30">
                  <p className="text-red-300">{error}</p>
                </div>
              )}
            </div>
          </section>

          {/* Preview of Results */}
          <section className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Email Preview</h2>
            <div className="space-y-4">
              {successfulMatches.map((result, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <h3 className="font-semibold text-slate-200 mb-2">{result.company}</h3>
                  <div className="space-y-2">
                    {result.jobs.map((jobData, jobIdx) => (
                      <div key={jobIdx} className="pl-4 border-l-2 border-brand-500">
                        <p className="text-sm font-medium text-slate-300">{jobData.job.title}</p>
                        <p className="text-xs text-slate-400">{jobData.job.location}</p>
                        <a
                          href={jobData.job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-400 hover:text-brand-300"
                        >
                          View Job ↗
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
