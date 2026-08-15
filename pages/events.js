/* events.js — Events page in the shared cream language.
   1. Hero: side compression + darken on scroll (mirrors the homepage
      and Our Love Story heroes).
   2. Chapters: one-shot rise-in reveal per chapter pair.
   3. Closing CTA: one-shot fade-up. */

/* ---- Hero: compress inward + darken on scroll ---- */
(function evHeroScroll() {
  const hero   = document.querySelector(".ev-hero");
  const darken = document.querySelector(".ev-hero__darken");
  if (!hero || !darken) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const COMPRESS_MAX_DESKTOP = 240;
  const COMPRESS_MAX_MOBILE  = 70;
  let ticking = false;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function update() {
    const isMobile  = window.innerWidth <= 720;
    const hRect     = hero.getBoundingClientRect();
    const hH        = hero.offsetHeight || 1;
    const hScrolled = Math.max(0, -hRect.top);
    const hSpan     = isMobile ? hH * 1.6 : hH * 0.55;
    const hProgress = clamp(hScrolled / hSpan, 0, 1);

    const COMPRESS_MAX = isMobile ? COMPRESS_MAX_MOBILE : COMPRESS_MAX_DESKTOP;
    const basePad = isMobile ? 14 : 28;
    const sidePad = basePad + hProgress * COMPRESS_MAX;
    hero.style.paddingLeft  = sidePad + "px";
    hero.style.paddingRight = sidePad + "px";

    darken.style.opacity = (hProgress * 0.92).toFixed(3);
    ticking = false;
  }

  function onScroll() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();

/* ---- Chapter reveal ---- */
(function evChapterReveal() {
  const chapters = document.querySelectorAll("[data-story]");
  if (!chapters.length) return;

  if (!("IntersectionObserver" in window)) {
    chapters.forEach((c) => c.classList.add("is-revealed"));
    return;
  }

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.28 }
  );
  chapters.forEach((c) => obs.observe(c));
})();

/* ---- Closing CTA reveal ---- */
(function evCtaReveal() {
  const cta = document.querySelector(".ev-cta");
  if (!cta) return;

  if (!("IntersectionObserver" in window)) {
    cta.classList.add("is-visible");
    return;
  }

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  obs.observe(cta);
})();

