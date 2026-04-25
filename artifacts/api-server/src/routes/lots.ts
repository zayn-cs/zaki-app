import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { requireAuth, requireRole, logHistorique, MANAGER_ROLES, PROJECT_ROLES } from "../lib/auth";

const router: IRouter = Router();

router.get("/lots", requireAuth, async (req, res): Promise<void> => {
  const { id_projet, id_departement } = req.query;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (id_projet) {
    conditions.push(`l.id_projet = $${idx++}`);
    params.push(parseInt(id_projet as string, 10));
  }
  if (id_departement) {
    conditions.push(`l.id_departement = $${idx++}`);
    params.push(parseInt(id_departement as string, 10));
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(
    `SELECT l.id as id_lot, l.nom_lot, l.id_user, l.id_departement, l.id_projet,
            d.nom as nom_departement,
            CONCAT(u.prenom, ' ', u.nom) as nom_responsable,
            p.programme as nom_projet
     FROM lot l
     LEFT JOIN departement d ON d.id = l.id_departement
     LEFT JOIN utilisateur u ON u.id = l.id_user
     LEFT JOIN projet p ON p.id = l.id_projet
     ${where}
     ORDER BY l.id DESC`,
    params
  );
  res.json(result.rows);
});

router.post("/lots", requireAuth, requireRole(...PROJECT_ROLES), async (req, res): Promise<void> => {
  const { nom_lot, id_user, id_departement, id_projet } = req.body;

  if (!nom_lot) {
    res.status(400).json({ error: "Nom du lot requis" });
    return;
  }

  const result = await query(
    `INSERT INTO lot (nom_lot, id_user, id_departement, id_projet)
     VALUES ($1, $2, $3, $4)
     RETURNING id as id_lot`,
    [nom_lot, id_user || null, id_departement || null, id_projet || null]
  );

  const newId = result.rows[0].id_lot as number;

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "CREATION",
    req.session.user?.id ?? null,
    "lot",
    newId,
    `Création du lot: ${nom_lot}`
  );

  const full = await query(
    `SELECT l.id as id_lot, l.nom_lot, l.id_user, l.id_departement, l.id_projet,
            d.nom as nom_departement,
            CONCAT(u.prenom, ' ', u.nom) as nom_responsable,
            p.programme as nom_projet
     FROM lot l
     LEFT JOIN departement d ON d.id = l.id_departement
     LEFT JOIN utilisateur u ON u.id = l.id_user
     LEFT JOIN projet p ON p.id = l.id_projet
     WHERE l.id = $1`,
    [newId]
  );
  res.status(201).json(full.rows[0]);
});

router.get("/lots/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(
    `SELECT l.id as id_lot, l.nom_lot, l.id_user, l.id_departement, l.id_projet,
            d.nom as nom_departement,
            CONCAT(u.prenom, ' ', u.nom) as nom_responsable,
            p.programme as nom_projet
     FROM lot l
     LEFT JOIN departement d ON d.id = l.id_departement
     LEFT JOIN utilisateur u ON u.id = l.id_user
     LEFT JOIN projet p ON p.id = l.id_projet
     WHERE l.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Lot non trouvé" });
    return;
  }
  res.json(result.rows[0]);
});

router.patch("/lots/:id", requireAuth, requireRole(...PROJECT_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const { nom_lot, id_user, id_departement, id_projet } = req.body;

  const updated = await query(
    `UPDATE lot SET
      nom_lot = COALESCE($1, nom_lot),
      id_user = COALESCE($2, id_user),
      id_departement = COALESCE($3, id_departement),
      id_projet = COALESCE($4, id_projet)
     WHERE id = $5`,
    [nom_lot, id_user, id_departement, id_projet, id]
  );

  if (updated.rowCount === 0) {
    res.status(404).json({ error: "Lot non trouvé" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "MODIFICATION",
    req.session.user?.id ?? null,
    "lot",
    id,
    `Modification du lot id=${id}`
  );

  const result = await query(
    `SELECT l.id as id_lot, l.nom_lot, l.id_user, l.id_departement, l.id_projet,
            d.nom as nom_departement,
            CONCAT(u.prenom, ' ', u.nom) as nom_responsable,
            p.programme as nom_projet
     FROM lot l
     LEFT JOIN departement d ON d.id = l.id_departement
     LEFT JOIN utilisateur u ON u.id = l.id_user
     LEFT JOIN projet p ON p.id = l.id_projet
     WHERE l.id = $1`,
    [id]
  );
  res.json(result.rows[0]);
});

router.delete("/lots/:id", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(`DELETE FROM lot WHERE id = $1 RETURNING id`, [id]);

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Lot non trouvé" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "SUPPRESSION",
    req.session.user?.id ?? null,
    "lot",
    id,
    `Suppression du lot id=${id}`
  );

  res.sendStatus(204);
});

export default router;
