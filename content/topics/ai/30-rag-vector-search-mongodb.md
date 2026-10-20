---
title: "RAG step 2: embeddings and vector search with MongoDB"
stack: ai
order: 30
level: Basic
mustKnow: true
askedFrequency: common
summary:
  - "Embed every chunk once (when you save it) and embed every question (when it arrives) — with the SAME embedding model."
  - Store the vector next to the chunk text and metadata in the same MongoDB document.
  - "In Atlas, a Vector Search index plus a $vectorSearch stage finds the closest chunks. Always add a tenantId filter."
  - "numCandidates = how many near matches to check (bigger = more accurate, slower); limit = how many to return."
  - Anthropic has no embedding model of its own; use an embedding provider (for example Voyage AI or OpenAI).
cards:
  - q: Why must documents and questions use the same embedding model?
    a: Each model places meaning in its own number space. Vectors from two different models can't be compared, so search would return nonsense.
  - q: Where do you store the embedding in MongoDB?
    a: In the same document as the chunk text and metadata, in an array field like embedding, covered by an Atlas Vector Search index.
  - q: What do numCandidates and limit mean in $vectorSearch?
    a: numCandidates is how many nearby vectors the index checks; limit is how many results you get back. A common rule is numCandidates ≈ 10–20 × limit.
  - q: How do you keep tenants apart in vector search?
    a: Index tenantId as a filter field and pass filter tenantId in $vectorSearch, taking the tenant from the logged-in user, never from the request body.
  - q: Does Claude have an embeddings API?
    a: No. Anthropic doesn't offer its own embedding model; you use a separate provider such as Voyage AI, and Claude for the answer.
---

## 💡 What is it?

An [embedding](glossary:embedding) is a list of numbers that captures the **meaning** of a text. Texts with similar meaning get similar numbers.

In step 2 you turn every chunk from [step 1](topic:ai/rag-chunking) into an embedding and store it in MongoDB. When a question comes in, you embed it too. Then you ask the [vector database](glossary:vector-database) for the chunks whose numbers are closest.

## 🏠 Real-life example

Think of **a library where books are shelved by topic, not by title**.

Every book gets a shelf position based on what it's about. Cricket books sit together, cooking books sit together. When you ask about "spin bowling", the librarian walks to the cricket shelf and hands you the closest books.

- **Shelf position** = the embedding (numbers for meaning).
- **Putting each new book on its shelf** = embedding chunks when you save them.
- **Your question** = also gets a shelf position, using the same rules.
- **Walking to the nearest books** = vector search.
- **The librarian** = the same embedding model for books and questions. A different librarian would shelve things differently.
- **"Only books from our school's library"** = the tenantId filter.

## 🧑‍💻 Code example

This runs **offline**, with no API key and no Atlas account. It uses a tiny pretend embedding and an in-memory MongoDB. Real code is in the Deeper version.

Setup: `npm init -y`, then `npm install mongodb mongodb-memory-server`. Save as `vector.js` and run `node vector.js`.

