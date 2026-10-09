---
title: MCP (Model Context Protocol)
stack: ai
order: 20
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - MCP is an open standard for connecting AI apps to tools and data. Build an MCP server once, and many AI apps can use it.
  - "An MCP server can offer three things: tools (actions), resources (data to read) and prompts (ready-made templates)."
  - "Simple picture: MCP is like USB-C for AI — one standard plug instead of a different cable for every app."
  - "It talks over stdio (a local program) or Streamable HTTP (a remote server)."
  - Anthropic launched it in November 2024. Many AI apps and coding agents now support it.
cards:
  - q: What is MCP?
    a: The Model Context Protocol, an open standard for connecting AI apps to tools and data. You build one MCP server, and any MCP-compatible AI app can use it.
  - q: What three things can an MCP server offer?
    a: Tools (functions the AI can call), resources (data the AI can read) and prompts (ready-made prompt templates).
  - q: What is the difference between an MCP server and an MCP client?
    a: The server offers tools and data, for example "search our candidates". The client lives inside the AI app and connects to servers.
  - q: How is MCP different from normal tool calling?
    a: Tool calling is how one model asks for a function. MCP is a standard way to package and share those tools, so many apps can plug in the same server.
  - q: Which transports does MCP use?
    a: stdio for local servers started as a child process, and Streamable HTTP for remote servers.
---

## 💡 What is it?

**MCP** stands for **Model Context Protocol**. It is an **open standard** for connecting AI apps to **tools and data**.

You build an **MCP server** once, for example "search our candidates". Then any AI app that speaks MCP can use it. That includes chat apps, coding agents and your own app.

An MCP server can offer three things: **tools** (actions), **resources** (data to read) and **prompts** (ready-made templates).

## 🏠 Real-life example

Think of the **USB-C port** on phones and laptops.

Years ago, every device had its own cable. Now one standard plug works for chargers, pen drives and headphones.

- **USB-C, the standard** = MCP.
- **A pen drive or a charger** = an MCP server (it offers something).
- **Your laptop's port** = the MCP client inside an AI app.
- **Any laptop with USB-C** = any AI app that supports MCP.

The pen-drive maker builds it **once**. It works in every laptop. That's the whole idea of MCP.

## 🧑‍💻 Code example

A tiny MCP server and client in one program, using the official SDK. No AI key is needed.

```bash
npm init -y && npm install @modelcontextprotocol/sdk zod
```

Save as `mcp-demo.js` and run `node mcp-demo.js`.

```js
// mcp-demo.js — a tiny MCP server and an MCP client talking in the same program (no API key needed)
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');   // the official MCP server class
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');    // the official MCP client class
const { InMemoryTransport } = require('@modelcontextprotocol/sdk/inMemory.js'); // a "wire" inside one program, for demos
const { z } = require('zod');                                               // zod describes the tool's input shape

const server = new McpServer({ name: 'candidates', version: '1.0.0' });     // create the server with a name and version

server.registerTool('searchCandidates', {                                   // TOOL: a function the AI can ask to run
  description: 'Find candidates who know a skill',                          // the AI reads this to decide when to use it
  inputSchema: { skill: z.string() },                                       // input: one text field called "skill"
}, async ({ skill }) => ({                                                  // the code that runs when the tool is called
  content: [{ type: 'text', text: `Asha and Ravi know ${skill}` }],         // the answer goes back as text
}));

server.registerResource('job-123', 'jobs://123', {                          // RESOURCE: data the AI can read
  description: 'One job description',                                       // what this data is
}, async (uri) => ({                                                        // code that returns the data
  contents: [{ uri: uri.href, text: 'Node.js developer, 3+ years, Kochi' }], // the job text
}));

async function main() {                                                     // async so we can use await
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();    // two connected ends of the wire
  await server.connect(serverSide);                                         // the server listens on one end
  const client = new Client({ name: 'demo-app', version: '1.0.0' });       // the AI app side
  await client.connect(clientSide);                                         // the client connects to the other end

  const { tools } = await client.listTools();                               // ask: "what tools do you have?"
  console.log('Tools:', tools.map((t) => t.name));                          // print the tool names
  const result = await client.callTool({ name: 'searchCandidates', arguments: { skill: 'Node.js' } }); // call a tool
  console.log('Tool result:', result.content[0].text);                      // print the tool's answer
  const job = await client.readResource({ uri: 'jobs://123' });             // read a resource
  console.log('Resource:', job.contents[0].text);                           // print the job text
  await client.close();                                                     // close the connection
}

main();                                                                     // run the demo
```

**Output** (tested with `@modelcontextprotocol/sdk` 1.32):

