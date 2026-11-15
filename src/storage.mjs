import { DURATIONS, ROWS, makeTasks, recommendRows } from './bandit.mjs';

const KEY = 'wolkenrechnen:v1';
const DEFAULT_SETTINGS = { duration: 5 };
const INPUT_MODES = ['manual', 'choices'];

export function loadState() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(KEY));
  } catch {
    // Private browsing and invalid data both start with the defaults.
  }
  const duration = saved?.settings?.duration;
  const knowledge = {};
  for (const { id } of makeTasks(ROWS)) {
    const entry = saved?.knowledge?.[id];
    if (!entry || !Number.isFinite(entry.practice) || !Number.isFinite(entry.fluent)) continue;
    knowledge[id] = {
      practice: Math.max(0, Math.min(13, entry.practice)),
      fluent: Math.max(0, Math.min(13, entry.fluent)),
      ...(Number.isFinite(entry.lastPracticed) && entry.lastPracticed > 0
        ? { lastPracticed: entry.lastPracticed }
        : {}),
    };
  }
  return {
    settings: {
      duration: DURATIONS.includes(duration) ? duration : DEFAULT_SETTINGS.duration,
      rows: recommendRows(knowledge),
      inputModes: saved?.settings?.inputModes?.filter(mode => INPUT_MODES.includes(mode)).length
        ? [...new Set(saved.settings.inputModes.filter(mode => INPUT_MODES.includes(mode)))]
        : ['manual'],
    },
    knowledge,
    darkMode: Boolean(saved?.darkMode),
  };
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Keep the session usable if local storage is unavailable.
  }
}
