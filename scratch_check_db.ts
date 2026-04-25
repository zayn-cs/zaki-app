import { query } from "./artifacts/api-server/src/lib/db";

async function check() {
  try {
    const projets = await query("SELECT COUNT(*) as count FROM projet");
    console.log("Projets count:", projets.rows[0]);
    
    const documents = await query("SELECT COUNT(*) as count FROM document");
    console.log("Documents count:", documents.rows[0]);

    const lots = await query("SELECT COUNT(*) as count FROM lot");
    console.log("Lots count:", lots.rows[0]);

    const allProjets = await query("SELECT id, programme FROM projet LIMIT 5");
    console.log("First 5 projets:", allProjets.rows);
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
