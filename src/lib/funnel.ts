export const LANDING_SECTIONS = [
  { id: "hero", event: "SectionHero", label: "أول الصفحة" },
  { id: "problem", event: "SectionProblem", label: "المشكلة" },
  { id: "preview", event: "SectionPreview", label: "صور النظام" },
  { id: "tools", event: "SectionTools", label: "الأدوات" },
  { id: "receive", event: "SectionReceive", label: "هتستلم إيه" },
  { id: "offer", event: "SectionOffer", label: "سعر العرض" },
] as const;

export type LandingSectionEvent = (typeof LANDING_SECTIONS)[number]["event"];

export function isFunnelOnlyEvent(name: string) {
  return name.startsWith("Scroll") || name.startsWith("Section") || name === "CheckoutView";
}
