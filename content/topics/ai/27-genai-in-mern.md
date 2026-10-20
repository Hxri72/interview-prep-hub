---
title: "Adding GenAI to a MERN app: an end-to-end AI chat feature"
stack: ai
order: 27
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "The flow is: React chat box → Express POST /api/chat → LLM SDK → stream the answer back over SSE → save both messages in MongoDB."
  - The API key lives only on the server, in an environment variable. The browser never talks to the LLM directly.
  - Protect the route like any paid feature. Use login (auth middleware), a per-user rate limit, and a maximum message length.
  - Save every message with its conversationId and userId, so you can load the history and send it back to the model next time.
  - Log input and output tokens per user (or per tenant). Tokens are your bill.
cards:
  - q: Why can't React call the LLM API directly?
    a: The API key would be inside the browser code, so anyone could copy it and spend your money. React calls your Express API, and Express calls the LLM with the key from .env.
  - q: How does the answer appear word by word in React?
    a: Express streams it with Server-Sent Events (SSE). The browser reads the response body piece by piece and adds each piece to the screen.
  - q: How does the model "remember" earlier messages?
    a: It doesn't. You save every message in MongoDB and send the whole conversation history with each new request.
  - q: Name three protections for an AI chat endpoint.
    a: Auth (only logged-in users), a per-user rate limit (429 when over the limit), and a maximum input length (400 when too long). Also a timeout on the LLM call.
  - q: Why log tokens per user or tenant?
    a: Tokens decide the cost. Logging them shows who uses the most, lets you set limits per user or company, and helps you spot abuse.
---

## 💡 What is it?

This topic shows how a real AI feature fits into a **MERN** app. MERN means MongoDB, Express, React and Node.js.

The user types a question in **React**. **Express** sends it to an [LLM](glossary:llm). The answer streams back word by word, and both messages are saved in **MongoDB**.

You already know each piece. This page joins them into one working feature.

## 🏠 Real-life example

Think of a **school help desk** that sends hard questions to an expert teacher.

- The **student at the window** = the user typing in the React chat box.
- The **help-desk clerk** = your Express API. Only the clerk is allowed to phone the expert.
- The **expert teacher on the phone** = the LLM.
- The **phone number** = the API key. The clerk keeps it in a locked drawer (the `.env` file). Students never see it.
- **"Show your school ID"** = auth middleware. Only real students can ask.
- **"Max 3 questions a minute"** = the rate limit.
- The clerk **reads the answer aloud sentence by sentence** = streaming.
- The **notebook** where the clerk writes every question and answer = MongoDB.

## 🧑‍💻 Code example

This is a small backend you can run **without an API key**. A fake LLM (`fakeLLM`) sends back words one by one, just like a real model.

```bash
mkdir ai-chat && cd ai-chat && npm init -y
npm install express mongoose mongodb-memory-server
node server.js
```

`server.js` (CommonJS):

