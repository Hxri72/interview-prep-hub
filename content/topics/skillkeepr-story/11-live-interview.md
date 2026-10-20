---
template: chapter
title: The live video interview with a shared code editor
stack: skillkeepr-story
order: 11
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Video runs through a hosted video-meeting service (Jitsi as a Service); the server gives each person a signed token to join."
  - "The shared code editor sends every change over a WebSocket and broadcasts it to others in the same interview."
  - "Each interview is a 'room': messages go only to people in that room, never to other interviews."
  - "After the interview, the recording is saved, and reviews and ratings are stored for that round."
cards:
  - q: How does a person join the video call securely?
    a: The server creates a signed token for that person and that room. The video service only lets in people with a valid token.
  - q: How does the shared code editor stay in sync?
    a: Each change goes over a WebSocket to the server, which sends it to everyone else in the same interview room.
  - q: Why not use normal HTTP requests for the editor?
    a: HTTP is request-response. A WebSocket stays open, so the server can push changes to others instantly.
  - q: What is a 'room' in WebSocket terms?
    a: A group of connections, here one interview. A message is sent only to the connections in that group.
---

## 💡 What happens in this chapter

It's interview time. Priya and Rahul join a **video call** inside SkillKeepr.

Priya asks Rahul to solve a coding problem. They both see a **shared code editor**. When Rahul types, Priya sees it straight away.

After the call, the recording is saved, and Priya leaves **ratings and a review**.

## 🏠 Real-life example

Think of an **exam hall with a whiteboard**.

- The **hall pass** with your name and room number = the signed token to join the video.
- The **hall itself** = the hosted video service.
- The **whiteboard everyone in the room can see** = the shared code editor.
- **Writing on the board** is seen only by people in that hall, not in the next hall = messages go only to one room.
- The **CCTV recording** and the **examiner's marks sheet** = the recording and the ratings.

## 🗺️ The flow

```text
Priya / Rahul click "Join interview"
        │
        ▼
Server checks they belong to this interview ─► creates a signed token (room + role)
        │                                         (interviewer = moderator)
        ▼
Browser opens the hosted video meeting with that token

Shared code editor:
Rahul types ─► WebSocket message ─► server (WebSocket API)
                                       │ saves the latest code
                                       ▼
                     sends it to every OTHER connection in the same interview
                                       │
                                       ▼
                               Priya's editor updates

After the call: recording saved ─► reviews and ratings stored for this round
```

## 🧱 Tech used

| Piece | Technology | Learn it |
|---|---|---|
| Video meeting | Jitsi as a Service (hosted video) | [Client and server](topic:web-fundamentals/client-server) |
| Join security | A server-signed token per person and room | [JWT: structure and how it works](topic:rest-auth/jwt) |
| Live editor sync | WebSocket API (API Gateway WebSockets) | [WebSockets vs HTTP](topic:rest-auth/websockets) |
| Choosing real-time tech | Polling vs SSE vs WebSockets | [Real-time options](topic:rest-auth/realtime-options) |
| Many users at once | Rooms, connection list, cleanup | [Real-time at scale](topic:system-design/realtime-at-scale) |
| Reviews and ratings | Stored per interview round in MongoDB | [Embedding vs referencing](topic:mongodb/embedding-vs-referencing) |

## 🧑‍💻 Key code idea

A tiny **room broadcast** with a real WebSocket server. A message goes to everyone in the same interview, except the sender.

Setup: `npm init -y`, then `npm install ws`. Save as `room.js` and run `node room.js`.

