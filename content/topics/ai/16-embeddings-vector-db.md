---
title: Embeddings and vector databases
stack: ai
order: 16
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - An embedding is a list of numbers that captures the MEANING of a text. Similar meanings get similar numbers.
  - This lets you search by meaning, not just by matching words — "server-side JS engineer" finds "Node.js developer".
  - "Cosine similarity measures how close two embeddings are: near 1 = very similar, near 0 = unrelated."
  - A vector database stores embeddings and finds the nearest ones fast, even among millions (approximate nearest neighbour search).
  - "Options a Node developer already knows: MongoDB Atlas Vector Search and PostgreSQL with pgvector."
cards:
  - q: What is an embedding?
    a: A list of numbers (a vector) made by an embedding model that represents the meaning of a text. Texts with similar meaning get vectors that point the same way.
  - q: Why search with embeddings instead of keywords?
    a: Keywords need the same words. Embeddings match meaning, so "server-side JavaScript" finds "Node.js backend" even with no shared words.
  - q: What is cosine similarity?
    a: A score for how much two vectors point the same way. 1 means the same direction (very similar), 0 means unrelated.
  - q: What does a vector database do?
    a: Stores embeddings with their text and metadata, and quickly finds the closest ones to a query vector — usually with an approximate index like HNSW.
  - q: Do you need the same embedding model for documents and queries?
    a: Yes. Vectors from different models live in different "spaces" and can't be compared. If you change the model, re-embed everything.
---

## 💡 What is it?

An **[embedding](glossary:embedding)** is a list of numbers that represents the **meaning** of some text. A special **embedding model** creates it.

Texts with similar meaning get similar numbers. "Node.js developer" and "server-side JavaScript engineer" end up close together, even though the words are different.

A **[vector database](glossary:vector-database)** stores these number lists and quickly finds the ones closest to your search.

## 🏠 Real-life example

Think of **a school library arranged by topic, not by title**.

Every book gets a spot on a big map. Science books sit near each other. Cricket books sit near other sports books. You walk to the spot for "space travel", and the nearby shelves have all the related books — even ones without "space" in the title.

Mapping:
- **A book's spot on the map** = its embedding (a list of numbers).
- **The librarian who decides the spot** = the embedding model.
- **"Close on the map"** = similar meaning (high cosine similarity).
- **Your question, placed on the same map** = the query embedding.
- **The library's index cards to find nearby shelves fast** = the vector database's index.

## 🧑‍💻 Code example

This runs **without an API key**. We use tiny 3-number vectors made by hand, so you can see the maths. Real embeddings have hundreds or thousands of numbers. Save as `embed.mjs` and run `node embed.mjs`.

```js
const docs = [                                                   // pretend these vectors came from an embedding model
  { text: 'Node.js backend developer',   vector: [0.9, 0.1, 0.0] }, // 3 numbers: [backend, frontend, sales]
  { text: 'Express and MongoDB APIs',    vector: [0.8, 0.2, 0.1] }, // also mostly "backend"
  { text: 'React and Tailwind UI',       vector: [0.1, 0.9, 0.0] }, // mostly "frontend"
  { text: 'Sales executive, B2B leads',  vector: [0.0, 0.1, 0.9] }, // mostly "sales"
];                                                               // end of docs

function cosine(a, b) {                                          // how similar two vectors are: 1 = same direction
  let dot = 0, lenA = 0, lenB = 0;                               // running totals
  for (let i = 0; i < a.length; i++) {                           // go through each number
    dot += a[i] * b[i];                                          // multiply matching numbers and add up
    lenA += a[i] * a[i];                                         // length of a, squared
    lenB += b[i] * b[i];                                         // length of b, squared
  }                                                              // end of the loop
  return dot / (Math.sqrt(lenA) * Math.sqrt(lenB));              // dot product ÷ (length × length)
}                                                                // end of cosine

const query = { text: 'server-side JavaScript engineer', vector: [0.85, 0.15, 0.05] }; // the search, as a vector

const ranked = docs                                              // score every document
  .map((d) => ({ text: d.text, score: cosine(query.vector, d.vector) })) // similarity to the query
  .sort((a, b) => b.score - a.score);                            // best match first

for (const r of ranked) console.log(r.score.toFixed(3), r.text); // print score (3 decimals) and text
```

**Real output:**

```text
0.996 Node.js backend developer
0.996 Express and MongoDB APIs
0.281 React and Tailwind UI
0.077 Sales executive, B2B leads
```

The query "server-side JavaScript engineer" shares **no words** with "Express and MongoDB APIs". It still scores 0.996, because the *meaning* (the vector) is close. A keyword search would have missed it.

## 🔍 Deeper version

