---
title: RAG (Retrieval-Augmented Generation)
stack: ai
order: 17
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - RAG = first search your own data for the relevant pieces, then give those pieces to the LLM with the question, so it answers from real information.
  - "The pipeline: chunk → embed → store → retrieve → augment the prompt → generate an answer with sources."
  - RAG gives the model company data it never saw in training, keeps answers up to date, and reduces hallucination.
  - Quality depends mostly on retrieval. If the right chunk isn't found, the model can't answer well.
  - In multi-tenant apps, filter by tenant before retrieving. Tell the model to cite sources and to say "I don't know".
cards:
  - q: What is RAG?
    a: Retrieval-Augmented Generation. You search your own documents for the most relevant chunks, put them in the prompt with the question, and the LLM answers from them.
  - q: Name the steps of a RAG pipeline.
    a: Chunk the documents, embed the chunks, store them in a vector database, retrieve the top matches for a question, add them to the prompt, and generate the answer with sources.
  - q: RAG or fine-tuning for company documents?
    a: Usually RAG. It's cheaper, updates instantly when documents change, and can cite sources. Fine-tuning is for changing style or behaviour, not adding fresh facts.
  - q: How does RAG reduce hallucination?
    a: The model gets the real text to read, and you tell it to answer only from the sources and say "I don't know" otherwise.
  - q: What usually breaks a RAG system?
    a: Bad retrieval — wrong chunk size, no metadata filters, weak matches passed in, or the answer split across chunks. Then the model answers from the wrong text.
---

## 💡 What is it?

An [LLM](glossary:llm) doesn't know your company's documents, like the HR handbook, job policies or product docs. It also stops learning at its training date.

**[RAG](glossary:rag)** (Retrieval-Augmented Generation) fixes this:
1. **Retrieve** — search your documents for the pieces related to the question.
2. **Augment** — put those pieces into the prompt.
3. **Generate** — the model answers using them, and cites where it got the answer.

## 🏠 Real-life example

Think of **an open-book exam**.

The student (the model) is clever but doesn't know your school's rules by heart. In an open-book exam, the student first finds the right pages in the rule book, then writes the answer using those pages, and notes the page numbers.

Mapping:
- **The student** = the LLM.
- **The rule book** = your company documents.
- **Cutting the book into small cards** = chunking.
- **The index at the back of the book** = the vector database.
- **Finding the right pages** = retrieval.
- **Keeping those pages open next to the answer sheet** = augmenting the prompt.
- **Writing "see page 12"** = citing sources.
- **"The book doesn't say"** = the model answering "I don't know".

## 🧑‍💻 Code example

A tiny RAG pipeline that runs **without an API key**. It uses a toy word-count "embedding", so you can see every step. Real systems use an embedding model (see [embeddings](topic:ai/embeddings-vector-db)). Save as `rag.mjs` and run `node rag.mjs`.

```js
const handbook = [                                               // our company document (pretend it is long)
  'Leave policy: employees get 24 paid leaves per year.',        // line 1
  'Notice period: the notice period is 60 days for all engineers.', // line 2
  'Interview process: candidates face 3 rounds, ending with HR.', // line 3
  'Remote work: engineers may work remotely 2 days a week.',     // line 4
];                                                               // end of the document

const chunks = handbook.map((text, i) => ({ id: `handbook#${i + 1}`, text })); // 1. CHUNK: one line = one chunk

const words = (s) => s.toLowerCase().match(/[a-z]+/g) ?? [];     // split text into lowercase words
const vocab = [...new Set(chunks.flatMap((c) => words(c.text)))]; // every word we know
const embed = (s) => vocab.map((w) => words(s).filter((x) => x === w).length); // 2. EMBED: a toy word-count vector

const store = chunks.map((c) => ({ ...c, vector: embed(c.text) })); // 3. STORE: keep each chunk with its vector

function cosine(a, b) {                                          // similarity between two vectors
  const dot = a.reduce((s, x, i) => s + x * b[i], 0);            // multiply matching numbers and add up
  const len = (v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0)); // length of a vector
  return dot / (len(a) * len(b) || 1);                           // || 1 avoids dividing by zero
}                                                                // end of cosine

const question = 'What is the notice period for engineers?';     // the user's question
const top = store                                                // 4. RETRIEVE: find the best chunks
  .map((c) => ({ ...c, score: cosine(embed(question), c.vector) })) // score every chunk
  .sort((a, b) => b.score - a.score)                             // best first
  .slice(0, 2);                                                  // keep the top 2

const prompt = [                                                 // 5. AUGMENT: build the prompt line by line
  'Answer ONLY from the sources. If the answer is not there, say "I don\'t know".', // rule against guessing
  'Cite the source id in brackets.',                             // rule: show where the answer came from
  '',                                                            // a blank line
  ...top.map((c) => `<source id="${c.id}">${c.text}</source>`),  // each retrieved chunk, wrapped in a tag
  '',                                                            // a blank line
  `Question: ${question}`,                                       // the user's question goes last
].join('\n');                                                    // join everything with new lines

console.log(top.map((c) => `${c.id} score=${c.score.toFixed(2)}`).join('\n')); // which chunks we picked
console.log('\n--- prompt sent to the LLM ---\n' + prompt);     // 6. GENERATE: this goes to the model
```

**Real output:**

```text
handbook#2 score=0.87
handbook#4 score=0.12

--- prompt sent to the LLM ---
Answer ONLY from the sources. If the answer is not there, say "I don't know".
Cite the source id in brackets.

<source id="handbook#2">Notice period: the notice period is 60 days for all engineers.</source>
<source id="handbook#4">Remote work: engineers may work remotely 2 days a week.</source>

