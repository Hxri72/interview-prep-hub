---
title: LangChain
stack: ai
order: 21
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - LangChain is an open-source framework (Python and JavaScript/TypeScript) with ready-made building blocks for AI apps.
  - "Building blocks: model connectors, prompt templates, output parsers, tools, document loaders and retrievers for RAG."
  - "Simple picture: LangChain is a toolbox. LangGraph is the engine that runs agents — LangChain 1.0's agents run on LangGraph."
  - Both reached version 1.0 in October 2025. LangSmith is their separate tool for tracing and testing.
  - Learn the plain API way first, so you know what the framework does for you.
cards:
  - q: What is LangChain?
    a: An open-source framework with ready-made building blocks for AI apps — model connectors, prompt templates, parsers, tools and RAG retrievers.
  - q: LangChain vs LangGraph?
    a: LangChain is the toolbox and the easy layer. LangGraph controls an agent's steps as a graph. LangChain 1.0's agents run on LangGraph underneath.
  - q: What does `prompt.pipe(model).pipe(parser)` do?
    a: It builds a chain — the filled prompt goes to the model, and the model's reply goes to the parser, which turns it into the output you want.
  - q: Why might you NOT use LangChain?
    a: For a simple feature, plain API calls are shorter, easier to debug, and have fewer dependencies to keep updated.
  - q: What is LangSmith?
    a: The LangChain company's tool for tracing, debugging and testing AI apps.
---

## 💡 What is it?

**LangChain** is an **open-source framework** for building AI apps. It has versions for **Python** and **JavaScript/TypeScript**.

It gives you **ready-made building blocks**: connectors to many AI models, prompt templates, output parsers, tools, and helpers for [RAG](glossary:rag).

You can build all of this with plain API calls. LangChain just **saves time** on common patterns.

## 🏠 Real-life example

Think of a **LEGO set** for building a model house.

You could carve every brick from wood yourself. Or you can use LEGO bricks that already fit together.

- **LEGO bricks** = LangChain's building blocks (prompt, model, parser).
- **Snapping bricks together** = `.pipe()`, which joins steps into a chain.
- **Swapping a red brick for a blue one** = switching from one AI model to another without rebuilding.
- **Carving bricks by hand** = writing plain API calls yourself.

LEGO is faster. But if you only need one brick, carving it might be simpler. The same is true for LangChain.

## 🧑‍💻 Code example

A chain with a **fake model**, so it runs without an API key.

```bash
npm init -y && npm install @langchain/core
```

Save as `lc-demo.js` and run `node lc-demo.js`.

```js
// lc-demo.js — a LangChain "chain": prompt template → model → output parser (fake model, no API key)
const { ChatPromptTemplate } = require('@langchain/core/prompts');          // builds the prompt from a template
const { FakeListChatModel } = require('@langchain/core/utils/testing');     // a fake chat model for testing
const { StringOutputParser } = require('@langchain/core/output_parsers');   // turns the model's message into a plain string

const prompt = ChatPromptTemplate.fromMessages([                            // the template has two messages
  ['system', 'You summarise resumes in one line.'],                         // the rules for the model
  ['human', 'Resume: {resume}'],                                            // {resume} is a blank we fill in later
]);
const model = new FakeListChatModel({                                       // fake model: returns these replies in order
  responses: ['Node.js developer, 3 years, MongoDB and React.'],            // the one reply it will give
});
const chain = prompt.pipe(model).pipe(new StringOutputParser());            // connect the steps like pipes: prompt → model → parser

async function main() {                                                     // async so we can await the chain
  const filled = await prompt.format({ resume: 'Hari, MERN, 3+ yrs' });     // see what the filled prompt looks like
  console.log('Prompt sent:\n' + filled);                                   // print the filled prompt
  const answer = await chain.invoke({ resume: 'Hari, MERN, 3+ yrs' });      // run the whole chain with real input
  console.log('Answer:', answer);                                           // print the final string
}

main();                                                                     // run it
```

**Output** (tested with `@langchain/core` 1.2):

```text
Prompt sent:
System: You summarise resumes in one line.
Human: Resume: Hari, MERN, 3+ yrs
Answer: Node.js developer, 3 years, MongoDB and React.
```

To use a real model, swap `FakeListChatModel` for a real chat model class, like the one in `@langchain/anthropic`. The rest of the chain stays the same.

## 🔍 Deeper version

**The main building blocks:**

