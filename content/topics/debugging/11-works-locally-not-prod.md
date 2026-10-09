---
title: Works locally, broken in production
template: scenario
stack: debugging
order: 11
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Symptom: everything works on your laptop, but the deployed site shows errors or a blank page."
  - "Detect: open the production site with DevTools — Console for errors, Network for failed calls and their status codes."
  - "Debug: compare environments — env variables, API base URL, build output, file-name case, CORS, HTTPS and cookies."
  - "Fix the real difference, e.g. a missing env variable, a wrong-case import, or a CORS origin that isn't allowed."
  - "Prevent: run the production build locally (npm run build + preview), validate env variables at startup, add error monitoring."
cards:
  - q: What is the first thing you check when it works locally but not in production?
    a: The browser Console and Network tab on the production site. They show the real error and which request failed, with its status code.
  - q: Name five common differences between local and production.
    a: Environment variables, the API base URL, case-sensitive file names on Linux servers, CORS and cookie settings (HTTPS, SameSite, domain), and the minified production build.
  - q: Why can an import work on Mac but fail on the server?
    a: Mac's file system ignores letter case by default, but Linux doesn't. So import './Button' works locally even if the file is button.jsx, but fails on a Linux build server.
  - q: How do you test the production build on your laptop?
    a: Run npm run build, then serve the build folder (npm run preview with Vite). Many production-only bugs appear there.
  - q: Why do Vite env variables need the VITE_ prefix?
    a: Vite only puts variables starting with VITE_ into the browser bundle. Others are left out on purpose, so secrets don't leak to the browser.
---

## 💡 What is it?

The app works perfectly on your laptop. You deploy it. In production, a page is **blank**, a button **does nothing**, or every API call **fails**.

Nothing in the code "changed". What changed is the **environment**: the server, the settings, the build, the network rules. The job is to find **the one difference** that matters.

## 🏠 Real-life example

Think of a **science experiment that worked at home but failed at school**.

At home you used your kitchen gas stove. At school there's only an electric heater, and the tap water is different. Same steps, different results.

- **Home kitchen** = your laptop (dev server).
- **School lab** = the production server.
- **Gas vs electric heater** = different settings, like [environment variables](glossary:environment-variable).
- **Different tap water** = a different OS, Node version or API URL.
- **Writing down everything you used at home and comparing** = comparing the two environments.

## 🔎 Detect

1. Open the **production site** with DevTools open.
2. **Console tab:** look for red errors. Production code is minified, so names look strange. Source maps help if you have them.
3. **Network tab:** find failed calls. Check:
   - the **URL**: is it calling `localhost` by mistake?
   - the [status code](glossary:status-code): 404, 401, 500, or "CORS error"?
   - the **response body**: it often says what went wrong.
4. Check the **server logs** too (for example CloudWatch). The backend error is often clearer.

## 🐞 Debug

Compare the two environments one by one:

| Check | Typical problem |
|---|---|
| **Environment variables** | a variable is missing in production, or misspelled; in Vite it lacks the `VITE_` prefix |
| **API base URL** | the build still points to `http://localhost:4000` |
| **File-name case** | `import Header from './header'` but the file is `Header.jsx`; works on Mac, fails on Linux |
| **CORS** | the server allows `localhost:5173` but not the real domain. See [CORS in Express](topic:express/cors) |
| **HTTPS and cookies** | a `Secure` cookie isn't sent over HTTP; `SameSite` or `Domain` is wrong for the real domain |
| **The build itself** | code that only runs in dev (`import.meta.env.DEV`), or a dependency that only installs locally |
| **Routing** | refreshing `/jobs/12` gives 404, because the server doesn't send `index.html` for SPA routes |
| **Versions** | a different Node version on the server |

The fastest trick: **run the production build on your laptop.** `npm run build` then `npm run preview`. If it breaks there too, the problem is in the build, not the server.

## 🔧 Fix

**Before — the API URL is hard-coded, so production calls localhost:**

```js
// src/api.js
const API_URL = 'http://localhost:4000';                     // ❌ only exists on the developer's laptop
export const getJobs = () => fetch(`${API_URL}/jobs`);       // in production this call always fails
```

**After — read it from an env variable, and fail loudly if it's missing:**

