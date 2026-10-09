---
title: Build-vs-buy evaluation for the voice stack
template: story
stack: resume
order: 12
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "⚠️ Confirm the details of this resume line before your interview — they aren't confirmed yet."
  - "The choice: a managed voice-AI vendor, or our own pipeline (Twilio + Google speech services + Claude) hosted on AWS."
  - The fair way to compare is cost per call at different call volumes, plus engineering effort and control.
  - "Buying is usually cheaper at small scale. Building often wins at large scale. The \"switching point\" is where the lines cross."
  - The resume says the recommendation was presented to leadership and adopted.
cards:
  - q: What does build vs buy mean?
    a: Deciding whether to build a system yourself or pay a vendor for a ready-made one.
  - q: What did you compare for the voice stack?
    a: "A managed vendor against our own pipeline: Twilio for calls, Google Cloud speech services, and Claude as the brain, hosted on AWS. [FILL IN: confirm]"
  - q: How do you compare costs fairly?
    a: Work out the cost per call for each option at several volumes, for example 1,000, 10,000 and 100,000 calls a month, and add engineering and maintenance effort.
  - q: What is a scale-based switching recommendation?
    a: '"Use option A below a certain number of calls, and switch to option B above it, because that is where B becomes cheaper."'
---

:::warning[Confirm before the interview]
You haven't confirmed the details of this resume line yet. Before an interview, check the vendor name, the costs and the switching point. Every part marked [FILL IN] must be true before you say it.
:::

## 💡 What is it?

Your resume says you **led a build-vs-buy evaluation** for the voice stack. You compared a **managed vendor** with a **self-built pipeline**. The self-built pipeline was GCP speech services + Twilio + Claude API.

The resume says you **presented a scale-based recommendation** to leadership, and the team adopted it.

"Build vs buy" means: do we build it ourselves, or pay someone for a ready-made product?

## 🏠 Real-life example

Think of **school lunch**.

You can **buy** lunch from the canteen every day. It is easy, but each plate costs money. Or you can **cook** at home. You buy a stove and learn to cook first, but each plate is cheap.

If you eat at school **twice a month**, buying is smarter. If you eat there **every day for years**, cooking wins.

- **Canteen** = the managed vendor (buy).
- **Cooking at home** = your own pipeline (build).
- **Stove and learning** = engineering effort.
- **"Every day for years"** = high call volume, where building becomes cheaper.

## 🧩 The problem

The AI voice agent phones candidates for recruiters and collects their basic details. As usage grows, the cost per call matters a lot.

A managed voice vendor is fast to start with. A self-built pipeline needs engineering work, but gives more control and may cost less per call at scale.

[FILL IN: what triggered the evaluation — cost, quality, control, or a leadership question?]

## 🛠️ What I built

**Known facts about the voice stack:**
- **Self-built (standard voice):** Twilio for phone calls, Google Cloud Speech-to-Text and Text-to-Speech, Claude as the brain. Hosted on AWS.
- **Premium voice:** xAI Grok Voice instead of Google's speech services.

**From the resume:** you compared this with a managed vendor and presented a switching recommendation.

[FILL IN: the managed vendor's name.]
[FILL IN: cost per call for each option, and the volumes you checked.]
[FILL IN: the switching point — "below X calls a month, buy; above X, build".]

**How this is usually done (general knowledge):**

```text
Cost per call
   │\
   │ \  vendor (simple, fixed price per minute)
   │  \___________________
   │       /
   │      /  self-built (high start cost, cheap per call)
   │_____/________________________ calls per month
         ↑ switching point
```

1. List all costs for each option: per-minute fees, AI model tokens, speech services, phone minutes, hosting, engineering time.
2. Calculate cost per call at several volumes.
3. Add non-money factors: control, voice quality, data privacy, how fast you can change things.
4. Find the volume where the self-built option becomes cheaper.

## 🧗 The hard part

**General knowledge:** the hard part is making the comparison fair. Vendor prices are simple. Your own costs are spread across many services and engineering hours, and they are easy to underestimate.

[FILL IN: the real hard part for you.]

## 🏆 The result

From the resume: leadership **adopted** the scale-based recommendation.

[FILL IN: what was decided in practice, and what happened after.]

## 🗣️ How to answer in an interview

Only use this story after you've confirmed the [FILL IN] parts.

> "For our AI voice agent, I compared two options: a managed voice-AI vendor, and our own pipeline using Twilio, Google's speech services and Claude, hosted on AWS. I compared the cost per call at different volumes, plus engineering effort and how much control we'd have.
>
> [FILL IN: the numbers — e.g. at low volume the vendor was cheaper, but above X calls a month our own pipeline was cheaper.]
>
> I presented a scale-based recommendation to leadership: [FILL IN: the exact recommendation]. The team adopted it."

## 🔁 Follow-up questions

### What costs did you include for the self-built option?

Typical items: phone minutes (Twilio), speech services, AI model tokens, AWS hosting, and engineering and maintenance time. [FILL IN: your real list.]

### Why not just pick the cheapest option?

Cost is one factor. Control over the call flow, voice quality, data privacy and speed of change also matter. A cheap option you can't change can cost more later.

### How did you present it to leadership?

[FILL IN: a document, slides, or a meeting — and what they asked.]

### Would your answer change at 10× the volume?

Usually, the self-built option becomes even more attractive at higher volume, because its cost per call stays low. [FILL IN: confirm with your numbers.]

## 📚 Topics to revise

- [The voice agent microservice](topic:resume/voice-agent-microservice)
- [Grok Voice as a premium option](topic:resume/grok-voice-premium)
- [Voice AI basics](topic:ai/voice-ai)
- [Microservices](topic:architecture/microservices)
