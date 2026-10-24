---
title: "Scenario: real-time chat app"
stack: mern-architectures
order: 31
level: Intermediate
mustKnow: false
askedFrequency: common
template: pattern
section: Choosing an architecture
summary:
  - "A chat app needs messages to arrive at once, so it uses WebSockets (often Socket.IO) next to a normal REST API."
  - "Split the work: REST for login, rooms and old message history; WebSockets only for live events (new message, typing, online)."
  - "Save each message in MongoDB first, then broadcast it to the room. History is loaded page by page with a cursor."
  - "To run more than one server, add the Socket.IO Redis adapter, so a message sent on server A reaches users connected to server B."
  - "Offline users get push or email notifications through a background queue, not through the socket."
cards:
  - q: Why not use plain REST polling for chat?
    a: "Polling asks 'any new messages?' again and again. It is slow to show messages and wastes requests. WebSockets keep one open connection and push messages instantly."
  - q: What goes over REST and what goes over the socket in a chat app?
    a: "REST: login, creating rooms, loading old messages. Socket: new messages, typing indicators, online/offline status."
  - q: Why do you need the Redis adapter with Socket.IO?
    a: "Each server only knows its own connected users. The Redis adapter shares broadcasts between servers, so everyone in a room gets the message."
  - q: How do you load old messages efficiently?
    a: "Cursor pagination: ask for 30 messages older than the last one you have, using an index on { roomId, createdAt }."
---

## 💡 What is it?

A **chat app** lets people send messages that show up on the other person's screen **straight away**. Think WhatsApp Web or a support chat on a shop website.

Normal web pages only get data when they **ask** for it. Chat needs the server to **push** a message the moment it arrives. So a chat app adds a **WebSocket** connection: a phone line between the browser and the server that stays open.

This page designs a MERN chat app: React, Express, Socket.IO and MongoDB, and how it grows to many servers.

## 🏠 Real-life example

Think of a **school with a notice board and a PA system** (loudspeakers in every class).

- **The notice board** = MongoDB. Every announcement is pinned there, so anyone can read old ones later.
- **The PA system** = the WebSocket. When something new happens, everyone in the class hears it at once.
- **Each classroom** = a chat room. The PA can speak to just one class.
- **The school office** = the Express REST API. You go there to join a class or get old notices.
- **Two school buildings with one shared PA control** = two servers with the Redis adapter. An announcement made in building A also plays in building B.
- **A note sent home for absent students** = a push notification or email for users who are offline.

## 🗺️ The diagram

```text
   Browser (React)                                     Browser (React)
   ┌──────────────┐                                    ┌──────────────┐
   │ chat screen  │                                    │ chat screen  │
   └──┬────────┬──┘                                    └──┬────────┬──┘
 REST │        │ WebSocket                      WebSocket │        │ REST
      │        │                                          │        │
 ┌────▼────────▼───────────┐  load balancer   ┌───────────▼────────▼────┐
 │ Server A                │  (sticky         │ Server B                │
 │ Express 5 + Socket.IO   │   sessions)      │ Express 5 + Socket.IO   │
 └────┬───────────┬────────┘                  └────────┬───────────┬────┘
      │           └──── Redis adapter (pub/sub) ───────┘           │
      │                 "room 42: new message"                     │
      ▼                                                            ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │ MongoDB: users, rooms, messages  (index on { roomId, createdAt })     │
 └──────────────────────────────────────────────────────────────────────┘
      │
      └─► queue → worker → push / email for offline users
```

## 🧑‍💻 Code example

The key piece: when a message arrives, **save it, then send it to everyone in that room**. This version keeps messages in an array, so it runs without MongoDB.

Set up:

```bash
npm init -y
npm install express socket.io socket.io-client
```

Save this as `chat-server.mjs`. Run it with `node chat-server.mjs`.

