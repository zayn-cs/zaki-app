import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import departementsRouter from "./departements";
import projetsRouter from "./projets";
import lotsRouter from "./lots";
import phasesRouter from "./phases";
import documentsRouter from "./documents";
import utilisateursRouter from "./utilisateurs";
import betRouter from "./bet";
import unitesRouter from "./unites";
import cmdsRouter from "./cmds";
import rechercheRouter from "./recherche";
import historiqueRouter from "./historique";
import miscRouter from "./misc";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(departementsRouter);
router.use(projetsRouter);
router.use(lotsRouter);
router.use(phasesRouter);
router.use(documentsRouter);
router.use(utilisateursRouter);
router.use(betRouter);
router.use(unitesRouter);
router.use(cmdsRouter);
router.use(rechercheRouter);
router.use(historiqueRouter);
router.use(miscRouter);
router.use(dashboardRouter);

export default router;
