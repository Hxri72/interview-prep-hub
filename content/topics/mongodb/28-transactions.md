---
title: Transactions and ACID in MongoDB
stack: mongodb
order: 28
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - A transaction groups several writes so they ALL succeed or ALL fail together — no half-finished changes.
  - "ACID = Atomicity (all or nothing), Consistency (rules stay true), Isolation (others don't see half-done work), Durability (saved changes survive a crash)."
  - A single-document write in MongoDB is already atomic. Use multi-document transactions only when one action changes several documents or collections.
  - Transactions need a replica set (or sharded cluster). Atlas clusters are replica sets; a plain local mongod is not.
  - "In Mongoose, use connection.transaction(async (session) => …) or session.withTransaction(), pass { session } to every query, and keep transactions short."
cards:
  - q: What is a database transaction?
    a: A group of reads and writes that succeed or fail as one unit. If any step fails, all changes are undone (rolled back).
  - q: What does ACID stand for?
    a: Atomicity, Consistency, Isolation and Durability.
  - q: Do you need a transaction to update one document safely?
    a: No. Writes to a single document are atomic in MongoDB. Transactions are for changes across several documents or collections.
  - q: What do MongoDB transactions require?
    a: A replica set or sharded cluster. A standalone mongod can't run multi-document transactions.
  - q: What is the most common mistake in Mongoose transactions?
    a: Forgetting to pass { session } to a query. That query then runs outside the transaction and is not rolled back.
---

## 💡 What is it?

A **[transaction](glossary:transaction)** is a group of database changes that work as **one unit**.

Either **all** the changes are saved, or **none** of them are. If one step fails, the database undoes the earlier steps. This undo is called a **rollback**.

MongoDB has supported transactions across many documents since version 4.0. Since 4.2, they also work across shards.

## 🏠 Real-life example

Think of **buying a canteen token at school**.

Two things must happen together:
1. Your money goes into the cash box.
2. You get a lunch token.

If only step 1 happens, you lose money with no lunch. If only step 2 happens, the canteen loses money. Both must happen, or neither.

- **Paying + getting the token** = two writes inside one transaction.
- **The cashier giving your money back if tokens run out** = a rollback.
- **Other students not seeing a "half sale"** = isolation.
- **The sale written in the record book, even if the lights go out** = durability.

## 🧑‍💻 Code example

Setup: transactions need a **replica set**. The easiest way is a free MongoDB Atlas cluster (copy its connection string). Then run `npm init -y` and `npm install mongoose`. Save this as `transaction.js`, put your URL in `MONGO_URL`, and run `MONGO_URL="your-atlas-url" node transaction.js`. It uses CommonJS.

```js
const mongoose = require('mongoose');                                     // load Mongoose

const Company = mongoose.model('Company', new mongoose.Schema({           // a company (tenant) that pays for a plan
  name: String,                                                           // company name
  planEndsAt: Date,                                                       // when the paid plan expires
}));                                                                      // end of Company model
const Invoice = mongoose.model('Invoice', new mongoose.Schema({           // a record of each payment
  companyId: mongoose.Types.ObjectId,                                     // which company paid
  amount: Number,                                                         // amount in rupees
}));                                                                      // end of Invoice model

async function renew(companyId, amount, failMidway) {                     // renew a plan: 2 writes that must happen together
  await mongoose.connection.transaction(async (session) => {              // start a transaction; Mongoose commits or rolls back for us
    await Invoice.create([{ companyId, amount }], { session });            // write 1: add an invoice (create needs an array when using a session)
    if (failMidway) throw new Error('payment provider timeout');          // simulate a failure between the two writes
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);     // 30 days from now, in milliseconds
    await Company.updateOne({ _id: companyId }, { planEndsAt: in30Days }, { session }); // write 2: extend the plan
  });                                                                     // end of transaction → commit happens here
}                                                                         // end of renew

async function main() {                                                   // the demo
  await mongoose.connect(process.env.MONGO_URL);                          // connect to the replica set (Atlas)
  await Company.createCollection();                                       // create collections first (needed before writing in a transaction on older servers)
  await Invoice.createCollection();                                       // same for invoices
  const acme = await Company.create({ name: 'Acme' });                    // a test company

  await renew(acme._id, 999, false);                                      // works: both writes are saved
  await renew(acme._id, 999, true).catch((e) => console.log('failed:', e.message)); // fails midway: the invoice is rolled back

  console.log('invoices:', await Invoice.countDocuments({ companyId: acme._id })); // only 1 invoice, not 2
  await mongoose.disconnect();                                            // close the connection
}                                                                         // end of main

main().catch(console.error);                                              // run and print any error
```

```text
failed: payment provider timeout
invoices: 1
```

**What to notice:** the second renewal created an invoice and then failed. Because it was inside a transaction, that invoice was **undone**. No "paid but not extended" record was left behind.

## 🔍 Deeper version

**ACID in simple words:**

