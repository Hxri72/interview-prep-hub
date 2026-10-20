---
template: chapter
title: "The AI screening call (voice agent)"
stack: skillkeepr-story
order: 9
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "My project: an AI agent phones candidates and asks the first screening questions, so recruiters don't have to."
  - "A call starts in two ways: a recruiter clicks to start it, or it starts by itself for candidates who are eligible after scoring."
  - "Standard voice: Twilio + Google speech-to-text and text-to-speech, with Claude doing the thinking. Premium voice: Grok handles only the voice; Claude still thinks."
  - "A phase-based state machine keeps the call in order. The recording goes to S3, and AI scores the call."
  - "My fix: the agent cut candidates off, so I raised the end-of-turn wait from about 2–3 s to about 5–7 s and checked it in the logs."
cards:
  - q: How does a screening call start?
    a: Either a recruiter starts it from SkillKeepr, or it starts automatically for a candidate who is eligible after scoring.
  - q: What does each part of the standard voice do?
    a: Twilio handles the phone line, Google speech-to-text turns speech into text, Claude decides what to say, and Google text-to-speech speaks the reply.
  - q: What changes in the premium voice?
    a: xAI Grok handles the voice instead of Google's speech services. Claude still does all the thinking.
  - q: What was the turn-taking bug and fix?
    a: The agent treated a short pause as the end of the candidate's answer and interrupted. I raised the wait from about 2–3 seconds to about 5–7 seconds, tested with calls and checked the logs.
  - q: Why build it instead of buying?
    a: The team used Retell AI first, and cost became a concern. I researched Twilio + Google speech + an LLM and estimated about 65% lower cost. It's an estimate, not a measured number.
---

## 💡 What happens in this chapter

Priya at **Acme Hiring** has 200 applicants for one job. Calling each one would take her days.

So the **AI voice agent** phones the candidates. It asks basic questions, like experience and notice period. Then it saves the call, and AI gives it a score.

This is **my project**. It runs as its own small service, separate from the main platform.

## 🏠 Real-life example

Think of a **school phone tree** before a trip.

- The **class teacher** = Priya. She is too busy to call every parent.
- The **helper who calls each parent** = the AI agent.
- The **list of questions in order** (attending? allergies? pickup time?) = the phases of the call.
- The helper **waits politely** until the parent finishes speaking = the end-of-turn wait.
- The **notebook of answers** given to the teacher = the recording and the AI score.

If the helper interrupts every time a parent pauses, parents get annoyed. That was exactly the bug I fixed.

## 🗺️ The flow

```text
Candidate scored ─► eligible?  ──or──  Priya clicks "Start AI call"
        │
        ▼
Main backend (Node.js) ──HTTP──► Voice service (Python, FastAPI, on AWS)
                                        │
                                        ▼
                                   Twilio calls Rahul's phone
                                        │
            ┌───────────── one turn of the conversation ─────────────┐
            │ Rahul speaks → speech-to-text → Claude decides reply    │
            │ (inside the current phase) → text-to-speech → Rahul hears│
            └──────── repeat until the last phase ends ───────────────┘
                                        │
                                        ▼
                     Recording saved in S3 → AI evaluates and scores the call
                                        │
Voice service ──HTTP callback──► Main backend (transcript + recording info)
                                        │
                                        ▼
                     Priya sees the score and listens if she wants
```

## 🧱 Tech used

| Piece | Technology | Learn it |
|---|---|---|
| The voice service | Python + FastAPI, separate from the Node backend | [Microservices](topic:architecture/microservices) |
| Phone call | Twilio | [Voice AI pipelines](topic:ai/voice-ai) |
| Listening and speaking | Google Cloud Speech-to-Text and Text-to-Speech (standard) | [Voice AI pipelines](topic:ai/voice-ai) |
| Premium voice | xAI Grok (voice only) | [Grok premium voice](topic:resume/grok-voice-premium) |
| Thinking | Claude, guided by the current phase | [Calling an LLM API](topic:ai/calling-llm-api) |
| Call order | A phase-based state machine | [State machines](topic:architecture/state-machines) |
| Talking to the main backend | HTTP to start a call, HTTP callback with results | [Webhooks](topic:rest-auth/webhooks) |
| Recordings | Amazon S3 | [AWS basics](topic:devops/aws-basics) |
| Debugging | AWS CloudWatch and service logs | [Logging, monitoring and alerts](topic:devops/monitoring-alerts) |

## 🧑‍💻 Key code idea

A tiny phase machine with an **end-of-turn timer**. Every time new words arrive, the timer restarts. The turn only ends after enough silence.

Save as `call.js` and run `node call.js`. (The phase names here are examples, not the real ones.)

