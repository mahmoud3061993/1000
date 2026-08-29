import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeOfflineHtml } from "./build-offline.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dist = join(root, "dist");
const web = join(root, "..", "public", "car");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(src, dist, { recursive: true });
await cp(join(root, "README.md"), join(dist, "README.md"));

await rm(web, { recursive: true, force: true });
await mkdir(web, { recursive: true });
await cp(src, web, { recursive: true });

const indexPath = join(web, "index.html");
let html = await readFile(indexPath, "utf8");
html = html
  .replace('href="./"', 'href="/car/"')
  .replaceAll('href="css/', 'href="/car/css/')
  .replaceAll('href="assets/', 'href="/car/assets/')
  .replace('href="manifest.json"', 'href="/car/manifest.json"')
  .replace('src="js/app.js"', 'src="/car/js/app.js"');
await writeFile(indexPath, html);

const { targets } = await writeOfflineHtml();

console.log("Built arabity/dist and public/car");
console.log("Offline file:", targets.join(", "));
