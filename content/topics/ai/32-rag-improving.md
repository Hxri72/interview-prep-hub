---
title: "Making RAG better: hybrid search, re-ranking and evaluation"
stack: ai
order: 32
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Most bad RAG answers come from bad retrieval: wrong chunks, the right chunk not found, missing context, or stale data."
  - "Hybrid search = keyword search + vector search, merged (for example with Reciprocal Rank Fusion). It catches both exact codes and synonyms."
  - "Re-ranking = fetch more candidates, then score them again with a stronger model and keep the best few."
  - "Measure retrieval with a small labelled set: hit rate @k (was the right chunk in the top k?). Change one thing at a time."
  - Keep embeddings in sync on update and delete, and always filter by tenant.
cards:
  - q: What is hybrid search?
    a: Running keyword (full-text) search and vector search for the same question and merging both result lists, so you get exact-term matches and meaning matches.
  - q: What is Reciprocal Rank Fusion (RRF)?
    a: A simple way to merge ranked lists. Each result scores 1 / (60 + its rank) in each list, and the scores are added. Items high in both lists win.
  - q: What is re-ranking?
    a: Fetching more candidates (say 20–50) and re-scoring them with a stronger, slower model (a cross-encoder or an LLM), then keeping the top few for the prompt.
  - q: How do you measure retrieval quality?
    a: Build a small labelled set of questions with the chunk that should be found, then compute hit rate @k (or recall @k). Re-run it after every change.
  - q: Why does a RAG app give outdated answers?
    a: Old chunks weren't deleted or re-embedded when the document changed. Keep a docId and version on every chunk and replace them on update.
---

## 💡 What is it?

A first [RAG](glossary:rag) version usually works "sometimes". To make it reliable, you find **why** it fails, fix the retrieval, and **measure** the result.

The big tools are: **hybrid search** (keyword + vector), **re-ranking**, **query rewriting**, and an **evaluation set** that tells you if a change helped.

This builds on [step 1](topic:ai/rag-chunking), [step 2](topic:ai/rag-vector-search-mongodb) and [step 3](topic:ai/rag-answer-with-sources).

## 🏠 Real-life example

Think of **finding a book in a big library**.

- The **catalogue by exact title** finds "Form 16 guide" instantly, but misses "income tax certificate". That is **keyword search**.
- The **librarian who understands topics** finds "income tax certificate" for "Form 16", but may miss exact codes. That is **vector search**.
- **Asking both and combining their lists** = hybrid search.
- **A senior librarian re-reading the top 20 picks and choosing the best 5** = re-ranking.
- **A practice list of 20 questions with known correct books, used to check the librarians** = the evaluation set.

## 🧑‍💻 Code example

This measures **hit rate**: how often the right chunk appears in the top `k` results. It compares vector, keyword and hybrid search. No packages needed.

Save as `eval.js` and run `node eval.js`.