| Letter | Meaning | In MongoDB |
|---|---|---|
| **A**tomicity | all or nothing | a transaction commits all writes or aborts all |
| **C**onsistency | the data's rules stay true | schema validation, unique indexes |
| **I**solation | others don't see half-done work | snapshot isolation inside a transaction |
| **D**urability | saved means saved | with write concern `majority`, a committed write survives a node crash |

**You often don't need a transaction.** A write to **one document** is always atomic. That includes all the changes inside it, even nested arrays. Good schema design (embedding related data) and atomic operators like `$inc` avoid many transactions. See [atomic updates](topic:mongodb/atomic-updates-locking).

**Use a transaction when** one business action must change **several documents or collections** together. For example: a payment invoice plus a plan extension, or moving credits from one company to another.

**Why a replica set?** Transactions depend on the **oplog**, the replica set's log of every write. A standalone `mongod` has no oplog, so it rejects transactions. Locally, you can start a one-node replica set with `mongod --replSet rs0` and then run `rs.initiate()` once in `mongosh`.

**Two ways to write them in Mongoose:**
- `mongoose.connection.transaction(async (session) => { … })` handles commit and abort for you.
- `const session = await mongoose.startSession(); await session.withTransaction(async () => { … }); session.endSession();`

Both **retry automatically** on temporary errors (`TransientTransactionError`). So the function inside **can run more than once**. Don't call outside services, like Stripe or email, inside it. Do them before or after.

**Limits and costs:**
- Transactions hold resources, so keep them **short**. By default, a transaction is aborted after **60 seconds**.
- A transaction touching many documents is slower than single writes. And two transactions changing the same document cause a **write conflict**, so one must retry.
- Every query inside must get `{ session }`. A query without it runs **outside** the transaction.

**Transactions vs webhooks.** For things like a Stripe [webhook](glossary:webhook), a transaction keeps your own database consistent. It can't undo the call to Stripe. Combine it with **idempotency**: store the event ID with a unique index, so a repeated event is ignored.

## 🎯 Why do we use it?

Some business actions are made of several writes. Stopping half-way leaves the data **wrong**: a customer charged with no access, credits removed from one account but never added to another, or an order with no items.

Transactions make these actions safe. Either everything happens, or nothing does. This keeps money, access and counts correct, even when the server crashes or a step throws an error.

## ⚠️ Common mistakes

- **Forgetting `{ session }`** on one query. That write is not rolled back.
- **Calling slow external APIs inside the transaction.** It can retry (calling the API twice), and long transactions get aborted.
- **Using transactions everywhere.** A single-document update is already atomic. Use transactions only for multi-document changes.
- **Testing on a standalone local `mongod`.** It fails with an error saying transactions need a replica set. Use Atlas or a one-node replica set.

## 🗣️ How to answer in an interview

> "A transaction groups several writes so they all commit or all roll back. That's the A in ACID: atomicity. The others are consistency, isolation and durability. In MongoDB, a write to a single document is already atomic, so I first try to design the schema so one action changes one document. I use a multi-document transaction only when an action really must change several documents or collections together, like recording an invoice and extending a subscription.
>
> Transactions need a replica set. In Mongoose, I use `connection.transaction` or `session.withTransaction`, and I pass the session to every query, because a query without it runs outside the transaction. I keep transactions short and never call external APIs inside them, since the callback can retry. For webhooks, I combine this with idempotency, by storing processed event IDs with a unique index."

[FILL IN: whether the Stripe billing and renewal flow at SkillKeepr used MongoDB transactions, and for which writes — only if true.]

## 🔁 Follow-up questions

### Why can't I run a transaction on my local MongoDB?

A standalone `mongod` has no oplog. Transactions need a replica set or sharded cluster. Start `mongod --replSet rs0`, run `rs.initiate()` once, or use a free Atlas cluster.

### What is a write conflict?

Two transactions try to change the same document at the same time. MongoDB aborts one of them with a `TransientTransactionError`. `withTransaction` and `connection.transaction` retry automatically.

### What is write concern "majority"?

The write is acknowledged only after most replica set members have saved it. So it survives a single node failing. It's the default write concern for most setups since MongoDB 5.0.

### Should I use a transaction for every Stripe webhook?

Use one when the webhook changes several documents together, like an invoice plus a subscription. Always add idempotency (store the event ID with a unique index), because Stripe can send the same event more than once.

## ✅ Quick check

### 1. You update one candidate document: `$set` the status and `$push` a note. Do you need a transaction?

:::answer
**No.** Changes to a single document are atomic in MongoDB, including all its fields and arrays.
:::

### 2. Inside a transaction, you write `await Invoice.create([data])` without `{ session }`. Then the transaction fails. Is the invoice rolled back?

- A) Yes
- B) No — it ran outside the transaction

:::answer
**B.** Without `{ session }`, the write isn't part of the transaction. So it stays saved even though the transaction aborted.
:::

### 3. What does the "I" in ACID mean?

:::answer
**Isolation:** other operations don't see the transaction's half-finished changes until it commits.
:::
