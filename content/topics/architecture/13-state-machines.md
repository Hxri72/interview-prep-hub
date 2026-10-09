---
title: State machines in backend design
stack: architecture
order: 13
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - A state machine is a fixed list of states, plus rules for which moves (transitions) are allowed between them.
  - At any moment, the thing is in exactly one state. Only an allowed event can move it to the next state.
  - "Backends use them for anything with a lifecycle: orders, job posts, interviews, payments, and AI phone calls."
  - "Store the current state and a history in the database. Change it atomically, so two requests can't both move it."
  - With an AI agent, the code controls the phases, and the AI only decides what to say inside a phase.
cards:
  - q: What is a state machine?
    a: A model with a fixed set of states and allowed transitions. The object is always in one state, and only listed events can move it to another.
  - q: Why use a state machine instead of many if/else checks?
    a: All allowed moves are in one table. Invalid moves are refused automatically, the flow is easy to draw and test, and bugs like "cancelled order got shipped" are prevented.
  - q: How do you stop two requests changing the state at the same time?
    a: "Put the expected current state in the update filter, e.g. findOneAndUpdate({ _id: id, status: 'OPEN' }, { $set: { status: 'CLOSED' } }). Only one request matches; the other changes nothing."
  - q: How does a state machine help an LLM voice agent?
    a: The code decides which phase the call is in and when it may move on. The LLM only talks inside the current phase. The call can't skip steps or wander off.
  - q: Name a tool that is a state machine as a service.
    a: AWS Step Functions. Libraries like XState do the same inside an app.
---

## 💡 What is it?

A **state machine** describes something that moves through **steps**.

It has three parts:
- **States:** the steps it can be in. For example: `DRAFT`, `OPEN`, `CLOSED`.
- **Events:** things that happen. For example: `publish`, `close`.
- **Transitions:** rules like "from `DRAFT`, the event `publish` moves it to `OPEN`".

At any moment, it is in **exactly one** state. Moves that are not in the rules are **refused**.

## 🏠 Real-life example

Think of **a traffic light**.

- It is always **one colour**: red, green or yellow. Never two at once.
- It changes only in a **fixed order**: red → green → yellow → red.
- It can't jump from **green straight to red** without yellow. That move isn't allowed.

Map it:
- **Colours** = states.
- **The timer ticking** = the event.
- **The fixed order** = the transition table.
- **"No green-to-red jump"** = refusing an invalid transition.

A job post is the same: **draft → open → closed**. You can't close a draft that was never opened, if the rules say so.

## 🧑‍💻 Code example

A tiny state machine for an AI screening call, with example phases. Save as `fsm.js` and run `node fsm.js`.

```js
const transitions = {                                     // allowed moves: state → { event: nextState }
  GREETING: { greeted: 'CONSENT' },                       // after the hello, ask for consent
  CONSENT: { agreed: 'QUESTIONS', refused: 'ENDED' },     // yes → questions, no → end the call
  QUESTIONS: { allAnswered: 'WRAP_UP' },                  // when every question is answered → wrap up
  WRAP_UP: { saidBye: 'ENDED' },                          // after goodbye → end
  ENDED: {},                                              // final state: nothing can happen
};                                                        // end of the transition table

function next(state, event) {                             // the only way to change state
  const to = transitions[state][event];                   // look up the move in the table
  if (!to) throw new Error(`"${event}" is not allowed in ${state}`); // unknown move → refuse
  return to;                                              // the new state
}                                                         // end of next

let state = 'GREETING';                                   // every call starts here
for (const event of ['greeted', 'agreed', 'allAnswered', 'saidBye']) { // events from the call
  const from = state;                                     // remember where we were
  state = next(state, event);                             // move to the next state
  console.log(`${from} --${event}--> ${state}`);          // print the move
}                                                         // end of the loop
try {                                                     // try a move that makes no sense
  next('ENDED', 'agreed');                                // the call already ended
} catch (err) {                                           // the state machine refuses it
  console.log('Blocked:', err.message);                   // print why
}                                                         // end of try/catch
```

**Output:**

```text
GREETING --greeted--> CONSENT
CONSENT --agreed--> QUESTIONS
QUESTIONS --allAnswered--> WRAP_UP
WRAP_UP --saidBye--> ENDED
Blocked: "agreed" is not allowed in ENDED
```

All the rules live in **one table**. Changing the flow means changing the table, not hunting through if/else code. (These phase names are only an example.)

## 🔍 Deeper version

**Parts of a state machine:**

| Term | Meaning | Job-post example |
|---|---|---|
| State | where it is now | `OPEN` |
| Event | what happened | `close` |
| Transition | allowed move | `OPEN --close--> CLOSED` |
| Guard | a condition for the move | "only the owner can close" |
| Action | side effect on the move | "email applicants that the job closed" |
| Final state | no more moves | `CLOSED` or `ENDED` |

