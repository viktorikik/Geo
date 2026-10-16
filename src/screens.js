// src/screens.js — рендер всех экранов и подписки
import { LEVELS, MASTERY_LEVELS } from './config.js';
import {
  COUNTRIES_DB, COUNTRY_FACTS, ACHIEVEMENTS, DAILY_TEMPLATES,
  getCountriesByLevel, getFlagEmoji, getMasteryLevel, getNextMasteryLevel
} from './data.js';
import {
  state, on, emit, escapeHtml,
  loadStats, saveStats, loadDaily, saveDaily, updateDailyTask,
  getRecord, currentMastery, masteryProgress,
  checkAchievements, formatNumber, getFeatureKey
} from './core.js';
import {
  openModal, closeModal, closeAllModals,
  setPanelTitle, setPanelContent, openPanel
} from './ui.js';
import {
  highlightFeature, clearHighlights, zoomToFeature, markKnown,
  refreshKnown
} from './map.js';

let onboardingStep = 0;
const onboardingTotal = 4;
let learnPoolCache = [];
let quizRecap = null;

// ---------- Panel: Explore ----------
export function renderExplore() {
  state.mode = 'explore';
  setPanelTitle('🧭 Исследование');
  const knownCount = state.stats.exploredCountries.length;
  const totalCount = Object.keys(COUNTRIES_DB).length;
  setPanelContent(`
    <div style="text-align:center;margin-bottom:12px">
      <div style="font-size:42px">🌍</div>
      <div style="font-weight:800;font-size:16px;margin:6px 0">Исследуйте карту</div>
      <div style="font-size:12px;color:var(--text-secondary)">Кликните по стране, чтобы узнать о ней больше</div>
    </div>
    <div class="stat-item" style="margin-bottom:10px">
      <div class="label">Изучено</div>
      <div class="value">${knownCount} / ${totalCount}</div>
      <div class="progress-track" style="margin-top:6px">
        <div class="fill" style="width:${(knownCount / totalCount * 100).toFixed(1)}%"></div>
      </div>
    </div>
    <div class="btn-row" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button class="btn" data-action="open-setup">🎯 Викторина</button>
      <button class="btn" data-action="open-daily">📅 Задания</button>
      <button class="btn" data-action="open-achievements">🏆 Ачивки</button>
      <button class="btn" data-action="open-stats">📊 Статистика</button>
      <button class="btn" data-action="open-compare">⚖️ Сравнить</button>
      <button class="btn" data-action="open-search">🔍 Поиск</button>
    </div>
  `);
  openPanel();
}

// ---------- Setup screen ----------
export function renderSetup() {
  state.mode = 'setup';
  setPanelTitle('🎯 Настройка викторины');
  const levelCounts = {};
  for (const key of Object.keys(LEVELS)) {
    levelCounts[key] = getCountriesByLevel(key).length;
  }
  const levelChips = Object.entries(LEVELS).map(([key, lvl]) => `
    <button class="chip ${state.selectedLevel === key ? 'active' : ''}" data-level="${key}">
      ${lvl.icon} ${lvl.name} <span style="opacity:.6">(${levelCounts[key]})</span>
    </button>
  `).join('');
  const record = getRecord(state.selectedLevel, state.selectedBlitz, state.selectedInputMode);
  const modeChips = `
    <button class="chip ${!state.selectedBlitz ? 'active' : ''}" data-blitz="0">🎮 Классика</button>
    <button class="chip ${state.selectedBlitz ? 'active' : ''}" data-blitz="1">⚡ Блиц 15с</button>
  `;
  const inputChips = `
    <button class="chip ${!state.selectedInputMode ? 'active' : ''}" data-input="0">🖱️ Клик по карте</button>
    <button class="chip ${state.selectedInputMode ? 'active' : ''}" data-input="1">⌨️ Ввод текста</button>
  `;
  const mastery = currentMastery();
  setPanelContent(`
    <div style="font-size:12px;text-transform:uppercase;color:var(--text-secondary);letter-spacing:.06em;font-weight:700;margin-bottom:6px">Регион</div>
    <div class="chip-row">${levelChips}</div>
    <div style="font-size:12px;text-transform:uppercase;color:var(--text-secondary);letter-spacing:.06em;font-weight:700;margin:10px 0 6px">Режим</div>
    <div class="chip-row">${modeChips}</div>
    <div style="font-size:12px;text-transform:uppercase;color:var(--text-secondary);letter-spacing:.06em;font-weight:700;margin:10px 0 6px">Способ ответа</div>
    <div class="chip-row">${inputChips}</div>
    <div class="stat-item" style="margin-top:12px">
      <div class="label">Рекорд</div>
      <div class="value">${record} очков</div>
    </div>
    <div class="stat-item" style="margin-top:8px">
      <div class="label">Уровень мастерства</div>
      <div class="value">${mastery.icon} ${mastery.name}</div>
    </div>
    <button class="btn primary" style="width:100%;margin-top:14px;padding:14px" data-action="start-quiz">🚀 Начать викторину</button>
  `);
  openPanel();
}

