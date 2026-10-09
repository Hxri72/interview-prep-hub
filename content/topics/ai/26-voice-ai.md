---
title: "Voice AI: speech-to-text, text-to-speech and real-time pipelines"
stack: ai
order: 26
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "A voice AI agent runs a loop on every turn: the phone line carries audio → speech-to-text → the LLM decides the reply → text-to-speech → audio plays back."
  - Speed is everything. A pause of more than about a second feels broken on a phone call.
  - Streaming every step (audio in, LLM words, audio out) cuts the silence a lot.
  - Barge-in means the agent stops talking as soon as the person starts speaking.
  - A state machine keeps the call on track — fixed phases like greeting, questions and wrap-up.
cards:
  - q: Name the steps of one turn in a voice AI call.
    a: Phone audio in → speech-to-text turns it into words → the LLM decides the reply → text-to-speech turns the reply into audio → the audio plays to the caller.
  - q: Why is latency so important in voice AI?
    a: On a phone call, even a one-second silence feels awkward or broken. People talk over the agent or hang up.
  - q: How does streaming reduce latency?
    a: Each step starts working on the first pieces instead of waiting for the full result, so the agent can start speaking after the first few words are ready.
  - q: What is barge-in?
    a: When the caller starts talking while the agent is speaking, the agent stops its audio at once and listens.
  - q: Why use a state machine for a voice agent?
    a: It keeps the call moving through fixed phases in order, so the LLM can't wander off-topic, and each phase is easy to test and debug.
---

## 💡 What is it?

**Voice AI** lets an AI hold a **spoken conversation**, often over a phone call.

Every turn of the call goes through a loop:
1. The **phone line** carries the caller's audio.
2. **Speech-to-text (STT)** turns the audio into words.
3. The **LLM** reads the words and decides the reply.
4. **Text-to-speech (TTS)** turns the reply into audio.
5. The audio **plays back** to the caller.

The hard part is **speed**. Every step adds delay, and people notice even short silences on the phone.

## 🏠 Real-life example

Think of a **school quiz with a translator in the middle**.

- The **student's voice** = the caller's audio.
- A helper who **writes down what the student said** = speech-to-text.
- The **quizmaster who thinks of the next question** = the LLM.
- A helper who **reads the question aloud** = text-to-speech.
- The **quiz script** (round 1, round 2, final round) = the state machine with phases.
- If the student **interrupts with "Wait, I know!"**, the reader **stops at once** = barge-in.
- If the writer waits for the student's whole speech before starting, everyone sits in silence = no streaming.

## 🧑‍💻 Code example

A simulator that shows how much silence one turn causes, with and without streaming. The numbers are **made-up but realistic**, to show the idea. Save as `voice.js` and run `node voice.js`.

```js
// voice.js — how long ONE turn of an AI phone call takes, with and without streaming (simulated numbers)
const step = {                                                              // pretend timings in milliseconds (ms)
  endOfSpeech: 500,                                                         // wait to be sure the candidate stopped talking
  sttFull: 400, sttStreamTail: 100,                                         // speech-to-text: whole clip vs. last bit of a live stream
  llmFull: 1800, llmFirstWords: 450,                                        // LLM: full reply vs. first few words when streaming
  ttsFull: 900, ttsFirstAudio: 200,                                         // text-to-speech: whole reply vs. first audio chunk
  network: 150,                                                             // phone network and server hops
};

const noStreaming = step.endOfSpeech + step.sttFull + step.llmFull + step.ttsFull + step.network; // each step waits for the one before to finish fully
const withStreaming = step.endOfSpeech + step.sttStreamTail + step.llmFirstWords + step.ttsFirstAudio + step.network; // start speaking as soon as the first words exist

console.log(`No streaming:   ${noStreaming} ms of silence before the agent speaks`); // the candidate hears silence this long
console.log(`With streaming: ${withStreaming} ms of silence before the agent speaks`); // much shorter pause
console.log(`Saved: ${noStreaming - withStreaming} ms per turn`);              // the difference per question

function onCandidateSpeech(agentIsSpeaking) {                               // barge-in: the candidate talks over the agent
  return agentIsSpeaking ? 'STOP agent audio, listen to the candidate' : 'keep listening'; // never talk over a person
}
console.log('Barge-in:', onCandidateSpeech(true));                          // what happens when they interrupt
```

**Output:**

```text
No streaming:   3750 ms of silence before the agent speaks
With streaming: 1400 ms of silence before the agent speaks
Saved: 2350 ms per turn
Barge-in: STOP agent audio, listen to the candidate
```

**What to notice:** with no streaming, the caller waits almost **4 seconds** every turn. Streaming every step brings it down a lot. The rest of the gap comes from waiting to be sure the person has stopped talking.

## 🔍 Deeper version

**The pipeline in a real system:**

```text
Caller ⇄ phone network ⇄ telephony provider (e.g. Twilio)
                              │ audio stream (e.g. over a WebSocket)
                              ▼
                     speech-to-text (streaming)
                              │ words
                              ▼
            LLM (follows the current phase of the call) ──► reply text (streaming)
                              │
                              ▼
                     text-to-speech (streaming) ──► audio back to the caller
```

