const routes = new Map();
let current = "dashboard";

export function register(id, render) {
  routes.set(id, render);
}

export function currentRoute() {
  return current;
}

export function go(id, params = {}) {
  current = id || "dashboard";
  const search = new URLSearchParams(params);
  const q = search.toString();
  const hash = q ? `#/${current}?${q}` : `#/${current}`;
  if (location.hash !== hash) history.pushState(null, "", hash);
  return render();
}

export function routeParams() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [id, query] = raw.split("?");
  const params = Object.fromEntries(new URLSearchParams(query || ""));
  return { id: id || "dashboard", params };
}

export async function render() {
  const { id, params } = routeParams();
  current = routes.has(id) ? id : "dashboard";
  const fn = routes.get(current);
  const main = document.getElementById("app-main");
  if (!fn || !main) return;
  const html = await fn(params);
  if (typeof html === "string") main.innerHTML = html;
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.nav === current);
  });
  window.scrollTo(0, 0);
}

export function start() {
  window.addEventListener("hashchange", () => render());
  if (!location.hash) location.hash = "#/dashboard";
  else render();
}
