import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { requireAuth, requireRole, ADMIN_ROLES, MANAGER_ROLES } from "../lib/auth";

const router: IRouter = Router();

router.get("/tags", requireAuth, async (req, res): Promise<void> => {
  const result = await query("SELECT id, lib_tag, description FROM tag ORDER BY lib_tag");
  res.json(result.rows);
});

router.post("/tags", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  const { lib_tag, description } = req.body;
  if (!lib_tag) {
    res.status(400).json({ error: "lib_tag requis" });
    return;
  }
  const result = await query(
    "INSERT INTO tag (lib_tag, description) VALUES ($1, $2) RETURNING id, lib_tag, description",
    [lib_tag, description || null]
  );
  res.status(201).json(result.rows[0]);
});

router.patch("/tags/:id", requireAuth, requireRole(...MANAGER_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const { lib_tag, description } = req.body;
  if (!lib_tag) {
    res.status(400).json({ error: "lib_tag requis" });
    return;
  }
  const result = await query(
    "UPDATE tag SET lib_tag = $1, description = $2 WHERE id = $3 RETURNING id, lib_tag, description",
    [lib_tag, description || null, id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Tag non trouvé" });
    return;
  }
  res.json(result.rows[0]);
});

router.delete("/tags/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const result = await query("DELETE FROM tag WHERE id = $1 RETURNING id", [id]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Tag non trouvé" });
    return;
  }
  res.json({ message: "Tag supprimé" });
});

export default router;
