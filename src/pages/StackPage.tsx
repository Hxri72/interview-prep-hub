import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { stackBySlug, topicsOf } from '../lib/content';
import { useProgress } from '../lib/progress';
import { EmptyState, LevelBadge, PageTitle, ProgressBar } from '../components/ui';
import NotFound from './NotFound';

export default function StackPage() {
  const { stack = '' } = useParams();
  const info = stackBySlug.get(stack);
  const p = useProgress();
  useEffect(() => {
    if (info) document.title = `${info.title} · Interview Prep Hub`;
  }, [info]);
  if (!info) return <NotFound />;

  const list = topicsOf(stack);
  const done = list.filter((t) => p.learned[t.id]).length;

  return (
    <div className="max-w-3xl">
      <PageTitle title={`${info.icon} ${info.title}`} subtitle={info.description} />
      <div className="mb-6">
        <p className="mb-1 text-sm text-slate-600">
          {done} of {list.length} learned · {list.length} of {info.planned} topics written
        </p>
        <ProgressBar value={done} total={list.length} label={`${info.title} progress`} />
      </div>
      {list.length ? (
        <ol className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
          {list.map((t) => (
            <li key={t.id}>
              <Link to={`/topic/${t.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <span className="w-6 text-right text-sm text-slate-400 tabular-nums">{t.order}</span>
                <span className="flex-1 font-medium">
                  {t.title}
                  {t.mustKnow && <span className="ml-2 text-xs" aria-label="must know">⭐</span>}
                </span>
                <LevelBadge level={t.level} />
                <span className="w-5 text-center" aria-label={p.learned[t.id] ? 'learned' : 'not learned'}>
                  {p.learned[t.id] ? <span className="text-emerald-600">✓</span> : p.revise[t.id] ? '🔁' : ''}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState>Topics for this stack are coming soon.</EmptyState>
      )}
    </div>
  );
}
