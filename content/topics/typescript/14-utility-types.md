---
title: "Utility types: Partial, Pick, Omit, Record, Readonly, ReturnType"
stack: typescript
order: 14
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Utility types are built-in tools that make a new type from an existing one, so you don't write it twice.
  - "`Partial<T>` makes every field optional (good for PATCH). `Required<T>` does the opposite."
  - "`Pick<T, 'a' | 'b'>` keeps some fields. `Omit<T, 'password'>` removes some fields."
  - "`Record<K, V>` is an object with keys K and values V. `Readonly<T>` stops changes."
  - "`ReturnType<typeof fn>` reuses a function's return type. `Awaited<T>` unwraps a Promise."
cards:
  - q: Name the utility types you use most.
    a: "Partial (all optional), Pick (keep some fields), Omit (remove fields), Record (key → value object), Readonly, ReturnType."
  - q: Which utility type fits a PATCH request body?
    a: "Partial<Candidate> — the client may send any subset of the fields."
  - q: How do you make sure a password never goes to the frontend type?
    a: "Use Omit<User, 'password'> as the response type, and remove the field in code too."
  - q: What does Record<'applied' | 'shortlisted', number> mean?
    a: "An object that must have exactly those keys, each with a number value, e.g. { applied: 12, shortlisted: 3 }."
  - q: How do you get the type a function returns, without writing it again?
    a: "ReturnType<typeof myFunction>. For async functions, Awaited<ReturnType<typeof fn>> gives the resolved value."
---

## 💡 What is it?

**[Utility types](glossary:utility-type)** are ready-made type tools that come with TypeScript.

They take a type you already have and **make a new type from it**. For example: "the same as Candidate, but every field optional", or "Candidate without the password".

This means you write the main type **once**. Every other version updates by itself when the main type changes.

## 🏠 Real-life example

Think of a **school ID card form**. It has name, class, photo, blood group and a secret PIN.

- **Partial** = a "change details" slip. You only fill in what you want to change.
- **Pick** = the **library card**. It copies only the name and class.
- **Omit** = the **notice-board photo list**. Everything except the secret PIN.
- **Record** = an **attendance sheet**. Each roll number maps to "present" or "absent".
- **Readonly** = the **laminated** card. Nobody can write on it.
- **ReturnType** = "whatever the photocopy machine gives back". You describe the copy by pointing at the machine.

The original form is written once. Every other card is made from it.

## 🧑‍💻 Code example

Save this as `utility.ts`. Run it with `node utility.ts`.

```ts
interface Candidate {                                              // the full candidate shape
  id: string;                                                      // text id
  name: string;                                                    // full name
  email: string;                                                   // email address
  password: string;                                                // secret — never send to the browser
  experience: number;                                              // years of experience
}                                                                  // end of Candidate

type CandidateUpdate = Partial<Candidate>;                         // every field becomes optional (good for PATCH)
type CandidateCard = Pick<Candidate, 'id' | 'name'>;               // keep only id and name
type PublicCandidate = Omit<Candidate, 'password'>;                // everything except password
type StatusCount = Record<'applied' | 'shortlisted', number>;      // an object: these keys → number values
type FrozenCandidate = Readonly<Candidate>;                        // no field can be changed

function toPublic(c: Candidate): PublicCandidate {                 // remove the secret before sending
  const { password, ...rest } = c;                                 // pull password out, keep the rest
  return rest;                                                     // rest matches PublicCandidate
}                                                                  // end of toPublic

type PublicResult = ReturnType<typeof toPublic>;                   // reuse the function's return type

const asha: Candidate = { id: 'c1', name: 'Asha', email: 'asha@mail.com', password: 'x9!', experience: 3 }; // full record
const patch: CandidateUpdate = { experience: 4 };                  // only one field — allowed by Partial
const card: CandidateCard = { id: asha.id, name: asha.name };      // only two fields
const counts: StatusCount = { applied: 12, shortlisted: 3 };       // both keys are required
const frozen: FrozenCandidate = asha;                              // read-only view of the same object
const pub: PublicResult = toPublic(asha);                          // same as PublicCandidate

console.log(patch);                                                // { experience: 4 }
console.log(card);                                                 // { id, name }
console.log(counts);                                               // the counts object
console.log(pub);                                                  // no password field
console.log(frozen.name);                                          // reading is fine
```

**Output:**

```text
{ experience: 4 }
{ id: 'c1', name: 'Asha' }
{ applied: 12, shortlisted: 3 }
{ id: 'c1', name: 'Asha', email: 'asha@mail.com', experience: 3 }
Asha
```

**What TypeScript stops.** These three lines:

```ts
frozen.name = 'Ravi';                                              // change a Readonly field
console.log(pub.password);                                         // read a field that Omit removed
const c2: Record<'applied' | 'shortlisted', number> = { applied: 1 }; // a required key is missing
```

give these real errors:

```text
error TS2540: Cannot assign to 'name' because it is a read-only property.
error TS2339: Property 'password' does not exist on type 'Omit<Candidate, "password">'.
error TS2741: Property 'shortlisted' is missing in type '{ applied: number; }' but required in type 'Record<"applied" | "shortlisted", number>'.
```

