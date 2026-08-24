export type ProductSlug = "1000" | "plant" | "arabity";

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
  return value === "1000" || value === "plant" || value === "arabity";
}

export function resolveProductSlug(value: string | null | undefined): ProductSlug {
  return isProductSlug(value) ? value : "1000";
}

export function productAdminLabel(slug?: string | null) {
  if (slug === "plant") return "دليل النباتات";
  if (slug === "arabity") return "عربيتي";
  return "مكتبة +1000";
}

export function getCatalogProduct(
  slug?: string | null,
  env: NodeJS.Dict<string> = process.env
): CatalogProduct {
  if (slug === "arabity") {
    return {
      slug: "arabity",
      name: "عربيتي",
      arabicName: "عربيتي — كل حاجة تخص عربيتك في مكان واحد",
      shortName: "عربيتي",
      price: Number(env.ARABITY_PRODUCT_PRICE || 299),
      compareAtPrice: Number(env.ARABITY_COMPARE_AT_PRICE || 990),
      currency: "EGP",
      pixelName: "Arabity Car Tracker",
      kashierDescription: "عربيتي — نظام إدارة العربية",
      checkoutTitle: "عربيتي — نظام إدارة العربية",
      whatsappMessage: "أهلاً، حابب أعرف تفاصيل أكتر عن عربيتي",
      path: "/carlanding",
      thankYouCta: "افتح فولدر الملفات",
      thankYouBody:
        "شكراً {name}. فولدر الدرايف تحت فيه 3 ملفات: الدليل، السيستم، وتطبيق الأندرويد. التفاصيل على الإيميل.",
      pendingBody:
        "استلمنا سكرين شوت إنستاباي. أول ما نتأكد من التحويل هنبعتلك عربيتي على الإيميل.",
    };
  }

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
