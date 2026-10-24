import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { formatMinutes, stackBySlug, topicsOf } from '../lib/content';
import { useProgress } from '../lib/progress';
import { EmptyState, LevelBadge, PageTitle, ProgressBar } from '../components/ui';
import NotFound from './NotFound';
import type { TopicMeta } from '../types/content';

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
  const totalMin = list.reduce((sum, t) => sum + t.readMinutes, 0);
  // stacks with subsections show one list per section, in the order from stacks.yaml
  const groups: { title?: string; topics: TopicMeta[] }[] = info.sections
    ? info.sections.map((title: string) => ({ title, topics: list.filter((t) => t.section === title) })).filter((g: { topics: TopicMeta[] }) => g.topics.length)
    : [{ topics: list }];
  const leftMin = list.filter((t) => !p.learned[t.id]).reduce((sum, t) => sum + t.readMinutes, 0);

  return (
    <div className="max-w-3xl">
      <PageTitle title={`${info.icon} ${info.title}`} subtitle={info.description} />
      <div className="mb-6">
        <p className="mb-1 text-sm text-slate-600">
          {done} of {list.length} learned · {list.length} of {info.planned} topics written
        </p>
        {list.length > 0 && (
          <p className="mb-1 text-sm text-slate-600">
            ⏱ About {formatMinutes(totalMin)} to read the whole stack{done > 0 && leftMin > 0 ? ` · ${formatMinutes(leftMin)} left` : ''}
          </p>
        )}
        <ProgressBar value={done} total={list.length} label={`${info.title} progress`} />
      </div>
      {list.length ? (
        groups.map((g) => (
          <section key={g.title ?? 'all'} className="mb-6">
            {g.title && <h2 className="mb-2 text-sm font-bold tracking-wider text-slate-500 uppercase">{g.title}</h2>}
            <ol className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
              {g.topics.map((t) => (
                <li key={t.id}>
                  <Link to={`/topic/${t.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                    <span className="w-6 text-right text-sm text-slate-400 tabular-nums">{t.order}</span>
                    <span className="flex-1 font-medium">
                      {t.title}
                      {t.mustKnow && <span className="ml-2 text-xs" aria-label="must know">⭐</span>}
                    </span>
                    <LevelBadge level={t.level} />
                    <span className="hidden w-12 text-right text-xs text-slate-500 tabular-nums sm:inline">{t.readMinutes} min</span>
                    <span className="w-5 text-center" aria-label={p.learned[t.id] ? 'learned' : 'not learned'}>
                      {p.learned[t.id] ? <span className="text-emerald-600">✓</span> : p.revise[t.id] ? '🔁' : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))
      ) : (
        <EmptyState>Topics for this stack are coming soon.</EmptyState>
      )}
    </div>
  );
}
