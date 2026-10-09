---
title: Type aliases vs interfaces
stack: typescript
order: 5
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Both type and interface can describe the shape of an object.
  - "interface can be extended with extends, and two interfaces with the same name merge (declaration merging)."
  - "type can do more: unions ('a' | 'b'), tuples, primitives and complex combinations. Same-name types are an error."
  - "A simple rule: interface for object shapes (especially public ones), type for unions and combinations."
  - The most important thing in a team is to pick one style and stay consistent.
cards:
  - q: type vs interface — what's the short answer?
    a: Both describe object shapes. Interfaces can be extended and merged. Types can also describe unions, tuples and other combinations. I use interfaces for objects and types for unions.
  - q: What is declaration merging?
    a: If you declare two interfaces with the same name, TypeScript combines them into one. Types with the same name give a "Duplicate identifier" error.
  - q: Can an interface describe a union like 'a' | 'b'?
    a: No. Only a type alias can name a union.
  - q: How do you extend each one?
    a: "Interface: interface B extends A { … }. Type: type B = A & { … } (an intersection)."
  - q: When is declaration merging useful?
    a: To add fields to a type from a library, like adding user to Express's Request.
---

## 💡 What is it?

TypeScript has two ways to give a type a name: **`type`** (a type alias) and **`interface`**.

For describing an **object's shape**, they do almost the same job.

The differences are small but common in interviews. **Interfaces** can be extended and can **merge**. **Types** can also describe **unions**, tuples and other combinations.

## 🏠 Real-life example

Think of **two kinds of forms at school**.

An **interface** is like the **official admission form**. Different offices can **add pages** to it. The library adds a "library card" page. The hostel adds a "room" page. In the end, it's still **one form** with all the pages joined.

A **type** is like a **custom label maker**. It can print a label for one thing, or "**either this or that**", like "Bus pass OR Cycle pass". But you can't print two labels with the same name.

- **Official form with added pages** = interface + declaration merging.
- **New form based on the old one, plus extra fields** = `interface B extends A`.
- **"Bus pass OR Cycle pass" label** = a union type, which only `type` can do.
- **Two labels with the same name** = a "Duplicate identifier" error for `type`.

## 🧑‍💻 Code example

Save this as `iface.ts`. Run it with `node iface.ts`.

```ts
interface Candidate {                               // interface: describes an object shape
  name: string;                                     // required text field
  experience: number;                               // required number field
}                                                   // end of the first declaration

interface Candidate {                               // same name again → TS MERGES the two
  email?: string;                                   // so Candidate now also has an optional email
}                                                   // end of the second declaration

interface Recruiter extends Candidate {             // extends = "everything in Candidate, plus more"
  company: string;                                  // extra field for recruiters
}                                                   // end of Recruiter

type Status = 'applied' | 'shortlisted' | 'rejected'; // a type alias can name a union — interfaces can't
type Job = { title: string; status: Status };       // a type alias can also describe an object

const r: Recruiter = { name: 'Asha', experience: 5, company: 'SkillKeepr' }; // must have all required fields
const j: Job = { title: 'Node Developer', status: 'shortlisted' }; // status must be one of the 3 words
console.log(r.company, j.status);                   // SkillKeepr shortlisted
```

**Output:**

```text
SkillKeepr shortlisted
```

Now try the same trick with `type`, and run `npx tsc --noEmit`:

```ts
type Job = { title: string };                       // first Job
type Job = { salary: number };                      // second Job with the same name
```

```text
iface-err.ts(1,6): error TS2300: Duplicate identifier 'Job'.
iface-err.ts(2,6): error TS2300: Duplicate identifier 'Job'.
```

## 🔍 Deeper version

