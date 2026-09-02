import { access, copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dist = join(root, "dist");
const web = join(root, "..", "public", "spend");
const apkName = "masaref.apk";
const htmlZipName = "masaref-html.zip";
const apkZipName = "masaref-android.zip";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function stashApk() {
  for (const path of [join(dist, apkName), join(web, apkName)]) {
    if (await exists(path)) {
      const stash = join(tmpdir(), `masaref-${randomBytes(8).toString("hex")}.apk`);
      await copyFile(path, stash);
      return stash;
    }
  }
  return null;
}

function zipFolder(fromDir, outFile, skipExt = [".apk", ".zip"]) {
  const skip = JSON.stringify(skipExt);
  execFileSync(
    "python3",
    [
      "-c",
      [
        "import os, sys, zipfile",
        "src, out, skip = sys.argv[1], sys.argv[2], set(sys.argv[3].split(','))",
        "os.makedirs(os.path.dirname(out) or '.', exist_ok=True)",
        "with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:",
        "    for root, dirs, files in os.walk(src):",
        "        for name in files:",
        "            ext = os.path.splitext(name)[1].lower()",
        "            if ext in skip: continue",
        "            path = os.path.join(root, name)",
        "            z.write(path, os.path.relpath(path, src))",
      ].join("\n"),
      fromDir,
      outFile,
      skipExt.join(","),
    ],
    { stdio: "inherit" }
  );
}

function zipSingleFile(filePath, outFile, innerName) {
  execFileSync(
    "python3",
    [
      "-c",
      [
        "import sys, zipfile",
        "src, out, name = sys.argv[1], sys.argv[2], sys.argv[3]",
        "with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:",
        "    z.write(src, name)",
      ].join("\n"),
      filePath,
      outFile,
      innerName,
    ],
    { stdio: "inherit" }
  );
}

const apkStash = await stashApk();

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(src, dist, { recursive: true });
await cp(join(root, "README.md"), join(dist, "README.md")).catch(() => {});

await rm(web, { recursive: true, force: true });
await mkdir(web, { recursive: true });
await cp(src, web, { recursive: true });

const indexPath = join(web, "index.html");
let html = await readFile(indexPath, "utf8");
html = html
  .replace('href="./"', 'href="/spend/"')
  .replaceAll('href="css/', 'href="/spend/css/')
  .replaceAll('href="assets/', 'href="/spend/assets/')
  .replace('href="manifest.json"', 'href="/spend/manifest.json"')
  .replace('src="js/app.js"', 'src="/spend/js/app.js"');
await writeFile(indexPath, html);

if (apkStash) {
  await copyFile(apkStash, join(dist, apkName));
  await copyFile(apkStash, join(web, apkName));
  await rm(apkStash, { force: true });
}

const htmlZip = join(web, htmlZipName);
const apkZip = join(web, apkZipName);
zipFolder(dist, htmlZip);
await copyFile(htmlZip, join(root, "..", "public", htmlZipName));
if (await exists(join(web, apkName))) {
  zipSingleFile(join(web, apkName), apkZip, apkName);
}

console.log("Built masaref/dist, public/spend, HTML zip, and Android zip");
