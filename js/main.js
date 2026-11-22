// AutoSimiX website. Plain JavaScript, no library.

// Without JavaScript every section is shown at once (see .no-js in the CSS).
document.documentElement.classList.remove('no-js');

// ---------------------------------------------------------------- Settings
// The app's Google Play page: every "Get it on Google Play" button uses it.
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.yassine.autosimix';

// The six input colors, as in the app's oscilloscope (A1 … A6).
const CHANNEL_COLORS = ['#FFD60A', '#22D3EE', '#4ADE80', '#F472B6', '#FB923C', '#818CF8'];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- Basics
document.querySelectorAll('.play-link').forEach((a) => {
  a.href = PLAY_STORE_URL;
  a.target = '_blank';
  a.rel = 'noopener';
});
document.getElementById('year').textContent = new Date().getFullYear();

// The header gets a background once the page scrolls.
const nav = document.getElementById('nav');
const onScrollNav = () => nav.classList.toggle('scrolled', window.scrollY > 24);
window.addEventListener('scroll', onScrollNav, { passive: true });
onScrollNav();

// Mobile menu.
const menu = document.getElementById('menu');
const menuBtn = document.getElementById('menuBtn');
const setMenu = (open) => {
  menu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
};
menuBtn.addEventListener('click', () => setMenu(true));
document.getElementById('menuClose').addEventListener('click', () => setMenu(false));
menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !menu.hidden) setMenu(false);
});

// ---------------------------------------------------------------- Your photos
// A photo slot shows its picture as soon as the file exists (e.g.
// assets/photos/hero.jpg); until then the designed placeholder stays.
document.querySelectorAll('.photo-slot[data-photo]').forEach((slot) => {
  const src = slot.dataset.photo;
  const img = new Image();
  img.onload = () => {
    slot.style.backgroundImage = `url("${src}")`;
    slot.classList.add('loaded');
    slot.closest('.hero')?.classList.add('has-photo');
  };
  img.src = src;
});

