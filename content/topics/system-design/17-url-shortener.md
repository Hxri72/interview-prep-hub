---
title: "Practice: URL shortener"
stack: system-design
order: 17
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A URL shortener turns a long link into a short code and redirects people who open it.
  - It is read-heavy (many more redirects than new links), so caching and a fast lookup by code matter most.
  - Make codes from a unique counter in base62 (0-9, a-z, A-Z). 7 characters give about 3.5 trillion codes.
  - Store code → long URL in a key-value store or database with a unique index on the code; cache hot codes in Redis.
  - Redirect with 301 (cached by browsers) or 302 (every click hits you, so you can count clicks).
cards:
  - q: Why base62?
    a: It uses only letters and digits, so codes are safe in URLs and short. 62 choices per character means 7 characters give 62^7 ≈ 3.5 trillion codes.
  - q: How do you avoid two links getting the same code?
    a: Generate codes from a unique counter (a database sequence, Redis INCR, or ranges handed out to each server). If you use random codes, rely on a unique index and retry on collision.
  - q: 301 or 302 for the redirect?
    a: 301 is permanent and cached by browsers, so it's fast but you lose click counts. 302 is temporary, so every click reaches your server and can be counted.
  - q: Why is caching important here?
    a: Redirects are far more common than new links, and a few popular links get most clicks. Keeping them in Redis makes redirects fast and protects the database.
  - q: Why might sequential codes be a problem?
    a: People can guess other codes (abc1, abc2...) and find private links. You can mix the counter or add randomness to make codes hard to guess.
---

## 💡 What is it?

A **URL shortener** (like bit.ly) takes a long link and gives back a short one, like `https://sho.rt/21`.

When someone opens the short link, the service **looks up the code** and **redirects** them to the long URL.

It is a classic interview design because it is small but touches IDs, storage, caching and scale.

## 🏠 Real-life example

Think of a **school library's book numbers**.

- Each new book gets the **next number** on a sticker: 125, 126, 127.
- To keep stickers small, the library writes numbers in a **short code** using letters and digits.
- A **register** says which shelf each code belongs to.
- When a student shows a sticker code, the librarian **checks the register** and points to the shelf.
- Popular books have their codes **written on a board at the desk**, so the librarian doesn't open the register every time.

Map it:
- **Next number** = a unique counter.
- **Short code** = base62 encoding.
- **Register** = the database (code → long URL).
- **Pointing to the shelf** = the HTTP redirect.
- **Board at the desk** = the Redis cache for hot links.

## 🧑‍💻 Code example

The core of a shortener: counter → base62 code, save it, and look it up. Save as `shortener.js` and run `node shortener.js`.

```js
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; // 62 characters
const store = new Map();                                    // code → long URL (a database in real life)
let counter = 125;                                          // next unique id (a DB sequence or Redis INCR)

function toBase62(n) {                                      // turn a number into a short code
  let code = '';                                            // build the code from the right
  do {                                                      // run at least once, so 0 becomes "0"
    code = ALPHABET[n % 62] + code;                         // the remainder picks one character
    n = Math.floor(n / 62);                                 // move to the next "digit"
  } while (n > 0);                                          // stop when nothing is left
  return code;                                              // e.g. 125 → "21"
}                                                           // end of toBase62

function shorten(longUrl) {                                 // POST /urls
  const code = toBase62(counter++);                         // unique number → short code, then add 1
  store.set(code, longUrl);                                 // save the pair
  return `https://sho.rt/${code}`;                          // the short link to share
}                                                           // end of shorten

function resolve(code) {                                    // GET /:code
  return store.get(code) ?? '404 Not Found';                // the long URL, or not found
}                                                           // end of resolve

