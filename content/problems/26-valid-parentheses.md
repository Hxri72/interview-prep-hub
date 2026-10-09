---
title: Valid parentheses
order: 26
difficulty: Easy
pattern: Stack
topic: dsa/pattern-stack
---

## 📝 Problem

You get a string with only `( ) [ ] { }`. It is **valid** if every opening bracket is closed by the same type, in the correct order.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `"()[]{}"` | `true` | each pair closes |
| `"(]"` | `false` | wrong type |
| `"([)]"` | `false` | wrong order |
| `"{[]}"` | `true` | nested correctly |
| `"(("` | `false` | never closed |

## 🤔 Think first

:::hint
When you meet a closing bracket, which opening bracket must it match? The one you saw first, or the most recent one?
:::

## ✅ Solution

:::solution
**Way 1 — Remove pairs with string methods**

```js
function isValid(s) {
  let before;                                   // the string before this round
  do {
    before = s;                                 // remember it
    s = s.replace('()', '').replace('[]', '').replace('{}', ''); // remove one simple pair of each type
  } while (s !== before);                       // repeat while something was removed
  return s === '';                              // valid only if everything was removed
}
```

Time **O(n²)** (many passes over the string). Easy to explain, but slow.

**Way 2 — Stack**

```js
function isValid(s) {
  const stack = [];                                  // open brackets still waiting
  const pairs = { ')': '(', ']': '[', '}': '{' };    // closing → its matching opening
  for (const ch of s) {                              // read each character
    if (ch === '(' || ch === '[' || ch === '{') {    // an opening bracket
      stack.push(ch);                                // save it for later
    } else if (stack.pop() !== pairs[ch]) {          // closing must match the latest opening
      return false;                                  // wrong type, or nothing open
    }
  }
  return stack.length === 0;                         // anything left open → invalid
}
```

Time **O(n)**, space **O(n)**.

**Dry run:** `"([)]"` → push `(` → push `[` → `)` pops `[` ≠ `(` → `false` ✅

**What to say:** "The latest opening bracket must close first. That's last in, first out, so I use a stack. At the end the stack must be empty, or a bracket was never closed."
:::
