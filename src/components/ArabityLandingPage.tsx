"use client";

import { type ReactNode } from "react";

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
        <b>4,720 جنيه</b>
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
      <div className="ar-chart">
        <span style={{ height: "70%" }} />
        <span style={{ height: "48%" }} />
        <span style={{ height: "86%" }} />
        <span style={{ height: "40%" }} />
        <span style={{ height: "62%" }} />
      </div>
    </div>
  );
}

const OUTCOMES = [
  {
    n: "01",
    title: "تعرف عربيتك بتصرف كام… بالظبط",
    text: "تموين كامل لتاني تموين كامل. الاستهلاك واللتر على الـ 100 كم بيتحسبوا من غير تخمين ومن غير ورقة في الدرج.",
  },
  {
    n: "02",
    title: "متأجلش صيانة ولا رخصة",
    text: "الزيت، الإطارات، البطارية، الرخصة، والتأمين قدامك بتاريخ. النظام ينبّهك قبل ما الحاجة تبوظ أو الغرامة تلحقك.",
  },
  {
    n: "03",
    title: "سجل الورشة والإصلاحات في مكان واحد",
    text: "القطعة، السعر، الورشة، والكيلومتر. لما العربية تتروح تاني، يبقى عندك التاريخ كامل مش من الذاكرة.",
  },
  {
    n: "04",
    title: "تقرير جاهز للطباعة",
    text: "مصاريف الشهر، البنزين، والصيانة في تقرير واحد. تنفع لنفسك أو لو بتسلّم حساب لحد تاني.",
  },
  {
    n: "05",
    title: "بياناتك على جهازك… مش على السحابة",
    text: "مفيش حساب، مفيش اشتراك، ومفيش نت بعد التحميل. تقدر تشغّل النسخة على الكمبيوتر أو تثبّتها على أندرويد.",
  },
];

const SCREENS = [
  {
    title: "لوحة التحكم",
    kicker: "من جوه النظام — الشاشة الرئيسية",
    text: "حالة العربية، درجة الصحة، أقرب صيانة، ومصاريف الشهر في نظرة واحدة.",
    screen: "dashboard" as const,
  },
  {
    title: "سجل البنزين",
    kicker: "من جوه النظام — التموين",
    text: "كل تموين بيتسجل، والاستهلاك بيتحسب من تموين كامل للتاني.",
    screen: "fuel" as const,
  },
  {
    title: "التقارير والطباعة",
    kicker: "من جوه النظام — الملخص",
    text: "شوف الفلوس راحت فين، واطبع تقرير جاهز من غير إكسل.",
    screen: "reports" as const,
  },
];

const WHO = [
  "صاحب عربية زهق يعد على الورق أو الإكسل",
  "ناس عندهم أكتر من عربية وعايزين سجل منفصل لكل واحدة",
  "اللي بيروح الورشة وعايز يعرف اتدفع إيه واتغيّر إيه",
  "اللي عايز يعرف البنزين بياكل كام من غير تطبيقات سحابية",
];

