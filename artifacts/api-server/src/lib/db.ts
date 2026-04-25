import initSqlJs from "sql.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sqliteDb: any;
let pgPool: pg.Pool | null = null;
const DB_PATH = path.resolve(process.cwd(), "database.sqlite");

async function saveSQLite() {
  if (sqliteDb) {
    const data = sqliteDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// SQLite setup for local dev using sql.js
export const setupSQLite = async () => {
  const SQL = await initSqlJs({
    // Locate WASM file
    locateFile: (file) => {
      // Try local path first, then node_modules
      const possiblePaths = [
        path.resolve(__dirname, file),
        path.resolve(__dirname, "..", "..", "dist", file),
        path.resolve(process.cwd(), "node_modules", "sql.js", "dist", file)
      ];
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) return p;
      }
      // Fallback to CDN if not found locally
      return `https://sql.js.org/dist/${file}`;
    }
  });

  const fileBuffer = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null;
  const db = new SQL.Database(fileBuffer);

  if (!fileBuffer) {
    console.log("📂 Creating new database file...");
  }

  db.run(`CREATE TABLE IF NOT EXISTS departement (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, code TEXT)`);

  db.run(`CREATE TABLE IF NOT EXISTS utilisateur (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, prenom TEXT NOT NULL,
    messager TEXT NOT NULL UNIQUE, mot_pass TEXT NOT NULL, role TEXT NOT NULL,
    grade TEXT, adresse TEXT, telephone_professional TEXT, telephone_personnel TEXT,
    is_chef_project INTEGER DEFAULT 0,
    id_departement INTEGER REFERENCES departement(id),
    token TEXT, token_expiration TEXT)`);

  db.run(`CREATE TABLE IF NOT EXISTS bet (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nom_bet TEXT NOT NULL,
    adresse TEXT NOT NULL, nom_gerant TEXT NOT NULL,
    prenom_gerant TEXT NOT NULL, telephone_bet TEXT NOT NULL)`);

  db.run(`CREATE TABLE IF NOT EXISTS type_document (
    id INTEGER PRIMARY KEY AUTOINCREMENT, lib_type TEXT NOT NULL, allowed_formats TEXT)`);

  db.run(`CREATE TABLE IF NOT EXISTS type_phase (
    id INTEGER PRIMARY KEY AUTOINCREMENT, lib_type_phase TEXT NOT NULL,
    id_phase INTEGER REFERENCES phase(id))`);

  db.run(`CREATE TABLE IF NOT EXISTS projet (
    id INTEGER PRIMARY KEY AUTOINCREMENT, numero TEXT, pa TEXT, numero_op TEXT,
    programme TEXT, programme_a_realiser TEXT, situation_objectif TEXT, contrainte TEXT, stade TEXT,
    priorite TEXT, type TEXT, reference_priorite TEXT, montant_delegue REAL,
    montant_engagement REAL, montant_paiement REAL, delais INTEGER,
    debut_etude TEXT, fin_etude TEXT, essais TEXT, fin_prev TEXT,
    date_achevement TEXT, observation TEXT, interne TEXT,
    codification_cc TEXT, chef_projet INTEGER,
    id_bet INTEGER REFERENCES bet(id),
    id_unite INTEGER REFERENCES unite(id),
    id_user INTEGER REFERENCES utilisateur(id))`);

  db.run(`CREATE TABLE IF NOT EXISTS unite (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nom_unite TEXT NOT NULL, id_bet INTEGER,
    id_user INTEGER, id_cmd INTEGER,
    FOREIGN KEY (id_bet) REFERENCES bet(id),
    FOREIGN KEY (id_user) REFERENCES utilisateur(id),
    FOREIGN KEY (id_cmd) REFERENCES cmd(id))`);

  db.run(`CREATE TABLE IF NOT EXISTS cmd (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nom_cmd TEXT,
    nom_region TEXT, id_user INTEGER,
    FOREIGN KEY (id_user) REFERENCES utilisateur(id))`);

  db.run(`CREATE TABLE IF NOT EXISTS lot (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nom_lot TEXT NOT NULL,
    id_projet INTEGER REFERENCES projet(id),
    id_departement INTEGER REFERENCES departement(id),
    id_user INTEGER REFERENCES utilisateur(id))`);

  db.run(`CREATE TABLE IF NOT EXISTS phase (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nome_phase TEXT NOT NULL,
    date_debut TEXT, date_fin TEXT,
    id_lot INTEGER REFERENCES lot(id),
    id_user INTEGER REFERENCES utilisateur(id))`);

  db.run(`CREATE TABLE IF NOT EXISTS zone (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nom_zone TEXT NOT NULL)`);

  db.run(`CREATE TABLE IF NOT EXISTS document (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nom_doc TEXT NOT NULL, chemin TEXT,
    is_global INTEGER NOT NULL DEFAULT 0, date_creation TEXT DEFAULT (date('now')),
    id_phase INTEGER REFERENCES phase(id), commentaire TEXT, id_version INTEGER,
    id_projet INTEGER REFERENCES projet(id), id_type INTEGER REFERENCES type_document(id),
    statut TEXT DEFAULT 'actif', id_utilisateur INTEGER REFERENCES utilisateur(id))`);

  db.run(`CREATE TABLE IF NOT EXISTS version (
    id INTEGER PRIMARY KEY AUTOINCREMENT, numero_version INTEGER NOT NULL DEFAULT 1,
    date_modification TEXT DEFAULT (date('now')), fichier_path TEXT, commentaire TEXT,
    id_document INTEGER REFERENCES document(id) ON DELETE CASCADE)`);

  db.run(`CREATE TABLE IF NOT EXISTS region (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nom_region TEXT NOT NULL, chef_region TEXT NOT NULL)`);

  db.run(`CREATE TABLE IF NOT EXISTS historique (
    id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL,
    id_utilisateur INTEGER, entite_type TEXT, entite_id INTEGER,
    commentaire TEXT, timestamp TEXT DEFAULT (datetime('now')))`);

  db.run(`CREATE TABLE IF NOT EXISTS document_tag (
    id_document INTEGER REFERENCES document(id),
    id_tag INTEGER REFERENCES tag(id),
    PRIMARY KEY (id_document, id_tag))`);

  db.run(`CREATE TABLE IF NOT EXISTS tag (
    id INTEGER PRIMARY KEY AUTOINCREMENT, lib_tag TEXT NOT NULL, description TEXT)`);

  try {
    db.run("ALTER TABLE tag ADD COLUMN description TEXT");
  } catch (e) {
    // Ignore if column already exists
  }

  db.run(`CREATE TABLE IF NOT EXISTS projet_tag (
    id_projet INTEGER REFERENCES projet(id),
    id_tag INTEGER REFERENCES tag(id),
    PRIMARY KEY (id_projet, id_tag))`);

  sqliteDb = db;
  return db;
};

export const initSchema = async () => {
  if (process.env.DATABASE_URL) {
    pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    return;
  }
  return await setupSQLite();
};

export const query = async (text: string, params: any[] = []) => {
  if (pgPool) {
    return pgPool.query(text, params);
  }

  if (!sqliteDb) {
    await setupSQLite();
  }

  // Convert $1, $2, ... to ? for SQLite
  let sqliteSql = text.replace(/\$\d+/g, "?");
  
  // Convert ILIKE to LIKE for SQLite
  sqliteSql = sqliteSql.replace(/ILIKE/gi, "LIKE");
  
  if (text.trim().toUpperCase().startsWith("SELECT") || text.includes("RETURNING")) {
    const stmt = sqliteDb.prepare(sqliteSql);
    const rows: any[] = [];
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return { rows, rowCount: rows.length };
  } else {
    sqliteDb.run(sqliteSql, params);
    // Persist changes to disk
    await saveSQLite();
    return { 
      rows: [], 
      rowCount: sqliteDb.getRowsModified(),
      lastInsertRowid: undefined
    };
  }
};

export type DatabaseType = any;
export { sqliteDb as Database };


