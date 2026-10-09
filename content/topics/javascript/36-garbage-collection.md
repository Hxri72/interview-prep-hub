---
title: Garbage collection and memory leaks
stack: javascript
order: 36
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - JavaScript frees memory for you. The garbage collector removes objects that nothing can reach any more.
  - "\"Reachable\" means you can get to it from the roots: global variables, the running functions, and the DOM."
  - A memory leak is memory you no longer need but still keep a link to, so it can never be freed.
  - "Common browser leaks: event listeners never removed, timers never cleared, detached DOM nodes, ever-growing caches, closures holding big data."
  - Find leaks with Chrome DevTools → Memory → heap snapshots. Fix them with cleanup (removeEventListener, clearInterval, AbortController, useEffect cleanup).
cards:
  - q: What is garbage collection in JavaScript?
    a: The engine automatically frees memory used by objects that can no longer be reached from the roots (globals, the call stack, the DOM).
  - q: What does "reachable" mean?
    a: You can get to the object by following links from a root, like a global variable or a running function. Unreachable objects can be freed.
  - q: What is a memory leak?
    a: Memory you don't need any more but still hold a link to, so the garbage collector can never free it. Memory use keeps growing.
  - q: What is a detached DOM node?
    a: An element removed from the page but still referenced by JavaScript (a variable, array or listener), so it stays in memory.
  - q: How do you find a memory leak in the browser?
    a: Chrome DevTools → Memory tab. Take a heap snapshot, repeat the action, take another, and compare what keeps growing. Look for "Detached" elements.
---

## 💡 What is it?

Every object you make in JavaScript uses memory. You never free that memory by hand.

The **[garbage collector](glossary:garbage-collection)** (GC) does it for you. It finds objects that nothing can **reach** any more, and it frees their memory.

A **[memory leak](glossary:memory-leak)** happens when you still hold a link to something you don't need. The GC can't free it, so memory use keeps growing.

## 🏠 Real-life example

Think of a **school classroom** and the **cleaner** who comes in the evening.

The cleaner throws away anything that **nobody has claimed**. A paper on the floor goes in the bin. But a notebook with a student's name on it stays, because someone still owns it.

- **The cleaner** = the garbage collector.
- **Things with a name on them** = objects that are still reachable.
- **Paper nobody owns** = unreachable objects, so they get freed.
- **A memory leak** = a student who writes their name on *every* old paper and never takes them home. The cleaner can't throw them away, and the room slowly fills up.

## 🧑‍💻 Code example

Save this as `gc.js`. Run it with `node gc.js`. (The same rules apply in the browser.)

```js
let user = { name: 'Hari', skills: ['Node', 'React'] }; // an object in memory; user points to it
let backup = user;                                      // a second variable points to the SAME object
user = null;                                            // remove one link — object is still reachable
console.log(backup.name);                               // "Hari" → still alive, backup holds it
backup = null;                                          // remove the last link → now unreachable
console.log('object can now be garbage collected');      // GC may free it whenever it wants

const cache = [];                                       // a global list that lives forever
function handleRequest(id) {                            // pretend this runs on every request
  const bigData = new Array(100_000).fill(id);          // 100,000 items of data
  cache.push(bigData);                                  // LEAK: we keep every result forever
}                                                       // end of handleRequest
for (let i = 0; i < 50; i++) handleRequest(i);          // 50 "requests"
const heapMB = process.memoryUsage().heapUsed / 1024 / 1024; // heap memory in use, in megabytes
console.log('items kept:', cache.length, '| heap over 30 MB:', heapMB > 30); // 50 items, memory kept growing
cache.length = 0;                                       // the fix: clear (or limit) the cache
console.log(`after clearing: ${cache.length} items kept`); // 0 → the arrays can be freed
```

**Output:**

```text
Hari
object can now be garbage collected
items kept: 50 | heap over 30 MB: true
after clearing: 0 items kept
```

**What to notice:**
- Setting `user = null` did **not** free the object, because `backup` still pointed to it.
- The `cache` array kept every `bigData` alive. The function finished, but the data stayed.

## 🔍 Deeper version

**1. Mark-and-sweep.** Modern engines like [V8](glossary:v8) use this idea:
1. Start from the **roots**: global variables, the current [call stack](glossary:call-stack), and the DOM.
2. **Mark** every object you can reach by following links.
3. **Sweep** (free) everything that was not marked.

This also handles **circular references**. Two objects that point to each other are still freed if no root can reach them.

**2. Generations.** Most objects die young, like temporary arrays in a loop. So V8 splits the [heap](glossary:heap) into:
- a **young generation**, cleaned often and fast,
- an **old generation**, for objects that survive, cleaned less often.

GC work can briefly pause your code. Most of it now runs in the background, but huge heaps still cause small pauses.

