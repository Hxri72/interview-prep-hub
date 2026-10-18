---
template: story
title: "Voice agent: the LLM-driven phase-based state machine"
stack: resume
order: 8
level: Advanced
mustKnow: true
askedFrequency: common
summary:
  - The voice agent's call is built as a phase-based state machine — clear phases, and clear rules for moving between them.
  - Claude (the LLM) writes the words inside a phase; the code decides which phase is allowed next.
  - This keeps the call predictable, easier to test and easier to debug than one free-form prompt.
  - "A real fix of mine: the agent took a 2–3 second pause as the end of a turn and interrupted candidates. I raised the wait to about 5–7 seconds."
  - "Be ready to name every phase and say what moves the call forward. [FILL IN the real phases.]"
cards:
  - q: What is a state machine?
    a: A design with a fixed set of states (phases) and rules that say which state comes next and what event causes the move. Only one state is active at a time.
  - q: Why use a state machine for an AI phone call?
    a: It keeps the call on track. The LLM handles natural language inside a phase, while the code controls the order — so it's predictable, testable and easy to debug.
  - q: Which LLM drives the conversation?
    a: Claude, in the standard voice setup. Speech-to-text and text-to-speech are separate services.
  - q: What were the phases, and what moves the call forward?
    a: "[FILL IN: e.g. greeting → consent → questions → candidate's questions → wrap-up, and what moves each one.]"
  - q: What state-machine problems did you debug?
    a: Calls that connected but the agent didn't reply, and the agent interrupting candidates too early. I traced the state changes in CloudWatch and the service logs, and raised the end-of-turn wait from 2–3 to 5–7 seconds.
  - q: How does the LLM fit with the state machine?
    a: "Each turn, the code sends Claude the current phase's instructions and the conversation so far; Claude replies and signals if the phase goal is met; the code checks that and moves to the next allowed phase. [FILL IN: confirm your design.]"
---

## 💡 What is it?

In the [AI voice agent](topic:resume/voice-agent-microservice), the call is built as a **phase-based state machine**.

A **state machine** is a way to design a process. It has a fixed list of **states**, which here are the **phases** of the call. It also has clear **rules** for moving from one phase to the next. Only one phase is active at a time.

**Claude** is the LLM (a large language model, an AI that writes text). It speaks naturally inside each phase. The **state machine** decides which phase comes next.

## 🏠 Real-life example

Think of a **board game, like Snakes and Ladders, but for a phone call**.

- Each **square** = a phase (for example "greeting" or "questions").
- The **game rules** = the transitions. You can only move to certain squares next.
- The **dice roll** = an event, like "the candidate finished answering".
- The **player who talks** = Claude. It can say anything, but it must follow the board.
- Without a board, the player could wander anywhere. That's a free-form AI chat, which is unpredictable.

## 🧩 The problem

An AI phone call must collect certain details, in a sensible order. It must also always end properly.

If you give an LLM one big prompt and let it run, it may skip questions, repeat itself, go off-topic, or never end the call.

## 🛠️ What I built

**The call as phases:**

```text
          start
            │
            ▼
   [FILL IN: phase 1] ──(event)──► [FILL IN: phase 2] ──(event)──► … ──► [FILL IN: final phase] ──► end call
```

**How each turn usually works in this design:**
1. The code knows the **current phase**.
2. It sends Claude that phase's instructions plus the conversation so far.
3. Claude replies with what to say, and signals whether the phase goal is done, often as **structured output** (JSON).
4. The code **checks** the signal and moves to the next **allowed** phase.
5. The reply goes to text-to-speech and is played to the candidate.

