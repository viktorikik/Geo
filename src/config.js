// src/config.js — только константы, никакой логики

export const VIEWBOX = { w: 960, h: 500 };

export const LEVELS = {
  world:   { name: 'Весь мир', icon: '🌍' },
  europe:  { name: 'Европа',   icon: '🏰' },
  asia:    { name: 'Азия',     icon: '🏮' },
  africa:  { name: 'Африка',   icon: '🦁' },
  america: { name: 'Америка',  icon: '🗽' },
  oceania: { name: 'Океания',  icon: '🏝️' }
};

export const MASTERY_LEVELS = [
  { name: 'Новичок',       icon: '🌱', minGames: 0 },
  { name: 'Исследователь', icon: '🧭', minGames: 5 },
  { name: 'Знаток',        icon: '🎓', minGames: 20 },
  { name: 'Эксперт',       icon: '🏆', minGames: 50 },
  { name: 'Легенда',       icon: '👑', minGames: 100 }
];

export const QUIZ = {
  totalQuestions: 10,
  blitzTime: 15,
  blitzTick: 100,
  blitzAutoNext: 1400,
  maxHints: 2,
  types: ['name', 'flag', 'capital']
};

export const STORAGE_KEYS = {
  stats: 'geomaster-stats-v2',
  records: 'geomaster-records-v1',
  achievements: 'geomaster-achievements-v1',
  theme: 'geomaster-theme',
  sound: 'geomaster-sound',
  daily: 'geomaster-daily',
  onboarding: 'geomaster-onboarding'
};

// Порядок CDN: сначала те, что обычно доступны из РФ
export const CDN_SOURCES = {
  countries: [
    'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
    'https://fastly.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
    'https://unpkg.com/world-atlas@2/countries-110m.json'
  ]
};

export const THEMES = ['dark', 'light', 'retro'];

export const QUIZ_TYPE_LABEL = {
  name: 'Название страны',
  flag: 'Флаг страны',
  capital: 'Столица'
};
