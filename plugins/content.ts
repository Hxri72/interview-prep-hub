/**
 * Content pipeline.
 *
 * Reads Markdown files from /content at build time and turns them into:
 *   - virtual:content  → small metadata for every stack, topic and problem (main bundle)
 *   - virtual:search   → text used by the search box (loaded only when search opens)
 *   - virtual:revise   → Quick Revise bullets for every topic (loaded on that page)
 *   - virtual:cards    → Rapid Fire flashcards for every topic (loaded when needed)
 *   - each .md file    → pre-rendered HTML, loaded lazily when its page opens
 *
 * It also checks every topic against the template in CLAUDE.md.
 * `npm run build` fails on errors; `npm run dev` prints them as warnings.
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { load as loadYaml } from 'js-yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { visit, SKIP } from 'unist-util-visit';
import { toString as mdToString } from 'mdast-util-to-string';
import { toString as hastToString } from 'hast-util-to-string';
import type { Plugin, ViteDevServer } from 'vite';

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'content');
const TOPICS_DIR = path.join(CONTENT, 'topics');
const PROBLEMS_DIR = path.join(CONTENT, 'problems');

const VIRTUAL = ['virtual:content', 'virtual:search', 'virtual:revise', 'virtual:cards'] as const;

const LEVELS = ['Basic', 'Intermediate', 'Advanced'];
const FREQUENCIES = ['very common', 'common', 'sometimes'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/** The 9 sections every "concept" topic must have, in this order. */
export const CONCEPT_SECTIONS = [
  { key: 'what', label: '💡 What is it?' },
  { key: 'example', label: '🏠 Real-life example' },
  { key: 'code', label: '🧑‍💻 Code example' },
  { key: 'deeper', label: '🔍 Deeper version' },
  { key: 'why', label: '🎯 Why do we use it?' },
  { key: 'mistakes', label: '⚠️ Common mistakes' },
  { key: 'interview', label: '🗣️ How to answer in an interview' },
  { key: 'followup', label: '🔁 Follow-up questions' },
  { key: 'check', label: '✅ Quick check' },
];

/** Resume Deep-Dive: one project as a story (problem → what I built → hard part → result). */
export const STORY_SECTIONS = [
  { key: 'what', label: '💡 What is it?' },
  { key: 'example', label: '🏠 Real-life example' },
  { key: 'problem', label: '🧩 The problem' },
  { key: 'built', label: '🛠️ What I built' },
  { key: 'hard', label: '🧗 The hard part' },
  { key: 'result', label: '🏆 The result' },
  { key: 'interview', label: '🗣️ How to answer in an interview' },
  { key: 'followup', label: '🔁 Follow-up questions' },
  { key: 'revise', label: '📚 Topics to revise' },
];

/** Debugging Scenarios: Detect → Debug → Fix → Prevent. */
export const SCENARIO_SECTIONS = [
  { key: 'what', label: '💡 What is it?' },
  { key: 'example', label: '🏠 Real-life example' },
  { key: 'detect', label: '🔎 Detect' },
  { key: 'debug', label: '🐞 Debug' },
  { key: 'code', label: '🔧 Fix' },
  { key: 'prevent', label: '🛡️ Prevent' },
  { key: 'interview', label: '🗣️ How to answer in an interview' },
  { key: 'followup', label: '🔁 Follow-up questions' },
  { key: 'check', label: '✅ Quick check' },
];

/** HR & Behavioural: one question, a structure and a sample answer. */
export const ANSWER_SECTIONS = [
  { key: 'what', label: '💡 What they really want to know' },
  { key: 'example', label: '🏠 Real-life example' },
  { key: 'structure', label: '🧩 How to structure your answer' },
  { key: 'interview', label: '🗣️ Sample answer' },
  { key: 'do', label: '✅ Do' },
  { key: 'mistakes', label: "❌ Don't" },
  { key: 'followup', label: '🔁 Follow-up questions' },
  { key: 'yours', label: '✍️ Your own version' },
];

