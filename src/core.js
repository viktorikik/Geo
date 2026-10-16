// src/core.js — state, storage, audio, theme, stats, utils, event bus
import { STORAGE_KEYS, MASTERY_LEVELS } from './config.js';
import { getDefaultStats, getMasteryLevel, getNextMasteryLevel, ACHIEVEMENTS } from './data.js';

export const state = {
  ready: false,
  mode: 'explore',
  mapMode: 'flat',
  quiz: null,
  selectedLevel: 'world',
  selectedBlitz: false,
  selectedInputMode: false,
  stats: getDefaultStats(),
  unlockedAchievements: new Set(),
  soundEnabled: true,
  theme: 'dark',
  learnIndex: 0,
  learnPool: [],
  records: {}
};

// ---------- Event bus ----------
const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => off(event, fn);
}

export function off(event, fn) {
  if (listeners.has(event)) listeners.get(event).delete(fn);
}

export function emit(event, data) {
  if (listeners.has(event)) {
    for (const fn of listeners.get(event)) {
      try { fn(data); } catch (e) { console.error('Listener error:', event, e); }
    }
  }
}

// ---------- Storage ----------
export function loadFromStorage(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Storage parse error for', key, e);
    try { localStorage.removeItem(key); } catch (_) {}
    return defaultValue;
  }
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage save error:', e);
  }
}

// ---------- Audio (Web Audio API) ----------
let audioCtx = null;

export function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  } catch (e) {
    audioCtx = null;
  }
  return audioCtx;
}

function tone(freq, duration, type = 'sine', delay = 0, vol = 0.12) {
  if (!state.soundEnabled) return;
  const ctx = initAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration / 1000 + 0.02);
}

function slideTone(f1, f2, duration, type = 'sine', vol = 0.12) {
  if (!state.soundEnabled) return;
  const ctx = initAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f1, t0);
  osc.frequency.exponentialRampToValueAtTime(f2, t0 + duration / 1000);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration / 1000 + 0.02);
}

export const sfx = {
  correct() {
    tone(523, 120, 'sine', 0);
    tone(659, 120, 'sine', 0.1);
    tone(784, 180, 'sine', 0.2);
  },
  wrong() {
    slideTone(233, 207, 200, 'triangle', 0.12);
  },
  click() {
    tone(880, 30, 'square', 0, 0.06);
  },
  achievement() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 150, 'sine', i * 0.09, 0.14));
  },
  record() {
    [659, 784, 1047, 1319].forEach((f, i) => tone(f, 180, 'sine', i * 0.1, 0.14));
  },
  streak() {
    slideTone(880, 1100, 200, 'sine', 0.1);
  }
};

// ---------- Theme ----------
export function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  saveToStorage(STORAGE_KEYS.theme, theme);
  updateOceanColors();
  emit('theme:changed', theme);
}

export function cycleTheme() {
  const order = ['dark', 'light', 'retro'];
  const idx = order.indexOf(state.theme);
  const next = order[(idx + 1) % order.length];
  setTheme(next);
  return next;
}

export function updateOceanColors() {
  const styles = getComputedStyle(document.documentElement);
  const c1 = styles.getPropertyValue('--ocean-1').trim();
  const c2 = styles.getPropertyValue('--ocean-2').trim();
  document.querySelectorAll('.ocean-stop-1').forEach(el => el.setAttribute('stop-color', c1));
  document.querySelectorAll('.ocean-stop-2').forEach(el => el.setAttribute('stop-color', c2));
}

// ---------- Stats ----------
export function loadStats() {
  const s = loadFromStorage(STORAGE_KEYS.stats, null);
  if (s && typeof s === 'object') {
    const merged = { ...getDefaultStats(), ...s };
    if (!Array.isArray(merged.exploredCountries)) merged.exploredCountries = [];
    merged.exploredCountries = [...new Set(merged.exploredCountries)];
    state.stats = merged;
  } else {
    state.stats = getDefaultStats();
  }
  return state.stats;
}

export function saveStats() {
  saveToStorage(STORAGE_KEYS.stats, state.stats);
  emit('stats:changed', state.stats);
}

export function loadAchievements() {
  const arr = loadFromStorage(STORAGE_KEYS.achievements, []);
  state.unlockedAchievements = new Set(Array.isArray(arr) ? arr : []);
}

