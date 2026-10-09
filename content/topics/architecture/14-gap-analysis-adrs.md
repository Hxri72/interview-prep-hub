---
title: Gap analysis and architecture decision records (ADRs)
stack: architecture
order: 14
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - A gap analysis compares "what the system does today" with "what the new design says", and lists every difference before anyone writes code.
  - Each difference is a match, a missing piece, a new piece, or a conflict that someone must decide.
  - Fixing a conflict on paper is much cheaper than fixing it after a migration.
  - "An ADR (architecture decision record) is a short note: the context, the decision, the options and the consequences."
  - ADRs keep the "why" of a design, so new teammates and future you don't repeat old debates.
cards:
  - q: What is a gap analysis in software architecture?
    a: A structured comparison between the current system and a target design. It lists matches, missing parts, new parts and conflicts, so they're resolved before migration starts.
  - q: Why do a gap analysis before migrating?
    a: Conflicts and missing rules found on paper are cheap to fix. Found after the migration, they become bugs, data problems and rework.
  - q: What is an ADR?
    a: An Architecture Decision Record — a short document that records one important decision, its context, the options considered and the consequences.
  - q: What sections does an ADR usually have?
    a: Title, status (proposed, accepted, superseded), context, decision, options considered, and consequences.
  - q: Where do ADRs usually live?
    a: In the code repository, often in a docs/adr folder, as numbered Markdown files, so they're reviewed in pull requests like code.
---

:::warning[About the resume line]
Your resume says you ran gap analyses, but you told me you can't explain that line. This page teaches the **general idea** so you can learn it. Before an interview, ask your team what it refers to, or reword or remove the bullet. See [the gap analysis resume page](topic:resume/gap-analysis).
:::

## 💡 What is it?

A **gap analysis** compares two things:
1. **What the system does today** (the current state).
2. **What the new design says** (the target state).

You go through them rule by rule and feature by feature. Every difference is a **gap**. Some gaps are missing pieces. Some are **conflicts**, where the two disagree and someone must decide.

An **ADR (architecture decision record)** is a short note that records **one important decision and why** it was made.

## 🏠 Real-life example

Think of **moving to a new house**.

Before you move, you walk through the old house with the new house's floor plan:
- "The fridge fits the new kitchen." → a **match**.
- "The new plan has **no space for the washing machine**." → a **missing** piece.
- "The new house has a **balcony garden**." → a **new** feature.
- "Mum's list says the sofa goes in the hall, Dad's says the bedroom." → a **conflict**. Decide now, not on moving day.

Then you write down **why** you chose the hall for the sofa. Next year, nobody argues about it again. That note is an **ADR**.

Map it:
- **Old house** = the current system.
- **Floor plan** = the target design.
- **Your walk-through list** = the gap analysis.
- **The note about the sofa** = an ADR.

## 🧑‍💻 Code example

A tiny script that compares current rules with a design document. Save as `gap.js` and run `node gap.js`.

```js
const current = {                                         // rules in the system running today
  reminderHoursBefore: 24,                                // send interview reminders 24 hours before
  maxInterviewRounds: 3,                                  // at most 3 rounds
  autoRejectDays: 30,                                     // reject old applications after 30 days
};                                                        // end of current
const proposed = {                                        // rules in the new design document
  reminderHoursBefore: 12,                                // the design says 12 hours
  maxInterviewRounds: 3,                                  // same as today
  autoRejectDays: undefined,                              // the design forgot this rule
  aiScreening: true,                                      // a brand-new feature
};                                                        // end of proposed

const keys = new Set([...Object.keys(current), ...Object.keys(proposed)]); // every rule from both sides
for (const key of keys) {                                 // check each rule
  const a = current[key], b = proposed[key];              // today's value and the design's value
  if (a === b) console.log(`OK        ${key}: ${a}`);     // same on both sides
  else if (b === undefined) console.log(`MISSING   ${key}: today ${a}, design says nothing`); // a gap
  else if (a === undefined) console.log(`NEW       ${key}: ${b}`); // only in the new design
  else console.log(`CONFLICT  ${key}: today ${a}, design ${b}`); // the two disagree → decide before coding
}                                                         // end of the loop
```

**Output:**

```text
CONFLICT  reminderHoursBefore: today 24, design 12
OK        maxInterviewRounds: 3
MISSING   autoRejectDays: today 30, design says nothing
NEW       aiScreening: true
```

Real gap analyses are usually a table in a document, not code. But the idea is the same: **list every difference, then decide each one**.

