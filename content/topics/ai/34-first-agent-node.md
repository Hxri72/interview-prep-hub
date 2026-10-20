---
title: Build your first AI agent in Node.js
stack: ai
order: 34
level: Basic
mustKnow: true
askedFrequency: common
summary:
  - "An agent has four parts you write: tools, a description of them for the model, a loop, and a stop condition."
  - Check every tool input with Zod before running anything. The model can send wrong or dangerous inputs.
  - Always set a maximum number of steps and a timeout for each tool.
  - Log every step (which tool, which inputs, what result). It is the only way to debug an agent.
  - Put a human-approval gate before risky tools like sending an email.
cards:
  - q: What are the four things you write to build an agent?
    a: The tools (functions), a description of each tool for the model, the loop (call model → run tool → send result back), and a stop condition.
  - q: Why validate tool inputs with Zod if the model "knows" the schema?
    a: The model can still send wrong types, missing fields or bad values. Your code must never trust model output blindly.
  - q: What should happen when a tool fails?
    a: Send the error back to the model as the tool result, so it can try something else or explain the problem. Don't crash the loop.
  - q: When does a Claude agent loop stop?
    a: When the response's stop_reason is not "tool_use" (the model gave a final answer), or when your maximum-step limit is reached.
  - q: What is an approval gate?
    a: A check in your code that pauses a risky tool, like sendEmail, until a human says yes. If they say no, the tool result says "human declined".
---

## 💡 What is it?

This page builds a small **AI [agent](glossary:agent)** in Node.js, step by step.

The agent gets a goal: "Invite the best Node.js candidate for job j1". It reads the job, searches candidates, and asks to send an email. Your code runs each tool, checks the inputs, and asks a human before the email goes out.

You will first use a **mock model**, so no API key is needed. Then you'll see the same loop with the real Claude SDK.

## 🏠 Real-life example

Think of a **new class monitor** with a list of jobs from the teacher.

- The **monitor's brain** = the model. It decides what to do next.
- The **school office, the attendance register, the notice board** = the tools.
- **Rules like "only use the office phone for school work"** = input checks (Zod).
- **"You get 10 minutes for this"** = the step limit and the timeout.
- **Writing down what they did in a notebook** = logging each step.
- **"Ask the teacher before sending any letter home"** = the human-approval gate.

The monitor is smart, but the school still keeps rules around them. An agent works the same way.

## 🧑‍💻 Code example

**Setup:** make a folder, then run `npm init -y` and `npm install zod`. Save this as `agent.js` and run `node agent.js`.