```js
// vector.js — store chunk embeddings in MongoDB and find the closest ones (runs offline)
const { MongoMemoryServer } = require('mongodb-memory-server'); // a throwaway MongoDB for this demo
const { MongoClient } = require('mongodb');               // the official MongoDB driver

const DIMS = 256;                                         // length of each fake vector (real models: 1024+)
const STOP = new Set(['the', 'is', 'a', 'an', 'of', 'do', 'i', 'what', 'how', 'can', 'you', 'get', 'and', 'to', 'in', 'my']); // filler words to ignore

function fakeEmbed(text) {                                // STAND-IN for a real embedding API (no key needed)
  const v = new Array(DIMS).fill(0);                      // start with 256 zeros
  for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) { // every word, in lowercase
    if (STOP.has(word)) continue;                         // skip filler words like "the" and "is"
    let h = 0;                                            // a simple hash of the word
    for (const ch of word) h = (h * 31 + ch.charCodeAt(0)) % DIMS; // same word → same slot every time
    v[h] += 1;                                            // count the word in its slot
  }                                                       // end of word loop
  const len = Math.hypot(...v) || 1;                      // vector length (1 avoids dividing by 0)
  return v.map((x) => x / len);                           // normalise, so length = 1
}                                                         // end of fakeEmbed

function cosine(a, b) {                                   // similarity of two normalised vectors
  return a.reduce((sum, x, i) => sum + x * b[i], 0);      // dot product: 1 = same direction, 0 = unrelated
}                                                         // end of cosine

const chunks = [                                          // chunks from step 1, for two companies
  { tenantId: 'acme', source: 'hr.md', text: 'Employees get 18 days of paid leave every year.' }, // one chunk: its id/tenant and text
  { tenantId: 'acme', source: 'hr.md', text: 'The notice period is 60 days and can be bought out.' }, // one chunk: its id/tenant and text
  { tenantId: 'acme', source: 'hr.md', text: 'You can work from home 2 days a week with approval.' }, // one chunk: its id/tenant and text
  { tenantId: 'globex', source: 'policy.md', text: 'Globex staff get 25 days of paid leave.' }, // another tenant
];                                                        // end of chunks

async function main() {                                   // everything async lives here
  const mongo = await MongoMemoryServer.create();         // start the in-memory database
  const client = await MongoClient.connect(mongo.getUri()); // connect to it
  const col = client.db('rag').collection('chunks');      // the "chunks" collection

  await col.insertMany(chunks.map((c) => ({ ...c, embedding: fakeEmbed(c.text) }))); // store text + vector together

  const question = 'How many days of leave do I get?';    // the user's question
  const qVec = fakeEmbed(question);                       // SAME model for the question as for the docs

  const docs = await col.find({ tenantId: 'acme' }).toArray(); // filter by tenant FIRST (Atlas does this inside $vectorSearch)
  const top = docs                                        // rank this tenant's chunks
    .map((d) => ({ text: d.text, score: cosine(qVec, d.embedding) })) // score each chunk
    .sort((a, b) => b.score - a.score)                    // highest score first
    .slice(0, 2);                                         // keep the top 2 (like limit: 2)

  console.log(`Question: ${question}`);                   // show the question
  for (const t of top) console.log(`${t.score.toFixed(3)}  ${t.text}`); // show score and text

  await client.close();                                   // close the connection
  await mongo.stop();                                     // stop the in-memory database
}                                                         // end of main

main();                                                   // run it
```

**Output:**

```text
Question: How many days of leave do I get?
0.471  Employees get 18 days of paid leave every year.
0.236  The notice period is 60 days and can be bought out.
```

**What to notice:**
- The leave chunk wins. Globex's "25 days" never appears, because we filtered by `tenantId` first.
- The second result only matched the word "days". A real embedding model understands meaning far better than this word-counting stand-in.

## 🔍 Deeper version

**1. Getting real embeddings.** You call an embedding API once per chunk (in batches) and once per question.

:::note[Which provider?]
Anthropic doesn't offer its own embedding model; its docs point to embedding providers such as **Voyage AI**. OpenAI also has embedding models. Pick one model, write its name in config, and use it for both documents and questions. Check the provider's docs for the current model names and vector sizes.
:::

```js
// embed.js — sketch of a real embedding call (needs a provider API key; not run here)
async function embed(texts) {                            // texts = array of strings
  const res = await fetch(process.env.EMBEDDINGS_URL, {  // the provider's embeddings endpoint
    method: 'POST',                                      // embeddings are a POST call
    headers: {                                           // auth + JSON
      Authorization: `Bearer ${process.env.EMBEDDINGS_API_KEY}`, // secret from .env, never in code
      'Content-Type': 'application/json',                // we send JSON
    },                                                   // end of headers
    body: JSON.stringify({ model: process.env.EMBEDDING_MODEL, input: texts }), // e.g. a Voyage or OpenAI model name
  });                                                    // end of fetch
  const json = await res.json();                         // the reply
  return json.data.map((d) => d.embedding);              // one vector per input text (shape depends on provider)
}                                                        // end of embed
```