```js
const express = require('express');                                  // the web framework
const mongoose = require('mongoose');                                // talks to MongoDB
const { MongoMemoryServer } = require('mongodb-memory-server');      // a throwaway MongoDB, only for this demo

const Message = mongoose.model('Message', new mongoose.Schema({      // one chat message
  conversationId: String,                                            // which chat it belongs to
  userId: String,                                                    // who owns the chat
  role: { type: String, enum: ['user', 'assistant'] },               // who wrote it: the person or the AI
  content: String,                                                   // the text
}, { timestamps: true }));                                           // adds createdAt and updatedAt

const Usage = mongoose.model('Usage', new mongoose.Schema({          // one row per AI call, for cost tracking
  userId: String,                                                    // who caused the cost
  inputTokens: Number,                                               // tokens sent to the model
  outputTokens: Number,                                              // tokens the model wrote
}, { timestamps: true }));                                           // when it happened

async function* fakeLLM(history) {                                   // pretend model: yields text in small pieces
  const last = history[history.length - 1].content;                  // the newest user message
  for (const word of `You asked: "${last}". Here is my answer.`.split(' ')) { // split the reply into words
    await new Promise((r) => setTimeout(r, 50));                     // wait 50 ms, like a real model
    yield word + ' ';                                                // send one word
  }                                                                  // end of the loop
}                                                                    // swap this for the real SDK later

const TOKENS = { 'demo-token': 'user-1' };                           // fake login tokens → user ids
function auth(req, res, next) {                                      // only logged-in users may chat
  const token = (req.headers.authorization || '').replace('Bearer ', ''); // read "Bearer <token>"
  if (!TOKENS[token]) return res.status(401).json({ error: 'Login required' }); // 401 = not logged in
  req.userId = TOKENS[token];                                        // remember who is calling
  next();                                                            // go on to the route
}                                                                    // end of auth

const hits = new Map();                                              // userId → timestamps of recent calls
function rateLimit(req, res, next) {                                 // at most 3 chats a minute per user
  const now = Date.now();                                            // current time in milliseconds
  const recent = (hits.get(req.userId) || []).filter((t) => now - t < 60_000); // calls in the last 60 s
  if (recent.length >= 3) return res.status(429).json({ error: 'Too many requests' }); // 429 = slow down
  hits.set(req.userId, [...recent, now]);                            // save this call
  next();                                                            // allowed
}                                                                    // end of rateLimit

const app = express();                                               // create the app
app.use(express.json());                                             // read JSON bodies

app.post('/api/chat', auth, rateLimit, async (req, res) => {         // send a message, stream the answer
  const { conversationId = new mongoose.Types.ObjectId().toString(), message } = req.body; // new chat if no id
  if (typeof message !== 'string' || message.length === 0 || message.length > 2000) { // 2000 = max characters
    return res.status(400).json({ error: 'Message must be 1–2000 characters' }); // 400 = bad input
  }                                                                  // input is fine
  await Message.create({ conversationId, userId: req.userId, role: 'user', content: message }); // save the question
  const history = await Message.find({ conversationId, userId: req.userId }).sort('createdAt').lean(); // whole chat, oldest first
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }); // SSE headers
  let answer = '';                                                   // collect the full answer here
  for await (const piece of fakeLLM(history)) {                      // each piece the model sends
    answer += piece;                                                 // add it to the full answer
    res.write(`data: ${JSON.stringify({ text: piece })}\n\n`);        // forward it to the browser now
  }                                                                  // the model has finished
  await Message.create({ conversationId, userId: req.userId, role: 'assistant', content: answer.trim() }); // save the answer
  const inputTokens = Math.ceil(history.map((m) => m.content).join(' ').length / 4); // rough guess: 4 chars ≈ 1 token
  const outputTokens = Math.ceil(answer.length / 4);                 // same guess for the answer
  await Usage.create({ userId: req.userId, inputTokens, outputTokens }); // log the cost
  res.write(`data: ${JSON.stringify({ done: true, conversationId, inputTokens, outputTokens })}\n\n`); // final event
  res.end();                                                         // close the stream
});                                                                  // end of POST /api/chat

app.get('/api/chat/:id', auth, async (req, res) => {                 // load a chat's history
  const messages = await Message.find({ conversationId: req.params.id, userId: req.userId }) // only this user's chat
    .sort('createdAt').select('role content -_id').lean();           // oldest first, only role + text
  res.json(messages);                                                // send it back
});                                                                  // end of GET /api/chat/:id

(async () => {                                                       // start everything
  const mongo = await MongoMemoryServer.create();                    // start the throwaway MongoDB
  await mongoose.connect(mongo.getUri());                            // connect Mongoose to it
  app.listen(3500, () => console.log('Chat API on http://localhost:3500')); // 3500 = the port
})();                                                                // end of startup
```

Try it with `curl`. This is the real output, shortened in the middle:

```text
$ curl -X POST localhost:3500/api/chat -d '{"message":"hi"}' -H 'Content-Type: application/json'
{"error":"Login required"}

$ curl -N -X POST localhost:3500/api/chat -H 'Authorization: Bearer demo-token' \
    -H 'Content-Type: application/json' -d '{"conversationId":"c1","message":"What is RAG?"}'
data: {"text":"You "}
data: {"text":"asked: "}
data: {"text":"\"What "}
...
data: {"text":"answer. "}
data: {"done":true,"conversationId":"c1","inputTokens":3,"outputTokens":12}

$ curl localhost:3500/api/chat/c1 -H 'Authorization: Bearer demo-token'      # after a 2nd message
[{"role":"user","content":"What is RAG?"},{"role":"assistant","content":"You asked: \"What is RAG?\". Here is my answer."},
 {"role":"user","content":"Give an example"},{"role":"assistant","content":"You asked: \"Give an example\". Here is my answer."}]

# a 2001-character message
{"error":"Message must be 1–2000 characters"}

# the 4th request inside one minute (the rejected long one also counted)
{"error":"Too many requests"}
```

