import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import session from "express-session";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";
import { initSchema } from "./lib/db";
import { seedDatabase } from "./lib/seed";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  // For dev only - generate a consistent fallback secret
  const fallbackSecret = "dev-secret-only-for-development-change-in-production";
  logger.warn("SESSION_SECRET not set. Using development fallback secret.");
  app.use(
    session({
      secret: fallbackSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );
} else {
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );
}

const startDb = async () => {
  try {
    const db = await initSchema();
    if (db) await seedDatabase(db);
  } catch (err) {
    logger.error({ err }, "Failed to initialize schema or seed");
  }
};
startDb();

app.use("/api", router);

// When running locally (SQLite mode), serve the pre-built frontend
if (!process.env.DATABASE_URL) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // Robust static path resolution
  const possiblePaths = [
    path.resolve(process.cwd(), "artifacts", "archivage-app", "dist", "public"),
    path.resolve(process.cwd(), "..", "archivage-app", "dist", "public"),
    path.resolve(__dirname, "..", "..", "..", "artifacts", "archivage-app", "dist", "public"),
  ];

  let frontendDist = possiblePaths[0];
  const fs = await import("fs");
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      frontendDist = p;
      break;
    }
  }

  app.use(express.static(frontendDist));

  // SPA fallback — serve index.html for any non-API route (Express 5 requires /*splat)
  app.get("/*splat", (_req: Request, res: Response) => {
    const indexPath = path.join(frontendDist, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend build not found. Please run 'pnpm build' first.");
    }
  });

  logger.info({ frontendDist }, "Serving pre-built frontend");
}

export default app;
