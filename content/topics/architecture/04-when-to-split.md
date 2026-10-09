---
title: When (and when not) to split a monolith
stack: architecture
order: 4
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Split a part out only for a clear reason — it needs to scale, deploy or fail independently, or a separate team owns it.
  - Don't split because microservices are popular, the code is messy, or the team is small. Messy code needs better modules, not more services.
  - Split along a business boundary that has its own data and few calls to the rest.
  - Do it step by step with the "strangler fig" pattern — put the old code behind an interface, build the new service, then switch traffic gradually.
  - First make the boundary clean inside the monolith (a modular monolith); then moving it out is easy.
cards:
  - q: Give three good reasons to split a part out of a monolith.
    a: It needs different scaling (very busy or very heavy), it needs to deploy or fail independently, or a separate team owns it and keeps blocking others.
  - q: Give two bad reasons to split.
    a: 'Saying "microservices are modern" or "the code is messy". Messy code just moves the mess onto the network.'
  - q: What is the strangler fig pattern?
    a: Replace a monolith piece by piece — put the old part behind an interface, build the new service, route some traffic to it, and remove the old code once it's fully replaced.
  - q: How do you pick where to cut?
    a: Along a business area that owns its own data and has few calls to the rest of the system.
  - q: What should you do before extracting a service?
    a: Make the boundary clean inside the monolith first — one public interface, no shared tables — so the extraction is mostly moving code.
---

## 💡 What is it?

Sooner or later, someone asks: "Should we break our monolith into services?"

**Splitting** means taking one part out of the monolith and running it as a **separate service**.

The right answer is often "not yet". You split only when there is a **clear, real reason**. And you split **step by step**, not all at once.

## 🏠 Real-life example

Think of a **school canteen** that also prints the school magazine.

The printing machine is loud and slow. During exams, the magazine team needs it all day, and lunch gets delayed. So the school moves printing to its own room.

- **The canteen** = the monolith.
- **Printing** = one part with very different needs (noisy, heavy, different timing).
- **Moving printing to its own room** = splitting it into a service.
- **Not moving the tea counter** = no reason to split a part that works fine where it is.
- **Moving one machine at a time, while the canteen stays open** = the strangler fig pattern.

You don't build ten rooms just because the canteen is a bit messy. You clean the canteen first.

## 🧑‍💻 Code example

The first step of a safe split: put the part behind **one interface**, then switch between "local module" and "remote service" with a flag. Save as `strangler.js` and run it twice.

```js
// The SAME function signature, two ways to get the answer.
const localScoring = {                                        // today: code inside the monolith
  score: async (candidate) => candidate.skills.length * 10,   // simple rule: 10 points per skill
};                                                            // end of local version

const remoteScoring = {                                       // later: a separate scoring service
  score: async (candidate) => {                               // same name, same input, same output
    await new Promise((r) => setTimeout(r, 50));              // pretend network call (50 ms)
    return candidate.skills.length * 10;                      // the service applies the same rule
  },                                                          // end of score
};                                                            // end of remote version

const USE_REMOTE = process.env.SCORING_REMOTE === 'true';     // a switch (feature flag) in the environment
const scoring = USE_REMOTE ? remoteScoring : localScoring;    // pick one; callers don't care which

async function main() {                                       // the rest of the monolith
  const s = await scoring.score({ name: 'Asha', skills: ['Node', 'React', 'MongoDB'] }); // 3 skills
  console.log(`Using ${USE_REMOTE ? 'remote service' : 'local module'}: score = ${s}`); // print result
}                                                             // end of main
main();                                                       // run it
```

Run `node strangler.js`, then `SCORING_REMOTE=true node strangler.js`:

```text
Using local module: score = 30
Using remote service: score = 30
```

**What to notice:** the rest of the app never changed. Only the flag decides where the work happens. You can switch back instantly if the new service has problems.

## 🔍 Deeper version

**Good reasons to split:**

| Reason | Example |
|---|---|
| Different scaling | Video processing needs big machines; login doesn't |
| Different runtime needs | Long jobs (minutes), real-time calls, Python ML libraries |
| Independent deploys | One team ships 10 times a day and is blocked by another |
| Failure isolation | A crash in reports must never stop payments |
| Security or compliance | Payment data kept in a tightly controlled service |