| Block | What it does |
|---|---|
| **Chat models** | One interface for many providers (Anthropic, OpenAI, Google…) |
| **Prompt templates** | Prompts with blanks, filled at run time |
| **Output parsers / structured output** | Turn the reply into a string or a typed object |
| **Tools** | Functions the model can call |
| **Document loaders, text splitters** | Read PDFs or web pages and cut them into chunks |
| **Embeddings + vector stores + retrievers** | The search part of [RAG](topic:ai/rag) |

**Runnables and `.pipe()`.** Everything is a "runnable" with `invoke`, `batch` and `stream`. `.pipe()` joins runnables, so the output of one becomes the input of the next. That's why the same chain can stream or run in batches with no extra code.

**Agents in LangChain 1.0.** The 1.0 release added `createAgent`. It builds a tool-calling agent loop for you, and it runs on **LangGraph** underneath. A sketch (needs `@langchain/anthropic` and an API key):

```ts
import { createAgent, tool } from "langchain";                 // 1.0 agent helper and tool helper
import { z } from "zod";                                        // input schema for the tool

const searchJobs = tool(async ({ skill }) => `3 jobs need ${skill}`, {   // the tool's code
  name: "searchJobs", description: "Find open jobs by skill",           // the model reads these
  schema: z.object({ skill: z.string() }),                              // the input shape
});

const agent = createAgent({ model: "anthropic:claude-opus-5-5", tools: [searchJobs] }); // model + tools
const result = await agent.invoke({ messages: [{ role: "user", content: "Any Node.js jobs?" }] }); // run it
```

Check the current LangChain.js docs before using this. These libraries change quickly.

**LangChain vs plain API calls:**

| | Plain API calls | LangChain |
|---|---|---|
| Simple feature (one call) | Shorter, clearer | Extra layers for little gain |
| Switching model providers | Rewrite the calls | Change one class or string |
| RAG pipeline | Write loaders, splitters, search yourself | Ready-made pieces |
| Debugging | You see every request | Need to learn its abstractions (LangSmith helps) |
| Dependencies | Just the provider SDK | Several packages to keep updated |

:::version[Version note]
**LangChain and LangGraph both reached 1.0 in October 2025.** In 1.0, LangChain's agents run on LangGraph, so they are partners, not rivals. The Python versions usually get new features first and have more examples online. Many older tutorials use APIs that have since changed — check the date before copying.
:::

## 🎯 Why do we use it?

LangChain saves time when you need **many common pieces** together: several model providers, document loading, chunking, embeddings, retrieval and tools. It also makes it easy to **switch models** without rewriting your app.

For a single simple AI call, plain API code is often better.

## ⚠️ Common mistakes

- **Using LangChain for one simple call.** It adds layers you don't need.
- **Copying old tutorials.** The APIs changed a lot before 1.0.
- **Not learning the basics first.** If you don't know how a raw API call and tool loop work, debugging the framework is hard.
- **Mixing old and new package versions**, which causes confusing errors.

## 🗣️ How to answer in an interview

> "LangChain is an open-source framework, in Python and JavaScript, with ready-made building blocks for AI apps: connectors to many models, prompt templates, output parsers, tools, and the loaders, splitters and retrievers you need for RAG. You join them with pipe into a chain, and the same chain can invoke, batch or stream.
>
> In version 1.0, from October 2025, its agents run on LangGraph underneath. So LangChain is the easy toolbox, and LangGraph is the engine for agents.
>
> I'd use it when I need many of these pieces or want to switch providers easily. For one simple call, I'd use the provider's SDK directly, because it's shorter and easier to debug."

[FILL IN: if you've used LangChain in a project, say what for. If not, say honestly that your AI features used the provider SDKs directly.]

## 🔁 Follow-up questions

### What is a "chain"?

A series of steps joined together, where each step's output becomes the next step's input. For example: prompt → model → parser.

### How does LangChain help with RAG?

It has document loaders, text splitters, embedding models, vector store connectors and retrievers. You join them instead of writing each one.

### What is LangSmith used for?

Tracing every step of a chain or agent, seeing prompts, outputs, tokens and timings, and running tests (evals) on AI features.

### Would you use LangChain in production?

It depends. For complex pipelines with many parts, yes. For simple features, plain SDK calls have fewer moving parts. Either way, pin versions and have tests.

## ✅ Quick check

### 1. In the code above, what are the three steps of the chain, in order?

:::answer
Prompt template → model → output parser.
:::

### 2. True or false: you must use LangChain to build a RAG system.

:::answer
**False.** You can build RAG with plain code: chunk, embed, store, search, then call the model. LangChain only saves time.
:::

### 3. Since 1.0, what do LangChain's agents run on underneath?

:::answer
**LangGraph.**
:::
