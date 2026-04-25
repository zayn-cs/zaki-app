import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { requireAuth, requireRole, logHistorique, MANAGER_ROLES, PROJECT_ROLES } from "../lib/auth";

const router: IRouter = Router();

router.get("/phases", requireAuth, async (req, res): Promise<void> => {
  const { id_lot } = req.query;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (id_lot) {
    conditions.push(`ph.id_lot = $${idx++}`);
    params.push(parseInt(id_lot as string, 10));
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(
    `SELECT ph.id as id_phase, ph.nome_phase, ph.date_debut, ph.date_fin,
            ph.id_user, ph.id_lot,
            CONCAT(u.prenom, ' ', u.nom) as nom_responsable,
            l.nom_lot
     FROM phase ph
     LEFT JOIN utilisateur u ON u.id = ph.id_user
     LEFT JOIN lot l ON l.id = ph.id_lot
     ${where}
     ORDER BY ph.id DESC`,
    params
  );
  res.json(result.rows);
});

router.post("/phases", requireAuth, requireRole(...PROJECT_ROLES), async (req, res): Promise<void> => {
  const { nome_phase, date_debut, date_fin, id_user, id_lot } = req.body;

  if (!nome_phase) {
    res.status(400).json({ error: "Nom de la phase requis" });
    return;
  }

  const result = await query(
    `INSERT INTO phase (nome_phase, date_debut, date_fin, id_user, id_lot)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id as id_phase`,
    [nome_phase, date_debut || null, date_fin || null, id_user || null, id_lot || null]
  );

  const newId = result.rows[0].id_phase as number;

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "CREATION",
    req.session.user?.id ?? null,
    "phase",
    newId,
    `Création de la phase: ${nome_phase}`
  );

  const full = await query(
    `SELECT ph.id as id_phase, ph.nome_phase, ph.date_debut, ph.date_fin,
            ph.id_user, ph.id_lot,
            CONCAT(u.prenom, ' ', u.nom) as nom_responsable,
            l.nom_lot
     FROM phase ph
     LEFT JOIN utilisateur u ON u.id = ph.id_user
     LEFT JOIN lot l ON l.id = ph.id_lot
     WHERE ph.id = $1`,
    [newId]
  );
  res.status(201).json(full.rows[0]);
});

router.get("/phases/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(
    `SELECT ph.id as id_phase, ph.nome_phase, ph.date_debut, ph.date_fin,
            ph.id_user, ph.id_lot,
            CONCAT(u.prenom, ' ', u.nom) as nom_responsable,
            l.nom_lot
     FROM phase ph
     LEFT JOIN utilisateur u ON u.id = ph.id_user
     LEFT JOIN lot l ON l.id = ph.id_lot
     WHERE ph.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Phase non trouvée" });
    return;
  }
  res.json(result.rows[0]);
});

router.patch("/phases/:id", requireAuth, requireRole(...PROJECT_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const { nome_phase, date_debut, date_fin, id_user, id_lot } = req.body;

  const updated = await query(
    `UPDATE phase SET
      nome_phase = COALESCE($1, nome_phase),
      date_debut = COALESCE($2, date_debut),
      date_fin = COALESCE($3, date_fin),
      id_user = COALESCE($4, id_user),
      id_lot = COALESCE($5, id_lot)
     WHERE id = $6`,
    [nome_phase, date_debut, date_fin, id_user, id_lot, id]
  );

  if (updated.rowCount === 0) {
    res.status(404).json({ error: "Phase non trouvée" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "MODIFICATION",
    req.session.user?.id ?? null,
    "phase",
    id,
    `Modification de la phase id=${id}`
  );

  const result = await query(
    `SELECT ph.id as id_phase, ph.nome_phase, ph.date_debut, ph.date_fin,
            ph.id_user, ph.id_lot,
            CONCAT(u.prenom, ' ', u.nom) as nom_responsable,
            l.nom_lot
     FROM phase ph
     LEFT JOIN utilisateur u ON u.id = ph.id_user
     LEFT JOIN lot l ON l.id = ph.id_lot
     WHERE ph.id = $1`,
    [id]
  );
  res.json(result.rows[0]);
});

router.delete("/phases/:id", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(`DELETE FROM phase WHERE id = $1 RETURNING id`, [id]);

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Phase non trouvée" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "SUPPRESSION",
    req.session.user?.id ?? null,
    "phase",
    id,
    `Suppression de la phase id=${id}`
  );

  res.sendStatus(204);
});

export default router;
