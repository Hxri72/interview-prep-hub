---
title: Optional and readonly properties
stack: typescript
order: 6
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "A ? after a property name makes it optional: email?: string means the field may be missing."
  - With strict mode, an optional field's type includes undefined, so TypeScript makes you check before using it.
  - readonly means the property can be set once (when the object is created) but never changed.
  - readonly and ReadonlyArray are compile-time only; they don't freeze the object at runtime (Object.freeze does).
  - Partial<T> makes all fields optional; Readonly<T> makes all fields readonly.
cards:
  - q: "What does email?: string mean?"
    a: The email property is optional. It may be missing, so its type is string | undefined.
  - q: What does readonly do?
    a: It stops code from changing that property after the object is created. TypeScript reports an error if you try.
  - q: Does readonly freeze the object at runtime?
    a: No. It's only a compile-time check. Use Object.freeze for a runtime freeze.
  - q: How do you safely use an optional field?
    a: "Check it first, or use optional chaining and a default: user.email?.toLowerCase() ?? 'none'."
  - q: How do you make every field optional or readonly at once?
    a: With the utility types Partial<T> and Readonly<T>.
---

## 💡 What is it?

Two small markers change how a property behaves.

- **`?` (optional):** `email?: string` means the field **may be missing**.
- **`readonly`:** `readonly id: string` means the field is set once and **can't be changed** later.

Both are checked by TypeScript while you code.

## 🏠 Real-life example

Think of a **student's school ID card**.

- The **roll number** is printed when the card is made. Nobody can change it later. That's `readonly`.
- The **blood group** box is printed, but some students leave it **empty**. It's allowed to be missing. That's optional (`?`).
- The **name** must always be there. That's a normal required field.
- Before a nurse uses the blood group, she **checks if it's filled in**. That's checking an optional field before using it.

## 🧑‍💻 Code example

Save this as `optional.ts`. Run it with `node optional.ts`.

```ts
interface Candidate {                               // the shape of a candidate
  readonly id: string;                              // readonly = can be set once, never changed
  name: string;                                     // required
  email?: string;                                   // ? = optional: may be missing
}                                                   // end of Candidate

const c: Candidate = { id: 'c1', name: 'Hari' };    // OK: email is optional, so we can leave it out
console.log(c.email);                               // undefined (it was never set)
console.log(c.email?.toUpperCase() ?? 'no email');  // ?. stops safely if email is missing → 'no email'

const skills: readonly string[] = ['Node', 'React']; // a read-only list
console.log(skills.includes('Node'));               // reading is fine → true
```

**Output:**

```text
undefined
no email
true
```

Now break the rules, and run `npx tsc --noEmit`:

```ts
c.id = 'c2';                                        // change a readonly field
c.email.toUpperCase();                              // use an optional field without checking
skills.push('React');                               // change a read-only list
```

```text
optional-err.ts(3,3): error TS2540: Cannot assign to 'id' because it is a read-only property.
optional-err.ts(4,1): error TS18048: 'c.email' is possibly 'undefined'.
optional-err.ts(6,8): error TS2339: Property 'push' does not exist on type 'readonly string[]'.
```

## 🔍 Deeper version

**Optional properties.** `email?: string` really means `email: string | undefined`, **and** the key may be left out entirely. With `"strict": true`, TypeScript makes you handle the missing case. Ways to do that:

| Way | Example |
|---|---|
| `if` check | `if (c.email) send(c.email)` |
| Optional chaining | `c.email?.toLowerCase()` |
| Default value | `c.email ?? 'none'` |
| Destructuring default | `const { email = 'none' } = c` |

**Optional parameters** work the same way: `function greet(name: string, title?: string)`. Optional parameters must come after the required ones.

**`?:` vs `| undefined`.** They are close but not identical. With `email?: string`, you may **leave out** the key. With `email: string | undefined`, the key must be **present**, even if its value is `undefined`. The `exactOptionalPropertyTypes` setting makes TypeScript even stricter about this.

