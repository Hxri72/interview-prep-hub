---
title: Prototypes and prototypal inheritance
stack: javascript
order: 18
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Every object has a hidden link to another object, called its prototype.
  - When a property is missing on an object, JavaScript looks for it on the prototype, then the prototype's prototype, and so on. This is the prototype chain.
  - The chain ends at Object.prototype, whose prototype is null.
  - Methods live on the prototype, so all objects share one copy instead of each having their own.
  - "ES6 classes are just nicer syntax on top of prototypes."
cards:
  - q: What is a prototype?
    a: A hidden link from one object to another object. If a property is missing, JavaScript looks for it on the prototype.
  - q: What is the prototype chain?
    a: The path JavaScript follows when looking up a property — object, then its prototype, then that prototype's prototype — until it finds the property or reaches null.
  - q: What is the difference between __proto__ and prototype?
    a: "__proto__ (or Object.getPrototypeOf) is the link an object has to its parent. prototype is a property on functions/classes: it becomes the parent of objects made with new."
  - q: Why put methods on the prototype instead of inside each object?
    a: All objects share one copy of the method, which saves memory. Each object only stores its own data.
  - q: Are JavaScript classes real classes like in Java?
    a: No. They are syntax on top of prototypes. Methods in a class body go on Class.prototype.
---

## 💡 What is it?

Every JavaScript object has a hidden link to another object. That other object is called its **[prototype](glossary:prototype)**.

If you ask an object for a property it doesn't have, JavaScript doesn't give up. It looks at the prototype. If it's not there, it looks at the prototype's prototype. This path is called the **prototype chain**.

Using this chain to share properties and methods is called **prototypal inheritance**.

## 🏠 Real-life example

Think of asking for **a pen in class**.

You ask your friend, "Do you have a pen?" If they don't, they ask the class monitor. If the monitor doesn't have one, they ask the teacher. If nobody has one, the answer is "no pen".

- **Your friend** = the object.
- **The monitor** = the object's prototype.
- **The teacher** = the prototype's prototype.
- **Asking up the line** = the prototype chain.
- **"No pen"** = `undefined`. The property was not found anywhere.

Also, the class shares **one** dictionary on the teacher's desk. Everyone can use it, so each student doesn't need their own. That's like methods living on the prototype.

## 🧑‍💻 Code example

Save this as `prototypes.js`. Run it with `node prototypes.js`.

```js
const animal = {                                   // a normal object we will use as a "parent"
  eats: true,                                      // a property every animal shares
  describe() {                                     // a method every animal shares
    return `${this.name} eats: ${this.eats}`;      // this = the object that called describe()
  },                                               // end of describe
};                                                 // end of animal

const dog = Object.create(animal);                 // make a new object whose prototype (parent) is animal
dog.name = 'Tommy';                                // dog's own property

console.log(dog.name);                             // "Tommy" → found on dog itself
console.log(dog.eats);                             // true → not on dog, so JS looks up to animal
console.log(dog.describe());                       // "Tommy eats: true" → method borrowed from animal
console.log(Object.getPrototypeOf(dog) === animal); // true → dog's parent is animal
console.log(Object.hasOwn(dog, 'eats'));           // false → eats lives on the parent, not on dog
console.log(dog.fly);                              // undefined → not found anywhere in the chain
```

**Output:**

```text
Tommy
true
Tommy eats: true
true
false
undefined
```

**What to notice:** `dog` only has `name`. Everything else comes from `animal`, through the prototype link.

## 🔍 Deeper version

**1. Two words that sound the same.**

| Name | What it is |
|---|---|
| `Object.getPrototypeOf(obj)` (old name: `obj.__proto__`) | The link **from an object to its parent**. Every object has one. |
| `Fn.prototype` | A property that only **functions and classes** have. It becomes the parent of every object made with `new Fn()`. |

```js
function Candidate(name) {                          // an old-style "constructor function"
  this.name = name;                                 // each new object gets its own name
}                                                   // end of Candidate
Candidate.prototype.greet = function () {           // put greet on the shared prototype
  return `Hi, I am ${this.name}`;                   // this = the object that called greet
};                                                  // end of greet

const c = new Candidate('Asha');                    // new makes an object whose parent is Candidate.prototype
console.log(c.greet());                             // "Hi, I am Asha" → greet is found on the prototype
console.log(Object.getPrototypeOf(c) === Candidate.prototype); // true
```

