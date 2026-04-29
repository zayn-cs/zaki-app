import pg from 'pg';
import bcrypt from 'bcryptjs';

async function testLogin() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const messager = 'admin';
    const mot_pass = 'Admin@1234';
    
    console.log(`🔍 Testing login for ${messager}...`);
    const client = await pool.connect();
    
    const result = await client.query(
      `SELECT u.id, u.nom, u.prenom, u.messager, u.mot_pass, u.role, u.grade, u.adresse,
              u.is_chef_project, u.id_departement, u.telephone_professional, u.telephone_personnel,
              d.nom as nom_departement
       FROM utilisateur u
       LEFT JOIN departement d ON d.id = u.id_departement
       WHERE u.messager = $1`,
      [messager]
    );
    
    if (result.rows.length === 0) {
      console.log("❌ User not found");
      return;
    }
    
    const user = result.rows[0];
    console.log("👤 User found:", { id: user.id, messager: user.messager, role: user.role });
    
    const storedPassword = user.mot_pass;
    let passwordMatch = false;
    
    if (storedPassword.startsWith("$2")) {
      console.log("🔐 Comparing bcrypt hash...");
      passwordMatch = await bcrypt.compare(mot_pass, storedPassword);
    } else {
      console.log("🔓 Comparing plain text...");
      passwordMatch = mot_pass === storedPassword;
    }
    
    console.log("🏁 Result:", passwordMatch ? "✅ SUCCESS" : "❌ FAILURE");
    
    client.release();
  } catch (err) {
    console.error("💥 CRASH:", err);
  } finally {
    await pool.end();
  }
}

testLogin();
