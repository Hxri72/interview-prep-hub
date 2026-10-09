---
template: story
title: "AI voice agent: calling candidates for recruiters"
stack: resume
order: 7
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - My recent project — a separate service where an AI agent phones candidates automatically and collects their basic details.
  - "No recruiter needed: when a candidate is eligible after scoring, the agent calls them. The recording is saved in S3, then AI evaluates and scores the call, and recruiters just review the results."
  - "Standard voice: Twilio for the phone call, Google Cloud Speech-to-Text and Text-to-Speech, and Claude as the AI brain."
  - Premium voice uses xAI Grok Voice for the voice only; Claude still does the thinking. The whole service is hosted on AWS.
  - "Time saved is an estimate: a manual first call takes about 10–15 minutes, and up to 20 for longer HR calls."
cards:
  - q: What does the voice agent do?
    a: When a candidate is eligible after scoring, the agent phones them automatically, talks with an AI voice and collects basic details. The recording goes to S3, and AI evaluates and scores the call. Recruiters only review the results.
  - q: Walk me through one call.
    a: "Twilio places the call → the candidate's speech becomes text (Google Speech-to-Text) → Claude decides the reply, following the phases of the call → the reply becomes speech (Google Text-to-Speech) → Twilio plays it. Repeat until the call ends."
  - q: What is the difference between standard and premium voice?
    a: Standard uses Google Cloud speech-to-text and text-to-speech. Premium uses xAI Grok Voice for the calling and voice, for a more natural sound, at a higher cost. Claude does the thinking in both.
  - q: Where is it hosted?
    a: On AWS, as a separate service in its own repository. It uses Google Cloud only for the speech services.
  - q: How much time does it save?
    a: An estimate — a recruiter's manual first call takes about 10–15 minutes, up to 20 for longer HR calls. It wasn't measured in a formal study.
---

## 💡 What is it?

This is **my most recent project**. It is an **AI voice agent**.

It works **without a recruiter**. First, candidates are scored. When a candidate is **eligible after scoring**, the agent **phones them automatically**. It talks with a natural AI voice and **collects basic details**. For example: experience, notice period, interest in the job. [FILL IN: the real details it collects.]

After the call, the **recording is saved in S3** (AWS file storage). Then **AI evaluates the call and gives it a score**. Recruiters only look at the results.

**Recruiters and hiring teams** use it. It runs as a **separate service** in its own repository, **hosted on AWS**.

## 🏠 Real-life example

Think of a **school receptionist who makes calls for the teachers**.

- The **teachers** = recruiters. They are busy.
- The **exam marks** = the candidate's score. Only students who pass get a call.
- The **receptionist** = the AI agent. It calls each eligible parent with the same set of questions, without waiting for a teacher to ask.
- The **phone line** = Twilio.
- The receptionist's **ears** = speech-to-text (turns speech into words).
- The receptionist's **brain** = Claude (the AI that decides what to say next).
- The receptionist's **voice** = text-to-speech.
- A **checklist of questions in order** = the phases of the call (the state machine).
- The receptionist **records every call in a file cabinet** = the recording saved in S3.
- A **senior teacher listens and gives marks** = AI evaluates and scores the call.
- The teacher only **reads the marks** = the recruiter reviews the results.

## 🧩 The problem

The **first screening call** is repetitive. A recruiter asks every candidate the same basic questions.

A manual call takes about **10–15 minutes**. A longer HR call can take **20 minutes**. With many candidates, that is hours of a recruiter's day.

## 🛠️ What I built

**When a call starts:** candidates are scored first. Each candidate who is **eligible after scoring** gets a call automatically. No recruiter clicks anything.

**Standard voice:**

```text
Candidate is eligible after scoring  ──►  agent starts the call
   │
   ▼
Twilio phone call
   │  candidate speaks
   ▼
Google Cloud Speech-to-Text  ──►  text
   │
   ▼
Claude (LLM) ── follows the phases of the call (state machine) ──► reply text
   │
   ▼
Google Cloud Text-to-Speech  ──►  audio
   │
   ▼
Twilio plays the audio to the candidate  ──►  repeat until the call ends
   │
   ▼
Call recording saved in S3
   │
   ▼
AI evaluates the call and scores it  ──►  recruiter reviews the result
```

