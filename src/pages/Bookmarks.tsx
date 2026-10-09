import { useEffect } from 'react';
import { Link } from 'react-router';
import { stackBySlug, topics } from '../lib/content';
import { toggle, useProgress } from '../lib/progress';
import { EmptyState, LevelBadge, PageTitle } from '../components/ui';
import type { TopicMeta } from '../types/content';

export default function Bookmarks() {
  const p = useProgress();
  useEffect(() => {
    document.title = 'Saved · Interview Prep Hub';
  }, []);
  const saved = topics.filter((t) => p.bookmarks[t.id]).sort((a, b) => p.bookmarks[b.id] - p.bookmarks[a.id]);
  const revise = topics.filter((t) => p.revise[t.id]);

  return (
    <div className="max-w-3xl">
      <PageTitle title="★ Saved" subtitle="Your bookmarks and your “revise later” list." />
      <section aria-labelledby="bm-h" className="mb-8">
        <h2 id="bm-h" className="mb-3 text-lg font-bold">Bookmarks ({saved.length})</h2>
        {saved.length ? <List items={saved} onRemove={(id) => toggle('bookmarks', id, false)} /> : <EmptyState>Tap “☆ Bookmark” on any topic to save it here.</EmptyState>}
      </section>
      <section aria-labelledby="rv-h">
        <h2 id="rv-h" className="mb-3 text-lg font-bold">Revise later ({revise.length})</h2>
        {revise.length ? <List items={revise} onRemove={(id) => toggle('revise', id, false)} /> : <EmptyState>Nothing to revise. 🎉</EmptyState>}
      </section>
    </div>
  );
}

function List({ items, onRemove }: { items: TopicMeta[]; onRemove: (id: string) => void }) {
  return (
    <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
      {items.map((t) => (
        <li key={t.id} className="flex items-center gap-3 px-4 py-3">
          <Link to={`/topic/${t.id}`} className="flex-1 hover:underline">
            <span className="block font-medium">{t.title}</span>
            <span className="text-xs text-slate-500">{stackBySlug.get(t.stack)?.icon} {stackBySlug.get(t.stack)?.title}</span>
          </Link>
          <LevelBadge level={t.level} />
          <button onClick={() => onRemove(t.id)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label={`Remove ${t.title}`}>✕</button>
        </li>
      ))}
    </ul>
  );
}