```text
Tools: [ 'searchCandidates' ]
Tool result: Asha and Ravi know Node.js
Resource: Node.js developer, 3+ years, Kochi
```

In real use, the AI app is the client. It lists your tools, shows them to the model, and calls them when the model asks.

## 🔍 Deeper version

**The three building blocks:**

| Block | Who decides to use it | Example |
|---|---|---|
| **Tools** | The model (it asks to call them) | `searchCandidates(skill)`, `createJob(...)` |
| **Resources** | The app or user picks what to attach | a job description, a file, a DB record |
| **Prompts** | The user picks a template | "Summarise this candidate for a hiring manager" |

**Transports (how client and server talk):**
- **stdio** — the AI app starts your server as a **local child process** and talks through standard input and output. Good for local tools, like a coding agent reading your repo. Use `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`.
- **Streamable HTTP** — your server runs **remotely**, like a normal web service. Many users and apps can connect. This needs proper authentication. The MCP spec uses OAuth for this.

Messages use **JSON-RPC 2.0** under the hood. On connect, client and server exchange their abilities, then the client can list and call tools.

**MCP vs tool calling.** These work together, they don't compete:
- [Tool calling](topic:ai/tool-calling) is how **one model** asks your code to run a function.
- **MCP** is a **standard package** for tools and data, so many apps can reuse them without custom glue code for each one.

**Security points:**
- An MCP server is real code with real access. Only install servers you trust.
- Tool descriptions and results go into the model's context, so a bad server can attempt [prompt injection](topic:ai/prompt-injection-guardrails).
- Give each server the **least access** it needs, like a read-only DB user.
- For remote servers, use proper auth and check permissions per user and per [tenant](glossary:multi-tenant).

:::version[Version note]
Anthropic launched MCP in **November 2024**. Support spread quickly in 2025, and many AI apps and coding agents now act as MCP clients. In the TypeScript SDK, `registerTool` / `registerResource` / `registerPrompt` are the current methods; older tutorials use `server.tool(...)`, which is now marked deprecated.
:::

## 🎯 Why do we use it?

Without MCP, every AI app needs its own custom integration for every tool. Ten apps and ten tools means a hundred integrations.

With MCP, you build **one server per tool or data source**. Every MCP-compatible app can use it. For a backend developer, building an MCP server is a practical skill: it lets AI apps safely use your company's data, like a candidate search.

## ⚠️ Common mistakes

- **Thinking MCP replaces tool calling.** MCP packages tools; the model still uses tool calling to request them.
- **Giving a server too much access**, like full write access to production data.
- **Installing untrusted servers.** They run code and can feed harmful text to the model.
- **Vague tool descriptions.** The model picks tools by reading the description. Write it clearly.

## 🗣️ How to answer in an interview

> "MCP, the Model Context Protocol, is an open standard for connecting AI apps to tools and data. I build an MCP server once — say, a candidate search — and any app that supports MCP can use it. People call it USB-C for AI.
>
> A server can offer three things: tools, which are actions the model can ask to call; resources, which are data the app can read; and prompts, which are templates. It runs either locally over stdio or remotely over Streamable HTTP.
>
> It doesn't replace tool calling. Tool calling is how a model asks for a function; MCP is a standard way to package and share those functions. For security I'd give each server the least access it needs, use proper auth for remote servers, and only install servers I trust."

[FILL IN: if you've used MCP servers in your daily work (for example with Claude Code) or built one, add one honest line.]

## 🔁 Follow-up questions

### Is MCP only for Claude?

No. It is an open standard. Many AI apps and coding agents support it as clients.

### When would you build an MCP server instead of a normal REST API?

When you want AI apps to use your tool directly. A REST API is for programs you write. An MCP server describes tools in a way AI apps can discover and call. Often the MCP server just calls your existing REST API inside.

### How do you secure a remote MCP server?

Use proper authentication (the spec uses OAuth), check permissions per user, give it least-privilege access to data, validate every tool input, and log calls.

### What's the difference between a tool and a resource?

A tool is an action the model decides to call, like "search". A resource is data the app attaches, like a file or a job description.

## ✅ Quick check

### 1. Which MCP building block fits "let the AI create a new job posting"?

- A) Resource
- B) Tool
- C) Prompt

:::answer
**B) Tool.** Creating something is an action the model asks to perform.
:::

### 2. You want a coding agent on your laptop to read your local repo. Which transport is typical?

:::answer
**stdio.** The app starts the server as a local process and talks through standard input and output.
:::

### 3. True or false: MCP means the model no longer needs tool calling.

:::answer
**False.** MCP packages and shares tools. The model still uses tool calling to ask for them.
:::
