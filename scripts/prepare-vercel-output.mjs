import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const appOutput = path.join(
  workspaceRoot,
  ".migration-backup",
  "artifacts",
  "iic-study-app-replit",
  "dist",
  "public",
);
const vercelOutput = path.join(workspaceRoot, "public");

const outputFiles = await readdir(appOutput);
if (!outputFiles.includes("index.html")) {
  throw new Error(`NSTA Study App build output is missing index.html: ${appOutput}`);
}

await rm(vercelOutput, { recursive: true, force: true });
await mkdir(vercelOutput, { recursive: true });
await cp(appOutput, vercelOutput, { recursive: true });

console.info(`Prepared Vercel static output from ${appOutput}`);
