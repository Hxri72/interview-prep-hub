---
title: BSON, _id and ObjectId
stack: mongodb
order: 3
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - MongoDB stores documents as BSON (binary JSON). It is faster to read than text JSON and has extra types like Date and ObjectId.
  - Every document needs a unique _id. If you don't give one, MongoDB creates an ObjectId.
  - An ObjectId is 12 bytes (24 hex characters). The first 4 bytes are the time it was made, so you can get its creation time.
  - Compare ObjectIds with .equals() or as strings, never with ===.
  - Check that an id from the URL is valid before you query with it, or you get a cast error.
cards:
  - q: What is BSON?
    a: Binary JSON — the format MongoDB uses to store documents. It is fast to scan and supports extra types like Date, ObjectId, Decimal128 and binary data.
  - q: What is an ObjectId made of?
    a: "12 bytes: a 4-byte timestamp (seconds), a 5-byte random value, and a 3-byte counter. Shown as 24 hex characters."
  - q: Can you get the creation time from an ObjectId?
    a: Yes. The first 4 bytes are a timestamp, so id.getTimestamp() returns a Date (accurate to the second).
  - q: Why does id1 === id2 return false even for the same id?
    a: ObjectIds are objects, and === compares object references. Use id1.equals(id2) or compare id1.toString() === id2.toString().
  - q: Can _id be something other than an ObjectId?
    a: Yes. It can be any unique value except an array, like a number, a string or an email. It just must be unique in the collection.
---

## 💡 What is it?

**BSON** means "binary JSON". MongoDB saves your [documents](glossary:document) in this format. Binary means it is stored as bytes, not as readable text.

Every document has a special field called **`_id`**. It must be unique in its [collection](glossary:collection). It works like a roll number.

If you don't give an `_id`, MongoDB makes one for you. That value is an **[ObjectId](glossary:objectid)**: a short, unique id that also contains the time it was made.

## 🏠 Real-life example

Think of **tokens at a bank or a hospital counter**.

When you arrive, the machine prints a token like **"0930-17-042"**:
- **0930** = the time you came (9:30).
- **17** = which machine printed it.
- **042** = you were the 42nd person at that machine.

No two people get the same token, even if two machines print at the same second.

- The **token** = the ObjectId.
- **The time part** = the 4-byte timestamp at the start of the ObjectId.
- **The machine part** = the random value, which is different for each running program.
- **The counter** = the counter that goes up for each new id.
- **Your token number written in your file** = the `_id` field.

## 🧑‍💻 Code example

This one works **without a database**. Run `npm init -y` and `npm install mongodb`. Save as `objectid.js`. It uses CommonJS. Run with `node objectid.js`.

```js
const { ObjectId } = require('mongodb');                          // the ObjectId class comes with the MongoDB driver

const id = new ObjectId();                                        // make a brand-new, unique ObjectId
console.log(id.toHexString().length);                             // 24 → 12 bytes shown as 24 hex characters
console.log(id.getTimestamp() instanceof Date);                   // true → the first 4 bytes hold its creation time

const same = new ObjectId(id.toHexString());                      // a second ObjectId object with the SAME value
console.log(id === same);                                         // false → === compares objects, not their values
console.log(id.equals(same));                                     // true → .equals() compares the actual value
console.log(id.toString() === same.toString());                   // true → comparing as strings also works

console.log(ObjectId.isValid('abc'));                             // false → too short to be an ObjectId
console.log(ObjectId.isValid('64f1c2a9e4b0a1b2c3d4e5f6'));        // true → 24 hex characters
```

**Output:**

```text
24
true
false
true
true
false
true
```

## 🔍 Deeper version

**Why BSON and not plain JSON?**
- **Faster to scan.** BSON stores the length of each part, so MongoDB can skip fields quickly.
- **More types.** JSON only has strings, numbers, booleans, null, arrays and objects. BSON adds:
  - `Date` (real dates, not strings),
  - `ObjectId`,
  - `Decimal128` (exact decimals, good for money),
  - `Int32`, `Int64` and `Double` (different number types),
  - binary data.
- In Node, the driver turns BSON into normal JS objects for you. You rarely see raw BSON.

**What is inside an ObjectId (12 bytes):**

| Bytes | What it holds |
|---|---|
| 4 | the time it was made, in seconds |
| 5 | a random value, chosen once per running program |
| 3 | a counter that goes up for each new id |

So ObjectIds made later are usually "bigger". Sorting by `_id` is **roughly** sorting by creation time (to the second). This is handy for [pagination](topic:mongodb/pagination).

