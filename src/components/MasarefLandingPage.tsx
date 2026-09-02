"use client";

import { useEffect, useState, type ReactNode } from "react";

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
    <div className="ms-phone">
      <div className="ms-phone-bezel">
        <div className="ms-phone-bar">
          <span>9:41</span>
          <span className="ms-phone-notch" />
          <span>LTE</span>
        </div>
        {children}
      </div>
      {label ? <div className="ms-phone-caption">{label}</div> : null}
    </div>
  );
}

function DailyScreen() {
  return (
    <div className="ms-screen" dir="rtl">
      <div className="ms-screen-top">
        <div>
          <small>مصارف</small>
          <strong>مسموحلك تصرف النهارده</strong>
        </div>
        <span className="ms-pill">أوفلاين</span>
      </div>
      <div className="ms-daily">
        <small>الحد اليومي</small>
        <b>216 جنيه</b>
        <span>من 6,500 متاح بعد الالتزامات</span>
      </div>
      <div className="ms-warn">
        ⚠️ إنت صرفت 38% من ميزانية الخروجات ولسه فاضل 22 يوم.
      </div>
      <div className="ms-mini">
        <div>
          <small>اتصرف</small>
          <b>7,850</b>
        </div>
        <div>
          <small>المتاح الحقيقي</small>
          <b>2,650</b>
        </div>
      </div>
    </div>
  );
}

function RunwayScreen() {
  return (
    <div className="ms-screen" dir="rtl">
      <div className="ms-screen-top">
        <div>
          <small>فلوسي راحت فين؟</small>
          <strong>أكتر 3 حاجات بتاكل فلوسك</strong>
        </div>
      </div>
      <div className="ms-runway">
        <small>🔥 Hero Feature</small>
        <p>لو كملت بنفس معدل صرفك الحالي، فلوسك هتخلص يوم 23 سبتمبر.</p>
      </div>
      <div className="ms-eat">
        <div>
          <span>طلبات أكل</span>
          <b>1,850 ج</b>
        </div>
        <div>
          <span>قهوة وخروجات</span>
          <b>1,300 ج</b>
        </div>
        <div>
          <span>مشتريات غير مخطط لها</span>
          <b>970 ج</b>
        </div>
      </div>
    </div>
  );
}

function DecideScreen() {
  return (
    <div className="ms-screen" dir="rtl">
      <div className="ms-screen-top">
        <div>
          <small>قرار قبل الشراء</small>
          <strong>ينفع أشتريها؟</strong>
        </div>
      </div>
      <div className="ms-buy-amt">
        <small>المبلغ</small>
        <b>1,500 جنيه</b>
      </div>
      <div className="ms-yellow">
        🟡 تقدر تشتريها، لكن مصروفك اليومي لباقي الشهر هينزل من 230 إلى 164 جنيه.
      </div>
      <div className="ms-red">
        🔴 أو: الشراء دلوقتي هيخليك تتخطى ميزانيتك بـ 780 جنيه.
      </div>
    </div>
  );
}

function StreakScreen() {
  return (
    <div className="ms-screen" dir="rtl">
      <div className="ms-screen-top">
        <div>
          <small>No-Spend Days</small>
          <strong>النهارده من غير إسراف</strong>
        </div>
      </div>
      <div className="ms-streak">
        <b>3 🔥</b>
        <span>Streak</span>
        <p>🟢 النهارده مفيش مصروفات غير أساسية</p>
      </div>
      <div className="ms-week">
        <div>
          <small>الأسبوع اللي فات</small>
          <b>1,740</b>
        </div>
        <div>
          <small>الأسبوع ده</small>
          <b>1,280</b>
        </div>
      </div>
      <p className="ms-saved">وفّرت 460 جنيه 👏</p>
    </div>
  );
}

const PAINS = [
  {
    title: "المرتب بيختفي",
    text: "يوم 20 بتسأل نفسك: الفلوس راحت فين؟ ومفيش إجابة واضحة.",
  },
  {
    title: "التسجيل لوحده مش بيمنع الإسراف",
    text: "آخر الشهر Chart تقولك صرفت 4,700 مطاعم. خلاص الفلوس راحت.",
  },
  {
    title: "البدائل مجانية ومتخمة Features",
    text: "Spendee وMoney Manager عندهم كل حاجة. المشكلة مش عدد الشاشات.",
  },
  {
    title: "بتتحمس أسبوع وبتبطل",
    text: "لأن التطبيق بيطلب منك تبقى محاسب، وانت محتاج حد يمسك إيدك يوم بيوم.",
  },
];

