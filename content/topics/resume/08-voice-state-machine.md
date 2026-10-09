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

## 🧗 The hard part

Usual hard parts:
- **Deciding when a phase is "done".** The LLM's judgement must be checked by code, not trusted blindly.
- **Off-script candidates.** People ask questions, go silent or interrupt. You need rules for these cases.
- **Keeping the phases written down in one place,** so the code, the prompts and the team all agree.

[FILL IN: your hardest part, and what you did.]

## 🏆 The result

- Every call follows the same steps, so recruiters get the same details for every candidate.
- When a call goes wrong, you can see exactly which phase it was in.
- Adding or changing a question means changing one phase, not rewriting a giant prompt.

[FILL IN: benefits you really saw — fewer broken calls, easier debugging?]

## 🗣️ How to answer in an interview

> "In the AI voice agent, the conversation is a phase-based state machine. A state machine has fixed states and clear rules for moving between them. A free-form prompt can skip steps or go off-topic, so fixed phases keep the call on track.
>
> The call has these phases: [FILL IN: your phases]. On each turn, the code sends Claude the current phase's instructions and the conversation so far. Claude replies, and signals whether that phase's goal is met. The code checks that signal and moves to the next allowed phase. So Claude handles the natural language, but the code controls the flow.
>
> [FILL IN: one real benefit you saw — e.g. easier testing, or seeing exactly which phase caused a problem.]
>
> [FILL IN: one hard case you handled, like interruptions or long silence.]"

## 🔁 Follow-up questions

### What is a state machine, and why use one here?

Defined states and transitions, with one active state at a time. It gives a predictable call flow, and makes testing and debugging easier.

### What were the phases, and what moves the call forward?

Name each phase and the event or answer that moves it. [FILL IN: real phases and triggers.]

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