```js
// agent.js — your first AI agent: tools + a loop + limits + an approval gate (mock model, no API key)
const { z } = require('zod');                                       // Zod checks the inputs the model sends

const db = [                                                        // pretend MongoDB "candidates" collection
  { id: 'c1', name: 'Asha', email: 'asha@mail.test', skill: 'Node.js', years: 5 }, // a strong match
  { id: 'c2', name: 'Ravi', email: 'ravi@mail.test', skill: 'Node.js', years: 1 }, // too junior
];                                                                  // end of the fake collection
const jobs = { j1: { title: 'Backend Developer', skill: 'Node.js', minYears: 3 } }; // pretend "jobs" collection

const tools = {                                                     // STEP 1: the tools the agent may use
  getJob: {                                                         // tool 1: read one job
    schema: z.object({ jobId: z.string() }),                        // input must be { jobId: "..." }
    run: ({ jobId }) => jobs[jobId] ?? { error: 'job not found' },  // look the job up (or explain the error)
  },                                                                // end of getJob
  searchCandidates: {                                               // tool 2: find matching candidates
    schema: z.object({ skill: z.string(), minYears: z.number().min(0) }), // a skill and a number ≥ 0
    run: ({ skill, minYears }) => db.filter((c) => c.skill === skill && c.years >= minYears), // the "query"
  },                                                                // end of searchCandidates
  sendEmail: {                                                      // tool 3: a RISKY action
    schema: z.object({ to: z.email(), subject: z.string().min(3) }), // a real email + a short subject
    risky: true,                                                    // true = needs a human "yes" first
    run: ({ to, subject }) => `Email sent to ${to}: "${subject}"`,  // pretend to send it
  },                                                                // end of sendEmail
};                                                                  // end of tools

function mockModel(messages) {                                      // STEP 2: a fake LLM that picks the next tool
  const results = messages.filter((m) => m.role === 'tool');        // what the tools returned so far
  if (results.length === 0) return { tool: 'getJob', input: { jobId: 'j1' } }; // first: read the job
  if (results.length === 1) {                                       // second: search using the job's rules
    const job = results[0].content;                                 // the job we just read
    return { tool: 'searchCandidates', input: { skill: job.skill, minYears: job.minYears } }; // the next call
  }                                                                 // end of step-2 branch
  if (results.length === 2) {                                       // third: email the best candidate
    const best = results[1].content[0];                             // first match from the search
    return { tool: 'sendEmail', input: { to: best.email, subject: 'Interview invite' } }; // a risky call
  }                                                                 // end of step-3 branch
  const last = results[results.length - 1].content;                 // the result of the email step
  if (last.error) return { final: `Could not invite: ${last.error}` }; // a real model reads errors too
  return { final: 'Invited the best candidate.' };                  // nothing left to do → final answer
}                                                                   // end of mockModel

const approve = (call) => call.input.to.endsWith('@mail.test');     // STEP 3: pretend a recruiter clicked "Approve"
const withTimeout = (fn, ms) => Promise.race([Promise.resolve().then(fn), // run the tool...
  new Promise((_, no) => setTimeout(() => no(new Error('tool timed out')), ms))]); // ...or fail after ms

async function runAgent(goal, maxSteps = 6) {                       // STEP 4: the agent loop
  const messages = [{ role: 'user', content: goal }];               // memory starts with the goal
  for (let step = 1; step <= maxSteps; step++) {                    // never more than maxSteps rounds
    const call = mockModel(messages);                               // ask the model what to do next
    if (call.final) return `Final answer: ${call.final}`;           // the model is finished → stop
    const tool = tools[call.tool];                                  // find the tool it asked for
    const parsed = tool?.schema.safeParse(call.input);              // check the inputs BEFORE running anything
    let content;                                                    // the result we will send back
    if (!tool) content = { error: `unknown tool ${call.tool}` };    // the model invented a tool
    else if (!parsed.success) content = { error: parsed.error.issues[0].message }; // bad inputs → tell the model
    else if (tool.risky && !approve(call)) content = { error: 'human declined' };   // the approval gate
    else content = await withTimeout(() => tool.run(parsed.data), 2000); // run it, max 2 seconds
    console.log(`step ${step}: ${call.tool}(${JSON.stringify(call.input)}) ->`, JSON.stringify(content)); // log
    messages.push({ role: 'tool', name: call.tool, content });      // give the result back to the model
  }                                                                 // end of the loop
  return 'Stopped: too many steps';                                 // the safety limit kicked in
}                                                                   // end of runAgent

runAgent('Invite the best Node.js candidate for job j1').then(console.log); // start the agent
```

**Output:**

```text
step 1: getJob({"jobId":"j1"}) -> {"title":"Backend Developer","skill":"Node.js","minYears":3}
step 2: searchCandidates({"skill":"Node.js","minYears":3}) -> [{"id":"c1","name":"Asha","email":"asha@mail.test","skill":"Node.js","years":5}]
step 3: sendEmail({"to":"asha@mail.test","subject":"Interview invite"}) -> "Email sent to asha@mail.test: \"Interview invite\""
Final answer: Invited the best candidate.
```

**Read it in this order:**
1. **STEP 1 — tools:** each tool has a Zod `schema` (what inputs are allowed) and a `run` function. `risky: true` marks tools that need approval.
2. **STEP 2 — the model:** here it's fake. It looks at past tool results and picks the next tool. A real LLM does this from the tool descriptions.
3. **STEP 3 — the approval gate:** `approve()` stands in for a recruiter clicking "Approve" in your app.
4. **STEP 4 — the loop:** ask the model → check the inputs → (approve if risky) → run with a timeout → log → send the result back. Stop on a final answer or at `maxSteps`.

### Try it yourself

1. Run the agent with `runAgent('x', 2)`. What is printed last, and why?

:::answer
`Stopped: too many steps`. The agent needs 3 tool calls plus a final answer, but `maxSteps = 2` stops it early. This is your safety net when an agent goes in circles.
:::

2. Change the subject in `mockModel` from `'Interview invite'` to `'Hi'`. What happens at step 3?

:::answer
Zod rejects it, because the subject needs at least 3 characters. The email is **not** sent. The tool result is `{"error":"Too small: expected string to have >=3 characters"}`, and the final answer is `Could not invite: Too small: expected string to have >=3 characters`.
:::

