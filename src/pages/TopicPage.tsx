import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { loadTopic, neighbours, stackBySlug, topicById } from '../lib/content';
import { toggle, useProgress, visit } from '../lib/progress';
import type { TopicBody } from '../types/content';
import Prose from '../components/Prose';
import Spinner from '../components/Spinner';
import { Badge, LevelBadge, btn } from '../components/ui';
import NotFound from './NotFound';

const freqStyle: Record<string, string> = {
  'very common': 'bg-brand-100 text-brand-700',
  common: 'bg-slate-100 text-slate-700',
  sometimes: 'bg-slate-100 text-slate-600',
};

export default function TopicPage() {
  const { stack = '', slug = '' } = useParams();
  const id = `${stack}/${slug}`;
  const meta = topicById.get(id);
  const [body, setBody] = useState<TopicBody | null>(null);
  const progress = useProgress();

  useEffect(() => {
    let alive = true;
    setBody(null);
    if (meta) {
      visit(id);
      loadTopic(id).then((b) => alive && setBody(b ?? null));
      document.title = `${meta.title} · Interview Prep Hub`;
    }
    return () => {
      alive = false;
    };
  }, [id, meta]);

  if (!meta) return <NotFound />;
  const stackInfo = stackBySlug.get(stack);
  const { prev, next } = neighbours(id);
  const learned = !!progress.learned[id];
  const revise = !!progress.revise[id];
  const saved = !!progress.bookmarks[id];

  const actions = (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => toggle('learned', id)} aria-pressed={learned} className={`${btn.base} ${learned ? 'bg-emerald-700 text-white hover:bg-emerald-800' : btn.primary}`}>
        {learned ? '✓ Learned' : 'Mark as learned'}
      </button>
      <button onClick={() => toggle('revise', id)} aria-pressed={revise} className={`${btn.base} ${revise ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300' : btn.secondary}`}>
        🔁 {revise ? 'In revise list' : 'Revise later'}
      </button>
      <button onClick={() => toggle('bookmarks', id)} aria-pressed={saved} className={`${btn.base} ${saved ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-300' : btn.secondary}`}>
        {saved ? '★ Bookmarked' : '☆ Bookmark'}
      </button>
    </div>
  );

  return (
    <div className="flex gap-10">
      <article className="min-w-0 max-w-3xl flex-1">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-slate-500">
          <Link to={`/stack/${stack}`} className="hover:underline">{stackInfo?.icon} {stackInfo?.title}</Link>
          <span aria-hidden> / </span>
          <span>Topic {meta.order}</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{meta.title}</h1>
        <div className="mt-3 mb-5 flex flex-wrap items-center gap-2">
          <LevelBadge level={meta.level} />
          {meta.mustKnow && <Badge className="bg-rose-100 text-rose-800">⭐ Must know</Badge>}
          <Badge className={freqStyle[meta.askedFrequency]}>Asked: {meta.askedFrequency}</Badge>
        </div>
        <div className="mb-6">{actions}</div>

        {body === null ? <Spinner /> : <Prose html={body.html} />}

        {body && body.summary.length > 0 && (
          <section aria-labelledby="summary-h" className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-6">
            <h2 id="summary-h" className="mb-2 text-lg font-bold">📝 Remember this</h2>
            <ul className="list-disc space-y-1 pl-5">
              {body.summary.map((s) => <li key={s}>{s}</li>)}
            </ul>
            {meta.cardCount > 0 && (
              <Link to={`/rapid-fire?topic=${encodeURIComponent(id)}`} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
                ⚡ Test yourself with {meta.cardCount} flashcards →
              </Link>
            )}
          </section>
        )}

        <div className="mb-8 border-t border-slate-200 pt-6">{actions}</div>

        <nav aria-label="Previous and next topic" className="grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link to={`/topic/${prev.id}`} className="rounded-xl border border-slate-200 p-4 hover:border-brand-500">
              <span className="text-xs text-slate-500">← Previous</span>
              <span className="block font-semibold">{prev.title}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link to={`/topic/${next.id}`} className="rounded-xl border border-slate-200 p-4 text-right hover:border-brand-500">
              <span className="text-xs text-slate-500">Next →</span>
              <span className="block font-semibold">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>

      {/* "On this page" list, only on wide screens */}
      {body && body.toc.length > 0 && (
        <aside className="sticky top-20 hidden h-fit w-56 shrink-0 xl:block" aria-label="On this page">
          <p className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">On this page</p>
          <ul className="space-y-1 text-sm">
            {body.toc.map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => {
                    const el = document.getElementById(h.id);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    el?.closest('section')?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
                  }}
                  className="text-left text-slate-600 hover:text-brand-700"
                >
                  {h.title}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
