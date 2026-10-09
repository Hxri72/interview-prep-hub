---
title: Hallucination and how to reduce it
stack: ai
order: 6
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - A hallucination is when the model confidently says something false, like a made-up fact, API or library.
  - It happens because the model predicts likely text, not checked facts.
  - Reduce it with RAG (give it the real data), clear instructions, permission to say "I don't know", structured outputs and validation.
  - Ask for sources or quotes from the given documents, and check them.
  - You can reduce hallucinations, but never fully remove them — so always verify important output.
cards:
  - q: What is a hallucination in AI?
    a: When an LLM confidently produces false information — a wrong fact, a fake citation or a function that doesn't exist.
  - q: Why do LLMs hallucinate?
    a: They generate the most likely next tokens based on training patterns. They have no built-in fact check, so likely-sounding text can be wrong.
  - q: Name three ways to reduce hallucination.
    a: RAG (give it real data), tell it to answer only from the given context and say "I don't know" otherwise, and validate the output (schema checks, tests, citations).
  - q: Can you remove hallucination completely?
    a: No. You can reduce it a lot, but important output must still be checked by code or a human.
  - q: Give a coding example of a hallucination.
    a: An AI tool suggests a package or function that doesn't exist, or the wrong options for a real library. Always check the docs and run the code.
---

## 💡 What is it?

A **[hallucination](glossary:hallucination)** is when an AI model **confidently says something false**.

It might invent a fact, a quote, a court case, or — for developers — a function or npm package that doesn't exist.

It happens because the model predicts **likely text**, not **checked facts**. Likely-sounding and true are not the same thing.

## 🏠 Real-life example

Think of a **student in an exam who didn't study one chapter**.

They don't leave the answer blank. They write something that **sounds** right, using words from the textbook. It's confident and well-written — but wrong.

- The **student** = the LLM.
- **Writing a confident guess** = hallucination.
- **An open-book exam** = RAG: you give the model the right pages to read from.
- **The teacher's rule "write 'I don't know' if unsure, no marks lost"** = telling the model it may say "I don't know".
- **The teacher checking the answer** = validating the output in code.

## 🧑‍💻 Code example

A tiny "grounded" answerer. It answers **only from given facts**, shows **where** the answer came from, and says "I don't know" otherwise. A real LLM is told to do the same through the prompt. Save it as `grounding.js`. Run `node grounding.js`.

```js
// Reduce hallucination: answer only from given facts, otherwise say "I don't know"
const facts = {                                              // our trusted data (like a RAG search result)
  'notice period': 'The candidate has a 30-day notice period.',     // fact 1
  'experience': 'The candidate has 3 years of Node.js experience.', // fact 2
};                                                           // end of the facts
function groundedAnswer(question) {                          // a stand-in for a carefully prompted model
  const q = question.toLowerCase();                          // compare in lower case
  for (const key of Object.keys(facts)) {                    // look for a matching fact
    if (q.includes(key)) return facts[key] + ' (source: ' + key + ')'; // answer AND show where it came from
  }                                                          // end of the loop
  return "I don't know — that isn't in the data I was given."; // refuse instead of guessing
}                                                            // end of groundedAnswer
console.log(groundedAnswer('What is the notice period?'));  // in the data → answer with a source
console.log(groundedAnswer('What is the expected salary?')); // not in the data → honest "I don't know"
```

**Output:**

```text
The candidate has a 30-day notice period. (source: notice period)
I don't know — that isn't in the data I was given.
```

A model without these rules might "guess" a salary. In a hiring product, that wrong guess could reach a recruiter.

## 🔍 Deeper version

**Why it happens:**
- The model was trained to produce **plausible continuations**, not to check facts.
- Its knowledge has a **training cut-off date**, so newer facts are missing.
- It never saw **your private data** (your candidates, your jobs).
- When it doesn't know, the most "likely" text is often a confident-sounding answer, not "I don't know".