console.log(shorten('https://jobs.example.com/node-dev-kochi')); // first link
console.log(shorten('https://jobs.example.com/react-dev'));     // second link
console.log(resolve('21'));                                 // look up the first code
console.log(resolve('zzz'));                                // a code that doesn't exist
console.log('3.5 trillion ids fit in 7 chars:', 62 ** 7);    // capacity of 7 base62 characters
```

**Output:**

```text
https://sho.rt/21
https://sho.rt/22
https://jobs.example.com/node-dev-kochi
404 Not Found
3.5 trillion ids fit in 7 chars: 3521614606208
```

125 is `2 × 62 + 1`, so it becomes "2" then "1" → `21`.

## 🔍 Deeper version

Follow the 6 steps from [how to approach a design](topic:system-design/how-to-approach).

**1. Requirements**
- Functional: create a short link, redirect, optional custom alias, optional expiry, click counts.
- Non-functional: very fast redirects (under ~50 ms), highly available, codes not easy to guess, links never point to the wrong place.
- Scale guess: 1 million new links a day, 100 million redirects a day → about **100 reads per write**.

**2. API**

```text
POST /api/urls        { "longUrl": "...", "alias"?: "...", "expiresAt"?: "..." }  → 201 { "shortUrl": "https://sho.rt/21" }
GET  /:code           → 302 Location: <longUrl>   (404 if unknown, 410 if expired)
GET  /api/urls/:code/stats  → { "clicks": 1234 }
```

**3. Data model**
- `urls`: `code` (unique index), `longUrl`, `userId`, `createdAt`, `expiresAt`.
- `clicks`: written in batches or to an analytics stream, not one row per click on the hot path.
- A key-value lookup by `code` is all redirects need, so MongoDB, PostgreSQL or DynamoDB all work.

**4. Architecture**

```text
Client ──► CDN / load balancer ──► API servers (stateless) ──► Redis cache (hot codes)
                                         │                         │ miss
                                         │                         ▼
                                         │                    Database (code → longUrl)
                                         └──► queue/stream ──► click counter (async)
```

**5. Code generation options**

| Option | Good | Bad |
|---|---|---|
| Counter + base62 | short, no collisions | needs a shared counter; guessable |
| Counter ranges per server | no single bottleneck | small gaps in codes |
| Random 7 chars + unique index | hard to guess | must retry on rare collisions |
| Hash of the URL (first 7 chars) | same URL → same code | collisions; can't make two codes for one URL |

**6. Bottlenecks and trade-offs**
- **Hot links:** cache-aside in Redis. See [Redis cache-aside](topic:system-design/redis-cache-aside).
- **301 vs 302:** 301 is cached by browsers (fast, fewer hits, no counts); 302 lets you count every click.
- **Abuse:** rate-limit link creation, check URLs against malware lists. See [rate limiting](topic:system-design/rate-limiting).
- **Growth:** the database can be sharded by `code`. See [database scaling](topic:system-design/database-scaling).

## 🎯 Why do we use it?

Short links are easy to share in SMS, chat and print, and they let you count clicks. As an interview question, it tests ID generation, read-heavy design and caching in a small space.

## ⚠️ Common mistakes

- **No unique index on the code.** Two links can collide.
- **Counting clicks synchronously in the database.** Every redirect becomes a slow write.
- **Using 301 when clicks must be counted.** Browsers skip your server next time.
- **Not asking about scale first.** Interviewers want numbers to guide choices.

## 🗣️ How to answer in an interview

> "First I'd confirm requirements: create short links, redirect fast, maybe custom aliases, expiry and click stats. It's very read-heavy — roughly 100 redirects per new link.
>
> The API is a POST to create a link and a GET on the code that returns a 302. I generate codes from a unique counter encoded in base62, so seven characters give about 3.5 trillion codes with no collisions. To avoid a single counter bottleneck, each server can take a range of IDs. If codes must be hard to guess, I'd use random codes with a unique index and retry on collision.
>
> Storage is a simple code-to-URL lookup with a unique index. Because a few links get most clicks, I'd cache them in Redis with cache-aside. Click counting goes through a queue so redirects stay fast. I'd use 302 if we need accurate click counts, 301 if we don't."

## 🔁 Follow-up questions

### How do you support custom aliases?

Check the alias isn't taken (the unique index does it), reserve words like `api`, and validate allowed characters.

### How do you expire links?

Store `expiresAt`. Return 410 Gone after it. A TTL index or a cleanup job can delete old rows.

### How do you count clicks at high scale?

Send a small event per click to a queue or stream, and update counts in batches. Or increment counters in Redis and save them every few seconds.

## ✅ Quick check

### 1. Why is this system "read-heavy"?

:::answer
Each link is created once but opened many times. Redirects (reads) far outnumber new links (writes), so we optimise reads with caching.
:::

### 2. What does `toBase62(62)` return?

:::answer
**"10"**. 62 divided by 62 is 1 with remainder 0, so the code is "1" then "0" — just like 10 in normal numbers.
:::

### 3. You must count every click. Should the redirect be 301 or 302?

:::answer
**302.** A 301 is cached by browsers, so later clicks may not reach your server and won't be counted.
:::
