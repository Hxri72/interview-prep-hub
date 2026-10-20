---
title: "RAG step 1: loading and chunking documents"
stack: ai
order: 29
level: Basic
mustKnow: true
askedFrequency: common
summary:
  - "Chunking means cutting long documents into small pieces, so search can find the exact piece that answers a question."
  - "Typical sizes are about 200–500 tokens per chunk, with a small overlap (10–20%) so no sentence is cut in half."
  - Split by structure first (headings, paragraphs), then by size. Structure keeps each chunk about one topic.
  - "Store metadata with every chunk: source file, page or section, and tenantId. You need it for filters and citations."
  - Bad chunks = bad answers. Chunking is the first place to look when RAG answers are wrong.
cards:
  - q: What is chunking in RAG?
    a: Cutting long documents into small pieces before embedding them, so search can return just the part that answers the question.
  - q: Why add overlap between chunks?
    a: So a sentence or idea that sits on the border between two chunks still appears whole in at least one of them.
  - q: Which metadata should every chunk carry?
    a: "The source (file or URL), its position (page, section, chunk number) and the tenantId. Metadata powers filters and citations."
  - q: What goes wrong if chunks are too big or too small?
    a: Too big — the match is fuzzy and wastes prompt tokens. Too small — the chunk loses context and can't answer on its own.
  - q: Fixed-size chunking or splitting by headings?
    a: Split by structure (headings, paragraphs) first, then cut long sections by size. Structure keeps each chunk about one topic.
---

## 💡 What is it?

[RAG](glossary:rag) answers questions from your own documents. But you can't send a whole 200-page handbook to an [LLM](glossary:llm) for every question.

So step 1 is **chunking**. You load each document, clean the text, and cut it into small pieces called [chunks](glossary:chunk). Later, search finds only the chunks that match the question.

This topic is part 1 of a hands-on series. For the big picture, read [RAG](topic:ai/rag) first.

## 🏠 Real-life example

Think of **making revision notes from a big textbook**.

You don't carry the whole book to the exam hall. You write short note cards, one idea per card. On each card you write the chapter and page number, so you can check the book later.

- The **textbook** = your document (a PDF or a web page).
- **One note card** = one chunk.
- **One idea per card** = splitting by headings and paragraphs.
- **Repeating the last line of a card on the next card** = overlap.
- **Chapter and page written on the card** = metadata (source, page).
- **Your name on the card box** = the tenantId (whose notes these are).

## 🧑‍💻 Code example

Save this as `chunk.js` and run `node chunk.js`. It needs no packages.

