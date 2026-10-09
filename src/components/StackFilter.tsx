import { stacks, topicsOf } from '../lib/content';

/** Dropdown to pick one stack (or all). Only lists stacks that have topics. */
export default function StackFilter({ value, onChange, label = 'Stack' }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2"
      >
        <option value="">All stacks</option>
        {stacks.filter((s) => topicsOf(s.slug).length).map((s) => (
          <option key={s.slug} value={s.slug}>{s.title}</option>
        ))}
      </select>
    </label>
  );
}
