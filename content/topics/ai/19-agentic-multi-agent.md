---
title: Agentic AI and multi-agent systems
stack: ai
order: 19
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - "\"Agentic\" means the AI acts with some independence: it plans and takes several steps by itself."
  - A multi-agent system splits a big job between smaller, specialised agents, like a researcher and a writer.
  - A manager (orchestrator) decides which agent works next and passes results between them.
  - Risky actions — sending emails, payments, deleting data — need a human approval step.
  - More agents means more cost and more places to fail. Start with one agent and split only when needed.
cards:
  - q: What does "agentic AI" mean?
    a: AI that acts with some independence — it plans and takes several steps towards a goal, instead of answering one question.
  - q: What is a multi-agent system?
    a: Several specialised agents working on one job, for example a researcher agent and a writer agent, coordinated by an orchestrator.
  - q: Why put a human approval step in an agent system?
    a: Some actions can't be undone, like sending emails or making payments. A person checks them before they happen.
  - q: When should you NOT use multiple agents?
    a: When one agent (or a simple workflow) can do the job. Extra agents add cost, delay and more ways to fail.
  - q: What is an orchestrator?
    a: The "manager" that breaks the job into parts, gives each part to the right agent, and combines the results.
---

## 💡 What is it?

**Agentic AI** means AI that **acts with some independence**. It plans and takes several steps by itself, instead of answering just one question.

A **multi-agent system** splits a big job between **several smaller agents**. Each one has its own skill, like "research" or "write". A **manager**, called the **orchestrator**, decides who works next.

For risky steps, a **human approves** before the action happens.

## 🏠 Real-life example

Think of a **school annual day**.

- The **principal** = the orchestrator. They give out the jobs and check progress.
- The **decoration team** = one agent with one skill.
- The **stage team** = another agent with a different skill.
- The **invitation team** writes letters to parents = a third agent.
- Before invitations go out, **the principal signs every letter** = human approval for a risky action.

Each team is good at one thing. The principal makes sure they work together. And nothing goes to parents without a signature.

## 🧑‍💻 Code example

Two fake agents and an approval gate. No API key is needed. Save it as `multi.js` and run `node multi.js`.

```js
// multi.js — two small "agents" work together, and a human must approve the risky step
const researcher = (task) =>                                        // agent 1: finds facts (fake, no API key needed)
  ({ shortlist: ['Asha', 'Meena'], note: `Found 2 candidates for: ${task}` }); // returns its findings
const writer = (facts) =>                                           // agent 2: writes emails from the facts
  facts.shortlist.map((name) => `Hi ${name}, can we schedule a call?`); // one draft email per candidate

function sendEmails(drafts, approved) {                             // the risky action: emails leave the company
  if (!approved) return 'BLOCKED: waiting for human approval';      // no approval → do nothing
  return `SENT ${drafts.length} emails`;                            // approval given → send them
}

function orchestrator(task, humanSaysYes) {                         // the "manager" that runs the agents in order
  const facts = researcher(task);                                   // step 1: research
  console.log('Researcher:', facts.note);                           // show what the researcher found
  const drafts = writer(facts);                                     // step 2: write drafts
  console.log('Writer:', drafts);                                   // show the drafts
  console.log('Action:', sendEmails(drafts, humanSaysYes));         // step 3: risky action needs approval
}

orchestrator('Node.js developer, 3+ years', false);                 // run 1: the human has not approved yet
orchestrator('Node.js developer, 3+ years', true);                  // run 2: the human clicked "Approve"
```

**Output:**

```text
Researcher: Found 2 candidates for: Node.js developer, 3+ years
Writer: [
  'Hi Asha, can we schedule a call?',
  'Hi Meena, can we schedule a call?'
]
Action: BLOCKED: waiting for human approval
Researcher: Found 2 candidates for: Node.js developer, 3+ years
Writer: [
  'Hi Asha, can we schedule a call?',
  'Hi Meena, can we schedule a call?'
]
Action: SENT 2 emails
```

In a real system, each agent would be an LLM with its own instructions and tools (see [AI agents](topic:ai/agents)). The approval would come from a button in an admin screen.

