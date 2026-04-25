import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { requireAuth, requireRole, logHistorique, ADMIN_ROLES, MANAGER_ROLES } from "../lib/auth";

const router: IRouter = Router();

// GET /bet - List all BETs
router.get("/bet", requireAuth, async (_req, res): Promise<void> => {
  const result = await query(
    `SELECT b.id, b.nom_bet, b.adresse, b.nom_gerant, b.prenom_gerant, b.telephone_bet
     FROM bet b
     ORDER BY b.nom_bet`
  );
  res.json(result.rows);
});

// GET /bet/:id - Get single BET
router.get("/bet/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(
    `SELECT b.id, b.nom_bet, b.adresse, b.nom_gerant, b.prenom_gerant, b.telephone_bet
     FROM bet b
     WHERE b.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "BET non trouvé" });
    return;
  }
  res.json(result.rows[0]);
});

// POST /bet - Create new BET
router.post("/bet", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  try {
    const { nom_bet, adresse, nom_gerant, prenom_gerant, telephone_bet } = req.body;

    if (!nom_bet) {
      res.status(400).json({ error: "Le nom du BET est requis" });
      return;
    }

    const result = await query(
      `INSERT INTO bet (nom_bet, adresse, nom_gerant, prenom_gerant, telephone_bet)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nom_bet, adresse, nom_gerant, prenom_gerant, telephone_bet`,
      [nom_bet, adresse || null, nom_gerant || null, prenom_gerant || null, telephone_bet || null]
    );

    const newBet = result.rows[0];

    await logHistorique(
      query as Parameters<typeof logHistorique>[0],
      "CREATION",
      req.session.user?.id ?? null,
      "bet",
      newBet.id,
      `Création du BET: ${nom_bet}`
    );

    res.status(201).json(newBet);
  } catch (error) {
    console.error("Erreur creation BET:", error);
    res.status(500).json({ error: "Erreur lors de la création du BET" });
  }
});

// PATCH /bet/:id - Update BET
router.patch("/bet/:id", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const { nom_bet, adresse, nom_gerant, prenom_gerant, telephone_bet } = req.body;

  const updated = await query(
    `UPDATE bet SET
       nom_bet = COALESCE($1, nom_bet),
       adresse = COALESCE($2, adresse),
       nom_gerant = COALESCE($3, nom_gerant),
       prenom_gerant = COALESCE($4, prenom_gerant),
       telephone_bet = COALESCE($5, telephone_bet)
     WHERE id = $6
     RETURNING id, nom_bet, adresse, nom_gerant, prenom_gerant, telephone_bet`,
    [nom_bet, adresse, nom_gerant, prenom_gerant, telephone_bet, id]
  );

  if (updated.rows.length === 0) {
    res.status(404).json({ error: "BET non trouvé" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "MODIFICATION",
    req.session.user?.id ?? null,
    "bet",
    id,
    `Modification du BET id=${id}`
  );

  res.json(updated.rows[0]);
});

// DELETE /bet/:id - Delete BET
router.delete("/bet/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(`DELETE FROM bet WHERE id = $1 RETURNING id`, [id]);

  if (result.rows.length === 0) {
    res.status(404).json({ error: "BET non trouvé" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "SUPPRESSION",
    req.session.user?.id ?? null,
    "bet",
    id,
    `Suppression du BET id=${id}`
  );

  res.sendStatus(204);
});

export default router;