export function saveAchievements() {
  saveToStorage(STORAGE_KEYS.achievements, [...state.unlockedAchievements]);
}

export function checkAchievements() {
  let newUnlocks = [];
  for (const ach of ACHIEVEMENTS) {
    if (state.unlockedAchievements.has(ach.id)) continue;
    try {
      if (ach.check(state.stats)) {
        state.unlockedAchievements.add(ach.id);
        newUnlocks.push(ach);
      }
    } catch (e) { /* ignore */ }
  }
  if (newUnlocks.length) {
    saveAchievements();
    emit('achievements:changed', newUnlocks);
    for (const ach of newUnlocks) {
      emit('toast', {
        type: 'achievement',
        text: `${ach.icon} ${ach.name}`,
        timeout: 4000
      });
    }
    sfx.achievement();
  }
}

export function loadRecords() {
  state.records = loadFromStorage(STORAGE_KEYS.records, {});
}

export function saveRecords() {
  saveToStorage(STORAGE_KEYS.records, state.records);
}

export function recordKey(level, blitz, input) {
  return `${level}|${blitz ? 'blitz' : 'classic'}|${input ? 'input' : 'click'}`;
}

export function getRecord(level, blitz, input) {
  return state.records[recordKey(level, blitz, input)] || 0;
}

export function setRecord(level, blitz, input, score) {
  const key = recordKey(level, blitz, input);
  const prev = state.records[key] || 0;
  if (score > prev) {
    state.records[key] = score;
    saveRecords();
    return true;
  }
  return false;
}

// ---------- Mastery ----------
export function currentMastery() {
  return getMasteryLevel(state.stats.gamesPlayed);
}

export function masteryProgress() {
  const cur = currentMastery();
  const next = getNextMasteryLevel(state.stats.gamesPlayed);
  if (!next) return 1;
  const span = next.minGames - cur.minGames;
  const done = state.stats.gamesPlayed - cur.minGames;
  return Math.max(0, Math.min(1, done / span));
}

// ---------- Daily tasks ----------
export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadDaily() {
  const stored = loadFromStorage(STORAGE_KEYS.daily, null);
  const today = todayKey();
  if (!stored || stored.date !== today) {
    return {
      date: today,
      progress: { gamesPlayed: 0, explored: 0, blitz: 0, correct: 0, streak: 0 },
      claimed: []
    };
  }
  if (!stored.progress) stored.progress = { gamesPlayed: 0, explored: 0, blitz: 0, correct: 0, streak: 0 };
  if (!Array.isArray(stored.claimed)) stored.claimed = [];
  return stored;
}

export function saveDaily(d) {
  saveToStorage(STORAGE_KEYS.daily, d);
}

export function updateDailyTask(field, delta) {
  const d = loadDaily();
  if (!(field in d.progress)) return;
  // Блиц-задача не должна учитываться в обычных играх — вызывающий сам решает
  d.progress[field] = (d.progress[field] || 0) + delta;
  saveDaily(d);
  emit('daily:changed', d);
}

// ---------- Utils ----------
export function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom(arr, n = 1) {
  const shuffled = shuffle(arr);
  return n === 1 ? shuffled[0] : shuffled.slice(0, n);
}

export function normalizeAnswer(str) {
  return String(str)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\s\-–—.,'"`()]/g, '')
    .replace(/й/g, 'и')
    .trim();
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

export function fuzzyMatch(input, target) {
  const a = normalizeAnswer(input);
  const b = normalizeAnswer(target);
  if (!a || !b) return false;
  if (a === b) return true;
  const maxDist = b.length <= 5 ? 1 : 2;
  if (levenshtein(a, b) <= maxDist) return true;
  if (a.length >= 4 && b.length >= 6 && b.includes(a)) return true;
  if (b.length >= 4 && a.length >= 6 && a.includes(b)) return true;
  return false;
}

export function fuzzyMatchAny(input, targets) {
  return targets.some(t => fuzzyMatch(input, t));
}

export function getFeatureKey(feature) {
  if (!feature || feature.id == null) return null;
  const id = String(feature.id);
  if (id.startsWith('-')) return null;
  return id.padStart(3, '0');
}

export function debounce(fn, ms) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

export function formatNumber(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
