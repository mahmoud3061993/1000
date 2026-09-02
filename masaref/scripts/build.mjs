import { access, copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dist = join(root, "dist");
const web = join(root, "..", "public", "spend");
const apkName = "masaref.apk";

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
  console.log("Built masaref/dist and public/spend (kept masaref.apk)");
} else {
  console.log("Built masaref/dist and public/spend (no masaref.apk to keep)");
}