3. Make `approve` always return `false`. What does the agent do?

:::answer
Step 3 returns `{"error":"human declined"}`, and the final answer is `Could not invite: human declined`. The risky tool never runs. The model reads the error and reports it, which is exactly what you want.
:::

## 🔍 Deeper version

**The same loop with the real Claude SDK.** You describe each tool with a name, a description and a JSON Schema. Claude replies with `stop_reason: "tool_use"` and one or more `tool_use` blocks. You run them and send back `tool_result` blocks, all in **one** user message. This needs `npm install @anthropic-ai/sdk` and an `ANTHROPIC_API_KEY`.

```js
// real-agent.js — the same loop with the real Anthropic SDK (needs ANTHROPIC_API_KEY to run for real)
const Anthropic = require('@anthropic-ai/sdk');                     // the official SDK
const client = new Anthropic();                                     // reads ANTHROPIC_API_KEY from the environment

const tools = [                                                     // tool descriptions the MODEL reads
  {                                                                 // tool 1
    name: 'searchCandidates',                                       // the name the model will call
    description: 'Find candidates with a skill and at least minYears of experience.', // when to use it
    input_schema: {                                                 // JSON Schema for the inputs
      type: 'object',                                               // the input is an object
      properties: { skill: { type: 'string' }, minYears: { type: 'number' } }, // two fields
      required: ['skill', 'minYears'],                              // both are needed
    },                                                              // end of input_schema
  },                                                                // end of tool 1
];                                                                  // end of tools

async function runTool(name, input) {                               // YOUR code runs the tool
  if (name === 'searchCandidates') return JSON.stringify([{ name: 'Asha', years: 5 }]); // fake DB result
  return JSON.stringify({ error: `unknown tool ${name}` });         // never crash on a bad name
}                                                                   // end of runTool

async function main() {                                             // the agent loop
  const messages = [{ role: 'user', content: 'Find a Node.js developer with 3+ years.' }]; // the goal
  for (let step = 1; step <= 6; step++) {                           // max 6 rounds
    const res = await client.messages.create({                      // ask Claude what to do next
      model: 'claude-opus-5-5',                                     // the current default Claude model
      max_tokens: 16000,                                            // room for the reply
      tools,                                                        // the tools Claude may ask for
      messages,                                                     // the whole conversation so far
    });                                                             // end of the request
    messages.push({ role: 'assistant', content: res.content });     // keep Claude's full reply
    if (res.stop_reason !== 'tool_use') {                           // no tool wanted → Claude is done
      const text = res.content.find((b) => b.type === 'text');      // find the text block
      return console.log('Final:', text ? text.text : '(no text)'); // print the answer and stop
    }                                                               // end of the "done" branch
    const results = [];                                             // all tool results for this round
    for (const block of res.content) {                              // Claude may ask for several tools
      if (block.type !== 'tool_use') continue;                      // skip text blocks
      console.log(`step ${step}: ${block.name}`, JSON.stringify(block.input)); // log the call
      results.push({ type: 'tool_result', tool_use_id: block.id, content: await runTool(block.name, block.input) }); // run it
    }                                                               // end of the tool loop
    messages.push({ role: 'user', content: results });              // send ALL results back in one message
  }                                                                 // end of the agent loop
  console.log('Stopped: too many steps');                           // the safety limit
}                                                                   // end of main

main();                                                             // start
```

**Example output** (from a test run with a fake network, so no key was used):

```text
step 1: searchCandidates {"skill":"Node.js","minYears":3}
Final: Asha has 5 years of Node.js. She fits.
```

**How the real loop works:**

| Piece | What it does |
|---|---|
| `tools[].description` | The model reads this to decide **when** to call the tool. Write it clearly. |
| `input_schema` | JSON Schema for the inputs. Add `strict: true` for exact schema matching. |
| `stop_reason === 'tool_use'` | Claude wants tools run. Anything else means it's finished (or stopped for another reason). |
| `tool_result` with `tool_use_id` | Connects each result to the request it answers. |
| `messages.push(res.content)` | Keep Claude's **whole** reply, not just its text. |

:::version[Version note]
On current Claude models (`claude-opus-5-5`), forcing a specific tool with `tool_choice: { type: 'tool' }` or `'any'` returns an error. Use the default `auto`, and say in the prompt which tool to use. The SDK also has a beta **tool runner** helper that writes this loop for you. Write the loop by hand once first, so you understand it.
:::

