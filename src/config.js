export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 500;
export const QUESTION_TIME = 15;
export const GLOBE_INITIAL_ROTATION = [-10, -20, 0];

export const LEVELS = {
  world:   { name: 'Весь мир', icon: '🌍' },
  europe:  { name: 'Европа',   icon: '🏰' },
  asia:    { name: 'Азия',     icon: '🏮' },
  africa:  { name: 'Африка',   icon: '🦁' },
  america: { name: 'Америка',  icon: '🗽' },
  oceania: { name: 'Океания',  icon: '🏝️' },
};

export const MASTERY_LEVELS = [
  { name: 'Новичок',       icon: '🌱', minGames: 0 },
  { name: 'Исследователь', icon: '🧭', minGames: 5 },
  { name: 'Знаток',        icon: '🎓', minGames: 20 },
  { name: 'Эксперт',       icon: '🏆', minGames: 50 },
  { name: 'Легенда',       icon: '👑', minGames: 100 },
];

export const STORAGE_KEYS = {
  records: 'geomaster-records-v1',
  theme: 'geomaster-theme',
  sound: 'geomaster-sound',
  stats: 'geomaster-stats-v2',
  achievements: 'geomaster-achievements-v1',
  onboarding: 'geomaster-onboarding',
  daily: 'geomaster-daily',
};

export const QUESTION_TYPES = ['name', 'flag', 'capital'];
export const THEMES = ['dark', 'light', 'retro'];
export const THEME_ICONS = { dark: '🌙', light: '☀️', retro: '🗺️' };

export const NAME_TO_KEY = { Kosovo: 'XK' };

// Быстрый доступ к рандомному типу вопроса
export const getRandomQuestionType = () =>
  QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];
