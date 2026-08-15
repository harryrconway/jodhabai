/* ------------------------------------------------------------------
   Splash loader — fades in "Welcome to / Jodha Bai" then dissolves.
   ------------------------------------------------------------------ */
(function pageLoader() {
  const loader = document.getElementById("page-loader");
  if (!loader) return;

  document.body.style.overflow = "hidden";
  const inner = loader.querySelector(".loader__inner");

  // Give the flourish line its real path length so it can be hidden by
  // dash offset, then drawn on at the same moment the text fades in.
  // Set up (hidden state) and the later reveal are both driven from
  // here in JS, inline, rather than via a CSS class — an inline style
  // always wins over a stylesheet rule, so mixing the two would let
  // this setup silently block the reveal from ever taking effect.
  const flourishPath = loader.querySelector(".loader__flourish path");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (flourishPath && !reduceMotion) {
    const length = flourishPath.getTotalLength();
    flourishPath.style.transition = "none";
    flourishPath.style.strokeDasharray = length;
    flourishPath.style.strokeDashoffset = length;
    flourishPath.getBoundingClientRect(); // force a reflow so the hidden state above is the transition's "from" frame
    flourishPath.style.transition = "stroke-dashoffset 1.1s var(--ease)";
  }

  // Step 1 — text fades in, flourish line draws in step with it
  setTimeout(function () {
    if (inner) inner.classList.add("is-visible");
    if (flourishPath && !reduceMotion) flourishPath.style.strokeDashoffset = "0";
  }, 200);

  // Step 2 — overlay fades out, scroll restored
  setTimeout(function () {
    loader.classList.add("is-hiding");
    document.body.style.overflow = "";
  }, 2000);

  // Step 3 — remove from DOM so it never blocks interaction
  setTimeout(function () {
    loader.remove();
  }, 2950);
})();

/* Header menu overlay open/close logic now lives in includes/header.js
   (it has to wait until the fetched header markup lands in the DOM). */

/* ------------------------------------------------------------------
   The Occasions — ledger rows rise in with a stagger as they enter
   the viewport, then a corner-marked photo preview trails the cursor
   while a row is hovered (desktop fine-pointer only).
   ------------------------------------------------------------------ */
(function occasionsLedger() {
  const rows = document.querySelectorAll(".occasion");
  if (!rows.length) return;

  // ---- Scroll reveal ----
  if (!("IntersectionObserver" in window)) {
    rows.forEach((r) => r.classList.add("is-revealed"));
  } else {
    rows.forEach((r, i) => {
      r.style.setProperty("--reveal-delay", i * 130 + "ms");
    });
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    rows.forEach((r) => obs.observe(r));
  }

  // ---- Cursor-trailing label ----
  const preview = document.getElementById("occasionLabel");
  if (!preview) return;
  const previewText = document.getElementById("occasionLabelText");

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!finePointer.matches || reducedMotion.matches) return;

  let targetX = 0, targetY = 0;   // where the cursor is
  let curX = 0, curY = 0;         // where the label is (lerped)
  let active = false;
  let rafId = null;

  function loop() {
    // Ease the label toward the cursor for a soft trailing feel.
    curX += (targetX - curX) * 0.18;
    curY += (targetY - curY) * 0.18;
    preview.style.left = curX.toFixed(1) + "px";
    preview.style.top = curY.toFixed(1) + "px";

    if (active || Math.abs(targetX - curX) > 0.5 || Math.abs(targetY - curY) > 0.5) {
      rafId = requestAnimationFrame(loop);
    } else {
      rafId = null;
    }
  }

  function startLoop() {
    if (rafId === null) rafId = requestAnimationFrame(loop);
  }

  rows.forEach((row) => {
    row.addEventListener("mouseenter", (e) => {
      if (previewText) {
        previewText.textContent = row.getAttribute("data-label") || "";
      }
      // Snap the label to the cursor on entry so it doesn't fly across
      // the screen from wherever it was last dismissed.
      targetX = curX = e.clientX;
      targetY = curY = e.clientY;
      active = true;
      preview.classList.add("is-active");
      startLoop();
    });

    row.addEventListener("mousemove", (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      startLoop();
    });

    row.addEventListener("mouseleave", () => {
      active = false;
      preview.classList.remove("is-active");
    });
  });
})();

/* ------------------------------------------------------------------
   Generic staggered rise-in reveal for any [data-reveal] element.
   ------------------------------------------------------------------ */
(function staggeredReveal() {
  const plates = document.querySelectorAll("[data-reveal]");
  if (!plates.length) return;

  if (!("IntersectionObserver" in window)) {
    plates.forEach((p) => p.classList.add("is-revealed"));
    return;
  }

  plates.forEach((p, i) => {
    p.style.setProperty("--reveal-delay", i * 120 + "ms");
  });

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 }
  );
  plates.forEach((p) => obs.observe(p));
})();

