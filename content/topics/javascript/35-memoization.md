---
title: Memoization
stack: javascript
order: 35
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - Memoization means saving the answer of a function for each input, so the same input never does the slow work twice.
  - A memoize helper keeps a cache (usually a Map) inside a closure. It checks the cache first and only calls the real function on a miss.
  - It only works safely for pure functions — same input, same output, no side effects.
  - The cost is memory. An unlimited cache can grow forever, so big apps limit its size or add an expiry time.
  - React's useMemo, useCallback and React.memo use the same idea for values, functions and components.
cards:
  - q: What is memoization?
    a: Saving a function's result for each input, so the next call with the same input returns the saved answer instead of doing the work again.
  - q: Which functions are safe to memoize?
    a: Pure functions — the same input always gives the same output, and the function has no side effects.
  - q: Where does a memoize helper keep its saved answers, and why does that work?
    a: In a cache, like a Map, created inside the helper. The returned function is a closure, so it keeps that cache between calls.
  - q: What is the main downside of memoization?
    a: Memory. Every new input adds an entry, so an unlimited cache can grow forever. Limit it (LRU) or add an expiry time.
  - q: How does memoization relate to React?
    a: useMemo memoizes a calculated value, useCallback memoizes a function, and React.memo skips re-rendering a component when its props are the same.
---

## 💡 What is it?

**Memoization** means **remembering answers**.

The first time a [function](glossary:function) gets an input, it does the work and saves the answer. The next time it gets the **same** input, it gives back the saved answer at once.

The saved answers are kept in a **cache**. A cache is a small store of results you can reuse.

## 🏠 Real-life example

Think of a student doing **maths homework**.

The first time the teacher asks "What is 37 × 43?", you work it out on paper. It takes two minutes. Then you write the answer in a small notebook.

The next day, the same question comes again. You don't redo the sum. You just look in the notebook: **1591**. It takes two seconds.

- **The maths question** = the function's input.
- **Working it out on paper** = the slow work.
- **The notebook** = the cache.
- **Looking in the notebook first** = checking the cache before doing the work.

But if the notebook gets **too full**, it becomes heavy to carry. That is the memory cost of memoization.

## 🧑‍💻 Code example

Save this as `memo.js`. Run it with `node memo.js`.

```js
function memoize(fn) {                                 // takes any slow function
  const cache = new Map();                             // the "notebook": input → saved answer
  return function (n) {                                // the new, faster version of fn
    if (cache.has(n)) {                                // have we solved this input before?
      console.log(`cache hit for ${n}`);               // yes → say so
      return cache.get(n);                             // give the saved answer straight away
    }                                                  // end of the "seen before" check
    const result = fn(n);                              // no → do the slow work once
    cache.set(n, result);                              // write the answer in the notebook
    return result;                                     // give the answer back
  };                                                   // end of the new function
}                                                      // end of memoize

function slowSquare(n) {                               // pretend this is expensive
  console.log(`computing ${n}...`);                    // shows when real work happens
  return n * n;                                        // the actual answer
}                                                      // end of slowSquare

const fastSquare = memoize(slowSquare);                // wrap the slow function
console.log(fastSquare(9));                            // first time: computes → 81
console.log(fastSquare(9));                            // second time: from cache → 81
console.log(fastSquare(4));                            // new input: computes → 16
```

**Output:**

```text
computing 9...
81
cache hit for 9
81
computing 4...
16
```

**What to notice:**
- "computing 9..." prints only **once**. The second call used the cache.
- The `cache` lives inside `memoize`. The returned function is a [closure](topic:javascript/closures), so it keeps the cache between calls.

## 🔍 Deeper version

**1. Only memoize pure functions.** A **pure function** always gives the same output for the same input, and it changes nothing outside itself. If a function reads the clock, calls an API or uses `Math.random()`, the saved answer can be wrong or out of date.

**2. Cache keys.** A `Map` compares keys like `===`.
- Numbers and strings work well as keys.
- **Objects are compared by reference.** Two objects with the same contents are still different keys.
- For many arguments, people often build a key with `JSON.stringify(args)`. This is simple, but it is slow for big objects, and the key order of objects matters.

**3. The classic example: Fibonacci.** Plain recursive Fibonacci calls itself again and again with the same numbers. That is O(2ⁿ) time. With memoization, each number is worked out once, so it becomes O(n).

