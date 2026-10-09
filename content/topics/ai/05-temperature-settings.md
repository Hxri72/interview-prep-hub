---
title: Temperature and other model settings
stack: ai
order: 5
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Temperature controls how predictable or varied the answer is. Low = predictable, high = more creative.
  - "Use low temperature for code, data extraction and classification; higher for brainstorming and creative writing."
  - top_p is another way to limit choices to the most likely tokens. Usually change temperature OR top_p, not both.
  - max tokens caps the length of the answer; stop sequences end it at a chosen string.
  - Some newer models fix or limit these settings — always check the model's docs.
cards:
  - q: What does temperature do?
    a: It changes how the model picks the next token. Low temperature almost always picks the most likely token; high temperature gives less likely tokens a real chance.
  - q: Which temperature for extracting JSON from a resume?
    a: Low (around 0). You want the same, reliable, predictable output every time.
  - q: What is top_p?
    a: Nucleus sampling — the model only chooses from the smallest set of tokens whose probabilities add up to p (for example 0.9).
  - q: What does max tokens control?
    a: The maximum number of output tokens. The answer stops when it reaches this limit, even mid-sentence.
  - q: Does temperature 0 guarantee identical answers?
    a: Mostly very similar, but not always exactly identical. Don't rely on it for correctness — validate the output.
---

## 💡 What is it?

When an LLM picks the next [token](glossary:token), it has a list of options with probabilities. **[Temperature](glossary:temperature)** changes how it chooses from that list.

- **Low temperature** (near 0): it almost always picks the top option. Answers are predictable.
- **High temperature** (around 1 or more): less likely options get a real chance. Answers are more varied and creative.

Other settings control things like the **maximum length** of the answer and **where it stops**.

## 🏠 Real-life example

Think of **ordering at your favourite restaurant**.

- **Temperature 0** = you order your usual biryani every single time. Safe and predictable.
- **Temperature 1** = you usually order biryani, but sometimes try the fried rice.
- **Temperature 2** = you're adventurous. You might order anything on the menu, even the odd dishes.
- **The menu** = all the tokens the model could pick.
- **top_p** = "only choose from the dishes most people like", ignoring the strange ones at the bottom.
- **max tokens** = "I have only 20 minutes" — the meal ends when time is up.

For code and data, you want the "usual biryani" setting.

## 🧑‍💻 Code example

See how temperature changes the chance of each next word. Save it as `temperature.js`. Run `node temperature.js`. No API key is needed.

```js
// How temperature changes the chance of each next word
const scores = { Delhi: 5.0, Mumbai: 3.0, Kochi: 2.0 }; // raw scores the model gives each next word
function probabilities(scores, temperature) {             // softmax with temperature
  const words = Object.keys(scores);                       // the candidate words
  const scaled = words.map((w) => Math.exp(scores[w] / temperature)); // low temperature makes big scores even bigger
  const total = scaled.reduce((a, b) => a + b, 0);         // add them up
  return Object.fromEntries(words.map((w, i) => [w, (scaled[i] / total * 100).toFixed(1) + '%'])); // turn into percentages
}                                                          // end of probabilities
console.log('temperature 0.2:', probabilities(scores, 0.2)); // low: almost always the top word
console.log('temperature 1.0:', probabilities(scores, 1.0)); // normal: the top word usually wins
console.log('temperature 2.0:', probabilities(scores, 2.0)); // high: other words get a real chance
```

**Output:**

```text
temperature 0.2: { Delhi: '100.0%', Mumbai: '0.0%', Kochi: '0.0%' }
temperature 1.0: { Delhi: '84.4%', Mumbai: '11.4%', Kochi: '4.2%' }
temperature 2.0: { Delhi: '62.9%', Mumbai: '23.1%', Kochi: '14.0%' }
```

At 0.2, "Delhi" is basically certain. At 2.0, "Mumbai" or "Kochi" would be picked about 37% of the time.

