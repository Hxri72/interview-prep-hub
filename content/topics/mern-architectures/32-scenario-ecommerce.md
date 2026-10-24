---
title: "Scenario: high-traffic e-commerce"
stack: mern-architectures
order: 32
level: Intermediate
mustKnow: false
askedFrequency: common
template: pattern
section: Choosing an architecture
summary:
  - "An online shop has two very different parts: browsing (many reads, must be fast and SEO-friendly) and checkout (few writes, must be correct)."
  - "Browsing: Next.js renders product pages on the server and caches them; a CDN and Redis take most of the load off MongoDB."
  - "Checkout: stock is reduced with one atomic MongoDB update, payment goes through Stripe, and the order is confirmed by a Stripe webhook."
  - "Slow work (emails, invoices, search index updates) runs in background queues, so a sale-day spike doesn't slow checkout."
  - "Keep the API stateless and run many copies behind a load balancer. Split out services (search, payments) only when needed."
cards:
  - q: Why use SSR or static pages for product pages?
    a: "Search engines and social previews need real HTML, and pre-rendered pages load fast. Next.js can render and cache them."
  - q: How do you stop two buyers taking the last item?
    a: "One atomic update: findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } }). If it returns null, the item is sold out."
  - q: Why confirm an order with a Stripe webhook instead of the browser redirect?
    a: "The user may close the tab before the redirect. The webhook comes from Stripe's server, is signed, and is retried if it fails."
  - q: How do you survive a big sale-day traffic spike?
    a: "CDN and cache for reads, many stateless API copies behind a load balancer, queues for slow work, and rate limits on hot endpoints."
---

## 💡 What is it?

An **e-commerce** app is an online shop. People browse products, add them to a cart and pay. "High traffic" means **lots** of visitors at once, like a big festival sale.

A shop has two very different jobs:
- **Browsing** (most of the traffic): must be fast and show up on Google.
- **Checkout** (much less traffic): must be **correct**. You can't sell the same last phone to two people.

This page designs a MERN shop that handles both well, and shows how it changes as traffic grows.

## 🏠 Real-life example

Think of a **big supermarket during a festival sale**.

- **Printed price leaflets at the door** = pre-rendered product pages on a [CDN](glossary:cdn). Thousands of people read them, and nobody bothers the staff.
- **The shelf labels** = the cache (Redis). A quick answer without going to the storeroom.
- **The storeroom register** = MongoDB, the real record of stock.
- **The billing counters** = the checkout API. More counters open when the queue grows (more servers).
- **The cashier crossing off the last item in one quick tick** = an atomic stock update. Two cashiers can't sell the same last item.
- **The bank's card machine** = Stripe.
- **The bank's SMS that says "payment done"** = the Stripe webhook. It's the real proof of payment.
- **The back-office team that packs orders and sends bills later** = background workers with a queue.

## 🗺️ The diagram

```text
                 Shopper's browser
                        │
              ┌─────────▼─────────┐
              │ CDN               │  cached HTML, images, JS
              └───┬───────────┬───┘
     product /    │           │  /api/cart, /api/checkout
     category     │           │
     pages        │           │
   ┌──────────────▼──┐   ┌────▼──────────────────────────┐
   │ Next.js 16      │   │ Load balancer                 │
   │ (SSR + caching) │   └──┬──────────┬──────────┬──────┘
   └───────┬─────────┘   ┌──▼───┐   ┌──▼───┐   ┌──▼───┐
           │             │ API  │   │ API  │   │ API  │  Express 5, stateless
           │             └──┬───┘   └──┬───┘   └──┬───┘
           │      ┌─────────┴──────────┴──────────┴──────────┐
           ├─────►│ Redis: cache, cart sessions, rate limits │
           │      └──────────────────────────────────────────┘
           │      ┌──────────────────────────────────────────┐
           └─────►│ MongoDB: products, orders, stock         │
                  │ (primary for writes, replicas for reads) │
                  └──────────────────────────────────────────┘
   Stripe ── webhook "payment succeeded" ──► API ──► queue ──► workers:
                                                    email, invoice PDF,
                                                    search index update
```

## 🧑‍💻 Code example

