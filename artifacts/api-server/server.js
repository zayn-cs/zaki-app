// server.js – Point d'entrée principal du backend
// Usage : node server.js
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Build (compile TypeScript → dist/index.mjs)
console.log("🔨 Build en cours...");
execSync("node build.mjs", { stdio: "inherit", cwd: __dirname });

// 2. Démarrer le serveur
console.log("🚀 Démarrage du serveur...");
const server = spawn(
  "node",
  ["--enable-source-maps", "dist/index.mjs"],
  { stdio: "inherit", cwd: __dirname }
);

server.on("exit", (code) => process.exit(code ?? 0));
