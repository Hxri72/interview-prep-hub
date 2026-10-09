---
title: Debounce and throttle (write from scratch)
stack: javascript
order: 31
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Debounce waits until the calls STOP for a set time, then runs once. Good for search boxes.
  - Throttle runs at most once every set time, no matter how many calls come. Good for scroll and resize.
  - Both are built with a closure that remembers a timer ID or the last run time.
  - Debounce uses clearTimeout + setTimeout. Throttle compares Date.now() with the last run time.
  - In React, keep the debounced function stable (useMemo/useRef) and cancel it on unmount.
cards:
  - q: What is debounce?
    a: A wrapper that delays a function until the calls stop for a set time. Each new call resets the timer. Only the last call runs.
  - q: What is throttle?
    a: A wrapper that lets a function run at most once in each time window, like once every 100 ms, and ignores the extra calls.
  - q: Where would you use debounce vs throttle?
    a: "Debounce: search-as-you-type, auto-save, window resize finished. Throttle: scroll position, mouse move, infinite scroll checks."
  - q: Why does debounce need a closure?
    a: The returned function must remember the timer ID between calls, so it can cancel the previous timer.
  - q: Common React bug with debounce?
    a: Creating a new debounced function on every render, so each keystroke gets its own timer. Wrap it in useMemo or useRef.
---

## 💡 What is it?

Some events fire **very fast**. Typing fires on every key. Scrolling can fire many times per second.

**Debounce** and **throttle** are two ways to stop a function from running too often:
- **Debounce**: wait until the events **stop**, then run **once**.
- **Throttle**: run **at most once** in each time window, like once every 100 ms.

Both are small helper functions you can write yourself with a [closure](topic:javascript/closures) and a timer.

## 🏠 Real-life example

**Debounce = a lift (elevator) door.** The door waits a few seconds before closing. If someone else walks in, the wait starts again. The door only closes when people **stop** coming. Then it moves once.

**Throttle = a school bell.** The bell rings once every period, say every 45 minutes. It doesn't matter how many students ask "is it time yet?" The bell still rings only once per period.

- **People walking in / students asking** = the fast events (key presses, scroll events).
- **Door closing / bell ringing** = your function actually running.
- **The waiting time / the period** = the `delay` or `gap` in milliseconds.

## 🧑‍💻 Code example

Save this as `debounce.js`. Run it with `node debounce.js`.

```js
function debounce(fn, delay) {                       // fn = the work to do; delay = how long to wait (ms)
  let timerId;                                       // remembers the waiting timer (kept alive by a closure)
  return function (...args) {                        // the new function we call on every key press
    clearTimeout(timerId);                           // cancel the timer from the previous call
    timerId = setTimeout(() => fn(...args), delay);  // start a new timer; fn runs only if no new call comes
  };                                                 // end of the returned function
}                                                    // end of debounce

function throttle(fn, gap) {                         // fn = the work; gap = minimum time between runs (ms)
  let last = 0;                                      // when fn last ran; 0 = never
  return function (...args) {                        // the new function we call on every scroll event
    const now = Date.now();                          // the current time in ms
    if (now - last >= gap) {                         // has enough time passed since the last run?
      last = now;                                    // remember this run's time
      fn(...args);                                   // run the work now
    }                                                // otherwise: ignore this call
  };                                                 // end of the returned function
}                                                    // end of throttle

const search = debounce((q) => console.log('search API called with:', q), 300); // wait 300 ms after the last key
search('n');                                         // user types "n"
search('no');                                        // then "no" — the "n" timer is cancelled
search('nod');                                       // then "nod" — the "no" timer is cancelled

const onScroll = throttle((i) => console.log('scroll handled at event', i), 100); // at most once every 100 ms
let i = 0;                                           // counts scroll events
const id = setInterval(() => {                       // fake a scroll event every 20 ms
  i = i + 1;                                         // next event number
  onScroll(i);                                       // most of these calls are ignored
  if (i === 15) clearInterval(id);                   // stop after 15 events (about 300 ms)
}, 20);                                              // 20 ms between fake events
```

**Output:**

```text
scroll handled at event 1
scroll handled at event 6
scroll handled at event 11
search API called with: nod
```

- **Throttle:** 15 scroll events came in, but the work ran only 3 times (about once every 100 ms). The exact event numbers can change a little on a slow computer.
- **Debounce:** 3 calls came in, but the search ran **once**, with the last value `nod`, 300 ms after typing stopped.

## 🔍 Deeper version

**Debounce vs throttle side by side:**

| | Debounce | Throttle |
|---|---|---|
| Runs when | the calls **stop** for `delay` ms | at most once every `gap` ms |
| During a long burst | runs **0 times** until the end | runs **regularly** |
| Typical use | search box, auto-save, "resize finished" | scroll, mousemove, drag, infinite scroll |

**Why the closure matters.** `timerId` and `last` live in the outer function. Every call to the returned function shares them. Without the closure, each call would have its own fresh variable and could not cancel the previous timer.

