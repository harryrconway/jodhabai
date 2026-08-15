/* contact.js — staggered animations, validation, sanitisation, thank you + redirect */

(function () {

  /* ============================================================
     FORM ENDPOINT — ⚠ FINAL SETUP STEP, currently in demo mode.
     1. Create a free form at https://formspree.io (or web3forms.com)
        using venue@jodhabairetreat.com
     2. Paste the endpoint URL between the quotes below, e.g.
        var FORM_ENDPOINT = "https://formspree.io/f/abcdwxyz";
     While this is empty, submissions show the thank-you screen but
     DO NOT send anywhere — enquiries are lost.
     ============================================================ */
  var FORM_ENDPOINT = "";

  /* ---- Staggered entrance animation on page load ---- */
  var items = document.querySelectorAll('[data-animate]');
  items.forEach(function (el, i) {
    setTimeout(function () {
      el.classList.add('is-visible');
    }, 80 + i * 110);
  });

  /* ---- Custom topic select ---- */
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

  /* ---- Pre-fill from ?package= (photoshoot package enquiry links) ---- */
  (function prefillPackage() {
    var params = new URLSearchParams(window.location.search);
    var pkg = params.get('package');
    if (!pkg) return;

    var wrap = document.getElementById('cfTopicSelect');
    if (wrap) {
      var valEl  = wrap.querySelector('.cf-select__val');
      var native = wrap.querySelector('select');
      var opts   = wrap.querySelectorAll('.cf-select__opt');
      var target = wrap.querySelector('.cf-select__opt[data-value="photoshoots"]');
      if (target && valEl && native) {
        opts.forEach(function (o) {
          o.classList.remove('is-selected');
          o.setAttribute('aria-selected', 'false');
        });
        target.classList.add('is-selected');
        target.setAttribute('aria-selected', 'true');
        valEl.textContent = target.querySelector('.cf-select__opt-text').textContent;
        native.value = 'photoshoots';
      }
    }

    var messageEl = document.getElementById('cf-message');
    if (messageEl && !messageEl.value) {
      messageEl.value = "I'd like to enquire about the " + pkg + " package.";
    }
  }());

  /* ---- Form ---- */
  var form      = document.getElementById('contactForm');
  var status    = document.getElementById('cfStatus');
  var submitBtn = document.getElementById('cfSubmit');
  var thanks    = document.getElementById('ctThanks');
  var timerEl   = document.getElementById('ctTimer');

  if (!form || !status || !submitBtn || !thanks) return;

  /* ---- Reset a stale thank-you state restored from the back/forward
     cache (e.g. pressing Back after a submission redirected away) ---- */
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    thanks.classList.remove('is-active');
    thanks.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    submitBtn.classList.remove('is-sending');
    submitBtn.disabled = false;
    status.textContent = '';
    status.classList.remove('is-error');
  });

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
      /* Demo mode — no endpoint configured yet (see FORM_ENDPOINT above) */
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
