---
title: WebSockets vs HTTP; Socket.IO basics
stack: rest-auth
order: 24
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "HTTP is request → response: the client always asks first. A WebSocket is one long-lived, two-way connection: either side can send a message at any time."
  - A WebSocket starts as an HTTP request with an "Upgrade" header, then switches to the ws:// or wss:// protocol on the same TCP connection.
  - Use WebSockets for real-time features — chat, live notifications, live code editors, collaborative editing, dashboards that change every second.
  - Socket.IO is a library on top of WebSockets that adds automatic reconnection, rooms, named events, acknowledgements and a fallback when WebSockets are blocked.
  - Scaling needs care — connections stick to one server, so with many servers you share messages through something like a Redis adapter.
cards:
  - q: What is the main difference between HTTP and WebSockets?
    a: HTTP is one request, one response, and the client must ask first. A WebSocket keeps one connection open, and both client and server can send messages any time.
  - q: How does a WebSocket connection start?
    a: The client sends a normal HTTP GET with "Upgrade, websocket" headers. The server replies 101 Switching Protocols, and from then on the same connection carries WebSocket messages.
  - q: When would you choose WebSockets over normal HTTP?
    a: When the server must push updates instantly and often, or both sides talk a lot — chat, live notifications, multiplayer, live code editors, trading prices.
  - q: Is Socket.IO the same as WebSockets?
    a: No. Socket.IO uses WebSockets underneath but has its own protocol, so a plain WebSocket client can't talk to a Socket.IO server. It adds reconnection, rooms, events and fallbacks.
  - q: What problem appears when you run WebSockets on several servers?
    a: Each user is connected to one server. A message from a user on server A must reach users on server B, so you need a shared channel like the Socket.IO Redis adapter, and often sticky sessions.
---

## 💡 What is it?

**HTTP** works like **ask, then answer**. The client sends a request, the server sends one response, and that exchange is over. The server **can't start** a conversation.

A **WebSocket** is **one connection that stays open**. Both sides can send messages **at any time**. The server can push "you have a new message!" without the client asking.

**Socket.IO** is a popular library built on WebSockets. It adds useful extras: **automatic reconnection**, **rooms** (groups of users) and **named events**.

## 🏠 Real-life example

Think of **letters vs a phone call**.

- **HTTP is like sending letters.** You write a question and post it. The reply comes back. For each new question, you send a new letter. The other person can't write to you unless you write first.
- **A WebSocket is like a phone call.** You dial once. The line stays open. Both of you can talk whenever you want, and you hear each other instantly.

- **Dialling the number** = the HTTP "Upgrade" request.
- **"Connected!"** = the server's `101 Switching Protocols` reply.
- **Talking freely** = WebSocket messages in both directions.
- **Hanging up** = closing the connection.
- **A conference call with only the science club** = a Socket.IO **room**.
- **Your phone redials automatically when the call drops** = Socket.IO's auto-reconnect.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install ws`. Save this as `ws.js` and run `node ws.js`. It starts a tiny chat server and one client in the same file.

```js
const { WebSocketServer, WebSocket } = require('ws');          // the "ws" package: server and client
const wss = new WebSocketServer({ port: 3104 });               // start a WebSocket server on port 3104

wss.on('connection', (socket) => {                             // runs when a client connects
  socket.send('welcome!');                                     // the SERVER talks first — no request needed
  socket.on('message', (data) => {                             // runs when this client sends a message
    for (const client of wss.clients) {                        // loop over every connected client
      if (client.readyState === WebSocket.OPEN) client.send(`chat: ${data}`); // send the message to everyone
    }                                                          // end of the loop
  });                                                          // end of message handler
});                                                            // end of connection handler

const client = new WebSocket('ws://localhost:3104');           // a client opens ONE long-lived connection
client.on('open', () => client.send('Hi from Asha'));          // when connected, send a chat message
client.on('message', (data) => {                               // runs for every message from the server
  console.log('client got:', data.toString());                 // print it
  if (data.toString().startsWith('chat:')) { client.close(); wss.close(); } // done → close both sides
});                                                            // end of message handler
```

**Output:**

```text
client got: welcome!
client got: chat: Hi from Asha
```

Notice the first line. The **server sent "welcome!" on its own**, without any request. Plain HTTP can't do that.

## 🔍 Deeper version

**The handshake.** A WebSocket starts as HTTP:

```text
GET /chat HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
```

After `101`, the same TCP connection carries small **frames** (text or binary) in both directions. `ws://` is plain, and `wss://` is encrypted with TLS. Always use `wss://` in production.

**HTTP vs WebSocket:**

| | HTTP | WebSocket |
|---|---|---|
| Who starts | always the client | either side, any time |
| Connection | short (or reused, but still request/response) | one long-lived connection |
| Overhead per message | full headers each time | a few bytes per frame |
| Caching, CDNs, REST tools | built in | not really |
| Good for | CRUD APIs, loading pages | chat, live updates, games, collaboration |

**Socket.IO basics.** It gives you named events and rooms:

