document.addEventListener('DOMContentLoaded', () => {

  // -------- Mobile menu --------
  const btn = document.querySelector('.mobile-menu-btn');
  const menu = document.querySelector('.mobile-menu');
  const close = menu?.querySelector('.close-btn');

  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
    const shut = () => { menu.classList.remove('open'); document.body.style.overflow = ''; };
    close?.addEventListener('click', shut);
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', shut));
  }

  // -------- Theme toggle --------
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  });

  // -------- Helper: close all open dropdowns --------
  function closeAll() {
    document.querySelectorAll('.select-options.open, .cal-dropdown.open, .time-dropdown.open').forEach(o => o.classList.remove('open'));
    document.querySelectorAll('.custom-select.open, .date-picker-wrap.open, .time-picker-wrap.open').forEach(s => s.classList.remove('open'));
  }

  document.addEventListener('click', closeAll);
  window.addEventListener('scroll', closeAll, { passive: true });

  const mNames = ['Siječanj','Veljača','Ožujak','Travanj','Svibanj','Lipanj','Srpanj','Kolovoz','Rujan','Listopad','Studeni','Prosinac'];
  const dNames = ['Po','Ut','Sr','Če','Pe','Su','Ne'];

  // -------- Custom select dropdowns (class-based, supports multiple) --------
  document.querySelectorAll('.custom-select').forEach(sel => {
    const trigger = sel.querySelector('.select-trigger');
    const opts = sel.querySelector('.select-options');
    const hidden = sel.querySelector('input[type="hidden"]');
    const label = trigger.querySelector('span');
    if (!trigger || !opts) return;

    document.body.appendChild(opts);

    function toggleDropdown(e) {
      e.stopPropagation();
      const wasOpen = sel.classList.contains('open');
      closeAll();
      if (!wasOpen) {
        const rect = trigger.getBoundingClientRect();
        opts.style.top = rect.bottom + 4 + 'px';
        opts.style.left = rect.left + 'px';
        opts.style.width = rect.width + 'px';
        sel.classList.add('open');
        opts.classList.add('open');
      }
    }

    trigger.addEventListener('click', toggleDropdown);
    const field = sel.closest('.form-field');
    if (field) {
      field.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target.closest('.select-trigger') || e.target.closest('.select-options')) return;
        toggleDropdown(e);
      });
    }

    opts.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      e.stopPropagation();
      label.textContent = li.textContent;
      if (hidden) hidden.value = li.dataset.value;
      opts.querySelectorAll('li').forEach(l => l.classList.remove('selected'));
      li.classList.add('selected');
      closeAll();
      if (typeof calculatePrice === 'function') calculatePrice();
    });
  });

  // -------- Calendar pickers (class-based, supports multiple) --------
  document.querySelectorAll('.date-picker-wrap').forEach(wrap => {
    const trigger = wrap.querySelector('.select-trigger');
    const calDrop = wrap.querySelector('.cal-dropdown');
    const dateInput = wrap.querySelector('input[type="hidden"]');
    if (!trigger || !calDrop) return;

    document.body.appendChild(calDrop);

    const now = new Date();
    let calYear = now.getFullYear();
    let calMonth = now.getMonth();
    let selectedDate = null;

    function renderCal() {
      const firstDay = new Date(calYear, calMonth, 1).getDay();
      const shift = (firstDay === 0 ? 6 : firstDay - 1);
      const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
      const today = new Date(); today.setHours(0,0,0,0);

      let html = '<div class="cal-head-row">';
      html += '<button class="cal-prev" type="button">&#8249;</button>';
      html += '<span>' + mNames[calMonth] + ' ' + calYear + '</span>';
      html += '<button class="cal-next" type="button">&#8250;</button>';
      html += '</div>';
      html += '<div class="cal-weekdays">';
      dNames.forEach(d => html += '<span>' + d + '</span>');
      html += '</div>';
      html += '<div class="cal-grid">';

      for (let i = 0; i < shift; i++) html += '<button class="empty" type="button"></button>';

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(calYear, calMonth, d);
        date.setHours(0,0,0,0);
        const iso = date.toISOString().slice(0,10);
        const isPast = date < today;
        const isToday = date.getTime() === today.getTime();
        const isSel = selectedDate === iso;
        let cls = '';
        if (isPast) cls = 'past';
        else if (isSel) cls = 'selected';
        else if (isToday) cls = 'today';
        html += '<button type="button" data-date="' + iso + '" class="' + cls + '">' + d + '</button>';
      }

      html += '</div>';
      calDrop.innerHTML = html;

      calDrop.querySelector('.cal-prev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        calMonth--;
        if (calMonth < 0) { calMonth = 11; calYear--; }
        renderCal();
      });
      calDrop.querySelector('.cal-next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        calMonth++;
        if (calMonth > 11) { calMonth = 0; calYear++; }
        renderCal();
      });

      calDrop.querySelectorAll('.cal-grid button:not(.empty):not(.past)').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedDate = b.dataset.date;
          if (dateInput) dateInput.value = selectedDate;
          const dt = new Date(selectedDate + 'T00:00:00');
          trigger.querySelector('span').textContent = dt.getDate() + '. ' + mNames[dt.getMonth()].slice(0,3).toLowerCase() + ' ' + dt.getFullYear();
          closeAll();
          if (typeof calculatePrice === 'function') calculatePrice();
        });
      });
    }

    function toggleCal(e) {
      e.stopPropagation();
      const wasOpen = wrap.classList.contains('open');
      closeAll();
      if (!wasOpen) {
        const rect = trigger.getBoundingClientRect();
        calDrop.style.top = rect.bottom + 4 + 'px';
        calDrop.style.left = rect.left + 'px';
        calDrop.style.width = Math.max(rect.width, 260) + 'px';
        wrap.classList.add('open');
        calDrop.classList.add('open');
        renderCal();
      }
    }

    trigger.addEventListener('click', toggleCal);
    const field = wrap.closest('.form-field');
    if (field) {
      field.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!e.target.closest('.select-trigger')) toggleCal(e);
      });
    }

    calDrop.addEventListener('click', (e) => e.stopPropagation());
  });

  // -------- Time pickers (class-based, supports multiple) --------
  document.querySelectorAll('.time-picker-wrap').forEach(wrap => {
    const trigger = wrap.querySelector('.select-trigger');
    const timeDrop = wrap.querySelector('.time-dropdown');
    const timeInput = wrap.querySelector('input[type="hidden"]');
    if (!trigger || !timeDrop) return;

    // Build time-cols if not already present
    let cols = timeDrop.querySelector('.time-cols');
    if (!cols) {
      cols = document.createElement('div');
      cols.className = 'time-cols';
      cols.innerHTML = '<div class="time-col hour-col"></div><div class="time-sep">:</div><div class="time-col min-col"></div>';
      timeDrop.appendChild(cols);
    }
    const hourCol = cols.querySelector('.hour-col');
    const minCol = cols.querySelector('.min-col');
    if (!hourCol || !minCol) return;

    document.body.appendChild(timeDrop);

    let selHour = null, selMin = null;

    // Only populate if empty
    if (hourCol.children.length === 0) {
      for (let h = 0; h < 24; h++) {
        const hh = String(h).padStart(2, '0');
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = hh;
        b.dataset.val = hh;
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          selHour = hh;
          hourCol.querySelectorAll('button').forEach(x => x.classList.remove('selected'));
          b.classList.add('selected');
          checkTimeComplete();
        });
        hourCol.appendChild(b);
      }
    }

    if (minCol.children.length === 0) {
      for (let m = 0; m < 60; m += 5) {
        const mm = String(m).padStart(2, '0');
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = mm;
        b.dataset.val = mm;
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          selMin = mm;
          minCol.querySelectorAll('button').forEach(x => x.classList.remove('selected'));
          b.classList.add('selected');
          checkTimeComplete();
        });
        minCol.appendChild(b);
      }
    }

    function checkTimeComplete() {
      if (selHour !== null && selMin !== null) {
        const val = selHour + ':' + selMin;
        if (timeInput) timeInput.value = val;
        trigger.querySelector('span').textContent = val;
        closeAll();
      }
    }

    function toggleTime(e) {
      e.stopPropagation();
      const wasOpen = wrap.classList.contains('open');
      closeAll();
      if (!wasOpen) {
        // Reset selections — user must click both hour and minute to close
        selHour = null;
        selMin = null;
        hourCol.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        minCol.querySelectorAll('button').forEach(b => b.classList.remove('selected'));

        const rect = trigger.getBoundingClientRect();
        timeDrop.style.top = rect.bottom + 4 + 'px';
        timeDrop.style.left = rect.left + 'px';
        timeDrop.style.width = Math.max(rect.width, 160) + 'px';
        wrap.classList.add('open');
        timeDrop.classList.add('open');
      }
    }

    trigger.addEventListener('click', toggleTime);
    const field = wrap.closest('.form-field');
    if (field) {
      field.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!e.target.closest('.select-trigger')) toggleTime(e);
      });
    }

    timeDrop.addEventListener('click', (e) => e.stopPropagation());
  });

  // -------- Price calculation (hero form on homepage) --------
  const prices = {
    'airport-oldtown': 35, 'airport-hotel': 35, 'airport-split': 280,
    'airport-mostar': 150, 'airport-kotor': 120,
    'oldtown-airport': 35, 'oldtown-hotel': 15, 'oldtown-split': 280,
    'oldtown-mostar': 150, 'oldtown-kotor': 120,
    'hotel-airport': 35, 'hotel-oldtown': 15, 'hotel-split': 280,
    'hotel-mostar': 150, 'hotel-kotor': 120,
    'split-airport': 280, 'split-oldtown': 280, 'split-hotel': 280,
    'split-mostar': 180, 'split-kotor': 350,
    'mostar-airport': 150, 'mostar-oldtown': 150, 'mostar-hotel': 150,
    'mostar-split': 180, 'mostar-kotor': 200,
    'kotor-airport': 120, 'kotor-oldtown': 120, 'kotor-hotel': 120,
    'kotor-split': 350, 'kotor-mostar': 200,
  };

  function calculatePrice() {
    const pickup = document.querySelector('.booking-form input[name="pickup"]')?.value;
    const dropoff = document.querySelector('.booking-form input[name="dropoff"]')?.value;
    const passengers = document.querySelector('.booking-form input[name="passengers"]')?.value || '1';
    const priceDisplay = document.getElementById('price-display');

    if (!priceDisplay) return;

    if (!pickup || !dropoff) {
      priceDisplay.innerHTML = '<span class="price-hint">Odaberite polazište i odredište</span>';
      return;
    }

    if (pickup === dropoff) {
      priceDisplay.innerHTML = '<span class="price-hint">Polazište i odredište ne mogu biti isti</span>';
      return;
    }

    const key = pickup + '-' + dropoff;
    const basePrice = prices[key];

    if (!basePrice) {
      priceDisplay.innerHTML = '<span class="price-hint">Kontaktirajte nas za cijenu ove rute</span>';
      return;
    }

    let pax = parseInt(passengers) || 1;
    let vehicleLabel, multiplier;

    if (pax <= 3) { vehicleLabel = 'Sedan (1-3 putnika)'; multiplier = 1; }
    else if (pax <= 6) { vehicleLabel = 'Minivan (4-6 putnika)'; multiplier = 1.4; }
    else { vehicleLabel = 'Minibus (7+ putnika)'; multiplier = 1.8; }

    const total = Math.round(basePrice * multiplier);

    priceDisplay.innerHTML =
      '<div class="price-result">' +
        '<div class="price-amount-row">' +
          '<span class="price-big">' + total + ' &euro;</span>' +
          '<span class="price-per">ukupna cijena</span>' +
        '</div>' +
        '<div class="price-vehicle">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>' +
          vehicleLabel +
        '</div>' +
        '<ul class="price-includes">' +
          '<li><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Praćenje leta</li>' +
          '<li><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Wi-Fi</li>' +
          '<li><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Fiksna cijena</li>' +
        '</ul>' +
      '</div>';
  }

  document.querySelectorAll('.booking-form input').forEach(inp => {
    inp.addEventListener('change', calculatePrice);
  });

  calculatePrice();

});

