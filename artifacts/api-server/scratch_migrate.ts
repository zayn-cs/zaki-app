import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function migrate() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log("🐘 Connecting to database...");
    const client = await pool.connect();
    
    console.log("🔍 Checking columns in 'projet' table...");
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projet' AND column_name IN ('zone', 'block')
    `);
    
    const existingColumns = res.rows.map(r => r.column_name);
    
    if (!existingColumns.includes('zone')) {
      console.log("➕ Adding 'zone' column...");
      await client.query("ALTER TABLE projet ADD COLUMN zone TEXT");
    } else {
      console.log("✅ 'zone' column already exists.");
    }
    
    if (!existingColumns.includes('block')) {
      console.log("➕ Adding 'block' column...");
      await client.query("ALTER TABLE projet ADD COLUMN block TEXT");
    } else {
      console.log("✅ 'block' column already exists.");
    }
    
    console.log("🎉 Migration complete!");
    client.release();
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
