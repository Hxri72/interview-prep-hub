---
title: "Destructuring, spread and rest"
stack: javascript
order: 14
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Destructuring pulls values out of objects and arrays into variables in one line.
  - "You can rename (city: town) and give defaults (years = 0) while destructuring."
  - Spread (...) EXPANDS an array or object — used to copy, merge or pass items as arguments.
  - Rest (...) COLLECTS the remaining items into one array or object — used in function parameters and destructuring.
  - Spread makes only a shallow copy; nested objects are still shared.
cards:
  - q: What is destructuring?
    a: "A short way to take values out of an object or array into variables, like const { name, city } = user."
  - q: Spread vs rest — they look the same (...). How do you tell them apart?
    a: Spread expands (used where values are given, like a function call or a new array/object). Rest collects (used where values are received, like parameters or the left side of destructuring).
  - q: "How do you rename and give a default while destructuring?"
    a: "const { city: town = 'Unknown' } = user; — reads city, stores it in town, uses 'Unknown' if it's undefined."
  - q: Does { ...obj } make a deep copy?
    a: No. It copies only the top level. Nested objects and arrays are still shared with the original.
  - q: How do you remove a field like password without changing the original object?
    a: "const { password, ...safeUser } = user; — safeUser has every field except password."
---

## 💡 What is it?

These are three short ways of working with objects and arrays:

- **Destructuring** takes values **out** of an object or array and puts them into variables.
- **Spread** (`...`) **spreads out** the items of an array or object, for example to copy or join them.
- **Rest** (`...`) **collects** the leftover items into one array or object.

Spread and rest use the same three dots. **Where** you write them decides which one it is.

## 🏠 Real-life example

Think of **unpacking a school lunch box**.

- **Destructuring**: you open the box and take out exactly what you need: "roti goes in my left hand, banana in my right hand". You name each item as you take it.
- **Spread**: you **empty two lunch boxes onto one plate** to share. All items are now laid out together.
- **Rest**: you take the roti, and "**everything else**" goes into one bag for later.

So:
- **Lunch box** = the object or array.
- **Taking out named items** = destructuring.
- **Emptying boxes onto a plate** = spread.
- **"Everything else" bag** = rest.

## 🧑‍💻 Code example

Save this as `destr.js`. Run it with `node destr.js`.

```js
const candidate = { name: 'Asha', city: 'Kochi', skills: ['Node', 'React', 'MongoDB'] }; // an object

const { name, city: town, years = 0 } = candidate;   // destructure: take name; rename city → town; years defaults to 0
const [firstSkill, ...otherSkills] = candidate.skills; // array destructure: first item, then REST collects the others

console.log(name, town, years);                      // 'Asha' 'Kochi' 0 (years didn't exist, so default 0)
console.log(firstSkill, otherSkills);                // 'Node' and ['React', 'MongoDB']

const updated = { ...candidate, city: 'Trivandrum' }; // SPREAD: copy all fields, then override city
console.log(updated.city, candidate.city);           // the copy changed; the original did not

const allSkills = [...candidate.skills, 'TypeScript']; // SPREAD an array into a new array, then add one more
console.log(allSkills);                              // 4 skills

function addMarks(...marks) {                        // REST parameter: collects all arguments into an array
  return marks.reduce((sum, m) => sum + m, 0);       // add them up; 0 = starting value
}                                                    // end of addMarks
console.log(addMarks(10, 20, 30));                   // 60
```

**Output:**

```text
Asha Kochi 0
Node [ 'React', 'MongoDB' ]
Trivandrum Kochi
[ 'Node', 'React', 'MongoDB', 'TypeScript' ]
60
```

## 🔍 Deeper version

**Object destructuring** matches by **key name**. **Array destructuring** matches by **position**.

```js
const { a, b } = obj;                 // by name: a = obj.a, b = obj.b
const [x, y] = arr;                   // by position: x = arr[0], y = arr[1]
const [, second] = arr;               // skip the first item with an empty slot
const { address: { city } = {} } = user; // nested destructure; = {} avoids a crash if address is missing
```

**Defaults only apply for `undefined`.** If the value is `null`, the default is **not** used. `const { years = 0 } = { years: null }` gives `years = null`.

