---
title: Tokens and cost
stack: ai
order: 3
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - A token is a small piece of text — a word, part of a word or a symbol. In English, 1 token is about 4 characters.
  - You pay per token — for input tokens (what you send) and output tokens (what the model writes). Output usually costs more.
  - Speed, cost and limits are all measured in tokens.
  - "Cut cost with shorter prompts, shorter answers, smaller models for simple jobs, caching and per-user limits."
  - Always check real prices on the provider's pricing page — they change often.
cards:
  - q: What is a token?
    a: A small piece of text the model reads or writes. In English it's about 4 characters, or roughly 3/4 of a word.
  - q: How are LLM API calls billed?
    a: By tokens — input tokens you send plus output tokens the model generates, each with its own price per million tokens.
  - q: Why do output tokens matter more for speed?
    a: The model generates output one token at a time, so more output tokens means a longer wait. They are also usually priced higher.
  - q: Name three ways to reduce token cost.
    a: Shorter prompts and history, asking for short answers, using a smaller model for simple tasks, and caching repeated prompts or answers.
  - q: Why might non-English text cost more?
    a: Tokenizers are often tuned for English, so other languages and scripts can need more tokens for the same meaning.
---

## 💡 What is it?

A **[token](glossary:token)** is a small piece of text that an LLM reads and writes. It can be a whole word, part of a word, or a symbol.

In English, **1 token is about 4 characters**. So 100 words is roughly 130 tokens.

LLM APIs **charge per token**. You pay for the tokens you send (**input**) and the tokens the model writes (**output**).

## 🏠 Real-life example

Think of an **auto-rickshaw meter**.

You don't pay one fixed price. You pay for the distance.

