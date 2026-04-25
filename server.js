// server.js – Racine du projet
// Lance le backend (api-server) depuis la racine
// Usage : node server.js

const { spawn } = require("child_process");
const path = require("path");

const apiServerDir = path.join(__dirname, "artifacts", "api-server");

console.log("🚀 Démarrage du backend...");

const server = spawn("node", ["server.js"], {
  cwd: apiServerDir,
  stdio: "inherit",
  shell: true,
});

server.on("exit", (code) => process.exit(code ?? 0));
