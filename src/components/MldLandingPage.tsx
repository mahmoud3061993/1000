"use client";

import { useEffect, useState } from "react";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 12;
  window.scrollTo({ top, behavior: "smooth" });
}

function scrollToOrder() {
  const el = document.getElementById("order-form") || document.getElementById("price");
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 18;
  window.scrollTo({ top, behavior: "smooth" });
}

const AUDIENCE = [
  {
    title: "ميديا بايرز ومديري إعلانات فيسبوك",
    text: "بتدور على إعلان فائز كل يوم، ومش هتفضل تصوّر الشاشة إعلان إعلان.",
  },
  {
    title: "أصحاب متاجر إلكترونية ودروبشيبينج",
    text: "عايز تشوف المنافس بيعمل إيه، وتنزّل الكرييتف والكوبي في ثواني.",
  },
  {
    title: "أصحاب الوكالات والفريلانسرز",
    text: "بتجهّز ريبورت أو زاوية جديدة لكلاينت، ومحتاج سرعة من غير شغل يدوي.",
  },
  {
    title: "الأفيلييت وأي حد بيبحث في Ad Library",
    text: "لو بتعدّي على مكتبة ميتا كل يوم، الإضافة دي بتوفّرلك ساعات بحث.",
  },
];

const OUTCOMES = [
  {
    title: "تنزّل الإعلان كامل",
    text: "صورة أو فيديو MP4 نظيف بضغطة. مش سكرين، ومش ملف m3u8 يتعطل عندك.",
  },
  {
    title: "تعرف مين الوينر",
    text: "تاج ذهبي على أي إعلان شغال 30 يوم أو أكتر — قبل ما تضيع وقت على إعلان ميت.",
  },
  {
    title: "تسرق الزاوية مش الصورة بس",
    text: "النص، الهيدلاين، الـ CTA، ولينك العرض يتصدّروا لشيت جاهز تشتغل منه.",
  },
  {
    title: "تتابع المنافس من غير لخبطة",
    text: "Spy on page و Open offer يفتحولك صفحة المعلن والعرض وهو شغال.",
  },
];

const CURRENT_EXTENSION = [
  "تنزيل جميع الإعلانات الظاهرة بدوسة واحدة — مهما كان عددها",
  "تصدير ملف إكسل فيه نصوص الإعلانات جاهز تفتحه على Google Sheets",
  "تاج الوينر وعدد الأيام على كل إعلان (30 يوم+)",
  "فلتر يعرض الـ winners اللي شغالين شهر أو أكتر بس",
  "تحميل الإعلان الواحد: صورة أو فيديو MP4",
  "Spy on page لمتابعة باقي إعلانات المعلن",
  "Open offer لفتح لينك العرض مباشرة",
  "إحصائيات الصفحة: عدد الإعلانات وعدد الوينرز",
];

const FEATURES = [
  { title: "تحميل الصورة بضغطة", text: "نزّل كرييتف الإعلان الأصلي بدقة المكتبة، من غير قص أو علامة مية." },
  { title: "فيديو MP4 نظيف", text: "الإضافة بتعدّي ملفات الـ m3u8 وبتجيب فيديو تقدر تستخدمه فعلًا." },
  { title: "تاج الوينر 30 يوم+", text: "تاج وتأطير ذهبي على الإعلان اللي لسه شغال شهر أو أكتر." },
  { title: "تحميل جماعي", text: "اختار كام إعلان ونزّلهم مرة واحدة بدل ما تدوس على كل واحد لوحده." },
  { title: "Spy on page", text: "افتح صفحة المعلن من نفس الكرت وتابع باقي إعلاناته فورًا." },
  { title: "Open offer", text: "ادخل على لاندينج العرض اللي الإعلان بيوصل عليه من غير ما تلف." },
  { title: "تصدير لـ Google Sheets", text: "CSV فيه النص الأساسي والهيدلاين والـ CTA ولينك الإعلان، ويتفتح مع شيت جديد." },
  { title: "التقاط الـ Headline والـ CTA", text: "الإضافة بتقرأهم من الصفحة نفسها بعد كلمة Sponsored." },
  { title: "آخر التحميلات", text: "الـ Popup بيوريك الملفات اللي نزلتها عشان ترجع لها بسرعة." },
  { title: "Facebook + Instagram Ad Library", text: "نفس الأزرار على مكتبة إعلانات ميتا للفيسبوك والإنستجرام." },
];

