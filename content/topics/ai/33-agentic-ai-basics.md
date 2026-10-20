---
title: "Agentic AI for beginners: from chatbot to agent"
stack: ai
order: 33
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Four steps up the ladder: a plain LLM call → a chatbot with history → a workflow (your code fixes the steps) → an agent (the LLM picks the next step, in a loop)."
  - "\"Agentic\" means the AI takes some actions by itself: it plans, uses tools and checks results, instead of only answering."
  - Use a workflow when you know the steps in advance. Use an agent only when the steps change from case to case.
  - Your code always runs the tools. The model only asks for them.
  - Risky actions (sending emails, payments, rejecting candidates) need a human "yes" first.
cards:
  - q: What is the difference between a workflow and an agent?
    a: In a workflow, your code decides the order of steps. In an agent, the LLM decides the next step at run time, using tools, in a loop.
  - q: What does "agentic AI" mean in a job description?
    a: AI that does multi-step work by itself — it plans, calls tools (APIs, database queries), looks at the results and continues until a goal is done.
  - q: When should you NOT build an agent?
    a: When the steps are always the same. A fixed workflow is cheaper, faster, easier to test and safer.
  - q: Name the four steps of the ladder from plain LLM to agent.
    a: Plain LLM call, chatbot with history, workflow (fixed steps), agent (model-chosen steps with tools in a loop).
  - q: Why do agents need human approval for some actions?
    a: The model can make mistakes. For actions that are hard to undo, like emailing a candidate, a person should confirm first.
---

## 💡 What is it?

**Agentic AI** means an AI that does work **by itself**, step by step, instead of only answering one question.

It looks at a goal, picks a next step, uses a **tool** (like a database search), checks the result, and continues. A program built like this is called an [agent](glossary:agent).

Most AI features are **not** agents. They sit lower on a "ladder" with four steps.

## 🏠 Real-life example

Think about **getting lunch at school**.

1. **Asking the canteen one question:** "What's today's lunch?" You get one answer. That's a **plain LLM call**.
2. **Chatting with the canteen staff:** they remember what you said a minute ago. That's a **chatbot with history**.
3. **Following the lunch-line rules:** take a tray, pick rice, pick curry, pay. The steps never change. That's a **workflow**.
4. **Asking a senior to "arrange lunch for the class trip":** they decide what to do first, call the caterer, check the budget, and come back to ask the teacher before paying. That's an **agent**.

- The **senior's thinking** = the [LLM](glossary:llm) deciding the next step.
- The **phone, the menu, the budget sheet** = tools.
- **Calling, checking, deciding again** = the loop.
- **Asking the teacher before paying** = human approval for risky actions.

## 🧑‍💻 Code example

The same job done two ways: a **fixed workflow** and a tiny **agent loop**. The "model" is fake, so no API key is needed. Save it as `ladder.js` and run `node ladder.js`.

```js
// ladder.js — the same job done two ways: a fixed workflow vs a tiny agent loop (fake LLM, no API key)
const candidates = [                                      // a tiny fake candidate database
  { name: 'Asha', skill: 'Node.js', years: 5 },           // a good match
  { name: 'Ravi', skill: 'Node.js', years: 1 },           // too junior
  { name: 'Meena', skill: 'React', years: 4 },            // wrong skill
];                                                        // end of the database

// ---- Way 1: a WORKFLOW. Your code decides every step, in a fixed order. ----
function workflow(skill, minYears) {                      // the steps never change
  const found = candidates.filter((c) => c.skill === skill); // step 1: search by skill
  const good = found.filter((c) => c.years >= minYears);  // step 2: keep experienced ones
  return good.map((c) => `Draft invite to ${c.name}`);    // step 3: draft one invite each
}                                                         // end of workflow
console.log('WORKFLOW:', workflow('Node.js', 3));         // run it once and print the result

// ---- Way 2: an AGENT. The "model" picks the next step; your code runs it. ----
const tools = {                                           // the actions the agent may ask for
  search: ({ skill }) => candidates.filter((c) => c.skill === skill), // tool: search by skill
  draftInvite: ({ name }) => `Draft invite to ${name}`,   // tool: write a draft (safe action)
};                                                        // end of tools

function fakeModel(history) {                             // pretends to be the LLM deciding what to do
  const last = history[history.length - 1];               // look at the latest result
  if (!last) return { tool: 'search', input: { skill: 'Node.js' } }; // nothing yet → search first
  if (last.tool === 'search') {                           // we just got search results
    const best = last.output.find((c) => c.years >= 3);   // the model "reasons" about who fits
    return best ? { tool: 'draftInvite', input: { name: best.name } } : { done: 'No good match' }; // next step
  }                                                       // end of the search branch
  return { done: last.output };                           // after drafting, the goal is met → stop
}                                                         // end of fakeModel

const history = [];                                       // the agent's short-term memory
for (let step = 1; step <= 5; step++) {                   // safety limit: at most 5 steps
  const decision = fakeModel(history);                    // ask the "model" what to do next
  if (decision.done) { console.log(`AGENT done after ${step - 1} tool calls:`, decision.done); break; } // stop
  const output = tools[decision.tool](decision.input);    // YOUR code runs the chosen tool
  console.log(`AGENT step ${step}: ${decision.tool}`, JSON.stringify(decision.input)); // log each step
  history.push({ tool: decision.tool, output });          // remember the result for the next turn
}                                                         // end of the loop
```

**Output:**

