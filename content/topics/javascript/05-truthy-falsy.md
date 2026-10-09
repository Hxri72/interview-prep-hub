---
title: Truthy and falsy values
stack: javascript
order: 5
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "In an if or a ?:, JavaScript turns any value into true or false. Values that become false are \"falsy\". All others are \"truthy\"."
  - "There are only 8 falsy values: false, 0, -0, 0n, '' (empty string), null, undefined and NaN."
  - "Everything else is truthy, including '0', ' ', 'false', [] and {}."
  - "|| uses the right side for ANY falsy value (even 0 or ''). ?? uses it only for null or undefined."
cards:
  - q: List the falsy values in JavaScript.
    a: "false, 0, -0, 0n (BigInt zero), '' (empty string), null, undefined and NaN. Everything else is truthy."
  - q: Is an empty array truthy or falsy?
    a: "Truthy. [] and {} are objects, and all objects are truthy. Check arr.length to see if an array is empty."
  - q: "What is the difference between count || 10 and count ?? 10 when count is 0?"
    a: "count || 10 gives 10, because 0 is falsy. count ?? 10 gives 0, because ?? only replaces null and undefined."
  - q: What does !!value do?
    a: "It turns any value into a real boolean. The first ! flips it to the opposite boolean, and the second ! flips it back."
  - q: "Is the string 'false' truthy?"
    a: Yes. Any string with at least one character is truthy, even 'false' and '0'.
---

## 💡 What is it?

When you write `if (value)`, JavaScript needs a `true` or `false`. If `value` is not a boolean, JavaScript **turns it into one**.

Values that turn into `false` are called **falsy**. Values that turn into `true` are called **truthy**.

There are only **8 falsy values**. Everything else is truthy.

## 🏠 Real-life example

Think of **a teacher checking homework notebooks**.

The teacher only asks one question: "Is there **something** here, or is it **empty**?"

- **An empty page** = `''`, `0`, `null` or `undefined`. The teacher says "falsy: nothing here".
- **A page with just "0" written on it** = the string `'0'`. Something is written, so it's "truthy", even though it says zero.
- **An empty notebook (no pages filled)** = `[]`. The notebook itself exists, so the teacher counts it as truthy. To check if it's empty, you must open it and count the pages: `arr.length`.

## 🧑‍💻 Code example

Save this as `truthy.js`. Run it with `node truthy.js`.

```js
const tests = [                                   // pairs of [label, value] to test
  ['false', false], ['0', 0], ["''", ''],         // three falsy values
  ['null', null], ['undefined', undefined],       // two more falsy values
  ['NaN', NaN],                                   // "Not a Number" is falsy too
  ["'0'", '0'], ["' '", ' '], ['[]', []], ['{}', {}], // tricky ones: all truthy
];                                                // end of the list
for (const [label, value] of tests) {             // go through each pair
  console.log(label.padEnd(9), '→', value ? 'truthy' : 'falsy'); // if (value) decides truthy or falsy
}                                                 // end of the loop
const count = 0;                                  // 0 is a real, valid count here
console.log('count || 10 =', count || 10);        // || replaces ANY falsy value, even 0
console.log('count ?? 10 =', count ?? 10);        // ?? replaces only null or undefined
```

**Output:**

```text
false     → falsy
0         → falsy
''        → falsy
null      → falsy
undefined → falsy
NaN       → falsy
'0'       → truthy
' '       → truthy
[]        → truthy
{}        → truthy
count || 10 = 10
count ?? 10 = 0
```

## 🔍 Deeper version

**The complete falsy list (8 values):**

| Value | Type |
|---|---|
| `false` | boolean |
| `0` and `-0` | number |
| `0n` | bigint |
| `''` or `""` (any empty string) | string |
| `null` | null |
| `undefined` | undefined |
| `NaN` | number |

There is one strange extra in browsers: `document.all` is falsy for old-website reasons. You will almost never meet it.

**Where truthy/falsy is used.** The conversion to boolean happens in:
- `if`, `while` and `for` conditions
- the ternary `a ? b : c`
- `!`, `&&` and `||`
- JSX: `{count && <Badge />}`

