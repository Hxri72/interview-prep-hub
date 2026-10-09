---
title: "Template literals, optional chaining ?. and nullish coalescing ??"
stack: javascript
order: 15
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Template literals use backticks and ${} to put values inside text, and they can span many lines."
  - "Optional chaining (?.) stops and gives undefined if the thing before it is null or undefined — no crash."
  - "Nullish coalescing (??) gives a default only when the value is null or undefined."
  - "|| gives a default for ANY falsy value (0, '', false), which is often a bug; ?? keeps 0 and ''."
  - "?. also works for function calls (obj.fn?.()) and brackets (obj?.[key])."
cards:
  - q: What is a template literal?
    a: "A string written with backticks (`). You can put values inside with ${...} and write it across many lines."
  - q: What does user.address?.city do if address is null?
    a: It returns undefined instead of throwing "Cannot read properties of null".
  - q: "What is the difference between || and ???"
    a: "|| uses the default for any falsy value (0, '', false, null, undefined, NaN). ?? uses it only for null or undefined."
  - q: "What does (0 || 50) give, and (0 ?? 50)?"
    a: "0 || 50 gives 50. 0 ?? 50 gives 0."
  - q: How do you safely call a function that may not exist?
    a: "obj.method?.() — it only calls method if it exists; otherwise it returns undefined."
---

## 💡 What is it?

These are three small, modern JavaScript features that make everyday code safer and shorter:

- **Template literals** (`` `Hello ${name}` ``) put values inside a string.
- **Optional chaining** (`?.`) reads deep values **without crashing** if something in the middle is missing.
- **Nullish coalescing** (`??`) gives a **default value** only when a value is `null` or `undefined`.

## 🏠 Real-life example

**Template literal** = a **fill-in-the-blanks form**: "Dear ____, your marks are ____." You fill the blanks with real values.

**Optional chaining** = asking a friend, "**If** you have a pencil box, **and if** it has a red pen, give it to me." If there's no pencil box, they just say "no". They don't panic.

**Nullish coalescing** = a **substitute teacher**. The substitute comes **only if the class teacher is absent**. If the teacher is present but quiet (like `0` or an empty string), the teacher still takes the class.

The old `||` is a stricter rule: the substitute comes even when the teacher is present but quiet. That's often not what you want.

## 🧑‍💻 Code example

Save this as `tmpl.js`. Run it with `node tmpl.js`.

```js
const user = { name: 'Asha', address: null, settings: { theme: '' }, score: 0 }; // some data with empty values

console.log(`Hello, ${user.name}! 2 + 3 = ${2 + 3}`); // template literal: ${} runs code and puts the result in the text
console.log(user.address?.city);                    // address is null → ?. stops → undefined (no crash)
console.log(user.getAge?.());                       // getAge doesn't exist → don't call it → undefined
console.log(user.score || 50);                      // 0 is falsy → || uses 50 (wrong if 0 is a real score!)
console.log(user.score ?? 50);                      // 0 is not null/undefined → ?? keeps 0
console.log(user.settings.theme || 'light');        // '' is falsy → || uses 'light'
console.log(user.settings.theme ?? 'light');        // '' is not null/undefined → ?? keeps '' (prints an empty line)
console.log(user.nickname ?? 'No nickname');        // nickname is undefined → ?? uses the default
```

**Output:**

```text
Hello, Asha! 2 + 3 = 5
undefined
undefined
50
0
light

No nickname
```

**What to notice:** `||` and `??` gave **different answers** for `0` and `''`. A score of 0 is a real score. `??` respects it.

## 🔍 Deeper version

**Template literals:**
- Any expression can go inside `${}`: maths, function calls, ternaries.
- They keep line breaks, so multi-line text is easy (emails, SQL, HTML snippets).
- **Tagged templates**: a function placed before the backticks gets the pieces and values separately. Libraries use this, e.g. `` sql`SELECT * FROM jobs WHERE id = ${id}` `` can turn values into safe query parameters, and styled-components uses `` styled.div`...` ``.
- ⚠️ Never build SQL or HTML from user input with a **plain** template literal. It allows SQL injection or XSS. Use parameterised queries or proper escaping.

