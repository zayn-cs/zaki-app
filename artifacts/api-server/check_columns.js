import pg from 'pg';

async function checkColumns() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'utilisateur'
    `);
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkColumns();
