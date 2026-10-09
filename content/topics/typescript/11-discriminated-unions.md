---
title: Discriminated unions
stack: typescript
order: 11
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A discriminated union is a union of object types that all share one "label" field, like `status`.
  - Each label value has its own fields, for example `success` has `data` and `error` has `message`.
  - Checking the label (with `if` or `switch`) tells TypeScript exactly which shape you have.
  - "A `never` check in the `default` case makes TypeScript warn you when a new shape is added but not handled."
  - Great for API results, loading states, Redux actions and state machines.
cards:
  - q: What is a discriminated union?
    a: A union of object types that share one literal field (the discriminant), like status. Checking that field narrows to the exact shape.
  - q: Why is it better than one object with many optional fields?
    a: Impossible states can't exist. A success always has data, an error always has a message, and you can't have both by mistake.
  - q: What is an exhaustive check?
    a: "In the default case, assign the value to a variable of type never. If someone adds a new shape and forgets to handle it, TypeScript shows an error."
  - q: Where do you see discriminated unions in React and Redux?
    a: "Loading / success / error states, and Redux actions, where `type` is the label and each action has its own payload."
---

## 💡 What is it?

A **discriminated union** is a group of object types that all have **one shared label field**. The label is usually called `status`, `type` or `kind`.

Each label value comes with its own fields. For example, `success` has `data`, and `error` has `message`.

When you check the label, TypeScript knows exactly which shape you have. This is a special kind of [narrowing](topic:typescript/narrowing).

## 🏠 Real-life example

Think of **parcels at a school office**. Every parcel has a **coloured sticker**.

- 🟢 **Green sticker** = "books inside". You can open it and count the books.
- 🔴 **Red sticker** = "returned". It has a note saying why.
- 🟡 **Yellow sticker** = "still on the way". Nothing inside yet.

The office worker looks at the sticker first, then knows what to do.

- The **sticker colour** = the label field, like `status`.
- The **contents** = the fields that only that shape has, like `data` or `message`.
- **Looking at the sticker first** = `switch (r.status)`.
- A **new sticker colour nobody trained the worker for** = a new shape you forgot to handle. The `never` check catches this.

## 🧑‍💻 Code example

Save this as `discriminated.ts`. Run it with `node discriminated.ts`.

```ts
type Result =                                                      // one type, three possible shapes
  | { status: 'loading' }                                          // shape 1: still loading
  | { status: 'success'; data: string[] }                          // shape 2: has data
  | { status: 'error'; message: string };                          // shape 3: has an error message

function show(r: Result): string {                                 // r can be any of the three shapes
  switch (r.status) {                                              // check the shared "label" field
    case 'loading':                                                // TypeScript knows: no data here
      return 'Loading…';                                           // show a spinner text
    case 'success':                                                // TypeScript knows: data exists
      return `Found ${r.data.length} candidates`;                  // safe to use r.data
    case 'error':                                                  // TypeScript knows: message exists
      return `Error: ${r.message}`;                                // safe to use r.message
    default: {                                                     // should never happen
      const impossible: never = r;                                 // never = "no value can reach here"
      return impossible;                                           // keeps every path returning a string
    }                                                              // end of default
  }                                                                // end of switch
}                                                                  // end of show

console.log(show({ status: 'loading' }));                          // first shape
console.log(show({ status: 'success', data: ['Asha', 'Ravi'] }));  // second shape
console.log(show({ status: 'error', message: 'Network down' }));   // third shape
```

**Output:**

```text
Loading…
Found 2 candidates
Error: Network down
```

**Now add a fourth shape**, `| { status: 'empty' }`, but don't add a `case` for it. `npx tsc --noEmit --strict` gives this real error:

```text
error TS2322: Type '{ status: "empty"; }' is not assignable to type 'never'.
```

That error is the point: TypeScript tells you the exact shape you forgot.

## 🔍 Deeper version

**The three parts:**
1. Every member has the **same field name** (the discriminant).
2. That field has a **literal type** in each member: `'loading'`, `'success'`, `'error'`. Not just `string`.
3. You check that field with `===`, `switch` or `if`.

**Why not one object with optional fields?**

