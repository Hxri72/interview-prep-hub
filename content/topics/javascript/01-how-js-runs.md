---
title: How JavaScript runs (engine, browser vs Node)
stack: javascript
order: 1
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - An engine (like V8) reads your JavaScript, turns it into fast machine code and runs it.
  - The engine only runs the language. The browser or Node.js gives it extra tools, like the DOM, timers, files and network.
  - JavaScript runs one line at a time on one main thread. Slow work is handed off, and its callback runs later.
  - Browser = JavaScript + DOM + window. Node.js = JavaScript + files, network and process, with no DOM.
cards:
  - q: What is a JavaScript engine?
    a: A program that reads JavaScript and runs it. Chrome and Node.js use Google's V8. Firefox uses SpiderMonkey, and Safari uses JavaScriptCore.
  - q: What is the difference between the engine and the runtime?
    a: The engine only understands the language. The runtime (browser or Node.js) adds tools like the DOM, setTimeout, fetch, files and the event loop.
  - q: Is JavaScript compiled or interpreted?
    a: "Both, in a way. Modern engines use JIT (just-in-time) compilation: they start running quickly, then compile the busy parts into fast machine code while the program runs."
  - q: Can you use document or window in Node.js?
    a: No. Those come from the browser, not from JavaScript itself. Node.js has its own tools instead, like fs, process and http.
  - q: Why does a setTimeout with 0 ms run after the code below it?
    a: The timer callback waits in a queue. The event loop runs it only after the current code on the call stack has finished.
---

## 💡 What is it?

Your computer does not understand JavaScript directly. A program called a **JavaScript engine** reads your code and runs it.

Chrome and Node.js both use Google's engine, called [V8](glossary:v8).

The engine only knows the language itself. The place where it runs, the browser or Node.js, gives it extra tools. That place is called the [runtime](glossary:runtime).

## 🏠 Real-life example

Think of a **car engine and the car around it**.

The engine makes the car move. But the engine alone has no seats, no lights and no music. The **car** around it adds those things. A bus and a sports car can have the **same kind of engine**. But each one gives you different extras.

- The **engine** = the JavaScript engine (V8). It runs the code.
- A **family car** = the browser. Its extras are the page (DOM), clicks and the address bar.
- A **delivery truck** = Node.js. Its extras are files, the network and servers.
- **Same engine, different body** = the same JavaScript language, with different tools in each runtime.

## 🧑‍💻 Code example

Save this as `runs.js`. Run it with `node runs.js`.

```js
console.log('1. Start');                                           // plain code runs first, top to bottom
const where = typeof window === 'undefined' ? 'Node.js' : 'a browser'; // window exists only in browsers
console.log('2. Running in:', where);                              // shows which runtime runs this file
setTimeout(() => console.log('4. Timer done'), 0);                 // a callback: it waits until the main code ends
console.log('3. End of main code');                                // runs BEFORE the timer callback
```

**Output:**

```text
1. Start
2. Running in: Node.js
3. End of main code
4. Timer done
```

**What to notice:**
- `window` does not exist in Node.js. So the same file can tell where it is running.
- The timer says `0` ms, but it still runs **last**. The main code always finishes first.
- Try pasting the same code into the browser console (press F12). It will say "a browser".

## 🔍 Deeper version

**1. Engine vs runtime.**

| Part | Who gives it | Examples |
|---|---|---|
| The language | the engine (V8, SpiderMonkey, JavaScriptCore) | `let`, functions, objects, promises, `Array.map` |
| Browser tools | the browser | `document`, `window`, `fetch`, `localStorage`, clicks |
| Node.js tools | Node.js (with libuv) | `fs`, `http`, `process`, `Buffer` |
| Timers and the event loop | the runtime | `setTimeout`, callback queues |

So `setTimeout` is **not** part of the JavaScript language. The runtime gives it to you.

