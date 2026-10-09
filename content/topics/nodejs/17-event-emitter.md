---
title: EventEmitter and custom events
stack: nodejs
order: 17
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - An EventEmitter lets one part of your code shout "this happened!" and other parts react to it.
  - "on() adds a listener, once() adds a listener that runs only one time, emit() fires the event, off() removes a listener."
  - emit() is synchronous. All listeners run right away, in the order you added them.
  - "The 'error' event is special: if you emit it and nobody listens, Node throws and can crash the app."
  - Remove listeners you no longer need. Too many listeners (over 10 per event) gives a memory-leak warning.
cards:
  - q: What is an EventEmitter?
    a: A Node class that lets code emit named events and lets other code listen for them with on() or once().
  - q: Does emit() run listeners now or later?
    a: Now. emit() is synchronous. It calls every listener one by one, in the order they were added, before it returns.
  - q: What happens if you emit 'error' and there is no 'error' listener?
    a: Node throws the error. If nothing catches it, the process crashes. Always add an 'error' listener.
  - q: What does the MaxListenersExceededWarning mean?
    a: More than 10 listeners were added to one event (the default limit). It often means a memory leak, like adding a listener on every request and never removing it.
  - q: Name three Node core objects that are EventEmitters.
    a: http.Server (the 'request' event), streams ('data', 'end'), and process ('exit', 'SIGTERM').
---

## 💡 What is it?

An **EventEmitter** is a Node.js tool for sending messages inside your app.

One part of the code **emits** (fires) an [event](glossary:event), like "order placed". Other parts **listen** for that event and run some code when it happens. The code that listens is called a [listener](glossary:listener).

The part that fires the event doesn't need to know who is listening. It just shouts, and whoever cares reacts.

## 🏠 Real-life example

Think of the **school bell**.

The bell rings. It doesn't know who hears it. But many people react:
- Students go to the next class.
- The teacher starts the lesson.
- The canteen staff get ready for lunch.

Some reactions happen only once. For example, on the first day, the principal gives a welcome speech after the first bell.

- The **bell** = the EventEmitter.
- **Ringing the bell** = `emit('ring')`.
- **Students, teacher, canteen staff** = listeners added with `on('ring', …)`.
- **The welcome speech, only on the first bell** = a listener added with `once('ring', …)`.
- The **period number** announced with the bell = the data sent with the event.

## 🧑‍💻 Code example

Save this as `bell.js`. Run it with `node bell.js`.

```js
const { EventEmitter } = require('node:events');       // load the EventEmitter class from Node's events module

const bell = new EventEmitter();                       // make a new emitter — our school bell

bell.on('ring', (period) => {                          // listener 1: runs EVERY time 'ring' happens
  console.log(`Class ${period} starts`);               // period is the value sent with the event
});                                                    // end of listener 1

bell.once('ring', () => {                              // listener 2: runs only the FIRST time 'ring' happens
  console.log('Welcome speech (only once)');           // after this runs, Node removes it by itself
});                                                    // end of listener 2

console.log('before emit');                            // normal code, to show the order
bell.emit('ring', 1);                                  // fire 'ring' and send 1 → both listeners run right now
bell.emit('ring', 2);                                  // fire again and send 2 → only listener 1 is left
console.log('after emit');                             // runs only after all listeners have finished
console.log(bell.listenerCount('ring'));               // prints 1 → the once() listener is gone
```

**Output:**

```text
before emit
Class 1 starts
Welcome speech (only once)
Class 2 starts
after emit
1
```

**What to notice:**
- "after emit" comes **after** the listeners. `emit()` runs every listener right away, then returns.
- Listeners run in the order you added them.

## 🔍 Deeper version

**The main methods:**

| Method | What it does |
|---|---|
| `on(name, fn)` | add a listener (`addListener` is the same) |
| `once(name, fn)` | add a listener that removes itself after one run |
| `emit(name, ...args)` | call every listener for that event with these arguments; returns `true` if there were listeners |
| `off(name, fn)` | remove one listener (`removeListener` is the same) |
| `removeAllListeners(name)` | remove all listeners for that event |
| `prependListener(name, fn)` | add a listener at the **front** of the line |

**emit() is synchronous.** It does **not** use the [event loop](topic:nodejs/event-loop). The listeners run on the [call stack](glossary:call-stack), one after another. So a slow listener slows down the code that called `emit()`. If you want a listener to run later, put the work inside `setImmediate` or a promise.

**The special 'error' event.** If you emit `'error'` and there is **no** `'error'` listener, Node throws the error. If nobody catches it, the app crashes. That's why you always add `.on('error', …)` to streams, sockets and your own emitters.

**The listener limit.** By default, Node warns when one event has more than **10** listeners. The warning is called `MaxListenersExceededWarning`. It's not an error. But it usually means a [memory leak](glossary:memory-leak). For example, you add a listener inside a request handler and never remove it. You can change the limit with `emitter.setMaxListeners(n)`, but first check for a leak.