**`&&` and `||` return a value, not just true/false.**
- `a || b` returns `a` if `a` is truthy, otherwise `b`.
- `a && b` returns `a` if `a` is falsy, otherwise `b`.

This is a common React bug:

```jsx
{messages.length && <List items={messages} />}   // if length is 0, React shows "0" on the page!
{messages.length > 0 && <List items={messages} />} // fix: make the condition a real boolean
```

**`??` (nullish coalescing).** `a ?? b` returns `b` only if `a` is `null` or `undefined`. Use it for defaults when `0`, `''` or `false` are **valid** values, like a page number, a price or a "notify me" setting.

**Logical assignment (ES2021):**
- `x ||= 5` sets `x` to 5 only if `x` is falsy.
- `x ??= 5` sets `x` to 5 only if `x` is null or undefined.
- `x &&= 5` sets `x` to 5 only if `x` is truthy.

**Truthy is not the same as `== true`.** `'2'` is truthy, but `'2' == true` is `false`. That's because `true` becomes `1`, and `'2'` becomes `2`. Never compare with `== true`. Just write `if (value)`.

## 🎯 Why do we use it?

- **Short, readable checks.** `if (user)` instead of `if (user !== null && user !== undefined)`.
- **Default values.** `const name = input || 'Guest'`. Or, safer, `input ?? 'Guest'`.
- **Conditional rendering** in React with `&&` and the ternary.
- **Avoiding bugs** where `0` or an empty string is real data, like a score of 0 or a blank optional field.

## ⚠️ Common mistakes

- **Using `||` for numbers that can be 0.** `const page = req.query.page || 1` is fine, but `const discount = item.discount || 10` turns a real 0% discount into 10%. Use `??`.
- **Checking if an array is empty with `if (arr)`.** An empty array is truthy. Use `if (arr.length === 0)`.
- **Showing `0` in React** with `{count && ...}`. Use `count > 0 && ...`.
- **Comparing with `== true` or `== false`.** These use number conversion and give surprising results.

## 🗣️ How to answer in an interview

> "When JavaScript needs a boolean, like in an if or a ternary, it converts the value. There are only eight falsy values: false, zero, minus zero, BigInt zero, the empty string, null, undefined and NaN. Everything else is truthy, including the string '0', empty arrays and empty objects.
>
> This matters most for defaults. The OR operator replaces any falsy value, so a real zero or empty string gets thrown away. The nullish operator, double question mark, only replaces null and undefined, so I use it when zero or false are valid values.
>
> In React, I avoid writing count && <Component />, because when count is zero React renders the 0. I write count > 0 && instead."

## 🔁 Follow-up questions

### How do you check if an object is empty?

`Object.keys(obj).length === 0`. An empty object `{}` is truthy, so `if (obj)` doesn't help.

### What does `!!` do?

It turns any value into a real boolean. `!!'hello'` is `true`, and `!!0` is `false`. `Boolean(value)` does the same and is easier to read.

### Can `??` and `||` be mixed?

Not without brackets. `a || b ?? c` is a SyntaxError. Write `(a || b) ?? c` so the order is clear.

### Is `new Boolean(false)` truthy?

Yes. It's an **object**, and all objects are truthy. Never use `new Boolean`. Use `Boolean(value)` without `new`.

## ✅ Quick check

### 1. Which values are truthy?

`'0'`, `0`, `[]`, `null`, `'false'`, `NaN`

:::answer
**`'0'`, `[]` and `'false'`.** Non-empty strings and all objects are truthy. `0`, `null` and `NaN` are falsy.
:::

### 2. Predict the output.

```js
const price = 0;                 // a free item
console.log(price || 'N/A');     // ?
console.log(price ?? 'N/A');     // ?
```

:::answer
**`N/A` and `0`.** `||` treats 0 as "missing". `??` only treats null and undefined as missing, so it keeps 0.
:::

### 3. What does this JSX show when `items` is an empty array?

```jsx
<div>{items.length && <List items={items} />}</div>
```

:::answer
It shows **`0`**. `items.length` is 0, which is falsy, so `&&` returns 0, and React renders numbers. Use `items.length > 0 &&`.
:::
