---
template: chapter
title: Scheduling an interview and sending reminders
stack: skillkeepr-story
order: 10
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "The recruiter sends an invitation with free slots; the candidate picks one."
  - "Before booking, the server checks that no interviewer already has something at that time (a collision check)."
  - "Each participant gets their own schedule entry and an email; calendar sync (Outlook) is optional."
  - "A scheduled workflow sends reminder emails every 30 minutes for upcoming interviews, across all companies."
  - "Times are stored in UTC and shown in each company's own time zone."
cards:
  - q: How do you stop two interviews being booked at the same time?
    a: Before booking, check every interviewer's existing bookings. Two ranges overlap when each one starts before the other ends.
  - q: Why store times in UTC?
    a: UTC is one shared clock. You convert to the company's or person's time zone only when you show the time.
  - q: How are interview reminders sent?
    a: A scheduled workflow runs every 30 minutes, finds interviews starting soon in every company, and sends reminder emails.
  - q: What is the overlap test for two time ranges?
    a: "aStart < bEnd && bStart < aEnd. If both are true, they overlap."
---

## 💡 What happens in this chapter

Rahul passed the AI screening call. Now Priya wants a real interview with him.

She sends Rahul an **invitation** with a few free time slots. Rahul picks one. SkillKeepr books it, emails everyone, and sends **reminders** before the interview.

## 🏠 Real-life example

Think of **booking a doctor's appointment**.

- The **receptionist shows open times** = Priya's invitation with slots.
- The **patient picks one** = Rahul chooses a slot.
- The **receptionist checks the doctor isn't already booked** = the collision check.
- The **appointment card** for the patient and the doctor's diary entry = one schedule entry per participant.
- The **reminder SMS the day before** = the reminder workflow.
- A patient calling from another country still gets the **same moment**, shown on their own clock = UTC stored, local time shown.

## 🗺️ The flow

```text
Priya picks interviewers + free slots ─► invitation saved ─► email to Rahul
                                                               │
Rahul opens the candidate portal and picks a slot ◄────────────┘
        │
        ▼
Server checks: is any interviewer already busy then?  ──yes──► "Slot taken, pick another"
        │ no
        ▼
Booking saved + one schedule entry per participant + status history updated
        │
        ├─► emails to Rahul, Priya and the panel
        └─► optional: event created in Outlook calendar

Every 30 minutes: scheduled workflow ─► for each company ─► upcoming interviews ─► reminder emails
```

## 🧱 Tech used

| Piece | Technology | Learn it |
|---|---|---|
| Booking API | Serverless functions behind API Gateway | [Serverless and AWS Lambda](topic:architecture/serverless-lambda) |
| Storing bookings | MongoDB, times in UTC | [Schema design](topic:system-design/schema-design) |
| Preventing double booking | Overlap check before saving | [Race conditions and atomic updates](topic:mongodb/atomic-updates-locking) |
| Reminders | A scheduled workflow every 30 minutes (AWS Step Functions) | [Queues and background jobs](topic:system-design/queues-background-jobs) |
| Reminder system design | Scheduler, templates, retries | [Notification system design](topic:system-design/notification-system) |
| Calendar sync | Outlook (Microsoft Graph), optional | [OAuth 2.0](topic:rest-auth/oauth) |

## 🧑‍💻 Key code idea

Two small ideas: the **overlap test**, and **showing a UTC time in a local time zone**.

Save as `slots.js` and run `node slots.js`.

