import { Link, NavLink } from 'react-router';

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/revise', label: 'Quick Revise' },
  { to: '/rapid-fire', label: 'Rapid Fire' },
  { to: '/problems', label: 'Problems' },
  { to: '/bookmarks', label: 'Saved' },
];

export default function Header({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-2 px-3 sm:px-4">
        <button onClick={onMenu} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <Link to="/" className="mr-2 flex items-center gap-2 font-bold whitespace-nowrap text-slate-900">
          <span aria-hidden>📘</span>
          <span className="hidden sm:inline">Interview Prep Hub</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onSearch}
            className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
            aria-label="Search (press slash)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded border border-slate-300 px-1.5 text-xs sm:inline">/</kbd>
          </button>
        </div>
      </div>
      {/* phone: main links in a scrollable row */}
      <nav aria-label="Main (mobile)" className="flex gap-1 overflow-x-auto border-t border-slate-200 px-3 py-1.5 md:hidden">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600'}`
            }
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
