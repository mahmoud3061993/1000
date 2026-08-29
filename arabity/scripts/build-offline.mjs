import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

const CSS_FILES = [
  "variables.css",
  "reset.css",
  "layout.css",
  "components.css",
  "forms.css",
  "responsive.css",
  "print.css",
];

function escapeInline(text, tag) {
  const re = new RegExp(`</${tag}`, "gi");
  return text.replace(re, `<\\/${tag}`);
}

export async function buildOfflineHtml() {
  const cssParts = await Promise.all(CSS_FILES.map((name) => readFile(join(src, "css", name), "utf8")));
  const css = escapeInline(cssParts.join("\n"), "style");

  const bundled = await esbuild.build({
    absWorkingDir: root,
    entryPoints: [join(src, "js", "app.js")],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["es2018"],
    write: false,
    minify: true,
    legalComments: "none",
    logLevel: "silent",
  });
  const js = escapeInline(bundled.outputFiles[0].text, "script");

  const favicon = await readFile(join(src, "assets", "icons", "favicon.svg"), "utf8");
  const faviconUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(favicon)}`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
    />
    <meta name="theme-color" content="#0A2540" />
    <meta name="color-scheme" content="light dark" />
    <meta name="application-name" content="عربيتي" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="عربيتي" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta
      name="description"
      content="كل حاجة تخص عربيتك في مكان واحد. تابع المصاريف والصيانة بدون إنترنت."
    />
    <title>عربيتي</title>
    <link rel="icon" href="${faviconUri}" type="image/svg+xml" />
    <!-- ملف أوفلاين كامل: افتحه في Chrome أو Edge من غير نت. سيبه في نفس المكان عشان بياناتك تفضل موجودة. -->
    <style>
      html,
      body {
        margin: 0;
        min-height: 100%;
        background: #f3f5f8;
        color: #0f172a;
        font-family: Tahoma, "Segoe UI", Arial, sans-serif;
      }
      .boot-screen {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 32px 20px;
        text-align: center;
      }
      .boot-screen h1 {
        margin: 0 0 8px;
        font-size: 1.75rem;
      }
      .boot-screen p {
        margin: 0;
        color: #5b677a;
        line-height: 1.7;
      }
${css}
    </style>
    <script>
      window.ARABITY_OFFLINE_FILE = true;
      (function () {
        try {
          var theme = localStorage.getItem("arabity-theme") || "system";
          var dark =
            theme === "dark" ||
            (theme === "system" &&
              window.matchMedia &&
              window.matchMedia("(prefers-color-scheme: dark)").matches);
          document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        } catch (e) {}
        window.addEventListener(
          "error",
          function (ev) {
            if (document.documentElement.dataset.arabityReady) return;
            var boot = document.getElementById("boot-screen");
            if (!boot) return;
            boot.innerHTML =
              "<h1>عربيتي</h1><p>حصلت مشكلة أثناء التحميل. افتح الملف في Chrome أو Edge وجرب تاني.</p>";
            console.error(ev.error || ev.message || ev);
          },
          true
        );
      })();
    </script>
  </head>
  <body>
    <a class="skip-link" href="#app-main">تخطي إلى المحتوى</a>
    <div id="app" class="app">
      <aside id="sidebar" class="sidebar" aria-label="القائمة الرئيسية"></aside>
      <div class="app-body">
        <header id="topbar" class="topbar"></header>
        <main id="app-main" class="app-main" tabindex="-1">
          <div class="boot-screen" id="boot-screen">
            <h1>عربيتي</h1>
            <p>جاري فتح التطبيق...</p>
          </div>
        </main>
      </div>
      <nav id="bottom-nav" class="bottom-nav" aria-label="التنقل السفلي"></nav>
    </div>
    <div id="overlay-root" class="overlay-root"></div>
    <div id="toast-root" class="toast-root" aria-live="polite" aria-atomic="true"></div>
    <script>
${js}
    </script>
  </body>
</html>
`;
}

export function defaultOfflineTargets() {
  return [
    join(root, "dist", "arabity-offline.html"),
    join(root, "..", "public", "car", "arabity-offline.html"),
  ];
}

export async function writeOfflineHtml(targets = defaultOfflineTargets()) {
  const html = await buildOfflineHtml();
  for (const file of targets) {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }
  return { html, targets };
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const { targets } = await writeOfflineHtml();
  console.log("Wrote offline HTML:", targets.join(", "));
}
