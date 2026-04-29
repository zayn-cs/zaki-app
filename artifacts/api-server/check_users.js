import pg from 'pg';

async function checkUsers() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log("🐘 Connecting to database...");
    const client = await pool.connect();
    
    console.log("👥 Fetching users...");
    const res = await client.query(`SELECT id, messager, mot_pass, role FROM utilisateur`);
    console.table(res.rows);
    
    client.release();
  } catch (err) {
    console.error("❌ Failed to fetch users:", err);
  } finally {
    await pool.end();
  }
}

checkUsers();
