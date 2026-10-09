---
title: Tool calling (function calling)
stack: ai
order: 15
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Tool calling lets the model ASK your code to run a function (like searchJobs) with certain inputs. Your code runs it and sends the result back.
  - The model never runs anything itself. Your code decides what runs, so your code controls security and permissions.
  - "The loop: call model → if stop_reason is tool_use, run the tools → send tool_result blocks back → repeat until end_turn."
  - Describe each tool clearly (name, description, input schema). Use strict schemas so the arguments always match.
  - Add limits — max steps, allowed tools only, timeouts, and a human approval for risky actions like sending emails or payments.
cards:
  - q: What is tool calling (function calling)?
    a: The model replies with a request like "call searchJobs with skill=node". Your code runs that function and returns the result, and the model uses it to answer.
  - q: Does the model run the function itself?
    a: No. It only asks. Your backend decides whether to run it, runs it with real permissions, and returns a tool_result.
  - q: How does your code know the model wants a tool?
    a: The response has stop_reason "tool_use" and one or more tool_use blocks, each with an id, a tool name and an input object.
  - q: How do you send results back?
    a: As tool_result blocks inside ONE user message, each with the matching tool_use_id. If a tool failed, return the error with is_error true instead of dropping it.
  - q: Why is tool calling the base of agents?
    a: An agent is just a loop of "model picks a tool → code runs it → model looks at the result" until the goal is done.
---

## 💡 What is it?

An [LLM](glossary:llm) only knows what it learned in training. It can't look up today's open jobs or send an email.

**[Tool calling](glossary:tool-calling)** fixes this. You tell the model which functions exist, like `searchJobs(skill)`. When it needs one, it replies: "please call `searchJobs` with `skill: 'node'`". **Your code** runs the function and sends the result back. Then the model answers using real data.

## 🏠 Real-life example

Think of **a school principal and the office staff**.

The principal (the model) is smart but never leaves the office. A parent asks, "How many seats are left in Class 5?" The principal doesn't know. So she writes a note: "Please check the Class 5 register." The office clerk (your code) checks the register and writes back: "3 seats." The principal then replies to the parent.

Mapping:
- **The principal** = the LLM. She decides what she needs.
- **The note** = a `tool_use` block (tool name + input).
- **The list of things the clerk can do** = the tool definitions.
- **The clerk** = your code. Only the clerk opens the register.
- **The reply note** = a `tool_result` block.
- **"Only the clerk opens the cash box"** = your code controls what really runs.

## 🧑‍💻 Code example

This runs **without an API key**. The fake model uses the same message shapes as the real Anthropic API. Save as `tools.mjs` and run `node tools.mjs`.

```js
const jobs = [                                                   // our "database" of jobs
  { id: 1, title: 'Node.js Developer', skill: 'node' },          // job 1
  { id: 2, title: 'React Developer', skill: 'react' },           // job 2
  { id: 3, title: 'Senior Node.js Engineer', skill: 'node' },    // job 3
];                                                               // end of jobs

const tools = {                                                  // the functions the model is ALLOWED to ask for
  searchJobs: ({ skill }) => jobs.filter((j) => j.skill === skill), // find jobs by skill
};                                                               // end of tools

async function fakeModel(messages) {                             // a FAKE model with the same shapes as the real API
  const last = messages.at(-1);                                  // look at the newest message
  if (last.role === 'user' && typeof last.content === 'string') { // a normal question → ask for a tool
    return { stop_reason: 'tool_use', content: [                 // "please run a tool for me"
      { type: 'tool_use', id: 'toolu_1', name: 'searchJobs', input: { skill: 'node' } }, // which tool, with which input
    ] };                                                         // end of the tool request
  }                                                              // otherwise we got the tool result back
  const found = JSON.parse(last.content[0].content);             // read the result our code sent
  return { stop_reason: 'end_turn', content: [                   // the final answer
    { type: 'text', text: `I found ${found.length} Node.js jobs: ${found.map((j) => j.title).join(', ')}.` }, // a text block that uses the data
  ] };                                                           // end of the final answer
}                                                                // end of fakeModel

const messages = [{ role: 'user', content: 'Which Node.js jobs are open?' }]; // the user's question
for (let step = 1; step <= 5; step++) {                          // the agent LOOP, max 5 steps for safety
  const reply = await fakeModel(messages);                       // ask the model
  messages.push({ role: 'assistant', content: reply.content });  // keep the model's turn in the history
  if (reply.stop_reason !== 'tool_use') {                        // no tool needed → we are done
    console.log('FINAL:', reply.content[0].text);                // show the answer
    break;                                                       // leave the loop
  }                                                              // otherwise, run every tool it asked for
  const results = reply.content                                  // look at the content blocks
    .filter((b) => b.type === 'tool_use')                        // keep only the tool requests
    .map((call) => {                                             // run each one
      console.log(`step ${step}: model asks ${call.name}(${JSON.stringify(call.input)})`); // log the request
      const output = tools[call.name](call.input);               // OUR code runs the real function
      return { type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(output) }; // the answer for that call
    });                                                          // end of map
  messages.push({ role: 'user', content: results });             // send ALL results back in ONE user message
}                                                                // end of the loop
```

**Real output:**

```text
step 1: model asks searchJobs({"skill":"node"})
FINAL: I found 2 Node.js jobs: Node.js Developer, Senior Node.js Engineer.
```

The model never touched the `jobs` array. It only **asked**. Our code ran the search.

## 🔍 Deeper version

**Defining a real tool.** For the real API, each tool has a name, a description and a JSON Schema for its inputs:

