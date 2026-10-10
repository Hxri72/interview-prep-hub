---
title: "Agile and Scrum: roles, sprints and ceremonies"
stack: testing
order: 17
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Agile means building software in small pieces, showing it often and changing the plan when you learn something new."
  - "Scrum is the most common Agile method. Work happens in sprints, usually 1–4 weeks long."
  - "Roles: Product Owner (what to build and in which order), Scrum Master (helps the process run well) and developers (build it)."
  - "Ceremonies: sprint planning, daily stand-up, backlog refinement, sprint review and retrospective."
  - "Story points measure effort, not hours. Velocity = points finished per sprint, used to plan the next sprint."
cards:
  - q: What are the three Scrum roles?
    a: Product Owner (decides what to build and in which order), Scrum Master (removes blockers and keeps the process healthy) and the developers (build and test the work).
  - q: Name the Scrum ceremonies.
    a: Sprint planning, daily stand-up, backlog refinement, sprint review (show the work) and retrospective (improve how the team works).
  - q: What is a story point?
    a: A relative measure of effort, complexity and risk — not hours. Teams often use Fibonacci numbers (1, 2, 3, 5, 8, 13).
  - q: What is velocity?
    a: The average number of story points a team finishes per sprint. It helps decide how much to plan in the next sprint.
  - q: Scrum vs Kanban in one line?
    a: Scrum works in fixed-length sprints with planned commitments; Kanban is a continuous flow with limits on work in progress.
---

## 💡 What is it?

**Agile** is a way of building software in **small pieces**. You build a little, show it to people, learn, and then change the plan if needed.

**Scrum** is the most popular way to do Agile. The team works in short, fixed periods called **sprints**. A sprint is usually **2 weeks**.

Each sprint ends with working software that can be shown to users.

## 🏠 Real-life example

Think of a **school annual-day programme** that the class prepares over a month.

The teacher doesn't wait for the last day to see everything. Every week, the class shows one finished part. Maybe the dance one week, then the drama the next. The teacher gives feedback, and the class adjusts.

- The **teacher** = the **Product Owner**. She decides what matters most and in which order.
- The **class leader** = the **Scrum Master**. They make sure practice happens and solve problems, like finding a free room.
- The **students** = the **developers**. They do the work.
- **One week of practice** = one **sprint**.
- **The 5-minute morning check-in** = the **daily stand-up**.
- **The weekly show to the teacher** = the **sprint review**.
- **"What went well, what to improve?" after each show** = the **retrospective**.
- **The full list of items still to prepare** = the **product backlog**.

## 🧑‍💻 Code example

Save this as `sprint.js`. Run it with `node sprint.js`. It plans a sprint using **velocity** and prints a simple **burndown chart**.

```js
const pastSprints = [21, 18, 24];                         // story points the team finished in the last 3 sprints
const velocity = Math.round(pastSprints.reduce((a, b) => a + b, 0) / pastSprints.length); // average = 21
const supportBuffer = 0.2;                                // keep 20% free for bugs and production support
const capacity = Math.floor(velocity * (1 - supportBuffer)); // 21 × 0.8 = 16.8 → plan up to 16 points

const backlog = [                                         // the top of the product backlog, already in priority order
  { story: 'Recruiter can filter candidates by skill', points: 5 }, // 5 = medium-sized story
  { story: 'Send interview reminder email', points: 3 },  // 3 = small story
  { story: 'Export applicants as CSV', points: 8 },       // 8 = big story
  { story: 'Show candidate score on card', points: 2 },   // 2 = very small story
  { story: 'Bulk reject candidates', points: 5 },         // another medium story
];                                                        // end of backlog

const sprint = [];                                        // stories we commit to this sprint
let planned = 0;                                          // points picked so far
for (const item of backlog) {                             // go through the backlog in priority order
  if (planned + item.points <= capacity) {                // does it still fit in our capacity?
    sprint.push(item);                                    // yes → take it into the sprint
    planned += item.points;                               // add its points to the total
  }                                                       // no → leave it for the next sprint
}                                                         // end of loop

console.log(`Velocity (last 3 sprints): ${velocity} points`); // show the average speed
console.log(`Capacity after 20% support buffer: ${capacity} points`); // show what we can plan
sprint.forEach((s) => console.log(`  ✔ ${s.points} pts  ${s.story}`)); // list what we picked
console.log(`Planned: ${planned} / ${capacity} points`);  // show how full the sprint is

const done = [0, 0, 3, 3, 3, 8, 8, 8, 16, 16];            // points DONE by the end of each of the 10 days (a 2-week sprint)
done.forEach((d, i) => {                                  // print one line per day = a text burndown chart
  const left = planned - d;                               // points still not done
  console.log(`Day ${String(i + 1).padStart(2)}: ${'█'.repeat(left)} ${left}`); // one block per point left
});                                                       // end of burndown
```

