---
title: xAI Grok Voice as a premium voice option
template: story
stack: resume
order: 9
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "The AI voice agent has two voice options: standard and premium."
  - "Standard voice: Twilio + Google Cloud Speech-to-Text and Text-to-Speech + Claude as the brain."
  - "Premium voice: xAI Grok Voice handles the calling and the voice. Claude still does the thinking."
  - The whole voice service is hosted on AWS. Recruiters and hiring teams use it.
  - Premium usually means a more natural voice, at a higher cost per call.
cards:
  - q: What is the difference between the standard and premium voice?
    a: "Standard uses Google Cloud Speech-to-Text and Text-to-Speech for listening and speaking. Premium uses xAI Grok Voice for the calling and the voice. In both, Claude decides what to say."
  - q: Who uses the voice agent?
    a: Recruiters and hiring teams. The AI agent calls candidates and collects their basic details.
  - q: Where is the voice service hosted?
    a: On AWS. It only uses Google Cloud for the speech services in the standard voice.
  - q: Why offer a premium voice at all?
    a: Some customers want a more natural-sounding voice and accept a higher cost per call. Others want the cheaper standard option.
  - q: How do you add a second voice provider without rewriting the agent?
    a: "Put the voice part behind one shared interface. The call logic talks to the interface, not to Google or Grok directly. [FILL IN: confirm how you did it]"
---

## 💡 What is it?

The AI voice agent phones candidates for recruiters. It can talk in two ways: a **standard** voice and a **premium** voice.

- **Standard voice:** Google Cloud Speech-to-Text and Text-to-Speech.
- **Premium voice:** xAI Grok Voice handles the calling and the voice.

**Claude is the brain in both.** It decides what to say. Grok only changes how the call sounds. The whole service runs on AWS.

## 🏠 Real-life example

Think of a **school announcement system**.

The normal speaker works fine and costs little. For the annual day, the school hires a **professional announcer**. The voice is nicer, but it costs more.

- The **normal speaker** = the standard voice (Google speech services).
- The **professional announcer** = the premium voice (xAI Grok Voice).
- The **script writer** = Claude. The same person writes what to say, whoever reads it out.
- **Choosing the announcer** = a customer choosing premium.

## 🧩 The problem

The first version of the voice agent used Google Cloud speech services for listening and speaking. Claude was the brain that decided what to say.

Some recruiters and hiring teams want the call to sound as natural as possible. A natural voice makes candidates more comfortable on the phone.

[FILL IN: what made you add a premium option — a customer request, a product decision, or call quality feedback?]

## 🛠️ What I built

A **premium voice option** using **xAI Grok Voice**. For premium calls, Grok handles the calling and the voice instead of Google's speech services. **Claude still decides what to say.**

```text
Standard call:  Twilio ⇄ Google STT → Claude (thinking) → Google TTS ⇄ Twilio
Premium call:   xAI Grok Voice (calling + voice) ⇄ Claude (thinking)
```

[FILL IN: confirm whether Twilio is still used for the phone line in premium calls, or Grok places the call itself.]

**How this usually works (general idea):**
- The call logic does not talk to a provider directly. It talks to a small **voice interface**, like `listen()` and `speak()`.
- Each provider (Google or Grok) has its own adapter behind that interface.
- A setting on the customer or the call decides which adapter to use.

[FILL IN: how a customer gets premium — a plan feature, a setting, or per call?]
[FILL IN: how you switched between the two providers in code.]

## 🧗 The hard part

**How this usually goes:** two voice providers work in different ways. They send audio in different formats and speeds. The hard part is making both feel the same to the rest of the agent. Timing matters a lot on a phone call. A long pause feels broken to the candidate.

[FILL IN: the real hard part for you — audio format, latency, streaming, or something else.]

## 🏆 The result

Recruiters and hiring teams can choose a more natural premium voice. The standard voice stays available as the cheaper option.

[FILL IN: any result you can share — how many customers chose premium, feedback, or the cost difference per call.]

## 🗣️ How to answer in an interview

> "I built an AI voice agent that phones candidates for recruiters and collects their basic details. The standard version uses Twilio for the call, Google Cloud Speech-to-Text and Text-to-Speech for listening and speaking, and Claude to decide what to say. The service is hosted on AWS.
>
> Later I added a premium voice option using xAI Grok Voice. In premium calls, Grok does the calling and the voice, and Claude still does the thinking. Some customers want the call to sound more natural, so premium gives them that at a higher cost.
>
> [FILL IN: how a customer chooses premium, and how you kept the two providers behind one interface.]
>
> The hard part was [FILL IN: the real hard part]. The result is that customers can pick the voice quality they need."

## 🔁 Follow-up questions

### Why not use the premium voice for everyone?

It costs more per call. Many calls only collect basic details, and the standard voice is good enough for them. Two options let each customer choose. [FILL IN: the real cost difference, if you know it.]

### How do you switch providers without breaking the call flow?

The standard approach is an adapter pattern. The call logic uses one interface. Each provider has its own adapter behind it. [FILL IN: confirm how you did it.]

### What happens if the premium provider fails during a call?

A common approach is a fallback: switch to the standard voice, or end the call politely and retry later. [FILL IN: what your agent does.]

### How do you measure voice quality?

Common signals are call completion rate, how often candidates hang up early, and recruiter feedback. [FILL IN: what you measured, if anything.]

## 📚 Topics to revise

- [The voice agent microservice](topic:resume/voice-agent-microservice)
- [The voice state machine](topic:resume/voice-state-machine)
- [Build vs buy for the voice stack](topic:resume/build-vs-buy)
- [Voice AI basics](topic:ai/voice-ai)
- [Streams in Node.js](topic:nodejs/streams)
