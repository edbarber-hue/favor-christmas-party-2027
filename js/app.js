(function () {
  'use strict';
  var API = window.KKAPI;
  var app = document.getElementById('app');
  var modal = document.getElementById('modal');
  var timers = [];

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function store(k, v) {
    try {
      if (v === undefined) { var r = sessionStorage.getItem('kk-' + k); return r ? JSON.parse(r) : null; }
      if (v === null) sessionStorage.removeItem('kk-' + k); else sessionStorage.setItem('kk-' + k, JSON.stringify(v));
    } catch (e) { return null; }
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function render(html) { app.innerHTML = html; app.focus({ preventScroll: true }); if (typeof tickCountdowns === 'function') tickCountdowns(); }
  function loading() { render('<div class="spinner"></div>'); }
  function peso(n) { return '₱' + Number(n || 0).toLocaleString('en-PH'); }
  function fmtDeadline(iso) {
    var t = Date.parse(iso); if (isNaN(t)) return '';
    try { return new Date(t).toLocaleString('en-US', { timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
    catch (e) { return new Date(t).toLocaleString(); }
  }
  // Live countdown: any element with data-deadline gets updated every second.
  function countdownHTML(iso, compact, label) {
    if (!iso || isNaN(Date.parse(iso))) return '';
    return '<div class="countdown' + (compact ? ' compact' : '') + '" data-deadline="' + esc(iso) + '" data-label="' + esc(label || 'Find out who you got in') + '"></div>';
  }
  function tickCountdowns() {
    $$('[data-deadline]').forEach(function (el) {
      var left = Date.parse(el.dataset.deadline) - Date.now();
      var compact = el.classList.contains('compact');
      if (left <= 0) { el.innerHTML = '<span class="cd-closed">Names are being drawn. Refresh to see who you got.</span>'; return; }
      var d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24, m = Math.floor(left / 6e4) % 60, sec = Math.floor(left / 1e3) % 60;
      if (compact) { el.textContent = 'Edits close in ' + (d ? d + 'd ' : '') + h + 'h ' + m + 'm ' + sec + 's'; return; }
      var u = function (n, l) { return '<span class="cd-unit">' + KNIT.text((n < 10 ? '0' : '') + n, { color: '#eca7c6' }) + '<i>' + l + '</i></span>'; };
      if (!el.firstChild) el.innerHTML = '<span class="cd-label">' + el.dataset.label + '</span><span class="cd-units"></span>';
      var key = d + ':' + h + ':' + m + ':' + sec;
      if (el.dataset.key !== key) { el.dataset.key = key; el.lastChild.innerHTML = u(d, 'days') + u(h, 'hrs') + u(m, 'min') + u(sec, 'sec'); }
    });
  }
  setInterval(tickCountdowns, 1000);
  function showError(where, err) {
    var box = typeof where === 'string' ? $(where) : where;
    if (box) { box.hidden = false; box.className = 'error'; box.textContent = err.message || String(err); }
  }
  function busy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || 'One moment…'; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  }
  function every(ms, fn) { timers.push(setInterval(fn, ms)); }
  function openModal(html, narrow) {
    modal.innerHTML = '<div class="modal-box' + (narrow ? ' narrow' : '') + '">' + html + '</div>';
    modal.hidden = false;
    return modal.firstChild;
  }
  function closeModal() { modal.hidden = true; modal.innerHTML = ''; }
  modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  function wishListHTML(wishes) {
    return '<ul class="wishlist">' + (wishes || []).map(function (w) {
      return '<li><span>' + esc(w.item) + '</span>' +
        (w.link ? '<a href="' + esc(w.link) + '" target="_blank" rel="noopener">link ↗</a>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  // ---------- confetti ----------
  var confetti = (function () {
    var cv = document.getElementById('confetti'), ctx = cv.getContext('2d'), parts = [], raf = 0;
    var colors = ['#f2e8d4', '#eca7c6', '#6f9e89', '#2d4833', '#ffffff'];
    function size() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
    addEventListener('resize', size); size();
    function tick() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts = parts.filter(function (p) { return p.y < cv.height + 40 && p.life-- > 0; });
      parts.forEach(function (p) {
        p.vy += 0.25 * devicePixelRatio; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      raf = parts.length ? requestAnimationFrame(tick) : 0;
    }
    return function burst(n) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var d = devicePixelRatio;
      for (var i = 0; i < (n || 140); i++) {
        parts.push({ x: cv.width / 2 + (Math.random() - .5) * 200 * d, y: cv.height * .35,
          vx: (Math.random() - .5) * 18 * d, vy: (-Math.random() * 14 - 4) * d,
          w: (6 + Math.random() * 6) * d, h: (8 + Math.random() * 8) * d,
          r: Math.random() * 6, vr: (Math.random() - .5) * .3,
          c: colors[i % colors.length], life: 260 });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
  })();

  // ---------- shared info ----------
  var info = null;
  function loadInfo() {
    return API.call('info').then(function (d) {
      info = d;
      $('#brandName').textContent = d.eventName;
      document.title = d.eventName;
      return d;
    });
  }

  // =====================================================================
  // HOME — one poster, one button
  // =====================================================================
  var BURST = '<svg class="burst" viewBox="0 0 400 400" aria-hidden="true"><path fill="#6f9e89" d="M200 0 214 158 330 70 238 186 400 200 238 214 330 330 214 242 200 400 186 242 70 330 162 214 0 200 162 186 70 70 186 158Z"/></svg>';
  var SPARK = function (cls) { return '<svg class="sparkle ' + cls + '" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 0C21 13 27 19 40 20 27 21 21 27 20 40 19 27 13 21 0 20 13 19 19 13 20 0Z"/></svg>'; };
  var STAR6 = '<svg class="star6" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 24 13 36 11 28 20 36 29 24 27 20 38 16 27 4 29 12 20 4 11 16 13Z"/></svg>';

  function viewHome() {
    loading();
    loadInfo().then(function (d) {
      var facts = '<span>Your budget is ' + Number(d.budget || 0).toLocaleString('en-PH') + ' pesos</span>' +
        '<span>Christmas party is on ' + (d.partyDate ? esc(d.partyDate) : 'a date to be announced') + '</span>';
      var cta = d.phase === 'signup' && !d.editsClosed
        ? '<a class="btn cream block" href="#/join">Add my wishlist</a><a class="textlink" href="#/me">Already joined? Log in</a>'
        : d.phase === 'signup'
        ? '<a class="btn cream block" href="#/me">Log in</a>'
        : d.phase === 'drawn'
          ? '<a class="btn cream block" href="#/me">See who I\'m shopping for</a>'
          : '<a class="btn cream block" href="#/reveal">Watch the reveal</a><a class="textlink" href="#/me">My page</a>';
      render(
        '<section class="poster">' + BURST + SPARK('s1') + SPARK('s2') + SPARK('s3') +
          '<h1 class="poster-type"><span class="script">Mystery</span><span class="big">Kris Kringle</span></h1>' +
          '<p class="poster-sub">' + esc(d.eventName) + '</p>' +
          '<div class="poster-facts">' + facts + '</div>' +
          (d.phase === 'signup' ? countdownHTML(d.deadline) : '') +
          '<div class="poster-cta">' + cta + '</div>' +
        '</section>'
      );
    }).catch(function (e) { render('<div class="error">' + esc(e.message) + '</div>'); });
  }

  // =====================================================================
  // JOIN / EDIT WISHLIST
  // =====================================================================
  function wishRow(w, i) {
    w = w || {};
    return '<div class="wish-row">' +
      '<div class="line"><input name="item" maxlength="140" aria-label="Gift idea ' + (i + 1) + '" placeholder="' + ['A gift you\'d love', 'Another one', 'One more'][i] + '" value="' + esc(w.item) + '">' +
      '<button type="button" class="link-toggle" aria-label="Add a link">' + (w.link ? 'Link ✓' : '+ Link') + '</button></div>' +
      '<input name="link" class="link-input" type="url" inputmode="url" placeholder="Paste a Shopee or Lazada link" value="' + esc(w.link) + '"' + (w.link ? '' : ' hidden') + '>' +
      '</div>';
  }

  function viewJoin() {
    var sess = store('me');
    var prefill = (sess && sess.wishes) || [];
    loading();
    loadInfo().then(function (d) {
      var editing = !!(sess && sess.wishes);
      if (d.editsClosed && d.phase !== 'revealed') { render('<div class="card center"><h2>Wishlists are closed</h2><p class="muted">The deadline was ' + esc(fmtDeadline(d.deadline)) + '. Ask the organizer if you need a change.</p><a class="btn" href="#/me">My page</a></div>'); return; }
      if (d.phase === 'revealed') { render('<div class="card center"><h2>Wishlists are closed</h2><p class="muted">The party\'s done. Merry Christmas!</p><a class="btn" href="#/reveal">Watch the reveal</a></div>'); return; }
      if (d.phase === 'drawn' && !editing) {
        render('<div class="card"><h2>Sign-ups are closed</h2><p class="muted">Names have been drawn. If you missed it, message the organizer.</p><a class="btn" href="#/me">Log in</a></div>');
        return;
      }
      var n = Math.max(3, prefill.length), rows = '';
      for (var i = 0; i < n; i++) rows += wishRow(prefill[i], Math.min(i, 2));
      render(
        '<div class="card pop">' +
          '<h2>' + (editing ? 'Your wishlist' : 'Join the game') + '</h2>' + countdownHTML(d.deadline, true) +
          '<form id="joinForm" novalidate>' +
            '<label for="jName">Your full name <span class="hint">first and last, you\'ll log in with it</span></label>' +
            '<input id="jName" name="name" maxlength="60" autocomplete="name" value="' + esc(sess ? sess.name : '') + '"' + (editing ? ' readonly' : '') + '>' +
            '<label for="jPin">Pick a 4-digit PIN <span class="hint">to log in later</span></label>' +
            '<input id="jPin" name="pin" class="pin-input" inputmode="numeric" maxlength="4" autocomplete="off" type="password" value="' + esc(sess ? sess.pin : '') + '">' +
            '<label>Gift ideas <span class="hint">3 to 5, around ' + peso(d.budget) + ' each</span></label>' +
            '<div id="wishes">' + rows + '</div>' +
            '<button type="button" class="add-wish" id="addWish"' + (n >= 5 ? ' hidden' : '') + '>+ Add another</button>' +
            '<div id="jErr" hidden></div>' +
            '<button class="btn block" style="margin-top:20px" type="submit">' + (editing ? 'Save wishlist' : 'Join') + '</button>' +
          '</form>' +
        '</div>'
      );
      var wl = $('#wishes');
      wl.addEventListener('click', function (e) {
        var t = e.target.closest('.link-toggle'); if (!t) return;
        var inp = t.closest('.wish-row').querySelector('.link-input');
        inp.hidden = !inp.hidden; if (!inp.hidden) inp.focus();
      });
      $('#addWish').onclick = function () {
        wl.insertAdjacentHTML('beforeend', wishRow({}, 2));
        wl.lastElementChild.querySelector('input').focus();
        if (wl.children.length >= 5) this.hidden = true;
      };
      $('#joinForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = e.target.querySelector('button[type=submit]');
        var items = $$('.wish-row', e.target).map(function (r) {
          return { item: r.querySelector('[name=item]').value, link: r.querySelector('[name=link]').value };
        });
        var payload = { name: $('#jName').value, pin: $('#jPin').value, wishes: items };
        busy(btn, true, 'Saving…');
        API.call('join', payload).then(function (r) {
          store('me', { name: r.name, pin: payload.pin, wishes: items.filter(function (x) { return x.item.trim(); }) });
          confetti(90);
          if (r.updated && info && info.phase === 'drawn') {
            render('<div class="card center pop"><h2>Saved</h2><p class="muted">Your Secret Santa will see the new list.</p><a class="btn" href="#/me">My page</a></div>');
            return;
          }
          render(
            '<div class="card center pop come-back">' + KNIT.stockings(5) +
              '<h2>' + (r.updated ? 'Saved' : 'You\'re in, ' + esc(r.name.split(' ')[0])) + '</h2>' +
              '<p>' + comeBackLine(info && info.deadline) + '</p>' +
              countdownHTML(info && info.deadline) +
              '<button class="btn" id="remindBtn">Remind me on my phone</button>' +
              '<p style="margin:14px 0 0"><a class="textlink" href="#/me">Go to my page</a></p>' +
            '</div>'
          );
          $('#remindBtn').onclick = function () { openRemind(info); };
          if (!r.updated) setTimeout(function () { openRemind(info); }, 1400);
        }).catch(function (err) { busy(btn, false); showError('#jErr', err); });
      });
    }).catch(function (e) { render('<div class="error">' + esc(e.message) + '</div>'); });
  }

  // =====================================================================
  // MY PAGE (log in with name + PIN)
  // =====================================================================
  function viewMe() {
    var sess = store('me');
    if (!sess || !sess.pin) return meLogin();
    loading();
    API.call('me', { name: sess.name, pin: sess.pin }).then(meDashboard).catch(function () { store('me', null); meLogin(); });
  }

  function meLogin() {
    render(
      '<div class="card pop">' +
        '<h2>Log in</h2>' +
        '<form id="meForm" novalidate>' +
          '<label for="mName">Your full name</label><input id="mName" maxlength="60" autocomplete="name" placeholder="First and last name">' +
          '<label for="mPin">Your PIN</label><input id="mPin" class="pin-input" inputmode="numeric" maxlength="4" type="password" autocomplete="off">' +
          '<div id="mErr" hidden></div>' +
          '<button class="btn block" style="margin-top:20px" type="submit">Log in</button>' +
        '</form>' +
        '<p class="small muted center" style="margin:16px 0 0">New here? <a href="#/join">Add your wishlist</a>. Forgot your PIN? Ask the organizer.</p>' +
      '</div>'
    );
    $('#meForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = e.target.querySelector('button');
      var p = { name: $('#mName').value, pin: $('#mPin').value };
      busy(btn, true, 'Checking…');
      API.call('me', p).then(function (d) {
        store('me', { name: d.name, pin: p.pin, wishes: d.wishes });
        meDashboard(d);
      }).catch(function (err) { busy(btn, false); showError('#mErr', err); });
    });
  }

  function meDashboard(d) {
    var test = !!d.testMode;
    if (!test) { var sess = store('me') || {}; store('me', { name: d.name, pin: sess.pin, wishes: d.wishes }); }
    var s = d.settings, html = '';
    if (test) html += '<div class="test-bar">Test mode: this is exactly what <b>' + esc(d.name) + '</b> sees' +
      (d.myMystery ? '. They\'re secretly #' + d.myMystery + ', ' + esc(d.myAlias) : '') + '. <a href="#/test">Back to everyone</a></div>';

    if (s.phase === 'signup') {
      html += '<div class="card center pop come-back"><h2>Hi, ' + esc(d.name.split(' ')[0]) + '</h2>' +
        '<p>' + comeBackLine(s.deadline) + '</p>' + countdownHTML(s.deadline) +
        (test ? '' : '<button class="btn" id="remindBtn">Remind me on my phone</button>') + '</div>';
    } else if (d.shoppingFor && !test && !store('opened-' + d.name)) {
      html += '<div class="ticket gate pop">' + KNIT.stockings(5) +
        '<div class="label">Names have been drawn</div>' +
        '<div class="gate-q">Want to see who you got?</div>' +
        '<button class="btn pink" id="openGift">Show me</button></div>';
      render(html);
      $('#openGift').onclick = function () {
        store('opened-' + d.name, 1);
        var t = $('.ticket'); t.classList.add('opening');
        setTimeout(function () { meDashboard(d); confetti(170); }, 650);
      };
      return;
    } else if (d.shoppingFor) {
      html += '<div class="ticket pop">' + KNIT.band({ fg: '#eca7c6', height: 34 }) +
        '<div class="label">You got</div>' +
        '<div class="knit-name">' + KNIT.text(d.shoppingFor.name || ('#' + d.shoppingFor.no)) + '</div>' +
        (d.shoppingFor.alias ? '<div class="alias">a.k.a. ' + esc(d.shoppingFor.alias) + '</div>' : '') +
        '<div class="sub">Mystery #' + d.shoppingFor.no + '. ' + peso(s.budget) + ' budget' + (s.partyDate ? ', bring it on ' + esc(s.partyDate) : '') + '</div></div>' +
        '<div class="card"><h3>Their wishlist</h3>' + wishListHTML(d.shoppingFor.wishes) +
        '<p class="small muted" style="margin:16px 0 0">Label the bag only "#' + d.shoppingFor.no + (d.shoppingFor.alias ? ' ' + esc(d.shoppingFor.alias) : '') + '". Never write ' + esc((d.shoppingFor.name || '').split(' ')[0] || 'their') + '\'s name, and keep it secret.</p></div>';
    }
    if (s.phase === 'revealed') {
      html += '<div class="card center"><h2>The reveal is on</h2>' +
        (d.myMystery ? '<p>You were #' + d.myMystery + (d.myAlias ? ', ' + esc(d.myAlias) : '') + '. Find bag #' + d.myMystery + ' and start trading.</p>' : '') +
        '<a class="btn" href="#/reveal">Watch the reveal</a></div>';
    }
    html += '<div class="card"><div class="row"><h3 style="margin:0">My wishlist</h3><span class="spacer"></span>' +
      (s.phase !== 'revealed' && !test && !s.editsClosed ? '<a class="btn secondary small" href="#/join">Edit</a>' : '') + '</div>' +
      '<div style="margin-top:6px">' + wishListHTML(d.wishes) + '</div></div>' +
      (test ? '' : '<p class="center"><button class="btn ghost small" id="logout" style="color:var(--cream)">Log out</button></p>');
    render(html);
    if (!test && d.shoppingFor && !store('seen-' + d.shoppingFor.no)) { confetti(120); store('seen-' + d.shoppingFor.no, 1); }
    if ($('#logout')) $('#logout').onclick = function () { store('me', null); meLogin(); };
    if ($('#remindBtn')) $('#remindBtn').onclick = function () { openRemind(s); };
  }

  function comeBackLine(deadline) {
    var t = Date.parse(deadline);
    if (isNaN(t)) return 'Come back after names are drawn to see who you got.';
    var days = Math.ceil((t - Date.now()) / 864e5);
    var when = days > 1 ? 'in ' + days + ' days' : days === 1 ? 'tomorrow' : 'soon';
    return 'Come back here ' + when + ', after ' + esc(fmtDeadline(deadline)) + ', to see who you got.';
  }

  // Calendar reminder: the most reliable way to make a phone ping later.
  function openRemind(s) {
    s = s || info || {};
    var t = Date.parse(s.deadline);
    if (isNaN(t)) return;
    var start = new Date(t + 5 * 6e4), end = new Date(t + 20 * 6e4);
    var z = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var url = location.href.split('#')[0] + '#/me';
    var title = 'See who you got! ' + (s.eventName || 'Mystery Kris Kringle');
    var details = 'Names have been drawn. Log in with your full name and PIN: ' + url;
    var g = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) +
      '&dates=' + z(start) + '/' + z(end) + '&details=' + encodeURIComponent(details);
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Favor//Kris Kringle//EN', 'BEGIN:VEVENT',
      'UID:kk-' + t + '@favor', 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(start), 'DTEND:' + z(end),
      'SUMMARY:' + title, 'DESCRIPTION:' + details, 'URL:' + url,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + title, 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var box = openModal(
      '<div class="center">' + KNIT.text('Psst', { cls: 'modal-knit' }) +
      '<h2 style="margin-top:12px">Don\'t want to forget?</h2>' +
      '<p class="remind-sub">Let us remind you.</p>' +
      '<p class="muted">Your phone will ping you ' + esc(fmtDeadline(s.deadline)) + ', when it\'s time to see who you got.</p>' +
      '<div style="display:grid;gap:10px">' +
        '<a class="btn" id="icsBtn" href="#">iPhone or other calendar</a>' +
        '<a class="btn secondary" href="' + esc(g) + '" target="_blank" rel="noopener">Google Calendar</a>' +
        '<button class="btn ghost" data-close>Not now</button>' +
      '</div></div>', true);
    $('#icsBtn', box).onclick = function (e) {
      e.preventDefault();
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      a.download = 'see-who-you-got.ics';
      document.body.appendChild(a); a.click(); a.remove();
    };
  }

  // =====================================================================
  // ORGANIZER
  // =====================================================================
  function adminPw() { return store('admin'); }

  function adminLogin(next) {
    render(
      '<div class="card" style="max-width:440px;margin:0 auto">' +
        '<h2>Organizer</h2>' +
        '<p class="muted">Enter the organizer password' + (API.demo ? ' (demo mode password: <b>demo</b>)' : ' from the Settings tab of your Google Sheet') + '.</p>' +
        '<form id="aForm"><label for="aPw">Password</label><input id="aPw" type="password" autocomplete="current-password">' +
        '<div id="aErr" hidden></div><button class="btn block" style="margin-top:16px">Unlock</button></form>' +
      '</div>'
    );
    $('#aForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = e.target.querySelector('button'), pw = $('#aPw').value;
      busy(btn, true);
      API.call('adminCheck', { password: pw }).then(function () { store('admin', pw); next(); })
        .catch(function (err) { busy(btn, false); showError('#aErr', err); });
    });
  }

  // ISO -> "YYYY-MM-DDTHH:MM" in Manila time, for the datetime-local input
  function toLocalInput(iso) {
    var t = Date.parse(iso); if (isNaN(t)) return '';
    return new Date(t + 8 * 36e5).toISOString().slice(0, 16);
  }
  var showSecrets = false;
  function viewOrganizer() {
    if (!adminPw()) return adminLogin(viewOrganizer);
    loading();
    API.call('adminList', { password: adminPw() }).then(renderOrganizer)
      .catch(function (e) { if (/password/i.test(e.message)) { store('admin', null); adminLogin(viewOrganizer); } else render('<div class="error">' + esc(e.message) + '</div>'); });
  }

  function renderOrganizer(d) {
    var s = d.settings, ps = d.players;
    $('#brandName').textContent = s.eventName;
    var siteUrl = location.href.split('#')[0];
    var phaseText = { signup: 'Sign-ups open', drawn: 'Names drawn', revealed: 'Revealed' }[s.phase];

    var actions = '';
    if (s.phase === 'signup') {
      actions = '<p class="muted">When everyone\'s in, draw names. Sign-ups close and everyone gets someone to shop for.</p>' +
        '<button class="btn" id="draw"' + (ps.length < 3 ? ' disabled' : '') + '>Draw names</button>';
    } else if (s.phase === 'drawn') {
      actions = '<p class="muted">Party day: put the party board on the TV. Once every gift is open, start the reveal.</p>' +
        '<div class="row"><a class="btn" href="#/board">Open party board</a><button class="btn secondary" id="revealOn">Start the reveal</button></div>' +
        '<p style="margin:14px 0 0"><button class="btn ghost small" id="reopen">Undo the draw and reopen sign-ups</button></p>';
    } else {
      actions = '<p class="muted">The reveal is live for everyone.</p>' +
        '<div class="row"><a class="btn" href="#/reveal">Open the reveal</a><button class="btn ghost small" id="revealOff">Hide the reveal</button></div>';
    }

    var rows = ps.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (p) {
      return '<tr><td><b>' + esc(p.name) + '</b><div class="wish-mini">' + p.wishes.length + ' gift ideas</div></td>' +
        '<td style="white-space:nowrap"><button class="btn ghost small" data-pin="' + esc(p.id) + '" data-name="' + esc(p.name) + '">Reset PIN</button>' +
        (s.phase === 'signup' ? '<button class="btn ghost small" data-rm="' + esc(p.id) + '" data-name="' + esc(p.name) + '">Remove</button>' : '') + '</td></tr>';
    }).join('');

    render(
      '<div class="page-head"><h1>Organizer</h1><span class="phase-pill">' + phaseText + '</span><span class="spacer"></span>' +
        '<a class="btn ghost small" href="#/test">Test mode &amp; guide</a><button class="btn ghost small" id="aOut">Lock</button></div>' +
      '<div class="stats">' +
        '<div class="stat"><div class="n">' + ps.length + '</div><div class="l">joined</div></div>' +
        '<div class="stat"><div class="n">' + peso(s.budget) + '</div><div class="l">budget</div></div>' +
        '<div class="stat"><div class="n" style="font-size:1.3rem">' + (s.deadline ? esc(fmtDeadline(s.deadline)) : 'Not set') + '</div><div class="l">wishlists due' + (s.editsClosed ? ' (closed)' : '') + '</div></div>' +
        '<div class="stat"><div class="n">' + (s.partyDate ? esc(s.partyDate) : 'Not set') + '</div><div class="l">party</div></div>' +
      '</div>' +
      '<div class="card"><h2>Next</h2>' + actions + '<div id="actErr" hidden></div></div>' +
      '<div class="card"><h3>People</h3>' +
        (ps.length ? '<div class="table-wrap"><table><tbody>' + rows + '</tbody></table></div>'
          : '<p class="muted">No one yet. Send the invite below.</p>') +
        (API.demo && s.phase === 'signup' ? '<button class="btn secondary small" id="seed" style="margin-top:12px">Add 8 sample people (demo)</button>' : '') +
      '</div>' +
      '<div class="card"><h3>Invite message</h3>' +
        '<textarea id="invite" rows="4">' + esc(s.eventName) + ': Mystery Kris Kringle 🎁\n' +
        'Add 3–5 gift ideas' + (s.deadline ? ' by ' + esc(fmtDeadline(s.deadline)) : '') + '. ' + peso(s.budget) + ' budget, all anonymous.\n' + esc(siteUrl) + '</textarea>' +
        '<button class="btn secondary small" id="copyInvite" style="margin-top:8px">Copy</button></div>' +
      '<details class="card"><summary>Event settings</summary>' +
        '<form id="setForm"><div class="grid2">' +
          '<div><label>Event name</label><input name="eventName" value="' + esc(s.eventName) + '"></div>' +
          '<div><label>Budget (₱)</label><input name="budget" type="number" min="0" value="' + esc(s.budget) + '"></div>' +
          '<div><label>Wishlist deadline <span class="hint">Manila time</span></label><input name="deadline" type="datetime-local" value="' + esc(toLocalInput(s.deadline)) + '"></div>' +
          '<div><label>Party date</label><input name="partyDate" placeholder="e.g. Dec 19" value="' + esc(s.partyDate) + '"></div>' +
        '</div><button class="btn small" style="margin-top:14px">Save settings</button><div id="setErr" hidden></div></form>' +
        (API.demo ? '<hr style="border:none;border-top:1px dashed #d4c4a4;margin:18px 0"><button class="btn ghost small" id="demoReset">Erase all demo data</button>' : '') +
      '</details>'
    );

    function act(op, payload, confirmMsg, btn) {
      if (confirmMsg && !confirm(confirmMsg)) return;
      busy(btn, true);
      payload = payload || {}; payload.password = adminPw();
      return API.call(op, payload).then(function (r) { viewOrganizer(); return r; })
        .catch(function (e) { busy(btn, false); showError('#actErr', e); });
    }
    var on = function (id, fn) { var el = document.getElementById(id); if (el) el.onclick = function () { fn(el); }; };
    on('aOut', function () { store('admin', null); location.hash = '#/'; });
    on('draw', function (b) { act('draw', {}, 'Draw names now? This closes sign-ups and gives everyone their Mystery Person.', b).then(function () { confetti(); }); });
    on('reopen', function (b) { act('reopen', {}, 'Reopen sign-ups? This ERASES the current draw — everyone will get a new Mystery Person when you draw again. Only do this if nobody has shopped yet.', b); });
    on('revealOn', function (b) { act('setPhase', { phase: 'revealed' }, 'Start the reveal? Everyone will be able to see who each Mystery Person was.', b); });
    on('revealOff', function (b) { act('setPhase', { phase: 'drawn' }, null, b); });
    on('seed', function () { API.demoSeed(); viewOrganizer(); });
    on('demoReset', function () { if (confirm('Erase all demo data?')) { API.demoReset(); store('me', null); viewOrganizer(); } });
    on('copyInvite', function (b) {
      var t = $('#invite'); t.select();
      (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).catch(function () { document.execCommand('copy'); });
      b.textContent = 'Copied ✓';
    });
    $$('[data-rm]').forEach(function (b) { b.onclick = function () { act('removePlayer', { id: b.dataset.rm }, 'Remove ' + b.dataset.name + ' from the game?', b); }; });
    $$('[data-pin]').forEach(function (b) {
      b.onclick = function () {
        var pin = prompt('New 4-digit PIN for ' + b.dataset.name + ':');
        if (pin == null) return;
        act('resetPin', { id: b.dataset.pin, pin: pin }, null, b).then(function (r) { if (r) alert('Done! Tell ' + b.dataset.name + ' their new PIN privately.'); });
      };
    });
    $('#setForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, btn = f.querySelector('button');
      busy(btn, true);
      API.call('saveSettings', { password: adminPw(), values: { eventName: f.eventName.value, budget: f.budget.value, deadline: f.deadline.value ? f.deadline.value + ':00+08:00' : '', partyDate: f.partyDate.value } })
        .then(viewOrganizer).catch(function (err) { busy(btn, false); showError('#setErr', err); });
    });
  }

  // =====================================================================
  // PARTY BOARD
  // =====================================================================
  function viewBoard() {
    app.classList.add('wide');
    if (adminPw()) return boardController();
    boardViewer();
  }

  function bagHTML(b, g, opts) {
    opts = opts || {};
    var locked = b.holder && b.steals >= g.maxSteals;
    var cls = 'bag' + (b.holder ? ' held' : '') + (locked ? ' locked' : '') + (opts.cls ? ' ' + opts.cls : '');
    var dots = '';
    for (var i = 0; i < g.maxSteals; i++) dots += '<i class="' + (i < b.steals ? 'on' : '') + '"></i>';
    return '<div class="' + cls + '" data-bag="' + b.no + '">' +
      (opts.badge ? '<span class="badge">' + opts.badge + '</span>' : '') +
      '<div class="ico">' + (b.holder ? '🎁' : '🛍️') + '</div>' +
      '<div class="no">#' + b.no + '</div>' +
      (b.alias ? '<div class="alias-sm">' + esc(b.alias) + '</div>' : '') +
      '<div class="who' + (b.holder ? '' : ' free') + '">' + (b.holder ? esc(b.holder) : 'On the table') + '</div>' +
      (g.maxSteals ? '<div class="steals" title="Times stolen">' + dots + '</div>' : '') +
      '</div>';
  }

  // ---- read-only board for phones ----
  function boardViewer() {
    var last = 0;
    function load() {
      API.call('board').then(function (d) {
        if (!d.game) {
          render('<div class="card center"><h2>The party board isn\'t ready yet</h2><p class="muted">It appears here once the organizer draws names.</p>' +
            '<a class="btn ghost small" href="#/organizer">Organizer? Unlock the controls</a></div>');
          return;
        }
        var g = d.game;
        if (g.updatedAt === last && app.querySelector('.bags')) return;
        last = g.updatedAt;
        var free = g.bags.filter(function (b) { return !b.holder; }).length;
        var ranked = Object.keys(g.scores).filter(function (n) { return g.scores[n] > 0; })
          .sort(function (a, b) { return g.scores[b] - g.scores[a]; });
        render(
          '<div class="board-head"><h1>Party board</h1><span class="phase-pill">' + free + ' on the table</span><span class="spacer"></span>' +
            '<a class="btn ghost small" href="#/organizer">Organizer</a></div>' +
          '<div class="board"><div><div class="bags">' + g.bags.map(function (b) { return bagHTML(b, g); }).join('') + '</div></div>' +
          '<div>' +
            (g.question ? '<div class="trivia-card"><div class="qn">Question ' + g.question.n + ' of ' + g.question.total + '</div>' +
              '<div class="q">' + esc(g.question.q) + '</div>' + (g.question.a ? '<div class="a">' + esc(g.question.a) + '</div>' : '') + '</div>' : '') +
            '<div class="card"><h3>Scores · first to ' + g.target + '</h3>' +
              (ranked.length ? '<div class="scores">' + ranked.map(function (n) {
                return '<div class="score"><span class="nm">' + esc(n) + '</span><span class="pips">' + pips(g.scores[n], g.target) + '</span><span></span></div>';
              }).join('') + '</div>' : '<p class="muted">No points yet this round.</p>') + '</div>' +
            (g.log.length ? '<div class="card"><h3>What\'s happened</h3><ul class="log">' + g.log.slice().reverse().map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul></div>' : '') +
          '</div></div>'
        );
      }).catch(function (e) { render('<div class="error">' + esc(e.message) + '</div>'); });
    }
    loading(); load(); every(4000, load);
  }

  function pips(n, target) {
    var h = '';
    for (var i = 0; i < target; i++) h += '<i class="' + (i < n ? 'on' : '') + '"></i>';
    return h;
  }

  // ---- organizer's controller (big screen) ----
  function boardController() {
    loading();
    API.call('gameLoad', { password: adminPw() }).then(function (d) {
      if (!d.game) {
        render('<div class="card center"><h2>Draw names first</h2><p class="muted">The party board is set up automatically when you draw names.</p><a class="btn" href="#/organizer">Go to organizer</a></div>');
        return;
      }
      var G = d.game, trivia = d.trivia, names = d.names;
      var wishes = {}; d.wishesByBag.forEach(function (x) { wishes[x.no] = x.wishes; });
      var history = [];
      var saveTimer = 0, saveState = 'saved';

      function snapshot() { history.push(JSON.stringify(G)); if (history.length > 60) history.shift(); }
      function save() {
        saveState = 'saving'; updateSaveBadge();
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
          API.call('gameSave', { password: adminPw(), game: G })
            .then(function () { saveState = 'saved'; updateSaveBadge(); })
            .catch(function () { saveState = 'error'; updateSaveBadge(); });
        }, 500);
      }
      function updateSaveBadge() {
        var el = $('#saveBadge'); if (!el) return;
        el.textContent = { saved: '✓ Saved', saving: 'Saving…', error: '⚠ Not saved — check connection' }[saveState];
        el.style.color = saveState === 'error' ? 'var(--berry)' : '';
      }
      function change(fn) { snapshot(); fn(); save(); draw(); }
      function holderOf(name) { for (var i = 0; i < G.bags.length; i++) if (G.bags[i].holder === name) return G.bags[i]; return null; }
      function isLocked(b) { return b.holder && b.steals >= G.maxSteals; }
      function inPlay() { return names.filter(function (n) { return !(G.holdersSitOut && holderOf(n)); }); }
      function log(t) { G.log = G.log || []; G.log.push(t); }

      function pick(name, no) {
        change(function () {
          var bag = G.bags[no - 1], prev = bag.holder, mine = holderOf(name);
          if (prev) {
            bag.steals++;
            if (mine) { mine.holder = prev; log(name + ' swapped bag #' + mine.no + ' for #' + no + ' (stolen from ' + prev + ')'); }
            else log(name + ' stole bag #' + no + ' from ' + prev + (G.holdersSitOut ? ' — ' + prev + ' is back in the game!' : ''));
          } else {
            if (mine) { mine.holder = ''; log(name + ' traded bag #' + mine.no + ' back for #' + no); }
            else log(name + ' picked bag #' + no);
          }
          bag.holder = name;
          if (G.resetEachRound) G.scores = {}; else G.scores[name] = 0;
        });
        closeModal();
        confetti(prevWasSteal(no) ? 160 : 100);
      }
      function prevWasSteal(no) { return G.bags[no - 1].steals > 0; }

      function openPick(name) {
        var mine = holderOf(name);
        var options = G.bags.map(function (b) {
          if (b.holder === name) return bagHTML(b, G, { cls: 'disabled', badge: 'Yours' });
          if (!b.holder) return bagHTML(b, G, { cls: 'clickable pick-free', badge: 'Take' });
          if (isLocked(b)) return bagHTML(b, G, { cls: 'disabled', badge: 'Locked' });
          return bagHTML(b, G, { cls: 'clickable pick-steal', badge: 'Steal' });
        }).join('');
        var box = openModal(
          '<div class="center"><div style="font-size:2.6rem">🎉</div><h2>' + esc(name) + ' gets to pick!</h2>' +
          '<p class="muted">Take a bag from the table, or steal one from someone. A bag gets locked 🔒 after it\'s been stolen ' + G.maxSteals + ' time' + (G.maxSteals === 1 ? '' : 's') + '.' +
          (mine ? ' ' + esc(name) + ' already holds #' + mine.no + (G.holdersSitOut ? '' : ' — it goes back to the table (or to the person they steal from).') : '') + '</p></div>' +
          '<div class="bags" style="margin-top:14px">' + options + '</div>' +
          '<div class="row" style="margin-top:18px"><span class="spacer"></span><button class="btn ghost" data-close>Cancel</button></div>'
        );
        $$('.bag.clickable', box).forEach(function (el) { el.onclick = function () { pick(name, Number(el.dataset.bag)); }; });
      }

      function openBag(no) {
        var b = G.bags[no - 1];
        var opts = '<option value="">— On the table —</option>' + names.map(function (n) {
          return '<option' + (n === b.holder ? ' selected' : '') + '>' + esc(n) + '</option>';
        }).join('');
        var box = openModal(
          '<h2>Bag #' + no + (b.alias ? ' · ' + esc(b.alias) : '') + '</h2>' +
          '<p class="muted">Wishlist of Mystery #' + no + ' (no names shown — safe for the big screen):</p>' +
          wishListHTML(wishes[no]) +
          '<details style="margin-top:18px"><summary>Fix who holds this bag</summary>' +
            '<label>Holder</label><select id="fixHolder">' + opts + '</select>' +
            '<label>Times stolen</label><input id="fixSteals" type="number" min="0" value="' + b.steals + '">' +
            '<button class="btn small" id="fixSave" style="margin-top:12px">Save</button></details>' +
          '<div class="row" style="margin-top:18px"><span class="spacer"></span><button class="btn ghost" data-close>Close</button></div>', true);
        $('#fixSave', box).onclick = function () {
          var h = $('#fixHolder', box).value;
          change(function () {
            if (h) G.bags.forEach(function (x) { if (x.holder === h && G.holdersSitOut) x.holder = ''; });
            b.holder = h; b.steals = Math.max(0, parseInt($('#fixSteals', box).value, 10) || 0);
            log('Organizer set bag #' + no + ' → ' + (h || 'table'));
          });
          closeModal();
        };
      }

      function openSettings() {
        var box = openModal(
          '<h2>Game rules</h2>' +
          '<label>Correct answers needed to pick a bag</label><input id="rTarget" type="number" min="1" max="10" value="' + G.target + '">' +
          '<label>Max steals per bag <span class="hint">(then it\'s locked)</span></label><input id="rSteals" type="number" min="0" max="10" value="' + G.maxSteals + '">' +
          '<label style="font-weight:500"><input type="checkbox" id="rSit"' + (G.holdersSitOut ? ' checked' : '') + '> People holding a bag sit out of trivia (back in if robbed)</label>' +
          '<label style="font-weight:500"><input type="checkbox" id="rReset"' + (G.resetEachRound ? ' checked' : '') + '> Reset everyone\'s score after each pick</label>' +
          '<div class="row" style="margin-top:20px"><button class="btn ghost small" id="rClear">Clear all bags &amp; scores</button><span class="spacer"></span>' +
          '<button class="btn ghost" data-close>Cancel</button><button class="btn" id="rSave">Save</button></div>', true);
        $('#rSave', box).onclick = function () {
          change(function () {
            G.target = Math.max(1, parseInt($('#rTarget', box).value, 10) || 3);
            G.maxSteals = Math.max(0, parseInt($('#rSteals', box).value, 10) || 0);
            G.holdersSitOut = $('#rSit', box).checked;
            G.resetEachRound = $('#rReset', box).checked;
          });
          closeModal();
        };
        $('#rClear', box).onclick = function () {
          if (!confirm('Put every bag back on the table and clear all scores?')) return;
          change(function () { G.bags.forEach(function (b) { b.holder = ''; b.steals = 0; }); G.scores = {}; G.log = []; });
          closeModal();
        };
      }

      function draw() {
        var free = G.bags.filter(function (b) { return !b.holder; });
        var playing = inPlay();
        var waiting = names.filter(function (n) { return !holderOf(n); });
        var top = Math.max.apply(null, [0].concat(playing.map(function (n) { return G.scores[n] || 0; })));
        var q = trivia[G.qIndex];
        var lastBag = free.length === 1 && waiting.length === 1;

        render(
          '<div class="board-head"><h1>Party board</h1><span class="phase-pill">' + free.length + ' on the table</span>' +
            '<span class="small muted" id="saveBadge"></span><span class="spacer"></span>' +
            '<button class="btn ghost small" id="undo"' + (history.length ? '' : ' disabled') + '>↶ Undo</button>' +
            '<button class="btn ghost small" id="rules">⚙ Rules</button>' +
            '<a class="btn secondary small" href="#/reveal">Reveal →</a></div>' +
          (lastBag ? '<div class="notice row"><span>Only one bag left and one person without a bag.</span><span class="spacer"></span><button class="btn small" id="lastBag">Give bag #' + free[0].no + ' to ' + esc(waiting[0]) + '</button></div>' : '') +
          (!free.length ? '<div class="notice">🎉 Every bag has a home! Time to open them all together — then start the reveal.</div>' : '') +
          '<div class="board">' +
            '<div><div class="bags">' + G.bags.map(function (b) { return bagHTML(b, G, { cls: 'clickable' }); }).join('') + '</div>' +
              '<p class="small muted" style="margin-top:10px">Tap a bag to see its wishlist or fix who holds it.</p></div>' +
            '<div>' +
              '<div class="trivia-card">' +
                (q ? '<div class="qn">Question ' + (G.qIndex + 1) + ' of ' + trivia.length + '</div><div class="q">' + esc(q.q) + '</div>' +
                  (G.showAnswer ? '<div class="a">' + esc(q.a) + '</div>' : '') : '<div class="q">Out of questions! Add more in the Trivia tab.</div>') +
                '<div class="row" style="margin-top:14px">' +
                  '<button class="btn secondary small" id="qPrev"' + (G.qIndex ? '' : ' disabled') + '>←</button>' +
                  (q ? '<button class="btn gold small" id="qAns">' + (G.showAnswer ? 'Hide answer' : 'Show answer') + '</button>' : '') +
                  '<span class="spacer"></span><button class="btn small" id="qNext"' + (G.qIndex < trivia.length - 1 ? '' : ' disabled') + '>Next question →</button>' +
                '</div></div>' +
              '<div class="card"><h3>Scores · first to ' + G.target + ' picks a bag</h3>' +
                '<div class="scores">' + (playing.length ? playing.map(function (n) {
                  var sc = G.scores[n] || 0;
                  return '<div class="score' + (sc && sc === top ? ' leading' : '') + '"><span class="nm">' + esc(n) + '</span>' +
                    '<span class="pips">' + pips(sc, G.target) + '</span>' +
                    '<span class="btns"><button class="iconbtn" data-minus="' + esc(n) + '" aria-label="Minus one for ' + esc(n) + '">−</button>' +
                    '<button class="iconbtn plus" data-plus="' + esc(n) + '" aria-label="Plus one for ' + esc(n) + '">+</button></span></div>';
                }).join('') : '<p class="muted">Everyone has a bag!</p>') + '</div>' +
                (G.holdersSitOut && names.length - playing.length ? '<p class="small muted" style="margin:14px 0 0">Holding a bag:</p><div class="holders">' +
                  names.filter(function (n) { return holderOf(n); }).map(function (n) { return '<span>' + esc(n) + ' · #' + holderOf(n).no + '</span>'; }).join('') + '</div>' : '') +
                '<button class="btn ghost small" id="manualPick" style="margin-top:12px">Let someone pick without trivia…</button>' +
              '</div>' +
              ((G.log || []).length ? '<div class="card"><h3>What\'s happened</h3><ul class="log">' + G.log.slice(-8).reverse().map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul></div>' : '') +
            '</div>' +
          '</div>'
        );
        updateSaveBadge();

        $$('[data-plus]').forEach(function (b) {
          b.onclick = function () {
            var n = b.dataset.plus;
            change(function () { G.scores[n] = (G.scores[n] || 0) + 1; });
            if ((G.scores[n] || 0) >= G.target) setTimeout(function () { openPick(n); }, 250);
          };
        });
        $$('[data-minus]').forEach(function (b) {
          b.onclick = function () { var n = b.dataset.minus; if (G.scores[n]) change(function () { G.scores[n]--; }); };
        });
        $$('.board .bag').forEach(function (el) { el.onclick = function () { openBag(Number(el.dataset.bag)); }; });
        $('#qNext').onclick = function () { change(function () { G.qIndex++; G.showAnswer = false; }); };
        $('#qPrev').onclick = function () { change(function () { G.qIndex = Math.max(0, G.qIndex - 1); G.showAnswer = false; }); };
        if ($('#qAns')) $('#qAns').onclick = function () { change(function () { G.showAnswer = !G.showAnswer; }); };
        $('#undo').onclick = function () { if (history.length) { G = JSON.parse(history.pop()); save(); draw(); } };
        $('#rules').onclick = openSettings;
        if ($('#lastBag')) $('#lastBag').onclick = function () { pick(waiting[0], free[0].no); };
        $('#manualPick').onclick = function () {
          var box = openModal('<h2>Who gets to pick?</h2><select id="mp">' + names.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('') + '</select>' +
            '<div class="row" style="margin-top:16px"><span class="spacer"></span><button class="btn ghost" data-close>Cancel</button><button class="btn" id="mpGo">Choose a bag</button></div>', true);
          $('#mpGo', box).onclick = function () { openPick($('#mp', box).value); };
        };
      }
      draw();
    }).catch(function (e) {
      if (/password/i.test(e.message)) { store('admin', null); boardViewer(); }
      else render('<div class="error">' + esc(e.message) + '</div>');
    });
  }

  // =====================================================================
  // REVEAL
  // =====================================================================
  function viewReveal() {
    app.classList.add('wide');
    loading();
    function waiting() {
      render('<div class="reveal-stage"><div style="font-size:4rem">🤫</div><h1>No peeking!</h1>' +
        '<p class="muted">The reveal starts after everyone opens their gifts. This page will update by itself.</p></div>');
    }
    function tryLoad() {
      return API.call('reveal').then(function (d) { timers.forEach(clearInterval); timers = []; stage(d); return true; })
        .catch(function (e) { if (/peek/i.test(e.message)) { if (!$('.reveal-stage')) waiting(); return false; } render('<div class="error">' + esc(e.message) + '</div>'); return true; });
    }
    tryLoad().then(function (done) { if (!done) every(5000, tryLoad); });
  }

  function stage(d) {
    var list = d.list, idx = -1, flipped = false;
    var banner = d.preview ? '<div class="test-bar">🧪 <b>Private preview</b> — only you can see this. The real reveal stays locked until you start it. <a href="#/test">Exit preview</a></div>' : '';
    var render = function (html) { app.innerHTML = banner + html; };
    function show() {
      if (idx < 0) {
        render('<div class="reveal-stage poster">' + BURST + SPARK('s1') + SPARK('s2') +
          '<h1 class="poster-type"><span class="script">Who was</span><span class="big">Who?</span></h1>' +
          '<p class="poster-sub">' + list.length + ' Mystery People</p>' +
          '<div class="poster-cta" style="margin-top:18px"><button class="btn cream block" id="go">Start the reveal</button><button class="btn ghost" id="all">Show everyone</button></div></div>');
        $('#go').onclick = next; $('#all').onclick = summary;
        return;
      }
      if (idx >= list.length) return summary();
      var r = list[idx];
      var dots = list.map(function (_, i) { return '<i class="' + (i <= idx ? 'on' : '') + '"></i>'; }).join('');
      render('<div class="reveal-stage">' +
        '<div class="dots">' + dots + '</div>' +
        '<div class="flip' + (flipped ? ' flipped' : '') + '" id="card"><div class="flip-inner">' +
          '<div class="face front">' + KNIT.band({ fg: '#eca7c6', height: 30 }) + '<div class="lbl">' + KNIT.text('#' + r.no) + '</div><div class="num">' + esc(r.alias || ('Mystery Person #' + r.no)) + '</div><div class="q-mark">?</div>' +
            '<div class="small" style="color:var(--cream);opacity:.7;margin-top:18px">Tap to reveal</div></div>' +
          '<div class="face back"><div class="was">#' + r.no + ' ' + esc(r.alias) + ' was…</div><div class="name">' + esc(r.name) + '</div>' +
            '<div class="meta">' + (r.giver ? '<span>🎅 Gift from <b>' + esc(r.giver) + '</b></span>' : '') +
            (r.holder ? '<span>🎁 Bag is with <b>' + esc(r.holder) + '</b></span>' : '') + '</div>' +
            wishListHTML(r.wishes) + '</div>' +
        '</div></div>' +
        '<div class="row" style="justify-content:center"><button class="btn ghost" id="prev">← Back</button>' +
          '<button class="btn cream" id="next">' + (flipped ? (idx === list.length - 1 ? 'See everyone' : 'Next') : 'Reveal') + '</button></div>' +
        '<p class="small muted">Space bar to continue</p></div>');
      $('#card').onclick = next; $('#next').onclick = next; $('#prev').onclick = prev;
    }
    function next() {
      if (idx >= 0 && idx < list.length && !flipped) {
        flipped = true; $('#card').classList.add('flipped');
        setTimeout(function () { confetti(150); }, 450);
        var b = $('#next'); b.textContent = idx === list.length - 1 ? 'See everyone' : 'Next'; b.classList.add('cream');
        return;
      }
      idx++; flipped = false; show();
    }
    function prev() { if (flipped) { flipped = false; show(); } else if (idx >= 0) { idx--; flipped = idx >= 0; show(); } }
    function summary() {
      idx = list.length;
      render('<div class="reveal-stage" style="justify-content:flex-start">' +
        '<h1 class="poster-type" style="margin-bottom:6px"><span class="script">Merry</span><span class="big">Christmas</span></h1><p class="muted" style="margin-bottom:24px">Now find your own wishlist and start trading.</p>' +
        '<div class="summary">' + list.map(function (r) {
          return '<div class="s"><div class="small muted">#' + r.no + ' ' + esc(r.alias) + '</div><div class="t">' + esc(r.name) + '</div>' +
            '<div class="small muted">' + (r.giver ? 'Gift from ' + esc(r.giver) : '') + (r.holder ? ' · Bag with ' + esc(r.holder) : '') + '</div>' +
            '<div class="small" style="margin-top:6px">' + r.wishes.map(function (w) { return esc(w.item); }).join(' · ') + '</div></div>';
        }).join('') + '</div>' +
        '<div class="row" style="margin-top:20px;justify-content:center"><button class="btn ghost" id="again">Start over</button></div></div>');
      confetti(220);
      $('#again').onclick = function () { idx = -1; flipped = false; show(); };
    }
    keyHandler = function (e) {
      if (!modal.hidden || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); if (idx < list.length) next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    show();
  }
  var keyHandler = null;
  document.addEventListener('keydown', function (e) { if (keyHandler) keyHandler(e); });

  // =====================================================================
  // TEST MODE (organizer only): see everyone, open anyone's page
  // =====================================================================
  function GUIDE(s) {
    var b = peso(s.budget);
    return '<div class="guide-grid guide">' +
      '<div class="card"><h3>The game</h3><ol>' +
        '<li>Everyone adds 3–5 gift ideas around ' + b + ', using their full name and a 4-digit PIN.</li>' +
        '<li>When the countdown ends' + (s.deadline ? ' (' + esc(fmtDeadline(s.deadline)) + ')' : '') + ', wishlists lock and names are drawn automatically. Each person gets a number and a funny animal name, plus someone to shop for.</li>' +
        '<li>People log in, tap "Show me", and see who they got: the real name, animal name and wishlist. Nobody sees their own number.</li>' +
        '<li>Each gift goes in a bag labeled with the number and animal name only, never a real name.</li>' +
        '<li>At the party, every bag goes on one table and people win bags with trivia.</li>' +
        '<li>Everyone opens together, the reveal shows who each Mystery Person was, then people trade to get their own wishlist.</li>' +
      '</ol></div>' +
      '<div class="card"><h3>Party day rules</h3><ul>' +
        '<li>Read a question from the party board. Tap + for whoever answers first.</li>' +
        '<li>First to 3 correct picks a bag from the table, or steals someone else\'s.</li>' +
        '<li>A bag locks after it\'s been stolen twice.</li>' +
        '<li>Holding a bag means you sit out of trivia. If yours is stolen, you\'re back in.</li>' +
        '<li>Scores reset after every pick. Undo fixes any mis-tap.</li>' +
        '<li>Change any of this in the board\'s Rules button.</li>' +
      '</ul></div>' +
      '<div class="card"><h3>Your checklist</h3><ol>' +
        '<li>Send the invite from the Organizer page.</li>' +
        '<li>Names draw themselves at the deadline. Want it earlier? Press Draw names.</li>' +
        '<li>Remind everyone to log in and see who they\'re shopping for.</li>' +
        '<li>Party day: open the party board on the TV and log in.</li>' +
        '<li>When every bag has a home and is opened, press Start the reveal and put the reveal on the TV. Space bar flips each card.</li>' +
      '</ol></div>' +
      '<div class="card"><h3>Good to know</h3><ul>' +
        '<li>Forgotten PIN: Organizer page, Reset PIN, then tell them privately.</li>' +
        '<li>Late joiner: set a later deadline, undo the draw, add them, then draw again. Only before anyone has shopped.</li>' +
        '<li>Reminders: after joining, people can add the draw time to their phone calendar.</li>' +
        '<li>Everything is saved in your Google Sheet. Don\'t share the Sheet; it shows who\'s who.</li>' +
        '<li>Edit trivia questions in the Sheet\'s Trivia tab.</li>' +
        '<li>Use Open as below to check what any person sees.</li>' +
      '</ul></div>' +
    '</div>';
  }

  function viewTest() {
    app.classList.add('wide');
    if (!adminPw()) return adminLogin(viewTest);
    var parts = location.hash.split('/');
    if (parts[2] === 'as' && parts[3]) {
      loading();
      return API.call('viewAs', { password: adminPw(), id: decodeURIComponent(parts[3]) }).then(function (d) {
        app.classList.remove('wide'); meDashboard(d);
      }).catch(function (e) { render('<div class="error">' + esc(e.message) + '</div>'); });
    }
    loading();
    API.call('adminList', { password: adminPw() }).then(function (d) {
      var ps = d.players, s = d.settings;
      var byNo = {}; ps.forEach(function (p) { if (p.mystery) byNo[p.mystery] = p; });
      var drawn = ps.some(function (p) { return p.mystery; });
      var cards = ps.slice().sort(function (a, b) { return (a.mystery || 999) - (b.mystery || 999) || a.name.localeCompare(b.name); }).map(function (p) {
        var t = p.shopsFor ? byNo[p.shopsFor] : null;
        return '<div class="tcard">' +
          '<div class="row"><div><div class="t-name">' + esc(p.name) + '</div>' +
            (p.mystery ? '<div class="t-alias">#' + p.mystery + ' · ' + esc(p.alias) + '</div>' : '<div class="t-alias muted">Not drawn yet</div>') + '</div>' +
            '<span class="spacer"></span><a class="btn small" href="#/test/as/' + encodeURIComponent(p.id) + '">Open as ' + esc(p.name.split(' ')[0]) + '</a></div>' +
          (t ? '<div class="t-shop">🎅 Shopping for <b>#' + t.mystery + ' ' + esc(t.alias) + '</b> (' + esc(t.name) + ')</div>' : '') +
          '<div class="wish-mini" style="margin-top:8px">' + p.wishes.map(function (w) { return esc(w.item); }).join(' · ') + '</div>' +
        '</div>';
      }).join('');
      render(
        '<div class="test-bar">Test mode shows every secret. Keep it off the projector.</div>' +
        '<div class="page-head"><h1>Test mode</h1><span class="spacer"></span>' +
          '<a class="btn ghost small" href="#/organizer">Organizer</a>' +
          (drawn ? '<button class="btn ghost small" id="preview">Preview the reveal</button>' : '') +
          '<a class="btn ghost small" href="#/board">Party board</a></div>' +
        GUIDE(s) +
        '<div class="page-head" style="margin-top:28px"><h2 style="margin:0">Everyone</h2></div>' +
        (drawn ? '' : '<div class="notice">Names haven\'t been drawn yet, so nobody has a Mystery # or animal name. Draw names on the Organizer page to see the full picture.</div>') +
        (API.demo && !ps.length ? '<div class="notice">No one here yet — add sample people from the Organizer page.</div>' : '') +
        '<div class="tgrid">' + cards + '</div>'
      );
      if ($('#preview')) $('#preview').onclick = function () {
        var list = ps.filter(function (p) { return p.mystery; }).map(function (p) {
          var giver = ps.filter(function (x) { return x.shopsFor === p.mystery; })[0];
          return { no: p.mystery, alias: p.alias, name: p.name, giver: giver ? giver.name : '', wishes: p.wishes, holder: '' };
        }).sort(function (a, b) { return a.no - b.no; });
        stage({ list: list, preview: true });
      };
    }).catch(function (e) { if (/password/i.test(e.message)) { store('admin', null); adminLogin(viewTest); } else render('<div class="error">' + esc(e.message) + '</div>'); });
  }

  // =====================================================================
  // ROUTER
  // =====================================================================
  var routes = { '': viewHome, join: viewJoin, me: viewMe, organizer: viewOrganizer, board: viewBoard, reveal: viewReveal, test: viewTest };
  function route() {
    timers.forEach(clearInterval); timers = [];
    keyHandler = null; closeModal();
    var name = (location.hash.replace(/^#\/?/, '').split('/')[0] || '');
    var fn = routes[name] || viewHome;
    app.classList.remove('wide');
    if (name === 'organizer') app.classList.add('wide');
    $$('.nav a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#/' + name); });
    window.scrollTo(0, 0);
    fn();
  }
  addEventListener('hashchange', route);

  if (API.demo) {
    var bar = $('#demoBar');
    bar.hidden = false;
    bar.innerHTML = 'Demo mode. Organizer password: <b>demo</b>';
  }
  var fb = document.getElementById('footBand');
  if (fb) fb.innerHTML = KNIT.band({ fg: '#f2e8d4', alt: '#eca7c6', height: 44 });
  route();
})();