```js
const PHASES = ['greeting', 'questions', 'wrapUp', 'ended'];   // example phase names (the real ones are different)
const WAIT_MS = 600;                                            // end-of-turn wait; real calls used ~5–7 s, here 0.6 s so the demo is quick
let phase = 0;                                                  // index into PHASES: 0 = greeting
let silenceTimer = null;                                        // timer that decides "the candidate finished talking"
let heard = '';                                                 // words heard in the current turn

function say(text) {                                            // the agent speaks (text-to-speech in the real call)
  console.log(`[${PHASES[phase]}] Agent: ${text}`);             // print the phase and what the agent says
}                                                               // end of say

function endOfTurn() {                                          // runs only after WAIT_MS of silence
  console.log(`  (turn ended) Rahul said: "${heard.trim()}"`); // show the full answer we collected
  heard = '';                                                   // clear it for the next turn
  phase = Math.min(phase + 1, PHASES.length - 1);               // move to the next phase, never past "ended"
  if (PHASES[phase] === 'questions') say('How many years of experience do you have?'); // next question
  if (PHASES[phase] === 'wrapUp') say('Thank you, Rahul. A recruiter will contact you.'); // closing line
  if (PHASES[phase] === 'wrapUp') setTimeout(() => { phase = 3; say('(call ended)'); }, 50); // hang up shortly after
}                                                               // end of endOfTurn

function onSpeech(words) {                                      // speech-to-text sends a few words at a time
  heard += words + ' ';                                         // add them to this turn
  clearTimeout(silenceTimer);                                   // the candidate is still talking → reset the timer
  silenceTimer = setTimeout(endOfTurn, WAIT_MS);                // start counting silence again
}                                                               // end of onSpeech

say('Hi Rahul, this is the Acme Hiring assistant. Is now a good time?'); // phase 1: greeting
setTimeout(() => onSpeech('Yes,'), 100);                        // Rahul starts answering
setTimeout(() => onSpeech('go ahead.'), 400);                   // a short pause (300 ms) — NOT the end of his turn
setTimeout(() => onSpeech('About three years,'), 1300);         // answer to the experience question
setTimeout(() => onSpeech('mostly Node and React.'), 1700);     // he pauses, then continues the same answer
```

```text
[greeting] Agent: Hi Rahul, this is the Acme Hiring assistant. Is now a good time?
  (turn ended) Rahul said: "Yes, go ahead."
[questions] Agent: How many years of experience do you have?
  (turn ended) Rahul said: "About three years, mostly Node and React."
[wrapUp] Agent: Thank you, Rahul. A recruiter will contact you.
[ended] Agent: (call ended)
```

The short pauses (300 ms and 400 ms) did **not** end the turn. If `WAIT_MS` were 200, the agent would have interrupted Rahul mid-answer.

## 🧗 Hard parts and trade-offs

- **When has the person finished?** Too short a wait → the agent interrupts. Too long → the call feels slow. I chose a longer wait, because interrupting felt worse to candidates.
- **Speed (latency).** Each turn goes through speech-to-text, the LLM and text-to-speech. Every step adds delay. [FILL IN: what else you did for latency, if anything]
- **Calls that connect but the agent stays silent.** These are hard to spot. I traced them through CloudWatch and the voice-service logs.
- **Keeping the LLM on track.** Claude is free to talk, so the code controls the phases. The LLM only decides the reply inside the current phase.
- **Cost vs control.** A managed product (Retell AI) is quick to start but cost more for us. Building our own gave control and an estimated ~65% lower cost, but we own the bugs.

## 🙋 My part

- I built this voice agent as a **separate Python FastAPI service on AWS**.
- Standard voice uses **Twilio + Google Cloud speech-to-text/text-to-speech + Claude**. I added a **premium option with xAI Grok** for the voice, while Claude still thinks.
- I researched the build-vs-buy question after **Retell AI** cost became a concern. I presented cost and feasibility, then built it. I **estimated** about **65%** lower cost.
- I fixed the **turn-taking bug**: I raised the end-of-turn wait from about **2–3 s to 5–7 s**, tested with calls, and checked the logs.
- Calls have **levels**: basic (experience, notice period, visa/sponsorship; about 5–10 minutes) and intermediate (skills and past work; longer).
- The time saved is an **estimate**: a manual call takes 10–15 minutes, up to 20 for HR calls.
- Phase names and latency numbers: [FILL IN: the real phase names and rough time per turn]

## 🗣️ How to explain it in an interview

> "My most recent project is an AI voice agent for our hiring platform. It phones candidates and asks the first screening questions. A recruiter can start a call, or it starts automatically when a candidate is eligible after scoring.
>
> It's a separate Python FastAPI service on AWS. The Node backend calls it over HTTP, and it calls back with the transcript and recording. Twilio handles the phone line, Google speech-to-text and text-to-speech handle listening and speaking, and Claude decides what to say. A phase-based state machine keeps the call in order. For a premium option, Grok handles the voice, but Claude still does the thinking.
>
> After the call, the recording goes to S3 and AI scores it. One real problem I fixed was turn-taking: the agent interrupted candidates during short pauses. I raised the end-of-turn wait from about two or three seconds to five to seven, tested with real calls and checked CloudWatch logs.
>
> We built it because our managed provider was getting expensive. I estimated about 65% lower cost, and I'm clear that it's an estimate."

## 🔁 Follow-up questions

### Why a separate service instead of adding it to the main backend?

Voice calls are long, real-time and sensitive to delay. A separate service can be deployed and scaled on its own, and a crash there doesn't take down the main platform. It also let us use Python for the voice libraries.

### How does the main backend know the call has finished?

The voice service sends an HTTP callback with the transcript and recording info. The main backend saves it and shows the score to the recruiter.

### Why is Claude not allowed to control the whole call?

LLMs can wander off topic. The state machine decides which phase we're in. Claude only writes the reply inside that phase, so every call covers the same questions.

### How did you confirm the turn-taking fix worked?

I made test calls with natural pauses, then checked CloudWatch and the voice-service logs to see when each turn ended. [FILL IN: any before/after numbers you have]

### Did you measure the 65% saving?

No. It was an estimate from my cost research, and I say that clearly.

## 📚 Topics to revise

- [AI voice agent microservice](topic:resume/voice-agent-microservice)
- [The voice state machine](topic:resume/voice-state-machine)
- [Grok premium voice](topic:resume/grok-voice-premium)
- [Build vs buy for the voice stack](topic:resume/build-vs-buy)
- [Voice AI: STT, TTS and real-time pipelines](topic:ai/voice-ai)
- [State machines in backend design](topic:architecture/state-machines)
- [Microservices](topic:architecture/microservices)
- [Latency and cost of AI in production](topic:ai/cost-latency)