**Premium voice:** the same flow, but **xAI Grok Voice** handles the calling and the voice instead of Google's speech services. **Claude still does the thinking.** See [Grok premium voice](topic:resume/grok-voice-premium).

**The call flow** is a phase-based state machine. See [the state machine story](topic:resume/voice-state-machine).

**Hosting:** a separate service on **AWS**. [FILL IN: which AWS services — ECS, EC2, Lambda?]
[FILL IN: how audio flows with Twilio — Media Streams over WebSocket, or Gather/Say?]
[FILL IN: how the recruiter sees the score and recording — in the SkillKeepr admin portal?]
[FILL IN: what the AI evaluation checks, and which model scores the call.]

:::warning[Fix your resume wording]
Your resume says "a standalone microservice on GCP". It is **hosted on AWS** and **uses Google Cloud's speech services**. Update the line so it matches.
:::

## 🧗 The hard part

**Speed (latency).** In a phone call, a pause of even 1–2 seconds feels awkward. Each turn goes through speech-to-text, the LLM and text-to-speech. Each step adds time.

**How this is usually made faster:** streaming the audio instead of waiting for full sentences, keeping the LLM prompt short, and keeping connections open.

[FILL IN: what you did about latency, and the rough time per turn if you know it.]
[FILL IN: how you handled interruptions, silence or bad audio.]

## 🏆 The result

- Recruiters don't make the first screening call themselves. Calls start automatically for eligible candidates.
- Every call is recorded in S3 and scored by AI, so recruiters only review results.
- **Estimated** time saved per candidate: **10–15 minutes**, up to **20** for longer HR calls. This is based on how long a manual call takes. It was not measured in a formal study.
- There are two voice options, standard and premium, so customers can choose quality vs cost.

[FILL IN: number of calls made or customers using it, if you know.]

## 🗣️ How to answer in an interview

> "My most recent project is an AI voice agent. It phones candidates automatically and collects their basic details, so recruiters don't spend time on the first screening call. There's no recruiter in the loop: when a candidate is eligible after scoring, the agent calls them.
>
> It's a separate service, hosted on AWS. A call works like this: Twilio handles the phone call, Google Cloud Speech-to-Text turns the candidate's speech into text, and Claude decides what to say next. Claude follows a phase-based state machine, so the call always moves through the same steps. Then Google Text-to-Speech turns the reply into audio, and Twilio plays it. After the call, the recording is stored in S3, and AI evaluates and scores it. The recruiter just reviews the score.
>
> We also have a premium option that uses xAI Grok Voice for the calling and voice, for a more natural sound. Claude still does the thinking in both versions.
>
> The hardest part is latency. Any delay in a phone call feels awkward. [FILL IN: what you did about it.] A manual first call usually takes a recruiter 10 to 15 minutes, and up to 20 for longer HR calls, so the estimated saving is that much per candidate."

**If they ask "did you measure that?"** — answer honestly: "It's an estimate based on how long recruiters' manual calls take. We didn't run a formal measurement."

## 🔁 Follow-up questions

### Why a separate service instead of adding it to the main platform?

Voice calls behave differently: they are long-running, real-time and sensitive to delay. A separate service can be deployed, scaled and fixed on its own, and a problem there doesn't break the main platform. [FILL IN: your real reasons.]

### Why Claude as the LLM?

[FILL IN: your real reason — quality of conversation, following instructions, cost?] Keep it honest.

### What happens if the candidate interrupts or stays silent?

[FILL IN: what your agent does.] Common approaches: stop speaking when the candidate talks ("barge-in"), and after some seconds of silence, repeat the question or move on.

### What happens if Google's speech service or the LLM fails in the middle of a call?

[FILL IN: what you did.] Common approaches: retry once, play a polite message, end the call and mark it for a recruiter to follow up.

### How do you keep it cheap?

Short prompts, short replies, ending the call when the details are collected, and offering the premium voice only to customers who pay for it.

## 📚 Topics to revise

- [The voice state machine](topic:resume/voice-state-machine)
- [Grok premium voice](topic:resume/grok-voice-premium)
- [Voice AI: speech-to-text and text-to-speech](topic:ai/voice-ai)
- [Microservices](topic:architecture/microservices)
- [Streams in Node.js](topic:nodejs/streams)
