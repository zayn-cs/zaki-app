import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function startBackend() {
  console.log("Starting API server on port 3001...");
  const backend = spawn("node", ["artifacts/api-server/dist/index.mjs"], {
    cwd: rootDir,
    env: { ...process.env, PORT: "3001" },
    stdio: "inherit",
    shell: true,
    windowsHide: true
  });
  backend.on("error", (err) => console.error("Backend error:", err));
  return backend;
}

function startFrontend() {
  console.log("Starting frontend on port 3000...");
  const frontend = spawn("npx", ["vite", "--host", "0.0.0.0"], {
    cwd: path.join(rootDir, "artifacts/archivage-app"),
    stdio: "inherit",
    shell: true,
    windowsHide: true
  });
  frontend.on("error", (err) => console.error("Frontend error:", err));
  return frontend;
}

console.log("Starting both servers...\n");
const backend = startBackend();

setTimeout(() => {
  const frontend = startFrontend();
  
  console.log("\n=== Servers running ===");
  console.log("API:   http://localhost:3001");
  console.log("Web:   http://localhost:3000");
  console.log("========================\n");
  
  process.on("SIGINT", () => {
    console.log("\nShutting down...");
    backend.kill();
    frontend.kill();
    process.exit();
  });
}, 3000);