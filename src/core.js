import {
  STORAGE_KEYS, THEMES, THEME_ICONS, MASTERY_LEVELS,
} from './config.js';
import { COUNTRIES_DB, ACHIEVEMENTS, getDefaultStats } from './data.js';

/* ============================================================
   1. STORAGE
   ============================================================ */
export function loadFromStorage(key, defaultValue) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return defaultValue;
    return JSON.parse(value);
  } catch (e) {
    try { localStorage.removeItem(key); } catch (_) {}
    return defaultValue;
  }
}

export function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}

/* ============================================================
   2. STATE + EVENT BUS
   ============================================================ */
export const state = {
  // Runtime
  ready: false,
  mode: 'explore',          // explore | setup | learn | quiz
  mapMode: 'flat',          // flat | globe
  highlightedFeature: null,

  // Quiz
  quiz: null,
  selectedLevel: 'world',
  selectedBlitz: false,
  selectedInputMode: false,

  // Persisted
  stats: loadFromStorage(STORAGE_KEYS.stats, getDefaultStats()),
  unlockedAchievements: new Set(loadFromStorage(STORAGE_KEYS.achievements, [])),
  soundEnabled: loadFromStorage(STORAGE_KEYS.sound, true),
  theme: loadFromStorage(STORAGE_KEYS.theme, 'dark'),
};

const listeners = new Map();

/** Подписка: on('stats:changed', fn) */
export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event).delete(fn);
}

/** Публикация события */
export function emit(event, data) {
  if (listeners.has(event)) {
    listeners.get(event).forEach(fn => {
      try { fn(data); } catch (e) { console.error(e); }
    });
  }
}

/** Универсальное обновление state + событие */
export function setState(patch) {
  Object.assign(state, patch);
  emit('change', state);
}

/* ============================================================
   3. STATS + ACHIEVEMENTS
   ============================================================ */
export function saveStats() {
  saveToStorage(STORAGE_KEYS.stats, state.stats);
  emit('stats:changed', state.stats);
}

export function saveAchievements() {
  saveToStorage(STORAGE_KEYS.achievements, [...state.unlockedAchievements]);
  emit('achievements:changed', state.unlockedAchievements);
}

export function trackCorrectAnswer(key) {
  state.stats.countryCorrect[key] = (state.stats.countryCorrect[key] || 0) + 1;
  saveStats();
}

export function trackWrongAnswer(key) {
  state.stats.countryErrors[key] = (state.stats.countryErrors[key] || 0) + 1;
  saveStats();
}

export function trackCountryExplored(key) {
  if (!state.stats.exploredCountries.includes(key)) {
    state.stats.exploredCountries.push(key);
    saveStats();
    checkAchievements();
  }
}

export function trackGameEnd(score, total, level, isBlitz) {
  state.stats.gamesPlayed++;
  if (score === total) {
    state.stats.perfectGames++;
    if (isBlitz) state.stats.blitzPerfect++;
    if (level !== 'world') {
      state.stats.continentsPerfected = state.stats.continentsPerfected || {};
      state.stats.continentsPerfected[level] = true;
    }
  }
  saveStats();
  checkAchievements();
}

export function getWeakCountries(limit = 8) {
  const items = [];
  for (const key of Object.keys(state.stats.countryErrors)) {
    const errors = state.stats.countryErrors[key];
    const correct = state.stats.countryCorrect[key] || 0;
    const total = errors + correct;
    if (total > 0 && errors > 0) {
      items.push({ key, errors, correct, total, percent: errors / total });
    }
  }
  items.sort((a, b) => b.percent - a.percent || b.errors - a.errors);
  return items.slice(0, limit);
}

export function checkAchievements() {
  const newlyUnlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (!state.unlockedAchievements.has(a.id) && a.check(state.stats, state.unlockedAchievements)) {
      state.unlockedAchievements.add(a.id);
      newlyUnlocked.push(a);
    }
  }
  if (newlyUnlocked.length) {
    saveAchievements();
    newlyUnlocked.forEach((a, i) => {
      setTimeout(() => {
        playAchievementSound();
        emit('toast', { icon: a.icon, title: `Ачивка: ${a.name}`, desc: a.desc });
      }, i * 700);
    });
  }
}

export function getCurrentMasteryLevel() {
  const games = state.stats.gamesPlayed;
  for (let i = MASTERY_LEVELS.length - 1; i >= 0; i--) {
    if (games >= MASTERY_LEVELS[i].minGames) {
      return { ...MASTERY_LEVELS[i], index: i };
    }
  }
  return MASTERY_LEVELS[0];
}

