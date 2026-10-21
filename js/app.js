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
  function render(html) { app.innerHTML = html; app.focus({ preventScroll: true }); }
  function loading() { render('<div class="spinner"></div>'); }
  function peso(n) { return '₱' + Number(n || 0).toLocaleString('en-PH'); }
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
    var colors = ['#c8243c', '#e8b64c', '#15513d', '#ffffff', '#f6e2ae'];
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
  // HOME
  // =====================================================================
  function viewHome() {
    loading();
    loadInfo().then(function (d) {
      var phaseLine = d.phase === 'signup'
        ? '<a class="btn block" href="#/join">Join &amp; add my wishlist</a><a class="btn secondary block" href="#/me">I already joined — check my status</a>'
        : d.phase === 'drawn'
          ? '<a class="btn block" href="#/me">See who I\'m shopping for</a><a class="btn secondary block" href="#/join">Edit my wishlist</a>'
          : '<a class="btn gold block" href="#/reveal">See the big reveal ✨</a><a class="btn secondary block" href="#/me">My page</a>';
      render(
        '<section class="hero">' +
          '<span class="kicker">Christmas party · gift game</span>' +
          '<h1>Who is <em>Mystery&nbsp;Person</em>&nbsp;#?</h1>' +
          '<p>Write down what you\'d love to get. Someone will secretly shop for you — and nobody knows whose bag is whose until the very end.</p>' +
          '<div class="chips">' +
            '<span class="chip">Budget <b>' + peso(d.budget) + '</b></span>' +
            (d.deadline ? '<span class="chip">Wishlists by <b>' + esc(d.deadline) + '</b></span>' : '') +
            (d.partyDate ? '<span class="chip">Party <b>' + esc(d.partyDate) + '</b></span>' : '') +
            '<span class="chip"><b>' + d.count + '</b> joined</span>' +
          '</div>' +
          '<div class="cta">' + phaseLine + '</div>' +
        '</section>' +
        '<div class="card" style="margin-top:30px">' +
          '<h2>How it works</h2>' +
          '<ol class="steps">' +
            '<li><div><b>Make your wishlist</b><p>Sign up with your name, a 4-digit PIN, and 3–5 gifts you\'d actually want (under ' + peso(d.budget) + ').</p></div></li>' +
            '<li><div><b>Get your Mystery Person</b><p>After the draw, log in to see the wishlist of the Mystery Person # you\'re shopping for. You won\'t know who they are — and nobody knows your number either.</p></div></li>' +
            '<li><div><b>Bag it &amp; label it</b><p>Put their gift in a bag and label it only with their number, e.g. "Mystery Person #4". No names!</p></div></li>' +
            '<li><div><b>Play for the bags</b><p>At the party, all bags go on one table. First to answer 3 trivia questions right picks a bag — or steals one.</p></div></li>' +
            '<li><div><b>Open, reveal, trade</b><p>Everyone opens together, then the big screen reveals who each Mystery Person was. Trade your way back to your wishlist!</p></div></li>' +
          '</ol>' +
        '</div>'
      );
    }).catch(function (e) { render('<div class="error">' + esc(e.message) + '</div>'); });
  }

  // =====================================================================
  // JOIN / EDIT WISHLIST
  // =====================================================================
  function viewJoin() {
    var sess = store('me');
    var prefill = (sess && sess.wishes) || [];
    loading();
    loadInfo().then(function (d) {
      var editing = !!(sess && sess.wishes);
      if (d.phase === 'revealed') { render('<div class="card center"><h2>The party is over 🎄</h2><p class="muted">Wishlists are locked now.</p><a class="btn" href="#/reveal">See the reveal</a></div>'); return; }
      if (d.phase === 'drawn' && !editing) {
        render('<div class="card"><h2>Sign-ups are closed</h2><p class="muted">Names have already been drawn. If you\'re already in, log in to edit your wishlist. If you missed it, message the organizer — they can reopen sign-ups.</p><a class="btn" href="#/me">Log in</a></div>');
        return;
      }
      var rows = '';
      for (var i = 0; i < 5; i++) {
        var w = prefill[i] || {};
        rows += '<div class="wish-row"><span class="num">' + (i + 1) + '</span><div class="fields">' +
          '<input name="item" maxlength="140" placeholder="' + (i < 3 ? 'Gift idea (required)' : 'Gift idea (optional)') + '" value="' + esc(w.item) + '">' +
          '<input name="link" class="link-input" type="url" inputmode="url" placeholder="Shopee / Lazada link (optional)" value="' + esc(w.link) + '">' +
          '</div></div>';
      }
      render(
        '<div class="card">' +
          '<h2>' + (editing ? 'Edit my wishlist' : 'Join the game') + '</h2>' +
          '<p class="muted">Only the organizer sees your name next to your wishlist. Your Secret Santa only sees a Mystery Person number.</p>' +
          '<form id="joinForm" novalidate>' +
            '<label for="jName">Your name <span class="hint">— the name people at the party know you by</span></label>' +
            '<input id="jName" name="name" maxlength="60" autocomplete="name" value="' + esc(sess ? sess.name : '') + '"' + (editing ? ' readonly' : '') + '>' +
            '<label for="jPin">4-digit PIN <span class="hint">— you\'ll need this to see who you\'re shopping for. Don\'t forget it!</span></label>' +
            '<input id="jPin" name="pin" class="pin-input" inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" type="password" value="' + esc(sess ? sess.pin : '') + '">' +
            '<label>Your wishlist <span class="hint">— 3 to 5 things, each around ' + peso(d.budget) + ' or less. Be specific (color, size, brand)!</span></label>' +
            rows +
            '<div id="jErr" hidden></div>' +
            '<button class="btn block" style="margin-top:16px" type="submit">' + (editing ? 'Save my wishlist' : 'Join the game 🎁') + '</button>' +
          '</form>' +
        '</div>'
      );
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
          render(
            '<div class="card center pop">' +
              '<div style="font-size:3.4rem">🎁</div>' +
              '<h2>' + (r.updated ? 'Wishlist saved!' : 'You\'re in, ' + esc(r.name) + '!') + '</h2>' +
              '<p class="muted">' + (info && info.phase === 'drawn'
                ? 'Your Secret Santa will see your updated list.'
                : 'Once the organizer draws names, come back and log in with your name and PIN to see which Mystery Person you\'re shopping for.') + '</p>' +
              '<div class="cta"><a class="btn" href="#/me">Go to my page</a><a class="btn ghost" href="#/">Back home</a></div>' +
            '</div>'
          );
        }).catch(function (err) { busy(btn, false); showError('#jErr', err); });
      });
    }).catch(function (e) { render('<div class="error">' + esc(e.message) + '</div>'); });
  }

  // =====================================================================
  // MY MYSTERY (log in with name + PIN)
  // =====================================================================
  function viewMe() {
    var sess = store('me');
    if (!sess || !sess.pin) return meLogin();
    loading();
    API.call('me', { name: sess.name, pin: sess.pin }).then(meDashboard).catch(function () { store('me', null); meLogin(); });
  }

  function meLogin() {
    render(
      '<div class="card">' +
        '<h2>My Mystery</h2>' +
        '<p class="muted">Log in with the name and PIN you used when you joined.</p>' +
        '<form id="meForm" novalidate>' +
          '<label for="mName">Your name</label><input id="mName" maxlength="60" autocomplete="name">' +
          '<label for="mPin">4-digit PIN</label><input id="mPin" class="pin-input" inputmode="numeric" maxlength="4" type="password" autocomplete="off">' +
          '<div id="mErr" hidden></div>' +
          '<button class="btn block" style="margin-top:16px" type="submit">Log in</button>' +
        '</form>' +
        '<p class="small muted center" style="margin-top:16px">Not signed up yet? <a href="#/join">Join here</a>. Forgot your PIN? Ask the organizer to reset it.</p>' +
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
    var sess = store('me') || {};
    store('me', { name: d.name, pin: sess.pin, wishes: d.wishes });
    var s = d.settings, html = '';
    html += '<div class="row" style="margin-bottom:14px"><h2 style="margin:0">Hi, ' + esc(d.name) + ' 👋</h2><span class="spacer"></span>' +
      '<button class="btn ghost small" id="logout">Log out</button></div>';

    if (s.phase === 'signup') {
      html += '<div class="card pine"><h3>⏳ Names haven\'t been drawn yet</h3><p style="margin:0">' +
        s.count + ' people have joined so far. Once the organizer draws names, come back here to see which Mystery Person you\'re shopping for' +
        (s.deadline ? ' (sign-ups close ' + esc(s.deadline) + ')' : '') + '.</p></div>';
    } else if (d.shoppingFor) {
      html += '<div class="ticket pop"><div class="label">You\'re shopping for</div>' +
        '<div class="big">Mystery #' + d.shoppingFor.no + '</div>' +
        '<div class="sub">Budget ' + peso(s.budget) + (s.partyDate ? ' · Bring it on ' + esc(s.partyDate) : '') + '</div></div>' +
        '<div class="card"><h3>Their wishlist</h3>' + wishListHTML(d.shoppingFor.wishes) +
        '<div class="notice" style="margin-top:16px"><b>Label your bag:</b> "Mystery Person #' + d.shoppingFor.no + '". ' +
        'Don\'t write your name or theirs anywhere on it. Keep it secret — even the number!</div></div>';
    }
    if (s.phase === 'revealed') {
      html += '<div class="card center"><h3>The reveal is live ✨</h3>' +
        (d.myMystery ? '<p>You were <b>Mystery Person #' + d.myMystery + '</b>. Find whoever has bag #' + d.myMystery + ' and start trading!</p>' : '') +
        '<a class="btn gold" href="#/reveal">Watch the reveal</a></div>';
    }
    html += '<div class="card"><div class="row"><h3 style="margin:0">My wishlist</h3><span class="spacer"></span>' +
      (s.phase !== 'revealed' ? '<a class="btn secondary small" href="#/join">Edit</a>' : '') + '</div>' +
      '<div style="margin-top:12px">' + wishListHTML(d.wishes) + '</div></div>';
    render(html);
    if (d.shoppingFor && !store('seen-' + d.shoppingFor.no)) { confetti(120); store('seen-' + d.shoppingFor.no, 1); }
    $('#logout').onclick = function () { store('me', null); meLogin(); };
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
      actions = '<p class="muted">When everyone has joined, draw names. This gives everyone a secret Mystery # and someone to shop for, and closes sign-ups.</p>' +
        '<button class="btn" id="draw"' + (ps.length < 3 ? ' disabled' : '') + '>🎲 Draw names (' + ps.length + ' people)</button>';
    } else if (s.phase === 'drawn') {
      actions = '<p class="muted">Everyone can now log in to see who they\'re shopping for. On party day, open the Party board on the big screen. When the gifts are opened, start the reveal.</p>' +
        '<div class="row"><a class="btn gold" href="#/board">Open party board</a><button class="btn" id="revealOn">✨ Start the reveal</button>' +
        '<button class="btn ghost small" id="reopen">Reopen sign-ups (clears the draw)</button></div>';
    } else {
      actions = '<p class="muted">The reveal is live. Put the Reveal page on the big screen.</p>' +
        '<div class="row"><a class="btn gold" href="#/reveal">Open reveal screen</a><button class="btn ghost small" id="revealOff">Hide the reveal again</button></div>';
    }

    var rows = ps.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (p) {
      return '<tr><td><b>' + esc(p.name) + '</b><div class="wish-mini">' + p.wishes.map(function (w) { return esc(w.item); }).join(' · ') + '</div></td>' +
        (showSecrets ? '<td>' + (p.mystery ? '<span class="tag">#' + p.mystery + '</span>' : '—') + '</td>' +
          '<td>' + (p.shopsFor ? '<span class="tag berry">#' + p.shopsFor + '</span> ' + esc(p.shopsForName) : '—') + '</td>' : '') +
        '<td style="white-space:nowrap"><button class="btn ghost small" data-pin="' + esc(p.id) + '" data-name="' + esc(p.name) + '">Reset PIN</button>' +
        (s.phase === 'signup' ? '<button class="btn ghost small" data-rm="' + esc(p.id) + '" data-name="' + esc(p.name) + '">Remove</button>' : '') + '</td></tr>';
    }).join('');

    render(
      '<div class="row" style="margin-bottom:16px"><h1 style="margin:0;font-size:2rem">Organizer</h1><span class="phase-pill">' + phaseText + '</span><span class="spacer"></span>' +
        '<button class="btn ghost small" id="aOut">Lock</button></div>' +
      '<div class="stats">' +
        '<div class="stat"><div class="n">' + ps.length + '</div><div class="l">people joined</div></div>' +
        '<div class="stat"><div class="n">' + peso(s.budget) + '</div><div class="l">budget</div></div>' +
        '<div class="stat"><div class="n">' + (s.deadline ? esc(s.deadline) : '—') + '</div><div class="l">sign-up deadline</div></div>' +
        '<div class="stat"><div class="n">' + (s.partyDate ? esc(s.partyDate) : '—') + '</div><div class="l">party day</div></div>' +
      '</div>' +
      '<div class="card"><h3>Next step</h3>' + actions + '<div id="actErr" hidden></div></div>' +
      '<div class="card"><div class="row"><h3 style="margin:0">Players</h3><span class="spacer"></span>' +
        '<button class="btn secondary small" id="secrets">' + (showSecrets ? '🙈 Hide secrets' : '👀 Show who\'s who') + '</button></div>' +
        (showSecrets ? '<p class="small muted">Careful — don\'t show this on a projector!</p>' : '<p class="small muted">Mystery numbers and who-shops-for-whom are hidden so you can keep this screen open safely.</p>') +
        (ps.length ? '<div class="table-wrap"><table><thead><tr><th>Name &amp; wishlist</th>' + (showSecrets ? '<th>Mystery #</th><th>Shops for</th>' : '') + '<th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
          : '<p class="muted">Nobody yet. Share the link below!</p>') +
        (API.demo && s.phase === 'signup' ? '<button class="btn secondary small" id="seed" style="margin-top:12px">Add 8 sample people (demo)</button>' : '') +
      '</div>' +
      '<div class="card"><h3>Invite message</h3>' +
        '<textarea id="invite" rows="5" style="width:100%;font:inherit;padding:12px;border-radius:12px;border:1.5px solid var(--line)">🎁 ' + esc(s.eventName) + '!\n' +
        'Add your 3–5 wishlist items' + (s.deadline ? ' by ' + esc(s.deadline) : '') + ' — budget ' + peso(s.budget) + '. It\'s all anonymous 🤫\n' + esc(siteUrl) + '</textarea>' +
        '<button class="btn secondary small" id="copyInvite" style="margin-top:8px">Copy</button></div>' +
      '<details class="card"><summary>Event settings</summary>' +
        '<form id="setForm"><div class="grid2">' +
          '<div><label>Event name</label><input name="eventName" value="' + esc(s.eventName) + '"></div>' +
          '<div><label>Budget (₱)</label><input name="budget" type="number" min="0" value="' + esc(s.budget) + '"></div>' +
          '<div><label>Sign-up deadline</label><input name="deadline" placeholder="e.g. Dec 1" value="' + esc(s.deadline) + '"></div>' +
          '<div><label>Party date</label><input name="partyDate" placeholder="e.g. Dec 19" value="' + esc(s.partyDate) + '"></div>' +
        '</div><button class="btn small" style="margin-top:14px">Save settings</button><div id="setErr" hidden></div></form>' +
        (API.demo ? '<hr style="border:none;border-top:1px solid var(--line);margin:18px 0"><button class="btn ghost small" id="demoReset">Erase all demo data</button>' : '') +
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
    on('secrets', function () { showSecrets = !showSecrets; renderOrganizer(d); });
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
      API.call('saveSettings', { password: adminPw(), values: { eventName: f.eventName.value, budget: f.budget.value, deadline: f.deadline.value, partyDate: f.partyDate.value } })
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
          '<h2>Bag #' + no + '</h2>' +
          '<p class="muted">Wishlist of Mystery Person #' + no + ' (no names shown — safe for the big screen):</p>' +
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
    function show() {
      if (idx < 0) {
        render('<div class="reveal-stage"><span class="phase-pill">The big reveal</span>' +
          '<h1 style="margin-top:16px">Who were the<br><em style="color:var(--berry)">Mystery People?</em></h1>' +
          '<p class="muted">' + list.length + ' mystery people. Let\'s find out.</p>' +
          '<div class="row" style="justify-content:center"><button class="btn gold" id="go">Start the reveal →</button><button class="btn ghost" id="all">Show everyone at once</button></div></div>');
        $('#go').onclick = next; $('#all').onclick = summary;
        return;
      }
      if (idx >= list.length) return summary();
      var r = list[idx];
      var dots = list.map(function (_, i) { return '<i class="' + (i <= idx ? 'on' : '') + '"></i>'; }).join('');
      render('<div class="reveal-stage">' +
        '<div class="dots">' + dots + '</div>' +
        '<div class="flip' + (flipped ? ' flipped' : '') + '" id="card"><div class="flip-inner">' +
          '<div class="face front"><div class="lbl">Mystery Person</div><div class="num">#' + r.no + '</div><div class="q-mark">?</div>' +
            '<div class="small" style="opacity:.8;margin-top:10px">Tap to reveal</div></div>' +
          '<div class="face back"><div class="was">Mystery Person #' + r.no + ' was…</div><div class="name">' + esc(r.name) + '</div>' +
            '<div class="meta">' + (r.giver ? '<span>🎅 Gift from <b>' + esc(r.giver) + '</b></span>' : '') +
            (r.holder ? '<span>🎁 Bag is with <b>' + esc(r.holder) + '</b></span>' : '') + '</div>' +
            wishListHTML(r.wishes) + '</div>' +
        '</div></div>' +
        '<div class="row" style="justify-content:center"><button class="btn ghost" id="prev">← Back</button>' +
          '<button class="btn' + (flipped ? ' gold' : '') + '" id="next">' + (flipped ? (idx === list.length - 1 ? 'See everyone →' : 'Next mystery →') : 'Reveal!') + '</button></div>' +
        '<p class="small muted">Keyboard: space / → to continue, ← to go back</p></div>');
      $('#card').onclick = next; $('#next').onclick = next; $('#prev').onclick = prev;
    }
    function next() {
      if (idx >= 0 && idx < list.length && !flipped) {
        flipped = true; $('#card').classList.add('flipped');
        setTimeout(function () { confetti(150); }, 450);
        var b = $('#next'); b.textContent = idx === list.length - 1 ? 'See everyone →' : 'Next mystery →'; b.classList.add('gold');
        return;
      }
      idx++; flipped = false; show();
    }
    function prev() { if (flipped) { flipped = false; show(); } else if (idx >= 0) { idx--; flipped = idx >= 0; show(); } }
    function summary() {
      idx = list.length;
      render('<div class="reveal-stage" style="justify-content:flex-start">' +
        '<h1>Merry Christmas! 🎄</h1><p class="muted">Now go find your bag and start trading!</p>' +
        '<div class="summary">' + list.map(function (r) {
          return '<div class="s"><div class="t">#' + r.no + ' · ' + esc(r.name) + '</div>' +
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
  // ROUTER
  // =====================================================================
  var routes = { '': viewHome, join: viewJoin, me: viewMe, organizer: viewOrganizer, board: viewBoard, reveal: viewReveal };
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
    bar.innerHTML = '<b>Demo mode</b> — data is saved only in this browser. Organizer password: <b>demo</b>. Connect the Google Sheet to go live.';
  }
  route();
})();