**Bad reasons:**
- "Microservices are modern."
- "The code is messy." Messy code becomes messy services plus network failures.
- "Each developer should have their own service."
- "We might need to scale someday."

**Where to cut — find a clean seam.** A good candidate:
- is one business area (billing, notifications, scoring),
- owns its own data (its own tables or collections),
- has **few calls** to and from the rest,
- changes for its own reasons.

**How to split safely (strangler fig):**
1. **Draw the boundary inside the monolith** first: one public interface, no other module touching its tables. See [modular monolith](topic:architecture/modular-monolith).
2. **Put callers behind the interface**, like the `scoring` object above.
3. **Build the new service** with the same contract.
4. **Move the data**: copy it, keep it in sync, then make the service its owner.
5. **Switch traffic gradually** with a feature flag: 1% → 10% → 100%.
6. **Delete the old code** once nothing uses it.

The name comes from the strangler fig tree. It grows around an old tree until it can stand on its own.

**Costs you take on** after splitting: network failures, monitoring, a deploy pipeline, data consistency across services. See [microservices](topic:architecture/microservices).

**A real example.** At SkillKeepr, the AI voice agent is a separate service. Phone calls are long-running, real-time and need their own scaling. That is a "different runtime needs" reason. [FILL IN: any other reason your team kept it separate.]

## 🎯 Why do we use it?

- **To avoid a costly mistake** in either direction — splitting too early or too late.
- **To make the split safe**: small steps, a quick way back, no "big rewrite".
- **To spend effort where it pays**: only on the parts that truly need independence.

## ⚠️ Common mistakes

- **The big-bang rewrite**: rebuilding everything as services at once. It usually runs late and breaks things.
- **Splitting by layer** ("database service", "validation service") instead of by business area.
- **Keeping a shared database** after the split, so services are still tied together.
- **No way back**: switching all traffic at once with no feature flag.

## 🗣️ How to answer in an interview

> "I'd split a part out of a monolith only for a concrete reason: it needs to scale differently, it has different runtime needs like long-running or real-time work, it must deploy or fail independently, or a separate team owns it and keeps getting blocked. 'Microservices are modern' or 'the code is messy' aren't good reasons — messy code needs better modules first.
>
> To choose where to cut, I look for a business area that owns its own data and has few calls to the rest. Then I do it gradually with the strangler fig pattern: make the boundary clean inside the monolith, put callers behind one interface, build the service with the same contract, move the data, and switch traffic step by step with a feature flag so we can roll back.
>
> In my work, the AI voice agent is a good example of something that should be separate: calls are long-running and real-time, so it runs as its own service."

## 🔁 Follow-up questions

### How do you move the data when you split a service?

Copy it to the new service's database. Keep both in sync for a while (dual writes or change events). Switch reads, then writes, to the new owner. Finally, remove the old tables.

### What signals tell you a monolith is too big?

Very slow builds and tests, frequent merge conflicts between teams, deploys that need many teams to agree, and one feature's load forcing you to scale everything.

### Can you go back from microservices to a monolith?

Yes, and some companies do it to reduce cost and complexity. Merging services is easier when each one has a clean API.

### What is a feature flag?

A setting that turns code on or off without a new deploy. It lets you send a small share of traffic to new code and switch back quickly.

## ✅ Quick check

### 1. Which is the BEST reason to split out a service?

- A) "Our code is messy."
- B) "This part runs 10-minute video jobs and needs big machines."
- C) "Microservices look good on a resume."

:::answer
**B.** It has different runtime and scaling needs. A needs cleaner modules; C is not an engineering reason.
:::

### 2. In the code example, what has to change in `main()` to switch to the remote service?

:::answer
**Nothing.** Only the `SCORING_REMOTE` flag changes. Both versions share the same interface.
:::

### 3. True or false: after splitting, the new service should keep reading the monolith's tables directly.

:::answer
**False.** The new service should own its data. Sharing tables keeps the two tightly coupled.
:::