**Making your own emitter class.** You can extend it:

```js
class OrderService extends EventEmitter {                // OrderService now has on/emit/off
  placeOrder(order) {                                    // a normal method
    // ...save the order in the database...
    this.emit('order:placed', order);                    // tell anyone who cares that an order was placed
  }                                                      // end of placeOrder
}                                                        // end of OrderService
```

Then an email module can do `orders.on('order:placed', sendReceipt)`. The order code doesn't need to know about emails. This is called **loose coupling** — parts that work together without depending on each other.

**Async listeners.** If a listener is an `async` function and it throws, the error becomes a rejected promise. `emit()` doesn't see it. You can create the emitter with `new EventEmitter({ captureRejections: true })`. Then those errors are sent to the `'error'` event.

**Promise helpers.** `events.once(emitter, 'ready')` returns a promise. You can `await` it. `events.on(emitter, 'data')` gives an async iterator, so you can use `for await`.

**EventEmitter is everywhere in Node:**
- `http.Server` emits `'request'`.
- [Streams](topic:nodejs/streams) emit `'data'`, `'end'`, `'error'`.
- `process` emits `'exit'`, `'SIGTERM'`, `'unhandledRejection'`.

## 🎯 Why do we use it?

- **To keep code parts separate.** The billing code says "payment succeeded". The email code, the analytics code and the logging code each listen. You can add a new listener without touching the billing code.
- **To react to things that happen many times**, like each new request, each new chunk of a file, or each new message on a socket.
- **Because Node itself is built on it.** If you understand EventEmitter, you understand streams, HTTP servers and `process` events.

It works **inside one process only**. It is not a message queue. If the app restarts, the events are gone. To send events between services, use a queue or webhooks instead.

## ⚠️ Common mistakes

- **No `'error'` listener.** One emitted error crashes the whole app.
- **Adding listeners inside a function that runs many times** (like a request handler) and never removing them. This leaks memory and triggers the max-listeners warning.
- **Thinking `emit()` is async.** It runs the listeners right away. A slow listener blocks the code that called `emit()`.
- **Using an arrow function and expecting `this` to be the emitter.** With a normal `function`, `this` is the emitter. With an arrow function, it isn't.

## 🗣️ How to answer in an interview

> "EventEmitter is Node's built-in way to do the publish–subscribe pattern inside one process. One part of the code calls `emit` with an event name and some data. Other parts register listeners with `on` or `once`. `emit` is synchronous, so all listeners run right away, in the order they were added.
>
> A lot of Node is built on it. HTTP servers, streams and `process` are all EventEmitters. Two things I always keep in mind: the `'error'` event, because if nobody listens to it Node throws and the process can crash, and listener cleanup, because adding listeners in a loop or per request without removing them causes memory leaks. Node warns about that when one event gets more than 10 listeners.
>
> I'd use it to decouple modules inside a service. But for events between services, I'd use a queue or webhooks, because an EventEmitter doesn't survive a restart."

[FILL IN: a place you used EventEmitter or Node events in a SkillKeepr service, if any. Only add it if it's true.]

## 🔁 Follow-up questions

### Is emit() synchronous or asynchronous?

Synchronous. `emit()` calls each listener one after another and returns only when all have finished. If you need async behaviour, the listener itself must schedule the work, for example with `setImmediate` or a promise.

### What happens if an async listener throws an error?

The error becomes a rejected promise, and `emit()` can't catch it. You may get an unhandled rejection. Fix it with `try/catch` inside the listener, or create the emitter with `{ captureRejections: true }` so the error goes to the `'error'` event.

### How is EventEmitter different from a message queue like RabbitMQ or BullMQ?

An EventEmitter lives in memory inside one Node process. Events are not saved, not retried, and not shared with other servers. A message queue stores messages, retries failed ones, and works across many services and servers.

### How do you wait for an event with async/await?

Use `const [value] = await events.once(emitter, 'ready');` from the `node:events` module. It returns a promise that resolves with the event's arguments. It rejects if `'error'` is emitted first.

## ✅ Quick check

### 1. What does this print?

```js
const { EventEmitter } = require('node:events');   // load EventEmitter
const e = new EventEmitter();                      // make an emitter
e.on('hi', () => console.log('B'));                // listener
console.log('A');                                  // normal code
e.emit('hi');                                      // fire the event
console.log('C');                                  // normal code
```

:::answer
**A, B, C.** `emit()` is synchronous. It runs the listener (B) before moving to the next line (C).
:::

### 2. A listener is added with `once()`. You call `emit()` three times. How many times does it run?

:::answer
**One time.** A `once()` listener removes itself after its first run.
:::

### 3. Your logs show `MaxListenersExceededWarning: 11 'data' listeners added`. What is the most likely cause?

- A) Node is out of memory
- B) Code adds a new listener again and again (for example, on every request) and never removes it
- C) The event name is too long

:::answer
**B.** It's usually a listener leak. Remove the listener with `off()`, or use `once()`, or add it only one time outside the repeated code.
:::
