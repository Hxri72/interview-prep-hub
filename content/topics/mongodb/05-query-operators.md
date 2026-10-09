---
title: Query operators ($eq, $in, $gt, $regex…)
stack: mongodb
order: 5
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Query operators start with $ and go inside a filter to say HOW to match, like { experience: { $gte: 3 } }."
  - "Compare: $eq, $ne, $gt, $gte, $lt, $lte. Lists: $in, $nin. Logic: $and, $or, $not, $nor. Fields: $exists. Text patterns: $regex."
  - Listing several fields in one filter already means AND.
  - "Arrays: { skills: 'Node.js' } matches if the array CONTAINS it. Use $all for 'contains all' and $elemMatch for 'one element matches all conditions'."
  - Use indexes for these queries, and be careful with $regex — only patterns starting with ^ can use an index well.
cards:
  - q: How do you find candidates with 3 or more years of experience?
    a: "find({ experience: { $gte: 3 } }) — $gte means 'greater than or equal to'."
  - q: What is the difference between $in and $or?
    a: "$in checks ONE field against many values ({ city: { $in: ['Kochi', 'Pune'] } }). $or combines different conditions, which can be on different fields."
  - q: How do you match an array field?
    a: "{ skills: 'React' } matches if the array contains 'React'. $all needs all listed values; $elemMatch needs one element to meet several conditions."
  - q: Why can $regex be slow?
    a: "Most regex queries scan every value. Only a case-sensitive pattern that starts with ^ (a prefix) can use an index efficiently."
  - q: What does $exists do?
    a: "Matches documents that have (true) or don't have (false) a field, e.g. { linkedin: { $exists: false } }."
---

## 💡 What is it?

A **filter** tells MongoDB which [documents](glossary:document) you want. A simple filter checks for an exact value: `{ city: 'Kochi' }`.

But often you need more: "experience **at least** 3", "city is **one of** Kochi or Pune", "name **starts with** A". For this, MongoDB has **query operators**. They all start with a `$` sign.

You put an operator inside the field's value: `{ experience: { $gte: 3 } }`.

## 🏠 Real-life example

Think of the **filters on a shopping app**.

- "Price **less than** ₹500" → `$lt`
- "Brand is **one of** Nike, Puma, Adidas" → `$in`
- "Rating **4 or more**" → `$gte`
- "Name **contains** 'shoe'" → `$regex`
- "**Only** items with free delivery" → `$exists` / `$eq`

You can tick many filters at once. The app shows only items that pass **all** of them. MongoDB does the same: many conditions in one filter means **AND**.

- **The filter panel** = the filter object.
- **Each checkbox or slider** = one query operator.
- **Showing only items that pass every filter** = AND logic.

## 🧑‍💻 Code example

**Setup:** MongoDB running locally, or a free Atlas cluster (set `MONGODB_URI`). Run `npm init -y` and `npm install mongodb`. Save as `operators.js`. It uses CommonJS. Run with `node operators.js`.

```js
const { MongoClient } = require('mongodb');                          // the official MongoDB driver
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'); // local MongoDB by default

async function main() {                                              // async, because DB calls take time
  await client.connect();                                            // open the connection
  const c = client.db('hiring').collection('candidates');            // the candidates collection
  await c.deleteMany({});                                            // clean start for the demo
  await c.insertMany([                                               // four sample candidates
    { name: 'Asha', city: 'Kochi', experience: 3, skills: ['Node.js', 'React'] },              // has Node and React
    { name: 'Ravi', city: 'Pune', experience: 6, skills: ['Java'], linkedin: 'in/ravi' },      // only one with linkedin
    { name: 'Anil', city: 'Kochi', experience: 1, skills: ['React'] },                         // a junior
    { name: 'Meera', city: 'Chennai', experience: 4, skills: ['Node.js', 'MongoDB'] },         // Node and MongoDB
  ]);                                                                // end of insertMany

  const count = (filter) => c.countDocuments(filter);                // small helper: how many match this filter?

  console.log('$gte 3 yrs:', await count({ experience: { $gte: 3 } }));                 // Asha, Ravi, Meera → 3
  console.log('$in cities:', await count({ city: { $in: ['Kochi', 'Pune'] } }));        // Asha, Ravi, Anil → 3
  console.log('AND:', await count({ city: 'Kochi', experience: { $gt: 2 } }));          // two fields = AND → Asha → 1
  console.log('$or:', await count({ $or: [{ city: 'Pune' }, { experience: { $lt: 2 } }] })); // Ravi OR Anil → 2
  console.log('array has:', await count({ skills: 'Node.js' }));                        // array contains 'Node.js' → 2
  console.log('$all:', await count({ skills: { $all: ['Node.js', 'React'] } }));        // has BOTH → Asha → 1
  console.log('$exists:', await count({ linkedin: { $exists: true } }));                // has a linkedin field → 1
  console.log('$regex:', await count({ name: { $regex: '^A' } }));                      // name starts with A → 2

  await client.close();                                              // close the connection
}                                                                    // end of main

main().catch(console.error);                                         // run, and print any error
```

**Output:**

```text
$gte 3 yrs: 3
$in cities: 3
AND: 1
$or: 2
array has: 2
$all: 1
$exists: 1
$regex: 2
```

## 🔍 Deeper version

**The operators you'll use most:**

