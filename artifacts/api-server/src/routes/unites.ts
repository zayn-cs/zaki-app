import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { requireAuth, requireRole, logHistorique, ADMIN_ROLES, MANAGER_ROLES } from "../lib/auth";

const router: IRouter = Router();

// Helper: find or create a CMD by name and region
async function findOrCreateCmd(nom_cmd: string, nom_region: string | null, userId: number): Promise<number> {
  // Try to find existing CMD by name and region
  const existing = await query(
    `SELECT id FROM cmd WHERE nom_cmd = $1 AND nom_region = $2`,
    [nom_cmd, nom_region]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  // Create new CMD
  const result = await query(
    `INSERT INTO cmd (nom_cmd, nom_region, id_user)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [nom_cmd, nom_region, userId]
  );
  return result.rows[0].id;
}

// GET /unites - List all units with their CMD and region info
router.get("/unites", requireAuth, async (_req, res): Promise<void> => {
  const result = await query(
    `SELECT u.id, u.nom_unite, u.id_cmd, c.nom_cmd, c.nom_region
     FROM unite u
     LEFT JOIN cmd c ON u.id_cmd = c.id
     ORDER BY u.nom_unite`
  );
  res.json(result.rows);
});

// GET /unites/:id - Get single unit
router.get("/unites/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(
    `SELECT u.id, u.nom_unite, u.id_cmd, c.nom_cmd, c.nom_region
     FROM unite u
     LEFT JOIN cmd c ON u.id_cmd = c.id
     WHERE u.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Unité non trouvée" });
    return;
  }
  res.json(result.rows[0]);
});

// POST /unites - Create new unit
router.post("/unites", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  try {
    const { nom_unite, nom_cmd, nom_region } = req.body;
    const userId = req.session.user?.id ?? 1;

    if (!nom_unite) {
      res.status(400).json({ error: "Le nom de l'unité est requis" });
      return;
    }

    let cmdId: number | null = null;
    if (nom_cmd) {
      cmdId = await findOrCreateCmd(nom_cmd, nom_region || null, userId);
    }

    const insertResult = await query(
      `INSERT INTO unite (nom_unite, id_cmd, id_user, id_bet)
       VALUES ($1, $2, $3, NULL)
       RETURNING id`,
      [nom_unite, cmdId, userId]
    );

    const newId = insertResult.rows[0].id;

    // Fetch the full record with join
    const full = await query(
      `SELECT u.id, u.nom_unite, u.id_cmd, c.nom_cmd, c.nom_region
       FROM unite u
       LEFT JOIN cmd c ON u.id_cmd = c.id
       WHERE u.id = $1`,
      [newId]
    );

    const newUnite = full.rows[0];

    await logHistorique(
      query as Parameters<typeof logHistorique>[0],
      "CREATION",
      req.session.user?.id ?? null,
      "unite",
      newUnite.id,
      `Création de l'unité: ${nom_unite}`
    );

    res.status(201).json(newUnite);
  } catch (error) {
    console.error("Erreur creation Unité:", error);
    res.status(500).json({ error: "Erreur lors de la création de l'unité" });
  }
});

// PATCH /unites/:id - Update unit
router.patch("/unites/:id", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const { nom_unite, nom_cmd, nom_region } = req.body;

  // Resolve cmd_id if nom_cmd provided
  let cmdId: number | null = null;
  if (nom_cmd !== undefined) {
    if (nom_cmd) {
      cmdId = await findOrCreateCmd(nom_cmd, nom_region || null, req.session.user?.id ?? 1);
    } else {
      cmdId = null;
    }
  }

  // Build update dynamically
  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (nom_unite !== undefined) {
    updates.push(`nom_unite = $${idx++}`);
    params.push(nom_unite);
  }
  if (nom_cmd !== undefined) {
    updates.push(`id_cmd = $${idx++}`);
    params.push(cmdId);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: "Aucun champ à modifier" });
    return;
  }

  params.push(id);
  await query(
    `UPDATE unite SET ${updates.join(", ")} WHERE id = $${idx}`,
    params
  );

  const updated = await query(
    `SELECT u.id, u.nom_unite, u.id_cmd, c.nom_cmd, c.nom_region
     FROM unite u
     LEFT JOIN cmd c ON u.id_cmd = c.id
     WHERE u.id = $1`,
    [id]
  );

  if (updated.rows.length === 0) {
    res.status(404).json({ error: "Unité non trouvée" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "MODIFICATION",
    req.session.user?.id ?? null,
    "unite",
    id,
    `Modification de l'unité id=${id}`
  );

  res.json(updated.rows[0]);
});

// DELETE /unites/:id - Delete unit
router.delete("/unites/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(`DELETE FROM unite WHERE id = $1 RETURNING id`, [id]);

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Unité non trouvée" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "SUPPRESSION",
    req.session.user?.id ?? null,
    "unite",
    id,
    `Suppression de l'unité id=${id}`
  );

  res.sendStatus(204);
});

export default router;
