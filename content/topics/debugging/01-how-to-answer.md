---
title: "How to answer any debugging question (Detect → Debug → Fix → Prevent)"
stack: debugging
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Scenario questions test how you think, not what you memorised.
  - "Answer every one in 4 steps: Detect → Debug → Fix → Prevent."
  - "Detect = confirm the problem is real. Debug = find the exact cause with tools. Fix = change matched to the cause. Prevent = tests, lint rules, monitoring."
  - Say a 20-second short version first, then go deeper if the interviewer wants.
  - Always name real tools (React DevTools Profiler, Network tab, logs, explain()) — it proves experience.
cards:
  - q: What are the 4 steps for answering a debugging question?
    a: Detect (confirm it's real), Debug (find the exact cause with tools), Fix (a change matched to the cause), Prevent (tests, lint rules, monitoring so it doesn't come back).
  - q: Why not jump straight to the fix?
    a: Because one symptom can have many causes. A fix that doesn't match the cause wastes time and can add new bugs.
  - q: What does "Prevent" mean in a debugging answer?
    a: How you stop the bug from coming back — a test, a lint rule, an alert, a code-review checklist item.
  - q: How long should a debugging answer be?
    a: Start with a 20-second summary of all 4 steps. Then add detail only where the interviewer asks.
  - q: Which tools should you mention for frontend bugs?
    a: React DevTools (highlight updates and Profiler), the browser Network tab, the Performance tab, Lighthouse and the console.
---

## 💡 What is it?

Interviewers often ask: "Something is broken. What do you do?"

They don't want one magic answer. They want to see **how you think**.

So use the same **4 steps** for every scenario: **Detect → Debug → Fix → Prevent**. This page teaches the method. The other pages in this section use it.

## 🏠 Real-life example

Think of a **doctor** seeing a patient with a fever.

1. **Detect:** the doctor first checks the temperature. Is it really a fever?
2. **Debug:** then runs tests. Is it a cold, an infection or something else?
3. **Fix:** gives the medicine that matches the cause. Not random medicine.
4. **Prevent:** gives advice so it doesn't happen again, like washing hands.

- **Thermometer** = your detection tools (DevTools, logs, monitoring).
- **Blood test** = your debugging tools (Profiler, `explain()`, Network tab).
- **The right medicine** = the fix that matches the cause.
- **Health advice** = tests, lint rules and alerts.

A bad doctor gives medicine without testing. A bad debugging answer jumps to "I'd use `useMemo`" without finding the cause.

## 🧑‍💻 Code example

This tiny Node script shows the method on a slow function. Save it as `method.js`. Run `node method.js`.

```js
// STEP 1 — DETECT: measure first, don't guess
console.time('slow version');                        // start a timer named "slow version"
const items = Array.from({ length: 20000 }, (_, i) => i % 5000); // 20,000 numbers with many repeats
const uniqueSlow = items.filter((x, i) => items.indexOf(x) === i); // indexOf inside filter = a hidden loop
console.timeEnd('slow version');                     // print how long it took

// STEP 2 — DEBUG: find the exact cause
// indexOf scans the array again for every item → O(n²) work

// STEP 3 — FIX: change matched to the cause
console.time('fast version');                        // start a second timer
const uniqueFast = [...new Set(items)];              // a Set checks "seen before?" in O(1)
console.timeEnd('fast version');                     // print the new time

// STEP 4 — PREVENT: a check that fails if the behaviour changes
console.log(uniqueSlow.length === uniqueFast.length); // true → same result, much faster
```

**Output** (times will differ on your computer):

```text
slow version: 11.735ms
fast version: 0.439ms
true
```

## 🔍 Deeper version

**Step 1 — Detect: is it real, and how big?**
- Reproduce it. Which page, which user, which data, which browser?
- Measure it. "Slow" is not a number. "3.2 seconds on the jobs page" is.
- Check if it started after a deploy. Recent changes are the first suspects.

**Step 2 — Debug: find the exact cause.**
Use the right tool for the layer:

| Layer | Tools |
|---|---|
| React UI | React DevTools (highlight updates, Profiler), console logs |
| Browser | Network tab, Performance tab, Memory tab, Lighthouse |
| Node API | timing logs, request IDs, `node --inspect`, CPU profile |
| Database | `explain('executionStats')`, slow query log |
| Production | logs, error tracking, metrics (latency, error rate) |

Change **one thing at a time**. Otherwise you don't know what fixed it.

**Step 3 — Fix: match the cause.**
One symptom can have many causes. For example, a slow page can be a big bundle, a slow API or big images. Each needs a different fix. Say "**it depends on the cause**", then list causes and their fixes.

**Step 4 — Prevent: stop it coming back.**
- A test that fails if the bug returns.
- A lint rule (like `react-hooks/exhaustive-deps`).
- Monitoring and alerts (error rate, slow endpoints).
- A note in the code review checklist.

**Then verify.** Measure again after the fix. "The render count dropped from 40 to 2" is a strong ending.

## 🎯 Why do we use it?

- It gives you a **structure** under pressure. You never freeze.
- It shows **senior thinking**: measuring, finding causes, preventing repeats.
- It works for **every** scenario: frontend, backend, database, deployment.
- Interviewers can follow you easily, so they give you more marks.

## ⚠️ Common mistakes

- **Jumping to a fix** ("I'd add `React.memo`") without saying how you found the cause.
- **Listing tools without a plan.** Say *why* you open each tool.
- **Forgetting Prevent.** It's what separates a 3-year developer from a junior.
- **Talking too long.** Give the short version first, then go deeper only if asked.

## 🗣️ How to answer in an interview

> **Short version (20 seconds):** "I follow four steps. First I detect: I reproduce the problem and measure it. Then I debug with the right tool, like the React Profiler, the Network tab or explain() for a query, to find the exact cause. Then I fix it in a way that matches that cause. Finally I prevent it, with a test, a lint rule or an alert, and I measure again to confirm the fix worked."
>
> **If they want more:** "For example, if a component re-renders too much, I'd confirm it with React DevTools' highlight updates. Then I'd record in the Profiler to see why it rendered: props, state, context or the parent. The fix depends on that reason. It could be React.memo, useCallback, splitting a context or moving state down. Then I profile again to confirm the render count dropped."

[FILL IN: one real bug you found and fixed at SkillKeepr, told in these 4 steps. Only if it's true.]

## 🔁 Follow-up questions

### What if you can't reproduce the bug?

Collect more data. Check logs and error tracking for that user and time. Add more logging around the suspect code. Compare the user's environment (browser, data, permissions) with yours.

### How do you decide where to start looking?

Start from the outside and go in. Check what changed recently (a deploy). Then check which layer is slow or failing: the browser, the API or the database. Timing logs per step tell you quickly.

### What if there are several possible causes?

List them, then test the cheapest-to-check first. Change one thing at a time and measure after each change.

### Why measure again after the fix?

To prove the fix worked. Without numbers, you are guessing. It also gives you a strong result to tell the interviewer.

## ✅ Quick check

### 1. An interviewer says "the page is slow". What should you say first?

- A) "I'd add `useMemo` everywhere."
- B) "First I'd reproduce and measure it, to see where the time goes."
- C) "I'd rewrite it in Next.js."

:::answer
**B.** Detect first. You can't choose a fix before you know the cause.
:::

### 2. Which step is "add a lint rule so this mistake can't be merged again"?

:::answer
**Prevent.** It stops the bug from coming back.
:::

### 3. True or false: one symptom always has one cause.

:::answer
**False.** A slow page can be a big bundle, a slow API, big images or too many re-renders. That's why you debug before you fix.
:::