```js
import express from 'express';                                       // load Express 5 for REST routes
import { createServer } from 'node:http';                            // Socket.IO needs a plain HTTP server
import { Server } from 'socket.io';                                   // the WebSocket library (v4)

const app = express();                                                // REST app
const httpServer = createServer(app);                                 // one HTTP server for REST and sockets
const io = new Server(httpServer, { cors: { origin: '*' } });         // '*' = allow any site (demo only!)

const messages = [];                                                  // fake "messages" collection

app.get('/api/rooms/:roomId/messages', (req, res) => {                // REST: load old history
  res.json(messages.filter((m) => m.roomId === req.params.roomId));   // only this room's messages
});                                                                   // end of history route

io.on('connection', (socket) => {                                     // a browser opened a live connection
  socket.on('join', (roomId) => socket.join(roomId));                 // put this user into a room
  socket.on('message', (msg, ack) => {                                // the user sent a chat message
    const saved = { ...msg, id: messages.length + 1, at: Date.now() }; // add an id and a time
    messages.push(saved);                                             // 1. save first (MongoDB in real life)
    io.to(msg.roomId).emit('message', saved);                         // 2. then push to everyone in the room
    ack?.({ ok: true, id: saved.id });                                // 3. tell the sender "saved"
  });                                                                 // end of message handler
});                                                                   // end of connection handler

httpServer.listen(3000, () => console.log('Chat on 3000'));           // start REST + sockets on port 3000
```

Save this as `chat-client.mjs`. In a second terminal, run `node chat-client.mjs`.

```js
import { io } from 'socket.io-client';                                // the client side of Socket.IO

const socket = io('http://localhost:3000');                           // open the live connection
socket.emit('join', 'room-42');                                       // join room 42
socket.on('message', (m) => console.log(`${m.from}: ${m.text}`));     // print every new message in the room
socket.emit('message', { roomId: 'room-42', from: 'Asha', text: 'Hi all!' }, (ack) => console.log('ack', ack)); // send one
```

Output in the client terminal:

```text
Asha: Hi all!
ack { ok: true, id: 1 }
```

## 🔍 Deeper version

### The design, piece by piece

| Piece | Choice | Why |
|---|---|---|
| Frontend | React SPA, one socket per tab | The chat screen updates when socket events arrive. |
| Live channel | Socket.IO over WebSockets | Rooms, auto-reconnect and acks are built in. See [real-time options](topic:mern-architectures/realtime-options). |
| REST API | Express 5 | Login, create room, list rooms, load history. |
| Auth | JWT in an HttpOnly cookie, checked on socket connect | The handshake sends the cookie. Reject the socket if the token is bad. |
| Data | MongoDB `messages` with an index on `{ roomId: 1, createdAt: -1 }` | Fast "last 30 messages of room 42". See [indexes](topic:mongodb/indexes). |
| History | [Cursor pagination](topic:rest-auth/pagination-offset-cursor) | Skip-based paging gets slow and jumps when new messages arrive. |
| Files and images | [Presigned uploads](topic:mern-architectures/presigned-uploads) to S3; the message holds the URL | Big files never go through the socket. |
| Many servers | Socket.IO Redis adapter + sticky sessions | See below. |
| Offline users | A [queue](glossary:queue) and a worker send push or email | Slow work stays out of the socket handler. |

### Why save first, then broadcast?

If you broadcast first and the save fails, people see a message that doesn't exist after a refresh. Save first, then emit the saved message (with its real id and time). The **ack** tells the sender's screen to change "sending…" to "sent".

### Scaling to many servers

One Node.js server can hold many thousands of open sockets. But when you run **two** servers:
- User A is on server 1. User B is on server 2.
- `io.to('room-42').emit(...)` on server 1 only reaches sockets on server 1. User B never gets it.

The fix is the **Redis adapter** (`@socket.io/redis-adapter`). Each server publishes room broadcasts to Redis, and the other servers pass them on to their own sockets. Also turn on **sticky sessions** at the load balancer. Socket.IO's first connection steps may use plain HTTP requests, and they must reach the same server. Read more in [real-time at scale](topic:system-design/realtime-at-scale).

