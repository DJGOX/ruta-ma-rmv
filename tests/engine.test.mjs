import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateBank,makeSession,gradeSession,remainingMs,missedIds,isValidSession,EXAM_MS} from '../public/engine.js';
const {questions:bank,topics}=JSON.parse(await readFile(new URL('../public/questions.json',import.meta.url)));
function rng(seed=52){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function exam(){return makeSession(bank,{now:100000,random:rng()});}
function answer(s,correct,wrong=0){for(let i=0;i<correct+wrong;i++){const q=bank.find(x=>x.id===s.questions[i]);s.answers[q.id]=i<correct?q.correct:(q.correct+1)%4;}return s;}
test('all 150 questions and 10 topics are complete and bilingual',()=>{assert.equal(validateBank(bank),true);assert.equal(topics.length,10);for(const q of bank){assert.equal(new Set(q.options.map(o=>o.en)).size,4);assert.equal(new Set(q.options.map(o=>o.es)).size,4);}for(let id=1;id<=10;id++)assert.equal(bank.filter(q=>q.topic===id).length,15);});
test('duplicate bank identifiers are rejected',()=>assert.throws(()=>validateBank([...bank.slice(0,149),bank[0]])));
test('exam draws 25 unique question IDs without modifying the bank',()=>{const before=JSON.stringify(bank);const s=exam();assert.equal(s.questions.length,25);assert.equal(new Set(s.questions).size,25);assert.equal(s.deadline-s.startedAt,EXAM_MS);assert.equal(JSON.stringify(bank),before);});
test('each randomized option order is a complete permutation',()=>{for(const order of Object.values(exam().optionOrders))assert.deepEqual([...order].sort(),[0,1,2,3]);});
test('18 of 25 passes and counts all categories',()=>{const r=gradeSession(answer(exam(),18,7),bank,110000);assert.equal(r.passed,true);assert.equal(r.correct,18);assert.equal(r.wrong,7);assert.equal(r.unanswered,0);assert.equal(r.percent,72);});
test('17 of 25 fails',()=>assert.equal(gradeSession(answer(exam(),17,8),bank,110000).passed,false));
test('unanswered questions do not receive points and remain separate',()=>{const r=gradeSession(answer(exam(),10,5),bank,110000);assert.equal(r.correct,10);assert.equal(r.wrong,5);assert.equal(r.unanswered,10);assert.equal(r.correct+r.wrong+r.unanswered,r.total);assert.equal(r.passed,false);});
test('18 correct answers pass even when 7 remain unanswered',()=>{const r=gradeSession(answer(exam(),18),bank,110000);assert.equal(r.passed,true);assert.equal(r.unanswered,7);});
test('grades original option identities, independent of displayed letters',()=>{const s=exam();for(const id of s.questions){s.optionOrders[id]=[3,2,1,0];s.answers[id]=bank.find(q=>q.id===id).correct;}assert.equal(gradeSession(s,bank,110000).correct,25);});
test('timer uses the absolute deadline and expires at zero after reload',()=>{const s=JSON.parse(JSON.stringify(exam()));assert.equal(remainingMs(s,s.startedAt),EXAM_MS);assert.equal(remainingMs(s,s.startedAt+60000),EXAM_MS-60000);assert.equal(remainingMs(s,s.deadline),0);assert.equal(remainingMs(s,s.deadline+100000),0);});
test('late grading marks timeout and caps elapsed time at 25 minutes',()=>{const s=answer(exam(),12,3);const r=gradeSession(s,bank,s.deadline+3600000);assert.equal(r.timedOut,true);assert.equal(r.durationMs,EXAM_MS);assert.equal(r.unanswered,10);});
test('topic practice contains only its 15 questions and has no deadline',()=>{const s=makeSession(bank,{mode:'topic',topic:8,random:rng()});assert.equal(s.questions.length,15);assert.ok(s.questions.every(id=>bank.find(q=>q.id===id).topic===8));assert.equal(remainingMs(s),null);assert.equal(gradeSession(s,bank).timedOut,false);});
test('mistake practice contains only saved mistakes, without duplicates',()=>{const s=makeSession(bank,{mode:'missed',missed:[1,2,2,80],random:rng()});assert.deepEqual([...s.questions].sort((a,b)=>a-b),[1,2,80]);});
test('empty topic or mistake selections are rejected',()=>{assert.throws(()=>makeSession(bank,{mode:'topic',topic:99}));assert.throws(()=>makeSession(bank,{mode:'missed',missed:[]}));});
test('a later correct answer removes a mistake; unanswered entries are retained',()=>{const a={finishedAt:100,details:[{id:1,outcome:'wrong'},{id:2,outcome:'unanswered'}]};const b={finishedAt:200,details:[{id:1,outcome:'correct'},{id:3,outcome:'wrong'}]};assert.deepEqual(missedIds([b,a]).sort(),[2,3]);});
test('serialized active sessions can be resumed',()=>assert.equal(isValidSession(JSON.parse(JSON.stringify(exam())),bank),true));
test('invalid session navigation or option permutations cannot be resumed',()=>{const a=exam();a.index=-1;assert.equal(isValidSession(a,bank),false);const b=exam();b.optionOrders[b.questions[0]]=[1,1,2,3];assert.equal(isValidSession(b,bank),false);const c=exam();c.questions[0]=999;assert.equal(isValidSession(c,bank),false);});
test('unit-only translations retain their numeric values',()=>{for(const id of [5,65,66,71,72,107,108,119,132,133,146]){const q=bank.find(q=>q.id===id);for(const o of q.options)assert.ok(!/^(feet|seconds|minutes|days)$/.test(o.en));}});
