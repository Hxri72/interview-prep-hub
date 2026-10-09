---
title: How an LLM writes text (next-token prediction)
stack: ai
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - An LLM does one thing again and again — it predicts the next token (a small piece of text).
  - It adds that token to the text and predicts again, until the answer is finished.
  - "The steps: split your text into tokens → read everything in the context window → predict the next token → repeat → turn tokens back into text."
  - It predicts likely text, not checked facts — that is why it can be confidently wrong.
  - Settings like temperature decide whether it always picks the top token or sometimes a less likely one.
cards:
  - q: In one sentence, how does an LLM generate an answer?
    a: It predicts the next token based on everything in its context window, adds it, and repeats until the answer is done.
  - q: What is a token?
    a: A small piece of text the model reads and writes — a word, part of a word or a symbol. About 4 English characters on average.
  - q: Why can an LLM be confidently wrong?
    a: It produces text that is likely given its training, not text it has checked against facts. Likely-sounding and true are not the same.
  - q: Does the model plan the whole answer before writing?
    a: It writes one token at a time, and each token depends on the ones before it. Any "planning" happens inside that step-by-step process.
  - q: Why does streaming show the answer word by word?
    a: Because the model really produces it token by token. Streaming sends each piece to you as soon as it is ready.
---

## 💡 What is it?

An LLM does **one simple job** over and over: it **predicts the next [token](glossary:token)**.

A token is a small piece of text, like a word or part of a word. You give the model "The capital of India is", and it predicts " New". Then it adds " New" and predicts " Delhi".

By repeating this very fast, it writes whole answers, emails and code.

## 🏠 Real-life example

Think of the **"suggested next word" on your phone keyboard**.

You type "Good", and the keyboard suggests "morning". It learned that from your past messages.

- The **words you already typed** = the prompt in the context window.
- The **suggestion bar** = the model's guess for the next token.
- **Tapping the suggestion again and again** = the model repeating the prediction step.
- **Your phone's memory of your messages** = the model's training data.

An LLM is that keyboard, but trained on a huge library of text. So its guesses are much smarter, and it can keep going for paragraphs.

## 🧑‍💻 Code example

A tiny "language model". It learns which word usually follows which, then writes by predicting one word at a time. Save it as `nextword.js`. Run `node nextword.js`. No API key is needed.

```js
// A toy "language model": it learns which word usually comes next
const text = 'the cat sat on the mat . the cat ate the fish . the dog sat on the rug .'; // tiny training text
const words = text.split(' ');                         // turn the text into a list of words (our "tokens")
const next = {};                                       // word → { nextWord: count }
for (let i = 0; i < words.length - 1; i++) {           // look at every pair of neighbouring words
  const a = words[i], b = words[i + 1];                // a = this word, b = the word after it
  next[a] = next[a] || {};                             // make a counter for word a if missing
  next[a][b] = (next[a][b] || 0) + 1;                  // count how often b follows a
}                                                      // end of training
function predict(word) {                               // guess the most likely next word
  const options = next[word] || {};                    // all words seen after this one
  return Object.entries(options).sort((x, y) => y[1] - x[1])[0]?.[0]; // pick the one seen most often
}                                                      // end of predict
let current = 'the';                                   // the "prompt": start with one word
const output = [current];                              // the answer we are building
for (let step = 0; step < 5; step++) {                 // predict 5 more words, one at a time
  current = predict(current);                          // predict the next word from the last word
  output.push(current);                                // add it to the answer
}                                                      // end of the writing loop
console.log(next['the']);                              // what the model learned after "the"
console.log(output.join(' '));                         // the sentence it wrote, word by word
```

**Output:**

```text
{ cat: 2, mat: 1, fish: 1, dog: 1, rug: 1 }
the cat sat on the cat
```

**What to notice:**
- After "the", it saw "cat" most often, so it always picks "cat".
- "the cat sat on the cat" **sounds** like English, but it is nonsense. The model only follows patterns. A real LLM is far better, but the same idea explains why it can write fluent but wrong text.
- This toy only looks at **one** previous word. A real LLM looks at **every** token in its [context window](topic:ai/context-window).

## 🔍 Deeper version

