---
title: "How JavaScript runs in the browser: engine, Web APIs, event loop and rendering"
stack: web-fundamentals
order: 5
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "The browser is many parts working together: the JS engine, Web APIs (DOM, fetch, timers, storage), queues, and the rendering steps."
  - Your JavaScript, the DOM updates and the painting all share ONE main thread. While your code runs, the page can't paint or react.
  - "Each loop turn: run one task → run ALL microtasks → maybe render (requestAnimationFrame → style → layout → paint)."
  - A long task (say 200 ms) freezes clicks and scrolling. Split it up, or move it to a Web Worker.
  - Page JavaScript runs in a sandbox. It can't read your files or other sites' data. It only gets the APIs the browser allows.
cards:
  - q: What are Web APIs?
    a: Tools the browser gives to JavaScript that are not part of the language itself, like the DOM, fetch, setTimeout, localStorage and requestAnimationFrame.
  - q: Why does a long-running loop freeze the page?
    a: JavaScript, rendering and input handling all share the main thread. While the loop runs, the browser can't paint or handle clicks until it finishes.
  - q: In one loop turn, what runs first — microtasks or rendering?
    a: The browser runs one task, then empties the whole microtask queue (promise callbacks), and only then may it render the next frame.
  - q: What is requestAnimationFrame for?
    a: It runs your callback just before the browser paints the next frame, so it's the right place for visual updates and animations.
  - q: What is a Web Worker?
    a: A separate background thread for JavaScript. It can do heavy work without freezing the page, but it can't touch the DOM; it talks to the page with messages.
---

## 💡 What is it?

When your JavaScript runs in a browser, the **engine** (like V8) is only one part. The browser adds **Web APIs** (DOM, `fetch`, timers, storage), **queues** for waiting callbacks, and a **rendering pipeline** that draws pixels.

One [event loop](glossary:event-loop) ties them together on a single **main thread**. Understanding that one thread explains most "why is my page slow or frozen?" questions.

## 🏠 Real-life example

Think of a **one-person tea shop**.

- The **shopkeeper** = the main thread. Only one person, doing one thing at a time.
- The **recipe knowledge in his head** = the JS engine (it knows how to "do JavaScript").
- The **helpers outside** — the milk supplier, the gas delivery, the alarm clock = Web APIs (`fetch`, timers). They work in parallel and **ring a bell** when done.
- The **order slips on the counter** = the task queue (timer callbacks, click events).
- **Quick notes stuck on his hand** ("also add sugar!") = microtasks. He finishes **all** of them before taking the next slip.
- **Repainting the price board** every few minutes = rendering. He can only do it **between** jobs.
- If he spends 10 minutes **crushing ice by hand**, customers wait and the board isn't updated = a long task freezing the page.
- Hiring a **second worker in the back room** who can't serve customers directly = a Web Worker.

## 🧑‍💻 Code example

Save this as `loop.html` and open it in Chrome. Open DevTools → **Console** to see the output.

```html
<!doctype html>                                                    <!-- a normal HTML5 page -->
<html>                                                             <!-- start of the page -->
<body>                                                             <!-- the visible part -->
  <p id="msg">waiting…</p>                                         <!-- a paragraph we will change -->
  <script>                                                         /* JavaScript starts here */
    const t0 = performance.now();                                  // time when the script starts (ms)
    const log = (m) => console.log(`${Math.round(performance.now() - t0)}ms ${m}`); // print with elapsed time
    log('sync code');                                              // normal code runs first
    setTimeout(() => log('timer callback (task queue)'), 0);      // a task: runs on a later loop turn
    Promise.resolve().then(() => log('promise callback (microtask)')); // a microtask: runs as soon as the current code ends
    requestAnimationFrame(() => log('requestAnimationFrame (before the next paint)')); // runs right before the browser draws
    document.getElementById('msg').textContent = 'changed';        // DOM change; drawn at the next paint
    const end = performance.now() + 200;                           // 200 = milliseconds to stay busy
    while (performance.now() < end) {}                             // a "long task": the main thread is blocked
    log('busy loop finished (page could not react for 200ms)');    // nothing else could run during that time
  </script>                                                        <!-- JavaScript ends here -->
</body>                                                            <!-- end of the visible part -->
</html>                                                            <!-- end of the page -->
```

Real console output from Chrome:

```text
0ms sync code
200ms busy loop finished (page could not react for 200ms)
201ms promise callback (microtask)
205ms timer callback (task queue)
205ms requestAnimationFrame (before the next paint)
```

**What to notice:**
- The timer was set to **0 ms**, but it ran after about **205 ms**. The busy loop held the only thread.
- The **promise** ran before the timer. Microtasks always run right after the current script.
- The text "changed" **wasn't drawn** during the busy loop. Painting had to wait too.
- The timer and `requestAnimationFrame` ran close together. Their order isn't fixed; it depends on when the browser decides to draw the next frame.

## 🔍 Deeper version

**The parts of the browser runtime:**

```text
 ┌─────────────────────────── MAIN THREAD ───────────────────────────┐
 │  JS engine (V8): call stack + heap                                │
 │  Rendering: style → layout → paint (→ composite on another thread)│
 └───────────────▲───────────────────────────────▲───────────────────┘
                 │ callbacks                      │ DOM reads/writes
 Web APIs ── timers, fetch/network, DOM events, storage, Web Workers ──
                 │
   Task queue(s): timers, clicks, network results, postMessage
   Microtask queue: promise callbacks, queueMicrotask, MutationObserver
```

