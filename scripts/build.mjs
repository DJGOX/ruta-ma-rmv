import { cp, mkdir, rm, readFile } from 'node:fs/promises';
import { validateBank } from '../public/engine.js';
const data = JSON.parse(await readFile(new URL('../public/questions.json', import.meta.url)));
validateBank(data.questions);
await rm(new URL('../dist', import.meta.url), { recursive: true, force: true });
await mkdir(new URL('../dist', import.meta.url), { recursive: true });
await cp(new URL('../public/', import.meta.url), new URL('../dist/', import.meta.url), { recursive: true });
console.log(`Built static site: ${data.questions.length} bilingual questions, ${data.topics.length} topics.`);
