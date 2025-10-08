"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Submission {
  id: string;
  createdAt: string;
  companies: string[];
  roles: string[];
  seniority: string;
  cities: string[];
  visa: boolean;
  templatePath: string;
}

interface ExpandedCompanies {
  originalCompanies: string[];
  suggestedCompanies: string[];
  allCompanies: string[];
  totalCount: number;
}

export default function Step2Page() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<ExpandedCompanies | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      setSubmissions(data);
      if (data.length > 0) {
        setSelectedSubmission(data[0]);
      }
    } catch (err) {
      setError("Failed to fetch submissions");
    }
  }

  async function expandCompanies() {
    if (!selectedSubmission) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/expand-companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companies: selectedSubmission.companies,
          roles: selectedSubmission.roles,
          seniority: selectedSubmission.seniority,
          cities: selectedSubmission.cities,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setExpandedCompanies(data);
      
      // Save to localStorage for Step 3 and Step 4
      localStorage.setItem("expandedCompanies", JSON.stringify(data));
      localStorage.setItem("selectedSubmission", JSON.stringify(selectedSubmission));

    } catch (err: any) {
      setError(err.message || "Failed to expand companies");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-sleek py-12">
      <header className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Step 2: Company Discovery</h1>
            <p className="mt-2 text-slate-300">Expand your target companies using AI-powered suggestions.</p>
          </div>
          <Link href="/" className="btn-primary">
            ← Back to Step 1
          </Link>
        </div>
      </header>

      {submissions.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-400">No submissions found. Please complete Step 1 first.</p>
          <Link href="/" className="btn-primary mt-4">
            Go to Step 1
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Submission Selection */}
          <section className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Select Submission</h2>
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    selectedSubmission?.id === submission.id
                      ? "border-brand-400 bg-brand-900/20"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {submission.companies.slice(0, 3).join(", ")}
                        {submission.companies.length > 3 && ` +${submission.companies.length - 3} more`}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        {submission.roles.join(", ")} • {submission.seniority} • {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="badge">{submission.companies.length} companies</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Selected Submission Details */}
          {selectedSubmission && (
            <section className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Current Search Criteria</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="label">Target Companies ({selectedSubmission.companies.length})</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSubmission.companies.map((company, idx) => (
                      <span key={idx} className="badge">{company}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="label">Target Roles</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSubmission.roles.map((role, idx) => (
                      <span key={idx} className="badge">{role}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="label">Seniority & Visa</h3>
                  <p className="mt-1 text-slate-200">
                    {selectedSubmission.seniority} • Visa: {selectedSubmission.visa ? "Required" : "Not required"}
                  </p>
                </div>
                <div>
                  <h3 className="label">Target Cities</h3>
                  <p className="mt-1 text-slate-200">{selectedSubmission.cities.join(", ")}</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={expandCompanies}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Expanding Companies..." : "🤖 Expand Companies with AI"}
                </button>
              </div>
            </section>
          )}

          {/* Error Display */}
          {error && (
            <div className="card p-4 border-red-500/50 bg-red-900/20">
              <p className="text-red-300">{error}</p>
              {error.includes("API key") && (
                <p className="text-sm text-red-400 mt-2">
                  Please set your OPENAI_API_KEY in a new file named .env.local
                </p>
              )}
            </div>
          )}

          {/* Expanded Companies Results */}
          {expandedCompanies && (
            <section className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Expanded Company List</h2>
              <div className="mb-4">
                <p className="text-slate-300">
                  Found <span className="font-semibold text-brand-400">{expandedCompanies.totalCount}</span> unique companies
                  ({expandedCompanies.originalCompanies.length} original + {expandedCompanies.suggestedCompanies.length} AI-suggested)
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="label mb-3">Original Companies</h3>
                  <div className="flex flex-wrap gap-2">
                    {expandedCompanies.originalCompanies.map((company, idx) => (
                      <span key={idx} className="badge bg-brand-800">{company}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="label mb-3">AI-Suggested Companies</h3>
                  <div className="flex flex-wrap gap-2">
                    {expandedCompanies.suggestedCompanies.map((company, idx) => (
                      <span key={idx} className="badge bg-green-800">{company}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <Link href="/step3" className="btn-primary">
                  Continue to Step 3: Find Careers Pages →
                </Link>
                <button 
                  onClick={() => setExpandedCompanies(null)}
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