```ts
type BadResult = {                    // one shape for everything
  loading: boolean;                   // is it loading?
  data?: string[];                    // maybe data
  error?: string;                     // maybe an error
};                                    // end of BadResult
```

This allows impossible states: `loading: true` with `data` and `error` at the same time. Every place that reads it must guess. The discriminated union makes those states **impossible to write**. People call this "make illegal states unrepresentable".

**Exhaustiveness checking.** The `const impossible: never = r` trick works because, after all cases are handled, `r` has type `never`. If a case is missing, `r` still has that leftover shape, and assigning it to `never` fails. Some teams put this in a helper:

```ts
function assertNever(x: never): never {          // only accepts "impossible" values
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`); // also fails loudly at runtime
}                                                // end of assertNever
```

**Where you meet them:**
- **API results and React loading states:** `idle | loading | success | error`.
- **Redux actions:** `type` is the label, and each action has its own `payload`.
- **State machines:** each phase is a member with its own data. See [state machines](topic:architecture/state-machines).
- **Event payloads:** a webhook handler switching on `event.type`.

**Destructuring breaks narrowing in older code.** Narrowing works on `r.status`. If you pull `const { status, data } = r` *before* the check, `data` was not narrowed in older TypeScript versions. Newer versions handle many destructuring cases, but checking `r.status` and then reading `r.data` always works.

## 🎯 Why do we use it?

- **No impossible states.** A success can't be missing its data, and an error can't be missing its message.
- **The compiler guides you.** Inside each `case`, autocomplete shows only the fields that exist there.
- **Safe changes.** Add a new shape, and the exhaustive check points to every `switch` that needs updating.
- **It matches real flows.** Loading screens, API replies, Redux actions and call phases all have a clear "which state am I in?" field.

## ⚠️ Common mistakes

- **Using `string` for the label** instead of literal values. `status: string` can't narrow anything.
- **Different label names** in different members (`status` in one, `state` in another). They must share one field name.
- **Forgetting the `never` check**, so a new shape silently falls through to `default`.
- **Modelling with optional fields** (`data?`, `error?`) instead of a union, so impossible states are allowed.

## 🗣️ How to answer in an interview

> "A discriminated union is a union of object types that share one literal field, like `status` or `type`. Each value of that field has its own data: success has `data`, error has `message`. When I switch on that field, TypeScript narrows to the exact shape, so I only see fields that really exist.
>
> I use it for loading states, API results and action types, because it makes impossible states impossible to write, unlike one object with lots of optional fields. In the default case I assign the value to a `never` variable. Then if someone adds a new shape later, TypeScript points to every switch that doesn't handle it."

[FILL IN: if you typed Redux actions or API states this way at SkillKeepr, mention it here.]

## 🔁 Follow-up questions

### What is the `never` type used for here?

After every case is handled, nothing is left, so the value's type is `never`. Assigning it to `never` compiles only when every case is covered.

### How are Redux actions an example of this?

Each action has a `type` string literal and its own payload. A reducer switches on `action.type`, and inside each case TypeScript knows the payload's shape.

### Can the label be a number or boolean?

Yes. Any literal type works, like `kind: 1 | 2` or `ok: true | false`. Strings are most common because they are easy to read in logs.

### How would you model a form that can be "editing", "saving" or "saved with an id"?

`{ state: 'editing' } | { state: 'saving' } | { state: 'saved'; id: string }`. Only the saved shape has an id.

## ✅ Quick check

### 1. Inside `case 'error':` in the example, can you read `r.data`?

:::answer
**No.** In that case TypeScript knows `r` is `{ status: 'error'; message: string }`. It has no `data` field.
:::

### 2. Which type is a proper discriminated union?

- A) `{ status: string; data?: string[] }`
- B) `{ status: 'ok'; data: string[] } | { status: 'fail'; reason: string }`
- C) `{ ok: boolean } & { data: string[] }`

:::answer
**B.** It has a shared field with literal values, and each member has its own fields. A uses a plain `string` label, and C is an intersection, not a union.
:::

### 3. Why does `const impossible: never = r` cause an error when a case is missing?

:::answer
Because `r` still has the unhandled shape at that point, and no real value can be assigned to `never`.
:::
