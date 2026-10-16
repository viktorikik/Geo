// src/main.js — точка входа
import {
  state, on, emit, loadStats, loadAchievements, loadRecords,
  setTheme, saveStats, checkAchievements, initAudio,
  sfx, currentMastery, loadFromStorage
} from './core.js';
import { STORAGE_KEYS } from './config.js';
import { initUI } from './ui.js';
import { initMap, loadGeoData, bindMapClick, flashFeature, refreshKnown } from './map.js';
import { initQuiz } from './quiz.js';
import { initScreens, showOnboardingIfNeeded, handleMode } from './screens.js';

// ---------- Динамическая загрузка d3 / topojson ----------
const D3_SOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js',
  'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js',
  'https://fastly.jsdelivr.net/npm/d3@7/dist/d3.min.js',
  'https://unpkg.com/d3@7/dist/d3.min.js'
];

const TOPOJSON_SOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/topojson-client/3.1.0/topojson-client.min.js',
  'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js',
  'https://fastly.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js',
  'https://unpkg.com/topojson-client@3/dist/topojson-client.min.js'
];

function loadScriptOnce(url, timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      s.onload = s.onerror = null;
      try { s.remove(); } catch (_) {}
      reject(new Error('timeout: ' + url));
    }, timeoutMs);
    s.onload = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(url);
    };
    s.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { s.remove(); } catch (_) {}
      reject(new Error('error: ' + url));
    };
    document.head.appendChild(s);
  });
}

async function ensureLib(globalName, sources) {
  if (typeof window[globalName] !== 'undefined') {
    return true;
  }
  for (const url of sources) {
    try {
      setBootStatus(`Загрузка ${globalName}…`);
      await loadScriptOnce(url);
      if (typeof window[globalName] !== 'undefined') {
        console.log(`[GeoMaster] ${globalName} loaded: ${url}`);
        return true;
      }
    } catch (e) {
      console.warn(`[GeoMaster] ${globalName} fail: ${url}`, e.message);
    }
  }
  return false;
}

// ---------- Видимые баннеры (т.к. пользователь не видит консоль) ----------
function setBootStatus(text) {
  let el = document.getElementById('boot-status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'boot-status';
    el.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);' +
      'font-size:11px;color:#94a3b8;background:rgba(0,0,0,0.7);padding:5px 12px;' +
      'border-radius:999px;z-index:200;pointer-events:none;backdrop-filter:blur(8px);';
    document.body.appendChild(el);
  }
  if (text) {
    el.textContent = text;
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

function showErrorBanner(html) {
  const existing = document.getElementById('gm-error-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'gm-error-banner';
  banner.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;max-width:480px;' +
    'margin:0 auto;padding:14px 16px;border-radius:14px;' +
    'background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.5);' +
    'color:#fff;font-size:13px;line-height:1.5;z-index:300;' +
    'box-shadow:0 8px 32px rgba(0,0,0,0.5);backdrop-filter:blur(12px);';
  banner.innerHTML = html;
  document.body.appendChild(banner);
  return banner;
}

// ---------- Инициализация ----------
function bootstrapStorage() {
  const theme = loadFromStorage(STORAGE_KEYS.theme, 'dark');
  setTheme(theme);
  const themeIcon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🎨';
  const tt = document.getElementById('theme-toggle');
  if (tt) tt.textContent = themeIcon;

  const snd = loadFromStorage(STORAGE_KEYS.sound, true);
  state.soundEnabled = snd !== false;
  const st = document.getElementById('sound-toggle');
  if (st) st.textContent = state.soundEnabled ? '🔊' : '🔇';

  loadStats();
  loadAchievements();
  loadRecords();
}

async function init() {
  try {
    // ===== 1. Мгновенно оживляем UI =====
    bootstrapStorage();
    initUI();
    initScreens();   // ← кнопки Карта/Викторина/Учить, звук/тема/поиск — вешаются ЗДЕСЬ
    initQuiz();      // ← quiz.js не зависит от d3

    // Первое действие пользователя — инициализация аудио
    const onceInitAudio = () => {
      initAudio();
      document.removeEventListener('pointerdown', onceInitAudio);
      document.removeEventListener('keydown', onceInitAudio);
    };
    document.addEventListener('pointerdown', onceInitAudio);
    document.addEventListener('keydown', onceInitAudio);

    // Горячие клавиши карты
    document.addEventListener('keydown', (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '+' || e.key === '=') emit('map:zoom', 'in');
      else if (e.key === '-' || e.key === '_') emit('map:zoom', 'out');
      else if (e.key === 'Home' || e.key.toLowerCase() === 'r') emit('map:zoom', 'reset');
    });

    // ===== 2. Грузим библиотеки карты =====
    setBootStatus('Загрузка библиотек…');
    const [hasD3, hasTopo] = await Promise.all([
      ensureLib('d3', D3_SOURCES),
      ensureLib('topojson', TOPOJSON_SOURCES)
    ]);

    // ===== 3. Инициализируем карту =====
    if (hasD3 && hasTopo) {
      setBootStatus('Загрузка карты…');
      try {
        initMap();
        await loadGeoData();
        bindMapClick();
        refreshKnown();

        // Связка map ↔ quiz
        on('quiz:feedback', ({ correct, correctId, clickedId }) => {
          if (clickedId) flashFeature(clickedId, correct ? 'correct' : 'wrong');
          if (!correct) flashFeature(correctId, 'correct');
        });
        on('stats:changed', () => refreshKnown());

        setBootStatus('');
      } catch (e) {
        console.error('[GeoMaster] Map init failed:', e);
        setBootStatus('');
        showErrorBanner(
          '<b>⚠️ Карта не загрузилась</b><br>' +
          'Причина: ' + (e.message || e) + '<br><br>' +
          'Кнопки викторины работают — можно играть без карты. ' +
          'Но для полной работы проверьте доступ к CDN.'
        );
      }
    } else {
      // Библиотеки не загрузились ни с одного CDN
      setBootStatus('');
      showErrorBanner(
        '<b>⚠️ Библиотеки карты (d3/topojson) недоступны</b><br>' +
        'Скорее всего, ваш провайдер блокирует внешние CDN. ' +
        'Кнопки викторины работают, но карта недоступна.<br><br>' +
        '<b>Решение:</b> скачайте <code>d3.min.js</code> и <code>topojson-client.min.js</code> ' +
        'и положите рядом с <code>index.html</code>, затем в <code>index.html</code> ' +
        'подключите их как <code>&lt;script src="d3.min.js"&gt;&lt;/script&gt;</code>.'
      );
    }

    // ===== 4. Роутинг =====
    handleMode('explore');
    state.ready = true;
    showOnboardingIfNeeded();
  } catch (e) {
    console.error('[GeoMaster] Critical init error:', e);
    showErrorBanner(
      '<b>⚠️ Ошибка инициализации</b><br>' +
      (e && e.message ? e.message : String(e))
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
