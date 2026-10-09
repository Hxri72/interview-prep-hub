---
title: Someone is hammering the login endpoint
template: scenario
stack: debugging
order: 27
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Signs: a spike of failed logins, often from the same IPs or against many accounts, plus a CPU spike from password checks."
  - Add rate limiting on the login route, by IP and by account (email).
  - After several failures, slow down, lock the account for a short time, or ask for a CAPTCHA.
  - Always return the same error message, so attackers can't learn which emails exist.
  - Log failed logins and alert on spikes. Strong password hashing (bcrypt) makes stolen data less useful.
cards:
  - q: How do you notice a brute-force attack on login?
    a: A spike in failed logins in the logs — many attempts from the same IPs, or one password tried against many accounts — and high CPU from password hashing.
  - q: What is the first fix?
    a: Rate limiting on POST /login, for example 5 attempts per 15 minutes per IP, plus a limit per email address.
  - q: Why limit by account and not only by IP?
    a: Attackers use many IPs (a botnet). A per-account limit still protects one user, even when each IP sends only a few tries.
  - q: Why return the same message for "wrong email" and "wrong password"?
    a: Different messages tell the attacker which emails are registered. One generic message ("Invalid email or password") hides that.
  - q: What is credential stuffing?
    a: Attackers take email + password pairs leaked from other websites and try them on yours, hoping people reused passwords.
---

## 💡 What is it?

Someone sends **thousands of login requests** to your API. They are guessing passwords. This is called a **brute-force attack**.

A newer version is **credential stuffing**. The attacker uses real email + password pairs leaked from other websites. They hope people reused the same password on your site.

Your server gets slow, real users may be locked out, and some accounts may get broken into.

## 🏠 Real-life example

Think of a **school locker room with combination locks**.

A stranger walks in and tries **every number** on every lock, one after another.

- **Trying numbers** = guessing passwords.
- **"Only 5 tries per hour"** = **rate limiting**.
- **A lock that freezes after 5 wrong tries** = **account lockout**.
- **The watchman** who notices someone at the lockers for an hour = **logs and alerts**.
- **The same beep for every wrong try**, so the stranger can't tell which locker even exists = **one generic error message**.

## 🔎 Detect

- **Logs:** a sudden jump in failed logins (`401` responses on `POST /login`).
- **Pattern 1:** many tries from **the same IPs**.
- **Pattern 2:** **one password** tried against **many emails** (password spraying), or many emails from a leaked list.
- **CPU spike:** password hashing (like bcrypt) is slow on purpose, so thousands of checks use a lot of CPU.
- **Users report** being locked out, or getting "new login" emails they didn't expect.

## 🐞 Debug

1. **Count failed logins per minute.** Compare with a normal day.
2. **Group by IP and by email.** Is it a few IPs with many tries? Or many IPs, each with a few tries?
3. **Check for successful logins** from the attacking IPs. Did any account actually get in?
4. **Check your current protection.** Is there any rate limit on `/login`? Many apps protect other routes but forget login.
5. **Check your error messages.** Do you say "email not found" vs "wrong password"? That helps the attacker.

## 🔧 Fix

**Before:** no limit, and messages that leak information.

```js
// ❌ BEFORE — anyone can try forever, and the messages leak which emails exist
app.post('/login', async (req, res) => {                          // the login route
  const user = await User.findOne({ email: req.body.email });     // look up the user by email
  if (!user) return res.status(404).json({ message: 'Email not found' }); // tells the attacker the email doesn't exist
  const ok = await bcrypt.compare(req.body.password, user.passwordHash); // check the password
  if (!ok) return res.status(401).json({ message: 'Wrong password' });  // tells the attacker the email DOES exist
  res.json({ message: 'Logged in' });                             // success
});                                                               // end of the route
```

**After:** rate limit by IP and by email, a short lockout, and one generic message.

