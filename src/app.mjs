import { DURATIONS, ROWS } from './bandit.mjs';
import { advanceSession, startSession, submitAnswer, summarize } from './session.mjs';
import { loadState, saveState } from './storage.mjs';

const app = document.querySelector('#app');
const sceneTemplate = document.querySelector('#scene-template');
const state = loadState();
const touchInput = matchMedia('(any-pointer: coarse)');
const palette = ['#f490a0', '#f4bb53', '#71aecd', '#7c8be5', '#8cc7a3'];
let session;
let clock;
let refs;

function mount(markup, mode) {
  app.className = `layout layout-${mode}`;
  app.innerHTML = markup;
  app.append(sceneTemplate.content.cloneNode(true));
  const scene = app.querySelector('.scene');
  scene.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const { left, top, width, height } = scene.getBoundingClientRect();
    scene.style.setProperty('--scene-x', `${((event.clientX - left) / width - 0.5) * 24}px`);
    scene.style.setProperty('--scene-y', `${((event.clientY - top) / height - 0.5) * 14}px`);
  });
  scene.addEventListener('pointerleave', () => {
    scene.style.removeProperty('--scene-x');
    scene.style.removeProperty('--scene-y');
  });
  return {
    scene,
    equation: scene.querySelector('.equation'),
    caption: scene.querySelector('.scene-caption'),
    confetti: scene.querySelector('.confetti'),
  };
}

function renderSetup(focus = false) {
  session = null;
  refs = mount(`
    <section class="panel" aria-labelledby="title">
      <h1 id="title" tabindex="-1">Bereit zum<br><em>Wolkenrechnen?</em></h1>
      <p class="intro">Übe das kleine Einmaleins in deinem Tempo.</p>
      <form id="setup">
        <fieldset class="settings-group">
          <legend>Wie lange möchtest du üben?</legend>
          <div class="duration-options">
            ${DURATIONS.map(duration => `
              <label class="choice">
                <input type="radio" name="duration" value="${duration}" ${state.settings.duration === duration ? 'checked' : ''}>
                <span>${duration} Min.</span>
              </label>
            `).join('')}
          </div>
        </fieldset>
        <fieldset class="settings-group row-group" aria-describedby="row-hint">
          <legend>Welche Reihen möchtest du üben?</legend>
          <div class="row-options">
            ${ROWS.map(row => `
              <label class="choice">
                <input type="checkbox" name="rows" value="${row}" ${state.settings.rows.includes(row) ? 'checked' : ''}>
                <span>${row}<span class="sr-only">er-Reihe</span></span>
              </label>
            `).join('')}
          </div>
          <p class="row-hint" id="row-hint" role="status">Du kannst mehrere Reihen auswählen.</p>
        </fieldset>
        <button class="primary start" type="submit">Los geht’s <span aria-hidden="true">→</span></button>
      </form>
    </section>`, 'setup');
  refs.equation.innerHTML = '<span>3</span> <b>×</b> <span>4</span> <b>=</b> <strong>12</strong>';
  refs.scene.setAttribute('aria-hidden', 'true');
  const form = app.querySelector('#setup');
  const hint = app.querySelector('#row-hint');
  form.addEventListener('change', () => {
    const data = new FormData(form);
    const rows = data.getAll('rows').map(Number);
    const duration = Number(data.get('duration'));
    hint.textContent = rows.length ? 'Du kannst mehrere Reihen auswählen.' : 'Wähle mindestens eine Reihe aus.';
    form.querySelector('button').disabled = !rows.length;
    if (rows.length) {
      state.settings = { duration, rows };
      saveState(state);
    }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (form.querySelector(':checked[name="rows"]')) renderPractice();
  });
  if (focus) app.querySelector('#title').focus();
}

