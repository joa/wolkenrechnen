import { DURATIONS, ROWS, makeTasks } from './bandit.mjs';

const KEY = 'wolkenrechnen:v1';
const DEFAULT_SETTINGS = { duration: 5, rows: [2, 5, 10] };

export function loadState() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(KEY));
  } catch {
    // Private browsing and invalid data both start with the defaults.
  }
  const duration = saved?.settings?.duration;
  const savedRows = saved?.settings?.rows;
  const rows = Array.isArray(savedRows) ? ROWS.filter(row => savedRows.includes(row)) : [];
  const knowledge = {};
  for (const { id } of makeTasks(ROWS)) {
    const entry = saved?.knowledge?.[id];
    if (!entry || !Number.isFinite(entry.practice) || !Number.isFinite(entry.fluent)) continue;
    knowledge[id] = {
      practice: Math.max(0, Math.min(13, entry.practice)),
      fluent: Math.max(0, Math.min(13, entry.fluent)),
    };
  }
  return {
    settings: {
      duration: DURATIONS.includes(duration) ? duration : DEFAULT_SETTINGS.duration,
      rows: rows.length ? rows : [...DEFAULT_SETTINGS.rows],
    },
    knowledge,
  };
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Keep the session usable if local storage is unavailable.
  }
}