[FILL IN: the real list of phases.]
[FILL IN: what moves each phase forward — an answer, a time limit, a number of questions, a signal from Claude?]
[FILL IN: confirm steps 1–5 match your design.]
[FILL IN: where the call's state is kept during a call, and what happens if the service restarts.]

**Turn-taking inside each phase.** The flow also tracks **who is talking right now**:

| Turn state | What the service does next |
|---|---|
| Candidate is speaking | Listen and wait. Don't reply yet. |
| Candidate has finished | Turn the speech into text and ask Claude for a reply. |
| Agent is speaking | Play the reply. Watch for the candidate interrupting. |

**Voice activity detection** (VAD) helps here. It is code that notices when someone is speaking and when they stop. The service logs the timing of each stage, so you can see where a call slows down.

## 🧗 The hard part

**Deciding when the candidate has finished speaking.** Some candidates pause to think. The agent took a pause of about **2–3 seconds** as the end of their turn. So it started talking and **interrupted** them.

What I did:
1. I made test calls myself and watched the voice service's logs and **AWS CloudWatch** (AWS's log service).
2. I followed each stage: candidate speaking → transcription → Claude's reply → agent speaking.
3. I raised the wait to about **5–7 seconds**, so candidates had time to continue.
4. I tested with more calls and checked the logs again.

**Another problem:** some calls **connected, but the agent never replied**. I traced the logs, the settings and the state changes to find where the call got stuck. [FILL IN: what the cause and fix were.]

We also discussed how to handle long silence. [FILL IN: what was decided.]

## 🏆 The result

- Every call follows the same steps, so recruiters get the same details for every candidate.
- When a call goes wrong, you can see exactly which phase it was in.
- Adding or changing a question means changing one phase, not rewriting a giant prompt.

- Logging each stage's timing helped me find exactly where the interruptions came from.
- After the wait change, the agent interrupted candidates less.

## 🗣️ How to answer in an interview

> "In the AI voice agent, the conversation is a phase-based state machine. A state machine has fixed states and clear rules for moving between them. A free-form prompt can skip steps or go off-topic, so fixed phases keep the call on track.
>
> The call has these phases: [FILL IN: your phases]. On each turn, the code sends Claude the current phase's instructions and the conversation so far. Claude replies, and signals whether that phase's goal is met. The code checks that signal and moves to the next allowed phase. So Claude handles the natural language, but the code controls the flow.
>
> The flow also tracks turn-taking: whether the candidate is speaking, has finished, or the agent is speaking. Voice activity detection helps decide when to transcribe, when to wait and when to reply.
>
> One real problem I fixed: the agent treated a 2–3 second pause as the end of the candidate's turn, so it interrupted people who were thinking. I traced it in CloudWatch and the service logs, raised the wait to about 5–7 seconds, and tested with more calls. Because every stage is separate and logged, it was easy to see where the problem was."

## 🔁 Follow-up questions

### What is a state machine, and why use one here?

Defined states and transitions, with one active state at a time. It gives a predictable call flow, and makes testing and debugging easier.

### What were the phases, and what moves the call forward?

Name each phase and the event or answer that moves it. [FILL IN: real phases and triggers.]

### Why not just reply as soon as the candidate stops talking?

People pause to think. A short wait makes the agent interrupt them. A long wait makes the call feel slow. I found 2–3 seconds was too short, and moved it to about 5–7 seconds. It is a trade-off between speed and politeness.

### How did you debug a call where the agent didn't reply?

I made test calls and followed the logs stage by stage: speech received, transcribed, sent to Claude, reply spoken. The stage where the log stopped showed where the call got stuck. [FILL IN: what the cause was.]

### How is this similar to LangGraph or agent frameworks?

LangGraph models an agent as a graph of steps (nodes) with saved state and rules for the next step (edges). A phase-based state machine is the same idea, written by hand. Mention this — it links your real work to modern agent design.

### How do you test a state machine like this?

Unit-test each transition with fake LLM replies: "in phase X, given signal Y, we move to Z". Then add a few end-to-end test calls. [FILL IN: what you did.]

### What if the LLM returns something invalid?

Check the structured output against a schema. If it fails, retry once, then fall back to a safe default, like repeating the question or moving to wrap-up. [FILL IN: what you did.]

## 📚 Topics to revise

- [Voice agent story](topic:resume/voice-agent-microservice)
- [State machines in backend design](topic:architecture/state-machines)
- [Structured outputs](topic:ai/structured-outputs) and [tool calling](topic:ai/tool-calling)
- [Voice AI](topic:ai/voice-ai)
