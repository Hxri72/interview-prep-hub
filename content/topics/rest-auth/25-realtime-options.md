---
title: Polling, long polling, SSE and WebSockets compared
stack: rest-auth
order: 25
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Short polling: the client asks \"anything new?\" every few seconds. Simple, but wasteful and a little delayed."
  - "Long polling: the client asks, and the server holds the request open until there is news (or a timeout), then the client asks again."
  - "Server-Sent Events (SSE): one HTTP connection that stays open, and the server streams events one way, to the client. Built-in auto-reconnect."
  - "WebSockets: one open connection, and both sides can send at any time. Best for chat and collaboration."
  - Pick the simplest one that fits — polling for rare updates, SSE for server-to-client streams like progress or AI answers, WebSockets for two-way real-time.
cards:
  - q: What is short polling?
    a: The client calls the API on a timer (for example every 5 seconds) to check for new data. Easy, but most calls return nothing and updates arrive late.
  - q: How is long polling different?
    a: The server doesn't answer right away. It holds the request open until there's new data or a timeout, then the client immediately sends a new request.
  - q: What are Server-Sent Events?
    a: "A one-way stream from server to client over normal HTTP (Content-Type: text/event-stream). The browser's EventSource reads it and reconnects automatically."
  - q: When is SSE better than WebSockets?
    a: When only the server needs to push — notifications, progress bars, live scores, streaming AI answers. It's plain HTTP, simpler, and works well with proxies.
  - q: When do you need WebSockets instead?
    a: When both sides send messages often and fast — chat, multiplayer games, collaborative editors, live code sharing.
---

## 💡 What is it?

Sometimes the server has **new information** that the browser should see **without a page reload**. Examples: a new chat message, upload progress, a payment confirmation.

Normal HTTP can't do this alone, because **the server can't start a conversation**. There are four common ways around it:

1. **Short polling**: the client keeps asking on a timer.
2. **Long polling**: the client asks, and the server waits until there's news before answering.
3. **Server-Sent Events (SSE)**: the server keeps one connection open and **streams** events **to** the client.
4. **[WebSockets](topic:rest-auth/websockets)**: one open connection where **both sides** can talk.

## 🏠 Real-life example

Imagine you're waiting for your **exam results** from the school office.

- **Short polling** = you walk to the office **every 10 minutes** and ask "Results out?" Usually the answer is "no".
- **Long polling** = you go to the office and **wait at the counter** until the results come. Then you go home, and come back to wait for the next notice.
- **SSE** = the school **announces results on the loudspeaker** as each one is ready. You just listen. You can't talk back through the loudspeaker.
- **WebSockets** = you're on a **phone call** with the office. Both of you can talk any time.

- **You** = the browser.
- **The office** = the server.
- **Walking there and back** = a full HTTP request and response.
- **The loudspeaker** = an SSE stream (one-way).
- **The phone call** = a WebSocket (two-way).

## 🧑‍💻 Code example

This shows **SSE**, which many people forget about. Make a folder, run `npm init -y` and `npm install express`. Save this as `sse.js` and run `node sse.js`. The server streams upload progress, and a client reads it.

```js
const express = require('express');                            // load Express
const app = express();                                         // create the app

app.get('/progress', (req, res) => {                           // an SSE endpoint
  res.set({                                                    // special headers for Server-Sent Events
    'Content-Type': 'text/event-stream',                       // "this is an event stream"
    'Cache-Control': 'no-cache',                               // don't cache it
    Connection: 'keep-alive',                                  // keep the connection open
  });                                                          // end of headers
  res.flushHeaders();                                          // send the headers now, before any data
  let percent = 0;                                             // upload progress starts at 0
  const timer = setInterval(() => {                            // every 100 ms...
    percent += 50;                                             // ...progress goes up by 50
    res.write(`data: ${JSON.stringify({ percent })}\n\n`);     // one event = "data: ..." + a blank line
    if (percent >= 100) { clearInterval(timer); res.end(); }   // finished → stop and close
  }, 100);                                                     // 100 ms between events
  req.on('close', () => clearInterval(timer));                 // client left → stop the timer (no leak)
});                                                            // end of the route

const server = app.listen(3105, async () => {                  // start on port 3105
  const res = await fetch('http://localhost:3105/progress');    // a client opens the stream
  for await (const chunk of res.body) {                        // read pieces as they arrive
    process.stdout.write(Buffer.from(chunk).toString());        // print each event
  }                                                            // end of the loop (server ended the stream)
  server.close();                                              // stop the server
});                                                            // end of listen
```

**Output:**

```text
data: {"percent":50}

data: {"percent":100}

```

In the browser, you'd use the built-in `EventSource` instead of `fetch`:

```js
const source = new EventSource('/progress');                   // open the stream (same origin)
source.onmessage = (e) => console.log(JSON.parse(e.data));     // runs for every "data:" event
```

## 🔍 Deeper version

**Side-by-side comparison:**