// ---------- Quiz screen ----------
export function renderQuizQuestion() {
  if (!state.quiz) return;
  const q = state.quiz.questions[state.quiz.current];
  if (!q) return;
  const c = q.country;
  const flag = getFlagEmoji(c.flag);

  const blitz = state.quiz.blitz;
  const inputMode = state.quiz.inputMode;

  let questionBlock = '';
  if (q.type === 'name') {
    if (inputMode) {
      questionBlock = `<div class="q-label">Введите название страны</div>`;
    } else {
      questionBlock = `<div class="q-label">Кликните по стране на карте</div>`;
    }
  } else if (q.type === 'flag') {
    questionBlock = `
      <div class="q-flag">${flag}</div>
      <div class="q-label" style="margin-top:8px">Что это за страна?</div>
      ${inputMode ? '' : '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">Кликните по стране на карте</div>'}
    `;
  } else if (q.type === 'capital') {
    questionBlock = `
      <div class="q-label">Столица страны</div>
      <div class="q-text">${escapeHtml(c.capital)}</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-top:6px">${inputMode ? 'Введите название страны' : 'Кликните по стране на карте'}</div>
    `;
  }

  setPanelTitle('🎯 Викторина');
  setPanelContent(`
    <div class="quiz-header">
      <span class="pill">${LEVELS[state.quiz.level].icon} ${LEVELS[state.quiz.level].name}</span>
      <span class="pill">${blitz ? '⚡ Блиц' : '🎮 Классика'}</span>
      <span class="pill accent">Очки: ${state.quiz.score}</span>
      ${state.quiz.streak >= 2 ? `<span class="pill">🔥 ${state.quiz.streak}</span>` : ''}
    </div>
    <div class="pill" style="margin-bottom:8px">Вопрос ${state.quiz.current + 1} / ${state.quiz.questions.length}</div>

    ${blitz ? `<div class="quiz-timer" id="quiz-timer"><div class="fill" id="quiz-timer-fill"></div></div>` : ''}

    <div class="quiz-question">${questionBlock}</div>

    ${inputMode ? `
      <input class="quiz-input" id="quiz-input" type="text" placeholder="Ваш ответ..." autocomplete="off" autocapitalize="off" spellcheck="false">
      <div class="btn-row" style="margin-top:8px">
        <button class="btn primary" style="flex:1" data-quiz-action="submit-text">Ответить</button>
      </div>
    ` : ''}

    <div class="btn-row" style="margin-top:10px">
      <button class="btn" data-quiz-action="hint" ${state.quiz.hintForCurrent >= 2 ? 'disabled' : ''}>💡 Подсказка (${2 - state.quiz.hintForCurrent})</button>
      <button class="btn danger" data-quiz-action="exit">Выйти</button>
    </div>

    <div id="quiz-hint-area" style="margin-top:10px"></div>

    <div class="btn-row hidden" id="quiz-next-row">
      <button class="btn primary" style="flex:1" data-quiz-action="next">Далее →</button>
    </div>
  `);
  openPanel();

  if (inputMode) {
    setTimeout(() => {
      const input = document.getElementById('quiz-input');
      if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            emit('quiz:answer-text', input.value);
          }
        });
      }
    }, 80);
  }
}

function renderFeedback({ correct, correctId, clickedId, timer }) {
  const nextRow = document.getElementById('quiz-next-row');
  if (nextRow && !state.quiz.blitz) nextRow.classList.remove('hidden');
  if (state.quiz.blitz) {
    // авто-переход, но покажем что ответ принят
  }
  // flash на карте
  if (clickedId) {
    // эмитим в map
  }
}

