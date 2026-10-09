---
title: "Gap analysis: monolith vs proposed three-service design"
template: story
stack: resume
order: 11
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "⚠️ You said you can't explain this resume line. Learn it from your team, or remove or reword it before interviews."
  - A gap analysis compares how a system works today with how a planned design says it should work.
  - It lists every difference ("gap") and every contradiction before anyone writes code.
  - Fixing a contradiction on paper is much cheaper than fixing it after a migration.
  - Never claim work you can't explain. Interviewers dig into every resume line.
cards:
  - q: What is an architecture gap analysis?
    a: A careful comparison of the current system with a planned design. It lists what is missing, what is different, and what contradicts.
  - q: Why do a gap analysis before migrating?
    a: Because finding a contradiction on paper is cheap. Finding it after the code is written means rework and bugs.
  - q: What are typical outputs of a gap analysis?
    a: A table of gaps with severity, a list of contradictions to resolve, open questions for the product team, and a migration order.
  - q: What should you do with a resume line you can't explain?
    a: Learn the details from your team, or remove or reword it. A line you can't defend hurts more than it helps.
---

:::warning[Prepare this or remove it]
You told me you can't explain this resume line. Interviewers dig into every line. Either learn what it refers to from your team, or remove or reword the bullet before your next interview.
:::

## 💡 What is it?

Your resume says you "ran two architectural gap analyses of the existing monolith against a proposed three-service design". It says they found contradictions in scoring weights, trust-tier thresholds and voice state-machine phases.

Everything below is **general knowledge**. It teaches you what a gap analysis is. It is **not** a story about what you did.

A **gap analysis** compares two things:
- how the system works **today**, and
- how a **planned design** says it should work.

Every difference is a "gap". Some gaps are **contradictions**: the two sides disagree, and both can't be true.

## 🏠 Real-life example

Think of **moving to a new house**.

Before moving, your family makes a plan: "The sofa goes in the hall. The fridge goes in the kitchen."

Then you measure. The sofa is wider than the hall door. The kitchen has no socket where the fridge should go.

- **The old house** = the current system (the monolith).
- **The plan for the new house** = the proposed design.
- **Measuring before moving** = the gap analysis.
- **"The sofa doesn't fit"** = a contradiction you found on paper, not on moving day.

## 🧩 The problem

**General knowledge:** teams often plan to split a big application (a [monolith](topic:architecture/monolith)) into smaller services. The plan is written by people who may not know every rule hidden in the old code.

If the team starts coding straight away, they copy the plan's mistakes into the new services. Then old and new systems give different answers for the same data.

**Example in a generic hiring product:** the old code scores candidates with one set of weights. The new design document lists different weights. Nobody notices until candidates get different scores in the new service.

## 🛠️ What I built

**Nothing to claim here yet.** [FILL IN: only if you learn the real details from your team — what was compared, what you did, and what was found.]

**How a gap analysis is usually done (general knowledge):**
1. **List the areas** to compare, for example scoring, permissions, call flows.
2. **Read the current code** for each area and write down the real rules.
3. **Read the design document** for the same area.
4. **Make a table:** area, current behaviour, planned behaviour, gap or contradiction, severity.
5. **Raise each contradiction** with the product or design owner and agree on one answer.
6. **Update the design** before any migration work starts.

```text
Area            | Today (code)        | Planned (design)    | Status
----------------|---------------------|---------------------|---------------
Score weights   | skills 60%, exp 40% | skills 50%, exp 50% | CONTRADICTION
Trust tiers     | 3 tiers             | 4 tiers             | GAP
Call phases     | 5 phases            | 4 phases            | CONTRADICTION
```

(This table is an invented example to show the format.)

## 🧗 The hard part

**General knowledge:** the hard part is usually finding the **real** rules. They are often spread across many files, old migrations and special cases. Design documents are written in plain words, and code is exact, so matching them takes care.

## 🏆 The result

**General knowledge:** a good gap analysis gives the team one agreed source of truth. Migration work starts with fewer surprises.

**A safer resume wording, if you can't confirm the details:**
- Remove the bullet completely, **or**
- Use only what you can explain, for example: "Reviewed the existing platform against a proposed service-based design and flagged inconsistencies for the team." Use this only if it is true.

## 🗣️ How to answer in an interview

Don't use a first-person story for this line until you know the facts.

If an interviewer asks about it before you've confirmed the details, be honest:

> "That was a review of our existing system against a planned new design. I'd rather not guess the details I don't remember clearly. In general, the goal was to find contradictions on paper before migration work started, because that is much cheaper than fixing them later."

[FILL IN: replace this with a real 2-minute story once you know what you did. Use: problem → what you compared → one contradiction you found → how it was resolved.]

## 🔁 Follow-up questions

### Why do a gap analysis before migrating instead of just starting?

Fixing a contradiction on paper takes a meeting. Fixing it after migration takes code changes, data fixes and testing. It also gets the team to agree on one source of truth.

### What is the difference between a gap and a contradiction?

A gap is something missing on one side, like a feature the new design forgot. A contradiction is when both sides describe the same thing differently, so one of them must change.

### Who should resolve contradictions?

Usually the product owner or tech lead, because one answer is a business decision. Engineers find and explain the contradiction. They don't pick the business rule alone.

### How would you document the result?

A table of gaps, a decision log for each contradiction, and short records of important decisions (often called ADRs, Architecture Decision Records).

## 📚 Topics to revise

- [Gap analysis and ADRs](topic:architecture/gap-analysis-adrs)
- [Monolith: pros and cons](topic:architecture/monolith)
- [Microservices](topic:architecture/microservices)
- [State machines](topic:architecture/state-machines)
- [The voice state machine](topic:resume/voice-state-machine)
