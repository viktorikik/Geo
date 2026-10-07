import { COUNTRIES_DB, COUNTRY_FACTS, ACHIEVEMENTS } from './data.js';
import { LEVELS, QUESTION_TIME } from './config.js';
import {
  state, emit, on,
  getWeakCountries, getCurrentMasteryLevel,
  getCountryPoolForLevel, getRecords,
  getFlagEmoji, getFlagImage, shuffle,
  trackCountryExplored, updateDailyTask,
  getDailyTasks, loadFromStorage, saveToStorage,
  getRandomQuestionType,
} from './core.js';
import {
  openModal, closeModal, collapsePanel, expandPanel, setPanelHandleTitle,
} from './ui.js';
import {
  resetZoom, getFeatureByKey, zoomTo,
} from './map.js';
import {
  startQuiz, nextQuestion, submitTextAnswer, useHint, exitQuiz,
} from './quiz.js';
import { STORAGE_KEYS } from './config.js';

const panelContent = () => document.getElementById('panel-content');

/* ============================================================
   EXPLORE
   ============================================================ */
export function renderExplore() {
  const featureCount = Object.keys(getFeatureByKey()).length;
  const hint = state.mapMode === 'globe'
    ? '🌐 Вращай глобус · щипок — масштаб'
    : '🖱️ Колёсико — масштаб · перетаскивание';

  panelContent().innerHTML = `
    <div class="fade">
      <h2>🧭 Исследование</h2>
      <p>Кликай по странам, чтобы узнать факты.</p>
      <p class="dim">${hint}</p>
      <p class="dim">В базе <b>${featureCount}</b> стран.</p>
      <div class="btn-row">
        <button class="btn primary" data-action="goto-setup">🎯 Викторина</button>
        <button class="btn small" data-action="open-daily">📋 Задания</button>
        <button class="btn small" data-action="open-achievements">🏆 Ачивки</button>
        <button class="btn small" data-action="open-stats">📊 Стат</button>
      </div>
    </div>
  `;
  setPanelHandleTitle('🧭 Карта');
}

/* ============================================================
   SETUP
   ============================================================ */
export function renderSetup() {
  const chips = Object.entries(LEVELS).map(([key, level]) => {
    const count = getCountryPoolForLevel(key, getFeatureByKey()).length;
    const active = state.selectedLevel === key ? 'active' : '';
    return `<button class="chip ${active}" data-level="${key}">
      ${level.icon} ${level.name}
      <span class="chip-count">${count}</span>
    </button>`;
  }).join('');

  const recordKey = state.selectedLevel + (state.selectedBlitz ? '-blitz' : '-classic');
  const record = getRecords()[recordKey];

  panelContent().innerHTML = `
    <div class="fade">
      <h2>🎯 Викторина</h2>
      <div class="section-label">Уровень</div>
      <div class="chips">${chips}</div>
      <div class="section-label">Режим</div>
      <div class="chips">
        <button class="chip ${!state.selectedBlitz ? 'active' : ''}" data-blitz="0">♾️ Классика</button>
        <button class="chip ${state.selectedBlitz ? 'active' : ''}" data-blitz="1">⚡ Блиц · ${QUESTION_TIME}с</button>
      </div>
      <div class="section-label">Способ ответа</div>
      <div class="chips">
        <button class="chip ${!state.selectedInputMode ? 'active' : ''}" data-input="0">🖱️ Клик по карте</button>
        <button class="chip ${state.selectedInputMode ? 'active' : ''}" data-input="1">⌨️ Ввод текста</button>
      </div>
      <div class="record-line">
        ${record
          ? `🏆 Рекорд: <b>${record.score}/10</b> · ${record.date}`
          : '🏆 Установи рекорд!'}
      </div>
      <button class="btn primary big" data-action="start-quiz">▶ Начать</button>
      <div class="btn-row" style="margin-top:8px">
        <button class="btn small" data-action="open-achievements" style="flex:1">
          🏆 ${state.unlockedAchievements.size}/${ACHIEVEMENTS.length}
        </button>
        <button class="btn small" data-action="open-stats" style="flex:1">📊 Стат</button>
      </div>
    </div>
  `;
  setPanelHandleTitle('🎯 Викторина');
  expandPanel();
}

/* ============================================================
   QUIZ RENDER
   ============================================================ */
