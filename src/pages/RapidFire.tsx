import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { stackBySlug, topicById } from '../lib/content';
import { useCards } from '../lib/lazyData';
import { recordCard, useProgress } from '../lib/progress';
import { planCards } from '../lib/plan';
import StackFilter from '../components/StackFilter';
import Spinner from '../components/Spinner';
import { EmptyState, PageTitle, btn } from '../components/ui';
import type { Card } from '../types/content';

type Mode = 'today' | 'weak' | 'all';

export default function RapidFire() {
  const [params, setParams] = useSearchParams();
  const allCards = useCards();
  const p = useProgress();
  const stack = params.get('stack') ?? '';
  const topic = params.get('topic') ?? '';
  const mode = (params.get('mode') as Mode) || (topic ? 'all' : 'today');

  // the deck is fixed when you start, so answering a card doesn't reshuffle it
  const [deck, setDeck] = useState<Card[] | null>(null);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState({ right: 0, wrong: 0 });

  useEffect(() => {
    document.title = 'Rapid Fire · Interview Prep Hub';
  }, []);

  const build = useCallback(() => {
    if (!allCards) return;
    let pool = allCards.filter((c) => (!topic || c.topicId === topic) && (!stack || topicById.get(c.topicId)?.stack === stack));
    if (mode === 'today') pool = planCards(p, pool);
    if (mode === 'weak') pool = pool.filter((c) => p.cards[c.id] && !p.cards[c.id].knew);
    if (mode === 'all') pool = [...pool].sort(() => Math.random() - 0.5);
    setDeck(pool);
    setI(0);
    setFlipped(false);
    setScore({ right: 0, wrong: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards, stack, topic, mode]);
  useEffect(build, [build]);

  const card = deck?.[i];
  const answer = useCallback(
    (knew: boolean) => {
      if (!card) return;
      recordCard(card.id, knew);
      setScore((s) => (knew ? { ...s, right: s.right + 1 } : { ...s, wrong: s.wrong + 1 }));
      setFlipped(false);
      setI((x) => x + 1);
    },
    [card],
  );

  // keyboard: Space flips, 1 = I knew it, 2 = I didn't
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'SELECT') return;
      if (e.key === ' ' && card) { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped && e.key === '1') answer(true);
      if (flipped && e.key === '2') answer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, flipped, answer]);

  const set = (key: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(key, v);
    else next.delete(key);
    if (key !== 'topic') next.delete('topic');
    setParams(next, { replace: true });
  };

  const weakCount = useMemo(() => (allCards ?? []).filter((c) => p.cards[c.id] && !p.cards[c.id].knew).length, [allCards, p.cards]);

  if (!allCards || !deck) return <Spinner />;
  const topicInfo = card && topicById.get(card.topicId);

  return (
    <div className="max-w-2xl">
      <PageTitle title="🎯 Rapid Fire" subtitle="Read the question, answer out loud, then flip the card. Be honest — it decides what you see tomorrow." />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Which cards" className="flex overflow-hidden rounded-lg border border-slate-300">
          {([['today', "Today's 5"], ['weak', `Weak (${weakCount})`], ['all', 'All']] as const).map(([m, label]) => (
            <button key={m} onClick={() => set('mode', m)} aria-pressed={mode === m} className={`min-h-10 px-3 text-sm font-medium ${mode === m ? 'bg-brand-600 text-white' : 'bg-white hover:bg-slate-50'}`}>
              {label}
            </button>
          ))}
        </div>
        <StackFilter value={stack} onChange={(v) => set('stack', v)} />
      </div>
      {topic && (
        <p className="mb-4 text-sm">
          Only cards from <strong>{topicById.get(topic)?.title}</strong>. <button className="text-brand-700 underline" onClick={() => set('topic', '')}>Show all</button>
        </p>
      )}

      {!deck.length ? (
        <EmptyState>{mode === 'weak' ? 'No weak cards — nice work! 🎉' : 'No flashcards here yet.'}</EmptyState>
      ) : card ? (
        <>
          <p className="mb-2 text-sm text-slate-500" aria-live="polite">Card {i + 1} of {deck.length} · ✓ {score.right} · ✗ {score.wrong}</p>
          <div className="flip">
            <button
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? 'Show question' : 'Show answer'}
              className={`flip-inner grid min-h-64 w-full text-left ${flipped ? 'flipped' : ''}`}
            >
              <div aria-hidden={flipped} className="flip-face col-start-1 row-start-1 flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Question</span>
                <span className="my-auto py-6 text-xl font-semibold">{card.q}</span>
                <span className="text-sm text-slate-500">Tap or press Space to flip</span>
              </div>
              <div aria-hidden={!flipped} className="flip-face flip-back col-start-1 row-start-1 flex flex-col rounded-2xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm">
                <span className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">Answer</span>
                <span className="my-auto py-6 text-lg">{card.a}</span>
                {topicInfo && <span className="text-sm text-slate-500">{stackBySlug.get(topicInfo.stack)?.icon} {topicInfo.title}</span>}
              </div>
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button disabled={!flipped} onClick={() => answer(false)} className={`${btn.base} border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100`}>
              ✗ I didn't <kbd className="hidden text-xs opacity-60 sm:inline">2</kbd>
            </button>
            <button disabled={!flipped} onClick={() => answer(true)} className={`${btn.base} bg-emerald-700 text-white hover:bg-emerald-800`}>
              ✓ I knew it <kbd className="hidden text-xs opacity-70 sm:inline">1</kbd>
            </button>
          </div>
          {!flipped && <p className="mt-2 text-center text-xs text-slate-500">Flip the card first, then tell the truth 🙂</p>}
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 p-6 text-center">
          <p className="text-4xl" aria-hidden>🏁</p>
          <h2 className="mt-2 text-xl font-bold">Done! You knew {score.right} of {deck.length}.</h2>
          <p className="mt-1 text-slate-600">The ones you missed are saved under “Weak”.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button onClick={build} className={`${btn.base} ${btn.primary}`}>Go again</button>
            <Link to="/" className={`${btn.base} ${btn.secondary}`}>Back to dashboard</Link>
          </div>
        </div>
      )}
    </div>
  );
}