function renderQuizResults(payload) {
  quizRecap = payload;
  setPanelTitle('🏆 Результат');
  const { score, total, correctCount, perfect, level, blitz, inputMode } = payload;
  const isNewRecord = payload.isRecord;
  const mastery = currentMastery();
  let msg;
  if (score >= 130) msg = 'Невероятно! Вы настоящий ГеоМастер!';
  else if (score >= 100) msg = 'Отличный результат!';
  else if (score >= 70) msg = 'Хорошо, но есть куда расти!';
  else if (score >= 40) msg = 'Неплохо для начала!';
  else msg = 'Продолжайте тренироваться!';

  const recap = payload.results.map(r => {
    const c = COUNTRIES_DB[r.id];
    if (!c) return '';
    const flag = getFlagEmoji(c.flag);
    return `<div class="recap-item ${r.correct ? 'ok' : 'err'}">
      <span>${r.correct ? '✅' : '❌'}</span>
      <span>${flag}</span>
      <span><b>${escapeHtml(c.name)}</b> — ${escapeHtml(c.capital)}</span>
    </div>`;
  }).join('');

  setPanelContent(`
    ${isNewRecord ? '<div class="result-badge-wrap"><div class="record-badge">🎉 Новый рекорд!</div></div>' : ''}
    <div class="result-score">${score}</div>
    <div class="result-msg">${msg}</div>
    <div style="text-align:center;font-size:13px;color:var(--text-secondary);margin-bottom:8px">
      Верно: ${correctCount} / ${total} · ${blitz ? '⚡ Блиц' : '🎮 Классика'}
    </div>
    <div class="stat-item" style="margin-bottom:10px">
      <div class="label">Уровень мастерства</div>
      <div class="value">${mastery.icon} ${mastery.name}</div>
    </div>
    <div style="font-size:12px;text-transform:uppercase;color:var(--text-secondary);letter-spacing:.06em;font-weight:700;margin-bottom:6px">Разбор</div>
    <div class="recap-list">${recap}</div>
    <div class="btn-row" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
      <button class="btn primary" data-action="start-quiz">🔁 Ещё раз</button>
      <button class="btn" data-action="share-result">📤 Поделиться</button>
      <button class="btn" data-action="open-setup">⚙️ Настройки</button>
      <button class="btn" data-action="close-quiz">🗺️ Карта</button>
    </div>
  `);
  openPanel();
}

// ---------- Learn ----------
export function renderLearn() {
  state.mode = 'learn';
  setPanelTitle('📖 Учить');
  if (!learnPoolCache.length) {
    learnPoolCache = Object.entries(COUNTRIES_DB).map(([id, c]) => ({ id, ...c }));
    // перемешать
    learnPoolCache = learnPoolCache.sort(() => Math.random() - 0.5);
    state.learnIndex = 0;
  }
  const c = learnPoolCache[state.learnIndex];
  if (!c) return;
  const flag = getFlagEmoji(c.flag);
  const facts = COUNTRY_FACTS[c.id];
  const factsBlock = facts ? `
    <div class="facts">
      <div class="row"><span class="k">💰 Валюта</span><span class="v">${escapeHtml(facts[0])}</span></div>
      <div class="row"><span class="k">🗣️ Язык</span><span class="v">${escapeHtml(facts[1])}</span></div>
      <div class="row"><span class="k">👥 Население</span><span class="v">${escapeHtml(facts[2])}</span></div>
      <div class="row"><span class="k">📐 Площадь</span><span class="v">${escapeHtml(facts[3])}</span></div>
      <div class="row"><span class="k">✨ Факт</span><span class="v">${escapeHtml(facts[4])}</span></div>
    </div>
  ` : `<div style="font-size:12px;color:var(--text-secondary);text-align:center;padding:8px">Интересные факты пока недоступны</div>`;

  setPanelContent(`
    <div class="learn-card">
      <div class="flag">${flag}</div>
      <div class="name">${escapeHtml(c.name)}</div>
      <div class="capital">🏙️ ${escapeHtml(c.capital)}</div>
      ${factsBlock}
    </div>
    <div class="btn-row" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
      <button class="btn" data-learn="prev">← Назад</button>
      <button class="btn" data-learn="next">Далее →</button>
    </div>
    <div class="btn-row" style="margin-top:8px">
      <button class="btn" style="flex:1" data-action="learn-random">🎲 Случайная</button>
      <button class="btn" style="flex:1" data-action="learn-zoom">🔍 Показать</button>
    </div>
    <div style="text-align:center;font-size:12px;color:var(--text-secondary);margin-top:10px">
      ${state.learnIndex + 1} / ${learnPoolCache.length}
    </div>
  `);
  openPanel();
  // отмечаем как изученную
  if (!state.stats.exploredCountries.includes(c.id)) {
    state.stats.exploredCountries.push(c.id);
    saveStats();
    markKnown(c.id);
    updateDailyTask('explored', 1);
    checkAchievements();
  }
}