**2. Where the chain ends.** A normal object's chain is: `obj → Object.prototype → null`. That's why every object has `toString` and `hasOwnProperty`. They live on `Object.prototype`. An array's chain is `arr → Array.prototype → Object.prototype → null`. That's where `map` and `filter` come from.

**3. Reading vs writing.** **Reading** a property walks up the chain. **Writing** a property always creates it on the object itself. It never changes the prototype. So `dog.eats = false` gives `dog` its own `eats`. It "shadows" (hides) the parent's value, and `animal.eats` is still `true`.

**4. Classes are prototypes underneath.** In `class Candidate { greet() {} }`, `greet` goes on `Candidate.prototype`, exactly like the old code above. `extends` links one prototype to another. See [classes](topic:javascript/classes).

**5. Useful tools:**
- `Object.create(proto)` makes an object with a chosen parent. `Object.create(null)` makes an object with **no** parent. It is a clean dictionary with no `toString`.
- `Object.hasOwn(obj, key)` checks only the object itself, not the chain.
- `for...in` loops over the chain's properties too (only the ones you can loop over). `Object.keys` gives only the object's own keys.

**6. Performance note.** Don't change an object's prototype after creating it with `Object.setPrototypeOf`. JavaScript engines optimise objects based on their shape. Changing the prototype later makes the code slower.

## 🎯 Why do we use it?

- **Sharing methods saves memory.** 10,000 candidate objects can share one `greet` method on the prototype. They don't need 10,000 copies.
- **It is how all built-in features work.** Every array gets `map` and every string gets `toUpperCase` through the prototype chain.
- **It is the base of classes and inheritance** in JavaScript. Understanding it explains strange bugs with `this`, `instanceof` and `for...in`.

## ⚠️ Common mistakes

- **Mixing up `__proto__` and `prototype`.** Objects have a parent link. Only functions and classes have a `.prototype` property.
- **Adding methods to built-ins**, like `Array.prototype.myThing = ...`. Every array in the app changes. It can clash with libraries and future JavaScript features.
- **Using arrow functions as prototype methods.** Arrow functions don't get their own `this`, so `this.name` won't point to the object.
- **Using `for...in` on objects with a custom prototype** and getting parent properties by surprise. Use `Object.keys` or `Object.hasOwn`.

## 🗣️ How to answer in an interview

> "Every object in JavaScript has an internal link to another object, its prototype. When I read a property that isn't on the object, the engine looks up the prototype chain until it finds it or reaches null at the end of Object.prototype. That's prototypal inheritance.
>
> Methods are usually stored on the prototype, so all instances share one copy, and each instance only holds its own data. When I call new on a function or class, the new object's prototype is set to that function's prototype property.
>
> ES6 classes are syntax on top of this. Methods in a class body go on Class.prototype, and extends links the prototypes together. One detail I keep in mind: reading walks the chain, but writing always creates the property on the object itself."

## 🔁 Follow-up questions

### How does `instanceof` work?

`obj instanceof Fn` walks up `obj`'s prototype chain. It returns `true` if it finds `Fn.prototype` anywhere on that chain.

### What does `Object.create(null)` give you, and why use it?

An object with **no** prototype. It has no `toString` or `hasOwnProperty`. It's a clean map for user-supplied keys, so a key like `"__proto__"` can't cause trouble. Often a `Map` is an even better choice.

### Why is extending built-in prototypes a bad idea?

It changes the behaviour for the whole app and every library in it. Your method name may clash with a future JavaScript feature. This happened in the past and forced new array methods to get different names.

### What is property shadowing?

When an object has its own property with the same name as one on its prototype. The object's own value "hides" the parent's value. The parent is not changed.

## ✅ Quick check

### 1. What does this print?

```js
const parent = { greet: () => 'hi' };              // a parent object with a greet method
const child = Object.create(parent);               // child's prototype is parent
console.log(child.greet(), Object.hasOwn(child, 'greet')); // ?
```

:::answer
**`hi false`.** `greet` is found through the prototype chain, but it is not the child's own property.
:::

### 2. What does this print?

```js
const animal = { legs: 4 };                        // parent
const bird = Object.create(animal);                // bird's parent is animal
bird.legs = 2;                                     // writing creates bird's OWN legs
console.log(bird.legs, animal.legs);               // ?
```

:::answer
**`2 4`.** Writing `bird.legs` creates a new property on `bird`. It shadows the parent's value but doesn't change `animal`.
:::

### 3. True or false: methods written inside a `class` body are copied into every object you create.

:::answer
**False.** They live once on `ClassName.prototype`. Every object shares them through the prototype chain.
:::
