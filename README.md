# Ruta MA — Massachusetts RMV practice

Bilingual Class D study app using the complete 150-question question bank prepared for Diego.

## Features

- Spanish, English, and bilingual question display.
- 25 random questions, a 25-minute absolute deadline, and a passing threshold of 18 correct answers.
- Four randomized answer positions, question navigation, and review flags.
- No answer feedback until an exam is submitted or expires.
- Untimed topic practice with immediate explanations and source references.
- Correct / incorrect / unanswered counts, detailed review, and repeated mistake practice.
- Browser-local history and resumable active sessions; reloading does not reset the exam clock.
- Optional browser text-to-speech; no microphone access or external speech service.
- Complete PDF question-bank download and links to official RMV sources.

This is independent practice software, not an RMV product or a copy of its internal exam bank. Official sources were consulted on October 19, 2026; the source manuals identify an April 2026 revision.

## Development

Node.js 22 or later. No dependencies or accounts are required to build.

```sh
npm test
npm run check
npm run build
```

Serve `dist/` with any static HTTP server. The app uses ES modules and loads `questions.json` over HTTP; do not open `index.html` directly with `file://`.

## Vercel

Import this repository into Vercel. The included `vercel.json` uses the Other preset, `npm run build`, and output directory `dist`. No environment variables, database, or paid services are needed.

## Content and privacy

`public/questions.json` contains all 150 questions, translations, correct original answer indices, explanations, topics, and printed English manual page references. Answers are intentionally present in the static study app; this is a learning simulator, not a secure assessment system.

Results and an active attempt stay in localStorage under the `ruta-ma:v1:` prefix. They are not sent to a backend or synchronized across devices. LocalStorage is device/browser-specific and can be lost when browsing data is cleared. The app retains up to 50 completed attempts. As with any client-side timer, changing the device clock can affect timing.

Exam sessions always use 25 questions; topic and mistake practice report a learning score rather than an official pass/fail result. Unanswered questions receive no points and are reported separately from incorrect selections.
