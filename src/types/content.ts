export type Level = 'Basic' | 'Intermediate' | 'Advanced';
export type Frequency = 'very common' | 'common' | 'sometimes';

export interface Stack {
  slug: string;
  title: string;
  group: 'core' | 'interview';
  icon: string;
  description: string;
  planned: number;
}

export interface TopicMeta {
  id: string; // "javascript/closures"
  stack: string;
  slug: string;
  title: string;
  order: number;
  level: Level;
  mustKnow: boolean;
  askedFrequency: Frequency;
  cardCount: number;
}

export interface ProblemMeta {
  id: string;
  slug: string;
  title: string;
  order: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  pattern: string;
  topic?: string;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
}

export interface Card {
  id: string; // "javascript/closures#0"
  topicId: string;
  q: string;
  a: string;
}

export interface TopicBody {
  html: string;
  toc: { id: string; title: string }[];
  summary: string[];
  cards: Card[];
}

export interface SearchDoc {
  kind: 'topic' | 'problem' | 'glossary';
  id: string;
  title: string;
  stack: string;
  text: string;
}
