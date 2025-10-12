import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

// This API endpoint runs the database migration
// Call it once after deployment to set up the database tables
export async function POST(req: Request) {
  try {
    console.log('🔄 Running database migration...');
    
    const pool = getPool();
    
    // Read the schema file
    const schemaPath = join(process.cwd(), 'db', 'schema.sql');
    const schema = await readFile(schemaPath, 'utf-8');
    
    // Execute the schema
    await pool.query(schema);
    
    console.log('✅ Database migration completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: "Database migration completed successfully",
      tables: ["submissions", "job_results"]
    });
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }), 
      { status: 500 }
    );
  }
}
