---
title: Update operators ($set, $inc, $push, $pull)
stack: mongodb
order: 6
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Update operators say HOW to change a document, so you don't overwrite the whole thing.
  - "$set changes or adds a field. $unset removes a field. $inc adds to a number (use a negative number to subtract)."
  - "$push adds to an array. $addToSet adds only if the value isn't there. $pull removes matching values from an array."
  - "Use $ to update the matched array element, and arrayFilters to update many elements by a rule."
  - Updates on one document are atomic, so $inc is safe even when many users click at the same time.
cards:
  - q: What is the difference between $push and $addToSet?
    a: $push always adds the value (duplicates allowed). $addToSet adds it only if it isn't already in the array.
  - q: Why use $inc instead of reading a number, adding 1 and saving it?
    a: $inc is atomic inside MongoDB. Read-add-save can lose updates when two requests run at the same time.
  - q: How do you remove a field from a document?
    a: "With $unset, for example { $unset: { draft: '' } }. The value you give doesn't matter."
  - q: How do you update one element inside an array of objects?
    a: "Match it in the filter and use the positional $: updateOne({ 'applications.jobId': 7 }, { $set: { 'applications.$.status': 'hired' } })."
  - q: What does $setOnInsert do?
    a: It sets fields only when an upsert creates a NEW document, like createdAt. On a normal update it does nothing.
---

## 💡 What is it?

When you update a [document](glossary:document), you usually want to change **one or two fields**, not the whole thing.

**Update operators** tell MongoDB exactly what to change. They start with a `$`:
- `$set` — set a field to a value.
- `$inc` — add to a number.
- `$push` — add an item to an array.
- `$pull` — remove items from an array.

You pass them as the second argument of `updateOne` or `updateMany`.

## 🏠 Real-life example

Think of **a form you filled in with a pencil**.

You don't tear it up and write a new form when one thing changes. You use small actions:

- **Rub out the phone number and write the new one** → `$set`
- **Rub out the "nickname" line completely** → `$unset`
- **Add 1 to "number of visits"** → `$inc`
- **Add a new hobby to the hobbies list** → `$push`
- **Add a hobby only if it isn't already written** → `$addToSet`
- **Cross out "cricket" from the hobbies list** → `$pull`

Each is a small, exact change. Everything else on the form stays the same.

## 🧑‍💻 Code example

**Setup:** MongoDB running locally, or a free Atlas cluster (set `MONGODB_URI`). Run `npm init -y` and `npm install mongodb`. Save as `updates.js`. It uses CommonJS. Run with `node updates.js`.

```js
const { MongoClient } = require('mongodb');                          // the official MongoDB driver
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'); // local MongoDB by default

async function main() {                                              // async, because DB calls take time
  await client.connect();                                            // open the connection
  const jobs = client.db('hiring').collection('jobs');               // the jobs collection
  await jobs.deleteMany({});                                         // clean start for the demo
  await jobs.insertOne({ title: 'Node.js Developer', openings: 2, tags: ['backend'], views: 0, draft: true }); // one job

  const f = { title: 'Node.js Developer' };                          // the filter we reuse: this one job

  await jobs.updateOne(f, {                                          // several operators in ONE update
    $set: { city: 'Kochi' },                                         // add a new field "city"
    $inc: { openings: 1, views: 10 },                                // openings 2 → 3, views 0 → 10
    $unset: { draft: '' },                                           // remove the "draft" field ('' is ignored)
  });                                                                // end of the first update

  await jobs.updateOne(f, { $push: { tags: { $each: ['remote', 'urgent'] } } }); // $push + $each adds two tags
  await jobs.updateOne(f, { $addToSet: { tags: 'backend' } });       // 'backend' already exists → nothing added
  await jobs.updateOne(f, { $pull: { tags: 'urgent' } });            // remove every 'urgent' from the array

  const job = await jobs.findOne(f, { projection: { _id: 0 } });     // read it back, hiding _id
  console.log(JSON.stringify(job));                                  // print the final document on one line

  await client.close();                                              // close the connection
}                                                                    // end of main

main().catch(console.error);                                         // run, and print any error
```

**Output:**

```text
{"title":"Node.js Developer","openings":3,"tags":["backend","remote"],"views":10,"city":"Kochi"}
```

## 🔍 Deeper version

**The main operators:**

| Operator | What it does | Example |
|---|---|---|
| `$set` | set or add a field | `{ $set: { status: 'closed' } }` |
| `$unset` | remove a field | `{ $unset: { draft: '' } }` |
| `$inc` | add to a number | `{ $inc: { views: 1 } }`, `{ $inc: { stock: -1 } }` |
| `$min` / `$max` | change only if the new value is lower / higher | `{ $max: { highScore: 90 } }` |
| `$currentDate` | set a field to the current date | `{ $currentDate: { updatedAt: true } }` |
| `$setOnInsert` | set only when an upsert inserts | `{ $setOnInsert: { createdAt: new Date() } }` |
| `$push` | add to an array (`$each` for many) | `{ $push: { notes: 'Called' } }` |
| `$addToSet` | add only if missing | `{ $addToSet: { tags: 'remote' } }` |
| `$pull` | remove values that match | `{ $pull: { tags: 'urgent' } }` |
| `$pop` | remove the first (`-1`) or last (`1`) item | `{ $pop: { notes: 1 } }` |

