import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dist = join(root, "dist");
const web = join(root, "..", "public", "spend");

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

console.log("Built masaref/dist and public/spend");