**Two design styles:**
- **Cascaded (STT → LLM → TTS)** — separate services for each step. You can pick the best of each, and the text in the middle is easy to log and check. But each step adds delay.
- **Speech-to-speech (voice models)** — one model or service handles listening and speaking in real time, which can sound more natural and react faster. You get less control over each step.

**The latency budget.** Every turn adds up: end-of-speech detection, STT, the LLM's first words, TTS's first audio and network hops. Ways to shrink it:
- **Stream everything**: audio in, LLM [tokens](glossary:token) out, and TTS audio out.
- Start TTS on the **first sentence** while the LLM is still writing the rest.
- Keep **prompts and replies short**. Phone answers should be one or two sentences.
- Keep **connections open** (e.g. a [WebSocket](topic:rest-auth/websockets)) instead of a new HTTP request each turn.
- Host services **close to each other** to cut network hops.

**Turn-taking:**
- **End-of-speech detection** — decide when the caller has finished. Too eager, and you cut them off. Too slow, and there's a long silence.
- **Barge-in** — when the caller speaks, stop the agent's audio at once and listen.
- **Silence handling** — after some seconds of silence, repeat the question or move on.

**Keeping the call on track.** A [state machine](topic:architecture/state-machines) gives the call fixed phases. On each turn, the LLM gets only the current phase's instructions. Your code moves to the next phase when the phase's goal is met. This stops the model wandering off-topic, and makes calls easy to test.

**After the call.** Recordings and transcripts are stored, then evaluated. In a hiring tool, AI can score the answers so a recruiter only reviews results. Respect privacy laws: tell callers they are speaking to an AI, get consent to record, and protect stored audio.

**My project.** I built an [AI voice agent](topic:resume/voice-agent-microservice) that calls candidates automatically when they become eligible after scoring. The standard voice uses **Twilio + Google Cloud speech-to-text and text-to-speech + Claude** for the thinking, following a [phase-based state machine](topic:resume/voice-state-machine). A [premium voice](topic:resume/grok-voice-premium) uses **xAI Grok** for the calling and voice, while **Claude still does the thinking**. Recordings are stored in **S3**, then AI evaluates and scores each call.

## 🎯 Why do we use it?

Many jobs start with a **short, repetitive phone call**: checking basic details, booking a slot, answering simple questions. Voice AI can handle these calls at any time, at scale.

In hiring, a first screening call takes a recruiter about **10–15 minutes** (up to 20 for longer HR calls — an estimate, not a measured figure). An AI agent can make these calls, so recruiters only review the results.

## ⚠️ Common mistakes

- **Not streaming**, so every turn has several seconds of silence.
- **Long, chatty replies.** On a phone, two short sentences beat a paragraph.
- **No barge-in**, so the agent keeps talking over the caller.
- **Letting the LLM free-run the whole call** with no phases. Calls go off-topic and are hard to test.
- **Ignoring consent and privacy** for recordings.

## 🗣️ How to answer in an interview

> "A voice AI agent runs a loop on every turn: the phone line streams the caller's audio, speech-to-text turns it into words, the LLM decides the reply, text-to-speech turns it into audio, and it plays back. The biggest challenge is latency, because a silence of more than about a second feels broken on a call.
>
> So I stream every step, start speaking on the first sentence, keep replies short, keep connections open, and support barge-in so the agent stops when the caller talks. A phase-based state machine keeps the call on track and makes it testable.
>
> I built this at SkillKeepr: the agent calls candidates automatically after scoring. The standard voice uses Twilio, Google Cloud speech services and Claude; the premium voice uses xAI Grok for the calling and voice while Claude still does the thinking. Recordings go to S3, and AI scores each call, so recruiters only review results."

[FILL IN: the real latency per turn you saw, how you handled barge-in and silence, and the real phase names — only what's true.]

## 🔁 Follow-up questions

### How do you know when the caller has finished speaking?

End-of-speech detection: wait for a short silence, often helped by the STT service's own signals. Tune it so you don't cut people off or leave long gaps.

### What happens if the STT or LLM service fails mid-call?

A common approach: retry once, then play a polite message, end the call, and mark the candidate for a human follow-up. [FILL IN: what your agent does.]

### Why keep a separate voice service instead of putting it in the main backend?

Voice calls are long-running, real-time and delay-sensitive. A separate service can scale and deploy on its own, and a problem there doesn't take down the main platform.

### Cascaded pipeline or speech-to-speech model?

Cascaded gives more control and easy-to-log text in the middle. Speech-to-speech can feel more natural and faster. The choice depends on quality, latency and cost needs.

## ✅ Quick check

### 1. In the simulator, which single step adds the most delay without streaming?

:::answer
The **LLM's full reply** — 1,800 ms. That's why streaming the LLM's first words helps most.
:::

### 2. The agent keeps talking while the candidate says "Sorry, can you repeat?". Which feature is missing?

:::answer
**Barge-in.** The agent should stop its audio as soon as the caller speaks.
:::

### 3. In the premium voice of the project above, which model decides what to say?

:::answer
**Claude.** Grok handles the calling and the voice; Claude still does the thinking.
:::
