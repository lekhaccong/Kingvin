import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const pgliteDist = dirname(require.resolve("@electric-sql/pglite"));
const outputDir = join(
  projectRoot,
  ".vercel/output/functions/__server.func/_libs",
);
const assets = ["initdb.wasm", "pglite.wasm", "pglite.data"];

await mkdir(outputDir, { recursive: true });
for (const asset of assets) {
  await copyFile(join(pgliteDist, asset), join(outputDir, asset));
}

console.log(`[build] copied ${assets.join(", ")} for the PGLite fallback`);
