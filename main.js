/* ==========================================================================
   حضانة مس مامي — main.js
   كل التحسينات اختيارية: أي جزء شُال من index.html بيتم تخطيه من غير أخطاء،
   ولو JavaScript مقفول الصفحة بتفضل شغالة بالـ CSS لوحدها.
   ========================================================================== */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var arDigits = function (value) {
    var map = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(value).replace(/[0-9]/g, function (d) { return map[+d]; });
  };

  /* ---------- ١) الهيدر: ظل عند السكرول + زرار رجوع لأعلى ---------- */
  (function headerAndToTop() {
    var header = document.querySelector('.site-header');
    var toTop = document.getElementById('to-top');
    var ticking = false;

    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (header) header.classList.toggle('scrolled', y > 8);
      if (toTop) toTop.hidden = y < 600;
      ticking = false;
    }
    if (!header && !toTop) return;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  })();

  /* ---------- ٢) تظليل لينك القسم الحالي في القائمة ---------- */
  (function scrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
    if (!links.length) return;

    var pairs = [];
    links.forEach(function (link) {
      var section = document.querySelector(link.getAttribute('href'));
      if (section) pairs.push({ link: link, section: section });
    });
    if (!pairs.length) return;

    function update() {
      var line = (window.innerHeight || document.documentElement.clientHeight) * 0.4;
      var current = null;
      pairs.forEach(function (pair) {
        var box = pair.section.getBoundingClientRect();
        if (box.top <= line && box.bottom > line) current = pair;
      });
      if (!current) return;
      pairs.forEach(function (pair) {
        var on = pair === current;
        pair.link.classList.toggle('active', on);
        if (on) pair.link.setAttribute('aria-current', 'true');
        else pair.link.removeAttribute('aria-current');
      });
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ---------- ٣) ظهور العناصر بالناعم مع السكرول ---------- */
  (function revealOnScroll() {
    if (reducedMotion) return;

    var items = Array.prototype.slice.call(document.querySelectorAll(
      '.section-head, #about .card, .class-card, .facility, .price-card, .tl-item, .faq, .gallery .ph'
    ));
    if (!items.length) return;

    items.forEach(function (el) { el.classList.add('reveal'); });

    function markInView() {
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      items.forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        var box = el.getBoundingClientRect();
        if (box.top < vh * 0.95 && box.bottom > 0) el.classList.add('is-in');
      });
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      items.forEach(function (el) { observer.observe(el); });
    }

    // شبكة أمان: أي عنصر ظاهر بالفعل لازم يبان، حتى لو Observer اتأخر
    markInView();
    window.addEventListener('load', markInView);
    window.addEventListener('scroll', markInView, { passive: true });
    setTimeout(markInView, 300);
    window.addEventListener('beforeprint', function () {
      items.forEach(function (el) { el.classList.add('is-in'); });
    });
  })();

  /* ---------- ٤) قائمة الموبايل: تقفل herself ---------- */
  (function mobileMenu() {
    var toggle = document.getElementById('nav-toggle');
    var nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;

    var mobileQuery = window.matchMedia('(max-width: 1000px)');

    function isOpen() { return toggle.checked; }

    function syncLock() {
      var lock = isOpen() && mobileQuery.matches;
      document.body.classList.toggle('nav-locked', lock);
    }

    function close() {
      if (!isOpen()) return;
      toggle.checked = false;
      syncLock();
    }

    toggle.addEventListener('change', syncLock);

    nav.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (link) close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (!isOpen()) return;
      close();
      toggle.focus();
    });

    mobileQuery.addEventListener
      ? mobileQuery.addEventListener('change', syncLock)
      : mobileQuery.addListener(syncLock);

    window.addEventListener('beforeprint', close);
  })();

  /* ---------- ٥) الوضع الفاتح / الغامق (بيتحفظ في المتصفح) ---------- */
  (function themeToggle() {
    var button = document.getElementById('theme-toggle');
    var root = document.documentElement;
    var icon = button ? button.querySelector('.theme-ico') : null;
    var meta = document.querySelector('meta[name="theme-color"]');
    var stored = null;
    try { stored = localStorage.getItem('mm-theme'); } catch (error) {}

    function systemDark() { return window.matchMedia('(prefers-color-scheme: dark)').matches; }
    function isDark() {
      var explicit = root.getAttribute('data-theme');
      return explicit ? explicit === 'dark' : systemDark();
    }

    function paint() {
      var dark = isDark();
      if (icon) icon.textContent = dark ? '☀️' : '🌙';
      if (button) {
        button.setAttribute('aria-pressed', dark ? 'true' : 'false');
        button.setAttribute('title', dark ? 'ارجعي للوضع الفاتح' : 'شغّلي الوضع الغامق');
      }
      if (meta) meta.setAttribute('content', dark ? '#0e1522' : '#2f6bd8');
    }

    paint();
    if (!button) return;

    button.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('mm-theme', next); } catch (error) {}
      paint();
    });

    var systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var onSystemChange = function () {
      var explicit = null;
      try { explicit = localStorage.getItem('mm-theme'); } catch (error) {}
      if (explicit) return;
      root.removeAttribute('data-theme');
      paint();
    };
    systemQuery.addEventListener
      ? systemQuery.addEventListener('change', onSystemChange)
      : systemQuery.addListener(onSystemChange);
  })();

  /* ---------- ٦) شارة "مفتوحة / مقفولة دلوقتي" حسب ميعاد الحضانة ---------- */
  (function openStatus() {
    var chip = document.getElementById('open-chip');
    if (!chip) return;

    var TZ = 'Africa/Cairo';
    var OPEN_AT = 7;    // ٧ الصبح
    var CLOSE_AT = 14;  // ٢ بعد الظهر
    var CLOSED_DAY = 5; // الجمعة
    var dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    function cairoNow() {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      var get = function (type) {
        var found = parts.filter(function (p) { return p.type === type; })[0];
        return found ? found.value : '';
      };
      var short = get('weekday').slice(0, 3);
      var index = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[short];
      return { day: index, hour: +get('hour'), minute: +get('minute') };
    }

    function clock(hour) {
      return arDigits(hour === 12 ? 12 : hour % 12) + (hour < 12 ? ' ص' : ' م');
    }

    function show(text, open) {
      chip.textContent = text;
      chip.hidden = false;
      chip.classList.toggle('chip-open', open);
      chip.classList.toggle('chip-shut', !open);
    }

    var now;
    try { now = cairoNow(); } catch (error) { return; }
    if (!now || typeof now.day !== 'number') return;

    var openNow = now.day !== CLOSED_DAY && now.hour >= OPEN_AT && now.hour < CLOSE_AT;

    if (openNow) {
      show('مفتوحة دلوقتي · تقفل ' + clock(CLOSE_AT), true);
      return;
    }

    // أقرب يوم عمل جاي
    var next = null;
    for (var step = 0; step < 8 && next === null; step++) {
      var day = (now.day + step) % 7;
      if (day === CLOSED_DAY) continue;
      if (step === 0 && now.hour >= CLOSE_AT) continue; // النهارده خلّص
      next = { day: day, today: step === 0 };
    }
    if (!next) return;

    var when = next.today ? 'تفتح الساعة ' + clock(OPEN_AT) : (next.day === (now.day + 1) % 7 ? 'تفتح بكرة ' + clock(OPEN_AT) : 'تفتح ' + dayNames[next.day] + ' ' + clock(OPEN_AT));
    show(now.day === CLOSED_DAY ? 'مقفولة أيام الجمعة · ' + when : 'مقفولة دلوقتي · ' + when, false);
  })();

  /* ---------- ٧) الفورم: إرسال من غير رفرفة + واتساب لو Formspree مش مضبوط ---------- */
  (function visitForm() {
    var form = document.querySelector('form.visit-form');
    if (!form) return;

    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var honeypot = form.querySelector('.hp');
    var buttonLabel = button ? button.textContent : '';

    // رقم الواتساب بيتقرأ من أول لينك واتساب في الصفحة — مكان واحد للتعديل
    var waLink = document.querySelector('a[href*="wa.me/"]');
    var waNumber = waLink ? waLink.href.replace(/[^0-9]/g, '') : '';

    function say(text, kind) {
      if (!status) return;
      status.hidden = false;
      status.textContent = text;
      status.className = 'form-status ' + (kind || '');
    }

    function busy(on) {
      if (!button) return;
      button.disabled = on;
      button.setAttribute('aria-busy', on ? 'true' : 'false');
      button.textContent = on ? 'بنتظر رد…' : buttonLabel;
    }

    function summary() {
      var value = function (id) {
        var field = document.getElementById(id);
        return field ? field.value.trim() : '';
      };
      var lines = ['طلب زيارة — حضانة مس مامي', 'الاسم: ' + value('f-name'), 'الموبايل: ' + value('f-phone')];
      var optional = [
        ['سن الطفل', value('f-age')],
        ['يوم الزيارة', value('f-day')],
        ['المنطقة', value('f-area')],
        ['ملاحظة', value('f-note')]
      ];
      optional.forEach(function (row) {
        if (row[1]) lines.push(row[0] + ': ' + row[1]);
      });
      return lines.join('\n');
    }

    function viaWhatsApp() {
      if (!waNumber) {
        say('الفورم لسه مش متوصّل بخدمة استلام. كلّمينا على التليفون أو الواتساب.', 'bad');
        return;
      }
      var url = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(summary());
      var win = window.open(url, '_blank', 'noopener');
      if (win) {
        say('فتحتلك واتساب برسالتك جاهزة — لو النافذة ما فتحتش، استعملي لينك الواتساب اللي فوق.', 'ok');
      } else {
        say('المتصفح منع فتح واتساب. استعملي لينك الواتساب اللي فوق عشان تكمّلي الطلب.', 'ok');
      }
      if (form.reset) form.reset();
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      // تحقّق HTML الأصلي (الاسم مطلوب والموبايل ١١ رقم) — لو ناقص، ما نكمّلش
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
      if (honeypot && honeypot.value) return; // سبام

      var action = form.getAttribute('action') || '';
      if (!action || action.indexOf('XXXXXXXX') !== -1) {
        viaWhatsApp(); // لسه ما حطّتيش رابط Formspree
        return;
      }

      var data = new FormData(form);
      busy(true);
      say('ببعت طلبك…', '');

      fetch(action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (response) {
          if (!response.ok) throw new Error('bad response');
          form.reset();
          say('تم! وصلنا طلبك وهنتواصل معاكي على الرقم اللي كتبتيه.', 'ok');
        })
        .catch(function () {
          say('حصل مشكلة في الإرسال. جربي تاني، أو ابعتي على واتساب.', 'bad');
        })
        .then(function () { busy(false); });
    });
  })();

  /* ---------- ٨) سنة الفوتر لوحدها ---------- */
  (function footerYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = arDigits(new Date().getFullYear());
  })();
})();
