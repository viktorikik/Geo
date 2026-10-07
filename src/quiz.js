import { QUESTION_TIME } from './config.js';
import { COUNTRIES_DB } from './data.js';
import {
  state, setState, getRandomQuestionType, shuffle,
  getCountryPoolForLevel, getRecords, saveRecords,
  trackCorrectAnswer, trackWrongAnswer,
  trackGameEnd, playCorrectSound, playWrongSound,
  playStreakSound, playRecordSound, vibrate, isAnswerCorrect,
  updateDailyTask,
} from './core.js';
import { getFeatureByKey, flashCountry, clearFlash, highlightQuizTarget, zoomTo } from './map.js';
import { emit, on } from './core.js';

let timerId = null, timeLeft = 0, advanceTimer = null;

/* ============================================================
   START
   ============================================================ */
export function startQuiz() {
  const featureByKey = getFeatureByKey();
  const pool = shuffle(getCountryPoolForLevel(state.selectedLevel, featureByKey)).slice(0, 10);

  setState({
    mode: 'quiz',
    quiz: {
      level: state.selectedLevel,
      blitz: state.selectedBlitz,
      inputMode: state.selectedInputMode,
      questions: pool.map(key => ({ id: key, type: getRandomQuestionType() })),
      current: 0,
      score: 0,
      answered: false,
      streak: 0,
      hintsUsed: 0,
    },
  });

  clearFlash();
  emit('quiz:render-question');
  emit('panel:collapse');
}

/* ============================================================
   TIMER
   ============================================================ */
export function startTimer() {
  stopTimer();
  timeLeft = QUESTION_TIME;
  updateTimerUI();
  timerId = setInterval(() => {
    timeLeft -= 0.1;
    if (timeLeft <= 0) { stopTimer(); onTimeout(); }
    updateTimerUI();
  }, 100);
}

export function stopTimer() {
  if (timerId) { clearInterval(timerId); timerId = null; }
}

function updateTimerUI() {
  const bar = document.getElementById('timer-bar');
  const num = document.getElementById('timer-num');
  if (bar) {
    bar.style.width = Math.max(0, timeLeft / QUESTION_TIME * 100) + '%';
    bar.classList.toggle('low', timeLeft <= 5);
  }
  if (num) num.textContent = Math.max(0, Math.ceil(timeLeft));
}

function onTimeout() {
  if (state.quiz && !state.quiz.answered) submitAnswer({ feature: null, key: null });
}

/* ============================================================
   ANSWER
   ============================================================ */
on('quiz:answer', ({ feature, key }) => submitAnswer({ feature, key }));

function submitAnswer({ feature, key: clickedKey }) {
  const quiz = state.quiz;
  if (!quiz || quiz.answered) return;
  quiz.answered = true;
  stopTimer();

  const q = quiz.questions[quiz.current];
  const correct = clickedKey === q.id;
  applyAnswer(correct, q.id, clickedKey);

  if (feature) flashCountry(feature, correct ? 'flash-correct' : 'flash-wrong');
  const correctF = getFeatureByKey()[q.id];
  if (!correct && correctF) flashCountry(correctF, 'flash-correct');
  if (correctF) zoomTo(correctF);

  emit('quiz:feedback', { correct, question: q, timeout: !feature });
  if (quiz.blitz) {
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(nextQuestion, 1400);
  }
}

export function submitTextAnswer(value) {
  const quiz = state.quiz;
  if (!quiz || quiz.answered || !quiz.inputMode) return;
  const v = value.trim();
  if (!v) return;
  quiz.answered = true;
  stopTimer();

  const q = quiz.questions[quiz.current];
  const country = COUNTRIES_DB[q.id];
  const correct = isAnswerCorrect(v, country);
  applyAnswer(correct, q.id);

  const f = getFeatureByKey()[q.id];
  if (f) { flashCountry(f, 'flash-correct'); zoomTo(f); }

  emit('quiz:text-feedback', { correct, question: q, value: v });
  if (quiz.blitz) {
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(nextQuestion, 1800);
  }
}

function applyAnswer(correct, targetKey, clickedKey) {
  const quiz = state.quiz;
  if (correct) {
    quiz.score++;
    quiz.streak++;
    state.stats.currentStreak = quiz.streak;
    if (quiz.streak > state.stats.maxStreak) state.stats.maxStreak = quiz.streak;
    trackCorrectAnswer(targetKey);
    playCorrectSound();
    vibrate(20);
    if (quiz.streak >= 3 && quiz.streak % 3 === 0) playStreakSound();
    updateDailyTask('correct');
  } else {
    quiz.streak = 0;
    trackWrongAnswer(targetKey);
    if (clickedKey && clickedKey !== targetKey) trackWrongAnswer(clickedKey);
    playWrongSound();
    vibrate(80);
  }
}

export function useHint() {
  const quiz = state.quiz;
  if (!quiz || quiz.answered || quiz.hintsUsed >= 2) return;
  quiz.hintsUsed++;
  quiz.score = Math.max(0, quiz.score - 1);
  emit('quiz:hint-used');
}

/* ============================================================
   NEXT / FINISH
   ============================================================ */
export function nextQuestion() {
  clearTimeout(advanceTimer);
  stopTimer();
  clearFlash();
  state.quiz.current++;
  if (state.quiz.current >= state.quiz.questions.length) {
    emit('quiz:finished');
  } else {
    emit('quiz:render-question');
  }
}

export function finishQuiz() {
  const quiz = state.quiz;
  const total = quiz.questions.length;
  const records = getRecords();
  const recordKey = quiz.level + (quiz.blitz ? '-blitz' : '-classic');
  const prev = records[recordKey];
  const isNewRecord = !prev || quiz.score > prev.score;

  if (isNewRecord) {
    records[recordKey] = { score: quiz.score, date: new Date().toLocaleDateString('ru-RU') };
    saveRecords(records);
  }
  trackGameEnd(quiz.score, total, quiz.level, quiz.blitz);
  emit('quiz:results', { score: quiz.score, total, isNewRecord, previousRecord: prev });
  if (isNewRecord) setTimeout(playRecordSound, 300);
}

export function exitQuiz() {
  const answered = state.quiz ? state.quiz.current : 0;
  if (answered > 0 && !confirm('Выйти из викторины? Прогресс не сохранится.')) return;
  stopTimer();
  clearTimeout(advanceTimer);
  emit('mode:set', 'setup');
}

/* ============================================================
   AUTO-PAUSE (visibilitychange)
   ============================================================ */
document.addEventListener('visibilitychange', () => {
  const q = state.quiz;
  if (!q?.blitz || q.answered || state.mode !== 'quiz') return;
  if (document.hidden) stopTimer();
  else startTimer();
});