function renderPractice() {
  session = startSession(state.settings);
  refs = mount(`
    <section class="panel practice-panel" aria-labelledby="title">
      <div class="practice-bar">
        <div class="time" id="time" role="timer" aria-label="Verbleibende Zeit"></div>
        <button class="quiet" id="stop" type="button">Beenden</button>
      </div>
      <h1 id="title">Wie viel ist <em>das?</em></h1>
      <form id="answer-form" autocomplete="off">
        <label for="answer">Deine Antwort</label>
        <div class="answer-controls">
          <input id="answer" type="text" inputmode="${touchInput.matches ? 'none' : 'numeric'}" enterkeyhint="go" pattern="[0-9]{1,3}" maxlength="3" required aria-describedby="task answer-feedback">
          <button class="primary" type="submit">Prüfen <span aria-hidden="true">→</span></button>
        </div>
        <div class="keypad" role="group" aria-label="Ziffernblock">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit =>
            `<button type="button" data-digit="${digit}">${digit}</button>`
          ).join('')}
          <button class="keypad-delete" type="button" aria-label="Letzte Ziffer löschen">⌫</button>
        </div>
        <p class="feedback" id="answer-feedback" role="status" aria-atomic="true"></p>
      </form>
      <p class="streak" id="streak" aria-hidden="true"><span aria-hidden="true">✦</span> <strong></strong></p>
    </section>`, 'practice');
  refs.equation.id = 'task';
  refs.time = app.querySelector('#time');
  refs.form = app.querySelector('#answer-form');
  refs.input = app.querySelector('#answer');
  refs.feedback = app.querySelector('#answer-feedback');
  refs.streak = app.querySelector('#streak');
  app.querySelector('#stop').addEventListener('click', finish);
  refs.form.addEventListener('submit', checkAnswer);
  refs.form.querySelector('.keypad').addEventListener('click', useKeypad);
  showTask();
  tick();
  clock = setInterval(tick, 250);
  document.addEventListener('visibilitychange', tick);
}

function writeEquation() {
  const { row, factor } = session.task;
  refs.equation.innerHTML = `<span>${row}</span> <b>×</b> <span>${factor}</span> <b>=</b> <strong>?</strong>`;
  refs.equation.setAttribute('aria-label', `${row} mal ${factor} ist wie viel?`);
}

function showTask() {
  advanceSession(session, state.knowledge);
  writeEquation();
  refs.caption.textContent = `${session.task.row}er-Reihe`;
  refs.input.value = '';
  refs.input.focus({ preventScroll: true });
}

function useKeypad(event) {
  const key = event.target.closest('button');
  if (!key || !tick()) return;

  const input = refs.input;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const digit = key.dataset.digit;
  if (digit === undefined) {
    input.setRangeText('', start === end ? Math.max(0, start - 1) : start, end, 'end');
  } else if (input.value.length - (end - start) < input.maxLength) {
    input.setRangeText(digit, start, end, 'end');
  }
  input.focus({ preventScroll: true });
}

function checkAnswer(event) {
  event.preventDefault();
  if (!tick()) return;
  if (!/^[0-9]{1,3}$/.test(refs.input.value)) return;
  const result = submitAnswer(session, state.knowledge, Number(refs.input.value));
  if (result.firstAttempt) saveState(state);
  refs.streak.setAttribute('aria-hidden', String(session.streak < 2));
  refs.streak.querySelector('strong').textContent = `${session.streak} direkt gelöst in Folge`;
  if (!result.correct) {
    const { row, factor, answer } = session.task;
    refs.feedback.textContent = result.firstAttempt
      ? `Probier’s noch einmal. Denk an ${factor} Gruppen mit je ${row}.`
      : `Schau mal, ${row} mal ${factor} ergibt ${answer}. Gib ${answer} ein.`;
    refs.input.focus({ preventScroll: true });
    refs.input.select();
    return;
  }
  const solvedRow = session.task.row;
  showTask();
  refs.feedback.textContent = result.completed
    ? `Die ganze ${solvedRow}er-Reihe geschafft!`
    : result.milestone ? `Wow, ${session.streak} direkt gelöst in Folge!` : 'Geschafft! Gut gerechnet.';
  if (result.completed || result.milestone) celebrate();
}

