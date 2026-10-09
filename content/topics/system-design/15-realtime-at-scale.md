---
title: "Real-time at scale: WebSockets with a Redis adapter"
stack: system-design
order: 15
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - One WebSocket server keeps connections in its own memory. With many servers, a message sent on server A can't reach users on server B by itself.
  - A pub/sub layer (like the Socket.IO Redis adapter) shares each message with all servers, and each server delivers it to its own users.
  - Load balancers need WebSocket support, long idle timeouts and often sticky sessions.
  - "Serverless option: API Gateway WebSocket APIs keep the connections for you; you save connection IDs and push with the management API."
  - Plan for reconnects, missed messages and many open connections.
cards:
  - q: Why doesn't a WebSocket broadcast work with two servers out of the box?
    a: Each server only knows its own connected sockets. A message sent on server A only reaches users connected to server A.
  - q: What does the Socket.IO Redis adapter do?
    a: It publishes every broadcast to Redis pub/sub. All servers subscribe, so each server receives the message and sends it to its own users in that room.
  - q: Why do Socket.IO apps often need sticky sessions?
    a: Socket.IO may start with HTTP long-polling before upgrading. All those requests must reach the same server, so the load balancer must keep a client on one server.
  - q: How do API Gateway WebSocket APIs work?
    a: AWS keeps the connections. Each connect, disconnect or message triggers a Lambda. You store connection IDs and send messages with postToConnection.
  - q: What happens to messages while a client is disconnected?
    a: They are lost unless you store them. Keep recent events in a database or stream and let the client fetch what it missed after reconnecting.
---

## 💡 What is it?

[WebSockets](topic:rest-auth/websockets) keep a connection open, so the server can push messages at any time. That's great for chat, live notifications and live code editors.

With **one** server it is easy. With **many** servers behind a load balancer, users are spread out. You need a way for all servers to share messages. The common answer is a **pub/sub layer** like Redis.

## 🏠 Real-life example

Think of a **school with two buildings**.

- The principal wants to tell all Class 10 students: "Exam moved to Friday".
- Some Class 10 students sit in building A, some in building B.
- If the principal only speaks on building A's speaker, building B never hears it.
- So the school uses a **phone line between buildings**. The message goes on the line. Each building's office hears it and announces it **to its own Class 10 rooms**.

Map it:
- **Buildings** = WebSocket server instances.
- **Students in rooms** = connected users in a room (like one interview).
- **Phone line between buildings** = Redis pub/sub.
- **Each office announcing locally** = each server sending to its own sockets.

## 🧑‍💻 Code example

