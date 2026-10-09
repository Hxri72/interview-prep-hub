---
title: Promise.all, allSettled, race and any
stack: javascript
order: 24
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - These four helpers take a list of promises and give back one promise.
  - Promise.all waits for all of them and fails fast if any one fails. Results keep the input order.
  - Promise.allSettled waits for all of them and never fails; you get a status report for each one.
  - Promise.race settles with the first promise to finish (success or failure); Promise.any gives the first success.
  - Use them to run independent API calls at the same time, so total time ≈ the slowest call, not the sum.
cards:
  - q: How do you run three API calls in parallel?
    a: "Start them together and await Promise.all: const [a, b, c] = await Promise.all([getA(), getB(), getC()])."
  - q: What happens to Promise.all if one promise rejects?
    a: It rejects right away with that error (fails fast). The other calls keep running, but their results are ignored.
  - q: When do you use Promise.allSettled?
    a: When you want every result even if some fail, like loading several dashboard widgets. Each result has status 'fulfilled' (with value) or 'rejected' (with reason).
  - q: What is the difference between race and any?
    a: race settles with the first promise to finish, even if it failed. any waits for the first success and only rejects (with an AggregateError) if all of them fail.
  - q: Does Promise.all make JavaScript multi-threaded?
    a: No. It only lets several waits overlap. The calls run in the background at the same time, and your JavaScript still runs one step at a time.
---

## 💡 What is it?

These are four helpers that **take a list of [promises](glossary:promise) and give back one promise**:

- **`Promise.all`**: wait for **all** of them. Fail if **any** one fails.
- **`Promise.allSettled`**: wait for **all** of them, and tell me how **each one** went.
- **`Promise.race`**: give me the **first one to finish**, good or bad.
- **`Promise.any`**: give me the **first one that succeeds**.

The main use: start **several slow calls at the same time** instead of one by one.

## 🏠 Real-life example

Think of **getting ready for a school trip**. You need three things: a permission slip, lunch and a water bottle.

- **`Promise.all`**: you and two friends each fetch one thing **at the same time**. You leave when **all three** are ready. If the permission slip is refused, the trip is off straight away.
- **`Promise.allSettled`**: the teacher checks every student's bag and writes a report: "Asha ✓, Ravi ✗ forgot water". Everyone is checked, even if some fail.
- **`Promise.race`**: two buses are coming. You take **whichever arrives first**, even if it's the wrong bus.
- **`Promise.any`**: you call three friends to borrow a pen. You take the **first friend who says yes**. "No" answers are ignored. You only give up if **all** say no.

## 🧑‍💻 Code example

Save this as `combinators.js`. Run it with `node combinators.js`.

```js
const wait = (ms, value, fail = false) =>           // helper: a fake API call that takes ms milliseconds
  new Promise((resolve, reject) =>                  // make a new promise
    setTimeout(() => (fail ? reject(new Error(value)) : resolve(value)), ms)); // fail=true → reject, else resolve

async function main() {                             // async wrapper so we can use await
  console.time('all');                              // start a stopwatch called "all"
  const [user, jobs, stats] = await Promise.all([   // start all 3 calls at the SAME time
    wait(300, 'user'),                              // takes 300 ms
    wait(200, 'jobs'),                              // takes 200 ms
    wait(100, 'stats'),                             // takes 100 ms
  ]);                                               // waits for all 3; results keep the same order
  console.log(user, jobs, stats);                   // user jobs stats
  console.timeEnd('all');                           // about 300 ms (the slowest one), not 600 ms

  try {                                             // Promise.all fails fast if one call fails
    await Promise.all([wait(100, 'ok'), wait(50, 'API down', true)]); // the second one rejects
  } catch (err) {                                   // catch the first error
    console.log('all failed:', err.message);        // all failed: API down
  }                                                 // end of try/catch

  const results = await Promise.allSettled([        // allSettled waits for every call, never fails
    wait(100, 'ok'),                                // this one succeeds
    wait(50, 'API down', true),                     // this one fails
  ]);                                               // results = one report per call
  console.log(results.map((r) => r.status));        // [ 'fulfilled', 'rejected' ]

  const fastest = await Promise.race([              // race settles with the FIRST one to finish
    wait(300, 'slow server'),                       // finishes at 300 ms
    wait(100, 'fast server'),                       // finishes at 100 ms → wins
  ]);                                               // end of race
  console.log('race:', fastest);                    // race: fast server

  const firstOk = await Promise.any([               // any = first SUCCESS (failures are ignored)
    wait(50, 'mirror 1 down', true),                // fails first, but any ignores it
    wait(150, 'mirror 2'),                          // the first one that succeeds
  ]);                                               // end of any
  console.log('any:', firstOk);                     // any: mirror 2
}                                                   // end of main

main();                                             // run everything
```

**Output** (the time can differ by a few milliseconds):

```text
user jobs stats
all: 303.119ms
all failed: API down
[ 'fulfilled', 'rejected' ]
race: fast server
any: mirror 2
```

## 🔍 Deeper version

**1. Comparison table:**

