---
title: Calling an LLM API from Node.js
stack: ai
order: 10
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - You call an LLM over HTTPS with an official SDK (Anthropic or OpenAI). Send messages in, get content blocks and token usage back.
  - Keep the API key on the server in an environment variable. Never put it in browser code or Git.
  - "Set a timeout and a retry count. The SDKs retry 429, 5xx and network errors for you (Anthropic: 2 retries by default)."
  - "429 means \"too many requests\": slow down, respect the retry-after header, and use exponential backoff with jitter."
  - Log tokens in/out and time taken for every call. Tokens are your cost; time is your user's wait.
cards:
  - q: Where should the LLM API key live?
    a: On the backend, in an environment variable or a secrets manager. Never in frontend code or Git, because anyone could copy it and spend your money.
  - q: What does HTTP 429 mean from an LLM API?
    a: You sent too many requests or tokens in a short time (rate limit). Wait and retry with backoff, and respect the retry-after header.
  - q: Which errors are safe to retry?
    a: 429, 5xx server errors, timeouts and network errors. Not 400 (bad request) or 401 (bad key), because retrying won't fix them.
  - q: What do you log for every LLM call?
    a: Model, input tokens, output tokens, time taken, status and a request ID. That lets you track cost, speed and errors.
  - q: Why does the response contain "content blocks" and not one string?
    a: A reply can mix types — text, tool calls, thinking. You loop over the blocks and pick the ones you need, like type === 'text'.
---

## 💡 What is it?

An [LLM](glossary:llm) like Claude or GPT runs on the provider's servers. Your Node.js code talks to it through an [API](glossary:api) over the internet.

You send a list of messages. The model sends back an answer and a count of the [tokens](glossary:token) it used.

The easiest way to do this is the provider's official **SDK**. An SDK is a ready-made library that builds the HTTP request for you.

## 🏠 Real-life example

Think of **ordering food from a restaurant by phone**.

- **You** = your Node.js backend.
- **The restaurant kitchen** = the LLM on the provider's servers.
- **The phone line** = the HTTPS request.
- **Your order** = the messages you send.
- **The bill** = the token usage. Bigger orders cost more.
- **"All lines are busy, call back later"** = a 429 rate-limit error.
- **Hanging up after 20 minutes on hold** = a timeout.
- **Your membership card number** = the API key. You keep it in your wallet (the server), not on a poster (the browser).

## 🧑‍💻 Code example

This calls Claude with the official Anthropic SDK. It **needs `ANTHROPIC_API_KEY`**.

```bash
npm init -y && npm pkg set type=module    # new project that uses import/export
npm install @anthropic-ai/sdk             # the official Anthropic SDK
export ANTHROPIC_API_KEY=your-key-here     # the key goes in an env variable, not in code
node llm.mjs                               # run the file below
```

```js
import Anthropic from '@anthropic-ai/sdk';                        // the official Anthropic SDK for Node.js

const client = new Anthropic({                                    // create ONE client and reuse it everywhere
  timeout: 20_000,                                                // give up on one request after 20,000 ms = 20 seconds
  maxRetries: 2,                                                  // retry up to 2 more times on 429, 5xx and network errors
});                                                               // the key comes from the ANTHROPIC_API_KEY env variable

async function summarise(resumeText) {                            // our small helper: resume text in, summary out
  try {                                                           // API calls can fail, so we catch errors
    const response = await client.messages.create({               // send one request to the Messages API
      model: 'claude-opus-5-5',                                   // which model should answer
      max_tokens: 1024,                                           // the most tokens the answer may use (a safety cap)
      system: 'You are an HR assistant. Reply in 3 short lines.', // hidden rules for the model (the system prompt)
      messages: [{ role: 'user', content: `Summarise this resume:\n${resumeText}` }], // the actual question
    });                                                           // end of the request
    const text = response.content                                 // the answer is a LIST of content blocks
      .filter((block) => block.type === 'text')                   // keep only the text blocks
      .map((block) => block.text)                                 // take the words out of each block
      .join('');                                                  // join them into one string
    console.log(text);                                            // show the answer
    console.log('tokens in:', response.usage.input_tokens, 'out:', response.usage.output_tokens); // log usage, because tokens = money
  } catch (error) {                                               // something went wrong
    if (error instanceof Anthropic.RateLimitError) {              // 429 = too many requests, even after the retries
      console.error('Rate limited (429). Try again later.');      // tell the caller to slow down
    } else if (error instanceof Anthropic.APIError) {             // any other error from the API (400, 401, 500, timeout…)
      console.error('API error:', error.status, error.message);   // log the status code and message
    } else {                                                      // not an API error, so probably a bug in our code
      throw error;                                                // let it crash loudly so we notice
    }                                                             // end of the error checks
  }                                                               // end of try/catch
}                                                                 // end of summarise

await summarise('Hari. 3 years Node.js, React, MongoDB. Built Stripe renewals.'); // try it with a tiny resume
```

