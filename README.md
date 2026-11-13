# Wolkenrechnen

Ein deutschsprachiger Trainer für das kleine Einmaleins. Wähle eine Dauer (5, 10, 15 oder 30 Minuten) und mindestens eine der Reihen von 1 bis 10. Tippe das Ergebnis ein und bestätige mit Enter. Auf dem iPad und anderen Touchgeräten stehen ein Ziffernblock und „Prüfen“ zur Verfügung. Ist die Antwort richtig, erscheint sofort die nächste Aufgabe. Die Runde endet mit Ablauf der Zeit oder über „Beenden“.

## Lokal starten

```sh
python3 -m http.server 8000
```

Öffne [localhost:8000](http://localhost:8000). Die App verwendet native ES-Module und CSS. Sie braucht keine installierten JavaScript-Pakete. Für das GitHub-Pages-Artefakt in `dist/` genügt `node scripts/build.mjs` mit Node.js 24.

## Auf GitHub Pages veröffentlichen

1. Lege ein GitHub-Repository an und übertrage die Projektdateien einschließlich `.github/workflows/deploy.yml` auf den Branch `main`.
2. Wähle im Repository unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions**.
3. Starte den Workflow im Tab **Actions** oder pushe erneut auf `main`. Der Deployment-Job zeigt die URL an. Die relativen Asset-Pfade funktionieren auch unter `/<repository>/`.

## Aufgabenauswahl und Fortschritt

Jede Aufgabe von `1 × 1` bis `10 × 10` ist ein Arm eines Multi-Armed Bandit. Thompson Sampling zieht für jede verfügbare Aufgabe einen Wert aus ihrer Beta-Verteilung. Der Wert schätzt den Übungsbedarf. Jede ausgewählte Reihe kommt zuerst einmal dran. Anschließend kann der Bandit aus allen ausgewählten Reihen wählen. Für die Schätzung zählt der erste Versuch jeder Aufgabe. Neuere Versuche erhalten mehr Gewicht. Ein kleiner Bonus für noch ungelöste Aufgaben und der Ausschluss der beiden letzten Aufgaben unterstützen Abwechslung und das Abschließen einer Reihe.

Drei direkt gelöste Aufgaben in Folge und jede vollständig gelöste Reihe lösen Konfetti aus. Die App berücksichtigt die Systemeinstellung für reduzierte Bewegung. Die Abschlussübersicht fasst beobachtete Stärken und Übungsaufgaben aus der gerade beendeten Runde zusammen.

Die Auswahl und der Lernstand liegen in `localStorage` des Browsers. Eine laufende Runde liegt im Arbeitsspeicher. Die App verwendet keine Konten, Tracker oder externen Ressourcen.

Inspiration für die adaptive Auswahl war [KeyZen MAB von Adam Gradzki](https://adamgradzki.com/keyzen-mab/). Das Sampling orientiert sich an [A Tutorial on Thompson Sampling](https://web.stanford.edu/~bvr/pubs/TS_Tutorial.pdf).
