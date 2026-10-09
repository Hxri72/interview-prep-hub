---
title: LangGraph
stack: ai
order: 22
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - LangGraph is a library for building agents and AI workflows as a graph of steps.
  - "Nodes are steps (call the model, run a tool). Edges say which step comes next, including if/else and loops."
  - State is a shared notebook every step reads and updates. A checkpointer saves it, so a run can pause and resume.
  - interrupt() pauses the graph for human approval. Command({ resume }) continues it later.
  - "Simple picture: LangGraph is the flowchart that controls how an agent moves from step to step."
cards:
  - q: What is LangGraph?
    a: A library for building agents as a graph — nodes are steps, edges say what comes next, and shared state carries data between steps.
  - q: What is a checkpointer in LangGraph?
    a: It saves the graph's state after each step, so a run can pause, resume, survive a crash, or keep memory across turns.
  - q: How do you add human approval in LangGraph?
    a: Call interrupt() inside a node. The graph pauses and saves state. Later you resume it with a Command carrying the human's answer.
  - q: What is a conditional edge?
    a: An if/else in the graph — a function looks at the state and returns the name of the next node.
  - q: How does LangGraph relate to a hand-written state machine?
    a: It is the same idea — defined states and transitions — but with built-in saving, pausing, resuming and streaming.
---

## 💡 What is it?

**LangGraph** is a library for building **agents and AI workflows as a graph**.

- **Nodes** are steps, like "call the model" or "run a tool".
- **Edges** say which step comes next. They can include **if/else** and **loops**.
- **State** is a shared notebook. Every step reads it and adds to it.

LangGraph can **save** the state after every step. So a run can **pause** (for example, to wait for a human), then **resume** later.

## 🏠 Real-life example

Think of a **board game like Snakes and Ladders**.

- Each **square** = a node (a step).
- The **arrows, snakes and ladders** = edges. Some depend on your dice roll, like an if/else.
- **Your counter's position and score** = the state.
- **Writing your position in a notebook** before dinner = the checkpointer. After dinner, you continue from the same square.
- **"Ask the teacher before climbing this ladder"** = interrupt for human approval.

## 🧑‍💻 Code example

A screening-call flow with a human approval pause. It uses no AI model, so no API key is needed.

```bash
npm init -y && npm install @langchain/langgraph @langchain/core
```

Save as `lg-demo.js` and run `node lg-demo.js`.

```js
// lg-demo.js — a LangGraph flow: screening call phases + a human approval pause (no API key needed)
const { StateGraph, Annotation, START, END, MemorySaver, interrupt, Command } = require('@langchain/langgraph'); // LangGraph building blocks

const State = Annotation.Root({                                             // the shared "notebook" every step can read and write
  name: Annotation(),                                                       // the candidate's name
  log: Annotation({ reducer: (old, add) => old.concat(add), default: () => [] }), // a list that each step adds to
  approved: Annotation(),                                                   // did the recruiter approve?
});

const greet = (s) => ({ log: [`Greeted ${s.name}`] });                      // node 1: greeting phase
const ask = (s) => ({ log: ['Asked experience and notice period'] });       // node 2: questions phase
const review = () => {                                                      // node 3: a human must check before we continue
  const answer = interrupt('Approve sending this candidate to the next round?'); // PAUSE here and wait for a human
  return { approved: answer === 'yes', log: [`Recruiter said: ${answer}`] }; // when resumed, save the answer
};
const nextRound = () => ({ log: ['Moved to next round'] });                 // node 4a: approved path
const reject = () => ({ log: ['Kept in pool'] });                           // node 4b: not approved path

const graph = new StateGraph(State)                                         // build the graph on our state
  .addNode('greet', greet).addNode('ask', ask).addNode('review', review)    // add the nodes (steps)
  .addNode('nextRound', nextRound).addNode('reject', reject)                // add the two end nodes
  .addEdge(START, 'greet').addEdge('greet', 'ask').addEdge('ask', 'review') // fixed edges: the normal order
  .addConditionalEdges('review', (s) => (s.approved ? 'nextRound' : 'reject')) // if/else edge after review
  .addEdge('nextRound', END).addEdge('reject', END)                         // both paths finish
  .compile({ checkpointer: new MemorySaver() });                            // checkpointer = saves state so we can pause and resume

async function main() {                                                     // async so we can await
  const config = { configurable: { thread_id: 'call-42' } };                // thread_id = which saved conversation this is
  const first = await graph.invoke({ name: 'Asha' }, config);               // run until the pause
  console.log('Paused with question:', first.__interrupt__[0].value);       // the question waiting for a human
  console.log('Log so far:', first.log);                                    // what happened before the pause
  const done = await graph.invoke(new Command({ resume: 'yes' }), config);  // the human answers "yes" → resume
  console.log('Final log:', done.log);                                      // the full story
}

main();                                                                     // run it
```

