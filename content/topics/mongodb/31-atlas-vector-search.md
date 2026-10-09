---
title: MongoDB Atlas and Atlas Vector Search (overview)
stack: mongodb
order: 31
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - MongoDB Atlas is MongoDB's managed cloud service — it runs replica sets, backups, scaling, monitoring and security for you. The free tier is good for learning.
  - An embedding is a list of numbers that captures the meaning of text. Similar meanings → similar numbers.
  - Atlas Vector Search finds documents whose embeddings are closest to your query's embedding — search by meaning, not exact words.
  - "You create a vectorSearch index (path, numDimensions, similarity) and query with the $vectorSearch stage, which must be the first stage of the pipeline."
  - It's the "retrieval" part of RAG. Add filter fields (like tenantId) to the index so each company only searches its own data.
cards:
  - q: What is MongoDB Atlas?
    a: MongoDB's fully managed cloud database service. It handles servers, replica sets, backups, scaling, monitoring and security settings for you.
  - q: What is an embedding?
    a: A list of numbers (a vector) produced by an AI model that represents the meaning of a piece of text, so similar texts get similar vectors.
  - q: What does $vectorSearch do?
    a: It finds the documents whose stored embeddings are most similar to a query vector, using a vector search index. It must be the first stage in the pipeline.
  - q: What are numCandidates and limit in $vectorSearch?
    a: "numCandidates is how many nearest neighbours to consider (more = more accurate but slower); limit is how many results to return. numCandidates must be at least limit."
  - q: How do you keep vector search multi-tenant safe?
    a: Index tenantId as a filter field in the vector index and always pass filter with the logged-in user's tenantId in $vectorSearch.
---

## 💡 What is it?

**MongoDB Atlas** is MongoDB's **cloud service**. You click a few buttons and get a ready database. Atlas looks after the servers, copies, backups and security for you.

**Atlas Vector Search** lets you search by **meaning**, not exact words. It compares **[embeddings](glossary:embedding)**: lists of numbers that an AI model makes from text. Texts with similar meaning get similar numbers.

So a search for "Express API developer" can find a job called "Node.js backend engineer", even though no words match.

## 🏠 Real-life example

Think of a **school library with a smart librarian**.

You ask: "I want a book about **space rockets**." A normal catalogue only finds titles with the exact words "space rockets". But the smart librarian understands **meaning**. They also bring "Journey to the Moon" and "How ISRO launches satellites".

How? The librarian has put every book on a big **map of topics**. Space books sit close together, cooking books in another corner, cricket books in another. Your question also gets a spot on the map. The librarian simply brings the books **closest to your spot**.

- The **map spot of each book** = the book's embedding (a list of numbers).
- **Your question's spot** = the query vector.
- **Bringing the nearest books** = `$vectorSearch`.
- **"Only books from our school's shelf"** = the `tenantId` filter.

## 🧑‍💻 Code example

Setup: this needs **MongoDB Atlas** (the free tier works). Copy the connection string. Run `npm init -y` and `npm install mongodb`. Save this as `vector.js` and run `MONGO_URL="your-atlas-url" node vector.js`. To keep it simple, we use tiny 3-number "embeddings" written by hand. A real app gets embeddings with 768 or more numbers from an AI model. It uses CommonJS.

