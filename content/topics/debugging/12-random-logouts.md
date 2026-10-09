---
title: Users get logged out randomly
template: scenario
stack: debugging
order: 12
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Symptom: users are sent to the login page at random times, often after being idle or with many tabs open."
  - "Detect: look for 401 responses in the Network tab right before the logout; compare token expiry times."
  - "Common causes: a short access token with no working refresh, several tabs refreshing at the same time, and wrong cookie settings."
  - "Fix: one shared refresh call, queue the other requests while it runs, retry them after; keep tabs in sync."
  - "Prevent: test with very short token lifetimes, log 401 reasons on the server, and check cookie attributes per environment."
cards:
  - q: What is the most common cause of "random" logouts?
    a: The access token expires and the refresh doesn't work, so the next request gets 401 and the app logs the user out.
  - q: Why do many open tabs cause logouts?
    a: Each tab tries to refresh the token at the same time. With refresh-token rotation, the first refresh makes the old refresh token invalid, so the other tabs fail and log out.
  - q: How do you stop many requests from each starting a refresh?
    a: Keep one shared refresh promise. The first 401 starts the refresh; other requests wait for that same promise, then retry.
  - q: Which cookie settings can cause logouts?
    a: A Secure cookie on HTTP, the wrong Domain or Path, a SameSite value that blocks the cookie, or a short Max-Age. The browser simply stops sending it.
  - q: How do you test token expiry quickly?
    a: In a test environment, set the access token to expire in about 1 minute, then use the app normally and watch what happens at expiry.
---

## 💡 What is it?

Users say: "It keeps logging me out!" It happens at **random-looking times**. Often after a coffee break, or when they have **several tabs** open.

Behind the scenes, a request gets **401 Unauthorized** (not logged in), and the app sends the user to the login page. The job is to find **why** the server stopped trusting them.

## 🏠 Real-life example

Think of a **school day pass** that expires every hour.

When it expires, you go to the office for a new pass. But three of your friends also go at the same time, holding the same old pass. The office gives a new pass to the first one and **tears up the old one**. Your other friends now have a torn pass, so they are sent home.

- **Day pass** = the access token.
- **Going to the office for a new pass** = calling the refresh endpoint.
- **Friends holding the same old pass** = several tabs or requests refreshing at once.
- **Tearing up the old pass** = refresh-token rotation (each refresh token works only once).
- **Being sent home** = the user being logged out.
- **One friend goes, the rest wait for the new pass** = one shared refresh call.

## 🔎 Detect

- Ask: does it happen **after a fixed time**, like 15 or 60 minutes? That points to token expiry.
- Ask: does it happen **with many tabs open**? That points to a refresh race.
- Open the **Network tab** and keep it running (tick "Preserve log"). Right before the logout, find the **401** response. Note which request it was.
- Check the token or cookie expiry. In **Application → Cookies**, see the expiry date of the auth cookies.

## 🐞 Debug

1. **Is there a refresh at all?** If the app only has a short access token and no refresh logic, users are logged out at every expiry.
2. **Does the refresh fail?** Look at the refresh request in the Network tab. A 401 there usually means the refresh token was already used or expired.
3. **Do many requests refresh at once?** If you see 3–5 refresh calls at the same moment, that's a race.
4. **Are cookies sent?** If auth uses HttpOnly cookies, check the request headers for the `Cookie` header. Wrong `Secure`, `SameSite`, `Domain` or `Path` settings stop the browser from sending them. See [localStorage, sessionStorage and cookies](topic:javascript/browser-storage).
5. **Server side:** check the server logs for the exact 401 reason: expired, invalid signature, or a changed secret after a deploy. See [auth errors after deploy](topic:debugging/auth-errors-after-deploy).

## 🔧 Fix

**Before — every 401 starts its own refresh (race), or logs out at once:**

```js
async function api(url, options = {}) {                          // a small wrapper around fetch
  const res = await fetch(url, { ...options, credentials: 'include' }); // send the auth cookies
  if (res.status === 401) {                                      // the server says "not logged in"
    await fetch('/auth/refresh', { method: 'POST', credentials: 'include' }); // ❌ every failing request refreshes on its own
    return fetch(url, { ...options, credentials: 'include' });   // retry once
  }                                                              // end of 401 handling
  return res;                                                    // normal response
}                                                                // end of api
```

**After — one shared refresh; other requests wait for it:**

