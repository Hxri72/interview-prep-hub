---
title: "Build vs buy: replacing Retell AI with our own voice pipeline"
template: story
stack: resume
order: 12
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "We first used Retell AI, a ready-made voice-agent service. Its cost became a concern."
  - "I researched an alternative: Twilio for calls, Google Cloud Speech-to-Text and Text-to-Speech, and an LLM for the conversation."
  - I presented the cost and feasibility findings to the team. I was then asked to build it as a separate voice service.
  - "I estimated about 65% lower cost. It is an estimate, not a measured production saving."
  - "Trade-offs: lower cost and more control, but more build effort and we must maintain it ourselves."
cards:
  - q: What does build vs buy mean?
    a: Deciding whether to build a system yourself or pay a vendor for a ready-made one.
  - q: Why did you look for an alternative to Retell AI?
    a: Cost became a concern as we made more calls. So I researched building our own pipeline.
  - q: What did you propose instead?
    a: Twilio for the phone call, Google Cloud speech-to-text and text-to-speech, and an LLM (Claude) for the conversation, as a separate voice service.
  - q: How much did it save?
    a: I estimated about 65% lower cost. It is an estimate from my research, not a measured saving.
  - q: What trade-offs did you consider?
    a: Cost, build effort, control over the pipeline, and the work of maintaining the service ourselves.
---

## 💡 What is it?

"**Build vs buy**" means: do we build it ourselves, or pay for a ready-made product?

SkillKeepr's AI voice agent first used **Retell AI**. Retell AI is a ready-made service for voice agents. As usage grew, its **cost became a concern**.

I researched building our own pipeline instead. I presented the findings, and the team asked me to build it.

## 🏠 Real-life example

Think of **school lunch**.

You can **buy** lunch from the canteen every day. It is easy, but each plate costs money. Or you can **cook** at home. You need a stove and some practice first, but each plate is cheap.

If you eat at school every day for years, cooking wins.

- **The canteen** = Retell AI (buy).
- **Cooking at home** = our own pipeline: Twilio + Google speech + an LLM (build).
- **The stove and practice** = the engineering effort to build it.
- **Washing the pots every day** = maintaining the service ourselves.
- **Eating every day** = making a lot of calls, where building becomes cheaper.

## 🧩 The problem

The voice agent phones candidates and collects their basic details. Every call costs money.

With Retell AI, the **cost per call** was high for the number of calls we wanted to make. [FILL IN: what made cost a concern — call volume, a price change, a customer plan?]

We needed a cheaper way that still sounded good and stayed reliable.

## 🛠️ What I built

**1. Research.** I looked at building the same thing from separate parts:

| Part | Job | Service |
|---|---|---|
| Phone line | places the call, carries the audio | Twilio |
| Ears | turns the candidate's speech into text | Google Cloud Speech-to-Text |
| Brain | decides what to say next | an LLM (Claude) |
| Voice | turns the reply text into speech | Google Cloud Text-to-Speech |

**2. Cost and feasibility.** I compared the cost of this pipeline with Retell AI. I also checked that it was possible to build with our team. I **estimated about 65% lower cost**.

[FILL IN: how you worked out the 65% — for example, cost per minute of each part vs Retell's price per minute, at your call volume.]

**3. Presentation.** I presented the cost and feasibility findings to the team.

**4. Build.** I was asked to implement it. I built it as a **separate voice service**. See [the voice agent story](topic:resume/voice-agent-microservice).

**How a fair cost comparison is usually done (general knowledge):**

```text
Cost per month
   │            / vendor (price per minute × minutes)
   │          /
   │        /        ____ own pipeline (start cost, then cheap per minute)
   │      /   ______/
   │    /____/
   │___/_________________________ calls per month
       ↑ switching point: building becomes cheaper
```

1. List every cost: phone minutes, speech services, LLM tokens (the units an LLM charges for), hosting, and engineering time.
2. Work out the cost per call for each option.
3. Add the non-money factors: control, voice quality, data privacy, and maintenance.

## 🧗 The hard part

**Making the comparison fair.** Retell AI has one simple price. Our own pipeline has many small costs spread over many services. These are easy to underestimate.

**Honest trade-offs.** Building gives lower cost and more control. But we must build it, fix it and keep it running ourselves. Retell AI did that work for us.

[FILL IN: the hardest part for you in practice.]

## 🏆 The result

- The team adopted the proposal, and I built the separate voice service.
- **Estimated** cost saving: about **65%**. This came from my research. It was not measured in production.
- We got more **control** over the call flow, for example the phases of the call and how long to wait for the candidate.

[FILL IN: whether Retell AI was fully switched off, and when.]

## 🗣️ How to answer in an interview

> "Our AI voice agent was first built on Retell AI, which is a managed voice-agent platform. As we made more calls, cost became a concern. So I researched building our own pipeline: Twilio for telephony, Google Cloud for speech-to-text and text-to-speech, and an LLM for the conversation.
>
> I compared the costs and checked the feasibility. I presented the findings to the team. My estimate was that this could cut costs by around 65%. That's an estimate from my research, not a measured production number.
>
> I was then asked to build it, so I implemented it as a separate voice service.
>
> The trade-off was clear. We got lower cost and full control over the pipeline. In return, we took on the build effort and the job of maintaining it ourselves."

**If they ask "how did you measure 65%?"** answer honestly: "It was an estimate from comparing per-minute costs. We didn't do a formal before-and-after measurement."

## 🔁 Follow-up questions

### What trade-offs did you consider?

- **Cost:** our own pipeline was estimated to be much cheaper per call.
- **Effort:** we had to build and test it ourselves.
- **Control:** we could change every step, like the call phases and the wait times.
- **Maintenance:** we now fix and run it ourselves. Retell AI used to do that for us.

### What costs did you include for the self-built option?

Typical items: Twilio phone minutes, Google speech services, LLM tokens, hosting, and engineering time. [FILL IN: your real list.]

### Why not just pick the cheapest option?

Cost is only one factor. Voice quality, reliability, control and the effort to maintain it also matter. A cheap option that breaks often costs more in the end.

### Would you ever go back to a managed vendor?

At very low call volumes, maybe, because a vendor needs no build or maintenance work. Above a certain volume, our own pipeline costs less per call. [FILL IN: your real view.]

### Is the 65% a measured number?

No. It is my estimate from the research. I say "estimated" every time, unless I can show a measured saving.

## 📚 Topics to revise

- [The voice agent microservice](topic:resume/voice-agent-microservice)
- [Grok Voice as a premium option](topic:resume/grok-voice-premium)
- [Voice AI basics](topic:ai/voice-ai)
- [Microservices](topic:architecture/microservices)
- [Resume question bank](topic:resume/question-bank)