const TEMPLATES: Record<string, { key: string; label: string }[]> = {
  concept: CONCEPT_SECTIONS,
  story: STORY_SECTIONS,
  scenario: SCENARIO_SECTIONS,
  answer: ANSWER_SECTIONS,
};
const ALL_SECTIONS = [...CONCEPT_SECTIONS, ...STORY_SECTIONS, ...SCENARIO_SECTIONS, ...ANSWER_SECTIONS];

/** Compare headings by their words only, so emoji differences don't matter. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

// ---------- types ----------

interface StackDef {
  slug: string;
  title: string;
  group: 'core' | 'interview';
  icon: string;
  description: string;
  planned: number;
}
interface GlossaryEntry { id: string; term: string; definition: string }
interface Card { id: string; topicId: string; q: string; a: string }
interface TocItem { id: string; title: string }

interface ParsedTopic {
  file: string;
  meta: {
    id: string; stack: string; slug: string; title: string; order: number;
    level: string; mustKnow: boolean; askedFrequency: string;
  };
  summary: string[];
  cards: Card[];
  html: string;
  toc: TocItem[];
  searchText: string;
  errors: string[];
  warnings: string[];
}
interface ParsedProblem {
  file: string;
  meta: { id: string; slug: string; title: string; order: number; difficulty: string; pattern: string; topic?: string };
  html: string;
  searchText: string;
  errors: string[];
  warnings: string[];
}

// ---------- Markdown → HTML ----------

const REVEAL_LABELS: Record<string, string> = { answer: 'Show answer', solution: 'Show solution', hint: 'Show hint' };
const CALLOUTS = ['note', 'tip', 'warning', 'version'];

/* eslint-disable @typescript-eslint/no-explicit-any */
function remarkCustom(ctx: RenderCtx) {
  return (tree: any) => {
    visit(tree, (node: any, index: number | undefined, parent: any) => {
      // :::answer / :::solution / :::hint → <details>, :::note etc. → <aside>
      if (node.type === 'containerDirective') {
        let label: string | undefined;
        const first = node.children[0];
        if (first?.type === 'paragraph' && first.data?.directiveLabel) {
          label = mdToString(first);
          node.children.shift();
        }
        if (node.name in REVEAL_LABELS) {
          node.data = { hName: 'details', hProperties: { className: ['reveal', `reveal-${node.name}`] } };
          node.children.unshift({
            type: 'paragraph',
            data: { hName: 'summary' },
            children: [{ type: 'text', value: label ?? REVEAL_LABELS[node.name] }],
          });
        } else if (CALLOUTS.includes(node.name)) {
          node.data = { hName: 'aside', hProperties: { className: ['callout', `callout-${node.name}`] } };
          if (label) node.children.unshift({ type: 'paragraph', data: { hProperties: { className: ['callout-title'] } }, children: [{ type: 'text', value: label }] });
        } else {
          ctx.errors.push(`Unknown block ":::${node.name}". Use one of: ${[...Object.keys(REVEAL_LABELS), ...CALLOUTS].join(', ')}`);
        }
        return;
      }
      // Plain text like "a:b" is parsed as a directive by mistake — turn it back into text.
      if ((node.type === 'textDirective' || node.type === 'leafDirective') && parent && index !== undefined) {
        const text = (node.type === 'leafDirective' ? '::' : ':') + node.name + (node.children?.length ? `[${mdToString(node)}]` : '');
        const replacement = node.type === 'leafDirective'
          ? { type: 'paragraph', children: [{ type: 'text', value: text }] }
          : { type: 'text', value: text };
        parent.children.splice(index, 1, replacement);
        return [SKIP, index];
      }
      // "[FILL IN: …]" → a yellow highlight, so missing personal details are easy to spot
      if (node.type === 'text' && parent && index !== undefined && node.value.includes('[FILL IN')) {
        const parts = String(node.value).split(/(\[FILL IN:[^\]]*\])/);
        const nodes = parts.filter(Boolean).map((part: string) =>
          part.startsWith('[FILL IN')
            ? { type: 'emphasis', data: { hName: 'mark', hProperties: { className: ['fill-in'] } }, children: [{ type: 'text', value: part }] }
            : { type: 'text', value: part },
        );
        parent.children.splice(index, 1, ...nodes);
        return [SKIP, index + nodes.length];
      }
      // [word](glossary:term-id) and [text](topic:stack/slug)
      if (node.type === 'link') {
        if (node.url.startsWith('glossary:')) {
          const id = node.url.slice('glossary:'.length);
          const entry = ctx.glossary.get(id);
          if (!entry) ctx.errors.push(`Glossary term "${id}" not found in content/glossary.yaml`);
          node.url = `#/glossary#${id}`;
          node.data = { hProperties: { className: ['glossary-link'], title: entry?.definition ?? '' } };
        } else if (node.url.startsWith('topic:')) {
          const id = node.url.slice('topic:'.length);
          if (!ctx.topicIds.has(id)) ctx.warnings.push(`Link to topic "${id}" — that topic is not written yet`);
          node.url = `#/topic/${id}`;
          node.data = { hProperties: { className: ['topic-link'] } };
        }
      }
      // Soft check: every line in the "Code example" section should have a comment.
      // (Output, shell and JSON blocks are skipped — they can't or shouldn't have comments.)
      if (node.type === 'code' && ctx.currentSection === 'code' && !['text', 'txt', 'output', 'console', 'bash', 'sh', 'json'].includes(node.lang ?? '')) {
        const hasComment = (l: string) => /(\/\/|\/\*|#|<!--|--)/.test(l);
        // Dockerfiles can't have a comment after an instruction, so a comment on the line above counts.
        const commentAbove = ['dockerfile', 'docker'].includes(node.lang ?? '');
        const lines = String(node.value).split('\n');
        const uncommented = lines.filter(
          (l: string, i: number) =>
            l.trim() && !/^[\s{}()[\];,)]*$/.test(l) && !hasComment(l) && !(commentAbove && i > 0 && /^\s*#/.test(lines[i - 1])),
        );
        if (uncommented.length) ctx.warnings.push(`Code example has ${uncommented.length} line(s) without a comment, e.g. "${uncommented[0].trim()}"`);
      }
      if (node.type === 'heading' && node.depth === 2) {
        const t = norm(mdToString(node));
        ctx.currentSection = ALL_SECTIONS.find((s) => norm(s.label) === t)?.key;
      }
    });
  };
}