/* ============================================================
   4. AUDIO
   ============================================================ */
let audioContext = null;

export function initAudio() {
  if (!audioContext) {
    try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
  }
  if (audioContext?.state === 'suspended') audioContext.resume();
}

function playTone(frequency, duration, type = 'sine', volume = 0.08, delay = 0) {
  if (!state.soundEnabled || !audioContext) return;
  const t0 = audioContext.currentTime + delay;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(audioContext.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export const playCorrectSound = () => {
  playTone(523, 0.1, 'sine', 0.06);
  playTone(659, 0.1, 'sine', 0.06, 0.07);
  playTone(784, 0.15, 'sine', 0.08, 0.14);
};
export const playWrongSound = () => {
  playTone(233, 0.2, 'triangle', 0.03);
  playTone(207, 0.25, 'triangle', 0.03, 0.08);
};
export const playClickSound = () => playTone(880, 0.03, 'square', 0.015);
export const playAchievementSound = () =>
  [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.15, 'triangle', 0.07, i * 0.09));
export const playRecordSound = () =>
  [659, 784, 1047, 1319].forEach((f, i) => playTone(f, 0.18, 'sine', 0.08, i * 0.1));
export const playStreakSound = () => {
  playTone(880, 0.08, 'sine', 0.05);
  playTone(1100, 0.12, 'sine', 0.06, 0.06);
};

export function toggleSound() {
  setState({ soundEnabled: !state.soundEnabled });
  saveToStorage(STORAGE_KEYS.sound, state.soundEnabled);
  if (state.soundEnabled) { initAudio(); playClickSound(); }
  emit('sound:changed', state.soundEnabled);
}

/* ============================================================
   5. THEME
   ============================================================ */
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = THEME_ICONS[theme] || '🌙';
  updateOceanColors();
  emit('theme:changed', theme);
}

export function cycleTheme() {
  playClickSound();
  const next = THEMES[(THEMES.indexOf(state.theme) + 1) % THEMES.length];
  setState({ theme: next });
  saveToStorage(STORAGE_KEYS.theme, next);
  applyTheme(next);
}

function updateOceanColors() {
  const style = getComputedStyle(document.documentElement);
  const c1 = style.getPropertyValue('--ocean-1').trim();
  const c2 = style.getPropertyValue('--ocean-2').trim();
  const el1 = document.querySelector('.ocean-stop-1');
  const el2 = document.querySelector('.ocean-stop-2');
  if (el1) el1.setAttribute('stop-color', c1);
  if (el2) el2.setAttribute('stop-color', c2);
}

/* ============================================================
   6. UTILS
   ============================================================ */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function vibrate(duration = 30) {
  try { navigator.vibrate?.(duration); } catch (_) {}
}

export function getFeatureKey(feature) {
  const id = String(feature.id ?? '');
  if (!id) return null;
  if (id.startsWith('-')) return null;  // спорные регионы пропускаем
  return id.padStart(3, '0');
}

export function getFlagEmoji(code) {
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  );
}

export function getFlagImage(code, className = 'flag-wrap') {
  return `<div class="${className}">
    <img src="https://flagcdn.com/w320/${code}.png" alt=""
         onerror="this.outerHTML='<div class=q-emoji>${getFlagEmoji(code)}</div>'">
  </div>`;
}

// Нечёткое сравнение
export function normalizeAnswer(str) {
  return String(str)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\s\-–—.,'"`()]/g, '')
    .replace(/й/g, 'и')
    .trim();
}

export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function isAnswerCorrect(userInput, country) {
  const user = normalizeAnswer(userInput);
  if (!user) return false;
  const targets = [normalizeAnswer(country.name), normalizeAnswer(country.capital)];
  for (const t of targets) {
    if (!t) continue;
    if (t === user) return true;
    const maxDist = t.length <= 5 ? 1 : 2;
    if (levenshtein(t, user) <= maxDist) return true;
    if (t.length >= 6 && user.length >= 4 && t.includes(user)) return true;
  }
  return false;
}

export function getCountryPoolForLevel(level, featureByKey) {
  return Object.keys(COUNTRIES_DB).filter(key =>
    featureByKey[key] && (level === 'world' || COUNTRIES_DB[key].level === level)
  );
}

export function getRecords() {
  return loadFromStorage(STORAGE_KEYS.records, {});
}
export function saveRecords(records) {
  saveToStorage(STORAGE_KEYS.records, records);
}
