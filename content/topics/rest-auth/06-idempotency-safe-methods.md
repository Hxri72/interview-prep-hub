---
title: Idempotency and safe methods
stack: rest-auth
order: 6
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Safe = the request only reads and changes nothing on the server: GET, HEAD, OPTIONS."
  - "Idempotent = doing it once or 10 times leaves the server in the same state: GET, HEAD, OPTIONS, PUT, DELETE."
  - POST is neither. Repeating it can create duplicates, like two orders or two charges.
  - Idempotency matters because networks fail and requests get retried by clients, proxies and webhook senders.
  - To make POST safe to retry, use an idempotency key, or a unique constraint plus an upsert.
cards:
  - q: What is a safe method?
    a: A method that only reads and must not change server data. GET, HEAD and OPTIONS are safe.
  - q: What is an idempotent request?
    a: One that has the same effect on the server whether it runs once or many times. GET, PUT and DELETE are idempotent; POST is not.
  - q: Is every safe method idempotent?
    a: Yes. If a request changes nothing, repeating it changes nothing too. But not every idempotent method is safe (PUT and DELETE change data).
  - q: Why does idempotency matter?
    a: Requests time out and get retried. If the operation isn't idempotent, a retry can create duplicates, like two payments for one order.
  - q: How do you make a POST safe to retry?
    a: "Send an idempotency key with it. The server stores the key and the first result, and returns the same result for repeats. Or use a unique constraint plus an upsert."
---

## 💡 What is it?

Two words describe how "dangerous" a request is.

- **Safe:** the request only **reads**. It changes nothing. Examples: `GET`, `HEAD`, `OPTIONS`.
- **Idempotent:** sending it **once or many times** gives the **same end result** on the server. Examples: `GET`, `PUT`, `DELETE`.

`POST` is **neither**. Send it twice, and you may get two orders.

## 🏠 Real-life example

Think of **buttons in a lift (elevator)**.

- Pressing **"Floor 5"** ten times = the lift still goes to floor 5 **once**. That button is **idempotent**.
- **Looking at the floor display** changes nothing at all. That's **safe**.
- Now think of a **coin-operated snack machine**. Press "buy" twice, and you pay twice and get two packets. That's **not idempotent**, like POST.

So:
- **Floor button** = PUT / DELETE (same result, however many times).
- **Display** = GET (only reading).
- **Snack machine** = POST (every press creates something new).

## 🧑‍💻 Code example

This script starts a server and then acts as its own client. It "retries" a POST and a PUT. Run `npm init -y` and `npm install express`. Save as `idem.js` and run `node idem.js`. (CommonJS. It uses the built-in `fetch` from Node 18+.)

```js
const express = require('express');                                  // load Express
const app = express();                                               // create the app
app.use(express.json());                                             // parse JSON bodies

let orders = [];                                                     // our "database" of orders

app.post('/orders', (req, res) => {                                  // POST = create a NEW order every time
  const order = { id: orders.length + 1, item: req.body.item };      // build a new order
  orders.push(order);                                                // save it
  res.status(201).json(order);                                       // 201 Created
});                                                                  // end of POST

app.put('/orders/1', (req, res) => {                                 // PUT = set order 1 to exactly this
  orders[0] = { id: 1, item: req.body.item };                        // replace order 1 (same result every time)
  res.json(orders[0]);                                               // send it back
});                                                                  // end of PUT

const server = app.listen(3000, async () => {                        // start, then act as a client
  const send = (method, url, body) => fetch('http://localhost:3000' + url, { // a small helper around fetch
    method,                                                          // GET / POST / PUT…
    headers: { 'Content-Type': 'application/json' },                 // we send JSON
    body: JSON.stringify(body),                                      // the data to send
  });                                                                // end of helper

  await send('POST', '/orders', { item: 'Laptop' });                 // the first POST
  await send('POST', '/orders', { item: 'Laptop' });                 // a "retry" of the same POST
  console.log('After 2 POSTs:', orders.length, 'orders');            // two orders — a duplicate!

  await send('PUT', '/orders/1', { item: 'Phone' });                 // the first PUT
  await send('PUT', '/orders/1', { item: 'Phone' });                 // a "retry" of the same PUT
  console.log('After 2 PUTs, order 1 is:', orders[0].item);          // still just one Phone — same state

  server.close();                                                    // stop the server so the script ends
});                                                                  // end of listen callback
```

Output:

```text
After 2 POSTs: 2 orders
After 2 PUTs, order 1 is: Phone
```

**What to notice:** the retried POST made a **duplicate**. The retried PUT changed nothing new.

## 🔍 Deeper version

**The table (from RFC 9110, the HTTP standard)**

| Method | Safe | Idempotent |
|---|---|---|
| GET, HEAD, OPTIONS | ✅ | ✅ |
| PUT | ❌ | ✅ |
| DELETE | ❌ | ✅ |
| POST | ❌ | ❌ |
| PATCH | ❌ | ❌ (depends on the patch) |

