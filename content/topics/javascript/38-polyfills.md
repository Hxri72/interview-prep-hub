---
title: "Polyfills: write your own map, bind, Promise.all"
stack: javascript
order: 38
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - A polyfill is your own code that adds a missing built-in feature, so older browsers can use it.
  - "Interviewers ask \"write your own map / bind / Promise.all\" to check that you really understand how they work."
  - "myMap: loop, call the callback with (item, index, array), push into a NEW array, and use this as the array."
  - "myBind: return a new function that calls the original with a fixed this (via apply) and joins the preset and later arguments."
  - "myPromiseAll: return one promise; save each result at its own index; resolve when all finish; reject on the first error."
cards:
  - q: What is a polyfill?
    a: Code that adds a feature the environment doesn't have yet, written so it behaves like the real built-in. It lets old browsers run modern code.
  - q: In a polyfill on Array.prototype, what is this?
    a: The array the method was called on. That's why polyfills use a normal function, not an arrow function.
  - q: What are the key steps of a bind polyfill?
    a: Save the original function, then return a new function that calls original.apply(thisArg, [...presetArgs, ...laterArgs]).
  - q: How does Promise.all keep results in the right order?
    a: It saves each result at the same index as its input (results[i] = value), and counts finished promises instead of using push.
  - q: When does Promise.all reject?
    a: As soon as any one input promise rejects. It rejects with that first error and doesn't wait for the others.
---

## 💡 What is it?

A **polyfill** is code that **adds a missing feature**.

Say an old browser doesn't have `Array.prototype.includes`. A polyfill writes that method in plain JavaScript, so your modern code still works there.

In interviews, "write your own `map`" (or `bind`, or `Promise.all`) is a very common question. It checks whether you really understand how these built-ins work inside.

## 🏠 Real-life example

Think of a **school that has no science lab**.

The syllabus says, "Do the experiment in the lab." The school has no lab. So a teacher sets up a **small corner** with the same tools: a beaker, a burner and test tubes. Students do the same experiment there and get the same result.

- **The syllabus** = your modern code.
- **A school with no lab** = an old browser that lacks the feature.
- **The home-made lab corner** = the polyfill.
- **Same experiment, same result** = the polyfill must behave exactly like the real built-in.

## 🧑‍💻 Code example

