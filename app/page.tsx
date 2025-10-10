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

  // "mode" remembers the current mode
  // It starts as "manual"
  const [mode, setMode] = useState<"manual" | "automated">("manual");

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
      
      // Check which mode was selected
      if (mode === "automated") {
        // Automated mode: Process everything in background and email results
        setMessage("🚀 Job search started! We're processing your request in the background. You'll receive an email at " + data.get("email") + " when we find matching jobs (typically 3-5 minutes).");
        
        // Trigger background processing (don't wait for it)
        fetch("/api/process-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId: json.id })
        }).catch(err => console.error("Background processing error:", err));
        
        // Clear form
        form.reset();
        
      } else {
        // Manual mode: Go to Step 2
        setMessage(`✅ Saved! Submission ID: ${json.id}`);
        
        // Save to localStorage for manual steps
        localStorage.setItem("selectedSubmission", JSON.stringify({
          id: json.id,
          companies: data.get("companies")?.toString().split(",").map(s => s.trim()),
          roles: data.get("roles")?.toString().split(",").map(s => s.trim()),
          seniority: data.get("seniority"),
          cities: data.get("cities")?.toString().split(",").map(s => s.trim()),
          email: data.get("email"),
          frequency: data.get("frequency"),
          visa: data.get("visa") === "yes",
          templatePath: `uploads/${json.id}`
        }));
        
        // Redirect to Step 2 after a short delay
        setTimeout(() => {
          window.location.href = "/step2";
        }, 1000);
      }
      
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
              <label className="label">Your Email</label>
              <input type="email" name="email" required className="input" placeholder="e.g. your.email@example.com" />
              <p className="mt-1 text-xs text-slate-400">We'll send your job matches and customized CVs here</p>
            </div>
            <div>
              <label className="label">Update Frequency</label>
              <select name="frequency" required className="input">
                <option value="once">Just Once (No recurring updates)</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <p className="mt-1 text-xs text-slate-400">How often should we search for new jobs and send updates?</p>
            </div>
            <div className="sm:col-span-2">
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-x-2">
              <span className="badge">Local Only</span>
              <span className="badge">AI-Powered</span>
            </div>
            <div className="flex gap-3">
              <button 
                type="submit" 
                onClick={() => setMode("manual")}
                className="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition disabled:opacity-50" 
                disabled={submitting}
              >
                {submitting && mode === "manual" ? "Saving..." : "Manual Steps →"}
              </button>
              <button 
                type="submit" 
                onClick={() => setMode("automated")}
                className="btn-primary" 
                disabled={submitting}
              >
                {submitting && mode === "automated" ? "Processing..." : "🚀 Auto-Process & Email"}
              </button>
            </div>
          </div>

          {message && (
            <div className={`mt-4 p-4 rounded-lg border ${
              message.includes("🚀") 
                ? "bg-green-900/20 border-green-500/30 text-green-300" 
                : message.includes("✅")
                ? "bg-blue-900/20 border-blue-500/30 text-blue-300"
                : "bg-red-900/20 border-red-500/30 text-red-300"
            }`}>
              <p className="font-medium">{message}</p>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
