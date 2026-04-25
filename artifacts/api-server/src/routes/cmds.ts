import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { requireAuth, requireRole, logHistorique, ADMIN_ROLES, MANAGER_ROLES } from "../lib/auth";

const router: IRouter = Router();

// Helper: get region name by ID
async function getRegionName(regionId: number | null): Promise<string | null> {
  if (!regionId) return null;
  const result = await query(`SELECT nom_region FROM region WHERE id = $1`, [regionId]);
  if (result.rows.length === 0) return null;
  return result.rows[0].nom_region;
}

// GET /cmds - List all CMDs with region info
router.get("/cmds", requireAuth, async (_req, res): Promise<void> => {
  const result = await query(
    `SELECT c.id, c.nom_cmd, c.nom_region, r.id as id_region
     FROM cmd c
     LEFT JOIN region r ON c.nom_region = r.nom_region
     ORDER BY c.nom_cmd`
  );
  res.json(result.rows);
});

// GET /cmds/:id - Get single CMD
router.get("/cmds/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(
    `SELECT c.id, c.nom_cmd, c.nom_region, r.id as id_region
     FROM cmd c
     LEFT JOIN region r ON c.nom_region = r.nom_region
     WHERE c.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "CMD non trouvée" });
    return;
  }
  res.json(result.rows[0]);
});

// POST /cmds - Create new CMD
router.post("/cmds", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  try {
    const { nom_cmd, id_region } = req.body;
    const userId = req.session.user?.id ?? null;

    if (!nom_cmd) {
      res.status(400).json({ error: "Le nom de la CMD est requis" });
      return;
    }

    const nom_region = await getRegionName(id_region || null);

    const result = await query(
      `INSERT INTO cmd (nom_cmd, nom_region, id_user)
       VALUES ($1, $2, $3)
       RETURNING id, nom_cmd, nom_region`,
      [nom_cmd, nom_region, userId]
    );

    const newCmd = result.rows[0];
    // Also attach id_region in response
    const regionRow = await query(`SELECT id FROM region WHERE nom_region = $1`, [newCmd.nom_region]);
    const response = {
      ...newCmd,
      id_region: regionRow.rows.length > 0 ? regionRow.rows[0].id : null
    };

    await logHistorique(
      query as Parameters<typeof logHistorique>[0],
      "CREATION",
      req.session.user?.id ?? null,
      "cmd",
      newCmd.id,
      `Création de la CMD: ${nom_cmd}`
    );

    res.status(201).json(response);
  } catch (error) {
    console.error("Erreur creation CMD:", error);
    res.status(500).json({ error: "Erreur lors de la création de la CMD" });
  }
});

// PATCH /cmds/:id - Update CMD
router.patch("/cmds/:id", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const { nom_cmd, id_region } = req.body;

  const nom_region = id_region !== undefined ? await getRegionName(id_region || null) : undefined;

  const setClauses: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (nom_cmd !== undefined) {
    setClauses.push(`nom_cmd = $${idx++}`);
    params.push(nom_cmd);
  }
  if (nom_region !== undefined) {
    setClauses.push(`nom_region = $${idx++}`);
    params.push(nom_region);
  }

  if (setClauses.length === 0) {
    res.status(400).json({ error: "Aucun champ à modifier" });
    return;
  }

  params.push(id);
  const updated = await query(
    `UPDATE cmd SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING id, nom_cmd, nom_region`,
    params
  );

  if (updated.rows.length === 0) {
    res.status(404).json({ error: "CMD non trouvée" });
    return;
  }

  const updatedCmd = updated.rows[0];
  // Resolve id_region
  const regionRow = await query(`SELECT id FROM region WHERE nom_region = $1`, [updatedCmd.nom_region]);
  const response = {
    ...updatedCmd,
    id_region: regionRow.rows.length > 0 ? regionRow.rows[0].id : null
  };

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "MODIFICATION",
    req.session.user?.id ?? null,
    "cmd",
    id,
    `Modification de la CMD id=${id}`
  );

  res.json(response);
});

// DELETE /cmds/:id - Delete CMD
router.delete("/cmds/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(`DELETE FROM cmd WHERE id = $1 RETURNING id`, [id]);

  if (result.rows.length === 0) {
    res.status(404).json({ error: "CMD non trouvée" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "SUPPRESSION",
    req.session.user?.id ?? null,
    "cmd",
    id,
    `Suppression de la CMD id=${id}`
  );

  res.sendStatus(204);
});

export default router;