```js
const { Server } = require('socket.io');                       // Socket.IO server
const io = new Server(3000, { cors: { origin: 'http://localhost:5173' } }); // allow our React app

io.on('connection', (socket) => {                              // a user connected
  socket.on('join-interview', (id) => socket.join(`interview:${id}`)); // put them in a room for one interview
  socket.on('code-change', ({ interviewId, code }) => {        // a named event from the client
    socket.to(`interview:${interviewId}`).emit('code-change', code); // send to everyone else in that room
  });
});
```

- **Events** are named (`'code-change'`), not just raw strings.
- **Rooms** let you send to a group (one chat, one interview, one company).
- **Acknowledgements**: the receiver can call back to confirm "got it".
- **Auto-reconnect**, with backoff, and **fallback to HTTP long-polling** if WebSockets are blocked by a proxy.
- Socket.IO has **its own protocol**, so a plain `new WebSocket()` client can't talk to a Socket.IO server. Use `socket.io-client`.

**Authentication.** Browsers can't set custom headers on WebSocket connections. Common options:
- Send cookies (same site), and check the session during the handshake.
- Pass a short-lived token in the Socket.IO `auth` option (`io(url, { auth: { token } })`), and verify it in `io.use()` middleware.
- Avoid putting long-lived tokens in the URL query string, because URLs end up in logs.

**Scaling.** Each connection lives on **one server**, and it stays open for a long time.
- With several servers behind a load balancer, a message must reach users on **other** servers. Use the **Socket.IO Redis adapter** (or Redis pub/sub) to share messages between them.
- Socket.IO's polling fallback needs **sticky sessions**, so one client always goes to the same server.
- Each connection uses memory, so watch the connection count, and send **heartbeats (ping/pong)** to remove dead connections.
- Managed options exist too, like AWS API Gateway WebSocket APIs.

**Reconnection and missed messages.** Phones lose network all the time. After a reconnect, the client should ask for anything it missed (for example "messages after id X"), or reload the latest state over HTTP.

## 🎯 Why do we use it?

- **Instant updates** without the client asking again and again.
- **Lower overhead** for many small messages: no full HTTP headers each time.
- **Two-way talk.** Collaborative tools need both sides to send at any moment.
- **Common features:** chat, notifications, live dashboards, live code or document editors, online games, delivery tracking.

## ⚠️ Common mistakes

- **Using WebSockets for everything,** even normal CRUD. REST is simpler to cache, test and secure.
- **No reconnection logic** with plain `ws`. The first network blip silently breaks the feature.
- **Not cleaning up** listeners and intervals when a socket closes, which causes memory leaks (see [server memory leaks](topic:nodejs/memory-and-leaks)).
- **Forgetting multi-server scaling,** so users on different servers can't see each other's messages.
- **Trusting messages from the client** without checking who sent them and whether they may join that room.

## 🗣️ How to answer in an interview

> "HTTP is request-response: the client always asks, and the server answers once. A WebSocket starts as an HTTP request with an Upgrade header. The server replies 101 Switching Protocols, and then the same connection stays open, so both sides can send messages any time. I'd use it for chat, live notifications, collaborative editors or live dashboards, and plain REST for normal CRUD.
>
> In Node I'd usually use Socket.IO. It adds named events, rooms, acknowledgements, automatic reconnection and a long-polling fallback. For example, each interview or chat can be a room, and I emit to that room. I authenticate during the handshake with a cookie or a short-lived token. To scale across several servers, I add the Redis adapter and sticky sessions. And after a reconnect, the client re-fetches anything it missed."

[FILL IN: a real feature where you used WebSockets (your resume lists WebSockets). Only add details that are true.]

## 🔁 Follow-up questions

### WebSockets vs Server-Sent Events?

**SSE** is one-way (server → client) over normal HTTP, with automatic reconnect built in. It's great for notifications and progress bars. **WebSockets** are two-way, which is better for chat and collaboration. See [real-time options compared](topic:rest-auth/realtime-options).

### How do you know if a client disconnected without saying so?

With **heartbeats**. The server sends a ping every few seconds. If no pong comes back in time, it closes the connection and cleans up. Socket.IO does this for you.

### Do WebSockets work through load balancers and proxies?

Yes, if they support the `Upgrade` header and long idle connections. You may need to raise idle timeouts. With Socket.IO's polling fallback, you also need sticky sessions.

### Can you use WebSockets in a serverless (Lambda) backend?

Not directly, because Lambda functions don't stay running. Managed services like AWS API Gateway WebSocket APIs keep the connections open. They call your Lambda for each message, and you send messages back to a connection id through an API.

## ✅ Quick check

### 1. What status code does the server send to accept a WebSocket upgrade?

:::answer
**101 Switching Protocols.** After that, the same connection carries WebSocket frames.
:::

### 2. Which feature is the best fit for WebSockets?

- A) Loading a list of jobs once when a page opens
- B) A live code editor shared by an interviewer and a candidate
- C) Downloading a PDF report

:::answer
**B.** Both people type and see changes instantly, in both directions. A and C are normal one-time requests, which suit HTTP.
:::

### 3. True or false: a browser's built-in `new WebSocket('ws://...')` can connect directly to a Socket.IO server.

:::answer
**False.** Socket.IO adds its own protocol on top of WebSockets. Use the `socket.io-client` library to connect.
:::
