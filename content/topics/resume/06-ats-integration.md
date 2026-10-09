---
template: story
title: "ATS integration via unified.to (Greenhouse, Lever, Zoho)"
stack: resume
order: 6
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "unified.to is one API that connects to many ATS tools — Greenhouse, Lever, Zoho and more — so we write one integration instead of many."
  - "My team built three things on it: pulling jobs, pulling candidates, and syncing interview status."
  - A Sync button on a job fetches new candidates from the company's ATS.
  - We check duplicates by email — if the candidate already exists, we skip fetching their full details again.
  - It was tested with Zoho, Greenhouse and Lever, and released as a trial feature; real customers had not used it yet.
cards:
  - q: What is unified.to and why use it?
    a: A unified API — one API in front of many ATS tools. You build one integration and support Greenhouse, Lever, Zoho and others, with one data format.
  - q: What did you build with it?
    a: With my team — pulling jobs that already exist in the customer's ATS, pulling candidates for a job, and syncing interview status.
  - q: How does a recruiter get new candidates?
    a: They click a Sync button on the job. We fetch candidates from the ATS through unified.to and add the new ones.
  - q: How do you avoid duplicate candidates?
    a: We match by email. If a candidate with that email already exists, we don't fetch and save their full details again.
  - q: Is it used by real customers?
    a: Not yet. It was tested with Zoho, Greenhouse and Lever and released as a trial feature. I say that honestly and focus on how it was designed and tested.
---

## 💡 What is it?

Many companies already use an **ATS** (Applicant Tracking System). It's software where they keep their jobs and candidates. Examples are **Greenhouse**, **Lever** and **Zoho**.

These companies don't want to type everything into SkillKeepr again. So we connect SkillKeepr to their ATS.

Each ATS has its **own [API](glossary:api)**. Building one connection per ATS is a lot of work. So we used **unified.to**. It is **one API** that talks to many ATS tools for us.

## 🏠 Real-life example

Think of a **universal travel adapter**.

- Every country has a **different plug socket** = every ATS has a different API.
- Carrying ten adapters is painful = building ten integrations.
- A **universal adapter** fits all sockets = **unified.to**.
- Your laptop only needs **one plug** = SkillKeepr only talks to unified.to.

## 🧩 The problem

Recruiters already have their jobs and candidates in an ATS. Without an integration:
- they copy data by hand,
- data gets out of date,
- and candidates appear twice.

Building a separate integration for Greenhouse, Lever, Zoho and others would take a long time. Each one has different data shapes and login methods.

## 🛠️ What I built

**With my team, on top of unified.to:**

1. **Pull jobs.** The companies already had jobs in Greenhouse and Lever. We fetch those jobs into SkillKeepr.
2. **Pull candidates.** Each job has a **Sync button**. Clicking it fetches the new candidates for that job from the ATS.
3. **Interview status sync.** When the interview status changes, we keep it in sync with the ATS.

**Duplicate check by email:**

```text
Recruiter clicks "Sync" on a job
   │
Fetch candidates for that job from the ATS (through unified.to)
   │
For each candidate:
   email already in SkillKeepr?  ──yes──►  skip — don't fetch full details again
            │
            no
            ▼
   fetch full details  →  create the candidate in SkillKeepr
```

**Testing:** we tested it with **Zoho, Greenhouse and Lever**. It went out as a **trial feature**. Real customers had not used it yet.

[FILL IN: your own part inside the team's work — e.g. the sync endpoint, the duplicate check, the status sync.]
[FILL IN: how a company connects its ATS account — through unified.to's connect screen?]

:::warning[Fix your resume wording]
Your resume says "Workable". The real integration was **unified.to**, tested with Greenhouse, Lever and Zoho. Update the resume line so it matches this story.
:::

## 🧗 The hard part

**Different ATS, different data.** Even with unified.to, each ATS fills fields differently. Some fields can be missing or named in a different way.

**Duplicates.** The same person can apply many times, or be synced twice. Matching by email stops duplicate candidates.

**Many candidates at once.** A big job can have many candidates. Fetching full details for everyone is slow, so we skip people we already have.

[FILL IN: the hardest bug or case you hit — e.g. missing emails, a field that differed between ATS tools.]

## 🏆 The result

- One integration covers Greenhouse, Lever, Zoho and others.
- Recruiters bring in jobs and candidates with one click, without copying by hand.
- Duplicates are avoided with the email check.
- It is tested and released as a trial; it's ready for real customers.

## 🗣️ How to answer in an interview

> "Many of our customers already keep jobs and candidates in an ATS, like Greenhouse or Lever. Building a separate integration for each ATS is a lot of work, so we used unified.to, which is one API in front of many ATS tools.
>
> With my team I built three flows on top of it. First, pulling jobs — the jobs already existed in the customer's Greenhouse or Lever. Second, pulling candidates: each job has a Sync button, and clicking it fetches new candidates for that job. Third, keeping interview status in sync.
>
> To avoid duplicates, we match candidates by email. If the email already exists in SkillKeepr, we skip fetching their full details again. That keeps the data clean and the sync fast.
>
> We tested it with Zoho, Greenhouse and Lever, and it went out as a trial feature. It hasn't had real customer usage yet, but the flows are built and tested end to end."

## 🔁 Follow-up questions

### Why a unified API instead of calling each ATS directly?

One integration instead of many. One data format. One login flow. The downside is that you depend on another company, and very ATS-specific features may not be available.

### Why a Sync button instead of automatic sync?

It's simple and the recruiter controls when data comes in. Automatic options are **webhooks** (the ATS tells us when something changes) or **polling** (we check on a schedule). [FILL IN: was automatic sync discussed?]

### What if a candidate has no email?

[FILL IN: what your code does.] A common approach is to fall back to another unique field, like the candidate's ID in the ATS, or to flag the record for review.

### What if the ATS or unified.to is down or slow?

Use timeouts and retries with backoff. Show the recruiter a clear message instead of failing silently. For big imports, run the work in the background. [FILL IN: what you did.]

### It wasn't used by real customers — so what did you learn?

Be positive and honest: "It was a trial launch. We tested it end to end with three ATS tools. I learned how unified APIs work, how to handle messy outside data, and how to avoid duplicates."

## 📚 Topics to revise

- [What Express is (building APIs)](topic:express/what-is-express)
- [Unique indexes](topic:mongodb/special-indexes)
- [Webhooks](topic:rest-auth/webhooks)
- [Event-driven architecture](topic:architecture/event-driven)
- [Multi-tenant platform](topic:resume/multi-tenant-platform)