The key piece: **reduce stock safely** when two people buy the last item at the same moment. MongoDB checks the stock and changes it in **one** step.

You need MongoDB running locally (or an Atlas URI in `MONGO_URI`). Set up:

```bash
npm init -y
npm install mongoose
```

Save this as `stock.mjs`. Run it with `node stock.mjs`.

```js
import mongoose from 'mongoose';                                          // load Mongoose 8

await mongoose.connect(process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/shop'); // connect to the shop database
const Product = mongoose.model('Product', new mongoose.Schema({ name: String, stock: Number })); // a product with a stock count

await Product.deleteMany({});                                              // clean start for the demo
const phone = await Product.create({ name: 'Phone X', stock: 1 });        // only ONE phone left

async function reserve(productId, qty, buyer) {                           // try to take qty items for a buyer
  const updated = await Product.findOneAndUpdate(                         // find AND change in one atomic step
    { _id: productId, stock: { $gte: qty } },                             // only match if stock >= qty
    { $inc: { stock: -qty } },                                            // $inc with -1 = take one away
    { new: true },                                                        // new: true = return the updated product
  );                                                                      // end of findOneAndUpdate
  console.log(buyer, updated ? `got it, stock now ${updated.stock}` : 'sold out'); // null = no match = sold out
}                                                                         // end of reserve

await Promise.all([reserve(phone._id, 1, 'Asha'), reserve(phone._id, 1, 'Ravi')]); // both click "Buy" at the same time
await mongoose.disconnect();                                              // close the connection so the script ends
```

Output (who wins can change, but only **one** person gets it):

```text
Asha got it, stock now 0
Ravi sold out
```

The bad version reads first (`if (product.stock >= 1)`), then saves. Both buyers read `stock: 1`, both pass the check, and you sell two phones you don't have. That is a [race condition](glossary:race-condition).

## 🔍 Deeper version

### Browsing: make reads cheap

| Piece | Choice | Why |
|---|---|---|
| Product pages | [Next.js](topic:mern-architectures/ssr-nextjs) server rendering with caching, or static pages rebuilt on change | Real HTML for Google and link previews, and fast loads |
| Static files | [CDN](topic:system-design/cdn) | Images and JS come from a server near the user |
| Hot data | [Redis cache-aside](topic:system-design/redis-cache-aside) | "Top 100 products" served from memory |
| Search and filters | MongoDB indexes at first; a search engine (Atlas Search or Elasticsearch) later | Text search with typos and facets needs a search engine at scale |
| Database reads | Read replicas for browse queries | Keeps the primary free for orders. See [database scaling](topic:system-design/database-scaling). |

### Checkout: make writes correct

1. **Cart** lives in Redis (fast) or MongoDB (if it must survive for days).
2. **Reserve stock** with one atomic update, like the code above. Give the reservation an expiry, say 15 minutes, and a job releases it if unpaid.
3. **Create a Stripe Checkout Session or PaymentIntent**, with an [idempotency key](topic:rest-auth/idempotency-keys), so a double click doesn't charge twice.
4. **Confirm the order only from the Stripe [webhook](glossary:webhook).** Check the [signature](topic:rest-auth/webhook-signatures). Store the event id, so a repeated event is ignored.
5. **Put follow-up work on a queue**: confirmation email, invoice PDF, search index update. See [event-driven with queues](topic:mern-architectures/event-driven-queues).

For an order that changes several documents (order + stock + coupon use), a MongoDB [transaction](topic:mongodb/transactions) keeps them all-or-nothing.

### Surviving a sale-day spike

- Keep the Express API **stateless** (no sessions in memory), so you can run 2 or 20 copies behind a [load balancer](topic:system-design/load-balancers-stateless).
- Add [rate limits](topic:system-design/rate-limiting) on login and checkout.
- Warm the cache before the sale starts.
- Put a **waiting room** in front of checkout for flash sales, so only a set number of buyers enter at once.

### How it grows

