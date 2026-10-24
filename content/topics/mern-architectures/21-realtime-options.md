---
title: "Real-time: polling vs SSE vs WebSockets"
stack: mern-architectures
order: 21
level: Intermediate
mustKnow: true
askedFrequency: very common
template: pattern
section: How frontend talks to backend
summary:
  - "Real-time means the screen updates by itself when data changes on the server, without the user refreshing."
  - "Polling: React asks the server again every few seconds. Simple, but wasteful."
  - "SSE (Server-Sent Events): one open connection where only the server sends updates. Good for live feeds and notifications."
  - "WebSockets: one open two-way connection. Best for chat, live editing and games. In MERN, Socket.IO is the usual choice."
  - "With many servers, WebSockets need a shared message channel (like a Redis adapter) so every server hears every event."
cards:
  - q: What is polling?
    a: The client sends a normal request again and again on a timer (like every 5 seconds) to check for new data.
  - q: SSE vs WebSockets in one line?
    a: SSE is one-way (server → browser) over plain HTTP. WebSockets are two-way and use their own protocol after an HTTP upgrade.
  - q: Which real-time option is best for a chat app?
    a: WebSockets (for example Socket.IO), because both sides send messages often.
  - q: Why do WebSockets need extra work when you run 3 servers?
    a: Each server only knows its own connected users. A Redis adapter (or similar) passes events between servers.
  - q: When is polling good enough?
    a: When updates are rare and a few seconds of delay is fine, like checking if a report has finished.
---

## 💡 What is it?

Normally the browser asks and the server answers. The server can't speak first.

**Real-time** means the screen changes by itself when something new happens on the server. A new chat message or a status change appears without a refresh.

There are three common ways to build this in a MERN app: **polling**, **[SSE](glossary:sse)** and **WebSockets**.

## 🏠 Real-life example

You're waiting for exam results.

- **Polling** = you phone the school office every 10 minutes: "Results out yet?" Most calls get "No".
- **SSE** = you join the school's announcement speaker. You only listen. The office speaks when results come.
- **WebSockets** = a phone call that stays open. You and the office can both talk at any time.

The phone line staying open = an open connection between React and Express.

## 🗺️ The diagram

```text
POLLING                      SSE                           WEBSOCKET
React        Express         React        Express          React        Express + Socket.IO
  │ GET /status ─►│            │ GET /events ─►│              │ upgrade ───►│
  │◄─ "pending" ──│            │◄═ data: 1 ════│              │◄═══════════►│  two-way
  │ (wait 5 s)    │            │◄═ data: 2 ════│ (stays open) │  "hi" ─────►│
  │ GET /status ─►│            │◄═ data: 3 ════│              │◄── "hello" ─│
  │◄─ "done" ─────│            │   one-way     │              │◄── "typing" │
many short requests          one long HTTP response         one long two-way connection
```

## 🧑‍💻 Code example

A tiny chat with Express + Socket.IO. Socket.IO is a library on top of WebSockets. It adds auto-reconnect and "rooms".

Set up:

```bash
npm init -y
npm install express socket.io
```

Save as `server.js` and run `node server.js`.

```js
const express = require('express');                          // load Express
const http = require('node:http');                           // Node's HTTP module
const { Server } = require('socket.io');                     // the Socket.IO server class

const app = express();                                       // normal Express app for REST routes
const httpServer = http.createServer(app);                   // one HTTP server shared by Express and Socket.IO
const io = new Server(httpServer, {                          // attach Socket.IO to that server
  cors: { origin: 'http://localhost:5173' },                 // 5173 = the Vite dev server for React
});                                                          // end of Server options

app.get('/api/health', (req, res) => res.json({ ok: true })); // REST still works next to sockets

io.on('connection', (socket) => {                            // runs once for each browser that connects
  console.log('connected', socket.id);                       // socket.id = a unique id for this connection
  socket.on('chat:send', (text) => {                         // listen for a message from this browser
    io.emit('chat:new', { from: socket.id, text });          // send it to EVERY connected browser
  });                                                        // end of chat:send
  socket.on('disconnect', () => console.log('left', socket.id)); // browser closed the tab
});                                                          // end of connection

httpServer.listen(3000, () => console.log('Listening on 3000')); // start on port 3000
```

React side (`npm install socket.io-client` in the Vite app):

```jsx
import { useEffect, useState } from 'react';                 // React hooks
import { io } from 'socket.io-client';                       // the Socket.IO client

const socket = io('http://localhost:3000');                  // connect once, outside the component

export default function Chat() {                             // a tiny chat component
  const [messages, setMessages] = useState([]);              // [] = no messages yet
  const [text, setText] = useState('');                      // '' = empty input box

  useEffect(() => {                                          // subscribe after the first render
    const onNew = (msg) => setMessages((m) => [...m, msg]);  // add each new message to the list
    socket.on('chat:new', onNew);                            // listen for server messages
    return () => socket.off('chat:new', onNew);              // cleanup: stop listening on unmount
  }, []);                                                    // [] = subscribe only once

  const send = () => { socket.emit('chat:send', text); setText(''); }; // send, then clear the box

  return (                                                   // the UI
    <div>                                                    {/* wrapper */}
      <ul>{messages.map((m, i) => <li key={i}>{m.text}</li>)}</ul> {/* show every message */}
      <input value={text} onChange={(e) => setText(e.target.value)} /> {/* the text box */}
      <button onClick={send}>Send</button>                   {/* send on click */}
    </div>                                                   {/* end of wrapper */}
  );                                                         // end of the UI
}                                                            // end of Chat
```

