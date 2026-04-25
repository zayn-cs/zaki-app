import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { requireAuth, requireRole, ADMIN_ROLES, MANAGER_ROLES, PROJECT_ROLES } from "../lib/auth";
import { logHistorique } from "../lib/auth";

const router: IRouter = Router();

router.get("/projets", requireAuth, async (req, res): Promise<void> => {
  const { stade, priorite, id_departement } = req.query;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (stade) {
    conditions.push(`p.stade ILIKE $${idx++}`);
    params.push(`%${stade}%`);
  }
  if (priorite) {
    conditions.push(`p.priorite LIKE $${idx++}`);
    params.push(`%${priorite}%`);
  }
  if (id_departement) {
    conditions.push(`l.id_departement = $${idx++}`);
    params.push(parseInt(id_departement as string, 10));
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(
    `SELECT DISTINCT p.id as id_projet, p.numero, p.id_unite, p.pa, p.numero_op,
            p.montant_delegue, p.montant_engagement, p.montant_paiement,
            p.programme, p.programme_a_realiser, p.stade, p.situation_objectif, 
            p.contrainte, p.codification_cc, p.id_bet, p.delais, 
            p.debut_etude, p.fin_etude, p.essais, p.fin_prev,
            p.observation, p.interne, p.priorite, p.type, 
            p.reference_priorite, p.date_achevement, p.chef_projet,
            b.nom_bet, u.nom_unite,
            CONCAT(usr.prenom, ' ', usr.nom) as nom_chef_projet
     FROM projet p
     LEFT JOIN bet b ON b.id = p.id_bet
     LEFT JOIN unite u ON u.id = p.id_unite
     LEFT JOIN utilisateur usr ON usr.id = p.chef_projet
     LEFT JOIN lot l ON l.id_projet = p.id
     ${where}
     ORDER BY p.id DESC`,
    params
  );
  res.json(result.rows);
});

router.post("/projets", requireAuth, requireRole(...PROJECT_ROLES), async (req, res): Promise<void> => {
  try {
    const {
      numero, id_unite, pa, numero_op, montant_delegue, montant_engagement, montant_paiement,
      programme, programme_a_realiser, stade, situation_objectif, contrainte, codification_cc, 
      id_bet, delais, debut_etude, fin_etude, essais, fin_prev, observation, interne, 
      priorite, type, reference_priorite, date_achevement, chef_projet
    } = req.body;

    if (!programme) {
      res.status(400).json({ error: "Le nom du programme est requis" });
      return;
    }

    const result = await query(
      `INSERT INTO projet (numero, id_unite, pa, numero_op, montant_delegue, montant_engagement,
        montant_paiement, programme, programme_a_realiser, stade, situation_objectif, 
        contrainte, codification_cc, id_bet, delais, debut_etude, fin_etude, essais, 
        fin_prev, observation, interne, priorite, type, reference_priorite, 
        date_achevement, chef_projet)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
       RETURNING id as id_projet`,
      [
        numero ?? null, id_unite || null, pa ?? null, numero_op ?? null, 
        montant_delegue || 0, montant_engagement || 0, montant_paiement || 0,
        programme, programme_a_realiser ?? null, stade ?? null, situation_objectif ?? null, 
        contrainte ?? null, codification_cc ?? null, id_bet || null, delais || 0, 
        debut_etude || null, fin_etude || null, essais || null, fin_prev || null, 
        observation ?? null, interne ?? null, priorite ?? null, type ?? null, 
        reference_priorite ?? null, date_achevement || null, chef_projet || null
      ]
    );

    const newId = result.rows[0].id_projet as number;

    await logHistorique(
      query as Parameters<typeof logHistorique>[0],
      "CREATION",
      req.session.user?.id ?? null,
      "projet",
      newId,
      `Création du projet: ${programme || ""}`
    );

    const full = await query(
      `SELECT p.id as id_projet, p.numero, p.id_unite, p.pa, p.numero_op,
              p.montant_delegue, p.montant_engagement, p.montant_paiement,
              p.programme, p.programme_a_realiser, p.stade, p.situation_objectif, p.contrainte,
              p.id_bet, p.delais, p.debut_etude, p.fin_etude, p.fin_prev,
              p.observation, p.priorite, p.type, p.date_achevement, p.chef_projet,
              b.nom_bet, u.nom_unite,
              COALESCE(usr.prenom, '') || ' ' || COALESCE(usr.nom, '') as nom_chef_projet
       FROM projet p
       LEFT JOIN bet b ON b.id = p.id_bet
       LEFT JOIN unite u ON u.id = p.id_unite
       LEFT JOIN utilisateur usr ON usr.id = p.chef_projet
       WHERE p.id = $1`,
      [newId]
    );
    res.status(201).json(full.rows[0]);
  } catch (error) {
    console.error("Erreur creation projet:", error);
    res.status(500).json({ error: "Erreur lors de la création du projet" });
  }
});

router.get("/projets/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(
    `SELECT p.id as id_projet, p.numero, p.id_unite, p.pa, p.numero_op,
            p.montant_delegue, p.montant_engagement, p.montant_paiement,
            p.programme, p.programme_a_realiser, p.stade, p.situation_objectif, p.contrainte,
            p.id_bet, p.delais, p.debut_etude, p.fin_etude, p.fin_prev,
            p.observation, p.priorite, p.type, p.date_achevement, p.chef_projet,
            b.nom_bet, u.nom_unite,
            CONCAT(usr.prenom, ' ', usr.nom) as nom_chef_projet
     FROM projet p
     LEFT JOIN bet b ON b.id = p.id_bet
     LEFT JOIN unite u ON u.id = p.id_unite
     LEFT JOIN utilisateur usr ON usr.id = p.chef_projet
     WHERE p.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Projet non trouvé" });
    return;
  }
  res.json(result.rows[0]);
});

router.patch("/projets/:id", requireAuth, requireRole(...PROJECT_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const {
    numero, id_unite, pa, numero_op, montant_delegue, montant_engagement, montant_paiement,
    programme, programme_a_realiser, stade, situation_objectif, contrainte, codification_cc, 
    id_bet, delais, debut_etude, fin_etude, essais, fin_prev, observation, interne, 
    priorite, type, reference_priorite, date_achevement, chef_projet
  } = req.body;

  const updated = await query(
    `UPDATE projet SET
      numero = COALESCE($1, numero),
      id_unite = COALESCE($2, id_unite),
      pa = COALESCE($3, pa),
      numero_op = COALESCE($4, numero_op),
      montant_delegue = COALESCE($5, montant_delegue),
      montant_engagement = COALESCE($6, montant_engagement),
      montant_paiement = COALESCE($7, montant_paiement),
      programme = COALESCE($8, programme),
      programme_a_realiser = COALESCE($9, programme_a_realiser),
      stade = COALESCE($10, stade),
      situation_objectif = COALESCE($11, situation_objectif),
      contrainte = COALESCE($12, contrainte),
      codification_cc = COALESCE($13, codification_cc),
      id_bet = COALESCE($14, id_bet),
      delais = COALESCE($15, delais),
      debut_etude = COALESCE($16, debut_etude),
      fin_etude = COALESCE($17, fin_etude),
      essais = COALESCE($18, essais),
      fin_prev = COALESCE($19, fin_prev),
      observation = COALESCE($20, observation),
      interne = COALESCE($21, interne),
      priorite = COALESCE($22, priorite),
      type = COALESCE($23, type),
      reference_priorite = COALESCE($24, reference_priorite),
      date_achevement = COALESCE($25, date_achevement),
      chef_projet = COALESCE($26, chef_projet)
     WHERE id = $27`,
    [numero, id_unite, pa, numero_op, montant_delegue, montant_engagement, montant_paiement,
     programme, programme_a_realiser, stade, situation_objectif, contrainte, codification_cc,
     id_bet, delais, debut_etude, fin_etude, essais, fin_prev, observation, interne,
     priorite, type, reference_priorite, date_achevement, chef_projet, id]
  );

  if (updated.rowCount === 0) {
    res.status(404).json({ error: "Projet non trouvé" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "MODIFICATION",
    req.session.user?.id ?? null,
    "projet",
    id,
    `Modification du projet id=${id}`
  );

  const result = await query(
    `SELECT p.id as id_projet, p.numero, p.id_unite, p.pa, p.numero_op,
            p.montant_delegue, p.montant_engagement, p.montant_paiement,
            p.programme, p.programme_a_realiser, p.stade, p.situation_objectif, p.contrainte,
            p.id_bet, p.delais, p.debut_etude, p.fin_etude, p.fin_prev,
            p.observation, p.priorite, p.type, p.date_achevement, p.chef_projet,
            b.nom_bet, u.nom_unite,
            CONCAT(usr.prenom, ' ', usr.nom) as nom_chef_projet
     FROM projet p
     LEFT JOIN bet b ON b.id = p.id_bet
     LEFT JOIN unite u ON u.id = p.id_unite
     LEFT JOIN utilisateur usr ON usr.id = p.chef_projet
     WHERE p.id = $1`,
    [id]
  );
  res.json(result.rows[0]);
});

router.post("/lots", requireAuth, requireRole(...PROJECT_ROLES), async (req, res): Promise<void> => {
  const { nom_lot, id_user, id_departement, id_projet } = req.body;

  const result = await query(
    `INSERT INTO lot (nom_lot, id_user, id_departement, id_projet)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [nom_lot, id_user || null, id_departement || null, id_projet || null]
  );
  const lotId = result.rows[0].id;

  if (Array.isArray(req.body.phases)) {
    for (const pName of req.body.phases) {
      await query(`INSERT INTO phase (nome_phase, id_lot) VALUES ($1, $2)`, [pName, lotId]);
    }
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "CREATION",
    req.session.user?.id ?? null,
    "lot",
    lotId as number,
    `Création du lot: ${nom_lot}`
  );

  res.status(201).json({ id_lot: lotId, nom_lot });
});

router.delete("/projets/:id", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(`DELETE FROM projet WHERE id = $1 RETURNING id`, [id]);

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Projet non trouvé" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "SUPPRESSION",
    req.session.user?.id ?? null,
    "projet",
    id,
    `Suppression du projet id=${id}`
  );

  res.sendStatus(204);
});

export default router;