Question: What is the notice period for engineers?
```

With a real model, the expected answer is "60 days [handbook#2]". Notice that the **second** chunk (score 0.12) is unrelated. It only matched the word "engineers". Real systems drop weak matches with a **minimum score**, so noise doesn't reach the model.

## 🔍 Deeper version

**The two halves of RAG.**

| Indexing (done ahead of time) | Querying (on every question) |
|---|---|
| Load documents (PDF, docs, DB rows) | Embed the question |
| Split into chunks | Search the vector DB (with metadata filters) |
| Embed each chunk | Optionally rerank the results |
| Store vectors + text + metadata | Build the prompt with the top chunks |
| Re-index when documents change | Generate the answer with citations |

**Chunking is the biggest quality lever.**
- **Too big:** the chunk mixes many topics, so the match is weak and you waste [tokens](glossary:token).
- **Too small:** the answer gets split across chunks and loses its meaning.
- Common start: a few hundred tokens per chunk, with a small **overlap**. Split on natural breaks like headings and paragraphs.
- Store metadata with each chunk: source, page or section, date, and the **tenant ID**.

**Retrieval tips.**
- **Hybrid search:** combine vector similarity with keyword search. It helps with exact terms like job codes.
- **Reranking:** fetch the top 20, then let a reranker model pick the best 5.
- **Score threshold:** skip weak matches, as the example shows.
- **Metadata filters first:** "only this company's documents, only current policies". In a [multi-tenant](glossary:multi-tenant) app, the tenant filter is a security rule.

**Generation tips.**
- Put the sources in clear tags, and the question last.
- Tell the model: answer **only** from the sources, cite them, and say "I don't know" when they don't contain the answer.
- Some APIs have built-in **citations**. For example, Anthropic's document blocks can return the exact cited text.

**Storage options for a Node.js developer:** [MongoDB Atlas Vector Search](topic:mongodb/atlas-vector-search) (`$vectorSearch` stage), PostgreSQL with pgvector, or a dedicated vector database. Frameworks like [LangChain](topic:ai/langchain) have ready-made loaders, splitters and retrievers. Learn the plain version first, so you know what they do for you.

**Measure it.** Keep a small set of real questions with known answers. Check two things: did retrieval find the right chunk, and did the final answer use it correctly? See [evals](topic:ai/evals).

## 🎯 Why do we use it?

- **Private data:** the model can answer questions about *your* handbook, jobs or candidates.
- **Fresh data:** update a document and the next answer uses it. No retraining needed.
- **Fewer [hallucinations](topic:ai/hallucination):** the model reads real text instead of guessing.
- **Trust:** answers come with sources that users can check.
- **Cost:** much cheaper and faster to update than fine-tuning a model.

## ⚠️ Common mistakes

- **Bad chunking** — whole documents as one chunk, or tiny fragments.
- **No tenant/permission filter** — leaking one company's data to another.
- **Passing weak matches** — irrelevant chunks confuse the model.
- **No "I don't know" rule** — the model fills gaps by guessing.
- **Never re-indexing** — the answers use old documents.

## 🗣️ How to answer in an interview

> "RAG — retrieval-augmented generation — means that before asking the model, I search my own data for the relevant pieces and include them in the prompt. Indexing happens ahead of time: split the documents into chunks, create an embedding for each chunk, and store them in a vector database with metadata like source and tenant ID. At query time I embed the question, retrieve the top matches — filtered by tenant, ideally with hybrid search and a score threshold — put them in the prompt in clear source tags, and tell the model to answer only from them, cite them, and say 'I don't know' otherwise.
>
> It gives the model private and up-to-date knowledge, reduces hallucination, and is much cheaper than fine-tuning. Most quality problems come from retrieval, so I'd tune the chunking and test retrieval with a set of real questions. As a MERN developer, I'd start with MongoDB Atlas Vector Search or pgvector."

[FILL IN: if you built or designed any RAG feature (for example, over job descriptions or candidate data), describe it here. Only if true — don't claim it otherwise.]

## 🔁 Follow-up questions

### RAG vs fine-tuning?

RAG adds **knowledge** at question time: cheap, instantly updated, and it cites sources. Fine-tuning changes **behaviour or style** by training: expensive and slow to update. For company documents, use RAG first. See [training vs fine-tuning](topic:ai/training-inference-finetuning).

### How do you choose the chunk size?

Start with a few hundred tokens and a small overlap, split on headings or paragraphs, then test with real questions. Change it if answers miss context (too small) or retrieval is noisy (too big).

### The answer is wrong. How do you debug a RAG system?

First check **retrieval**: were the right chunks found? If not, fix chunking, filters or the search. If they were found, fix the **prompt** or the model. Log the retrieved chunk IDs for every answer.

### How do you keep tenants' data separate?

Store the tenant ID with every chunk and always filter on it in the vector query. Never rely on the prompt to separate customers.

## ✅ Quick check

### 1. Put these steps in order: retrieve, embed chunks, generate, chunk documents, augment prompt.

:::answer
**Chunk documents → embed chunks → retrieve → augment prompt → generate.** (Storing the vectors comes right after embedding.)
:::

### 2. Your company's leave policy changed yesterday. With RAG, what must happen so answers use the new policy?

- A) Retrain the model
- B) Re-index (re-chunk and re-embed) the updated document

:::answer
**B.** RAG reads your documents at question time, so you only update the index. No retraining is needed.
:::

### 3. In the example, why did `handbook#4` (score 0.12) get retrieved, and what's the fix?

:::answer
It shared only the word "engineers" and we always take the top 2. Fix it with a **minimum score threshold** (and a real embedding model), so weak matches are dropped.
:::
