---
template: story
title: "ATS integration via unified.to (Workable, Greenhouse, Lever, Zoho)"
stack: resume
order: 6
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "unified.to is one API that connects to many ATS tools — Workable, Greenhouse, Lever, Zoho and more — so we write one integration instead of many."
  - "I built the backend; another developer built the frontend. Recruiters connect (authorise) their ATS account first."
  - "Two ways to sync: a Sync button on a job (manual), and a configurable time-based sync (scheduled polling). It was not webhook-driven."
  - "Duplicates are checked by email. An existing candidate is reused, not updated, and only linked to the job. If that link already exists, we skip it."
  - It was tested with Workable, Zoho, Greenhouse and Lever, and released as a trial feature; real customers had not used it yet.
cards:
  - q: What is unified.to and why use it?
    a: A unified API — one API in front of many ATS tools. You build one integration and support Workable, Greenhouse, Lever, Zoho and others, with one data format.
  - q: What did you build?
    a: The backend. Pulling jobs and their candidates from the recruiter's ATS through unified.to, plus interview-status sync with my team. Another developer built the frontend.
  - q: Manual sync vs scheduled sync vs event-driven sync?
    a: Manual = the recruiter clicks Sync. Scheduled = our system checks every few hours (polling). Event-driven = the ATS tells us when something changes, often with a webhook. We had manual and scheduled.
  - q: How do you avoid duplicate candidates?
    a: We match by email. If the candidate exists, we reuse that record and just link it to the job. If the link already exists, we skip it.
  - q: What if the candidate's phone number changed in the ATS?
    a: In our flow we did not update existing candidates. We reused the record as it was. It stops duplicates, but it doesn't refresh old details.
---

## 💡 What is it?

Many companies already use an **ATS** (Applicant Tracking System). It's software where they keep their jobs and candidates. Examples are **Workable**, **Greenhouse**, **Lever** and **Zoho**.

These companies don't want to type everything into SkillKeepr again. So we connect SkillKeepr to their ATS.

Each ATS has its **own [API](glossary:api)**. Building one connection per ATS is a lot of work. So we used **unified.to**. It is **one API** that talks to many ATS tools for us.

## 🏠 Real-life example

Think of a **universal travel adapter**.

- Every country has a **different plug socket** = every ATS has a different API.
- Carrying ten adapters is painful = building ten integrations.
- A **universal adapter** fits all sockets = **unified.to**.
- Your laptop only needs **one plug** = SkillKeepr only talks to unified.to.

Now think of a **class register**. A new student joins. The teacher first checks if the name is already in the register. If yes, she doesn't write it again. She only adds a tick for the new class.

- **The register** = SkillKeepr's candidate list.
- **The student's name** = the candidate's email.
- **The tick for a class** = the link between the candidate and a job.

## 🧩 The problem

Recruiters already have their jobs and candidates in an ATS. Without an integration:
- they copy data by hand,
- data gets out of date,
- and candidates appear twice.

Building a separate integration for Workable, Greenhouse, Lever, Zoho and others would take a long time. Each one has different data shapes and login methods.

## 🛠️ What I built

**My part:** the **backend** of the integration. Another developer built the frontend.

**Step 1: connect.** The recruiter authorises (gives permission to) their ATS account. After that, our backend can call the unified.to API for that company.

**Step 2: pull jobs and candidates.**
1. **Pull jobs.** The jobs already existed in the company's ATS. We fetch them into SkillKeepr.
2. **Pull candidates.** We fetch the candidates for each job.
3. **Interview status sync.** With my team, we keep interview status in sync with the ATS.

**Two ways to start a sync:**

| Way | Who starts it | How it works |
|---|---|---|
| **Manual sync** | The recruiter | Clicks the **Sync** button on a job. |
| **Scheduled sync** | Our system | Checks for new candidates every few hours. The interval is configurable. [FILL IN: the real intervals, e.g. 2, 4 or 12 hours — check the config] |
| Event-driven (not used) | The ATS | The ATS sends us a [webhook](topic:rest-auth/webhooks) when something changes. We did **not** build this. |

**What happens to each candidate:**