| Helper | Resolves when | Rejects when | Result |
|---|---|---|---|
| `Promise.all` | all fulfil | **any one** rejects (fail fast) | array of values, in **input order** |
| `Promise.allSettled` | all settle | never | array of `{ status, value }` or `{ status, reason }` |
| `Promise.race` | the first one settles (if it fulfils) | the first one settles (if it rejects) | that first value or error |
| `Promise.any` | the first one fulfils | **all** reject | first value, or an `AggregateError` with all the reasons |

**2. The real parallel trick is *starting* them together.** A promise starts its work when you **call** the function, not when you `await` it. `Promise.all([getA(), getB()])` calls both functions immediately, so their waits overlap. Total time ≈ the **slowest** call.

**3. "Fail fast" doesn't cancel anything.** When `Promise.all` rejects, the other requests **keep running**. JavaScript just ignores their results. To really stop them, pass an `AbortController` signal to `fetch` and call `abort()`.

**4. Order.** `Promise.all` and `allSettled` return results in the **same order as the input**, not in the order they finished. That's why destructuring `const [user, jobs] = ...` is safe.

**5. Common real uses:**
- **Dashboard load:** `allSettled` so one broken widget doesn't blank the whole page.
- **Timeout:** `Promise.race([fetchData(), timeout(5000)])`. For `fetch`, `AbortSignal.timeout(5000)` is better, because it really cancels the request.
- **Fallback servers or mirrors:** `Promise.any`.

**6. Don't fire 10,000 at once.** `Promise.all(hugeList.map(callApi))` can hit rate limits or run out of database connections. Process the list in batches (for example 10 at a time), or use a small concurrency library such as `p-limit`.

:::version[Version note]
`Promise.allSettled` arrived in **ES2020** and `Promise.any` (with `AggregateError`) in **ES2021**. `Promise.all` and `race` have existed since ES2015. All four work in Node 24 and current browsers.
:::

## 🎯 Why do we use it?

- **Speed.** Three 300 ms calls take about 300 ms together instead of 900 ms one by one.
- **Clear intent.** `all` = "I need everything". `allSettled` = "show what you can". `any` = "any good answer". `race` = "whoever is first".
- **Better error control** for pages and APIs that combine data from many places.

## ⚠️ Common mistakes

- **Awaiting inside the array build**, like `Promise.all([await a(), await b()])`. The awaits run one by one *before* `Promise.all` even starts.
- **Using `Promise.all` when partial results are fine.** One failure throws away all the successful results. Use `allSettled`.
- **Thinking `race` gives the first *success*.** It gives the first to **finish**, even if that one failed. Use `any` for the first success.
- **Starting thousands of calls at once** and hitting rate limits.

## 🗣️ How to answer in an interview

> "If three API calls don't depend on each other, I start them together and await Promise.all. Then the total time is roughly the slowest call, not the sum. The results come back in the same order I passed them in.
>
> Promise.all fails fast: if any call rejects, the whole thing rejects with that error. The other calls aren't cancelled, though. If I want every result even when some fail, like dashboard widgets, I use Promise.allSettled and check each status. Promise.race gives me the first promise to settle, which is handy for timeouts. Promise.any gives me the first success and only fails if all of them fail.
>
> For big lists, I don't fire everything at once. I batch or limit concurrency, so I don't hit rate limits or exhaust database connections."

[FILL IN: a real place you ran calls in parallel at SkillKeepr, e.g. loading recruiter dashboard data — only if it's true.]

## 🔁 Follow-up questions

### What does `Promise.all([])` return?

A promise that resolves immediately with an empty array `[]`.

### How do you cancel the other requests when one fails in `Promise.all`?

Create one `AbortController`, pass its `signal` to every `fetch`, and call `controller.abort()` in the `catch`.

### What is an `AggregateError`?

The error `Promise.any` rejects with when **all** promises fail. Its `errors` property holds the reason from each one.

### How would you limit Promise.all to 5 at a time?

Split the list into chunks of 5 and `await Promise.all(chunk.map(fn))` for each chunk in a `for...of` loop. Or use a library like `p-limit`, which keeps 5 running at all times.

## ✅ Quick check

### 1. What does this print?

```js
const p1 = Promise.resolve('A');                   // fulfilled with A
const p2 = Promise.reject(new Error('B failed'));  // rejected
Promise.allSettled([p1, p2]).then((r) => console.log(r.map((x) => x.status))); // ?
```

:::answer
**`[ 'fulfilled', 'rejected' ]`.** `allSettled` never rejects. It reports the status of each promise, in input order.
:::

### 2. What does this print?

```js
const slowOk = new Promise((res) => setTimeout(() => res('ok'), 200));        // succeeds at 200 ms
const fastFail = new Promise((_, rej) => setTimeout(() => rej(new Error('fail')), 100)); // fails at 100 ms
Promise.race([slowOk, fastFail]).then(console.log).catch((e) => console.log('caught', e.message)); // ?
```

:::answer
**`caught fail`.** `race` settles with whichever finishes first. That's the rejection at 100 ms. (`Promise.any` would print `ok`.)
:::

### 3. Each call below takes 1 second. How long does each line take?

```js
await Promise.all([callA(), callB()]);             // line 1
await Promise.all([await callA(), await callB()]); // line 2
```

:::answer
**Line 1: about 1 second** (both run together). **Line 2: about 2 seconds**, because each `await` inside the array finishes before the next call even starts.
:::
