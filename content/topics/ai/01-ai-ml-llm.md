---
title: AI, machine learning, deep learning and LLMs
stack: ai
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "AI → machine learning → deep learning → LLM. Each one is a smaller part of the one before it."
  - Normal code follows rules a human wrote. Machine learning finds the rules itself from many examples.
  - Deep learning is machine learning with big neural networks — many layers of simple maths units.
  - An LLM (Large Language Model) is a deep learning model trained on huge amounts of text, so it can read and write language.
  - ChatGPT, Claude and Gemini are products built on LLMs.
cards:
  - q: What is the difference between AI and machine learning?
    a: AI is any system that looks "smart". Machine learning is one way to build AI — the computer learns patterns from examples instead of following hand-written rules.
  - q: What is deep learning?
    a: Machine learning that uses large neural networks with many layers. It powers image recognition, speech and LLMs.
  - q: What is an LLM?
    a: A Large Language Model — a deep learning model trained on huge amounts of text that reads and writes language by predicting the next token.
  - q: Are ChatGPT and Claude LLMs?
    a: They are apps built on LLMs. The LLM is the model inside; the app adds chat history, tools, safety rules and a user interface.
  - q: When would you NOT use machine learning?
    a: When a clear rule works — like "price must be above 0". Rules are cheaper, faster, predictable and easy to test.
---

## 💡 What is it?

**AI** (Artificial Intelligence) is any computer system that does something that looks smart.

**Machine learning** is one way to build AI. You don't write the rules by hand. The computer **learns patterns from many examples**.

**Deep learning** is machine learning with very large "neural networks". An **[LLM](glossary:llm)** is a deep learning model trained on huge amounts of text, so it can read and write language.

## 🏠 Real-life example

Think of **learning to recognise ripe mangoes**.

- **Normal code** = your grandmother gives you a written list: "yellow skin, soft, sweet smell". You follow the list exactly.
- **Machine learning** = nobody gives you a list. You look at 1,000 mangoes marked "ripe" or "not ripe". Slowly, you notice the patterns yourself.
- **Deep learning** = a very experienced fruit seller. Years of seeing mangoes built many small "feelings" in their head. They can't even explain every rule.
- **An LLM** = the same idea, but with words. It has "read" a huge library of text. Now it can continue any sentence in a sensible way.

So the circles fit inside each other: **AI ⊃ machine learning ⊃ deep learning ⊃ LLMs**.

## 🧑‍💻 Code example

This compares a **hand-written rule** with a tiny model that **learns from examples**. Save it as `learn.js`. Run `node learn.js`. No API key is needed.

```js
// Way 1: a human writes the rule by hand
const ruleSaysSpam = (msg) => msg.includes('free money'); // only catches this exact phrase

// Way 2: the computer learns from labelled examples
const examples = [                                         // a tiny training set
  { text: 'win free money now', spam: true },              // spam example
  { text: 'claim your free prize today', spam: true },     // spam example
  { text: 'meeting moved to monday', spam: false },        // normal example
  { text: 'your interview is today at 3pm', spam: false }, // normal example
];                                                         // end of the examples
const spamWords = {};                                      // word → how many times it appeared in spam
const hamWords = {};                                       // word → how many times it appeared in normal mail
for (const ex of examples) {                               // go through every example
  for (const w of ex.text.split(' ')) {                    // split the sentence into words
    const table = ex.spam ? spamWords : hamWords;          // pick the right table
    table[w] = (table[w] || 0) + 1;                        // count the word
  }                                                        // end of the word loop
}                                                          // end of the example loop
const learnedSaysSpam = (msg) => {                         // the "model" we just learned
  let score = 0;                                           // positive = spam-like, negative = normal-like
  for (const w of msg.split(' ')) {                        // look at each word in the new message
    score += (spamWords[w] || 0) - (hamWords[w] || 0);     // spam words push up, normal words push down
  }                                                        // end of the loop
  return score > 0;                                        // more spam-like than normal → spam
};                                                         // end of the model

const msg = 'free prize for you';                          // a new message neither way has seen
console.log('rule says spam:', ruleSaysSpam(msg));         // the hand-written rule misses it
console.log('learned says spam:', learnedSaysSpam(msg));   // the learned model catches it
```

**Output:**

```text
rule says spam: false
learned says spam: true
```

The rule only knew "free money". The learned model saw "free" and "prize" in spam examples, so it caught a message nobody wrote a rule for.

## 🔍 Deeper version

