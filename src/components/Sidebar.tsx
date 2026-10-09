import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { stackGroups, topicsOf } from '../lib/content';
import { useProgress } from '../lib/progress';
import { ProgressBar } from './ui';

export default function Sidebar() {
  const progress = useProgress();
  const { pathname } = useLocation();
  const activeStack = pathname.match(/^\/(?:topic|stack)\/([^/]+)/)?.[1];
  const [open, setOpen] = useState<Record<string, boolean>>(() => (activeStack ? { [activeStack]: true } : {}));

  // open the stack you are reading
  useEffect(() => {
    if (activeStack) setOpen((o) => ({ ...o, [activeStack]: true }));
  }, [activeStack]);

  return (
    <nav aria-label="Stacks and topics" className="px-3 py-4">
      {stackGroups().map((group) => (
        <div key={group.label} className="mb-6">
          <h2 className="mb-2 px-2 text-xs font-bold tracking-wider text-slate-500 uppercase">{group.label}</h2>
          <ul className="space-y-0.5">
            {group.stacks.map((stack) => {
              const list = topicsOf(stack.slug);
              const learned = list.filter((t) => progress.learned[t.id]).length;
              const isOpen = !!open[stack.slug];
              const panelId = `stack-panel-${stack.slug}`;
              return (
                <li key={stack.slug}>
                  <div className={`group flex items-center rounded-lg ${activeStack === stack.slug ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                    <Link to={`/stack/${stack.slug}`} className="min-w-0 flex-1 px-2 py-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        <span aria-hidden className="w-5 text-center">{stack.icon}</span>
                        <span className="truncate">{stack.title}</span>
                        <span className="ml-auto shrink-0 text-xs text-slate-600 tabular-nums" aria-label={`${learned} of ${list.length} learned`}>
                          {list.length ? `${learned}/${list.length}` : 'soon'}
                        </span>
                      </span>
                      <ProgressBar value={learned} total={list.length} label={`${stack.title} progress`} className="mt-1.5 ml-7 w-[calc(100%-1.75rem)]" />
                    </Link>
                    <button
                      onClick={() => setOpen((o) => ({ ...o, [stack.slug]: !isOpen }))}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      aria-label={`${isOpen ? 'Hide' : 'Show'} ${stack.title} topics`}
                      className="mr-1 rounded-md p-2 text-slate-500 hover:bg-slate-200 disabled:invisible"
                      disabled={!list.length}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}><path d="m9 6 6 6-6 6" /></svg>
                    </button>
                  </div>
                  {isOpen && list.length > 0 && (
                    <ol id={panelId} className="mt-0.5 mb-2 ml-5 border-l border-slate-200 pl-2">
                      {list.map((t) => (
                        <li key={t.id}>
                          <NavLink
                            to={`/topic/${t.id}`}
                            className={({ isActive }) =>
                              `flex items-start gap-2 rounded-md px-2 py-1.5 text-sm ${isActive ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:text-slate-900'}`
                            }
                          >
                            <span className="w-5 shrink-0 text-right text-xs leading-5 text-slate-600 tabular-nums">{t.order}</span>
                            <span className="flex-1">{t.title}</span>
                            {progress.learned[t.id] && <span className="text-emerald-600" aria-label="learned">✓</span>}
                            {!progress.learned[t.id] && progress.revise[t.id] && <span aria-label="revise later">🔁</span>}
                          </NavLink>
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="px-2">
        <Link to="/glossary" className="text-sm text-slate-600 hover:underline">📖 Glossary</Link>
      </div>
    </nav>
  );
}
