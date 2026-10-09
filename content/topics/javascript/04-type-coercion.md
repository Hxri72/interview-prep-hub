---
title: Type coercion and == vs ===
stack: javascript
order: 4
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Type coercion means JavaScript changes a value from one type to another, often without telling you.
  - "== (loose equality) converts the types first, then compares. === (strict equality) never converts: different types are never equal."
  - "+ with a string joins text ('5' + 1 = '51'). Other maths signs turn strings into numbers ('5' - 1 = 4)."
  - "Use === by default. The one common exception: value == null checks for both null and undefined."
  - "NaN is not equal to anything, even itself. Use Number.isNaN()."
cards:
  - q: What is the difference between == and ===?
    a: "== converts both values to the same type first, then compares. === compares type AND value, with no conversion. So 5 == '5' is true, but 5 === '5' is false."
  - q: "What is '5' + 1 and '5' - 1?"
    a: "'51' and 4. With a string, + joins text. Minus only works on numbers, so '5' becomes 5."
  - q: Why is NaN === NaN false, and how do you check for NaN?
    a: NaN is defined as not equal to anything, even itself. Use Number.isNaN(value).
  - q: When is == acceptable?
    a: "value == null is a common, clear shortcut. It is true for both null and undefined, and nothing else."
  - q: What is the difference between implicit and explicit coercion?
    a: "Implicit: JavaScript converts for you, like '5' * 2. Explicit: you convert on purpose, like Number('5') or String(5)."
---

## 💡 What is it?

**Type coercion** means JavaScript changes a value from one type to another. For example, it can turn the text `'5'` into the number `5`.

Sometimes you do it on purpose, like `Number('5')`. Often JavaScript does it **by itself**, without telling you.

`==` (loose equality) lets this happen before comparing. `===` (strict equality) does not. It checks the type **and** the value.

## 🏠 Real-life example

Think of **a school ID check at the gate**.

- **`===` is a strict guard.** You must show your **school ID card**. A library card with the same name is not accepted. Same name **and** same kind of card, or you don't get in.
- **`==` is a relaxed guard.** If you show a library card, the guard "converts" it in their head: "Same name, close enough!" Most days it works. But sometimes they let the wrong person in.
- **`NaN` is a student with no name on any card.** The guard can't match them with anyone, not even with themselves.

## 🧑‍💻 Code example

Save this as `coercion.js`. Run it with `node coercion.js`.

```js
console.log(5 == '5');            // == converts '5' to the number 5 first
console.log(5 === '5');           // === also checks the type: number vs string
console.log('5' + 1);             // + with a string joins text
console.log('5' - 1);             // - only works on numbers, so '5' becomes 5
console.log(null == undefined);   // a special rule: == treats these two as equal
console.log(null === undefined);  // different types, so false
console.log(0 == false);          // false becomes 0, then 0 == 0
console.log(NaN === NaN);         // NaN is never equal to anything, even itself
console.log(Number.isNaN(NaN));   // the correct way to check for NaN
```

**Output:**

```text
true
false
51
4
true
false
true
false
true
```

## 🔍 Deeper version

**Three kinds of conversion.** JavaScript only ever converts to one of three types:
- **to string**: `String(x)`, or `+` with a string, or template literals.
- **to number**: `Number(x)`, unary `+x`, or `-`, `*`, `/`, `<`, `>`.
- **to boolean**: `Boolean(x)`, `!!x`, or any `if (x)`. See [truthy and falsy](topic:javascript/truthy-falsy).

**How `==` works (simplified):**
1. Same type? Compare like `===`.
2. `null == undefined` is `true`. Neither one equals anything else.
3. Number vs string? Turn the string into a number.
4. Boolean vs anything? Turn the boolean into a number (`true` → 1, `false` → 0).
5. Object vs primitive? Turn the object into a primitive (with `valueOf` / `toString`), then try again.

That's why these surprising results happen:

| Expression | Result | Why |
|---|---|---|
| `'' == 0` | `true` | `''` becomes `0` |
| `'0' == false` | `true` | `false` → 0, `'0'` → 0 |
| `[] == false` | `true` | `[]` → `''` → 0, `false` → 0 |
| `null == 0` | `false` | null only equals undefined |
| `[1] == 1` | `true` | `[1]` → `'1'` → 1 |

