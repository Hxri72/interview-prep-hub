---
title: localStorage, sessionStorage and cookies
stack: javascript
order: 30
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - localStorage keeps data until you delete it. sessionStorage is cleared when the tab closes.
  - Both store only strings (about 5 MB per site). Use JSON.stringify and JSON.parse for objects.
  - Cookies are small (about 4 KB) and are sent to the server with every request automatically.
  - An httpOnly cookie can't be read by JavaScript, so XSS can't steal it. That makes it safer for login tokens.
  - Any JavaScript on the page can read localStorage, so never keep secrets there.
cards:
  - q: localStorage vs sessionStorage?
    a: localStorage stays after the browser closes. sessionStorage is cleared when that tab is closed. Both belong to one site (origin).
  - q: What is the big difference between cookies and localStorage?
    a: Cookies are sent to the server with every request automatically. localStorage stays in the browser and is never sent unless your code sends it.
  - q: Why is an httpOnly cookie safer for a JWT than localStorage?
    a: JavaScript can't read an httpOnly cookie. So if an attacker injects a script (XSS), they can't steal the token.
  - q: How do you store an object in localStorage?
    a: "Turn it into a string first: localStorage.setItem('user', JSON.stringify(user)). Read it back with JSON.parse."
  - q: What does the SameSite cookie setting protect against?
    a: CSRF — another site making your browser send a request with your cookie. SameSite=Lax or Strict stops most of these.
---

## 💡 What is it?

The browser can save small amounts of data for a website. There are three main places:

- **localStorage**: stays until you delete it, even after closing the browser.
- **sessionStorage**: stays only while that **tab** is open.
- **[Cookies](glossary:cookie)**: small pieces of data that the browser also **sends to the server** with every request.

Websites use these to remember things like your theme, your cart or your login.

## 🏠 Real-life example

Think of three ways to keep things at school:

