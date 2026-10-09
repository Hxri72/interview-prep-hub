---
title: Generators and iterators
stack: javascript
order: 37
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "An iterator is an object with a next() method that returns { value, done } one item at a time."
  - An iterable is anything that can give you an iterator, like arrays, strings, Maps and Sets. for...of and spread (...) work on iterables.
  - A generator function (function*) can pause at each yield and continue later. Calling it gives you an iterator.
  - Generators make values lazily — only when asked — so they can even describe endless sequences safely.
  - Async generators (async function*) with for await...of read data that arrives over time, like pages from an API or chunks from a stream.
cards:
  - q: What is an iterator?
    a: "An object with a next() method. Each call returns { value, done }. done becomes true when there are no more items."
  - q: What is the difference between an iterable and an iterator?
    a: An iterable can give you an iterator (it has a Symbol.iterator method), like an array. The iterator is the object that actually hands out values with next().
  - q: What does yield do in a generator?
    a: It pauses the generator and hands out a value. The next call to next() continues from that exact point.
  - q: Why can a generator describe an endless sequence without freezing?
    a: Generators are lazy. They only run until the next yield when you ask for a value, so they never try to build the whole list.
  - q: What is an async generator used for?
    a: Reading data that arrives over time, like paginated API results or stream chunks, with for await...of.
---

## 💡 What is it?

An **iterator** is an object that gives you items **one at a time**. Each time you call `next()`, you get the next item.

A **generator** is a special [function](glossary:function), written `function*`. It can **pause** in the middle with `yield` and **continue** later from the same place.

When you call a generator function, its code doesn't run yet. You get an iterator back. The code runs a little each time you ask for the next value.

## 🏠 Real-life example

Think of a **teacher calling roll numbers** in class.

The teacher doesn't shout all 40 names at once. They call **one** name, wait for "present", then call the next. They remember where they stopped. After the last student, they say "done".

- **The roll-call list** = an iterable (like an array).
- **The teacher calling names one by one** = the iterator.
- **"Next student, please"** = calling `next()`.
- **Pausing after each name** = `yield`.
- **"That's everyone"** = `done: true`.

A generator is like a **ticket machine at a bakery**. It doesn't print 1,000 tickets in the morning. It prints the next number only when a customer presses the button. So it can never "run out of paper" by printing too early.

## 🧑‍💻 Code example

Save this as `gen.js`. Run it with `node gen.js`.

```js
function* countTo(limit) {                     // function* = a generator function
  for (let i = 1; i <= limit; i++) {           // a normal loop
    yield i;                                   // pause here and hand out i
  }                                            // end of the loop
}                                              // end of countTo

const counter = countTo(3);                    // nothing runs yet — we just get an iterator
console.log(counter.next());                   // runs until the first yield → { value: 1, done: false }
console.log(counter.next());                   // continues → { value: 2, done: false }
console.log(counter.next());                   // continues → { value: 3, done: false }
console.log(counter.next());                   // loop finished → { value: undefined, done: true }

for (const n of countTo(4)) {                  // for...of calls next() for us
  console.log('for...of got', n);              // prints 1, 2, 3, 4
}                                              // end of for...of

function* ids() {                              // an endless id maker
  let id = 100;                                // start at 100
  while (true) yield id++;                     // safe: it only runs when we ask
}                                              // end of ids
const nextId = ids();                          // make the iterator
console.log(nextId.next().value, nextId.next().value); // 100 101 → values made only on demand
console.log([...countTo(5)]);                  // spread runs it to the end → [1, 2, 3, 4, 5]
```

**Output:**

```text
{ value: 1, done: false }
{ value: 2, done: false }
{ value: 3, done: false }
{ value: undefined, done: true }
for...of got 1
for...of got 2
for...of got 3
for...of got 4
100 101
[ 1, 2, 3, 4, 5 ]
```

**What to notice:**
- `while (true)` did **not** freeze the program. The generator only runs up to the next `yield` when we ask.
- `for...of` and `...` (spread) call `next()` for you until `done` is `true`.

## 🔍 Deeper version

**1. The iterator protocol.** "Protocol" here just means "agreed rules".
- An **iterator** is any object with `next()` that returns `{ value, done }`.
- An **iterable** is any object with a `[Symbol.iterator]()` method that returns an iterator.

Arrays, strings, `Map`, `Set`, `arguments` and NodeLists are all built-in iterables. That's why `for...of`, spread `[...x]`, destructuring and `Array.from` work on them. Plain objects are **not** iterable. Use `Object.entries(obj)` for those.

**2. Making your own object iterable.** The easiest way is a generator method:

```js
const team = {                                  // a plain object
  members: ['Hari', 'Anu', 'Ravi'],             // the data we want to loop over
  *[Symbol.iterator]() {                        // a generator method named Symbol.iterator
    for (const m of this.members) yield m;      // hand out one member at a time
  },                                            // end of the method
};                                              // end of team
console.log([...team]);                         // [ 'Hari', 'Anu', 'Ravi' ] → spread now works
```