**Where real embeddings come from.** You send text to an **embedding model**, and it returns a vector. Common choices:
- OpenAI's `text-embedding-3` models,
- Voyage AI (Anthropic has no embedding model of its own, and its docs point to Voyage),
- open-source models you can run yourself.

Real vectors have a fixed size, often between a few hundred and a few thousand numbers.

**Similarity measures.**

| Measure | Idea | Note |
|---|---|---|
| Cosine similarity | Do the vectors point the same way? | The most common for text |
| Dot product | Direction × length | Equals cosine when vectors are normalised to length 1 |
| Euclidean distance | Straight-line distance | Smaller = more similar |

**Why a vector database?** Comparing the query with *every* vector is fine for 1,000 rows. For millions, it's too slow. Vector databases build an **approximate nearest neighbour (ANN)** index, often **HNSW** (a graph of "neighbour" links). It finds *almost* the best matches very fast, trading a little accuracy for a lot of speed.

**Options a MERN developer already knows:**
- **MongoDB Atlas Vector Search** — a `$vectorSearch` stage in the aggregation pipeline. See [Atlas Vector Search](topic:mongodb/atlas-vector-search).
- **PostgreSQL + pgvector** — a `vector` column type and distance operators.
- Dedicated services like Pinecone or Qdrant.

**Store metadata with the vector.** Save the text, its source, its date, and the **tenant ID**. Then you can filter ("only this company's documents") *before* ranking. In a multi-tenant app, this filter is a security rule, not a nice-to-have.

**Rules that bite in production:**
- Use the **same model** for documents and queries. Vectors from different models can't be compared.
- **Changing the model means re-embedding everything.**
- Split long documents into **chunks** before embedding. One vector for a 50-page PDF loses the details. See [RAG](topic:ai/rag).
- Combine with keyword search (**hybrid search**) for exact terms like IDs or rare skill names.

## 🎯 Why do we use it?

People search by meaning, not by exact words. A recruiter types "frontend engineer who knows design systems". Keyword search misses a resume that says "built a component library in React". Embedding search finds it.

Embeddings power:
- semantic search,
- "similar candidates" or "similar jobs",
- duplicate detection,
- **[RAG](glossary:rag)** — finding the right document chunks to give an LLM.

## ⚠️ Common mistakes

- **Mixing embedding models.** The scores become meaningless.
- **Embedding whole long documents.** Chunk them first.
- **Forgetting metadata filters.** In multi-tenant apps, one company could see another's documents.
- **Expecting exact-match behaviour.** Embeddings are fuzzy. For IDs and codes, use normal search too.

## 🗣️ How to answer in an interview

> "An embedding is a vector of numbers produced by an embedding model that represents the meaning of a text. Texts with similar meaning get vectors pointing in a similar direction, which we measure with cosine similarity — close to one means very similar. That lets us search by meaning: 'server-side JavaScript engineer' can find a 'Node.js backend developer' with no shared words.
>
> A vector database stores the vectors with their text and metadata, and uses an approximate nearest-neighbour index like HNSW to find the closest ones quickly among millions. As a MERN developer I'd look at MongoDB Atlas Vector Search or Postgres with pgvector first. Key rules: use the same embedding model for documents and queries, chunk long documents, and always filter by metadata like tenant ID before ranking."

[FILL IN: if SkillKeepr's candidate matching or search used embeddings, say how. Only if true — don't claim it otherwise.]

## 🔁 Follow-up questions

### What is HNSW?

Hierarchical Navigable Small World — an index that links each vector to some of its neighbours in layers. A search hops through the links to reach close vectors fast. It's *approximate*: very fast, slightly less exact.

### Embeddings vs full-text search — which is better?

Neither alone. Full-text is great for exact words and IDs. Embeddings are great for meaning. **Hybrid search** combines both scores.

### How do you update embeddings when a document changes?

Re-embed that document (or just the changed chunks) and replace its vectors. Store a content hash, so you only re-embed what really changed.

### What does dimension mean?

The number of values in each vector. More dimensions can hold more detail, but use more storage and memory. The model decides the dimension.

## ✅ Quick check

### 1. Two vectors point in exactly the same direction. What is their cosine similarity?

:::answer
**1** — the highest possible. (0 means unrelated; for text embeddings you rarely see negative values.)
:::

### 2. You embedded your documents with model A. Can you search them with a query embedded by model B?

- A) Yes, vectors are vectors
- B) No — use the same model, or re-embed everything

:::answer
**B.** Different models create different vector "spaces", so the similarity scores mean nothing.
:::

### 3. In a multi-tenant app, what must the vector search filter on?

:::answer
The **tenant (company) ID**, before ranking — so one company can never get another company's documents.
:::