The **React side** reads the stream piece by piece. Paste this into a component in a Vite React app:

```jsx
async function sendMessage(text, conversationId, onPiece) {          // call our API and stream the answer
  const res = await fetch('/api/chat', {                             // POST to Express, not to the LLM
    method: 'POST',                                                  // we are sending data
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, // JSON + login token
    body: JSON.stringify({ conversationId, message: text }),         // the question
  });                                                                // end of fetch
  if (!res.ok) throw new Error((await res.json()).error);            // 400 / 401 / 429 → show the error
  const reader = res.body.getReader();                               // read the body bit by bit
  const decoder = new TextDecoder();                                 // turns bytes into text
  let buffer = '';                                                   // holds half-received lines
  while (true) {                                                     // keep reading until the stream ends
    const { value, done } = await reader.read();                     // next chunk of bytes
    if (done) break;                                                 // the server closed the stream
    buffer += decoder.decode(value, { stream: true });               // add the new text
    const events = buffer.split('\n\n');                             // SSE events end with a blank line
    buffer = events.pop();                                           // keep the last, maybe unfinished, part
    for (const e of events) {                                        // each complete event
      const data = JSON.parse(e.replace('data: ', ''));              // turn "data: {...}" into an object
      if (data.text) onPiece(data.text);                             // add the words to the screen
    }                                                                // end of events loop
  }                                                                  // end of while
}                                                                    // end of sendMessage
```

In the component, `onPiece` would be something like `(t) => setAnswer((a) => a + t)`. Each word appears as soon as it arrives.

## 🔍 Deeper version

**1. Swapping in the real model.** Only `fakeLLM` changes. With the Anthropic SDK (needs `ANTHROPIC_API_KEY` in `.env`):

```js
const Anthropic = require('@anthropic-ai/sdk');                     // the official SDK
const client = new Anthropic();                                      // reads ANTHROPIC_API_KEY from the environment
async function* realLLM(history) {                                   // same shape as fakeLLM
  const stream = client.messages.stream({                            // start a streaming request
    model: 'claude-opus-5-5',                                        // which model
    max_tokens: 64000,                                               // a high cap is fine when streaming
    messages: history.map(({ role, content }) => ({ role, content })), // our saved history, in the SDK's shape
  });                                                                // end of request
  for await (const event of stream) {                                // events arrive one by one
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') yield event.delta.text; // pass on new text
  }                                                                  // end of loop
  const final = await stream.finalMessage();                         // the full message, with real token counts
  console.log(final.usage.input_tokens, final.usage.output_tokens);   // log these instead of the 4-chars guess
}                                                                    // end of realLLM
```

The OpenAI SDK has the same idea with a different shape. See [Calling an LLM API from Node.js](topic:ai/calling-llm-api) and [Streaming responses](topic:ai/streaming).

**2. TypeScript types for messages.** Keep one shared type for the frontend and backend:

```ts
type Role = 'user' | 'assistant';                                    // who wrote the message
interface ChatMessage { conversationId: string; role: Role; content: string; createdAt: string } // one saved message
type StreamEvent = { text: string } | { done: true; conversationId: string; inputTokens: number; outputTokens: number }; // what the SSE stream sends
```

**3. What each layer is responsible for:**

| Layer | Job |
|---|---|
| React | Chat box, show pieces as they arrive, show 400/401/429 errors, a "Stop" button (abort the fetch) |
| Express route | Auth, rate limit, input checks, call the LLM, stream, save, log tokens |
| LLM SDK | Talk to the provider. Use a timeout and retries for 429 and 5xx errors |
| MongoDB | `messages` (with `conversationId` and `userId`) and `usage` (tokens per user or tenant) |