**Output:**

```text
Velocity (last 3 sprints): 21 points
Capacity after 20% support buffer: 16 points
  ✔ 5 pts  Recruiter can filter candidates by skill
  ✔ 3 pts  Send interview reminder email
  ✔ 8 pts  Export applicants as CSV
Planned: 16 / 16 points
Day  1: ████████████████ 16
Day  2: ████████████████ 16
Day  3: █████████████ 13
Day  4: █████████████ 13
Day  5: █████████████ 13
Day  6: ████████ 8
Day  7: ████████ 8
Day  8: ████████ 8
Day  9:  0
Day 10:  0
```

**What to notice:**
- The team doesn't plan 21 points just because the average is 21. It keeps room for bugs and support work.
- The last two stories didn't fit. 5 + 3 + 8 already used all 16 points, so they wait for the next sprint.
- The chart only drops when a whole story is **done**. Half-finished work counts as zero.

## 🔍 Deeper version

**The Agile Manifesto (2001)** values:
- people and talking **over** processes and tools
- working software **over** heavy documents
- working with the customer **over** fixed contracts
- responding to change **over** following a plan

The items on the right still matter. The ones on the left matter more.

**Scrum in one picture:**

```text
Product backlog ──(sprint planning)──► Sprint backlog ──(1–4 weeks, daily stand-ups)──► Increment
      ▲                                                                                    │
      └──── backlog refinement ◄──── sprint review (show it) ◄──── retrospective (improve) ┘
```

| Ceremony | When | Purpose |
|---|---|---|
| **Sprint planning** | Start of sprint | Pick stories from the top of the backlog. Agree a sprint goal. |
| **Daily stand-up** | Every day, ~15 min | What I did, what I'll do, any blockers. Not a status report to a manager. |
| **Backlog refinement** | Mid-sprint | Clarify upcoming stories, split big ones, estimate them. |
| **Sprint review** | End of sprint | Demo working software to the Product Owner and stakeholders. Get feedback. |
| **Retrospective** | After review | What went well, what didn't, 1–2 actions to improve next sprint. |

**Artifacts:**
- **Product backlog:** every wanted item, in priority order. The Product Owner owns it.
- **Sprint backlog:** the items picked for this sprint, plus the plan to finish them.
- **Increment:** the working, tested software produced in the sprint.

**User stories.** A story describes a need from the user's view:
> *As a recruiter, I want to filter candidates by skill, so that I find good matches faster.*

It comes with **acceptance criteria**, the checks that prove it's done. For example: "Filtering by 'Node.js' shows only candidates with Node.js; an empty result shows a friendly message."

**Estimation.**
- **Story points** compare stories with each other: "this is about twice as big as that one". They include effort, complexity and risk, **not hours**.
- **Planning poker:** everyone shows a card at the same time (1, 2, 3, 5, 8, 13…). If the numbers differ a lot, the high and low voters explain why. Then the team votes again.
- **Fibonacci numbers** are used because big work is less certain, so the gaps grow.
- **Velocity** is the average points finished per sprint. It's for **planning**, not for comparing teams or people.

**Definition of Done (DoD).** A shared checklist every story must meet. For example: code reviewed, tests written and passing, deployed to staging, docs updated. "Done" means done by this list, not "it works on my machine".

**Bugs and production support in a sprint:**
- Keep a **buffer** (like the 20% in the example) for unplanned work.
- Urgent production bugs go in **immediately**, and something of the same size comes out.
- Non-urgent bugs go into the backlog and are prioritised like stories.
- Some teams rotate an "on-call / support" person each sprint.

