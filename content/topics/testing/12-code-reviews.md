---
title: "Code reviews: what to look for"
stack: testing
order: 12
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "A code review is a teammate reading your change before it is merged. Goal: catch bugs, share knowledge, keep the code healthy."
  - "Check in this order: correctness and edge cases → security → tests → readability → consistency with the codebase."
  - Leave kind, specific comments that explain why, and mark small things as "nit" (optional).
  - Keep pull requests small. A 50-line change gets a real review; a 2,000-line change gets a quick "looks good".
  - Review AI-generated code like any other code — and check that the libraries and functions it uses really exist.
cards:
  - q: What do you look for in a code review?
    a: Correctness and edge cases first, then security, then tests, then readability and naming, then consistency with existing patterns.
  - q: How should a review comment be written?
    a: Specific, kind and with a reason — "This can crash when the list is empty, because…" — and label optional points as nit.
  - q: Why keep pull requests small?
    a: Small changes are reviewed carefully and merged quickly. Big ones get skimmed, so bugs slip through.
  - q: How do you review AI-generated code?
    a: Exactly like human code, plus extra checks that the APIs and packages exist, edge cases are handled, nothing secret is exposed, and there are tests.
  - q: What should automated tools check instead of reviewers?
    a: Formatting, lint rules, type errors and test runs. Humans should spend their time on logic and design.
---

## 💡 What is it?

A **code review** is when a teammate reads your code change before it joins the main code. On GitHub this happens in a **pull request** (PR).

The reviewer looks for bugs, security problems, missing tests and confusing code. They leave comments, and you fix them before merging.

Reviews also spread knowledge, so more than one person understands each part of the code.

## 🏠 Real-life example

Think of a **school magazine**.

A student writes an article. Before it is printed, an **editor** reads it.

- **The article** = your code change.
- **Asking the editor to read it** = opening a pull request.
- **The editor's notes in the margin** = review comments.
- **"Wrong date in paragraph 2"** = a real bug.
- **"Maybe a shorter title?"** = a "nit", a small optional suggestion.
- **The spell-checker that ran first** = linters and tests in CI, so the editor can focus on meaning.
- **Printing the magazine** = merging into the main branch.

## 🧑‍💻 Code example

This is a small search helper from a pull request. Save it as `review.js` and run `node review.js`. The `REVIEW:` comments are what a reviewer would write.

```js
const candidates = [                                         // pretend data from the database
  { name: 'Asha Nair', email: 'asha@x.com' },                // candidate 1
  { name: 'Rahul (Ravi) Menon', email: 'rahul@x.com' },      // candidate 2 — name has brackets
];                                                           // end of the list

// BEFORE review (what the pull request first had)
function searchBefore(q, limit) {                            // q = search text, limit = how many to return
  const re = new RegExp(q, 'i');                             // REVIEW: user text used as a regex → "(" crashes it
  return candidates.filter((c) => re.test(c.name)).slice(0, limit); // REVIEW: no max limit → limit=100000 allowed
}                                                            // end of searchBefore

// AFTER review (the fixed version)
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // put "\" before special regex characters
function searchAfter(q, limit = 20) {                        // default 20 results
  const safeLimit = Math.min(Number(limit) || 20, 100);      // never return more than 100
  const re = new RegExp(escapeRegex(q), 'i');                // "(" is now a normal character
  return candidates.filter((c) => re.test(c.name)).slice(0, safeLimit); // same logic, now safe
}                                                            // end of searchAfter

try { searchBefore('(Ravi', 10); } catch (e) { console.log('before:', e.message); } // the bug the reviewer found
console.log('after:', searchAfter('(Ravi', 100000));         // works, and the limit is capped
```

**Output (real run):**

```text
before: Invalid regular expression: /(Ravi/i: Unterminated group
after: [ { name: 'Rahul (Ravi) Menon', email: 'rahul@x.com' } ]
```

The reviewer caught two real problems: user text used directly as a [regex](glossary:regex), and no upper limit on results. Neither would show up in a quick "happy path" test.

## 🔍 Deeper version

**A review checklist, in priority order:**