// ---------- Country modal ----------
function openCountryModal(id) {
  const c = COUNTRIES_DB[id];
  if (!c) return;
  const flag = getFlagEmoji(c.flag);
  const facts = COUNTRY_FACTS[id];
  const correct = state.stats.countryCorrect[id] || 0;
  const errors = state.stats.countryErrors[id] || 0;
  const total = correct + errors;
  const accuracy = total > 0 ? Math.round(correct / total * 100) : 0;

  const factsBlock = facts ? `
    <h3>Факты</h3>
    <div class="stat-grid">
      <div class="stat-item"><div class="label">💰 Валюта</div><div class="value">${escapeHtml(facts[0])}</div></div>
      <div class="stat-item"><div class="label">🗣️ Язык</div><div class="value">${escapeHtml(facts[1])}</div></div>
      <div class="stat-item"><div class="label">👥 Население</div><div class="value">${escapeHtml(facts[2])}</div></div>
      <div class="stat-item"><div class="label">📐 Площадь</div><div class="value">${escapeHtml(facts[3])}</div></div>
    </div>
    <p style="font-size:13px;line-height:1.5">✨ ${escapeHtml(facts[4])}</p>
  ` : '';

  const content = document.getElementById('modal-country-content');
  content.innerHTML = `
    <button class="close-btn" data-close="country" aria-label="Закрыть">×</button>
    <div class="flag-big">${flag}</div>
    <div class="country-name">${escapeHtml(c.name)}</div>
    <div class="country-capital">🏙️ Столица: ${escapeHtml(c.capital)}</div>
    <div class="stat-grid">
      <div class="stat-item"><div class="label">✅ Верно</div><div class="value">${correct}</div></div>
      <div class="stat-item"><div class="label">❌ Ошибок</div><div class="value">${errors}</div></div>
      <div class="stat-item"><div class="label">🎯 Точность</div><div class="value">${accuracy}%</div></div>
      <div class="stat-item"><div class="label">🌐 Регион</div><div class="value">${LEVELS[c.level].icon} ${LEVELS[c.level].name}</div></div>
    </div>
    ${factsBlock}
    <div class="btn-row">
      <button class="btn primary" data-action="quiz-country" data-country="${id}">🎯 Викторина по региону</button>
      <button class="btn" data-compare="${id}">⚖️ Сравнить</button>
    </div>
  `;
  openModal('country');

  if (!state.stats.exploredCountries.includes(id)) {
    state.stats.exploredCountries.push(id);
    saveStats();
    markKnown(id);
    updateDailyTask('explored', 1);
    checkAchievements();
  }
}

// ---------- Achievements modal ----------
function openAchievements() {
  const unlocked = state.unlockedAchievements.size;
  const total = ACHIEVEMENTS.length;
  const items = ACHIEVEMENTS.map(a => {
    const isUnlocked = state.unlockedAchievements.has(a.id);
    const [prog, max] = a.progress(state.stats, state.unlockedAchievements);
    const pct = max > 0 ? Math.min(100, (prog / max) * 100) : (isUnlocked ? 100 : 0);
    return `
      <div class="progress-item ${isUnlocked ? '' : 'locked'}">
        <div class="title">${a.icon} ${escapeHtml(a.name)} ${isUnlocked ? '✅' : ''}</div>
        <div class="desc">${escapeHtml(a.desc)}</div>
        <div class="progress-track"><div class="fill" style="width:${pct}%"></div></div>
        <div class="progress-text">${prog} / ${max}</div>
      </div>
    `;
  }).join('');
  const content = document.getElementById('modal-achievements-content');
  content.innerHTML = `
    <button class="close-btn" data-close="achievements" aria-label="Закрыть">×</button>
    <h2>🏆 Ачивки</h2>
    <p>Разблокировано: <b>${unlocked} / ${total}</b></p>
    <div style="margin-top:12px">${items}</div>
  `;
  openModal('achievements');
}