**The `_id` field rules:**
- Every document must have one, and it must be **unique** in the collection.
- MongoDB always keeps a unique [index](glossary:index) on `_id`, so finding by `_id` is fast.
- It can be any type except an array. Some teams use a natural key, like a company code.
- It cannot be changed after the document is saved.

**ObjectIds in an Express app.** An id from the URL, like `/candidates/:id`, arrives as a **string**. Two things to remember:
1. **Validate it.** If the string is not a valid ObjectId, Mongoose throws a `CastError`. Return a `400 Bad Request`, not a `500`.
2. **Use a helper.** `ObjectId.isValid(str)` from the driver, or `mongoose.isObjectIdOrHexString(str)` from Mongoose, both check it for you.

:::version[Version note]
Older versions of the BSON library also said "valid" for **any 12-character string**, like `'hello world!'`. Old blog posts warn about this. Current versions return `false` for it (tested with MongoDB driver 7 and Mongoose 9).
:::

**Mongoose and ObjectIds.** In a Mongoose schema, references use `Schema.Types.ObjectId`. Mongoose also gives every document an `id` getter. It returns `_id` as a string.

## 🎯 Why do we use it?

- **Unique ids without asking a central server.** Any app server can create an ObjectId by itself, and it will still be unique. That's important when many servers write at the same time.
- **Free creation time.** You can sort by `_id` or read the creation time from it.
- **Correct types.** BSON keeps dates as real dates and money as exact decimals. So comparisons and maths work correctly.

## ⚠️ Common mistakes

- **Comparing ObjectIds with `===`.** It is always `false` for two different objects. Use `.equals()` or compare strings.
- **Not validating ids from the URL.** A bad id leads to a `CastError` and a 500 error. Validate first and return 400.
- **Storing dates as strings.** `"10/09/2026"` can't be sorted or compared correctly. Save real `Date` values.
- **Storing money as normal numbers.** `0.1 + 0.2` is not exactly `0.3` with floating-point numbers. Use `Decimal128` or store the amount in paise or cents as whole numbers.

## 🗣️ How to answer in an interview

> "MongoDB stores documents in BSON, which is binary JSON. It's faster to scan than text JSON and has extra types like Date, ObjectId and Decimal128.
>
> Every document has a unique _id with a unique index on it. If I don't set it, MongoDB creates an ObjectId. That's 12 bytes: a 4-byte timestamp, a 5-byte random value and a 3-byte counter. So I can get the creation time with getTimestamp, and sorting by _id roughly follows insert order.
>
> In an Express API, ids from the URL arrive as strings, so I validate them first and return 400 for a bad id instead of letting a CastError become a 500. And I compare ObjectIds with .equals or as strings, never with triple equals."

[FILL IN: if SkillKeepr uses custom _id values (not ObjectId) anywhere, mention it here. Only if true.]

## 🔁 Follow-up questions

### Is an ObjectId guaranteed to be in exact insert order?

No. It's only roughly in order, to the second. Two ids made in the same second on different servers can be in any order. If you need exact order, use a `createdAt` field or a counter.

### Should you expose ObjectIds in public URLs?

It is common and fine for most apps. But an ObjectId shows when the record was created. And ids are not secret, so never use "hard to guess" as security. Always check that the user is allowed to see the record.

### How do you convert a string to an ObjectId?

With the driver: `new ObjectId(str)`. Mongoose does it for you when you query a field that is typed as ObjectId. But validate the string first.

### What is Decimal128 used for?

For exact decimal numbers, like money. Normal JavaScript numbers are floating-point, so small rounding errors can happen.

## ✅ Quick check

### 1. What does this print?

```js
const { ObjectId } = require('mongodb');   // load ObjectId
const a = new ObjectId('64f1c2a9e4b0a1b2c3d4e5f6'); // an ObjectId from a string
const b = new ObjectId('64f1c2a9e4b0a1b2c3d4e5f6'); // another one with the same value
console.log(a === b, a.equals(b));         // ?
```

:::answer
**`false true`.** `===` compares two different objects, so it's false. `.equals()` compares the value, so it's true.
:::

### 2. How many characters long is an ObjectId written as a hex string?

- A) 12
- B) 24
- C) 36

:::answer
**B) 24.** An ObjectId is 12 bytes, and each byte is 2 hex characters.
:::

### 3. A user calls `GET /candidates/abc`. What should your API return?

:::answer
**400 Bad Request.** `abc` is not a valid ObjectId. Validate the id first, instead of letting the database throw a CastError that becomes a 500.
:::
