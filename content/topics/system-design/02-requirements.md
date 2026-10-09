---
title: Functional vs non-functional requirements
stack: system-design
order: 2
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Functional requirements say WHAT the system does, like "a candidate can apply to a job".
  - Non-functional requirements say HOW WELL it does it, like speed, uptime, scale and security.
  - "A back-of-envelope estimate turns users into numbers: requests per second (RPS) and storage per year."
  - "Average RPS = daily users × requests per user ÷ 86,400. Peak is usually 2–3× the average."
  - The numbers decide the design. 50 RPS needs one server; 50,000 RPS needs many servers, caching and more.
cards:
  - q: What is the difference between functional and non-functional requirements?
    a: Functional = what the system does (features). Non-functional = how well it does it (speed, availability, scale, security).
  - q: Give three examples of non-functional requirements.
    a: Pages load in under 1 second; 99.9% uptime; data of one company is never visible to another.
  - q: How do you estimate average requests per second?
    a: Daily users × requests per user per day ÷ 86,400 (seconds in a day).
  - q: Why multiply the average by 2–3?
    a: Traffic is not flat. Busy hours can be 2–3 times the daily average, and the system must survive the peak.
  - q: What does 99.9% availability mean in downtime?
    a: About 8.8 hours of downtime per year, or about 43 minutes per month.
---

## 💡 What is it?

Before you design anything, you need **requirements**. There are two kinds.

- **Functional requirements** say **what** the system does. "A recruiter can post a job."
- **Non-functional requirements** say **how well** it does it. "The job page loads in under 1 second."

Then you do a quick **back-of-envelope estimate**. That means rough maths on paper to turn "many users" into real numbers.

## 🏠 Real-life example

Think of **ordering a birthday cake**.

- "Chocolate cake, with 'Happy Birthday Asha' written on top" = **functional**. It's *what* you get.
- "Ready by 6 pm, enough for 40 people, no eggs" = **non-functional**. It's *how well* and *how much*.
- The baker thinks: "40 people × 1 slice each = a 2 kg cake." = the **back-of-envelope estimate**.

If the baker only hears "chocolate cake", they might bake a tiny cake for 4 people. Same with software.

## 🧑‍💻 Code example

A tiny calculator for a job portal. Save as `estimate.js` and run `node estimate.js`.

```js
const dailyUsers = 200_000;                       // DAU = people who use the app each day
const requestsPerUser = 50;                       // API calls one user makes in a day
const secondsPerDay = 24 * 60 * 60;               // 86,400 seconds in one day
const peakFactor = 3;                             // busy hours get about 3x the average traffic
const bytesPerApplication = 2_000;                // one job application document ≈ 2 KB
const applicationsPerDay = 30_000;                // new applications saved each day

const avgRps = (dailyUsers * requestsPerUser) / secondsPerDay;           // RPS = requests per second, on average
const peakRps = avgRps * peakFactor;                                     // RPS during the busiest hour
const storagePerYearGB = (bytesPerApplication * applicationsPerDay * 365) / 1e9; // bytes per year → gigabytes

console.log('Average RPS:', Math.round(avgRps));                         // print the average, rounded
console.log('Peak RPS:', Math.round(peakRps));                           // print the peak, rounded
console.log('Storage per year (GB):', storagePerYearGB.toFixed(1));      // print storage with 1 decimal place
```

**Output:**

```text
Average RPS: 116
Peak RPS: 347
Storage per year (GB): 21.9
```

**What this tells you:** about 350 requests per second at peak, and about 22 GB a year. A few app servers and one database can handle this. No need for sharding.

## 🔍 Deeper version

**Common non-functional requirements:**

| Requirement | Question to ask | Example answer |
|---|---|---|
| **Scale** | How many users? Requests per second? | 200k daily users, ~350 RPS peak |
| **Latency** (delay) | How fast must it respond? | p95 under 300 ms |
| **Availability** (uptime) | How much downtime is OK? | 99.9% |
| **Durability** | Can we ever lose data? | Never lose an application |
| **Consistency** | Must every reader see the newest data instantly? | Job counts can be a few seconds old |
| **Security** | Who can see what? | One company never sees another's data |

**"p95 under 300 ms"** means 95 out of 100 requests finish in under 300 ms. Averages hide slow requests, so engineers use percentiles like p95 and p99.

**Availability in "nines":**

| Uptime | Downtime per year |
|---|---|
| 99% | about 3.65 days |
| 99.9% | about 8.8 hours |
| 99.99% | about 53 minutes |

**Handy numbers for estimates:**
- 1 day ≈ 86,400 seconds. People often round it to **100,000** for quick maths.
- 1 million requests a day ≈ **12 requests per second** on average.
- 1 KB × 1 million = 1 GB.

**Read-heavy or write-heavy?** Ask this too. A job board is **read-heavy**: many people view jobs, few post them. Read-heavy systems benefit most from [caching](topic:system-design/caching) and read replicas.

## 🎯 Why do we use it?

- **To build the right thing.** Features you forgot are expensive to add later.
- **To size the system.** The numbers tell you if one server is enough or you need [horizontal scaling](topic:system-design/scaling-vertical-horizontal).
- **To make trade-offs clear.** "Job counts can be 5 seconds old" lets you use a cache safely.
- **In interviews,** it shows you think before you build.

## ⚠️ Common mistakes

- **Only listing features.** Forgetting speed, uptime and security leads to a fragile design.
- **Designing for the average.** The system must survive the **peak**, not the average.
- **Fake precision.** "Exactly 115.74 RPS" wastes time. Round numbers are fine.
- **Not saying assumptions out loud.** If you guess "200k users", say it, so the interviewer can correct you.

## 🗣️ How to answer in an interview

> "I split requirements into two kinds. Functional requirements are the features, like 'a candidate can apply to a job'. Non-functional requirements are the qualities: how many users, how fast, how much downtime is acceptable, and security rules like tenant isolation. Then I do a quick estimate. For example, 200,000 daily users making 50 requests each is about 116 requests per second on average. Peak is about three times that, so roughly 350. That tells me a few stateless servers and one database are enough, and I don't need sharding yet. I always say my assumptions out loud, so the interviewer can correct them."

## 🔁 Follow-up questions

### What is the difference between latency and throughput?

**Latency** is how long **one** request takes (e.g. 200 ms). **Throughput** is how **many** requests the system handles per second (e.g. 500 RPS). A system can have good throughput but bad latency, and the other way round.

### Why use p95 or p99 instead of the average?

The average hides slow requests. If 5% of users wait 5 seconds, the average may still look fine. p95/p99 shows what the slowest users feel.

### How do you estimate storage?

Size of one record × records per day × 365 days × years to keep. Add room for indexes and backups (often ×2–3).

### What if the interviewer says "assume a billion users"?

Then the design changes: many servers, caching everywhere, [database scaling](topic:system-design/database-scaling) with replicas and sharding, and CDNs. Say how the numbers force each choice.

## ✅ Quick check

### 1. Is "the page loads in under 1 second" functional or non-functional?

:::answer
**Non-functional.** It describes how well the system works (speed), not a feature.
:::

### 2. 1 million requests a day is about how many requests per second on average?

- A) 1
- B) 12
- C) 1,000

:::answer
**B) about 12.** 1,000,000 ÷ 86,400 ≈ 11.6.
:::

### 3. Should you size servers for the average or the peak traffic?

:::answer
**The peak.** If you size for the average, the system falls over during the busiest hour.
:::
