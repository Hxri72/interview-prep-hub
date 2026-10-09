---
title: lean(), select() and query performance
stack: mongodb
order: 16
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - lean() returns plain JavaScript objects instead of full Mongoose documents. It is faster and uses less memory.
  - "Use lean() for read-only API responses. Don't use it when you need save(), virtuals, getters or instance methods."
  - "select() (projection) picks which fields come back: select('name email') or select('-password')."
  - "select: false on a schema field hides it by default (like a password). Use select('+password') to get it when needed."
  - Fast reads = an index on the filter + select only needed fields + limit + lean.
cards:
  - q: What does lean() do?
    a: It makes Mongoose return plain JavaScript objects instead of hydrated Mongoose documents, which is faster and uses less memory.
  - q: What do you lose with lean()?
    a: save() and other document methods, virtuals, getters, defaults applied on load, and change tracking. You get only the raw data.
  - q: What does select('-password') mean?
    a: Return every field except password. A minus sign excludes a field; a plain name includes it.
  - q: How do you hide a field by default in every query?
    a: "Set select: false on it in the schema. Then load it only when needed with .select('+password')."
  - q: Why is selecting fewer fields faster?
    a: Less data is read and sent over the network, less memory is used in Node, and with the right index MongoDB may answer from the index alone.
---

## 💡 What is it?

By default, Mongoose turns every result into a full **Mongoose document**. A document has extra features: `save()`, change tracking, virtuals and more. That extra work takes time and memory.

**`lean()`** tells Mongoose: "Just give me **plain objects**." It's faster and lighter.

**`select()`** tells MongoDB **which fields** to send back. This is called a **projection**. Fewer fields means less data to read and send.

## 🏠 Real-life example

Think of **asking the school office for information**.

- You only need the **phone numbers** of the class. You ask: "Just the phone numbers, please." You don't get every student's full file. That's **`select()`**.
- If you only want to **read** the list, a **photocopy** is enough. You don't need the original file with stamps, signatures and the right to edit it. That's **`lean()`**.
- If you want to **change** a student's record, you need the **original file**, not a photocopy. That's a full Mongoose document with `save()`.

Now map it:
- **The full student file** = a Mongoose document.
- **The photocopy** = a lean plain object.
- **"Just the phone numbers"** = `select('phone')`.
- **Changing the record** = needing `save()`, so don't use `lean()`.

## 🧑‍💻 Code example

You need MongoDB running locally (or a free Atlas cluster). Run `npm init -y` and `npm install mongoose`. Save this as `lean.js` and run `node lean.js`. (CommonJS style.)

```js
const mongoose = require('mongoose');                                   // load Mongoose

const candidateSchema = new mongoose.Schema({                           // the candidate schema
  name: String,                                                         // shown in lists
  email: String,                                                        // shown in lists
  resumeText: String,                                                   // big field we rarely need in lists
  password: { type: String, select: false },                            // hidden from every query by default
});                                                                     // end of schema
const Candidate = mongoose.model('Candidate', candidateSchema);         // the model

async function main() {                                                 // async so we can use await
  await mongoose.connect('mongodb://127.0.0.1:27017/hiring_lean');      // connect to a test database
  await Candidate.deleteMany({});                                       // start clean
  await Candidate.create({ name: 'Asha', email: 'asha@mail.com', resumeText: 'long text…', password: 'hash' }); // one candidate

  const full = await Candidate.findOne();                               // normal query → Mongoose document
  console.log(full instanceof mongoose.Document, typeof full.save);    // true 'function' → it has save()

  const plain = await Candidate.findOne().lean();                       // lean query → plain object
  console.log(plain instanceof mongoose.Document, typeof plain.save);  // false 'undefined' → just data

  const list = await Candidate.find().select('name email -_id').lean(); // only name + email, no _id
  console.log(list);                                                    // small, clean result

  console.log('password' in plain);                                     // false: select:false hid it
  const withPw = await Candidate.findOne().select('+password').lean();  // ask for it on purpose (e.g. at login)
  console.log('password' in withPw);                                    // true

  await mongoose.disconnect();                                          // close the connection
}                                                                       // end of main

main();                                                                 // run it
```

**Output:**

```text
true function
false undefined
[ { name: 'Asha', email: 'asha@mail.com' } ]
false
true
```

## 🔍 Deeper version

**What `lean()` skips.** A normal result goes through **hydration**. That means Mongoose builds a full document object, with change tracking, getters, setters, virtuals and methods. For a list of 1,000 candidates, that's a lot of extra objects. `lean()` skips all of it, so it's usually **several times faster** and uses much less memory.