**Output** (tested with `@langchain/langgraph` 1.4):

```text
Paused with question: Approve sending this candidate to the next round?
Log so far: [ 'Greeted Asha', 'Asked experience and notice period' ]
Final log: [
  'Greeted Asha',
  'Asked experience and notice period',
  'Recruiter said: yes',
  'Moved to next round'
]
```

**What to notice:** the first `invoke` stops at `review`. The second `invoke` uses the same `thread_id`, so it continues from the saved state, not from the start.

## 🔍 Deeper version

**Core ideas:**

| Idea | Meaning |
|---|---|
| **State** | A typed object shared by all nodes. Each node returns only the fields it changes. |
| **Reducer** | How an update is merged. Here `log` uses `concat`, so new items are added, not replaced. |
| **Node** | A function `(state) => partial update`. It can call an LLM, a tool, or plain code. |
| **Edge** | A fixed "next step". `START` and `END` are special nodes. |
| **Conditional edge** | A function that reads the state and returns the next node's name. This is how loops work: route back to "call model" until done. |
| **Checkpointer** | Saves state after each step, per `thread_id`. `MemorySaver` keeps it in memory for demos. In production you'd use a database-backed saver. |
| **interrupt / Command** | Pause for a human, then resume with their answer. |

**A typical agent graph** has two nodes and a loop: `model` → (if a tool was requested) → `tools` → back to `model` → (if no tool) → `END`. LangChain 1.0's `createAgent` builds this graph for you.

**Why the checkpointer matters:**
- **Human-in-the-loop** — pause for approval, resume hours later.
- **Crash recovery** — resume from the last saved step instead of starting again.
- **Memory** — the same `thread_id` continues a conversation.
- **Time travel / debugging** — look at the state at any past step.

**Connection to state machines.** LangGraph is a [state machine](topic:architecture/state-machines) with extras. My [voice agent's phase-based state machine](topic:resume/voice-state-machine) uses the same idea: defined phases, and rules for moving between them. LangGraph adds built-in saving, pausing and streaming.

**When to use it vs. a simple loop.** For a small tool loop, a hand-written `while` loop is fine (see [AI agents](topic:ai/agents)). Reach for LangGraph when you need branching, long-running runs, approvals, recovery after crashes, or several agents.

## 🎯 Why do we use it?

Real agents need more than a simple loop. They need **if/else branches**, **retries**, **pauses for human approval**, and the ability to **resume after a crash**. Writing all of that by hand is slow and error-prone.

LangGraph gives you these as standard features. You draw the flow as a graph, and the library handles saving and resuming.

## ⚠️ Common mistakes

- **Forgetting the checkpointer.** Without it, `interrupt()` can't pause and resume.
- **Using a different `thread_id` when resuming**, which starts a new run instead.
- **Returning the whole state from every node.** Return only the fields that changed.
- **Using a graph for a two-step task.** A simple function or loop is clearer.

## 🗣️ How to answer in an interview

> "LangGraph is a library for building agents as a graph. Nodes are steps like calling the model or running a tool. Edges decide what comes next, and conditional edges give you if/else and loops. All nodes share a typed state, and each node returns only what it changes.
>
> Its big strength is the checkpointer. It saves state after every step per thread, so a run can pause for human approval with interrupt, resume later with a Command, recover after a crash, and keep memory across turns.
>
> It's very close to the phase-based state machine I used in my voice agent: defined phases and transitions. LangGraph adds the saving and resuming for you."

[FILL IN: say honestly whether you've used LangGraph itself. If not: "I built the voice agent's state machine by hand, and I've practised LangGraph separately."]

## 🔁 Follow-up questions

### What does `thread_id` do?

It names one saved run or conversation. Using the same `thread_id` continues from the saved state. A new one starts fresh.

### How would you build a tool-calling agent in LangGraph?

Two nodes — `model` and `tools` — with a conditional edge after `model`. If the model asked for a tool, go to `tools`, then back to `model`. If not, go to `END`.

### What is a reducer?

A rule for merging a node's update into the state. For a list, it might add new items. Without one, the new value replaces the old one.

### Where should checkpoints be stored in production?

In a persistent store, like a database, not in memory. Then runs survive restarts and can resume on any server.

## ✅ Quick check

### 1. In the code above, which node is running when the graph pauses?

:::answer
`review`. It calls `interrupt()`, which saves the state and stops the run.
:::

### 2. If the recruiter resumes with `'no'`, what is the last log line?

:::answer
`Kept in pool`. The conditional edge sends `approved: false` to the `reject` node.
:::

### 3. True or false: without a checkpointer, `interrupt()` can still pause and resume the run.

:::answer
**False.** Pausing and resuming needs saved state, which is the checkpointer's job.
:::