// ---------------------------------------------------------------- Reveal on scroll
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
      if (entry.target.classList.contains('stats')) countUp(entry.target);
    });
  },
  { threshold: 0.18 }
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// The numbers count up once.
function countUp(box) {
  box.querySelectorAll('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    if (reduceMotion) return;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / 1200);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// ---------------------------------------------------------------- The nine steps
// The steps light up one by one as the section scrolls into view.
const steps = document.getElementById('steps');
const stepItems = [...steps.querySelectorAll('li')];
function updateSteps() {
  const rect = steps.getBoundingClientRect();
  const vh = window.innerHeight;
  const progress = Math.max(0, Math.min(1, (vh * 0.9 - rect.top) / (vh * 0.55)));
  const lit = reduceMotion ? stepItems.length : Math.ceil(progress * stepItems.length);
  stepItems.forEach((li, i) => li.classList.toggle('on', i < lit));
  steps.style.setProperty('--progress', lit <= 1 ? 0 : (lit - 1) / (stepItems.length - 1));
}
window.addEventListener('scroll', updateSteps, { passive: true });
window.addEventListener('resize', updateSteps);
updateSteps();

// ---------------------------------------------------------------- Canvas helpers
// Keeps a canvas sharp at the screen's pixel density; returns its size in
// CSS pixels.
function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// Runs draw(t) every frame while the canvas is on screen (once when the
// visitor prefers less motion).
function animateWhileVisible(canvas, draw) {
  let running = false;
  let frame = 0;
  const t0 = performance.now();
  const loop = (now) => {
    draw((now - t0) / 1000);
    if (running) frame = requestAnimationFrame(loop);
  };
  if (reduceMotion) {
    const once = () => draw(2.5);
    once();
    window.addEventListener('resize', once);
    return;
  }
  new IntersectionObserver((entries) => {
    const visible = entries[0].isIntersecting;
    if (visible && !running) {
      running = true;
      frame = requestAnimationFrame(loop);
    } else if (!visible && running) {
      running = false;
      cancelAnimationFrame(frame);
    }
  }).observe(canvas);
}

// A little deterministic noise, so traces look like real measurements.
const noise = (t, k) => Math.sin(t * 91.7 + k * 13.1) * Math.sin(t * 37.3 + k * 5.7);
// Remainder that is never negative (JavaScript's % keeps the sign).
const mod = (a, n) => ((a % n) + n) % n;

// ---------------------------------------------------------------- Live oscilloscope
// Six lanes like the app: a supply, a sensor signal, a ground, a crankshaft
// style square wave, a slow sine and a throttle-like ramp.
const SIGNALS = [
  { max: 15, v: (t) => 12.06 + 0.04 * noise(t, 1) },
  { max: 5, v: (t) => 1.4 + 1.1 * (0.5 + 0.5 * Math.sin(t * 2.1)) + 0.05 * noise(t, 2) },
  { max: 5, v: (t) => 0.03 + 0.02 * Math.abs(noise(t, 3)) },
  { max: 5, v: (t) => (mod(t * 7, 1) < 0.5 && mod(t * 7, 12) < 10.5 ? 4.8 : 0.2) },
  { max: 5, v: (t) => 2.5 + 1.6 * Math.sin(t * 6.9) + 0.06 * noise(t, 5) },
  { max: 5, v: (t) => 0.5 + 3.8 * mod(t * 0.45, 1) },
];
const scopeCanvas = document.getElementById('scope');
animateWhileVisible(scopeCanvas, (t) => {
  const { ctx, w, h } = fitCanvas(scopeCanvas);
  ctx.clearRect(0, 0, w, h);
  const gap = 6;
  const top = 34;
  const laneH = (h - top - gap * 5 - 10) / 6;
  const windowS = 3; // seconds across the screen
  const points = Math.max(120, Math.floor(w / 2));

  SIGNALS.forEach((sig, i) => {
    const y0 = top + i * (laneH + gap);
    // lane grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let d = 0; d <= 10; d++) {
      const x = Math.round((w * d) / 10) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + laneH); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.moveTo(0, y0 + laneH + 0.5); ctx.lineTo(w, y0 + laneH + 0.5); ctx.stroke();

    // trace, newest sample on the right
    const color = CHANNEL_COLORS[i];
    ctx.beginPath();
    let last = 0;
    for (let p = 0; p <= points; p++) {
      // (+ 30 s: the traces start mid-way, never at time zero)
      const ts = 30 + t - windowS + (windowS * p) / points;
      last = sig.v(ts);
      const x = (w * p) / points;
      const y = y0 + laneH - (Math.min(sig.max, Math.max(0, last)) / sig.max) * (laneH - 6) - 3;
      p === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = color + '40';
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();

    // channel badge with the live value
    ctx.font = '600 11px -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('CH', 10, y0 + 15);
    ctx.fillStyle = color;
    ctx.font = '800 12px -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText(`A${i + 1}`, 30, y0 + 15);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '700 11px ui-monospace, Consolas, monospace';
    ctx.fillText(`${last.toFixed(2)} V`, 54, y0 + 15);
  });
});

// ---------------------------------------------------------------- Emulation waves
// The two outputs: a sine on output 1, a crankshaft-style tooth pattern on
// output 2 (with its missing teeth), drawn as glowing lines.
const waveCanvas = document.getElementById('wave');
animateWhileVisible(waveCanvas, (t) => {
  const { ctx, w, h } = fitCanvas(waveCanvas);
  ctx.clearRect(0, 0, w, h);
  const mid1 = h * 0.3;
  const mid2 = h * 0.74;
  const amp = h * 0.17;
  const points = Math.max(200, Math.floor(w / 1.5));

  const draw = (yAt, color) => {
    ctx.beginPath();
    for (let p = 0; p <= points; p++) {
      const x = (w * p) / points;
      const y = yAt(p / points);
      p === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = color + '33';
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  // Output 1: sine
  draw((u) => mid1 - amp * Math.sin((u * 4 - t * 0.6) * Math.PI * 2), '#2F5BFF');
  // Output 2: 60-2 style teeth (two missing every 30 teeth here)
  draw((u) => {
    const phase = u * 40 - t * 3;
    const tooth = ((phase % 30) + 30) % 30;
    const high = tooth < 28 && ((phase % 1) + 1) % 1 < 0.5;
    return mid2 + (high ? -amp * 0.8 : amp * 0.8);
  }, '#22D3EE');

  ctx.font = '700 12px -apple-system, Segoe UI, Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('OUT 1 · sine', 4, 16);
  ctx.fillText('OUT 2 · crankshaft pattern', 4, h * 0.5 + 14);
});
