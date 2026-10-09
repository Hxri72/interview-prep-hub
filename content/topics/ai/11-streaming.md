---
title: Streaming responses
stack: ai
order: 11
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Streaming sends the model's answer in small pieces while it is being written, instead of all at once at the end.
  - The user sees the first words in about a second, so the app feels fast even when the full answer takes 20 seconds.
  - "From the backend to the browser, the usual tool is Server-Sent Events (SSE): one long HTTP response with \"data:\" lines."
  - In the Anthropic SDK, use client.messages.stream(), read the text_delta events, and call finalMessage() to get usage at the end.
  - Handle the user leaving mid-stream, errors mid-stream, and logging tokens after the stream ends.
cards:
  - q: What is streaming in an LLM app?
    a: Sending the answer piece by piece as the model writes it, so the user sees text appear live instead of waiting for the full reply.
  - q: Does streaming make the model faster?
    a: No. The total time is about the same. It makes the app FEEL faster, because the first words arrive almost straight away.
  - q: What is SSE?
    a: "Server-Sent Events. One long HTTP response with Content-Type text/event-stream. The server writes \"data: ...\" lines, each followed by a blank line. It is one-way, server to browser."
  - q: SSE or WebSockets for a chatbot?
    a: SSE is usually enough — the answer only flows server → browser. WebSockets are for two-way, real-time traffic like a live code editor.
  - q: How do you get token usage when streaming?
    a: Wait for the stream to end. In the Anthropic SDK, call stream.finalMessage(); its usage field has the input and output token counts.
---

## 💡 What is it?

An LLM writes its answer one [token](glossary:token) at a time. Without streaming, your app waits until the **whole** answer is ready, then shows it.

With **streaming**, the server sends each small piece as soon as it is written. The user watches the answer appear word by word, like in ChatGPT.

From your backend to the browser, the common way is **SSE** ([Server-Sent Events](glossary:sse)).

## 🏠 Real-life example

Think of **a teacher writing on the blackboard**.

- **Without streaming:** the teacher writes the whole answer on paper at home, then shows it the next day. You wait a long time and see nothing.
- **With streaming:** the teacher writes on the board in class. You read each word as the chalk moves.

Mapping:
- **The teacher** = the LLM.
- **Each word on the board** = one chunk (a small piece of text).
- **The board** = the SSE connection to the browser.
- **"The end" written at the bottom** = the final `[DONE]` event.
- **Counting the chalk used** = token usage, which you only know at the end.

## 🧑‍💻 Code example

This runs **without any API key**. A fake model "writes" one word every 200 ms, and the server streams it as SSE.

```bash
npm init -y && npm pkg set type=module   # new project with import/export
npm install express                      # the web framework
node stream-server.mjs                   # start the server below
curl -N "http://localhost:4721/chat?q=hello"  # -N = show data as it arrives (no buffering)
```

```js
import express from 'express';                                   // the web framework

const app = express();                                           // create the app

async function* fakeModel(question) {                            // a FAKE model that "writes" one word at a time
  const words = `You asked: ${question}. Here is my answer.`.split(' '); // the full answer, split into words
  for (const word of words) {                                    // go through the words one by one
    await new Promise((r) => setTimeout(r, 200));                // wait 200 ms, like a real model thinking
    yield word + ' ';                                            // hand out the next word (a small "chunk")
  }                                                              // end of the loop
}                                                                // end of fakeModel

app.get('/chat', async (req, res) => {                           // GET /chat?q=... streams the answer
  res.setHeader('Content-Type', 'text/event-stream');            // tell the browser: this is Server-Sent Events (SSE)
  res.setHeader('Cache-Control', 'no-cache');                    // don't cache a live stream
  res.flushHeaders();                                            // send the headers now, before any words
  for await (const chunk of fakeModel(req.query.q ?? 'hi')) {    // read each word as soon as it is ready
    res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);   // one SSE event = "data: ..." + a blank line
  }                                                              // end of the stream
  res.write('data: [DONE]\n\n');                                 // a final event so the client knows we finished
  res.end();                                                     // close the response
});                                                              // end of the route

app.listen(4721, () => console.log('SSE on http://localhost:4721/chat?q=hello')); // start the server on port 4721
```

**Real output** from `curl -N`, with the time each line arrived:

```text
218ms data: {"text":"You "}
420ms data: {"text":"asked: "}
620ms data: {"text":"hello. "}
823ms data: {"text":"Here "}
1024ms data: {"text":"is "}
1227ms data: {"text":"my "}
1432ms data: {"text":"answer. "}
1434ms data: [DONE]
```

The first word arrived after about **0.2 seconds**, not after the full 1.4 seconds. That is the whole point of streaming.

## 🔍 Deeper version

**Streaming from the real model.** The Anthropic SDK has `client.messages.stream()`. You loop over its events and pick the `text_delta` ones. This **needs `ANTHROPIC_API_KEY`**:

