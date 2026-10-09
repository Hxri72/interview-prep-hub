---
title: Flatten a nested array
stack: dsa
order: 18
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Flattening turns a list with lists inside it into one plain list: [1, [2, [3]]] → [1, 2, 3]."
  - "Way 1: arr.flat(Infinity). Way 2: a loop that calls itself (recursion) whenever it finds an inner list."
  - "Time O(n) where n = total number of values; space O(n) for the result, plus the depth of nesting for recursion."
  - A very deep list can overflow the call stack with recursion, so the stack-based loop is the safe version.
  - Plain flat() with no number only opens ONE level. Use flat(Infinity) for all levels.
cards:
  - q: How do you flatten [1, [2, [3, [4]]]] with one built-in method?
    a: "arr.flat(Infinity). Infinity means: open every level of nesting."
  - q: "What does [1, [2, [3]]].flat() return?"
    a: "[1, 2, [3]]. With no argument, flat opens only one level."
  - q: How do you flatten without flat()?
    a: Loop through the items. If an item is an array, flatten it first (recursion) and add its values; otherwise add the item.
  - q: What is the time complexity of flattening?
    a: O(n), where n is the total number of values in all levels. Each value is touched once.
  - q: Why might you avoid recursion for a very deeply nested array?
    a: Each level adds a function call to the call stack. Thousands of levels can throw "Maximum call stack size exceeded". An explicit stack (a while loop with an array) avoids that.
---

## 💡 What is it?

You get an array that has **arrays inside it**. Some of those inner arrays have more arrays inside them.

Your job: make **one plain array** with all the values, in the same order.

```text
Input:  [1, [2, [3, [4]], 5], 6]
Output: [1, 2, 3, 4, 5, 6]
```

## 🏠 Real-life example

Think of **boxes inside boxes** in a store room.

One big box holds a pen, a smaller box, and a notebook. The smaller box holds a pencil and an even smaller box. You want **all the items on one table**, in order.

- The **big box** = the outer array.
- A **box inside a box** = a nested array.
- **Opening a box and emptying it** = flattening one level.
- **"Keep opening until no box is left"** = recursion (do the same job again on the smaller box).
- **The table** = the result array.

## 🧑‍💻 Code example

Save as `flatten.js` and run `node flatten.js`.

```js
const nested = [1, [2, [3, [4]], 5], 6];                  // a list with lists inside lists

// Way 1 — array methods
const way1 = nested.flat(Infinity);                       // flat(Infinity) = open every level of nesting
console.log('Way 1:', way1);                              // print the flat result

// Way 2 — plain loops + recursion (no flat)
function flatten(arr) {                                   // arr = the list we want to flatten
  const result = [];                                      // empty box to collect plain values
  for (let i = 0; i < arr.length; i++) {                  // look at each item, one by one
    const item = arr[i];                                  // the current item
    if (Array.isArray(item)) {                            // is this item itself a list?
      const inner = flatten(item);                        // yes → flatten that smaller list first
      for (let j = 0; j < inner.length; j++) {            // walk through the flattened inner list
        result[result.length] = inner[j];                 // add each value at the end
      }                                                   // end of inner loop
    } else {                                              // not a list → a normal value
      result[result.length] = item;                       // add it at the end (same as push)
    }                                                     // end of if/else
  }                                                       // end of main loop
  return result;                                          // give back the flat list
}                                                         // end of flatten

console.log('Way 2:', flatten(nested));                   // print the loop result
console.log('Empty:', flatten([]), 'Deep:', flatten([[[[7]]]])); // edge cases: empty list, very deep list
```

**Output (real run):**

```text
Way 1: [ 1, 2, 3, 4, 5, 6 ]
Way 2: [ 1, 2, 3, 4, 5, 6 ]
Empty: [] Deep: [ 7 ]
```

## 🔍 Deeper version

**Complexity (n = total number of values in all levels, d = deepest nesting level):**

| Way | Time | Extra space |
|---|---|---|
| `flat(Infinity)` | O(n) | O(n) for the new array |
| Recursion | O(n) | O(n) result + O(d) call stack |
| Explicit stack (below) | O(n) | O(n) |

Each value is visited once, so time is **O(n)**. The recursion also uses the [call stack](glossary:call-stack): one function call for each level of nesting. See [recursion](topic:dsa/recursion) for how that works.

**Dry run of `flatten([1, [2, [3]]])`:**

