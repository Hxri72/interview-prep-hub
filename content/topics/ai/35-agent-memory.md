---
title: "Agent memory and state (short-term and long-term)"
stack: ai
order: 35
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "Short-term memory = the recent messages you send with every model call. When it gets long, keep the newest messages and summarise the rest."
  - "Long-term memory = facts saved in a database (like MongoDB) and searched later, so the agent remembers across sessions."
  - "Task state = which steps are done, saved after every step, so a long task can resume after a crash."
  - Always store and search memory per tenant and per user. One company must never see another company's memories.
  - Don't store secrets or more personal data than you need. Memory is data, so privacy rules apply.
cards:
  - q: What is short-term memory for an LLM agent?
    a: The conversation messages you send with each request. The model has no memory of its own, so you resend the history every time, inside the context window.
  - q: How do you stop short-term memory from overflowing the context window?
    a: Keep the newest messages and replace the older ones with a short summary, often put in the system prompt.
  - q: What is long-term memory?
    a: Facts saved in a database and retrieved by search when needed, so the agent remembers things across sessions, like a user's preferences.
  - q: Why save task state after every step?
    a: If the server crashes or restarts, the task can continue from the last finished step instead of starting again or repeating actions like sending emails.
  - q: What is the biggest privacy risk with agent memory?
    a: Leaking one user's or tenant's memories to another. Always filter memory by tenant and user, and don't store secrets.
---

## 💡 What is it?

An [LLM](glossary:llm) forgets everything after each request. It has **no memory of its own**.

So an agent needs memory that **your code** keeps. There are three kinds:
- **Short-term memory:** the recent conversation you send each time.
- **Long-term memory:** facts saved in a database and searched later.
- **Task state:** which steps of a long job are done, so it can resume.

## 🏠 Real-life example

Think of a **student preparing for exams**.

- **What's on the desk right now** = short-term memory. Only a few pages fit. Old pages get replaced by a one-page **summary**.
- **Notebooks in the cupboard** = long-term memory. The student looks up the right notebook when needed.
- **A checklist on the wall: "Chapter 1 ✓, Chapter 2 ✓, Chapter 3 …"** = task state. After a power cut, they continue from Chapter 3, not from the start.
- **Each student has their own cupboard** = memory kept separate per user and per tenant.

## 🧑‍💻 Code example

All three kinds of memory in one file. No API key is needed. Save it as `memory.js` and run `node memory.js`.

