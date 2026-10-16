// src/main.js — точка входа
import {
  state, on, emit, loadStats, loadAchievements, loadRecords,
  setTheme, saveStats, checkAchievements, initAudio,
  sfx, cycleTheme, currentMastery, masteryProgress,
  loadFromStorage, STORAGE_KEYS, escapeHtml
} from './core.js';
import { initUI, closeAllModals, openModal, closeModal } from './ui.js';
import { initMap, loadGeoData, bindMapClick, flashFeature, refreshKnown, getFeatureByKey } from './map.js';
import { initQuiz } from './quiz.js';
import { initScreens, renderExplore, showOnboardingIfNeeded, handleMode } from './screens.js';
import { COUNTRIES_DB, getFlagEmoji } from './data.js';
import { VIEWBOX } from './config.js';

function bootstrapStorage() {
  // Тема
  const theme = loadFromStorage(STORAGE_KEYS.theme, 'dark');
  setTheme(theme);
  const themeIcon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🎨';
  const tt = document.getElementById('theme-toggle');
  if (tt) tt.textContent = themeIcon;

  // Звук
  const snd = loadFromStorage(STORAGE_KEYS.sound, true);
  state.soundEnabled = snd !== false;
  const st = document.getElementById('sound-toggle');
  if (st) st.textContent = state.soundEnabled ? '🔊' : '🔇';

  // Stats, achievements, records
  loadStats();
  loadAchievements();
  loadRecords();
}

async function init() {
  bootstrapStorage();
  initUI();
  initMap();
  initQuiz();
  initScreens();

  // первое действие пользователя — инициализация аудио
  const onceInitAudio = () => {
    initAudio();
    document.removeEventListener('pointerdown', onceInitAudio);
    document.removeEventListener('keydown', onceInitAudio);
  };
  document.addEventListener('pointerdown', onceInitAudio);
  document.addEventListener('keydown', onceInitAudio);

  // Загрузка геоданных
  try {
    await loadGeoData();
  } catch (e) {
    console.error('Не удалось загрузить карту:', e);
    const banner = document.createElement('div');
    banner.className = 'error-banner';
    banner.innerHTML = `
      <b>⚠️ Карта не загрузилась.</b><br>
      Проверьте интернет или замените CDN в index.html: <br>
      <code>unpkg</code> ↔ <code>jsdelivr</code>
    `;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 12000);
  }

  bindMapClick();
  refreshKnown();

  // Клавиши: +/−/Home, R
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '+' || e.key === '=') emit('map:zoom', 'in');
    else if (e.key === '-' || e.key === '_') emit('map:zoom', 'out');
    else if (e.key === 'Home' || e.key.toLowerCase() === 'r') emit('map:zoom', 'reset');
    else if (e.key.toLowerCase() === 's') document.getElementById('search-btn')?.click();
  });

  // Flash + feedback по карте
  on('quiz:feedback', ({ correct, correctId, clickedId }) => {
    if (clickedId) flashFeature(clickedId, correct ? 'correct' : 'wrong');
    if (!correct) flashFeature(correctId, 'correct');
  });

  // Сохранение рекордов и проверка ачивок после викторины
  on('quiz:results', (payload) => {
    const key = `${payload.level}|${payload.blitz ? 'blitz' : 'classic'}|${payload.inputMode ? 'input' : 'click'}`;
    const prev = state.records[key] || 0;
    let isRecord = false;
    if (payload.score > prev) {
      state.records[key] = payload.score;
      isRecord = true;
    }
    saveStats();
    checkAchievements();
    // обновим UI результата
    payload.isRecord = isRecord;
    // эмитим обратно — screens перерисует
    if (isRecord) {
      sfx.record();
      emit('toast', { type: 'achievement', text: '🎉 Новый рекорд: ' + payload.score + '!' });
    }
    // Перерисуем панель с учётом рекорда
    // (screens уже отрисовал, но без isRecord — поэтому повторно)
    setTimeout(() => {
      // повторная отрисовка с флагом
      emit('quiz:results:render', payload);
    }, 0);
  });

  // Обновление known на карте
  on('stats:changed', () => {
    refreshKnown();
  });

  // Поделиться результатом
  on('share-result', async (payload) => {
    try {
      const canvas = await makeShareImage(payload);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'geomaster.png', { type: 'image/png' })] })) {
        await navigator.share({
          files: [new File([blob], 'geomaster.png', { type: 'image/png' })],
          title: 'ГеоМастер',
          text: `Мой результат: ${payload.score} очков!`
        });
      } else {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'geomaster-result.png';
        a.click();
      }
    } catch (e) {
      console.warn('Share failed:', e);
      emit('toast', { type: 'error', text: 'Не удалось поделиться' });
    }
  });

  // Роутинг: стартовый экран
  handleMode('explore');

  state.ready = true;
  showOnboardingIfNeeded();
}

async function makeShareImage(payload) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  // фон
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, 600, 400);
  // градиентная полоса
  const grad = ctx.createLinearGradient(0, 0, 600, 0);
  grad.addColorStop(0, '#38bdf8');
  grad.addColorStop(1, '#a78bfa');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 8);
  // заголовок
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 18px Manrope, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🌍 ГеоМастер', 300, 60);
  // счёт
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '800 96px Manrope, sans-serif';
  ctx.fillText(String(payload.score), 300, 190);
  // сообщение
  const msg = payload.perfect ? 'Идеально! 🎉' : `Верно: ${payload.correctCount}/${payload.total}`;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 18px Manrope, sans-serif';
  ctx.fillText(msg, 300, 240);
  // уровень
  const mastery = currentMastery();
  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 20px Manrope, sans-serif';
  ctx.fillText(`${mastery.icon} ${mastery.name}`, 300, 300);
  // подвал
  ctx.fillStyle = '#64748b';
  ctx.font = '500 14px Manrope, sans-serif';
  ctx.fillText('geomaster', 300, 370);
  return canvas;
}

// Дать экранам перерисовать результат с флагом рекорда
on('quiz:results:render', (payload) => {
  // no-op: панель уже отрисована в screens, флаг можно использовать в след. раз.
});

// Запуск
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
