"use client";

import { useEffect, useState } from "react";

function scrollToOrder() {
  const el = document.getElementById("order-form");
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 12;
  window.scrollTo({ top, behavior: "smooth" });
}

const SLIDES = [
  {
    src: "/images/plant/slides/home.png",
    title: "الصفحة الرئيسية",
    caption: "تبدأ من هنا: تفتح دليل النباتات أو تختار أداة العناية اللي محتاجها.",
  },
  {
    src: "/images/plant/slides/library.png",
    title: "دليل 77 نبات",
    caption: "بتدور بالعربي أو الإنجليزي، وتفلتر حسب الضوء والري والحيوانات.",
  },
  {
    src: "/images/plant/slides/doctor.png",
    title: "دكتور النباتات",
    caption: "بتختار النبات، وبعدين الأداة بتسألك سؤال سؤال لحد ما توصل للسبب.",
  },
  {
    src: "/images/plant/slides/watering.png",
    title: "أسقي دلوقتي؟",
    caption: "القرار من حالة التربة والنبات، مش من عدد الأيام لوحده.",
  },
  {
    src: "/images/plant/slides/soil.png",
    title: "خلطة التربة",
    caption: "نِسَب جاهزة بمواد المشاتل المصرية: بيتموس، بيرلايت، رمل، وكمبوست.",
  },
];

function PlantSlider() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const slide = SLIDES[index];
  return (
    <div className="plant-slider">
      <div className="plant-slider-frame">
        <img src={slide.src} alt={slide.title} />
      </div>
      <div className="plant-slider-caption">
        <b>{slide.title}</b>
        <p>{slide.caption}</p>
      </div>
      <div className="plant-slider-nav">
        <button type="button" onClick={() => setIndex((index - 1 + SLIDES.length) % SLIDES.length)} aria-label="السابق">
          →
        </button>
        <div className="plant-slider-dots">
          {SLIDES.map((item, i) => (
            <button
              key={item.src}
              type="button"
              className={i === index ? "active" : ""}
              onClick={() => setIndex(i)}
              aria-label={item.title}
            />
          ))}
        </div>
        <button type="button" onClick={() => setIndex((index + 1) % SLIDES.length)} aria-label="التالي">
          ←
        </button>
      </div>
    </div>
  );
}

