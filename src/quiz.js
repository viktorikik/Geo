// src/quiz.js — логика викторины
import { QUIZ } from './config.js';
import { COUNTRIES_DB, getCountriesByLevel, getFlagEmoji } from './data.js';
import {
  state, emit, on, sfx,
  shuffle, fuzzyMatchAny, updateDailyTask
} from './core.js';

let timer = null;
let timerValue = 0;
let paused = false;
let transitioning = false;
let autoNextTimer = null;
let startTime = 0;

export function initQuiz() {
  on('quiz:start', startQuiz);
  on('quiz:answer-id', (id) => handleAnswer(id, false));
  on('quiz:answer-text', (text) => handleTextAnswer(text));
  on('quiz:hint', useHint);
  on('quiz:next', nextQuestion);
  on('quiz:exit', exitQuiz);
  document.addEventListener('visibilitychange', () => {
    if (!state.quiz || !state.quiz.blitz) return;
    paused = document.hidden;
  });
}

function randomQuestionType() {
  return QUIZ.types[Math.floor(Math.random() * QUIZ.types.length)];
}

function makeQuestions(level) {
  const pool = getCountriesByLevel(level);
  if (pool.length === 0) return [];
  const shuffled = shuffle(pool);
  const questions = [];
  const total = QUIZ.totalQuestions;
  for (let i = 0; i < total; i++) {
    const c = shuffled[i % shuffled.length];
    questions.push({
      id: c.id,
      type: randomQuestionType(),
      country: c
    });
  }
  return questions;
}

function startQuiz() {
  const level = state.selectedLevel;
  const questions = makeQuestions(level);
  if (!questions.length) {
    emit('toast', { type: 'error', text: 'Нет стран для этого уровня' });
    return;
  }
  state.quiz = {
    level,
    blitz: state.selectedBlitz,
    inputMode: state.selectedInputMode,
    questions,
    current: 0,
    score: 0,
    answered: false,
    streak: 0,
    hintsUsed: 0,
    hintForCurrent: 0,
    results: [],
    finished: false
  };
  state.mode = 'quiz';
  emit('mode:set', 'quiz');
  transitioning = false;
  emit('quiz:render-question');
  startTimerIfBlitz();
}