## 🔍 Deeper version

**What temperature really does.** The model outputs a score (a "logit") for every token. These scores go through a function called **softmax**, which turns them into probabilities. Temperature divides the scores first:
- **Divide by a small number** → differences grow → the top token dominates.
- **Divide by a big number** → differences shrink → the spread is flatter.

**Common settings:**

| Setting | What it does | Typical use |
|---|---|---|
| `temperature` | How random the token choice is | ~0 for code/JSON, ~0.7–1 for creative text |
| `top_p` | Only pick from the smallest group of tokens adding up to p | Alternative to temperature; change one, not both |
| `top_k` | Only pick from the top k tokens | Supported by some APIs |
| `max_tokens` | Hard limit on output length | Stops runaway answers and controls cost |
| `stop` / stop sequences | End generation when a string appears | Cut output at a marker |

**Important caveats:**
- **Low temperature is not a correctness guarantee.** The model can still be confidently wrong. Validate with [structured outputs](topic:ai/structured-outputs) and checks.
- **Temperature 0 is near-deterministic, not fully.** Tiny differences can still appear between runs.
- **Some newer models fix or restrict these knobs**, especially models with built-in reasoning or "thinking" modes. Read the model's API docs before setting them.
- **`max_tokens` cuts mid-sentence.** If the answer is cut off, the API usually tells you the stop reason was the length limit. Handle that case.

## 🎯 Why do we use it?

Different features need different behaviour:
- **Extracting skills from a resume as JSON** → low temperature, same answer every time.
- **Writing a friendly job-description draft** → a bit higher, so it doesn't sound robotic.
- **Brainstorming interview questions** → higher, for variety.

Choosing the right settings makes features more reliable and cheaper (thanks to `max_tokens`).

## ⚠️ Common mistakes

- **High temperature for data extraction**, then wondering why the JSON changes every time.
- **Changing temperature and top_p together**, which makes behaviour hard to reason about.
- **Not setting max tokens**, so a confused model writes a very long, expensive answer.
- **Ignoring a "cut off by length" stop reason**, then trying to parse half a JSON object.

## 🗣️ How to answer in an interview

> "Temperature controls how the model picks the next token. Internally it scales the token scores before softmax: low temperature makes the most likely token dominate, so output is predictable; high temperature flattens the probabilities, so you get more variety. I use low temperature for code, classification and structured data extraction, and a bit higher for creative text like a job-description draft.
>
> I also always set max tokens to cap length and cost, and check the stop reason so I don't parse a truncated answer. And I don't treat low temperature as correctness — I still validate the output against a schema. Some newer models restrict these settings, so I check the model's docs."

## 🔁 Follow-up questions

### What temperature would you use for the AI job-description chatbot?

A moderate value, so the text reads naturally, while the structure (fields and sections) is enforced by a schema. [FILL IN: what your backend actually used, if you know].

### What's the difference between temperature and top_p?

Temperature reshapes all the probabilities. top_p cuts the list to the most likely tokens whose probabilities add up to p, then samples from those. Both control randomness; usually you tune only one.

### Why might the same prompt give different answers at temperature 0?

Small numerical differences in how the servers run the model can change a close choice. It's rare, but it means you should never depend on exact repeats.

### What does max_tokens protect you from?

Very long or looping answers, which waste time and money. It also gives you a predictable upper limit on cost per call.

## ✅ Quick check

### 1. In the code example, about how often would "Mumbai" be picked at temperature 1.0?

:::answer
About **11.4%** of the time.
:::

### 2. You need the same JSON from a resume every time. Which settings?

- A) temperature 1.5, no max tokens
- B) temperature near 0, sensible max tokens, and schema validation

:::answer
**B.** Low temperature for consistency, a length cap for safety, and validation because low temperature alone doesn't guarantee correct output.
:::

### 3. True or false: temperature 0 means the answer is always correct.

:::answer
**False.** It makes the answer more predictable, not more correct.
:::
