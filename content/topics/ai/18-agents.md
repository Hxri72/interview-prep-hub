---
title: AI agents
stack: ai
order: 18
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "An AI agent is an LLM working in a loop: it thinks, picks a tool, looks at the result, and repeats until the goal is done."
  - "Simple formula: agent = LLM + tools + a loop + memory + a goal."
  - Your code runs the tools. The model only asks for them.
  - Always set limits — a maximum number of steps, allowed tools only, and a time or cost budget.
  - Use an agent only when the steps can't be planned in advance. Otherwise a fixed workflow is cheaper and safer.
cards:
  - q: What is an AI agent?
    a: An LLM in a loop with tools and a goal. It decides the next step, your code runs the tool, the result goes back to the model, and it repeats until done.
  - q: What are the five parts of an agent?
    a: The LLM (the brain), tools (actions), a loop, memory (what happened so far), and a goal.
  - q: Why does an agent need a maximum number of steps?
    a: Without it, a confused agent can loop forever, call tools again and again, and burn time and money.
  - q: Agent vs workflow — what's the difference?
    a: In a workflow, your code decides the order of steps. In an agent, the model decides the next step at run time.
  - q: Who actually runs the tool — the model or your code?
    a: Your code. The model only replies "please call this tool with these inputs". Your code runs it and sends back the result.
---

## 💡 What is it?

An **AI agent** is an [LLM](glossary:llm) that works in a **loop**.

It looks at a goal and decides the next step. It asks your code to run a **tool**, like "search candidates". It looks at the result. Then it decides again. It stops when the goal is done.

A simple formula helps: **agent = LLM + tools + loop + memory + goal**.

## 🏠 Real-life example

Think of a **student doing a school project** with a teacher's goal: "Find three facts about Kerala's rivers."

- The **student's brain** = the LLM. It decides what to do next.
- The **library, the internet, a calculator** = the tools.
- **"Read, think, look again"** = the loop.
- The **notebook** where the student writes what they found = the memory.
- The **teacher's question** = the goal.
- The **rule "finish in one hour"** = the maximum steps limit.

The student doesn't know every step at the start. They find one fact, then decide where to look next. That's exactly how an agent works.

## 🧑‍💻 Code example

This agent uses a **fake LLM**, so it runs without an API key. Save it as `agent.js` and run `node agent.js`.

```js
// agent.js — a tiny AI agent loop with a fake "LLM", so it runs without any API key
const tools = {                                                     // the tools the agent is allowed to use
  searchCandidates: ({ skill }) =>                                  // tool 1: find candidates by skill
    [{ id: 'c1', name: 'Asha', skill }, { id: 'c2', name: 'Ravi', skill }], // fake database result
  getExperience: ({ id }) => ({ c1: 5, c2: 2 })[id],                // tool 2: years of experience for one candidate
};

function fakeLLM(memory) {                                          // pretends to be the model: decides the next step
  const last = memory[memory.length - 1];                           // look at the most recent thing that happened
  if (last.role === 'goal') return { tool: 'searchCandidates', args: { skill: 'Node.js' } }; // step 1: search
  if (last.tool === 'searchCandidates') return { tool: 'getExperience', args: { id: 'c1' } }; // step 2: check Asha
  if (last.tool === 'getExperience' && last.args.id === 'c1') return { tool: 'getExperience', args: { id: 'c2' } }; // step 3: check Ravi
  return { final: 'Shortlist: Asha (5 years). Ravi has only 2 years.' };  // step 4: enough info → answer
}

function runAgent(goal, maxSteps = 5) {                             // maxSteps = safety limit so it can't loop forever
  const memory = [{ role: 'goal', text: goal }];                    // memory = everything seen so far
  for (let step = 1; step <= maxSteps; step++) {                    // the loop: think → act → observe → repeat
    const decision = fakeLLM(memory);                               // THINK: the "model" picks the next action
    if (decision.final) return `Step ${step}: DONE → ${decision.final}`; // the model says it is finished
    const result = tools[decision.tool](decision.args);             // ACT: our code runs the chosen tool
    console.log(`Step ${step}: ${decision.tool}(${JSON.stringify(decision.args)}) →`, JSON.stringify(result)); // show what happened
    memory.push({ tool: decision.tool, args: decision.args, result }); // OBSERVE: save the result in memory
  }
  return 'Stopped: reached maxSteps without finishing';             // safety stop
}

console.log(runAgent('Find Node.js candidates with 3+ years'));    // start the agent with a goal
```

**Output:**

```text
Step 1: searchCandidates({"skill":"Node.js"}) → [{"id":"c1","name":"Asha","skill":"Node.js"},{"id":"c2","name":"Ravi","skill":"Node.js"}]
Step 2: getExperience({"id":"c1"}) → 5
Step 3: getExperience({"id":"c2"}) → 2
Step 4: DONE → Shortlist: Asha (5 years). Ravi has only 2 years.
```

**What to notice:** the model never runs anything itself. It only *chooses*. Your code runs the tool and writes the result into memory.

## 🔍 Deeper version

