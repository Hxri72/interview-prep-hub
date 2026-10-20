---
template: chapter
title: Pulling jobs and candidates from an ATS (unified.to)
stack: skillkeepr-story
order: 6
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - Many companies already keep jobs and candidates in an ATS like Workable, Greenhouse, Lever or Zoho.
  - unified.to is one API that talks to many ATSs, so we built one integration instead of many.
  - "The backend pulls jobs, pulls candidates and syncs interview status — with a Sync button and a scheduled sync."
  - "Duplicates are checked by email: an existing candidate is only linked to the job, not fetched or updated again."
  - "My part: I built the backend. It was a trial feature, tested with Workable, Zoho, Greenhouse and Lever."
cards:
  - q: Why use unified.to instead of each ATS API?
    a: One integration covers many ATSs (Workable, Greenhouse, Lever, Zoho…) with one data shape, so we don't build and maintain a separate integration for each.
  - q: How did the sync start?
    a: A recruiter could press a Sync button on a job, and there was also a configurable scheduled sync. It was not webhook-driven.
  - q: How did you avoid duplicate candidates?
    a: By email. If a candidate with that email already exists, we don't fetch their full details again or update them — we just link them to the job, and skip the link if it already exists.
  - q: Was it used by real customers?
    a: No — it was a trial feature. We tested it with Workable, Zoho, Greenhouse and Lever, but it hadn't been used by real customers yet.
  - q: What would you add before going live at scale?
    a: Retries with backoff for ATS errors, rate-limit handling, clear sync logs per run, and a unique index on the candidate–job link if it isn't there already.
---

## 💡 What happens in this chapter

Acme Hiring already uses an **ATS** (Applicant Tracking System) to store its jobs and candidates. Priya doesn't want to type everything again into SkillKeepr.

So she connects her ATS account once. Then SkillKeepr **pulls** her jobs and candidates in, and keeps interview status in step.

## 🏠 Real-life example

Think of a **universal TV remote**.

Every TV brand has its own remote. A universal remote speaks to all of them through one set of buttons.

- **Each TV brand** = each ATS (Workable, Greenhouse, Lever, Zoho).
- **The universal remote** = unified.to, one API for all of them.
- **Pressing the "sync" button** = Priya clicking Sync on a job.
- **A timer that switches the TV on daily** = the scheduled sync.
- **Not adding a channel you already saved** = skipping a candidate who already exists.

## 🗺️ The flow

```text
Priya authorises her ATS account (one time)
        │
        ▼
Trigger: Sync button on a job   OR   scheduled sync (interval: [FILL IN])
        │
        ▼
Node backend ──► unified.to ──► Workable / Greenhouse / Lever / Zoho
        │  pull jobs (already created in the ATS)
        │  pull candidates for a job
        ▼
For each candidate:
   email already in our DB?
     ├─ yes → don't fetch details or update → just link to the job
     │          (link already exists? → skip)
     └─ no  → fetch details → create candidate → link to the job
        │
        ▼
Interview status changes are synced as well
```

## 🧱 Tech used

| Piece | Technology | Learn it here |
|---|---|---|
| One API for many ATSs | unified.to | [Resume story: ATS integration](topic:resume/ats-integration) |
| Connecting a customer's account | OAuth-style authorisation | [OAuth 2.0 overview](topic:rest-auth/oauth) |
| Calling an external API safely | Timeouts, retries, backoff | [Resilience](topic:architecture/resilience) |
| Scheduled sync | Cron-style background job | [Queues and background jobs](topic:system-design/queues-background-jobs) |
| No duplicate candidates | Check by email, upsert-style logic | [Atomic updates](topic:mongodb/atomic-updates-locking) |
| Large lists from the ATS | Pagination | [Offset vs cursor pagination](topic:rest-auth/pagination-offset-cursor) |

## 🧑‍💻 Key code idea

The core rule: **check by email, link instead of duplicating**. This in-memory version shows the logic. Save it as `ats-sync.js` and run `node ats-sync.js`.

