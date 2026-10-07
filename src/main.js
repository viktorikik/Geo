import {
  state, emit, on, applyTheme, toggleSound, cycleTheme,
  getCurrentMasteryLevel,
} from './core.js';
import { MASTERY_LEVELS } from './config.js';
import {
  initMap, setMapMode, resetZoom, zoomBy,
} from './map.js';
import {
  initParticles, initModals, initPanel, collapsePanel, openModal,
} from './ui.js';
import {
  startQuiz, nextQuestion, exitQuiz,
} from './quiz.js';
import {
  renderExplore, renderSetup, renderLearn,
  showCountryCard, renderStats, renderAchievements, renderDaily,
  initScreens, showOnboarding,
} from './screens.js';

/* ============================================================
   MODE ROUTER
   ============================================================ */
const MODE_RENDERERS = {
  explore: renderExplore,
  setup: renderSetup,
  learn: renderLearn,
};

function setMode(mode) {
  state.mode = mode;
  if (mode !== 'quiz') state.quiz = null;
  if (mode !== 'quiz') resetZoom();
  document.querySelectorAll('.mode-btn').forEach(b => {
    const active = b.dataset.mode === mode || (mode === 'quiz' && b.dataset.mode === 'setup');
    b.classList.toggle('active', active);
  });
  const renderer = MODE_RENDERERS[mode === 'quiz' ? 'setup' : mode];
  if (renderer) renderer();
  collapsePanel();
}

on('mode:set', setMode);

on('mode:set-active', (mode) => {
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
});

on('map:set-mode', (mode) => setMapMode(mode));
on('map:zoom', (action) => {
  if (action === 'in') zoomBy(1.6);
  else if (action === 'out') zoomBy(1 / 1.6);
  else resetZoom();
});

on('country:clicked', (key) => {
  if (key) showCountryCard(key);
});

on('quiz:start', () => { startQuiz(); });

on('quiz:render-question', () => {
  // Импортируем renderQuizQuestion из screens
  import('./screens.js').then(m => {
    if (m.renderQuizQuestion) m.renderQuizQuestion();
  });
});

// Мы не можем динамически импортировать в собранном виде.
// Поэтому при разработке используется import(), а в сборке —
// прямая ссылка. Упростим: добавим экспорт напрямую.
// (см. ниже — мы просто зарегистрируем рендер через on)

on('panel:collapse', () => collapsePanel());

/* ============================================================
   HUD
   ============================================================ */
function updateMasteryLevelUI() {
  const lvl = getCurrentMasteryLevel();
  const next = MASTERY_LEVELS[lvl.index + 1];
  const iconEl = document.getElementById('level-icon');
  const nameEl = document.getElementById('level-name');
  const fillEl = document.getElementById('level-fill');
  if (iconEl) iconEl.textContent = lvl.icon;
  if (nameEl) nameEl.textContent = lvl.name;
  if (fillEl) {
    const pct = next
      ? Math.min(100, (state.stats.gamesPlayed - lvl.minGames) /
          (next.minGames - lvl.minGames) * 100)
      : 100;
    fillEl.style.width = pct + '%';
  }
}

/* ============================================================
   WIRE
   ============================================================ */
function wireHud() {
  const soundBtn = document.getElementById('sound-toggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      toggleSound();
      soundBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
    });
  }
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', cycleTheme);

  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      openModal('search');
      setTimeout(() => {
        const inp = document.getElementById('search-input');
        if (inp) inp.focus();
      }, 200);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.show')
        .forEach(m => m.classList.remove('show'));
      collapsePanel();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openModal('search');
      setTimeout(() => {
        const inp = document.getElementById('search-input');
        if (inp) inp.focus();
      }, 200);
    }
    if (state.mode === 'quiz' && state.quiz && !state.quiz.answered && !state.quiz.inputMode) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const btn = document.getElementById('next-question');
        if (btn && !btn.classList.contains('hidden')) btn.click();
      }
    }
  });

  on('stats:changed', updateMasteryLevelUI);
}

/* ============================================================
   BRIDGES — чтобы не было циклических зависимостей
   ============================================================ */
import { submitTextAnswer } from './quiz.js';
import { renderQuizQuestion } from './screens.js';

// Переопределяем обработчик рендера через on
on('quiz:render-question', () => renderQuizQuestion());
on('mode:reset-all', () => setMode('explore'));

/* ============================================================
   BOOT
   ============================================================ */
async function boot() {
  applyTheme(state.theme);
  initParticles();
  initModals();
  initPanel();
  initScreens();
  wireHud();

  const soundBtn = document.getElementById('sound-toggle');
  if (soundBtn) soundBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
  updateMasteryLevelUI();

  try {
    await initMap();
  } catch (e) {
    console.error('Map init failed', e);
    return;
  }

  setMode('explore');
  setTimeout(() => showOnboarding(), 800);
}

boot();
