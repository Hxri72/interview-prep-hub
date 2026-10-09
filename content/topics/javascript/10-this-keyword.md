---
title: "The this keyword (normal vs arrow functions)"
stack: javascript
order: 10
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "`this` is a special word that points to the object that is \"using\" the function right now."
  - In a normal function, `this` is decided by HOW you call the function, not where you wrote it.
  - An arrow function has no `this` of its own. It borrows `this` from the code around it.
  - "If you take a method out of its object (const fn = obj.method), it loses its `this`."
  - Use arrow functions inside methods (for timers and callbacks), and normal functions for the methods themselves.
cards:
  - q: What decides the value of `this` in a normal function?
    a: How the function is called. In obj.method(), `this` is obj. In a plain call like fn(), `this` is undefined in strict mode (or the global object in sloppy mode).
  - q: What is `this` inside an arrow function?
    a: An arrow function has no own `this`. It uses the `this` of the code around it, where it was written.
  - q: "const fn = student.sayName; fn(); — why is this.name undefined?"
    a: Because fn() is called on its own, not as student.sayName(). The link to student is lost, so `this` is not student.
  - q: Why should you not use an arrow function as an object method?
    a: The arrow function takes `this` from outside the object, so `this` will not be the object.
  - q: Why do arrow functions help inside setTimeout in a method?
    a: The arrow keeps the method's `this`, so inside the timer `this` still points to the object.
---

## 💡 What is it?

`this` is a special word in JavaScript. It points to **the object that is using the function right now**.

In a **normal [function](glossary:function)**, `this` is decided **when you call the function**. It depends on what is before the dot.

An **arrow function** (`() => {}`) has no `this` of its own. It borrows `this` from the code around it.

## 🏠 Real-life example

Think of the word **"my"** in a classroom.

When Asha says "my bag", it means Asha's bag. When Ravi says "my bag", it means Ravi's bag. The word is the same. **Who is speaking** decides the meaning.

`this` works the same way in a normal function. `asha.showBag()` → `this` is Asha. `ravi.showBag()` → `this` is Ravi.

Now think of a **little brother who repeats what his elder sister says**. He has no "my" of his own. When he says "my bag", he means his sister's bag. That's an arrow function: it borrows `this` from the place around it.

- **"my"** = `this`.
- **The person speaking** = the object before the dot.
- **The little brother** = an arrow function, which borrows `this`.

## 🧑‍💻 Code example

Save this as `this.js`. Run it with `node this.js`.

```js
const student = {                                  // an object with a name and some functions
  name: 'Asha',                                    // the student's name
  sayName() {                                      // a NORMAL method (short form of sayName: function () {})
    console.log('normal:', this.name);             // this = whatever object is before the dot when called
  },                                               // end of sayName
  sayNameArrow: () => {                            // an ARROW function used as a method (a mistake!)
    console.log('arrow:', this?.name);             // this = the outside code's this, NOT student
  },                                               // end of sayNameArrow
  later() {                                        // a normal method that starts a timer
    setTimeout(() => {                             // an arrow callback: it borrows this from later()
      console.log('arrow inside method:', this.name); // this is still student here
    }, 0);                                         // 0 = run as soon as possible, after the current code
  },                                               // end of later
};                                                 // end of the student object

student.sayName();                                 // called as student.sayName() → this is student
student.sayNameArrow();                            // arrow → this is NOT student
const fn = student.sayName;                        // copy the function out of the object
fn();                                              // called on its own → this is not student any more
student.later();                                   // the arrow inside the timer keeps this = student
```

**Output:**

```text
normal: Asha
arrow: undefined
normal: undefined
arrow inside method: Asha
```

**What to notice:**
- The same function `sayName` gives `Asha` once and `undefined` once. Only the **way we called it** changed.
- The arrow function inside `setTimeout` kept `this`. That's the main reason arrow functions exist.

## 🔍 Deeper version

**The rules for a normal function.** JavaScript checks these in order:

| How you call it | What `this` is |
|---|---|
| `new Person()` | the brand-new object being created |
| `fn.call(obj)`, `fn.apply(obj)`, `fn.bind(obj)` | `obj` (you set it by hand) |
| `obj.fn()` | `obj` (the thing before the dot) |
| `fn()` on its own | `undefined` in **strict mode**; the global object in old "sloppy" mode |

"Strict mode" is a safer version of JavaScript. ES [modules](glossary:module) and classes always use it. So in modern code, a plain `fn()` usually gives `this = undefined`, and `this.name` throws an error.

**Arrow functions.** An arrow function has no own `this`. It uses the `this` of the place where it was **written** (its lexical [scope](glossary:scope), like [closures](topic:javascript/closures)). You also can't change it with `call`, `apply` or `bind`. And you can't use `new` with an arrow function.