const VALUE_ITEMS = [
  "نسخة الكمبيوتر Offline (HTML)",
  "تطبيق Android",
  "حد صرف يومي محسوب من مرتبك",
  "تحذير قبل ما فلوسك تخلص",
  "ينفع أشتريها؟ — قرار قبل الشراء",
  "أكتر 3 حاجات بتاكل فلوسك",
  "No-Spend Days وستريك",
  "مقارنة الأسبوع باللي فات",
  "تنبيهات قواعد من غير تكلفة AI",
  "Backup / Restore",
  "دليل استخدام سريع",
];

const FAQS = [
  {
    q: "هل السيستم محتاج إنترنت؟",
    a: "لا. نسخة الكمبيوتر وتطبيق أندرويد يشتغلوا أوفلاين بعد التحميل.",
  },
  {
    q: "هل فيه اشتراك شهري؟",
    a: "لا. دفع مرة واحدة 399 جنيه.",
  },
  {
    q: "ده Expense Tracker تاني؟",
    a: "لأ. إحنا مش بنبيع تسجيل مصروفات. بنبيع حد للصرف وتحذير قبل ما تتزنق.",
  },
  {
    q: "بيشتغل على الموبايل؟",
    a: "أيوه، فيه نسخة تطبيق Android.",
  },
  {
    q: "بيشتغل على الكمبيوتر؟",
    a: "أيوه، ملف HTML تفتحه من غير نت.",
  },
  {
    q: "بيشتغل على iPhone؟",
    a: "نسخة التطبيق الحالية لأندرويد. على آيفون استخدم ملف HTML من الكمبيوتر أو المتصفح.",
  },
  {
    q: "هل بياناتي بتترفع على سيرفر؟",
    a: "لا. البيانات على جهازك.",
  },
  {
    q: "هستلم المنتج إزاي؟",
    a: "بعد تأكيد الدفع هيوصلك إيميل بفولدر Google Drive فيه السيستم HTML، الدليل، وتطبيق الأندرويد APK.",
  },
];

const SCREENS = [
  { title: "الحد اليومي", text: "مش ميزانية آخر الشهر. مسموحلك تصرف كام النهاردة.", screen: "daily" as const },
  { title: "فلوسي هتخلص إمتى", text: "Hero Feature: لو كملت بنفس المعدل، الفلوس هتخلص يوم كام.", screen: "runway" as const },
  { title: "ينفع أشتريها؟", text: "قبل ما تشتري بحاجة بـ1,500، السيستم يقولك هتعمل إيه في باقي الشهر.", screen: "decide" as const },
  { title: "أيام من غير إسراف", text: "ستريك ومقارنة أسبوعية عشان تحس بمكسب مش بـbookkeeping.", screen: "streak" as const },
];

function ScreenCard({ item }: { item: (typeof SCREENS)[number] }) {
  return (
    <article className="ms-screen-card">
      <div className="ms-screen-card-media">
        <PhoneChrome>
          {item.screen === "daily" ? <DailyScreen /> : null}
          {item.screen === "runway" ? <RunwayScreen /> : null}
          {item.screen === "decide" ? <DecideScreen /> : null}
          {item.screen === "streak" ? <StreakScreen /> : null}
        </PhoneChrome>
      </div>
      <div className="ms-screen-card-copy">
        <h3>{item.title}</h3>
        <p>{item.text}</p>
      </div>
    </article>
  );
}

