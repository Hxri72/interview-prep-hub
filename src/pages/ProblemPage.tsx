import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { loadProblem, problems, topicById } from '../lib/content';
import { toggle, useProgress } from '../lib/progress';
import Prose from '../components/Prose';
import Spinner from '../components/Spinner';
import { Badge, LevelBadge, btn } from '../components/ui';
import NotFound from './NotFound';

export default function ProblemPage() {
  const { slug = '' } = useParams();
  const idx = problems.findIndex((x) => x.slug === slug);
  const meta = problems[idx];
  const [html, setHtml] = useState<string | null>(null);
  const p = useProgress();

  useEffect(() => {
    let alive = true;
    setHtml(null);
    if (meta) {
      document.title = `${meta.title} · Practice · Interview Prep Hub`;
      loadProblem(slug).then((b) => alive && setHtml(b?.html ?? ''));
    }
    return () => {
      alive = false;
    };
  }, [slug, meta]);

  if (!meta) return <NotFound />;
  const solved = !!p.solved[meta.id];
  const topic = meta.topic ? topicById.get(meta.topic) : undefined;
  const prev = problems[idx - 1];
  const next = problems[idx + 1];

  return (
    <article className="max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-slate-500">
        <Link to="/problems" className="hover:underline">🧩 Practice Problems</Link>
      </nav>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{meta.title}</h1>
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-2">
        <LevelBadge level={meta.difficulty} />
        {meta.pattern && <Badge className="bg-slate-100 text-slate-700">Pattern: {meta.pattern}</Badge>}
        {topic && <Link to={`/topic/${topic.id}`} className="text-sm text-brand-700 hover:underline">Learn the idea: {topic.title} →</Link>}
      </div>
      {html === null ? <Spinner /> : <Prose html={html} />}
      <div className="my-6">
        <button onClick={() => toggle('solved', meta.id)} aria-pressed={solved} className={`${btn.base} ${solved ? 'bg-emerald-700 text-white hover:bg-emerald-800' : btn.primary}`}>
          {solved ? '✓ Solved' : 'Mark as solved'}
        </button>
      </div>
      <nav aria-label="Previous and next problem" className="grid gap-3 sm:grid-cols-2">
        {prev ? <Link to={`/problems/${prev.slug}`} className="rounded-xl border border-slate-200 p-4 hover:border-brand-500"><span className="text-xs text-slate-500">← Previous</span><span className="block font-semibold">{prev.title}</span></Link> : <span />}
        {next && <Link to={`/problems/${next.slug}`} className="rounded-xl border border-slate-200 p-4 text-right hover:border-brand-500"><span className="text-xs text-slate-500">Next →</span><span className="block font-semibold">{next.title}</span></Link>}
      </nav>
    </article>
  );
}
