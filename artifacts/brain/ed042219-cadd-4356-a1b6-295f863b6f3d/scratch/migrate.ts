import { query } from "../artifacts/api-server/src/lib/db";

async function migrate() {
  try {
    console.log("Adding description to tag...");
    await query("ALTER TABLE tag ADD COLUMN description TEXT");
    console.log("Success.");
  } catch (err) {
    console.log("Failed or already exists:", err.message);
  }
  
  try {
    console.log("Creating projet_tag table...");
    await query(`CREATE TABLE IF NOT EXISTS projet_tag (
      id_projet INTEGER REFERENCES projet(id),
      id_tag INTEGER REFERENCES tag(id),
      PRIMARY KEY (id_projet, id_tag))`);
    console.log("Success.");
  } catch (err) {
    console.log("Failed:", err.message);
  }
}

migrate();
