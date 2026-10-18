---
template: story
title: "AI voice agent: calling candidates for recruiters"
stack: resume
order: 7
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - My recent project — a separate voice service where an AI agent phones candidates and collects their basic details.
  - "Calls start in two ways: a recruiter starts one from SkillKeepr, or the agent calls eligible candidates automatically after scoring. The recording goes to S3, and AI scores the call."
  - "Standard voice: Twilio for the phone call, Google Cloud Speech-to-Text and Text-to-Speech, and Claude as the AI brain. The voice service is written in Python (FastAPI) and hosted on AWS."
  - We first used Retell AI. Cost became a concern, so I researched our own pipeline, proposed it, and built it. The saving of about 65% is my estimate.
  - "My hard part: the agent interrupted candidates. I raised the end-of-turn wait from about 2–3 seconds to 5–7 seconds and checked the result in the logs."
cards:
  - q: What does the voice agent do?
    a: It phones candidates, talks with an AI voice and collects basic details. A recruiter can start a call, or it calls eligible candidates automatically. AI then scores the call, and recruiters review the result.
  - q: Walk me through one call.
    a: "The main backend asks the voice service to start a call → Twilio calls the candidate → Google Speech-to-Text turns speech into text → Claude decides the reply → Google Text-to-Speech speaks it → repeat. At the end, the service sends the transcript and recording details back to the main backend."
  - q: Why did you build it instead of using Retell AI?
    a: Retell AI was getting costly. I compared it with Twilio + Google speech + an LLM, presented cost and feasibility, and the team asked me to build it. I estimated about 65% lower cost.
  - q: What was a real problem you fixed?
    a: The agent took a short pause as the end of the candidate's answer and interrupted them. I raised the wait from about 2–3 seconds to 5–7 seconds, tested with calls, and checked CloudWatch logs.
  - q: How much time does it save?
    a: An estimate — a recruiter's manual first call takes about 10–15 minutes, up to 20 for longer HR calls. It wasn't measured in a formal study.
---

## 💡 What is it?

This is **my most recent project**. It is an **AI voice agent** that phones candidates for recruiters.

A call can start in **two ways**:
- A **recruiter starts the call** from SkillKeepr.
- The agent calls a candidate **automatically** when the candidate is **eligible after scoring**.

On the call, the agent talks with a natural AI voice and **collects basic details**, like experience and notice period. After the call, the **recording is saved in S3** (AWS file storage). Then **AI scores the call**, and recruiters look at the results.

It is a **separate service** (a [microservice](topic:architecture/microservices): a small app that does one job), written in **Python with FastAPI** (a Python framework for building APIs). It is **hosted on AWS**. The main SkillKeepr backend is Node.js.

## 🏠 Real-life example

Think of a **school receptionist who makes calls for the teachers**.

- The **teachers** = recruiters. They are busy.
- A **teacher says "call this parent"** = a recruiter starts a call.
- The **exam marks** = the candidate's score. Students who pass get a call without anyone asking.
- The **receptionist** = the AI agent. It asks each parent the same set of questions.
- The **phone line** = Twilio.
- The receptionist's **ears** = speech-to-text (turns speech into words).
- The receptionist's **brain** = Claude (the AI that decides what to say next).
- The receptionist's **voice** = text-to-speech.
- A **checklist of questions in order** = the phases of the call (the state machine).
- The receptionist **files every call recording** = the recording saved in S3.
- A **senior teacher gives marks** = AI scores the call.

## 🧩 The problem

The **first screening call** is repetitive. A recruiter asks every candidate the same basic questions.

A manual call takes about **10–15 minutes**. A longer HR call can take **20 minutes**. With many candidates, that is hours of a recruiter's day.

At first, SkillKeepr used **Retell AI**, a ready-made voice-AI product. It worked, but **cost became a concern**. So we needed a cheaper way to run the calls. See [the build-vs-buy story](topic:resume/build-vs-buy).

## 🛠️ What I built

**1. The research and proposal.** I researched a replacement for Retell AI: Twilio for the phone line, Google Cloud for speech, and an LLM for the conversation. I presented the cost and feasibility to the team. The team then asked me to build it as a separate voice service.

**2. How the main backend and the voice service talk:**

```text
Main SkillKeepr backend (Node.js)
   │  HTTP request: "start a call" + the interview settings
   ▼
Voice service (Python, FastAPI)
   │  runs the call with Twilio, Google speech and Claude
   │  saves the recording in S3
   ▼
HTTP callback to the main backend: transcript + recording details
```

A **callback** here means the voice service calls the main backend's API back when the call is done. [FILL IN: the exact network setup between the two services — don't guess.]

**3. One call, step by step (standard voice):**

```text
Call starts (recruiter clicks, or candidate is eligible after scoring)
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
Recording saved in S3  ──►  AI scores the call  ──►  recruiter reviews the result
```

**4. Interview levels.** Each call uses an interview setting with fixed instructions and questions:

| Level | What it asks | About how long |
|---|---|---|
| Basic | Experience, notice period, visa or sponsorship | 5–10 minutes |
| Intermediate | Skills and past experience, in more depth | Longer |

