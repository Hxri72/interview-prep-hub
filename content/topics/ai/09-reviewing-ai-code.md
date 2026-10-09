---
title: Reviewing AI-generated code safely
stack: ai
order: 9
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "The 5 safety rules: you own every line; test it; never paste secrets; check facts and package names; don't let AI make big design decisions alone."
  - Read AI code like a teammate's pull request — correctness, edge cases, security, performance and fit with your project.
  - A small test often finds the bug the AI was confident about.
  - Check that every suggested package really exists, is maintained and is the one you meant.
  - Be extra careful with auth, payments, permissions, SQL/NoSQL queries and anything touching user data.
cards:
  - q: How do you make sure AI-generated code is correct and secure?
    a: I read every line, run it, add tests including edge cases, check security-sensitive parts (input validation, auth, queries), verify packages exist, and never paste secrets into the tool.
  - q: What are the 5 safety rules for AI coding tools?
    a: You're responsible for every line; test it; never paste secrets or customer data; check facts and package names; don't let AI make big design decisions alone.
  - q: Why check package names suggested by AI?
    a: AI can invent packages that don't exist. Attackers sometimes publish malware under those names (slopsquatting).
  - q: Which code needs the most careful review when AI writes it?
    a: Authentication, authorisation, payments, database queries, input validation, file handling and anything with personal data.
  - q: What is a quick way to catch an AI bug?
    a: Write a small test with a known expected answer and edge cases, then run it before trusting the code.
---

## 💡 What is it?

AI tools write code fast. But the code can have **bugs, security holes or made-up functions** — even when it looks perfect.

**Reviewing AI-generated code** means checking it as carefully as a teammate's pull request **before** you merge it.

Hari's notes give **5 safety rules**:
1. **You are responsible for every line.** Read and understand it before committing.
2. **Test it.** Run it, write tests, try edge cases.
3. **Never paste secrets** (API keys, passwords, customer data) into AI tools.
4. **Check facts and package names.** AI can invent functions or libraries.
5. **Don't let it make big design decisions alone.** Use it to explore options; you decide.

## 🏠 Real-life example

Think of a **new intern who writes very fast**.

The intern hands you a neat report in 5 minutes. It looks great. But you still check it before sending it to the client.

- The **intern** = the AI tool.
- **Neat, confident writing** = code that looks correct.
- **Checking the numbers** = running tests.
- **"Who told you this?"** = checking package names and facts in the docs.
- **Not giving the intern the office safe key** = not pasting secrets.
- **The manager signing the report** = you, merging the code. Your name is on it.

## 🧑‍💻 Code example

An AI tool wrote a `paginate()` function. It looks fine, but our API counts pages from **1**, not 0. One tiny test catches the bug. Save it as `review.js`. Run `node review.js`.

```js
// An AI tool wrote paginate(). A tiny test finds its bug before it ships.
const aiPaginate = (items, page, size) => items.slice(page * size, page * size + size); // AI version: assumes page starts at 0
const fixedPaginate = (items, page, size) => items.slice((page - 1) * size, page * size); // our API uses page 1 as the first page

const items = ['a', 'b', 'c', 'd', 'e'];                   // 5 sample items
const expectFirstPage = (fn) => JSON.stringify(fn(items, 1, 2)) === JSON.stringify(['a', 'b']); // page 1, size 2 → ['a','b']

console.log('AI version  page 1:', aiPaginate(items, 1, 2), expectFirstPage(aiPaginate) ? 'PASS' : 'FAIL'); // skips the first page
console.log('Fixed       page 1:', fixedPaginate(items, 1, 2), expectFirstPage(fixedPaginate) ? 'PASS' : 'FAIL'); // correct
```

**Output:**

```text
AI version  page 1: [ 'c', 'd' ] FAIL
Fixed       page 1: [ 'a', 'b' ] PASS
```

The AI code wasn't "wrong" in general — it just didn't know **our** rule. That's exactly the kind of bug a reviewer must catch. Users would never have seen the first two candidates.

## 🔍 Deeper version

**A review checklist for AI code:**

