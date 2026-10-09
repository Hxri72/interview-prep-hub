import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type Fuse from 'fuse.js';
import { loadSearchDocs } from '../lib/lazyData';
import { stackBySlug } from '../lib/content';
import type { SearchDoc } from '../types/content';

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fuse, setFuse] = useState<Fuse<SearchDoc>>();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      inputRef.current?.focus();
      if (!fuse) {
        // load Fuse.js and the search index only the first time search opens
        Promise.all([import('fuse.js'), loadSearchDocs()]).then(([{ default: F }, docs]) =>
          setFuse(new F(docs, { keys: [{ name: 'title', weight: 3 }, { name: 'text', weight: 1 }], threshold: 0.35, ignoreLocation: true, minMatchCharLength: 2 })),
        );
      }
    } else if (!open && d.open) d.close();
  }, [open, fuse]);

  const results = useMemo(() => (fuse && query.trim() ? fuse.search(query.trim(), { limit: 12 }).map((r) => r.item) : []), [fuse, query]);
  useEffect(() => setActive(0), [query]);

  const go = (doc: SearchDoc) => {
    const to = doc.kind === 'topic' ? `/topic/${doc.id}` : doc.kind === 'problem' ? `/problems/${doc.id}` : `/glossary#${doc.id}`;
    onClose();
    setQuery('');
    navigate(to);
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Search"
      className="mx-auto mt-[10vh] w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-[rgba(2,6,23,0.6)]"
    >
      <div className="flex items-center gap-2 border-b border-slate-200 px-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="text-slate-400"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === 'Enter' && results[active]) go(results[active]);
          }}
          placeholder="Search topics, problems, glossary…"
          aria-label="Search"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-results"
          aria-activedescendant={results[active] ? `sr-${active}` : undefined}
          className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400 focus-visible:outline-none"
        />
        <kbd className="rounded border border-slate-300 px-1.5 text-xs text-slate-500">Esc</kbd>
      </div>
      <ul id="search-results" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
        {!fuse && open && <li className="px-3 py-6 text-center text-sm text-slate-500">Loading search…</li>}
        {fuse && query && !results.length && <li className="px-3 py-6 text-center text-sm text-slate-500">No results for “{query}”.</li>}
        {fuse && !query && <li className="px-3 py-6 text-center text-sm text-slate-500">Type to search. Use ↑ ↓ and Enter.</li>}
        {results.map((r, i) => (
          <li key={`${r.kind}-${r.id}`} id={`sr-${i}`} role="option" aria-selected={i === active}>
            <button
              onClick={() => go(r)}
              onMouseEnter={() => setActive(i)}
              className={`w-full rounded-lg px-3 py-2.5 text-left ${i === active ? 'bg-brand-50' : ''}`}
            >
              <span className="block font-medium">{r.title}</span>
              <span className="block text-xs text-slate-500">
                {r.kind === 'topic' ? `${stackBySlug.get(r.stack)?.icon ?? ''} ${stackBySlug.get(r.stack)?.title ?? r.stack}` : r.kind === 'problem' ? '🧩 Practice problem' : '📖 Glossary'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