```text
Fetch candidates for a job from the ATS (through unified.to)
   │
For each candidate:
   email already in SkillKeepr?
        │                    │
        no                   yes
        ▼                    ▼
   fetch full details    reuse the existing record
   create the candidate  (don't fetch or update details)
        │                    │
        └────────┬───────────┘
                 ▼
   already linked to this job?  ──yes──►  skip
                 │
                 no
                 ▼
   create the link (candidate ↔ job)
```

- **Storing a candidate** and **linking a candidate to a job** are two different things. One candidate can be linked to many jobs.
- We did **not update** an existing candidate's details. So the flow stops duplicates, but old details stay as they were.

**Testing:** we tested it with **Workable, Zoho, Greenhouse and Lever**. It went out as a **trial feature**. Real customers had not used it yet.

## 🧗 The hard part

**Different ATS, different data.** Even with unified.to, each ATS fills fields differently. Some fields can be missing or named in a different way.

**Duplicates.** The same person can apply to many jobs, or be synced twice. Matching by email stops duplicate candidates. Checking the candidate–job link stops duplicate links.

**Many candidates at once.** A big job can have many candidates. Fetching full details for everyone is slow, so we skip people we already have.

:::note[General knowledge, not a claim]
Checking "does this link exist?" in code can fail if two syncs run at the same time. Both see "no link" and both create one. A **compound unique index** on candidate + job lets the database refuse the second copy. Only say your project had this index if you check the code first.
:::

[FILL IN: the hardest bug or case you hit — e.g. missing emails, a field that differed between ATS tools.]

## 🏆 The result

- One integration covers Workable, Greenhouse, Lever, Zoho and others.
- Recruiters bring in jobs and candidates with one click, or automatically on a schedule.
- Duplicate candidates and duplicate job links are avoided.
- It is tested and released as a trial; it's ready for real customers.

## 🗣️ How to answer in an interview

> "Many of our customers already keep jobs and candidates in an ATS, like Workable, Greenhouse or Lever. Building a separate integration for each ATS is a lot of work. So we used unified.to, which is one API in front of many ATS tools.
>
> I built the backend, and another developer built the frontend. The recruiter first authorises their ATS account. Then our backend pulls their jobs and the candidates for each job. Sync can start in two ways: a Sync button on the job, or a scheduled sync that runs every few hours. It's polling, not webhook-driven.
>
> To avoid duplicates, we match candidates by email. If the candidate already exists, we reuse that record and just link it to the job. If they're already linked to that job, we skip it. One honest limit: we didn't update existing candidates, so a new phone number in the ATS wouldn't come across.
>
> We tested it with Workable, Zoho, Greenhouse and Lever, and it went out as a trial feature. It hasn't had real customer usage yet."

## 🔁 Follow-up questions

### Why a unified API instead of calling each ATS directly?

One integration instead of many. One data format. One login flow. The downside is that you depend on another company, and very ATS-specific features may not be available.

### What is the difference between manual sync, scheduled polling and event-driven sync?

- **Manual:** starts when a user asks, like the Sync button.
- **Scheduled polling:** our system checks at fixed times, like every few hours.
- **Event-driven:** the other system tells us when an event happens, like "candidate created", often with a webhook.

We had manual and scheduled sync. So don't call it webhook-driven.

### What if an existing candidate has a new phone number or resume in the ATS?

In our flow we did **not** update existing candidates. We reused the record and linked it to the job. So it prevented duplicates, but it didn't refresh old details. If asked how to improve it: compare an "updated at" time from the ATS and update only the changed fields.

### How did you avoid linking the same candidate to the same job twice?

Before creating the link, we checked if the candidate was already linked to that job. If yes, we skipped it. In general, a compound unique index on candidate + job makes this safe even when two syncs run together. [FILL IN: check if your code has that index before you say so]

### What if a candidate has no email?

[FILL IN: what your code does.] A common approach is to fall back to another unique field, like the candidate's ID in the ATS, or to flag the record for review.

### It wasn't used by real customers — so what did you learn?

Be positive and honest: "It was a trial launch. We tested it end to end with four ATS tools. I learned how unified APIs work, how to handle messy outside data, and how to avoid duplicates."

## 📚 Topics to revise

- [What Express is (building APIs)](topic:express/what-is-express)
- [Unique indexes](topic:mongodb/special-indexes)
- [Webhooks](topic:rest-auth/webhooks)
- [Event-driven architecture](topic:architecture/event-driven)
- [Multi-tenant platform](topic:resume/multi-tenant-platform)
