import { query } from './src/lib/db.js';

async function test() {
  const sql = `SELECT DISTINCT p.id as id_projet, 
            (SELECT json_group_array(json_object('id', t.id, 'lib_tag', t.lib_tag))
             FROM tag t JOIN projet_tag pt ON pt.id_tag = t.id WHERE pt.id_projet = p.id) as tags
     FROM projet p`;
     
  try {
    const res = await query(sql);
    console.log('Query successful! Rows:', res.rows.length);
  } catch (err) {
    console.error('Query failed:', err.message);
  }
}
test();
