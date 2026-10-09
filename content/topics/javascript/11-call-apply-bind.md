---
title: "call, apply and bind"
stack: javascript
order: 11
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - call, apply and bind let you choose what `this` is inside a normal function.
  - "call runs the function now and takes the arguments one by one: fn.call(obj, a, b)."
  - "apply runs the function now and takes the arguments as an array: fn.apply(obj, [a, b])."
  - bind does NOT run the function. It returns a new function with `this` (and maybe some arguments) fixed forever.
  - They don't work on arrow functions, because arrow functions have no own `this`.
cards:
  - q: What is the difference between call and apply?
    a: Both run the function now with a chosen `this`. call takes arguments one by one; apply takes them as one array.
  - q: How is bind different from call?
    a: bind does not run the function. It returns a new function with `this` fixed. You call that new function later.
  - q: "Easy way to remember call vs apply?"
    a: "Apply = Array. Call = Comma (arguments separated by commas)."
  - q: What is partial application with bind?
    a: Fixing some arguments in advance. bind(obj, 'Hello') returns a function that always starts with 'Hello', and you pass the rest later.
  - q: Can you rebind a function that was already bound?
    a: No. The first bind wins. Binding again doesn't change `this`.
---

## 💡 What is it?

`call`, `apply` and `bind` are three built-in tools every [function](glossary:function) has.

They let you **choose what `this` is** when the function runs. (See [the this keyword](topic:javascript/this-keyword).)

- `call` and `apply` **run the function right now**.
- `bind` **makes a new function** with `this` fixed, to run later.

## 🏠 Real-life example

Think of a **school microphone** at an assembly.

The microphone always says "Good morning, my name is ___". The name depends on who is holding it.

- **call** = you hand the mic to Asha and she speaks **right now**. You tell her the words one by one.
- **apply** = same as call, but you give her the words **on one card (a list)**.
- **bind** = you **label the mic "Asha"** and keep it for later. Whenever anyone switches it on, it always speaks as Asha.

So:
- **The microphone** = the function.
- **The person holding it** = `this`.
- **The words** = the arguments.

## 🧑‍💻 Code example

Save this as `cab.js`. Run it with `node cab.js`.

```js
function greet(greeting, mark) {                    // a normal function that uses this
  return `${greeting}, ${this.name}${mark}`;        // this.name depends on how we call greet
}                                                   // end of greet

const asha = { name: 'Asha' };                      // an object we want as this

console.log(greet.call(asha, 'Hello', '!'));        // call: this = asha, arguments one by one → runs now
console.log(greet.apply(asha, ['Hi', '?']));        // apply: this = asha, arguments in an array → runs now
const greetAsha = greet.bind(asha, 'Good morning'); // bind: new function, this = asha, greeting fixed
console.log(greetAsha('.'));                        // run it later; we only pass the last argument (mark)
```

**Output:**

```text
Hello, Asha!
Hi, Asha?
Good morning, Asha.
```

**What to notice:**
- `call` and `apply` gave the same kind of result. Only the way we passed arguments changed.
- `bind` fixed both `this` and the first argument. This is called **partial application**.

## 🔍 Deeper version

**Signatures (how to write them):**

| Method | Runs now? | How arguments are passed | Returns |
|---|---|---|---|
| `fn.call(thisArg, a, b)` | Yes | one by one | the function's result |
| `fn.apply(thisArg, [a, b])` | Yes | one array | the function's result |
| `fn.bind(thisArg, a)` | No | some now, rest later | a new function |

Memory trick: **A**pply = **A**rray, **C**all = **C**omma.

**apply is less needed today.** The spread operator does the same job: `fn.call(obj, ...args)`. Old code used `Math.max.apply(null, numbers)`. Today we write `Math.max(...numbers)`.

**bind is permanent.** A bound function always uses the `this` you gave it. If you call `bind` again on it, nothing changes. Using `call` on it doesn't change `this` either. (One exception: `new` on a bound function creates a fresh object.)

