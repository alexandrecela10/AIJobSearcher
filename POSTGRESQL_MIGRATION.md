# PostgreSQL Migration Guide

## What Changed

We migrated from JSON file storage to PostgreSQL database for better data persistence and scalability.

### Before (JSON Files)
- Data stored in `/app/data/submissions.json`
- Lost on every deployment
- Required volumes (complex with multiple machines)

### After (PostgreSQL)
- Data stored in Fly.io PostgreSQL database
- Persists across deployments
- Works with multiple machines
- Better for production

---

## Database Setup

### 1. Created PostgreSQL Database
```bash
flyctl postgres create --name job-searcher-db --region lhr
```

**Credentials:**
- Database: `job_searcher`
- Connection: `postgres://job_searcher:v60512PVfJMA7Nu@job-searcher-db.flycast:5432/job_searcher`

### 2. Attached to App
```bash
flyctl postgres attach job-searcher-db --app job-searcher
```

This automatically set the `DATABASE_URL` secret.

---

## Database Schema

### Tables Created

#### `submissions` table
Stores user job search requests:
- `id` - UUID primary key
- `email` - User email
- `companies` - Array of company names
- `roles` - Array of job roles
- `seniority` - Seniority level
- `cities` - Array of cities
- `visa` - Visa sponsorship needed
- `frequency` - Update frequency
- `template_path` - Path to uploaded CV
- `status` - Processing status (pending/processing/completed)
- `created_at`, `updated_at`, `processed_at` - Timestamps

#### `job_results` table
Stores found jobs for each submission:
- `id` - Serial primary key
- `submission_id` - Foreign key to submissions
- `company` - Company name
- `careers_url` - Company careers page
- `job_title` - Job title
- `job_location` - Job location
- `job_description` - Job description
- `job_url` - Job posting URL
- `customized_cv` - AI-customized CV
- `cv_changes` - Array of changes made
- `created_at` - Timestamp

---

## How to Run Migration

### After Deployment:

1. **Visit the migration endpoint:**
   ```bash
   curl -X POST https://job-searcher.fly.dev/api/migrate
   ```

2. **Or use the browser:**
   - Open: https://job-searcher.fly.dev/api/migrate
   - Use a tool like Postman to send POST request

3. **Check the response:**
   ```json
   {
     "success": true,
     "message": "Database migration completed successfully",
     "tables": ["submissions", "job_results"]
   }
   ```

---

## Files Changed

### New Files
- `lib/db.ts` - Database connection pool
- `db/schema.sql` - Database schema
- `scripts/migrate.ts` - Migration script
- `app/api/migrate/route.ts` - Migration API endpoint

### Updated Files
- `app/api/submit/route.ts` - Now saves to PostgreSQL
- `app/api/process-jobs/route.ts` - Now reads from PostgreSQL
- `tsconfig.json` - Added path aliases
- `package.json` - Added pg and @types/pg

---

## Benefits

✅ **Data Persistence** - Data survives deployments
✅ **Scalability** - Works with multiple machines
✅ **Better Queries** - SQL is more powerful than JSON
✅ **Production Ready** - Industry standard approach
✅ **Backup & Recovery** - Fly.io handles backups

---

## Next Steps

1. ✅ Deploy the app
2. ⏳ Run the migration (`POST /api/migrate`)
3. ✅ Test job submission
4. ✅ Test auto-process

---

## Troubleshooting

### If migration fails:
```bash
# Connect to database
flyctl postgres connect --app job-searcher-db

# Run schema manually
\i /path/to/schema.sql
```

### Check database:
```bash
# List tables
flyctl postgres connect --app job-searcher-db --database job_searcher
\dt

# View submissions
SELECT * FROM submissions;
```
