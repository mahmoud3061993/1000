"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const ARABITY_DEMO_VIDEO_SRC = "/arabity-demo.mp4";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 12;
  window.scrollTo({ top, behavior: "smooth" });
}

function scrollToOrder() {
  const el = document.getElementById("price") || document.getElementById("order-form");
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 12;
  window.scrollTo({ top, behavior: "smooth" });
}

function PhoneChrome({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="ar-phone">
      <div className="ar-phone-bezel">
        <div className="ar-phone-bar">
          <span>9:41</span>
          <span className="ar-phone-notch" />
          <span>LTE</span>
        </div>
        {children}
      </div>
      {label ? <div className="ar-phone-caption">{label}</div> : null}
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="ar-screen" dir="rtl">
      <div className="ar-screen-top">
        <div>
          <small>عربيتي</small>
          <strong>كيا سيراتو 2021</strong>
        </div>
        <span className="ar-pill">أوفلاين</span>
      </div>
      <div className="ar-health">
        <div className="ar-ring">
          <b>82</b>
          <span>الصحة</span>
        </div>
        <div className="ar-health-copy">
          <p>العربية في حالة جيدة</p>
          <small>أقرب صيانة: تغيير زيت بعد 420 كم</small>
        </div>
      </div>
      <div className="ar-stats">
        <div>
          <small>بنزين الشهر</small>
          <b>1,840 ج</b>
        </div>
        <div>
          <small>الاستهلاك</small>
          <b>7.4 ل/100</b>
        </div>
        <div>
          <small>مصاريف</small>
          <b>3,260 ج</b>
        </div>
      </div>
      <div className="ar-row">
        <span>تغيير الزيت</span>
        <em>باقي 420 كم</em>
      </div>
      <div className="ar-row ar-row-warn">
        <span>رخصة العربية</span>
        <em>بعد 18 يوم</em>
      </div>
    </div>
  );
}

function FuelScreen() {
  return (
    <div className="ar-screen" dir="rtl">
      <div className="ar-screen-top">
        <div>
          <small>سجل البنزين</small>
          <strong>من تموين لتاني</strong>
        </div>
      </div>
      <div className="ar-fuel-hero">
        <b>7.4</b>
        <span>لتر / 100 كم</span>
      </div>
      <div className="ar-bars">
        <i style={{ height: "42%" }} />
        <i style={{ height: "58%" }} />
        <i style={{ height: "51%" }} />
        <i style={{ height: "70%" }} />
        <i style={{ height: "46%" }} />
        <i style={{ height: "63%" }} />
      </div>
      <div className="ar-list">
        <div>
          <span>تموين كامل · 38 لتر</span>
          <b>1,140 ج</b>
        </div>
        <div>
          <span>تموين كامل · 36 لتر</span>
          <b>1,080 ج</b>
        </div>
        <div>
          <span>تموين كامل · 40 لتر</span>
          <b>1,200 ج</b>
        </div>
      </div>
    </div>
  );
}

function MaintenanceScreen() {
  return (
    <div className="ar-screen" dir="rtl">
      <div className="ar-screen-top">
        <div>
          <small>الصيانة</small>
          <strong>الجاي واللي اتعمل</strong>
        </div>
      </div>
      <div className="ar-health">
        <div className="ar-health-copy">
          <p>تغيير الزيت</p>
          <small>باقي 850 كم — قبل ما العربية تفاجئك</small>
        </div>
      </div>
      <div className="ar-row">
        <span>كاوتش</span>
        <em>باقي 3,200 كم</em>
      </div>
      <div className="ar-row ar-row-warn">
        <span>رخصة العربية</span>
        <em>بعد 18 يوم</em>
      </div>
      <div className="ar-row">
        <span>البطارية</span>
        <em>اتغيرت من 11 شهر</em>
      </div>
    </div>
  );
}

function ReportsScreen() {
  return (
    <div className="ar-screen" dir="rtl">
      <div className="ar-screen-top">
        <div>
          <small>التقارير</small>
          <strong>ملخص الشهر</strong>
        </div>
        <span className="ar-pill ar-pill-print">طباعة</span>
      </div>
      <div className="ar-report-total">
        <small>إجمالي المصاريف</small>
        <b>7,420 جنيه</b>
      </div>
      <div className="ar-split">
        <div>
          <span>بنزين</span>
          <em>39%</em>
        </div>
        <div>
          <span>صيانة</span>
          <em>28%</em>
        </div>
        <div>
          <span>إصلاحات</span>
          <em>21%</em>
        </div>
        <div>
          <span>أخرى</span>
          <em>12%</em>
        </div>
      </div>
    </div>
  );
}

