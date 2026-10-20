---
title: What npm install really does
stack: web-fundamentals
order: 11
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "npm install reads package.json, picks versions that match the ranges (like ^4.4.3), and writes the exact choices into package-lock.json."
  - "It downloads each package as a .tgz file from the npm registry (using a local cache), and unpacks it into node_modules."
  - node_modules is mostly flat (hoisted) so packages can share copies; a package goes in a nested folder only when two versions are needed.
  - "npm ci installs exactly what the lockfile says and deletes node_modules first: use it in CI and production builds."
  - "require/import finds a package by walking up the folders looking in each node_modules, then reading the package's \"exports\" or \"main\" field."
cards:
  - q: What is the difference between package.json and package-lock.json?
    a: package.json lists what you need, with version ranges (like ^4.4.3). package-lock.json records the exact versions and download URLs that were installed, so every install is the same.
  - q: npm install vs npm ci?
    a: npm install may update the lockfile within the allowed ranges. npm ci deletes node_modules and installs exactly what the lockfile says, and fails if the lockfile and package.json don't match. Use npm ci in CI.
  - q: How does require('debug') find the package?
    a: Node looks in ./node_modules/debug, then ../node_modules/debug, up to the root. Then it reads that package's package.json "exports" (or "main") to pick the file.
  - q: Why are install scripts (postinstall) a risk?
    a: They run code from the package on your machine during install. A bad or hacked package could use them to steal secrets, which is why recent npm asks you to approve them.
  - q: What is npx?
    a: It runs a command from a package, from node_modules/.bin if installed, or downloads it temporarily if not, for example npx webpack or npx create-vite.
---

## 💡 What is it?

`npm install` is the command that brings other people's code into your project.

It reads your **`package.json`**, decides exact versions, downloads each **[package](glossary:package)**, and puts them into the **`node_modules`** folder. It also writes **`package-lock.json`**, so the next install gets exactly the same versions.

This topic goes deeper than [npm and package.json](topic:nodejs/npm-and-package-json).

## 🏠 Real-life example

Think of **ordering books for a class from a shop**.

- **`package.json`** = your shopping list: "a maths book, edition 4 or newer, but not edition 5". That's a version range.
- **The npm registry** = the big publisher's warehouse.
- **`package-lock.json`** = the final bill. It shows the exact edition and the warehouse shelf for every book.
- **`node_modules`** = your classroom bookshelf.
- **Hoisting** = if two students need the same book, you keep **one copy** on the shared shelf. You only add a second copy when they need **different editions**.
- **`npm ci`** = a new teacher empties the shelf and orders exactly what's on the old bill. No surprises.

## 🧑‍💻 Code example

Run these commands in an empty folder. You need Node and npm installed.

```bash
npm init -y                      # create a package.json with default values
npm install debug@4              # install the "debug" package, any 4.x version
npm ls --all                     # show the dependency tree, including packages of packages
ls node_modules                  # list what was unpacked into node_modules
node -e "console.log(require.resolve('debug'))"   # ask Node which exact file require('debug') loads
```

**Output** (real run with npm 11 on Node 24; folder paths shortened to `my-app`):

```text
added 2 packages, and audited 3 packages in 586ms
found 0 vulnerabilities

my-app@1.0.0
└─┬ debug@4.4.3
  └── ms@2.1.3

debug  ms

/my-app/node_modules/debug/src/index.js
```

**What to notice:**
- We asked for **one** package, but npm installed **two**. `debug` needs `ms`, so `ms` came too.
- `ms` sits directly in `node_modules`, not inside `debug`. That's **hoisting**.
- `package.json` now says `"debug": "^4.4.3"`, a **range**. The lockfile records the exact `4.4.3` and its download URL.

## 🔍 Deeper version

**1. The steps of `npm install`.**
1. **Read** `package.json` (and `package-lock.json` if it exists).
2. **Resolve** versions. For each range like `^4.4.3`, pick a version from the registry. If a lockfile exists and still matches, keep its versions. See [semver ranges](topic:nodejs/semantic-versioning).
3. **Build the tree.** Work out every package of every package, and where each goes in `node_modules`.
4. **Fetch** each package as a `.tgz` archive from `registry.npmjs.org`, or from the local cache (`~/.npm`). Check its **integrity hash**, so a changed file is caught.
5. **Unpack** into `node_modules`, and link command-line tools into `node_modules/.bin`.
6. **Run install scripts** (like `postinstall`) if allowed.
7. **Write** `package-lock.json`.

Our lockfile has these entries (real output):

```text
node_modules/debug 4.4.3 https://registry.npmjs.org/debug/-/debug-4.4.3.tgz
node_modules/ms 2.1.3 https://registry.npmjs.org/ms/-/ms-2.1.3.tgz
```