**Ways to reduce it (use several together):**

| Technique | How it helps |
|---|---|
| **[RAG](topic:ai/rag)** | Give the model the real documents or database rows to answer from |
| **Clear instructions** | "Answer only from the context below. If it isn't there, say you don't know." |
| **Allow "I don't know"** | Removes pressure to invent an answer |
| **Ask for quotes/sources** | Easy to check whether the claim is really in the source |
| **[Structured outputs](topic:ai/structured-outputs)** | Fixed fields and enums leave less room for invention |
| **[Tool calling](topic:ai/tool-calling)** | Let it fetch live data (search, your API) instead of guessing |
| **Low temperature** | Fewer random choices for factual tasks |
| **Validation in code** | Check IDs exist, numbers are in range, dates make sense |
| **[Evals](topic:ai/evals)** | Test questions with known answers, run after every change |
| **Human review** | For high-impact decisions (hiring, money, legal) |

**Coding hallucinations.** AI coding tools can invent package names, functions or config options. A real risk is **"slopsquatting"**: attackers publish malicious packages with names that AI tools commonly hallucinate. Always check a package exists, is popular and maintained before installing. More in [reviewing AI code](topic:ai/reviewing-ai-code).

## 🎯 Why do we use it?

In a real product, a hallucination is a **bug that looks like a correct answer**:
- A chatbot invents a company policy.
- A resume summary adds a skill the candidate doesn't have.
- An AI score is based on something the candidate never said.

Reducing hallucination is what turns an AI demo into a feature you can trust in production.

## ⚠️ Common mistakes

- **Trusting fluent text.** Confidence and good grammar are not proof.
- **Asking about private data without giving it.** The model can't know your candidates unless you send the data.
- **Not giving an "I don't know" option**, so the model fills gaps with guesses.
- **Installing packages an AI suggested without checking** they exist and are safe.

## 🗣️ How to answer in an interview

> "A hallucination is when the model confidently produces something false — a made-up fact, a fake citation, or in code, a function or package that doesn't exist. It happens because an LLM predicts the most likely text, not verified facts, and it doesn't know your private or recent data.
>
> I reduce it in layers. First, give it the real data with RAG or tool calls, and instruct it to answer only from that context and say 'I don't know' otherwise. Second, ask for structured output with fixed fields, and validate it in code — for example, check that IDs exist and values are in range. Third, use low temperature for factual tasks and keep a small eval set to catch regressions. For high-impact decisions like hiring, a human still reviews. [FILL IN: one way you guarded against wrong AI output in the JD chatbot or call scoring, if any]."

## 🔁 Follow-up questions

### Does RAG eliminate hallucination?

No. It greatly reduces it, but the model can still misread or mix up the retrieved text. You still ask for sources and validate.

### How would you detect hallucinations in production?

Log prompts and outputs, check outputs against your data in code, sample answers for human review, track user "this is wrong" feedback, and run evals after every prompt or model change.

### What is slopsquatting?

Attackers register package names that AI tools often invent. If a developer installs a hallucinated name without checking, they may install malware.

### Does a lower temperature stop hallucinations?

It reduces random choices, but a model can still be confidently wrong at temperature 0. Grounding and validation matter more.

## ✅ Quick check

### 1. A user asks the HR bot "What is this candidate's expected salary?" The data doesn't include salary. What should a well-designed bot do?

:::answer
Say it doesn't know, because salary isn't in the data it was given — not guess a number.
:::

### 2. Which is the strongest way to stop a chatbot inventing company policies?

- A) Increase the temperature
- B) Give it the real policy documents (RAG) and tell it to answer only from them
- C) Write the prompt in capital letters

:::answer
**B.** Grounding the model in the real documents, plus "answer only from these", is the main fix.
:::

### 3. True or false: if an answer is long, detailed and confident, it is probably correct.

:::answer
**False.** Hallucinations are often fluent and confident. Check facts against a source.
:::