function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  async function startPlayback() {
    const video = videoRef.current;
    if (!video) return;
    setStarted(true);
    try {
      video.muted = false;
      await video.play();
    } catch {
      try {
        video.muted = true;
        await video.play();
      } catch {
        /* Native controls stay visible so the visitor can try again. */
      }
    }
  }

  if (failed) {
    return (
      <div className="ar-demo-placeholder">
        <strong>الفيديو مش قادر يشتغل على المتصفح ده</strong>
        <p>
          افتحه مباشرة من{" "}
          <a href={ARABITY_DEMO_VIDEO_SRC} target="_blank" rel="noreferrer">
            اللينك ده
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="ar-demo-frame">
      <video
        ref={videoRef}
        className="ar-demo-video"
        src={ARABITY_DEMO_VIDEO_SRC}
        poster="/arabity-demo.jpg"
        controls
        playsInline
        preload="metadata"
        title="شوف عربيتي وهو شغال"
        dir="ltr"
        onPlay={() => setStarted(true)}
        onError={() => setFailed(true)}
        {...{ "webkit-playsinline": "true" }}
      />
      {started ? null : (
        <button type="button" className="ar-demo-start" onClick={startPlayback} aria-label="تشغيل الفيديو">
          <span className="ar-demo-play" aria-hidden="true">
            ▶
          </span>
          تشغيل الفيديو
        </button>
      )}
    </div>
  );
}

const PAINS = [
  {
    title: "مصاريف مفاجئة",
    text: "صيانة، زيت، كاوتش، ترخيص أو إصلاح يظهر فجأة ويلخبط ميزانية الشهر.",
  },
  {
    title: "مش فاكر آخر صيانة",
    text: "آخر تغيير زيت؟ البطارية بقالها قد إيه؟ الرخصة هتخلص إمتى؟",
  },
  {
    title: "المعلومات في كذا مكان",
    text: "فاتورة هنا، صورة على واتساب، رقم في الملاحظات... ومفيش سجل واحد مرتب.",
  },
  {
    title: "مش عارف التكلفة الحقيقية",
    text: "البنزين مش هو تكلفة العربية كلها.",
  },
];

const VALUE_ITEMS = [
  "نسخة الكمبيوتر Offline",
  "تطبيق Android",
  "متابعة البنزين",
  "متابعة الصيانة",
  "تسجيل الإصلاحات والمصاريف",
  "متابعة الترخيص والتأمين",
  "تقارير المصاريف",
  "سجل كامل للعربية",
  "Backup / Restore",
  "دليل استخدام سريع",
  "فيديو شرح الاستخدام",
];

const FAQS = [
  {
    q: "هل السيستم محتاج إنترنت؟",
    a: "لا، نسخة الكمبيوتر وتطبيق أندرويد يقدروا يشتغلوا أوفلاين.",
  },
  {
    q: "هل فيه اشتراك شهري؟",
    a: "لا، الدفع مرة واحدة.",
  },
  {
    q: "بيشتغل على الموبايل؟",
    a: "أيوه، فيه نسخة تطبيق Android.",
  },
  {
    q: "بيشتغل على الكمبيوتر؟",
    a: "أيوه، فيه نسخة للكمبيوتر تقدر تستخدمها من غير إنترنت.",
  },
  {
    q: "بيشتغل على iPhone؟",
    a: "نسخة التطبيق الحالية مخصصة لأندرويد. تقدر تستخدم نسخة الكمبيوتر بشكل منفصل.",
  },
  {
    q: "لو غيرت الموبايل أعمل إيه؟",
    a: "تقدر تستخدم خاصية Backup / Restore لنقل بياناتك.",
  },
  {
    q: "هل بياناتي بتترفع على سيرفر؟",
    a: "لا، بياناتك محفوظة عندك على جهازك.",
  },
  {
    q: "ينفع أضيف أكتر من عربية؟",
    a: "أيوه، السيستم يدعم أكتر من عربية.",
  },
  {
    q: "هل لازم أكون فاهم في العربيات؟",
    a: "لا، السيستم معمول لصاحب العربية العادي ومصمم بطريقة بسيطة.",
  },
  {
    q: "هستلم المنتج إزاي؟",
    a: "بعد تأكيد الدفع هيوصلك إيميل بفولدر Google Drive فيه 3 ملفات: ملف السيستم للكمبيوتر (HTML)، ملف الدليل، وتطبيق الأندرويد (APK).",
  },
];

