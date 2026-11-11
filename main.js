/* universitetspædagogik.dk: animationer og interaktive figurer. Siden virker fuldt uden dette script. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function onView(el, fn, th) {
    if (!el) return;
    if (!hasIO || reduce) { fn(); return; }
    var o = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { o.disconnect(); fn(); } }, { threshold: th || 0.3 });
    o.observe(el);
  }

  // Overskrift: ord glider op bag en maske
  var h1 = $('.split');
  if (h1 && !reduce) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'w';
            var inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(h1);
  }

  // Scroll-reveal
  var targets = $$('.body > h2, .body > p, .marg, .tldr .callout, .toc-item, .cycle, .principle, .align, .use, .col, .callout, .step, .pillar, .matrix, .warn, details, .faq .qa, .source');
  targets.forEach(function (el) {
    el.classList.add('reveal');
    var sib = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.className === el.className.replace(' reveal', ''); });
    var idx = sib.indexOf(el);
    if (sib.length > 1 && idx > 0) el.style.setProperty('--d', Math.min(idx, 6) * 80 + 'ms');
  });
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    targets.forEach(function (el) { io.observe(el); });
  } else targets.forEach(function (el) { el.classList.add('in'); });

  // Header, fremdrift, aktivt afsnit, tidslinje, margenlinjer
  var bar = $('.progress'), totop = $('.totop');
  var links = $$('nav:not(.toc-list) a[href^="#"]');
  var secs = links.map(function (a) { return $(a.getAttribute('href')); });
  var margs = $$('main section').map(function (s) { return [s, $('.rule-line', s)]; }).filter(function (p) { return p[1]; });
  var tl = $('.timeline'), steps = $$('.step');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight, h = root.scrollHeight - vh;
    if (bar) bar.style.setProperty('--p', h > 0 ? Math.min(1, y / h) : 0);
    if (totop) totop.classList.toggle('show', y > vh * 1.2);
    var cur = -1;
    secs.forEach(function (s, k) { if (s && s.getBoundingClientRect().top < vh * 0.35) cur = k; });
    links.forEach(function (a, k) { a.classList.toggle('active', k === cur); });
    margs.forEach(function (p) {
      var r = p[0].getBoundingClientRect();
      p[1].style.setProperty('--sp', Math.max(0, Math.min(1, (vh * 0.4 - r.top) / r.height)).toFixed(3));
    });
    if (tl) {
      var r = tl.getBoundingClientRect();
      var t = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / r.height));
      tl.style.setProperty('--tp', t.toFixed(3));
      steps.forEach(function (s) { s.classList.toggle('lit', s.getBoundingClientRect().top < vh * 0.6); });
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  if (reduce && tl) { tl.style.setProperty('--tp', 1); steps.forEach(function (s) { s.classList.add('lit'); }); }
  if (totop) totop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  // Menu på mobil
  var mbtn = $('.menubtn'), sheet = $('#menu');
  if (mbtn && sheet) {
    var setMenu = function (o) {
      mbtn.setAttribute('aria-expanded', o ? 'true' : 'false'); sheet.hidden = !o;
      $('use', mbtn).setAttribute('href', o ? '#i-close' : '#i-menu');
    };
    mbtn.addEventListener('click', function () { setMenu(sheet.hidden); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  // Forskningscyklus: fremhæv ét trin ad gangen
  var cyc = $('[data-cycle]');
  if (cyc) {
    var nodes = $$('.node', cyc), items = $$('li', cyc), n = 0;
    var light = function () { nodes.forEach(function (x, k) { x.classList.toggle('on', k === n); }); items.forEach(function (x, k) { x.classList.toggle('on', k === n); }); n = (n + 1) % 4; };
    light();
    if (!reduce) onView(cyc, function () { setInterval(light, 3500 / 1); }, 0.3);
  }

  // Alignment-diagram
  var al = $('[data-align]');
  if (al) {
    var svg = $('svg', al), nd = $$('.nd', svg), ed = $$('.edge', svg), out = $('.out', al), btn = $$('.seg button', al);
    var A = { ok: [[260, 60], [110, 270], [410, 270]], ai: [[245, 30], [55, 300], [470, 220]] };
    var cur = A.ok.map(function (p) { return p.slice(); }), target = A.ok, state = 'ok', t0 = performance.now();
    var texts = { ok: 'Alle tre peger i samme retning.', ai: 'Eksamen tester noget andet end det, kurset vil lære.' };
    var draw = function (now) {
      var k = (now - t0) / 1000;
      var pos = cur.map(function (p, j) {
        var wob = reduce ? 0 : (state === 'ai' ? 6 : 2.5);
        return [p[0] + Math.sin(k * 1.3 + j * 2) * wob, p[1] + Math.cos(k * 1.1 + j) * wob];
      });
      nd.forEach(function (g, j) { g.setAttribute('transform', 'translate(' + pos[j][0].toFixed(1) + ',' + pos[j][1].toFixed(1) + ')'); });
      ed.forEach(function (l) {
        var ab = l.getAttribute('data-e').split('-'), a = pos[+ab[0]], b = pos[+ab[1]];
        l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', b[0]); l.setAttribute('y2', b[1]);
      });
    };
    var animating = false, visible = true;
    var loop = function (now) {
      cur.forEach(function (p, j) { p[0] += (target[j][0] - p[0]) * 0.08; p[1] += (target[j][1] - p[1]) * 0.08; });
      draw(now);
      if (visible && !reduce) requestAnimationFrame(loop); else animating = false;
    };
    var start = function () { if (!animating) { animating = true; requestAnimationFrame(loop); } };
    var set = function (s) {
      state = s; target = A[s]; al.setAttribute('data-state', s);
      btn.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === s ? 'true' : 'false'); });
      out.innerHTML = '<span>' + texts[s] + '</span>';
      if (reduce) { cur = A[s].map(function (p) { return p.slice(); }); draw(0); } else start();
    };
    var touched = false;
    btn.forEach(function (b) { b.addEventListener('click', function () { touched = true; set(b.getAttribute('data-v')); }); });
    draw(0);
    if (hasIO && !reduce) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(al);
      onView(al, function () { setTimeout(function () { if (!touched) set('ai'); }, 1600); setTimeout(function () { if (!touched) set('ok'); }, 4600); }, 0.6);
    }
  }

  // Milepæle: feedback vandrer gennem forløbet
  var ms = $('[data-miles]');
  if (ms) {
    var mm = $$('.mile', ms), fb = $('.fb', ms), m = 0;
    var tick = function () {
      mm.forEach(function (x, k) { x.classList.toggle('on', k === m); x.classList.toggle('done', k < m); });
      fb.style.setProperty('--x', (12.5 + m * 25) + '%');
      m = (m + 1) % mm.length;
    };
    tick();
    if (!reduce) onView(ms, function () { setInterval(tick, 1600); }, 0.5);
  }

  // Netværk i toppen: forskning som forbindelser
  var cv = $('.hero canvas');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d'), hero = $('.hero'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, pts = [], mouse = { x: -999, y: -999 }, run = true;
    var size = function () {
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var N = Math.round(Math.min(90, Math.max(28, W * H / 16000)));
      pts = [];
      for (var k = 0; k < N; k++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.6 + .6 });
    };
    var frame = function () {
      ctx.clearRect(0, 0, W, H);
      var D = Math.min(150, W / 7);
      for (var a = 0; a < pts.length; a++) {
        var p = pts[a];
        if (!reduce) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
        for (var b = a + 1; b < pts.length; b++) {
          var q = pts[b], dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < D) { ctx.strokeStyle = 'rgba(99,214,191,' + (0.22 * (1 - d / D)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        var mx = p.x - mouse.x, my = p.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
        if (md < 180) { ctx.strokeStyle = 'rgba(212,167,101,' + (0.5 * (1 - md / 180)).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
        ctx.fillStyle = md < 180 ? 'rgba(232,200,150,.95)' : 'rgba(170,230,215,.75)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      if (run && !reduce) requestAnimationFrame(frame);
    };
    size(); frame();
    window.addEventListener('resize', function () { size(); if (reduce) frame(); });
    hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; });
    if (hasIO && !reduce) new IntersectionObserver(function (en) { var v = en[0].isIntersecting; if (v && !run) { run = true; requestAnimationFrame(frame); } run = v; }).observe(hero);
    document.addEventListener('visibilitychange', function () { if (document.hidden) run = false; else if (!reduce && !run) { run = true; requestAnimationFrame(frame); } });
  }
})();