const REVIEWS = [
  { name: "أحمد منصور", role: "ميديا باير — إعلانات تجميل", stars: 5, text: "النسخة القديمة كانت بتنزّل فيديو واحد وخلاص. دي فرقت معايا في شغل اليوم: الوينر باين، والكوبي بيتسحب في شيت." },
  { name: "سارة فؤاد", role: "صاحبة متجر ملابس", stars: 4, text: "مش تقنية أوي، بس ثبتّها في خمس دقايق وبدأت أنزّل إعلانات المنافسين من غير ما أطلب من المصمم يسكرين." },
  { name: "محمود عبد العزيز", role: "دروبشيبينج", stars: 5, text: "Open offer وفّر عليا لف كتير. بدوس وأشوف العرض وهو شغال، وبعدين أنزّل الكرييتف." },
  { name: "نورا حسن", role: "فريلانسر إعلانات", stars: 5, text: "بجهّز زاوية لكلاينت في نفس اليوم. التصدير للشيت خلّى الريبورت شكل تاني." },
  { name: "يوسف علي", role: "صاحب وكالة صغيرة", stars: 4, text: "التحميل الجماعي ممتاز لما المكتبة تبقى مليانة. اتمنيت الوينر يبان أوضح شوية على الموبايل، بس على اللاب تمام." },
  { name: "هند كمال", role: "أفيلييت عروض", stars: 5, text: "بدور على عروض شغالة من أسابيع. تاج الـ 30 يوم بيوفر عليا نص وقت البحث." },
  { name: "كريم الشافعي", role: "إعلانات عقارات", stars: 4, text: "الفيديو بينزل MP4 مش بيعلّق. ده كان أكبر عيب في أي أداة جرّبتها قبل كده." },
  { name: "دينا مراد", role: "مديرة تسويق", stars: 5, text: "فرّقت مع التيم: بنوزّع الإعلانات على الشيت وكل واحد ياخد زاويته من غير ما نضيّع سلاك." },
  { name: "عمر جمال", role: "ميديا باير — سُوبرماركت أونلاين", stars: 4, text: "عرض الـ 499 مرة واحدة منطقي جدًا لو بتستخدم المكتبة كل أسبوع. دفعت ومش راجع لأدوات بتتحاسب شهري." },
];

const FAQS = [
  { q: "الإضافة دي بتشتغل فين؟", a: "على Google Chrome جوه Facebook و Instagram Ad Library. تفتح المكتبة، والإضافة بتظهر على كروت الإعلانات." },
  { q: "هل لازم أدفع كل شهر؟", a: "العرض الحالي شراء مرة واحدة مدى الحياة. بعد ما الكمية المحدودة تخلّص، البيع هيقف على السعر ده ويتحول لاشتراك شهري." },
  { q: "هستلم المنتج إزاي؟", a: "بعد تأكيد التحويل هيوصلك إيميل بلينك تحميل ملف ZIP، وخطوات التثبيت على Chrome." },
  { q: "النسخة دي مختلفة عن اللي على Chrome Store؟", a: "أيوه. النسخة القديمة (اللي وصلت 9,000 مستخدم) بتنزّل صورة أو فيديو واحد من الإعلان. النسخة دي أدوات بحث كاملة." },
  { q: "بتنزّل الفيديو سليم؟", a: "الإضافة بتتجاهل ملفات الـ m3u8 وبتحاول تجيب MP4 تقدر تفتحه وتحفظه." },
  { q: "ينفع أصدّر النصوص؟", a: "أيوه. زر Export to Google Sheets بينزّل CSV ويفتح شيت جديد عشان تستورد الملف." },
  { q: "محتاج خبرة تقنية عشان أثبّتها؟", a: "لا. خطوات التثبيت على Chrome مكتوبة في الإيميل: فك الضغط، Developer mode، Load unpacked." },
  { q: "لو واجهتني مشكلة في التثبيت؟", a: "ابعت على واتساب وهنراجع معاك التثبيت والملف." },
];