**Why `fn()` lost `this`.** `const fn = student.sayName` copies only the function. It doesn't copy the link to `student`. The dot is what sets `this`, and there is no dot in `fn()`.

**Common places this bites you:**
- **Passing a method as a [callback](glossary:callback):** `button.addEventListener('click', obj.handle)` or `setTimeout(obj.handle, 100)`. The method runs without `obj.` in front. Fix it with `obj.handle.bind(obj)` or `() => obj.handle()`.
- **Class methods in React** (old class components): handlers needed `this.handleClick = this.handleClick.bind(this)`. Arrow-function class fields solved it.
- **`this` at the top level:** in a browser script it's `window`. In an ES module it's `undefined`. In a Node CommonJS file it's `module.exports` (an empty object `{}`). That's why the arrow example printed `undefined`.

**In DOM event listeners**, a normal function gets `this = the element` that has the listener. An arrow function does not.

```js
button.addEventListener('click', function () {   // normal function
  console.log(this);                              // this = the button element
});
button.addEventListener('click', () => {          // arrow function
  console.log(this);                              // this = the outside this (not the button)
});
```

## 🎯 Why do we use it?

- **One function, many objects.** A method can work for every object that uses it. `this` tells it which object to work on. Classes and prototypes depend on this.
- **Arrow functions fix callbacks.** Inside a method, callbacks for timers, `map` or `fetch().then()` can still reach the object's data.
- **Interviews love it.** "What does this print?" questions about `this` are very common. They test whether you really understand how functions are called.

## ⚠️ Common mistakes

- **Using an arrow function as an object method.** `this` will not be the object. Use the short method form `sayName() {}`.
- **Passing a method as a callback** (`setTimeout(obj.method, 0)`) and expecting `this` to stay. Use `bind` or wrap it in an arrow.
- **Thinking `this` means "the object where the function was written".** For normal functions, it's about **how you call it**.
- **Trying to `bind` an arrow function.** It has no own `this`, so `bind` can't change it.

## 🗣️ How to answer in an interview

> "`this` refers to the object that is calling the function. For normal functions, it's decided at call time. With `obj.method()`, `this` is `obj`. With `new`, it's the new object. With `call`, `apply` or `bind`, I set it myself. A plain call like `fn()` gives `undefined` in strict mode.
>
> Arrow functions don't have their own `this`. They take it from the surrounding scope, where they were written. So I use normal methods on objects and classes. Inside those methods, I use arrow functions for callbacks like `setTimeout` or `map`, so `this` stays the same object.
>
> A classic bug is passing a method as a callback, like `setTimeout(obj.save, 0)`. That loses `this`. I fix it with `bind` or by wrapping it in an arrow function."

## 🔁 Follow-up questions

### What is `this` inside a class method?

The instance the method was called on, like `user.getName()` → `user`. Class bodies are always in strict mode. So if you pull the method out and call it alone, `this` is `undefined`, not the global object.

### Can you change `this` of an arrow function with `call` or `bind`?

No. Arrow functions ignore the `this` you pass to `call`, `apply` or `bind`. They always use the `this` from where they were written.

### What is `this` in a regular function inside a method?

If you call it plainly, like `helper()`, it loses `this`. In strict mode it's `undefined`. Before arrow functions, people wrote `const self = this;` to keep it. Today we use an arrow function instead.

### What is `this` in a DOM event listener?

With a normal function, `this` is the element the listener is on (same as `event.currentTarget`). With an arrow function, it's the outer `this`. Using `event.currentTarget` is clearer in both cases.

## ✅ Quick check

### 1. What does this print?

```js
const team = {                                // an object
  name: 'Backend',                            // its name
  show: function () { return this.name; },    // a normal function method
};
const show = team.show;                       // copy the function out
console.log(team.show(), show.call(team));    // ?
```

:::answer
**`Backend Backend`.** `team.show()` has `team` before the dot. `show.call(team)` sets `this` to `team` by hand.
:::

### 2. What does this print (in a Node CommonJS file)?

```js
const obj = {                                 // an object
  count: 5,                                   // a value
  getCount: () => this.count,                 // an ARROW function as a method
};
console.log(obj.getCount());                  // ?
```

- A) `5`
- B) `undefined`
- C) It throws an error

:::answer
**B) `undefined`.** The arrow function takes `this` from outside the object. In a CommonJS file that's `module.exports` (`{}`), which has no `count`.
:::

### 3. You pass `user.save` to `setTimeout(user.save, 100)` and `this.id` is wrong inside `save`. Give two fixes.

:::answer
`setTimeout(user.save.bind(user), 100)` or `setTimeout(() => user.save(), 100)`. Both make sure `save` runs with `user` as `this`.
:::