**3. Common browser leaks:**

| Leak | Why it leaks | Fix |
|---|---|---|
| Event listener never removed | The listener holds its closure and the element | `removeEventListener`, or `{ signal }` with AbortController |
| `setInterval` never cleared | The timer keeps its callback alive forever | `clearInterval` in cleanup |
| Detached DOM node | The element is removed from the page, but a variable still points to it | Set the variable to `null`, and remove listeners |
| Ever-growing cache or array | Nothing is ever deleted | Limit the size, add expiry, or use `WeakMap` |
| Closure holding big data | A long-living function keeps outer variables alive | Don't capture what you don't need |

**4. React example.** In React, most leaks come from a missing `useEffect` cleanup. Clear timers, remove listeners, close sockets and abort fetches. See [useEffect](topic:react/use-effect).

**5. WeakMap and WeakRef.** A `WeakMap` holds its keys "weakly". If nothing else points to a key object, the entry can be garbage collected. This is great for storing extra data about DOM elements or objects without causing leaks.

**6. Finding leaks in Chrome DevTools:**
1. Open the **Memory** tab and take a **heap snapshot**.
2. Do the action you suspect several times (open and close a modal, change pages).
3. Take another snapshot and choose **Comparison**.
4. Look for objects that keep growing, and search for **"Detached"** to find detached DOM nodes.

For Node.js servers, see [memory and leaks in Node](topic:nodejs/memory-and-leaks).

## 🎯 Why do we use it?

We don't "use" GC on purpose. It always runs. But **understanding it** matters because:
- A single-page app can stay open for hours. A small leak per click becomes hundreds of MB.
- A leaking tab becomes slow and laggy, and on phones the browser may even reload it.
- "How do you find and fix a memory leak?" is a common debugging interview question.

## ⚠️ Common mistakes

- **Thinking `delete obj` or `x = null` frees memory at once.** It only removes **one link**. The GC frees memory later, and only if no other links exist.
- **Adding listeners in a loop or on every render** and never removing them.
- **Keeping removed DOM elements in arrays or variables.**
- **Using a normal `Map` or object as a cache keyed by objects**, instead of a `WeakMap`.

## 🗣️ How to answer in an interview

> "JavaScript manages memory automatically. The garbage collector uses mark-and-sweep. It starts from roots like globals, the call stack and the DOM, marks everything reachable, and frees the rest. V8 also splits the heap into young and old generations, because most objects die young.
>
> A memory leak is memory I no longer need but still hold a reference to, so the GC can't free it. In the browser, the usual causes are event listeners that are never removed, intervals never cleared, detached DOM nodes, caches that only grow, and closures holding big data. In React, it's usually a missing useEffect cleanup.
>
> To find one, I use Chrome DevTools' Memory tab. I take a heap snapshot, repeat the action, take another and compare, and I look for detached elements. Then I fix the missing cleanup and check again."

[FILL IN: a real memory problem you found in the recruiter or candidate screens at SkillKeepr, if any. Only add it if it's true.]

## 🔁 Follow-up questions

### Can circular references cause a leak in modern JavaScript?

No. Old reference-counting collectors had that problem. Mark-and-sweep only cares whether an object is reachable from a root. Two objects pointing at each other are freed if no root reaches them.

### What is a detached DOM node?

An element that was removed from the page, but JavaScript still points to it. For example, a variable, an array or a listener's closure. It stays in memory together with all its children. In DevTools heap snapshots, search for "Detached".

### When would you use a WeakMap?

When you want to attach data to an object without keeping that object alive. For example, extra info per DOM element, or a cache keyed by objects. When the object is gone, the WeakMap entry can be freed too. WeakMap keys must be objects (or non-registered symbols), and you can't loop over a WeakMap.

### Can you force garbage collection?

Not in normal code. The engine decides when to run it. In DevTools you can click the "Collect garbage" (bin) button to test. In Node, the `--expose-gc` flag adds `global.gc()`, but only for testing.

## ✅ Quick check

### 1. Is the object freed after this code?

```js
let a = { big: new Array(1e6) };     // a big object
const list = [a];                    // the list also points to it
a = null;                            // remove one link
```

:::answer
**No.** `list[0]` still points to the object, so it is still reachable. It can be freed only when the list no longer holds it.
:::

### 2. Which one does NOT usually cause a leak?

- A) A `setInterval` that is never cleared
- B) A local variable inside a function that has finished
- C) An event listener added on every render and never removed

:::answer
**B.** A finished function's local variables become unreachable and are freed, unless a closure still uses them. A and C keep their callbacks alive forever.
:::

### 3. True or false: two objects that point to each other can never be garbage collected.

:::answer
**False.** Mark-and-sweep frees them when no root can reach them, even if they point to each other.
:::