```js
const { WebSocketServer, WebSocket } = require('ws');           // ws = a small WebSocket library for Node
const wss = new WebSocketServer({ port: 4911 });                 // the server listens on port 4911
const rooms = new Map();                                         // interviewId → set of open connections

wss.on('connection', (socket, req) => {                          // a browser tab connects
  const room = new URL(req.url, 'http://x').searchParams.get('interview'); // which interview it joined, e.g. ?interview=42
  if (!rooms.has(room)) rooms.set(room, new Set());              // first person in this room → make the set
  rooms.get(room).add(socket);                                   // remember this connection in its room
  socket.on('message', (code) => {                               // someone typed in the shared editor
    for (const other of rooms.get(room)) {                       // go through everyone in the SAME room
      if (other !== socket && other.readyState === WebSocket.OPEN) other.send(code.toString()); // send to others, not back to the sender
    }                                                            // end of loop
  });                                                            // end of message handler
  socket.on('close', () => rooms.get(room).delete(socket));      // forget the connection when the tab closes
});                                                              // end of connection handler

const join = (name, room) => new Promise((ok) => {               // helper: open a connection for a person
  const ws = new WebSocket(`ws://127.0.0.1:4911/?interview=${room}`); // connect to the room
  ws.on('message', (m) => console.log(`${name} sees:`, m.toString())); // print what this person receives
  ws.on('open', () => ok(ws));                                   // ready to use
});                                                              // end of join

(async () => {                                                   // run the demo
  const rahul = await join('Rahul', '42');                       // candidate joins interview 42
  await join('Priya', '42');                                     // recruiter joins the same interview
  await join('Other recruiter', '77');                           // someone in a different interview
  rahul.send('function sum(a, b) { return a + b; }');            // Rahul types code
  setTimeout(() => { wss.clients.forEach((c) => c.terminate()); wss.close(); }, 300); // stop everything after the demo
})();                                                            // end of demo
```

```text
Priya sees: function sum(a, b) { return a + b; }
```

Only Priya sees it. Rahul doesn't get his own text back, and the person in interview 77 sees nothing.

## 🧗 Hard parts and trade-offs

- **Two people typing at once.** Sending the whole text on every change is simple, but the last writer wins. Real collaborative editors use smarter merging (like CRDTs). Debouncing changes also cuts traffic.
- **Dropped connections.** Wi-Fi drops. The client must reconnect, and the server must clean up dead connections. A closed connection should be removed from the room.
- **Serverless WebSockets.** With API Gateway WebSockets, there's no long-running server holding the list. Connection IDs are stored in a database, and the server pushes messages by ID.
- **Fair interviews.** The editor can block copy and paste for candidates. It's a simple anti-cheating step.
- **Buying vs building video.** Building video calling is very hard. Using a hosted service saves months, at a per-use cost.

## 🙋 My part

[FILL IN: which parts of the live interview, code editor or recording flow you worked on, if any. If none, say "I know how it works, but another developer built it."]

## 🗣️ How to explain it in an interview

> "For live interviews, we use a hosted video service instead of building video ourselves. When someone joins, our server checks they belong to that interview and signs a token for that room, with the interviewer as moderator.
>
> The shared code editor works over WebSockets. Each change goes to the server, which saves the latest code and broadcasts it to the other people in the same interview — a room per interview, so nothing leaks to other interviews. Because the backend is serverless, connection IDs are stored in the database and messages are pushed by ID.
>
> After the call, the recording is saved, and the interviewer's ratings and review are stored for that round."

## 🔁 Follow-up questions

### Why WebSockets and not polling for the editor?

Polling asks the server again and again, which is slow and wasteful. A WebSocket stays open, so changes arrive in milliseconds.

### How do you stop someone joining another company's interview?

The server checks the user and the interview before signing the token. The token names one room, so it can't be reused for another.

### What happens if two people edit at the same time?

With a simple "send the whole text" approach, the last change wins. For true live co-editing, you'd use CRDTs or operational transforms.

### How do you scale WebSockets to many servers?

Connections live on different servers, so you need shared state: a Redis adapter, or (serverless) connection IDs stored in a database.

## 📚 Topics to revise

- [WebSockets vs HTTP; Socket.IO basics](topic:rest-auth/websockets)
- [Polling, SSE and WebSockets compared](topic:rest-auth/realtime-options)
- [Real-time at scale](topic:system-design/realtime-at-scale)
- [JWT: structure and how it works](topic:rest-auth/jwt)
- [Debounce and throttle](topic:javascript/debounce-throttle)
- [Embedding vs referencing](topic:mongodb/embedding-vs-referencing)
