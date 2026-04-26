import pg from 'pg';

async function checkDb() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT id, programme FROM projet ORDER BY id DESC LIMIT 5');
    console.log('Recent projects in DB:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error connecting to DB:', err);
  } finally {
    await pool.end();
  }
}

checkDb();
