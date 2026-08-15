/* photoshoots.js — hero scroll + section reveal animations */

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

(function sectionReveal() {
  const items = document.querySelectorAll("[data-story]");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach(function(el) { el.classList.add("is-revealed"); });
    return;
  }

  const obs = new IntersectionObserver(
    function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );
  items.forEach(function(el) { obs.observe(el); });
})();

(function ctaReveal() {
  const cta = document.querySelector(".ev-cta");
  if (!cta) return;

  if (!("IntersectionObserver" in window)) {
    cta.classList.add("is-visible");
    return;
  }

  const obs = new IntersectionObserver(
    function(entries) {
      entries.forEach(function(entry) {
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


/* ------------------------------------------------------------------
   Embedded enquiry form — same component/logic as contact.js,
   duplicated here per this project's per-page JS convention.
   ------------------------------------------------------------------ */
(function embeddedEnquiryForm() {

  /* ⚠ Same demo-mode gap as contact.js — see that file for setup steps.
     Keep both in sync if FORM_ENDPOINT is ever set. */
  var FORM_ENDPOINT = "";

  var items = document.querySelectorAll('[data-animate]');
  items.forEach(function (el, i) {
    setTimeout(function () {
      el.classList.add('is-visible');
    }, 80 + i * 110);
  });

  (function customSelect() {
    var wrap    = document.getElementById('cfTopicSelect');
    if (!wrap) return;
    var trigger = wrap.querySelector('.cf-select__trigger');
    var list    = wrap.querySelector('.cf-select__list');
    var valEl   = wrap.querySelector('.cf-select__val');
    var native  = wrap.querySelector('select');
    var opts    = wrap.querySelectorAll('.cf-select__opt');

    function open() {
      wrap.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      list.removeAttribute('aria-hidden');
    }
    function close() {
      wrap.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      list.setAttribute('aria-hidden', 'true');
    }

    trigger.addEventListener('click', function () {
      wrap.classList.contains('is-open') ? close() : open();
    });

    opts.forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        var val  = opt.dataset.value;
        var text = opt.querySelector('.cf-select__opt-text').textContent;
        opts.forEach(function (o) {
          o.classList.remove('is-selected');
          o.setAttribute('aria-selected', 'false');
        });
        opt.classList.add('is-selected');
        opt.setAttribute('aria-selected', 'true');
        valEl.textContent = text;
        native.value = val;
        close();
      });
    });

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }());

  var form      = document.getElementById('contactForm');
  var status    = document.getElementById('cfStatus');
  var submitBtn = document.getElementById('cfSubmit');
  var thanks    = document.getElementById('ctThanks');
  var timerEl   = document.getElementById('ctTimer');

  if (!form || !status || !submitBtn || !thanks) return;

  function sanitize(str, max) {
    return String(str).replace(/<[^>]*>/g, '').trim().slice(0, max || 2000);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function showError(msg) {
    status.textContent = msg;
    status.classList.add('is-error');
    submitBtn.classList.remove('is-sending');
    submitBtn.disabled = false;
  }

  form.addEventListener('input', function () {
    if (status.classList.contains('is-error')) {
      status.textContent = '';
      status.classList.remove('is-error');
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name    = sanitize(form.elements['name'].value,    100);
    var email   = sanitize(form.elements['email'].value,   200);
    var message = sanitize(form.elements['message'].value, 2000);

    if (!name) {
      showError("We'd love to know your name.");
      form.elements['name'].focus();
      return;
    }
    if (!email || !isValidEmail(email)) {
      showError('Double-check that email address.');
      form.elements['email'].focus();
      return;
    }
    if (!message) {
      showError("Don't forget to leave a message.");
      form.elements['message'].focus();
      return;
    }

    status.textContent = '';
    status.classList.remove('is-error');
    submitBtn.classList.add('is-sending');
    submitBtn.disabled = true;

    var payload = {
      name: name,
      email: email,
      topic: sanitize(form.elements['topic'] ? form.elements['topic'].value : '', 100),
      message: message
    };

    if (!FORM_ENDPOINT) {
      setTimeout(function () {
        showThanks();
        form.reset();
      }, 700);
      return;
    }

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Send failed');
        showThanks();
        form.reset();
      })
      .catch(function () {
        showError("Something went wrong sending your message. Email us directly at venue@jodhabairetreat.com.");
      });
  });

  function showThanks() {
    document.body.style.overflow = 'hidden';
    thanks.removeAttribute('aria-hidden');
    thanks.classList.add('is-active');

    var count = 4;
    if (timerEl) timerEl.textContent = count;

    var interval = setInterval(function () {
      count -= 1;
      if (timerEl) timerEl.textContent = Math.max(count, 0);
      if (count <= 0) {
        clearInterval(interval);
        window.location.href = '../index.html';
      }
    }, 1000);
  }

})();
