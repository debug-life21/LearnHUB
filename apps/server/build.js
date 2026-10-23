import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.join(appDirectory, "src");
const outputDirectory = path.join(appDirectory, "dist");

async function collectJavaScriptFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJavaScriptFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(entryPath);
    }
  }
  return files;
}

const sourceFiles = await collectJavaScriptFiles(sourceDirectory);
for (const file of sourceFiles) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

if (process.argv.includes("--check")) {
  console.log(`Syntax checked ${sourceFiles.length} server JavaScript files.`);
} else {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(path.dirname(outputDirectory), { recursive: true });
  await cp(sourceDirectory, outputDirectory, { recursive: true });
  console.log(`Built ${sourceFiles.length} server JavaScript files.`);
}