function tick() {
  if (!session || !refs.time) return false;
  const seconds = Math.max(0, Math.ceil((session.deadline - Date.now()) / 1000));
  if (!seconds) {
    finish();
    return false;
  }
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  if (refs.time.textContent !== time) refs.time.textContent = time;
  return true;
}

function finish() {
  clearInterval(clock);
  document.removeEventListener('visibilitychange', tick);
  const { strengths, practice } = summarize(session);
  const count = session.correct;
  const completed = [...session.complete].sort((a, b) => a - b);
  const solvedText = count === 1 ? '1 Aufgabe gelöst' : `${count} Aufgaben gelöst`;
  refs = mount(`
    <section class="panel summary-panel" aria-labelledby="title">
      <h1 id="title" tabindex="-1">Gut <em>geübt!</em></h1>
      <p class="intro">${count ? solvedText + '.' : 'Beim nächsten Mal kannst du gleich wieder loslegen.'}</p>
      ${completed.length ? `<p class="completed"><span aria-hidden="true">✦</span> Ganze Reihen geschafft: ${completed.map(row => `${row}er`).join(', ')}</p>` : ''}
      ${summaryGroup('Deine Stärken', strengths, 'Mit jeder Runde wirst du sicherer.')}
      ${summaryGroup('Hier solltest du noch mehr üben', practice, session.observations.size ? 'Du kannst beim nächsten Mal eine neue Reihe ausprobieren.' : 'Nach der nächsten Runde findest du hier Übungsideen.')}
      <button class="primary" id="again" type="button">Neue Runde <span aria-hidden="true">→</span></button>
    </section>`, 'summary');
  refs.scene.setAttribute('aria-hidden', 'true');
  refs.equation.innerHTML = '<strong>✦</strong>';
  if (count) refs.caption.textContent = solvedText;
  app.querySelector('#again').addEventListener('click', () => renderSetup(true));
  app.querySelector('#title').focus();
  if (count) celebrate();
}

function summaryGroup(title, tasks, emptyMessage) {
  return `<div class="summary-group">
    <h2>${title}</h2>
    ${tasks.length ? `<ul>${tasks.map(task => `<li>${task.row} × ${task.factor}</li>`).join('')}</ul>` : `<p>${emptyMessage}</p>`}
  </div>`;
}

function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = refs.confetti;
  const spread = Math.min(320, refs.scene.clientWidth / 2);
  const fallDistance = refs.scene.clientHeight * 0.52;
  for (let index = 0; index < 32; index++) {
    const piece = document.createElement('i');
    piece.style.backgroundColor = palette[index % palette.length];
    piece.style.borderRadius = index % 4 === 0 ? '50%' : '2px';
    target.append(piece);

    const sideways = (Math.random() * 2 - 1) * spread * 1.8;
    const upward = 225 + Math.random() * 230;
    const gravity = 600 + Math.random() * 360;
    const spin = (Math.random() * 2 - 1) * 640;
    const delay = Math.random() * 100;
    const duration = (upward + Math.sqrt(upward ** 2 + 2 * gravity * fallDistance)) / gravity;
    const frames = Array.from({ length: 25 }, (_, step) => {
      const offset = step / 24;
      const time = offset * duration;
      const x = sideways * (1 - Math.exp(-1.8 * time)) / 1.8 + Math.sin(time * 8 + index) * time * 9;
      const y = -upward * time + gravity * time ** 2 / 2;
      return {
        offset,
        transform: `translate(${x}px, ${y}px) rotate(${spin * time}deg) rotateY(${time * (280 + index * 19)}deg)`,
        opacity: Math.min(1, (1 - offset) * 7),
      };
    });
    const flight = piece.animate(frames, { duration: duration * 1000, delay, fill: 'both' });
    flight.finished.then(() => piece.remove(), () => piece.remove());
  }
}

renderSetup();
