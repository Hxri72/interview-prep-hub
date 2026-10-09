---
title: Profiling and debugging Node (--inspect)
stack: nodejs
order: 27
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "node --inspect app.js opens a debugging port (9229). Chrome DevTools or VS Code can connect to it."
  - With the debugger you can pause on a line (breakpoint), step through code and read variables.
  - A CPU profile shows which functions use the most time. A flame graph makes this easy to see.
  - A heap snapshot shows what is in memory. Comparing two snapshots helps find memory leaks.
  - Never open the inspector port to the internet in production. It gives full control of the process.
cards:
  - q: What does `node --inspect` do?
    a: It starts Node with the V8 inspector on port 9229, so Chrome DevTools or VS Code can attach to debug and profile it.
  - q: What is the difference between --inspect and --inspect-brk?
    a: --inspect starts the app normally. --inspect-brk pauses on the first line, so you can attach before any code runs.
  - q: What is a CPU profile / flame graph?
    a: A recording of which functions were running and for how long. In a flame graph, wide bars are functions that take a lot of time.
  - q: How do you find why one API endpoint is slow?
    a: Add timing logs per step (DB, external calls, processing), check the DB query with explain, and record a CPU profile if the time is spent in your own code.
  - q: Why is the inspector port dangerous in production?
    a: Anyone who connects can run any code inside your process. Only bind it to 127.0.0.1 and use an SSH tunnel if you must.
---

## 💡 What is it?

**Debugging** means finding out *why* your code does the wrong thing. **Profiling** means finding out *where* your code spends its time or memory.

Node has a built-in tool for both. You start your app with `node --inspect`. Then you connect **Chrome DevTools** or **VS Code** to it.

You can pause the code, look at variables, and record which functions are slow.

## 🏠 Real-life example

Think of a **cricket match on TV with replay**.

During the live match, everything moves fast. You can't see why the batsman got out. So the TV team **pauses** the video, **slows it down** and looks frame by frame. They also show a chart of where the ball pitched most often.

- **The live match** = your app running normally.
- **The replay with pause and slow motion** = the debugger with breakpoints and stepping.
- **The pitch map chart** = the CPU profile, which shows where the time goes.
- **The camera cable to the TV truck** = the inspector port (9229).

You only let the TV team plug into the camera. You don't hand the cable to strangers in the crowd. In the same way, never open the inspector port to the internet.

## 🧑‍💻 Code example

Save this as `slow.js`. Run it with `node --inspect slow.js`. Then open `chrome://inspect` in Chrome and click **"inspect"** under your script.

```js
const http = require('node:http');                     // built-in module to make a web server

function slowSum(n) {                                  // a deliberately slow function, so it shows up in the profile
  let total = 0;                                       // start the total at 0
  for (let i = 0; i < n; i++) total += Math.sqrt(i);   // add the square root of every number up to n
  return total;                                        // give back the total
}                                                      // end of slowSum

http.createServer((req, res) => {                      // make a web server; this runs for every request
  const start = performance.now();                     // remember the time now, in milliseconds
  const result = slowSum(50_000_000);                  // the slow work: 50 million loop steps
  const ms = Math.round(performance.now() - start);    // how long it took, rounded
  console.log(`Request took ${ms} ms`);                // a simple timing log
  res.end(`Result: ${result}\n`);                      // send the answer back
}).listen(3000);                                       // listen on port 3000

console.log('Open http://localhost:3000');             // tell us where to go
```

**Output in the terminal:**

```text
Debugger listening on ws://127.0.0.1:9229/1a2b3c...
For help, see: https://nodejs.org/en/docs/inspector
Open http://localhost:3000
Request took 312 ms
```

**Now try this in DevTools:**
1. **Sources** tab → open `slow.js` → click on the line number of `return total;` to add a **breakpoint**. Refresh the page. The code pauses there, and you can see `total` and `n`.
2. **Performance** tab (called **Profiler** in some versions) → click record → refresh the page → stop. You'll see `slowSum` takes almost all the time.

## 🔍 Deeper version

**Inspector flags:**

| Flag | What it does |
|---|---|
| `--inspect` | start normally and listen on `127.0.0.1:9229` |
| `--inspect-brk` | pause on the first line until a debugger attaches |
| `--inspect=0.0.0.0:9229` | listen on all network cards — dangerous outside your laptop |
| `--cpu-prof` | write a CPU profile file (`.cpuprofile`) when the process exits |
| `--heap-prof` | write a heap (memory) sampling profile |

In VS Code, use a "JavaScript Debug Terminal". Any `node` command you run there is debugged automatically.