## 🔍 Deeper version

**Common multi-agent shapes:**

| Shape | How it works | Example |
|---|---|---|
| **Orchestrator + workers** | A manager splits the job and hands parts to workers | Research 10 candidates in parallel, then summarise |
| **Pipeline** | Agent A's output is agent B's input | Researcher → writer → reviewer |
| **Reviewer / critic** | One agent checks another's work | A "checker" agent grades a draft email |
| **Agents as tools** | The main agent calls another agent like a tool | "Ask the SQL agent for this number" |

**Why split at all?**
- **Smaller context.** Each worker only sees what it needs, so its context window stays clean.
- **Parallel work.** Ten workers can read ten documents at the same time.
- **Specialised instructions.** A "writer" prompt and a "researcher" prompt can be very different.
- **Cheaper models for easy parts.** Workers that only read or extract can use a small, cheap model.

**The costs.** Every agent is more LLM calls, more tokens and more latency. Messages between agents can lose details. Errors can pass from one agent to the next. Debugging is harder, because you must trace many conversations. So the advice is: **start with one agent and split only when you have a clear reason.**

**Human-in-the-loop.** "Human-in-the-loop" means a person approves important steps before the AI continues. Good places for it:
- anything that **leaves the company**: emails, messages, calls
- **money**: payments, refunds
- anything **hard to undo**: deleting data, changing permissions

The system **pauses**, saves its state, and waits. When the person approves, it **resumes** from the same point. [LangGraph](topic:ai/langgraph) has built-in support for this pause-and-resume pattern.

**Other limits for agentic systems:** a step and cost budget, allowed tools per agent, timeouts, and logs that show which agent did what.

## 🎯 Why do we use it?

Big jobs are easier when split into smaller parts, just like in a team of people. Specialised agents with focused instructions are often more reliable than one agent trying to do everything.

The human approval step keeps the system **safe**. AI can draft, search and prepare. A person still decides on actions that matter.

## ⚠️ Common mistakes

- **Splitting too early.** Many tasks only need one agent or even one LLM call.
- **No approval step** for emails, payments or deletes.
- **Passing too little context** between agents, so the next agent misses key details.
- **No overall budget.** Five agents with five step limits can still cost a lot together.

## 🗣️ How to answer in an interview

> "Agentic AI means the AI plans and takes several steps by itself, not just answers one question. A multi-agent system splits a big job between specialised agents — for example a researcher, a writer and a reviewer — with an orchestrator that hands out the work and combines the results.
>
> The benefits are smaller, cleaner context for each agent, parallel work, and cheaper models for easy parts. The costs are more tokens, more latency, and harder debugging. So I'd start with one agent and split only when there's a clear reason.
>
> For anything risky — sending emails, payments, deleting data — I'd add a human approval step. The system pauses, saves its state, and resumes only after a person approves."

[FILL IN: if your voice agent or another project has an approval or review step, describe it in one honest line.]

## 🔁 Follow-up questions

### How do agents share information?

Usually the orchestrator passes the output of one agent as input to the next. Some systems also use a shared store, like a database or a shared state object.

### How would you debug a multi-agent system?

Log every agent's input, output, tool calls and tokens, with one trace ID for the whole job. Then you can follow the job step by step and find where it went wrong.

### How do you control cost with many agents?

Set one total budget for the whole job, not just per agent. Use smaller models for simple workers. Stop early when the goal is met.

### What is human-in-the-loop?

A person approves important steps before the AI continues. The system pauses, waits for the decision, then resumes.

## ✅ Quick check

### 1. In the code above, what does run 1 print for "Action", and why?

:::answer
`BLOCKED: waiting for human approval`. `humanSaysYes` is `false`, so `sendEmails` refuses to send.
:::

### 2. Which action most needs human approval?

- A) Summarising a resume
- B) Searching candidates
- C) Sending offer emails to 50 candidates

:::answer
**C.** It leaves the company and can't be undone. A and B are safe, read-only steps.
:::

### 3. True or false: more agents always give better results.

:::answer
**False.** More agents add cost, delay and failure points. Use them only when the split clearly helps.
:::