**2. How the engine runs your code.** These are the main steps inside V8:
1. **Parse.** It reads your text and builds a tree of the code's structure.
2. **Interpret.** An interpreter (V8's is called Ignition) turns the tree into bytecode and starts running it quickly. Bytecode is a simple, compact set of instructions.
3. **Optimise.** V8 watches which functions run a lot ("hot" code). Its optimising [compiler](glossary:compiler) (TurboFan) turns them into fast machine code.
4. **De-optimise.** Sometimes a guess turns out wrong, for example when a function suddenly gets a string instead of a number. Then V8 throws away the fast code and goes back to bytecode.

This style is called **JIT (just-in-time) compilation**. It means compiling *while* the program runs, not before.

**3. One thread, one call stack.** The engine runs your code on **one main thread**. It uses a [call stack](glossary:call-stack) to remember which function is running now. Slow jobs, like timers, network calls and files, are handed to the runtime. When a job is done, its [callback](glossary:callback) waits in a queue. The [event loop](glossary:event-loop) moves it onto the stack when the stack is empty. (Node's version is explained in [the Node.js event loop](topic:nodejs/event-loop).)

**4. Memory.** The engine also manages memory for you. Objects live in an area called the [heap](glossary:heap). [Garbage collection](glossary:garbage-collection) frees objects that nothing uses any more.

:::note
A "single thread" does not mean JavaScript is slow. It means *your code* runs one piece at a time. The waiting happens in the background.
:::

## 🎯 Why do we use it?

Knowing how JavaScript runs helps you:
- **Understand errors** like "document is not defined". It means browser code is running in Node.js, for example during server rendering.
- **Predict the order of output** in "what will this print?" questions.
- **Write faster code.** For example, keep the types of values the same in hot functions, so V8 can optimise them.
- **Share code** between frontend and backend. You know which parts are pure JavaScript, and which parts need the browser or Node.js.

## ⚠️ Common mistakes

- **Thinking `setTimeout`, `fetch` or `console` are part of the JavaScript language.** They come from the runtime.
- **Using `window` or `document` in Node.js code.** It crashes with "window is not defined".
- **Thinking "single-threaded" means only one thing can happen at once.** Slow waiting work happens in the background. Only *your code* runs one piece at a time.
- **Saying JavaScript is "only interpreted".** Modern engines use JIT compilation.

## 🗣️ How to answer in an interview

> "JavaScript is run by an engine. Chrome and Node.js both use V8. V8 parses the code, starts running it as bytecode with an interpreter, and then compiles the hot functions into fast machine code. That's called JIT compilation.
>
> The engine only knows the language. The runtime around it adds the extra tools. In the browser, that's the DOM, window, fetch and localStorage. In Node.js, that's files, the network and the process object. Timers and the event loop also come from the runtime.
>
> My code runs on one main thread with one call stack. Slow work like timers and network calls is handed off. Its callback goes into a queue, and the event loop runs it once the call stack is empty. That's why a setTimeout with zero milliseconds still runs after the rest of the code."

## 🔁 Follow-up questions

### Which engines do the main browsers use?

Chrome, Edge and other Chromium browsers use **V8**. Firefox uses **SpiderMonkey**. Safari uses **JavaScriptCore**. Node.js and Deno use V8. Bun uses JavaScriptCore.

### What is the call stack?

It's a list of the functions that are running right now. When a function is called, it goes on top. When it returns, it comes off. If a function calls itself forever, the stack fills up and you get "Maximum call stack size exceeded".

### Why can't I use `document` in Node.js?

`document` is the page in the browser (the DOM). Node.js has no page. It runs on a server, so it doesn't provide `document`. Libraries like jsdom can create a fake DOM for tests.

### What is JIT compilation in simple words?

"Just in time" means the engine compiles code *while the program runs*. It starts fast with an interpreter. Then it compiles only the code that runs a lot into fast machine code. You get a quick start *and* good speed.

## ✅ Quick check

### 1. What does this print, and in what order?

```js
setTimeout(() => console.log('B'), 0);   // timer with 0 ms
console.log('A');                        // normal code
```

:::answer
**A, then B.** The timer callback waits in a queue. The event loop runs it only after the main code has finished.
:::

### 2. Which of these is part of the JavaScript language itself, not the runtime?

- A) `document.querySelector`
- B) `Array.prototype.map`
- C) `fs.readFile`

:::answer
**B.** `map` is part of the language. `document` comes from the browser, and `fs` comes from Node.js.
:::

### 3. True or false: JavaScript can only be interpreted, never compiled.

:::answer
**False.** Engines like V8 use JIT compilation. They compile hot code into machine code while the program runs.
:::
