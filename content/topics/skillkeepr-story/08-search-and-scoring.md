---
template: chapter
title: Searching and scoring candidates
stack: skillkeepr-story
order: 8
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Priya searches candidates with keywords like "node AND react OR angular AND NOT java", plus filters for skills, experience and location.
  - Search runs in MongoDB on candidate profile text, using a text index and word-boundary regex, with pagination.
  - Scoring a candidate against a job runs in the background through a queue that calls an AI scoring service.
  - Scores decide which candidates are eligible for the AI screening call in the next chapter.
cards:
  - q: How does the boolean candidate search work?
    a: The keyword query is turned into a MongoDB filter — AND becomes $and, OR becomes $or, NOT becomes $nor — over the profile text, plus normal filters and pagination.
  - q: Why escape the user's search words before using them in a regex?
    a: Special characters like ( or * would break the regex or slow it down badly. Escaping treats them as plain text.
  - q: Why is scoring done in the background?
    a: Scoring calls an AI service and takes time. A queue lets the recruiter keep working while scores arrive.
  - q: What did your gap analysis on scoring involve?
    a: Resume and candidate scores differed between the prototype and production. I traced the logic, found the formulas differed, aligned production with the prototype, and checked the applied formula in CloudWatch logs.
---

## 💡 What happens in this chapter

Acme Hiring now has hundreds of candidates. Priya wants the best ones for her Node.js job.

First she **searches**: candidates who know Node, and React or Angular, but not Java. Then SkillKeepr **scores** candidates against the job. The best scores move forward to an AI screening call.

## 🏠 Real-life example

Think of a **school library** and a **talent show**.

- **The library catalogue search** ("books about space AND rockets, NOT fiction") = the boolean keyword search.
- **Shelves by subject and age** = filters for skills, experience and location.
- **Showing 20 books per page** = pagination.
- **Judges giving marks to each performer** = the AI scoring service.
- **Judges marking in a back room, one by one** = scoring through a queue.
- **Top scorers go to the final round** = eligible candidates get the AI screening call.

## 🗺️ The flow

```text
SEARCH (right away)
Priya types: node AND react OR angular AND NOT java  + filters
   │
   ▼
API ── parse the query → MongoDB filter ($and / $or / $nor)
   │      + skills, experience, location filters
   │      + skip/limit for the page
   ▼
MongoDB (text index + word-boundary regex on profile text)
   │
   ▼
One page of results back to Priya

SCORING (in the background)
Job + candidates ──► queue ──► worker ──► AI scoring service
                                   │
                                   ▼
                     scores saved for each candidate
                                   │
                                   ▼
          eligible candidates → AI screening call (next chapter)
```

## 🧱 Tech used

| Piece | Technology | Learn it here |
|---|---|---|
| Keyword search | MongoDB text index + regex | [Unique, partial, TTL and text indexes](topic:mongodb/special-indexes) |
| AND / OR / NOT | $and, $or, $nor | [Query operators](topic:mongodb/query-operators) |
| Fast filters | Indexes, explain() | [explain('executionStats')](topic:mongodb/explain) |
| Pages of results | skip/limit or cursor | [Pagination at scale](topic:mongodb/pagination) |
| Unsafe input | Escaping, no operator injection | [NoSQL injection](topic:mongodb/nosql-injection) |
| Scoring in the background | Queue + AI service | [Queues and background jobs](topic:system-design/queues-background-jobs) |
| Smarter "meaning" search | Embeddings / vector search | [Embeddings and vector databases](topic:ai/embeddings-vector-db) |

## 🧑‍💻 Key code idea

A tiny version of the idea: turn a keyword query into a MongoDB filter, safely. It handles `AND`, `OR` and `NOT`, without brackets. Save it as `boolean-search.js` and run `node boolean-search.js`.

```js
function term(word) {                                      // one keyword → a case-insensitive whole-word match
  const safe = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape special characters so input can't break the regex
  return { profileText: { $regex: `\\b${safe}\\b`, $options: 'i' } }; // 'i' = ignore upper/lower case
}                                                          // end of term

function buildQuery(q) {                                   // supports: A AND B, A OR B, NOT C (no brackets in this tiny version)
  const filter = { $and: [] };                             // every part must match
  for (const part of q.split(/\s+AND\s+/)) {               // split on AND
    if (part.startsWith('NOT ')) {                         // NOT java → must not contain "java"
      filter.$and.push({ $nor: [term(part.slice(4))] });   // $nor = none of these may match
    } else if (part.includes(' OR ')) {                    // react OR angular → either one
      filter.$and.push({ $or: part.split(/\s+OR\s+/).map(term) }); // $or = at least one matches
    } else {                                               // a single word
      filter.$and.push(term(part));                        // must contain it
    }                                                      // end of if/else
  }                                                        // end of loop
  return filter;                                           // pass this to Candidate.find(...)
}                                                          // end of buildQuery

const q = buildQuery('node AND react OR angular AND NOT java'); // Priya's search
q.$and.forEach((part) => console.log(JSON.stringify(part))); // print each condition on its own line
```

```text
{"profileText":{"$regex":"\\bnode\\b","$options":"i"}}
{"$or":[{"profileText":{"$regex":"\\breact\\b","$options":"i"}},{"profileText":{"$regex":"\\bangular\\b","$options":"i"}}]}
{"$nor":[{"profileText":{"$regex":"\\bjava\\b","$options":"i"}}]}
```

Each line is one condition. All of them must match (`$and`). The middle one needs React **or** Angular. The last one says Java must **not** appear.

## 🧗 Hard parts and trade-offs

- **Regex can be slow.** A regex on long profile text may scan many documents. A text index, good filters and pagination help.
- **No smart ranking.** Keyword search finds words, not meaning. "NodeJS" vs "Node.js" can be missed. Vector search would understand meaning, but costs more to build and run.
- **Unsafe input.** User words go into a regex, so they must be escaped. Otherwise one bracket can break the query.
- **Scores must be consistent.** If the scoring formula differs between environments, recruiters see different results. That is exactly what my gap analysis found and fixed.

## 🙋 My part

- **Scoring gap analysis (confirmed):** my tech lead asked me to find why resume scoring and candidate scoring gave **different results between the prototype and production**. I traced the logic — technical skills, experience and trust score — and found the **formulas differed**. I **aligned production with the prototype**, which held the intended business rules, and checked the applied formula in **CloudWatch logs**. See [the gap analysis story](topic:resume/gap-analysis).
- I investigated how the Trust Score is calculated, but I did **not** fix a Trust Score issue.
- My work on the search feature itself: [FILL IN: only if you worked on it].

## 🗣️ How to explain it in an interview

> "Recruiters can search candidates with keywords like 'node AND react OR angular AND NOT java', plus filters for skills, experience and location. The query becomes a MongoDB filter — AND, OR and NOT map to $and, $or and $nor — over the candidate's profile text, using a text index and word-boundary regex, with pagination.
>
> Scoring a candidate against a job runs in the background through a queue that calls an AI scoring service. Those scores decide who gets the AI screening call.
>
> One piece of work I did here: scores were different between our prototype and production. I traced the scoring logic — skills, experience and trust score — found the formulas didn't match, aligned production with the prototype's rules, and verified the formula being applied in CloudWatch logs."

## 🔁 Follow-up questions

### Why not use Elasticsearch or OpenSearch?

A search cluster gives better ranking and fuzzy matching, but adds cost and another system to run. MongoDB text search was enough for the current needs. [FILL IN: only if you know the team's reason]

### How would you make search faster on a big tenant?

Add indexes that match the filters, return only needed fields, page with a cursor instead of a large skip, and check with explain(). See [a query is fast in dev but slow in prod](topic:debugging/query-slow-in-prod).

### How did you confirm the scoring fix worked?

I checked the formula actually applied in CloudWatch logs after the change. [FILL IN: any test or comparison you also did]

### How would you search by meaning instead of keywords?

Store embeddings of each profile and use vector search with a tenant filter. See [RAG step 2: vector search with MongoDB](topic:ai/rag-vector-search-mongodb).

## 📚 Topics to revise

- [Resume story: the scoring gap analysis](topic:resume/gap-analysis)
- [Query operators in MongoDB](topic:mongodb/query-operators)
- [explain('executionStats')](topic:mongodb/explain)
- [Pagination at scale](topic:mongodb/pagination)
- [NoSQL injection](topic:mongodb/nosql-injection)
- [Queues and background jobs](topic:system-design/queues-background-jobs)
