---
title: How to approach a system design question
stack: system-design
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Always follow the same 6 steps: requirements → API → data model → architecture → bottlenecks → trade-offs."
  - Spend the first 5 minutes asking questions. Never start drawing before you know what to build.
  - Start simple (one server, one database), then grow the design only where the numbers say you must.
  - Talk out loud the whole time. The interviewer marks your thinking, not a perfect diagram.
  - Every choice has a cost. Say what you chose, what you gave up, and why.
cards:
  - q: What are the 6 steps for answering a system design question?
    a: Requirements, API, data model, architecture, bottlenecks, trade-offs.
  - q: What should you do in the first 5 minutes?
    a: Ask questions. Who uses it, what are the main features, how many users, how fast must it be, and what is out of scope.
  - q: Should you start with microservices, caches and queues?
    a: No. Start with the simplest design that works, then add parts only when a number or requirement needs them.
  - q: What does the interviewer mainly judge?
    a: How you think — clear questions, a sensible simple design, finding bottlenecks, and explaining trade-offs.
  - q: How long should each step take in a 45-minute round?
    a: "About: requirements 5, API 5, data model 8, architecture 12, bottlenecks 8, trade-offs 7 minutes."
---

## 💡 What is it?

A **system design question** asks you to plan a whole app, like "design a URL shortener" or "design a notification system".

There is no single right answer. The interviewer wants to see **how you think**.

The safe way is to use the **same 6 steps every time**. Then you never freeze, and you never forget an important part.

## 🏠 Real-life example

Think of **planning a school annual day**.

You don't start by buying chairs. First you ask: how many guests? Which day? What events? Then you plan the stage, the seating and the food. Then you think, "What if it rains?" Last, you explain your choices to the principal.

- **Asking how many guests and which events** = requirements.
- **The programme list (what happens, in which order)** = the API.
- **The guest list and seat chart** = the data model.
- **Stage, chairs, sound system, food counter** = the architecture.
- **"What if 500 extra people come? What if it rains?"** = bottlenecks.
- **"I chose a hall, not the ground, because of rain, but it holds fewer people"** = trade-offs.

## 🧑‍💻 Code example

This tiny script prints a 45-minute plan. Save it as `plan.js` and run `node plan.js`. Read the plan before every mock interview.

```js
const steps = [                                              // the 6 steps of a system design answer, in order
  { step: 'Requirements', minutes: 5 },                      // what must it do? how many users? how fast?
  { step: 'API', minutes: 5 },                               // the endpoints the clients will call
  { step: 'Data model', minutes: 8 },                        // the tables or collections and their fields
  { step: 'Architecture', minutes: 12 },                     // the boxes and arrows: client, server, DB, cache, queue
  { step: 'Bottlenecks', minutes: 8 },                       // what breaks first when traffic grows?
  { step: 'Trade-offs', minutes: 7 },                        // what you chose, what you gave up, and why
];                                                           // end of the list

let clock = 0;                                               // minutes used so far; starts at 0
for (const s of steps) {                                     // go through each step one by one
  const start = clock;                                       // this step starts where the last one ended
  clock += s.minutes;                                        // add this step's minutes to the clock
  console.log(`${String(start).padStart(2)}–${String(clock).padStart(2)} min  ${s.step}`); // print "0– 5 min  Requirements"
}                                                            // end of the loop
console.log(`Total: ${clock} minutes`);                      // check that the plan fits in 45 minutes
```

**Output:**

```text
 0– 5 min  Requirements
 5–10 min  API
10–18 min  Data model
18–30 min  Architecture
30–38 min  Bottlenecks
38–45 min  Trade-offs
Total: 45 minutes
```

## 🔍 Deeper version

**Step 1 — Requirements (5 min).** Split them into two kinds. See [functional vs non-functional requirements](topic:system-design/requirements).
- **Functional:** what it does. "A recruiter posts a job. A candidate applies."
- **Non-functional:** how well it does it. "10,000 users a day. Pages load in under 1 second. No data lost."
- Do a quick **back-of-envelope estimate**: requests per second and storage per year.
- Say what is **out of scope**: "I'll skip payments for now."