**Destructuring in function parameters** is very common in React and Express:

```js
function CandidateCard({ name, city = 'Remote' }) { /* ... */ }  // React props
app.get('/jobs/:id', ({ params: { id } }, res) => { /* ... */ }); // Express req.params.id
```

**Swapping two variables** without a temp variable: `[a, b] = [b, a];`.

**Spread vs rest (same dots, opposite jobs):**

| Where it appears | Name | Job |
|---|---|---|
| In a function **call** `fn(...args)` | spread | expands the array into separate arguments |
| In an array/object **literal** `[...a]`, `{...o}` | spread | copies items into a new array/object |
| In function **parameters** `function f(...args)` | rest | collects arguments into an array |
| On the **left** of destructuring `const [a, ...rest]` | rest | collects leftover items |

**Rules for rest:** it must be **last**, and there can be only one. `const [...a, b] = arr` is a syntax error.

**Spread is shallow.** `{ ...obj }` copies only the top level. Nested objects are still **the same objects** (references). See [shallow vs deep copy](topic:javascript/shallow-vs-deep-copy).

**Merge order matters.** In `{ ...defaults, ...userSettings }`, later keys win. That's the standard way to apply default options.

**Spreading strings and Sets.** Spread works on anything iterable: `[...'abc']` → `['a', 'b', 'c']`, and `[...new Set(arr)]` removes duplicates.

## 🎯 Why do we use it?

- **Shorter, clearer code.** One line instead of three `const x = obj.x` lines.
- **Immutable updates in React and Redux.** `setUser({ ...user, city })` makes a new object instead of changing the old one.
- **Flexible functions.** Rest parameters accept any number of arguments.
- **Safe API responses.** `const { password, ...safeUser } = user` removes secret fields before sending.

## ⚠️ Common mistakes

- **Destructuring from `undefined` or `null`.** `const { name } = undefined` throws a TypeError. Give a default: `= {}`.
- **Expecting a deep copy from spread.** Changing `copy.address.city` also changes the original.
- **Expecting defaults to replace `null`.** Defaults only replace `undefined`.
- **Putting rest anywhere but last.** It must be the final item.

## 🗣️ How to answer in an interview

> "Destructuring lets me pull values out of objects by name, or out of arrays by position, in one line. I can rename and set defaults while doing it. I use it all the time for React props and for `req.params` and `req.body` in Express.
>
> Spread and rest both use three dots. Spread expands, for example to copy or merge objects and arrays, or to pass an array as arguments. Rest collects, in function parameters or on the left side of destructuring. One trick I use is `const { password, ...safeUser } = user` to drop a field without mutating.
>
> The thing to remember is that spread is a shallow copy. Nested objects are still shared, so for deep updates I copy each level or use `structuredClone`."

## 🔁 Follow-up questions

### What happens if you destructure a key that doesn't exist?

You get `undefined`, or the default value if you gave one. No error, unless the whole source is `undefined` or `null`.

### How is the rest parameter different from the old `arguments` object?

Rest gives a **real array**, so map and filter work on it. `arguments` is array-like, not a real array. It also doesn't exist in arrow functions.

### How do you merge two objects so the second one wins?

`{ ...first, ...second }`. Keys from `second` overwrite the same keys from `first`. `Object.assign({}, first, second)` does the same.

### Can you destructure a function's return value?

Yes. React's `useState` does this: `const [count, setCount] = useState(0);`. The hook returns an array, and we destructure it by position.

## ✅ Quick check

### 1. What does this print?

```js
const { a = 1, b = 2 } = { a: null, b: undefined }; // destructure with defaults
console.log(a, b);                                   // ?
```

:::answer
**`null 2`.** Defaults only apply when the value is `undefined`. `null` is kept.
:::

### 2. What does this print?

```js
const user = { name: 'Asha', address: { city: 'Kochi' } }; // nested object
const copy = { ...user };                                 // shallow copy
copy.address.city = 'Pune';                               // change nested value
console.log(user.address.city);                           // ?
```

- A) `Kochi`
- B) `Pune`

:::answer
**B) `Pune`.** Spread copied only the top level. `copy.address` is the same object as `user.address`.
:::
