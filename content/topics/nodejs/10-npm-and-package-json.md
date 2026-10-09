---
title: npm, package.json and package-lock.json
stack: nodejs
order: 10
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - npm is Node's package manager. It downloads code other people wrote (packages) into node_modules.
  - package.json is your project's ID card. It lists the name, scripts and the packages you need, with allowed version ranges.
  - package-lock.json records the EXACT version of every package that was installed, so every computer gets the same code.
  - "dependencies = needed to run the app; devDependencies = only needed while building or testing."
  - Use npm install while developing and npm ci in CI/production. Never edit the lock file by hand, and never commit node_modules.
cards:
  - q: What is package.json?
    a: The main settings file of a Node project. It has the name, version, scripts (like npm run dev) and the list of packages the project needs, with version ranges.
  - q: Why do we need package-lock.json?
    a: It saves the exact version of every installed package, including packages of packages. So every developer and the server install exactly the same code.
  - q: dependencies vs devDependencies?
    a: dependencies are needed when the app runs (express, mongoose). devDependencies are only needed for building and testing (jest, eslint, typescript).
  - q: npm install vs npm ci?
    a: "npm install can update the lock file. npm ci deletes node_modules and installs exactly what the lock file says. It is faster and safer for CI."
  - q: What is npx?
    a: A tool that runs a package's command without installing it globally, like npx create-vite or npx jest.
---

## 💡 What is it?

**npm** (Node Package Manager) comes with Node.js. It downloads **[packages](glossary:package)** into your project. A package is ready-made code that someone else wrote, like Express or Mongoose.

**package.json** is your project's main settings file. It lists your project's name, its commands, and the packages it needs.

**package-lock.json** is a record of the **exact** versions that npm installed. It makes sure every computer gets the same code.

## 🏠 Real-life example

Think of **cooking biryani from a recipe card**.

- The **recipe card** = `package.json`. It says "you need rice, chicken, spices". It may say "any good basmati rice".
- The **shopping bill** from your last visit = `package-lock.json`. It says *exactly* which brand and pack you bought: "India Gate basmati, 1 kg".
- The **shop** = the npm registry (the website that stores all packages).
- Your **kitchen shelf** with the actual items = the `node_modules` folder.

If your friend uses only the recipe card, they may buy a different brand, and the taste may change. If they use your shopping bill, they get exactly the same items. That is why we keep the lock file.

## 🧑‍💻 Code example

Run these commands in an empty folder, one by one.

```bash
npm init -y               # create a package.json with default answers
npm install express       # download express and add it to "dependencies"
npm install -D nodemon    # -D = dev only: add nodemon to "devDependencies"
npm run dev               # run the "dev" script from package.json
```

After that, your `package.json` looks like this. JSON files can't have comments, so the explanation is below it.

```json
{
  "name": "my-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^5.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.10"
  }
}
```

**What each part means:**
- `"name"` and `"version"`: your project's name and its own version number.
- `"type": "module"`: use ES Modules (`import`) for `.js` files. See [CommonJS vs ESM](topic:nodejs/commonjs-vs-esm).
- `"scripts"`: short names for commands. `npm run dev` runs `nodemon server.js`. `npm start` and `npm test` work without `run`.
- `"dependencies"`: packages the app needs **to run**. `^5.1.0` means "5.1.0 or any newer 5.x". See [semantic versioning](topic:nodejs/semantic-versioning).
- `"devDependencies"`: packages needed only **while developing**, like nodemon, which restarts the server when you save a file.

## 🔍 Deeper version

**What `npm install` does:**
1. It reads `package.json` and the lock file.
2. It works out a full **dependency tree**. That's your packages, plus the packages *they* need, and so on.
3. It downloads them into `node_modules` and writes the exact versions into `package-lock.json`.

**`package.json` vs `package-lock.json`:**

| | package.json | package-lock.json |
|---|---|---|
| Who writes it | you (and npm commands) | npm only — never edit by hand |
| Versions | **ranges**, like `^5.1.0` | **exact**, like `5.1.0`, for every package in the tree |
| Commit to Git? | ✅ yes | ✅ yes |

**`node_modules`** is never committed to Git. It is huge, and anyone can rebuild it with `npm install`. Add it to `.gitignore`.

