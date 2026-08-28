/* ProDent Advisors — site interactions
   Vanilla JS, no dependencies. Progressive enhancement only. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    var closeMenu = function () {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    };
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); toggle.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  /* ---------- Sticky header shadow ---------- */
  var header = document.getElementById('site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Scroll reveal + on-view triggers ---------- */
  var revealables = document.querySelectorAll('.reveal');
  var counters = document.querySelectorAll('[data-count]');
  var bars = document.querySelectorAll('.ba-fill[data-w]');

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = (el.getAttribute('data-decimals')) ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = prefix + target.toFixed(decimals) + suffix; return; }
    var dur = 1400, start = null;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-visible');
        if (el.hasAttribute('data-count')) animateCount(el);
        if (el.classList.contains('ba-fill')) el.style.width = el.getAttribute('data-w');
        obs.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

    revealables.forEach(function (el) { io.observe(el); });
    counters.forEach(function (el) { io.observe(el); });
    bars.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
    counters.forEach(function (el) { el.textContent = (el.getAttribute('data-prefix') || '') + el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
    bars.forEach(function (el) { el.style.width = el.getAttribute('data-w'); });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.style.maxHeight = expanded ? null : panel.scrollHeight + 'px';
    });
  });

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    /* ====================================================================
       The form posts to send.php on this same server, which emails
       info@prodentadvisors.com. No third-party account, no API key,
       nothing to configure.

       The <form> element carries action="send.php" method="post", so if
       JavaScript is unavailable the browser submits it the plain way and
       send.php redirects to the thank-you page. The code below simply
       upgrades that to an inline experience.
       ==================================================================== */
    var ENDPOINT = form.getAttribute('action') || 'send.php';
    var SUCCESS_PAGE = 'thank-you.html';
    var NOTIFY_EMAIL = 'info@prodentadvisors.com';
    var PHONE_DISPLAY = '(571) 464-2655';

    var status = document.getElementById('form-status');
    var submitBtn = form.querySelector('[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.textContent : '';

    var setError = function (field, on) {
      var wrap = field.closest('.field');
      if (wrap) wrap.classList.toggle('invalid', on);
    };
    var showStatus = function (msg, ok) {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form-status show ' + (ok ? 'ok' : 'err');
    };
    var fallbackMsg = function (lead) {
      return lead + ' Please email ' + NOTIFY_EMAIL + ' or call ' + PHONE_DISPLAY + '.';
    };

    // If the no-JS path bounced back with an error, say so on arrival.
    if (window.location.search.indexOf('sent=error') !== -1) {
      showStatus(fallbackMsg('Your message could not be sent.'), false);
    }

    var validate = function () {
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var bad = !f.value.trim();
        if (f.type === 'email' && f.value.trim()) {
          bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim());
        }
        setError(f, bad);
        if (bad && valid) f.focus();
        if (bad) valid = false;
      });
      return valid;
    };

    form.querySelectorAll('[required]').forEach(function (f) {
      f.addEventListener('input', function () { setError(f, false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (status) status.className = 'form-status';
      if (!validate()) { showStatus('Please complete the highlighted fields.', false); return; }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      var restore = function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabel; }
      };

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'fetch' },
        body: new FormData(form)
      })
        .then(function (r) {
          // A misconfigured server can return HTML instead of JSON; treat
          // anything unparseable as a failure rather than a false success.
          return r.json().catch(function () { return { success: false }; });
        })
        .then(function (res) {
          if (res && res.success) {
            // Reset first so the Back button doesn't offer a filled form to
            // submit a second time.
            form.reset();
            showStatus('Thanks! Redirecting…', true);
            window.location.href = SUCCESS_PAGE;
            return;
          }
          restore();
          showStatus(res && res.message ? res.message : fallbackMsg('Something went wrong.'), false);
        })
        .catch(function () {
          restore();
          showStatus(fallbackMsg('Network error.'), false);
        });
    });
  }
})();
