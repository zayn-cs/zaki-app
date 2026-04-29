import pg from 'pg';
import bcrypt from 'bcryptjs';

async function reset() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const hashed = await bcrypt.hash('admin123', 10);
    await pool.query("UPDATE utilisateur SET mot_pass = $1 WHERE messager = 'admin'", [hashed]);
    console.log("✅ Admin password reset to 'admin123'");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

reset();