**`+` is special.** If **either** side is a string (after converting objects), `+` joins text. Otherwise it adds numbers. So `1 + 2 + '3'` is `'33'`, but `'1' + 2 + 3` is `'123'`. It reads left to right.

**Number conversion details:**
- `Number('')` and `Number(' ')` are `0`.
- `Number('12px')` is `NaN`. `parseInt('12px', 10)` is `12`.
- `Number(null)` is `0`, but `Number(undefined)` is `NaN`.

**Other equality tools:**
- `Object.is(a, b)` is like `===`, but `Object.is(NaN, NaN)` is `true` and `Object.is(0, -0)` is `false`. React uses it to compare state and dependencies.
- `Number.isNaN(x)` is safe. The old global `isNaN('hello')` returns `true`, because it converts first.

## 🎯 Why do we use it?

- **To avoid hidden bugs.** Data from forms, URLs and query strings is **always text**. `req.query.page` is `'2'`, not `2`. Strict checks and explicit conversion stop wrong comparisons.
- **To write code that says what it means.** `Number(age) >= 18` is clear. `age >= 18` with a string only works by luck.
- **Interviews love it.** "Predict the output" questions about `==`, `+` and `NaN` are very common.

## ⚠️ Common mistakes

- **Adding numbers that are really strings.** `'10' + 5` gives `'105'`. Convert first: `Number(input) + 5`.
- **Using `==` everywhere.** Use `===` by default.
- **Checking `x === NaN`.** It's always false. Use `Number.isNaN(x)`.
- **Using `parseInt` without a radix.** Write `parseInt(value, 10)`, so the number is always read as base 10.

## 🗣️ How to answer in an interview

> "Type coercion is JavaScript converting a value from one type to another. It can be explicit, like Number('5'), or implicit, where the engine does it for me.
>
> Double equals is loose equality. It coerces the values to a common type and then compares, so 5 == '5' is true, and so is 0 == false. Triple equals is strict equality. It never converts, so the type and the value must both match.
>
> I use triple equals by default. The one place I'm fine with double equals is value == null, which is a short way to check for null or undefined. I also convert user input explicitly, because query strings and form values are always strings. And I check NaN with Number.isNaN, because NaN isn't equal to anything, even itself."

## 🔁 Follow-up questions

### What does `[] + {}` give?

`'[object Object]'`. `[]` becomes `''`, and `{}` becomes `'[object Object]'`. Then `+` joins them as text.

### What does `1 < 2 < 3` and `3 > 2 > 1` give?

`true` and `false`. It reads left to right. `3 > 2` is `true`, and then `true > 1` becomes `1 > 1`, which is `false`.

### What is the difference between `Number('12px')` and `parseInt('12px', 10)`?

`Number` needs the **whole** string to be a number, so it gives `NaN`. `parseInt` reads digits from the start and stops at the first non-digit, so it gives `12`.

### Why does `Object.is` exist?

It fixes two `===` edge cases: `Object.is(NaN, NaN)` is `true`, and `Object.is(0, -0)` is `false`. React uses it to decide if state or dependencies changed.

## ✅ Quick check

### 1. Predict the output.

```js
console.log(1 + '2' + 3);   // ?
console.log(1 + 2 + '3');   // ?
```

:::answer
**`'123'` and `'33'`.** It reads left to right. In the first line, `1 + '2'` becomes `'12'`, then `'123'`. In the second, `1 + 2` is `3`, then `3 + '3'` is `'33'`.
:::

### 2. Which of these is `true`?

- A) `null == 0`
- B) `'' == 0`
- C) `NaN == NaN`

:::answer
**B.** The empty string becomes `0`. `null` only loosely equals `undefined`, and `NaN` never equals anything.
:::

### 3. `req.query.page` is `'2'`. What does `req.query.page + 1` give?

:::answer
**`'21'`.** Query values are strings, so `+` joins text. Convert first: `Number(req.query.page) + 1` gives `3`.
:::
