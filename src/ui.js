import { on } from './core.js';

/* ============================================================
   TOASTS
   ============================================================ */
export function showToast(icon, title, description, duration = 3200) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-text">
      <div class="toast-title">${title}</div>
      <div class="toast-desc">${description}</div>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// Любой модуль может вызвать emit('toast', {...})
on('toast', ({ icon, title, desc, duration }) => showToast(icon, title, desc, duration));

/* ============================================================
   MODALS
   ============================================================ */
let lastFocused = null;

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const focusables = [...e.currentTarget.querySelectorAll(
    'button, input, [tabindex]:not([tabindex="-1"])'
  )].filter(el => !el.disabled && el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0], last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
}

export function openModal(name) {
  lastFocused = document.activeElement;
  const overlay = document.getElementById('modal-' + name);
  if (!overlay) return;
  overlay.classList.add('show');
  overlay.addEventListener('keydown', trapFocus);
  setTimeout(() => {
    const f = overlay.querySelector('button, input');
    if (f) f.focus();
  }, 60);
}

export function closeModal(name) {
  const overlay = document.getElementById('modal-' + name);
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.removeEventListener('keydown', trapFocus);
  if (lastFocused?.focus) { lastFocused.focus(); lastFocused = null; }
}

export function initModals() {
  // Делегирование: клик по data-close закрывает модалку
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      // Клик по фону — закрываем (кроме onboarding)
      if (e.target === overlay && !overlay.id.includes('onboarding')) {
        const name = overlay.id.replace('modal-', '');
        closeModal(name);
      }
    });
  });
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
}

/* ============================================================
   PARTICLES
   ============================================================ */
export function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let width, height;

  const resize = () => {
    width = canvas.width = innerWidth;
    height = canvas.height = innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const particles = Array.from({ length: 50 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5,
    dx: (Math.random() - 0.5) * 0.15,
    dy: (Math.random() - 0.5) * 0.1,
    o: Math.random() * 0.3 + 0.1,
  }));

  (function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = width; else if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height; else if (p.y > height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139,92,246,${p.o})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  })();
}

/* ============================================================
   PANEL (мобильный)
   ============================================================ */
export function initPanel() {
  const panel = document.getElementById('panel');
  const handle = document.getElementById('panel-handle');
  let startY = 0, currentY = 0, swiping = false;

  handle.addEventListener('touchstart', e => {
    startY = currentY = e.touches[0].clientY;
    swiping = false;
  }, { passive: true });

  handle.addEventListener('touchmove', e => {
    currentY = e.touches[0].clientY;
    const dy = currentY - startY;
    if (dy > 10) { swiping = true; panel.style.transform = `translateY(${dy}px)`; }
  }, { passive: true });

  handle.addEventListener('touchend', () => {
    if (swiping && currentY - startY > 60) panel.classList.remove('expanded');
    panel.style.transform = '';
    startY = currentY = 0;
    swiping = false;
  });

  handle.addEventListener('click', () => {
    panel.classList.toggle('expanded');
  });
}

export function collapsePanel() {
  if (innerWidth <= 700) document.getElementById('panel').classList.remove('expanded');
}

export function setPanelHandleTitle(text) {
  const el = document.getElementById('panel-handle-title');
  if (el) el.textContent = text;
}
