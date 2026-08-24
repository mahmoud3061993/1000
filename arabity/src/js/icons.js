const svg = (path, extra = "") =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${path}</svg>`;

export const ICONS = {
  home: svg('<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  wrench: svg('<path d="M14.5 6.5a4 4 0 0 0-5.6 5.6L4 16.9 7.1 20l5-5a4 4 0 0 0 5.6-5.6L15 12z"/>'),
  chart: svg('<path d="M4 19h16M7 16v-5M12 16V8M17 16v-8"/>'),
  more: svg('<circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none"/>'),
  fuel: svg('<path d="M7 7h7v12H7zM14 10h2.5a2 2 0 0 1 2 2V17M16 7l2.5 2.5M9 4v3"/>'),
  car: svg('<path d="M4 13v4h2.2M18 17h2v-4M4 13l2-5h12l2 5M6.2 17a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2zm11.6 0a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z"/>'),
  doc: svg('<path d="M8 4h7l5 5v11H8zM15 4v5h5"/>'),
  tire: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/>'),
  battery: svg('<rect x="4" y="8" width="14" height="10" rx="2"/><path d="M18 11h2v4h-2M8 12h6"/>'),
  clock: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H8.7A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V8.7a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  search: svg('<circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/>'),
  filter: svg('<path d="M4 6h16M7 12h10M10 18h4"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  check: svg('<path d="M5 12.5 9.5 17 19 7.5"/>'),
  alert: svg('<path d="M12 9v4M12 17h.01M10.2 4.8 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.8 4.8a2 2 0 0 0-3.6 0z"/>'),
  trash: svg('<path d="M5 7h14M10 7V5h4v2M8 7l1 12h6l1-12"/>'),
  edit: svg('<path d="M4 20h4l10-10-4-4L4 16zM14 6l4 4"/>'),
  download: svg('<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>'),
  upload: svg('<path d="M12 20V8M7 13l5-5 5 5M5 4h14"/>'),
  print: svg('<path d="M7 8V4h10v4M7 16H5a1 1 0 0 1-1-1v-5h16v5a1 1 0 0 1-1 1h-2M7 13h10v7H7z"/>'),
  phone: svg('<path d="M7 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6L17 13l4 1.5V18a2 2 0 0 1-2 2A16 16 0 0 1 5 6a2 2 0 0 1 2-3z"/>'),
  star: svg('<path d="m12 3 2.6 5.4L21 9.2l-4.5 4.2L17.7 20 12 16.9 6.3 20l1.2-6.6L3 9.2l6.4-.8z"/>'),
  chevron: svg('<path d="M8 5l7 7-7 7"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  spark: svg('<path d="M12 3v4M12 17v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5"/>'),
  heart: svg('<path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20z"/>'),
  wallet: svg('<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M3 10h18M16 13.5h2"/>'),
  shop: svg('<path d="M4 9h16l-1 11H5zm2-5h12l2 5H4z"/>'),
  bell: svg('<path d="M6 16h12l-1-7a5 5 0 0 0-10 0zM10 16v1a2 2 0 0 0 4 0v-1"/>'),
  calendar: svg('<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4M16 4v4M4 11h16"/>'),
  info: svg('<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8h.01"/>'),
  shield: svg('<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/>'),
  moon: svg('<path d="M18 14.5A7 7 0 0 1 9.5 6 7 7 0 1 0 18 14.5z"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4 12H6M18 12h2M6 6l1.5 1.5M16.5 16.5 18 18M18 6l-1.5 1.5M7.5 16.5 6 18"/>'),
  list: svg('<path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/>'),
  share: svg('<circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="m8 11 8-4M8 13l8 4"/>'),
};

export function icon(name, size = 22) {
  const rawIcon = ICONS[name] || ICONS.info;
  return rawIcon.replace(/width="22" height="22"/, `width="${size}" height="${size}"`);
}
