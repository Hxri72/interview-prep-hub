import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { problems } from '../lib/content';
import { useProgress } from '../lib/progress';
import { EmptyState, LevelBadge, PageTitle } from '../components/ui';

export default function Problems() {
  const p = useProgress();
  const [pattern, setPattern] = useState('');
  useEffect(() => {
    document.title = 'Practice Problems · Interview Prep Hub';
  }, []);
  const patterns = [...new Set(problems.map((x) => x.pattern).filter(Boolean))];
  const list = problems.filter((x) => !pattern || x.pattern === pattern);

  return (
    <div className="max-w-3xl">
      <PageTitle title="🧩 Practice Problems" subtitle="Try each problem yourself for 10–15 minutes before opening the solution. Every solution is shown two ways: array methods and plain loops." />
      {patterns.length > 0 && (
        <label className="mb-4 flex items-center gap-2 text-sm">
          <span className="font-medium">Pattern</span>
          <select value={pattern} onChange={(e) => setPattern(e.target.value)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">All patterns</option>
            {patterns.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
      )}
      {list.length ? (
        <ol className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
          {list.map((x) => (
            <li key={x.id}>
              <Link to={`/problems/${x.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <span className="w-6 text-right text-sm text-slate-400 tabular-nums">{x.order}</span>
                <span className="flex-1">
                  <span className="block font-medium">{x.title}</span>
                  {x.pattern && <span className="text-xs text-slate-500">{x.pattern}</span>}
                </span>
                <LevelBadge level={x.difficulty} />
                <span className="w-5 text-center text-emerald-600" aria-label={p.solved[x.id] ? 'solved' : 'not solved'}>{p.solved[x.id] ? '✓' : ''}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState>No problems yet.</EmptyState>
      )}
    </div>
  );
}