| | Mongoose document | `lean()` object |
|---|---|---|
| `save()`, `isModified()` | yes | no |
| Virtuals, getters | yes | no (plugins can add them) |
| Instance methods | yes | no |
| Speed and memory | slower, heavier | faster, lighter |
| Good for | changing data | read-only API responses |

**Rule of thumb:** `GET` list and detail endpoints → `lean()`. Load-change-save flows → normal documents.

**Projection with `select()`:**
- `select('name email')` → only those fields (plus `_id`).
- `select('-resumeText -__v')` → everything except those.
- You can't mix include and exclude in one projection, except for `_id`.
- The object form also works: `select({ name: 1, email: 1, _id: 0 })`.

**`select: false` in the schema** hides sensitive or heavy fields by default, like passwords or big text blobs. `select('+password')` brings it back just for the login query.

**A fast read checklist:**
1. An **[index](glossary:index)** that matches the filter and sort (see [indexes](topic:mongodb/indexes)).
2. **Select** only the fields the screen needs.
3. **Limit** the results and paginate (see [pagination](topic:mongodb/pagination)).
4. **`lean()`** if you don't need document features.
5. **Check with `explain()`** (see [explain](topic:mongodb/explain)).

**Covered queries.** If the filter, sort and **all returned fields** are in one index, MongoDB can answer **from the index alone**, without reading the documents. That's very fast. For example, an index on `{ tenantId: 1, email: 1 }` plus `select('email -_id')`.

**Big exports.** For reading huge sets (like exporting 1 million candidates), use `Candidate.find().lean().cursor()`. It streams documents one by one instead of loading all into memory (see [streams](topic:nodejs/streams)).

**Lean and TypeScript.** `lean()` results are typed as plain objects, so methods and virtuals don't appear in the type. That's a helpful reminder that they're not there.

## 🎯 Why do we use it?

Most API traffic is **reads**: lists, search results, dashboards.
- `lean()` makes those reads cheaper in CPU and memory, so one server handles more users.
- `select()` sends less data from the database and less JSON to the browser. That's faster on phones and slow networks.
- `select: false` protects secrets, so a password hash never leaks into an API response by accident.

## ⚠️ Common mistakes

- **Calling `save()` on a lean result.** It's a plain object, so `save` is not a function.
- **Reading a virtual after `lean()`.** It's `undefined`.
- **Sending whole documents to the frontend**, including big or private fields. Always `select` what the screen needs.
- **Thinking `lean()` fixes a slow query.** If the query scans the whole collection, you need an index first.

## 🗣️ How to answer in an interview

> "By default Mongoose hydrates every result into a full document with change tracking, virtuals and methods. lean tells it to return plain JavaScript objects instead. That's much faster and uses less memory, so I use it for read-only endpoints like lists and detail pages. I don't use it when I need save, virtuals or instance methods.
>
> select controls the projection, which fields come back. I select only what the screen needs, and I mark sensitive fields like password with select false in the schema, so they're hidden by default. The login query uses select plus password on purpose.
>
> But lean and select are the last steps. A fast query first needs the right index, then a limit or pagination, and I check it with explain."

[FILL IN: a real read endpoint at SkillKeepr where you used lean or select, or saw a speed gain. Only add it if it's true.]

## 🔁 Follow-up questions

### Does `lean()` work with `populate()`?

Yes. The populated documents are plain objects too. Lean and populate together are common for list APIs.

### How do you get virtuals with `lean()`?

Use the `mongoose-lean-virtuals` plugin and call `.lean({ virtuals: true })`, or calculate the value yourself in the service.

### Why exclude `__v`?

`__v` is Mongoose's version key, used for some array update checks. The frontend never needs it, so many APIs remove it with `select('-__v')` or a `toJSON` transform.

### What is a covered query?

A query whose filter, sort and returned fields are all inside one index. MongoDB answers from the index without reading documents. In `explain()` you'll see `totalDocsExamined: 0`.

## ✅ Quick check

### 1. What happens here?

```js
const c = await Candidate.findById(id).lean();     // plain object
c.name = 'New name';                               // change it
await c.save();                                    // try to save
```

:::answer
**`TypeError: c.save is not a function`.** Lean results are plain objects. Remove `lean()` when you need `save()`, or use `updateOne`.
:::

### 2. The schema has `password: { type: String, select: false }`. What does `Candidate.findOne()` return for `password`?

:::answer
Nothing. The field is not in the result. Use `.select('+password')` to include it.
:::

### 3. Which change helps MOST if a list query scans 2 million documents?

- A) Add `lean()`
- B) Add an index that matches the filter and sort
- C) Remove `__v`

:::answer
**B.** Without an index, MongoDB still reads every document. `lean()` only saves work after the data arrives.
:::
