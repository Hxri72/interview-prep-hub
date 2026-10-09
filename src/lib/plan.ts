/** Builds "Today's plan": 3 topics + 5 flashcards + 1 problem. */
import { topics, problems } from './content';
import type { Progress } from './progress';
import type { Card } from '../types/content';

/** Small seeded random, so the plan stays the same all day and changes tomorrow. */
function seededShuffle<T>(list: T[], seed: number): T[] {
  const out = [...list];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const todaySeed = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export function planTopics(p: Progress, count = 3) {
  // 1) topics you marked "revise later" (oldest first)
  const revise = topics.filter((t) => p.revise[t.id]).sort((a, b) => p.revise[a.id] - p.revise[b.id]);
  // 2) must-know topics you haven't learned, in stack order
  const mustKnow = topics.filter((t) => !p.learned[t.id] && !p.revise[t.id] && t.mustKnow);
  // 3) everything else you haven't learned
  const rest = topics.filter((t) => !p.learned[t.id] && !p.revise[t.id] && !t.mustKnow);
  return [...revise, ...mustKnow, ...rest].slice(0, count);
}

/** Every flashcard id ("stack/slug#0"), built from topic metadata — no need to download the cards. */
export const allCardIds = (): string[] => topics.flatMap((t) => Array.from({ length: t.cardCount }, (_, i) => `${t.id}#${i}`));

/** Today's flashcard ids: ones you got wrong last time first, then ones you have never tried. */
export function planCardIds(p: Progress, input: string[], count = 5): string[] {
  const ids = [...input].sort(); // same order everywhere, so Dashboard and Rapid Fire pick the same cards
  const wrong = ids.filter((id) => p.cards[id] && !p.cards[id].knew);
  const fresh = ids.filter((id) => !p.cards[id]);
  const pool = [...seededShuffle(wrong, todaySeed()), ...seededShuffle(fresh, todaySeed())];
  return (pool.length ? pool : seededShuffle(ids, todaySeed())).slice(0, count);
}

export function planCards(p: Progress, cards: Card[], count = 5): Card[] {
  const byId = new Map(cards.map((c) => [c.id, c]));
  return planCardIds(p, cards.map((c) => c.id), count).map((id) => byId.get(id)!);
}

export function planProblem(p: Progress) {
  return problems.find((x) => !p.solved[x.id]) ?? problems[0];
}
