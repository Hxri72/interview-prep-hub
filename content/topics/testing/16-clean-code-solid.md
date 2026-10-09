---
title: Clean code and SOLID basics
stack: testing
order: 16
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Clean code is code another person can read, change and test easily — clear names, small functions, one job each.
  - "SOLID = Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion."
  - In everyday Node.js, the two most useful ideas are single responsibility (one job per function/module) and dependency inversion (pass tools in instead of creating them inside).
  - Passing dependencies in makes code easy to test with fakes, without mocking libraries.
  - Don't over-engineer. Apply these ideas when code starts hurting, not on day one for a tiny script.
cards:
  - q: What does SOLID stand for?
    a: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion.
  - q: What is the single responsibility principle?
    a: A function, class or module should have one job and one reason to change.
  - q: What is dependency inversion, in simple words?
    a: High-level logic should depend on a simple contract (like "something with save()"), and the real tool is passed in from outside.
  - q: How does passing dependencies in help testing?
    a: In tests you pass a fake (an in-memory repo, a console notifier), so the test is fast and needs no database or email server.
  - q: Name three quick clean-code habits.
    a: Clear, specific names; small functions that do one thing; early returns instead of deep nesting.
---

## 💡 What is it?

**Clean code** is code that another developer can **read, change and test** without pain.

It has clear names, small functions, and each piece does **one job**.

**SOLID** is a set of five design ideas that help you keep code clean as it grows. You don't need all five every day. Two of them help the most in Node.js backends.

## 🏠 Real-life example

Think of a **school canteen kitchen**.

- **One cook who takes orders, cooks, washes plates and handles money** = one huge function doing everything. One problem stops everything.
- **Separate jobs: order desk, cook, dishwasher, cashier** = single responsibility. Each person has one job.
- **The cook needs "a stove", not "this exact brand of stove"** = dependency inversion. Any stove that works can be plugged in.
- **A practice day with a toy stove** = testing with a fake dependency.
- **Adding a juice counter without rebuilding the kitchen** = open/closed: add new things without changing old, working parts.

## 🧑‍💻 Code example

An "apply for a job" service, written cleanly. Save as `solid.js`. Run `node solid.js`.

```js
// AFTER the clean-up: each piece does ONE job, and dependencies are passed in.

function validateApplication(app) {                        // job 1: check the input
  if (!app.email) throw new Error('email is required');    // stop early with a clear message
}                                                          // end of validateApplication

function makeApplicationService({ repo, notifier }) {      // job 2: the business steps; tools are passed in
  return {                                                 // the service object
    async apply(app) {                                     // one clear action
      validateApplication(app);                            // reuse the validator
      const saved = await repo.save(app);                  // the service doesn't care HOW it's saved
      await notifier.send(app.email, 'We got your application'); // or HOW the message is sent
      return saved;                                        // give back the saved record
    },                                                     // end of apply
  };                                                       // end of the service object
}                                                          // end of makeApplicationService

const memoryRepo = {                                       // a fake database, great for tests
  rows: [],                                                // where saved applications go
  async save(app) { this.rows.push(app); return { id: this.rows.length, ...app }; }, // store and give an id
};                                                         // end of memoryRepo
const consoleNotifier = {                                  // a fake email sender
  async send(to, text) { console.log(`email to ${to}: ${text}`); }, // just prints instead of emailing
};                                                         // end of consoleNotifier

const service = makeApplicationService({ repo: memoryRepo, notifier: consoleNotifier }); // plug the parts in
service.apply({ email: 'asha@example.com', jobId: 'j1' })  // try a good application
  .then((r) => console.log('saved:', r));                  // show what was saved
service.apply({ jobId: 'j1' })                             // try one with no email
  .catch((e) => console.log('rejected:', e.message));      // validation stops it
```

**Output (real run):**

```text
email to asha@example.com: We got your application
rejected: email is required
saved: { id: 1, email: 'asha@example.com', jobId: 'j1' }
```

