---
title: "Choosing an LLM: providers, model sizes and open models"
stack: ai
order: 28
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Two kinds of models: closed models you call through an API (OpenAI GPT, Anthropic Claude, Google Gemini) and open-weight models you can run yourself (Llama, Mistral, Qwen)."
  - Bigger models are smarter but slower and cost more. Smaller models are fast and cheap, and good enough for simple jobs.
  - Choose per feature by quality needed, speed, cost, privacy and features like tool calling — not "the best model for everything".
  - Hide the provider behind one small interface (an adapter), so you can switch models without changing the rest of the app.
  - Test with your own examples before choosing. Benchmarks don't know your data.
cards:
  - q: What is the difference between a closed model and an open-weight model?
    a: A closed model runs only on the provider's servers, and you call it through their API. An open-weight model's files are public, so you can run it on your own machine or server.
  - q: When would you pick a small model over a large one?
    a: For simple, high-volume jobs like classifying, tagging or short extraction. It is faster and much cheaper, and quality is usually enough.
  - q: Why might a company run an open model itself?
    a: Privacy (data never leaves their servers), control over versions, or cost at very high volume. The price is that they must run and scale the GPUs themselves.
  - q: What is a provider adapter?
    a: One small interface, like chat(messages), that the app always calls. Each provider has its own adapter behind it, so switching models means changing one setting, not the whole app.
---

## 💡 What is it?

There are many [LLMs](glossary:llm). Some are **closed**: you can only use them through the company's [API](glossary:api). Others are **open-weight**: anyone can download and run them.

Models also come in **sizes**. Big models are smarter but slower and cost more. Small models are fast and cheap.

Choosing an LLM means picking the right model **for each feature**, and building your app so you can change that choice later.

## 🏠 Real-life example

Think of **getting from home to school**.

- A **taxi** = a large closed model (a big model through an API). Comfortable and smart, but you pay every trip.
- An **auto-rickshaw** = a small closed model. Cheaper and quicker for short trips.
- **Your own bicycle** = an open-weight model you run yourself (for example with Ollama). No fare per trip, but you must look after it.
- **Choosing by trip** = choosing per feature. You don't take a taxi to the shop next door.
- **Knowing the address, not the driver** = the adapter. You can change the vehicle any day, because you only tell it where to go.

## 🧑‍💻 Code example

A tiny **provider adapter** in TypeScript. Two pretend providers follow the same interface, and the app picks one per task. No API key is needed.

Save as `adapter.mts` (the `.mts` ending lets you use `await` at the top level) and run `node adapter.mts`. Node 24 can run TypeScript files that only use simple types.

```ts
type ChatMessage = { role: 'user' | 'assistant'; content: string };     // one message in the chat
type ChatResult = { text: string; provider: string; ms: number };        // what every provider returns

interface LLMProvider {                                                   // the one shape all providers follow
  name: string;                                                           // a label for logs
  chat(messages: ChatMessage[]): Promise<string>;                         // send messages, get the reply text
}                                                                         // end of interface

const bigCloudModel: LLMProvider = {                                      // pretend large hosted model (e.g. Claude Opus)
  name: 'cloud-large',                                                    // its label
  async chat(messages) {                                                  // fake a slow, detailed answer
    await new Promise((r) => setTimeout(r, 300));                         // 300 ms = slower, bigger model
    return `Detailed answer to "${messages.at(-1)!.content}"`;            // reply about the last message
  },                                                                      // end of chat
};                                                                        // end of bigCloudModel

const smallLocalModel: LLMProvider = {                                    // pretend small open model on your machine (e.g. via Ollama)
  name: 'local-small',                                                    // its label
  async chat(messages) {                                                  // fake a quick, short answer
    await new Promise((r) => setTimeout(r, 50));                          // 50 ms = small and fast
    return `Short answer to "${messages.at(-1)!.content}"`;               // reply about the last message
  },                                                                      // end of chat
};                                                                        // end of smallLocalModel

const providers: Record<string, LLMProvider> = {                          // all providers by task type
  hard: bigCloudModel,                                                    // hard tasks → large model
  simple: smallLocalModel,                                                // simple tasks → small model
};                                                                        // end of map

async function ask(task: 'hard' | 'simple', question: string): Promise<ChatResult> { // app code calls only this
  const provider = providers[task];                                       // pick the provider for this task
  const start = Date.now();                                               // start a timer
  const text = await provider.chat([{ role: 'user', content: question }]); // same call for every provider
  return { text, provider: provider.name, ms: Date.now() - start };       // reply + which provider + time taken
}                                                                         // end of ask

console.log(await ask('simple', 'Classify: "Great job!"'));               // a cheap, fast job
console.log(await ask('hard', 'Write a job description for a MERN developer')); // a job that needs quality
```

Real output:

```text
{
  text: 'Short answer to "Classify: "Great job!""',
  provider: 'local-small',
  ms: 51
}
{
  text: 'Detailed answer to "Write a job description for a MERN developer"',
  provider: 'cloud-large',
  ms: 301
}
```

The app code (`ask`) never changed. Only the provider behind it did.

## 🔍 Deeper version

**1. The main choices.**

