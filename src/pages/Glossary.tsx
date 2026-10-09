import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { glossary } from '../lib/content';
import { PageTitle } from '../components/ui';

/** Turns `code` in a definition into <code>. */
function Def({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/).map((part, i) => (part.startsWith('`') ? <code key={i} className="rounded bg-slate-100 px-1">{part.slice(1, -1)}</code> : part))}</>;
}

export default function Glossary() {
  const { hash } = useLocation();
  const [filter, setFilter] = useState('');
  const target = decodeURIComponent(hash.slice(1));

  useEffect(() => {
    document.title = 'Glossary · Interview Prep Hub';
    if (target) document.getElementById(target)?.scrollIntoView({ block: 'center' });
  }, [target]);

  const list = glossary.filter((g) => !filter || `${g.term} ${g.definition}`.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="max-w-3xl">
      <PageTitle title="📖 Glossary" subtitle="Every technical word, explained simply." />
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter words…"
        aria-label="Filter glossary"
        className="mb-6 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
      />
      <dl className="space-y-3">
        {list.map((g) => (
          <div key={g.id} id={g.id} className={`scroll-mt-24 rounded-xl border p-4 ${g.id === target ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
            <dt className="font-bold">{g.term}</dt>
            <dd className="mt-1 text-slate-700"><Def text={g.definition} /></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
