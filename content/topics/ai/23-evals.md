---
title: "Evals: testing AI features"
stack: ai
order: 23
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - An eval is an automatic test for an AI feature — a fixed set of inputs, expected results, and a way to grade the answers.
  - "AI output changes with every prompt edit or model change. Evals tell you if quality went up or down."
  - "Grading methods: exact or rule-based checks (cheapest), schema checks, and an LLM as a judge with a clear rubric."
  - Start small (20–50 real cases), include tricky edge cases, and run the eval after every change.
  - In production, add validation and logging, and turn real failures into new eval cases.
cards:
  - q: What is an eval?
    a: An automatic test for an AI feature — fixed inputs, expected results, and a grader that scores every answer, run after every change.
  - q: Why can't you test AI features only with normal unit tests?
    a: The output isn't fixed. The same input can give different wording, and a prompt or model change can quietly make answers worse. Evals measure quality across many cases.
  - q: What is "LLM as a judge"?
    a: Using a second model, with a clear rubric, to grade answers that can't be checked by simple rules, like "is this summary accurate and polite?".
  - q: Where do good eval cases come from?
    a: Real user inputs, known tricky edge cases, and past failures from production.
  - q: When should you run evals?
    a: After every prompt change, model change or code change that touches the AI feature — like running tests in CI.
---

## 💡 What is it?

An **eval** is an **automatic test for an AI feature**.

You make a fixed list of inputs. For each one, you write down what a good answer looks like. Then a **grader** checks every answer and gives a **score**.

You run the eval **after every change**. If the score drops, your change made things worse.

## 🏠 Real-life example

Think of a **school unit test** for a whole class.

- The **question paper** = the eval cases (the inputs).
- The **answer key** = the expected results.
- The **teacher marking the papers** = the grader.
- The **class average** = the eval score.
- **Using the same paper every term** = running the same eval after every change, so you can compare.

If the class average falls after a new teaching method, the method needs fixing. If your eval score falls after a new prompt, the prompt needs fixing.

## 🧑‍💻 Code example

A tiny eval runner for a fake "extract skills" feature. No API key is needed. Save as `evals.js` and run `node evals.js`.

```js
// evals.js — a tiny eval runner: fixed test cases + automatic grading (fake AI, no API key)
function extractSkills(resumeText) {                                        // the "AI feature" we are testing (fake version)
  const known = ['node', 'react', 'mongodb', 'aws'];                        // skills our fake model can spot
  return known.filter((k) => resumeText.toLowerCase().includes(k));         // return every skill word found in the text
}

const cases = [                                                             // the eval set: input + what we expect
  { input: 'Built APIs in Node and MongoDB', expect: ['node', 'mongodb'] }, // case 1
  { input: 'React developer on AWS', expect: ['react', 'aws'] },            // case 2
  { input: 'Worked with Node.js and ReactJS', expect: ['node', 'react'] },  // case 3
  { input: 'Java and Spring only', expect: [] },                            // case 4: should find nothing
  { input: 'Knows Mongo and Express', expect: ['mongodb'] },                // case 5: tricky — "Mongo" means MongoDB
];

const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x)); // grader: same items, any order

let passed = 0;                                                             // count of passing cases
for (const c of cases) {                                                    // run every case
  const got = extractSkills(c.input);                                       // ask the feature
  const ok = same(got, c.expect);                                           // grade the answer
  if (ok) passed++;                                                         // add to the score
  console.log(ok ? 'PASS' : 'FAIL', JSON.stringify(c.input), '→', JSON.stringify(got)); // show each result
}
console.log(`Score: ${passed}/${cases.length} (${Math.round((passed / cases.length) * 100)}%)`); // the final score
```

**Output:**

```text
PASS "Built APIs in Node and MongoDB" → ["node","mongodb"]
PASS "React developer on AWS" → ["react","aws"]
PASS "Worked with Node.js and ReactJS" → ["node","react"]
PASS "Java and Spring only" → []
FAIL "Knows Mongo and Express" → []
Score: 4/5 (80%)
```