function startTimerIfBlitz() {
  stopTimer();
  if (!state.quiz || !state.quiz.blitz) return;
  timerValue = QUIZ.blitzTime;
  paused = false;
  emit('quiz:timer', { value: timerValue, max: QUIZ.blitzTime });
  timer = setInterval(() => {
    if (paused || !state.quiz || state.quiz.answered) return;
    timerValue = Math.max(0, timerValue - QUIZ.blitzTick / 1000);
    emit('quiz:timer', { value: timerValue, max: QUIZ.blitzTime });
    if (timerValue <= 0) {
      stopTimer();
      timeoutAnswer();
    }
  }, QUIZ.blitzTick);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function timeoutAnswer() {
  if (!state.quiz || state.quiz.answered) return;
  handleAnswer(null, true);
}

function handleTextAnswer(text) {
  if (!state.quiz || state.quiz.answered || transitioning) return;
  const q = state.quiz.questions[state.quiz.current];
  const c = q.country;
  let correct = false;
  if (q.type === 'name') {
    correct = fuzzyMatchAny(text, [c.name]);
  } else if (q.type === 'capital') {
    correct = fuzzyMatchAny(text, [c.capital]);
  } else {
    // flag — не бывает в input mode
    correct = fuzzyMatchAny(text, [c.name]);
  }
  submitAnswer(correct, c.id);
}

function handleAnswer(id, timeout) {
  if (!state.quiz || state.quiz.answered || transitioning) return;
  if (timeout) {
    submitAnswer(false, null);
    return;
  }
  const q = state.quiz.questions[state.quiz.current];
  const correct = id === q.country.id;
  submitAnswer(correct, id);
}

function submitAnswer(correct, clickedId) {
  const q = state.quiz.questions[state.quiz.current];
  const c = q.country;
  state.quiz.answered = true;
  stopTimer();

  const isBlitz = state.quiz.blitz;
  const basePoints = isBlitz ? 15 : 10;
  let points = correct ? basePoints : 0;

  if (correct) {
    state.quiz.score += points;
    state.quiz.streak += 1;
    if (state.quiz.streak > state.stats.maxStreak) {
      state.stats.maxStreak = state.quiz.streak;
    }
    state.stats.currentStreak = state.quiz.streak;
    state.stats.countryCorrect[c.id] = (state.stats.countryCorrect[c.id] || 0) + 1;
    if (state.quiz.streak >= 3) sfx.streak();
    else sfx.correct();
    updateDailyTask('correct', 1);
    if (state.quiz.streak > (state.stats._dailyStreak || 0)) {
      // просто фиксируем прогресс
    }
    const streakNow = state.quiz.streak;
    if (streakNow >= 3) {
      // обновляем daily streak
      const dProg = Math.max(0, streakNow);
      updateDailyTask('streak', 0);
      // напрямую сохраняем максимум
    }
  } else {
    state.quiz.streak = 0;
    state.stats.currentStreak = 0;
    state.stats.countryErrors[c.id] = (state.stats.countryErrors[c.id] || 0) + 1;
    sfx.wrong();
  }

  state.quiz.results.push({
    id: c.id,
    type: q.type,
    correct,
    clickedId: clickedId || null,
    hintsUsed: state.quiz.hintForCurrent
  });

  emit('quiz:feedback', {
    correct,
    correctId: c.id,
    clickedId: clickedId || null,
    timer: isBlitz ? timerValue : null
  });

  if (isBlitz) {
    autoNextTimer = setTimeout(() => {
      nextQuestion();
    }, QUIZ.blitzAutoNext);
  }
}

function nextQuestion() {
  if (!state.quiz) return;
  if (autoNextTimer) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }
  if (state.quiz.answered === false) {
    // если не ответили — не пропускаем
    return;
  }
  state.quiz.answered = false;
  state.quiz.hintForCurrent = 0;
  state.quiz.current += 1;
  if (state.quiz.current >= state.quiz.questions.length) {
    finishQuiz();
    return;
  }
  emit('quiz:render-question');
  startTimerIfBlitz();
}

function useHint() {
  if (!state.quiz || state.quiz.answered) return;
  if (state.quiz.hintForCurrent >= QUIZ.maxHints) return;
  state.quiz.hintForCurrent += 1;
  state.quiz.hintsUsed += 1;
  // штраф 1 очко — СРАЗУ
  state.quiz.score = Math.max(0, state.quiz.score - 1);
  emit('quiz:hint-used', { level: state.quiz.hintForCurrent });
  emit('toast', { type: 'info', text: '💡 Подсказка (−1 очко)' });
}

function finishQuiz() {
  stopTimer();
  if (!state.quiz) return;
  const q = state.quiz;
  q.finished = true;
  const score = q.score;
  const total = q.questions.length;
  const correctCount = q.results.filter(r => r.correct).length;
  const perfect = correctCount === total;
  const hintsUsed = q.hintsUsed;

  // Stats
  state.stats.gamesPlayed += 1;
  if (perfect) {
    state.stats.perfectGames += 1;
    state.stats.continentsPerfected[q.level] = true;
    if (q.blitz) state.stats.blitzPerfect += 1;
  }
  state.stats._totalScore = (state.stats._totalScore || 0) + score;
  updateDailyTask('gamesPlayed', 1);
  if (q.blitz) updateDailyTask('blitz', 1);

  emit('quiz:results', {
    score, total, correctCount, perfect, hintsUsed,
    level: q.level, blitz: q.blitz, inputMode: q.inputMode,
    results: q.results
  });
}

function exitQuiz() {
  stopTimer();
  if (autoNextTimer) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }
  state.quiz = null;
  transitioning = false;
}

export function resetQuiz() {
  exitQuiz();
}

export function currentTimerValue() {
  return timerValue;
}
