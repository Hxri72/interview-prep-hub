---
title: Controlling AI cost and latency in production
stack: ai
order: 25
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - You pay per token, in and out. Output tokens usually cost several times more than input tokens.
  - Prompt caching reuses a long, fixed prompt start (like system instructions), so repeated calls are much cheaper and faster.
  - Use a smaller, cheaper model for simple jobs; keep the big model for hard ones. Measure quality before switching.
  - "Latency tricks: stream the answer, keep prompts and replies short, run independent calls in parallel, use batch jobs for non-urgent work."
  - Track tokens, cost and latency per feature and per tenant, and set limits so one customer can't run up a huge bill.
cards:
  - q: Name four ways to cut LLM cost.
    a: Prompt caching, shorter prompts and replies, a smaller model for simple tasks, and batch processing for non-urgent work.
  - q: What is prompt caching?
    a: The provider saves the processed start of a prompt (for example a long system prompt). Later calls with the same start read it from the cache, which is much cheaper and faster.
  - q: Why does streaming help latency?
    a: The user sees the first words in a fraction of a second, instead of waiting for the whole answer.
  - q: Why set per-tenant limits?
    a: So one customer, or one bug in a loop, can't use up the whole budget or rate limit for everyone.
  - q: Why measure cost per completed task, not per request?
    a: A cheaper call that fails and needs retries, or more steps, may cost more overall.
---

## 💡 What is it?

AI APIs charge **per [token](glossary:token)** — for what you send in and what the model writes out. Big models are slower and cost more.

So in production, you control two things:
- **Cost** — how many dollars each feature spends.
- **[Latency](glossary:latency)** — how long the user waits.

The main tools are **prompt caching**, **smaller models**, **shorter prompts and replies**, **streaming**, **batching** and **limits per customer**.

## 🏠 Real-life example

Think of **a school canteen** that cooks for 1,000 students every day.

- **Cooking the same dal base every morning in one big pot** = prompt caching. Prepare the fixed part once, reuse it many times.
- **Using a small stove for tea, the big one for biryani** = a small model for simple jobs, a big model for hard ones.
- **Serving rice first while the curry finishes** = streaming. Students start eating sooner.
- **Cooking tomorrow's pickles at night when it's quiet** = batch jobs for work that isn't urgent.
- **Two plates per student at most** = per-tenant limits.

## 🧑‍💻 Code example

A small calculator that shows what each trick saves. Save as `cost.js` and run `node cost.js`.

```js
// cost.js — estimate monthly AI cost for one feature and see what each saving trick does
const PRICE = {                                                             // US$ per 1 million tokens (check the live pricing page)
  big:   { input: 4.0, output: 20.0, cacheRead: 0.2 },                      // a large model (Claude Opus 5.5 list price, Oct 2026)
  small: { input: 0.1, output: 0.5 },                                       // a small model (Claude Haiku 5.5 list price, Oct 2026)
};

const callsPerMonth = 30000;                                                // 1,000 calls a day for 30 days
const systemTokens = 2500;                                                  // long fixed instructions sent on every call
const userTokens = 500;                                                     // the changing part (the resume text)
const outputTokens = 300;                                                   // the answer length

const dollars = (tokens, perMillion) => (tokens / 1e6) * perMillion;       // tokens → dollars

function monthly(p, { cached = false, outTokens = outputTokens } = {}) {   // cost of one month of calls
  const fresh = cached ? userTokens : systemTokens + userTokens;            // tokens billed at the full input price
  const reused = cached ? systemTokens : 0;                                 // tokens read from the cache (much cheaper)
  const perCall = dollars(fresh, p.input) + dollars(reused, p.cacheRead || 0) + dollars(outTokens, p.output); // one call
  return (perCall * callsPerMonth).toFixed(2);                              // one month, rounded to cents
}

console.log('Big model, no tricks:      $' + monthly(PRICE.big));           // baseline
console.log('Big model + prompt cache:  $' + monthly(PRICE.big, { cached: true })); // reuse the fixed system prompt
console.log('Big + cache + short reply: $' + monthly(PRICE.big, { cached: true, outTokens: 100 })); // ask for 100 tokens, not 300
console.log('Small model, no tricks:    $' + monthly(PRICE.small));         // a cheaper model for an easy task
```

**Output:**

```text
Big model, no tricks:      $540.00
Big model + prompt cache:  $255.00
Big + cache + short reply: $135.00
Small model, no tricks:    $13.50
```

**What to notice:** caching and shorter replies cut the bill by about 75% with the same model. A smaller model is far cheaper still, but **only if its quality is good enough** — check that with an [eval](topic:ai/evals) first. (This simple calculator ignores the small one-time cost of writing the cache.)

## 🔍 Deeper version

**Cost levers, in a sensible order:**