export function renderQuizQuestion() {
  const quiz = state.quiz;
  if (!quiz) return;
  quiz.answered = false;
  const q = quiz.questions[quiz.current];
  const country = COUNTRIES_DB[q.id];
  const level = LEVELS[quiz.level];

  let title, target;
  if (q.type === 'name') {
    title = 'Найди страну';
    target = `<div class="q-target">${country.name}</div>`;
  } else if (q.type === 'flag') {
    title = 'Найди по флагу';
    target = getFlagImage(country.flag);
  } else {
    title = 'Найди по столице';
    target = `<div class="q-target">${country.capital}</div>`;
  }

  const streakHtml = quiz.streak >= 2
    ? `<span class="pill streak-pill">🔥 ${quiz.streak}</span>`
    : '';

  panelContent().innerHTML = `
    <div class="fade">
      <div class="quiz-top">
        <span class="pill">${level.icon} ${level.name}</span>
        <span class="pill">${quiz.blitz ? '⚡ Блиц' : '♾️'}</span>
        <span class="pill">${quiz.current + 1}/${quiz.questions.length}</span>
        <span class="pill score-pill">⭐ ${quiz.score}</span>
        ${streakHtml}
      </div>
      ${quiz.blitz ? `
        <div class="timer">
          <div class="timer-track"><div class="timer-bar" id="timer-bar"></div></div>
          <span id="timer-num">${QUESTION_TIME}</span>
        </div>
      ` : ''}
      <h2 class="q-title">${title}</h2>
      ${target}
      ${quiz.inputMode ? `
        <div class="answer-input-wrap">
          <input
            class="answer-input"
            id="answer-input"
            type="text"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="Введи название…"
          >
          <button class="btn primary" data-quiz-action="submit-text">ОК</button>
        </div>
      ` : ''}
      <div id="hint-area"></div>
      <div id="q-feedback"></div>
      <div class="btn-row">
        ${quiz.blitz ? '' : `<button id="next-question" class="btn primary hidden" data-quiz-action="next">Далее →</button>`}
        <button class="btn small" data-quiz-action="hint">💡 Подсказка</button>
        <button class="btn small ghost" data-quiz-action="exit">Выйти</button>
      </div>
    </div>
  `;

  setPanelHandleTitle(`${title}: ${
    q.type === 'flag' ? '🚩' : (q.type === 'name' ? country.name : country.capital)
  }`);

  // Таймер и фокус
  if (quiz.blitz) startTimerBridge();
  if (quiz.inputMode) {
    setTimeout(() => {
      const inp = document.getElementById('answer-input');
      if (inp && !inp.disabled) {
        inp.focus();
        inp.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); submitTextBridge(); }
        });
      }
    }, 100);
  }
}

// Импортируем startTimer из quiz.js через небольшой «мост»,
// чтобы избежать циклических зависимостей на уровне модулей
import { startTimer } from './quiz.js';
function startTimerBridge() { startTimer(); }

function submitTextBridge() {
  const inp = document.getElementById('answer-input');
  if (inp) submitTextAnswer(inp.value);
}

/* ============================================================
   QUIZ FEEDBACK
   ============================================================ */
on('quiz:click-feedback', ({ correct, question, timeout }) => {
  const country = COUNTRIES_DB[question.id];
  const fb = document.getElementById('q-feedback');
  if (!fb) return;
  if (correct) {
    fb.className = 'good';
    fb.textContent = `✅ Верно! Это ${country.name}.`;
  } else if (timeout) {
    fb.className = 'bad';
    fb.textContent = `⏰ Время вышло! Это ${country.name}.`;
  } else {
    fb.className = 'bad';
    fb.textContent = `❌ Мимо. Это ${country.name}.`;
  }
  const nextBtn = document.getElementById('next-question');
  if (nextBtn) nextBtn.classList.remove('hidden');
});

on('quiz:text-feedback', ({ correct, question, value, country }) => {
  const fb = document.getElementById('q-feedback');
  const inp = document.getElementById('answer-input');
  if (inp) inp.disabled = true;
  if (!fb) return;
  if (correct) {
    fb.className = 'good';
    fb.textContent = `✅ Верно! Это ${country.name}.`;
  } else {
    fb.className = 'bad';
    fb.textContent = `❌ Ты ввёл «${value}». Правильно: ${country.name}.`;
  }
  const nextBtn = document.getElementById('next-question');
  if (nextBtn) nextBtn.classList.remove('hidden');
});

on('quiz:hint-used', () => {
  const quiz = state.quiz;
  if (!quiz) return;
  const q = quiz.questions[quiz.current];
  const country = COUNTRIES_DB[q.id];
  const level = LEVELS[country.level];
  const hint = `${level.icon} Континент: <b>${level.name}</b> · Страна на «<b>${country.name[0]}</b>» (${country.name.length} букв) · Столица на «<b>${country.capital[0]}</b>»`;
  const area = document.getElementById('hint-area');
  if (area) area.innerHTML = `<div class="hint-box">💡 ${hint}</div>`;
  const scorePill = panelContent().querySelector('.score-pill');
  if (scorePill) scorePill.textContent = `⭐ ${quiz.score}`;
  emit('toast', { icon: '💡', title: 'Подсказка', desc: '−1 очко', duration: 2000 });
});

/* ============================================================
   RESULTS
   ============================================================ */
