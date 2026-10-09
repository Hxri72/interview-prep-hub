---
title: Password hashing with bcrypt
stack: rest-auth
order: 11
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Never store passwords as plain text, and never encrypt them. Store a slow, salted HASH instead."
  - "A hash is one-way: you can't turn it back into the password. To log in, you hash again and compare."
  - "bcrypt adds a random salt to every hash, so two users with the same password get different hashes."
  - "The cost (salt rounds, like 12) makes hashing slow on purpose, so guessing millions of passwords takes too long."
  - "Use bcrypt.hash() at sign-up and bcrypt.compare() at login. Argon2id is the newer recommended algorithm."
cards:
  - q: Why hash passwords instead of encrypting them?
    a: "Encryption can be reversed with the key. If the key leaks, every password leaks. A hash is one-way, so even the server can't read the passwords."
  - q: What is a salt?
    a: A random value added to each password before hashing. It makes every hash unique, so attackers can't use pre-built tables or spot users with the same password.
  - q: What does saltRounds = 12 mean?
    a: "It is the cost. bcrypt does 2^12 rounds of work. Higher = slower to hash = much slower for attackers to guess. Each +1 doubles the time."
  - q: How do you check a password at login?
    a: "bcrypt.compare(typedPassword, savedHash). It reads the salt from the saved hash, hashes the typed password the same way, and compares the results."
  - q: bcrypt vs argon2id?
    a: Both are slow password hashes. Argon2id is newer and also uses a lot of memory, which makes GPU attacks harder. OWASP recommends argon2id first; bcrypt is still acceptable.
---

## 💡 What is it?

**Password hashing** means turning a password into a fixed, scrambled string called a **[hash](glossary:hash)**. You save the hash, never the password.

A hash is **one-way**. You can't turn it back into the password. To check a login, you hash what the user typed and compare.

**bcrypt** is a popular hashing algorithm made for passwords. It is **slow on purpose** and adds a random **[salt](glossary:salt)** to every password.

## 🏠 Real-life example

Think of **making a fruit smoothie**.

You put in a banana, mango and milk, and blend. You can't un-blend the smoothie to get the banana back. But if someone gives you the same fruits, you can blend again and check that the taste matches.

- The **fruits** = the password.
- The **blender** = bcrypt.
- The **smoothie** = the hash you save in the database.
- A **secret pinch of a random spice** added each time = the salt. Two people with the same fruits still get different-tasting smoothies.
- **Blending slowly** = the cost. A thief who wants to test a million fruit mixes has to wait a very long time.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install bcrypt`. Save as `hash.js` and run `node hash.js`.

```js
const bcrypt = require('bcrypt');                           // load bcrypt (npm install bcrypt)

async function main() {                                     // async, because hashing is slow on purpose
  const password = 'MySecret@123';                          // what the user typed when signing up
  const saltRounds = 12;                                    // cost: 12 → 2^12 rounds of work
  const hash1 = await bcrypt.hash(password, saltRounds);    // hash it (a new random salt is made inside)
  const hash2 = await bcrypt.hash(password, saltRounds);    // hash the SAME password again
  console.log('hash 1:', hash1);                            // this is what we save in the database
  console.log('hash 2:', hash2);                            // different text, because the salt is different
  console.log('same text?', hash1 === hash2);               // false → you can't compare hashes with ===
  console.log('right password:', await bcrypt.compare(password, hash1));         // true
  console.log('wrong password:', await bcrypt.compare('mysecret@123', hash1));   // false (small "m")
}                                                           // end of main

