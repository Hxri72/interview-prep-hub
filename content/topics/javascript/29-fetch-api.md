---
title: The fetch API and handling HTTP errors
stack: javascript
order: 29
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - fetch(url) sends an HTTP request and returns a promise of a Response.
  - fetch only rejects on network failure. A 404 or 500 still resolves — you must check res.ok yourself.
  - Read the body once with res.json() or res.text(). Both return promises.
  - Cancel a request with an AbortController, or set a time limit with AbortSignal.timeout(ms).
  - fetch is built into browsers and into Node.js (since Node 18).
cards:
  - q: Does fetch reject when the server returns 404 or 500?
    a: No. It only rejects on network errors (or when aborted). For 404/500 the promise resolves, and res.ok is false. You must check it.
  - q: What does res.ok mean?
    a: It is true when the status code is 200–299, and false otherwise.
  - q: How do you add a timeout to fetch?
    a: "Pass signal: AbortSignal.timeout(5000). If there's no reply in 5 seconds, fetch rejects with a TimeoutError."
  - q: How do you send JSON with fetch?
    a: "Use method POST, the header Content-Type: application/json, and body: JSON.stringify(data)."
  - q: Why can you only call res.json() once?
    a: The body is a stream. Reading it uses it up. Call res.clone() first if you must read it twice.
---

## 💡 What is it?

`fetch` is a built-in function for talking to a server. It sends an HTTP **request** and gets back a **response**.

It returns a [promise](glossary:promise). So you use it with `await` or `.then`.

There's one big surprise: `fetch` does **not** treat a 404 or 500 as an error. You have to check the [status code](glossary:status-code) yourself.

## 🏠 Real-life example

Think of **ordering food by phone** from a restaurant.

- **Calling the restaurant** = `fetch(url)`.
- **The phone line is dead** = a network error. Only this makes `fetch` fail (reject).
- **Someone answers and says "Sorry, we're closed"** = a 404 or 500 response. The call *worked*. But you didn't get food. You must listen and check.
- **Checking if they said "Yes, order confirmed"** = checking `res.ok`.
- **Hanging up because they kept you waiting too long** = a timeout with `AbortSignal.timeout`.

Many people think "the call connected, so I got my food". That's the most common `fetch` mistake.

## 🧑‍💻 Code example

Save this as `fetch.mjs`. Run it with `node fetch.mjs`. (The `.mjs` ending lets you use `await` at the top level.)

```js
async function getUser(id) {                                          // a function that loads one user by id
  try {                                                               // start a block that can catch errors
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`, { // send a GET request to a free test API
      signal: AbortSignal.timeout(5000),                              // give up if no reply in 5000 ms (5 seconds)
    });                                                               // end of the fetch options
    if (!res.ok) {                                                    // res.ok is false for status 400–599
      throw new Error(`HTTP ${res.status}`);                          // turn a bad status into a real error
    }                                                                 // end of the status check
    const user = await res.json();                                    // read the body and turn the JSON text into an object
    console.log('Found:', user.name);                                 // show the user's name
  } catch (err) {                                                     // runs for network errors, timeouts and our thrown error
    if (err.name === 'TimeoutError') console.log('Too slow, gave up'); // AbortSignal.timeout gives a TimeoutError
    else console.log('Failed:', err.message);                         // any other problem
  }                                                                   // end of try/catch
}                                                                     // end of getUser

