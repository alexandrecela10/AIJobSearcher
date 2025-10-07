"use client";

import { useState } from "react";

export default function HomePage() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        body: data,
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setMessage(`Saved! Submission ID: ${json.id}`);
      form.reset();
    } catch (err: any) {
      setMessage(err?.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container-sleek py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Targeted Job Search</h1>
        <p className="mt-2 text-slate-300">Enter your search criteria and upload your template CSV to get started.</p>
      </header>

      <section className="card p-6 sm:p-8">
        <form onSubmit={onSubmit} className="space-y-6" encType="multipart/form-data">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="label">Target Companies (comma-separated)</label>
              <textarea name="companies" rows={3} required className="input" placeholder="e.g. Whoop, Stripe, Revolut" />
            </div>
            <div>
              <label className="label">Target Roles (comma-separated)</label>
              <textarea name="roles" rows={3} required className="input" placeholder="e.g. Product Manager, Data Scientist" />
            </div>
            <div>
              <label className="label">Target Seniority</label>
              <select name="seniority" required className="input">
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
                <option value="Director">Director</option>
              </select>
            </div>
            <div>
              <label className="label">Target Cities (comma-separated)</label>
              <input name="cities" required className="input" placeholder="e.g. London, Paris, NYC" />
            </div>
            <div>
              <fieldset>
                <legend className="label">Visa Sponsorship</legend>
                <div className="mt-2 flex gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="visa" value="yes" className="text-brand-500" defaultChecked />
                    <span className="text-slate-200">Yes</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="visa" value="no" className="text-brand-500" />
                    <span className="text-slate-200">No</span>
                  </label>
                </div>
              </fieldset>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Upload Template Resume</label>
              <input type="file" name="template" accept=".doc,.docx,.pdf,.txt" required className="input file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200 file:px-3 file:py-2 hover:file:bg-slate-700" />
              <p className="mt-2 text-xs text-slate-400">DOC, DOCX, PDF, or TXT only. Max 2 MB. Do not upload sensitive personal data.</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-x-2">
              <span className="badge">Local Only</span>
              <span className="badge">Encrypted at rest (optional, later)</span>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Save & Continue"}
            </button>
          </div>

          {message && (
            <div className="mt-4 text-sm text-slate-200">
              {message}
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
