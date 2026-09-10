(function (window, document) {
  'use strict';

  var instance = null;
  var readyHandler = null;
  var API = window.GlyphField || {};

  function create(canvas) {
    canvas = canvas || document.querySelector('[data-glyph-field]') || document.getElementById('glyphfield');
    if (!canvas || !canvas.getContext) return null;

    var reducedQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    var pointerQuery = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)');
    if ((reducedQuery && reducedQuery.matches) || (pointerQuery && !pointerQuery.matches)) return null;

    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;

    var FONT = 12, LEADING = 1.26, R_BASE = 58, R_FAST = 34, PEAK = 0.85;
    var SIZES = 4, DECAY = 0.972, COOL = 0.955, SCRAMBLE = 90, BANDS = 6;
    var WAVE_SPEED = 780, WAVE_WIDTH = 46, WAVE_MAX = 820;
    var SETS = [
      ['>', '>', '>', '\u203a', '\u00bb', '-'], ['\\', '\\', '\\', '>', '\u00b7'],
      ['v', 'v', '|', '\u00b7', '\u2193'], ['/', '/', '/', '<', '\u00b7'],
      ['<', '<', '<', '\u2039', '\u00ab', '-'], ['\\', '\\', '\\', '<', '\u00b7'],
      ['^', '^', '|', '\u00b7', '\u2191'], ['/', '/', '/', '>', '\u00b7']
    ];
    var cw = 7.2, ch = 15, cols = 0, rows = 0, n = 0, dpr = 1;
    var cssW = 0, cssH = 0, inten, heat, dirOf, seedOf, activeArr, inActive;
    var activeCount = 0, waves = [], raf = 0, resizeTimer = null, dead = false;
    var lastX = null, lastY = null, lastT = 0, dir = 0, speed = 0, prevX = null, prevY = null;
    var movedAt = -1e9, drawnAt = -1e9, dx0 = 0, dy0 = 0, dx1 = 0, dy1 = 0, dirty = false;
    var ramp = [], fontAt = [];
    var SLOTS = SIZES * BANDS, bucket = [], bucketLen = new Int32Array(SLOTS);
    var SIN = new Float32Array(256);
    var q, k;
    for (q = 0; q < 256; q++) SIN[q] = Math.sin(q / 256 * Math.PI * 2);
    for (k = 0; k < SLOTS; k++) bucket.push([]);

    function hash(v) {
      v = (v ^ 61) ^ (v >>> 16); v += v << 3; v ^= v >>> 4;
      v = Math.imul(v, 0x27d4eb2d); return (v ^ (v >>> 15)) >>> 0;
    }
    function rgbOf(value, fallback) {
      var str = (value || fallback).trim();
      if (str.charAt(0) === '#') {
        if (str.length === 4) str = '#' + str[1] + str[1] + str[2] + str[2] + str[3] + str[3];
        var valueInt = parseInt(str.slice(1), 16);
        if (!isNaN(valueInt)) return [(valueInt >> 16) & 255, (valueInt >> 8) & 255, valueInt & 255];
      }
      var match = str.match(/(\d+(?:\.\d+)?)/g);
      return match && match.length >= 3 ? [+match[0], +match[1], +match[2]] : rgbOf(fallback, '#888888');
    }
    function refreshColors() {
      if (dead) return;
      var styles = window.getComputedStyle(document.documentElement);
      var coldValue = styles.getPropertyValue('--glyph-field-cold') || styles.getPropertyValue('--glyph');
      var hotValue = styles.getPropertyValue('--glyph-field-hot') || styles.getPropertyValue('--glow');
      var cold = rgbOf(coldValue, '#ececf3'), hot = rgbOf(hotValue, '#c79bff');
      ramp.length = 0;
      for (var b = 0; b < BANDS; b++) {
        var t = b / (BANDS - 1);
        ramp.push('rgb(' + Math.round(cold[0] + (hot[0] - cold[0]) * t) + ',' +
          Math.round(cold[1] + (hot[1] - cold[1]) * t) + ',' +
          Math.round(cold[2] + (hot[2] - cold[2]) * t) + ')');
      }
    }
    function resize() {
      if (dead) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = window.innerWidth, h = window.innerHeight;
      cssW = w; cssH = h; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var family = window.getComputedStyle(document.body).getPropertyValue('--mono') || 'monospace';
      ctx.font = FONT + 'px ' + family; cw = ctx.measureText('M').width || FONT * 0.6;
      fontAt.length = 0;
      for (var z = 0; z < SIZES; z++) fontAt.push((FONT * (0.55 + 0.45 * z / (SIZES - 1))).toFixed(2) + 'px ' + family);
      ch = Math.round(FONT * LEADING); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      cols = Math.ceil(w / cw) + 1; rows = Math.ceil(h / ch) + 1; n = cols * rows;
      inten = new Float32Array(n); heat = new Float32Array(n); dirOf = new Uint8Array(n);
      seedOf = new Uint8Array(n); activeArr = new Int32Array(n); inActive = new Uint8Array(n);
      activeCount = 0; dirty = false; waves.length = 0;
      for (var i = 0; i < n; i++) seedOf[i] = hash(i) & 255;
    }
    function light(i, value, direction, warmth) {
      if (value > inten[i]) {
        inten[i] = value; dirOf[i] = direction;
        if (!inActive[i]) { inActive[i] = 1; activeArr[activeCount++] = i; }
      }
      if (warmth > heat[i]) heat[i] = warmth;
    }
    function stamp(ax, ay, bx, by, radius) {
      var rsq = radius * radius, abx = bx - ax, aby = by - ay, abLen = abx * abx + aby * aby;
      var c0 = Math.max(0, Math.floor((Math.min(ax, bx) - radius) / cw));
      var c1 = Math.min(cols, Math.ceil((Math.max(ax, bx) + radius) / cw));
      var r0 = Math.max(0, Math.floor((Math.min(ay, by) - radius) / ch));
      var r1 = Math.min(rows, Math.ceil((Math.max(ay, by) + radius) / ch));
      for (var r = r0; r < r1; r++) for (var c = c0; c < c1; c++) {
        var px = c * cw + cw * 0.5, py = r * ch + ch * 0.5, along = 0;
        if (abLen > 0) { along = ((px - ax) * abx + (py - ay) * aby) / abLen; along = Math.max(0, Math.min(1, along)); }
        var x = px - (ax + abx * along), y = py - (ay + aby * along), dsq = x * x + y * y;
        if (dsq > rsq) continue;
        var i = r * cols + c, t = 1 - Math.sqrt(dsq) / radius;
        var value = t * (0.55 + t * 0.45) * (0.90 + (seedOf[i] % 100) / 1000) * (0.78 + speed * 0.35);
        if (value > 0.02) light(i, value, dir, Math.min(t * (0.30 + speed * 1.15), 1));
      }
    }
    function requestFrame() { if (!raf && !dead) raf = window.requestAnimationFrame(frame); }
    function onMove(event) {
      var mx = event.clientX, my = event.clientY, now = event.timeStamp || window.performance.now();
      if (lastX !== null) {
        var vx = mx - lastX, vy = my - lastY, distance = Math.sqrt(vx * vx + vy * vy);
        if (distance > 2.5) { dir = ((Math.round(Math.atan2(vy, vx) / (Math.PI / 4)) % 8) + 8) % 8; speed = Math.min(distance / Math.max(now - lastT, 8) / 2.2, 1); }
        else speed *= 0.9;
      }
      lastX = mx; lastY = my; lastT = now; movedAt = now;
      if (prevX === null) { prevX = mx; prevY = my; }
      if (Math.abs(mx - prevX) + Math.abs(my - prevY) > 400) { prevX = mx; prevY = my; }
      stamp(prevX, prevY, mx, my, R_BASE + R_FAST * speed); prevX = mx; prevY = my; requestFrame();
    }
    function onDown(event) {
      if (waves.length > 3) waves.shift();
      waves.push({ x: event.clientX, y: event.clientY, t0: window.performance.now() }); requestFrame();
    }
    function onLeave() { speed = 0; lastX = null; prevX = null; }
    function onResize() { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(resize, 150); }
    function stepWaves(ts) {
      for (var w = waves.length - 1; w >= 0; w--) {
        var wave = waves[w], rad = (ts - wave.t0) / 1000 * WAVE_SPEED;
        if (rad > WAVE_MAX) { waves.splice(w, 1); continue; }
        var outer = rad + WAVE_WIDTH, inner = Math.max(rad - WAVE_WIDTH, 0), outerSq = outer * outer, innerSq = inner * inner;
        var c0 = Math.max(0, Math.floor((wave.x - outer) / cw)), c1 = Math.min(cols, Math.ceil((wave.x + outer) / cw));
        var r0 = Math.max(0, Math.floor((wave.y - outer) / ch)), r1 = Math.min(rows, Math.ceil((wave.y + outer) / ch));
        var fade = 1 - rad / WAVE_MAX;
        for (var r = r0; r < r1; r++) for (var c = c0; c < c1; c++) {
          var x = c * cw + cw * 0.5 - wave.x, y = r * ch + ch * 0.5 - wave.y, dsq = x * x + y * y;
          if (dsq < innerSq || dsq > outerSq) continue;
          var edge = 1 - Math.abs(Math.sqrt(dsq) - rad) / WAVE_WIDTH;
          if (edge > 0) light(r * cols + c, edge * fade * 0.95, ((Math.round(Math.atan2(y, x) / (Math.PI / 4)) % 8) + 8) % 8, edge * fade);
        }
      }
    }
    function frame(ts) {
      raf = 0; if (dead) return;
      if (ts - movedAt > 140 && !waves.length && ts - drawnAt < 30) { requestFrame(); return; }
      drawnAt = ts; if (waves.length) stepWaves(ts);
      if (dirty) ctx.clearRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
      var nx0 = 1e9, ny0 = 1e9, nx1 = -1e9, ny1 = -1e9, tick = (ts / SCRAMBLE) | 0, phase = (ts * 0.17) | 0;
      var b; for (b = 0; b < SLOTS; b++) bucketLen[b] = 0;
      var write = 0;
      for (var a = 0; a < activeCount; a++) {
        var idx = activeArr[a], value = inten[idx] * DECAY;
        if (value < 0.012) { inten[idx] = heat[idx] = inActive[idx] = 0; continue; }
        inten[idx] = value; heat[idx] *= COOL; activeArr[write++] = idx;
        var band = Math.min(BANDS - 1, (heat[idx] * (BANDS - 1) + 0.5) | 0);
        var size = Math.max(0, Math.min(SIZES - 1, (value * SIZES) | 0));
        var slot = size * BANDS + band; bucket[slot][bucketLen[slot]++] = idx;
      }
      activeCount = write;
      for (b = 0; b < SLOTS; b++) {
        var len = bucketLen[b]; if (!len) continue;
        ctx.font = fontAt[(b / BANDS) | 0]; ctx.fillStyle = ramp[b % BANDS];
        for (k = 0; k < len; k++) {
          var i2 = bucket[b][k], value2 = inten[i2], set = SETS[dirOf[i2]];
          var pick = value2 > 0.5 ? hash(i2 + tick * 7919) : hash(i2 + (tick >> 2) * 104729);
          var shimmer = 0.80 + 0.20 * SIN[(phase + seedOf[i2]) & 255];
          var c2 = i2 % cols, r2 = (i2 - c2) / cols, px = c2 * cw + cw * 0.5, py = r2 * ch + ch * 0.5;
          nx0 = Math.min(nx0, px); nx1 = Math.max(nx1, px); ny0 = Math.min(ny0, py); ny1 = Math.max(ny1, py);
          ctx.globalAlpha = Math.min(value2, 1) * PEAK * shimmer;
          ctx.fillText(set[(pick + seedOf[i2]) % set.length], px, py);
        }
      }
      ctx.globalAlpha = 1;
      if (nx1 > -1e8) {
        dx0 = Math.max(0, nx0 - cw * 2); dy0 = Math.max(0, ny0 - ch * 2);
        dx1 = Math.min(cssW, nx1 + cw * 2); dy1 = Math.min(cssH, ny1 + ch * 2); dirty = true;
      } else dirty = false;
      if (activeCount || waves.length) requestFrame();
    }

    var observer = new MutationObserver(refreshColors);
    refreshColors(); resize();
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerleave', onLeave);

    return {
      canvas: canvas,
      refreshColors: refreshColors,
      destroy: function () {
        if (dead) return; dead = true;
        if (raf) window.cancelAnimationFrame(raf);
        window.clearTimeout(resizeTimer); observer.disconnect();
        window.removeEventListener('resize', onResize);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerleave', onLeave);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (instance && instance.canvas === canvas) instance = null;
      }
    };
  }

  API.init = function (canvas) {
    if (instance && (!canvas || canvas === instance.canvas)) return instance;
    if (instance) instance.destroy();
    instance = create(canvas); return instance;
  };
  API.destroy = function () {
    if (readyHandler) { document.removeEventListener('DOMContentLoaded', readyHandler); readyHandler = null; }
    if (instance) instance.destroy(); instance = null;
  };
  API.refreshColors = function () { if (instance) instance.refreshColors(); };
  window.GlyphField = API;

  function autoInit() { readyHandler = null; API.init(); }
  if (document.readyState === 'loading') {
    readyHandler = autoInit; document.addEventListener('DOMContentLoaded', readyHandler, { once: true });
  } else autoInit();
})(window, document);
