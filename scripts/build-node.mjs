/**
 * Build script for Node.js output.
 *
 * This script handles the dual-runtime extension problem:
 * - Source files use .ts extensions (for Deno compatibility)
 * - Node.js ESM needs .js extensions
 * - TypeScript's tsc can't emit when sources have .ts extensions
 *
 * Solution:
 * 1. Temporarily rewrite .ts → .js in source files
 * 2. Run tsc to compile
 * 3. Restore original .ts extensions in source files
 * 4. Copy schema.d.ts to dist
 */
import { execFileSync } from "node:child_process";
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const srcDir = join(__dirname, "..", "src");
const distDir = join(__dirname, "..", "dist");

const filesToProcess = ["index.ts", "client-factory.ts"];

async function rewriteExtensions(files, from, to) {
  for (const file of files) {
    const filePath = join(srcDir, file);
    let content = await readFile(filePath, "utf-8");

    // Rewrite import/export extensions
    const fromPattern = new RegExp(`from\\s+["'](\\.[^"']+)\\${from}["']`, "g");
    content = content.replace(fromPattern, `from "$1${to}"`);

    await writeFile(filePath, content);
  }
}

async function build() {
  console.log("1. Rewriting .ts → .js extensions in source files...");
  await rewriteExtensions(filesToProcess, ".ts", ".js");
  await rewriteExtensions(filesToProcess, ".d.ts", ".js");

  try {
    console.log("2. Compiling with tsc...");
    execFileSync("npm", ["exec", "tsc", "-p", "tsconfig.build.json"], {
      cwd: join(__dirname, ".."),
      stdio: "inherit",
    });

    console.log("3. Copying schema.d.ts to dist...");
    await copyFile(join(srcDir, "schema.d.ts"), join(distDir, "schema.d.ts"));

    console.log("Build complete!");
  } finally {
    console.log("4. Restoring .ts extensions in source files...");
    await rewriteExtensions(filesToProcess, ".js", ".ts");

    // Also restore .d.ts for schema imports
    for (const file of filesToProcess) {
      const filePath = join(srcDir, file);
      let content = await readFile(filePath, "utf-8");
      content = content.replace(
        /from\s+["']\.\/schema\.ts["']/g,
        'from "./schema.d.ts"',
      );
      await writeFile(filePath, content);
    }
  }
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
