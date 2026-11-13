import { fluencyForTime, makeTasks, observe, selectTask } from './bandit.mjs';

export function startSession({ duration, rows }, now = Date.now()) {
  return {
    tasks: makeTasks(rows),
    deadline: now + duration * 60_000,
    recent: [],
    seenRows: new Set(),
    observations: new Map(),
    solved: new Set(),
    complete: new Set(),
    task: null,
    taskStartedAt: now,
    phase: 'answer',
    firstAttempt: true,
    streak: 0,
    correct: 0,
  };
}

export function advanceSession(session, knowledge, now = Date.now()) {
  const newRows = session.tasks.filter(task => !session.seenRows.has(task.row));
  const pool = newRows.length ? newRows : session.tasks;
  session.task = selectTask(pool, knowledge, session.recent, session.solved);
  session.taskStartedAt = now;
  session.seenRows.add(session.task.row);
  session.recent = [...session.recent, session.task.id].slice(-2);
  session.phase = 'answer';
  session.firstAttempt = true;
}

export function submitAnswer(session, knowledge, value, now = Date.now()) {
  if (session.phase !== 'answer') return null;
  const { id, row, answer } = session.task;
  const correct = value === answer;
  const firstAttempt = session.firstAttempt;
  const elapsedSeconds = Math.max(0, (now - session.taskStartedAt) / 1000);
  const fluency = correct ? fluencyForTime(elapsedSeconds) : 0;
  session.firstAttempt = false;
  if (firstAttempt) {
    observe(knowledge, id, fluency);
    const previous = session.observations.get(id) ?? { confident: 0, practice: 0 };
    session.observations.set(id, {
      confident: previous.confident + fluency,
      practice: previous.practice + (1 - fluency),
      task: session.task,
    });
    session.streak = correct ? session.streak + 1 : 0;
  }
  if (!correct) return { correct, firstAttempt };

  session.phase = 'next';
  session.correct++;
  session.solved.add(id);
  const completed = !session.complete.has(row) &&
    session.tasks.every(task => task.row !== row || session.solved.has(task.id));
  if (completed) session.complete.add(row);
  return { correct, firstAttempt, elapsedSeconds, fluency, completed, milestone: firstAttempt && session.streak % 3 === 0 };
}

export function summarize(session) {
  const observations = [...session.observations.values()];
  return {
    strengths: observations
      .filter(item => item.confident > 0 && item.confident >= item.practice)
      .sort((a, b) => b.confident - a.confident || a.practice - b.practice)
      .slice(0, 4)
      .map(item => item.task),
    practice: observations
      .filter(item => item.practice > item.confident)
      .sort((a, b) => b.practice - a.practice || a.confident - b.confident)
      .slice(0, 4)
      .map(item => item.task),
  };
}
