import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { requireAuth, requireRole, logHistorique, ADMIN_ROLES, MANAGER_ROLES } from "../lib/auth";

const router: IRouter = Router();

router.get("/types", requireAuth, async (req, res): Promise<void> => {
  const result = await query(`SELECT id, lib_type, allowed_formats FROM type_document ORDER BY lib_type`);
  res.json(result.rows);
});

router.post("/types", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  const { lib_type, allowed_formats } = req.body;
  if (!lib_type) {
    res.status(400).json({ error: "lib_type requis" });
    return;
  }
  const result = await query(
    `INSERT INTO type_document (lib_type, allowed_formats) VALUES ($1, $2) RETURNING id, lib_type, allowed_formats`,
    [lib_type, allowed_formats ? JSON.stringify(allowed_formats) : null]
  );
  res.status(201).json(result.rows[0]);
});

router.patch("/types/:id", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const { lib_type, allowed_formats } = req.body;
  if (!lib_type) {
    res.status(400).json({ error: "lib_type requis" });
    return;
  }
  const result = await query(
    `UPDATE type_document SET lib_type = $1, allowed_formats = $2 WHERE id = $3 RETURNING id, lib_type, allowed_formats`,
    [lib_type, allowed_formats ? JSON.stringify(allowed_formats) : null, id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Type non trouvé" });
    return;
  }
  res.json(result.rows[0]);
});

router.delete("/types/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const result = await query(`DELETE FROM type_document WHERE id = $1 RETURNING id`, [id]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Type non trouvé" });
    return;
  }
  res.json({ message: "Type supprimé" });
});

router.get("/historique", requireAuth, async (req, res): Promise<void> => {
  const result = await query(`
    SELECT h.*, u.nom, u.prenom
    FROM historique h
    LEFT JOIN utilisateur u ON h.id_utilisateur = u.id
    ORDER BY h.timestamp DESC
    LIMIT 100`
  );
  res.json(result.rows);
});

router.post("/historique", requireAuth, requireRole(...ADMIN_ROLES, ...MANAGER_ROLES), async (req, res): Promise<void> => {
  const { nom_table, id_ligne, operation, nouvelles_valeurs, anciennes_valeurs, id_utilisateur } = req.body;
  if (!nom_table || !id_ligne || !operation) {
    res.status(400).json({ error: "nom_table, id_ligne et operation requis" });
    return;
  }
  const result = await query(
    `INSERT INTO historique (nom_table, id_ligne, operation, nouvelles_valeurs, anciennes_valeurs, id_utilisateur)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [nom_table, id_ligne, operation, nouvelles_valeurs, anciennes_valeurs, id_utilisateur]
  );
  res.status(201).json(result.rows[0]);
});

router.get("/statistiques", requireAuth, async (req, res): Promise<void> => {
  const result = await query(`
    SELECT td.lib_type as label, COUNT(*) as count
    FROM document d
    JOIN type_document td ON td.id = d.id_type
    GROUP BY td.lib_type
  `);
  res.json(result.rows);
});

router.get("/zones", requireAuth, async (req, res): Promise<void> => {
  const result = await query("SELECT * FROM zone ORDER BY nom_zone");
  res.json(result.rows);
});

router.post("/zones", requireAuth, requireRole(...ADMIN_ROLES, ...MANAGER_ROLES), async (req, res): Promise<void> => {
  const { nom_zone } = req.body;
  if (!nom_zone) {
    res.status(400).json({ error: "nom_zone requis" });
    return;
  }
  const result = await query(
    `INSERT INTO zone (nom_zone) VALUES ($1) RETURNING *`,
    [nom_zone]
  );
  res.status(201).json(result.rows[0]);
});

router.delete("/zones/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const result = await query("DELETE FROM zone WHERE id = $1 RETURNING id", [id]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Zone non trouvée" });
    return;
  }
  res.json({ message: "Zone supprimée" });
});

router.get("/historique-stats", requireAuth, async (req, res): Promise<void> => {
  const result = await query(`
    SELECT nom_table, operation, COUNT(*) as count
    FROM historique
    GROUP BY nom_table, operation
    ORDER BY count DESC
  `);
  res.json(result.rows);
});

router.get("/type-phase", requireAuth, async (req, res): Promise<void> => {
  const result = await query(`
    SELECT tp.id, tp.lib_type_phase as lib_type, ph.nome_phase,
           tp.id_phase, tp.created_at, tp.updated_at
    FROM type_phase tp
    LEFT JOIN phase ph ON ph.id = tp.id_phase
    ORDER BY tp.lib_type_phase
  `);
  res.json(result.rows);
});

router.post("/type-phase", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  const { lib_type_phase, id_phase } = req.body;
  if (!lib_type_phase) {
    res.status(400).json({ error: "lib_type_phase requis" });
    return;
  }
  const result = await query(
    `INSERT INTO type_phase (lib_type_phase, id_phase) VALUES ($1, $2) RETURNING *`,
    [lib_type_phase, id_phase || null]
  );
  res.status(201).json(result.rows[0]);
});

router.get("/type-phases-stats", requireAuth, async (req, res): Promise<void> => {
  const result = await query(`
    SELECT tp.lib_type_phase as label, COUNT(*) as count
    FROM phase p
    JOIN type_phase tp ON tp.id_phase = p.id
    GROUP BY tp.lib_type_phase
    ORDER BY count DESC
  `);
  res.json(result.rows);
});

// GET /regions - List all regions
router.get("/regions", requireAuth, async (_req, res): Promise<void> => {
  const result = await query(`SELECT id, nom_region FROM region ORDER BY nom_region`);
  res.json(result.rows);
});

export default router;