| # | Area | Questions to ask |
|---|---|---|
| 1 | Correctness | Does it do what the ticket says? What about empty lists, `null`, 0, duplicates, very large input? |
| 2 | Security | Is user input validated? Any injection (SQL, NoSQL, regex)? Are permissions checked on the server? Any secrets or personal data logged? |
| 3 | Data and performance | Any query inside a loop (N+1)? Is there an index for the new query? Is there a limit/pagination? |
| 4 | Errors | Are async errors caught? Do failures return the right status code? Is anything swallowed silently? |
| 5 | Tests | Is there a test for the new behaviour and the edge case? Would the test fail if the code were wrong? |
| 6 | Readability | Clear names? Small functions? Comments that explain *why*, not *what*? |
| 7 | Consistency | Does it follow the existing patterns (folder structure, error format, response shape)? |

**Good comments:**
- **Be specific and give the reason:** "This throws when `items` is empty, because `items[0].id` is undefined."
- **Ask, don't order:** "What happens if two requests run this at the same time?"
- **Label how important it is:** `blocking:` for must-fix, `nit:` for optional, `question:` for learning.
- **Praise good things too.** It builds trust.

**Being reviewed well:**
- Keep the PR **small** and focused on one change.
- Write a clear description: what, why, how to test, screenshots for UI.
- Review your own diff first. You'll catch half the issues yourself.
- Don't take comments personally. The review is about the code, not you.

**Reviewing AI-generated code.** AI tools like Claude Code and Copilot write code fast, but the reviewer is still responsible. Extra checks:
- Do the **functions and packages really exist**? AI can invent APIs.
- Does it handle the **edge cases**, or only the happy path?
- Is anything **secret or personal** sent to logs or third parties?
- Does it match **our patterns**, or a generic tutorial style?
- Are there **real tests**, and would they fail if the code were wrong?

**Let tools do the boring part.** Formatting (Prettier), lint rules (ESLint), types (`tsc`) and tests should run in CI *before* a human looks. Code-quality scanners such as SonarQube can flag duplicated code and security hotspots.

## 🎯 Why do we use it?

- **Catch bugs early.** A bug found in review is far cheaper than one found by a customer.
- **Share knowledge.** At least two people understand every change.
- **Keep the codebase consistent.** New code follows the same patterns.
- **Teach and learn.** Juniors learn from seniors' comments, and seniors learn new tricks too.

## ⚠️ Common mistakes

- **Only commenting on style.** Tools should catch style. Humans should look at logic and security.
- **Huge pull requests.** Nobody can review 2,000 lines carefully.
- **Vague or harsh comments.** "This is wrong" doesn't help. Say what and why.
- **Approving without running or reading the tests.** Check that tests actually test the new behaviour.

## 🗣️ How to answer in an interview

> "In a review I go in priority order. First correctness: does it meet the requirement, and what about edge cases like empty lists, nulls or duplicates? Then security: input validation, injection, permission checks on the server, and making sure no secrets or personal data get logged. Then performance, like N+1 queries or missing pagination. Then tests: is there a test that would actually fail if the code were wrong? Readability and consistency with our patterns come after that.
>
> I write comments that are specific and give a reason, and I mark optional ones as nits. I like small PRs, because they get real reviews. And I review AI-generated code exactly the same way, plus checking that the APIs it uses really exist."

The resume says you took part in code reviews at SkillKeepr. [FILL IN: one real thing you caught in a review, or one useful comment you received.]

## 🔁 Follow-up questions

### How do you handle disagreement in a review?

Discuss the reason, not the person. If it's a matter of taste, follow the existing team pattern. If it's still unclear, a quick call or a third opinion settles it faster than a long comment thread.

### How fast should reviews happen?

Ideally within a working day. Slow reviews block teammates and lead to bigger, riskier PRs.

### What makes a good PR description?

What changed, why, how to test it, any risks, and screenshots for UI changes. Link the ticket.

### Should every PR need approval?

Most teams require at least one approval on the main branch, enforced by branch protection. Very small fixes may get a faster process, but still a review.

## ✅ Quick check

### 1. In the example, why does `searchBefore('(Ravi', 10)` crash?

:::answer
The user text is used directly as a regular expression. `(` opens a group that is never closed, so `new RegExp` throws "Unterminated group". Escaping special characters fixes it.
:::

### 2. Which should a human reviewer spend the most time on?

- A) Single vs double quotes
- B) Missing edge cases and security checks
- C) Indentation

:::answer
**B.** Formatting is handled by tools like Prettier. Humans add the most value on logic, edge cases and security.
:::

### 3. What does a "nit:" comment mean?

:::answer
A small, optional suggestion — nice to have, but it shouldn't block the merge.
:::