**Step 2 — API (5 min).** List 3–5 main endpoints, like `POST /jobs` and `GET /jobs/:id/applications`. See [designing an API](topic:system-design/api-design).

**Step 3 — Data model (8 min).** Name the main tables or collections, their key fields and the [indexes](glossary:index) for the main queries. See [schema design](topic:system-design/schema-design).

**Step 4 — Architecture (12 min).** Draw the **simplest version first**:

```text
Browser ──► Load balancer ──► App servers ──► Database
```

Then add parts **only when needed**, and say why:
- a [cache](topic:system-design/caching) for hot reads
- a [queue](topic:system-design/queues-background-jobs) for slow work, like emails
- a [CDN](topic:system-design/cdn) for images and static files

**Step 5 — Bottlenecks (8 min).** Ask "what breaks first if traffic grows 10×?" Usual answers: the database, one slow external API, or a single server. Fix ideas: indexes, caching, read replicas, more stateless servers, queues.

**Step 6 — Trade-offs (7 min).** Every choice costs something:

| Choice | You gain | You give up |
|---|---|---|
| Cache | Fast reads | Data can be a little old |
| Queue | Fast responses, retries | More moving parts, delayed work |
| Microservices | Independent deploys | More complexity, network calls |
| SQL | Strong relations, transactions | Less flexible schema |

**What interviewers want from a 3-year developer:** a clear, working, simple design. They don't expect Google-scale answers. They do expect you to know *why* you would add a cache or a queue.

## 🎯 Why do we use it?

- **It stops panic.** You always know the next step.
- **It covers everything.** You won't forget the data model or failure cases.
- **It shows senior thinking.** Asking questions first and naming trade-offs is what real engineers do.
- **It controls time.** You won't spend 30 minutes on one box.

## ⚠️ Common mistakes

- **Drawing before asking questions.** You may design the wrong thing.
- **Starting too big.** Microservices, Kafka and five caches for 1,000 users is a red flag.
- **Going silent.** The interviewer can't give marks for thoughts they can't hear.
- **Never naming a trade-off.** "It's the best" is not an answer. Say what it costs.

## 🗣️ How to answer in an interview

> "I use the same six steps for every design question. First, I ask about requirements: the main features, how many users, and how fast it must be. I also do a quick estimate of requests per second and storage. Second, I list the main API endpoints. Third, I design the data model and the indexes for the main queries. Fourth, I draw the simplest architecture that works, usually a load balancer, stateless app servers and one database. Then I add a cache, a queue or a CDN only where the numbers need it. Fifth, I look for bottlenecks: what breaks first at ten times the traffic. Last, I explain my trade-offs, like a cache giving speed but slightly old data. I talk through every step, so the interviewer can follow and guide me."

[FILL IN: if you designed a real feature this way at SkillKeepr, add one line, e.g. the AI voice agent's call flow.]

## 🔁 Follow-up questions

### What if the interviewer gives you no numbers?

Ask for them. If they say "you decide", pick reasonable ones and say them out loud: "Let's assume 100,000 users a day." Then design for that.

### How do you know when to add a cache?

When the same data is read again and again, and reading it from the database is slow or costly. Example: a job's details shown to thousands of candidates.

### What if you don't know a technology the interviewer mentions?

Be honest. Explain the problem it solves and how you would solve it with tools you know. Then say you would read its docs.

### How deep should you go?

Go wide first: a full simple design. Then go deep where the interviewer points, like the database or the API.

## ✅ Quick check

### 1. What is the very first thing you should do?

- A) Draw the load balancer
- B) Ask about requirements
- C) Pick a database

:::answer
**B.** Ask questions first. You can't design well until you know what to build and for how many users.
:::

### 2. True or false: a good answer starts with microservices and many caches.

:::answer
**False.** Start simple. Add parts only when a requirement or a number needs them, and explain why.
:::

### 3. Name the 6 steps in order.

:::answer
Requirements → API → data model → architecture → bottlenecks → trade-offs.
:::