```js
let refreshPromise = null;                                       // the refresh in progress (null = none)

function refreshSession() {                                      // start a refresh, or reuse the running one
  if (!refreshPromise) {                                         // no refresh is running yet
    refreshPromise = fetch('/auth/refresh', { method: 'POST', credentials: 'include' }) // ask for new tokens
      .then((res) => res.ok)                                     // true if the refresh worked
      .finally(() => { refreshPromise = null; });                // allow a new refresh next time
  }                                                              // end of if
  return refreshPromise;                                         // everyone waits for the same promise
}                                                                // end of refreshSession

async function api(url, options = {}) {                          // the fixed wrapper
  const res = await fetch(url, { ...options, credentials: 'include' }); // send the auth cookies
  if (res.status !== 401) return res;                            // not an auth problem → return as usual
  const ok = await refreshSession();                             // ✅ only ONE refresh call for all requests
  if (!ok) {                                                     // the refresh itself failed
    window.location.href = '/login';                             // now it's a real logout
    return res;                                                  // stop here
  }                                                              // end of if
  return fetch(url, { ...options, credentials: 'include' });     // ✅ retry the original request once
}                                                                // end of api
```

**Keep tabs in sync (so one tab's logout or login updates the others):**

```js
const channel = new BroadcastChannel('auth');                    // a message channel shared by all tabs
channel.onmessage = (e) => {                                     // runs when another tab sends a message
  if (e.data === 'logout') window.location.href = '/login';      // follow the other tab's logout
};                                                               // end of listener
// after a real logout in this tab:
// channel.postMessage('logout');                                // tell the other tabs
```

## 🛡️ Prevent

- Choose sensible lifetimes: a **short access token** (minutes) plus a **refresh token** (days), and a working refresh flow.
- Make sure only **one refresh** can run at a time, even across tabs. Some teams also let the server accept a just-rotated refresh token for a few seconds.
- In a test environment, set the access token to **1 minute** and use the app for 10 minutes.
- **Log the reason** for every 401 on the server: expired, invalid, missing.
- Check cookie settings for each environment (`Secure`, `SameSite`, `Domain`), especially when the frontend and API are on different subdomains.
- Show a friendly "Your session expired" message, not a sudden jump to login.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "I'd find the 401 just before the logout in the Network tab and check token expiry. Usually the access token expires and the refresh fails, often because several tabs or requests refresh at the same time. I fix it with one shared refresh promise, queue the other requests, retry them, and sync tabs with BroadcastChannel."

**Full version:**

> "'Random' logouts are rarely random. First I collect the pattern: after a fixed time, after idle, or with many tabs. Then I keep the Network tab running with Preserve log, and find the 401 right before the logout.
>
> The usual cause is token expiry with a broken refresh. A classic case is a race: three requests get 401 together, each starts a refresh, and with rotation the first refresh invalidates the old refresh token, so the other two fail and the user is logged out. Cookie settings are another cause: a Secure cookie on HTTP, or the wrong Domain or SameSite.
>
> The fix is one shared refresh promise in the API layer. The first 401 starts it, the others wait, then all retry once. Tabs stay in sync with a BroadcastChannel. To prevent it, I test with a one-minute token and log 401 reasons on the server."

[FILL IN: if users reported logouts on your project, what the cause was. Only add it if it's true.]

## 🔁 Follow-up questions

### Where should tokens be stored in the browser?

HttpOnly cookies are safer against [XSS](glossary:xss), because JavaScript can't read them. localStorage is easier but readable by any script on the page. With cookies, add CSRF protection, for example with SameSite.

### What is refresh-token rotation, and why use it?

Each refresh gives a **new** refresh token and makes the old one invalid. If someone steals an old token, it stops working quickly. The cost is the multi-tab race shown above.

### How do you handle a refresh when the app uses Axios?

Same idea in a **response interceptor**: on 401, await one shared refresh promise, then retry the original request with `axios(originalConfig)`. Mark the request so it only retries once.

### Can a deploy log everyone out?

Yes. If the JWT secret changes, all old tokens fail verification. Keep secrets the same across deploys, or rotate them gradually.

## ✅ Quick check

### 1. Five requests get 401 at the same time. With the fixed code, how many refresh calls are made?

:::answer
**One.** The first 401 creates `refreshPromise`. The other four call `refreshSession()` and get the same promise back.
:::

### 2. Auth uses a cookie with `Secure`. On a test server using `http://`, users are logged out on every request. Why?

- A) The cookie is too big
- B) Browsers only send `Secure` cookies over HTTPS
- C) JWTs don't work on test servers

:::answer
**B.** A `Secure` cookie is never sent over plain HTTP. Use HTTPS on the test server.
:::