export function ArabityLandingPage({
  whatsapp,
  price,
  compareAtPrice,
}: {
  whatsapp: string;
  price: number;
  compareAtPrice: number;
}) {
  const wa = `https://wa.me/${whatsapp}?text=${encodeURIComponent("أهلاً، حابب أعرف تفاصيل أكتر عن عربيتي")}`;

  return (
    <div className="arabity-lp">
      <div className="ar-topbar">
        سعر خاص — النظام كامل بـ <strong>{price} جنيه</strong> · شراء لمرة واحدة
      </div>

      <section className="ar-hero" data-track-section="SectionHero">
        <div className="ar-wrap ar-hero-grid">
          <div className="ar-hero-copy">
            <div className="ar-kicker">تطبيق عربي · بدون حساب · بدون نت بعد التحميل</div>
            <h1>
              كل حاجة تخص عربيتك… <em>في مكان واحد.</em>
            </h1>
            <p>
              سجّل البنزين والصيانة والمصاريف والمستندات. شوف التقرير واطبعه.
              البيانات بتفضل على جهازك — مش على حساب سحابي، ومش اشتراك شهري.
            </p>
            <ul className="ar-hero-points">
              <li>بنزين من تموين كامل لتاني تموين كامل</li>
              <li>صيانة، إطارات، بطارية، رخص، وورش</li>
              <li>أكتر من عربية + نسخة احتياطية JSON</li>
            </ul>
            <div className="ar-hero-cta">
              <button type="button" className="ar-btn" onClick={scrollToOrder}>
                احصل على عربيتي دلوقتي
              </button>
              <div className="ar-price-inline">
                <b>{price} جنيه</b>
                <s>{compareAtPrice.toLocaleString("en-EG")} جنيه</s>
              </div>
            </div>
            <div className="ar-hero-meta">وصول فوري · ويب + كمبيوتر أوفلاين + أندرويد</div>
          </div>
          <PhoneChrome label="من جوه عربيتي — لوحة التحكم">
            <DashboardScreen />
          </PhoneChrome>
        </div>
      </section>

      <section className="ar-section" data-track-section="SectionProblem">
        <div className="ar-wrap">
          <div className="ar-section-head">
            <span>01</span>
            <h2>من أول التموين لأول تقرير… إيه اللي هتقدر تعمله بنفسك؟</h2>
            <p>
              عربيتي مش مفكرة ملاحظات. هو سجل تشغيل للعربية: فلوس، كيلومتر، مواعيد، وورشة —
              مترتبين زي ما بتستخدم العربية في اليوم العادي.
            </p>
          </div>
          <div className="ar-outcomes">
            {OUTCOMES.map((item) => (
              <article key={item.n} className="ar-outcome">
                <div className="ar-outcome-n">{item.n}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ar-section ar-section-screens" data-track-section="SectionPreview">
        <div className="ar-wrap">
          <div className="ar-section-head">
            <span>02</span>
            <h2>شوف شكل النظام من جوه… مش كلام على المنتج.</h2>
            <p>السكاشن دي من نفس الشاشات اللي هتفتحها بعد الدفع. مكان الفيديو: سكرين حقيقي من عربيتي.</p>
          </div>
          <div className="ar-screen-grid">
            {SCREENS.map((item) => (
              <article key={item.title} className="ar-screen-card">
                <div className="ar-screen-card-media">
                  {item.screen === "dashboard" ? (
                    <PhoneChrome>
                      <DashboardScreen />
                    </PhoneChrome>
                  ) : null}
                  {item.screen === "fuel" ? (
                    <PhoneChrome>
                      <FuelScreen />
                    </PhoneChrome>
                  ) : null}
                  {item.screen === "reports" ? (
                    <PhoneChrome>
                      <ReportsScreen />
                    </PhoneChrome>
                  ) : null}
                </div>
                <div className="ar-screen-card-copy">
                  <small>{item.kicker}</small>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ar-section" data-track-section="SectionTools">
        <div className="ar-wrap">
          <div className="ar-section-head">
            <span>03</span>
            <h2>إيه بالضبط اللي هتوصلك بعد الدفع؟</h2>
            <p>تدفع مرة واحدة. مفيش اشتراك. هتستلم السيستم تشتغل عليه على طول، وثلاث ملفات على الدرايف.</p>
          </div>
          <div className="ar-deliver">
            <article>
              <div className="ar-deliver-n">1</div>
              <h3>لينك السيستم</h3>
              <p>تفتح عربيتي من الموبايل أو الكمبيوتر وتبدأ تسجّل عربيتك. مفيش تسجيل دخول.</p>
            </article>
            <article>
              <div className="ar-deliver-n">2</div>
              <h3>ملف HTML أوفلاين</h3>
              <p>نفس النظام ملف واحد على اللابتوب. تفتحه من غير نت، والبيانات بتتحفظ عندك.</p>
            </article>
            <article>
              <div className="ar-deliver-n">3</div>
              <h3>تطبيق أندرويد + الدليل</h3>
              <p>APK تثبّته يدويًا، ودليل استخدام بالعربي يشرح أول فتح والنسخ الاحتياطي.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="ar-section ar-who" data-track-section="SectionReceive">
        <div className="ar-wrap ar-who-grid">
          <div>
            <div className="ar-section-head ar-section-head-left">
              <span>04</span>
              <h2>المنتج ده معمول لمين؟</h2>
            </div>
            <ul>
              {WHO.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="ar-who-aside">
            <p>مش كورس فيديو. مش اشتراك شهري. القيمة في السجل اللي بيتبني عندك كل تموين وكل صيانة.</p>
            <button type="button" className="ar-btn ar-btn-ghost" onClick={scrollToOrder}>
              انزل على سعر العرض
            </button>
          </div>
        </div>
      </section>

      <section className="ar-section ar-offer" data-track-section="SectionOffer">
        <div className="ar-wrap">
          <div className="ar-offer-box">
            <div className="ar-offer-label">شراء لمرة واحدة</div>
            <h2>عربيتي كامل — ويب، كمبيوتر، وأندرويد</h2>
            <div className="ar-stack">
              <div>
                <span>نظام إدارة العربية كامل</span>
                <b>490 جنيه</b>
              </div>
              <div>
                <span>نسخة أوفلاين للكمبيوتر + أندرويد</span>
                <b>300 جنيه</b>
              </div>
              <div>
                <span>دليل الاستخدام والنسخ الاحتياطي</span>
                <b>200 جنيه</b>
              </div>
            </div>
            <div className="ar-offer-total">
              <span>إجمالي القيمة</span>
              <s>{compareAtPrice.toLocaleString("en-EG")} جنيه</s>
            </div>
            <div className="ar-offer-now">
              <small>بدل {compareAtPrice.toLocaleString("en-EG")} جنيه</small>
              <strong>{price} جنيه فقط</strong>
            </div>
            <button type="button" className="ar-btn" onClick={scrollToOrder}>
              اطلب عربيتي دلوقتي
            </button>
            <p className="ar-offer-note">الدفع بفيزا أو محفظة أو إنستاباي — نفس طرق المتجر</p>
          </div>
        </div>
      </section>

      <div className="ar-sticky">
        <div>
          عربيتي كامل
          <strong>{price} جنيه</strong>
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