```js
const candidates = new Map([['rahul@mail.com', { id: 'c1', name: 'Rahul' }]]); // our database: Rahul already exists
const jdLinks = new Set(['c1:jd42']);                      // Rahul is already linked to job jd42

function syncCandidates(jdId, fromAts) {                   // fromAts = candidates pulled from the ATS for one job
  const report = { created: 0, linked: 0, skipped: 0 };    // count what happened
  for (const c of fromAts) {                               // look at each pulled candidate
    const email = c.email.trim().toLowerCase();            // compare emails in one format
    let existing = candidates.get(email);                  // is this person already in our database?
    if (!existing) {                                       // new person → fetch details and create
      existing = { id: `c${candidates.size + 1}`, name: c.name }; // create a new candidate record
      candidates.set(email, existing);                     // save it, keyed by email
      report.created++;                                    // one new candidate
    }                                                      // existing person → we do NOT update their record
    const link = `${existing.id}:${jdId}`;                 // the candidate–job link key
    if (jdLinks.has(link)) { report.skipped++; continue; } // already linked to this job → skip
    jdLinks.add(link);                                     // link the candidate to the job
    report.linked++;                                       // one new link
  }                                                        // end of the loop
  return report;                                           // tell the caller what changed
}                                                          // end of syncCandidates

const pulled = [                                           // what the Sync button pulled for jd42
  { name: 'Rahul K', email: 'Rahul@Mail.com ' },           // same person, different capitals and a space
  { name: 'Meena', email: 'meena@mail.com' },              // a brand-new candidate
];                                                         // end of pulled list
console.log(syncCandidates('jd42', pulled));               // first sync
console.log(syncCandidates('jd42', pulled));               // pressing Sync again changes nothing
```

```text
{ created: 1, linked: 1, skipped: 1 }
{ created: 0, linked: 0, skipped: 2 }
```

The first run created Meena and linked her. Rahul already existed and was already linked, so he was skipped. Pressing Sync again changed nothing — the sync is **safe to repeat**.

## 🧗 Hard parts and trade-offs

- **Many ATSs, different data.** unified.to gives one shape, but some fields can still be missing or named differently. Map carefully.
- **Manual and scheduled sync, not webhooks.** Pulling on a button or a timer is simpler to build and reason about. The trade-off: changes in the ATS appear only at the next sync.
- **Not updating existing candidates.** Skipping updates avoids overwriting data the recruiter already edited in SkillKeepr. The trade-off: newer details in the ATS are not copied over.
- **External API failures.** The ATS or unified.to can be slow, rate-limited or down. See [a third-party API is down](topic:debugging/third-party-api-down).

## 🙋 My part

- I built the **backend**. Another developer built the frontend.
- Recruiters authorise their ATS account; then we **pull jobs** (they already existed in the ATS), **pull candidates**, and **sync interview status**.
- Sync runs from a **Sync button** on a job and from a configurable **scheduled sync**. Interval: [FILL IN]. It was **not** webhook-driven.
- **Duplicate check by email:** an existing candidate is not fetched again or updated; they are linked to the job, and an existing link is skipped.
- Tested with **Workable, Zoho, Greenhouse and Lever**. It was a **trial feature**, not yet used by real customers.
- How errors and rate limits were handled: [FILL IN].

## 🗣️ How to explain it in an interview

> "Many of our customers already keep jobs and candidates in an ATS like Workable, Greenhouse, Lever or Zoho. Instead of building one integration per ATS, we used unified.to, which gives one API for all of them. I built the backend.
>
> After a recruiter authorises their ATS, we pull their jobs and the candidates for each job, and we sync interview status. Sync runs when the recruiter clicks Sync on a job, and also on a configurable schedule. To avoid duplicates, we match candidates by email. If the candidate already exists, we don't fetch or update them again — we just link them to the job, and skip it if that link already exists. So running sync twice is safe.
>
> It was a trial feature. We tested it with Workable, Zoho, Greenhouse and Lever, and it was ready for customers to try."

## 🔁 Follow-up questions

### Why not use webhooks from the ATS?

Webhooks give faster updates, but need a public endpoint, signature checks and duplicate handling. A button plus a schedule was simpler for a trial. See [webhooks](topic:rest-auth/webhooks).

### What if two candidates share an email, or one has no email?

Email was our matching key. [FILL IN: how you handled a missing email.] A common approach is to skip and log such records, or match on the ATS's own candidate ID.

### How do you make the sync safe to run twice?

Check before creating, and check before linking — like the code above. In the database, a unique index on the candidate–job pair makes it safe even with two syncs at once. See [idempotent consumers](topic:architecture/idempotent-consumers).

### How would you handle a big ATS with thousands of candidates?

Page through results, process in batches in a background job, and record progress so a failed run can continue. See [queues and background jobs](topic:system-design/queues-background-jobs).

## 📚 Topics to revise

- [Resume story: ATS integration via unified.to](topic:resume/ats-integration)
- [Idempotent consumers](topic:architecture/idempotent-consumers)
- [Resilience: timeouts, retries, circuit breakers](topic:architecture/resilience)
- [Webhooks](topic:rest-auth/webhooks)
- [Unique, partial, TTL and text indexes](topic:mongodb/special-indexes)