- **localStorage = your locker.** You put things in it. They stay there for weeks until you take them out. Only you open it.
- **sessionStorage = your desk for today.** You leave things on it during class. When the day ends (the tab closes), it's cleared.
- **Cookie = your ID card.** You carry it everywhere. You show it **at every gate** automatically (sent to the server with every request).
- **httpOnly cookie = an ID card in a sealed plastic cover.** The guards at the gate can read it. But nobody can pull it out of the cover and copy it (JavaScript can't read it).

## 🧑‍💻 Code example

Open any website, press F12, go to the **Console** tab, and paste this in.

```js
localStorage.setItem('theme', 'light');                    // save the string 'light' under the key 'theme'
console.log(localStorage.getItem('theme'));                // read it back → 'light'

const user = { name: 'Asha', role: 'recruiter' };          // an object (storage only keeps strings)
localStorage.setItem('user', JSON.stringify(user));        // turn the object into a JSON string, then save it
const saved = JSON.parse(localStorage.getItem('user'));    // read the string and turn it back into an object
console.log(saved.role);                                   // → 'recruiter'

console.log(localStorage.getItem('missing'));              // a key that doesn't exist → null

sessionStorage.setItem('step', '2');                       // save for this tab only
console.log(sessionStorage.getItem('step'));               // → '2' (gone after you close the tab)

document.cookie = 'lang=en; max-age=3600; path=/';         // make a cookie 'lang=en' that lasts 3600 seconds (1 hour)
console.log(document.cookie.includes('lang=en'));          // → true (all readable cookies come as one long string)

localStorage.removeItem('user');                           // delete one key
```

**Output in the Console:**

```text
light
recruiter
null
2
true
```

## 🔍 Deeper version

| | localStorage | sessionStorage | Cookie |
|---|---|---|---|
| How long it lasts | until deleted | until the tab closes | until it expires (or the session ends) |
| Size limit | about 5 MB per origin | about 5 MB per origin | about 4 KB per cookie |
| Sent to the server? | no | no | **yes, with every request** to that site |
| JavaScript can read it? | yes | yes | yes, **unless `httpOnly`** |
| API | `setItem` / `getItem` | `setItem` / `getItem` | `document.cookie` string, or `Set-Cookie` header from the server |

An **origin** is the protocol + domain + port, like `https://app.example.com`. Storage belongs to one origin. Other sites can't read it.

**Storing login tokens: the big interview question.**

- **In localStorage:** easy to use. You add the token to the `Authorization` header yourself. But **any script on the page can read it**. If an attacker manages an **[XSS](glossary:xss)** attack (running their script on your page), they can steal the token.
- **In an httpOnly cookie:** the server sets it with `Set-Cookie: token=...; HttpOnly; Secure; SameSite=Lax`. JavaScript **can't read it**, so XSS can't steal it. The browser sends it automatically. But automatic sending opens a different risk: **CSRF**. That's when another site tricks your browser into sending a request with your cookie. `SameSite=Lax` or `Strict` blocks most of this, and CSRF tokens block the rest.

Cookie settings to know:
- `HttpOnly`: JavaScript can't read it.
- `Secure`: only sent over HTTPS.
- `SameSite=Strict | Lax | None`: controls whether it's sent on requests from other sites. `None` also needs `Secure`.
- `Max-Age` / `Expires`: when it expires.

A common pattern: a short-lived access token in memory, plus a refresh token in an httpOnly cookie.

**Other notes:**
- Storage calls are **synchronous**. They block the main thread for a moment, so don't store huge data.
- Storage can throw an error when it's full, or in some private-browsing modes. Wrap writes in `try/catch`.
- The `storage` event fires in **other tabs** when localStorage changes. You can use it to sync logout across tabs.
- For large or structured data (like offline apps), use **IndexedDB**.

## 🎯 Why do we use it?

- **Remember user choices** like theme, language or filters, without a server.
- **Keep work safe**, like a half-filled form, if the page reloads.
- **Keep the user logged in**, usually with cookies set by the server.
- **Send identity automatically** with each request (cookies), which servers use for sessions.

## ⚠️ Common mistakes

- **Storing objects without `JSON.stringify`.** You get the string `"[object Object]"`.
- **Putting secrets or sensitive personal data in localStorage.** Any script on the page can read it.
- **Forgetting that cookies go with every request.** Big cookies make every request slower.
- **Not handling `null`.** `getItem` returns `null` for a missing key, and `JSON.parse(null)` returns `null`, which can crash later code.

## 🗣️ How to answer in an interview

> "All three store data in the browser, per origin. localStorage lasts until it's deleted, sessionStorage is cleared when the tab closes, and both hold only strings, around 5 MB, so I use JSON.stringify and JSON.parse for objects. Cookies are much smaller, around 4 KB, and the browser sends them to the server with every request.
>
> For auth tokens, the trade-off is XSS versus CSRF. A token in localStorage is easy to use, but any injected script can read it. An httpOnly, Secure cookie can't be read by JavaScript, so it's safer against XSS, and I protect it from CSRF with SameSite=Lax or Strict, plus CSRF tokens if needed.
>
> I use localStorage only for non-sensitive things like theme or saved filters."

[FILL IN: where the SkillKeepr frontend stores the JWT (localStorage, memory, or httpOnly cookie). Only add it if it's true.]

## 🔁 Follow-up questions

### What is XSS?

Cross-site scripting. An attacker gets their JavaScript to run on your page, for example through a comment that's shown with `innerHTML`. That script can read localStorage and non-httpOnly cookies, and act as the user. Prevent it by escaping output, using `textContent`, and setting a Content Security Policy.

### What is CSRF?

Cross-site request forgery. Another site makes the user's browser send a request to your site, and the browser attaches your cookies automatically. `SameSite` cookies and CSRF tokens prevent it. Tokens sent in an `Authorization` header aren't affected, because the browser doesn't add them automatically.

### Can two tabs share sessionStorage?

No. Each tab has its own sessionStorage, even on the same site. (A tab opened from another tab starts with a copy, then they're separate.) localStorage is shared by all tabs of the same origin.

### How do you sync logout across tabs?

Listen for the `storage` event. When one tab removes the token from localStorage, the other tabs get the event and can log out too. `BroadcastChannel` is another way.

## ✅ Quick check

### 1. What does this print?

```js
localStorage.setItem('count', 5);           // save the number 5
console.log(typeof localStorage.getItem('count')); // what type comes back?
```

:::answer
**`"string"`.** Storage keeps only strings. The number 5 is saved as `"5"`. Use `Number(...)` when you read it.
:::

### 2. Which one can JavaScript NOT read?

- A) localStorage
- B) sessionStorage
- C) an httpOnly cookie

:::answer
**C.** `httpOnly` cookies are hidden from JavaScript. The browser still sends them to the server.
:::

### 3. True or false: data in sessionStorage survives closing and reopening the browser.

:::answer
**False.** sessionStorage is cleared when the tab is closed. localStorage survives.
:::