| Lever | What it does | Trade-off |
|---|---|---|
| **Prompt caching** | Reuses a fixed prompt start. Cached reads cost a small fraction of normal input. | Only helps if the start is exactly the same every time |
| **Trim input** | Send only the fields and documents needed; drop old chat turns | Too much trimming loses context |
| **Shorter output** | Ask for short answers or a fixed JSON shape; set `max_tokens` sensibly | Too low cuts answers off mid-sentence |
| **Batch API** | Non-urgent jobs run later at a discount (Anthropic's is 50% off) | Results aren't instant |
| **Lower effort / smaller model** | Less thinking or a cheaper model for easy tasks | Must prove quality holds |
| **Response caching in your app** | Same question, same answer → store it (e.g. in Redis) | Must be keyed safely per tenant |

**Prompt caching details (Claude):** caching is a **prefix match**. Put stable content first (system prompt, tool list), and changing content last. Any change at the start — even a timestamp — breaks the cache. Check that `usage.cache_read_input_tokens` is above zero to confirm it works.

```ts
// Sketch: cache a long, fixed system prompt (Anthropic TypeScript SDK; needs an API key)
const res = await client.messages.create({
  model: "claude-opus-5-5",                                         // the model
  max_tokens: 16000,                                                // room for the answer
  system: [{ type: "text", text: LONG_FIXED_RULES, cache_control: { type: "ephemeral" } }], // cache this block
  messages: [{ role: "user", content: resumeText }],                // the changing part goes last
});
console.log(res.usage.cache_read_input_tokens);                     // > 0 on later calls means the cache worked
```

**Latency levers:**
- **Streaming** — show words as they're generated. The *time to first word* matters more to users than total time.
- **Short prompts and replies** — fewer tokens to read and write.
- **Parallel calls** — if two AI calls don't depend on each other, run them with `Promise.all`.
- **Smaller or faster models** for simple steps.
- **Do slow work in the background** — put long AI jobs on a [queue](glossary:queue) and notify the user when done.

**Limits and monitoring:**
- Log **tokens in, tokens out, cache hits, cost and latency** for every call, tagged by feature and [tenant](glossary:multi-tenant).
- Set **per-tenant budgets and rate limits**. Stop agent loops with step and token limits.
- Handle **429 rate-limit errors** with retries and backoff.
- Judge cost **per completed task**: a cheap call that needs three retries isn't cheap.

**Voice calls** are the extreme case for latency — see [voice AI](topic:ai/voice-ai).

## 🎯 Why do we use it?

AI costs grow with usage. A feature that costs $10 in testing can cost thousands a month with real traffic. Slow answers also hurt users: people leave a page that "thinks" for 10 seconds.

Controlling cost and latency keeps the feature **affordable**, **fast** and **fair** across customers.

## ⚠️ Common mistakes

- **Putting changing data (like the time) at the start of the prompt**, which breaks the cache every call.
- **Switching to a cheaper model without measuring quality.**
- **No `max_tokens` thinking at all** — too high wastes money on rambling; too low cuts answers off.
- **No per-tenant limits**, so one customer or one runaway loop eats the budget.
- **Waiting for the full answer** when streaming would feel much faster.

## 🗣️ How to answer in an interview

> "LLM cost is per token, and output tokens cost more than input, so I control both sides. My first lever is prompt caching: I keep the long, fixed part of the prompt — system rules and tools — at the start, so repeated calls read it from the cache much more cheaply. Then I trim input to only what's needed, ask for short or structured answers, and use the batch API for work that isn't urgent.
>
> For simple tasks I test a smaller model or lower effort, but only switch if an eval shows quality holds. For latency, I stream the answer, keep prompts short, run independent calls in parallel, and push long jobs to a background queue.
>
> In production I log tokens, cost and latency per feature and per tenant, and set limits so one customer or one runaway loop can't blow the budget."

[FILL IN: any real cost or latency step you took in the voice agent or JD chatbot — for example short prompts, ending calls once details are collected, or streaming. Only if true.]

## 🔁 Follow-up questions

### Why do output tokens matter so much?

They usually cost several times more than input tokens, and they are generated one by one, so they also drive latency.

### How do you know prompt caching is working?

Check the usage numbers in the response: cache-read tokens should be above zero on repeated calls. If they stay zero, something at the start of the prompt is changing.

### When would you use the batch API?

For work that can wait, like re-scoring all candidates overnight or summarising old resumes. It's cheaper, but results come later.

### How do you stop one tenant from causing huge costs?

Track usage per tenant, set daily or monthly budgets and rate limits, and cap agent steps and tokens per request.

## ✅ Quick check

### 1. In the output above, how much does caching alone save on the big model each month?

:::answer
$540.00 − $255.00 = **$285.00** a month.
:::

### 2. You put `new Date()` at the top of the system prompt. What happens to prompt caching?

:::answer
It **breaks**. The prompt start changes on every call, so nothing matches the cache.
:::

### 3. Which trick makes the user see the first words fastest?

- A) Batch API
- B) Streaming
- C) A longer prompt

:::answer
**B) Streaming.** Words appear as they're generated. Batch is slower, and longer prompts add delay.
:::