**2. The `node_modules` layout.** npm **hoists** packages to the top level when it can, so one copy is shared. If package A needs `lodash@3` and B needs `lodash@4`, one of them gets a **nested** copy at `node_modules/B/node_modules/lodash`. That's why `node_modules` can get big.

**3. How `require`/`import` finds a package.** For `require('debug')`, Node checks these folders in order (real `module.paths` output, shortened):

```text
/my-app/node_modules
/node_modules          (the parent folders, all the way up)
```

When it finds `debug`, it reads that package's `package.json`. The **`"exports"`** field (modern) or **`"main"`** (older) says which file to load. Bundlers like webpack and Vite follow the same idea.

**4. Install scripts.** Some packages run code during install (`preinstall`, `install`, `postinstall`), for example to compile native code. This is a security risk: a hacked package can run anything. Recent npm 11 versions list packages whose scripts aren't approved yet (real output):

```text
1 package has install scripts not yet covered by allowScripts:
  core-js@3.51.0 (postinstall: node -e "try{require('./postinstall')}catch(e){}")
Run `npm install-scripts approve <pkg>` to allow, or `npm install-scripts deny <pkg>` to deny.
```

**5. Commands you should know.**

| Command | What it does |
|---|---|
| `npm install` | Install everything; may update the lockfile within ranges |
| `npm install pkg` / `-D pkg` | Add a dependency / a devDependency (only for development, like webpack or Jest) |
| `npm ci` | Delete `node_modules`, install **exactly** the lockfile; fail if it doesn't match |
| `npm ls` | Show the tree |
| `npm outdated` / `npm update` | See / take newer versions within your ranges |
| `npm audit` | Check for known security problems |
| `npx tool` | Run a package's command, without a global install |

## 🎯 Why do we use it?

- **Reuse.** You don't write a date library or a web framework yourself.
- **Same versions everywhere.** The lockfile means your laptop, your teammate's laptop and the CI server all run the same code.
- **Reproducible builds.** `npm ci` in CI catches "works on my machine" problems early. See [GitHub Actions](topic:devops/github-actions).

## ⚠️ Common mistakes

- **Not committing `package-lock.json`.** Then installs can pick different versions on different machines.
- **Committing `node_modules`.** It's huge and machine-specific. Commit the lockfile instead.
- **Using `npm install` in CI.** Use `npm ci`, so the build fails if the lockfile is out of date.
- **Putting build tools in `dependencies`.** Tools like webpack, Jest and TypeScript belong in `devDependencies`.

## 🗣️ How to answer in an interview

> "npm install reads package.json, resolves each version range to an exact version, and records the result in package-lock.json, including the download URL and an integrity hash. It downloads each package as a tarball from the registry, using a local cache, and unpacks it into node_modules. It hoists packages to the top level so they can be shared, and nests a copy only when two different versions are needed.
>
> When my code calls require or import with a package name, Node walks up the folders looking in each node_modules, then reads that package's exports or main field to find the entry file.
>
> In CI I use npm ci, which deletes node_modules and installs exactly what the lockfile says. I also keep build tools in devDependencies, and I'm careful with packages that run install scripts."

## 🔁 Follow-up questions

### What do `^` and `~` mean in a version range?

`^4.4.3` allows any `4.x.x` from `4.4.3` up (no new major version). `~4.4.3` allows only `4.4.x` patches. See [semantic versioning](topic:nodejs/semantic-versioning).

### What happens if `package.json` and the lockfile disagree?

`npm install` updates the lockfile to match `package.json`. `npm ci` stops with an error. That's what you want in CI, so the mismatch gets fixed on purpose.

### What are peer dependencies?

A package says "I need React, but use the app's copy". For example, a UI library declares `react` as a peer dependency, so the app has only one React.

### Why is `node_modules` so big?

Every package brings its own dependencies, sometimes in several versions. Packages also include extra files, like source maps, types and docs. Only what your code imports ends up in the final bundle.

## ✅ Quick check

### 1. Which command should a CI pipeline use?

- A) `npm install`
- B) `npm ci`
- C) `npm update`

:::answer
**B.** `npm ci` installs exactly what the lockfile says, and fails if it's out of date.
:::

### 2. You install `debug`, and `ms` appears in `node_modules` too. Why?

:::answer
**`debug` depends on `ms`**, so npm installs it as well. It's **hoisted** to the top of `node_modules`.
:::

### 3. Where does Node look first for `require('debug')`?

:::answer
In **`./node_modules/debug`**, next to the current file's folder. Then it tries each parent folder's `node_modules`, up to the root.
:::