**Storing it in a backend:**
- Save the current `status` on the document.
- Keep a `statusHistory` array: `{ from, to, by, at }`. It's great for audits and debugging.
- Use an **enum** in the schema, so only valid states can be saved.

**Change state atomically.** Two requests may try to move the same item at once. Read-then-write can let both succeed. Put the expected state **in the update filter**:

```js
const res = await Job.findOneAndUpdate(                   // one atomic database operation
  { _id: jobId, status: 'OPEN' },                         // only if it is STILL open
  { $set: { status: 'CLOSED' }, $push: { statusHistory: { from: 'OPEN', to: 'CLOSED', at: new Date() } } }, // move and record
  { returnDocument: 'after' }                             // give back the updated job
);                                                        // end of the update
if (!res) throw new Error('Job is not open any more');    // someone else changed it first
```

See [atomic updates and locking](topic:mongodb/atomic-updates-locking).

**State machines and LLM agents.** An LLM is flexible but unpredictable. A phone agent that relies only on a prompt can skip questions or chat forever. A common design:
1. The **code** holds the current phase and its goal ("collect notice period").
2. Each turn, the code sends the LLM the phase's instructions and the conversation so far.
3. The LLM replies, and signals (in a structured format) whether the phase goal is met.
4. The **code** checks the signal and decides the transition.

So the LLM controls the *words*, and the code controls the *flow*. Hari's voice agent uses a phase-based state machine with Claude. See [the voice state machine story](topic:resume/voice-state-machine). [FILL IN: the real phase names — don't use the example ones above in an interview.]

**State machines as a service.** AWS Step Functions is a managed state machine. Each state is a step (a Lambda call, a wait, a choice, a parallel branch), with built-in retries. It suits long workflows like "every 30 minutes, for each tenant, send interview reminders". Inside an app, libraries like **XState** give the same model.

## 🎯 Why do we use it?

Real business objects have **lifecycles**: job posts, applications, interviews, subscriptions, calls. Without a clear model, rules hide in many if/else checks across the code. Then bugs appear: a rejected candidate gets an offer email, or an expired plan still works.

A state machine:
- puts every allowed move in **one place**,
- **refuses invalid moves** automatically,
- is **easy to draw**, explain to product people, and **test** (one test per transition),
- gives a clean **history** for audits.

## ⚠️ Common mistakes

- **Updating status with no check of the current state.** A double-click or a retry can apply the same move twice, or a stale move after a newer one.
- **Status strings scattered in many files.** Typos like `"Closed"` vs `"CLOSED"` create states nobody handles. Use one enum.
- **No history.** When a customer asks "who closed this job?", you can't answer.
- **Letting an LLM decide the flow alone.** Keep transitions in code; let the model fill in the conversation.

## 🗣️ How to answer in an interview

> "A state machine is a fixed set of states plus the allowed transitions between them. The object is always in one state, and only listed events move it. I use it for anything with a lifecycle, like job posts, interviews or payments.
>
> In the backend, I store the current status as an enum and keep a status history. When I change state, I put the expected current state in the update filter, so the change is atomic and two requests can't both apply it.
>
> In my AI voice agent, the call follows a phase-based state machine. The code decides the current phase and when to move on, and Claude only generates what to say inside that phase. That keeps the call predictable and easy to debug, because I can always see which phase a call was in."

## 🔁 Follow-up questions

### State machine vs a simple status field — what's the difference?

A status field only stores where you are. A state machine also defines **which moves are allowed**, and enforces them. Many apps have the field but not the rules, and that's where bugs come from.

### How do you test a state machine?

Write one test per allowed transition ("from X, event Y goes to Z"), and tests that invalid moves are refused. Then a few end-to-end tests for whole paths, like the happy path and the "refused consent" path.

### What if the server restarts in the middle of a flow?

Keep the current state in a database (or in Step Functions), not only in memory. When the process restarts, it reads the state and continues, or marks the flow as failed so it can be retried.

### When is a state machine overkill?

For something with two states and no real rules, like a simple on/off flag. A boolean is enough.

## ✅ Quick check

### 1. In the code example, what happens if the event `refused` arrives while the state is `CONSENT`?

:::answer
The state moves to **`ENDED`**. The table allows `CONSENT --refused--> ENDED`.
:::

### 2. Two recruiters click "Close job" at the same moment. Which update makes sure only one close happens?

- A) `findById(id)`, check `status`, then `save()`
- B) `findOneAndUpdate({ _id: id, status: 'OPEN' }, { $set: { status: 'CLOSED' } })`

:::answer
**B.** The check and the change happen in one atomic operation. The second request finds no open job and changes nothing. Option A can let both pass the check.
:::

### 3. In an AI voice agent, who should decide that the call moves from "questions" to "wrap-up"?

:::answer
**The code (the state machine),** based on a structured signal from the LLM that it checks. The LLM decides what to say, not the flow.
:::