```js
// memory.js — three kinds of agent memory: short-term, long-term and task state (no API key needed)

// 1) SHORT-TERM memory: the recent messages we send with every model call
function trimHistory(messages, keepLast = 4) {                     // keep only the newest messages
  if (messages.length <= keepLast) return { system: '', messages }; // short enough → keep everything
  const old = messages.slice(0, -keepLast);                        // the part we will squash
  const summary = `Summary of ${old.length} earlier messages: ` +  // a stand-in for an LLM-written summary
    old.map((m) => m.content).join('; ').slice(0, 60) + '…';       // first 60 characters of the old text
  return { system: summary, messages: messages.slice(-keepLast) }; // summary goes in the system prompt
}                                                                  // end of trimHistory
const chat = ['hi', 'need a Node dev', '3+ years', 'Kochi or remote', 'budget fixed', 'start next month'] // 6 chat texts
  .map((t, i) => ({ role: i % 2 ? 'assistant' : 'user', content: t })); // 6 fake chat messages
const short = trimHistory(chat);                                   // squash the old part of the chat
console.log('system prompt:', short.system);                       // the summary of older messages
console.log('messages sent:', short.messages.map((m) => m.role + ': ' + m.content)); // the 4 newest

// 2) LONG-TERM memory: facts saved in a database and searched later (always per tenant)
const memoryStore = [];                                            // pretend MongoDB "memories" collection
const remember = (tenantId, userId, fact) => memoryStore.push({ tenantId, userId, fact }); // save one fact
const recall = (tenantId, userId, word) => memoryStore             // find facts for THIS tenant and user only
  .filter((m) => m.tenantId === tenantId && m.userId === userId && m.fact.toLowerCase().includes(word)) // filter
  .map((m) => m.fact);                                             // return just the text
remember('acme', 'u1', 'Prefers candidates from Kochi');           // a fact for company "acme", user u1
remember('globex', 'u9', 'Prefers candidates from Pune');          // another company's fact
console.log('long-term (acme/u1):', recall('acme', 'u1', 'prefers'));     // only acme's fact comes back
console.log('long-term (globex asks acme):', recall('globex', 'u1', 'prefers')); // [] → no leak across tenants

// 3) TASK STATE: save progress so a long task can resume after a crash
const steps = ['readJob', 'searchCandidates', 'draftEmails', 'waitForApproval']; // the task's steps
let saved = { taskId: 't1', done: [] };                            // pretend this row lives in MongoDB
function runSteps(state, crashAt) {                                // do the steps that are not done yet
  for (const s of steps) {                                         // go through every step in order
    if (state.done.includes(s)) continue;                          // already done → skip it
    if (s === crashAt) { console.log(`crash during ${s}!`); return state; } // simulate the server dying
    state = { ...state, done: [...state.done, s] };                // mark this step as done
    saved = state;                                                 // "save to the database" after every step
  }                                                                // end of the step loop
  return state;                                                    // all steps finished
}                                                                  // end of runSteps
runSteps(saved, 'draftEmails');                                    // first run crashes at step 3
console.log('after crash, saved =', saved.done);                   // two steps were saved
console.log('resumed, done =', runSteps(saved).done);              // the restart continues from step 3
```

**Output:**

```text
system prompt: Summary of 2 earlier messages: hi; need a Node dev…
messages sent: [
  'user: 3+ years',
  'assistant: Kochi or remote',
  'user: budget fixed',
  'assistant: start next month'
]
long-term (acme/u1): [ 'Prefers candidates from Kochi' ]
long-term (globex asks acme): []
crash during draftEmails!
after crash, saved = [ 'readJob', 'searchCandidates' ]
resumed, done = [ 'readJob', 'searchCandidates', 'draftEmails', 'waitForApproval' ]
```

**What to notice:**
- **Short-term:** 6 messages became **1 summary + the 4 newest**. The summary goes in the system prompt.
- **Long-term:** company `acme` gets its own fact. Company `globex` gets **nothing** from `acme`'s memories.
- **Task state:** after the "crash", the restart skipped the 2 finished steps and continued from `draftEmails`.

## 🔍 Deeper version

**Short-term memory and the context window.** Every request resends the history. The [context window](glossary:context-window) has a limit, and every [token](glossary:token) costs money. Common strategies:

| Strategy | How it works | Trade-off |
|---|---|---|
| Keep last N messages | Drop the oldest | Simple, but forgets early details |
| Summarise old messages | An LLM writes a short summary | Keeps the gist, costs an extra call |
| Server-side compaction | Some APIs (like Claude's) can summarise long conversations for you | Less code, provider-specific |
| Pin key facts | Keep important facts in the system prompt | Small and reliable for a few facts |

With Claude, a `system` message can't be the first entry in `messages`. Put a summary in the top-level `system` prompt instead, as the code does. Never cut a `tool_use` block away from its `tool_result`: they must stay together, or the next request fails.

**Long-term memory** is usually a MongoDB collection. Search it by keywords, filters (`tenantId`, `userId`) or meaning (vector search). Retrieving the right memories is the same idea as RAG. See [RAG with MongoDB vector search](topic:ai/rag-vector-search-mongodb) and [answering with sources](topic:ai/rag-answer-with-sources).

A memory document might look like `{ tenantId, userId, fact, createdAt, source }`. Add an index on `{ tenantId: 1, userId: 1 }`, and a TTL index if old memories should expire. See [special indexes](topic:mongodb/special-indexes).

**Task state for multi-step work.** Save progress after every step, in a database, not in a variable in RAM. Then a restart can continue from the last finished step. Combine it with idempotent steps, so redoing a step is safe, especially for emails and payments.

This is the same idea as a **state machine**: the voice agent's phases are a good example. See [the voice state machine](topic:resume/voice-state-machine) and [state machines](topic:architecture/state-machines). [LangGraph](topic:ai/langgraph) saves state like this automatically, with "checkpoints".

**Privacy and safety:**
- **Isolation:** every read and write filters by tenant and user. In a [multi-tenant](glossary:multi-tenant) app, a memory leak across tenants is a serious data leak.
- **What not to store:** passwords, API keys, card numbers, and personal data you don't need.
- **Deletion:** users should be able to ask for their memories to be deleted.
- **Untrusted text:** a saved memory can contain [prompt injection](glossary:prompt-injection). Treat memories as data, not instructions.

## 🎯 Why do we use it?

Without memory, an agent forgets the user's last message, forgets preferences between sessions, and starts long jobs from zero after any crash. That gives a bad user experience and can repeat actions like sending the same email twice.

Memory makes an agent useful over time. Good memory design keeps it **cheap** (small context), **correct** (resumes safely) and **private** (no leaks).

## ⚠️ Common mistakes

- **Sending the whole history forever.** It gets slow and expensive, and it eventually overflows the context window.
- **Keeping task state only in RAM.** A restart loses everything, and steps may run twice.
- **Forgetting the tenant filter** when reading memories.
- **Storing secrets or too much personal data** "just in case".

## 🗣️ How to answer in an interview

> "LLMs are stateless, so agent memory is something my code manages. I think of three kinds. Short-term memory is the recent conversation I resend with each request. When it gets long, I keep the newest messages and summarise the older ones into the system prompt, so I stay inside the context window and control token cost.
>
> Long-term memory is facts stored in a database, like MongoDB, and retrieved when relevant, by filters or vector search. That's the same retrieval idea as RAG. In a multi-tenant system, every memory read and write is filtered by tenant and user.
>
> Task state is the progress of a long job, saved after every step, so it can resume after a crash without repeating actions. My voice agent works in a similar way: it's a phase-based state machine, where my code controls the phases and Claude decides what to say inside each phase. [FILL IN: where your voice agent keeps call state during a call, if you know.]"

## 🔁 Follow-up questions

### Isn't the context window just memory?

It's where short-term memory goes, but it's limited and costs tokens. Long-term memory lives outside it, in a database, and only the relevant parts are brought in.

### How do you decide what to save to long-term memory?

Save stable, useful facts, like preferences or decisions, not every message. Some systems let the model propose memories and your code approves and stores them. Always skip secrets.

### What happens if two requests update task state at the same time?

You can lose an update. Use atomic updates (`$set`, `$push` with a filter on the current step) or a version field. See [atomic updates and locking](topic:mongodb/atomic-updates-locking).

### Does Claude have built-in memory?

The API is stateless: you send the history each time. Anthropic offers tools such as a memory tool and server-side compaction that help, but your app still decides what to store and where.

## ✅ Quick check

### 1. In the code example, why does `recall('globex', 'u1', 'prefers')` return `[]`?

:::answer
The filter checks `m.tenantId === tenantId`. The fact belongs to tenant `acme`, so tenant `globex` can't see it, even though the user id matches. That's tenant isolation.
:::

### 2. The server crashes during `draftEmails`. Which step runs first after the restart?

:::answer
**`draftEmails`.** `readJob` and `searchCandidates` were saved as done, so they are skipped.
:::

### 3. Your chat history is 500 messages long. Name two ways to keep requests small.

:::answer
Keep only the last N messages, and replace older ones with a summary. (Server-side compaction or pinning key facts in the system prompt also work.)
:::