/** Wraps each h2 + its content in <section>, and turns follow-up h3 items into collapsible <details>. */
function rehypeSections(ctx: RenderCtx) {
  return (tree: any) => {
    const out: any[] = [];
    let current: any = null;
    for (const child of tree.children) {
      if (child.type === 'element' && child.tagName === 'h2') {
        const title = hastToString(child);
        const key = ALL_SECTIONS.find((s) => norm(s.label) === norm(title))?.key ?? 'other';
        ctx.toc.push({ id: child.properties.id, title });
        ctx.headings.push(title);
        current = { type: 'element', tagName: 'section', properties: { className: ['topic-section', `section-${key}`], ariaLabelledBy: child.properties.id }, children: [child] };
        current.key = key;
        out.push(current);
      } else if (current) {
        current.children.push(child);
      } else {
        out.push(child);
      }
    }
    for (const section of out) {
      if (section.key === 'followup') section.children = groupH3(section.children);
      if (section.key === 'what') ctx.whatText = hastToString(section).slice(0, 600);
      delete section.key;
    }
    tree.children = out;
  };
}

function groupH3(children: any[]): any[] {
  const out: any[] = [];
  let open: any = null;
  for (const c of children) {
    if (c.type === 'element' && c.tagName === 'h3') {
      open = {
        type: 'element', tagName: 'details', properties: { className: ['followup'] },
        children: [
          { type: 'element', tagName: 'summary', properties: {}, children: c.children },
          { type: 'element', tagName: 'div', properties: { className: ['followup-body'] }, children: [] },
        ],
      };
      out.push(open);
    } else if (open && !(c.type === 'element' && c.tagName === 'h2')) {
      open.children[1].children.push(c);
    } else {
      out.push(c);
    }
  }
  return out;
}

/** Label each code block with its language. */
function rehypeCodeLabels() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName !== 'pre') return;
      const code = node.children.find((c: any) => c.tagName === 'code');
      const lang = (code?.properties?.className ?? []).find((c: string) => c.startsWith('language-'))?.slice(9);
      if (lang) node.properties.dataLang = lang;
    });
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface RenderCtx {
  glossary: Map<string, GlossaryEntry>;
  topicIds: Set<string>;
  errors: string[];
  warnings: string[];
  toc: TocItem[];
  headings: string[];
  whatText: string;
  currentSection?: string;
}