**What to notice:**
- `validateApplication` only validates. The service only runs the steps. The repo only saves. Each has **one job**.
- The service never creates a database or email client itself. They are **passed in**.
- To use MongoDB and a real email provider in production, you pass a different `repo` and `notifier`. **The service doesn't change.**
- (The order of the lines comes from promises: the second call's rejection is handled while the first call is still waiting on the notifier.)

## 🔍 Deeper version

**SOLID in plain words, with a Node.js example:**

| Letter | Principle | Simple meaning | Node.js example |
|---|---|---|---|
| S | Single responsibility | one job, one reason to change | route → controller → service → repository layers |
| O | Open/closed | add new behaviour without editing working code | add a new payment provider as a new adapter |
| L | Liskov substitution | any implementation can replace another without surprises | a fake repo and a Mongo repo both return the same shape from `save()` |
| I | Interface segregation | don't force code to depend on things it doesn't use | pass a small `{ send }` notifier, not a giant "utils" object |
| D | Dependency inversion | depend on a contract; get the real tool from outside | `makeService({ repo, notifier })` instead of `new MongoClient()` inside |

**The "before" version** (what we cleaned up) usually looks like one 80-line route handler. It parses the body, validates by hand, queries MongoDB directly, sends an email with a hard-coded client and formats the response, all in one place. It is hard to read, hard to test (you need a real database and email server), and every change risks breaking something else. See [layered architecture](topic:architecture/layered-architecture).

**Everyday clean-code habits:**
- **Names say what, not how:** `activeCandidates`, not `arr2`.
- **Small functions:** if you need "and" to describe it, split it.
- **Early returns** instead of deep `if` nesting.
- **No magic numbers:** `const MAX_PAGE_SIZE = 100` instead of a bare `100`.
- **Comments explain *why*,** not what the code obviously does.
- **Delete dead code.** Git remembers it.
- **DRY, but not too early:** copy once, extract on the third repeat.

**Don't over-engineer.** Five classes and three interfaces for a 20-line script is worse than the script. Use these ideas when code is growing and hurting: hard to test, hard to change, or full of bugs in the same place.

**Testing benefit.** Because the service takes `repo` and `notifier` as arguments, the unit test just passes fakes. No database, no network, no mocking library, so it's fast and reliable. This connects to [mocking](topic:testing/mocking).

## 🎯 Why do we use it?

- **Easier to read.** New teammates understand the code faster.
- **Easier to change.** A change in email sending doesn't touch validation or saving.
- **Easier to test.** Small, separate pieces with passed-in dependencies are simple to unit-test.
- **Fewer bugs.** Small functions with one job have fewer hidden paths.

## ⚠️ Common mistakes

- **God functions.** One handler that does everything.
- **Creating dependencies inside** (`new MongoClient()` in the service). Then you can't test without a real database.
- **Over-engineering.** Interfaces and factories everywhere for simple code.
- **Vague names** like `data`, `info`, `handle`, `temp`.

## 🗣️ How to answer in an interview

> "To me, clean code means another developer can read it, change it and test it easily: clear names, small functions, one job each, early returns, and no magic numbers.
>
> From SOLID, the two I use most in Node.js are single responsibility and dependency inversion. I split routes, controllers, services and repositories so each has one job. And I pass dependencies like the repository or notifier into the service instead of creating them inside. That makes unit tests simple: I just pass in a fake. But I try not to over-engineer. I apply these ideas when code starts to hurt, not to every small script."

You worked on backend code optimisation and shared backend modules at SkillKeepr. [FILL IN: one refactor you did — what was messy, what you split or changed, and the result.]

## 🔁 Follow-up questions

### What is dependency injection, and is it the same as dependency inversion?

Dependency inversion is the principle: depend on a contract, not a concrete tool. Dependency injection is one way to do it: pass the tool in, through a function argument or a constructor.

### How do you know a function is too big?

You need "and" to describe it, it's longer than one screen, it has many levels of nesting, or a small change keeps breaking unrelated things.

### What is DRY, and when can it go wrong?

"Don't repeat yourself." It goes wrong when you merge two things that only look similar. Later they need to change differently, and the shared code fills up with `if` flags.

### Do SOLID principles only apply to classes?

No. They apply to functions and modules too. In JavaScript, passing functions or small objects works just as well as classes.

## ✅ Quick check

### 1. Which SOLID letter does `makeApplicationService({ repo, notifier })` show most clearly?

:::answer
**D — Dependency inversion.** The service gets its tools from outside instead of creating them.
:::

### 2. In the example, why is "email to asha@…" printed before "saved: …"?

:::answer
The `notifier.send` call finishes before `apply` returns, and the `.then` that prints "saved" runs only after `apply` finishes.
:::

### 3. True or false: you should apply all five SOLID principles to every script from day one.

:::answer
**False.** Use them when code grows and starts to hurt. Over-engineering small code makes it harder to read.
:::
