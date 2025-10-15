// Quick script to check database contents
import { Pool } from 'pg';

async function checkDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔍 Checking database...\n');
    
    // Check tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📊 Tables found:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    console.log('');
    
    // Count submissions
    const submissionsCount = await pool.query('SELECT COUNT(*) FROM submissions');
    console.log(`📝 Submissions: ${submissionsCount.rows[0].count}`);
    
    // Count job results
    const jobsCount = await pool.query('SELECT COUNT(*) FROM job_results');
    console.log(`💼 Job Results: ${jobsCount.rows[0].count}`);
    console.log('');
    
    // Show recent submissions
    const recent = await pool.query(`
      SELECT id, email, status, created_at 
      FROM submissions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (recent.rows.length > 0) {
      console.log('📋 Recent Submissions:');
      recent.rows.forEach(row => {
        console.log(`  - ${row.email} (${row.status}) - ${row.created_at}`);
      });
    } else {
      console.log('📋 No submissions yet');
    }
    
    console.log('\n✅ Database check complete!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
