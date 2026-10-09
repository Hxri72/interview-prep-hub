---
template: answer
title: What would you do differently if you rebuilt the platform?
stack: hr
order: 17
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - They want to see that you understand trade-offs and keep learning — not that you complain.
  - Frame it positively — "things I'd consider now", knowing more than when it was built.
  - "Pick 2–3 ideas you can defend: e.g. caching config, async logging, more indexes, error boundaries, tests in CI."
  - For each idea, give the reason and the trade-off.
  - Respect the original choices — they made sense with what the team knew then.
cards:
  - q: What does this question really test?
    a: Your understanding of trade-offs and your growth — and whether you can talk about improvements without criticising your team.
  - q: How should you frame your answer?
    a: Positively — "with what I know now, I'd consider…", and respect why the first version was built that way.
  - q: How many ideas should you give?
    a: Two or three you can explain well, each with a reason and a trade-off.
  - q: Give two safe example ideas.
    a: "Cache config that is read on every request, and run tests automatically in the CI pipeline."
  - q: What must you avoid?
    a: Complaining, blaming the team, or sharing internal security problems in an interview.
---

## 💡 What they really want to know

This question checks your **maturity as an engineer**.

The interviewer wants to see:
- Do you understand **trade-offs**?
- Have you **grown** since the platform was first built?
- Can you suggest improvements **without complaining** or blaming anyone?

## 🏠 Real-life example

Think of **rearranging your study room**.

When you set it up, you put the desk near the door because that was easy. After a year of studying there, you realise the window gives better light. You'd move the desk now. That doesn't mean the first setup was "wrong". You just learned more.

- **The first setup** = the platform as it was first built.
- **A year of studying** = your years of working on it.
- **Moving the desk to the window** = an improvement you'd make now.
- **Not calling the first setup "wrong"** = respecting the original choices.

## 🧩 How to structure your answer

1. **Respect the first version.** It was built for the needs and time it had.
2. **Pick 2–3 ideas** you can explain well.
3. **For each idea:** what you'd change, why, and the trade-off.
4. **End positively:** these are things you'd suggest, and you'd measure before changing.

Good, safe ideas to choose from (only pick ones you understand well):
- **Caching** config or settings that are read on every request.
- **Making non-critical work asynchronous**, like audit logging, so requests return faster.
- **Adding indexes** on fields used by the busiest list screens.
- **Error boundaries** in React, so one broken widget doesn't blank the page.
- **Running tests automatically in CI** on every pull request.

## 🗣️ Sample answer

> "First, I think the platform's early choices made sense — the team had to ship fast with what we knew then. But with what I know now, there are a few things I'd consider.
>
> One is [FILL IN: idea 1 — e.g. caching settings that are read on every request]. That would make requests faster. The trade-off is we'd need a clear way to refresh the cache when settings change.
>
> Another is [FILL IN: idea 2 — e.g. running tests automatically in CI on every pull request]. It would catch bugs before merge. The trade-off is a bit more pipeline time.
>
> [FILL IN: optional idea 3, with reason and trade-off.]
>
> Before changing anything, I'd measure first, so we fix the parts that really matter."

Only pick ideas you can **defend in detail**. Interviewers will ask "why?" and "how?".

## ✅ Do

- **Respect** the original decisions.
- Give **2–3 specific** ideas.
- Explain **why** and the **trade-off** for each.
- Say you'd **measure first**.

## ❌ Don't

- Don't say "the code is a mess" or "it was badly built".
- Don't blame people or teams.
- Don't share internal security issues or private details of your company.
- Don't list ten vague ideas you can't explain.

## 🔁 Follow-up questions

### Why wasn't it built that way the first time?

Early on, speed mattered more, and we didn't yet know where the slow parts would be. Now we have real usage to learn from.

### How would you convince the team to make this change?

Show data — for example timing logs or error counts — then suggest a small, safe first step.

### Which idea would you do first?

The one with the biggest benefit for the least risk. [FILL IN: your choice and why.]

### What would you keep exactly the same?

[FILL IN: something you think worked well — e.g. shared backend modules that save time across services.]

## ✍️ Your own version

- **Why the first version made sense:** [FILL IN]
- **Idea 1 + reason + trade-off:** [FILL IN]
- **Idea 2 + reason + trade-off:** [FILL IN]
- **Idea 3 (optional):** [FILL IN]
- **What I'd keep the same:** [FILL IN]
