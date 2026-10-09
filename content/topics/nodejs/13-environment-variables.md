---
title: Environment variables and dotenv
stack: nodejs
order: 13
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Environment variables are settings that live outside your code, like PORT, DATABASE_URL and JWT_SECRET. Node reads them with process.env.
  - The same code can then run on your laptop, in testing and in production — only the settings change.
  - "Locally, keep them in a .env file. Load it with Node's built-in --env-file=.env (or process.loadEnvFile()), or with the dotenv package."
  - Never commit .env to Git. Commit a .env.example with the names but no real values. In production, set them in the hosting platform's settings.
  - Values are always strings. Convert numbers and booleans, and check that required values exist when the app starts.
cards:
  - q: What is an environment variable?
    a: A setting given to the program from outside the code, by the operating system or hosting platform. In Node you read it with process.env.NAME.
  - q: How do you load a .env file in modern Node without any package?
    a: "Start the app with node --env-file=.env app.js, or call process.loadEnvFile() at the top. The dotenv package does the same job in older setups."
  - q: Why should .env never be committed to Git?
    a: It holds secrets like database passwords and API keys. Anyone with access to the repo — or a public leak — would get them. Commit a .env.example instead.
  - q: What type is process.env.PORT?
    a: "Always a string (or undefined). Convert it: Number(process.env.PORT ?? 3000)."
  - q: How are secrets stored in production?
    a: In the hosting platform's environment settings or a secret manager (like AWS Secrets Manager, GCP Secret Manager, Railway variables or GitHub Actions secrets) — not in files in the repo.
---

## 💡 What is it?

An **[environment variable](glossary:environment-variable)** is a setting that lives **outside your code**. Examples: the port number, the database address, or a secret key.

In Node.js, you read them with **`process.env`**. For example, `process.env.PORT`.

On your laptop, you usually keep them in a file called **`.env`**. Node can load that file itself (`--env-file`). Older projects use a small package called **dotenv**.

## 🏠 Real-life example

Think of a **TV remote and the TV**.

The TV (your code) is the same in every house. But each family sets its own volume, language and channel list. They don't open the TV and change its wires. They just change the **settings**.

- The **TV** = your code. The same everywhere.
- The **settings menu** = environment variables.
- **Your house vs your friend's house** = your laptop vs the production server.
- The **parental-control PIN** = a secret, like `JWT_SECRET`. You never write it on the TV for everyone to see.
- The **settings card** stuck on your fridge = the `.env` file. It's only in *your* house.

## 🧑‍💻 Code example

Make a file called `.env` with these two lines:

```bash
# the port number the server will use
PORT=4000
# a simple text setting
GREETING=Hello Hari
```

(Lines starting with `#` are comments. Put them on their own line, not after a value.)

Then save this as `config.js` and run `node --env-file=.env config.js`.

```js
const port = Number(process.env.PORT ?? 3000);         // read PORT; env values are text, so turn it into a number; default 3000
const greeting = process.env.GREETING ?? 'Hello';      // read GREETING; use 'Hello' if it is missing
const secret = process.env.JWT_SECRET;                 // a value we did NOT put in .env → undefined

console.log(`${greeting}! Port is ${port}`);           // prints the two settings
console.log('Type of port:', typeof port);             // 'number' → because we converted it
console.log('Secret set?', secret !== undefined);      // false → JWT_SECRET is not set

if (!secret) {                                         // check required settings when the app starts
  console.warn('JWT_SECRET is missing!');              // in a real app you would stop here with an error
}                                                      // end of the check
```

**Output:**

```text
Hello Hari! Port is 4000
Type of port: number
Secret set? false
JWT_SECRET is missing!
```

## 🔍 Deeper version

**Three ways to load a `.env` file:**

| Way | Code | Notes |
|---|---|---|
| Node flag | `node --env-file=.env app.js` | built in, no package needed |
| Node function | `process.loadEnvFile()` at the top | built in; loads `./.env` by default |
| dotenv package | `import 'dotenv/config';` | works in every Node version; very common in older code |

:::version[Version note]
`--env-file` was added in **Node 20.6**. `process.loadEnvFile()` came in **Node 20.12 / 21.7**. `--env-file-if-exists` (no error if the file is missing) came in **Node 22.9**. In Node 24, you don't need dotenv for simple projects.
:::

**Real environment wins.** If a variable is already set in the real environment (for example on the server), the `.env` file does **not** replace it. This is true for `--env-file` and for dotenv by default. So the production settings are always safe.

**Validate at startup ("fail fast").** If `DATABASE_URL` is missing, it's better to crash with a clear message when the app starts than to fail on the first request. Many teams check the values with a schema library like Zod:

```js
import { z } from 'zod';                                     // a library that checks data shapes
const Env = z.object({                                       // describe the settings we expect
  PORT: z.coerce.number().default(3000),                     // turn text into a number; default 3000
  DATABASE_URL: z.string().url(),                            // must be a valid URL
  JWT_SECRET: z.string().min(32),                            // must be at least 32 characters long
});                                                          // end of the description
export const env = Env.parse(process.env);                   // check now; throws a clear error if anything is wrong
```

The rest of the app imports `env` and never touches `process.env` directly. Now the values have the right types too.

**Files and Git:**

| File | Commit? | Contains |
|---|---|---|
| `.env` | ❌ never (add to `.gitignore`) | real values and secrets |
| `.env.example` | ✅ yes | the **names**, with empty or fake values |

**In production**, set the variables in the hosting platform: Railway, AWS, GCP, Vercel or GitHub Actions secrets. Big teams use a **secret manager**, like AWS Secrets Manager or GCP Secret Manager. It stores secrets safely, controls who can read them, and logs every access.

**Frontend warning.** In React (Vite) or Next.js, some env variables are put **into the browser code**. In Vite, that's variables starting with `VITE_`. In Next.js, it's `NEXT_PUBLIC_`. Anyone can read those. Never put secrets there.

## 🎯 Why do we use it?

- **One code, many places.** The same app runs on your laptop, in testing and in production. Only the settings change.
- **Secrets stay out of the code.** Passwords and API keys are not in Git, so a leaked repo doesn't leak them.
- **Easy changes.** You can change a setting and restart, with no code change and no new deploy.
- **It's the standard.** Docker, CI/CD tools and every cloud platform pass settings this way. (This is one rule of the "12-factor app" guidelines.)

## ⚠️ Common mistakes

- **Committing `.env`** or pasting secrets into the code. Once a secret is in Git history, treat it as leaked: change it.
- **Forgetting values are strings.** `process.env.PORT + 1` gives `'40001'`, not `4001`. And `'false'` is truthy.
- **Loading dotenv too late.** If you import your database file before loading `.env`, the database code sees `undefined`. Load env values first, or use `--env-file`.
- **Putting secrets in frontend env variables** (`VITE_…`, `NEXT_PUBLIC_…`). They end up in the browser for anyone to see.

## 🗣️ How to answer in an interview

> "Environment variables are configuration that lives outside the code, like the port, the database URL or the JWT secret. In Node I read them from process.env. That way the same build runs locally, in staging and in production, and only the settings change.
>
> Locally I keep them in a .env file, which is in .gitignore. I commit a .env.example with just the names. In modern Node I can load it with the --env-file flag. Older projects use the dotenv package. In production, the values are set in the platform, like GitHub Actions secrets or the cloud provider's secret manager.
>
> Two things I'm careful about. Every value is a string, so I convert numbers and booleans. And I validate the required variables at startup, so the app fails fast with a clear error instead of breaking later."

[FILL IN: where secrets live for your SkillKeepr services — e.g. Railway variables, GitHub Actions secrets, AWS or GCP — if you know. Only add it if it's true.]

## 🔁 Follow-up questions

### What happens if the same variable is in `.env` and also set on the server?

The real environment wins. Both `--env-file` and dotenv (by default) don't overwrite a variable that already exists. So production values can't be replaced by a stray `.env` file.

### How do you share secrets with a new teammate?

Not in Git, chat or email. Use a password manager or the team's secret manager. They copy `.env.example` to `.env` and fill in the values.

### A secret was pushed to GitHub by mistake. What do you do?

Treat it as leaked. **Rotate** it first (make a new key and disable the old one). Then remove it from the code. Removing the file is not enough, because it stays in Git history. Then check logs for misuse.

### How do you handle different settings for dev, test and production?

Use different values for the same names. Use `.env` locally and `.env.test` for tests (for example `node --env-file=.env.test`). Real production values live in the platform. The code reads the same `process.env` names everywhere.

## ✅ Quick check

### 1. `.env` has `PORT=4000`. What does `process.env.PORT + 1` give?

:::answer
**`'40001'`** (a string). Env values are always strings, so `+` joins text. Use `Number(process.env.PORT) + 1` to get `4001`.
:::

### 2. Which file should be committed to Git?

- A) `.env`
- B) `.env.example`
- C) Both

:::answer
**B) `.env.example`.** It shows which variables are needed, without real values. `.env` holds secrets and must stay out of Git.
:::

### 3. What does `node --env-file=.env app.js` do?

:::answer
It loads the variables from `.env` into `process.env` before `app.js` runs. It's built into Node (20.6+), so you don't need the dotenv package.
:::
