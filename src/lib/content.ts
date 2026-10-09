import { stacks, topics as rawTopics, problems, glossary } from 'virtual:content';
import type { Stack, TopicMeta, TopicBody } from '../types/content';

export { stacks, problems, glossary };

const stackIndex = new Map(stacks.map((s, i) => [s.slug, i]));

/** All topics, sorted by stack order then topic order. */
export const topics: TopicMeta[] = [...rawTopics].sort(
  (a, b) => (stackIndex.get(a.stack) ?? 99) - (stackIndex.get(b.stack) ?? 99) || a.order - b.order,
);

export const topicById = new Map(topics.map((t) => [t.id, t]));
export const stackBySlug = new Map(stacks.map((s) => [s.slug, s]));

export function topicsOf(stack: string): TopicMeta[] {
  return topics.filter((t) => t.stack === stack);
}

export function stackGroups(): { label: string; stacks: Stack[] }[] {
  return [
    { label: 'Tech stacks', stacks: stacks.filter((s) => s.group === 'core') },
    { label: 'Interview sections', stacks: stacks.filter((s) => s.group === 'interview') },
  ];
}

/** Previous and next topic inside the same stack. */
export function neighbours(id: string): { prev?: TopicMeta; next?: TopicMeta } {
  const t = topicById.get(id);
  if (!t) return {};
  const list = topicsOf(t.stack);
  const i = list.findIndex((x) => x.id === id);
  return { prev: list[i - 1], next: list[i + 1] };
}

// Topic bodies are separate chunks, loaded only when the page opens.
const topicLoaders = import.meta.glob<{ default: TopicBody }>('/content/topics/**/*.md');
const problemLoaders = import.meta.glob<{ default: { html: string } }>('/content/problems/*.md');

const slugOf = (path: string) => path.split('/').pop()!.replace(/\.md$/, '').replace(/^\d+[-_]/, '');

const topicFiles = new Map(
  Object.keys(topicLoaders).map((p) => {
    const parts = p.split('/');
    return [`${parts[parts.length - 2]}/${slugOf(p)}`, p];
  }),
);
const problemFiles = new Map(Object.keys(problemLoaders).map((p) => [slugOf(p), p]));

export async function loadTopic(id: string): Promise<TopicBody | undefined> {
  const file = topicFiles.get(id);
  return file ? (await topicLoaders[file]()).default : undefined;
}

export async function loadProblem(slug: string): Promise<{ html: string } | undefined> {
  const file = problemFiles.get(slug);
  return file ? (await problemLoaders[file]()).default : undefined;
}

export const levelStyle: Record<string, string> = {
  Basic: 'bg-emerald-100 text-emerald-800',
  Intermediate: 'bg-amber-100 text-amber-900',
  Advanced: 'bg-rose-100 text-rose-800',
  Easy: 'bg-emerald-100 text-emerald-800',
  Medium: 'bg-amber-100 text-amber-900',
  Hard: 'bg-rose-100 text-rose-800',
};
