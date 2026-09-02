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
  const rawHash = location.hash.replace(/^#\/?/, "");
  const [id, query] = rawHash.split("?");
  const params = Object.fromEntries(new URLSearchParams(query || ""));
  return { id: id || "dashboard", params };
}

export async function render() {
  const { id, params } = routeParams();
  current = routes.has(id) ? id : "dashboard";
  const fn = routes.get(current);
  const main = document.getElementById("app-main");
  if (!fn || !main) return;
  const result = await fn(params);
  const html = result && typeof result === "object" && "html" in result ? result.html : result;
  if (typeof html === "string") main.innerHTML = html;
  result?.bind?.();
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