**Leading vs trailing.** The debounce above is **trailing**: it runs after the pause. A **leading** debounce runs on the first call, then ignores calls until the pause. Libraries like lodash support `{ leading, trailing }` options. Lodash's debounce also has `maxWait`, which forces a run even during a long burst.

**Keeping `this` and arguments.** Using `function (...args)` and `fn(...args)` passes all arguments through. If `fn` uses `this`, call `fn.apply(this, args)` instead.

**A `cancel` method.** Real helpers often return a function with a `.cancel()` method:

```js
function debounce(fn, delay) {                       // same idea as above
  let timerId;                                       // the waiting timer
  const debounced = (...args) => {                   // the wrapped function
    clearTimeout(timerId);                           // cancel the previous timer
    timerId = setTimeout(() => fn(...args), delay);  // start a new one
  };                                                 // end of wrapped function
  debounced.cancel = () => clearTimeout(timerId);    // lets you stop a waiting call, e.g. on unmount
  return debounced;                                  // give back the wrapped function
}                                                    // end of debounce
```

**In React.** Each render makes new functions. If you write `const search = debounce(...)` in the component body, every render gets a **new** timer, and debounce stops working. Create it once with `useMemo` or `useRef`, and cancel it in a `useEffect` cleanup. For heavy result lists, React's `useDeferredValue` is another option. It lets typing stay fast while the list updates a bit later.

**Throttle with a trailing call.** The simple throttle above drops the last call in a burst. For scroll position that's usually fine. If you need the final value, add a trailing timer like debounce does.

## 🎯 Why do we use it?

- **Fewer API calls.** Typing "javascript" could send 10 requests. With debounce, it sends 1.
- **Smoother pages.** Scroll and resize handlers that do layout work can freeze the page if they run 100 times a second.
- **Less server load and cost**, especially for search or paid APIs.
- **Fewer race conditions**, because there are fewer requests in flight.

## ⚠️ Common mistakes

- **Mixing them up.** Using throttle for a search box sends requests while the user is still typing. Using debounce for scroll means nothing happens until scrolling stops.
- **Creating the debounced function inside a React render.** Each render gets a new timer. Use `useMemo`/`useRef`.
- **Forgetting to cancel on unmount.** The timer can fire after the component is gone and update old state.
- **Losing the arguments.** Writing `setTimeout(fn, delay)` instead of `setTimeout(() => fn(...args), delay)` calls `fn` with no input.

## 🗣️ How to answer in an interview

> "Both limit how often a function runs. Debounce waits until the calls stop for a certain time and then runs once, with the latest arguments. I use it for search-as-you-type and auto-save. Throttle runs at most once per time window, no matter how many calls come in. I use it for scroll, resize or mousemove handlers.
>
> I can write both with a closure. Debounce keeps a timer ID: each call clears the old timeout and sets a new one. Throttle keeps the last run time and only runs when Date.now() minus that is at least the gap.
>
> In React, the main trap is recreating the debounced function on every render, so I create it once with useMemo or useRef and cancel it in the effect cleanup."

[FILL IN: a real place you used debounce in the recruiter or candidate screens at SkillKeepr, e.g. a candidate search box. Only add it if it's true.]

## 🔁 Follow-up questions

### What is the difference between leading and trailing debounce?

Trailing runs **after** the calls stop. That's the common one for search. Leading runs on the **first** call, then ignores the rest until things go quiet. It's useful for stopping double-clicks on a "Submit" button.

### How would you debounce a search box in React?

Keep the input value in state so typing stays instant. Create the debounced API call once with `useMemo` (or a `useRef`), call it from `onChange`, and cancel it in a `useEffect` cleanup. Many teams use a small `useDebounce(value, 300)` hook that returns the delayed value.

### Is requestAnimationFrame a kind of throttle?

Yes, for visual work. `requestAnimationFrame` runs your code once before the next screen paint, about 60 times a second. It's a good way to throttle scroll or drag updates that change the layout.

### Can you use lodash instead of writing your own?

Yes. In real projects, `lodash.debounce` and `lodash.throttle` are common and well tested. Interviewers ask you to write them to check that you understand closures and timers.

## ✅ Quick check

### 1. A debounced function with a 300 ms delay is called at 0 ms, 100 ms and 200 ms. When does it run, and how many times?

:::answer
**Once, at about 500 ms** (200 ms + 300 ms). Each call resets the timer. It runs only after the last call plus the delay.
:::

### 2. Which one should you use for an infinite-scroll check while the user scrolls?

- A) Debounce
- B) Throttle

:::answer
**B) Throttle.** You want regular checks *during* scrolling. Debounce would wait until scrolling stops.
:::

### 3. What's wrong here?

```js
function debounce(fn, delay) {             // a debounce helper
  return function (...args) {              // returned function
    let timerId;                           // the timer variable is INSIDE the returned function
    clearTimeout(timerId);                 // clears nothing useful
    timerId = setTimeout(() => fn(...args), delay); // a new timer every call
  };
}
```

:::answer
`timerId` is created **inside** the returned function, so every call has a new, empty variable. It can never cancel the previous timer, so `fn` runs every time. Move `let timerId` to the outer function, so the closure shares it.
:::
