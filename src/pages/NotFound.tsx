import { Link } from 'react-router';
import { PageTitle } from '../components/ui';

export default function NotFound() {
  return (
    <div className="max-w-xl">
      <PageTitle title="Page not found" subtitle="This topic may not be written yet." />
      <Link to="/" className="font-semibold text-brand-700 hover:underline">← Back to the dashboard</Link>
    </div>
  );
}