function render(md: string, ctx: RenderCtx): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkDirective)
      .use(remarkCustom, ctx)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeHighlight, { detect: false })
      .use(rehypeCodeLabels)
      .use(rehypeSections, ctx)
      .use(rehypeStringify)
      .processSync(md),
  );
}

// ---------- loading files ----------

function readYaml<T>(file: string): T {
  return loadYaml(fs.readFileSync(file, 'utf8')) as T;
}

function listMd(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return listMd(p);
    return d.name.endsWith('.md') && !d.name.startsWith('_') ? [p] : [];
  });
}

/** Reads frontmatter; a YAML mistake becomes a normal content error that names the file. */
function readFrontmatter(file: string): { data: Record<string, any>; content: string; yamlError?: string } {
  const raw = fs.readFileSync(file, 'utf8');
  try {
    const { data, content } = matter(raw);
    return { data, content };
  } catch (err) {
    const reason = String((err as Error).message).split('\n')[0];
    return { data: {}, content: raw.replace(/^---[\s\S]*?\n---\n/, ''), yamlError: `Frontmatter YAML error: ${reason} (tip: put quotes around values that contain ": ")` };
  }
}

/** "09-closures.md" → "closures" */
const slugFromFile = (file: string) => path.basename(file, '.md').replace(/^\d+[-_]/, '');

class ContentStore {
  stacks: StackDef[] = [];
  glossary = new Map<string, GlossaryEntry>();
  topics = new Map<string, ParsedTopic>();
  problems = new Map<string, ParsedProblem>();
  globalErrors: string[] = [];

  load() {
    this.globalErrors = [];
    this.stacks = readYaml<StackDef[]>(path.join(CONTENT, 'stacks.yaml'));
    const g = readYaml<Array<{ id: string; term: string; definition: string }>>(path.join(CONTENT, 'glossary.yaml')) ?? [];
    this.glossary = new Map(g.map((e) => [e.id, e]));
    const stackSlugs = new Set(this.stacks.map((s) => s.slug));

    const topicFiles = listMd(TOPICS_DIR);
    const topicIds = new Set(topicFiles.map((f) => `${path.basename(path.dirname(f))}/${slugFromFile(f)}`));
    this.topics = new Map();
    for (const file of topicFiles) {
      const t = this.parseTopic(file, topicIds, stackSlugs);
      if (this.topics.has(t.meta.id)) t.errors.push(`Duplicate topic id "${t.meta.id}"`);
      this.topics.set(t.meta.id, t);
    }
    // two topics in one stack with the same order number
    const seen = new Map<string, string>();
    for (const t of this.topics.values()) {
      const k = `${t.meta.stack}#${t.meta.order}`;
      if (seen.has(k)) t.warnings.push(`Same order (${t.meta.order}) as ${seen.get(k)}`);
      else seen.set(k, t.meta.id);
    }

    this.problems = new Map();
    for (const file of listMd(PROBLEMS_DIR)) {
      const p = this.parseProblem(file, topicIds);
      this.problems.set(p.meta.id, p);
    }
  }