main();                                                     // run it
```

**Output** (your hashes will be different every time):

```text
hash 1: $2b$12$Nm/7i0edALjSiCu7W.sL/.o97kQ0gEPnLrWRq8T.0LK/ZVHwxjxNS
hash 2: $2b$12$axHaM1nGlnjGrG4yaBrMMeJvzvstlRRd7Yue4WQFjg3OaC2xIffMi
same text? false
right password: true
wrong password: false
```

**What to notice:** the same password gives two different hashes, but `compare` still says `true`. That's the salt at work.

## 🔍 Deeper version

**Reading a bcrypt hash.** `$2b$12$Nm/7i0edALjSiCu7W.sL/.o97kQ0gEPnLrWRq8T.0LK/ZVHwxjxNS`

| Part | Meaning |
|---|---|
| `$2b$` | the bcrypt version |
| `12$` | the cost (2^12 rounds) |
| next 22 characters | the salt (random, stored right inside the hash) |
| last 31 characters | the actual hash result |

The salt is stored **inside** the hash. So you don't need a separate salt column. `compare` reads it from there.

**Why "slow" is a feature.** Normal hashes like SHA-256 are very fast. A GPU can try **billions** of guesses per second against them. bcrypt with cost 12 takes a noticeable fraction of a second for each guess. That makes a leaked database far harder to crack. Choose a cost that takes roughly 100–300 ms on your server. Each +1 doubles the time.

**Why not encryption?** Encryption (like AES) can be **reversed** with a key. The key has to live somewhere on the server. If an attacker gets the database **and** the key, every password is exposed in plain text. With hashing, there is nothing to reverse.

**Why a salt?**
- Without a salt, the same password always gives the same hash. Attackers use huge pre-computed lists ("rainbow tables") to look them up.
- Without a salt, two users with `Password123` have identical hashes. Crack one and you've cracked both.

**Hashing blocks the CPU.** `bcrypt.hash` and `compare` (the async versions) run in libuv's [thread pool](glossary:thread-pool), so they don't block the [event loop](glossary:event-loop). **Never use `hashSync` / `compareSync` inside request handlers.** See [the libuv thread pool](topic:nodejs/libuv-thread-pool).

**bcrypt only uses the first 72 bytes** of the password. Most apps cap password length at 64–128 characters, so this rarely matters. It's a good detail to mention.

**Argon2id, the modern choice.** OWASP's password storage guide recommends **Argon2id** first. It is slow **and** uses a lot of memory, which makes GPU and special-hardware attacks much harder. bcrypt is still acceptable for existing systems. In Node, the `argon2` package has the same idea: `argon2.hash(password)` and `argon2.verify(hash, password)`.

**Upgrading old hashes.** You can't re-hash passwords you can't read. The usual trick: when a user logs in successfully, hash their password with the new algorithm or cost and save it. Over time, all active users are upgraded.

## 🎯 Why do we use it?

Databases get leaked: through a bug, a stolen backup, or a bad employee. If passwords are stored safely:
- The attacker gets only slow, salted hashes, not passwords.
- People who reuse passwords elsewhere (like for their email) are protected.
- The company avoids a much bigger security and legal problem.

## ⚠️ Common mistakes

- **Storing plain text or encrypted passwords.** Both can be read if the system is breached. Always hash.
- **Using a fast hash like MD5 or SHA-256 for passwords.** They are fine for file checks, but far too fast for passwords.
- **Comparing with `===`.** Two hashes of the same password are different. Always use `bcrypt.compare`.
- **Using `hashSync` inside a route.** It blocks the event loop for every other user.
- **Telling users which part was wrong.** Say "Wrong email or password", not "email not found". Otherwise attackers learn which emails exist.

## 🗣️ How to answer in an interview

> "I never store passwords as plain text or with reversible encryption. I store a slow, salted hash. With bcrypt, at sign-up I call `bcrypt.hash(password, 12)`. That generates a random salt, runs 2 to the power 12 rounds, and returns a string that contains the version, the cost, the salt and the hash. At login I call `bcrypt.compare` with the typed password and the saved hash.
>
> The salt means two users with the same password get different hashes, so rainbow tables don't work. The cost makes each guess slow, so a leaked database is very hard to crack. I use the async functions, because they run in the libuv thread pool and don't block the event loop. For new systems I'd also consider Argon2id, which OWASP recommends first because it's memory-hard."

## 🔁 Follow-up questions

### How do you choose the cost factor?

Measure on your production server. Pick the highest cost that keeps login comfortable, roughly 100–300 ms per hash. Many apps use 10–12. Raise it over the years as hardware gets faster.

### How does `bcrypt.compare` know the salt?

The salt is stored inside the hash string itself (the 22 characters after the cost). `compare` reads it, hashes the typed password with the same salt and cost, then compares the two results.

### What is a "pepper"?

An extra secret added to every password before hashing, stored outside the database (for example in a secret manager). If only the database leaks, the attacker also needs the pepper. It is optional and adds key-management work.

### Is it OK to hash passwords on the frontend instead?

No. Then the hash itself becomes the password: anyone who steals it can log in with it. Always send the password over HTTPS and hash it on the server.

### How would you move an existing system to bcrypt or argon2?

On the next successful login, check the password the old way, then hash it with the new algorithm and save it. Users who never log in again can be forced to reset their password.

## ✅ Quick check

### 1. Two users both pick `Hello@123`. With bcrypt, are their saved hashes the same?

:::answer
**No.** bcrypt adds a different random salt for each hash, so the stored strings are different. `compare` still works for each user.
:::

### 2. Which is the right way to check a login?

- A) `bcrypt.hash(typed, 12) === user.passwordHash`
- B) `await bcrypt.compare(typed, user.passwordHash)`
- C) `decrypt(user.passwordHash) === typed`

:::answer
**B.** A fails because each hash has a new salt. C is wrong because a hash can't be decrypted, and passwords shouldn't be encrypted at all.
:::

### 3. You change `saltRounds` from 10 to 12. Roughly how much slower is each hash?

:::answer
**About 4 times slower.** Each +1 doubles the work: 2^12 / 2^10 = 4.
:::