export function PlantLandingPage({ whatsapp, price }: { whatsapp: string; price: number }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const wa = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    "أهلاً، حابب أعرف تفاصيل أكتر عن دليل رعاية النباتات المنزلية"
  )}`;

  const faqs = [
    {
      q: "هستلم المنتج إزاي؟",
      a: "بعد الدفع هيوصلك إيميل فيه لينك السيستم تفتحه وتستخدمه مباشرة، وكمان ملف تنزّله على موبايلك وتثبّته وتشتغل عليه. كل الخطوات مشروحة بالتفصيل في نفس الإيميل.",
    },
    {
      q: "ملف الموبايل من Google Play؟",
      a: "لأ. مش من المتجر. بتنزّل الملف من الإيميل وتثبّته على الموبايل مباشرة، وبعدين تفتح أيقونة دليل النباتات.",
    },
    {
      q: "ينفع على آيفون؟",
      a: "لينك السيستم يفتح على آيفون وعلى أي جهاز. ملف التثبيت ده لأندرويد.",
    },
    {
      q: "النباتات دي موجودة في مصر فعلًا؟",
      a: "أيوه. الكتالوج 77 نوع من اللي بيتباع في المشاتل والورود والبلكونات المصرية، بأسماء الناس بتستخدمها، وصورة حقيقية على كل كارت.",
    },
    {
      q: "في حساب أو اشتراك شهري؟",
      a: "لأ. تدفع مرة واحدة، وتستخدم اللينك أو الملف على الموبايل قد ما تحتاج. مفيش تسجيل دخول.",
    },
    {
      q: "خلطة التربة هتطلب مواد مش موجودة؟",
      a: "لأ. الخلطات بمواد السوق المصري: بيتموس، بيرلايت، رمل، تربة زراعية، تربة أصص، كمبوست، بيت جوز هند، وفحم نباتي.",
    },
  ];

  return (
    <div id="cro-landing-page" className="plant-lp">
      <div className="lp-topbar">
        🌿 سعر خاص — الدليل الكامل بـ <strong>{price} جنيه فقط</strong>
      </div>

      <section className="lp-hero" data-track-section="SectionHero">
        <div className="lp-container lp-hero-grid">
          <div className="lp-hero-copy">
            <div className="lp-eyebrow">دليل تفاعلي للنباتات المنزلية في مصر</div>
            <h1>اعرف نباتك، اسقيه صح، وأنقذه قبل ما يموت — من غير تخمين</h1>
            <p className="lp-hero-desc">
              سيستم كامل فيه <strong>77 نبات من المشاتل المصرية</strong> بصور حقيقية، وأدوات تشخيص وري وتربة ومكان النبات.
              هتستلم لينك السيستم تستخدمه مباشرة، وملف تنزّله على موبايلك وتثبّته وتشتغل عليه. تدفع مرة واحدة.
            </p>
            <div className="lp-hero-points">
              <div className="lp-hero-point">
                <div className="lp-check">✓</div>
                <div>كارت لكل نبات بصورة حقيقية عشان تتعرف عليه في المشتل.</div>
              </div>
              <div className="lp-hero-point">
                <div className="lp-check">✓</div>
                <div>دكتور نباتات يسألك سؤال سؤال ويوصّلك للسبب والتصرف.</div>
              </div>
              <div className="lp-hero-point">
                <div className="lp-check">✓</div>
                <div>لينك السيستم للاستخدام المباشر، وملف تثبّته على موبايلك وتشتغل عليه.</div>
              </div>
              <div className="lp-hero-point">
                <div className="lp-check">✓</div>
                <div>خلطات تربة بمواد موجودة في السوق المصري.</div>
              </div>
            </div>
            <div className="lp-price-line">
              <div className="lp-current-price">{price} جنيه</div>
              <div className="lp-old-price">1,490 جنيه</div>
              <div className="lp-price-badge">شراء لمرة واحدة</div>
            </div>
            <button className="lp-btn" onClick={scrollToOrder}>
              اطلب الدليل دلوقتي <span>←</span>
            </button>
            <div className="lp-small-note">📩 الإيميل بعد الشراء فيه اللينك وملف الموبايل، وكل الخطوات مشروحة بالتفصيل</div>
          </div>
          <div className="lp-hero-media">
            <div className="lp-main-image">
              <img src="/images/plant/hero.jpg" alt="دليل رعاية النباتات المنزلية" />
            </div>
            <div className="lp-floating-card">
              <b>77 نبات</b>
              من المشاتل المصرية
            </div>
          </div>
        </div>
      </section>

      <div className="lp-trust">
        <div className="lp-container lp-trust-grid">
          <div className="lp-trust-item">✓ نباتات مصر فقط</div>
          <div className="lp-trust-item">✓ لينك السيستم مباشر</div>
          <div className="lp-trust-item">✓ ملف تثبّته على الموبايل</div>
          <div className="lp-trust-item">✓ من غير اشتراك شهري</div>
        </div>
      </div>

      <section className="lp-section lp-preview" data-track-section="SectionPreview">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">سكرينات من جوه السيستم</div>
            <h2 className="lp-title">ده شكل الدليل من جوه… مش صور ديكور</h2>
            <p className="lp-subtitle">اسحب السلايدر وشوف الصفحة الرئيسية، دليل النباتات، دكتور النباتات، الري، وخلطة التربة.</p>
          </div>
          <PlantSlider />
        </div>
      </section>

      <section className="lp-section lp-problem" data-track-section="SectionProblem">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">المشكلة</div>
            <h2 className="lp-title">
              النبات بيتعب…
              <br />
              وأنت بتدور على نصيحة <span className="lp-highlight">عامة</span> مش مناسبة لبيتك.
            </h2>
            <p className="lp-subtitle">
              أغلب النصايح مكتوبة لدول تانية، أو بتقول اسقي كل كذا يوم من غير ما تشوف التربة ولا نوع النبات.
            </p>
          </div>
          <div className="lp-problem-grid">
            <div className="lp-problem-card">
              <div className="lp-problem-icon">🔍</div>
              <h3>مش عارف النبات اسمه إيه</h3>
              <p>بتشتري من المشتل من غير ما تحفظ شكله، وبعدين مش لاقي رعاية مظبوطة.</p>
            </div>
            <div className="lp-problem-card">
              <div className="lp-problem-icon">💧</div>
              <h3>الري بالتخمين</h3>
              <p>يا بتغرقه يا بتنساه. والرزنامة الثابتة بتكسر النباتات في حر مصر.</p>
            </div>
            <div className="lp-problem-card">
              <div className="lp-problem-icon">🪴</div>
              <h3>تربة مش موجودة في السوق</h3>
              <p>خلطات بتطلب لحاء وبيوميس مش بيتباعوا عندك، فتخلط غلط.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" data-track-section="SectionReceive">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">الاستلام</div>
            <h2 className="lp-title">هتستلم الملفات عبارة عن إيه؟</h2>
            <p className="lp-subtitle">
              لينك السيستم تستخدمه مباشرة، وملف تنزّله على موبايلك وتثبّته وتشتغل عليه. كل ده مشروح بالتفصيل في الإيميل بعد
              الشراء.
            </p>
          </div>
          <div className="lp-deliver-grid lp-deliver-grid-two">
            <div className="lp-deliver-card">
              <div className="lp-deliver-no">1</div>
              <h3>لينك السيستم</h3>
              <p>
                تفتح الدليل من اللينك على الموبايل أو الكمبيوتر وتستخدمه على طول. كل الأدوات شغالة: دليل النباتات، التشخيص،
                الري، التربة، المكان، والآفات.
              </p>
            </div>
            <div className="lp-deliver-card">
              <div className="lp-deliver-no">2</div>
              <h3>ملف تثبّته على الموبايل</h3>
              <p>
                تنزّل الملف على موبايلك، تثبّته، وتفتح السيستم من أيقونة على الشاشة. مش من Play Store — تثبيت مباشر من الملف.
              </p>
            </div>
          </div>
          <p className="lp-deliver-note">كل الخطوات هتكون مشروحة بالتفصيل في الإيميل اللي هيوصلك بعد الشراء.</p>
        </div>
      </section>

      <section className="lp-section" data-track-section="SectionTools">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">جوه السيستم</div>
            <h2 className="lp-title">إيه اللي هتستخدمه حتة حتة؟</h2>
            <p className="lp-subtitle">كل الأدوات بتقرأ من نفس دليل الـ 77 نبات. مفيش إجابات متناقضة.</p>
          </div>
          <div className="lp-get-list">
            {[
              {
                t: "دليل النباتات",
                d: "77 نوع من المشاتل المصرية بصورة حقيقية، اسم عربي زي ما بيتقال في السوق، ضوء، ري، تربة، وتحذيرات الحيوانات والأطفال.",
              },
              {
                t: "دكتور النباتات",
                d: "بتختار النبات والأعراض: اصفرار، تساقط، عفن، حروق شمس، حشرة. الأداة تمشي معاك سؤال سؤال وتديك السبب والتصرف.",
              },
              {
                t: "النبات المناسب",
                d: "قبل الشراء: ضوء البيت، البلكونة، الأطفال، والحيوانات. تعرف إيه النوع اللي يعيش عندك.",
              },
              {
                t: "أسقي دلوقتي؟",
                d: "حسب التربة والنبات والجو، مش روزنامة كل 3 أيام. عشان حر مصر بيغيّر الري كل أسبوع.",
              },
              {
                t: "خلطة التربة",
                d: "نِسَب جاهزة ببيتموس وبيرلايت ورمل وتربة زراعية وكمبوست وبيت جوز هند وفحم نباتي — اللي في المشاتل هنا.",
              },
              {
                t: "أحط النبات فين؟ + الآفات + الإنقاذ",
                d: "مكان الأصيص، تعريف الحشرة، وخطوات سريعة لو النبات ذبل بعد التشتيل أو الغرق أو النقل.",
              },
              {
                t: "بطاقات عناية + مخطط أسبوعي",
                d: "تطبع بطاقة لكل نبات ومخطط فحص وري وتعلّقهم جنب الأصيص. من غير تطبيق سحابي.",
              },
            ].map((item) => (
              <div className="lp-get-row" key={item.t}>
                <div className="tick">✓</div>
                <div>
                  <strong>{item.t}</strong>
                  <div>{item.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-center" style={{ marginTop: 28 }}>
            <button className="lp-btn" onClick={scrollToOrder}>
              عايز السيستم كامل <span>←</span>
            </button>
          </div>
        </div>
      </section>

      <section className="lp-section lp-speed">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">اشتغل أهدى</div>
            <h2 className="lp-title">
              من: &quot;جوجل قال اسقي كل يومين&quot;
              <br />
              إلى: &quot;اعرف النبات… وافحص التربة&quot;
            </h2>
          </div>
          <div className="lp-speed-grid">
            <div className="lp-state bad">
              <h3>❌ من غير الدليل</h3>
              <p>تدوير على اسم النبات بالإنجليزي.</p>
              <p>نصايح ري ثابتة.</p>
              <p>خلطات تربة مستوردة.</p>
              <p>تخمين مكان الأصيص.</p>
              <p>النبات يموت وأنت مش فاهم ليه.</p>
            </div>
            <div className="lp-arrow">←</div>
            <div className="lp-state good">
              <h3>✅ مع الدليل</h3>
              <p>تعرفه من الصورة والاسم المصري.</p>
              <p>تفحص التربة قبل الري.</p>
              <p>تخلط من مواد المشتل.</p>
              <p>تختار المكان حسب الضوء.</p>
              <p>لو تعب: دكتور النباتات يمشي معاك خطوة خطوة.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-bonus">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">مش الدليل بس</div>
            <h2 className="lp-title">
              جوه نفس السعر <span className="lp-highlight">اللينك وملف الموبايل وأدوات الطباعة</span>
            </h2>
          </div>
          <div className="lp-bonus-grid">
            <div className="lp-bonus-card">
              <div className="lp-bonus-badge">مضمّن</div>
              <div className="lp-bonus-number">1</div>
              <h3>بطاقات العناية</h3>
              <p>بطاقة لكل نبات: الضوء، الري، التحذير، والأخطاء الشائعة. تنفع تتطبع وتتحط جنب الأصيص.</p>
            </div>
            <div className="lp-bonus-card">
              <div className="lp-bonus-badge">مضمّن</div>
              <div className="lp-bonus-number">2</div>
              <h3>مخطط أسبوعي للطباعة</h3>
              <p>ورقة تتابع عليها الفحص والري من غير تسجيل دخول ومتابعة سحابية.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" data-track-section="SectionOffer">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">طريقة الاستلام</div>
            <h2 className="lp-title">3 خطوات والسيستم يبقى عندك</h2>
          </div>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-no">1</div>
              <h3>سجل طلبك</h3>
              <p>املأ بياناتك تحت، وحوّل بإنستاباي أو محفظة كاش وارفع سكرين التحويل.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-no">2</div>
              <h3>استلم الإيميل</h3>
              <p>هيوصلك لينك السيستم وملف الموبايل، وشرح خطوة بخطوة إزاي تستخدمهم.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-no">3</div>
              <h3>افتح اللي يناسبك</h3>
              <p>استخدم اللينك مباشرة، أو نزّل الملف وثبّته على الموبايل واشتغل من الأيقونة.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-offer">
        <div className="lp-container">
          <div className="lp-offer-box lp-center">
            <div className="lp-offer-label">شراء لمرة واحدة</div>
            <h2 className="lp-offer-title">كل اللي هتاخده النهاردة</h2>
            <div className="lp-stack">
              <div className="lp-stack-row">
                <div className="lp-stack-name">دليل 77 نبات + كل الأدوات</div>
                <div className="lp-stack-value">790 جنيه</div>
              </div>
              <div className="lp-stack-row">
                <div className="lp-stack-name">لينك السيستم + ملف تثبّته على الموبايل</div>
                <div className="lp-stack-value">400 جنيه</div>
              </div>
              <div className="lp-stack-row">
                <div className="lp-stack-name">بطاقات عناية + مخطط طباعة</div>
                <div className="lp-stack-value">300 جنيه</div>
              </div>
            </div>
            <div className="lp-total-value">
              <span>إجمالي القيمة</span>
              <span>1,490 جنيه</span>
            </div>
            <div className="lp-final-price">
              <div className="was">بدل 1,490 جنيه</div>
              <div className="now">{price} جنيه فقط</div>
            </div>
            <button className="lp-btn" onClick={scrollToOrder}>
              احصل على الدليل دلوقتي <span>←</span>
            </button>
            <div className="lp-small-note">مفيش اشتراك شهري — تدفع مرة واحدة</div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">FAQ</div>
            <h2 className="lp-title">أسئلة ممكن تكون في بالك</h2>
          </div>
          <div className="lp-faq">
            {faqs.map((item, index) => (
              <div className={`lp-faq-item ${openFaq === index ? "open" : ""}`} key={item.q}>
                <button
                  className="lp-faq-q"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  type="button"
                >
                  <span>{item.q}</span>
                  <span>{openFaq === index ? "−" : "+"}</span>
                </button>
                <div className="lp-faq-a">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-bottom">
        <div className="lp-container">
          <h2>جاهز تبطل تخمّن على نباتاتك؟</h2>
          <p>سيستم 77 نبات من مصر، وأدوات تشخيص وري وتربة، بـ {price} جنيه لمرة واحدة.</p>
          <button className="lp-btn" onClick={scrollToOrder}>
            اطلب الدليل بـ {price} جنيه <span>←</span>
          </button>
          <div className="lp-small-note">👇 اضغط وهتنزل مباشرةً لنموذج الطلب</div>
        </div>
      </section>

      <div className="lp-sticky">
        <div className="lp-sticky-price">
          الدليل كامل
          <strong>{price} جنيه</strong>
        </div>
        <button className="lp-scroll-order" onClick={scrollToOrder}>
          اطلب دلوقتي
        </button>
      </div>

      <a href={wa} className="lp-whatsapp" target="_blank" rel="noopener" aria-label="تواصل معنا على واتساب">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M19.11 17.44c-.26-.13-1.53-.75-1.77-.84-.24-.09-.41-.13-.59.13-.17.26-.68.84-.83 1.01-.15.17-.3.19-.56.06-.26-.13-1.08-.4-2.05-1.27-.76-.67-1.27-1.5-1.42-1.76-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.59-1.42-.8-1.94-.21-.51-.43-.44-.59-.45h-.5c-.17 0-.45.06-.68.32-.24.26-.89.87-.89 2.12 0 1.25.91 2.46 1.04 2.63.13.17 1.79 2.73 4.34 3.83.61.26 1.08.42 1.45.54.61.19 1.16.16 1.6.1.49-.07 1.53-.62 1.74-1.22.22-.6.22-1.12.15-1.22-.06-.11-.24-.17-.5-.3z" />
          <path d="M16.03 3C8.84 3 3 8.67 3 15.66c0 2.47.74 4.77 2.01 6.72L3 29l6.87-1.94a13.27 13.27 0 0 0 6.16 1.52C23.22 28.58 29 22.91 29 15.91 29 8.92 23.22 3 16.03 3zm0 23.43c-2.02 0-3.9-.54-5.53-1.48l-.4-.23-4.08 1.15 1.18-3.96-.26-.41a10.37 10.37 0 0 1-1.63-5.58c0-5.83 4.82-10.57 10.72-10.57 5.9 0 10.72 4.74 10.72 10.57 0 5.82-4.82 10.51-10.72 10.51z" />
        </svg>
      </a>
    </div>
  );
}
