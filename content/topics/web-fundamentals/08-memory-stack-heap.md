---
title: "Where your variables live: stack, heap and garbage collection"
stack: web-fundamentals
order: 8
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "JavaScript uses two memory areas: the call stack (small, fast, one frame per running function) and the heap (big, for objects, arrays and functions)."
  - Small values like numbers can live in a stack frame. Objects always live on the heap, and variables only hold a reference (an address) to them.
  - Garbage collection frees heap objects that nothing can reach any more. V8 uses mark-and-sweep, split into a young and an old generation.
  - A closure keeps the variables it uses alive, so a long-living closure can keep a lot of memory alive.
  - Too many nested calls fill the call stack and throw "RangeError Maximum call stack size exceeded" (a stack overflow).
cards:
  - q: What is the difference between the call stack and the heap?
    a: The call stack holds one frame per running function (its local values), and is small and fast. The heap is a big area where objects, arrays and functions live.
  - q: When can a heap object be garbage collected?
    a: When nothing can reach it any more — no variable, object or closure still points to it, directly or through other objects.
  - q: What is a stack overflow in JavaScript?
    a: Too many function calls in a row (usually endless recursion) fill the call stack, and JavaScript throws "RangeError Maximum call stack size exceeded".
  - q: Why does V8 split the heap into young and old generations?
    a: Most objects die young. V8 checks the small young area often and cheaply, and the old area less often, which makes garbage collection faster overall.
  - q: How can a closure cause high memory use?
    a: A closure keeps the outer variables it uses alive. If the closure lives a long time (in a cache, timer or listener), those variables can never be freed.
---

## 💡 What is it?

When your code runs, JavaScript needs memory to keep values. It uses **two areas**.

The **[call stack](glossary:call-stack)** is a small, fast area. It holds one "frame" for each function that is running right now. The **[heap](glossary:heap)** is a big area. It holds objects, arrays and functions.

When an object is no longer needed, JavaScript frees it by itself. This is called **[garbage collection](glossary:garbage-collection)**.

## 🏠 Real-life example

Think of a **teacher's desk and a school storeroom**.

- The **desk** = the call stack. It is small. The teacher keeps only the notebook for the class happening now. When the class ends, the notebook is put away. Last in, first out.
- The **storeroom** = the heap. It is big. Big things like sports kits and projectors live there.
- A **slip of paper saying "Shelf 4, box 2"** = a reference. The desk doesn't hold the projector. It holds a note that says where it is.
- The **cleaner** = the garbage collector. Every few days, the cleaner checks which boxes nobody has a slip for any more, and throws them away.
- **Piling notebooks until they fall off the desk** = a stack overflow.

## 🧑‍💻 Code example

Save this as `memory.js`. Run it with `node --expose-gc memory.js`. (`--expose-gc` lets the code ask for a clean-up, only for this demo.)

```js
const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB'; // turn bytes into megabytes, 1 decimal

console.log('Start heap used:', mb(process.memoryUsage().heapUsed)); // memory used by JS objects now

let big = [];                                    // an empty array; the array itself lives on the heap
for (let i = 0; i < 1_000_000; i++) {            // repeat one million times
  big.push({ id: i, name: 'candidate ' + i });   // each object is created on the heap
}                                                // end of loop
console.log('After 1M objects:', mb(process.memoryUsage().heapUsed)); // heap is much bigger now

big = null;                                      // remove the only reference to the array
global.gc();                                     // ask V8 to clean up now (only works with --expose-gc)
console.log('After gc():', mb(process.memoryUsage().heapUsed)); // heap is small again

function goDeeper(n) {                           // a function that calls itself forever
  return goDeeper(n + 1);                        // each call adds a new frame to the call stack
}                                                // end of goDeeper
try {                                            // catch the error so the program keeps running
  goDeeper(1);                                   // start the endless calls
} catch (err) {                                  // the stack is full
  console.log(err.name + ': ' + err.message);    // print the error type and message
}                                                // end of try/catch
```

**Output** (on Node 24; your numbers will be a little different):

```text
Start heap used: 3.7 MB
After 1M objects: 115.5 MB
After gc(): 3.7 MB
RangeError: Maximum call stack size exceeded
```

**What to notice:**
- One million small objects took about **112 MB** of heap.
- After `big = null`, nothing pointed to them. The garbage collector freed them all.
- The endless function filled the **stack**, not the heap. That is a different error.

## 🔍 Deeper version

**1. What goes where.**

| Thing | Where it lives | Note |
|---|---|---|
| A running function's frame (its local variables, where to return) | Call stack | Removed when the function returns |
| Objects, arrays, functions, closures' saved variables | Heap | Freed by the garbage collector |
| A variable that "holds" an object | The variable holds a **reference** (an address) | Two variables can point to the same object |