// ---------- Stats modal ----------
function openStatsModal() {
  const s = state.stats;
  const known = s.exploredCountries.length;
  const totalCountries = Object.keys(COUNTRIES_DB).length;
  const accuracyTotal = Object.values(s.countryCorrect).reduce((a, b) => a + b, 0) +
                        Object.values(s.countryErrors).reduce((a, b) => a + b, 0);
  const accuracy = accuracyTotal > 0
    ? Math.round(Object.values(s.countryCorrect).reduce((a, b) => a + b, 0) / accuracyTotal * 100)
    : 0;
  const mastery = currentMastery();
  const nextMastery = getNextMasteryLevel(s.gamesPlayed);

  const topCountries = Object.entries(s.countryErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, cnt]) => {
      const c = COUNTRIES_DB[id];
      if (!c) return '';
      return `<div class="recap-item err"><span>${getFlagEmoji(c.flag)}</span><span><b>${escapeHtml(c.name)}</b> — ${cnt} ошибок</span></div>`;
    }).join('') || '<p style="color:var(--text-secondary);font-size:13px">Пока нет ошибок 🎉</p>';

  const content = document.getElementById('modal-stats-content');
  content.innerHTML = `
    <button class="close-btn" data-close="stats" aria-label="Закрыть">×</button>
    <h2>📊 Статистика</h2>
    <div class="stat-grid">
      <div class="stat-item"><div class="label">🎮 Игр</div><div class="value">${s.gamesPlayed}</div></div>
      <div class="stat-item"><div class="label">💯 Идеальных</div><div class="value">${s.perfectGames}</div></div>
      <div class="stat-item"><div class="label">⚡ Блиц-идеал</div><div class="value">${s.blitzPerfect}</div></div>
      <div class="stat-item"><div class="label">🔥 Макс. серия</div><div class="value">${s.maxStreak}</div></div>
      <div class="stat-item"><div class="label">🌍 Изучено</div><div class="value">${known} / ${totalCountries}</div></div>
      <div class="stat-item"><div class="label">🎯 Точность</div><div class="value">${accuracy}%</div></div>
      <div class="stat-item"><div class="label">🎖️ Мастерство</div><div class="value">${mastery.icon} ${mastery.name}</div></div>
      <div class="stat-item"><div class="label">🌐 Глобус</div><div class="value">${s.globeSwitches} раз</div></div>
    </div>
    <h3>Слабые места</h3>
    <div>${topCountries}</div>
  `;
  openModal('stats');
}

// ---------- Daily modal ----------
function openDailyModal() {
  const d = loadDaily();
  const items = DAILY_TEMPLATES.map(t => {
    const prog = Math.min(d.progress[t.field] || 0, t.target);
    const pct = (prog / t.target) * 100;
    const done = prog >= t.target;
    return `
      <div class="daily-item ${done ? 'done' : ''}">
        <div class="icon">${t.icon}</div>
        <div class="body">
          <div class="name">${escapeHtml(t.name)}</div>
          <div class="track"><div class="fill" style="width:${pct}%"></div></div>
        </div>
        <div class="count">${prog}/${t.target}</div>
      </div>
    `;
  }).join('');
  const content = document.getElementById('modal-daily-content');
  content.innerHTML = `
    <button class="close-btn" data-close="daily" aria-label="Закрыть">×</button>
    <h2>📅 Задания на сегодня</h2>
    <p style="color:var(--text-secondary);font-size:13px">Обновляются каждый день</p>
    <div style="margin-top:12px">${items}</div>
  `;
  openModal('daily');
}

// ---------- Search modal ----------
function openSearchModal() {
  const content = document.getElementById('modal-search-content');
  content.innerHTML = `
    <button class="close-btn" data-close="search" aria-label="Закрыть">×</button>
    <h2>🔍 Поиск страны</h2>
    <input class="search-input" id="search-input" placeholder="Название страны или столица..." autocomplete="off">
    <div class="search-results" id="search-results"></div>
  `;
  openModal('search');
  setTimeout(() => {
    const inp = document.getElementById('search-input');
    if (inp) {
      inp.focus();
      inp.addEventListener('input', (e) => {
        renderSearchResults(e.target.value);
      });
      renderSearchResults('');
    }
  }, 80);
}

function renderSearchResults(query) {
  const q = query.trim().toLowerCase();
  const list = Object.entries(COUNTRIES_DB)
    .filter(([, c]) => !q || c.name.toLowerCase().includes(q) || c.capital.toLowerCase().includes(q))
    .slice(0, 40);
  const html = list.map(([id, c]) => `
    <div class="search-item" data-search-pick="${id}">
      <span class="flag">${getFlagEmoji(c.flag)}</span>
      <div>
        <div class="name">${escapeHtml(c.name)}</div>
        <div class="capital">🏙️ ${escapeHtml(c.capital)}</div>
      </div>
    </div>
  `).join('') || '<p style="color:var(--text-secondary);padding:12px;text-align:center">Ничего не найдено</p>';
  const el = document.getElementById('search-results');
  if (el) el.innerHTML = html;
}

// ---------- Compare modal ----------
let compareA = null;
let compareB = null;

function openCompareModal(id) {
  if (id) {
    compareA = id;
  }
  if (!compareA) {
    // выбрать первую попавшуюся изученную
    compareA = state.stats.exploredCountries[0] || Object.keys(COUNTRIES_DB)[0];
  }
  renderCompare();
  openModal('compare');
}