```js
// ✅ AFTER — npm install express-rate-limit
const rateLimit = require('express-rate-limit');                   // middleware that counts requests

const loginLimiter = rateLimit({                                   // a limit just for the login route
  windowMs: 15 * 60 * 1000,                                        // the time window: 15 minutes
  limit: 10,                                                       // max 10 login tries per IP in that window
  standardHeaders: 'draft-7',                                      // send RateLimit headers so clients know the limit
  legacyHeaders: false,                                            // don't send the old X-RateLimit-* headers
  message: { message: 'Too many login attempts. Try again later.' }, // body sent with the 429 response
});                                                                // end of the limiter options

app.post('/login', loginLimiter, async (req, res) => {             // the limiter runs before the route
  const email = String(req.body.email || '').toLowerCase();       // normalise the email; String() blocks objects
  const user = await User.findOne({ email });                      // look up the user
  if (user?.lockUntil > Date.now()) {                              // this account is locked right now
    return res.status(429).json({ message: 'Too many login attempts. Try again later.' }); // 429 = too many requests
  }                                                                // end of the lock check
  const ok = user && (await bcrypt.compare(String(req.body.password), user.passwordHash)); // check only if user exists
  if (!ok) {                                                       // wrong email OR wrong password
    if (user) {                                                    // only real accounts get a counter
      user.failedLogins = (user.failedLogins || 0) + 1;            // count this failure
      if (user.failedLogins >= 5) {                                // 5 failures in a row
        user.lockUntil = Date.now() + 15 * 60 * 1000;              // lock the account for 15 minutes
        user.failedLogins = 0;                                     // start counting again after the lock
      }                                                            // end of the lockout rule
      await user.save();                                           // store the counter and lock time
    }                                                              // end of the counter update
    return res.status(401).json({ message: 'Invalid email or password' }); // the SAME message for every failure
  }                                                                // end of the failure branch
  user.failedLogins = 0;                                           // success → reset the counter
  await user.save();                                               // save the reset
  res.json({ message: 'Logged in' });                              // success (the real app sets the JWT here)
});                                                                // end of the route
```

**What each value means:**
- `windowMs: 15 * 60 * 1000` = 15 minutes in milliseconds.
- `limit: 10` = at most 10 tries from one IP in those 15 minutes. Request 11 gets a `429 Too Many Requests`.
- `failedLogins >= 5` = a per-account rule, so attackers with many IPs still can't keep guessing one account.

:::note
`express-rate-limit` stores counts **in memory** by default. With several servers, each one counts on its own. In production, use a shared store like **Redis**, so all servers share one count.
:::

## 🛡️ Prevent

- **Rate limit every auth route:** login, signup, forgot-password and OTP checks. See [security middleware](topic:express/security-middleware).
- **Hash passwords with bcrypt or argon2**, never store them in a way that can be reversed. See [password hashing with bcrypt](topic:rest-auth/bcrypt).
- **MFA (a second factor)**, like an OTP, for admin accounts at least.
- **CAPTCHA** after a few failures, instead of only locking. Lockouts can be abused to lock real users out.
- **Monitoring:** alert when failed logins per minute go far above normal.
- **A WAF** (web application firewall, like AWS WAF or Cloudflare) can block known bad IPs before they reach your code.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "I'd see a spike of failed logins in the logs, often from a few IPs or against many accounts. I'd add rate limiting on the login route by IP and by account, a short lockout or CAPTCHA after repeated failures, and one generic error message. Then alerts on failed-login spikes, and bcrypt hashing so leaked data is less useful."

**Full version:**

> "First I confirm it's an attack. I count failed logins per minute and group them by IP and by email. A few IPs with many tries is brute force. One password against many emails is password spraying. A leaked list of emails and passwords is credential stuffing.
>
> Then I add rate limiting on `POST /login`, for example 10 tries per 15 minutes per IP, with a shared Redis store if there are several servers. Because attackers rotate IPs, I also count failures per account, and lock the account for a short time or show a CAPTCHA after five failures.
>
> I return the same message — 'Invalid email or password' — for every failure, so attackers can't learn which emails exist. Passwords are hashed with bcrypt, and I'd add MFA for admin users. Finally, an alert on failed-login spikes, so we catch the next attack early."

[FILL IN: if you added rate limiting or lockout to a login route at SkillKeepr or in a project, say what you did. Only if true.]

## 🔁 Follow-up questions

### Can't an attacker abuse lockouts to lock real users out?

Yes. That is a "denial of service" against users. Softer options help: a CAPTCHA after failures, slowing down responses, or locking only for that IP + account pair. Keep lockouts short, like 15 minutes.

### Why is bcrypt "slow on purpose"?

Each hash takes a fixed amount of work (the "cost factor"). That is fast enough for one real login, but very slow for someone testing millions of guesses on stolen data.

### How do you rate limit across several servers?

Use a shared store, like Redis, for the counters. Then every server reads and updates the same count. In-memory limits only work for a single server.

### What status code should a rate-limited request get?

`429 Too Many Requests`. Optionally add a `Retry-After` header that says how many seconds to wait.

## ✅ Quick check

### 1. Which response is safer for a failed login?

- A) "No account with that email"
- B) "Wrong password for this account"
- C) "Invalid email or password"

:::answer
**C.** It doesn't tell the attacker whether the email is registered. A and B both leak that information.
:::

### 2. An attacker uses 5,000 different IPs, each trying 3 passwords on the same account. Does a "10 per IP" limit stop them?

:::answer
**No.** Each IP stays under the limit. You also need a **per-account** limit or lockout, which counts all failures for that email no matter which IP they come from.
:::

### 3. What does `limit: 10` with `windowMs: 15 * 60 * 1000` mean?

:::answer
At most **10 requests per IP in 15 minutes**. The 11th request inside that window gets a `429 Too Many Requests`.
:::
