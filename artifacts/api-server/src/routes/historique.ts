import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/historique", requireAuth, async (req, res): Promise<void> => {
  const { id_utilisateur, action, entite_type, limit } = req.query;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (id_utilisateur) {
    conditions.push(`h.id_utilisateur = $${idx++}`);
    params.push(parseInt(id_utilisateur as string, 10));
  }
  if (action) {
    conditions.push(`h.action = $${idx++}`);
    params.push(action);
  }
  if (entite_type) {
    conditions.push(`h.entite_type = $${idx++}`);
    params.push(entite_type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const lim = limit ? parseInt(limit as string, 10) : 50;

  const result = await query(
    `SELECT h.id, h.action, h.date_action, h.entite_type, h.entite_id, h.commentaire,
            u.prenom || ' ' || u.nom as nom_utilisateur,
            u.messager
     FROM historique h
     LEFT JOIN utilisateur u ON u.id = h.id_utilisateur
     ${where}
     ORDER BY h.id DESC
     LIMIT $${idx}`,
    [...params, lim]
  );
  res.json(result.rows);
});

export default router;
