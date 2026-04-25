import { type Request, type Response, type NextFunction } from "express";

export interface SessionUser {
  id: number;
  nom: string;
  prenom: string;
  messager: string;
  role: string;
  grade: string;
  adresse: string;
  is_chef_project: boolean;
  id_departement: number | null;
}

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}

export const ADMIN_ROLES = ["admin", "coordinateur"];
export const MANAGER_ROLES = ["admin", "coordinateur", "chef_departement"];
export const PROJECT_ROLES = ["admin", "coordinateur", "chef_departement", "chef_projet"];
export const ALL_ROLES = ["admin", "coordinateur", "chef_departement", "chef_projet", "responsable_lot"];

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.user) {
      res.status(401).json({ error: "Non authentifié" });
      return;
    }
    if (!roles.includes(req.session.user.role)) {
      res.status(403).json({ error: "Accès interdit - rôle insuffisant" });
      return;
    }
    next();
  };
}

export function requireRoleOrSelf(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.user) {
      res.status(401).json({ error: "Non authentifié" });
      return;
    }
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const targetId = parseInt(rawId, 10);
    if (roles.includes(req.session.user.role) || req.session.user.id === targetId) {
      next();
      return;
    }
    res.status(403).json({ error: "Accès interdit" });
  };
}

export async function logHistorique(
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>,
  action: string,
  userId: number | null,
  entiteType: string,
  entiteId: number,
  commentaire: string
) {
  await query(
    `INSERT INTO historique (action, id_utilisateur, entite_type, entite_id, commentaire)
     VALUES ($1, $2, $3, $4, $5)`,
    [action, userId, entiteType, entiteId, commentaire]
  );
}
