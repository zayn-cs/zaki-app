import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query(`
      ALTER TABLE utilisateur ALTER COLUMN nom DROP NOT NULL;
      ALTER TABLE utilisateur ALTER COLUMN prenom DROP NOT NULL;
      ALTER TABLE utilisateur ALTER COLUMN role SET DEFAULT 'chef_projet';
      ALTER TABLE utilisateur ALTER COLUMN role DROP NOT NULL;
    `);
    console.log("✅ Table utilisateur altered successfully");
  } catch (err) {
    console.error("❌ Error altering table:", err);
  } finally {
    await pool.end();
  }
}

run();