```js
const searchJobsTool = {                                         // one tool definition
  name: 'search_jobs',                                           // the name the model will use
  description: 'Search open jobs in this company by one skill. Use it when the user asks which jobs are open.', // WHEN and WHY to use it
  strict: true,                                                  // the model's input must match the schema exactly
  input_schema: {                                                // a JSON Schema for the inputs
    type: 'object',                                              // the input is an object
    properties: { skill: { type: 'string', description: 'One skill, lowercase, e.g. "node"' } }, // its fields
    required: ['skill'],                                         // skill must be present
    additionalProperties: false,                                 // no extra fields allowed (needed for strict)
  },                                                             // end of the schema
};                                                               // end of the tool
// then: client.messages.create({ model: 'claude-opus-5-5', max_tokens: 16000, tools: [searchJobsTool], messages })
```

I sent this definition through the Anthropic SDK to a fake server. The SDK sent `strict: true`, and the response came back with `stop_reason: tool_use` and the call `search_jobs {"skill":"node"}`.

**The loop, step by step:**
1. Send `messages` and `tools`.
2. If `stop_reason` is `"tool_use"`, collect every `tool_use` block.
3. Run each tool **in your code**. Independent tools can run at the same time.
4. Append the assistant turn, then **one** user message holding **all** the `tool_result` blocks, each with its `tool_use_id`.
5. Repeat until `stop_reason` is `"end_turn"`, or you hit your max-steps limit.

**Good tool design:**
- **Clear descriptions.** The model picks tools from their descriptions. Say *when* to use the tool, not only what it does.
- **Small, safe inputs.** Prefer `skill: string` over "run this SQL".
- **Errors are results.** If the tool fails, return `{ is_error: true, content: 'Job service timed out' }`. The model can then retry or explain. Don't silently drop the result.
- **Validate inputs** before running, even with `strict: true`.

**Safety.** Tool calls run with **your** server's permissions, so:
- check the user's role and tenant inside every tool,
- allow only the tools this user may use,
- cap the number of steps and the time,
- ask a human to approve risky actions (sending emails, payments, deleting data).

:::version[Version note]
On the newest Claude models (for example Claude Opus 5.5 and Claude Sonnet 5.5), **forcing** a tool call with `tool_choice: { type: 'any' }` or `{ type: 'tool' }` returns a 400 error. Use the default `auto`, name the tool in your prompt, and use `strict: true` for valid arguments. Older tutorials still show forced tool choice.
:::

**Helpers.** The SDKs have a beta "tool runner" that runs this loop for you (for example with Zod-defined tools). Write the loop by hand only when you need full control.

## 🎯 Why do we use it?

Without tools, the model can only talk about what it learned in training. With tools, it can:
- read **live data**: open jobs, a candidate's profile, the calendar,
- **take actions**: book an interview slot, create a draft email,
- use **exact calculators**: dates, money, scores.

Tool calling is also the foundation of [AI agents](topic:ai/agents). An agent is this same loop, with more tools and a bigger goal.

## ⚠️ Common mistakes

- **Letting the model run anything.** Give small, specific tools, not "execute SQL" or "run shell".
- **Splitting tool results across many messages.** Return all results for one turn in a single user message.
- **No step limit.** A confused model can loop forever and burn money.
- **Vague descriptions.** If two tools sound alike, the model picks the wrong one.

## 🗣️ How to answer in an interview

> "Tool calling means I describe some functions to the model — a name, a description and a JSON Schema for the inputs. When the model needs one, it doesn't run anything itself. It returns a tool_use block with the tool name and input, and stop_reason tool_use. My code runs the function with real permissions, and sends the output back as a tool_result with the matching ID. Then the model continues, and I loop until it ends its turn.
>
> I keep tools small and specific, use strict schemas so the arguments are valid, return errors as results instead of dropping them, and cap the number of steps. Security lives in my code: every tool checks the user's role and tenant, and risky actions like sending emails need human approval. This loop is the foundation of agents."

[FILL IN: if you used tool calling in the voice agent (Claude) or the JD chatbot, name one tool it could call. Only if true.]

## 🔁 Follow-up questions

### Tool calling vs structured outputs?

Structured outputs force the **final answer** into a JSON shape. Tool calling lets the model **ask for actions or data mid-conversation**. Both use JSON Schemas. See [structured outputs](topic:ai/structured-outputs).

### What if the model calls a tool with bad arguments?

Validate first. Return a `tool_result` with `is_error: true` and a clear message, like "skill must be one word". The model usually corrects itself on the next turn.

### How do you stop prompt injection from triggering tools?

Don't give powerful tools to untrusted conversations, check permissions inside every tool, and require human approval for risky actions. See [prompt injection](topic:ai/prompt-injection-guardrails).

### What is MCP's link to tool calling?

[MCP](topic:ai/mcp) is a standard way to *package* tools, so many AI apps can use the same tool server. The model still uses tool calling underneath.

## ✅ Quick check

### 1. Who actually runs `searchJobs`?

- A) The model, on the provider's servers
- B) Your backend code

:::answer
**B.** The model only asks. Your code runs the function and returns a `tool_result`.
:::

### 2. The model asks for 3 tools in one turn. How do you send the results back?

:::answer
In **one** user message with **3** `tool_result` blocks, each with its matching `tool_use_id`.
:::

### 3. A tool throws an error. What should you send back?

:::answer
A `tool_result` with **`is_error: true`** and a short error message. Don't drop it — the model needs to know the call failed.
:::