  parseTopic(file: string, topicIds: Set<string>, stackSlugs: Set<string>): ParsedTopic {
    const { data: fm, content, yamlError } = readFrontmatter(file);
    const folder = path.basename(path.dirname(file));
    const slug = slugFromFile(file);
    const errors: string[] = [];
    const warnings: string[] = [];
    if (yamlError) errors.push(yamlError);

    if (!fm.title) errors.push('Missing "title"');
    if (fm.stack !== folder) errors.push(`"stack: ${fm.stack}" must match its folder "${folder}"`);
    if (!stackSlugs.has(folder)) errors.push(`Folder "${folder}" is not a stack in content/stacks.yaml`);
    if (typeof fm.order !== 'number') errors.push('"order" must be a number');
    if (!LEVELS.includes(fm.level)) errors.push(`"level" must be one of ${LEVELS.join(' / ')}`);
    if (typeof fm.mustKnow !== 'boolean') errors.push('"mustKnow" must be true or false');
    if (!FREQUENCIES.includes(fm.askedFrequency)) errors.push(`"askedFrequency" must be one of ${FREQUENCIES.join(' / ')}`);
    const summary: string[] = Array.isArray(fm.summary) ? fm.summary.map(String) : [];
    if (summary.length < 3 || summary.length > 5) warnings.push(`"summary" should have 3–5 bullets (has ${summary.length})`);
    const rawCards: Array<{ q: string; a: string }> = Array.isArray(fm.cards) ? fm.cards : [];
    if (!rawCards.length) warnings.push('No rapid-fire "cards" yet');
    const id = `${folder}/${slug}`;
    const cards = rawCards.map((c, i) => ({ id: `${id}#${i}`, topicId: id, q: String(c.q), a: String(c.a) }));

    const ctx: RenderCtx = { glossary: this.glossary, topicIds, errors, warnings, toc: [], headings: [], whatText: '' };
    const html = render(content, ctx);

    const template = fm.template ?? 'concept';
    const sections = TEMPLATES[template];
    if (!sections) {
      errors.push(`"template" must be one of: ${Object.keys(TEMPLATES).join(', ')}`);
    } else {
      const found = ctx.headings.map(norm);
      const expected = sections.map((s) => norm(s.label));
      const missing = sections.filter((s) => !found.includes(norm(s.label))).map((s) => s.label);
      if (missing.length) errors.push(`Missing section(s): ${missing.join(', ')}`);
      else if (found.filter((h) => expected.includes(h)).join('|') !== expected.join('|')) errors.push('Sections are not in the template order');
    }

    return {
      file,
      meta: { id, stack: folder, slug, title: String(fm.title ?? slug), order: Number(fm.order ?? 999), level: fm.level, mustKnow: !!fm.mustKnow, askedFrequency: fm.askedFrequency },
      summary,
      cards,
      html,
      toc: ctx.toc,
      searchText: [ctx.whatText, summary.join(' '), ctx.headings.join(' ')].join(' ').replace(/\s+/g, ' '),
      errors,
      warnings,
    };
  }

