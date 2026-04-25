import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { requireAuth, requireRole, logHistorique, ADMIN_ROLES, MANAGER_ROLES } from "../lib/auth";

const router: IRouter = Router();

router.get("/departements", requireAuth, async (req, res): Promise<void> => {
  const result = await query(
    `SELECT id, nom, code FROM departement ORDER BY nom`
  );
  res.json(result.rows);
});

router.post("/departements", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const { nom, code } = req.body;
  if (!nom) {
    res.status(400).json({ error: "Nom requis" });
    return;
  }

  const result = await query(
    `INSERT INTO departement (nom, code) VALUES ($1, $2) RETURNING id, nom, code`,
    [nom, code || ""]
  );

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "CREATION",
    req.session.user?.id ?? null,
    "departement",
    result.rows[0].id as number,
    `Création du département: ${nom}`
  );

  res.status(201).json(result.rows[0]);
});

router.get("/departements/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(
    `SELECT id, nom, code FROM departement WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Département non trouvé" });
    return;
  }

  res.json(result.rows[0]);
});

router.patch("/departements/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const { nom, code } = req.body;

  if (!nom) {
    res.status(400).json({ error: "Nom requis" });
    return;
  }

  const result = await query(
    `UPDATE departement SET nom = $1, code = $2 WHERE id = $3 RETURNING id, nom, code`,
    [nom, code || "", id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Département non trouvé" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "MODIFICATION",
    req.session.user?.id ?? null,
    "departement",
    id,
    `Modification du département: ${nom}`
  );

  res.json(result.rows[0]);
});

router.delete("/departements/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(
    `DELETE FROM departement WHERE id = $1 RETURNING id`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Département non trouvé" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "SUPPRESSION",
    req.session.user?.id ?? null,
    "departement",
    id,
    `Suppression du département id=${id}`
  );

  res.sendStatus(204);
});

export default router;
