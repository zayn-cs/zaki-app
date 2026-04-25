import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Note: Using the same logic as db.ts to find the db file
const dbPath = path.join(__dirname, "archivage.db");

async function check() {
  console.log("Checking database at:", dbPath);
  if (!fs.existsSync(dbPath)) {
    console.log("Database file NOT FOUND in root.");
    // Search for it
    return;
  }

  const SQL = await import('sql.js');
  const initSqlJs = SQL.default;
  const sqlInstance = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new sqlInstance.Database(fileBuffer);

  const res = db.exec("SELECT COUNT(*) as count FROM projet");
  console.log("Projet count result:", JSON.stringify(res));
  
  const resUsers = db.exec("SELECT COUNT(*) as count FROM utilisateur");
  console.log("Utilisateur count result:", JSON.stringify(resUsers));
}

check().catch(console.error);
