import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { stackGroups, stackBySlug, topicById, topics, topicsOf, problems } from '../lib/content';
import { exportProgress, importProgress, resetProgress, useProgress } from '../lib/progress';
import { allCardIds, planCardIds, planProblem, planTopics } from '../lib/plan';
import { Card, LevelBadge, PageTitle, ProgressBar, btn } from '../components/ui';

export default function Dashboard() {
  const p = useProgress();
  useEffect(() => {
    document.title = 'Interview Prep Hub';
  }, []);

  const learnedCount = topics.filter((t) => p.learned[t.id]).length;
  const last = p.lastVisited && topicById.get(p.lastVisited.id);
  const reviseList = topics.filter((t) => p.revise[t.id]);
  const todayTopics = planTopics(p);
  const cardIds = allCardIds();
  const todayCards = planCardIds(p, cardIds);
  const todayProblem = planProblem(p);
  const cardsKnown = Object.values(p.cards).filter((c) => c.knew).length;

  return (
    <div className="max-w-5xl">
      <PageTitle title="Dashboard" subtitle="Small steps every day. Learn a topic, test yourself, then solve one problem." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Topics learned" value={`${learnedCount} / ${topics.length}`} />
        <Stat label="Flashcards known" value={`${cardsKnown} / ${cardIds.length}`} />
        <Stat label="Problems solved" value={`${Object.keys(p.solved).length} / ${problems.length}`} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-bold">▶️ Continue where you left off</h2>
          {last ? (
            <Link to={`/topic/${last.id}`} className="block rounded-xl bg-slate-50 p-4 hover:bg-brand-50">
              <span className="text-xs text-slate-500">{stackBySlug.get(last.stack)?.icon} {stackBySlug.get(last.stack)?.title}</span>
              <span className="block font-semibold">{last.title}</span>
            </Link>
          ) : (
            <p className="text-slate-600">Nothing yet. Pick a topic from the menu, or start with today's plan.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-bold">📅 Today's plan</h2>
          <ol className="space-y-3 text-sm">
            <li>
              <p className="font-semibold">1. Learn {todayTopics.length} topic{todayTopics.length === 1 ? '' : 's'}</p>
              <ul className="mt-1 space-y-1">
                {todayTopics.map((t) => (
                  <li key={t.id}>
                    <Link to={`/topic/${t.id}`} className="text-brand-700 hover:underline">{t.title}</Link>
                    <span className="text-slate-500"> · {stackBySlug.get(t.stack)?.title}{p.revise[t.id] ? ' · revise' : ''}</span>
                  </li>
                ))}
                {!todayTopics.length && <li className="text-slate-500">All topics learned 🎉</li>}
              </ul>
            </li>
            <li>
              <p className="font-semibold">2. Answer {todayCards.length || 5} rapid-fire questions</p>
              <Link to="/rapid-fire?mode=today" className="text-brand-700 hover:underline">Start today's flashcards →</Link>
            </li>
            <li>
              <p className="font-semibold">3. Solve 1 array problem</p>
              {todayProblem ? (
                <Link to={`/problems/${todayProblem.slug}`} className="text-brand-700 hover:underline">{todayProblem.title}</Link>
              ) : (
                <span className="text-slate-500">No problems yet.</span>
              )}
            </li>
          </ol>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-bold">🔁 Revise later ({reviseList.length})</h2>
          {reviseList.length ? (
            <ul className="space-y-2">
              {reviseList.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <Link to={`/topic/${t.id}`} className="text-brand-700 hover:underline">{t.title}</Link>
                  <LevelBadge level={t.level} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">Tap “Revise later” on any topic to see it here.</p>
          )}
        </Card>

        <DataCard />

        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold">📊 Progress by stack</h2>
          <div className="grid gap-x-8 md:grid-cols-2">
          {stackGroups().map((g) => (
            <div key={g.label} className="mb-4">
              <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">{g.label}</h3>
              <ul className="space-y-2.5">
                {g.stacks.map((s) => {
                  const list = topicsOf(s.slug);
                  const done = list.filter((t) => p.learned[t.id]).length;
                  const pct = list.length ? Math.round((done / list.length) * 100) : 0;
                  return (
                    <li key={s.slug}>
                      <Link to={`/stack/${s.slug}`} className="block hover:opacity-80">
                        <span className="flex justify-between text-sm">
                          <span>{s.icon} {s.title}</span>
                          <span className="text-slate-500 tabular-nums">{list.length ? `${done}/${list.length} · ${pct}%` : 'coming soon'}</span>
                        </span>
                        <ProgressBar value={done} total={list.length} label={`${s.title} progress`} className="mt-1" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </Card>
  );
}

/** Progress lives in this browser only, so offer a way to move it between devices. */
function DataCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `interview-prep-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">💾 Your progress data</h2>
      <p className="mb-3 text-sm text-slate-600">Saved only in this browser. Export it to move it to your phone or laptop.</p>
      <div className="flex flex-wrap gap-2">
        <button className={`${btn.base} ${btn.secondary}`} onClick={download}>Export</button>
        <button className={`${btn.base} ${btn.secondary}`} onClick={() => fileRef.current?.click()}>Import</button>
        <button
          className={`${btn.base} ${btn.ghost} text-rose-700`}
          onClick={() => confirm('Delete all progress on this device? This cannot be undone.') && (resetProgress(), setMsg('Progress reset.'))}
        >
          Reset
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            importProgress(await f.text());
            setMsg('Progress imported ✓');
          } catch (err) {
            setMsg(`Import failed: ${(err as Error).message}`);
          }
          e.target.value = '';
        }}
      />
      {msg && <p role="status" className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