Open the React page in two tabs. A message sent in one tab shows up in both.

## 🔍 Deeper version

The basics of each option are in [real-time options](topic:rest-auth/realtime-options) and [WebSockets](topic:rest-auth/websockets). Here is how each one fits into a MERN app.

**Polling in React.** A `setInterval` (or TanStack Query's `refetchInterval`) calls a normal Express route. No server changes. **Long polling** is a variant: the server holds the request open until there is news, then answers.

**SSE in Express.** The route sets `Content-Type: text/event-stream`, keeps the response open, and writes `data: ...\n\n` lines. The browser uses the built-in `EventSource` class, which reconnects by itself. It is plain HTTP, so it passes through most proxies. It is one-way only; the browser still uses normal POSTs to send.

**WebSockets with Socket.IO.** The browser starts with an HTTP request that asks to **upgrade** the connection. After that, both sides send messages freely. Socket.IO adds:
- **auto-reconnect**,
- **rooms** (for example one room per chat or per tenant),
- **acknowledgements** (a reply callback).

**Scaling to many servers.** User A may be connected to server 1 and user B to server 2. `io.emit` on server 1 doesn't reach server 2. Fixes:
- the **Redis adapter**, which shares events between servers through Redis pub/sub;
- **sticky sessions** on the load balancer, so a client keeps talking to the same server.

See [real-time at scale](topic:system-design/realtime-at-scale).

**Serverless.** Lambda functions can't hold a socket open. On AWS you'd use **API Gateway WebSocket APIs** or a managed service instead. See [serverless MERN](topic:mern-architectures/serverless-mern).

**Auth.** Check the user when the socket connects (cookie or token in the handshake), not on every message. Also check rights before joining a room.

## ⚖️ Pros and cons

| Option | Pros | Cons |
|---|---|---|
| Polling | easiest, no new server code, works everywhere | wasted requests, delay up to the interval |
| SSE | simple, plain HTTP, auto-reconnect built in | one-way only, text only |
| WebSockets | two-way, very low delay | stateful servers, harder scaling and load balancing |

## 🎯 When to choose it

- **Check if a long job (like a report export) has finished:** polling every 5–10 seconds.
- **Live notifications, a live score feed, or streaming an AI answer word by word:** SSE.
- **Chat, typing indicators, live code editors, multiplayer games:** WebSockets (Socket.IO).
- **On Lambda only:** a managed WebSocket service, or polling if delay is OK.

## ⚠️ Common mistakes

- **Using WebSockets for everything.** If the server only pushes, SSE is simpler.
- **Creating a new socket on every render.** Create it once, and clean up listeners in `useEffect`.
- **Forgetting the Redis adapter** when running more than one server. Some users stop getting messages.
- **No auth on the socket.** Anyone could join any room.

## 🗣️ How to answer in an interview

> "There are three main options. Polling means the client asks again on a timer. It's simple but wasteful.
>
> SSE keeps one HTTP response open and the server pushes events one way. It's great for notifications or streaming AI output.
>
> WebSockets give a two-way connection after an HTTP upgrade. In MERN I'd use Socket.IO with Express, because it adds reconnects and rooms.
>
> I choose by direction and frequency. Rare updates mean polling, server-to-client means SSE, and chat-style two-way means WebSockets. When scaling WebSockets across servers, I'd add the Redis adapter or sticky sessions.
>
> SkillKeepr has live video interviews with a shared code editor, which needs real-time. [FILL IN: what you personally know about how that real-time part works — only if you worked on it.]"

## 🔁 Follow-up questions

### What is long polling?

The client sends a request, and the server holds it open until there is new data (or a timeout). Then the client sends the next request right away. It is closer to real-time than normal polling.

### Can SSE send data from the browser to the server?

No. SSE is server-to-browser only. The browser sends data with normal `fetch` POST requests.

### Why use Socket.IO instead of the plain WebSocket API?

Socket.IO adds auto-reconnect, rooms, acknowledgements and a fallback to long polling. The trade-off is that both sides must use Socket.IO.

### How do you send a message to only one group of users?

Use Socket.IO rooms. Call `socket.join('room-42')` and send with `io.to('room-42').emit(...)`.

## ✅ Quick check

### 1. An app shows live cricket scores. Users only watch; they never send. Which option is simplest?

:::answer
**SSE.** The server pushes scores one way over plain HTTP.
:::

### 2. You run 3 Express servers with Socket.IO. Users on server 2 don't see messages sent on server 1. Why?

:::answer
Each server only knows its own sockets. Add the **Redis adapter** so servers share events.
:::

### 3. Predict: what does `io.emit('chat:new', msg)` do?

:::answer
It sends `msg` to **every** connected client on that server, including the sender.
:::