**Optional chaining has three forms:**

```js
obj?.prop          // property: undefined if obj is null/undefined
obj?.[key]         // dynamic key in brackets
obj.method?.()     // call the method only if it exists
```

It **short-circuits**: once it stops, nothing to the right runs. In `a?.b.c.d`, if `a` is null, the whole thing is `undefined`. You can't assign with it: `obj?.x = 1` is a syntax error.

**`??` vs `||` vs `&&`:**

| Expression | Falsy values it treats as "missing" |
|---|---|
| `a \|\| b` | `false`, `0`, `''`, `null`, `undefined`, `NaN` |
| `a ?? b` | only `null` and `undefined` |

You **can't mix** `??` with `||` or `&&` without brackets. `a || b ?? c` is a syntax error. Write `(a || b) ?? c`.

**Assignment versions (ES2021):**
- `x ??= 5` → set `x` to 5 only if it's null or undefined.
- `x ||= 5` and `x &&= 5` also exist.

Example: `(counts[word] ??= 0)` creates a key the first time.

:::version[Version note]
Optional chaining and `??` arrived in **ES2020** (Node 14+). `??=`, `||=` and `&&=` arrived in **ES2021** (Node 15+). Very old code uses `user && user.address && user.address.city` instead of `?.`.
:::

## 🎯 Why do we use it?

- **Fewer crashes.** API data often has missing fields. `?.` stops "Cannot read properties of undefined" errors.
- **Correct defaults.** `??` doesn't throw away real values like `0`, `''` or `false`. A page size of `0`, a price of `0` or an empty search box stay as they are.
- **Readable strings.** Template literals are easier to read than `'Hello ' + name + '!'`.

## ⚠️ Common mistakes

- **Using `||` for numbers or booleans.** `limit || 20` turns a real `0` into `20`. Use `??`.
- **Using `?.` everywhere.** It can hide real bugs. If a value *must* exist, let the code fail loudly and fix the cause.
- **Building SQL or HTML from user input with template literals.** This is a security hole.
- **Mixing `??` with `||`** without brackets. It's a syntax error.

## 🗣️ How to answer in an interview

> "Template literals use backticks, let me put expressions inside with `${}`, and support multi-line strings. Optional chaining, `?.`, safely reads nested properties. If anything before it is null or undefined, it returns undefined instead of throwing. It also works for calls, like `fn?.()`, and brackets, like `obj?.[key]`.
>
> Nullish coalescing, `??`, gives a default only for null or undefined. That's different from `||`, which replaces any falsy value, including 0, an empty string and false. So for things like page size, prices or a boolean setting, I use `??`, because `0 || 20` gives 20, which is a bug.
>
> I don't put `?.` everywhere, though. If a value must exist, I'd rather the code fail so I find the real problem."

## 🔁 Follow-up questions

### What's the difference between `?.` and the `&&` pattern?

`a && a.b` returns `a` itself if `a` is falsy. For example, if `a` is `0`, it returns `0`, not `undefined`. `a?.b` returns `undefined` only for null or undefined, and it's shorter for deep chains.

### Can optional chaining be used on the left side of `=`?

No. `user?.name = 'x'` is a syntax error. Optional chaining is only for reading and calling.

### What are tagged templates used for?

A function receives the string parts and values separately. It can escape, translate or transform them. Examples are styled-components (`` styled.div`...` ``) and SQL helpers that turn values into safe parameters.

### What does `??=` do?

It assigns only if the variable is null or undefined: `options.limit ??= 20`. If `limit` is `0`, it stays `0`.

## ✅ Quick check

### 1. What does this print?

```js
const page = 0;                         // a real value: page 0
console.log(page || 1, page ?? 1);      // ?
```

:::answer
**`1 0`.** `||` treats `0` as missing. `??` only treats `null` and `undefined` as missing.
:::

### 2. What does this print?

```js
const order = { customer: null };              // customer is null
console.log(order.customer?.address.city);     // ?
```

- A) It throws an error
- B) `undefined`
- C) `null`

:::answer
**B) `undefined`.** `?.` stops at `customer` because it's null. Nothing to the right runs, so `.address.city` doesn't throw.
:::
