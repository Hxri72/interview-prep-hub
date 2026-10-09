import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { stackBySlug, topics } from '../lib/content';
import { useSummaries } from '../lib/lazyData';
import { useProgress } from '../lib/progress';
import StackFilter from '../components/StackFilter';
import Spinner from '../components/Spinner';
import { EmptyState, LevelBadge, PageTitle } from '../components/ui';

export default function QuickRevise() {
  const [params, setParams] = useSearchParams();
  const stack = params.get('stack') ?? '';
  const onlyMust = params.get('must') === '1';
  const summaries = useSummaries();
  const p = useProgress();
  useEffect(() => {
    document.title = 'Quick Revise · Interview Prep Hub';
  }, []);

  const update = (key: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(key, v);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const list = topics.filter((t) => (!stack || t.stack === stack) && (!onlyMust || t.mustKnow));

  return (
    <div className="max-w-4xl">
      <PageTitle title="⚡ Quick Revise" subtitle="The key points of every topic on one screen. Read this the night before an interview." />
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <StackFilter value={stack} onChange={(v) => update('stack', v)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyMust} onChange={(e) => update('must', e.target.checked ? '1' : '')} className="size-4 accent-brand-600" />
          Must-know only
        </label>
        <span className="text-sm text-slate-500">{list.length} topics</span>
      </div>
      {!summaries ? (
        <Spinner />
      ) : list.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((t) => (
            <article key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="font-bold">
                  <Link to={`/topic/${t.id}`} className="hover:underline">{t.title}</Link>
                  {p.learned[t.id] && <span className="ml-1 text-emerald-600" aria-label="learned">✓</span>}
                </h2>
                <LevelBadge level={t.level} />
              </div>
              <p className="mb-2 text-xs text-slate-500">{stackBySlug.get(t.stack)?.icon} {stackBySlug.get(t.stack)?.title}{t.mustKnow ? ' · ⭐ must know' : ''}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {(summaries[t.id] ?? []).map((s) => <li key={s}>{s}</li>)}
              </ul>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState>No topics match this filter yet.</EmptyState>
      )}
    </div>
  );
}