```js
const stream = client.messages.stream({                          // start a streaming request
  model: 'claude-opus-5-5',                                      // which model
  max_tokens: 64000,                                             // big cap is fine: streaming avoids HTTP timeouts
  messages: [{ role: 'user', content: question }],               // the user's question
});                                                              // end of the request
for await (const event of stream) {                              // events arrive one by one
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') { // a new bit of text
    res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);          // forward it to the browser as SSE
  }                                                              // ignore other event types
}                                                                // the model has finished
const final = await stream.finalMessage();                       // the complete message, with usage
console.log('output tokens:', final.usage.output_tokens);         // log cost after the stream ends
```

I tested this loop against a fake SSE response. It printed the chunks `Hello ` and `Hari!`, then `stop: end_turn`, `output tokens: 4`.

**The events, in order:** `message_start` → `content_block_start` → many `content_block_delta` → `content_block_stop` → `message_delta` (with `stop_reason` and final usage) → `message_stop`.

**Reading SSE in the browser.**
- `EventSource` is the built-in browser client. But it only does **GET** requests and can't send custom headers.
- For a **POST** with a body (like a chat message), use `fetch()` and read `res.body` with a stream reader. Split the text on blank lines.

**SSE vs WebSockets.**

| | SSE | WebSockets |
|---|---|---|
| Direction | server → browser only | both ways |
| Protocol | normal HTTP | its own protocol after an upgrade |
| Reconnect | built into `EventSource` | you write it yourself |
| Best for | chat answers, progress updates | live editors, games, chat between users |

See [real-time options](topic:rest-auth/realtime-options) for the full comparison.

**Production details:**
- **User closes the tab:** listen for `req.on('close')` and stop the model stream, so you don't pay for tokens nobody reads.
- **Errors mid-stream:** the HTTP status is already 200. Send an `event: error` message, then close.
- **Proxies:** some proxies buffer responses. Turn buffering off for this route (for example `X-Accel-Buffering: no` on nginx).
- **Logging:** log tokens and duration **after** the stream ends, from `finalMessage()`.

## 🎯 Why do we use it?

A long LLM answer can take 10–30 seconds. Staring at a spinner for 20 seconds feels broken. With streaming, the first words appear in about a second, and the user starts reading while the rest arrives.

Streaming also avoids HTTP timeouts on very long answers, because data keeps flowing.

## ⚠️ Common mistakes

- **Thinking streaming is faster overall.** Total time is about the same. Only the *first words* come sooner.
- **Forgetting `flushHeaders()` or the `\n\n`.** Without the blank line, the browser doesn't see the event.
- **Not stopping on disconnect.** The model keeps writing, and you keep paying.
- **Logging usage too early.** Token counts are only complete at the end of the stream.

## 🗣️ How to answer in an interview

> "Streaming means sending the model's answer in small chunks while it's being generated. It doesn't make the total time shorter, but the user sees the first words in about a second instead of waiting 20 seconds for the full reply.
>
> On the backend I use the SDK's streaming method, loop over the events, and forward each text delta to the browser with Server-Sent Events — Content-Type text/event-stream, and 'data:' lines followed by a blank line. I send a final done event, and after the stream ends I read the final message to log token usage. I also listen for the client disconnecting, so I can stop the model and not pay for unused tokens. For a chatbot, SSE is enough; I'd use WebSockets only for two-way real-time features."

[FILL IN: whether the JD chatbot you built at SkillKeepr streamed its answers, and how. Only if true.]

## 🔁 Follow-up questions

### How does the browser read a POST stream?

`EventSource` only supports GET. For POST, call `fetch()`, get `res.body.getReader()`, decode the bytes with `TextDecoder`, and split the text on blank lines to get each event.

### What if the model errors halfway?

The 200 status was already sent, so you can't change it. Send an error event like `event: error` with a message, close the stream, and let the UI show "something went wrong — try again".

### How do you stop paying when the user leaves?

Listen for `req.on('close')`. When it fires, abort the model stream (the SDK stream has an `abort()` method), so generation stops.

### Can you stream structured JSON?

Yes, but partial JSON isn't valid until the end. Show text live, but validate the full object after the stream finishes. See [structured outputs](topic:ai/structured-outputs).

## ✅ Quick check

### 1. Without streaming, an answer takes 12 seconds. With streaming, about how long until the user sees the first word?

- A) 12 seconds
- B) About 1 second
- C) 24 seconds

:::answer
**B.** The total is still about 12 seconds, but the first chunk arrives almost straight away.
:::

### 2. What Content-Type does an SSE response use?

:::answer
**`text/event-stream`.** Each event is a `data: ...` line followed by a blank line.
:::

### 3. When can you trust the token count of a streamed answer?

:::answer
**Only after the stream ends.** Use the final message (`stream.finalMessage()` in the Anthropic SDK); its `usage` field has the full counts.
:::
