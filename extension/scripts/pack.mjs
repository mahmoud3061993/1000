import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "meta-library-downloader.zip");

spawnSync("python3", [path.join(root, "scripts", "generate_icons.py")], {
  stdio: "inherit",
});

const files = [
  "manifest.json",
  "shared.js",
  "interceptor.js",
  "content.js",
  "content.css",
  "background.js",
  "popup.html",
  "popup.js",
  "popup.css",
  "icons/icon16.png",
  "icons/icon32.png",
  "icons/icon48.png",
  "icons/icon128.png",
];

execFileSync("zip", ["-X", "-r", out, ...files], { cwd: root, stdio: "inherit" });
console.log("Packed", out);
