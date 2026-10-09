---
title: Classes (ES6+)
stack: javascript
order: 19
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A class is a blueprint for making objects that share the same shape and methods.
  - constructor runs once when you call new; methods in the class body are shared through the prototype.
  - extends makes a child class, and super calls the parent's constructor or methods.
  - "#private fields can only be used inside the class; static members belong to the class itself, not to each object."
  - Classes are syntax on top of prototypes, not a new kind of inheritance.
cards:
  - q: What is a class in JavaScript?
    a: A blueprint for creating objects with the same fields and methods. Underneath, it uses prototypes.
  - q: What does the constructor do?
    a: It runs once when you create an object with new. It sets up that object's own data, like this.name = name.
  - q: What does super do?
    a: In a child class, super(...) calls the parent's constructor, and super.method() calls the parent's version of a method.
  - q: "What is a #private field?"
    a: A field whose name starts with #. It can only be read or changed by code inside the class. Outside code gets an error or can't see it.
  - q: What is a static method?
    a: A method on the class itself, not on each object. You call it as ClassName.method(), for example a factory or a helper.
---

## 💡 What is it?

A **class** is a **blueprint for making objects**.

You describe the data (fields) and the actions (methods) once. Then you use `new` to make as many objects as you want from it.

Classes came in ES6 (2015). They are a cleaner way to write what JavaScript already did with [prototypes](topic:javascript/prototypes).

## 🏠 Real-life example

Think of a **school ID card template**.

The school designs one template. It has spaces for name, class and photo. Every student gets a card made from that template, with their own details.

- **The template** = the class.
- **Each printed ID card** = an object (an "instance").
- **Filling in the name and photo** = the constructor.
- **"Show your card at the gate"** = a method every card can do.
- **The secret barcode only the school scanner reads** = a `#private` field.
- **The school's total count of cards printed** = a `static` field. It belongs to the template, not to one card.
- **A special template for prefects, built on the normal one** = a child class made with `extends`.

## 🧑‍💻 Code example

Save this as `classes.js`. Run it with `node classes.js`.

```js
class Candidate {                                  // a class = a blueprint for making candidate objects
  static count = 0;                                // a static field belongs to the class, not to each object
  #salary;                                         // a private field: code outside the class cannot read it

  constructor(name, salary) {                      // runs once when you write new Candidate(...)
    this.name = name;                              // a public field: anyone can read it
    this.#salary = salary;                         // save the salary in the private field
    Candidate.count++;                             // add 1 to the shared counter
  }                                                // end of constructor

  greet() {                                        // a method shared by all candidates
    return `Hi, I am ${this.name}`;                // this = the candidate that called greet()
  }                                                // end of greet

  hasSalaryAbove(amount) {                         // a method that may use the private field
    return this.#salary > amount;                  // inside the class, #salary is allowed
  }                                                // end of hasSalaryAbove
}                                                  // end of class Candidate

class SeniorCandidate extends Candidate {          // extends = SeniorCandidate inherits everything from Candidate
  greet() {                                        // override: replace the parent's greet
    return `${super.greet()} (senior)`;            // super.greet() calls the parent's version first
  }                                                // end of greet
}                                                  // end of SeniorCandidate

const a = new Candidate('Asha', 50000);            // make a normal candidate
const b = new SeniorCandidate('Ravi', 90000);      // make a senior candidate

console.log(a.greet());                            // Hi, I am Asha
console.log(b.greet());                            // Hi, I am Ravi (senior)
console.log(b.hasSalaryAbove(80000));              // true → 90000 > 80000
console.log(a.salary);                             // undefined → #salary is private, a normal name finds nothing
console.log(Candidate.count);                      // 2 → two objects were made
console.log(typeof Candidate);                     // "function" → a class is a special function underneath
```

**Output:**

```text
Hi, I am Asha
Hi, I am Ravi (senior)
true
undefined
2
function
```

## 🔍 Deeper version

**1. It's prototypes underneath.** `greet` is stored once on `Candidate.prototype`. `extends` sets `SeniorCandidate.prototype`'s parent to `Candidate.prototype`. That's why `b.hasSalaryAbove` works even though `SeniorCandidate` never defined it. `typeof Candidate` is `"function"`.

**2. Rules that differ from old constructor functions:**
- You **must** call a class with `new`. Calling `Candidate()` without `new` throws a TypeError.
- Class bodies always run in **strict mode**. ("Strict mode" turns some silent mistakes into errors.)
- Classes are **not hoisted** like function declarations. Using a class before its line throws an error (the "temporal dead zone").
- In a child class, you must call `super(...)` **before** using `this` in the constructor.

