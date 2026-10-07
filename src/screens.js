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
  `;
  openModal('country');
  trackCountryExplored(key);
  updateDailyTask('explore');
}

/* ============================================================
   COMPARE
   ============================================================ */
export function openCompare(firstKey) {
  const options = Object.entries(COUNTRIES_DB)
    .filter(([key]) => key !== firstKey)
    .slice(0, 20);

  document.getElementById('compare-content').innerHTML = `
    <p>Выбери вторую страну для сравнения:</p>
    <div class="chips" style="margin-top:10px">
      ${options.map(([key, country]) =>
        `<button class="chip" data-compare-pick="${firstKey}|${key}">
          ${getFlagEmoji(country.flag)} ${country.name}
        </button>`
      ).join('')}
    </div>
  `;
  openModal('compare');
}

export function doCompare(key1, key2) {
  const c1 = COUNTRIES_DB[key1];
  const c2 = COUNTRIES_DB[key2];
  const f1 = COUNTRY_FACTS[key1];
  const f2 = COUNTRY_FACTS[key2];

  const row = (label, v1, v2) => `
    <tr>
      <td class="dim" style="padding:4px 8px">${label}</td>
      <td style="padding:4px 8px;font-weight:700">${v1 || '—'}</td>
      <td style="padding:4px 8px;font-weight:700">${v2 || '—'}</td>
    </tr>`;

  document.getElementById('compare-content').innerHTML = `
    <div class="compare-cols">
      <div class="compare-col">
        ${getFlagImage(c1.flag)}
        <h3>${c1.name}</h3>
        <p class="cap">🏛️ ${c1.capital}</p>
      </div>
      <div class="compare-col">
        ${getFlagImage(c2.flag)}
        <h3>${c2.name}</h3>
        <p class="cap">🏛️ ${c2.capital}</p>
      </div>
    </div>
    <table style="width:100%;font-size:13px;border-collapse:collapse">
      ${row('Валюта', f1?.[0], f2?.[0])}
      ${row('Язык', f1?.[1], f2?.[1])}
      ${row('Население', f1?.[2], f2?.[2])}
      ${row('Площадь', f1?.[3], f2?.[3])}
    </table>
    <div class="btn-row" style="justify-content:center;margin-top:12px">
      <button class="btn small ghost" data-close="compare">Закрыть</button>
    </div>
  `;
}

/* ============================================================
   ACHIEVEMENTS
   ============================================================ */
export function renderAchievements() {
  const total = ACHIEVEMENTS.length;
  const unlocked = ACHIEVEMENTS.filter(a => state.unlockedAchievements.has(a.id)).length;

  document.getElementById('achievements-content').innerHTML = `
    <p class="dim" style="margin-bottom:12px">
      Открыто: <b style="color:var(--text-primary)">${unlocked}/${total}</b>
    </p>
    <div class="achievements-grid">
      ${ACHIEVEMENTS.map(a => {
        const isUnlocked = state.unlockedAchievements.has(a.id);
        let barHtml = '';
        if (!isUnlocked && typeof a.progress === 'function') {
          const [cur, max] = a.progress(state.stats, state.unlockedAchievements);
          const pct = max > 0 ? Math.round(cur / max * 100) : 0;
          barHtml = `
            <div class="ach-bar"><div class="ach-bar-fill" style="width:${pct}%"></div></div>
            <div class="ach-bar-text">${cur} / ${max}</div>
          `;
        }
        return `
          <div class="ach-card ${isUnlocked ? 'unlocked' : 'locked'}">
            ${isUnlocked ? '' : '<div class="ach-lock">🔒</div>'}
            <div class="ach-icon">${a.icon}</div>
            <div class="ach-name">${a.name}</div>
            <div class="ach-desc">${a.desc}</div>
            ${barHtml}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ============================================================
   STATS
   ============================================================ */
export function renderStats() {
  const totalAnswers = Object.values(state.stats.countryCorrect).reduce((a, b) => a + b, 0)
                     + Object.values(state.stats.countryErrors).reduce((a, b) => a + b, 0);
  const totalErrors = Object.values(state.stats.countryErrors).reduce((a, b) => a + b, 0);
  const accuracy = totalAnswers > 0
    ? Math.round((totalAnswers - totalErrors) / totalAnswers * 100)
    : 0;

  const weak = getWeakCountries(6);
  const weakHtml = weak.length === 0
    ? `<div class="empty-state"><div class="big-emoji">🎉</div><p>Пока нет ошибок!</p></div>`
    : `<div class="weak-list">
        ${weak.map(w => {
          const c = COUNTRIES_DB[w.key];
          if (!c) return '';
          return `
            <div class="weak-item">
              <div class="weak-flag">${getFlagEmoji(c.flag)}</div>
              <div class="weak-info">
                <div class="weak-name">${c.name}</div>
                <div class="weak-bar"><div class="weak-fill" style="width:${w.percent * 100}%"></div></div>
              </div>
              <div class="weak-pct">${w.errors}/${w.total}</div>
            </div>`;
        }).join('')}
      </div>`;

  const continentsHtml = Object.entries(LEVELS)
    .filter(([key]) => key !== 'world')
    .map(([key, level]) => {
      const total = Object.keys(COUNTRIES_DB).filter(x => COUNTRIES_DB[x].level === key).length;
      const known = state.stats.exploredCountries
        .filter(x => COUNTRIES_DB[x] && COUNTRIES_DB[x].level === key).length;
      const percent = total > 0 ? Math.round(known / total * 100) : 0;
      return `
        <div class="continent-progress-item">
          <span>${level.icon}</span>
          <span style="min-width:70px;font-size:12px">${level.name}</span>
          <div class="continent-progress-bar">
            <div class="continent-progress-fill" style="width:${percent}%"></div>
          </div>
          <div class="continent-progress-pct">${percent}%</div>
        </div>`;
    }).join('');

  const radius = 45, cx = 50, cy = 50, stroke = 12;
  const circ = 2 * Math.PI * radius;
  const correctPercent = totalAnswers > 0 ? (totalAnswers - totalErrors) / totalAnswers : 0;
  const correctLen = circ * correctPercent;

  const donut = `
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none"
              stroke="var(--btn-border)" stroke-width="${stroke}"/>
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none"
              stroke="url(#donutGradient)" stroke-width="${stroke}"
              stroke-dasharray="${correctLen} ${circ}" stroke-linecap="round"
              transform="rotate(-90 ${cx} ${cy})"/>
      <defs>
        <linearGradient id="donutGradient">
          <stop offset="0" stop-color="var(--accent-1)"/>
          <stop offset="1" stop-color="var(--accent-2)"/>
        </linearGradient>
      </defs>
      <text x="${cx}" y="${cy + 5}" text-anchor="middle"
            fill="var(--text-primary)" font-size="16" font-weight="800">${accuracy}%</text>
    </svg>`;

  document.getElementById('stats-content').innerHTML = `
    <div class="stats-summary">
      <div class="stat-box"><div class="stat-value">${state.stats.gamesPlayed}</div><div class="stat-label">Игр</div></div>
      <div class="stat-box"><div class="stat-value">${state.stats.exploredCountries.length}</div><div class="stat-label">Стран</div></div>
      <div class="stat-box"><div class="stat-value">${state.stats.maxStreak}</div><div class="stat-label">Макс. серия</div></div>
    </div>
    <div class="donut-wrap">${donut}</div>
    <div class="section-label">Прогресс по континентам</div>
    ${continentsHtml}
    <div class="section-label">Слабые места</div>
    ${weakHtml}
    <div class="btn-row" style="margin-top:14px">
      <button class="btn primary small" data-action="train-weak">🎯 Тренировать слабые</button>
      <button class="btn small ghost" data-action="reset-all">Сброс</button>
    </div>
  `;
}

/* ============================================================
   TRAIN WEAK
   ============================================================ */
export function trainWeakCountries() {
  const weak = getWeakCountries(10);
  if (weak.length === 0) {
    emit('toast', { icon: '✨', title: 'Нет слабых стран', desc: 'Сыграй обычную викторину' });
    return;
  }
  state.selectedLevel = 'world';
  state.selectedBlitz = false;
  state.selectedInputMode = false;

  const pool = shuffle(weak.map(w => w.key));
  state.mode = 'quiz';
  state.quiz = {
    level: 'world',
    blitz: false,
    inputMode: false,
    questions: pool.slice(0, 10).map(key => ({ id: key, type: getRandomQuestionType() })),
    current: 0,
    score: 0,
    answered: false,
    streak: 0,
    hintsUsed: 0,
  };

  emit('mode:set-active', 'setup');
  emit('quiz:render-question');
  emit('panel:collapse');
  emit('toast', { icon: '🎯', title: 'Тренировка', desc: 'Только слабые страны!' });
}

/* ============================================================
   DAILY
   ============================================================ */
export function renderDaily() {
  const daily = getDailyTasks();
  document.getElementById('daily-content').innerHTML = `
    <div class="daily-list">
      ${daily.tasks.map(task => `
        <div class="daily-item ${task.done ? 'done' : ''}">
          <div class="daily-icon">${task.icon}</div>
          <div class="daily-info">
            <div class="daily-name">${task.name}</div>
            <div class="daily-desc">${task.desc}</div>
          </div>
          <div class="daily-reward">${task.progress}/${task.target}</div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ============================================================
   SEARCH
   ============================================================ */
export function doSearch(query) {
  const results = document.getElementById('search-results');
  if (!query) { results.innerHTML = ''; return; }
  const q = query.toLowerCase();
  const matches = Object.entries(COUNTRIES_DB)
    .filter(([k, c]) =>
      c.name.toLowerCase().includes(q) || c.capital.toLowerCase().includes(q)
    )
    .slice(0, 10);

  results.innerHTML = matches.length === 0
    ? '<div class="dim" style="padding:12px">Ничего не найдено</div>'
    : matches.map(([key, c]) =>
        `<div class="search-result-item" data-search-pick="${key}">
          ${getFlagEmoji(c.flag)} ${c.name}
          <span class="dim">· ${c.capital}</span>
        </div>`
      ).join('');
}

/* ============================================================
   ONBOARDING
   ============================================================ */
const SLIDES = [
  { icon: '🌍', title: 'Изучай страны', desc: 'Кликай по карте, чтобы узнать факты о любой стране мира' },
  { icon: '🎯', title: 'Проходи викторины', desc: 'Проверь знания в режимах «Классика», «Блиц» и с вводом текста' },
  { icon: '🏆', title: 'Собирай ачивки', desc: 'Открывай достижения и следи за прогрессом' }
];

let onboardingSlide = 0;

export function showOnboarding() {
  if (loadFromStorage(STORAGE_KEYS.onboarding, false)) return;
  onboardingSlide = 0;
  renderOnboarding();
  openModal('onboarding');
}

function renderOnboarding() {
  document.getElementById('modal-onboarding-content').innerHTML = `
    <div class="onboarding fade">
      <div class="onboarding-icon">${SLIDES[onboardingSlide].icon}</div>
      <h2>${SLIDES[onboardingSlide].title}</h2>
      <p>${SLIDES[onboardingSlide].desc}</p>
      <div class="onboarding-dots">
        ${SLIDES.map((_, i) =>
          `<div class="onboarding-dot ${i === onboardingSlide ? 'active' : ''}"></div>`
        ).join('')}
      </div>
      <div class="btn-row" style="justify-content:center">
        ${onboardingSlide > 0
          ? '<button class="btn small ghost" data-onb="prev">← Назад</button>'
          : ''}
        ${onboardingSlide < SLIDES.length - 1
          ? '<button class="btn primary" data-onb="next">Далее →</button>'
          : '<button class="btn primary" data-onb="done">🚀 Начать!</button>'}
      </div>
    </div>
  `;
}

export function closeOnboarding() {
  saveToStorage(STORAGE_KEYS.onboarding, true);
  closeModal('onboarding');
}

/* ============================================================
   EXPORT / SHARE
   ============================================================ */
function buildResultCanvas(score, total, message, masteryLevel) {
  const canvas = document.createElement('canvas');
  canvas.width = 600; canvas.height = 400;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 600, 400);

  const grad = ctx.createLinearGradient(0, 0, 600, 0);
  grad.addColorStop(0, '#8b5cf6');
  grad.addColorStop(1, '#06b6d4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 6);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px Manrope, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🌍 ГеоМастер', 300, 60);

  ctx.font = 'bold 72px Manrope, sans-serif';
  ctx.fillText(`${score}/${total}`, 300, 170);

  ctx.font = '24px Manrope, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(message, 300, 220);

  ctx.font = '18px Manrope, sans-serif';
  ctx.fillText(`${masteryLevel.icon} ${masteryLevel.name}`, 300, 270);

  ctx.font = '14px Manrope, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('geomaster.game', 300, 370);
  return canvas;
}

export async function exportResult(score, total) {
  const percent = score / total;
  const message = percent === 1 ? 'Идеально!'
    : percent >= .8 ? 'Отлично!'
    : percent >= .5 ? 'Неплохо!'
    : 'Попробуй ещё!';
  const masteryLevel = getCurrentMasteryLevel();
  const shareText = `🌍 ГеоМастер: ${score}/${total} — ${message} ${masteryLevel.icon} ${masteryLevel.name}`;

  if (navigator.share) {
    try {
      const canvas = buildResultCanvas(score, total, message, masteryLevel);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (blob) {
        const file = new File([blob], 'geomaster.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: shareText, title: 'ГеоМастер' });
          return;
        }
      }
      await navigator.share({ text: shareText, title: 'ГеоМастер' });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }

  const canvas = buildResultCanvas(score, total, message, masteryLevel);
  const link = document.createElement('a');
  link.download = 'geomaster-result.png';
  link.href = canvas.toDataURL();
  link.click();
  emit('toast', { icon: '📤', title: 'Результат сохранён', desc: 'Картинка скачана!' });
}

/* ============================================================
   DELEGATED CLICK HANDLERS
   ============================================================ */
export function initScreens() {
  document.addEventListener('click', (e) => {
    // Общие кнопки actions
    const act = e.target.closest('[data-action]');
    if (act) {
      const a = act.dataset.action;
      if (a === 'goto-setup') emit('mode:set', 'setup');
      if (a === 'goto-explore') emit('mode:set', 'explore');
      if (a === 'open-daily') { renderDaily(); openModal('daily'); }
      if (a === 'open-achievements') { renderAchievements(); openModal('achievements'); }
      if (a === 'open-stats') { renderStats(); openModal('stats'); }
      if (a === 'start-quiz') emit('quiz:start');
      if (a === 'restart-quiz') emit('quiz:start');
      if (a === 'train-weak') { closeModal('stats'); trainWeakCountries(); }
      if (a === 'reset-all') {
        if (confirm('Сбросить всё?')) {
          state.stats = { ...getDefaultStats() };
          state.unlockedAchievements = new Set();
          saveStatsBridge();
          renderStats();
        }
      }
      if (a === 'share-result') {
        // score/total берём из последнего рендера — прокинем через data-атрибуты
        const scoreEl = panelContent().querySelector('.big-score');
        if (scoreEl) {
          const [s, t] = scoreEl.textContent.split('/');
          exportResult(parseInt(s), parseInt(t));
        }
      }
      return;
    }

    // Setup chips
    const lvl = e.target.closest('[data-level]');
    if (lvl) { state.selectedLevel = lvl.dataset.level; renderSetup(); return; }
    const bl = e.target.closest('[data-blitz]');
    if (bl) { state.selectedBlitz = bl.dataset.blitz === '1'; renderSetup(); return; }
    const inp = e.target.closest('[data-input]');
    if (inp) { state.selectedInputMode = inp.dataset.input === '1'; renderSetup(); return; }

    // Learn
    const l = e.target.closest('[data-learn]');
    if (l) {
      if (l.dataset.learn === 'prev') learnIndex = Math.max(0, learnIndex - 1);
      if (l.dataset.learn === 'next') learnIndex++;
      renderLearnCard();
      return;
    }

    // Quiz actions
    const qa = e.target.closest('[data-quiz-action]');
    if (qa) {
      const a = qa.dataset.quizAction;
      if (a === 'next') nextQuestion();
      if (a === 'hint') useHint();
      if (a === 'exit') exitQuiz();
      if (a === 'submit-text') submitTextBridge();
      return;
    }

    // Compare
    const cmp = e.target.closest('[data-compare]');
    if (cmp) { closeModal('country'); openCompare(cmp.dataset.compare); return; }
    const cmpPick = e.target.closest('[data-compare-pick]');
    if (cmpPick) {
      const [k1, k2] = cmpPick.dataset.comparePick.split('|');
      doCompare(k1, k2);
      return;
    }

    // Search
    const sp = e.target.closest('[data-search-pick]');
    if (sp) { closeModal('search'); showCountryCard(sp.dataset.searchPick); return; }

    // Onboarding
    const onb = e.target.closest('[data-onb]');
    if (onb) {
      const a = onb.dataset.onb;
      if (a === 'prev') { onboardingSlide--; renderOnboarding(); }
      if (a === 'next') { onboardingSlide++; renderOnboarding(); }
      if (a === 'done') closeOnboarding();
      return;
    }

    // Mode buttons (hud)
    const mb = e.target.closest('.mode-btn');
    if (mb) { emit('mode:set', mb.dataset.mode); return; }

    // View buttons
    const vb = e.target.closest('.view-btn');
    if (vb) { emit('map:set-mode', vb.dataset.view); return; }

    // Zoom
    const zb = e.target.closest('[data-zoom]');
    if (zb) { emit('map:zoom', zb.dataset.zoom); return; }
  });

  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => doSearch(e.target.value));
  }
}

// Импорт getDefaultStats + saveStats
import { getDefaultStats } from './data.js';
import { saveStats, saveAchievements } from './core.js';
function saveStatsBridge() {
  saveStats();
  saveAchievements();
}