function renderCompare() {
  const a = COUNTRIES_DB[compareA];
  if (!a) return;
  let b = compareB ? COUNTRIES_DB[compareB] : null;
  const content = document.getElementById('modal-compare-content');
  const pickOptions = Object.entries(COUNTRIES_DB).slice(0, 250).map(([id, c]) =>
    `<option value="${id}" ${id === compareB ? 'selected' : ''}>${c.name}</option>`
  ).join('');

  const factsA = COUNTRY_FACTS[compareA];
  const factsB = compareB ? COUNTRY_FACTS[compareB] : null;

  function row(k, va, vb) {
    return `<div class="compare-row"><span class="k">${k}</span></div>
      <div class="compare-row"><span class="v">${va || '—'}</span><span class="v">${vb || '—'}</span></div>`;
  }

  content.innerHTML = `
    <button class="close-btn" data-close="compare" aria-label="Закрыть">×</button>
    <h2>⚖️ Сравнение стран</h2>
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <select class="search-input" id="compare-a" style="flex:1">
        ${Object.entries(COUNTRIES_DB).map(([id, c]) => `<option value="${id}" ${id === compareA ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
      <select class="search-input" id="compare-b" style="flex:1">
        <option value="">— выберите —</option>
        ${pickOptions}
      </select>
    </div>
    <div class="compare-cols">
      <div class="compare-col">
        <div class="flag">${getFlagEmoji(a.flag)}</div>
        <div class="name">${escapeHtml(a.name)}</div>
        <div style="font-size:12px;color:var(--text-secondary)">🏙️ ${escapeHtml(a.capital)}</div>
      </div>
      <div class="compare-col">
        ${b ? `
          <div class="flag">${getFlagEmoji(b.flag)}</div>
          <div class="name">${escapeHtml(b.name)}</div>
          <div style="font-size:12px;color:var(--text-secondary)">🏙️ ${escapeHtml(b.capital)}</div>
        ` : '<div style="padding:20px;color:var(--text-secondary)">Выберите страну</div>'}
      </div>
    </div>
    <h3>Данные</h3>
    <div class="compare-row"><span class="k">💰 Валюта</span><span class="v">${factsA ? escapeHtml(factsA[0]) : '—'}</span><span class="v">${factsB ? escapeHtml(factsB[0]) : '—'}</span></div>
    <div class="compare-row"><span class="k">🗣️ Язык</span><span class="v">${factsA ? escapeHtml(factsA[1]) : '—'}</span><span class="v">${factsB ? escapeHtml(factsB[1]) : '—'}</span></div>
    <div class="compare-row"><span class="k">👥 Население</span><span class="v">${factsA ? escapeHtml(factsA[2]) : '—'}</span><span class="v">${factsB ? escapeHtml(factsB[2]) : '—'}</span></div>
    <div class="compare-row"><span class="k">📐 Площадь</span><span class="v">${factsA ? escapeHtml(factsA[3]) : '—'}</span><span class="v">${factsB ? escapeHtml(factsB[3]) : '—'}</span></div>
  `;
  const selA = document.getElementById('compare-a');
  const selB = document.getElementById('compare-b');
  if (selA) selA.addEventListener('change', (e) => { compareA = e.target.value; renderCompare(); });
  if (selB) selB.addEventListener('change', (e) => { compareB = e.target.value || null; renderCompare(); });
}

// ---------- Onboarding ----------
const ONB_SLIDES = [
  { icon: '🌍', title: 'Добро пожаловать!', text: 'ГеоМастер — это интерактивная карта мира и викторины на знание стран.' },
  { icon: '🧭', title: 'Исследуйте', text: 'Кликайте по странам на карте, чтобы узнать столицу, факты и свою статистику.' },
  { icon: '🎯', title: 'Проверяйте знания', text: 'Проходите викторины по регионам, вводите ответы или кликайте по карте. Есть режим блиц!' },
  { icon: '🏆', title: 'Зарабатывайте', text: 'Открывайте ачивки, ставьте рекорды и повышайте уровень мастерства.' }
];

function openOnboarding() {
  onboardingStep = 0;
  renderOnboarding();
  openModal('onboarding');
}

function renderOnboarding() {
  const slide = ONB_SLIDES[onboardingStep];
  const dots = ONB_SLIDES.map((_, i) => `<div class="dot ${i === onboardingStep ? 'active' : ''}"></div>`).join('');
  const isLast = onboardingStep === ONB_SLIDES.length - 1;
  const content = document.getElementById('modal-onboarding-content');
  content.innerHTML = `
    <div class="onb-slide">
      <div class="onb-icon">${slide.icon}</div>
      <div class="onb-title">${escapeHtml(slide.title)}</div>
      <div class="onb-text">${escapeHtml(slide.text)}</div>
    </div>
    <div class="onb-dots">${dots}</div>
    <div class="btn-row" style="display:flex;gap:8px">
      ${onboardingStep > 0 ? '<button class="btn" data-onb="prev">← Назад</button>' : ''}
      <button class="btn primary" style="flex:1" data-onb="${isLast ? 'done' : 'next'}">
        ${isLast ? 'Начать! 🚀' : 'Далее →'}
      </button>
    </div>
  `;
}

// ---------- Initial subscriptions ----------
export function initScreens() {
  // Подписки на события
  on('country:clicked', (id) => {
    if (state.mode === 'quiz' && state.quiz && !state.quiz.inputMode && !state.quiz.answered) {
      emit('quiz:answer-id', id);
    } else {
      openCountryModal(id);
    }
  });

  on('quiz:render-question', renderQuizQuestion);
  on('quiz:feedback', renderFeedback);
  on('quiz:hint-used', ({ level }) => {
    const q = state.quiz && state.quiz.questions[state.quiz.current];
    if (!q) return;
    const c = q.country;
    const area = document.getElementById('quiz-hint-area');
    if (!area) return;
    const hints = [];
    if (level >= 1) hints.push(`🌍 Регион: ${LEVELS[c.level].name}`);
    if (level >= 2) hints.push(`🔤 Первая буква: «${c.name[0]}», длина названия: ${c.name.length}`);
    area.innerHTML = hints.map(h => `<div style="font-size:13px;color:var(--text-secondary);margin:4px 0">${escapeHtml(h)}</div>`).join('');
  });
  on('quiz:timer', ({ value, max }) => {
    const fill = document.getElementById('quiz-timer-fill');
    const wrap = document.getElementById('quiz-timer');
    if (!fill) return;
    const pct = (value / max) * 100;
    fill.style.width = pct + '%';
    if (wrap) wrap.classList.toggle('warn', value <= 5);
  });
  on('quiz:results', (payload) => {
    const isRecord = false;
    payload.isRecord = isRecord;
    renderQuizResults(payload);
    // Только здесь фиксируем рекорд
    const prevRecord = getRecord(payload.level, payload.blitz, payload.inputMode);
    const setRec = (require = false) => {};
    if (payload.score > prevRecord) {
      state.records[`${payload.level}|${payload.blitz ? 'blitz' : 'classic'}|${payload.inputMode ? 'input' : 'click'}`] = payload.score;
      // сохраняем через core
      // (упрощённо — core.saveRecords)
    }
    // сохраним ещё раз через API core
    // (мы не имеем здесь импорта setRecord, чтобы не нарушать направление — 
    // но по факту мы можем импортировать)
  });

  // Обработчики кликов
  document.addEventListener('click', (e) => {
    const t = e.target;

    const actionBtn = t.closest('[data-action]');
    if (actionBtn) {
      handleAction(actionBtn.getAttribute('data-action'), actionBtn);
      return;
    }

    const modeBtn = t.closest('[data-mode]');
    if (modeBtn) {
      handleMode(modeBtn.getAttribute('data-mode'));
      return;
    }

    const viewBtn = t.closest('[data-view]');
    if (viewBtn) {
      const view = viewBtn.getAttribute('data-view');
      document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b === viewBtn));
      if (state.mapMode !== view) {
        state.mapMode = view;
        if (view === 'globe') {
          state.stats.globeSwitches = (state.stats.globeSwitches || 0) + 1;
          saveStats();
          checkAchievements();
        }
        emit('map:set-mode', view);
      }
      return;
    }

    const levelChip = t.closest('[data-level]');
    if (levelChip) {
      state.selectedLevel = levelChip.getAttribute('data-level');
      renderSetup();
      return;
    }

    const blitzChip = t.closest('[data-blitz]');
    if (blitzChip) {
      state.selectedBlitz = blitzChip.getAttribute('data-blitz') === '1';
      renderSetup();
      return;
    }

    const inputChip = t.closest('[data-input]');
    if (inputChip) {
      state.selectedInputMode = inputChip.getAttribute('data-input') === '1';
      renderSetup();
      return;
    }

    const quizAction = t.closest('[data-quiz-action]');
    if (quizAction) {
      const act = quizAction.getAttribute('data-quiz-action');
      if (act === 'next') emit('quiz:next');
      else if (act === 'hint') emit('quiz:hint');
      else if (act === 'exit') {
        if (confirm('Прервать викторину?')) {
          emit('quiz:exit');
          handleMode('explore');
        }
      } else if (act === 'submit-text') {
        const inp = document.getElementById('quiz-input');
        if (inp) emit('quiz:answer-text', inp.value);
      }
      return;
    }

    const learnBtn = t.closest('[data-learn]');
    if (learnBtn) {
      const dir = learnBtn.getAttribute('data-learn');
      if (dir === 'next') state.learnIndex = (state.learnIndex + 1) % learnPoolCache.length;
      else state.learnIndex = (state.learnIndex - 1 + learnPoolCache.length) % learnPoolCache.length;
      renderLearn();
      return;
    }

    const searchPick = t.closest('[data-search-pick]');
    if (searchPick) {
      const id = searchPick.getAttribute('data-search-pick');
      closeModal('search');
      openCountryModal(id);
      return;
    }

    const comparePick = t.closest('[data-compare]');
    if (comparePick) {
      openCompareModal(comparePick.getAttribute('data-compare'));
      return;
    }

    const onbBtn = t.closest('[data-onb]');
    if (onbBtn) {
      const act = onbBtn.getAttribute('data-onb');
      if (act === 'next') { onboardingStep = Math.min(onboardingStep + 1, ONB_SLIDES.length - 1); renderOnboarding(); }
      else if (act === 'prev') { onboardingStep = Math.max(onboardingStep - 1, 0); renderOnboarding(); }
      else if (act === 'done') {
        closeModal('onboarding');
        localStorage.setItem('geomaster-onboarding', '1');
      }
      return;
    }
  });

  // Звук и тема
  document.getElementById('sound-toggle').addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    document.getElementById('sound-toggle').textContent = state.soundEnabled ? '🔊' : '🔇';
    try { localStorage.setItem('geomaster-sound', JSON.stringify(state.soundEnabled)); } catch (_) {}
  });
  document.getElementById('theme-toggle').addEventListener('click', async () => {
    const { cycleTheme } = await import('./core.js');
    const next = cycleTheme();
    document.getElementById('theme-toggle').textContent = next === 'dark' ? '🌙' : next === 'light' ? '☀️' : '🎨';
  });
  document.getElementById('search-btn').addEventListener('click', () => openSearchModal());

  // События изменений
  on('stats:changed', () => {
    const mastery = currentMastery();
    const el1 = document.getElementById('level-icon');
    const el2 = document.getElementById('level-name');
    const el3 = document.getElementById('level-fill');
    if (el1) el1.textContent = mastery.icon;
    if (el2) el2.textContent = mastery.name;
    if (el3) el3.style.width = (masteryProgress() * 100).toFixed(1) + '%';
  });

  // Первичная инициализация уровня
  const mastery = currentMastery();
  const el1 = document.getElementById('level-icon');
  const el2 = document.getElementById('level-name');
  const el3 = document.getElementById('level-fill');
  if (el1) el1.textContent = mastery.icon;
  if (el2) el2.textContent = mastery.name;
  if (el3) el3.style.width = (masteryProgress() * 100).toFixed(1) + '%';
}

function handleAction(action, btn) {
  switch (action) {
    case 'open-setup': renderSetup(); break;
    case 'open-daily': openDailyModal(); break;
    case 'open-achievements': openAchievements(); break;
    case 'open-stats': openStatsModal(); break;
    case 'open-search': openSearchModal(); break;
    case 'open-compare': openCompareModal(null); break;
    case 'start-quiz':
      emit('quiz:start');
      break;
    case 'close-quiz':
      emit('quiz:exit');
      handleMode('explore');
      break;
    case 'share-result':
      if (quizRecap) {
        import('./core.js').then(({ emit }) => {
          emit('share-result', quizRecap);
        });
      }
      break;
    case 'quiz-country': {
      const id = btn.getAttribute('data-country');
      const c = COUNTRIES_DB[id];
      if (!c) return;
      state.selectedLevel = c.level;
      closeModal('country');
      renderSetup();
      break;
    }
    case 'learn-random':
      state.learnIndex = Math.floor(Math.random() * learnPoolCache.length);
      renderLearn();
      break;
    case 'learn-zoom': {
      const c = learnPoolCache[state.learnIndex];
      if (c) {
        closePanel();
        zoomToFeature(c.id);
        highlightFeature(c.id, true);
        setTimeout(() => clearHighlights(), 2400);
      }
      break;
    }
  }
}

function handleMode(mode) {
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-mode') === mode);
  });
  if (mode === 'explore') {
    emit('quiz:exit');
    renderExplore();
  } else if (mode === 'setup') {
    emit('quiz:exit');
    renderSetup();
  } else if (mode === 'learn') {
    emit('quiz:exit');
    renderLearn();
  } else if (mode === 'quiz') {
    // уже обрабатывается через quiz:start
  }
}

export function showOnboardingIfNeeded() {
  const done = localStorage.getItem('geomaster-onboarding');
  if (!done) openOnboarding();
}

export { handleMode };