| Stage | Architecture |
|---|---|
| Small shop | Next.js (or a Vite SPA) + one Express API + MongoDB Atlas + Stripe |
| Growing | CDN, Redis cache, queue workers, read replicas |
| Big | Separate services for search, payments/orders and notifications; a [BFF](topic:mern-architectures/bff-api-gateway) for web and mobile apps |
| Very big | Each team owns its [microservices](topic:mern-architectures/microservices), events between them, sharded order data |

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| Browsing is fast and cheap thanks to CDN + cache | Cached pages can show an old price or stock for a short time |
| Checkout is safe from overselling | Atomic updates, webhooks and idempotency need careful code |
| Stateless API scales by adding copies | More moving parts: Redis, queues, replicas |
| Slow work never blocks the buyer | Background jobs need monitoring and retries |
| SSR pages rank well on Google | Next.js adds a second server to run |

## 🎯 When to choose it

- Public product catalogues where **SEO matters**.
- Traffic with **big peaks** (sales, launches) much higher than normal days.
- Any app that sells **limited stock**: tickets, seats, flash deals, course seats.

For a small shop with 50 products, start with the [MVP setup](topic:mern-architectures/scenario-mvp) and a hosted checkout page. Add caches and queues when traffic grows.

## ⚠️ Common mistakes

- **Read-then-write stock checks.** Two requests both see "1 left" and both buy. Use one atomic update.
- **Marking orders paid from the browser redirect.** Users close tabs and attackers fake redirects. Trust only the signed webhook.
- **Caching the cart or checkout.** Cache product pages, never someone's cart or payment status.
- **Sending emails inside the checkout request.** If the email provider is slow, checkout is slow. Use a queue.

## 🗣️ How to answer in an interview

> "I'd split the shop into two parts, because they have different needs.
>
> Browsing is read-heavy. I'd use Next.js to render product pages on the server and cache them, with a CDN in front, Redis cache-aside for hot data, and MongoDB read replicas for browse queries.
>
> Checkout must be correct. I'd reserve stock with one atomic `findOneAndUpdate` that checks `stock >= qty` and uses `$inc`, so two buyers can't take the last item. Payment goes through Stripe with an idempotency key. I'd mark the order as paid only from the signed Stripe webhook, and I'd store event ids to ignore duplicates. Emails and invoices go to a queue.
>
> The Express API stays stateless, so I can run many copies behind a load balancer on sale days, with rate limits on checkout. I'd split search or payments into their own services only when one of them clearly needs to scale alone."

:::tip
You can link the webhook part to your own work. At SkillKeepr you built the Stripe subscription auto-renewal: the renewal cron and the webhook trigger. Keep the shop design separate from what you built.
:::

## 🔁 Follow-up questions

### How do you keep cached product pages up to date?

Give pages a short cache time, and also clear the cache when a product changes (for example, the admin "save" button triggers a revalidation). Show the exact stock and price again at checkout, from the database.

### What if the payment succeeds but stock ran out?

It can happen if a reservation expired. Refund automatically through Stripe and tell the user. Better: keep the reservation alive until the payment window closes.

### Why Redis for the cart?

Carts change often and are read on every page. Redis is in memory, so it's very fast. Give carts an expiry, so old ones clean themselves up.

### When would you move search out of MongoDB?

When users need typo-tolerant search, many filters (facets) and ranking across lots of products. Then use Atlas Search or a separate search engine, kept in sync by a background job.

## ✅ Quick check

### 1. Predict: this code runs for two buyers at once, with stock 1. How many phones are sold?

```js
const p = await Product.findById(id);          // both buyers read stock: 1
if (p.stock >= 1) { p.stock -= 1; await p.save(); sell(); }
```

:::answer
**Two.** Both read `stock: 1` before either saves, so both pass the check. This is a race condition. Use one atomic `findOneAndUpdate` with `{ stock: { $gte: 1 } }` and `$inc`.
:::

### 2. Where should "order paid" be decided?

- A) When the browser comes back to `/success`
- B) In the Stripe webhook handler, after checking the signature
- C) When the user clicks "Pay"

:::answer
**B.** The webhook comes from Stripe's server, is signed, and is retried. A can be skipped or faked, and C happens before payment.
:::

### 3. Which part of the shop is the best fit for a CDN and caching?

:::answer
**Product and category pages** (and images). They are the same for everyone and read millions of times. Carts and checkout are per-user, so they must not be cached.
:::