```js
const fib = memoizeAll((n) => (n < 2 ? n : fib(n - 1) + fib(n - 2))); // recursive calls go through the cache
function memoizeAll(fn) {                                // same memoize idea, without logging
  const cache = new Map();                               // input → answer
  return (n) => {                                        // the memoized function
    if (!cache.has(n)) cache.set(n, fn(n));              // work it out only on a miss
    return cache.get(n);                                 // always answer from the cache
  };                                                     // end of the memoized function
}                                                        // end of memoizeAll
console.log(fib(50));                                    // 12586269025 — instant, not hours
```

Note: `fib` must call the **memoized** `fib` inside, or the recursion skips the cache.

**4. Limit the cache.** In a long-running app (a Node server, or a page open all day), an unlimited cache is a [memory leak](glossary:memory-leak). Common fixes:
- **LRU cache** ("least recently used"): keep only the newest N entries and drop the oldest.
- **TTL** ("time to live"): each entry expires after some time.
- **WeakMap**: use it when keys are objects. An entry disappears when nothing else uses the key object.

**5. Memoization in React.** React uses the same idea:
- `useMemo` remembers a calculated value until its dependencies change.
- `useCallback` remembers a function, so child components get the same function each time.
- `React.memo` skips re-rendering a component when its props are the same.

React keeps only the **last** result, not a full cache of every input.

## 🎯 Why do we use it?

- **To skip repeated slow work.** Examples: heavy calculations, sorting or filtering a big list, or recursive problems like Fibonacci.
- **To make UIs faster.** Expensive values in React can be remembered between renders.
- **It's the base of dynamic programming.** Many DSA problems become fast when you remember answers to smaller sub-problems.

## ⚠️ Common mistakes

- **Memoizing impure functions.** If the answer depends on time, randomness or outside data, the cache gives wrong answers.
- **Unlimited caches in long-running apps.** Memory keeps growing. Add a size limit or an expiry time.
- **Using objects as keys and expecting a cache hit.** `{ id: 1 }` and another `{ id: 1 }` are different keys.
- **Memoizing cheap work.** Checking a cache also costs time and memory. Only memoize what is really slow.

## 🗣️ How to answer in an interview

> "Memoization is caching a function's result for each input. The next time the function gets the same input, it returns the saved answer instead of doing the work again.
>
> A memoize helper usually creates a Map and returns a closure. The closure checks the Map first and only calls the real function on a cache miss. It only works safely for pure functions, because the output must depend only on the input.
>
> The classic example is recursive Fibonacci, which goes from exponential time to linear time. The trade-off is memory. In a long-running server, I'd limit the cache with an LRU or a TTL. In React, useMemo, useCallback and React.memo are the same idea, applied to values, functions and components."

[FILL IN: a place where you cached an expensive calculation or API result at SkillKeepr, if you have one. Only add it if it's true.]

## 🔁 Follow-up questions

### How do you memoize a function with more than one argument?

Build one key from all the arguments, for example `JSON.stringify(args)` or `args.join('|')` for simple values. Or use nested Maps, one level per argument. Watch out: objects as arguments need a stable key.

### What is an LRU cache?

"Least recently used." It keeps only the last N used entries. When it is full, it removes the entry that was used longest ago. In JavaScript, a `Map` keeps insertion order, so you can delete and re-add an entry on each use, and remove the first key when full.

### Is memoization the same as caching?

Memoization is one kind of caching: caching the results of a function call by its inputs. Caching is the bigger idea. It also includes HTTP caching, Redis caches and CDN caches.

### Should I wrap everything in useMemo in React?

No. useMemo has its own cost. Use it for really expensive calculations, or when you need a stable object or array for a child that uses React.memo. Measure with the React Profiler first.

## ✅ Quick check

### 1. How many times does the real function run?

```js
let calls = 0;                                        // count real work
const f = memoize((n) => { calls++; return n * 2; }); // memoized double
f(5); f(5); f(6); f(5);                               // four calls
console.log(calls);                                   // ?
```

:::answer
**2.** It runs once for `5` and once for `6`. The other two calls with `5` come from the cache.
:::

### 2. Why is this a bad function to memoize?

```js
let count = 0;                                        // outside state
const next = memoize(() => ++count);                  // changes count each time
console.log(next(1), next(1));                        // ?
```

:::answer
It prints **`1 1`**, not `1 2`. The function has a side effect (it changes `count`), so it is not pure. The cache hides the second call, and the result is wrong.
:::

### 3. Which React hook memoizes a calculated value?

- A) `useCallback`
- B) `useMemo`
- C) `useRef`

:::answer
**B) `useMemo`.** `useCallback` memoizes a function. `useRef` just keeps a value without re-rendering.
:::