| | Closed API models | Open-weight models |
|---|---|---|
| Examples | OpenAI GPT, Anthropic Claude, Google Gemini | Meta Llama, Mistral, Qwen |
| How you use them | Call the provider's API with a key | Run them yourself (Ollama, vLLM) or through a hosting service |
| Quality | Usually the strongest for hard tasks | Good and improving; the best ones need big GPUs |
| Data privacy | Data goes to the provider (check their data policies) | Can stay fully on your own servers |
| Cost | Pay per [token](glossary:token) | Pay for the machines (GPUs), whether busy or idle |
| Effort to run | None. The provider scales it | You install, scale, update and monitor it |

**2. Sizes inside one provider.** Most providers offer a large, a medium and a small model. With Anthropic today these are `claude-opus-5-5` (large, the most capable), `claude-sonnet-5-5` (medium) and `claude-haiku-5-5` (small and fast). OpenAI and Google have similar families. Check their docs for current names, because they change often.

**3. How to choose for a feature.**

| Question | Points towards |
|---|---|
| Is the task hard (reasoning, long writing, tricky code)? | A large model |
| Is it simple and high-volume (tagging, short extraction, routing)? | A small model |
| Must the user see an answer within about a second? | A smaller model, plus [streaming](topic:ai/streaming) |
| Can the data never leave your servers? | An open-weight model you host |
| Do you need tool calling or structured JSON output? | A model whose API supports it well. See [Tool calling](topic:ai/tool-calling) |
| Are the documents very long? | A model with a large [context window](glossary:context-window) |

**4. Test, don't guess.** Write 20–50 real examples from your own app with the answer you expect. Run them on two or three models. Compare quality, speed and token cost. This is a small **eval**. See [Evals](topic:ai/evals).

**5. Mixing models.** Many apps use more than one model. For example, a small model sorts incoming questions, and a large model answers only the hard ones. The adapter above makes this easy.

**6. Things that change between providers.** Message formats differ a little (system prompt placement, content blocks), as do token counting, rate limits and error codes. The adapter is the one place where you handle these differences.

## 🎯 Why do we use it?

- **To get the right quality at the right price.** A large model for everything is slow and expensive. A small model for everything gives poor answers on hard tasks.
- **To protect data.** Some customers need their data to stay inside the company. Open-weight models make that possible.
- **To avoid lock-in.** Models and prices change every few months. With an adapter, switching is a config change, not a rewrite.

## ⚠️ Common mistakes

- **Picking a model from leaderboards only.** Test on your own data. A model that wins benchmarks can still be worse for your task.
- **Using the biggest model for everything.** Simple jobs cost many times more and run slower, with no real gain.
- **Calling one provider's SDK from all over the code.** Switching later means editing many files. Keep it behind one adapter.
- **Forgetting the cost of running an open model.** "Free model" doesn't mean free. GPUs, scaling and updates cost money and time.

## 🗣️ How to answer in an interview

> "I choose the model per feature, not one model for everything. For hard tasks like writing or reasoning, I use a large hosted model such as Claude Opus or a top GPT model. For simple, high-volume jobs like classification, a smaller model is faster and much cheaper. If data must stay inside the company, an open-weight model like Llama, run on our own servers or through Ollama, is an option, but then we own the GPUs and the scaling.
>
> I keep the provider behind one small interface, so the rest of the app just calls chat. Switching models is a config change. Before deciding, I test a set of real examples from the app on two or three models and compare quality, speed and token cost.
>
> At SkillKeepr I've worked with more than one provider. Our JD chatbot used OpenAI, and my voice agent uses Claude for the conversation logic. [FILL IN: why those models were chosen for each, if you know.]"

## 🔁 Follow-up questions

### What is Ollama?

A free tool that downloads open-weight models and runs them on your own computer or server. It gives them a simple local HTTP API. It is great for experiments and private data, but you need enough RAM or GPU memory for the model size.

### How would you switch from OpenAI to Claude in an existing app?

If the provider is behind an adapter, I write a new adapter for Claude and change one config value. Then I run my test set on both to check quality, and roll out slowly, for example to 10% of users first.

### Is a bigger context window always better?

No. Very long prompts cost more tokens and are slower. Models can also miss details in the middle of very long text. Often it's better to send only the relevant parts, which is what [RAG](topic:ai/rag) does.

### Can you fine-tune instead of choosing a bigger model?

Sometimes, but try better prompts and RAG first. They are cheaper and faster to change. Fine-tuning helps when you need a very specific style or format at scale. See [Training vs inference vs fine-tuning](topic:ai/training-inference-finetuning).

## ✅ Quick check

### 1. You need to tag 1 million support tickets as "billing", "bug" or "other". Which model is the better first try?

- A) The largest model available
- B) A small, fast model, tested on a sample first

:::answer
**B.** Tagging is a simple, high-volume job. A small model is much cheaper and faster. Test it on a few hundred labelled tickets, and only move up a size if quality isn't good enough.
:::

### 2. In the code example, what would you change to move "simple" tasks to a different provider?

:::answer
Only the `providers` map, for example `simple: someNewProvider`. The `ask` function and the rest of the app stay the same. That is the point of the adapter.
:::