**Example output** (the model's exact words change every time):

```text
Full stack developer with 3 years of experience.
Strong in Node.js, React and MongoDB.
Built Stripe subscription renewals.
tokens in: 48 out: 31
```

I also ran this exact code with a fake server that always answers 429. The SDK made **3 HTTP calls** (1 try + 2 retries) and then threw `RateLimitError`. So the program printed `Rate limited (429). Try again later.`

## 🔍 Deeper version

**What goes in and what comes out.**

| You send | It means |
|---|---|
| `model` | which model answers |
| `max_tokens` | the hard cap on the answer's length |
| `system` | rules for the model's role and tone |
| `messages` | the conversation so far: `user` and `assistant` turns |

| You get back | It means |
|---|---|
| `content` | a list of blocks: `text`, `tool_use`, `thinking`… |
| `stop_reason` | why it stopped: `end_turn`, `max_tokens`, `tool_use`, `refusal` |
| `usage` | input and output tokens, which decide the cost |

**The API is stateless.** The model does not remember your last request. For a chat, you send the **whole** history every time. That is why long chats get slower and more expensive.

**Always check `stop_reason`.** If it is `max_tokens`, the answer was cut off. If it is `refusal`, the model declined, so don't read the content as a normal answer.

**The same call with the OpenAI SDK** looks very similar. Only the names change:

```js
import OpenAI from 'openai';                                      // the official OpenAI SDK
const openai = new OpenAI({ timeout: 20_000, maxRetries: 2 });    // reads OPENAI_API_KEY; same timeout/retry idea
const res = await openai.chat.completions.create({                // the Chat Completions endpoint
  model: 'MODEL_NAME',                                            // placeholder — pick a current model from OpenAI's docs
  messages: [                                                     // OpenAI puts the system prompt inside messages
    { role: 'system', content: 'You are an HR assistant.' },      // the rules
    { role: 'user', content: 'Summarise this resume: ...' },      // the question
  ],                                                              // end of messages
});                                                               // end of the request
console.log(res.choices[0].message.content);                      // the answer text lives in choices[0]
```

**Rate limits and 429.** Providers limit requests per minute and tokens per minute. When you go over, you get **429**. The fix is to wait and try again. Each wait should be longer than the last (**exponential backoff**), plus a small random extra (**jitter**). Jitter stops all your servers from retrying at the same moment.

```js
async function withRetry(fn, tries = 4) {                          // run fn, retrying on failure
  for (let attempt = 0; ; attempt++) {                             // count the attempts: 0, 1, 2…
    try { return await fn(); }                                     // success → return the result
    catch (err) {                                                  // it failed
      const retryable = err.status === 429 || err.status >= 500;   // only retry rate limits and server errors
      if (!retryable || attempt === tries - 1) throw err;          // give up on other errors or the last try
      const wait = 500 * 2 ** attempt + Math.random() * 250;       // 500, 1000, 2000 ms… plus up to 250 ms jitter
      await new Promise((r) => setTimeout(r, wait));               // sleep, then loop again
    }                                                              // end catch
  }                                                                // end for
}                                                                  // end withRetry
```

The SDKs already do this for you. Write your own only for extra rules, like "use a cheaper model after 2 failures".

**Timeouts.** In the Node.js SDKs the timeout is in **milliseconds**. Remember: one timeout × (retries + 1) is the worst-case wait. For long answers, use [streaming](topic:ai/streaming) so the user sees words early.

**Production checklist:**
- One shared client, not a new one per request.
- The key in a secrets manager, rotated if it leaks.
- Log model, tokens, latency, status and the request ID.
- Limits per user or per tenant, so one customer can't use up the whole quota.

## 🎯 Why do we use it?

Every AI feature starts with this call: a chatbot, a resume summary, an AI-written job description. If you get the basics right (timeouts, retries, error handling, logging), the feature is reliable. If you skip them, one slow or busy moment at the provider breaks your app.

## ⚠️ Common mistakes

- **Calling the API from the browser.** The key leaks. Always call from your backend.
- **No timeout.** A stuck request holds a connection and the user waits forever.
- **Retrying everything.** Retrying a 400 or 401 just wastes time. Retry only 429, 5xx and network errors.
- **Reading `content[0].text` blindly.** The first block may not be text. Loop over the blocks and check `stop_reason`.

## 🗣️ How to answer in an interview

> "From Node.js I call the LLM through the official SDK, on the backend only, with the API key in an environment variable or a secrets manager. I create one client and reuse it. I set a timeout and a retry count — the SDKs retry 429s, 5xx errors and network failures with exponential backoff, and I make sure we respect the retry-after header.
>
> In the response, I loop over the content blocks instead of assuming the first one is text. I also check stop_reason, because max_tokens means the answer was cut off. For every call I log the model, input and output tokens, latency and the request ID. That way we can track cost and debug slow or failed calls. For long answers I stream, so the user sees text straight away."

[FILL IN: one line about the OpenAI-based JD chatbot backend you built at SkillKeepr — e.g. how you handled timeouts or retries there. Only if true.]

## 🔁 Follow-up questions

### How do you handle a 429 at scale, with many servers?

Respect `retry-after`, and use exponential backoff with jitter so servers don't retry together. Put a queue in front of the AI calls to control how many run at once. Add per-tenant limits, so one customer can't use the whole quota.

### Should the frontend call the LLM directly?

No. The key would be visible to anyone. The frontend calls your backend. The backend checks the user, applies limits, calls the LLM and returns the result (or streams it).

### What is the difference between a timeout and a retry?

A timeout is how long you wait for **one** try. A retry is **another** try after a failure. Total worst-case wait ≈ timeout × (retries + 1).

### How do you make the result more reliable?

Clear prompts, low randomness for factual jobs, [structured outputs](topic:ai/structured-outputs) validated with a schema, and a fallback when validation fails.

## ✅ Quick check

### 1. Your call returns 401. Should the code retry it?

:::answer
**No.** 401 means the API key is wrong or missing. Retrying won't fix it. Fix the key (or the env variable) instead.
:::

### 2. `stop_reason` is `max_tokens`. What happened?

- A) The model refused
- B) The answer was cut off because it hit the `max_tokens` cap
- C) The request timed out

:::answer
**B.** The answer stopped at your cap. Raise `max_tokens`, ask for a shorter answer, or stream a long one.
:::

### 3. With `timeout: 20_000` and `maxRetries: 2`, what is the worst-case wait?

:::answer
About **60 seconds** — 20 seconds × 3 tries (1 first try + 2 retries), plus small backoff pauses between them.
:::
