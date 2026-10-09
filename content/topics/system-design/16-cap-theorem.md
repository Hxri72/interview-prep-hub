---
title: CAP theorem in simple words
stack: system-design
order: 16
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "CAP: in a system with copies on different servers, when the network between them breaks (a partition), you must choose consistency or availability."
  - "Consistency (C): every read sees the latest write. Availability (A): every request gets an answer."
  - Partitions will happen, so the real choice is CP (refuse some requests to stay correct) or AP (keep answering, maybe with old data).
  - "PACELC adds: even with no partition, you trade latency against consistency."
  - Choose per feature. Payments need consistency; a like counter can be eventually consistent.
cards:
  - q: What do C, A and P stand for?
    a: "Consistency (every read sees the latest write), Availability (every request gets a non-error answer), Partition tolerance (the system keeps running when the network between nodes breaks)."
  - q: Why is "pick any two of three" misleading?
    a: Network partitions can't be avoided in a distributed system. So you always need P. The real choice, during a partition, is C or A.
  - q: Give an example of where you'd choose consistency.
    a: Payments, seat booking and stock counts. Showing wrong data there costs money, so it's better to refuse or wait.
  - q: What is eventual consistency?
    a: Copies may differ for a short time, but if no new writes happen, they all become the same soon. Likes and view counts are fine with this.
  - q: What does PACELC add?
    a: "If there is a Partition, choose A or C; Else (normal times), choose Latency or Consistency. Waiting for all copies is slower but more correct."
---

## 💡 What is it?

Big systems keep **copies of data on several servers**. Sometimes the network between those servers breaks. This is called a **network partition**.

The **CAP theorem** says: during a partition, you can't have both of these:
- **Consistency (C):** every read sees the newest write.
- **Availability (A):** every request still gets an answer.

You must choose one. Partition tolerance (P) is not optional, because networks do fail.

## 🏠 Real-life example

Think of **two ticket counters for a school show**, one at each gate. They share a seat list by phone.

- The **phone line goes dead**. That is the partition.
- **Choice 1 (CP):** both counters **stop selling** until the phone works. No seat is sold twice. But some students can't buy now.
- **Choice 2 (AP):** both counters **keep selling** from their own list. Everyone gets served. But the same seat might be sold twice, and you fix it later.

Map it:
- **Two counters** = two database nodes.
- **Dead phone line** = a network partition.
- **Stop selling** = choose consistency (CP).
- **Keep selling** = choose availability (AP).
- **Fixing double sales later** = conflict resolution / eventual consistency.

## 🧑‍💻 Code example

Two copies of a "seats left" value. We cut the network, then write on node A in each mode. Save as `cap.js` and run `node cap.js`.

```js
function createReplicas(mode) {                             // two copies of a value; mode = 'CP' or 'AP'
  const nodes = { A: { seats: 10 }, B: { seats: 10 } };     // both copies start the same
  let partitioned = false;                                  // is the network link between A and B broken?
  return {                                                  // actions on this tiny system
    cut() { partitioned = true; },                          // break the network link
    write(node, value) {                                    // change the value on one node
      if (partitioned && mode === 'CP') return `${node}: REFUSED (can't reach the other copy)`; // CP: stay correct
      nodes[node].seats = value;                            // save on this node
      if (!partitioned) nodes[node === 'A' ? 'B' : 'A'].seats = value; // copy across if the link works
      return `${node}: saved ${value}`;                     // report success
    },                                                      // end of write
    read(node) { return `${node} says seats = ${nodes[node].seats}`; }, // read from one node
  };                                                        // end of returned object
}                                                           // end of createReplicas

for (const mode of ['CP', 'AP']) {                          // try both choices
  const db = createReplicas(mode);                          // fresh system
  db.cut();                                                 // a network partition happens
  console.log(mode, '|', db.write('A', 9), '|', db.read('A'), '|', db.read('B')); // write on A, read both
}                                                           // end of loop
```

**Output:**

```text
CP | A: REFUSED (can't reach the other copy) | A says seats = 10 | B says seats = 10
AP | A: saved 9 | A says seats = 9 | B says seats = 10
```

CP stays correct but refuses the write. AP accepts the write, but now A and B disagree.

## 🔍 Deeper version

**What each letter really means:**

| Letter | Meaning | In practice |
|---|---|---|
| C | Every read returns the latest write (linearizable) | "No stale data" |
| A | Every request to a working node gets a non-error answer | "Never say no" |
| P | The system keeps going when messages between nodes are lost | Always needed in a distributed system |

**So the real choice is CP or AP during a partition.**
- **CP:** refuse or wait, to stay correct. Example: a MongoDB replica set — writes need the primary; if a node can't see a majority, it can't be primary, so writes there stop.
- **AP:** keep answering, accept that copies differ, and fix conflicts later. Examples: Cassandra and DynamoDB with eventually consistent reads.

Many databases let you **tune** this per query. In MongoDB, `writeConcern: 'majority'` and `readConcern: 'majority'` lean towards consistency. Reading from secondaries leans towards availability and speed, but may be stale.

**PACELC** extends CAP for normal days:
- **P**artition → choose **A** or **C**.
- **E**lse (no partition) → choose **L**atency or **C**onsistency.
- Waiting for all copies to confirm is more correct but slower.

**Eventual consistency** means copies may disagree for a short time but become the same if writes stop. It is fine for likes, view counts and search indexes. It is not fine for money or seat booking.

**Choose per feature, not per company.** One product can use a strongly consistent store for payments and an eventually consistent cache or search index for listings.

## 🎯 Why do we use it?

CAP helps you explain trade-offs in a system design interview. It shows you know that "always correct" and "always available" can't both be guaranteed when servers can't talk.

## ⚠️ Common mistakes

- **Saying "pick any two".** You can't drop P in a distributed system.
- **Thinking CAP is about normal operation.** It's about partitions. For normal days, talk about latency (PACELC).
- **Calling a whole database simply "CP" or "AP".** Many are tunable per operation.
- **Using eventual consistency for money.** Double spends and overbooking.

## 🗣️ How to answer in an interview

> "CAP says that when a network partition splits a distributed system, you have to choose between consistency, where every read sees the latest write, and availability, where every request still gets an answer. Partitions are a fact of life, so the real choice is CP or AP.
>
> I choose per feature. For payments or bookings I choose consistency — it's better to refuse a request than sell the same seat twice. For things like view counts or search results, eventual consistency is fine and keeps the app fast and available.
>
> PACELC adds that even without a partition, there's a trade-off between latency and consistency. In MongoDB, for example, majority write and read concerns give stronger consistency but add latency."

## 🔁 Follow-up questions

### Is a single-server database "CA"?

With one server there is no network between copies, so CAP doesn't really apply. As soon as you add replicas, you face the choice.

### How does a replica set behave in a partition?

The side with a majority of nodes keeps or elects a primary and accepts writes. The minority side can't accept writes. That is the consistent choice.

### What is read-your-own-writes consistency?

A user always sees their own latest change, even if others may see it a bit later. You can get it by reading from the primary right after a write.

## ✅ Quick check

### 1. During a partition, a bank app refuses transfers. Is that CP or AP?

:::answer
**CP.** It gives up availability to make sure balances stay correct.
:::

### 2. In the AP output, why do A and B show different seat counts?

:::answer
A saved the write but couldn't copy it to B because of the partition. The copies are out of sync until the network heals and they are reconciled.
:::

### 3. Is eventual consistency OK for a "number of profile views" counter?

:::answer
**Yes.** A short delay or a small mismatch doesn't hurt anyone, and it keeps the system fast and available.
:::