**What to notice:** the tricky case 5 found a real weakness. In a real eval, `extractSkills` would call the AI model, and you would compare scores before and after each prompt change.

## 🔍 Deeper version

**Three ways to grade:**

| Grader | Good for | Cost |
|---|---|---|
| **Exact / rule-based** | Labels, numbers, "is this field present?", lists of skills | Cheapest, fully repeatable |
| **Schema check** | Structured output must match a JSON shape (see [structured outputs](topic:ai/structured-outputs)) | Cheap |
| **LLM as a judge** | Open text: "is this summary accurate, short and polite?" | Costs tokens; needs a clear rubric |

**LLM-as-a-judge tips:**
- Give the judge a **clear rubric** with simple pass/fail rules, not "rate 1–10 how good it is".
- Grade **one thing at a time** (accuracy, then tone).
- **Check the judge itself**: compare its grades with human grades on a sample.

**Building a good eval set:**
- Start with **20–50 real cases**. More is better, but small is fine to start.
- Include **edge cases**: empty input, very long input, other languages, tricky wording, attempts at [prompt injection](topic:ai/prompt-injection-guardrails).
- Every **production failure becomes a new case**, so the same bug can't return.
- Keep a **held-out set** you don't look at while tuning prompts, so you don't just "teach to the test".

**Running evals well:**
- Run them in CI or before every release, like [unit tests](topic:testing/testing-pyramid).
- AI output can vary, so run each case a few times for important evals and look at the pass rate.
- Track **cost and latency** too, not just accuracy. A prompt that's 2% better but 3× slower may not be worth it.
- Save results per version so you can compare.

**In production:** validate every structured answer, log prompts, outputs, tokens and errors, and collect user feedback (thumbs up/down). These signals feed new eval cases.

## 🎯 Why do we use it?

AI features don't fail loudly. A prompt edit or a new model can make answers **slightly worse** with no error at all. Without evals, you only find out when users complain.

Evals turn "it feels better" into a **number you can compare**. They make it safe to change prompts, switch models and cut costs.

## ⚠️ Common mistakes

- **Testing with only two or three examples** you checked by eye.
- **Only easy cases.** The tricky ones are where features break.
- **Vague judge rubrics** like "is it good?", which give random scores.
- **Tuning the prompt on the same cases you report**, so the score looks better than real life.

## 🗣️ How to answer in an interview

> "An eval is an automatic test for an AI feature. I keep a fixed set of real inputs with expected results, and a grader scores every answer. I run it after every prompt, model or code change, so I can see if quality went up or down.
>
> For grading, I use the cheapest method that works: exact or rule-based checks for things like extracted fields, schema validation for structured output, and an LLM as a judge with a clear pass/fail rubric for open text.
>
> I include tricky edge cases, and every production failure becomes a new case. I also track cost and latency, not just accuracy."

[FILL IN: how you tested the AI JD chatbot backend or the voice-call scoring, if you did. Only add it if it's true.]

## 🔁 Follow-up questions

### How is an eval different from a unit test?

A unit test checks one exact result. An eval measures quality across many cases and gives a score, because AI output varies.

### How many eval cases do you need?

Start with 20–50 real cases. Grow the set over time, especially with real failures.

### How do you trust an LLM judge?

Give it a clear rubric, grade one thing at a time, and compare its grades with human grades on a sample.

### What would you do if the score drops after a model upgrade?

Look at the failing cases, adjust the prompt for the new model, and re-run. Don't ship until the score is back, or the trade-off is clearly worth it.

## ✅ Quick check

### 1. In the output above, which case failed, and what does it tell you?

:::answer
Case 5, "Knows Mongo and Express". The feature only matches the exact word "mongodb", so it misses the short name "Mongo".
:::

### 2. You need to check "is this summary polite and accurate?". Which grader fits best?

- A) Exact string match
- B) LLM as a judge with a rubric
- C) No grading

:::answer
**B.** Open text can't be checked with an exact match. A judge with a clear rubric works.
:::

### 3. True or false: you only need to run evals once, before the first release.

:::answer
**False.** Run them after every prompt, model or code change.
:::
