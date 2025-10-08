"use client";

import { useState } from "react";

export default function HomePage() {
  // 🎯 STATE VARIABLES - Think of these as the app's memory
  // "submitting" remembers if we're currently sending data to the server
  // It starts as "false" (not submitting)
  const [submitting, setSubmitting] = useState(false);
  
  // "message" remembers what message to show the user
  // It starts as "null" (no message)
  const [message, setMessage] = useState<string | null>(null);

  // 📝 FORM SUBMISSION FUNCTION - This runs when the user clicks "Save & Continue"
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Step 1: Stop the page from refreshing (default browser behavior)
    e.preventDefault();
    
    // Step 2: Remember that we're now submitting (show "Submitting..." on button)
    setSubmitting(true);
    
    // Step 3: Clear any old messages
    setMessage(null);
    
    // Step 4: Get the form element (the whole form with all its fields)
    const form = e.currentTarget;
    
    // Step 5: Package all the form data (text fields, file uploads, etc.)
    // FormData is like putting everything in a box to send to the server
    const data = new FormData(form);

    // Step 6: Try to send the data to the server
    try {
      // Send the data to our server's "/api/submit" endpoint
      // "await" means "wait for the server to respond before continuing"
      const res = await fetch("/api/submit", {
        method: "POST",  // POST means "send data to the server"
        body: data,      // The box with all our form data
      });
      
      // Check if the server said "OK" or if there was an error
      if (!res.ok) throw new Error(await res.text());
      
      // Convert the server's response from JSON format to JavaScript
      const json = await res.json();
      
      // Show a success message with the submission ID
      setMessage(`Saved! Submission ID: ${json.id}`);
      
      // Clear all the form fields (make them empty again)
      form.reset();
      
    } catch (err: any) {
      // If something went wrong, show an error message
      setMessage(err?.message ?? "Failed to submit");
      
    } finally {
      // No matter what happened (success or error), stop showing "Submitting..."
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
