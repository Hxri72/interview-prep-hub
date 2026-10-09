export default function Spinner() {
  return (
    <div role="status" className="flex items-center gap-3 py-16 text-slate-500">
      <span className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" aria-hidden />
      Loading…
    </div>
  );
}
