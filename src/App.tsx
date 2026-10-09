import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TopicPage from './pages/TopicPage';
import StackPage from './pages/StackPage';
import NotFound from './pages/NotFound';
import Spinner from './components/Spinner';

// Less-used pages load on demand to keep the first load small.
const QuickRevise = lazy(() => import('./pages/QuickRevise'));
const RapidFire = lazy(() => import('./pages/RapidFire'));
const Problems = lazy(() => import('./pages/Problems'));
const ProblemPage = lazy(() => import('./pages/ProblemPage'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const Glossary = lazy(() => import('./pages/Glossary'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="stack/:stack" element={<StackPage />} />
        <Route path="topic/:stack/:slug" element={<TopicPage />} />
        <Route path="revise" element={<Suspense fallback={<Spinner />}><QuickRevise /></Suspense>} />
        <Route path="rapid-fire" element={<Suspense fallback={<Spinner />}><RapidFire /></Suspense>} />
        <Route path="problems" element={<Suspense fallback={<Spinner />}><Problems /></Suspense>} />
        <Route path="problems/:slug" element={<Suspense fallback={<Spinner />}><ProblemPage /></Suspense>} />
        <Route path="bookmarks" element={<Suspense fallback={<Spinner />}><Bookmarks /></Suspense>} />
        <Route path="glossary" element={<Suspense fallback={<Spinner />}><Glossary /></Suspense>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
