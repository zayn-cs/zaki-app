import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/recherche/projets", requireAuth, async (req, res): Promise<void> => {
  const { q, stade, priorite, id_tag, date, montant } = req.query;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (q) {
    conditions.push(`(p.programme LIKE $${idx} OR p.pa LIKE $${idx} OR p.numero_op LIKE $${idx} OR p.numero LIKE $${idx})`);
    params.push(`%${q}%`);
    idx++;
  }
  if (stade && stade !== "all") {
    conditions.push(`p.stade LIKE $${idx++}`);
    params.push(stade);
  }
  if (priorite && priorite !== "all") {
    conditions.push(`p.priorite LIKE $${idx++}`);
    params.push(`%${priorite}%`);
  }
  if (montant) {
    conditions.push(`p.montant_delegue >= $${idx++}`);
    params.push(parseFloat(montant as string));
  }
  if (date) {
    const dStr = date as string;
    if (/^\d{4}$/.test(dStr)) {
      conditions.push(`(p.debut_etude LIKE $${idx} OR p.fin_prev LIKE $${idx} OR p.date_achevement LIKE $${idx})`);
      params.push(`%${dStr}%`);
    } else {
      conditions.push(`(p.debut_etude >= $${idx} OR p.fin_prev >= $${idx} OR p.date_achevement >= $${idx})`);
      params.push(dStr);
    }
    idx++;
  }
  if (id_tag && id_tag !== "all") {
    conditions.push(`EXISTS (
      SELECT 1 FROM document d 
      JOIN document_tag dt ON dt.id_document = d.id 
      WHERE d.id_projet = p.id AND dt.id_tag = $${idx++}
    )`);
    params.push(parseInt(id_tag as string, 10));
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(
     `SELECT DISTINCT p.*, p.id as id_projet, u.nom_unite, u.id_cmd, ut.nom as nom_chef_projet, b.nom_bet, c.nom_cmd
      FROM projet p
      LEFT JOIN unite u ON u.id = p.id_unite
      LEFT JOIN cmd c ON c.id = u.id_cmd
      LEFT JOIN utilisateur ut ON ut.id = p.chef_projet
      LEFT JOIN bet b ON b.id = p.id_bet
      ${where}
      ORDER BY p.id DESC
      LIMIT 100`,
     params
  );
  res.json(result.rows);
});

router.get("/recherche/documents", requireAuth, async (req, res): Promise<void> => {
  const { q, id_projet, id_lot, id_phase, id_type, statut, date_debut, date_fin } = req.query;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (q) {
    conditions.push(`(d.nom_doc LIKE $${idx} OR d.commentaire LIKE $${idx})`);
    params.push(`%${q}%`);
    idx++;
  }
  if (id_projet) {
    conditions.push(`d.id_projet = $${idx++}`);
    params.push(parseInt(id_projet as string, 10));
  }
  if (id_lot) {
    conditions.push(`ph.id_lot = $${idx++}`);
    params.push(parseInt(id_lot as string, 10));
  }
  if (id_phase) {
    conditions.push(`d.id_phase = $${idx++}`);
    params.push(parseInt(id_phase as string, 10));
  }
  if (id_type && id_type !== "all") {
    const idVal = parseInt(id_type as string, 10);
    if (!isNaN(idVal)) {
      conditions.push(`d.id_type = $${idx++}`);
      params.push(idVal);
    } else {
      conditions.push(`td.lib_type LIKE $${idx++}`);
      params.push(`%${id_type}%`);
    }
  }
  if (statut) {
    conditions.push(`d.statut = $${idx++}`);
    params.push(statut);
  }
  if (date_debut) {
    conditions.push(`d.date_creation >= $${idx++}`);
    params.push(date_debut);
  }
  if (date_fin) {
    conditions.push(`d.date_creation <= $${idx++}`);
    params.push(date_fin);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(
    `SELECT d.id as id_document, d.nom_doc, d.date_creation, d.commentaire,
            d.statut, d.is_global, d.id_phase, d.id_projet, d.id_type,
            td.lib_type as type_document,
            ph.nome_phase,
            p.programme as nom_projet,
            COALESCE(u.prenom, '') || ' ' || COALESCE(u.nom, '') as nom_auteur,
            v.numero_version, v.fichier_path
     FROM document d
     LEFT JOIN type_document td ON td.id = d.id_type
     LEFT JOIN phase ph ON ph.id = d.id_phase
     LEFT JOIN lot l ON l.id = ph.id_lot
     LEFT JOIN projet p ON p.id = d.id_projet
     LEFT JOIN utilisateur u ON u.id = d.id_utilisateur
     LEFT JOIN version v ON v.id = d.id_version
     ${where}
     ORDER BY d.date_creation DESC
     LIMIT 100`,
     params
  );
  res.json(result.rows);
});

export default router;