V8 (the engine in Chrome and Node) is clever about small numbers. It can keep small integers directly, without a heap object. You don't need to know the exact rules for interviews. Say: "primitives are copied by value; objects are shared by reference."

```js
let a = { score: 1 };   // the object is on the heap; a holds a reference to it
let b = a;              // b gets a copy of the REFERENCE, not a copy of the object
b.score = 99;           // change the object through b
console.log(a.score);   // 99 → a and b point to the same object
```

**2. Reachability.** The garbage collector starts from **roots**: global variables, the current stack frames, and active closures. It follows every reference from there. Anything it can reach is "alive". Anything it can't reach is garbage. This is called **mark-and-sweep**: mark what is reachable, sweep the rest.

**3. Generations.** Most objects die young, like temporary objects in a loop. So V8 splits the heap:
- **Young generation** (small): checked very often, and very fast. It's sometimes called a "scavenge".
- **Old generation** (large): objects that survived a few checks move here. It's checked less often, mostly in the background, so your code pauses only a little.

**4. Closures keep memory alive.** A [closure](topic:javascript/closures) keeps the outer variables it uses. If a long-living function closes over a big array, that array can't be freed. This is a common cause of a [memory leak](glossary:memory-leak). See [garbage collection in the browser](topic:javascript/garbage-collection) and [memory leaks in Node](topic:nodejs/memory-and-leaks).

**5. Stack size.** The stack is small, about one megabyte by default in V8. Deep recursion (a function calling itself thousands of times) can overflow it. Fix it with a loop, or by processing data in smaller pieces.

## 🎯 Why do we use it?

You don't control memory by hand in JavaScript. But knowing the model helps you:
- **Explain bugs**, like "why did changing `b` also change `a`?" (shared references).
- **Find memory leaks**, by asking "what is still pointing to this object?"
- **Avoid crashes**, like a stack overflow from deep recursion, or a server running out of heap.
- **Read heap snapshots** in Chrome DevTools, which show the heap and who keeps each object alive.

## ⚠️ Common mistakes

- **Thinking `const` objects can't change.** `const` stops you from re-pointing the variable. The object on the heap can still change.
- **Thinking `obj = null` deletes the object.** It only removes **one** reference. If something else still points to it, it stays alive.
- **Keeping data in global caches or arrays forever.** Global data is always reachable, so it's never freed.
- **Using deep recursion on big data,** like walking a huge nested tree. It can overflow the stack. Use a loop with your own stack array instead.

## 🗣️ How to answer in an interview

> "JavaScript uses two memory areas. The call stack holds one frame per running function, with its local values, and it's small and fast. The heap is where objects, arrays and functions live. Variables that hold objects actually hold a reference to the heap, which is why two variables can change the same object.
>
> Memory is freed automatically by the garbage collector. V8 uses mark-and-sweep: it starts from roots like globals, the stack and closures, marks everything reachable, and frees the rest. The heap is split into a young generation, cleaned often, and an old generation, cleaned less often.
>
> In practice, a memory leak means something is still pointing to data we don't need, like a global cache, a listener or a closure. And a stack overflow means too many nested calls, usually endless recursion."

## 🔁 Follow-up questions

### Are primitives always on the stack and objects always on the heap?

Objects are always on the heap. For primitives, it depends on the engine. V8 can keep small integers inline, but strings and big numbers live on the heap too. The safe rule for interviews: primitives behave as **copied by value**, objects as **shared by reference**.

### How do you find what is keeping an object alive?

Take a heap snapshot in Chrome DevTools, or in Node with `--inspect`. Pick the object and look at its **retainers**. That's the chain of references from a root that keeps it alive.

### What is the difference between a stack overflow and running out of heap?

A stack overflow means too many nested calls. It throws a `RangeError` that you can catch. Running out of heap means too many live objects. Node then crashes with "JavaScript heap out of memory".

### Does garbage collection stop my program?

Briefly, sometimes. Young-generation clean-ups are very short. V8 does most old-generation work in the background, alongside your code, so pauses are small.

## ✅ Quick check

### 1. What does this print?

```js
const user = { name: 'Asha' };   // object on the heap; user holds a reference
const copy = user;               // copy points to the SAME object
copy.name = 'Ravi';              // change it through copy
console.log(user.name);          // ?
```

:::answer
**`Ravi`.** `user` and `copy` hold references to the same heap object.
:::

### 2. After `big = null`, when can the array be freed?

- A) Immediately, always
- B) When nothing else can reach it, at the next garbage collection
- C) Never, arrays live forever

:::answer
**B.** `null` removes one reference. The array is freed only if nothing else can reach it, and only when the garbage collector runs.
:::

### 3. Which memory area does endless recursion fill?

:::answer
**The call stack.** Each call adds a frame, so JavaScript throws "RangeError: Maximum call stack size exceeded".
:::
