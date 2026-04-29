import pg from 'pg';
import bcrypt from 'bcryptjs';

async function testLogin() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const messager = 'admin';
    const passwords = ['Admin@1234', 'admin', 'password', '123456'];
    
    const client = await pool.connect();
    
    const result = await client.query(
      `SELECT mot_pass FROM utilisateur WHERE messager = $1`,
      [messager]
    );
    
    if (result.rows.length === 0) {
      console.log("❌ User not found");
      return;
    }
    
    const storedPassword = result.rows[0].mot_pass;
    console.log(`Stored hash for ${messager}: ${storedPassword}`);
    
    for (const mot_pass of passwords) {
      let passwordMatch = false;
      if (storedPassword.startsWith("$2")) {
        passwordMatch = await bcrypt.compare(mot_pass, storedPassword);
      } else {
        passwordMatch = mot_pass === storedPassword;
      }
      console.log(`Testing '${mot_pass}': ${passwordMatch ? "✅ MATCH" : "❌ NO"}`);
      if (passwordMatch) break;
    }
    
    client.release();
  } catch (err) {
    console.error("💥 CRASH:", err);
  } finally {
    await pool.end();
  }
}

testLogin();
