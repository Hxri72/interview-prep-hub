declare module 'virtual:content' {
  import type { Stack, TopicMeta, ProblemMeta, GlossaryEntry } from '../types/content';
  export const stacks: Stack[];
  export const topics: TopicMeta[];
  export const problems: ProblemMeta[];
  export const glossary: GlossaryEntry[];
}
declare module 'virtual:search' {
  import type { SearchDoc } from '../types/content';
  const docs: SearchDoc[];
  export default docs;
}
declare module 'virtual:revise' {
  const summaries: Record<string, string[]>;
  export default summaries;
}
declare module 'virtual:cards' {
  import type { Card } from '../types/content';
  const cards: Card[];
  export default cards;
}