```js
const { MongoClient } = require('mongodb');                                  // the official MongoDB driver

async function main() {                                                      // the demo
  const client = new MongoClient(process.env.MONGO_URL);                     // create a client for your Atlas cluster
  await client.connect();                                                    // open the connection
  const jobs = client.db('hiring_demo').collection('jobs');                  // the jobs collection

  await jobs.deleteMany({});                                                 // start clean
  await jobs.insertMany([                                                    // 3 jobs with tiny fake embeddings
    { tenantId: 1, title: 'Node.js backend developer', embedding: [0.9, 0.1, 0.0] }, // "backend" meaning
    { tenantId: 1, title: 'React frontend developer', embedding: [0.1, 0.9, 0.0] },  // "frontend" meaning
    { tenantId: 1, title: 'Sales manager', embedding: [0.0, 0.1, 0.9] },             // "sales" meaning
  ]);                                                                        // end of insertMany

  const found = await jobs.listSearchIndexes('job_vectors').toArray();       // does our vector index already exist?
  if (!found.length) {                                                       // if not, create it (only needed once)
    await jobs.createSearchIndex({                                           // ask Atlas to build a search index
      name: 'job_vectors',                                                   // the index name we will query
      type: 'vectorSearch',                                                  // a vector index, not a text index
      definition: { fields: [                                                // what to index
        { type: 'vector', path: 'embedding', numDimensions: 3, similarity: 'cosine' }, // 3 numbers per vector; compare by angle
        { type: 'filter', path: 'tenantId' },                                // allow filtering by company
      ] },                                                                   // end of definition
    });                                                                      // end of createSearchIndex
  }                                                                          // end of if

  while (!(await jobs.listSearchIndexes('job_vectors').toArray())[0]?.queryable) { // the index builds in the background
    await new Promise((r) => setTimeout(r, 3000));                           // wait 3 seconds, then check again
  }                                                                          // end of while
  await new Promise((r) => setTimeout(r, 3000));                             // give Atlas a moment to index the new documents

  const queryVector = [0.8, 0.2, 0.0];                                       // pretend embedding of "Express API developer"
  const results = await jobs.aggregate([                                     // a normal aggregation pipeline
    { $vectorSearch: {                                                       // MUST be the first stage
      index: 'job_vectors',                                                  // which vector index to use
      path: 'embedding',                                                     // which field holds the vectors
      queryVector,                                                           // what we are looking for
      numCandidates: 10,                                                     // how many close vectors to consider
      limit: 2,                                                              // return the best 2
      filter: { tenantId: 1 },                                               // only this company's jobs
    } },                                                                     // end of $vectorSearch
    { $project: { _id: 0, title: 1, score: { $meta: 'vectorSearchScore' } } }, // show the title and similarity score
  ]).toArray();                                                              // run it and collect the results
  console.log(results);                                                      // print them

  await client.close();                                                      // close the connection
}                                                                            // end of main

main().catch(console.error);                                                 // run and print any error
```

```text
[
  { title: 'Node.js backend developer', score: 0.9955... },
  { title: 'React frontend developer', score: 0.674... }
]
```

**What to notice:** the query never says "Node.js". It's just *close in meaning* (close numbers) to the backend job. The sales job is far away, so it isn't returned. If the results are empty, wait a few seconds and run it again: Atlas indexes new documents in the background.

## 🔍 Deeper version

**What Atlas gives you.** Atlas runs MongoDB for you on AWS, Google Cloud or Azure:
- every cluster is a **replica set** (3 nodes), so it stays up if one node fails,
- automated **backups** and point-in-time restore (on paid tiers),
- **scaling** with a few clicks (bigger servers, more storage, sharding),
- **monitoring**, performance advice, network access lists, and database users,
- extra features: **Atlas Search** (full-text search) and **Atlas Vector Search**.

**How vector search works.** Each document stores an embedding, an array of numbers. A **vector index** organises these arrays so the nearest ones can be found fast. Atlas uses an *approximate nearest neighbour* (ANN) method. It's very fast, and almost always finds the true nearest ones.

