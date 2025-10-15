# How to Access PostgreSQL Database

## 🔌 Method 1: Using Fly.io CLI (Easiest)

### Connect to Database
```bash
# Connect to the database
flyctl postgres connect --app job-searcher-db --database job_searcher

# You'll see:
# psql (17.2)
# Type "help" for help.
# job_searcher=#
```

### Useful SQL Commands

#### View All Tables
```sql
\dt
```

#### View Table Structure
```sql
\d submissions
\d job_results
```

#### View All Submissions
```sql
SELECT id, email, status, created_at FROM submissions;
```

#### View Job Results
```sql
SELECT company, job_title, submission_id FROM job_results;
```

#### Count Records
```sql
SELECT COUNT(*) FROM submissions;
SELECT COUNT(*) FROM job_results;
```

#### View Recent Submissions
```sql
SELECT * FROM submissions ORDER BY created_at DESC LIMIT 5;
```

#### View Jobs for a Specific Submission
```sql
SELECT * FROM job_results WHERE submission_id = 'YOUR-SUBMISSION-ID';
```

#### Delete Old Data (if needed)
```sql
-- Delete submissions older than 30 days
DELETE FROM submissions WHERE created_at < NOW() - INTERVAL '30 days';
```

#### Exit psql
```sql
\q
```

---

## 🔌 Method 2: Using a Database GUI Tool

### Option A: pgAdmin (Free, Popular)
1. Download: https://www.pgadmin.org/download/
2. Install and open
3. Right-click "Servers" → "Register" → "Server"
4. Fill in:
   - **Name:** Job Searcher DB
   - **Host:** job-searcher-db.flycast (won't work locally, need proxy)
   - **Port:** 5432
   - **Database:** job_searcher
   - **Username:** job_searcher
   - **Password:** v60512PVfJMA7Nu

**Note:** You'll need to set up a Fly.io proxy first (see Method 3)

### Option B: DBeaver (Free, Lightweight)
1. Download: https://dbeaver.io/download/
2. Similar setup as pgAdmin

### Option C: TablePlus (Paid, Beautiful UI)
1. Download: https://tableplus.com/
2. Similar setup

---

## 🔌 Method 3: Using Fly.io Proxy (For GUI Tools)

To connect from GUI tools, you need to create a proxy:

```bash
# Create a proxy to the database
flyctl proxy 5432 -a job-searcher-db

# Output:
# Proxying local port 5432 to remote [job-searcher-db.internal]:5432
```

Now in your GUI tool, use:
- **Host:** localhost
- **Port:** 5432
- **Database:** job_searcher
- **Username:** job_searcher
- **Password:** v60512PVfJMA7Nu

---

## 🔌 Method 4: From Your Next.js App (Already Set Up!)

This is what we're using in the code:

```typescript
import { query } from '@/lib/db';

// Read data
const result = await query('SELECT * FROM submissions WHERE id = $1', [submissionId]);
const submission = result.rows[0];

// Insert data
await query(
  'INSERT INTO submissions (id, email, companies) VALUES ($1, $2, $3)',
  [id, email, companies]
);

// Update data
await query(
  'UPDATE submissions SET status = $1 WHERE id = $2',
  ['completed', submissionId]
);

// Delete data
await query('DELETE FROM submissions WHERE id = $1', [submissionId]);
```

---

## 📊 Common Queries for Monitoring

### Check App Health
```sql
-- How many submissions today?
SELECT COUNT(*) FROM submissions WHERE created_at > CURRENT_DATE;

-- How many jobs found today?
SELECT COUNT(*) FROM job_results WHERE created_at > CURRENT_DATE;

-- Which companies have the most jobs?
SELECT company, COUNT(*) as job_count 
FROM job_results 
GROUP BY company 
ORDER BY job_count DESC 
LIMIT 10;

-- Average jobs per submission
SELECT AVG(job_count) FROM (
  SELECT submission_id, COUNT(*) as job_count 
  FROM job_results 
  GROUP BY submission_id
) as subquery;
```

### Check for Errors
```sql
-- Submissions that failed
SELECT * FROM submissions WHERE status = 'error';

-- Submissions stuck in processing
SELECT * FROM submissions 
WHERE status = 'processing' 
AND created_at < NOW() - INTERVAL '1 hour';
```

---

## 🔐 Security Notes

**⚠️ Important:**
- Never commit database passwords to git
- The password is stored in Fly.io secrets (safe)
- Only accessible from within Fly.io network or via proxy
- Use environment variables in code

**Database Credentials:**
```bash
# View secrets
flyctl secrets list --app job-searcher

# Output shows:
# DATABASE_URL (set, hidden)
```

---

## 🛠️ Maintenance Commands

### Backup Database
```bash
# Fly.io automatically creates snapshots
flyctl volumes list --app job-searcher-db

# Manual backup
flyctl postgres backup create --app job-searcher-db
```

### View Database Stats
```bash
flyctl postgres db list --app job-searcher-db
```

### Scale Database
```bash
# Upgrade to bigger machine
flyctl postgres update --vm-size dedicated-cpu-2x --app job-searcher-db

# Add more storage
flyctl volumes extend <volume-id> --size 10 --app job-searcher-db
```

---

## 🎓 Learning Resources

### SQL Basics
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [SQL for Data Analysts](https://mode.com/sql-tutorial/)

### Connection Pooling
- [Node.js pg Pool Documentation](https://node-postgres.com/features/pooling)
- [Why Connection Pooling Matters](https://www.prisma.io/dataguide/database-tools/connection-pooling)

---

## 🐛 Troubleshooting

### Can't Connect
```bash
# Check if database is running
flyctl status --app job-searcher-db

# Check logs
flyctl logs --app job-searcher-db
```

### Connection Timeout
```bash
# Restart database
flyctl machine restart <machine-id> --app job-searcher-db
```

### Out of Connections
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND state_change < NOW() - INTERVAL '5 minutes';
```
