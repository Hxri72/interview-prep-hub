---
title: Environment variables at build time vs run time
stack: web-fundamentals
order: 19
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "Backend (Node): environment variables are read at RUN time from process.env. Change the value, restart, and the same code uses the new value."
  - "Frontend (React/Vite/webpack): variables are copied into the JavaScript file at BUILD time. To change them you must rebuild."
  - "Anything baked into frontend files is PUBLIC. Anyone can open DevTools and read it. Never put secrets (API keys, DB passwords) there."
  - "Frontend tools only expose variables with a prefix: VITE_ (Vite), NEXT_PUBLIC_ (Next.js), or ones you whitelist in webpack."
  - "Secrets stay on the server: .env locally, and a secrets store (like AWS Secrets Manager) or Lambda environment settings in production."
cards:
  - q: When does a Node backend read process.env.DB_URL?
    a: At run time, when the code runs. Restart with a new value and the same code uses it — no rebuild needed.
  - q: When does Vite put VITE_API_URL into your frontend code?
    a: At build time. The value is copied into the built JavaScript file as plain text, so changing it needs a new build.
  - q: Is it safe to put an API secret in a VITE_ or NEXT_PUBLIC_ variable?
    a: No. Those values end up in public JavaScript files that anyone can read. Keep secrets on the backend.
  - q: How do you use different API URLs for staging and production in a frontend?
    a: Either build once per environment with different env files (vite build --mode staging), or load a small runtime config file (like /config.json) when the app starts.
  - q: Where do production secrets live for a backend?
    a: Not in Git. In the platform's secret settings, a secrets manager (AWS Secrets Manager / SSM), or the function's environment variables, injected at deploy or start time.
---

## 💡 What is it?

An **[environment variable](glossary:environment-variable)** is a setting given to your app from outside the code, like `PORT=3000` or `DB_URL=…`.

The big difference is **when** the app reads it. A **Node backend** reads it **every time it runs**. A **frontend build** copies it **into the files once**, at build time.

That one difference decides what is safe to put where.

## 🏠 Real-life example

Think of a **school notice board** versus a **printed report card**.

- **Backend = notice board.** The principal can change the exam date on the board any morning. Everyone reads the latest notice. That's `process.env`, read at run time.
- **Frontend build = printed report card.** Your marks are **printed** on paper. To change a mark, the school must **print a new card**. That's a value baked in at build time.
- **The report card goes home with you.** Anyone at home can read it. So the school never prints the staff-room locker code on it. That's why frontend values are public.
- **The locker code (secret)** stays in the staff room — the server.

## 🧑‍💻 Code example

**Part 1 — backend reads at run time.** Save as `server-config.mjs`:

```js
const dbUrl = process.env.DB_URL; // read at RUN time, each time the server starts
const port = process.env.PORT ?? '3000'; // use PORT if set, otherwise '3000'
console.log(`backend: port=${port} db=${dbUrl ?? 'not set'}`); // show what this run will use
```

Run it twice with different values:

```bash
DB_URL=mongodb://localhost/dev node server-config.mjs                 # run 1: dev values
PORT=8080 DB_URL=mongodb://prod-db/app node server-config.mjs         # run 2: same code, new values
```

Real output:

```text
backend: port=3000 db=mongodb://localhost/dev
backend: port=8080 db=mongodb://prod-db/app
```

Same file, no rebuild, different values.

**Part 2 — frontend gets them at build time.** In a Vite React app (see [Vite](topic:web-fundamentals/vite)), `.env` contains:

```text
VITE_APP_TITLE=Mini Job Board
SECRET_KEY=abc123
```

`src/App.jsx`:

```jsx
export default function App() { // the main component
  return <h1>{import.meta.env.VITE_APP_TITLE} — {import.meta.env.MODE}</h1>; // read a VITE_ variable and the mode
} // end of App
```

Build and search inside the finished JavaScript file:

```bash
npx vite build && grep -o "Mini Job Board" dist/assets/*.js        # is the title inside the built file?
grep -c abc123 dist/assets/*.js                                    # is the secret inside? (count of matches)
npx vite build --mode staging && grep -o "Staging Board" dist/assets/*.js # build again with .env.staging
```

(`.env.staging` contains `VITE_APP_TITLE=Staging Board`.)

Real output:

```text
Mini Job Board
0
Staging Board
```

In the built file, the line looks like ``h1`,{children:[`Mini Job Board`,` — `` — the value is just **plain text** inside the code. `import.meta.env.MODE` also became the fixed text `` `production` ``. The secret is **not** there (0 matches), because it has no `VITE_` prefix.

## 🔍 Deeper version

**Run time vs build time.**

| | Backend (Node, Express, Lambda) | Frontend (React with Vite/webpack/Next.js client code) |
|---|---|---|
| Read when | every time the process starts / code runs | once, when you run the build |
| How | `process.env.NAME` | the bundler **replaces** `import.meta.env.VITE_X` with text |
| Change a value | update the setting, restart | rebuild and redeploy |
| Who can see it | only the server | **everyone** with a browser |
| Secrets OK? | yes | **never** |

**Why the frontend can't read env at run time.** The browser has **no `process.env`** — there's no server environment in a user's browser. Your JS is just static files on a CDN. So the bundler swaps the variable for its value while building.

**How each tool exposes variables.**