## 🔍 Deeper version

**How a gap analysis is usually done:**
1. **Define the scope.** Which modules, rules and data are being compared?
2. **Describe the current state.** Read the code, the database and the config. The code is the truth, not old documents.
3. **Describe the target state.** The design doc, diagrams and service boundaries.
4. **Compare item by item** in a table: area, current behaviour, target behaviour, gap type, impact, owner, decision.
5. **Classify** each gap: match, missing, new, conflict, or "needs a decision".
6. **Resolve conflicts** with the people who own the rules (product, business, engineering).
7. **Record big decisions** as ADRs, and turn the rest into tasks.

**Typical things that conflict between a running system and a new design:**
- business rules and numbers (thresholds, weights, limits, time windows),
- status lists and lifecycles (a phase exists in one, not the other),
- data fields and their meaning,
- who owns which data after the split into services.

**A gap table:**

| Area | Current | Target | Type | Decision |
|---|---|---|---|---|
| Reminder timing | 24 h | 12 h | conflict | product to decide |
| Auto-reject | 30 days | not defined | missing | add to design |
| AI screening | none | yes | new | plan as phase 2 |

**ADR template** (a short Markdown file in the repo):

```markdown
# ADR 007: Use a database per tenant

Status: Accepted (2026-03-01)

## Context
Customers need strong data isolation and easy per-customer backup.

## Decision
Each tenant gets its own MongoDB database on shared servers.

## Options considered
1. Shared collections with tenantId — cheaper, weaker isolation.
2. Database per tenant — chosen.
3. Separate stack per tenant — too costly to run.

## Consequences
+ Strong isolation, simple deletion per customer.
- More connections, migrations run per tenant.
```

**ADR habits:**
- One decision per ADR. Keep it to about one page.
- Number them, and never delete one. If a decision changes, write a new ADR that **supersedes** the old one.
- Review them in pull requests, like code.

## 🎯 Why do we use it?

- **Cheaper fixes.** A conflict found in a meeting costs an hour. Found after migration, it costs days of bug fixing and data repair.
- **One source of truth.** Everyone agrees on the rules before building.
- **Memory for the team.** ADRs answer "why is it built like this?" long after the people who decided have moved on.
- **Better interviews and reviews.** You can explain trade-offs with evidence, not opinions.

## ⚠️ Common mistakes

- **Comparing against old documents instead of the real code.** The code is what users actually get.
- **Listing gaps but not deciding them.** A gap list with no owner and no decision changes nothing.
- **Very long ADRs.** Nobody reads a 20-page ADR. Keep context, decision, options and consequences short.
- **Deleting or rewriting old ADRs.** You lose the history. Supersede them instead.

## 🗣️ How to answer in an interview

Use this only as general knowledge until you can tell a true story about it.

> "A gap analysis compares the current system with a target design before any migration code is written. I'd go through the real code and data, list each rule and feature side by side, and mark it as a match, missing, new, or a conflict. Conflicts, like two different thresholds for the same rule, go to the people who own that rule for a decision. It's much cheaper to fix a contradiction on paper than after the migration.
>
> For the important decisions, I'd write ADRs. Those are short records of the context, the decision, the options we considered and the consequences, kept in the repo. They stop the team re-arguing old decisions and explain the 'why' to new people."

[FILL IN: only if you learn the real story from your team — what was compared, what you found, and what changed.]

## 🔁 Follow-up questions

### How is a gap analysis different from a code review?

A code review checks a small change for quality and bugs. A gap analysis compares two whole **designs** or **systems** for differences in behaviour and rules, usually before a large migration.

### Who should be involved?

Engineers who know the current code, the people writing the new design, and the business or product owners who decide the rules. Conflicts in business rules shouldn't be decided by engineers alone.

### When do you write an ADR?

When a decision is hard to reverse or affects many people. For example: choosing a database, splitting a service, picking a tenancy model, or choosing a queue. Small code choices don't need one.

## ✅ Quick check

### 1. In the code example, why is `reminderHoursBefore` marked CONFLICT and not MISSING?

:::answer
Both sides have a value, but they **disagree** (24 vs 12). MISSING means the design doesn't define the rule at all.
:::

### 2. A decision recorded in ADR 004 changes a year later. What do you do?

- A) Edit ADR 004 to say the new decision
- B) Delete ADR 004
- C) Write a new ADR that supersedes ADR 004, and mark 004 as superseded

:::answer
**C.** Keep the history. Anyone can then see what was decided, when, and why it changed.
:::