**3. Two-way talk.** `next(value)` sends a value **into** the generator. It becomes the result of the paused `yield`. Also, `return()` stops a generator early, and `throw(err)` throws an error inside it.

**4. Lazy vs eager.** `array.map()` builds a whole new array at once. That's **eager**. A generator makes each value only when needed. That's **lazy**. Lazy is useful for huge or endless data, because you never hold it all in memory.

:::version[Version note]
**Iterator helpers** (ES2025) add methods like `.map()`, `.filter()`, `.take()` and `.toArray()` directly on iterators, including generators. For example, `ids().filter(n => n % 2 === 0).take(3).toArray()`. They work in Node 22+ and in modern browsers. In older code, you will see manual loops or libraries instead.
:::

**5. Async generators.** `async function*` can `await` inside and `yield` values over time. You read them with `for await...of`. Real uses:
- reading every page of a paginated API, one page at a time,
- reading a Node [stream](topic:nodejs/streams) chunk by chunk (Node streams are async iterables),
- going through a large MongoDB cursor without loading everything.

**6. Where generators appear in libraries.** Redux-Saga is built on generators. Before `async/await` existed, libraries like `co` used generators to write async code that looked synchronous.

## 🎯 Why do we use it?

- **To loop over anything in the same way.** One `for...of` works for arrays, strings, Maps, Sets, streams and your own objects.
- **To save memory with lazy values.** You can process a huge list one item at a time instead of building it all.
- **To describe sequences simply**, like ids, pages or retries. You keep the state inside the generator instead of in outside variables.
- **To read async data neatly** with `for await...of`.

## ⚠️ Common mistakes

- **Expecting the generator body to run when you call it.** It only runs when you call `next()` (or loop over it).
- **Spreading an endless generator.** `[...ids()]` never ends and crashes the program. Use `.take(n)` or stop the loop with `break`.
- **Reusing a finished iterator.** Once `done` is `true`, it stays done. Call the generator function again to get a fresh one.
- **Using `for...in` instead of `for...of`.** `for...in` loops over **keys** of an object. `for...of` loops over **values** of an iterable.

## 🗣️ How to answer in an interview

> "An iterator is any object with a next method that returns value and done. An iterable is something that can give you an iterator through Symbol.iterator. Arrays, strings, Maps and Sets are iterables, and that's what makes for...of and spread work.
>
> A generator, written function star, is the easy way to create iterators. It runs until a yield, pauses there, and continues on the next call to next. Because it's lazy, it only computes values when asked. So it can even describe an endless sequence, or walk through huge data without holding it all in memory.
>
> Async generators with for await...of are useful for data that arrives over time, like paginated API results or Node stream chunks. In day-to-day work I use for...of and async iteration far more often than writing generators by hand."

[FILL IN: if you ever looped over paginated API results (e.g. an ATS sync) or a stream with for await...of at SkillKeepr, mention it here. Only add it if it's true.]

## 🔁 Follow-up questions

### How is a generator different from a normal function?

A normal function runs from start to end in one go and returns once. A generator can pause many times with `yield` and continue later. Calling it returns an iterator instead of running the body.

### How do you make a plain object work with for...of?

Add a `[Symbol.iterator]` method that returns an iterator. The simplest way is a generator method: `*[Symbol.iterator]() { yield ... }`. Or just loop over `Object.entries(obj)`.

### What does `next(value)` do?

It continues the generator, and `value` becomes the result of the `yield` where the generator was paused. This lets the caller send data back into the generator. The first `next()` can't send a value, because there is no paused `yield` yet.

### Where would you use an async generator in a backend?

To pull all pages from a paginated API (like an ATS or Stripe list endpoint) one page at a time. Or to process rows from a database cursor or a file stream without loading everything into memory.

## ✅ Quick check

### 1. What does this print?

```js
function* g() { yield 'a'; yield 'b'; return 'c'; } // two yields and a return
console.log([...g()]);                               // ?
```

:::answer
**`[ 'a', 'b' ]`.** Spread and `for...of` ignore the `return` value, because it comes with `done: true`.
:::

### 2. What does the second `next()` return?

```js
const it = g();     // the same generator as above
it.next();          // { value: 'a', done: false }
console.log(it.next()); // ?
```

:::answer
**`{ value: 'b', done: false }`.** The call after that returns `{ value: 'c', done: true }`. Every call after *that* returns `{ value: undefined, done: true }`.
:::

### 3. What does this print?

```js
function* two() { const x = yield 1; yield x * 2; } // x comes from the second next()
const t = two();                                     // create the iterator
console.log(t.next().value, t.next(10).value);       // ?
```

:::answer
**`1 20`.** The first `next()` stops at `yield 1`. The second `next(10)` sends `10` in, so `x = 10`, and the next `yield` gives `20`.
:::
