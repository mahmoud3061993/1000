export type ProductSlug = "1000" | "plant";

export type CatalogProduct = {
  slug: ProductSlug;
  name: string;
  arabicName: string;
  shortName: string;
  price: number;
  compareAtPrice: number;
  currency: "EGP";
  pixelName: string;
  kashierDescription: string;
  checkoutTitle: string;
  whatsappMessage: string;
  path: string;
  thankYouCta: string;
  thankYouBody: string;
  pendingBody: string;
};

export function isProductSlug(value: string | null | undefined): value is ProductSlug {
  return value === "1000" || value === "plant";
}

export function getCatalogProduct(
  slug?: string | null,
  env: NodeJS.Dict<string> = process.env
): CatalogProduct {
  if (slug === "plant") {
    return {
      slug: "plant",
      name: "دليل إنقاذ ورعاية النباتات المنزلية",
      arabicName: "دليل إنقاذ ورعاية النباتات المنزلية",
      shortName: "دليل النباتات",
      price: Number(env.PLANT_PRODUCT_PRICE || 350),
      compareAtPrice: Number(env.PLANT_COMPARE_AT_PRICE || 1490),
      currency: "EGP",
      pixelName: "Plant Care Guide",
      kashierDescription: "دليل إنقاذ ورعاية النباتات المنزلية",
      checkoutTitle: "دليل إنقاذ ورعاية النباتات المنزلية",
      whatsappMessage: "أهلاً، حابب أعرف تفاصيل أكتر عن دليل رعاية النباتات المنزلية",
      path: "/buydoctorplant",
      thankYouCta: "افتح الدليل دلوقتي",
      thankYouBody: "شكراً {name}. لينك السيستم تحت، وملف الموبايل وخطوات التثبيت مشروحة في الإيميل.",
      pendingBody: "استلمنا سكرين شوت إنستاباي. أول ما نتأكد من التحويل هنبعتلك لينك الدليل على الإيميل.",
    };
  }

  return {
    slug: "1000",
    name: env.PRODUCT_NAME || "+1000 winning conversion ads canva editable templates",
    arabicName: "مكتبة +1000 تصميم إعلان Canva",
    shortName: "مكتبة الإعلانات",
    price: Number(env.PRODUCT_PRICE || 235),
    compareAtPrice: Number(env.PRODUCT_COMPARE_AT_PRICE || 2870),
    currency: (env.PRODUCT_CURRENCY || "EGP") as "EGP",
    pixelName: "+1000 Canva Ads",
    kashierDescription: "+1000 Canva Ads Templates",
    checkoutTitle: "+1000 winning conversion ads canva editable templates",
    whatsappMessage: "أهلاً، حابب أعرف تفاصيل أكتر عن باقة +1000 Canva Ads Templates",
    path: "/products/1000",
    thankYouCta: "افتح المكتبة دلوقتي",
    thankYouBody: "شكراً {name}. المكتبة هتوصلك على الإيميل، وتقدر تفتحها من الرابط تحت.",
    pendingBody: "استلمنا سكرين شوت إنستاباي. أول ما نتأكد من التحويل هنبعتلك المكتبة على الإيميل.",
  };
}

export const PRODUCT = getCatalogProduct("1000");