```js
// eval.js — measure retrieval quality (hit rate @k) for vector, keyword and hybrid search
const chunks = [                                          // our tiny knowledge base: id → text
  { id: 'leave', text: 'Employees get 18 days of paid leave every year.' }, // one chunk: its id/tenant and text
  { id: 'notice', text: 'The notice period is 60 days.' }, // one chunk: its id/tenant and text
  { id: 'wfh', text: 'You can work from home 2 days a week.' }, // one chunk: its id/tenant and text
  { id: 'form16', text: 'Form 16 is emailed to every employee in June.' }, // one chunk: its id/tenant and text
  { id: 'laptop', text: 'New joiners receive a laptop on day one.' }, // one chunk: its id/tenant and text
];                                                        // end of chunks

const CONCEPTS = {                                        // pretend "meaning" map: words with the same meaning share a concept
  leave: 'leave', holiday: 'leave', vacation: 'leave', off: 'leave', // all mean time off
  notice: 'exit', resign: 'exit', quit: 'exit',           // all about leaving the job
  home: 'remote', remote: 'remote', wfh: 'remote',        // all about remote work
  laptop: 'device', computer: 'device', machine: 'device', // all about the work computer
  tax: 'tax', salary: 'tax',                              // money words (note: "form" and "16" are NOT here)
};                                                        // end of CONCEPTS

const words = (t) => t.toLowerCase().match(/[a-z0-9]+/g) ?? []; // split text into lowercase words

function vectorSearch(question) {                         // STAND-IN for embedding search: matches by meaning
  const q = new Set(words(question).map((w) => CONCEPTS[w]).filter(Boolean)); // concepts in the question
  return chunks                                           // score every chunk
    .map((c) => ({ id: c.id, score: words(c.text).filter((w) => q.has(CONCEPTS[w])).length })) // shared concepts
    .filter((r) => r.score > 0)                           // keep chunks that share a concept
    .sort((a, b) => b.score - a.score)                    // best first
    .map((r) => r.id);                                    // return just the ids
}                                                         // end of vectorSearch

function keywordSearch(question) {                        // exact word match, like a text index
  const q = new Set(words(question));                     // words in the question
  return chunks                                           // score every chunk
    .map((c) => ({ id: c.id, score: words(c.text).filter((w) => q.has(w)).length })) // shared exact words
    .filter((r) => r.score > 0)                           // keep chunks with any shared word
    .sort((a, b) => b.score - a.score)                    // best first
    .map((r) => r.id);                                    // return just the ids
}                                                         // end of keywordSearch

function hybridSearch(question) {                         // combine both lists with Reciprocal Rank Fusion
  const scores = {};                                      // id → combined score
  for (const list of [vectorSearch(question), keywordSearch(question)]) { // each ranked list
    list.forEach((id, rank) => { scores[id] = (scores[id] ?? 0) + 1 / (60 + rank); }); // RRF: 1 / (60 + rank)
  }                                                       // end of for loop
  return Object.keys(scores).sort((a, b) => scores[b] - scores[a]); // highest combined score first
}                                                         // end of hybridSearch

const labelled = [                                        // test questions + the chunk that SHOULD be found
  { q: 'How many vacation days do I have?', expected: 'leave' }, // synonym: vacation → leave
  { q: 'What happens if I resign?', expected: 'notice' }, // synonym: resign → notice
  { q: 'Can I work remote?', expected: 'wfh' },           // synonym: remote → home
  { q: 'When do I get Form 16?', expected: 'form16' },    // exact code: vector search misses this
  { q: 'Which computer will I get?', expected: 'laptop' }, // synonym: computer → laptop
];                                                        // end of labelled

function hitRate(search, k) {                             // share of questions whose answer is in the top k
  const hits = labelled.filter(({ q, expected }) => search(q).slice(0, k).includes(expected)).length; // count hits
  return `${hits}/${labelled.length}`;                    // e.g. "4/5"
}                                                         // end of hitRate

for (const [name, fn] of [['vector', vectorSearch], ['keyword', keywordSearch], ['hybrid', hybridSearch]]) { // each retriever
  console.log(`${name.padEnd(8)} hit@1 = ${hitRate(fn, 1)}   hit@3 = ${hitRate(fn, 3)}`); // print its scores
}                                                         // end of for loop
```

**Output:**

```text
vector   hit@1 = 4/5   hit@3 = 4/5
keyword  hit@1 = 3/5   hit@3 = 3/5
hybrid   hit@1 = 5/5   hit@3 = 5/5
```

**What to notice:**
- **Vector** search understands synonyms but misses the exact code "Form 16".
- **Keyword** search finds "Form 16" but misses "vacation" → "leave".
- **Hybrid** gets all 5, because each search covers the other's weak spot.
- The "vector" search here is a pretend meaning map. Real embeddings behave similarly, but the numbers will differ.

## 🔍 Deeper version

**1. Why RAG fails (check in this order).**

| Failure | What you see | Fix |
|---|---|---|
| Bad chunks | answers cut off or mixed topics | better splitting, overlap, metadata ([step 1](topic:ai/rag-chunking)) |
| Right chunk not retrieved | "I don't know" though the doc has it | hybrid search, more candidates, query rewriting |
| Wrong chunks retrieved | confident but off-topic answers | re-ranking, minimum score, metadata filters |
| Answer split across chunks | half answers | larger k, neighbouring chunks, bigger chunks |
| Stale data | old policy quoted | re-embed on update, delete on delete |
| Model ignores sources | made-up details | stricter prompt, citations, lower temperature ([step 3](topic:ai/rag-answer-with-sources)) |

**2. Hybrid search in MongoDB.**
- Keyword side: Atlas Search (`$search`) for full-text matching.
- Vector side: `$vectorSearch` ([step 2](topic:ai/rag-vector-search-mongodb)).
- Merge: compute RRF in your code, as above, or use MongoDB's **`$rankFusion`** stage. It merges ranked pipelines inside the database. A test on MongoDB 8.2 confirmed the stage runs. Check the Atlas docs for using it with `$vectorSearch` and `$search`.

