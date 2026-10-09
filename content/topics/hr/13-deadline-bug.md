---
template: answer
title: A feature is due tomorrow and you find a serious bug
stack: hr
order: 13
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - They want to see that you raise problems early and don't hide them to hit a date.
  - "Steps: understand the impact → tell the lead now → give options (fix, cut scope, delay) → agree → act."
  - Quality and users come first; a known serious bug should not ship silently.
  - Offer options with time estimates, not just the problem.
  - After the release, add a test so this kind of bug is caught earlier next time.
cards:
  - q: What is the first thing you do when you find a serious bug the day before a deadline?
    a: Check how serious it is and who it affects, then tell the lead straight away. Don't hide it.
  - q: What options can you offer the lead?
    a: "Fix it now (with an estimate), ship without the broken part (cut scope or hide it behind a flag), or move the date."
  - q: Who makes the final call?
    a: The lead or product owner, with your input. You give clear options and risks.
  - q: Should you ever ship a known serious bug quietly?
    a: No. If it ships, everyone must know about it and agree, with a plan to fix it.
  - q: What do you do after the deadline passes?
    a: Find why the bug was caught so late and add a test or check so it's found earlier next time.
---

## 💡 What they really want to know

This is a question about **judgement and honesty**.

The interviewer wants to see that you:
- **Raise problems early**, even when it's uncomfortable.
- **Think about users** before the deadline.
- **Bring options**, not just bad news.
- **Let the right person decide**, with your input.

## 🏠 Real-life example

Think of a **bus driver before a school trip**.

The trip leaves tomorrow. Tonight the driver finds a problem with the brakes. A good driver doesn't stay quiet to keep the schedule. He tells the school at once. Then he offers choices: fix it tonight, use another bus, or leave a bit later.

- **The brake problem** = the serious bug.
- **Telling the school at once** = telling your lead early.
- **Fix tonight / other bus / leave later** = fix now, cut scope, or move the date.
- **The school deciding** = the lead or product owner making the call.

## 🧩 How to structure your answer

1. **Check the impact.** How serious is it? Who does it affect? Can it lose data or money?
2. **Tell the lead now.** Don't wait until tomorrow morning.
3. **Give options with times:**
   - fix it now (say how long it will take),
   - ship without the broken part (cut scope, or turn it off with a feature flag),
   - move the date.
4. **Agree on one option** with the lead or product owner.
5. **Do it, then prevent it.** Add a test or a check so it's caught earlier next time.

## 🗣️ Sample answer

This is a general answer. If you have a real story, put it in the [FILL IN] parts.

> "First, I'd check how serious the bug is — who it affects, and whether it could lose data or money. If it's serious, I'd tell my lead straight away, not the next morning.
>
> I wouldn't just bring the problem. I'd bring options. For example: I can fix it in about [FILL IN: hours], or we can ship the rest of the feature and turn off the broken part, or we move the date by a day.
>
> Then the lead or product owner decides, because they see the bigger picture. Whatever we decide, I'd make sure nobody ships a known serious bug quietly.
>
> After the release, I'd look at why we found it so late, and add a test so it gets caught earlier next time.
>
> [FILL IN: optional — a real time this happened to you, and what you did.]"

## ✅ Do

- Say you'd **tell the lead early**.
- Offer **clear options** with rough times.
- Mention **users and data** — that's why the bug matters.
- Mention a **follow-up test or check**.

## ❌ Don't

- Don't say you'd "work all night and not tell anyone".
- Don't say you'd ship it quietly and fix it later.
- Don't say you'd decide everything alone.
- Don't panic or blame the tester who found it.

## 🔁 Follow-up questions

### What if the lead says "ship it anyway"?

I'd explain the risk once, clearly, with facts. If they still decide to ship, I'd make sure it's written down, users are protected as much as possible, and a fix is planned soon.

### How do you decide if a bug is "serious"?

I look at who it affects, how many users, and whether it can lose data, money or security. A wrong colour is small. Wrong billing is serious.

### What is a feature flag?

A switch in the code or config that turns a feature on or off without a new deploy. It lets you ship the rest and hide the broken part.

### How would you stop this happening next time?

Test the risky paths earlier, review the change with a teammate, and test in a staging environment before the deadline day.

## ✍️ Your own version

- **The bug (or a likely example):** [FILL IN]
- **Who it would affect:** [FILL IN]
- **How I'd tell the lead:** [FILL IN]
- **My options and times:** [FILL IN]
- **What I'd do after the release:** [FILL IN]
