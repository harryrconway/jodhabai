/* ourlovestory.js — scroll-reveal + hero scroll effects for the Our Love Story page. */

/* ---- Hero: compress inward + darken on scroll (mirrors main page hero) ---- */
(function storyHeroScroll() {
  const hero   = document.querySelector(".story-hero");
  const darken = document.querySelector(".story-hero__darken");
  if (!hero || !darken) return;

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
(function chapterReveal() {
  const items = document.querySelectorAll("[data-story]");
  if (!items.length || !("IntersectionObserver" in window)) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((it) => {
    const rect = it.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyVisible) {
      /* Already on screen — no animation needed */
      return;
    }
    it.classList.add("will-reveal");
    obs.observe(it);
  });
})();