**`npm install` vs `npm ci`:**
- `npm install` may update the lock file when ranges allow newer versions.
- `npm ci` ("clean install") deletes `node_modules` and installs **exactly** what the lock file says. If `package.json` and the lock file don't match, it fails. Use it in CI/CD pipelines and Docker builds.

**Other useful commands:**

| Command | What it does |
|---|---|
| `npm outdated` | shows packages that have newer versions |
| `npm update` | updates packages within their allowed ranges |
| `npm audit` | checks your packages for known security problems |
| `npm uninstall express` | removes a package |
| `npx <tool>` | runs a package's command without installing it globally |
| `npm install --omit=dev` | installs only `dependencies` (for production) |

**Other package managers.** **pnpm** and **Yarn** do the same job. pnpm saves disk space by sharing one copy of each package across projects. They use their own lock files (`pnpm-lock.yaml`, `yarn.lock`). Use only one package manager in a project.

**Security.** A package can run scripts when it installs. Bad packages sometimes copy names of popular ones (this is called "typosquatting"). Check the name, the weekly downloads and the maintainer before adding something new. Run `npm audit` regularly.

## 🎯 Why do we use it?

- **Don't rebuild what exists.** Express, Mongoose, JWT and bcrypt are already written and tested. You install them in seconds.
- **One file explains the whole project.** A new developer reads `package.json` and knows the commands and the libraries.
- **Same code everywhere.** The lock file makes your laptop, your teammate's laptop and the server use identical versions. This avoids "it works on my machine" bugs.
- **Scripts give everyone the same commands**, like `npm run dev`, `npm test` and `npm run build`.

## ⚠️ Common mistakes

- **Committing `node_modules`.** It makes the repo huge. Commit `package.json` and the lock file instead.
- **Deleting or ignoring `package-lock.json`.** Then every install can pull slightly different versions, and bugs appear "randomly".
- **Putting build tools in `dependencies`.** Jest, ESLint and TypeScript belong in `devDependencies`, so production installs stay small.
- **Using `npm install` in CI.** Use `npm ci`, so the build uses exactly the locked versions.

## 🗣️ How to answer in an interview

> "npm is Node's package manager. It downloads packages from the npm registry into node_modules. package.json is the project's manifest. It has the name, the scripts and the dependencies with version ranges. I keep runtime packages like express in dependencies, and tools like jest or eslint in devDependencies.
>
> package-lock.json records the exact version of every package in the whole tree. I commit it, so everyone and every server installs the same code. In CI and Docker I use npm ci, which installs exactly from the lock file and fails if it doesn't match package.json.
>
> I never commit node_modules, and I run npm audit to catch known security issues."

[FILL IN: anything specific about how dependencies are managed in your SkillKeepr projects (e.g. npm vs pnpm, npm ci in GitHub Actions). Only add it if it's true.]

## 🔁 Follow-up questions

### Should you commit `package-lock.json`?

Yes, for applications. It guarantees everyone gets the same versions. Without it, a teammate could install a newer version of some package and get different behaviour.

### What is the difference between a local and a global install?

A local install (`npm install x`) puts the package in this project's `node_modules`. A global install (`npm install -g x`) puts it on your whole computer, for command-line tools. Today, most people prefer local installs plus `npx`, so each project controls its own versions.

### What are peerDependencies?

Packages that a library needs, but expects **you** to install. For example, a React component library lists `react` as a peer dependency. That way your app has only one copy of React.

### How do you find and fix security problems in packages?

Run `npm audit` to list known issues. Then run `npm audit fix`, or update the package by hand. Check the changelog first if the fix is a major version.

## ✅ Quick check

### 1. Where should `jest` go?

- A) dependencies
- B) devDependencies
- C) It doesn't matter

:::answer
**B) devDependencies.** Jest is only used for testing. The running app never needs it.
:::

### 2. Your CI pipeline should install packages with…

:::answer
**`npm ci`.** It installs exactly what `package-lock.json` says, and it fails if the lock file and `package.json` don't match.
:::

### 3. True or false: you should commit `node_modules` so the server doesn't need to download packages.

:::answer
**False.** `node_modules` is huge and can be rebuilt any time from `package.json` and the lock file. Add it to `.gitignore`.
:::