| Feature | `interface` | `type` |
|---|---|---|
| Describe an object shape | ✅ | ✅ |
| Extend / combine | `interface B extends A {}` | `type B = A & {}` |
| Unions (`A \| B`) | ❌ | ✅ |
| Tuples, primitives (`type ID = string`) | ❌ | ✅ |
| Mapped and conditional types | ❌ | ✅ |
| Same name declared twice | ✅ merges | ❌ error |
| A class can `implements` it | ✅ | ✅ (if it's an object type) |

**Declaration merging in real code.** This is the main reason interfaces exist. You can add fields to a library's types. A common Express example adds the logged-in user to every request:

```ts
declare global {                                    // change a global type
  namespace Express {                               // Express keeps its types in this namespace
    interface Request {                             // merges with Express's own Request interface
      user?: { id: string; role: 'admin' | 'recruiter' }; // now req.user is typed everywhere
    }                                               // end of Request
  }                                                 // end of namespace
}                                                   // end of declare global
```

See [TypeScript with Express](topic:typescript/ts-express).

**`extends` vs `&`.** They are close but not the same. With `extends`, if a field clashes, TypeScript reports the error **right there**. With `&`, clashing fields quietly become `never`, and you only find out later. See [intersection types](topic:typescript/intersection).

**Error messages and speed.** Interfaces have names, so error messages and editor hovers often show `Candidate` instead of a long expanded shape. On very large codebases, `extends` can also be a little faster to check than long chains of `&`.

**What teams do.** Many teams pick one rule and stick to it:
- "**`interface` for objects, `type` for everything else**" (very common), or
- "**`type` everywhere**", for one consistent style.

Consistency matters more than the choice.

## 🎯 Why do we use it?

- Naming a shape once and reusing it keeps code **DRY** (Don't Repeat Yourself).
- Named types make code **readable**: `Candidate` says more than `{ name: string; ... }`.
- **Interfaces** let you extend and even patch library types.
- **Types** let you name unions like `Status`, which are everywhere in real apps.

## ⚠️ Common mistakes

- **Trying to make a union with an interface.** Use `type Status = 'a' | 'b'`.
- **Accidentally merging two interfaces** with the same name in one project. It's legal, so it can hide a naming clash.
- **Arguing too long about style.** Pick a rule as a team and use a lint rule to keep it consistent.
- **Using `&` where `extends` would catch a clash** and give a clearer error.

## 🗣️ How to answer in an interview

> "Both type aliases and interfaces can describe an object shape, so for plain objects they're nearly the same. The differences: an interface can be extended with extends and supports declaration merging — two interfaces with the same name combine. A type alias can't merge, but it can describe more: unions like 'applied' | 'rejected', tuples, primitives, and mapped or conditional types.
>
> My rule is interface for object shapes, especially ones other code extends, and type for unions and combinations. Declaration merging is useful in practice — for example, adding a user field to Express's Request type after authentication. In a team, the most important thing is to be consistent."

## 🔁 Follow-up questions

### Can a class implement a type alias?

Yes, as long as the type describes an object shape: `class Admin implements Person {}`. It can't implement a union type.

### Which one would you use for React component props?

Either works. Many teams use `type Props = { … }`. Some use `interface Props`. Follow the team's style.

### What happens if two merged interfaces have the same field with different types?

TypeScript reports an error: "Subsequent property declarations must have the same type."

### Is there any difference at runtime?

No. Both are removed when the code is compiled. Neither creates any JavaScript.

## ✅ Quick check

### 1. Does this compile?

```ts
interface Status = 'open' | 'closed';               // try to make a union with interface
```

:::answer
**No.** An interface can't describe a union. Write `type Status = 'open' | 'closed';`.
:::

### 2. After this code, which fields does `User` have?

```ts
interface User { name: string }                     // first declaration
interface User { age: number }                      // second declaration, same name
```

:::answer
**Both `name` and `age`.** The two interfaces merge into one (declaration merging).
:::

### 3. Which keyword combines two type aliases?

- A) `extends`
- B) `&`
- C) `|`

:::answer
**B) `&`** (intersection): `type B = A & { extra: string }`. `extends` is for interfaces, and `|` makes a union ("one or the other").
:::
