const routes = new Map();
let current = "dashboard";
let params = {};

export function register(name, render) {
  routes.set(name, render);
}

export function parseHash() {
  const raw = (window.location.hash || "#/dashboard").replace(/^#\/?/, "");
  const [name, query] = raw.split("?");
  const p = {};
  if (query) {
    for (const part of query.split("&")) {
      const [k, v] = part.split("=");
      if (k) p[decodeURIComponent(k)] = decodeURIComponent(v || "");
    }
  }
  return { name: name || "dashboard", params: p };
}

export function go(name, p = {}) {
  const q = Object.keys(p)
    .filter((k) => p[k] != null && p[k] !== "")
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(p[k])}`)
    .join("&");
  window.location.hash = `#/${name}${q ? `?${q}` : ""}`;
}

export function currentRoute() {
  return { name: current, params };
}

export async function render() {
  const { name, params: p } = parseHash();
  current = routes.has(name) ? name : "dashboard";
  params = p;
  const fn = routes.get(current);
  const root = document.getElementById("app-main");
  if (!fn) return;
  root.innerHTML = "";
  await fn(root, params);
  window.scrollTo(0, 0);
}

export function start() {
  window.addEventListener("hashchange", () => render());
  if (!window.location.hash) window.location.hash = "#/dashboard";
  else render();
}

export function back() {
  if (window.history.length > 1) window.history.back();
  else go("dashboard");
}