**4. Things a real app adds.**
- **An index** on `{ userId: 1, conversationId: 1, createdAt: 1 }`, so history loads fast. See [compound indexes](topic:mongodb/compound-indexes-esr).
- **Trim long histories.** Send only the last N messages, or a summary, so you stay inside the [context window](glossary:context-window).
- **A system prompt** with the app's rules, kept on the server.
- **Stop when the user leaves.** On `req.on('close')`, abort the LLM request, so you stop paying for an answer nobody reads.
- **Real rate limiting.** The `Map` above lives in one server's memory. With several servers, store counts in Redis. See [Rate limiting](topic:system-design/rate-limiting).
- **Structured output.** When the AI must return data (not chat), ask for JSON and validate it. See [Structured outputs](topic:ai/structured-outputs).

**5. Where RAG fits.** If answers must come from your own documents, add one step before the LLM call. Search MongoDB for the most relevant text, then put it in the prompt. See [RAG](topic:ai/rag).

## 🎯 Why do we use it?

- **To ship AI features safely.** The key stays secret, only real users can call it, and the cost is controlled.
- **To feel fast.** Streaming shows the first words in about a second, even if the full answer takes ten.
- **To remember the chat.** Saving messages lets users come back later. It also gives the model its context.
- **To control cost.** Token logs per user or company show where the money goes, and let you set limits.

## ⚠️ Common mistakes

- **Putting the API key in React** (for example as `VITE_OPENAI_KEY`). Anything in the browser bundle is public.
- **No limits on a paid endpoint.** Without auth, a rate limit and a length check, one script can run up a huge bill.
- **Sending the whole history forever.** Long chats grow past the context window and get expensive. Trim or summarise.
- **Saving only the user's message.** If the assistant's answer isn't saved, the next request has no context.

## 🗣️ How to answer in an interview

> "In a MERN app, the browser never talks to the LLM directly. React posts the message to an Express route. That route checks the JWT, applies a per-user rate limit and a maximum length, then calls the LLM SDK with the key from an environment variable. I stream the answer back with Server-Sent Events, so the user sees words as they are generated. Both the user message and the assistant answer are saved in MongoDB with a conversation ID and user ID, so I can load the history and send it with the next request. I also log input and output tokens per user or tenant to control cost.
>
> I've built the backend side of an AI feature like this at SkillKeepr: a job-description chatbot. The Node backend sent the recruiter's input to a Python agent that called OpenAI. I mapped and validated the response into our JD format, returned it for preview, and saved it to MongoDB only after the recruiter confirmed. [FILL IN: one detail you remember, like how you handled a response that didn't match the expected shape.]"

## 🔁 Follow-up questions

### How would you stop a stream when the user closes the tab?

Listen for `req.on('close')` in Express. When it fires, abort the LLM request with an `AbortController` (the SDKs accept a `signal`). That stops the work and the cost. In React, a "Stop" button can abort the `fetch` the same way.

### Why SSE and not WebSockets for an AI chat?

The answer only flows one way, from server to browser, so SSE is enough. It is plain HTTP, so it works with normal auth, load balancers and proxies. WebSockets are better when both sides send many messages at any time. See [Polling, SSE and WebSockets](topic:rest-auth/realtime-options).

### How do you keep one tenant from seeing another tenant's chats?

Every query filters by `userId` (and the tenant). The ID comes from the verified JWT, never from the request body. In a database-per-tenant setup, the connection itself picks the right tenant.

### What if the model returns an error halfway through the answer?

Send a final SSE event like `{ error: '…' }`, then end the stream, so the UI can show "Something went wrong — try again". Save only what you have, or mark the message as failed. Retries are safe before the first word is sent, not after.

## ✅ Quick check

### 1. Where should the LLM API key be stored in a MERN app?

- A) In React, in a `VITE_` environment variable
- B) In `localStorage`
- C) On the Express server, in an environment variable

:::answer
**C.** Anything in React or `localStorage` reaches the browser, where anyone can read it. The server reads the key from its environment and calls the LLM for the user.
:::

### 2. A user sends their 4th message in one minute to the route above. What do they get?

:::answer
**429 Too Many Requests.** The `rateLimit` middleware allows 3 calls per user in 60 seconds. It runs before the route, so the LLM is never called and no money is spent.
:::

### 3. Why does the route load the whole conversation from MongoDB before calling the model?

:::answer
Because the LLM has **no memory** between requests. To answer in context, it must receive the earlier messages every time. They come from MongoDB.
:::