export function MasarefLandingPage({
  whatsapp,
  price,
}: {
  whatsapp: string;
  price: number;
}) {
  const [showSticky, setShowSticky] = useState(false);
  const wa = `https://wa.me/${whatsapp}?text=${encodeURIComponent("أهلاً، حابب أعرف تفاصيل أكتر عن مصارف")}`;

  useEffect(() => {
    const hero = document.getElementById("ms-hero");
    const checkout = document.getElementById("price") || document.getElementById("order-form");
    if (!hero || !("IntersectionObserver" in window)) return;
    const state = { hero: true, checkout: false };
    const sync = () => setShowSticky(!state.hero && !state.checkout);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target.id === "ms-hero") state.hero = entry.isIntersecting;
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
    <div className={`masaref-lp${showSticky ? " ms-has-sticky" : ""}`}>
      <div className="ms-topbar">مصارف — {price} جنيه · دفع مرة واحدة · بدون اشتراك</div>

      <section id="ms-hero" className="ms-hero" data-track-section="SectionHero">
        <div className="ms-wrap ms-hero-grid">
          <div className="ms-hero-copy">
            <div className="ms-kicker">سيستم السيطرة على المصروفات</div>
            <h1>مرتبك بيخلص قبل آخر الشهر ومش عارف الفلوس بتروح فين؟</h1>
            <p>
              السيستم هيكشفلك إنت بتصرف فلوسك في إيه، ويحطلك حد للصرف قبل ما فلوسك تخلص.
              مش بنبيع تسجيل مصروفات. بنبيع علاج لسلوك الإسراف.
            </p>
            <ul className="ms-hero-points ms-checks">
              <li>مسموحلك تصرف النهارده: رقم واضح، مش Chart آخر الشهر</li>
              <li>تحذير يوم 8 قبل ما الخروجات تبلع الشهر</li>
              <li>قرار قبل الشراء: ينفع أشتريها ولا هتتزنق؟</li>
            </ul>
            <div className="ms-hero-price">{price} جنيه — دفع مرة واحدة</div>
            <div className="ms-hero-cta">
              <button type="button" className="ms-btn" onClick={() => scrollToId("ms-preview")}>
                شوف السيستم من جوه
              </button>
            </div>
            <div className="ms-hero-meta">يشتغل أوفلاين — مفيش اشتراك — بياناتك على جهازك</div>
          </div>
          <PhoneChrome label="أول ما تفتح مصارف — الحد اليومي">
            <DailyScreen />
          </PhoneChrome>
        </div>
      </section>

      <section className="ms-section" data-track-section="SectionProblem">
        <div className="ms-wrap">
          <div className="ms-section-head">
            <h2>المشكلة مش إنك مش بتسجل. المشكلة إنك بتعرف متأخر.</h2>
          </div>
          <div className="ms-pain-grid">
            {PAINS.map((item) => (
              <article key={item.title} className="ms-pain-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ms-section ms-outcomes-section" data-track-section="SectionOutcomes">
        <div className="ms-wrap">
          <div className="ms-section-head">
            <h2>الرحلة واحدة: من المرتب لحد الصرف لحد التحذير</h2>
          </div>
          <div className="ms-kpi-grid">
            <article className="ms-kpi-card">
              <h3>المتاح بعد الالتزامات</h3>
              <b>6,500 جنيه</b>
              <small>من مرتب 15,000</small>
            </article>
            <article className="ms-kpi-card">
              <h3>مسموحلك النهارده</h3>
              <b>216 جنيه</b>
              <small>قبل ما الفلوس تروح</small>
            </article>
            <article className="ms-kpi-card">
              <h3>هتخلص إمتى؟</h3>
              <b>23 سبتمبر</b>
              <small>لو كملت بنفس المعدل</small>
            </article>
          </div>
          <div className="ms-center-cta">
            <button type="button" className="ms-btn" onClick={scrollToOrder}>
              عايز السيستم
            </button>
          </div>
        </div>
      </section>

      <section id="ms-preview" className="ms-section ms-section-screens" data-track-section="SectionPreview">
        <div className="ms-wrap">
          <div className="ms-section-head">
            <h2>شوف السيستم من جوه</h2>
            <p>السكاشن دي من نفس الشاشات اللي هتفتحها بعد الدفع.</p>
          </div>
          <div className="ms-screen-grid">
            {SCREENS.map((item) => (
              <ScreenCard key={item.title} item={item} />
            ))}
          </div>
          <div className="ms-center-cta">
            <button type="button" className="ms-btn" onClick={scrollToOrder}>
              اطلب مصارف
            </button>
          </div>
        </div>
      </section>

      <section className="ms-section" data-track-section="SectionReceive">
        <div className="ms-wrap">
          <div className="ms-section-head">
            <h2>لما تطلب مصارف هيوصلك إيه؟</h2>
          </div>
          <ul className="ms-package">
            {VALUE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="ms-package-note">كل ده بدفع مرة واحدة. من غير اشتراك.</p>
          <div className="ms-center-cta">
            <button type="button" className="ms-btn" onClick={scrollToOrder}>
              اطلب مصارف
            </button>
          </div>
        </div>
      </section>

      <section className="ms-section ms-trust" data-track-section="SectionTrust">
        <div className="ms-wrap">
          <div className="ms-trust-box">
            <h2>فلوسك وبياناتك ملكك إنت</h2>
            <p>مفيش حساب، مفيش سيرفر، ومفيش AI بيسحب منك تكلفة كل شهر. القواعد بتشتغل على جهازك.</p>
            <div className="ms-trust-icons">
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

      <section className="ms-section" data-track-section="SectionFaq">
        <div className="ms-wrap ms-faq">
          <div className="ms-section-head">
            <h2>أسئلة ممكن تكون في بالك</h2>
          </div>
          {FAQS.map((item) => (
            <details key={item.q} className="ms-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
          <div className="ms-center-cta">
            <button type="button" className="ms-btn" onClick={scrollToOrder}>
              اطلب مصارف
            </button>
          </div>
        </div>
      </section>

      <section className="ms-section ms-offer" data-track-section="SectionOffer">
        <div className="ms-wrap">
          <div className="ms-offer-box">
            <div className="ms-offer-label">باكدج مصارف كاملة</div>
            <h2>مش هنقولك فلوسك راحت فين بس... هنساعدك متصرفهاش غلط من الأول.</h2>
            <ul className="ms-offer-list">
              <li>نسخة الكمبيوتر أوفلاين</li>
              <li>تطبيق Android</li>
              <li>حد يومي + تحذير قبل الزنقة</li>
              <li>ينفع أشتريها؟</li>
              <li>Backup / Restore</li>
            </ul>
            <div className="ms-offer-now">
              <small>السعر الحالي</small>
              <strong>{price} جنيه</strong>
            </div>
            <p className="ms-offer-note">دفع مرة واحدة — بدون اشتراك</p>
            <button type="button" className="ms-btn" onClick={scrollToOrder}>
              اطلب مصارف
            </button>
          </div>
        </div>
      </section>

      <div className={`ms-sticky${showSticky ? " is-on" : ""}`}>
        <div>مصارف — {price} جنيه</div>
        <button type="button" onClick={scrollToOrder}>
          اطلب دلوقتي
        </button>
      </div>

      <a href={wa} className="ms-wa" target="_blank" rel="noopener" aria-label="تواصل معنا على واتساب">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M19.11 17.44c-.26-.13-1.53-.75-1.77-.84-.24-.09-.41-.13-.59.13-.17.26-.68.84-.83 1.01-.15.17-.3.19-.56.06-.26-.13-1.08-.4-2.05-1.27-.76-.67-1.27-1.5-1.42-1.76-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.59-1.42-.8-1.94-.21-.51-.43-.44-.59-.45h-.5c-.17 0-.45.06-.68.32-.24.26-.89.87-.89 2.12 0 1.25.91 2.46 1.04 2.63.13.17 1.79 2.73 4.34 3.83.61.26 1.08.42 1.45.54.61.19 1.16.16 1.6.1.49-.07 1.53-.62 1.74-1.22.22-.6.22-1.12.15-1.22-.06-.11-.24-.17-.5-.3z" />
          <path d="M16.03 3C8.84 3 3 8.67 3 15.66c0 2.47.74 4.77 2.01 6.72L3 29l6.87-1.94a13.27 13.27 0 0 0 6.16 1.52C23.22 28.58 29 22.91 29 15.91 29 8.92 23.22 3 16.03 3zm0 23.43c-2.02 0-3.9-.54-5.53-1.48l-.4-.23-4.08 1.15 1.18-3.96-.26-.41a10.37 10.37 0 0 1-1.63-5.58c0-5.83 4.82-10.57 10.72-10.57 5.9 0 10.72 4.74 10.72 10.57 0 5.82-4.82 10.51-10.72 10.51z" />
        </svg>
      </a>
    </div>
  );
}

export function MasarefCheckoutLead({ price }: { price: number }) {
  return (
    <div className="ms-checkout-lead">
      <h2>اطلب سيستم مصارف</h2>
      <p>هتاخد:</p>
      <ul>
        <li>نسخة الكمبيوتر HTML</li>
        <li>تطبيق Android</li>
        <li>دليل الاستخدام</li>
        <li>استخدام أوفلاين</li>
        <li>دفع مرة واحدة</li>
      </ul>
      <div className="ms-checkout-lead-price">{price} جنيه</div>
      <div className="ms-delivery-note">
        <strong>الاستلام على الإيميل</strong>
        <p>ملفات السيستم هتوصلك على نفس الإيميل اللي هتسجّل بيه في الطلب. تأكد إنه إيميل تقدر تفتحه.</p>
      </div>
      <p className="ms-pay-note">الدفع بإنستاباي أو محفظة كاش. حوّل وارفع سكرين التحويل، وبعدين هنتأكد من الدفع يدوي.</p>
    </div>
  );
}

export function MasarefClosing({ price }: { price: number }) {
  return (
    <section className="ms-section ms-close">
      <div className="ms-wrap">
        <h2>مش هنقولك فلوسك راحت فين بس... هنساعدك متصرفهاش غلط من الأول.</h2>
        <p>حد يومي، تحذير بدري، وقرار قبل الشراء — للشخص اللي مرتبه بيخلّص ومش عارف راح فين.</p>
        <div className="ms-hero-price">{price} جنيه — مرة واحدة</div>
        <button type="button" className="ms-btn" onClick={scrollToOrder}>
          اطلب مصارف دلوقتي
        </button>
      </div>
    </section>
  );
}
