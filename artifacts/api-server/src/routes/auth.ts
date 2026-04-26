import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { query } from "../lib/db";
import { logHistorique, requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { messager, mot_pass } = req.body;

  if (!messager || !mot_pass) {
    res.status(400).json({ error: "Identifiant et mot de passe requis" });
    return;
  }

  const result = await query(
    `SELECT u.id, u.nom, u.prenom, u.messager, u.mot_pass, u.role, u.grade, u.adresse,
            u.is_chef_project, u.id_departement, u.telephone_professional, u.telephone_personnel,
            d.nom as nom_departement
     FROM utilisateur u
     LEFT JOIN departement d ON d.id = u.id_departement
     WHERE u.messager = $1`,
    [messager]
  );

  if (result.rows.length === 0) {
    res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });
    return;
  }

  const user = result.rows[0] as Record<string, unknown>;
  let passwordMatch = false;

  const storedPassword = user.mot_pass as string;

  if (storedPassword.startsWith("$2")) {
    // Bcrypt hash — normal comparison
    passwordMatch = await bcrypt.compare(mot_pass, storedPassword);
  } else {
    // Plain-text password (e.g. created directly via pgAdmin)
    passwordMatch = mot_pass === storedPassword;
    if (passwordMatch) {
      // Transparently upgrade to bcrypt so future logins use the hash
      const hashed = await bcrypt.hash(mot_pass, 10);
      await query(`UPDATE utilisateur SET mot_pass = $1 WHERE id = $2`, [hashed, user.id]);
    }
  }

  if (!passwordMatch) {
    res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });
    return;
  }


  const sessionUser = {
    id: user.id as number,
    nom: user.nom as string,
    prenom: user.prenom as string,
    messager: user.messager as string,
    role: user.role as string,
    grade: user.grade as string,
    adresse: user.adresse as string,
    telephone_professional: user.telephone_professional,
    telephone_personnel: user.telephone_personnel,
    is_chef_project: user.is_chef_project as boolean,
    id_departement: user.id_departement as number | null,
    nom_departement: user.nom_departement as string | null,
  };

  req.session.user = sessionUser;

  await logHistorique(
    query as Parameters<typeof logHistorique>[0],
    "CONNEXION",
    user.id as number,
    "utilisateur",
    user.id as number,
    `Connexion de ${user.prenom} ${user.nom}`
  );

  res.json(sessionUser);
});

router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.user?.id;
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Error destroying session");
    }
  });

  if (userId) {
    try {
      await logHistorique(
        query as Parameters<typeof logHistorique>[0],
        "DECONNEXION",
        userId,
        "utilisateur",
        userId,
        "Déconnexion"
      );
    } catch {
      // ignore
    }
  }

  res.json({ message: "Déconnecté" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.user?.id;
  const result = await query(
    `SELECT u.id, u.nom, u.prenom, u.messager, u.role, u.grade, u.adresse,
            u.is_chef_project, u.id_departement, u.telephone_professional, u.telephone_personnel,
            d.nom as nom_departement
     FROM utilisateur u
     LEFT JOIN departement d ON d.id = u.id_departement
     WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    res.status(401).json({ error: "Session invalide" });
    return;
  }

  res.json(result.rows[0]);
});

export default router;