## 🔍 Deeper version

**The full set you should know:**

| Utility | What it does | Typical use |
|---|---|---|
| `Partial<T>` | all fields optional | PATCH bodies, form drafts |
| `Required<T>` | all fields required | config after defaults are applied |
| `Readonly<T>` | all fields read-only | settings, Redux state |
| `Pick<T, K>` | keep only keys K | list cards, small views |
| `Omit<T, K>` | remove keys K | hide `password`, drop `_id` for create |
| `Record<K, V>` | object with keys K, values V | counts, lookup maps |
| `Exclude<U, X>` | remove members from a union | `Exclude<Status, 'rejected'>` |
| `Extract<U, X>` | keep members of a union | |
| `NonNullable<T>` | remove `null` and `undefined` | |
| `ReturnType<F>` | a function's return type | reuse helper results |
| `Parameters<F>` | a function's parameter types, as a tuple | wrapping a function |
| `Awaited<T>` | the value inside a Promise | `Awaited<ReturnType<typeof load>>` |

**They are shallow.** `Partial<Candidate>` makes only the **top-level** fields optional. Nested objects stay as they were. `Readonly` is also shallow: you can't replace `frozen.address`, but you *can* change `frozen.address.city`. For deep versions, write your own [mapped type](topic:typescript/mapped-conditional) or use `as const` for literal data.

**`Readonly` is compile-time only.** At runtime the object can still change. Use `Object.freeze` if you need a real runtime guard.

**`Omit` is not checked against real keys.** `Omit<Candidate, 'pasword'>` (a typo) compiles and removes nothing. Some teams write a stricter version: `type StrictOmit<T, K extends keyof T> = Omit<T, K>`.

**Types vanish at runtime.** `Omit<User, 'password'>` describes the response, but your code must still **really remove** the field before sending it. In Mongoose, you'd use `select('-password')` or a `toJSON` transform. See [lean and select](topic:mongodb/lean-and-select).

**How they're built.** Most of them are simple [mapped types](topic:typescript/mapped-conditional). For example, `Partial` is roughly `{ [P in keyof T]?: T[P] }`. Knowing this helps you write your own.

## 🎯 Why do we use it?

- **One source of truth.** Change `Candidate` once, and `CandidateUpdate`, `CandidateCard` and `PublicCandidate` all update by themselves.
- **Safer APIs.** `Omit<User, 'password'>` as the response type makes it a compile error to read the password on the frontend.
- **Clear intent.** `Partial<Candidate>` says "PATCH body" better than a hand-written copy with `?` on every field.
- **Less code to maintain.** No duplicate interfaces drifting apart over time.

## ⚠️ Common mistakes

- **Copy-pasting an interface** and adding `?` by hand, instead of `Partial`. The copies drift apart.
- **Trusting `Omit` to hide data at runtime.** It only changes the type. Remove the field in code too.
- **Expecting `Partial` or `Readonly` to go deep.** They only change the top level.
- **Typos in `Omit` keys**, which compile without any warning.

## 🗣️ How to answer in an interview

> "Utility types build new types from existing ones, so I don't write the same shape twice. The ones I use most are `Partial` for PATCH bodies, `Pick` for small views like a list card, `Omit` to remove things like `password` from response types, `Record` for lookup objects like counts per status, `Readonly` for settings, and `ReturnType` to reuse what a function returns. For async functions I wrap it in `Awaited`.
>
> Two things I keep in mind. They are shallow, so nested objects aren't changed. And they disappear at runtime: `Omit<User, 'password'>` doesn't remove the password from the real object, so I still strip it in the code before sending the response."

[FILL IN: a real use from your SkillKeepr backend or frontend, e.g. a PATCH body or a response type without secrets — only if true.]

## 🔁 Follow-up questions

### What's the difference between `Pick` and `Omit`?

`Pick` lists the fields to **keep**. `Omit` lists the fields to **remove**. Use whichever list is shorter and clearer.

### How do you type a PATCH body where `id` can't change?

`Partial<Omit<Candidate, 'id'>>`. Remove `id`, then make the rest optional.

### What does `Record<string, number>` allow?

Any string key with a number value. It's like a dictionary. Reading a missing key still gives `number` in the type, unless you turn on `noUncheckedIndexedAccess`.

### How do you get the resolved type of an async function's result?

`Awaited<ReturnType<typeof loadCandidate>>`. `ReturnType` gives the Promise, and `Awaited` unwraps it.

## ✅ Quick check

### 1. Which type allows `{ name: 'Ravi' }` for a `Candidate` with five required fields?

- A) `Pick<Candidate, 'id'>`
- B) `Partial<Candidate>`
- C) `Readonly<Candidate>`

:::answer
**B.** `Partial` makes every field optional, so one field is enough.
:::

### 2. Does `Omit<User, 'password'>` remove the password from the object at runtime?

:::answer
**No.** Types disappear when the code runs. You must remove the field in code, e.g. with destructuring or a database projection.
:::

### 3. What is `ReturnType<typeof toPublic>` in the example?

:::answer
It is `PublicCandidate` (`Omit<Candidate, 'password'>`), because that is what `toPublic` returns.
:::
