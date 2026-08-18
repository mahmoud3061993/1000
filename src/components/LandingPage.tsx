"use client";

import { useState } from "react";

function scrollToOrder() {
  const el = document.getElementById("order-form");
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 12;
  window.scrollTo({ top, behavior: "smooth" });
}

export function LandingPage({ whatsapp }: { whatsapp: string }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const wa = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    "أهلاً، حابب أعرف تفاصيل أكتر عن باقة +1000 Canva Ads Templates"
  )}`;

  const faqs = [
    {
      q: "هل لازم أكون Designer عشان أستخدم الـ Templates؟",
      a: "لأ. التصميمات جاهزة بالفعل، وكل اللي محتاج تعمله إنك تغير النصوص والصور والألوان بما يناسب البراند أو المنتج بتاعك.",
    },
    {
      q: "هل التصميمات قابلة للتعديل؟",
      a: "أيوه. التصميمات قابلة للتعديل على Canva، وتقدر تعدل النصوص والصور والألوان والعناصر المختلفة.",
    },
    {
      q: "مقاس التصميمات إيه؟",
      a: "التصميمات الأساسية الموجودة في المكتبة بمقاس 1:1، المناسب جدًا لاستخدامات Social Media Ads.",
    },
    {
      q: "هل التصميمات تضمن إني أحقق مبيعات؟",
      a: "مفيش Creative يقدر يضمن نتائج لوحده؛ النتيجة بتعتمد كمان على المنتج والعرض والاستهداف والسعر والموقع وعوامل تانية. المكتبة هدفها إنها تديك أفكار وLayouts مبنية على Designs استخدمت في Conversion Ads وحققت نتائج قبل كده، وتساعدك تعمل Testing أسرع بدل ما تبدأ كل مرة من الصفر.",
    },
    {
      q: "هستلم الملفات إزاي؟",
      a: "بعد إتمام الطلب هيجيلك Email فيه رابط Google Drive، وجواه كل الملفات والروابط والتعليمات المطلوبة.",
    },
    {
      q: "هل الـ 860 Template جزء من الـ 1000؟",
      a: "لأ. الـ +1000 Template الأساسية مخصصة للإعلانات، أما الـ +860 Template فهي مكتبة إضافية مختلفة للمحتوى الـ Organic على Social Media.",
    },
  ];

  return (
    <div id="cro-landing-page">
      <div className="lp-topbar">
        🔥 سعر خاص لفترة محدودة — احصل على الباقة كاملة دلوقتي بـ <strong>235 جنيه فقط</strong>
      </div>

      <section className="lp-hero">
        <div className="lp-container lp-hero-grid">
          <div className="lp-hero-copy">
            <div className="lp-eyebrow">+1000 High Converting Ads Canva Templates</div>
            <h1>
              أكتر من 1000 تصميم جاهز ناجح في الـ <strong>Conversion Ads</strong> تقدر تعدل فيهم وتعيد استخدامهم
            </h1>
            <p className="lp-hero-desc">
              مكتبة فيها أكتر من <strong>1000 تصميم إعلان قابل للتعديل بالكامل على Canva</strong> مبنية على أفكار وتصميمات تم استخدامها في Conversion Ads وحققت نتائج قبل كده.
            </p>
            <div className="lp-hero-points">
              <div className="lp-hero-point">
                <div className="lp-check">✓</div>
                <div>تصميمات جاهزة تخليك تبدأ من Creative Idea مجربة بدل ما تدور بالساعات.</div>
              </div>
              <div className="lp-hero-point">
                <div className="lp-check">✓</div>
                <div>تعديل كامل للنصوص والألوان والصور والعناصر مباشرةً على Canva.</div>
              </div>
              <div className="lp-hero-point">
                <div className="lp-check">✓</div>
                <div>مناسبة للـ E-commerce والعروض والإعلانات العامة ومجالات مختلفة.</div>
              </div>
              <div className="lp-hero-point">
                <div className="lp-check">✓</div>
                <div>
                  ومعاها <strong>2 Bonus مجانًا</strong> قيمتهم لوحدهم أكتر من سعر الباقة.
                </div>
              </div>
            </div>
            <div className="lp-price-line">
              <div className="lp-current-price">235 جنيه</div>
              <div className="lp-old-price">2,870 جنيه</div>
              <div className="lp-price-badge">عرض محدود</div>
            </div>
            <button className="lp-btn" onClick={scrollToOrder}>
              احصل على المكتبة دلوقتي <span>←</span>
            </button>
            <div className="lp-small-note">📩 كل الملفات والتفاصيل هتوصلك على الإيميل بعد إتمام الطلب</div>
          </div>
          <div className="lp-hero-media">
            <div className="lp-main-image">
              <img src="/images/hero.png" alt="1000+ High Converting Canva Ads Templates" />
            </div>
            <div className="lp-floating-card">
              <b>+1000 Template</b>
              قابلة للتعديل على Canva
            </div>
          </div>
        </div>
      </section>

      <div className="lp-trust">
        <div className="lp-container lp-trust-grid">
          <div className="lp-trust-item">✓ تعديل كامل على Canva</div>
          <div className="lp-trust-item">✓ مقاس 1:1 جاهز للإعلانات</div>
          <div className="lp-trust-item">✓ استلام إلكتروني سريع</div>
          <div className="lp-trust-item">✓ +1860 Template إجمالي</div>
        </div>
      </div>

      <section className="lp-section lp-problem">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">Creative Fatigue</div>
            <h2 className="lp-title">
              المشكلة مش إنك مش عارف تصمم…
              <br />
              المشكلة إنك كل مرة بتبدأ من <span className="lp-highlight">الصفر.</span>
            </h2>
            <p className="lp-subtitle">
              لو بتشغل إعلانات باستمرار فأنت عارف إن الـ Creative بيتحرق، وبالتالي محتاج أفكار جديدة طول الوقت.
            </p>
          </div>
          <div className="lp-problem-grid">
            <div className="lp-problem-card">
              <div className="lp-problem-icon">🔎</div>
              <h3>ساعات بتضيع في البحث</h3>
              <p>تفتح Ads Library وPinterest وInstagram وتفضل تدور على فكرة إعلان مناسبة تبدأ منها.</p>
            </div>
            <div className="lp-problem-card">
              <div className="lp-problem-icon">🎨</div>
              <h3>كل Creative يبدأ من الصفر</h3>
              <p>حتى لما تكون عارف أنت عايز تقول إيه، بيبقى السؤال: التصميم نفسه شكله يبقى عامل إزاي؟</p>
            </div>
            <div className="lp-problem-card">
              <div className="lp-problem-icon">📉</div>
              <h3>أفكار كتير شكلها حلو… بس مش للبيع</h3>
              <p>فيه فرق بين Design شكله جميل وبين Ad Creative معمول عشان يوقف الـ Scroll ويوصل الرسالة بسرعة.</p>
            </div>
          </div>
          <div className="lp-solution-wrap">
            <p>
              عشان كده بدل ما تبدأ من Blank Canvas، ادخل على مكتبة فيها <strong>+1000 Ad Templates</strong> جاهزين، اختار الفكرة الأقرب لمنتجك وعدلها على Canva في دقائق.
            </p>
          </div>
        </div>
      </section>

      <section className="lp-section lp-preview">
        <div className="lp-container">
          <div className="lp-center">
            <h2 className="lp-title">Designs معمولة عشان تبيع… مش مجرد Designs شكلها حلو</h2>
            <p className="lp-subtitle">
              Templates مبنية على Advertising Angles وLayouts اتستخدمت في Conversion Ads وحققت نتائج قبل كده.
            </p>
          </div>
          <div className="lp-preview-grid">
            <div className="lp-preview-card">
              <img src="/images/preview-1.png" alt="Canva Ad Templates Preview" />
            </div>
            <div className="lp-preview-card">
              <img src="/images/preview-2.png" alt="High Converting Ads Designs" />
            </div>
            <div className="lp-preview-card">
              <img src="/images/preview-3.png" alt="Canva Ad Template Before And After" />
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">+1000 تصميم</div>
            <h2 className="lp-title">مش Template واحد بيتكرر 1000 مرة</h2>
            <p className="lp-subtitle">المكتبة فيها أفكار مختلفة تقدر تستخدمها في أنواع حملات ومنتجات مختلفة.</p>
          </div>
          <div className="lp-categories">
            <div className="lp-category">
              <div className="emoji">🛒</div>
              <h3>E-commerce Ads</h3>
              <p>تصميمات مناسبة للمنتجات والمتاجر والعروض والـ Product Benefits.</p>
            </div>
            <div className="lp-category">
              <div className="emoji">📢</div>
              <h3>General Conversion Ads</h3>
              <p>أفكار عامة تقدر تطبقها على أكتر من مجال ومنتج أو خدمة.</p>
            </div>
            <div className="lp-category">
              <div className="emoji">🔥</div>
              <h3>Offers & Sales</h3>
              <p>تصميمات للعروض والخصومات والـ Black Friday والمناسبات.</p>
            </div>
            <div className="lp-category">
              <div className="emoji">💡</div>
              <h3>Problem / Solution</h3>
              <p>Layouts بتوضح المشكلة والحل بسرعة وبتناسب Direct Response Ads.</p>
            </div>
            <div className="lp-category">
              <div className="emoji">⭐</div>
              <h3>Benefits & Features</h3>
              <p>تصميمات تبرز الـ Features والBenefits بشكل واضح وسريع الفهم.</p>
            </div>
            <div className="lp-category">
              <div className="emoji">📱</div>
              <h3>Meta & Instagram Ads</h3>
              <p>كل التصميمات بمقاس 1:1 ومناسبة للاستخدام في Social Ads.</p>
            </div>
          </div>
          <div className="lp-center" style={{ marginTop: 35 }}>
            <button className="lp-btn" onClick={scrollToOrder}>
              عايز المكتبة كاملة <span>←</span>
            </button>
          </div>
        </div>
      </section>

      <section className="lp-section lp-speed">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">اشتغل أسرع</div>
            <h2 className="lp-title">
              من: &quot;هنعمل الإعلان شكله إيه؟&quot;
              <br />
              إلى: &quot;اختار وعدّل وانشر&quot;
            </h2>
          </div>
          <div className="lp-speed-grid">
            <div className="lp-state bad">
              <h3>❌ بدون المكتبة</h3>
              <p>تدور على Inspiration.</p>
              <p>تبحث عن Winning Ads.</p>
              <p>تجرب Layout من الصفر.</p>
              <p>تدخل في تعديلات كتير.</p>
              <p>وبعد كل ده ممكن الفكرة أصلًا متكونش مناسبة للإعلان.</p>
            </div>
            <div className="lp-arrow">←</div>
            <div className="lp-state good">
              <h3>✅ مع المكتبة</h3>
              <p>حدد الـ Angle اللي محتاجه.</p>
              <p>اختار Template مناسب.</p>
              <p>غيّر الصور والنص والألوان.</p>
              <p>صدّر الـ Creative.</p>
              <p>وابدأ Test جديد في وقت أقل.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">What You Get</div>
            <h2 className="lp-title">إيه اللي هيوصلك بالظبط؟</h2>
          </div>
          <div className="lp-get-list">
            {[
              "أكتر من 1000 Ad Template جاهزين للاستخدام.",
              "كل Template قابل للتعديل بالكامل على Canva.",
              "تقدر تغير Text وImages وColors وElements حسب البراند.",
              "تصميمات بمقاس 1:1 مناسبة لإعلانات Meta وInstagram وغيرها.",
              "مكتبة متنوعة تشمل E-commerce وOffers وGeneral Ads.",
              "الملفات كلها منظمة داخل Google Drive عشان توصل لأي حاجة بسهولة.",
            ].map((item) => (
              <div className="lp-get-row" key={item}>
                <div className="tick">✓</div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-bonus">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">مش ده بس</div>
            <h2 className="lp-title">
              وهتاخد كمان <span className="lp-highlight">2 Bonus مجانًا</span>
            </h2>
            <p className="lp-subtitle">أدوات إضافية تساعدك مش بس تعمل Creatives أسرع، لكن كمان تحسن الموقع والمحتوى العضوي.</p>
          </div>
          <div className="lp-bonus-grid">
            <div className="lp-bonus-card">
              <div className="lp-bonus-badge">مجانًا</div>
              <div className="lp-bonus-number">1</div>
              <h3>Ultimate CRO Checklist</h3>
              <p>
                شيت كامل لـ <strong>Conversion Rate Optimization</strong> يساعدك تراجع موقعك صفحة صفحة بدل ما تعتمد على تخمينات عامة.
              </p>
              <p>
                الـ Checklist مقسمة على: <strong>Home Page، Product Page، Collection Page، Cart، Checkout، Contact، About Us، FAQ، Blog</strong> وغيرها.
              </p>
              <p>وكل صفحة فيها نقاط عملية تراجعها واحدة واحدة عشان تعرف: إيه الموجود؟ إيه الناقص؟ إيه الأولوية؟ وإيه التحسينات اللي ممكن تساعد في رفع الـ Conversion Rate.</p>
              <div className="lp-bonus-value">
                القيمة التقديرية: <span>590 جنيه</span> — هتاخده مجانًا
              </div>
            </div>
            <div className="lp-bonus-card">
              <div className="lp-bonus-badge">مجانًا</div>
              <div className="lp-bonus-number">2</div>
              <h3>+860 Organic Social Media Templates</h3>
              <p>
                مكتبة منفصلة تمامًا فيها أكتر من <strong>860 Canva Templates</strong> جاهزين للمحتوى الـ Organic على Social Media.
              </p>
              <p>يعني بدل ما تستخدم مكتبة الإعلانات في كل حاجة، هيبقى عندك مكتبة مخصوص للـ Ads ومكتبة تانية مخصوص للـ Organic Content.</p>
              <p>مناسبة للـ Business Owners وSocial Media Managers والـ Agencies والـ Freelancers اللي محتاجين ينزلوا Content باستمرار.</p>
              <div className="lp-bonus-value">
                القيمة التقديرية: <span>790 جنيه</span> — هتاخده مجانًا
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-audience">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">المنتج ده معمول ليك لو...</div>
            <h2 className="lp-title">Canva جزء من شغلك في التسويق أو البيع</h2>
            <p className="lp-subtitle">مش محتاج تكون Designer محترف عشان تستفيد من المكتبة.</p>
          </div>
          <div className="lp-audience-tags">
            {["Media Buyers", "E-commerce Owners", "Business Owners", "Marketing Agencies", "Freelancers", "Social Media Managers", "Designers", "Content Creators"].map(
              (tag) => (
                <div className="lp-audience-tag" key={tag}>
                  {tag}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag">طريقة الاستلام</div>
            <h2 className="lp-title">3 خطوات وتبقى المكتبة عندك</h2>
          </div>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-no">1</div>
              <h3>سجل طلبك</h3>
              <p>املأ بياناتك في نموذج الطلب الموجود أسفل الصفحة.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-no">2</div>
              <h3>استلم الإيميل</h3>
              <p>هيجيلك Email فيه رابط الوصول وتعليمات الاستخدام.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-no">3</div>
              <h3>افتح المكتبة</h3>
              <p>داخل Google Drive هتلاقي كل الملفات والروابط والتفاصيل منظمة.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-offer">
        <div className="lp-container">
          <div className="lp-offer-box lp-center">
            <div className="lp-offer-label">🔥 Limited Time Offer</div>
            <h2 className="lp-offer-title">كل اللي هتاخده النهاردة</h2>
            <div className="lp-stack">
              <div className="lp-stack-row">
                <div className="lp-stack-name">+1000 High Converting Ads Canva Templates</div>
                <div className="lp-stack-value">1,490 جنيه</div>
              </div>
              <div className="lp-stack-row">
                <div className="lp-stack-name">Bonus #1 — Ultimate CRO Checklist</div>
                <div className="lp-stack-value">590 جنيه</div>
              </div>
              <div className="lp-stack-row">
                <div className="lp-stack-name">Bonus #2 — +860 Organic Templates</div>
                <div className="lp-stack-value">790 جنيه</div>
              </div>
            </div>
            <div className="lp-total-value">
              <span>إجمالي القيمة</span>
              <span>2,870 جنيه</span>
            </div>
            <div className="lp-final-price">
              <div className="was">بدل 2,870 جنيه</div>
              <div className="now">235 جنيه فقط</div>
            </div>
            <button className="lp-btn" onClick={scrollToOrder}>
              احصل على الباقة كاملة دلوقتي <span>←</span>
            </button>
            <div className="lp-small-note">سعر العرض متاح لفترة محدودة</div>
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
          <h2>جاهز تبطل تدور على Winning Creative Ads من الصفر؟</h2>
          <p>خليك مجهز بمكتبة فيها أكتر من 1000 فكرة وتصميم إعلان، ومعاها أكتر من 860 Template للمحتوى وCRO Checklist كاملة.</p>
          <button className="lp-btn" onClick={scrollToOrder}>
            اطلب الباقة بـ 235 جنيه <span>←</span>
          </button>
          <div className="lp-small-note">👇 اضغط وهتنزل مباشرةً لنموذج الطلب</div>
        </div>
      </section>

      <div className="lp-sticky">
        <div className="lp-sticky-price">
          الباقة كاملة
          <strong>235 جنيه</strong>
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