- **Kilometres** = tokens.
- **Distance to pick you up** = input tokens (your prompt and history).
- **Distance of the actual ride** = output tokens (the model's answer).
- **The rate per km** = the price per million tokens. A bigger, better vehicle (a bigger model) charges a higher rate.
- **Taking a shorter route** = shorter prompts and answers.

The meter is fair, but long rides add up fast. Same with tokens.

## 🧑‍💻 Code example

A rough token and cost estimator. Real token counts come from the provider's tokenizer, so this uses the "4 characters per token" rule of thumb. The prices are **made-up examples**, not real prices. Save it as `tokens.js`. Run `node tokens.js`.

```js
// Rough token and cost estimate (real counts come from the provider's tokenizer)
const prompt = 'Summarise this resume in 3 lines: Hari is a full stack developer with 3 years of MERN experience.'; // the text we send
const reply = 'Full stack developer. 3 years with MongoDB, Express, React and Node. Builds APIs and AI features.'; // the text we get back
const estimateTokens = (text) => Math.ceil(text.length / 4); // rule of thumb: about 4 English characters per token
const inputTokens = estimateTokens(prompt);            // tokens going in
const outputTokens = estimateTokens(reply);            // tokens coming out
const PRICE_IN = 1.0;                                  // EXAMPLE price in $ per 1 million input tokens (not a real price)
const PRICE_OUT = 5.0;                                 // EXAMPLE price in $ per 1 million output tokens (output usually costs more)
const cost = (inputTokens * PRICE_IN + outputTokens * PRICE_OUT) / 1_000_000; // total cost for one call
console.log('input tokens  ~', inputTokens);           // show the input estimate
console.log('output tokens ~', outputTokens);          // show the output estimate
console.log('cost per call  $', cost.toFixed(6));      // cost of one call
console.log('cost per 100k calls $', (cost * 100_000).toFixed(2)); // why tokens matter at scale
```

**Output:**

```text
input tokens  ~ 25
output tokens ~ 25
cost per call  $ 0.000150
cost per 100k calls $ 15.00
```

One call costs almost nothing. **100,000 calls** is real money. And real prompts are usually much longer than this one.

## 🔍 Deeper version

**How tokenizers split text.** Most modern models use **sub-word** tokenizers (for example byte-pair encoding). Common words become one token. Rare words split into pieces. "unbelievable" might become "un", "believ", "able". Code, JSON and non-English scripts often need more tokens per character.

**What you are billed for:**

| Part | Counts as | Notes |
|---|---|---|
| System prompt | Input | Sent on every call, so keep it tight |
| Chat history | Input | Grows each turn; trim or summarise it |
| Documents (RAG) | Input | Send only the relevant chunks |
| Tool definitions | Input | Every tool's description costs tokens |
| The answer | Output | Usually priced higher, and slower |

**Where to get exact numbers:**
- The API response includes a **usage** field with the real input and output token counts. Log it on every call.
- Providers have token-counting tools or endpoints. Use them before sending very large inputs.
- Prices are per **million tokens**, and differ per model. They change often, so always check the provider's pricing page.

**Ways to cut cost and time:**
- **Shorter prompts and history.** Trim old messages, summarise long chats. See [context window](topic:ai/context-window).
- **Ask for short output.** "Answer in 3 bullet points." Set a sensible max output tokens.
- **Right-size the model.** Use a smaller, cheaper model for simple jobs like classification. Save the big model for hard reasoning.
- **Prompt caching.** Many providers give a discount when the start of the prompt (like a long system prompt) repeats exactly across calls.
- **Cache answers** you can reuse, like the same question about the same document.
- **Batch APIs** for non-urgent bulk jobs are often cheaper.
- **Limits per user or tenant**, so one customer can't run up a huge bill. More in [cost and latency](topic:ai/cost-latency).

## 🎯 Why do we use it?

Tokens are the unit for everything in LLM work:
- **Cost:** the bill is tokens × price.
- **Speed:** more output tokens means a longer wait.
- **Limits:** the context window and rate limits are measured in tokens.

If you understand tokens, you can estimate cost before launching a feature, and explain it to your manager.

## ⚠️ Common mistakes

- **Sending the whole chat history forever.** Input tokens grow every turn, and so does the bill.
- **Long, chatty system prompts** that are sent on every single call.
- **Not logging token usage.** Then you can't tell which feature or customer is expensive.
- **Quoting old prices in interviews.** Say "priced per million input and output tokens; I check the current pricing page".

## 🗣️ How to answer in an interview

> "A token is a small piece of text the model reads and writes — in English roughly four characters, or three quarters of a word. LLM APIs bill per token, separately for input and output, and output is usually more expensive and also what drives latency, because it's generated one token at a time.
>
> So I treat tokens like any other cost in production. I log the usage from every response, keep system prompts short, trim or summarise chat history, only send the relevant document chunks, and ask for concise structured output. For simple tasks I'd use a smaller model, and I'd add per-user or per-tenant limits so one customer can't create a huge bill. [FILL IN: one real thing you did to keep AI cost down in the JD chatbot or voice agent, if any]."

## 🔁 Follow-up questions

### How do you know the exact token count of a request?

The API response includes a usage object with input and output token counts. Providers also offer token-counting tools for checking a prompt before you send it.

### Why is output more expensive than input?

The model reads all input tokens together in one pass, but must generate output tokens one by one. Generation is more work per token, so providers price it higher.

### What is prompt caching?

If many calls start with exactly the same text, like a long system prompt, the provider can reuse work from earlier calls. Cached input is usually cheaper and faster.

### How would you estimate the cost of a new AI feature?

Estimate average input and output tokens per call, multiply by calls per day and the price per million tokens, then add a safety margin. Then measure real usage after launch.

## ✅ Quick check

### 1. Roughly how many tokens is a 400-character English paragraph?

:::answer
About **100 tokens** (400 ÷ 4).
:::

### 2. Which change saves the most when every call re-sends a 3,000-token system prompt?

- A) Shorten the system prompt, or use prompt caching
- B) Make the user's question one word shorter

:::answer
**A.** The system prompt is sent on every call, so trimming or caching it saves far more than a shorter question.
:::

### 3. True or false: you only pay for the tokens the model writes.

:::answer
**False.** You pay for input tokens (everything you send) and output tokens (everything it writes).
:::