**3. Re-ranking.** Retrieve more (say 30), then re-score each (question, chunk) pair with a stronger model, and keep the top 5. Re-rankers are slower, so use them only on the short list. Some embedding providers offer re-ranking models; an LLM can also judge relevance.

**4. Query rewriting.** Users ask short or vague questions.
- Rewrite follow-ups into standalone questions ("and for interns?" → "How many leave days do interns get?").
- Expand abbreviations ("WFH" → "work from home").
- Generate 2–3 versions of the question and merge their results.

**5. Measuring.** Build a small **evaluation set** (20–50 real questions, each with the chunk that should be found). Track:
- **Hit rate @k**: was the right chunk in the top k?
- **Recall @k**: when several chunks are relevant, how many did you find?
- **Answer quality**: is the final answer correct and grounded? See [Evals](topic:ai/evals).

Change **one** thing at a time (chunk size, k, hybrid on/off), and re-run the set.

**6. Keeping data in sync.**
- **On update:** delete the document's old chunks (by `docId`) and insert re-embedded ones.
- **On delete:** delete its chunks too.
- Store `embeddingModel` and `version` on chunks, so re-embedding is easy.

**7. Multi-tenant safety.** Filter by `tenantId` in **every** search: vector, keyword and re-ranking. Include the tenant in any cache key. SkillKeepr uses a separate database per tenant, which gives an extra wall of isolation. See [shared vs per-tenant databases](topic:architecture/shared-vs-db-per-tenant).

## 🎯 Why do we use it?

- **Reliability.** The answer can only be as good as the chunks you retrieve.
- **Proof.** An evaluation set shows that a change really helped, instead of "it feels better".
- **Real-world questions** mix exact codes (Form 16, JD-1042) with everyday words. Hybrid search handles both.

## ⚠️ Common mistakes

- **Tuning the prompt when retrieval is the problem.** Check which chunks were retrieved first.
- **No evaluation set**, so every change is a guess.
- **Changing many settings at once**, so you can't tell what helped.
- **Forgetting deletes and updates**, so stale chunks keep answering.

## 🗣️ How to answer in an interview

> "When RAG answers are wrong, I first check retrieval, because most failures come from there: bad chunks, the right chunk not found, wrong chunks found, or stale data. To fix them I use hybrid search, which combines keyword and vector search, for example with Reciprocal Rank Fusion, so exact codes and synonyms both work. For harder cases I fetch more candidates and re-rank them with a stronger model.
>
> I measure everything with a small labelled set of questions and the chunk each should find, tracking hit rate at k, and I change one thing at a time. I also keep chunks in sync when documents are updated or deleted, and filter by tenant in every search.
>
> I haven't run RAG in production yet; I've learned and practised these steps. [FILL IN: once built, add your practice project's before/after hit rate, e.g. "hybrid search raised hit@3 from X to Y".]"

## 🔁 Follow-up questions

### Keyword search or vector search — which is better?

Neither alone. Keyword search is great for exact names, codes and IDs. Vector search is great for meaning and synonyms. Hybrid search combines both and usually beats each one.

### Why does RRF use 60 in 1 / (60 + rank)?

It's a common default constant that stops the very top ranks from dominating too much. You can tune it, but 60 works well in practice.

### When is re-ranking worth it?

When the right chunk is usually in the top 20–30 but not the top 3–5. If it isn't retrieved at all, fix chunking or search first.

### How big should the evaluation set be?

Start with 20–50 real questions. Add every bug report as a new test case, so the same failure can't come back.

## ✅ Quick check

### 1. Users search for "JD-1042" and vector search can't find it. What helps most?

- A) a bigger LLM
- B) adding keyword search (hybrid search)
- C) a longer prompt

:::answer
**B) hybrid search.** Exact codes are a keyword-search strength; embeddings often blur them.
:::

### 2. In RRF, chunk X is rank 0 in the vector list and rank 2 in the keyword list. What is its score?

:::answer
**1/60 + 1/62 ≈ 0.0328.** Each list adds 1 / (60 + rank), and the scores are summed.
:::

### 3. A policy was updated last week, but RAG still quotes the old version. What went wrong?

:::answer
The **old chunks weren't deleted or re-embedded** when the document changed. Replace a document's chunks (by `docId`) on every update.
:::