**Production checklist:**
- **Validate inputs** even when the model follows the schema. Model output is untrusted, just like user input.
- **Return errors as tool results**, with an `is_error` flag in the real API. Never crash the loop.
- **Timeouts** on every tool, so one slow API doesn't freeze the agent.
- **Log** the tool name, inputs, result, time taken and tokens used.
- **Limits:** maximum steps, a token or cost budget, and per-user rate limits.
- **Scope the data:** in a multi-tenant app, every tool query must be filtered by the current tenant. Never trust a tenant id sent by the model.
- **Approval gates** for anything that emails, pays, deletes or rejects. This is a [human-in-the-loop](glossary:human-in-the-loop) design.

More detail: [tool calling](topic:ai/tool-calling), [AI agents](topic:ai/agents), [prompt injection and guardrails](topic:ai/prompt-injection-guardrails), and [Zod](topic:typescript/zod).

## 🎯 Why do we use it?

Writing the loop yourself shows you exactly what an "agent" is: a normal program with a model inside it. Frameworks like [LangChain](topic:ai/langchain) and [LangGraph](topic:ai/langgraph) hide this loop. Knowing it helps you debug them and explain them in interviews.

It also shows where **your code** stays in control: which tools exist, what inputs are allowed, and what needs a human.

## ⚠️ Common mistakes

- **Running tool inputs without checking them.** The model can ask for `minYears: -5` or a made-up email.
- **Throwing an error on a failed tool.** The loop crashes. Send the error back as the tool result instead.
- **Sending tool results in separate messages.** With the real API, return all results of one turn in a single user message.
- **Saving only the text of Claude's reply.** Keep the whole `content` array, including the `tool_use` blocks, or the next request breaks.

## 🗣️ How to answer in an interview

> "To build an agent in Node.js, I write four things: the tools, their descriptions and JSON schemas for the model, the loop, and a stop condition. In the loop, I call the model. If `stop_reason` is `tool_use`, I run each requested tool and send all the results back in one message, then call the model again. It stops when the model gives a final answer or when it hits my maximum-step limit.
>
> Around that loop, I validate every tool input with Zod, add a timeout per tool, return errors as tool results instead of crashing, and log each step. Risky tools like sending an email go through an approval gate, so a recruiter confirms first. In a multi-tenant app, every tool query is filtered by the logged-in tenant, never by a value from the model.
>
> I've applied the validation part in production: in the JD chatbot backend, I mapped and validated the AI's output into the JD shape before preview, and it's saved only after the recruiter confirms. I built this agent loop as practice. [FILL IN: link or name of your practice agent project.]"

## 🔁 Follow-up questions

### How does the model know which tool to call?

From the tool's name, description and input schema, plus the conversation so far. Clear descriptions matter a lot. A vague description leads to wrong or missing tool calls.

### Can the model call two tools at once?

Yes. One reply can contain several `tool_use` blocks. You can run them in parallel, and you must send all their `tool_result` blocks back together in one user message.

### What if the model calls a tool that doesn't exist?

Your code returns an error result like `unknown tool searchJobs`. The model reads it and usually picks a valid tool. Never use `eval` or a dynamic lookup that could run arbitrary code.

### How do you test an agent?

Unit-test each tool on its own. Test the loop with a mock model, like this page does, to cover limits, errors and approvals. Then run a small set of real "eval" tasks with expected results. See [Evals](topic:ai/evals).

### Tool runner or hand-written loop?

The SDK's tool runner is less code and handles the loop for you. A hand-written loop gives full control and teaches you the mechanics. Start by hand, then use the runner in real projects if it fits.

## ✅ Quick check

### 1. The model sends `{ "skill": "Node.js", "minYears": "three" }` to `searchCandidates`. What happens in `agent.js`?

:::answer
Zod's `safeParse` fails, because `minYears` must be a number. The tool does **not** run. The result is an error message, which goes back to the model so it can fix the call.
:::

### 2. With the real SDK, Claude's reply has `stop_reason: "end_turn"`. What should your loop do?

:::answer
Stop and use the final text. `end_turn` means Claude is finished and is not asking for any more tools.
:::

### 3. Why is `sendEmail` marked `risky: true` but `getJob` isn't?

:::answer
Reading a job changes nothing and is safe to repeat. Sending an email reaches a real person and can't be undone, so a human must approve it first.
:::
