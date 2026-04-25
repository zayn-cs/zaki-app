import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { query } from "../lib/db";
import { requireAuth, requireRole, logHistorique, MANAGER_ROLES, PROJECT_ROLES, ALL_ROLES } from "../lib/auth";

const uploadDir = process.env.UPLOAD_DIR || path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${timestamp}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const STATUT_ACTIF = "actif";
const STATUT_ARCHIVE = "archivé";

const router: IRouter = Router();

router.get("/documents", requireAuth, async (req, res): Promise<void> => {
  const { id_projet, id_lot, id_phase, statut } = req.query;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (id_projet) {
    conditions.push(`d.id_projet = $${idx++}`);
    params.push(parseInt(id_projet as string, 10));
  }
  if (id_lot) {
    conditions.push(`ph.id_lot = $${idx++}`);
    params.push(parseInt(id_lot as string, 10));
  }
  if (id_phase) {
    conditions.push(`d.id_phase = $${idx++}`);
    params.push(parseInt(id_phase as string, 10));
  }
  if (statut) {
    conditions.push(`d.statut = $${idx++}`);
    params.push(statut);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(
    `SELECT d.id as id_document, d.nom_doc, d.chemin, d.is_global,
            d.date_creation, d.id_phase, d.commentaire, d.id_version,
            d.id_projet, d.id_type, d.statut, d.id_utilisateur,
            td.lib_type as type_document,
            ph.nome_phase,
            CONCAT(u.prenom, ' ', u.nom) as nom_auteur,
            p.programme as nom_projet,
            v.numero_version, v.fichier_path, v.date_modification as date_version
     FROM document d
     LEFT JOIN type_document td ON td.id = d.id_type
     LEFT JOIN phase ph ON ph.id = d.id_phase
     LEFT JOIN utilisateur u ON u.id = d.id_utilisateur
     LEFT JOIN projet p ON p.id = d.id_projet
     LEFT JOIN version v ON v.id = d.id_version
     ${where}
     ORDER BY d.id DESC`,
    params
  );
  res.json(result.rows);
});

router.post("/documents", requireAuth, requireRole(...ALL_ROLES), async (req, res): Promise<void> => {
  const { nom_doc, is_global, id_phase, nom_phase, id_lot, commentaire, id_projet, id_type, type_name, id_utilisateur } = req.body;

  if (!nom_doc) {
    res.status(400).json({ error: "Nom du document requis" });
    return;
  }

  try {
    let finalTypeId = id_type || null;
    if (type_name) {
      const tRes = await query(`SELECT id FROM type_document WHERE lib_type ILIKE $1`, [type_name]);
      if (tRes.rows.length > 0) {
        finalTypeId = tRes.rows[0].id;
      } else {
        const nt = await query(`INSERT INTO type_document (lib_type) VALUES ($1) RETURNING id`, [type_name]);
        finalTypeId = nt.rows[0].id;
      }
    }

    let finalPhaseId = id_phase || null;
    if (id_lot && nom_phase) {
      const pRes = await query(`SELECT id FROM phase WHERE nome_phase = $1 AND id_lot = $2`, [nom_phase, id_lot]);
      if (pRes.rows.length > 0) {
        finalPhaseId = pRes.rows[0].id;
      } else {
        const np = await query(`INSERT INTO phase (nome_phase, id_lot) VALUES ($1, $2) RETURNING id`, [nom_phase, id_lot]);
        finalPhaseId = np.rows[0].id;
      }
    }

    const result = await query(
      `INSERT INTO document (nom_doc, is_global, id_phase, commentaire, id_projet, id_type, statut, id_utilisateur)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id as id_document`,
      [nom_doc, is_global ? 1 : 0, finalPhaseId, commentaire, id_projet || null,
       finalTypeId, STATUT_ACTIF, id_utilisateur || req.session.user?.id || null]
    );

    const newId = result.rows[0].id_document as number;

    await logHistorique(
      query as Parameters<typeof logHistorique>[0],
      "CREATION",
      req.session.user?.id ?? null,
      "document",
      newId,
      `Création du document: ${nom_doc}`
    );

    const full = await query(
      `SELECT d.id as id_document, d.nom_doc, d.chemin, d.is_global,
              d.date_creation, d.id_phase, d.commentaire, d.id_version,
              d.id_projet, d.id_type, d.statut, d.id_utilisateur,
              td.lib_type as type_document,
              COALESCE(u.prenom, '') || ' ' || COALESCE(u.nom, '') as nom_auteur
       FROM document d
       LEFT JOIN type_document td ON td.id = d.id_type
       LEFT JOIN utilisateur u ON u.id = d.id_utilisateur
       WHERE d.id = $1`,
      [newId]
    );
    res.status(201).json(full.rows[0]);
  } catch (error) {
    console.error("Erreur addition document:", error);
    res.status(500).json({ error: "Erreur lors de la création du document" });
  }
});

router.get("/documents/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(
    `SELECT d.id as id_document, d.nom_doc, d.chemin, d.is_global,
            d.date_creation, d.id_phase, d.commentaire, d.id_version,
            d.id_projet, d.id_type, d.statut, d.id_utilisateur,
            td.lib_type as type_document,
            ph.nome_phase,
            CONCAT(u.prenom, ' ', u.nom) as nom_auteur,
            p.programme as nom_projet
     FROM document d
     LEFT JOIN type_document td ON td.id = d.id_type
     LEFT JOIN phase ph ON ph.id = d.id_phase
     LEFT JOIN utilisateur u ON u.id = d.id_utilisateur
     LEFT JOIN projet p ON p.id = d.id_projet
     WHERE d.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Document non trouvé" });
    return;
  }
  res.json(result.rows[0]);
});

router.patch("/documents/:id", requireAuth, requireRole(...ALL_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const user = req.session.user!;
  const existing = await query(`SELECT id_utilisateur, statut FROM document WHERE id = $1`, [id]);

  if (existing.rows.length === 0) {
    res.status(404).json({ error: "Document non trouvé" });
    return;
  }

  const isAdminOrManager = MANAGER_ROLES.includes(user.role);
  const isOwner = (existing.rows[0] as Record<string, unknown>).id_utilisateur === user.id;

  if (!isAdminOrManager && !isOwner) {
    res.status(403).json({ error: "Vous ne pouvez modifier que vos propres documents" });
    return;
  }

  try {
    const { nom_doc, is_global, id_phase, nom_phase, id_lot, commentaire, id_projet, id_type, type_name, id_utilisateur } = req.body;

    let finalTypeId = id_type || undefined;
    if (type_name) {
      const tRes = await query(`SELECT id FROM type_document WHERE lib_type ILIKE $1`, [type_name]);
      if (tRes.rows.length > 0) {
        finalTypeId = tRes.rows[0].id;
      } else {
        const nt = await query(`INSERT INTO type_document (lib_type) VALUES ($1) RETURNING id`, [type_name]);
        finalTypeId = nt.rows[0].id;
      }
    }

    let finalPhaseId = id_phase || undefined;
    if (id_lot && nom_phase) {
      const pRes = await query(`SELECT id FROM phase WHERE nome_phase = $1 AND id_lot = $2`, [nom_phase, id_lot]);
      if (pRes.rows.length > 0) {
        finalPhaseId = pRes.rows[0].id;
      } else {
        const np = await query(`INSERT INTO phase (nome_phase, id_lot) VALUES ($1, $2) RETURNING id`, [nom_phase, id_lot]);
        finalPhaseId = np.rows[0].id;
      }
    }

    await query(
      `UPDATE document SET
        nom_doc = COALESCE($1, nom_doc),
        is_global = COALESCE($2, is_global),
        id_phase = COALESCE($3, id_phase),
        commentaire = COALESCE($4, commentaire),
        id_projet = COALESCE($5, id_projet),
        id_type = COALESCE($6, id_type),
        id_utilisateur = COALESCE($7, id_utilisateur)
       WHERE id = $8`,
      [nom_doc, is_global !== undefined ? (is_global ? 1 : 0) : undefined, finalPhaseId, commentaire, id_projet, finalTypeId, id_utilisateur, id]
    );

    await logHistorique(
      query as Parameters<typeof logHistorique>[0],
      "MODIFICATION",
      user.id,
      "document",
      id,
      `Modification du document id=${id}`
    );

    const result = await query(
      `SELECT d.id as id_document, d.nom_doc, d.chemin, d.is_global,
              d.date_creation, d.id_phase, d.commentaire, d.id_version,
              d.id_projet, d.id_type, d.statut, d.id_utilisateur,
              td.lib_type as type_document,
              COALESCE(u.prenom, '') || ' ' || COALESCE(u.nom, '') as nom_auteur
       FROM document d
       LEFT JOIN type_document td ON td.id = d.id_type
       LEFT JOIN utilisateur u ON u.id = d.id_utilisateur
       WHERE d.id = $1`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur modification document:", error);
    res.status(500).json({ error: "Erreur lors de la modification du document" });
  }
});

router.delete("/documents/:id", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(`DELETE FROM document WHERE id = $1 RETURNING id`, [id]);

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Document non trouvé" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "SUPPRESSION",
    req.session.user?.id ?? null,
    "document",
    id,
    `Suppression du document id=${id}`
  );

  res.sendStatus(204);
});

router.post("/documents/:id/upload", requireAuth, requireRole(...ALL_ROLES), upload.single("file"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const { commentaire } = req.body;

  if (!req.file) {
    res.status(400).json({ error: "Fichier requis" });
    return;
  }

  const docCheck = await query(`SELECT id, id_utilisateur FROM document WHERE id = $1`, [id]);
  if (docCheck.rows.length === 0) {
    res.status(404).json({ error: "Document non trouvé" });
    return;
  }

  const user = req.session.user!;
  const isManagerOrAdmin = MANAGER_ROLES.includes(user.role);
  const isOwner = (docCheck.rows[0] as Record<string, unknown>).id_utilisateur === user.id;

  if (!isManagerOrAdmin && !isOwner) {
    res.status(403).json({ error: "Vous n'êtes pas autorisé à uploader sur ce document" });
    return;
  }

  const filePath = req.file.filename;

  const versionResult = await query(
    `INSERT INTO version (numero_version, fichier_path, commentaire, id_document)
     VALUES ((SELECT COALESCE(MAX(v.numero_version), 0) + 1 FROM version v WHERE v.id_document = $1), $2, $3, $4)
     RETURNING id, numero_version, fichier_path, commentaire, date_modification`,
    [id, filePath, commentaire || null, id]
  );

  const version = versionResult.rows[0];

  await query(
    `UPDATE document SET chemin = $1, id_version = $2 WHERE id = $3`,
    [filePath, version.id, id]
  );

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "UPLOAD",
    req.session.user?.id ?? null,
    "document",
    id,
    `Upload version ${(version.numero_version as number)} du document id=${id}: ${req.file.originalname}`
  );

  res.status(201).json(version);
});

router.post("/documents/:id/archiver", requireAuth, requireRole(...PROJECT_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(
    `UPDATE document SET statut = $1 WHERE id = $2 RETURNING id, statut`,
    [STATUT_ARCHIVE, id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Document non trouvé" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "ARCHIVAGE",
    req.session.user?.id ?? null,
    "document",
    id,
    `Archivage du document id=${id}`
  );

  res.json(result.rows[0]);
});

router.post("/documents/:id/restaurer", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(
    `UPDATE document SET statut = $1 WHERE id = $2 RETURNING id, statut`,
    [STATUT_ACTIF, id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Document non trouvé" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "RESTAURATION",
    req.session.user?.id ?? null,
    "document",
    id,
    `Restauration du document id=${id}`
  );

  res.json(result.rows[0]);
});

router.get("/documents/:id/versions", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(
    `SELECT v.id as id_version, v.numero_version, v.date_modification, v.fichier_path, v.commentaire
     FROM version v
     WHERE v.id_document = $1
     ORDER BY v.numero_version DESC`,
    [id]
  );
  res.json(result.rows);
});

router.get("/documents/:id/download/:versionId", requireAuth, async (req, res): Promise<void> => {
  const rawVid = Array.isArray(req.params.versionId) ? req.params.versionId[0] : req.params.versionId;
  const versionId = parseInt(rawVid, 10);

  const vResult = await query(
    `SELECT fichier_path FROM version WHERE id = $1`,
    [versionId]
  );

  if (vResult.rows.length === 0) {
    res.status(404).json({ error: "Version non trouvée" });
    return;
  }

  const filePath = vResult.rows[0].fichier_path as string;
  const fullPath = path.join(uploadDir, filePath);

  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: "Fichier non trouvé sur le serveur" });
    return;
  }

  res.download(fullPath);
});

export default router;