on('quiz:results', ({ score, total, isNewRecord, previousRecord }) => {
  const percent = score / total;
  const message = percent === 1 ? 'Идеально! 🎉'
    : percent >= .8 ? 'Отлично! 🔥'
    : percent >= .5 ? 'Неплохо! 👍'
    : 'Попробуй ещё! 💪';

  panelContent().innerHTML = `
    <div class="fade center">
      <h2>🏁 Готово!</h2>
      <div class="big-score">${score}<span class="big-total">/${total}</span></div>
      ${isNewRecord
        ? '<div class="new-record">🏆 Новый рекорд!</div>'
        : (previousRecord ? `<div class="dim">Рекорд: ${previousRecord.score}/${total}</div>` : '')}
      <p>${message}</p>
      <div class="btn-row" style="justify-content:center">
        <button class="btn primary" data-action="restart-quiz">🔄 Ещё</button>
        <button class="btn small" data-action="share-result">📤 Поделиться</button>
        <button class="btn small" data-action="goto-setup">⚙️</button>
        <button class="btn small ghost" data-action="goto-explore">🧭</button>
      </div>
    </div>
  `;
  setPanelHandleTitle(`🏁 ${score}/${total}`);
  resetZoom();
  expandPanel();
});

/* ============================================================
   LEARN
   ============================================================ */
let learnIndex = 0;
let learnKeys = [];

export function renderLearn() {
  learnKeys = shuffle(Object.keys(COUNTRIES_DB).filter(k => getFeatureByKey()[k]));
  learnIndex = 0;
  renderLearnCard();
}

export function renderLearnCard() {
  if (learnIndex >= learnKeys.length) learnIndex = 0;
  const key = learnKeys[learnIndex];
  const country = COUNTRIES_DB[key];
  const facts = COUNTRY_FACTS[key];
  const factsHtml = facts ? `
    <div class="facts">
      <div class="fact"><b>💰 Валюта</b>${facts[0]}</div>
      <div class="fact"><b>🗣️ Язык</b>${facts[1]}</div>
      <div class="fact"><b>👥 Население</b>${facts[2]}</div>
      <div class="fact"><b>📐 Площадь</b>${facts[3]}</div>
    </div>
    <div class="fun-fact">💡 ${facts[4]}</div>` :
    `<p class="dim">Столица: ${country.capital}</p>`;

  panelContent().innerHTML = `
    <div class="learn-card fade">
      <h2 style="font-size:18px">📖 Изучение</h2>
      <p class="dim">${learnIndex + 1} / ${learnKeys.length}</p>
      ${getFlagImage(country.flag)}
      <h2 style="font-size:22px">${country.name}</h2>
      <p class="en-name">${LEVELS[country.level].icon} ${LEVELS[country.level].name} · 🏛️ ${country.capital}</p>
      ${factsHtml}
      <div class="nav">
        <button class="btn small" data-learn="prev">←</button>
        <button class="btn primary small" data-learn="next">Далее →</button>
      </div>
    </div>
  `;
  setPanelHandleTitle(`📖 ${country.name}`);
  trackCountryExplored(key);
  updateDailyTask('explore');
  const f = getFeatureByKey()[key];
  if (f) zoomTo(f);
}

/* ============================================================
   COUNTRY CARD
   ============================================================ */
export function showCountryCard(key) {
  const country = COUNTRIES_DB[key];
  if (!country) return;
  const facts = COUNTRY_FACTS[key];
  const factsHtml = facts ? `
    <div class="facts">
      <div class="fact"><b>💰 Валюта</b>${facts[0]}</div>
      <div class="fact"><b>🗣️ Язык</b>${facts[1]}</div>
      <div class="fact"><b>👥 Население</b>${facts[2]}</div>
      <div class="fact"><b>📐 Площадь</b>${facts[3]}</div>
    </div>
    <div class="fun-fact">💡 ${facts[4]}</div>` : '';

  const correct = state.stats.countryCorrect[key] || 0;
  const errors = state.stats.countryErrors[key] || 0;
  const statsHtml = (correct + errors) > 0
    ? `<p class="dim">📊 Твои ответы: ✅ ${correct} · ❌ ${errors}</p>` : '';

  document.getElementById('modal-country-content').innerHTML = `
    <button class="close-btn" data-close="country" style="position:absolute;top:12px;right:12px">✕</button>
    <div class="country-card fade">
      ${getFlagImage(country.flag, 'flag-wrap card-flag')}
      <h2>${country.name}</h2>
      <p class="en-name">${LEVELS[country.level].icon} ${LEVELS[country.level].name}</p>
      <p style="font-size:16px;margin:6px 0">🏛️ <b>${country.capital}</b></p>
      ${factsHtml}
      ${statsHtml}
      <div class="btn-row" style="justify-content:center">
        <button class="btn small" data-compare="${key}">⚖️ Сравнить</button>
        <button class="btn small ghost" data-close="country">Закрыть</button>
      </div>
    </div>
  `