Two "servers" share messages through a pretend Redis channel (Node's `EventEmitter`). Save as `realtime.js` and run `node realtime.js`.

```js
const { EventEmitter } = require('node:events');            // Node's built-in event tool
const redis = new EventEmitter();                           // pretend Redis pub/sub channel shared by all servers

function createServer(name) {                               // one WebSocket server instance
  const sockets = new Map();                                // users connected to THIS server only
  redis.on('broadcast', ({ room, text }) => {               // every server listens to Redis
    for (const [user, userRoom] of sockets) {               // look at this server's own users
      if (userRoom === room) console.log(`${name} -> ${user}: ${text}`); // deliver to users in that room
    }                                                       // end of loop
  });                                                       // end of listener
  return {                                                  // what other code can do with this server
    connect(user, room) { sockets.set(user, room); },       // a user opens a socket and joins a room
    send(room, text) { redis.emit('broadcast', { room, text }); }, // publish to Redis, not just locally
  };                                                        // end of returned object
}                                                           // end of createServer

const serverA = createServer('server-A');                   // first instance behind the load balancer
const serverB = createServer('server-B');                   // second instance
serverA.connect('recruiter', 'interview-42');               // recruiter landed on server A
serverB.connect('candidate', 'interview-42');               // candidate landed on server B
serverB.connect('other-user', 'interview-99');              // someone in a different room
serverA.send('interview-42', 'code changed: line 3');       // recruiter's server sends an update
```

**Output:**

```text
server-A -> recruiter: code changed: line 3
server-B -> candidate: code changed: line 3
```

The candidate on server B got the message, and `other-user` in another room did not.

## 🔍 Deeper version

**Option 1: your own WebSocket servers + Redis adapter.**

```text
Users ──► Load balancer (WebSocket support, sticky) ──► Server A ─┐
                                                   └──► Server B ─┼─ Redis pub/sub
                                                   └──► Server C ─┘
```

- With Socket.IO: `io.adapter(createAdapter(pubClient, subClient))` from `@socket.io/redis-adapter`. Then `io.to('interview-42').emit(...)` reaches users on every server.
- **Sticky sessions:** Socket.IO can start with HTTP long-polling. All polling requests must reach the same server, so the load balancer must stick a client to one server. (Pure WebSocket transport avoids this.)
- **Load balancer settings:** allow the `Upgrade` header, and raise idle timeouts. Send heartbeats (ping/pong) so idle connections are not cut.
- **Many connections:** each server can hold many thousands of mostly idle connections, but memory and file-descriptor limits matter.

**Option 2: serverless — API Gateway WebSocket APIs.**
- AWS holds the connections. `$connect`, `$disconnect` and custom routes trigger Lambda functions.
- You save each `connectionId` (with user and room) in a database.
- To push, you call `postToConnection(connectionId, data)` through the management API.
- A `410 Gone` answer means the connection is closed — delete that ID.
- No sticky sessions or Redis adapter needed. But each message is a Lambda call, and there are connection-time limits.

**At SkillKeepr (public-safe):** live features like a shared code editor in interviews and notifications use API Gateway WebSocket APIs, with connection IDs saved and messages pushed to the other people in the same interview. [FILL IN: did you work on any real-time feature?]

**Reliability:**
- Clients **reconnect** with backoff and rejoin their rooms.
- Messages sent while a client was offline are lost. Store important events, and let the client fetch missed ones by "last seen ID".
- Don't trust messages from the client. Check the user's permission for that room on the server.

**Alternatives:** if only the server pushes and messages are simple, [Server-Sent Events](topic:rest-auth/realtime-options) are lighter. Managed services (like Ably, Pusher or AWS AppSync) handle scale for you.

## 🎯 Why do we use it?

Real-time features must work when you run more than one server. Without a shared channel, half your users miss updates. A pub/sub layer, or a managed service, solves that.

## ⚠️ Common mistakes

- **Broadcasting only on the local server.** Users on other instances miss messages.
- **Forgetting sticky sessions** with Socket.IO long-polling. Connections fail in a loop.
- **No heartbeat.** Load balancers silently close idle connections.
- **Keeping stale connection IDs.** Pushes to closed connections fail; clean them up on 410.

## 🗣️ How to answer in an interview

> "A WebSocket server only knows its own connections. So when I run several instances, I add a pub/sub layer. With Socket.IO I use the Redis adapter: each broadcast goes to Redis, every instance receives it and sends it to its own users in that room. The load balancer must support WebSocket upgrades, long idle timeouts, and sticky sessions if long-polling is used.
>
> On AWS, a serverless option is API Gateway WebSocket APIs. AWS keeps the connections, I store connection IDs, and I push with postToConnection, removing IDs that return 410.
>
> I also plan for reconnects and missed messages, and I check permissions on the server for every room."

## 🔁 Follow-up questions

### How would you scale to a million connections?

Many WebSocket servers behind load balancers, tuned OS limits, a pub/sub layer (Redis, or a sharded pub/sub or a stream like Kafka for very high volume), and send only small messages. Or use a managed service.

### How do you make sure a user only gets messages for their room?

Check permission on the server when they join a room. Never trust a room name sent by the client alone.

### What happens if Redis goes down?

Cross-server broadcasts stop. Run Redis with a replica and failover, and let clients refetch state after reconnecting.

## ✅ Quick check

### 1. In the code, why did `other-user` not get the message?

:::answer
Each server only delivers to its own users who are in the matching room. `other-user` is in `interview-99`, not `interview-42`.
:::

### 2. You add a second Socket.IO server without an adapter. A recruiter on server A sends a message to an interview room. What happens to the candidate on server B?

:::answer
The candidate doesn't get it. Server A only knows its own sockets. An adapter like Redis is needed to share the message.
:::

### 3. With API Gateway WebSockets, `postToConnection` returns 410. What should you do?

:::answer
The connection is gone. Delete that connection ID from your database so you stop sending to it.
:::