**Nested fields use dot notation:** `{ $set: { 'address.city': 'Kochi' } }`. This changes only `city`. Writing `{ $set: { address: { city: 'Kochi' } } }` would replace the **whole** `address` object.

**Updating inside arrays of objects.** Say a candidate has `applications: [{ jobId: 7, status: 'applied' }, ...]`.
- **Positional `$`** updates the **first** element matched by the filter:
  ```js
  await candidates.updateOne(                                   // update one candidate...
    { _id: candidateId, 'applications.jobId': 7 },              // ...whose array has jobId 7
    { $set: { 'applications.$.status': 'shortlisted' } },       // $ = "the element that matched"
  );                                                            // end of updateOne
  ```
- **`$[]`** updates **all** elements: `{ $set: { 'applications.$[].seen': true } }`.
- **`arrayFilters`** updates elements that pass a rule:
  ```js
  await candidates.updateOne(                                   // update one candidate...
    { _id: candidateId },                                       // ...by id
    { $set: { 'applications.$[a].status': 'closed' } },         // $[a] = elements named "a"
    { arrayFilters: [{ 'a.jobId': { $in: [7, 9] } }] },         // "a" = elements whose jobId is 7 or 9
  );                                                            // end of updateOne
  ```

**Why atomic operators matter.** Imagine two recruiters click "+1 opening" at the same moment:
- **Read → add → save** in Node: both read `2`, both save `3`. One click is **lost**.
- **`$inc: { openings: 1 }`**: MongoDB does it inside the document, one at a time. The result is `4`. Correct.

More on this in [atomic updates and locking](topic:mongodb/atomic-updates-locking).

**Pipeline updates.** You can also pass an **array** of aggregation stages as the update. Then a field can be computed from other fields, like `[{ $set: { fullName: { $concat: ['$first', ' ', '$last'] } } }]`.

## 🎯 Why do we use it?

- **Small, safe changes.** Only the fields you name are touched. Nothing else is overwritten by mistake.
- **Correct under load.** `$inc`, `$push` and `$addToSet` run inside MongoDB. So counters and lists stay correct when many users act at once.
- **Less data over the network.** You send just the change, not the whole document.

On a hiring platform, you might count job views with `$inc`, add a recruiter note with `$push`, or tag a candidate with `$addToSet`.

## ⚠️ Common mistakes

- **`$set` on a whole nested object** when you meant one field inside it. Use dot notation: `'address.city'`.
- **`$push` when duplicates are not allowed.** Use `$addToSet`.
- **Read-modify-save in Node for counters.** You lose updates when requests overlap. Use `$inc`.
- **Arrays that grow forever with `$push`.** Documents get slow, and can hit the 16 MB limit. Cap them with `$push: { $each: [...], $slice: -50 }` (keep only the last 50), or move the data to its own collection.

## 🗣️ How to answer in an interview

> "Update operators change only the parts of a document I name, instead of replacing it. $set sets or adds a field, $unset removes one, and $inc adds to a number. For arrays, $push adds an item, $addToSet adds it only if it's not there, and $pull removes matching items.
>
> For arrays of objects, I use the positional $ to update the element matched in the filter, or arrayFilters to update elements by a rule. For nested objects I use dot notation, so I don't overwrite the whole sub-object.
>
> These operators are atomic per document. That's why I use $inc for counters instead of reading, adding and saving in Node, which can lose updates when two requests overlap. And for upserts, I use $setOnInsert for fields like createdAt."

[FILL IN: one real update you wrote at SkillKeepr (for example changing an application's status inside a candidate or job document), only if you remember it accurately.]

## 🔁 Follow-up questions

### What happens if you $inc a field that doesn't exist?

MongoDB creates the field and sets it to the amount you added. So `$inc: { views: 1 }` on a document without `views` gives `views: 1`.

### What is the difference between $pull and $pop?

`$pull` removes **every** element that matches a value or a condition. `$pop` removes just the **first** or the **last** element, whatever it is.

### How do you keep only the latest 50 items in an array?

`{ $push: { notes: { $each: [newNote], $slice: -50 } } }`. `$slice: -50` keeps the last 50 items after the push.

### Can you use $set and $inc in the same update?

Yes, as long as they don't touch the same field. One update object can hold many operators.

## ✅ Quick check

### 1. A job has `openings: 2`. You run `updateOne(f, { $inc: { openings: -1 } })`. What is `openings` now?

:::answer
**1.** `$inc` with a negative number subtracts.
:::

### 2. `tags` is `['remote']`. You run `$addToSet: { tags: 'remote' }` and then `$push: { tags: 'remote' }`. What is `tags` now?

- A) `['remote']`
- B) `['remote', 'remote']`
- C) `['remote', 'remote', 'remote']`

:::answer
**B.** `$addToSet` adds nothing, because `'remote'` is already there. `$push` always adds, so you get a duplicate.
:::

### 3. A candidate is `{ address: { city: 'Kochi', pin: '682001' } }`. You run `$set: { address: { city: 'Pune' } }`. What happens to `pin`?

:::answer
**It is gone.** You replaced the whole `address` object. To change only the city, use `$set: { 'address.city': 'Pune' }`.
:::