/* ------------------------------------------------------------------
   Hero carousel — auto-rotating crossfade through several estate
   photos. Click-free, no controls, matches the loader/hero's ambient
   feel elsewhere on the homepage. Respects prefers-reduced-motion by
   leaving the first image showing statically.
   ------------------------------------------------------------------ */
(function heroCarousel() {
  const track = document.getElementById("heroCarousel");
  if (!track) return;

  const slides = track.querySelectorAll(".hero__bg");
  if (slides.length < 2) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let index = 0;
  const INTERVAL = 6500;

  setInterval(function () {
    slides[index].classList.remove("is-active");
    index = (index + 1) % slides.length;
    slides[index].classList.add("is-active");
  }, INTERVAL);
})();

/* ------------------------------------------------------------------
   Single rAF scroll loop:
   - Hero: side compression + black darkening
   - Intro: sentence-by-sentence reveal as the section enters view
   - Gallery: three photos slide up, scale down, fade in (staggered)
   ------------------------------------------------------------------ */
(function scrollEffects() {
  const hero = document.querySelector(".hero");
  const darken = document.querySelector(".hero__darken");
  const intro = document.getElementById("intro");
  const para = document.getElementById("introPara");
  const gallery = document.getElementById("gallery");
  const galleryFrames = gallery ? gallery.querySelectorAll(".gallery__frame") : [];
  // Split the paragraph into per-word and per-char spans so each letter
  // can "fill with ink" top-to-bottom as the user scrolls.
  const chars = [];
  if (para) {
    const text = (para.textContent || "").trim().replace(/\s+/g, " ");
    para.innerHTML = "";
    const words = text.split(" ");
    words.forEach((word, wi) => {
      const wordEl = document.createElement("span");
      wordEl.className = "intro__word";
      for (const ch of word) {
        const charEl = document.createElement("span");
        charEl.className = "intro__char";
        charEl.setAttribute("data-char", ch);
        charEl.textContent = ch;
        wordEl.appendChild(charEl);
        chars.push(charEl);
      }
      para.appendChild(wordEl);
      if (wi < words.length - 1) {
        para.appendChild(document.createTextNode(" "));
      }
    });
  }

  if (!hero) return;

  // Reduced motion: settle everything into its final, legible state and
  // skip the scroll-driven animation entirely.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    chars.forEach((c) => c.style.setProperty("--fill", "1"));
    galleryFrames.forEach((f) => {
      f.style.opacity = "1";
      f.style.transform = "none";
    });
    if (darken) darken.style.opacity = "0";
    return;
  }

  const COMPRESS_MAX_DESKTOP = 240; // px the sides squeeze in by on desktop
  const COMPRESS_MAX_MOBILE = 70;   // smaller squeeze on mobile so it feels gentler

  let ticking = false;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function update() {
    const winH = window.innerHeight;
    const isMobile = window.innerWidth <= 720;

    // ---- HERO: compression + darken ----
    // On mobile we slow the compression dramatically: it spans nearly the
    // entire hero (instead of 55%) and squeezes by much fewer pixels.
    const hRect = hero.getBoundingClientRect();
    const hH = hero.offsetHeight || 1;
    const hScrolled = Math.max(0, -hRect.top);
    const hSpan = isMobile ? hH * 1.6 : hH * 0.55;
    const hProgress = clamp(hScrolled / hSpan, 0, 1);

    const COMPRESS_MAX = isMobile ? COMPRESS_MAX_MOBILE : COMPRESS_MAX_DESKTOP;
    const basePad = isMobile ? 14 : 28;
    const sidePad = basePad + hProgress * COMPRESS_MAX;
    hero.style.paddingLeft = sidePad + "px";
    hero.style.paddingRight = sidePad + "px";

    if (darken) darken.style.opacity = (hProgress * 0.92).toFixed(3);

    // ---- INTRO: per-character ink fill as the paragraph scrolls past ----
    if (intro && para && chars.length) {
      // Begin the moment the paragraph's top crosses the bottom of the
      // viewport and finish well before its bottom leaves the top —
      // i.e. the reveal completes within roughly half a viewport of scroll.
      const pRect = para.getBoundingClientRect();
      const startEdge = winH;                       // any pixel of paragraph in view
      const totalSpan = pRect.height + winH * 0.25; // finish quickly
      const traveled = startEdge - pRect.top;
      const iProgress = clamp(traveled / totalSpan, 0, 1);

      const total = chars.length;
      const cWindow = 0.04;                         // each char fills over ~4% of progress
      const cSpread = 1 - cWindow;                  // last char must finish at progress 1
      for (let i = 0; i < total; i++) {
        const s = (i / Math.max(1, total - 1)) * cSpread;
        const e = s + cWindow;
        const t = clamp((iProgress - s) / (e - s), 0, 1);
        chars[i].style.setProperty("--fill", t.toFixed(3));
      }
    }

    // ---- GALLERY: three photos rise + scale + fade with stagger ----
    if (gallery && galleryFrames.length && !isMobile) {
      // ---- Staggered fade-in reveal (desktop only) ----
      const gRect = gallery.getBoundingClientRect();
      // Begin once the section is ~10% from entering the bottom.
      const start = -winH * 0.10;
      const span = winH * 0.85;
      const gProgress = clamp(((winH - gRect.top) - start) / span, 0, 1);

      galleryFrames.forEach((f, i) => {
        const stagger = i * 0.14;       // each photo starts a beat after the last
        const localSpan = 0.55;          // duration per photo
        const t = clamp((gProgress - stagger) / localSpan, 0, 1);
        const eased = easeOutCubic(t);
        const ty = (1 - eased) * 90;     // px upward travel
        f.style.transform = "translateY(" + ty.toFixed(1) + "px)";
        f.style.opacity = eased.toFixed(3);
        const img = f.firstElementChild;
        if (img) {
          if (eased >= 0.999) {
            img.style.transform = "";
          } else {
            const scale = 1.18 - eased * 0.18;
            img.style.transform = "scale(" + scale.toFixed(3) + ")";
          }
        }
      });
    }

    // Footer parallax brand drift now lives in includes/footer.js.

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();

/* ------------------------------------------------------------------
   Zoom Mosaic: as the user scrolls into the .zoom-mosaic section it
   pins (position: sticky on the inner stage). During that pinned
   span, scale the inner 7x7 grid from 1 (only the centre cell
   visible — looks like a single hero image) down to ~0.14 (all
   7 rings visible, the outermost ring just slightly clipped by the
   frame edge) AND rotate it from 0deg up to 25deg. Once progress
   hits 1 the section unpins and the page scrolls on.
   ------------------------------------------------------------------ */
(function zoomMosaic() {
  const section = document.querySelector(".zoom-mosaic");
  if (!section) return;
  const grid = section.querySelector(".zoom-mosaic__grid");
  if (!grid) return;

  // Reduced motion: show the finished mosaic with both headline lines,
  // no scroll scrubbing.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    grid.style.transform = "translate(-50%, -50%) scale(0.38) rotate(0deg)";
    section.classList.add("is-zoomed-out", "is-text-1", "is-text-2");
    section.style.height = "100vh";
    return;
  }

  const SCALE_IN = 1;          // zoomed in — only the centre cell fills the frame
  // Fewer tiles (5x5 grid) than before, scaled out less aggressively so
  // each photo opens up bigger rather than shrinking into a dense mosaic.
  const SCALE_OUT = 0.38;
  const ROTATE_MAX = 25;       // final rotation, in degrees
  // Hold rotation at 0 for the first slice of scroll so the cell has
  // time to shrink below frame-fill before tilting (otherwise rotating
  // a frame-filling cell exposes triangular corner wedges).
  const ROTATE_START = 0.08;
  // Each headline line fades + rises in at its own scroll threshold.
  const TEXT_1_AT = 0.42;      // "The Whole"
  const TEXT_2_AT = 0.62;      // "Estate"

  let ticking = false;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  // Smoother feel near the ends of the scrub.
  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function update() {
    const winH = window.innerHeight;

    // On mobile the section is height:auto (no sticky scroll) — just pin
    // the grid in its fully-zoomed-out state and return early.
    if (window.innerWidth <= 720) {
      grid.style.transform =
        'translate(-50%, -50%) scale(' + SCALE_OUT + ') rotate(0deg)';
      section.classList.add('is-zoomed-out', 'is-text-1', 'is-text-2');
      ticking = false;
      return;
    }

    const rect = section.getBoundingClientRect();
    const sectionH = section.offsetHeight;

    // The stage is sticky for (sectionH - winH) of scroll —
    // map that span to progress 0 → 1.
    const stickySpan = Math.max(1, sectionH - winH);
    const scrolled = -rect.top;
    const progress = clamp(scrolled / stickySpan, 0, 1);
    const eased = easeInOutCubic(progress);

    // Scale: 1 → SCALE_OUT, eased
    const scale = SCALE_IN + (SCALE_OUT - SCALE_IN) * eased;

    // Rotation: 0 → ROTATE_MAX, with a delayed start so the cell has
    // already begun shrinking before any tilt happens.
    const rotProgress = clamp(
      (progress - ROTATE_START) / (1 - ROTATE_START),
      0,
      1
    );
    const rotate = ROTATE_MAX * easeInOutCubic(rotProgress);

    grid.style.transform =
      "translate(-50%, -50%) " +
      "scale(" + scale.toFixed(4) + ") " +
      "rotate(" + rotate.toFixed(2) + "deg)";

    if (progress >= 0.92) {
      section.classList.add("is-zoomed-out");
    } else {
      section.classList.remove("is-zoomed-out");
    }

    // Headline reveal — "The Whole" rises first, then "Estate".
    if (progress >= TEXT_1_AT) {
      section.classList.add("is-text-1");
    } else {
      section.classList.remove("is-text-1");
    }
    if (progress >= TEXT_2_AT) {
      section.classList.add("is-text-2");
    } else {
      section.classList.remove("is-text-2");
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