**The index definition:**
- `type: 'vector'`, `path` (the field), `numDimensions` (must match your model's output size), and `similarity`: `cosine`, `euclidean` or `dotProduct`.
- `type: 'filter'` fields (like `tenantId` or `status`) are needed if you want to filter inside `$vectorSearch`.

**The `$vectorSearch` stage:**
- It **must be the first stage** in the pipeline.
- `numCandidates` is how many neighbours to look at. A common starting point is about 10–20 × `limit`. More is more accurate but slower.
- `limit` is how many results to return.
- `filter` narrows results before ranking, using only the indexed filter fields.
- Get the score with `{ $meta: 'vectorSearchScore' }`.
- `exact: true` does an exact (non-approximate) search. It's slower; use it for small data or for testing accuracy.

**Where embeddings come from.** You call an embedding model (from OpenAI, Voyage AI, Google and others) when you save a document and again for each search query. **Both must use the same model.** Store the vector next to the text in the same document.

**RAG (Retrieval-Augmented Generation).** Vector search is the **retrieval** step:
1. Turn the user's question into an embedding.
2. `$vectorSearch` finds the most relevant chunks of your documents.
3. Send those chunks plus the question to an LLM.
4. The LLM answers using **your** data, which reduces made-up answers.

See [RAG](glossary:rag) and the AI section for more.

**Why MongoDB for vectors?** Your data, metadata and vectors live in **one database**. You can filter by tenant or status in the same query. You don't need a separate [vector database](glossary:vector-database) to keep in sync.

:::note[Availability]
Atlas Vector Search started as an Atlas-only feature. MongoDB has been bringing vector search to self-managed deployments too. Check the current docs for your version before you rely on it outside Atlas.
:::

## 🎯 Why do we use it?

- **Atlas:** you don't need a team to run database servers. Backups, failover and scaling are built in, which saves time and avoids mistakes.
- **Vector Search:** users don't type exact words. Matching **meaning** gives much better results for things like "find candidates similar to this job description", semantic search in help docs, and RAG chatbots.

## ⚠️ Common mistakes

- **Using different embedding models** for stored documents and for the query. The numbers won't be comparable, and the results will be junk.
- **`numDimensions` doesn't match the model's output.** The index won't work with those vectors.
- **Forgetting the tenant filter.** One company could see another company's documents in search results. Index `tenantId` as a filter field and always pass it.
- **Putting `$vectorSearch` after another stage.** It must be the first stage.

## 🗣️ How to answer in an interview

> "Atlas is MongoDB's managed cloud service. It runs replica sets, backups, scaling, monitoring and network security for us, so we focus on the app instead of the servers.
>
> Atlas Vector Search lets us search by meaning. We store an embedding, a vector of numbers from an AI model, in each document, and create a vector search index with the path, the number of dimensions and the similarity function, usually cosine. At query time, we embed the user's question with the same model and run a `$vectorSearch` stage as the first stage of the pipeline, with `numCandidates`, a `limit`, and a filter. In a multi-tenant app, I'd index tenant ID as a filter field and always filter by the logged-in user's tenant. This is the retrieval step of RAG: we pass the top results to an LLM so it answers from our own data."

[FILL IN: whether SkillKeepr uses MongoDB Atlas, and whether any feature uses vector search — only if true.]

## 🔁 Follow-up questions

### What is cosine similarity in simple words?

It measures the **angle** between two vectors, ignoring their length. A small angle means a similar meaning. Many text embedding models are designed to work with cosine similarity.

### Why is vector search "approximate"?

Checking every vector is slow for millions of documents. ANN indexes skip most of them and still find almost all of the true nearest neighbours, much faster. Raise `numCandidates` (or use `exact: true` on small data) for higher accuracy.

### What do you store in a document for RAG?

A text chunk (a paragraph or so), its embedding, and metadata like `tenantId`, `sourceUrl` and `updatedAt`. Long documents are split into chunks before embedding, so each chunk has one clear meaning.

### Do you need a separate vector database like Pinecone?

Not always. If your data is already in MongoDB Atlas, Vector Search keeps vectors and metadata together with no syncing. A separate vector database can make sense at very large scale or for special features. It's a trade-off.

## ✅ Quick check

### 1. Where must `$vectorSearch` appear in the pipeline?

:::answer
**First.** It must be the first stage of the aggregation pipeline.
:::

### 2. Your model makes 1536-number embeddings, but the index says `numDimensions: 768`. What happens?

- A) It works fine
- B) The vectors don't match the index, so search won't work properly
- C) MongoDB shrinks them automatically

:::answer
**B.** `numDimensions` must equal the model's output size. Create the index with 1536.
:::

### 3. How do you make sure one company never sees another company's results?

:::answer
Add `tenantId` as a `filter` field in the vector index, and always pass `filter: { tenantId: <logged-in user's tenant> }` in `$vectorSearch`. Take the tenant from the verified token, not the request.
:::