**Real uses:**
- **Keeping `this` for callbacks:** `setTimeout(user.save.bind(user), 100)`. Without `bind`, `save` would lose `user`.
- **Old React class components:** `this.handleClick = this.handleClick.bind(this)` in the constructor.
- **Borrowing methods:** `Array.prototype.slice.call(arguments)` turned the old `arguments` object into a real array. Today we use `Array.from(arguments)` or rest parameters.
- **Partial application:** `const logError = log.bind(null, 'ERROR')`. Here `null` means "I don't care about `this`".

**Arrow functions ignore all three for `this`.** They still pass the arguments, but `this` stays the outer one.

**Interview favourite: write your own `bind`.** A simple version is a [closure](topic:javascript/closures):

```js
Function.prototype.myBind = function (thisArg, ...preset) { // add myBind to every function
  const original = this;                                    // this = the function we are binding
  return function (...later) {                              // return a new function (a closure)
    return original.apply(thisArg, [...preset, ...later]);  // run it with the saved this and all arguments
  };                                                        // end of the returned function
};                                                          // end of myBind
```

(See [polyfills](topic:javascript/polyfills) for more of these.)

## 🎯 Why do we use it?

- **To fix lost `this`.** When a method is passed as a [callback](glossary:callback), it forgets its object. `bind` fixes that.
- **To reuse one function for many objects** without copying it into each object.
- **To make shortcut functions** with some arguments already filled in.
- **To understand interview questions** like "write your own bind" or "call vs apply".

## ⚠️ Common mistakes

- **Expecting `bind` to run the function.** It only returns a new function. You still need to call it: `fn.bind(obj)()`.
- **Passing an array to `call`.** `greet.call(asha, ['Hi', '!'])` gives the whole array as the first argument. Use `apply`, or spread: `call(asha, ...arr)`.
- **Trying to bind an arrow function.** `this` won't change.
- **Binding inside render in React every time.** It creates a new function each render, which can cause extra re-renders of memoised children.

## 🗣️ How to answer in an interview

> "call, apply and bind all let me set `this` for a normal function. call and apply run the function immediately. The only difference is how arguments go in: call takes them one by one, and apply takes an array. bind doesn't run anything. It returns a new function with `this`, and optionally some arguments, fixed permanently.
>
> I mostly use bind when passing a method as a callback, so it doesn't lose its object, for example `setTimeout(user.save.bind(user))`. Today spread syntax has replaced most uses of apply. And none of them change `this` for arrow functions, because arrows don't have their own `this`."

## 🔁 Follow-up questions

### Can you write a simple polyfill for bind?

Yes. Save the original function and `thisArg`, then return a new function that calls `original.apply(thisArg, [...presetArgs, ...newArgs])`. The returned function is a closure over the saved values.

### What happens if you pass `null` as `thisArg`?

In strict mode, `this` is `null`. In sloppy mode, it becomes the global object. People pass `null` when the function doesn't use `this` at all, like `Math.max.apply(null, nums)`.

### What is the difference between bind and an arrow wrapper?

`fn.bind(obj)` and `() => obj.fn()` both keep `this`. With the arrow, `obj.fn` is looked up **at call time**. So if `obj.fn` is replaced later, the arrow uses the new one. bind locks in the function at the moment you bind it.

### Does bind create a new function every time?

Yes. Each `bind` call returns a brand-new function. That's why binding inside a loop or React render can be wasteful.

## ✅ Quick check

### 1. What does this print?

```js
function total(a, b) { return this.base + a + b; }   // uses this.base
const ctx = { base: 10 };                              // the object for this
console.log(total.call(ctx, 1, 2), total.apply(ctx, [3, 4])); // ?
```

:::answer
**`13 17`.** call: 10 + 1 + 2 = 13. apply: 10 + 3 + 4 = 17.
:::

### 2. What does this print?

```js
function show() { return this.name; }                 // returns this.name
const a = show.bind({ name: 'A' });                   // bound to A
const b = a.bind({ name: 'B' });                      // try to bind again to B
console.log(b());                                     // ?
```

- A) `A`
- B) `B`
- C) `undefined`

:::answer
**A) `A`.** The first bind is permanent. Binding again can't change `this`.
:::