| Level | What it is | Example |
|---|---|---|
| **AI** | Any system that seems smart | A chess program, a route planner |
| **Machine learning** | Learns patterns from data | Spam filter, price prediction |
| **Deep learning** | ML with big neural networks (many layers) | Face recognition, speech-to-text |
| **LLM** | Deep learning trained on huge text | GPT, Claude, Gemini, Llama |

**How learning works (the short version).** A model has millions or billions of numbers called **weights**. During training, it guesses an answer, measures how wrong it was, and nudges the weights a little. This repeats billions of times. See [training vs inference](topic:ai/training-inference-finetuning).

**What makes an LLM special.** It is trained on one simple task: predict the next piece of text. To do that well across so much text, it picks up grammar, facts, coding patterns and reasoning-like skills. See [how an LLM writes](topic:ai/how-llm-writes).

**The "transformer".** Modern LLMs use a neural network design called the **transformer** (from 2017). Its key trick, called "attention", lets every word look at every other word in the input. That's how the model links "it" back to the right noun.

**Model vs product.** The LLM is only the engine. Apps like ChatGPT or Claude add chat memory, tools (search, code running), safety rules and a user interface. When you call an [API](glossary:api), you get closer to the raw model.

**Other kinds of AI models you will hear about:**
- **Multimodal** models understand images or audio as well as text.
- **Speech-to-text and text-to-speech** models turn voice into words and back. The AI voice agent in my [resume story](topic:resume/voice-agent-microservice) uses both.
- **Embedding** models turn text into numbers for smart search. See [embeddings](topic:ai/embeddings-vector-db).

## 🎯 Why do we use it?

- Some problems have **no clear rules**: "Is this resume a good fit?" "What did the candidate mean?" Machine learning handles fuzzy problems like these.
- LLMs understand and write **natural language**. So you can build chatbots, summaries, job descriptions and voice agents.
- One general model can do **many tasks** with just a different prompt. You don't train a new model for each feature.

## ⚠️ Common mistakes

- **Using AI where a simple rule works.** "Email must contain @" doesn't need a model. Rules are cheaper and always predictable.
- **Thinking the model "knows" things like a database.** It predicts likely text. It can be confidently wrong. See [hallucination](topic:ai/hallucination).
- **Mixing up the model and the app.** ChatGPT the app is not the same as the API model you call from code.
- **Saying "AI" for everything in an interview.** Be precise: say "an LLM", "a classifier" or "a speech-to-text model".

## 🗣️ How to answer in an interview

> "AI is the big umbrella: any system that does something smart. Machine learning is a part of AI where the computer learns patterns from examples instead of following hand-written rules. Deep learning is machine learning with large neural networks that have many layers. An LLM is a deep learning model trained on huge amounts of text, so it can read and write language. It works by predicting the next token, one at a time.
>
> In my work I've built on top of LLMs rather than training them. I built the backend of an AI job-description chatbot on OpenAI's API, and an AI voice agent where Claude decides what to say, with speech-to-text and text-to-speech around it. The skill there is less about training models and more about prompts, structured outputs, validation and keeping cost and latency under control."

## 🔁 Follow-up questions

### Do you need to train your own model to build AI features?

Usually not. Most teams call an existing model through an API. They improve results with better prompts, [RAG](glossary:rag) and structured outputs. Training or fine-tuning is expensive, so it comes last.

### What is a neural network, simply?

Layers of tiny maths units. Each one takes numbers in, multiplies them by its weights, adds them up and passes the result on. Training adjusts the weights until the outputs are useful.

### Is an LLM the same as a search engine?

No. A search engine finds existing pages. An LLM generates new text from patterns it learned. It doesn't look facts up unless you give it a search tool or [RAG](topic:ai/rag).

### What does "generative AI" mean?

AI that creates new content: text, images, audio or code. LLMs are generative AI for text and code.

## ✅ Quick check

### 1. Put these in order, from biggest to smallest: LLM, AI, deep learning, machine learning.

:::answer
**AI → machine learning → deep learning → LLM.** Each one sits inside the one before it.
:::

### 2. In the code example, why did the hand-written rule miss "free prize for you"?

:::answer
The rule only checks for the exact phrase "free money". The learned model counted words like "free" and "prize" from spam examples, so it recognised a new message that matched the pattern.
:::

### 3. A form must reject an age below 18. Should you use machine learning?

- A) Yes, train a model on many ages
- B) No, a simple rule `age >= 18` is enough

:::answer
**B.** The rule is clear and exact. Machine learning is for fuzzy problems without clear rules.
:::