**What happens when you send a message:**
1. **Tokenise.** Your text is split into tokens. Each token becomes a number (an ID).
2. **Read the whole context.** The model looks at every token in its context window: system prompt, chat history, documents and your message.
3. **Score every possible next token.** The model outputs a score for every token in its vocabulary (often 100,000+ tokens). The scores become probabilities.
4. **Pick one.** With low [temperature](topic:ai/temperature-settings), it almost always picks the top token. With higher temperature, it sometimes picks a less likely one.
5. **Append and repeat.** The chosen token is added to the input, and steps 2–4 run again.
6. **Stop.** It stops at a special "end" token, a stop sequence, or a maximum output length.
7. **Detokenise.** The token IDs are turned back into text.

**Why the transformer matters.** The neural network inside uses **attention**. Every token can "look at" every other token in the context to decide what matters. That's how it knows "it" refers to "the server", not "the user".

**Consequences you see as a developer:**
- **Output is generated step by step.** So [streaming](topic:ai/streaming) can show it live, and longer answers take longer.
- **Output tokens are slower and often cost more** than input tokens. See [tokens and cost](topic:ai/tokens-cost).
- **No built-in fact check.** It writes the most likely continuation. That is the root cause of [hallucination](topic:ai/hallucination).
- **It has no memory between API calls.** Each call only sees what you send in that call. Chat apps re-send the history every time.

## 🎯 Why do we use it?

Understanding next-token prediction helps you build better features:
- You know **why prompts matter**. The model continues from what you give it, so clear context gives better continuations.
- You know **why to validate output**. It is likely text, not guaranteed truth, so you check it, for example with [structured outputs](topic:ai/structured-outputs).
- You know **why long answers cost more and take longer**. Every output token is one more prediction step.

## ⚠️ Common mistakes

- **Thinking the model "looks up" answers.** It doesn't search unless you give it a tool or [RAG](topic:ai/rag).
- **Thinking it remembers past conversations.** Each API call is fresh. You must send the history you want it to see.
- **Expecting the same answer every time.** With temperature above 0, answers can vary. Even at 0, small differences can happen.
- **Asking for very long outputs without need.** More output tokens means more time and more cost.

## 🗣️ How to answer in an interview

> "An LLM generates text by predicting the next token, one at a time. A token is a small piece of text, roughly four English characters. When I send a message, it's split into tokens, and the model reads everything in its context window: the system prompt, history and my message. It scores every possible next token, picks one based on settings like temperature, appends it, and repeats until it hits a stop token or a length limit.
>
> That explains a lot of practical behaviour. Answers can be streamed because they're produced token by token. Output tokens drive latency and cost. And because the model predicts likely text rather than checking facts, it can hallucinate. So in production I give it the facts it needs, ask for structured output, and validate the result before using it."

## 🔁 Follow-up questions

### If it only predicts the next token, how can it write working code?

It was trained on a huge amount of code. Predicting the next token well, across millions of examples, forces it to learn syntax, common patterns and how functions fit together. It is still pattern-based, so you must test the code.

### Why does the same question sometimes give different answers?

The model picks from a probability spread. With temperature above 0, it can choose different tokens each time. One different early token changes everything after it.

### What is a stop sequence?

A string you tell the API to stop at. When the model generates it, generation ends. It's useful for cutting the output at a known marker.

### Does the model understand meaning?

It represents meaning well enough to be very useful. But it has no built-in check against reality. In interviews, a safe answer is "it models language patterns extremely well, which is not the same as knowing facts".

## ✅ Quick check

### 1. In the toy model, why did it write "the cat sat on the cat"?

:::answer
After "the", the word it saw most often was "cat", so it always chooses "cat". It only follows patterns, not meaning, so it produced fluent-looking nonsense.
:::

### 2. What does an LLM do after it predicts one token?

- A) Sends the whole answer at once
- B) Adds the token to the input and predicts the next one
- C) Searches the internet for the next word

:::answer
**B.** It appends the token and repeats the prediction step until it stops.
:::

### 3. True or false: an LLM remembers what you told it in a previous API call.

:::answer
**False.** Each API call only sees what you send in that call. Chat apps re-send the conversation history every time.
:::