/* ============================================================
   Background-image load detection with picsum fallback.
   Finds elements with inline background-image:url(unsplash...),
   preloads the image, and swaps to picsum seed on error.
============================================================ */
(function () {
  "use strict";
  function parseBg(el) {
    var bg = el.style.backgroundImage || "";
    var m = bg.match(/url\((['"]?)(https:\/\/images\.unsplash\.com\/(photo-[a-f0-9-]+)[^'")]*)\1\)/);
    if (!m) return null;
    return { url: m[2], id: m[3] };
  }
  var fallbackMap = {
    "photo-1523906834658-6e24ef2386f9": "sea-cliff-1",
    "photo-1564507592333-c60657eea523": "adriatic-med",
    "photo-1519046904884-53103b34b206": "sea-aerial",
    "photo-1555990614-d0cd7bab3906": "old-town-1",
    "photo-1530549387789-4c1017266635": "cliff-view",
    "photo-1505142468610-359e7d316be0": "sea-sunset",
    "photo-1507525428034-b723cf961d3e": "golden-beach",
    "photo-1501785888041-af3ef285b470": "adriatic-blue",
    "photo-1555990538-11b2ac9cc5e7": "stone-bridge"
  };
  function check(el) {
    var info = parseBg(el);
    if (!info) return;
    var img = new Image();
    img.onerror = function () {
      var seed = fallbackMap[info.id] || "adriatic-sea";
      var w = el.offsetWidth >= 1200 ? 1600 : 800;
      var h = Math.round((w * 9) / 16);
      var fallback = "https://picsum.photos/seed/" + seed + "/" + w + "/" + h;
      el.style.backgroundImage = "url('" + fallback + "')";
    };
    img.src = info.url;
  }
  document.addEventListener("DOMContentLoaded", function () {
    var els = document.querySelectorAll(".hero-bg, .post-thumb");
    els.forEach(check);
  });
})();