const SCREENS = [
  {
    title: "لوحة التحكم",
    text: "اعرف إجمالي مصاريف عربيتك في ثواني",
    screen: "dashboard" as const,
  },
  {
    title: "البنزين",
    text: "تابع البنزين ومتوسط الاستهلاك",
    screen: "fuel" as const,
  },
  {
    title: "الصيانة",
    text: "خليك عارف الصيانة الجاية إمتى",
    screen: "maintenance" as const,
  },
  {
    title: "التقارير",
    text: "شوف فلوسك راحت فين",
    screen: "reports" as const,
  },
];

function ScreenCard({ item }: { item: (typeof SCREENS)[number] }) {
  return (
    <article className="ar-screen-card">
      <div className="ar-screen-card-media">
        <PhoneChrome>
          {item.screen === "dashboard" ? <DashboardScreen /> : null}
          {item.screen === "fuel" ? <FuelScreen /> : null}
          {item.screen === "maintenance" ? <MaintenanceScreen /> : null}
          {item.screen === "reports" ? <ReportsScreen /> : null}
        </PhoneChrome>
      </div>
      <div className="ar-screen-card-copy">
        <h3>{item.title}</h3>
        <p>{item.text}</p>
      </div>
    </article>
  );
}

export function ArabityLandingPage({
  whatsapp,
  price,
}: {
  whatsapp: string;
  price: number;
}) {
  const [showSticky, setShowSticky] = useState(false);
  const wa = `https://wa.me/${whatsapp}?text=${encodeURIComponent("أهلاً، حابب أعرف تفاصيل أكتر عن عربيتي")}`;

  useEffect(() => {
    const hero = document.getElementById("ar-hero");
    const checkout = document.getElementById("price") || document.getElementById("order-form");
    if (!hero || !("IntersectionObserver" in window)) return;

    const state = { hero: true, checkout: false };
    const sync = () => setShowSticky(!state.hero && !state.checkout);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target.id === "ar-hero") state.hero = entry.isIntersecting;
          else state.checkout = entry.isIntersecting;
        }
        sync();
      },
      { threshold: 0.12 }
    );
    observer.observe(hero);
    if (checkout) observer.observe(checkout);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`arabity-lp${showSticky ? " ar-has-sticky" : ""}`}>
      <div className="ar-topbar">عربيتي — {price} جنيه · دفع مرة واحدة · بدون اشتراك</div>

      <section id="ar-hero" className="ar-hero" data-track-section="SectionHero">
        <div className="ar-wrap ar-hero-grid">
          <div className="ar-hero-copy">
            <div className="ar-kicker">لأصحاب العربيات في مصر</div>
            <h1>كل شوية عربيتك تفاجئك بمصروف مكنتش عامل حسابه؟</h1>
            <p>
              سيستم عربيتي يخليك تعرف عربيتك بتكلفك كام، إيه اللي اتعمل فيها، وإيه اللي قرب ميعاده...
              قبل ما المصاريف تفاجئك.
            </p>
            <ul className="ar-hero-points ar-checks">
              <li>اعرف عربيتك بتكلفك كام كل شهر</li>
              <li>متنساش مواعيد الصيانة والتجديدات</li>
              <li>سجل كل حاجة تخص عربيتك في مكان واحد</li>
            </ul>
            <div className="ar-hero-price">{price} جنيه — دفع مرة واحدة</div>
            <div className="ar-hero-cta">
              <button type="button" className="ar-btn" onClick={scrollToOrder}>
                عايز أعرف تفاصيل السيستم
              </button>
              <button type="button" className="ar-btn ar-btn-ghost" onClick={() => scrollToId("ar-demo")}>
                شوف تفاصيل أكتر
              </button>
            </div>
            <div className="ar-hero-meta">يشتغل أوفلاين — مفيش اشتراك شهري — بياناتك محفوظة عندك</div>
          </div>
          <PhoneChrome label="من جوه عربيتي — لوحة التحكم">
            <DashboardScreen />
          </PhoneChrome>
        </div>
      </section>

      <section id="ar-demo" className="ar-section ar-demo" data-track-section="SectionDemo">
        <div className="ar-wrap">
          <div className="ar-section-head">
            <h2>شوف عربيتي وهو شغال</h2>
            <p>
              في أقل من دقيقة شوف إزاي تسجل مصروف أو صيانة، والسيستم يحسبلك عربيتك كلفتك كام ويقولك
              إيه اللي قرب ميعاده.
            </p>
          </div>
          <DemoVideo />
          <div className="ar-center-cta">
            <button type="button" className="ar-btn" onClick={scrollToOrder}>
              عايز السيستم
            </button>
          </div>
        </div>
      </section>

      <section className="ar-section" data-track-section="SectionProblem">
        <div className="ar-wrap">
          <div className="ar-section-head">
            <h2>المشكلة مش إن العربية بتصرف... المشكلة إنك غالبًا مش عارف بتصرف كام وإمتى.</h2>
          </div>
          <div className="ar-pain-grid">
            {PAINS.map((item) => (
              <article key={item.title} className="ar-pain-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ar-section ar-outcomes-section" data-track-section="SectionOutcomes">
        <div className="ar-wrap">
          <div className="ar-section-head">
            <h2>عربيتي بيحول كل ده لصورة واضحة</h2>
          </div>
          <div className="ar-kpi-grid">
            <article className="ar-kpi-card">
              <h3>اعرف عربيتك بتكلفك كام</h3>
              <b>7,420 جنيه</b>
              <small>في الشهر</small>
            </article>
            <article className="ar-kpi-card">
              <h3>اعرف إيه اللي قرب ميعاده</h3>
              <b>تغيير الزيت</b>
              <small>باقي 850 كم</small>
            </article>
            <article className="ar-kpi-card ar-kpi-timeline">
              <h3>اعرف اتعمل إيه قبل كده</h3>
              <ol>
                <li>تفويلة</li>
                <li>تغيير زيت</li>
                <li>كاوتش</li>
                <li>إصلاح</li>
              </ol>
            </article>
          </div>
          <div className="ar-center-cta">
            <button type="button" className="ar-btn" onClick={scrollToOrder}>
              اطلب سيستم عربيتي
            </button>
          </div>
        </div>
      </section>

      <section className="ar-section ar-section-screens" data-track-section="SectionPreview">
        <div className="ar-wrap">
          <div className="ar-section-head">
            <h2>شوف السيستم من جوه</h2>
            <p>السكاشن دي من نفس الشاشات اللي هتفتحها بعد الدفع.</p>
          </div>
          <div className="ar-screen-grid">
            {SCREENS.map((item) => (
              <ScreenCard key={item.title} item={item} />
            ))}
          </div>
          <div className="ar-center-cta">
            <button type="button" className="ar-btn" onClick={scrollToOrder}>
              اطلب سيستم عربيتي
            </button>
          </div>
        </div>
      </section>

      <section className="ar-section" data-track-section="SectionReceive">
        <div className="ar-wrap">
          <div className="ar-section-head">
            <h2>لما تطلب عربيتي هيوصلك إيه؟</h2>
          </div>
          <ul className="ar-package">
            {VALUE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="ar-package-note">كل ده بدفع مرة واحدة.</p>
          <div className="ar-center-cta">
            <button type="button" className="ar-btn" onClick={scrollToOrder}>
              اطلب سيستم عربيتي
            </button>
          </div>
        </div>
      </section>

      <section className="ar-section ar-proof" data-track-section="SectionProof">
        <div className="ar-wrap">
          <div className="ar-section-head">
            <h2>ناس بدأت تستخدم عربيتي</h2>
            <p>بنضيف آراء المستخدمين الحقيقية أول بأول.</p>
          </div>
          <div className="ar-proof-grid">
            {["رأي 1", "رأي 2", "رأي 3"].map((label) => (
              <article key={label} className="ar-proof-slot" data-replace="arabity-testimonial">
                <span>مكان رأي عميل حقيقي</span>
                <small>حط هنا سكرين واتساب أو تقييم حقيقي</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ar-section ar-trust" data-track-section="SectionTrust">
        <div className="ar-wrap">
          <div className="ar-trust-box">
            <h2>بيانات عربيتك ملكك إنت</h2>
            <p>عربيتي مش محتاج حساب أو تسجيل دخول، وبياناتك بتفضل محفوظة على جهازك.</p>
            <div className="ar-trust-icons">
              <div>
                <b>أوفلاين</b>
                <span>من غير نت بعد التحميل</span>
              </div>
              <div>
                <b>من غير حساب</b>
                <span>مفيش تسجيل دخول</span>
              </div>
              <div>
                <b>على جهازك</b>
                <span>مش على سيرفر</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ar-section" data-track-section="SectionFaq">
        <div className="ar-wrap ar-faq">
          <div className="ar-section-head">
            <h2>أسئلة ممكن تكون في بالك</h2>
          </div>
          {FAQS.map((item) => (
            <details key={item.q} className="ar-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
          <div className="ar-center-cta">
            <button type="button" className="ar-btn" onClick={scrollToOrder}>
              اطلب سيستم عربيتي
            </button>
          </div>
        </div>
      </section>

      <section className="ar-section ar-offer" data-track-section="SectionOffer">
        <div className="ar-wrap">
          <div className="ar-offer-box">
            <div className="ar-offer-label">باكدج عربيتي كاملة</div>
            <h2>كل الملفات والأدوات في طلب واحد</h2>
            <ul className="ar-offer-list">
              <li>نسخة الكمبيوتر أوفلاين</li>
              <li>تطبيق Android</li>
              <li>دليل الاستخدام</li>
              <li>سجل البنزين والصيانة والمصاريف</li>
              <li>Backup / Restore</li>
            </ul>
            <div className="ar-offer-now">
              <small>السعر الحالي</small>
              <strong>{price} جنيه</strong>
            </div>
            <p className="ar-offer-note">دفع مرة واحدة — بدون اشتراك</p>
            <button type="button" className="ar-btn" onClick={scrollToOrder}>
              اطلب سيستم عربيتي
            </button>
          </div>
        </div>
      </section>

      <div className={`ar-sticky${showSticky ? " is-on" : ""}`}>
        <div>
          عربيتي — {price} جنيه
        </div>
        <button type="button" onClick={scrollToOrder}>
          اطلب دلوقتي
        </button>
      </div>

      <a href={wa} className="ar-wa" target="_blank" rel="noopener" aria-label="تواصل معنا على واتساب">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M19.11 17.44c-.26-.13-1.53-.75-1.77-.84-.24-.09-.41-.13-.59.13-.17.26-.68.84-.83 1.01-.15.17-.3.19-.56.06-.26-.13-1.08-.4-2.05-1.27-.76-.67-1.27-1.5-1.42-1.76-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.59-1.42-.8-1.94-.21-.51-.43-.44-.59-.45h-.5c-.17 0-.45.06-.68.32-.24.26-.89.87-.89 2.12 0 1.25.91 2.46 1.04 2.63.13.17 1.79 2.73 4.34 3.83.61.26 1.08.42 1.45.54.61.19 1.16.16 1.6.1.49-.07 1.53-.62 1.74-1.22.22-.6.22-1.12.15-1.22-.06-.11-.24-.17-.5-.3z" />
          <path d="M16.03 3C8.84 3 3 8.67 3 15.66c0 2.47.74 4.77 2.01 6.72L3 29l6.87-1.94a13.27 13.27 0 0 0 6.16 1.52C23.22 28.58 29 22.91 29 15.91 29 8.92 23.22 3 16.03 3zm0 23.43c-2.02 0-3.9-.54-5.53-1.48l-.4-.23-4.08 1.15 1.18-3.96-.26-.41a10.37 10.37 0 0 1-1.63-5.58c0-5.83 4.82-10.57 10.72-10.57 5.9 0 10.72 4.74 10.72 10.57 0 5.82-4.82 10.51-10.72 10.51z" />
        </svg>
      </a>
    </div>
  );
}

export function ArabityCheckoutLead({ price }: { price: number }) {
  return (
    <div className="ar-checkout-lead">
      <h2>اطلب سيستم عربيتي</h2>
      <p>هتاخد:</p>
      <ul>
        <li>نسخة الكمبيوتر</li>
        <li>تطبيق Android</li>
        <li>دليل الاستخدام</li>
        <li>استخدام أوفلاين</li>
        <li>دفع مرة واحدة</li>
      </ul>
      <div className="ar-checkout-lead-price">{price} جنيه</div>
      <p className="ar-pay-note">الدفع بفيزا أو محفظة عبر كاشير، أو إنستاباي.</p>
    </div>
  );
}

export function ArabityClosing({ price }: { price: number }) {
  return (
    <section className="ar-section ar-close">
      <div className="ar-wrap">
        <h2>بدل ما عربيتك تفاجئك... خليك إنت عارف كل حاجة عنها.</h2>
        <p>مصاريفها، صيانتها، مواعيدها، وكل اللي اتعمل فيها — في مكان واحد.</p>
        <div className="ar-hero-price">{price} جنيه — مرة واحدة</div>
        <button type="button" className="ar-btn" onClick={scrollToOrder}>
          اطلب عربيتي دلوقتي
        </button>
      </div>
    </section>
  );
}
