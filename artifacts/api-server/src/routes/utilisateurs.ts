import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { query } from "../lib/db";
import { requireAuth, requireRole, logHistorique, ADMIN_ROLES, MANAGER_ROLES } from "../lib/auth";

const router: IRouter = Router();

router.get("/utilisateurs", requireAuth, async (req, res): Promise<void> => {
  const { role, id_departement } = req.query;
  const user = req.session.user!;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (role) {
    conditions.push(`u.role = $${idx++}`);
    params.push(role);
  }
  if (id_departement) {
    conditions.push(`u.id_departement = $${idx++}`);
    params.push(parseInt(id_departement as string, 10));
  }

  const isAdmin = ADMIN_ROLES.includes(user.role);
  const isManager = MANAGER_ROLES.includes(user.role);

  if (user.role === "chef_departement" && user.id_departement) {
    conditions.push(`u.id_departement = $${idx++}`);
    params.push(user.id_departement);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sensitiveFields = isAdmin
    ? "u.adresse, u.telephone_professional, u.telephone_personnel,"
    : "";

  const result = await query(
    `SELECT u.id, u.nom, u.prenom, u.messager, u.role, u.grade,
            u.is_chef_project, u.id_departement,
            ${sensitiveFields}
            d.nom as nom_departement
     FROM utilisateur u
     LEFT JOIN departement d ON d.id = u.id_departement
     ${where}
     ORDER BY u.nom, u.prenom`,
    params
  );

  if (!isManager) {
    const limited = (result.rows as Record<string, unknown>[]).map(u => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      role: u.role,
      id_departement: u.id_departement,
      nom_departement: u.nom_departement,
    }));
    res.json(limited);
    return;
  }

  res.json(result.rows);
});

router.get("/utilisateurs/me", requireAuth, async (req, res): Promise<void> => {
  const id = req.session.user!.id;
  const result = await query(
    `SELECT u.id, u.nom, u.prenom, u.messager, u.role, u.grade, u.adresse,
            u.is_chef_project, u.id_departement, u.telephone_professional, u.telephone_personnel,
            d.nom as nom_departement
     FROM utilisateur u
     LEFT JOIN departement d ON d.id = u.id_departement
     WHERE u.id = $1`,
    [id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Utilisateur non trouvé" });
    return;
  }
  res.json(result.rows[0]);
});

router.post("/utilisateurs", requireAuth, requireRole("admin", "coordinateur"), async (req, res): Promise<void> => {
  const {
    nom, prenom, messager, mot_pass, role, grade, adresse, telephone_professional,
    telephone_personnel, is_chef_project, id_departement
  } = req.body;

  if (!nom || !prenom || !messager || !mot_pass) {
    res.status(400).json({ error: "nom, prenom, messager et mot_pass sont requis" });
    return;
  }

  const existing = await query(`SELECT id FROM utilisateur WHERE messager = $1`, [messager]);
  if (existing.rows.length > 0) {
    res.status(409).json({ error: "Cet identifiant est déjà utilisé" });
    return;
  }

  const hashed = await bcrypt.hash(mot_pass, 10);

  const result = await query(
    `INSERT INTO utilisateur (nom, prenom, messager, mot_pass, role, grade, adresse,
      telephone_professional, telephone_personnel, is_chef_project, id_departement)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id, nom, prenom, messager, role, grade, adresse, is_chef_project, id_departement,
       telephone_professional, telephone_personnel`,
    [nom, prenom, messager, hashed, role || "chef_projet", grade || "", adresse || "",
     telephone_professional || null, telephone_personnel || null, is_chef_project || false,
     id_departement || null]
  );

  const newId = result.rows[0].id as number;

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "CREATION",
    req.session.user?.id ?? null,
    "utilisateur",
    newId,
    `Création de l'utilisateur: ${prenom} ${nom}`
  );

  res.status(201).json(result.rows[0]);
});

router.get("/utilisateurs/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const caller = req.session.user!;

  const isManagerOrAdmin = MANAGER_ROLES.includes(caller.role);
  const isSelf = caller.id === id;

  if (!isManagerOrAdmin && !isSelf) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const isAdmin = ADMIN_ROLES.includes(caller.role);

  const result = await query(
    `SELECT u.id, u.nom, u.prenom, u.messager, u.role, u.grade,
            u.is_chef_project, u.id_departement,
            ${isAdmin || isSelf ? "u.adresse, u.telephone_professional, u.telephone_personnel," : ""}
            d.nom as nom_departement
     FROM utilisateur u
     LEFT JOIN departement d ON d.id = u.id_departement
     WHERE u.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Utilisateur non trouvé" });
    return;
  }
  res.json(result.rows[0]);
});

router.patch("/utilisateurs/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const callerUser = req.session.user!;

  const isAdmin = callerUser.role === "admin" || callerUser.role === "coordinateur";
  if (!isAdmin && callerUser.id !== id) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const {
    nom, prenom, grade, adresse, telephone_professional, telephone_personnel,
    is_chef_project, id_departement, mot_pass, role
  } = req.body;

  let hashedPassword: string | undefined;
  if (mot_pass) {
    hashedPassword = await bcrypt.hash(mot_pass, 10);
  }

  const updated = await query(
    `UPDATE utilisateur SET
      nom = COALESCE($1, nom),
      prenom = COALESCE($2, prenom),
      grade = COALESCE($3, grade),
      adresse = COALESCE($4, adresse),
      telephone_professional = COALESCE($5, telephone_professional),
      telephone_personnel = COALESCE($6, telephone_personnel),
      is_chef_project = COALESCE($7, is_chef_project),
      id_departement = COALESCE($8, id_departement),
      mot_pass = COALESCE($9, mot_pass),
      role = COALESCE($10, role)
     WHERE id = $11`,
    [nom, prenom, grade, adresse, telephone_professional, telephone_personnel,
     is_chef_project, id_departement, hashedPassword || null, isAdmin ? role : null, id]
  );

  if (updated.rowCount === 0) {
    const check = await query(`SELECT id FROM utilisateur WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ error: "Utilisateur non trouvé" });
      return;
    }
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "MODIFICATION",
    req.session.user?.id ?? null,
    "utilisateur",
    id,
    `Modification de l'utilisateur id=${id}`
  );

  const result = await query(
    `SELECT u.id, u.nom, u.prenom, u.messager, u.role, u.grade, u.adresse,
            u.is_chef_project, u.id_departement, u.telephone_professional, u.telephone_personnel,
            d.nom as nom_departement
     FROM utilisateur u
     LEFT JOIN departement d ON d.id = u.id_departement
     WHERE u.id = $1`,
    [id]
  );
  res.json(result.rows[0]);
});

router.delete("/utilisateurs/:id", requireAuth, requireRole("admin", "coordinateur"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const result = await query(`DELETE FROM utilisateur WHERE id = $1 RETURNING id`, [id]);

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Utilisateur non trouvé" });
    return;
  }

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "SUPPRESSION",
    req.session.user?.id ?? null,
    "utilisateur",
    id,
    `Suppression de l'utilisateur id=${id}`
  );

  res.sendStatus(204);
});

export default router;