### How it grows

| Stage | Change |
|---|---|
| Small (one server) | Express + Socket.IO in one process, MongoDB Atlas |
| More users | 2+ servers, Redis adapter, sticky sessions |
| Busy chat | Separate the socket servers from the REST API, so each scales alone |
| Huge scale | Shard messages by room, archive old messages, use a managed real-time service if it costs less |

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| Messages show up instantly | Open connections use server memory |
| One connection instead of constant polling | Scaling needs Redis and sticky sessions |
| Socket.IO handles reconnects and rooms | Harder to debug than plain REST |
| REST still handles the simple parts | Serverless functions can't hold sockets for long (use a managed service there) |

## 🎯 When to choose it

- Chat between users: support chat, team chat, a class discussion room.
- Live updates both ways: collaborative editing, live interview tools, multiplayer games.
- Notifications that must arrive within a second.

If data only flows **from server to browser** (live scores, a progress bar), [SSE](glossary:sse) is simpler. If updates every 30 seconds are fine, plain polling is simplest.

## ⚠️ Common mistakes

- **Sending everything over the socket.** Login, history and file uploads belong in REST and S3. Keep the socket for small live events.
- **Broadcasting before saving.** Messages disappear after a refresh when the save fails.
- **Running two servers without the Redis adapter.** Half the users miss messages, and it looks random.
- **No auth on the socket.** Anyone can connect and join any room. Check the token on connect, and check room membership on `join`.

## 🗣️ How to answer in an interview

> "For a chat app I'd use a React SPA, an Express 5 REST API and Socket.IO on the same Node server, with MongoDB for storage.
>
> REST handles login, rooms and history. History uses cursor pagination on an index of roomId and createdAt. The socket only carries live events: new messages, typing and online status. When a message comes in, I save it to MongoDB first, then emit it to the room, and send an ack to the sender.
>
> Auth is a JWT in an HttpOnly cookie, checked during the socket handshake. Images go straight to S3 with presigned URLs.
>
> To scale beyond one server, I'd add the Socket.IO Redis adapter and sticky sessions on the load balancer. Notifications for offline users go through a queue and a worker."

[FILL IN: if you have built real-time features yourself, name one here. Only say what you really built.]

## 🔁 Follow-up questions

### How do you show "online" and "typing"?

Track connected sockets per user. On connect and disconnect, emit `online` and `offline` to their contacts. For typing, emit `typing` on key presses with a short throttle. Don't save these events to the database; they are temporary.

### What happens when the user's internet drops for 10 seconds?

Socket.IO reconnects by itself. After reconnecting, the client asks REST for messages newer than the last one it has. That fills the gap.

### How do you stop the same message being saved twice?

The client sends a unique `clientMessageId`. The server stores it with a unique index, so a retry doesn't create a second copy.

### Can you run this on AWS Lambda?

Not with Socket.IO, because Lambda doesn't keep a connection open. You'd use API Gateway WebSocket APIs or a managed real-time service instead.

## ✅ Quick check

### 1. You run two chat servers. Users on server 1 don't get messages sent by users on server 2. What is missing?

:::answer
The **Socket.IO Redis adapter** (and sticky sessions). Without it, each server only broadcasts to its own connected sockets.
:::

### 2. Which should go over REST, not the socket?

- A) A "typing…" indicator
- B) Loading the last 30 messages of a room
- C) A new message arriving

:::answer
**B.** Loading history is a normal request–response. A and C are live events, so they go over the socket.
:::

### 3. Predict: the server does `io.to(roomId).emit(...)`, and then the database save throws an error. What does the user see after refreshing?

:::answer
The message is **gone**. Everyone saw it live, but it was never saved. That's why you save first, then broadcast.
:::