**Same state, not same response.** Idempotency is about the **server's state**. `DELETE /jobs/5` returns 204 the first time and 404 the second. That's still idempotent: the job stays deleted.

**Who retries requests?**
- **Clients:** a mobile app on a bad network, or code with automatic retry on timeout.
- **Proxies and load balancers:** some retry idempotent requests by themselves.
- **Webhook senders:** Stripe, ATS tools and others **re-send** an event if your server is slow or returns an error. Your handler may receive the same event twice. See [Webhooks](topic:rest-auth/webhooks).
- **Message queues:** most deliver **"at least once"**, so a message can arrive again. See [Idempotent consumers](topic:architecture/idempotent-consumers).

**Making non-idempotent work safe to repeat**

1. **Idempotency key.** The client sends a unique `Idempotency-Key: <uuid>` header with the POST. The server saves the key with the first result. A repeat with the same key gets the **saved result**, and nothing runs twice. Stripe's API works this way. See [Idempotency keys](topic:rest-auth/idempotency-keys).
2. **Unique constraint + upsert.** Use a natural unique value, like an email or an external id, with a [unique index](topic:mongodb/special-indexes). Then a duplicate can't be inserted, or it updates the existing record instead (an "upsert").
3. **Store processed event ids.** For webhooks: save each event id. If you've seen it before, reply 200 and do nothing.
4. **Write "set" operations, not "add" operations.** `$set: { status: 'paid' }` is idempotent. `$inc: { balance: 100 }` is not.

**Example from a real product.** In SkillKeepr's ATS integration (via unified.to), a Sync button pulls new candidates for a job. Before fetching full details, the code checks whether a candidate with that **email already exists**. If yes, it skips them. That makes pressing Sync twice harmless. See [ATS integration](topic:resume/ats-integration).

## 🎯 Why do we use it?

- **Retries become safe.** You can retry on timeouts without fear of double charges or duplicate records.
- **Webhooks are reliable.** Senders retry, so your handler must handle repeats.
- **Caches and browsers rely on "safe".** They can prefetch and repeat GETs because GET must not change data.

## ⚠️ Common mistakes

- **Changing data in a GET.** A crawler, link preview or prefetch can trigger it.
- **Assuming a webhook arrives exactly once.** It can arrive twice, late, or out of order.
- **Using `$inc` or "append" logic** in handlers that might be retried.
- **Checking "does it exist?" and then inserting** without a unique index. Two requests at the same moment can both pass the check (a [race condition](glossary:race-condition)).

## 🗣️ How to answer in an interview

> "A safe method only reads and changes nothing, like GET. An idempotent method gives the same server state whether it runs once or ten times: GET, PUT and DELETE are idempotent, but POST isn't. Calling POST twice can create two records.
>
> This matters because requests get retried: clients retry on timeouts, and webhook senders like Stripe re-deliver events. So for anything that creates something important, I make the operation idempotent. Options are an idempotency key that the server stores with the first result, a unique index with an upsert, or storing processed event ids for webhooks.
>
> For example, in our ATS integration through unified.to, syncing candidates first checks if a candidate with that email already exists, so pressing Sync twice doesn't create duplicates."

## 🔁 Follow-up questions

### Is PATCH idempotent?

It depends on the patch. "Set status to closed" is idempotent. "Add 1 to views" or "append to this array" is not.

### A payment API call timed out. Did it go through? What do you do?

You can't know. Retry **with the same idempotency key**. If the first call succeeded, the server returns the saved result instead of charging again.

### Why is "check if it exists, then insert" not enough?

Two requests can check at the same moment, both see "not found", and both insert. Use a **unique index** so the database itself rejects the second insert.

### Which HTTP methods may a proxy retry automatically?

Only idempotent ones, like GET, PUT and DELETE. A proxy should never blindly retry a POST.

## ✅ Quick check

### 1. Which of these is idempotent?

- A) `POST /orders`
- B) `PATCH /accounts/1` with `{ "$inc": { "balance": 100 } }`
- C) `PUT /candidates/7` with the full candidate

:::answer
**C.** PUT sets the same full state every time. A creates a new order each time, and B adds 100 each time.
:::

### 2. `DELETE /jobs/5` returns 204, then 404 on retry. Is DELETE still idempotent?

:::answer
**Yes.** Idempotency is about server state. After both calls, job 5 is deleted. The response code can be different.
:::

### 3. Your webhook handler runs `subscription.renewals += 1` on every "invoice paid" event. What can go wrong, and how do you fix it?

:::answer
If the sender **re-delivers** the event, you count the renewal twice. Fix: store the event id and skip events you've already processed. Or write an idempotent update, like setting `currentPeriodEnd` to the value from the event.
:::