**2. The Atlas Vector Search index** (Atlas-only; created in the Atlas UI or with the driver):

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine" },
    { "type": "filter", "path": "tenantId" }
  ]
}
```

- `numDimensions` must equal your model's vector length, or the search fails.
- `similarity`: `cosine` is the usual choice for text.
- `tenantId` is a **filter** field, so you can pre-filter by company.

**3. The query** (Atlas-only):

```js
const results = await chunksCol.aggregate([             // an aggregation pipeline
  {                                                     // stage 1 MUST be $vectorSearch
    $vectorSearch: {                                    // Atlas Vector Search stage
      index: 'chunks_vector_index',                     // the index name from step 2
      path: 'embedding',                                // the field holding the vectors
      queryVector: await embedQuestion(question),       // the question's vector (same model!)
      numCandidates: 100,                               // check ~100 nearby vectors (more = more accurate, slower)
      limit: 5,                                         // return the best 5
      filter: { tenantId: req.user.tenantId },          // tenant comes from the JWT, never from the body
    },                                                  // end of $vectorSearch
  },                                                    // end of stage 1
  { $project: { text: 1, source: 1, section: 1, score: { $meta: 'vectorSearchScore' } } }, // keep what we need + the score
]).toArray();                                           // run it
```

See [MongoDB Atlas Vector Search](topic:mongodb/atlas-vector-search) for more on this stage.

**4. numCandidates vs limit.** Vector indexes use an **approximate** nearest-neighbour search (HNSW). It checks `numCandidates` likely matches and returns the best `limit`. A common starting rule is `numCandidates` ≈ 10–20 × `limit`.

**5. Cost and batching.** Embed chunks **once**, when you save or update them, not on every question. Send many chunks per API call. Store `embeddingModel` on each document, so you know what to re-embed if you change models.

## 🎯 Why do we use it?

- **Search by meaning.** "vacation days" finds a chunk about "paid leave", even with no shared words.
- **One database.** In a MERN app, chunks, vectors and app data can live in MongoDB together. There's no extra vector service to run.
- **Filters.** You can mix "closest meaning" with normal filters like `tenantId` or `docId`.

## ⚠️ Common mistakes

- **Two different embedding models** for documents and questions. The numbers don't match, so results are random.
- **Wrong `numDimensions`** in the index, for example 1536 when the model makes 1024.
- **No tenant filter**, or taking `tenantId` from the request body. A user could then search another company's documents.
- **Re-embedding all chunks on every question.** Embed chunks once; only the question is embedded per request.

## 🗣️ How to answer in an interview

> "After chunking, I embed every chunk with one embedding model and store the vector in the same MongoDB document as the text and metadata. For each question, I embed it with the same model, because vectors from different models can't be compared.
>
> In Atlas I create a Vector Search index on the embedding field, with tenantId as a filter field. Then a $vectorSearch stage returns the closest chunks. numCandidates controls how many near matches it checks, and limit is how many it returns. I always filter by the tenantId from the user's token, never from the request body.
>
> I've worked a lot with MongoDB aggregation pipelines and multi-tenant data at SkillKeepr, so $vectorSearch fits that model. I haven't shipped RAG to production yet. [FILL IN: once built, mention your practice project and which embedding model you used.]"

## 🔁 Follow-up questions

### What is cosine similarity?

A score for how closely two vectors point the same way. It goes from 1 (same meaning) to 0 (unrelated). Vector search returns the chunks with the highest score.

### Why is vector search "approximate"?

Checking every vector is too slow for millions of chunks. Indexes like HNSW jump to a likely area and check only nearby candidates. That's much faster, and it's almost always right.

### Do you need a separate vector database like Pinecone?

Not for most MERN apps. MongoDB Atlas Vector Search keeps vectors next to your data with normal filters. A dedicated vector database can make sense at very large scale or for special features.

### What happens when you switch to a new embedding model?

Every stored vector must be re-embedded with the new model, and the index's `numDimensions` may change. Store the model name on each chunk, so you can migrate step by step.

## ✅ Quick check

### 1. You embedded documents with model A and questions with model B. What happens?

:::answer
Search returns **random-looking results**. Each model has its own number space, so the vectors aren't comparable. Use the same model for both.
:::

### 2. `limit: 5, numCandidates: 5`. Is that a good setting?

:::answer
**Usually not.** With so few candidates, the approximate search can miss better matches. Start with numCandidates around 10–20 × limit (here, about 50–100).
:::

### 3. Where should the tenantId for the filter come from?

- A) the request body
- B) the logged-in user's token (JWT)
- C) a query string

:::answer
**B) the logged-in user's token.** Anything the client sends can be faked.
:::