| Area | What to check |
|---|---|
| **Correctness** | Does it match our rules (page numbering, time zones, status values)? Edge cases: empty list, null, very large input |
| **Security** | Input validation, no string-built queries, auth and permission checks, no secrets in code, safe file handling |
| **Packages** | The package exists, is popular and maintained, has the right name, and the API it uses is real for that version |
| **Performance** | No query inside a loop (N+1), no loading huge data into memory, no blocking work in a request |
| **Error handling** | Errors caught and returned in our standard format, no swallowed exceptions |
| **Fit** | Follows our folder structure, naming, logging and patterns |
| **Tests** | New behaviour covered, tests actually fail when the code is wrong |

**Common AI mistakes to look for:**
- **Made-up APIs:** a method or option that doesn't exist, or exists only in a different version.
- **Old patterns:** for example Express 4 or React class-component habits in a newer codebase.
- **Missing edge cases:** happy path only.
- **Silent security gaps:** a route without an auth check, or user input passed straight into a database filter. See [NoSQL injection](topic:mongodb/nosql-injection).
- **Over-engineering:** extra layers and abstractions you don't need.

**Package safety (slopsquatting).** AI tools sometimes suggest package names that don't exist. Attackers can publish malware under those names. Before `npm install`, check the package page: weekly downloads, maintainers, repository and last update.

**Treat AI output like any PR.** The same [code review](topic:testing/code-reviews) standards apply. Keep linting, type checks and CI running on AI-written code too.

**Big decisions stay human.** AI can list options for "monolith or microservices?" — but you decide, using your team's real constraints.

## 🎯 Why do we use it?

- AI makes you faster, but **unreviewed** AI code moves bugs and security holes into production faster too.
- Interviewers now ask this directly: "How do you know AI code is correct?" A clear review habit is a strong answer.
- In hiring software, a bug can show the **wrong candidates or leak personal data**. Review protects users and the company.

## ⚠️ Common mistakes

- **"It ran, so it's right."** It may run and still be wrong for your rules or insecure.
- **Installing a suggested package without checking it.**
- **Letting AI rewrite large areas at once**, producing a diff too big to review properly.
- **Skipping tests because the AI "already tested it".** Run them yourself.

## 🗣️ How to answer in an interview

> "I treat AI-generated code like a pull request from a fast new teammate — useful, but I'm responsible for every line. I read it fully, run it, and add tests with edge cases, because AI code often handles only the happy path or misses our own rules, like whether pages start at 0 or 1. I'm extra careful with auth, permissions, payments, database queries and input validation.
>
> I also check facts: that every function and package actually exists for our versions, and that a suggested package is real and maintained before installing it. I never paste secrets or customer data into AI tools, and I keep big design decisions with the team — AI helps me explore options, I decide. [FILL IN: one bug you caught in AI-generated code, if you remember one]."

## 🔁 Follow-up questions

### When should you not rely on AI tools?

For core logic you don't understand yet, security-sensitive code without careful review, and architecture decisions that depend on your team's constraints.

### How do you review a very large AI-generated change?

Don't accept it in one piece. Ask for smaller steps, review each diff, and run tests between steps.

### Does AI code need the same CI checks?

Yes. Linting, type checks, tests and security scans run on all code, whoever or whatever wrote it.

### What do you do if the AI insists its code is right but the test fails?

Trust the test. Read the code, find the real cause, and fix it — or give the AI the failing test output and ask it to fix that exact case, then review again.

## ✅ Quick check

### 1. In the example, why did the AI version return `['c', 'd']` for page 1?

:::answer
It assumed pages start at 0, so page 1 skipped the first two items. Our API treats page 1 as the first page.
:::

### 2. An AI tool suggests `npm install express-mongo-sanitizer-pro`. What do you do first?

:::answer
Check that the package really exists, is popular and maintained, and is the one you need — on npm and its repository — before installing. It could be a hallucinated or malicious package.
:::

### 3. Which part of AI-written code deserves the most careful review?

- A) Variable names in a test file
- B) An auth middleware that decides who can delete candidates

:::answer
**B.** Auth and permission code is security-critical. A small mistake can let the wrong person delete data.
:::