The instructions guide Claude. The conversation flow handles follow-up questions.

**Premium voice:** the same flow, but **xAI Grok Voice** handles the voice instead of Google's speech services. **Claude still does the thinking.** See [Grok premium voice](topic:resume/grok-voice-premium).

**The call flow** is a phase-based state machine. See [the state machine story](topic:resume/voice-state-machine).

[FILL IN: which AWS service runs the voice service — ECS, EC2, Lambda?]
[FILL IN: what the AI evaluation checks, and which model scores the call.]

:::warning[Fix your resume wording]
Your resume says "a standalone microservice on GCP". It is **hosted on AWS** and **uses Google Cloud's speech services**. Update the line so it matches.
:::

## 🧗 The hard part

**Turn-taking: knowing when the candidate has finished.** Some candidates pause to think. The agent took a short pause of about **2–3 seconds** as the end of their answer. Then it started talking and **interrupted** them.

What I did:
1. I tested calls myself and read the logs: **AWS CloudWatch** (AWS's log service) and the voice service's own logs.
2. I followed each stage: candidate speaking, transcription, Claude's reply, the agent speaking.
3. I raised the wait to about **5–7 seconds**, so candidates had time to continue.
4. I tested with more calls and checked the logs again.

We also discussed what to do when a candidate stays silent for a long time.

**Another problem I traced:** some calls **connected, but the agent didn't respond**. I followed the state changes in the logs to find where the call got stuck. [FILL IN: what the cause and fix were.]

[FILL IN: the rough time per turn (latency numbers), if you know them.]

## 🏆 The result

- Recruiters don't make the first screening call themselves.
- Every call is recorded in S3 and scored by AI, so recruiters only review results.
- **Estimated** time saved per candidate: **10–15 minutes**, up to **20** for longer HR calls. This is not measured.
- **Estimated** cost saving compared with Retell AI: about **65%**. This is my estimate, not a measured production number.
- Candidates are interrupted less, because the agent waits longer before replying.

[FILL IN: number of calls made or customers using it, if you know.]

## 🗣️ How to answer in an interview

> "My most recent project is an AI voice agent. It phones candidates and collects their basic details, so recruiters don't spend time on the first screening call. A recruiter can start a call, or the agent calls candidates automatically when they're eligible after scoring.
>
> At first we used Retell AI, but the cost became a concern. I researched an alternative with Twilio, Google Cloud speech services and an LLM. I presented the cost and feasibility to the team, and they asked me to build it. I estimated about a 65% cost saving. That's an estimate, not a measured number.
>
> It's a separate Python FastAPI service on AWS. The main Node.js backend calls it over HTTP to start a call. Twilio handles the phone line. Google Speech-to-Text turns the candidate's speech into text. Claude decides the reply, following a phase-based state machine. Google Text-to-Speech speaks the reply. After the call, the recording goes to S3, and the service sends the transcript and recording details back with an HTTP callback.
>
> One real issue: the agent sometimes interrupted candidates who were pausing to think. It treated a 2–3 second pause as the end of their answer. I checked CloudWatch and the service logs, and raised the wait to about 5–7 seconds. Then I tested with more calls to confirm it."

**If they ask "did you measure that?"** — answer honestly: "The time and cost savings are estimates. We didn't run a formal measurement."

## 🔁 Follow-up questions

### Why did you replace Retell AI? What trade-offs did you consider?

Cost was the main reason. I also weighed the build effort, more control over the call flow, and the cost of maintaining our own service. A ready-made product is faster to start. Our own pipeline costs less per call, but we must maintain it. See [build vs buy](topic:resume/build-vs-buy).

### How does the voice service talk to the main backend?

Over HTTP. The main backend sends a "start call" request with the interview settings. When the call ends, the voice service sends an HTTP callback with the transcript and recording details. I wouldn't guess the internal network setup.

### Why is the voice service in Python, when the main backend is Node.js?

It is a separate service, so it can use its own language. [FILL IN: the real reason Python was chosen — e.g. speech and AI libraries.] Keep it honest.

### What happens if the candidate pauses or stays silent?

The agent waits about 5–7 seconds before deciding the candidate has finished. Before my change, it waited only 2–3 seconds and interrupted people. For long silence, [FILL IN: what the agent does — repeat the question, or move on].

### How did the basic and intermediate interviews differ?

Basic asks about experience, notice period and visa or sponsorship, in about 5–10 minutes. Intermediate goes deeper into skills and past experience, and takes longer. Each level has its own instructions and questions.

### Why a separate service instead of adding it to the main platform?

Voice calls are long-running, real-time and sensitive to delay. A separate service can be deployed, scaled and fixed on its own. A problem there doesn't break the main platform.

## 📚 Topics to revise

- [Build vs buy: replacing Retell AI](topic:resume/build-vs-buy)
- [The voice state machine](topic:resume/voice-state-machine)
- [Grok premium voice](topic:resume/grok-voice-premium)
- [Voice AI: speech-to-text and text-to-speech](topic:ai/voice-ai)
- [Microservices](topic:architecture/microservices)
- [Webhooks and callbacks](topic:rest-auth/webhooks)