**`readonly` is compile-time only.** It doesn't change the JavaScript that runs. Code that ignores the types, or plain JavaScript, can still change the value. For a real runtime freeze, use `Object.freeze(obj)`. For a whole object type, `Readonly<T>` marks every field as readonly. It is **shallow**: nested objects can still change.

**Read-only arrays.** `readonly string[]` (same as `ReadonlyArray<string>`) removes the methods that change the array, like `push`, `pop` and `sort`. Methods that make a new array, like `map`, `filter` and `toSorted`, still work.

**Utility types:** `Partial<T>` makes every field optional (great for PATCH/update data). `Required<T>` makes every field required. `Readonly<T>` makes every field readonly. See [utility types](topic:typescript/utility-types).

## 🎯 Why do we use it?

- **Optional fields** model real data. Not every candidate has a LinkedIn URL.
- **Strict checks on optional fields** stop "Cannot read properties of undefined" crashes.
- **`readonly`** protects values that should never change, like IDs, `createdAt` dates and config.
- **Read-only arrays** make sure a function doesn't change a list it was given.

## ⚠️ Common mistakes

- **Making everything optional** to stop errors. Then you must check everywhere. Make a field optional only if it really can be missing.
- **Thinking `readonly` freezes the object at runtime.** It doesn't. Use `Object.freeze` if you need that.
- **Forgetting `readonly` is shallow.** `Readonly<User>` doesn't protect `user.address.city`.
- **Using `!` to silence "possibly undefined"** (like `c.email!`) instead of checking. It can crash at runtime. See [assertions](topic:typescript/assertions).

## 🗣️ How to answer in an interview

> "A question mark after a property name makes it optional, so the key may be missing and its type includes undefined. With strict mode on, TypeScript makes me handle that, usually with optional chaining and a default, like user.email?.toLowerCase() ?? 'none'.
>
> readonly means a property can be set when the object is created, but not changed later. I use it for things like IDs and createdAt. A readonly array removes the methods that change it, like push. These are compile-time checks only — they don't freeze anything at runtime. For a runtime freeze I'd use Object.freeze. For whole types there are utility types: Partial makes everything optional, which is handy for PATCH bodies, and Readonly makes everything readonly."

## 🔁 Follow-up questions

### What's the difference between `readonly` and `const`?

`const` stops you from **reassigning the variable**. `readonly` stops you from **changing a property** of an object. A `const` object's fields can still change unless they're `readonly`.

### Where would you use `Partial<T>`?

For update (PATCH) requests, where the client sends only the fields that changed: `function updateCandidate(id: string, changes: Partial<Candidate>)`.

### Is `Readonly<T>` deep?

No, it's shallow. Nested objects can still be changed. You can write a recursive `DeepReadonly<T>` type, or use `as const` for literal values.

### Why can't an optional parameter come before a required one?

Arguments are matched by position. If the first one were optional, TypeScript couldn't tell which argument you meant.

## ✅ Quick check

### 1. Does this compile?

```ts
interface Job { readonly id: string; title: string } // id is readonly
const job: Job = { id: 'j1', title: 'Dev' };        // create a job
job.title = 'Senior Dev';                           // change the title
```

:::answer
**Yes.** `title` is a normal field, so it can change. Only `job.id = '…'` would be an error.
:::

### 2. Does this compile with `"strict": true`?

```ts
function greet(name?: string) {                     // name is optional
  return name.toUpperCase();                        // use it directly
}
```

:::answer
**No.** `name` is possibly `undefined`. Fix: `return name?.toUpperCase() ?? 'GUEST';`
:::

### 3. Which type makes every field of `Candidate` optional?

- A) `Readonly<Candidate>`
- B) `Partial<Candidate>`
- C) `Required<Candidate>`

:::answer
**B) `Partial<Candidate>`.**
:::
