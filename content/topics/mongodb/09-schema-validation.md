---
title: Schema types, validation and defaults
stack: mongodb
order: 9
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - A Mongoose schema lists every field, its type (String, Number, Date, ObjectId…) and its rules.
  - Validators like required, min, max, enum, match and custom validate stop bad data before it is saved.
  - Defaults fill in missing values (status 'applied', createdAt now). Setters like trim and lowercase clean values.
  - Validation runs on save() and create(). Update queries skip it unless you pass runValidators true.
  - "unique: true is NOT a validator. It only creates a unique index, and duplicates fail with error code E11000."
cards:
  - q: What does a Mongoose schema define?
    a: The fields of a document, the type of each field, and rules like required, min/max, enum and default values.
  - q: When does Mongoose validation run?
    a: Before save() and create(). For updateOne / findOneAndUpdate it only runs if you pass { runValidators true }.
  - q: Is unique a validator in Mongoose?
    a: No. It only creates a unique index in MongoDB. A duplicate fails with a MongoServerError, code 11000, not a ValidationError.
  - q: What happens if you save "3" into a Number field?
    a: Mongoose casts (converts) it to the number 3. If it can't convert, like "abc", you get a CastError.
  - q: What is the timestamps option?
    a: "{ timestamps: true } makes Mongoose add and update createdAt and updatedAt fields for you."
---

## 💡 What is it?

MongoDB itself does not force a shape on your data. Any [document](glossary:document) can have any fields.

Mongoose adds a **[schema](glossary:schema)**. A schema is a list of fields, their **types**, and their **rules**.

**Validation** checks the rules before saving. **Defaults** fill in values that are missing. Together they keep bad data out of your database.

## 🏠 Real-life example

Think of a **school admission form**.

- Each box on the form has a label and a type: Name (text), Age (number), Date of birth (date).
- Some boxes have a red star. They are **required**.
- Some boxes have choices: "Class: 6, 7, 8, 9 or 10". You can't write 13.
- Some boxes are already filled in: "Country: India". You can change it, but it starts with a value.
- The office clerk checks the form before filing it. If something is wrong, they hand it back.

Now map it:
- The **printed form** = the schema.
- **Box types** = schema types (String, Number, Date).
- **Red stars, choices, age limits** = validators (required, enum, min, max).
- **Pre-filled boxes** = defaults.
- **The clerk checking** = validation before `save()`.

## 🧑‍💻 Code example

You need MongoDB running. Use a local MongoDB, or a free MongoDB Atlas cluster (then use its connection string). Then run `npm init -y` and `npm install mongoose`. Save this as `schema.js` and run `node schema.js`. (CommonJS style.)

```js
const mongoose = require('mongoose');                                   // load Mongoose

const candidateSchema = new mongoose.Schema(                            // describe what a candidate looks like
  {                                                                     // start of the field list
    name: { type: String, required: [true, 'Name is required'], trim: true }, // text, must exist, spaces at the ends removed
    email: { type: String, required: true, lowercase: true, match: /^\S+@\S+\.\S+$/ }, // text, saved in small letters, must look like an email
    experienceYears: { type: Number, min: 0, max: 50, default: 0 },     // a number from 0 to 50; 0 if missing
    status: { type: String, enum: ['applied', 'shortlisted', 'rejected'], default: 'applied' }, // only these 3 words are allowed
    skills: { type: [String], default: [] },                            // a list of text values; starts empty
  },                                                                    // end of the field list
  { timestamps: true },                                                 // add createdAt and updatedAt automatically
);                                                                      // end of the schema

const Candidate = mongoose.model('Candidate', candidateSchema);         // a model = a class for the "candidates" collection

async function main() {                                                 // async so we can use await
  await mongoose.connect('mongodb://127.0.0.1:27017/hiring');           // connect to the "hiring" database on this computer

  const ok = await Candidate.create({ name: '  Asha  ', email: 'ASHA@Mail.com', experienceYears: '3' }); // '3' is text on purpose
  console.log(ok.name, ok.email, ok.experienceYears, ok.status);       // see how Mongoose cleaned and filled the values

  try {                                                                 // this one breaks 4 rules on purpose
    await Candidate.create({ email: 'bad', experienceYears: -2, status: 'hired' }); // no name, bad email, below min, not in enum
  } catch (err) {                                                       // Mongoose refuses to save it
    console.log(err.name);                                              // the type of error
    console.log(Object.keys(err.errors).sort());                        // which fields failed, in A–Z order
  }                                                                     // end of try/catch

  await mongoose.disconnect();                                          // close the connection so the script ends
}                                                                       // end of main

main();                                                                 // run it
```

**Output:**

```text
Asha asha@mail.com 3 applied
ValidationError
[ 'email', 'experienceYears', 'name', 'status' ]
```

**What to notice:**
- `'  Asha  '` became `'Asha'` (trim). `'ASHA@Mail.com'` became small letters (lowercase).
- The text `'3'` became the number `3`. This is called **casting**.
- `status` was missing, so the default `'applied'` was used.
- The bad candidate was **not saved**. One error lists all 4 problems.

## 🔍 Deeper version

**Common schema types:**

| Type | Holds | Example |
|---|---|---|
| `String` | text | name, email |
| `Number` | numbers | experienceYears |
| `Boolean` | true / false | isActive |
| `Date` | date and time | interviewAt |
| `Schema.Types.ObjectId` | the `_id` of another document | `job` reference |
| `[String]`, `[subSchema]` | arrays | skills, education |
| `Map`, `Mixed` | flexible objects | custom fields per tenant |
| `Decimal128` | exact decimals | money |

