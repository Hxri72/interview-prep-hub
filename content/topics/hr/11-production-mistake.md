---
template: answer
title: A mistake you made in production
stack: hr
order: 11
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - They want to see honesty, ownership and learning — not a perfect record.
  - "Use STAR: what broke, what you did first, how you fixed it, what you changed after."
  - Pick a real, small-to-medium mistake that is fully fixed.
  - Spend most of the time on the fix and on what you changed so it never happens again.
  - Never blame a teammate, the company or "the process".
cards:
  - q: What does the interviewer really check with "tell me about a mistake"?
    a: Honesty, ownership, calm under pressure, and whether you learn and prevent repeats.
  - q: What is the best structure for this answer?
    a: "STAR: Situation (what broke), Task (your part), Action (how you fixed it), Result (the fix plus what you changed afterwards)."
  - q: What kind of mistake should you pick?
    a: A real one, small to medium, already fixed, where you clearly learned something. Not a disaster, not a fake one.
  - q: Where should most of your answer go?
    a: Into the fix and the prevention — tests, alerts, checklists or reviews you added.
  - q: What must you never do in this answer?
    a: Blame others, say "I never make mistakes", or tell a story with no lesson.
---

## 💡 What they really want to know

Everyone makes mistakes. The interviewer knows that.

They want to see three things:
- **Do you own it?** Or do you blame others?
- **Do you stay calm and fix it fast?**
- **Do you learn?** Do you change something so it does not happen again?

## 🏠 Real-life example

Think of a **cricket player who drops a catch**.

A good player does not blame the sun or the fielder next to him. He says, "My mistake." Then he practises catching in the nets the next day.

- **Dropping the catch** = your production bug.
- **Saying "my mistake"** = owning it.
- **Practising in the nets** = the test or check you added afterwards.
- **The coach watching** = the interviewer. He cares more about the practice than the drop.

## 🧩 How to structure your answer

Use **STAR**. See [the STAR method](topic:hr/star-method).

1. **Situation** — one or two lines. What happened, and who was affected?
2. **Task** — what was your part in it?
3. **Action** — how you found the cause and fixed it. Be specific.
4. **Result** — it was fixed. Then say **what you changed** so it can't repeat.
5. **Lesson** — one sentence about what you do differently now.

Keep the "Situation" short. Spend most of your time on Action and Result.

## 🗣️ Sample answer

The story below is a **frame**. Fill it with your own real mistake. Never invent one.

> "One mistake I remember is [FILL IN: what went wrong — e.g. a change you shipped that broke something for users].
>
> It happened because [FILL IN: the real cause, in one line]. I noticed it when [FILL IN: how you found out — logs, an alert, a user report].
>
> First, I took ownership and told my lead straight away. Then I [FILL IN: the quick fix — e.g. rolled back or patched it]. After that, I found the root cause and fixed it properly.
>
> To stop it happening again, I [FILL IN: what you changed — e.g. added a Jest test for that case, added a check to the code review list, added logging].
>
> The lesson for me was [FILL IN: one line — e.g. test the edge case before shipping, not after]. Since then, [FILL IN: how you work differently now]."

Related pages: [handling a live incident](topic:testing/production-incidents) and [production support at SkillKeepr](topic:resume/production-support-quality).

## ✅ Do

- Pick a **real** mistake you can explain in detail.
- Say **"I"** for your part. Own it clearly.
- Show the **fix** and the **prevention** — tests, logs, a checklist.
- End with a short, honest **lesson**.

## ❌ Don't

- Don't blame a teammate, your lead or the company.
- Don't say "I have never made a mistake." Nobody believes it.
- Don't pick a huge disaster that sounds careless, like deleting a production database.
- Don't stop at the problem. A story with no fix and no lesson sounds bad.

## 🔁 Follow-up questions

### How did you find out about the problem?

Name the real signal: logs, an error-tracking alert, a failing check or a user report. [FILL IN: how you found yours.]

### Who did you tell, and when?

Say you told your lead or team **early**, even before the fix was ready. Hiding a problem is worse than the problem.

### What would you do differently now?

Give one concrete habit. For example: "I add a test for that kind of edge case before I ship."

### How do you avoid mistakes in general?

Small changes, tests for the main paths, code reviews, and checking logs after a deploy. See [code reviews](topic:testing/code-reviews).

## ✍️ Your own version

Fill this in, then practise it out loud.

- **Situation:** [FILL IN: what broke and who it affected]
- **My part:** [FILL IN: what I owned]
- **How I found it:** [FILL IN]
- **Quick fix:** [FILL IN]
- **Real fix:** [FILL IN]
- **What I changed so it can't repeat:** [FILL IN]
- **Lesson in one line:** [FILL IN]
