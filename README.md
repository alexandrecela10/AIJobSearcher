# Job Searcher (Step 1)

A Next.js 14 + Tailwind app to collect job search criteria and a template CSV. This is step one of the workflow: sleek form UI + secure CSV upload + local storage.

## Tech

- Next.js 14 (App Router)
- React 18
- Tailwind CSS + @tailwindcss/forms
- TypeScript

## What’s implemented

- Sleek dark UI in `app/page.tsx` using Tailwind.
- Form fields: `companies`, `roles`, `seniority`, `cities`, `visa`.
- CSV upload field `template` with 2MB limit and basic content checks.
- API route `app/api/submit/route.ts` to accept multipart form, validate, and store locally.
- Local persistence under `data/submissions.json` and CSV files saved to `uploads/`.
- Security headers via `next.config.mjs` and basic server-side validation.

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000

## Data storage

- Submissions are appended to `data/submissions.json`.
- CSV files are saved to `uploads/<id>.csv`.
- Both locations are ignored by Git (`.gitignore`).

## Notes on security & improvements

- Validate the CSV schema (headers/columns) once we finalize the expected template format.
- Consider encrypting uploads at rest (e.g., using libsodium) and moving storage to a secure bucket with server-managed KMS.
- Add rate limiting/CSRF protection (Next Middleware or a proxy like Vercel/Netlify edge). For now, this is assumed to be a trusted local environment.
- Add zod-based validation for stricter type-safe parsing of inputs.
- Add auth (even simple passcode) before accepting uploads if deployed publicly.

## Next steps (following your workflow)

- Step 2: Company discovery & deduplication service.
- Step 3: Careers URL enrichment & scraping strategy.
- Step 4: Matching logic & CV customization pipeline.
- Step 5: Results dashboard and export.