**3. Field types:**

| Kind | Syntax | Where it lives |
|---|---|---|
| Public field | `name = '';` or `this.name = ...` | on each object |
| Private field | `#salary;` | on each object, only reachable inside the class |
| Method | `greet() {}` | once, on the prototype |
| Static field / method | `static count = 0;` | on the class itself |
| Getter / setter | `get fullName() {}` | on the prototype, used like a property |

**4. `#private` is real privacy.** It's not just a naming habit like `_salary`. Code outside the class can't read it. Writing `a.#salary` outside the class is a syntax error. You can check if an object has the field with `#salary in obj` (inside the class).

**5. `this` and callbacks.** Class methods don't bind `this` automatically. If you pass `obj.greet` as a callback, `this` is lost. Fix it with an arrow function field (`greet = () => {...}`) or `.bind(this)`. See [the this keyword](topic:javascript/this-keyword).

:::version[Version note]
Public and `#private` fields, `static` fields and private methods became standard in **ES2022**. Older code used `_name` by convention and set fields only inside the constructor.
:::

**6. Where you see classes in Node backends:** custom errors (`class AppError extends Error`), service classes, Mongoose models, and SDK clients like `new Stripe(key)`.

## 🎯 Why do we use it?

- **To make many similar objects** from one clear blueprint.
- **To keep data and its actions together**, like a `Cart` with `addItem()` and `total()`.
- **To hide internal details** with `#private` fields, so other code can't break them.
- **To reuse code** with `extends`. A common example is custom error types that extend `Error`.

## ⚠️ Common mistakes

- **Forgetting `super()`** in a child constructor before using `this`. JavaScript throws a ReferenceError.
- **Losing `this`** when passing a method as a callback, like `button.onclick = obj.greet`.
- **Thinking `_name` is private.** It's only a naming habit. Use `#name` for real privacy.
- **Using a class for everything.** Often a plain object or a few functions are simpler. That's especially true in React, where function components and hooks have replaced class components.

## 🗣️ How to answer in an interview

> "A class is a blueprint for creating objects with the same fields and methods. The constructor runs once with new and sets up each object's own data. Methods in the class body go on the prototype, so all instances share them. So classes are really syntax on top of prototypal inheritance.
>
> With extends I can create a child class, and super calls the parent's constructor or methods. Modern classes also have #private fields, which can't be accessed outside the class, and static members that belong to the class itself.
>
> In Node, I mostly see classes for custom errors, like an AppError that extends Error with a status code, and for service or client classes. One thing to watch is this: if I pass a method as a callback, I need an arrow function or bind."

[FILL IN: a class you wrote at SkillKeepr, for example a custom error or service class — only if it's true.]

## 🔁 Follow-up questions

### What is the difference between a class and a constructor function?

They both create objects through prototypes. Classes must be called with `new`, run in strict mode, aren't hoisted the same way, and support `extends`, `super`, `#private` and `static` with clean syntax.

### When would you use a static method?

For things that belong to the "idea" rather than one object. Examples: a factory like `User.fromJSON(data)`, a helper like `Math.max`, or a shared counter.

### `#private` vs `_private` — what's the difference?

`#private` is enforced by the language. Outside code cannot read it at all. `_private` is just a naming habit, and anyone can still read or change it.

### Why do custom errors extend Error?

So they keep the stack trace and work with `instanceof Error`. You can add your own fields, like `statusCode`, for an Express error handler.

## ✅ Quick check

### 1. What does this print?

```js
class A { hi() { return 'A'; } }                   // parent with hi()
class B extends A { hi() { return 'B' + super.hi(); } } // child overrides hi and calls the parent
console.log(new B().hi());                         // ?
```

:::answer
**`BA`.** `B`'s `hi` returns `'B'` plus the parent's `hi()`, which returns `'A'`.
:::

### 2. What happens here?

```js
class Counter { static total = 0; constructor() { Counter.total++; } } // count every new object
new Counter(); new Counter();                      // make two objects
console.log(Counter.total, new Counter().total);   // ?
```

- A) `2 2`
- B) `2 undefined`
- C) `3 undefined`

:::answer
**B) `2 undefined`.** `Counter.total` is 2 when it is read. Then a third object is made, but `total` is static, so the object itself doesn't have it. (After this line, `Counter.total` is 3.)
:::

### 3. True or false: calling a class without `new` (for example `Candidate('Asha')`) works like a normal function.

:::answer
**False.** It throws a TypeError: "Class constructor Candidate cannot be invoked without 'new'".
:::
