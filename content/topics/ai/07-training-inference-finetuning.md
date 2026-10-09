---
title: Training vs inference vs fine-tuning
stack: ai
order: 7
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Training is when a model learns from huge amounts of data. It takes months and costs a lot. Big AI companies do it.
  - Inference is using the trained model to answer a question. Every API call you make is inference, and you pay per token.
  - Fine-tuning is training an existing model a little more on your own examples, to change its style or format.
  - "Try in this order: better prompts → RAG → fine-tuning. Fine-tuning is expensive and doesn't add fresh facts well."
  - The model's knowledge stops at its training cut-off date unless you give it newer data.
cards:
  - q: What is the difference between training and inference?
    a: Training changes the model's weights by learning from data. Inference uses the fixed weights to produce an answer. API calls are inference.
  - q: What is fine-tuning?
    a: Extra training of an existing model on a smaller set of your own examples, to teach a style, format or narrow task.
  - q: When would you choose RAG over fine-tuning?
    a: When the model needs your facts or frequently changing data. RAG adds knowledge at question time; fine-tuning is better for style and format.
  - q: Why does a model not know about recent events?
    a: Its knowledge comes from training data up to a cut-off date. Newer information must be given in the prompt, via RAG or tools.
  - q: Do you need GPUs to use an LLM through an API?
    a: No. The provider runs inference on their GPUs. You send text and pay per token.
---

## 💡 What is it?

An AI model goes through different stages:

- **Training**: the model **learns** from a huge amount of data. Its internal numbers (called **weights**) change. This takes months and costs a lot.
- **[Inference](glossary:inference)**: you **use** the finished model to get an answer. The weights don't change. Every API call you make is inference.
- **[Fine-tuning](glossary:fine-tuning)**: you take a trained model and **train it a little more** on your own examples, to change its style or teach a narrow task.

## 🏠 Real-life example

Think of **becoming a doctor**.

- **Training** = 5+ years of medical college. Long, expensive, done once. That's what AI companies do to build a model.
- **Inference** = a patient visits and the doctor uses what they learned to give advice. Quick, done many times a day. That's your API call.
- **Fine-tuning** = a short specialisation course, like 6 months in child care. The doctor keeps everything they knew and gets better at one area.
- **Reading the patient's report before answering** = RAG. The doctor doesn't memorise every patient; they read the file each time.

## 🧑‍💻 Code example

A tiny one-number "model" that learns `y = 2x`, is used to answer, then is fine-tuned towards `y = 2.5x`. Save it as `train.js`. Run `node train.js`.

```js
// Training vs inference vs fine-tuning with a tiny one-number "model"
let w = 0;                                                  // the model's only weight; it starts knowing nothing
const train = (data, steps, lr) => {                        // training = adjust w to fit the examples
  for (let s = 0; s < steps; s++) {                         // repeat many times
    for (const [x, y] of data) {                            // each example: input x, correct answer y
      const error = w * x - y;                              // how wrong the model is right now
      w -= lr * error * x;                                  // nudge w to be a bit less wrong (lr = step size)
    }                                                       // end of one pass over the data
  }                                                         // end of all steps
};                                                          // end of train
const predict = (x) => w * x;                               // inference = just use w, no learning

train([[1, 2], [2, 4], [3, 6]], 50, 0.05);                  // TRAINING: examples follow y = 2x
console.log('after training, w =', w.toFixed(2));          // the model learned w ≈ 2
console.log('inference for x=10:', predict(10).toFixed(1)); // INFERENCE: use the model on new input

train([[1, 2.5], [2, 5], [4, 10]], 20, 0.02);               // FINE-TUNING: a little more training on new examples (y = 2.5x)
console.log('after fine-tuning, w =', w.toFixed(2));       // w moved from about 2 towards 2.5
console.log('inference for x=10:', predict(10).toFixed(1)); // the same input now gives a new answer
```

**Output:**

```text
after training, w = 2.00
inference for x=10: 20.0
after fine-tuning, w = 2.50
inference for x=10: 25.0
```

A real LLM works the same way at a huge scale: billions of weights instead of one, and trillions of tokens instead of three examples.

## 🔍 Deeper version