**Breakpoints and stepping.**
- **Breakpoint:** pause at a line.
- **Conditional breakpoint:** pause only when, say, `userId === '42'`.
- **Logpoint:** print a message without changing code.
- **Step over / into / out:** move one line, go inside a function, or come back out.
- You can also write `debugger;` in code. It pauses only when a debugger is attached.

**CPU profiling.** The profiler checks the call stack many times per second (sampling). Then it shows:
- **Self time:** time spent in the function's own code.
- **Total time:** self time plus the functions it calls.
- **Flame graph:** each bar is a function. Width = time. The bars on top are called by the bars below. Look for wide bars.

**Memory.** The Memory tab can take **heap snapshots**. Compare two snapshots to find objects that keep growing. See [memory and leaks](topic:nodejs/memory-and-leaks).

**Production tools.** You don't attach a debugger to a live server. Instead:
- **Structured logs with timings** and a request ID for each request.
- **APM tools** (Application Performance Monitoring). They show slow endpoints, slow DB queries and errors.
- **Event loop delay:** `perf_hooks.monitorEventLoopDelay()`.
- **clinic.js** (`clinic doctor`, `clinic flame`) to diagnose a load test.
- **Diagnostic reports:** `process.report.writeReport()` writes a JSON file with stack, memory and system info.

**A simple way to debug a slow endpoint:**
1. Measure: add timing logs around each step (DB, external API, processing).
2. If the DB is slow: check the query with `explain()`, add the right index.
3. If an external API is slow: add a timeout and caching.
4. If your own code is slow: record a CPU profile and fix the widest bar.
5. Measure again to confirm.

:::version[Version note]
The old `node debug` / `node --debug` commands were removed years ago. Today everything uses `--inspect`. Very old tutorials may still show the old commands.
:::

## 🎯 Why do we use it?

`console.log` is fine for small checks. But for hard bugs, you need to **pause and look inside**.

For slow code, guessing is a waste of time. A profile shows the exact function that eats the CPU. Then you fix the right thing, and you can prove it got faster.

## ⚠️ Common mistakes

- **Opening the inspector on `0.0.0.0` on a server.** Anyone who connects can run any code. Keep it on `127.0.0.1` and use an SSH tunnel.
- **Optimising before measuring.** Profile first. The slow part is often not where you think.
- **Profiling in development only.** Small test data hides problems. Test with realistic data sizes.
- **Leaving `debugger;` or noisy logs in committed code.** Remove them, or use log levels.

## 🗣️ How to answer in an interview

> "For debugging Node, I start the app with --inspect, or --inspect-brk if I need to pause before anything runs. Then I attach Chrome DevTools through chrome://inspect, or I use the VS Code debugger. I set breakpoints, often conditional ones, step through the code and check the variables.
>
> For performance, I first measure. I add timing logs around each step, like the database call and external APIs. If the time is in a query, I check it with explain and fix the index. If it's in my own code, I record a CPU profile and look at the flame graph for the widest functions. For memory issues, I compare heap snapshots.
>
> In production, I rely on structured logs with request IDs, monitoring and event loop delay metrics. I never expose the inspector port publicly, because it gives full control of the process."

[FILL IN: which logging / error-tracking / monitoring tools you actually used at SkillKeepr. Only add what is true.]

## 🔁 Follow-up questions

### How do you debug a Node app running in Docker?

Start Node with `--inspect=0.0.0.0:9229` *inside* the container. Then map the port only to your own machine: `-p 127.0.0.1:9229:9229`. Attach Chrome or VS Code to `localhost:9229`. Never publish this port on a real server.

### What's the difference between self time and total time?

Self time is time spent in the function's own lines. Total time also includes all the functions it calls. A function with high total time but low self time is just calling something slow.

### How do you debug a problem that only happens in production?

Use logs with a request ID to follow one request. Check error tracking for the stack trace. Compare settings and environment variables with your local setup. Try to reproduce with the same data locally. Add more logging around the suspected area, then deploy.

### What is `--cpu-prof` useful for?

It writes a CPU profile to a file when the process ends, with no DevTools needed. It's handy for scripts, tests or a short load test. You can open the file later in Chrome DevTools.

## ✅ Quick check

### 1. You want the debugger to stop before the very first line of your app runs. Which flag do you use?

- A) `--inspect`
- B) `--inspect-brk`
- C) `--watch`

:::answer
**B) `--inspect-brk`.** It pauses on the first line and waits for a debugger. `--inspect` starts running right away.
:::

### 2. In a flame graph, what does a very wide bar mean?

:::answer
That function (and what it calls) was running for a large share of the recorded time. It's the first place to look for slowness.
:::

### 3. True or false: it's fine to run `node --inspect=0.0.0.0` on a public server for quick checks.

:::answer
**False.** Anyone who can reach the port can run any code in your process. Bind to `127.0.0.1` and use an SSH tunnel.
:::