Save this as `poly.js`. Run it with `node poly.js`. (We use names like `myMap` so we don't replace the real ones.)

```js
Array.prototype.myMap = function (callback) {         // add our own map to every array
  const result = [];                                  // the new array we will return
  for (let i = 0; i < this.length; i++) {             // "this" is the array we called it on
    result.push(callback(this[i], i, this));          // call the callback with (item, index, array)
  }                                                   // end of the loop
  return result;                                      // map never changes the original
};                                                    // end of myMap
console.log([1, 2, 3].myMap((n) => n * 10));          // [10, 20, 30]

Function.prototype.myBind = function (thisArg, ...preset) { // our own bind
  const original = this;                              // "this" is the function bind was called on
  return function (...later) {                        // return a new function (a closure)
    return original.apply(thisArg, [...preset, ...later]); // call with the fixed "this" + all arguments
  };                                                  // end of the returned function
};                                                    // end of myBind
const hari = { name: 'Hari' };                        // an object to use as "this"
function intro(role, years) {                         // a normal function that uses this
  return `${this.name}: ${role}, ${years} years`;     // reads this.name
}                                                     // end of intro
console.log(intro.myBind(hari, 'Full stack')(3));     // "Hari: Full stack, 3 years"

function myPromiseAll(promises) {                     // our own Promise.all
  return new Promise((resolve, reject) => {           // it returns one big promise
    const results = [];                               // answers, kept in the SAME order as input
    let done = 0;                                     // how many have finished
    if (promises.length === 0) return resolve([]);    // empty list → finish at once
    promises.forEach((p, i) => {                      // start watching every promise
      Promise.resolve(p).then((value) => {            // Promise.resolve also handles plain values
        results[i] = value;                           // save at index i, not at the end
        done++;                                       // one more finished
        if (done === promises.length) resolve(results); // all finished → resolve with the list
      }, reject);                                     // any failure → reject the big promise at once
    });                                               // end of forEach
  });                                                 // end of new Promise
}                                                     // end of myPromiseAll
const wait = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms)); // helper: resolve v after ms
myPromiseAll([wait(30, 'A'), wait(10, 'B'), 'C']).then((r) => console.log(r)); // order kept → [ 'A', 'B', 'C' ]
myPromiseAll([wait(10, 'ok'), Promise.reject(new Error('boom'))]).catch((e) => console.log('rejected:', e.message)); // first error wins
```

**Output:**

```text
[ 10, 20, 30 ]
Hari: Full stack, 3 years
rejected: boom
[ 'A', 'B', 'C' ]
```

**What to notice:**
- `'B'` finished **before** `'A'`, but the result is still `[ 'A', 'B', 'C' ]`. Saving at index `i` keeps the input order.
- "rejected: boom" printed **first**, because one rejection ends the second `myPromiseAll` at once. It doesn't wait for the 30 ms timer.

## 🔍 Deeper version

**1. Why a normal `function`, not an arrow?** Inside `Array.prototype.myMap`, `this` must be the array you called it on. An arrow function has no `this` of its own, so `this` would be wrong. See [the this keyword](topic:javascript/this-keyword).

**2. Details a stronger `map` polyfill handles:**
- **Holes in sparse arrays.** The real `map` skips empty slots (`[1, , 3]`). A careful polyfill checks `if (i in this)`.
- **Bad input.** The real `map` throws a `TypeError` if `callback` is not a function.
- **`thisArg`.** `map(callback, thisArg)` lets you set `this` inside the callback: `callback.call(thisArg, item, i, arr)`.

**3. Details a stronger `bind` polyfill handles:**
- **Using `new` on a bound function.** The real `bind` ignores `thisArg` when you call the result with `new`. A full polyfill checks `this instanceof boundFunction`.
- **Partial arguments.** `preset` arguments come **first**, then the arguments given later. Our version already does this.

**4. The `Promise.all` rules, and its friends:**

| Method | Resolves when | Rejects when |
|---|---|---|
| `Promise.all` | **all** succeed → array of values, in input order | **any one** fails (the first error) |
| `Promise.allSettled` | **all** finish → `{ status, value / reason }` for each | never |
| `Promise.race` | the **first** one finishes, success or failure | the first one to finish fails |
| `Promise.any` | the **first success** | **all** fail → `AggregateError` |

Common bugs in a handwritten `Promise.all`:
- using `results.push(value)`, which breaks the order,
- using `results.length === promises.length` to check if it's finished, which is wrong with holes,
- forgetting the empty-array case, so the promise never resolves,
- forgetting `Promise.resolve(p)`, so plain values like `'C'` break.

**5. Other popular "write it yourself" questions:** `filter`, `reduce` (with and without an initial value), `call` and `apply`, [debounce and throttle](topic:javascript/debounce-throttle), `Promise.allSettled`, deep clone, and `flat`.

**6. Polyfills in real projects.** You rarely write them by hand at work. Build tools (Babel with core-js) add only the polyfills your target browsers need. **Don't change built-in prototypes in app code.** It can clash with libraries and future language features.

## 🎯 Why do we use it?

- **To support older browsers or runtimes** that don't have newer features.
- **In interviews:** writing one proves you understand `this`, closures, callbacks and promises, not just how to call the built-in.
- **To read library code with confidence.** Many utilities are built the same way.

## ⚠️ Common mistakes

- **Using an arrow function** for a prototype method, so `this` is wrong.
- **Changing the original array** in a `map` polyfill. `map` must return a **new** array.
- **Using `push` in `Promise.all`**, so results come out in finishing order instead of input order.
- **Forgetting the empty array** (`Promise.all([])` must resolve with `[]` right away) and plain non-promise values.

## 🗣️ How to answer in an interview

> "A polyfill is code that adds a missing built-in feature, written to behave like the real one, so older environments can run modern code. In practice, Babel and core-js add them automatically, but writing them shows you understand the internals.
>
> For map, I add a normal function on Array.prototype. I loop over this, call the callback with item, index and array, and push into a new array. For bind, I save the original function and return a new function that calls original.apply with the fixed this and the preset arguments, followed by the new ones.
>
> For Promise.all, I return a new promise. For each input, I wrap it in Promise.resolve, save the result at its own index, and count completions. When the count equals the length, I resolve. The first rejection rejects the whole thing. I also handle the empty-array case by resolving immediately."

[FILL IN: if you ever had to add a polyfill or fix a browser-support issue in the SkillKeepr frontend, mention it here. Only add it if it's true.]

## 🔁 Follow-up questions

### Why shouldn't you modify built-in prototypes in real apps?

Other libraries may expect the original behaviour. And a future JavaScript version may add a method with the same name but different rules. This happened in real life: a `flatten` method had to be named `flat` because old libraries broke the web. Use standalone helper functions, or let core-js add standard polyfills.

### How would you write a `reduce` polyfill?

Loop over the array with an accumulator. If an initial value is given, start from it at index 0. If not, use the first item as the accumulator and start at index 1. If the array is empty and there is no initial value, throw a `TypeError`.

### How is `Promise.allSettled` different, and how would you write it?

It never rejects. It waits for every promise and gives `{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }` for each. To write it, map every promise to `.then(value => ({ status: 'fulfilled', value }), reason => ({ status: 'rejected', reason }))`, then pass that list to `Promise.all`.

### Does `Promise.all` cancel the other promises when one fails?

No. The other operations keep running. `Promise.all` just stops waiting for them. To really cancel work, like fetch requests, you need something like `AbortController`.

## ✅ Quick check

### 1. What does this print?

```js
const user = { name: 'Hari' };                    // the bound "this"
function hi() { return this.name; }                // reads this.name
const bound = hi.bind(user);                       // this is fixed to user
console.log(bound.call({ name: 'Anu' }));          // ?
```

:::answer
**`Hari`.** A bound function's `this` can't be changed later with `call` or `apply`. Only `new` can override it.
:::

### 2. What does this print?

```js
Promise.all([Promise.resolve(1), 2, Promise.resolve(3)]) // a mix of promises and a plain value
  .then((v) => console.log(v));                          // ?
```

:::answer
**`[ 1, 2, 3 ]`.** Plain values are treated like already-resolved promises. The order matches the input.
:::

### 3. What does this classic one print?

```js
console.log([1, 2, 3].map(parseInt));   // map passes (item, index, array)
```

- A) `[1, 2, 3]`
- B) `[1, NaN, NaN]`
- C) `[NaN, NaN, NaN]`

:::answer
**B) `[1, NaN, NaN]`.** `map` calls `parseInt(item, index)`. So it runs `parseInt('1', 0)` → 1, `parseInt('2', 1)` → NaN (base 1 isn't valid), and `parseInt('3', 2)` → NaN ("3" isn't a binary digit). Knowing how `map` calls its callback explains this.
:::
