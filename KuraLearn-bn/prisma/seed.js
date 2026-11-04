import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prismaDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(prismaDir, "..");
const runner = process.platform === "win32" ? "npx.cmd" : "npx";

const child = spawn(runner, ["tsx", "prisma/seed.ts"], {
  cwd: projectDir,
  stdio: "inherit"
});

child.on("error", (error) => {
  console.error("Failed to run prisma/seed.ts", error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
