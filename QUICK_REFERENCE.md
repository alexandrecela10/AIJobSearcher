# Quick Reference Card

## 🚀 Common Commands

### Access Database
```bash
# Connect to PostgreSQL
flyctl postgres connect --app job-searcher-db --database job_searcher

# Check database from code
npm run check-db
```

### Deploy App
```bash
flyctl deploy
```

### View Logs
```bash
flyctl logs
flyctl logs --app job-searcher-db  # Database logs
```

### Check Status
```bash
flyctl status
flyctl status --app job-searcher-db
```

---

## 📊 Useful SQL Queries

```sql
-- View all tables
\dt

-- Count submissions
SELECT COUNT(*) FROM submissions;

-- View recent submissions
SELECT * FROM submissions ORDER BY created_at DESC LIMIT 10;

-- View jobs for a submission
SELECT * FROM job_results WHERE submission_id = 'YOUR-ID';

-- Delete old data
DELETE FROM submissions WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## 🔧 Database Connection

### From Code
```typescript
import { query } from '@/lib/db';

// Read
const result = await query('SELECT * FROM submissions WHERE id = $1', [id]);

// Insert
await query('INSERT INTO submissions (id, email) VALUES ($1, $2)', [id, email]);

// Update
await query('UPDATE submissions SET status = $1 WHERE id = $2', ['completed', id]);
```

### Connection Pool Settings
- **Max connections:** 20
- **Idle timeout:** 30 seconds
- **Connection timeout:** 2 seconds

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `lib/db.ts` | Database connection pool |
| `db/schema.sql` | Database schema |
| `app/api/submit/route.ts` | Submit job search |
| `app/api/process-jobs/route.ts` | Auto-process jobs |
| `app/api/migrate/route.ts` | Run migrations |

---

## 🌐 URLs

- **App:** https://job-searcher.fly.dev/
- **Migration:** https://job-searcher.fly.dev/api/migrate (POST)
- **Monitoring:** https://fly.io/apps/job-searcher/monitoring

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect to DB | Check `flyctl status --app job-searcher-db` |
| App not responding | Check `flyctl logs` |
| Database full | Run cleanup queries |
| Too many connections | Increase pool size or close idle connections |

---

## 📚 Documentation

- `POSTGRESQL_MIGRATION.md` - Migration guide
- `MIGRATION_SUMMARY.md` - Complete summary
- `DATABASE_ACCESS.md` - How to access database
- `CONNECTION_POOL_EXPLAINED.md` - Connection pooling explained
- `QUICK_REFERENCE.md` - This file!
