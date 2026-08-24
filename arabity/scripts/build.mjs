import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

console.log("Built arabity/dist and public/car");
