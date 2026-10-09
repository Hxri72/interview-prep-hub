---
title: Closures
stack: javascript
order: 9
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A closure is a function that remembers the variables from the place where it was made.
  - It can still use those variables after the outer function has finished.
  - Each call to the outer function makes a new, separate set of variables.
  - "We use closures for private data, function factories (like allowRole('admin')), debounce and React hooks."
  - "Be careful of two things: old (\"stale\") values, and big data kept in memory by mistake."
cards:
  - q: What is a closure, in one sentence?
    a: A function that remembers the variables around it from where it was made, even after the outer function has finished.
  - q: "If you call makeCounter() two times, do the two counters share one count?"
    a: No. Each call makes a new count variable, so each counter has its own.
  - q: "for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)) — what prints, and why?"
    a: "3 3 3. With var there is only ONE i for the whole loop. All three callbacks read that same i, and it is 3 when they run. With let you get 0 1 2."
  - q: Give two real uses of closures.
    a: "Private variables (like a counter nobody can change directly), function factories such as Express middleware allowRole('admin'), debounce, and React hooks."
  - q: Can closures cause memory problems?
    a: Yes. A closure keeps its variables alive. If it holds big data and lives a long time (for example in an event listener you never remove), that memory is never freed.
---

## 💡 What is it?

A **closure** is a [function](glossary:function) that **remembers the variables around it**.

It remembers the variables from the place where you wrote it. The outer function can finish, but the inner function can still read and change those variables.

You don't need to switch this on. Every function in JavaScript does it.

## 🏠 Real-life example

Think of a **school bag**.

In the morning, you pack your bag at home. You put in a lunch box and a water bottle. Then you leave home. But you still have your lunch box and bottle all day.

- Your **home** = the outer function.
- **Leaving home** = the outer function finishes.
- Your **bag** = the variables the inner function remembers.
- **You** = the inner function. You carry the bag everywhere.

Also, **every student has their own bag**. If one student eats their lunch, another student's lunch box is still full. In the same way, every call of the outer function makes a new, separate bag.

## 🧑‍💻 Code example

Save this as `closure.js`. Run it with `node closure.js`.

```js
function makeCounter() {            // a function that makes a counter
  let count = 0;                    // count starts at 0; it lives inside makeCounter
  return function () {              // give back an inner function — this inner function is the closure
    count = count + 1;              // the inner function can still see count and change it
    return count;                   // give back the new count
  };                                // end of the inner function
}                                   // end of makeCounter — it has finished running now

const counterA = makeCounter();     // counterA = the inner function, with its own count = 0
const counterB = makeCounter();     // counterB = a NEW inner function, with a NEW count = 0

console.log(counterA());            // prints 1 → counterA's count goes from 0 to 1
console.log(counterA());            // prints 2 → counterA remembered 1, so now it is 2
console.log(counterB());            // prints 1 → counterB has its own count; it is not shared
console.log(typeof count);          // prints "undefined" → code outside cannot see count
```

**What to notice:**
- `makeCounter` finished at line 7. But `count` did not disappear. The inner function kept it.
- `count` is **private**. The only way to change it is to call the counter.

## 🔍 Deeper version

**1. Lexical scope.** "Lexical" means "where the code is written". A function's [scope](glossary:scope) is the set of variables it can see. That set depends on **where you write the function**, not where you call it. When JavaScript makes a function, it saves a hidden link to that place. (The JavaScript rule book calls this link `[[Environment]]`.)

**2. It remembers the variable, not a copy.** The closure points to the real variable. If the variable changes later, the closure sees the new value.

```js
let name = 'Hari';                         // a variable outside the function
const greet = () => console.log(name);     // greet is a closure; it remembers name
name = 'Hariprasad';                       // we change name AFTER making greet
greet();                                   // prints "Hariprasad" → it reads the latest value
```

**3. The famous loop question: `var` vs `let`.**

```js
for (var i = 0; i < 3; i++) {              // var → only ONE i for the whole loop
  setTimeout(() => console.log(i), 100);   // all 3 callbacks remember that same i
}                                          // prints 3, 3, 3 (the loop is over, so i is 3)

for (let j = 0; j < 3; j++) {              // let → a NEW j for every round of the loop
  setTimeout(() => console.log(j), 100);   // each callback remembers its own j
}                                          // prints 0, 1, 2
```

**4. Memory.** Usually, when a function ends, JavaScript cleans up its variables. This cleaning is called [garbage collection](glossary:garbage-collection). But if a closure still points to a variable, that variable stays in memory. It stays **as long as the closure is still in use**. That's how `count` survives. But it can also cause a [memory leak](glossary:memory-leak). This happens when a closure lives forever and holds big data.

**5. Where you see closures in real code:**
- **Function factories.** A factory is a function that makes other functions. An Express [middleware](glossary:middleware) factory is a good example:

```js
function allowRole(role) {                           // the outer function gets the allowed role, e.g. 'admin'
  return (req, res, next) => {                       // gives back a middleware that remembers role (closure)
    if (req.user?.role === role) return next();      // the user has the right role → go to the next step
    res.status(403).json({ message: 'Forbidden' });  // wrong role → 403 means "you are logged in, but not allowed"
  };                                                 // end of the middleware
}                                                    // end of allowRole

app.delete('/students/:id', allowRole('admin'), deleteStudent); // only admins can delete a student
```

- **Debounce and throttle.** The closure keeps the timer ID between calls.
- **React hooks.** Every render makes new functions. Each one remembers the props and state of *that* render. This is why a "stale closure" can show an old value. (See the follow-up questions.)
- **Private data in a module**, like the counter above.

## 🎯 Why do we use it?

- **To keep data private.** Nobody can change `count` by mistake. They must use the function you give them.
- **To remember something between calls.** You don't need a global variable for this. (A global variable can be changed by any code, and that causes bugs.)
- **To make custom functions from one piece of code.** For example, `allowRole('admin')` and `allowRole('recruiter')`.
- **Callbacks need it.** A [callback](glossary:callback) runs later, after a timer, a click or an API reply. Thanks to closures, it can still use the variables from when it was made.

## ⚠️ Common mistakes

- **Using `var` in a loop with callbacks.** You expect each callback to get a different value, but they all get the last one. Use `let` instead.
- **Thinking a closure saves a copy.** It keeps a link to the *variable*, so it sees later changes.
- **Stale values in React.** A `setInterval` inside `useEffect(..., [])` keeps reading the *first* value of `count`. Fix it with `setCount(c => c + 1)`, or add the right dependencies.
- **Keeping big data by mistake.** For example, an event listener that is never removed keeps all its remembered variables in memory.

## 🗣️ How to answer in an interview

> "A closure is a function that remembers the variables from where it was created. It can use them even after the outer function has finished. JavaScript does this automatically. The function keeps a reference to its lexical scope. It's a reference to the variable, not a copy of the value.
>
> A simple example is a counter. `makeCounter` has a `count` variable and returns an inner function that increases it. Each call to `makeCounter` gets its own private `count`.
>
> In real code, closures are everywhere. Express middleware factories like `allowRole('admin')` use them. Debounce functions use them to keep a timer. React hooks use them too, because event handlers remember the current props and state. I watch for two problems: stale values, for example in a `setInterval` inside `useEffect`, and memory, because a long-living closure keeps its variables alive."

[FILL IN: one real place you used a closure at SkillKeepr, if you can think of one — e.g. a middleware or helper you wrote. Only add it if it's true.]

## 🔁 Follow-up questions

### Where have you seen closures in real projects?

Express middleware factories like `allowRole('admin')`. Debounce on search boxes. Event handlers in React that use props and state. Private helper data inside a module. Add your own example in the `[FILL IN]` above.

### Do closures cause memory leaks?

Not by themselves. But a closure keeps its outer variables alive. Sometimes a closure lives forever, for example in a global list, a cache, or an event listener you never remove. If it holds big data, that memory is never freed. The fix: remove listeners, clear timers, and don't keep data you don't need.

### What is a "stale closure" in React?

Each render makes new functions. Each function remembers the state from **its own** render. Say an effect with `[]` starts a `setInterval`. Its callback keeps seeing the state from the first render, so the value looks "stuck". Fixes: use `setCount(c => c + 1)`, add the value to the dependency array, or keep the latest value in a `useRef`.

### How do you make a private variable without classes?

Put the variable inside a function. Then return only the functions that are allowed to use it, like `makeCounter`. (Modern classes can also use `#private` fields.)

### Why does `let` fix the loop problem?

`let` belongs to the block (the `{ }`). So JavaScript makes a new `j` for every round of the loop. Each callback remembers a different `j`. `var` belongs to the whole function, so there is only one `i`. All callbacks share it.

## ✅ Quick check

### 1. What does this print?

```js
function outer() {                   // the outer function
  let x = 10;                        // x = 10
  return () => x + 1;                // gives back a closure that remembers x
}
const f = outer();                   // f remembers x
console.log(f());                    // ?
```

:::answer
**11.** `f` is the inner arrow function. It still remembers `x = 10` after `outer` has finished. So it returns `10 + 1`.
:::

### 2. What does this print?

```js
const fns = [];                       // an empty list of functions
for (var i = 0; i < 3; i++) {         // var → one shared i
  fns.push(() => i);                  // each function returns i
}
console.log(fns[0](), fns[1](), fns[2]()); // ?
```

- A) `0 1 2`
- B) `3 3 3`
- C) `undefined undefined undefined`

:::answer
**B) `3 3 3`.** All three functions share the same `i`. After the loop, `i` is `3`. Change `var` to `let` to get `0 1 2`.
:::

### 3. True or false: a closure saves a copy of the variable's value at the moment the function is made.

:::answer
**False.** It keeps a link to the variable itself. So it always sees the latest value.
:::