**The real loop with an LLM API.** Swap `fakeLLM` for a real model call. You send the goal, the tool list and the memory (the message history). The model replies in one of two ways:
- **A tool request** (with Claude, `stop_reason` is `"tool_use"`). Your code runs the tool. You send back a `tool_result` block. Then you loop.
- **A final answer** (`stop_reason` is `"end_turn"`). You stop.

```ts
// Sketch of the real loop (TypeScript, Anthropic SDK). Needs an API key.
const messages = [{ role: "user", content: goal }];                 // memory = the conversation so far
for (let step = 0; step < MAX_STEPS; step++) {                       // the safety limit again
  const res = await client.messages.create({ model: "claude-opus-5-5", max_tokens: 16000, tools, messages }); // THINK
  messages.push({ role: "assistant", content: res.content });        // keep the model's turn in memory
  if (res.stop_reason !== "tool_use") break;                          // no tool requested → it's done
  const results = [];                                                // collect every tool result for this turn
  for (const block of res.content) {                                 // the model can ask for several tools at once
    if (block.type !== "tool_use") continue;                         // skip plain text blocks
    const output = await runTool(block.name, block.input);           // ACT: your code runs the tool
    results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(output) }); // link result to request
  }
  messages.push({ role: "user", content: results });                 // OBSERVE: all results go back in ONE message
}
```

The Anthropic SDKs also have a **tool runner** helper that writes this loop for you. See [tool calling](topic:ai/tool-calling) for how tools are described.

**Workflow vs agent.**

| | Workflow | Agent |
|---|---|---|
| Who decides the next step? | Your code | The model, at run time |
| Predictable? | Very | Less |
| Cost and speed | Lower, fixed | Higher, varies |
| Good for | Known steps ("summarise, then save") | Open tasks ("research and shortlist") |

A good rule: **start with the simplest thing that works.** One LLM call is often enough. Use a workflow next. Use an agent only when the steps truly can't be planned.

**Memory.** Short-term memory is the message history in the [context window](topic:ai/context-window). Long tasks fill it up. Fixes are summarising old turns, clearing old tool results, or saving notes to a database and reading them back.

**Limits every production agent needs:**
- **Max steps** and a **time or token budget**.
- **Allowed tools only** — never give an agent a tool it doesn't need.
- **Validate tool inputs** before running them. The model can send wrong or missing fields.
- **Human approval** before risky actions like payments or sending emails. See [multi-agent systems](topic:ai/agentic-multi-agent).
- **Logs** of every step, so you can debug a bad run.

## 🎯 Why do we use it?

Some tasks can't be written as a fixed list of steps. "Find good candidates and draft emails" depends on what each search returns. An agent can adapt: search again, check another candidate, or stop early.

Agents also let one model use **real, fresh data** through tools. The model alone only knows its training data.

## ⚠️ Common mistakes

- **No step limit.** A confused agent loops forever and burns money.
- **Too many tools.** The model picks the wrong one more often. Give it only what the task needs.
- **Trusting tool inputs blindly.** Always validate them, like any user input.
- **Using an agent for a fixed task.** If you know the steps, a plain workflow is cheaper, faster and easier to test.

## 🗣️ How to answer in an interview

> "An AI agent is an LLM running in a loop with tools and a goal. On each step, the model looks at the goal and what has happened so far, then either asks for a tool call or gives a final answer. My code runs the tool, sends the result back, and the loop continues. So the formula is LLM plus tools plus a loop plus memory plus a goal.
>
> The model never runs anything itself — it only chooses. That's important for safety. I always add limits: a maximum number of steps, only the tools the task needs, input validation, and human approval before risky actions like sending emails.
>
> I'd also only use an agent when the steps can't be planned. If the steps are known, a fixed workflow is cheaper and more predictable."

[FILL IN: if you've built or used an agent-style loop (for example in the voice agent or the JD chatbot backend), add one honest line here.]

## 🔁 Follow-up questions

### How is an agent different from a chatbot?

A chatbot answers one message at a time. An agent works towards a goal over many steps, using tools, and decides its own next step.

### What happens if a tool fails?

Send the error back to the model as the tool result, marked as an error. A good model will retry, try another tool, or explain the problem. Don't silently drop the failed call.

### How do you stop an agent from doing something dangerous?

Give it only safe tools. Validate every tool input. Put a human approval step before risky actions. Set step, time and cost limits. Log everything.

### What is "memory" for an agent?

Short-term memory is the conversation history in the context window. Long-term memory is notes saved outside, like in a database, that the agent can read later.

## ✅ Quick check

### 1. Run the agent above with `maxSteps = 2`. What is printed last?

:::answer
`Stopped: reached maxSteps without finishing`. Steps 1 and 2 run the tools, then the loop ends before the model can give its final answer.
:::

### 2. True or false: in an agent, the LLM itself connects to your database and runs the query.

:::answer
**False.** The LLM only asks for a tool call. Your code runs the query and sends the result back.
:::

### 3. You must "summarise a resume, then save it". Agent or workflow?

:::answer
**Workflow.** The steps are known and fixed. An agent would add cost and risk for no benefit.
:::