| | Short polling | Long polling | SSE | WebSockets |
|---|---|---|---|---|
| Direction | client asks | client asks | server → client | both ways |
| Delay | up to one interval | almost instant | instant | instant |
| Wasted requests | many | few | none | none |
| Protocol | plain HTTP | plain HTTP | plain HTTP (`text/event-stream`) | `ws://` / `wss://` after an upgrade |
| Auto-reconnect | n/a | you write it | **built in** (`EventSource`) | you write it (or use Socket.IO) |
| Binary data | yes | yes | text only | yes |
| Good for | rare updates, simple jobs | old setups, fallback | notifications, progress, AI token streaming | chat, games, collaboration |

**Short polling details.** Easy to build with `setInterval` and a GET. Costs grow with users × frequency. Use it when updates are rare and a delay of a few seconds is fine. For example, "is my report ready?" every 10 seconds.

**Long polling details.** The server keeps the request open, for example up to 30 seconds. It answers as soon as there's news, or with "nothing" at the timeout. The client then sends the next request at once. It works everywhere, but each wait holds a connection, and you must handle timeouts carefully. Socket.IO uses long polling as a fallback.

**SSE details:**
- The format is simple text lines: `data: ...`, and optionally `event: name` and `id: 42`, followed by a blank line.
- The browser's `EventSource` **reconnects automatically**. It sends the last `id` it saw in a `Last-Event-ID` header, so the server can resend missed events.
- `EventSource` can't set custom headers, so authentication usually uses cookies. (`fetch` with a readable stream can send headers.)
- It's **one-way**. To send data back, the client uses normal POST requests.
- **Streaming AI answers** (like a chat assistant typing word by word) commonly use SSE.
- Over HTTP/1.1, browsers allow only about 6 connections per domain, which limits SSE tabs. HTTP/2 removes most of this limit.

**Choosing in practice:**
1. Does the server only need to push updates? → **SSE** (or polling if updates are rare).
2. Do both sides send often and quickly? → **WebSockets**.
3. Is it a simple background job status? → **polling** may be enough.
4. Is it on serverless? Long connections are harder there. Look at managed services, or use polling.

**Webhooks are different.** Everything above is **server ↔ browser**. A **[webhook](topic:rest-auth/webhooks)** is **server → server**: another company's backend calls your backend.

## 🎯 Why do we use it?

- **Users expect live apps.** New messages, notifications and progress should appear without a refresh.
- **The right tool saves money.** SSE or WebSockets avoid thousands of empty polling requests.
- **Simplicity matters.** Choosing polling or SSE when that's enough avoids the extra work of running WebSocket servers.

## ⚠️ Common mistakes

- **Polling every second for something that changes once an hour,** which wastes server and battery.
- **Using WebSockets for one-way updates** that SSE could handle more simply.
- **Forgetting to clean up** timers and listeners when an SSE client disconnects, which leaks memory. The example uses `req.on('close')` for this.
- **Proxies buffering SSE.** Some proxies (like Nginx by default) hold back the stream. Turn off buffering for that route.
- **Not handling reconnects** with long polling or plain WebSockets.

## 🗣️ How to answer in an interview

> "There are four main options for live updates. Short polling means the client calls the API on a timer. It's simple, but wasteful and delayed. Long polling means the server holds the request until there's news, then the client asks again. Server-Sent Events keep one HTTP connection open, and the server streams events one way, with automatic reconnect built into EventSource. WebSockets give a two-way open connection.
>
> I pick the simplest one that fits. For a background job status, polling every few seconds is fine. For notifications, upload progress or streaming an AI answer, I'd use SSE, because it's plain HTTP and one-way. For chat, a shared code editor or anything where both sides talk a lot, I'd use WebSockets, usually with Socket.IO for rooms and reconnection."

[FILL IN: a real feature where you used polling, SSE or WebSockets, and why. Only add it if it's true.]

## 🔁 Follow-up questions

### How would you show a progress bar for a long upload or AI job?

Upload directly with progress events in the browser. For server-side processing, push progress with SSE or WebSockets, or poll a `/jobs/:id` status endpoint every few seconds.

### Can SSE send data from the client to the server?

No. SSE is server-to-client only. The client sends data with normal HTTP requests (POST or PUT) alongside the stream.

### Why might long polling still be used today?

It works through very strict firewalls and old proxies that block WebSockets. That's why Socket.IO uses it as a fallback.

### How do you stream an AI chatbot's answer word by word?

The server calls the AI API in streaming mode, then forwards each piece to the browser as it arrives. SSE (`text/event-stream`) is the most common way.

## ✅ Quick check

### 1. A dashboard shows live cricket scores. Users only watch; they never send anything. Which option fits best?

- A) WebSockets
- B) Server-Sent Events
- C) Short polling every 200 ms

:::answer
**B.** It's one-way, server-to-client, so SSE is the simplest real-time fit. WebSockets would work but add complexity. Polling every 200 ms is very wasteful.
:::

### 2. What does the server send to end one SSE event?

:::answer
A **blank line**. Each event is lines like `data: {...}`, followed by an empty line (`\n\n`).
:::

### 3. True or false: SSE needs a special protocol like `ws://`.

:::answer
**False.** SSE is plain HTTP. The response just has `Content-Type: text/event-stream` and stays open.
:::