**Built-in validators:**
- All types: `required`, custom `validate`.
- Numbers and dates: `min`, `max`.
- Strings: `enum`, `match` (a regular expression), `minLength`, `maxLength`.

A **custom validator** is a function that returns `true` or `false`:

```js
skills: {                                                     // the skills field
  type: [String],                                             // a list of text values
  validate: {                                                 // our own rule
    validator: (arr) => arr.length <= 20,                     // allow at most 20 skills
    message: 'A candidate can have at most 20 skills',        // error text if the rule fails
  },                                                          // end of the rule
},                                                            // end of the field
```

**Casting comes before validation.** Mongoose first converts values to the right type. `'3'` → `3` works. `'abc'` → Number fails with a **CastError**.

**When validation runs:**
- It runs on `save()` and `create()`.
- It does **not** run on `updateOne`, `updateMany` or `findOneAndUpdate` by default. Pass `{ runValidators: true }` to turn it on. Even then, some rules behave differently in updates, because Mongoose doesn't have the full document.

**`unique` is not a validator.** `unique: true` only tells Mongoose to create a **unique [index](glossary:index)** in MongoDB. A duplicate is stopped by the database, and you get a `MongoServerError` with code `11000`. Your error handler should turn that into a friendly 409 message.

**Strict mode.** By default, fields that are not in the schema are **silently dropped** when you save. This protects you from junk fields.

**Defaults can be functions.** `default: Date.now` runs for each new document. Don't write `default: Date.now()`. That runs once when the app starts, so every document gets the same time.

**Database-level validation.** MongoDB can also check data itself, with `$jsonSchema` rules on a collection. Mongoose checks only happen in your Node app. Database rules also protect you from other apps or scripts that write to the same collection.

:::version[Version note]
In **Mongoose 7**, `strictQuery` changed its default to `false`. So unknown fields in a **filter** are no longer removed automatically. Validate query input yourself (see [NoSQL injection](topic:mongodb/nosql-injection)).
:::

## 🎯 Why do we use it?

- **Bad data is expensive.** A missing email or a wrong status breaks screens, reports and emails later.
- **One place for the rules.** Every route that saves a candidate uses the same schema. You don't repeat checks.
- **Clean values for free.** `trim` and `lowercase` mean `"ASHA@mail.com "` and `"asha@mail.com"` are treated the same.
- **Safe defaults.** New documents always start with sensible values.

Validation in the schema is the **last line of defence**. You should still validate requests in Express first, with Joi or Zod (see [request validation](topic:express/validation)).

## ⚠️ Common mistakes

- **Thinking `unique` validates.** It only creates an index, and the index fails silently if duplicates already exist in the collection.
- **Forgetting `runValidators: true`** on updates. Then `status: 'hired'` gets saved, even though it's not in the enum.
- **Writing `default: Date.now()`** with brackets. Every document gets the app's start time.
- **Trusting only Mongoose validation.** Check input in the API layer too, so users get clear 400 errors early.

## 🗣️ How to answer in an interview

> "A Mongoose schema describes each field: its type, like String, Number, Date or ObjectId, and its rules. Built-in validators include required, min and max, enum, match for regex, and minLength and maxLength. I can also write custom validators. Defaults fill missing values, and setters like trim and lowercase clean the data.
>
> Mongoose casts values first, so '3' becomes 3. Then it validates on save and create. One gotcha is updates. updateOne and findOneAndUpdate skip validation unless I pass runValidators true. Another gotcha is unique. It's not a validator, it just creates a unique index, so duplicates come back as a duplicate-key error, code 11000. I map that to a 409 in my error handler.
>
> I still validate requests at the API layer, and I use the schema as the last line of defence."

[FILL IN: a real field rule or default you added to a candidate or recruiter schema at SkillKeepr, if you have one. Only add it if it's true.]

## 🔁 Follow-up questions

### How do you validate updates in Mongoose?

Pass `{ runValidators: true }` to `updateOne`, `updateMany` or `findOneAndUpdate`. Or load the document, change it, and call `save()`, which always validates. Some teams turn it on globally with `mongoose.set('runValidators', true)`.

### How do you handle a duplicate email error?

Catch the error and check `err.code === 11000`. Return **409 Conflict** with a message like "Email already exists". Make sure the unique index really exists. Mongoose creates indexes on startup only when `autoIndex` is on, and many teams turn that off in production.

### What is the difference between a ValidationError and a CastError?

A **CastError** means Mongoose couldn't convert the value to the type, like `'abc'` for a Number or a bad ObjectId string. A **ValidationError** means the value has the right type but breaks a rule, like `min` or `enum`. A ValidationError can contain CastErrors inside `err.errors`.

### Should you use Mongoose validation or MongoDB `$jsonSchema`?

Usually Mongoose, because the rules live next to your code and give clear messages. Add `$jsonSchema` when other apps or scripts also write to the collection and you need the database itself to enforce the rules.

## ✅ Quick check

### 1. What is saved for `experienceYears`?

```js
await Candidate.create({ name: 'Ravi', email: 'ravi@mail.com' }); // no experienceYears given
```

:::answer
**0.** The field is missing, so the `default: 0` is used.
:::

### 2. Does this save `status: 'hired'`? (`status` has `enum: ['applied', 'shortlisted', 'rejected']`.)

```js
await Candidate.updateOne({ email: 'ravi@mail.com' }, { status: 'hired' }); // no options
```

- A) No, it throws a ValidationError
- B) Yes, because update validators are off by default

:::answer
**B.** `updateOne` skips validation unless you pass `{ runValidators: true }`.
:::

### 3. True or false: `unique: true` makes Mongoose check for duplicates before saving.

:::answer
**False.** It only creates a unique index. MongoDB blocks the duplicate and returns error code 11000.
:::