**One turn of the browser event loop** (simplified from the HTML specification):
1. Take **one task** from a task queue and run it to the end (for example a click handler or a timer callback).
2. Run **all microtasks** until the queue is empty. Microtasks added during this step also run now.
3. If it's time for a new frame (about every 16.7 ms on a 60 Hz screen), **render**:
   - run `requestAnimationFrame` callbacks
   - recalculate **style**
   - compute **layout** (sizes and positions)
   - **paint**, then **composite** layers (often on the GPU)
4. Repeat.

More detail on the pixel steps: [HTML/CSS/JS to pixels](topic:web-fundamentals/browser-rendering). A gentler intro to queues: [the JavaScript event loop](topic:javascript/event-loop).

**Long tasks.** Any task over **50 ms** counts as a "long task". The browser can't answer clicks during it, which hurts the **INP** score (how fast the page responds to input). Fixes:
- split work into small pieces (for example `await` a short `setTimeout` between chunks)
- move heavy work to a **Web Worker**
- avoid giant synchronous loops and huge JSON parsing on the main thread

**Web Workers** run JavaScript on **another thread**. They have no DOM. They talk to the page with `postMessage`. Good for parsing big files, image processing or heavy calculations.

**Networking doesn't block.** `fetch` runs in the browser's network process. Only the **callback** comes back as a task or microtask. So waiting for an API never freezes the page; only your own heavy JavaScript does.

**The security sandbox.** Page JavaScript:
- can't read your files (except ones the user picks with `<input type="file">`)
- can't read other sites' pages or cookies, because of the [same-origin policy](topic:web-fundamentals/same-origin-policy)
- runs in a separate process per site in modern Chrome (site isolation)

**Script loading matters too.** A normal `<script>` in `<head>` stops HTML parsing until it downloads and runs. `defer` and `type="module"` scripts wait until the HTML is parsed. See [async vs defer](topic:html-css/async-defer).

## 🎯 Why do we use it?

This model explains real frontend problems:
- **"The UI freezes when I click Export"** → a long task on the main thread. Fix: chunk it or use a Worker.
- **"My spinner doesn't show before the heavy work"** → you set the state but never gave the browser a chance to paint. Yield first (for example with `requestAnimationFrame` or a short timeout).
- **"Why did this promise run before my timer?"** → microtasks always run first.
- **"React feels slow with a big list"** → too much work per render on one thread. Virtualise the list or split the work.

## ⚠️ Common mistakes

- **Thinking `setTimeout(fn, 0)` runs immediately.** It runs after the current task, all microtasks, and maybe a render.
- **Thinking async code runs in parallel.** Your JavaScript still runs on one thread. Only the waiting (network, timers) happens elsewhere.
- **Reading layout right after writing styles in a loop** (`el.style.width = …; el.offsetHeight`). This forces layout again and again, called layout thrashing.
- **Expecting a Web Worker to update the DOM.** It can't. It sends a message, and the main thread updates the DOM.

## 🗣️ How to answer in an interview

> "In the browser, V8 runs the language, but the browser adds Web APIs like the DOM, fetch, timers and storage, plus the event loop and the rendering pipeline. JavaScript, style, layout and paint all share the main thread.
>
> Each loop iteration runs one task — a click handler or a timer callback — then drains the whole microtask queue, which is promise callbacks, and then, if a frame is due, it runs requestAnimationFrame callbacks and does style, layout and paint.
>
> That's why a long synchronous task freezes the page: the browser can't paint or handle input until it finishes. Waiting on the network doesn't block, because fetch runs outside the main thread and only its callback is queued. For heavy work I split it into chunks or move it into a Web Worker, which runs on another thread but can't touch the DOM."

## 🔁 Follow-up questions

### Where do click events go while a long task is running?

They wait in the task queue. They run after the long task finishes, which is why the page feels "stuck" and then suddenly reacts.

### When should you use `requestAnimationFrame` instead of `setTimeout`?

For anything visual, like animations or measuring and moving elements. It runs right before the paint and pauses in hidden tabs, so animations are smooth and don't waste battery.

### Does `async/await` make code run on another thread?

No. `await` pauses your function and lets other tasks run. The code after `await` continues later as a **microtask**, still on the main thread.

### How do you find long tasks in a real app?

DevTools → **Performance** → record. Long tasks show a red corner. Click one to see which function took the time.

## ✅ Quick check

### 1. Predict the order of the logs:

```js
setTimeout(() => console.log('A'), 0);              // a task
Promise.resolve().then(() => console.log('B'));     // a microtask
console.log('C');                                   // normal code
```

:::answer
**C, B, A.** Normal code first, then all microtasks, then the timer task on a later loop turn.
:::

### 2. A button click runs a 3-second loop that sorts a big array. What does the user feel, and how do you fix it?

:::answer
The page **freezes for 3 seconds**: no scrolling, no clicks, no spinner. Fix it by moving the sort to a **Web Worker**, or by splitting the work into small chunks that let the browser paint in between.
:::

### 3. True or false: a slow `fetch` request (5 seconds) freezes the page.

:::answer
**False.** The network request runs outside the main thread. The page stays responsive. Only the callback runs later on the main thread.
:::