function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  return (
    <span className={`mld-stars mld-stars-${size}`} aria-label={`${value} من 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value >= n;
        const half = !filled && value >= n - 0.5;
        return (
          <i key={n} className={filled ? "is-on" : half ? "is-half" : ""}>
            ★
          </i>
        );
      })}
    </span>
  );
}

export function MldLandingPage({
  whatsapp,
  price,
  compareAtPrice,
}: {
  whatsapp: string;
  price: number;
  compareAtPrice: number;
}) {
  const [showSticky, setShowSticky] = useState(false);
  const wa = `https://wa.me/${whatsapp}?text=${encodeURIComponent("أهلاً، حابب أعرف تفاصيل أكتر عن Meta Library Downloader")}`;

  useEffect(() => {
    const hero = document.getElementById("mld-hero");
    const checkout = document.getElementById("price") || document.getElementById("order-form");
    if (!hero || !("IntersectionObserver" in window)) return;

    const state = { hero: true, checkout: false };
    const sync = () => setShowSticky(!state.hero && !state.checkout);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target.id === "mld-hero") state.hero = entry.isIntersecting;
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
    <div className={`mld-lp${showSticky ? " mld-has-sticky" : ""}`}>
      <div className="mld-topbar">
        عرض مدى الحياة · {price} جنيه تدفع مرة واحدة · العدد محدود وبعدها البيع يقف ويتحول لاشتراك
      </div>

      <section id="mld-hero" className="mld-hero" data-track-section="SectionHero">
        <div className="mld-wrap mld-hero-grid">
          <div className="mld-hero-copy">
            <div className="mld-kicker">النسخة 2 — أقوى من الإضافة اللي 9,000 حد ثبّتوها</div>
            <h1>نزل كل الاعلانات من meta ads library بدوسة واحدة مهما كان عددها</h1>
            <p>النسخة دي بتخليك تعرف كل الاعلانات ال winners قبل ما المنافس يشيلها او يغيرها</p>
            <ul className="mld-checks">
              <li>تاج الوينر + تصدير الشيت + Spy على المعلن</li>
              <li>{price} جنيه — شراء مرة واحدة مدى الحياة</li>
            </ul>
            <div className="mld-hero-cta">
              <button type="button" className="mld-btn" onClick={scrollToOrder}>
                احجز نسختك مدى الحياة
              </button>
              <button type="button" className="mld-btn mld-btn-ghost" onClick={() => scrollToId("mld-demo")}>
                شوف الفيديو
              </button>
            </div>
            <div className="mld-hero-meta">4.5 من 5 ★ · 9 تقييمات · النسخة الأولى كانت 4.6 على 9,000 مستخدم</div>
          </div>

          <div id="mld-demo" className="mld-video-slot" data-track-section="SectionDemo">
            <div className="mld-video-frame mld-video-has-player">
              <iframe
                src="https://www.youtube.com/embed/4zpBFSBggho"
                title="شرح Meta Library Downloader"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mld-section" data-track-section="SectionProblem">
        <div className="mld-wrap">
          <div className="mld-section-head">
            <p className="mld-eyebrow">الإضافة دي مفيدة لمين؟</p>
            <h2>لو بتفتح meta ads library يوميا او بشكل عام شغال في اعلانات ميتا!</h2>
          </div>
          <div className="mld-card-grid">
            {AUDIENCE.map((item) => (
              <article key={item.title} className="mld-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mld-section mld-section-alt" data-track-section="SectionOutcomes">
        <div className="mld-wrap">
          <div className="mld-section-head">
            <p className="mld-eyebrow">هتنفعك في إيه؟</p>
            <h2>بتحوّل بحث المكتبة من سكرين شوت لشغل جاهز</h2>
          </div>
          <div className="mld-card-grid mld-card-grid-4">
            {OUTCOMES.map((item) => (
              <article key={item.title} className="mld-card mld-card-glow">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <div className="mld-center-cta">
            <button type="button" className="mld-btn" onClick={scrollToOrder}>
              عايز الإضافة دي
            </button>
          </div>
        </div>
      </section>

      <section className="mld-section" data-track-section="SectionPreview">
        <div className="mld-wrap">
          <div className="mld-section-head">
            <p className="mld-eyebrow">دي تاني نسخة بنعملها</p>
            <h2>النسخة القديمة كانت بتنزّل صورة أو فيديو واحد من الإعلان</h2>
            <p>وصلت 9,000 مستخدم على Chrome Store. الناس ثبّتوها عشان التحميل السريع… لكن ده كان كل اللي بتعمله.</p>
          </div>
          <figure className="mld-old-shot">
            <img src="/images/mld-v1-chrome-store.png" alt="صفحة Chrome Store للنسخة القديمة من Meta Library Downloader وبها 9,000 مستخدم" />
            <figcaption>دي النسخة القديمة</figcaption>
          </figure>
          <p className="mld-upgrade-line">دي فرصتك تاخد النسخه الاحدث تشتريها مره واحدة مدى الحياه</p>
          <figure className="mld-old-shot mld-new-shot">
            <img
              src="/images/mld-v2-ads-library.png"
              alt="النسخة الأحدث من Meta Library Downloader جوه Meta Ads Library: تحميل جماعي، تاج الوينر، وتصدير إكسل"
            />
            <figcaption>دي النسخة الأحدث وهي شغالة جوه المكتبة</figcaption>
          </figure>
          <ul className="mld-now-list">
            {CURRENT_EXTENSION.map((item, index) => (
              <li key={item} className={index < 2 ? "is-hot" : ""}>
                {item}
              </li>
            ))}
          </ul>
          <div className="mld-center-cta">
            <button type="button" className="mld-btn" onClick={scrollToOrder}>
              اطلب النسخة الأحدث دلوقتي
            </button>
          </div>
        </div>
      </section>

      <section id="mld-offer" className="mld-section mld-offer-section" data-track-section="SectionOffer">
        <div className="mld-wrap">
          <div className="mld-offer-box">
            <div className="mld-offer-badge">عرض محدود جدًا — مش هيتكرر بالشكل ده</div>
            <h2>ادفع مرة واحدة… ومش هتدفع تاني</h2>
            <p className="mld-offer-lead">
              دلوقتي تقدر تاخد النسخة الاحترافية مدى الحياة. بعد ما العدد المحدود يخلص، البيع هيقف
              على العرض ده، والإضافة هتتباع بعد كده باشتراك شهري.
            </p>
            <div className="mld-offer-prices">
              <div className="mld-price-old">
                <small>بعد العرض</small>
                <s>اشتراك شهري</s>
                <em>{compareAtPrice} جنيه قيمة الأدوات</em>
              </div>
              <div className="mld-price-now">
                <small>تدفع النهاردة مرة واحدة</small>
                <strong>{price}</strong>
                <span>جنيه مدى الحياة</span>
              </div>
            </div>
            <ul className="mld-offer-list">
              <li>رخصة مدى الحياة — مش بتتجدّد كل شهر</li>
              <li>كل أدوات النسخة 2.4: تحميل، وينر، شيت، Spy</li>
              <li>بعد اكتمال العدد: البيع يتقفل ويتحول لاشتراك</li>
            </ul>
            <button type="button" className="mld-btn mld-btn-offer" onClick={scrollToOrder}>
              خد العرض قبل ما العدد يخلص
            </button>
            <p className="mld-offer-foot">العدد محدود جدًا. اللي هيجي بعد القفل هيدفع شهري.</p>
          </div>
        </div>
      </section>

      <section className="mld-section" data-track-section="SectionTools">
        <div className="mld-wrap">
          <div className="mld-section-head">
            <p className="mld-eyebrow">كل اللي الإضافة بتعمله</p>
            <h2>مش أداة تحميل وبس — دي عدة شغل كاملة جوه Ad Library</h2>
          </div>
          <div className="mld-feature-grid">
            {FEATURES.map((item, index) => (
              <article key={item.title} className="mld-feature">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mld-section mld-section-alt" data-track-section="SectionReceive">
        <div className="mld-wrap">
          <div className="mld-section-head">
            <p className="mld-eyebrow">هتستلم إيه؟</p>
            <h2>ملف الإضافة + رخصة مدى الحياة على نفس الإيميل</h2>
          </div>
          <ul className="mld-package">
            <li>ملف ZIP للنسخة الاحترافية 2.4</li>
            <li>خطوات التثبيت على Chrome في الإيميل</li>
            <li>تحميل الصور والفيديو MP4</li>
            <li>تاج الوينر 30 يوم+</li>
            <li>تصدير الكوبي لـ Google Sheets</li>
            <li>Spy on page و Open offer</li>
            <li>رخصة شراء مرة واحدة — مدى الحياة</li>
          </ul>
          <div className="mld-center-cta">
            <button type="button" className="mld-btn" onClick={scrollToOrder}>
              اطلب الإضافة دلوقتي
            </button>
          </div>
        </div>
      </section>

      <section className="mld-section" data-track-section="SectionTrust">
        <div className="mld-wrap">
          <div className="mld-section-head">
            <p className="mld-eyebrow">تقييم الناس</p>
            <h2>4.5 من 5 على النسخة الجديدة</h2>
            <div className="mld-rating-hero">
              <Stars value={4.5} />
              <b>4.5 / 5</b>
              <span>من 9 تقييمات مختلفة</span>
            </div>
          </div>
          <div className="mld-review-grid">
            {REVIEWS.map((item) => (
              <article key={item.name} className="mld-review">
                <Stars value={item.stars} size="sm" />
                <p>{item.text}</p>
                <footer>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mld-section mld-section-alt" data-track-section="SectionFaq">
        <div className="mld-wrap">
          <div className="mld-section-head">
            <h2>أسئلة قبل ما تطلب</h2>
          </div>
          <div className="mld-faq">
            {FAQS.map((item) => (
              <details key={item.q} className="mld-faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className={`mld-sticky${showSticky ? " is-on" : ""}`}>
        <div>
          MLD Pro — {price} جنيه مدى الحياة
        </div>
        <button type="button" onClick={scrollToOrder}>
          احجز مكانك
        </button>
      </div>

      <a href={wa} className="mld-wa" target="_blank" rel="noopener" aria-label="تواصل معنا على واتساب">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M19.11 17.44c-.26-.13-1.53-.75-1.77-.84-.24-.09-.41-.13-.59.13-.17.26-.68.84-.83 1.01-.15.17-.3.19-.56.06-.26-.13-1.08-.4-2.05-1.27-.76-.67-1.27-1.5-1.42-1.76-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.59-1.42-.8-1.94-.21-.51-.43-.44-.59-.45h-.5c-.17 0-.45.06-.68.32-.24.26-.89.87-.89 2.12 0 1.25.91 2.46 1.04 2.63.13.17 1.79 2.73 4.34 3.83.61.26 1.08.42 1.45.54.61.19 1.16.16 1.6.1.49-.07 1.53-.62 1.74-1.22.22-.6.22-1.12.15-1.22-.06-.11-.24-.17-.5-.3z" />
          <path d="M16.03 3C8.84 3 3 8.67 3 15.66c0 2.47.74 4.77 2.01 6.72L3 29l6.87-1.94a13.27 13.27 0 0 0 6.16 1.52C23.22 28.58 29 22.91 29 15.91 29 8.92 23.22 3 16.03 3zm0 23.43c-2.02 0-3.9-.54-5.53-1.48l-.4-.23-4.08 1.15 1.18-3.96-.26-.41a10.37 10.37 0 0 1-1.63-5.58c0-5.83 4.82-10.57 10.72-10.57 5.9 0 10.72 4.74 10.72 10.57 0 5.82-4.82 10.51-10.72 10.51z" />
        </svg>
      </a>
    </div>
  );
}

export function MldCheckoutLead({ price }: { price: number }) {
  return (
    <div className="mld-checkout-lead">
      <div className="mld-scarcity">العدد محدود وهيتقفل البيع بعد اكتمال العدد</div>
      <h2>اطلب Meta Library Downloader Pro</h2>
      <p>هتاخد رخصة مدى الحياة على النسخة الأحدث — مش هتدفع كل شهر.</p>
      <ul>
        <li>ملف الإضافة + خطوات التثبيت</li>
        <li>تحميل الصورة والفيديو</li>
        <li>وينر 30 يوم + تصدير الشيت</li>
        <li>Spy on page و Open offer</li>
        <li>دفع مرة واحدة · {price} جنيه</li>
      </ul>
      <div className="mld-checkout-lead-price">{price} جنيه</div>
      <div className="mld-delivery-note">
        <strong>الاستلام على الإيميل</strong>
        <p>لينك التحميل هتوصلك على نفس الإيميل اللي هتسجّل بيه في الطلب. تأكد إنه إيميل تقدر تفتحه.</p>
      </div>
      <p className="mld-pay-note">الدفع بإنستاباي أو محفظة كاش. حوّل وارفع سكرين التحويل، وبعدين هنتأكد من الدفع يدوي.</p>
    </div>
  );
}

export function MldClosing({ price }: { price: number }) {
  return (
    <section className="mld-section mld-close">
      <div className="mld-wrap">
        <h2>لو بتستخدم المكتبة كل أسبوع، الاشتراك الشهري هيطلع أغلى من العرض ده بسرعة.</h2>
        <p>ادفع مرة واحدة دلوقتي، قبل ما العدد يخلّص والبيع يتقفل.</p>
        <div className="mld-hero-price">{price} جنيه — مدى الحياة</div>
        <button type="button" className="mld-btn" onClick={scrollToOrder}>
          احجز نسختك دلوقتي
        </button>
      </div>
    </section>
  );
}