```text
WORKFLOW: [ 'Draft invite to Asha' ]
AGENT step 1: search {"skill":"Node.js"}
AGENT step 2: draftInvite {"name":"Asha"}
AGENT done after 2 tool calls: Draft invite to Asha
```

**What to notice:** both give the same answer here. The difference is **who decides the steps**. In the workflow, you wrote the order. In the agent, the model chose "search" first and "draftInvite" second. In a real app, a real LLM makes that choice.

## 🔍 Deeper version

**The ladder in detail:**

| Step | Who decides the steps? | Example in a hiring platform | Risk and cost |
|---|---|---|---|
| Plain LLM call | Nobody — one question, one answer | "Summarise this resume" | Lowest |
| Chatbot with history | Nobody — it just remembers the chat | A help chat for recruiters | Low |
| Workflow | **Your code** | "Parse resume → score it → save" every time | Medium, easy to test |
| Agent | **The LLM**, at run time | "Find 3 good Node.js candidates and draft invites" | Highest — needs limits |

**What makes it "agentic":** the model can choose a [tool](topic:ai/tool-calling), read the result, and choose again. A loop around "model → tool → result" is the core. The full theory is in [AI agents](topic:ai/agents).

**Autonomy levels** (how much the agent may do alone):

1. **Suggest only** — the agent drafts; a human does everything.
2. **Act with approval** — the agent acts, but risky steps wait for a "yes". This is a [human-in-the-loop](glossary:human-in-the-loop) design.
3. **Act alone within limits** — safe actions only, with a step limit and a budget.
4. **Fully autonomous** — rare in real products, because mistakes are costly.

Most hiring products sit at level 2. Reading data is fine. Emailing a candidate, rejecting someone or charging money needs approval.

**When you DON'T need an agent:**
- The steps are always the same. → Use a workflow.
- One LLM call can do it. → Use a plain call with [structured output](topic:ai/structured-outputs).
- Mistakes are expensive and hard to undo. → Keep a human in control.

**What "agentic" means in job descriptions:** usually "you can connect an LLM to your APIs and database with tools, run it in a loop safely, and log what it does". Multi-agent systems and frameworks like [LangGraph](topic:ai/langgraph) are the next level. See [multi-agent systems](topic:ai/agentic-multi-agent).

**Safety basics:** a maximum number of steps, allowed tools only, input checks, logging every step, and defending against [prompt injection](glossary:prompt-injection) (hidden instructions in data). See [prompt injection and guardrails](topic:ai/prompt-injection-guardrails).

## 🎯 Why do we use it?

Some tasks can't be planned step by step in advance. "Find good candidates" might need one search, or three searches with different skills. An agent adapts to what it finds.

A workflow would need you to code every possible path. An agent lets the model choose the path, while your code keeps control of what is allowed.

## ⚠️ Common mistakes

- **Building an agent when a workflow is enough.** It costs more, is slower, and is harder to test.
- **No step limit.** A confused agent can loop forever and burn money.
- **Letting the agent do risky things alone.** Emails, payments and rejections need a human "yes".
- **Thinking the model runs the tools.** It only asks. Your code runs them, so your code must check every request.

## 🗣️ How to answer in an interview

> "I think of it as a ladder. A plain LLM call answers one question. A chatbot adds conversation history. A workflow is when my code decides the steps, like parse, score, then save. An agent is when the LLM decides the next step itself, calls tools like a database search, reads the result and loops until the goal is done.
>
> I only use an agent when the steps really change from case to case. Otherwise a workflow is cheaper and easier to test. For agents I always add a step limit, allow only specific tools, validate the tool inputs, log every step, and ask a human before risky actions like emailing a candidate.
>
> My own closest experience is my AI voice agent. Claude decides what to say, but my code controls the call phases as a state machine, so it's a controlled, workflow-style design. In the JD chatbot backend, I validate the AI's output before anything is saved, and it's saved only after the recruiter confirms. I haven't built a general tool-using agent in production yet. [FILL IN: add a practice agent you built, once you've built one.]"

## 🔁 Follow-up questions

### Is a chatbot an agent?

Not usually. A chatbot only answers and remembers the chat. It becomes an agent when it can choose and run tools in a loop to reach a goal.

### What's the difference between "agentic AI" and "generative AI"?

Generative AI creates content: text, images, code. Agentic AI uses a generative model to **take actions** — call tools, check results and continue — towards a goal.

### How do you keep an agent safe?

A step limit, a fixed list of allowed tools, input validation, logging, a time and cost budget, and human approval for risky actions. Also treat any text the agent reads as untrusted, because of prompt injection.

### Would you build the voice agent as a "real" agent?

It's a phase-based state machine: the code controls the phases, and Claude decides what to say inside each phase. That's more predictable than a free agent, which matters on a live phone call.

## ✅ Quick check

### 1. "Every new resume: extract skills, score them, save the score." Workflow or agent?

:::answer
**Workflow.** The steps are always the same, so your code can fix the order. An agent would add cost and risk for no benefit.
:::

### 2. In the code example, what happens if `fakeModel` keeps asking for `search` forever?

:::answer
The loop stops after **5 steps** because of `step <= 5`. Without that limit, it would run forever. That's why every agent needs a maximum number of steps.
:::

### 3. True or false: in an agent, the LLM connects to MongoDB and runs the query itself.

:::answer
**False.** The LLM only asks for a tool with some inputs. Your code checks the inputs, runs the query and sends the result back.
:::