**Scrum vs Kanban:**

| | Scrum | Kanban |
|---|---|---|
| Rhythm | Fixed sprints (e.g. 2 weeks) | Continuous flow |
| Planning | Commit to a sprint backlog | Pull the next card when there's space |
| Limit | Sprint capacity | **WIP limit** per column (e.g. max 3 "In progress") |
| Roles | PO, Scrum Master, developers | No required roles |
| Good for | Feature work with a roadmap | Support, ops, many small unplanned tasks |

Many teams mix the two ("Scrumban").

## 🎯 Why do we use it?

- **Less risk.** You find problems after 2 weeks, not after 6 months.
- **Faster feedback.** Users see working features early and can change direction.
- **Predictable delivery.** Velocity helps say roughly what will be ready and when.
- **Continuous improvement.** The retrospective makes the team better every sprint.
- **Visible work.** The board and stand-ups show who is blocked, so help comes quickly.

## ⚠️ Common mistakes

- **Treating story points as hours,** or using velocity to compare developers. It breaks honest estimates.
- **Stand-ups that become long status meetings.** Keep them short, and take deep discussions offline.
- **Planning to 100% capacity.** Then any bug or support issue makes the sprint fail.
- **Skipping the retrospective,** or never acting on it. Then the same problems repeat every sprint.
- **No clear Definition of Done.** Stories are "done" but untested or not deployed.

## 🗣️ How to answer in an interview

> "At SkillKeepr I work in an Agile Scrum team. We work in sprints of [FILL IN: sprint length], with a team of [FILL IN: team size and roles]. A sprint starts with planning, where we pick stories from the top of the prioritised backlog and estimate them in story points. Every day we have a short stand-up about progress and blockers. At the end we demo the work in the sprint review, and then we hold a retrospective to agree one or two improvements.
>
> Story points measure effort and risk, not hours, and the team's velocity helps us decide how much to take in. We keep some room for bugs and production support, because unplanned work always comes up. A story is only done when it meets our Definition of Done, for example reviewed, tested and deployed. We track the work in [FILL IN: tool, e.g. Jira]."

For the shorter HR version of this question, see [How your Agile/Scrum team works](topic:hr/agile-scrum).

## 🔁 Follow-up questions

### How do you estimate a story you've never done before?

Compare it with a story the team already finished: "is it bigger or smaller than that one?". If there's a lot of unknown, add a small **spike** first. A spike is a time-boxed task to research, and you estimate the story after it.

### What happens if a story isn't finished by the end of the sprint?

It isn't counted as done, and its points don't count. It goes back to the backlog, where the Product Owner re-prioritises it. Often it's split, and the remaining part is re-estimated.

### What if an urgent production bug comes in mid-sprint?

Fix it now, using the support buffer. If it's large, the team and Product Owner agree which planned story to move out. Then mention it in the retrospective if it keeps happening. See [handling a live incident](topic:testing/production-incidents).

### Where do code reviews fit?

They're part of the Definition of Done. A story isn't done until its pull request is reviewed and merged. See [code reviews](topic:testing/code-reviews).

### What does a Scrum Master actually do?

They run the ceremonies and remove blockers, like waiting on another team or unclear requirements. They also protect the team from mid-sprint scope changes and help it keep improving. They are not the team's manager.

## ✅ Quick check

### 1. Velocity for the last three sprints was 20, 25 and 30 points. What is the average velocity?

:::answer
**25 points.** (20 + 25 + 30) ÷ 3 = 25. A careful team still plans a bit less than this, to leave room for bugs and support.
:::

### 2. Which ceremony is about improving *how the team works*, not the product?

- A) Sprint review
- B) Retrospective
- C) Sprint planning

:::answer
**B) Retrospective.** The review is about the product, where you demo the work. The retrospective is about the process: what to keep, what to change.
:::

### 3. True or false: a 5-point story always takes 5 hours.

:::answer
**False.** Story points are relative effort, complexity and risk, not hours. A 5-point story is "bigger than a 3, smaller than an 8" for this team.
:::
