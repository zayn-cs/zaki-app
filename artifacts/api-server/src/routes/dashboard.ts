import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  try {
    const projets = await query("SELECT COUNT(*) as count FROM projet");
    const documents = await query("SELECT COUNT(*) as count FROM document");
    const lots = await query("SELECT COUNT(*) as count FROM lot");
    const enCours = await query("SELECT COUNT(*) as count FROM projet WHERE stade = 'en cours'");

    res.json({
      total_projets: Number(projets.rows[0]?.count || 0),
      total_documents: Number(documents.rows[0]?.count || 0),
      total_lots: Number(lots.rows[0]?.count || 0),
      projets_en_cours: Number(enCours.rows[0]?.count || 0),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/dashboard/histogrammes", requireAuth, async (req, res): Promise<void> => {
  try {
    // Generate last 10 days array
    const days: string[] = [];
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      days.push(`${year}-${month}-${day}`);
    }

    const getHist = async (type: string) => {
      const entiteType = type === 'projets' ? 'projet' : type === 'lots' ? 'lot' : 'document';
      
      // Get all CREATION events for this entity type
      const result = await query(
        `SELECT timestamp 
         FROM historique 
         WHERE entite_type = $1 AND action = 'CREATION'`,
        [entiteType]
      );
      
      // Calculate daily counts
      const counts: Record<string, number> = {};
      let totalBefore10Days = 0;
      
      const tenDaysAgo = new Date(days[0]);
      
      result.rows.forEach((row: any) => {
        if (!row.timestamp) return;
        const dateStr = row.timestamp.substring(0, 10); // YYYY-MM-DD
        const dateObj = new Date(dateStr);
        
        if (dateObj < tenDaysAgo) {
          totalBefore10Days++;
        } else {
          counts[dateStr] = (counts[dateStr] || 0) + 1;
        }
      });
      
      // If we are missing data from historique for some seeded entities, 
      // let's distribute the difference so the total curve matches the actual count!
      const actualCountRes = await query(`SELECT COUNT(*) as count FROM ${entiteType}`);
      const actualCount = Number(actualCountRes.rows[0]?.count || 0);
      const histCount = result.rows.length;
      
      if (actualCount > histCount) {
        // Add the difference to totalBefore10Days so the curve ends at the correct total!
        totalBefore10Days += (actualCount - histCount);
      }

      const finalData = [];
      let runningTotal = totalBefore10Days;
      
      for (const d of days) {
        const daily = counts[d] || 0;
        runningTotal += daily;
        finalData.push({ jour: d, daily, total: runningTotal });
      }
      return finalData;
    };

    const projetsData = await getHist("projets");
    const documentsData = await getHist("documents");
    const lotsData = await getHist("lots");

    res.json({
      projets: projetsData,
      documents: documentsData,
      lots: lotsData
    });
  } catch (error) {
    console.error("Histogram error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/dashboard/analyse", requireAuth, async (req, res): Promise<void> => {
  res.json({ status: "ok" }); 
});

export default router;