await getUser(1);                                                     // a user that exists → 200 OK
await getUser(9999);                                                  // a user that doesn't exist → 404
```

**Output:**

```text
Found: Leanne Graham
Failed: HTTP 404
```

Without the `if (!res.ok)` check, the second call would not fail. It would try to read the 404 page as a user.

## 🔍 Deeper version

**When does fetch reject?** Only when the request couldn't complete:
- no internet, DNS failure, or the server refused the connection
- a CORS block in the browser (see [CORS in Express](topic:express/cors))
- the request was aborted or timed out

A **404, 401 or 500 is still a successful fetch**. The promise resolves with a `Response`. So always check `res.ok` (true for 200–299) or `res.status`.

**Reading the body.** The body is a [stream](glossary:stream), so you can read it only once:
- `await res.json()` turns JSON text into an object.
- `await res.text()` gives plain text.
- `await res.blob()` gives binary data, like an image.

If the server sends invalid JSON, `res.json()` throws a `SyntaxError`.

**Sending data:**

```js
const res = await fetch('/api/candidates', {          // the URL to send to
  method: 'POST',                                      // POST = create something new
  headers: { 'Content-Type': 'application/json' },    // tell the server the body is JSON
  body: JSON.stringify({ name: 'Asha' }),              // turn the object into JSON text
});                                                    // end of options
```

**Cancelling.** An `AbortController` gives you a cancel button:

```js
const controller = new AbortController();              // make a cancel button
fetch(url, { signal: controller.signal });             // connect the request to it
controller.abort();                                    // press it → fetch rejects with an AbortError
```

This is very useful in React. You cancel the old request in a `useEffect` cleanup when the user types again (see [useEffect](topic:react/use-effect)).

:::version[Version note]
`AbortSignal.timeout(ms)` is supported in all modern browsers and in Node.js. `AbortSignal.any([a, b])` combines a timeout and a manual cancel into one signal. `fetch` has been built into Node.js since **Node 18** and stable since **Node 21**, so you no longer need `node-fetch`.
:::

**Cookies.** In the browser, `fetch` sends cookies only to the same site by default. To send cookies to a different domain (like your API on another subdomain), use `credentials: 'include'`. The server must also allow it with CORS.

**fetch vs axios.** Axios is a popular library. It throws on 4xx/5xx automatically, parses JSON for you, and has "interceptors" (code that runs on every request, like adding a token). `fetch` is built in and needs no install. Many teams wrap `fetch` in a small helper that does the `res.ok` check in one place.

## 🎯 Why do we use it?

- **To talk to APIs** from the browser or from Node, with no extra library.
- **It's promise-based**, so it works well with `async`/`await`.
- **It supports cancelling and timeouts**, which keeps apps fast and avoids old data showing up.

## ⚠️ Common mistakes

- **Not checking `res.ok`.** Then a 404 or 500 looks like success.
- **Forgetting `await` on `res.json()`.** You get a promise instead of your data.
- **Forgetting `JSON.stringify` and the `Content-Type` header** when sending JSON. The server sees an empty or wrong body.
- **No timeout.** A slow server can make your app hang for a long time. Add `AbortSignal.timeout`.

## 🗣️ How to answer in an interview

> "fetch sends an HTTP request and returns a promise that resolves to a Response. The key detail is that it only rejects on network failures or when the request is aborted. A 404 or 500 still resolves, so I always check res.ok or res.status and throw my own error.
>
> I read the body once with res.json(), and I send JSON with the method, a Content-Type header and JSON.stringify. For cancelling I use an AbortController, for example in a useEffect cleanup to avoid race conditions, and AbortSignal.timeout to stop requests that hang.
>
> In bigger apps I usually wrap fetch in one helper, or use axios, so the error checks, base URL and auth token live in one place."

[FILL IN: whether the SkillKeepr frontend uses axios or fetch, and how the API helper is set up. Only add it if it's true.]

## 🔁 Follow-up questions

### fetch vs axios — which would you choose?

`fetch` is built in and needs nothing installed. Axios throws on bad status codes, parses JSON automatically and has interceptors for adding tokens or handling 401s. For small apps, a thin `fetch` wrapper is enough. For bigger apps, axios saves code.

### How do you retry a failed request?

Wrap the call in a loop. Retry only on network errors or 5xx, not on 4xx (those won't fix themselves). Wait longer each time (exponential backoff), and stop after a few tries.

### How do you run several requests at the same time?

Start them all, then wait with `Promise.all([...])`. Use `Promise.allSettled` if some may fail and you still want the others. See [Promise.all, allSettled, race and any](topic:javascript/promise-combinators).

### What is a CORS error, and can fetch fix it?

The browser blocks a response when the server doesn't allow your site's origin. You can't fix it in `fetch`. The **server** must send the right CORS headers.

## ✅ Quick check

### 1. The server returns status 500. What happens?

```js
const res = await fetch('/api/report');   // the server answers with 500
console.log(res.ok);                       // ?
```

:::answer
**It prints `false`.** fetch does not reject on 500. The promise resolves, and `res.ok` is `false`.
:::

### 2. Which line correctly sends JSON?

- A) `fetch(url, { method: 'POST', body: { name: 'Asha' } })`
- B) `fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Asha' }) })`

:::answer
**B.** The body must be a string, so use `JSON.stringify`. The header tells the server it's JSON.
:::

### 3. What error name do you get when `AbortSignal.timeout(3000)` runs out?

:::answer
**`TimeoutError`.** A manual `controller.abort()` gives `AbortError` instead.
:::
