import { type DatabaseType, query } from "./db";

export const seedDatabase = async (db: DatabaseType) => {
  // Check if already seeded
  const check = await query("SELECT COUNT(*) as count FROM utilisateur");
  if (Number(check.rows[0]?.count || 0) > 0) {
    console.log("⏩ Database already seeded. Skipping...");
    return;
  }

  console.log("🌱 Starting database seeding (minimal examples)...");

  // Clear existing data in correct order
  await query("DELETE FROM historique");
  await query("DELETE FROM document_tag");
  await query("DELETE FROM document");
  await query("DELETE FROM version");
  await query("DELETE FROM phase");
  await query("DELETE FROM lot");
  await query("DELETE FROM projet");
  await query("DELETE FROM unite");
  await query("DELETE FROM cmd");
  await query("DELETE FROM tag");
  await query("DELETE FROM region");
  await query("DELETE FROM bet");
  await query("DELETE FROM type_document");
  await query("DELETE FROM utilisateur");
  await query("DELETE FROM departement");
  await query("DELETE FROM sqlite_sequence");

  // ============================================
  // DEPARTEMENTS
  // ============================================
  await query(
    `INSERT INTO departement (nom, code) VALUES
      ('Direction Technique', 'DT'),
      ('Exploitation', 'EXP')`
  );

  // ============================================
  // UTILISATEURS
  // ============================================
  const passwordHash = '$2b$10$9J8LPUPfL7tTNUxz/dxK.eXUeDb3m5nbt.S6a6k5zVZtvyvaCBxzy'; // admin123
  await query(
    `INSERT INTO utilisateur (nom, prenom, messager, mot_pass, role, grade, id_departement) VALUES
      ('Admin', 'System', 'admin', $1, 'admin', 'Directeur', 1),
      ('Maameri', 'Rachid', 'r.maameri', $2, 'admin', 'Ingénieur', 1)`,
    [passwordHash, passwordHash]
  );

  // ============================================
  // BET
  // ============================================
  const betResults = await query(
    `INSERT INTO bet (nom_bet, adresse, nom_gerant, prenom_gerant, telephone_bet) VALUES
      ('Bureau Ingénierie Conseil', 'Alger', 'Maameri', 'Rachid', '021000000'),
      ('Etudes Hydrauliques SA', 'Oran', 'Cherifi', 'Amina', '041000000')
      RETURNING id`
  );
  const betIds = betResults.rows.map((row: any) => row.id);

  // ============================================
  // REGIONS & CMD
  // ============================================
  await query(`INSERT INTO region (nom_region, chef_region) VALUES ('Région Centre', 'M. BOUKHARI'), ('Région Ouest', 'M. MEKKI')`);
  const cmdResults = await query(
    `INSERT INTO cmd (nom_cmd, nom_region, id_user) VALUES ('CMD Alger', 'Région Centre', 1), ('CMD Oran', 'Région Ouest', 2) RETURNING id`
  );
  const cmdIds = cmdResults.rows.map((row: any) => row.id);

  // ============================================
  // UNITES
  // ============================================
  await query(
    `INSERT INTO unite (nom_unite, id_bet, id_user, id_cmd) VALUES 
      ('Unité Centre', $1, 1, $2), 
      ('Unité Ouest', $3, 2, $4)`,
    [betIds[0], cmdIds[0], betIds[1], cmdIds[1]]
  );

  // ============================================
  // PROJETS (Keep 2)
  // ============================================
  const projetResults = await query(
    `INSERT INTO projet (numero, pa, numero_op, programme, stade, priorite, type, montant_delegue, montant_engagement, chef_projet, id_bet, id_user) VALUES
      ('PROJ-001', 'PA-2024-001', 'OP-2024-001', 'Construction route nationale RN12', 'en cours', 'haute', 'infrastructure', 150000000, 120000000, 1, $1, 1),
      ('PROJ-002', 'PA-2024-002', 'OP-2024-002', 'Réhabilitation réseau hydraulique', 'planification', 'moyenne', 'hydraulique', 80000000, 24000000, 2, $2, 2)
      RETURNING id`,
    [betIds[0], betIds[1]]
  );
  const projetIds = projetResults.rows.map((row: any) => row.id);

  // ============================================
  // LOTS (2 per project)
  // ============================================
  const lotResults = await query(
    `INSERT INTO lot (nom_lot, id_projet, id_departement, id_user) VALUES
      ('Lot Terrassement', $1, 1, 1),
      ('Lot Revêtement', $1, 1, 2),
      ('Lot Conduites', $2, 2, 1),
      ('Lot Vannes', $2, 2, 2)
      RETURNING id`,
    [projetIds[0], projetIds[1]]
  );
  const lotIds = lotResults.rows.map((row: any) => row.id);

  // ============================================
  // PHASES (2 per lot)
  // ============================================
  await query(
    `INSERT INTO phase (nome_phase, date_debut, date_fin, id_lot, id_user) VALUES
      ('Étude', '2024-01-01', '2024-02-01', $1, 1),
      ('Travaux', '2024-02-02', '2024-06-01', $1, 2),
      ('Étude', '2024-01-01', '2024-02-01', $2, 1),
      ('Travaux', '2024-02-02', '2024-06-01', $2, 2)`,
    [lotIds[0], lotIds[1]]
  );
  const phaseResults = await query("SELECT id FROM phase");
  const phaseIds = phaseResults.rows.map((row: any) => row.id);

  // ============================================
  // TAGS
  // ============================================
  const tagResults = await query(`INSERT INTO tag (lib_tag) VALUES ('Prioritaire'), ('Environnement') RETURNING id`);
  const tagIds = tagResults.rows.map((row: any) => row.id);

  // ============================================
  // TYPE DOCUMENT
  // ============================================
  const typeResults = await query(
    `INSERT INTO type_document (lib_type, allowed_formats) VALUES
      ('Pièce graphique /plan(PDF/DWG)', '["PDF", "DWG"]'),
      ('Note de calcul(Word/exel)', '["Word", "exel"]'),
      ('Mémoire descriptif(Word/PDF)', '["Word", "PDF"]'),
      ('rapport geotechnique(PDF)', '["PDF"]'),
      ('descriptif technique (word)', '["word"]')
      RETURNING id`
  );
  const typeIds = typeResults.rows.map((row: any) => row.id);

  // ============================================
  // DOCUMENTS (2 per project)
  // ============================================
  const docResults = await query(
    `INSERT INTO document (nom_doc, chemin, id_phase, id_projet, id_type, id_utilisateur) VALUES
      ('Plan de situation', 'plan.pdf', $1, $2, $3, 1),
      ('Note technique', 'note.docx', $1, $2, $4, 2),
      ('Rapport APS', 'aps.pdf', $5, $6, $3, 1),
      ('Note de calcul', 'calcul.xlsx', $5, $6, $4, 2)
      RETURNING id`,
    [phaseIds[0], projetIds[0], typeIds[0], typeIds[1], phaseIds[2], projetIds[1]]
  );
  const docIds = docResults.rows.map((row: any) => row.id);

  // ============================================
  // VERSIONS
  // ============================================
  await query(
    `INSERT INTO version (numero_version, commentaire, id_document) VALUES (1, 'Version initiale', $1), (1, 'Version initiale', $2)`,
    [docIds[0], docIds[1]]
  );

  // ============================================
  // HISTORIQUE
  // ============================================
  await query(
    `INSERT INTO historique (action, id_utilisateur, entite_type, entite_id, commentaire, timestamp) VALUES
      ('CREATION', 1, 'projet', $1, 'Création projet 1', '2024-04-10 10:00:00'),
      ('CREATION', 2, 'projet', $2, 'Création projet 2', '2024-04-12 11:00:00')`,
    [projetIds[0], projetIds[1]]
  );

  console.log("✅ Database seeding completed with 2 examples per category!");
};