| | Training | Fine-tuning | Inference |
|---|---|---|---|
| **Changes weights?** | Yes, all of them | Yes, a little (sometimes only small add-on layers) | No |
| **Data needed** | Trillions of tokens | Hundreds to thousands of good examples | Just your prompt |
| **Who does it** | AI labs | You or the provider's fine-tuning service | You, on every API call |
| **Cost** | Huge | Medium | Per token |
| **Time** | Weeks to months | Minutes to hours | Seconds |

**Pre-training and post-training.** Big models are first **pre-trained** on huge text to predict the next token. Then they're **post-trained** (instruction tuning, human feedback) so they follow instructions, chat helpfully and refuse harmful requests.

**The knowledge cut-off.** Everything the model "knows" comes from training data up to some date. Ask about later events and it may not know — or worse, hallucinate.

**Fine-tuning is good for:**
- A consistent **style or tone** (your company's voice).
- A fixed **output format** for a narrow task.
- **Smaller, cheaper models** that copy a big model's behaviour on one task.

**Fine-tuning is NOT the best way to:**
- Add **facts that change** (job openings, prices, candidate data). Use [RAG](topic:ai/rag) or [tool calling](topic:ai/tool-calling).
- Fix a problem a **better prompt** would fix.

**The usual order:** prompt engineering → RAG / tools → fine-tuning → (rarely) training your own model. Each step costs more and takes longer.

**Inference infrastructure.** When you call an API, the provider runs inference on its GPUs. Running open models yourself means managing GPUs, scaling and latency — usually only worth it at large scale or for strict data rules.

## 🎯 Why do we use it?

Knowing these stages helps you **choose the right tool** and **explain cost**:
- Most product teams only do **inference** (API calls) plus prompts and RAG.
- Knowing fine-tuning exists lets you answer "should we train our own model?" sensibly — usually "not yet".
- It explains why the model doesn't know your data or last month's news.

## ⚠️ Common mistakes

- **Fine-tuning to teach facts** that change every week. Use RAG instead.
- **Saying "we trained an AI"** when you actually called an API. Interviewers notice. Be precise.
- **Skipping prompt work** and jumping to fine-tuning.
- **Forgetting the training cut-off** and trusting the model on recent events.

## 🗣️ How to answer in an interview

> "Training is when a model learns from huge amounts of data by adjusting its weights — that's done by AI labs, takes a long time and costs a lot. Inference is using the trained model to produce an answer, with the weights fixed — every API call is inference, billed per token. Fine-tuning is extra training of an existing model on a smaller set of our own examples, mainly to change style, format or behaviour on a narrow task.
>
> In practice I'd go in this order: better prompts first, then RAG or tool calling for our own and changing data, and only then fine-tuning if we need a consistent format or a cheaper specialised model. In my own work, the JD chatbot and the voice agent both use inference through APIs — we didn't train or fine-tune models. [FILL IN: confirm no fine-tuning was used]."

## 🔁 Follow-up questions

### A client wants the chatbot to know their 500 job descriptions. Fine-tune or RAG?

RAG. The job descriptions change often, and RAG lets the model read the current version at question time. Fine-tuning would go stale and is harder to update.

### What is RLHF?

Reinforcement Learning from Human Feedback. People rate model answers, and the model is trained to prefer the better-rated ones. It's part of post-training and makes models more helpful and safer.

### Why can a fine-tuned model still hallucinate?

Fine-tuning shapes style and behaviour; it doesn't guarantee facts. The model still predicts likely text.

### When would you run an open model yourself?

When data must never leave your servers, or at a scale where owning GPUs is cheaper. Otherwise APIs are simpler.

## ✅ Quick check

### 1. In the code example, which line is "inference"?

:::answer
`predict(10)`. It uses the current weight `w` without changing it.
:::

### 2. The model needs today's open positions. What do you use?

- A) Fine-tune it every morning
- B) RAG or a tool call that fetches the open positions
- C) Train a new model

:::answer
**B.** Fresh, changing data belongs in RAG or a tool call, fetched at question time.
:::

### 3. True or false: calling an LLM API means you are training the model.

:::answer
**False.** An API call is inference. The model's weights don't change.
:::
