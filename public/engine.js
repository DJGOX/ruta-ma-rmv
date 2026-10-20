export const EXAM_SIZE = 25;
export const PASS_COUNT = 18;
export const EXAM_MS = 25 * 60 * 1000;

export function validateBank(questions) {
  if (!Array.isArray(questions) || questions.length !== 150) throw new Error('Expected 150 questions.');
  const ids = new Set();
  for (const q of questions) {
    if (!Number.isInteger(q.id) || ids.has(q.id) || q.id < 1 || q.id > 150) throw new Error('Invalid or duplicate question ID.');
    ids.add(q.id);
    if (!Number.isInteger(q.topic) || q.topic < 1 || q.topic > 10) throw new Error('Invalid topic.');
    if (!q.es || !q.en || !q.explanation?.es || !q.explanation?.en || !q.source) throw new Error('Incomplete bilingual question.');
    if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some(o => !o.es || !o.en)) throw new Error('Invalid options.');
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) throw new Error('Invalid answer.');
  }
  return true;
}

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function makeSession(bank, {mode = 'exam', topic = null, missed = [], now = Date.now(), random = Math.random} = {}) {
  if (!['exam','topic','missed'].includes(mode)) throw new Error('Invalid mode.');
  let pool = mode === 'topic' ? bank.filter(q => q.topic === topic) : mode === 'missed' ? bank.filter(q => missed.includes(q.id)) : bank;
  if (!pool.length) throw new Error('No questions available.');
  const selected = shuffle(pool, random).slice(0, mode === 'exam' ? EXAM_SIZE : pool.length);
  if (mode === 'exam' && selected.length !== EXAM_SIZE) throw new Error('Not enough exam questions.');
  return {
    id: `attempt-${now}-${Math.floor(random()*1e9)}`,
    mode, topic, startedAt: now, deadline: mode === 'exam' ? now + EXAM_MS : null,
    index: 0, questions: selected.map(q => q.id),
    optionOrders: Object.fromEntries(selected.map(q => [q.id, shuffle([0,1,2,3], random)])),
    answers: {}, flags: [], checked: [], status: 'active'
  };
}

export function remainingMs(session, now = Date.now()) {
  return session.deadline === null ? null : Math.max(0, session.deadline - now);
}

export function gradeSession(session, bank, now = Date.now()) {
  const byId = new Map(bank.map(q => [q.id, q]));
  const details = session.questions.map(id => {
    const q = byId.get(id);
    if (!q) throw new Error('Question not found.');
    const selected = session.answers[id];
    const answered = Number.isInteger(selected) && selected >= 0 && selected < 4;
    return {id, topic:q.topic, selected:answered ? selected : null, correct:q.correct, outcome: !answered ? 'unanswered' : selected === q.correct ? 'correct' : 'wrong'};
  });
  const correct = details.filter(d => d.outcome === 'correct').length;
  const wrong = details.filter(d => d.outcome === 'wrong').length;
  const unanswered = details.length - correct - wrong;
  const required = session.mode === 'exam' ? PASS_COUNT : Math.ceil(details.length * .72);
  const finishAt = Math.min(now, session.deadline ?? now);
  return {id:session.id,mode:session.mode,topic:session.topic,finishedAt:finishAt,startedAt:session.startedAt,
    durationMs:Math.max(0,finishAt-session.startedAt),total:details.length,correct,wrong,unanswered,
    percent:Math.round(correct/details.length*100),required,passed:correct>=required,
    timedOut:session.deadline !== null && now>=session.deadline,details};
}

export function missedIds(history) {
  const latest = new Map();
  for (const result of [...history].sort((a,b)=>a.finishedAt-b.finishedAt)) {
    for (const d of result.details) latest.set(d.id,d.outcome);
  }
  return [...latest].filter(([,outcome])=>outcome!=='correct').map(([id])=>id);
}

export function isValidSession(s, bank) {
  if (!s || s.status !== 'active' || !['exam','topic','missed'].includes(s.mode) || !Array.isArray(s.questions) || !s.questions.length) return false;
  if (!Number.isFinite(s.startedAt) || (s.mode==='exam' && (!Number.isFinite(s.deadline) || s.questions.length !== EXAM_SIZE))) return false;
  if (s.mode !== 'exam' && s.deadline !== null) return false;
  if (new Set(s.questions).size !== s.questions.length || !s.answers || !Array.isArray(s.checked) || !Array.isArray(s.flags)) return false;
  if (!Number.isInteger(s.index) || s.index<0 || s.index>=s.questions.length || typeof s.id!=='string') return false;
  const ids = new Set(bank.map(q=>q.id));
  return s.questions.every(id=>ids.has(id) && Array.isArray(s.optionOrders?.[id]) && [...s.optionOrders[id]].sort().join(',')==='0,1,2,3');
}
