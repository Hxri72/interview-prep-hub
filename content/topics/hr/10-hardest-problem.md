---
template: answer
title: The hardest problem you solved
stack: hr
order: 10
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Pick one real, technical story you can explain deeply, and tell it with STAR.
  - "Option 1: the AI voice agent — keeping a live phone conversation fast and on track."
  - "Option 2: Stripe auto-renewal — testing monthly renewals with Stripe Test Clocks."
  - Spend most of the time on the options you considered and why you chose one.
  - Only use details you can defend in follow-up questions.
cards:
  - q: What should the "hardest problem" answer focus on?
    a: How you thought — the options you considered, why you chose one, and what happened.
  - q: What structure should you use?
    a: STAR — Situation, Task, Action, Result — with most time on the Action.
  - q: Why is the voice agent a good hardest-problem story?
    a: It combines several services (Twilio, Google speech-to-text and text-to-speech, Claude) in a real-time call, where delays and keeping the conversation on track are hard problems.
  - q: Why is Stripe auto-renewal a good story?
    a: Renewals happen monthly, so they're hard to test. Using Stripe Test Clocks to simulate time is a clever, concrete solution.
  - q: What should you avoid in this answer?
    a: Picking a problem you can't explain deeply, or inventing numbers and details.
---

## 💡 What they really want to know

This question tests how you think under difficulty. The interviewer wants:
- A problem that was genuinely hard.
- Your reasoning: what you tried and why.
- What **you** did, not the whole team.
- The result, and what you learned.

They will ask follow-up questions, so choose a story you know deeply.

## 🏠 Real-life example

Think of **fixing a radio that keeps cutting out**.

You check the battery first. Then the wires. Then the antenna. You find the loose wire, fix it, and test it again.

- **The radio cutting out** = the hard problem.
- **Checking battery, wires, antenna** = the options you tried.
- **Finding the loose wire** = the real cause.
- **Testing again** = proving the fix worked.

Interviewers care most about the checking part.

## 🧩 How to structure your answer

Use STAR, with extra detail on your thinking:

1. **Situation:** the project and why it mattered (1–2 lines).
2. **Task:** your role and the hard part.
3. **Action:** the options, your choice, why, and the steps. Most of the answer.
4. **Result:** what happened. A real number only if you have one.
5. **Learning:** one line.

Two stories you can build from your real work:

| Story | Why it's hard |
|---|---|
| **AI voice agent** | A live phone call chains Twilio, speech-to-text, Claude and text-to-speech. Each step adds delay, and the conversation must follow phases without going off track. |
| **Stripe auto-renewal** | Renewals happen monthly or yearly, so they're hard to test. Webhooks can arrive late or more than once. |

## 🗣️ Sample answer

**Option 1 — the AI voice agent:**

> "The hardest problem I've worked on recently was our AI voice agent. It automatically calls candidates who are eligible after scoring, and collects basic details, so recruiters don't have to.
>
> The hard part was keeping a live phone conversation natural and on track. Each turn goes through Twilio, Google speech-to-text, Claude, and Google text-to-speech. Every step adds a little delay. [FILL IN: what you did about latency.]
>
> To keep the call on track, I designed it as a phase-based state machine. Each phase has a clear goal, and Claude handles the conversation inside that phase. [FILL IN: the real phases.] After the call, the recording is saved to S3, and the call is evaluated and scored by AI. Later I added xAI Grok as a premium voice, while Claude still does the thinking.
>
> The result is that recruiters review scored calls instead of making every first call. A manual call usually takes 10 to 15 minutes, so that's my estimate of the time saved per call — we didn't measure it formally."

**Option 2 — Stripe auto-renewal:**

> "Another hard problem was testing Stripe auto-renewal. I worked on the renewal part — the renewal cron job and the webhook handling. Renewals happen monthly or yearly, so I couldn't wait to test them for real.
>
> I used Stripe Test Clocks, which let you move time forward in test mode. I created test customers, advanced the clock, and checked that each renewal webhook updated the plan correctly. I tested failed payments the same way. [FILL IN: one tricky case you found or handled.]
>
> The result was that we could test months of renewals in minutes before release. [FILL IN: the real result.]"

## ✅ Do

- Pick the story you can talk about for 10 minutes.
- Explain the options you considered, not only the final choice.
- Say clearly what you did versus the team.
- Be honest about estimates — the voice agent time saving is an estimate.
- Prepare for deep follow-ups on every detail you mention.

## ❌ Don't

- Don't pick a story that's too simple, like a small UI bug.
- Don't invent numbers, phases or results.
- Don't take credit for parts others built.
- Don't get lost in background — get to the hard part quickly.
- Don't use internal company names or details that aren't public.

## 🔁 Follow-up questions

### What were the phases of the voice agent's state machine?

[FILL IN: the real phases and what moves the call from one to the next.] See [the state machine story](topic:resume/voice-state-machine).

### How did you handle delays in the call?

[FILL IN: what you actually did.] Common ideas: streaming audio, short prompts, keeping connections open.

### What happens if Stripe sends the same webhook twice?

The standard approach is to store processed event IDs and skip duplicates. [FILL IN: what you actually did.] See [Stripe billing](topic:resume/stripe-billing).

### What would you do differently now?

Pick one honest improvement, such as adding automated tests earlier or measuring the time saved properly.

## ✍️ Your own version

- **The story I'll use first:** [FILL IN: voice agent / Stripe / other]
- **Situation (1–2 lines):** [FILL IN]
- **The hard part:** [FILL IN]
- **Options I considered:** [FILL IN]
- **What I chose and why:** [FILL IN]
- **Steps I took:** [FILL IN]
- **Result (real or clearly marked estimate):** [FILL IN]
- **What I learned:** [FILL IN]
- **Backup story:** [FILL IN]