| Tool | Prefix / method | Example |
|---|---|---|
| Vite | `VITE_` + `import.meta.env` | `import.meta.env.VITE_API_URL` |
| Next.js | `NEXT_PUBLIC_` (client code) | `process.env.NEXT_PUBLIC_API_URL` — see [Next.js env](topic:nextjs/env-variables) |
| webpack | `DefinePlugin` / `EnvironmentPlugin` with a list of allowed names | `process.env.API_URL` replaced at build |
| Create React App (old) | `REACT_APP_` | `process.env.REACT_APP_API_URL` |

The prefix or allow-list is a **safety net**. It stops you from leaking every server variable by mistake.

**One build per environment, or runtime config?**

| Approach | How | Good | Bad |
|---|---|---|---|
| Build per environment | `vite build --mode staging`, separate `.env.staging` | simple | a different build for dev, staging and prod |
| Runtime config file | app fetches `/config.json` at start; each environment hosts its own | one build everywhere | an extra request; needs care before first render |
| Derive from the URL | read `window.location.hostname` | no config | only works for simple cases |

The "derive from the URL" idea is used for **multi-tenant** apps. The tenant name comes from the subdomain. At SkillKeepr (public-safe), the frontend works out the tenant from the hostname, and frontend env values are whitelisted into the bundle at build time. Backend settings come from a secrets store at deploy time.

**Backend secrets in production.**
- **Locally:** a `.env` file (in `.gitignore`), loaded with `node --env-file=.env` or `dotenv`. See [Node env variables](topic:nodejs/environment-variables).
- **AWS Lambda:** environment variables set on the function, or values fetched from **Secrets Manager / SSM Parameter Store**.
- **Containers / servers:** the platform's secret settings (Railway, ECS task definitions), injected when the process starts.
- **Never** commit secrets to Git, and never print them in logs. See [environments](topic:devops/environments).

:::warning[Build-time values in the backend too]
Some backend bundles also inline `.env` at build time (for example with `dotenv-webpack`). Then the values are baked into the deployed file, and changing them needs a redeploy. Know which style your project uses.
:::

## 🎯 Why do we use it?

- **One codebase, many environments.** The same code runs locally, on staging and in production with different settings.
- **Secrets stay out of code and Git.** Keys live in the environment, not in files anyone can read.
- **Understanding build time protects you.** You'll never put an API key in frontend code thinking it's "hidden in .env".

## ⚠️ Common mistakes

- **Putting a secret in `VITE_…` or `NEXT_PUBLIC_…`.** It becomes public text in your JS file. Call a backend endpoint instead, and keep the key there.
- **Changing a frontend env value and only restarting.** Nothing changes. You must rebuild (and redeploy).
- **Expecting `process.env` to work in browser code with Vite.** Use `import.meta.env`.
- **Committing `.env` to Git.** Add it to `.gitignore`, and commit a `.env.example` with fake values instead.

## 🗣️ How to answer in an interview

> "The key difference is when the value is read. A Node backend reads `process.env` at run time, so I can change a setting and restart without rebuilding. A frontend doesn't have a real environment in the browser. So the bundler replaces variables like `import.meta.env.VITE_API_URL` with their actual values at build time, and they're baked into the JavaScript files.
>
> That means anything in the frontend is public, so I never put secrets there. Only prefixed variables are exposed — `VITE_` in Vite, `NEXT_PUBLIC_` in Next.js, or an allow-list in webpack. For different environments I either build once per environment with different env files, or load a small runtime config file at start-up. Secrets stay on the backend: `.env` locally and out of Git, and in production something like AWS Secrets Manager or the Lambda's environment settings."

[FILL IN: how environment config worked in your SkillKeepr services — keep it high level, no real names or values.]

## 🔁 Follow-up questions

### The frontend needs to call a paid API that requires a key. What do you do?

Don't call it from the browser with the key. Create a small backend endpoint that holds the key and calls the API. The frontend calls your endpoint. Add auth and rate limits so it can't be abused.

### What's the difference between `.env`, `.env.local` and `.env.production` in Vite?

Vite loads several files by mode. `.env` is always loaded. `.env.[mode]` (like `.env.production`) is loaded for that mode. `.local` versions are for your machine only and should be git-ignored. Later files override earlier ones.

### Is a Firebase or Google Maps key in frontend code a problem?

Those keys are **designed** to be public. They're protected by domain restrictions and security rules on the provider's side, not by secrecy. A database password or a payment secret key is different — never in the frontend.

### How do you check a built app for leaked secrets?

Search the `dist/` files for known key patterns (`grep`), and use secret scanners in CI (like GitHub secret scanning or gitleaks).

## ✅ Quick check

### 1. You change `VITE_API_URL` in `.env` and restart `vite preview` (which serves the old `dist/`). What URL does the app use?

:::answer
**The old one.** `vite preview` serves files that were already built. The value was baked in at build time, so you need `vite build` again.
:::

### 2. Which of these is safe in a frontend env variable?

- A) `VITE_STRIPE_SECRET_KEY=sk_live_…`
- B) `VITE_API_URL=https://api.example.com`
- C) `VITE_DB_PASSWORD=…`

:::answer
**B.** A public API address is fine. Secret keys and passwords must stay on the server.
:::

### 3. True or false: a Node backend must be rebuilt to pick up a new `process.env.PORT`.

:::answer
**False** (for normal Node code). It reads `process.env` at run time, so a restart is enough. Only setups that inline `.env` into a bundle at build time need a rebuild.
:::