```js
const booked = [                                                 // interviews already booked (times stored in UTC)
  { who: 'priya', start: '2026-11-03T04:30:00Z', end: '2026-11-03T05:30:00Z' }, // Priya busy 04:30–05:30 UTC
  { who: 'arun', start: '2026-11-03T06:00:00Z', end: '2026-11-03T06:30:00Z' },  // panel member Arun busy 06:00–06:30 UTC
];                                                               // end of booked list

function overlaps(aStart, aEnd, bStart, bEnd) {                  // do two time ranges overlap?
  return aStart < bEnd && bStart < aEnd;                         // true when each starts before the other ends
}                                                                // end of overlaps

function canBook(slot, people) {                                 // slot = { start, end } in UTC; people = interviewers
  const s = new Date(slot.start), e = new Date(slot.end);        // turn the text into Date objects
  return !booked.some((b) =>                                     // the slot is free if NO booking clashes
    people.includes(b.who) &&                                    // the booking belongs to one of our interviewers
    overlaps(s, e, new Date(b.start), new Date(b.end)));         // and its time overlaps the slot
}                                                                // end of canBook

const showIn = (iso, tz) =>                                      // show a UTC time in a company's time zone
  new Date(iso).toLocaleString('en-IN', { timeZone: tz, dateStyle: 'medium', timeStyle: 'short' }); // e.g. "3 Nov 2026, 10:00 am"

const slots = [                                                  // slots Rahul can choose from (UTC)
  { start: '2026-11-03T05:00:00Z', end: '2026-11-03T05:30:00Z' }, // clashes with Priya
  { start: '2026-11-03T06:30:00Z', end: '2026-11-03T07:00:00Z' }, // starts exactly when Arun is free
];                                                               // end of slots

for (const slot of slots) {                                      // check each slot
  const ok = canBook(slot, ['priya', 'arun']);                   // both interviewers must be free
  console.log(showIn(slot.start, 'Asia/Kolkata'), '→', ok ? 'free, booked ✓' : 'clash ✗'); // show in India time
}                                                                // end of loop
console.log('Same slot for a London panel member:', showIn(slots[1].start, 'Europe/London')); // same moment, different clock
```

```text
3 Nov 2026, 10:30 am → clash ✗
3 Nov 2026, 12:00 pm → free, booked ✓
Same slot for a London panel member: 3 Nov 2026, 6:30 am
```

The second slot starts exactly when Arun's meeting ends. That is **not** a clash, because `<` (not `<=`) is used.

## 🧗 Hard parts and trade-offs

- **Two people booking at once.** If two candidates pick the same slot at the same moment, both checks can pass. A real system needs an atomic step, like a unique index or a conditional update. [FILL IN: how SkillKeepr handles this, if you know]
- **Time zones and daylight saving.** Store UTC. Convert only for display. Never store "10:30 am" without a zone.
- **Reminders for many companies.** Each company has its own database, so the workflow loops through companies. A per-step retry keeps one bad company from stopping the rest.
- **Calendar sync can fail.** Outlook tokens expire. The booking must still work even if calendar sync fails.

## 🙋 My part

[FILL IN: which parts of scheduling, reminders or calendar sync you worked on, if any. If none, say "I know how it works, but another developer built it."]

## 🗣️ How to explain it in an interview

> "When a recruiter wants an interview, they send the candidate an invitation with free slots. The candidate picks one in the candidate portal. Before booking, the server checks that none of the interviewers already has a meeting that overlaps — two ranges overlap when each starts before the other ends.
>
> We store all times in UTC and show them in the company's time zone. The booking creates a schedule entry for each participant and sends emails, and calendar sync with Outlook is optional.
>
> Reminders come from a scheduled workflow that runs every 30 minutes. It goes through each company, finds interviews starting soon and sends reminder emails, with retries per step."

## 🔁 Follow-up questions

### What if two candidates pick the same slot at the same time?

Both checks could pass before either saves. You need an atomic guard: a unique index on interviewer + time, or a conditional update that only succeeds if the slot is still free.

### Why use a workflow service for reminders instead of one cron job?

A workflow can loop through each company with its own step and retries. One giant cron function could time out or stop at the first error.

### How would you send SMS reminders as well?

Add an SMS provider behind the same reminder step, respect each user's preference, and retry failures separately from email.

### How do you show the right time to someone in another country?

Keep the stored time in UTC and convert it with the viewer's time zone, for example with `toLocaleString` and `timeZone`.

## 📚 Topics to revise

- [Notification system design](topic:system-design/notification-system)
- [Queues and background jobs](topic:system-design/queues-background-jobs)
- [Atomic updates and race conditions](topic:mongodb/atomic-updates-locking)
- [Database schema design](topic:system-design/schema-design)
- [Serverless and AWS Lambda](topic:architecture/serverless-lambda)
- [OAuth 2.0](topic:rest-auth/oauth)
