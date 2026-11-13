export const ROWS = Object.freeze(Array.from({ length: 10 }, (_, index) => index + 1));
export const DURATIONS = Object.freeze([5, 10, 15, 30]);

export function makeTasks(rows) {
  return rows.flatMap(row => ROWS.map(factor => ({
    id: `${row}:${factor}`,
    row,
    factor,
    answer: row * factor,
  })));
}

// Marsaglia–Tsang gamma sampler. Normalizing two gamma draws gives a beta draw.
function gamma(shape, random) {
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    const u = 1 - random();
    const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
    const root = 1 + c * normal;
    if (root <= 0) continue;
    const v = root ** 3;
    const accept = 1 - random();
    if (Math.log(accept) < normal ** 2 / 2 + d * (1 - v + Math.log(v))) return d * v;
  }
}

export function selectTask(tasks, knowledge, recent, solved, random = Math.random) {
  const available = tasks.filter(task => !recent.includes(task.id));
  let winner;
  let best = -Infinity;
  for (const task of available.length ? available : tasks) {
    const { practice = 0, fluent = 0 } = knowledge[task.id] ?? {};
    const practiceDraw = gamma(1 + practice, random);
    const fluentDraw = gamma(1 + fluent, random);
    // Sample the chance of needing help. A small bonus helps cover a row.
    const score = practiceDraw / (practiceDraw + fluentDraw) + (solved.has(task.id) ? 0 : 0.12);
    if (score > best) {
      winner = task;
      best = score;
    }
  }
  return winner;
}

export function observe(knowledge, id, firstTry) {
  const previous = knowledge[id] ?? { practice: 0, fluent: 0 };
  // Recent observations retain more weight as the child improves.
  knowledge[id] = {
    practice: previous.practice * 0.92 + Number(!firstTry),
    fluent: previous.fluent * 0.92 + Number(firstTry),
  };
}