```js
// src/api.js
const API_URL = import.meta.env.VITE_API_URL;                // ✅ set per environment (dev, staging, prod)
if (!API_URL) {                                              // the variable was not set for this build
  throw new Error('VITE_API_URL is missing for this build'); // fail fast with a clear message
}                                                            // end of check
export const getJobs = () =>                                 // a function that loads jobs
  fetch(`${API_URL}/jobs`, { credentials: 'include' });      // call the right server; send cookies too
```

```bash
# .env.production  (used by "npm run build")
VITE_API_URL=https://api.example.com
```

**A case-sensitive import:**

```js
import Header from './components/header';                    // ❌ the file is Header.jsx — fails on Linux
import Header from './components/Header';                    // ✅ matches the real file name exactly
```

**A CORS origin that only allowed localhost (Express backend):**

```js
app.use(cors({                                               // the cors middleware
  origin: ['http://localhost:5173', 'https://app.example.com'], // ✅ add the real production domain
  credentials: true,                                         // allow cookies from these origins
}));                                                         // end of cors settings
```

## 🛡️ Prevent

- **Run the production build locally** before deploying (`npm run build` + `npm run preview`).
- **Validate env variables at startup**, in the frontend and the backend. Fail with a clear message. See [Environment variables](topic:nodejs/environment-variables).
- Keep a **`.env.example`** file listing every variable the app needs.
- Turn on the **case-sensitive file names** check (ESLint `import/no-unresolved`, or TypeScript's `forceConsistentCasingInFileNames`).
- Use a **staging** environment that copies production settings.
- Add **error monitoring** in the browser, so you see production errors before users report them. [FILL IN: which tool you use, if any.]
- Build and test in **CI on Linux**, so case problems show up before deploy.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "I open the production site with DevTools and read the Console and Network tabs to find the real error. Then I compare environments: env variables, the API base URL, case-sensitive file names, CORS and cookie settings. I reproduce it by running the production build locally, fix the difference, and add checks like env validation so it can't happen again."

**Full version:**

> "'Works locally' means the code is fine, but something in the environment is different. So first I look at the evidence on the production site: Console errors and the Network tab. I check which URL failed and its status code. A CORS error, a 404 on a route refresh and a call to localhost all point to different causes.
>
> Then I compare the environments one by one: missing or misspelled env variables, the API base URL, file-name case — because Mac ignores case but Linux doesn't — CORS origins, and cookie settings like Secure and SameSite on HTTPS.
>
> I try to reproduce it locally by running npm run build and preview. Once I find the difference, I fix it, for example by adding the production origin to CORS or setting the missing variable.
>
> To prevent it, I validate env variables at startup, build in CI on Linux, test on staging, and use error monitoring."

[FILL IN: a real "works locally, broken in production" bug you fixed, with the cause. Only add it if it's true.]

## 🔁 Follow-up questions

### Why does refreshing a page give 404 in production but not locally?

The dev server sends `index.html` for every route. A plain static server doesn't. It looks for a real file at `/jobs/12` and finds nothing. Fix: configure a fallback to `index.html`, or use hash-based routing.

### How do you debug minified production code?

Upload **source maps** to your error-monitoring tool (or keep them private on the server). They map the minified code back to your real files and line numbers.

### Where should secrets go — in the frontend env?

No. Anything in the frontend bundle is public. Secrets stay on the server. Frontend env variables are only for public values like the API URL.

### What if it works on staging but not production?

Compare those two: data volume, env variables, third-party keys (test vs live), and traffic. A slow query, for example, may only show up with production data. See [query slow in production](topic:debugging/query-slow-in-prod).

## ✅ Quick check

### 1. An import works on your Mac but the Linux build fails with "Module not found". What is the likely cause?

:::answer
**The letter case of the file name.** Mac's file system ignores case by default; Linux doesn't. Make the import match the real file name exactly.
:::

### 2. In a Vite app, `import.meta.env.API_URL` is `undefined` in production. Why?

- A) Vite doesn't support env variables
- B) Only variables starting with `VITE_` are put into the browser bundle
- C) The variable must be in `package.json`

:::answer
**B.** Rename it to `VITE_API_URL`. Vite hides other variables on purpose, so server secrets don't leak to the browser.
:::

### 3. The Network tab shows a request to `http://localhost:4000/jobs` from the live site. What's wrong?

:::answer
The **API URL is hard-coded** (or a dev env file was used for the build). Read it from a production env variable and rebuild.
:::