| Group | Operators | Example |
|---|---|---|
| Compare | `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte` | `{ experience: { $gte: 3, $lte: 6 } }` (a range) |
| Lists | `$in`, `$nin` | `{ status: { $in: ['applied', 'shortlisted'] } }` |
| Logic | `$and`, `$or`, `$nor`, `$not` | `{ $or: [{ city: 'Pune' }, { remote: true }] }` |
| Fields | `$exists`, `$type` | `{ deletedAt: { $exists: false } }` |
| Arrays | `$all`, `$elemMatch`, `$size` | `{ skills: { $all: ['Node.js', 'React'] } }` |
| Text | `$regex`, `$text` | `{ name: { $regex: '^as', $options: 'i' } }` |

**AND is the default.** `{ city: 'Kochi', experience: { $gt: 2 } }` already means "city is Kochi AND experience > 2". You need `$and` only when two conditions use the **same key**, like two `$or` groups.

**Prefer `$in` over `$or` on one field.** `{ city: { $in: ['Kochi', 'Pune'] } }` is shorter and easier for MongoDB to plan than an `$or` with two branches.

**Arrays are special:**
- `{ skills: 'React' }` → matches if **any** element equals `'React'`.
- `{ skills: ['React'] }` → matches only if the array is **exactly** `['React']`.
- `$elemMatch` is for arrays of objects. Say each application has `{ jobId, status }`. Then `{ applications: { $elemMatch: { jobId: 7, status: 'shortlisted' } } }` makes sure **one** element meets **both** conditions. Without `$elemMatch`, one element could match `jobId` and a different element could match `status`.

**Dot notation** reaches into nested objects: `{ 'address.city': 'Kochi' }`. The quotes are needed because of the dot.

**`$regex` and speed.** A [regular expression](glossary:regex) is a text pattern.
- A pattern with `^` at the start (a prefix), and no `i` (case-insensitive) option, can use an [index](glossary:index) well.
- Patterns like `/node/i` must check every value. On a big collection, that is slow.
- For real search, use a text index (`$text`) or Atlas Search.

**`$ne` and `$nin` can't use indexes well.** "Not equal" matches almost everything, so MongoDB still has to look at most of the data.

**Security:** never put raw user input straight into a filter. Someone could send `{ "$ne": null }` instead of a password and match everyone. This is called [NoSQL injection](topic:mongodb/nosql-injection).

## 🎯 Why do we use it?

Real screens need real filters. A recruiter wants "Node.js candidates in Kochi or Pune with 3–6 years, who haven't been rejected". That's one filter:

```js
{                                                    // one filter object
  skills: 'Node.js',                                 // array contains Node.js
  city: { $in: ['Kochi', 'Pune'] },                  // one of these cities
  experience: { $gte: 3, $lte: 6 },                  // between 3 and 6 years
  status: { $ne: 'rejected' },                       // not rejected
}                                                    // end of the filter
```

Doing this in the database is much faster than loading everything into Node and filtering there.

## ⚠️ Common mistakes

- **Using `$or` on one field** where `$in` is simpler and faster.
- **Expecting `{ skills: ['React'] }` to mean "contains React".** It means "is exactly `['React']`". Use `{ skills: 'React' }`.
- **Case-insensitive `$regex` on big collections.** It scans everything. Use a prefix, a text index or Atlas Search.
- **Passing user input straight into the filter.** A user could send operators like `$ne` or `$gt`. Validate the types first.

## 🗣️ How to answer in an interview

> "Query operators are $-prefixed keys inside a filter that say how to match. For comparisons I use $gt, $gte, $lt and $lte, and for lists $in and $nin. Several fields in one filter already mean AND, and I use $or for alternatives.
>
> Arrays are matched by their elements, so skills: 'React' means 'contains React'. $all means it contains all the listed values, and $elemMatch makes one array element meet several conditions, which matters for arrays of objects.
>
> I'm careful with $regex, because only an anchored prefix can use an index well. And I validate user input, so nobody can inject operators like $ne into a filter. For filters used often, I add indexes that match them."

[FILL IN: an example of a real recruiter filter you built at SkillKeepr (which fields were filtered), only if you remember it accurately.]

## 🔁 Follow-up questions

### When do you need $and explicitly?

When you have two conditions on the **same key**, like two `$or` groups. A JavaScript object can't hold the same key twice, so you wrap them: `{ $and: [{ $or: [...] }, { $or: [...] }] }`.

### What is the difference between $elemMatch and normal array matching?

With normal matching, different conditions can be met by **different** elements of the array. `$elemMatch` requires **one single element** to meet all the conditions together.

### How do you search text without being slow?

Use a text index with `$text`, or Atlas Search on MongoDB Atlas. A prefix `$regex` like `^Asha`, without the `i` flag, can also use a normal index.

### How do you find documents where a field is missing?

`{ field: { $exists: false } }`. Note: `{ field: null }` matches documents where the field is missing **or** is `null`.

## ✅ Quick check

### 1. Which filter finds candidates in Kochi OR Pune, written the simplest way?

- A) `{ city: 'Kochi', city: 'Pune' }`
- B) `{ city: { $in: ['Kochi', 'Pune'] } }`
- C) `{ $and: [{ city: 'Kochi' }, { city: 'Pune' }] }`

:::answer
**B.** `$in` checks one field against a list of values. (A is broken: the second `city` key overwrites the first. C asks for both cities at once, so nothing matches.)
:::

### 2. A candidate has `skills: ['Node.js', 'React']`. Does `{ skills: 'React' }` match it?

:::answer
**Yes.** For arrays, an exact value matches if the array **contains** that value.
:::

### 3. Why can `{ name: { $regex: 'sha', $options: 'i' } }` be slow on a big collection?

:::answer
It is not anchored with `^` and is case-insensitive, so MongoDB can't use an index well. It has to check every name.
:::