| Step | Item | Action | result |
|---|---|---|---|
| 1 | `1` | not a list → add | `[1]` |
| 2 | `[2, [3]]` | a list → call `flatten([2, [3]])` | — |
| 2a | `2` | add | inner `[2]` |
| 2b | `[3]` | a list → call `flatten([3])` → `[3]` | inner `[2, 3]` |
| 3 | — | copy inner values | `[1, 2, 3]` |

**Iterative version with a stack (no recursion):**

```js
function flattenIter(arr) {                     // flatten without recursion
  const stack = [...arr];                       // copy items onto a stack (a pile)
  const result = [];                            // flat values go here
  while (stack.length) {                        // keep going while the pile has items
    const item = stack.pop();                   // take the LAST item off the pile
    if (Array.isArray(item)) stack.push(...item); // a list → put its items back on the pile
    else result.push(item);                     // a value → keep it
  }                                             // end of while
  return result.reverse();                      // we took items from the end, so reverse once
}                                               // end of flattenIter
console.log(flattenIter([1, [2, [3, [4]], 5], 6])); // prints [ 1, 2, 3, 4, 5, 6 ]
```

This version never hits the call stack limit, even for 100,000 levels of nesting.

**Edge cases:** empty array → `[]`. Empty inner arrays (`[1, [], 2]`) simply add nothing. `flat()` also **removes empty slots** in sparse arrays.

**Flatten only `depth` levels:** pass a depth to your function and stop opening boxes when it reaches 0. That matches `arr.flat(depth)`.

## 🎯 Why do we use it?

- API data often comes nested. For example, each job has a list of skills, and you want one list of all skills.
- It tests **recursion**, which interviewers love because many beginners find it hard.
- It shows you know both the modern built-in and the logic underneath.

## ⚠️ Common mistakes

- **Using `flat()` with no argument** and expecting it to open every level. It opens only one.
- **Forgetting to return** the result of the inner `flatten(item)` call, or pushing the inner *array* instead of its values.
- **Using `typeof item === 'object'`** to detect an array. `null` and plain objects are also `'object'`. Use `Array.isArray`.
- **Not thinking about very deep input.** Recursion can crash with "Maximum call stack size exceeded".

## 🗣️ How to answer in an interview

> "Let me repeat it: I get an array that can contain arrays at any depth, and I return one flat array in the same order. Can it contain empty arrays, or objects? I'll assume numbers and arrays.
>
> The quick way is `arr.flat(Infinity)`. Without built-ins, I loop through the items. If an item is an array, I call the same function on it and add the values it returns. Otherwise I add the item. That's recursion.
>
> Each value is visited once, so time is O(n), with O(n) space for the result. Recursion also uses stack space equal to the nesting depth. If the input could be extremely deep, I'd switch to an explicit stack with a while loop, so it can't overflow the call stack. Let me dry-run `[1, [2, [3]]]`… I get `[1, 2, 3]`."

## 🔁 Follow-up questions

### Can you flatten only up to a given depth?

Yes. Add a `depth` parameter. When you meet an inner array and `depth > 0`, call `flatten(item, depth - 1)`. When depth is 0, push the inner array as it is. This copies what `arr.flat(depth)` does.

### How would you flatten a nested object instead?

Same idea with keys. Walk through the object. If a value is an object, call the function again with a prefix like `"address."`. Otherwise store `prefix + key = value`. `{a: {b: 1}}` becomes `{ "a.b": 1 }`.

### Why do you reverse at the end in the stack version?

`pop()` takes items from the **end**. So values come out in reverse order. One `reverse()` at the end fixes the order. Another option is to use the stack from the front, but `shift()` is slower.

### What happens with `[1, [], [2, []]]`?

Empty arrays add nothing, so the result is `[1, 2]`.

## ✅ Quick check

### 1. What does this print?

```js
console.log([1, [2, [3]]].flat()); // flat() with no argument
```

:::answer
**`[1, 2, [3]]`**. With no argument, `flat()` opens only **one** level. The `[3]` stays nested.
:::

### 2. What is the time complexity of flattening an array with 1,000 values spread over 5 levels?

- A) O(5)
- B) O(n), about 1,000 steps
- C) O(n²)

:::answer
**B.** Every value is visited once, no matter how deep it sits. The depth only affects the extra stack space.
:::

### 3. Which check correctly detects an inner array?

- A) `typeof item === 'object'`
- B) `Array.isArray(item)`
- C) `item.length > 0`

:::answer
**B.** `typeof` is `'object'` for arrays, plain objects **and** `null`. Strings also have `.length`. Only `Array.isArray` is exact.
:::