  parseProblem(file: string, topicIds: Set<string>): ParsedProblem {
    const { data: fm, content, yamlError } = readFrontmatter(file);
    const slug = slugFromFile(file);
    const errors: string[] = [];
    const warnings: string[] = [];
    if (yamlError) errors.push(yamlError);
    if (!fm.title) errors.push('Missing "title"');
    if (typeof fm.order !== 'number') errors.push('"order" must be a number');
    if (!DIFFICULTIES.includes(fm.difficulty)) errors.push(`"difficulty" must be one of ${DIFFICULTIES.join(' / ')}`);
    if (!content.includes(':::solution')) errors.push('Needs at least one :::solution block');
    if (fm.topic && !topicIds.has(fm.topic)) warnings.push(`Linked topic "${fm.topic}" is not written yet`);
    const ctx: RenderCtx = { glossary: this.glossary, topicIds, errors, warnings, toc: [], headings: [], whatText: '' };
    const html = render(content, ctx);
    return {
      file,
      meta: { id: slug, slug, title: String(fm.title ?? slug), order: Number(fm.order ?? 999), difficulty: fm.difficulty, pattern: String(fm.pattern ?? ''), topic: fm.topic },
      html,
      // search only the problem statement, never the hidden solution
      searchText: `${fm.pattern ?? ''} ${content.split(':::solution')[0].slice(0, 400)}`.replace(/[#`*_>]/g, ' ').replace(/\s+/g, ' '),
      errors,
      warnings,
    };
  }

  sortedProblems() { return [...this.problems.values()].sort((a, b) => a.meta.order - b.meta.order); }

  report(): { errors: string[]; warnings: string[] } {
    const errors: string[] = [...this.globalErrors];
    const warnings: string[] = [];
    const rel = (f: string) => path.relative(ROOT, f);
    for (const item of [...this.topics.values(), ...this.problems.values()]) {
      for (const e of item.errors) errors.push(`${rel(item.file)}: ${e}`);
      for (const w of item.warnings) warnings.push(`${rel(item.file)}: ${w}`);
    }
    return { errors, warnings };
  }

  moduleFor(id: string): string {
    const topics = [...this.topics.values()];
    switch (id) {
      case 'virtual:content':
        return [
          `export const stacks = ${JSON.stringify(this.stacks)};`,
          `export const topics = ${JSON.stringify(topics.map((t) => ({ ...t.meta, cardCount: t.cards.length })))};`,
          `export const problems = ${JSON.stringify(this.sortedProblems().map((p) => p.meta))};`,
          `export const glossary = ${JSON.stringify([...this.glossary.values()].sort((a, b) => a.term.localeCompare(b.term)))};`,
        ].join('\n');
      case 'virtual:search':
        return `export default ${JSON.stringify([
          ...topics.map((t) => ({ kind: 'topic', id: t.meta.id, title: t.meta.title, stack: t.meta.stack, text: t.searchText })),
          ...this.sortedProblems().map((p) => ({ kind: 'problem', id: p.meta.id, title: p.meta.title, stack: 'problems', text: p.searchText })),
          ...[...this.glossary.values()].map((g) => ({ kind: 'glossary', id: g.id, title: g.term, stack: 'glossary', text: g.definition })),
        ])};`;
      case 'virtual:revise':
        return `export default ${JSON.stringify(Object.fromEntries(topics.map((t) => [t.meta.id, t.summary])))};`;
      case 'virtual:cards':
        return `export default ${JSON.stringify(topics.flatMap((t) => t.cards))};`;
    }
    return '';
  }
}

// ---------- the Vite plugin ----------

export function contentPlugin(): Plugin {
  const store = new ContentStore();
  let isBuild = false;
  let server: ViteDevServer | undefined;

  const printReport = (log: (m: string) => void) => {
    const { errors, warnings } = store.report();
    for (const w of warnings) log(`  ⚠ ${w}`);
    for (const e of errors) log(`  ✖ ${e}`);
    return errors;
  };

  return {
    name: 'interview-prep-content',
    enforce: 'pre',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    buildStart() {
      store.load();
      const errors = printReport((m) => console.log(m));
      const s = store.report();
      console.log(`\n📚 Content: ${store.topics.size} topics, ${store.problems.size} problems, ${s.warnings.length} warnings, ${errors.length} errors\n`);
      if (isBuild && errors.length) this.error(`Content has ${errors.length} error(s). Fix them and build again.`);
    },
    resolveId(id) {
      if ((VIRTUAL as readonly string[]).includes(id)) return '\0' + id;
    },
    load(id) {
      if (id.startsWith('\0virtual:')) return store.moduleFor(id.slice(1));
      const file = id.split('?')[0];
      if (!file.endsWith('.md') || !file.startsWith(CONTENT)) return;
      const topic = [...store.topics.values()].find((t) => t.file === file);
      if (topic) return `export default ${JSON.stringify({ html: topic.html, toc: topic.toc, summary: topic.summary, cards: topic.cards })};`;
      const problem = [...store.problems.values()].find((p) => p.file === file);
      if (problem) return `export default ${JSON.stringify({ html: problem.html })};`;
      return 'export default { html: "" };';
    },
    configureServer(s) {
      server = s;
      const onChange = (file: string) => {
        if (!file.startsWith(CONTENT)) return;
        try {
          store.load();
          printReport((m) => s.config.logger.warn(m));
        } catch (err) {
          s.config.logger.error(String(err));
        }
        for (const v of VIRTUAL) {
          const mod = s.moduleGraph.getModuleById('\0' + v);
          if (mod) s.moduleGraph.invalidateModule(mod);
        }
        for (const mod of s.moduleGraph.getModulesByFile(file) ?? []) s.moduleGraph.invalidateModule(mod);
        s.ws.send({ type: 'full-reload' });
      };
      s.watcher.add(CONTENT);
      s.watcher.on('change', onChange);
      s.watcher.on('add', onChange);
      s.watcher.on('unlink', onChange);
    },
    handleHotUpdate(ctx) {
      // content changes are handled above with a full reload
      if (ctx.file.startsWith(CONTENT) && server) return [];
    },
  };
}