```js
// chunk.js — split a document into small, overlapping chunks with metadata
const doc = [                                            // a tiny HR handbook in Markdown, one line per item
  '# Leave policy',                                      // heading 1
  '',                                                    // blank line
  'Employees get 18 days of paid leave every year. Unused leave can be carried forward up to 6 days.', // paragraph
  '',                                                    // blank line
  'Apply for leave at least 3 days before in the HR portal.', // paragraph
  '',                                                    // blank line
  '# Notice period',                                     // heading 2
  '',                                                    // blank line
  'The notice period is 60 days. It can be bought out by paying the basic salary for the remaining days.', // paragraph
  '',                                                    // blank line
  '# Work from home',                                    // heading 3
  '',                                                    // blank line
  'You can work from home 2 days a week. Your manager must approve it in the portal.', // paragraph
].join('\n');                                            // join the lines into one text with line breaks

function clean(text) {                                   // tidy the raw text before splitting
  return text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim(); // remove \r and squash repeated spaces
}                                                        // end of clean

function splitBySection(text) {                          // split the document at each "# " heading
  return text.split(/\n(?=# )/).map((part) => {          // cut just before every heading line
    const [first, ...rest] = part.split('\n');           // first line = heading, rest = body
    return { heading: first.replace(/^# /, ''), body: rest.join('\n').trim() }; // store both parts
  });                                                    // end of map
}                                                        // end of splitBySection

function chunkWords(body, size, overlap) {               // cut one section into word windows
  const words = body.split(/\s+/);                       // all words in the section
  const chunks = [];                                     // the result list
  for (let start = 0; start < words.length; start += size - overlap) { // move forward by size minus overlap
    chunks.push(words.slice(start, start + size).join(' ')); // take up to `size` words
    if (start + size >= words.length) break;             // the last window reached the end, so stop
  }                                                      // end of for loop
  return chunks;                                         // give back the chunk texts
}                                                        // end of chunkWords

const SIZE = 20;                                         // 20 words per chunk (real apps use ~200–500 tokens)
const OVERLAP = 5;                                       // 5 words repeated between neighbours, so no sentence is cut off

const chunks = splitBySection(clean(doc)).flatMap((section) => // for each section…
  chunkWords(section.body, SIZE, OVERLAP).map((text, i) => ({ // …make its chunks
    tenantId: 'acme',                                    // which company owns this document
    source: 'hr-handbook.md',                            // which file it came from
    section: section.heading,                            // which heading it sits under
    chunkIndex: i,                                       // position inside that section
    text,                                                // the chunk text itself
  })),                                                   // end of inner map
);                                                       // end of flatMap

for (const c of chunks) console.log(`[${c.section} #${c.chunkIndex}] ${c.text}`); // print every chunk
console.log(`\nTotal chunks: ${chunks.length}`);         // print how many chunks we made
```

**Output:**

```text
[Leave policy #0] Employees get 18 days of paid leave every year. Unused leave can be carried forward up to 6 days. Apply
[Leave policy #1] up to 6 days. Apply for leave at least 3 days before in the HR portal.
[Notice period #0] The notice period is 60 days. It can be bought out by paying the basic salary for the remaining days.
[Work from home #0] You can work from home 2 days a week. Your manager must approve it in the portal.

Total chunks: 4
```

**What to notice:**
- "Leave policy" was long, so it became 2 chunks. "up to 6 days. Apply" appears in **both**. That is the overlap.
- Each chunk keeps its heading, so the answer can later say "from: Leave policy".

## 🔍 Deeper version

**1. Loading.** Each file type needs a loader that turns it into plain text:

| Source | How to get text | Watch out for |
|---|---|---|
| PDF | a PDF text extractor (for example `pdf-parse`, or `pdfjs-dist`) | headers, footers and page numbers repeated on every page |
| Scanned PDF / image | OCR (optical character recognition) | spelling mistakes from OCR |
| Word (`.docx`) | a docx-to-text library (for example `mammoth`) | tables flattened into odd text |
| Web page | fetch the HTML and keep the main text | menus, cookie banners, ads |
| Markdown / text | read the file | almost nothing — it's already clean |

**2. Cleaning.** Remove repeated headers and footers, extra spaces and broken line endings. Fix words split by hyphens at line ends. Garbage text makes garbage [embeddings](glossary:embedding).

**3. Chunk size and overlap.** Sizes are counted in [tokens](glossary:token), not characters.
- **Too big** (say, 2,000 tokens): one chunk covers many topics. The match is weak, and you waste [context window](glossary:context-window) space.
- **Too small** (say, 30 tokens): a chunk like "It is 60 days." loses its meaning ("what is?").
- A common start is **200–500 tokens with 10–20% overlap**. Then measure and tune (see [Making RAG better](topic:ai/rag-improving)).

**4. Strategies.**

| Strategy | How it works | Good for |
|---|---|---|
| Fixed size | cut every N tokens, with overlap | plain text with no structure |
| Recursive / structural | split by headings → paragraphs → sentences, then by size | handbooks, docs, Markdown, HTML |
| Semantic | start a new chunk where the meaning changes (uses embeddings) | long, mixed documents |
| Special cases | one row per chunk for tables, one function per chunk for code | FAQs, CSV data, code bases |

**5. Metadata.** Store the chunk together with:
- `source` and `page` / `section`: for citations ("hr-handbook.md, Leave policy").
- `tenantId`: so one company never searches another company's documents. See [multi-tenant design](topic:mongodb/multi-tenant-design).
- `docId`, `version`, `updatedAt`: so you can delete or replace old chunks when a document changes.

**6. Storing in MongoDB.** One document per chunk works well:

```js
await chunksCol.insertMany(chunks.map((c) => ({ // one MongoDB document per chunk
  ...c,                                         // tenantId, source, section, chunkIndex, text
  docId: 'hr-handbook',                         // which original document it belongs to
  createdAt: new Date(),                        // when we stored it
})));                                           // the embedding is added in step 2
```

Add an [index](glossary:index) on `{ tenantId: 1, docId: 1 }` so updates and deletes are fast.

## 🎯 Why do we use it?

- **Better search.** A small chunk about one topic matches a question much better than a whole book.
- **Fits the prompt.** You can send 3–5 small chunks to the LLM, not 200 pages.
- **Cheaper.** Fewer tokens in the prompt means a lower bill. See [tokens and cost](topic:ai/tokens-cost).
- **Citations.** Metadata lets the answer say exactly where it came from.

## ⚠️ Common mistakes

- **Cutting in the middle of a sentence or table** with no overlap, so the key fact is split across two chunks.
- **Forgetting metadata.** Without `tenantId` and `source`, you can't filter or cite.
- **Keeping junk.** Page numbers, menus and footers end up in every chunk and confuse search.
- **Never re-chunking.** When a document changes, old chunks stay and give outdated answers.

## 🗣️ How to answer in an interview

> "Chunking is the first step of a RAG pipeline. I load each document with the right loader, like a PDF extractor for PDFs, clean out headers and footers, and then split it. I split by structure first, headings and paragraphs, and then cut long sections by size. A common starting point is about 200 to 500 tokens per chunk, with 10 to 20 percent overlap, so a sentence on the border isn't lost.
>
> Every chunk carries metadata: the source, the section or page, a document id, and the tenantId for multi-tenant apps. That metadata is what powers filtering and citations later. Then I tune the chunk size by measuring retrieval quality, not by guessing.
>
> I haven't run RAG in production yet. My LLM experience is from integrating OpenAI for a job-description chatbot and Claude in an AI voice agent. [FILL IN: once you've built the "Ask the Docs" practice project, add one line about how you chunked it.]"

## 🔁 Follow-up questions

### How do you choose the chunk size?

Start with a common default (about 200–500 tokens, 10–20% overlap). Then test with real questions and measure how often the right chunk is found. Change one setting at a time. See [Making RAG better](topic:ai/rag-improving).

### What do you do with tables in a PDF?

Keep each table row (or a small group of rows) together, with the column names repeated in each chunk. Plain text extraction often scrambles tables, so check them by eye.

### How do you handle a document that is updated?

Store a `docId` and version on every chunk. When the document changes, delete its old chunks and insert new ones, then re-embed them. Never leave both versions searchable.

### Why not just send the whole document to a model with a huge context window?

It costs far more tokens on every question, it's slower, and models can miss facts buried in the middle of very long input. RAG sends only the few chunks that matter.

## ✅ Quick check

### 1. A chunk says only "It is 60 days." What is the problem?

:::answer
The chunk is **too small**. It lost its context, so search can't tell it's about the notice period. Use bigger chunks, overlap, or add the section heading ("Notice period") to the chunk's text or metadata.
:::

### 2. With `SIZE = 20` and `OVERLAP = 5`, how many words does the loop move forward each time?

:::answer
**15 words** (`size - overlap` = 20 − 5). So the last 5 words of one chunk are the first 5 words of the next.
:::

### 3. Which metadata field stops one company's documents showing up for another company?

- A) `chunkIndex`
- B) `tenantId`
- C) `source`

:::answer
**B) `tenantId`.** Filter on it in every search.
:::
