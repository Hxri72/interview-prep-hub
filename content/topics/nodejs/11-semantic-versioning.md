---
title: Semantic versioning (^ and ~)
stack: nodejs
order: 11
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "A version number has three parts: MAJOR.MINOR.PATCH, like 4.18.2."
  - "MAJOR = breaking changes, MINOR = new features that don't break anything, PATCH = bug fixes only."
  - "^ (caret) allows MINOR and PATCH updates: ^4.18.2 means >=4.18.2 and <5.0.0."
  - "~ (tilde) allows only PATCH updates: ~4.18.2 means >=4.18.2 and <4.19.0."
  - "For 0.x versions, ^ is stricter: ^0.3.1 means <0.4.0, because 0.x versions can break anything."
cards:
  - q: What do the three numbers in 4.18.2 mean?
    a: "MAJOR.MINOR.PATCH. 4 = major (breaking changes), 18 = minor (new features, still compatible), 2 = patch (bug fixes)."
  - q: What does ^4.18.2 allow?
    a: "Any version from 4.18.2 up to, but not including, 5.0.0. So minor and patch updates are allowed."
  - q: What does ~4.18.2 allow?
    a: "Any version from 4.18.2 up to, but not including, 4.19.0. So only patch updates."
  - q: What does ^0.3.1 allow?
    a: "Only >=0.3.1 and <0.4.0. Before 1.0.0, a minor change can break things, so ^ only allows patch updates."
  - q: How do you install an exact version with no range?
    a: "npm install express@5.1.0 --save-exact (or -E). package.json then has \"5.1.0\" with no ^ or ~."
---

## 💡 What is it?

**[Semantic versioning](glossary:semver)** (semver) is a rule for writing version numbers. A version has three numbers: **MAJOR.MINOR.PATCH**, like `4.18.2`.

Each number tells you **what kind of change** happened.

In `package.json`, the symbols `^` (caret) and `~` (tilde) say **which newer versions npm is allowed to install**.

## 🏠 Real-life example

Think of a **school textbook** with editions.

- **Edition 4** of the maths book has new chapters in a different order. Your old notes don't match it any more. This is a **MAJOR** change.
- **Edition 4, reprint 18** adds a new practice chapter at the end. Everything you already learned still matches. This is a **MINOR** change.
- **Reprint 18, correction 2** only fixes printing mistakes. This is a **PATCH**.

Now your teacher says:
- "Buy **edition 4**, any reprint or correction is fine." That is `^4.18.2`.
- "Buy **edition 4, reprint 18**, only corrections are fine." That is `~4.18.2`.
- "Buy **exactly** this copy." That is `4.18.2`.

## 🧑‍💻 Code example

npm has a tiny library called `semver` that checks ranges. Run `npm install semver`, save this as `ranges.js`, and run `node ranges.js`.

```js
const semver = require('semver');                         // npm's own tool for checking versions

console.log(semver.satisfies('4.19.0', '^4.18.2'));       // true  → ^ allows a new minor (19)
console.log(semver.satisfies('5.0.0', '^4.18.2'));        // false → ^ never allows a new major (5)
console.log(semver.satisfies('4.18.9', '~4.18.2'));       // true  → ~ allows a new patch (9)
console.log(semver.satisfies('4.19.0', '~4.18.2'));       // false → ~ does not allow a new minor
console.log(semver.satisfies('0.3.5', '^0.3.1'));         // true  → patch update inside 0.3.x
console.log(semver.satisfies('0.4.0', '^0.3.1'));         // false → for 0.x, ^ treats the minor like a major
console.log(semver.maxSatisfying(['4.17.0', '4.21.2', '5.1.0'], '^4.18.2')); // the newest allowed version
```

**Output:**

```text
true
false
true
false
true
false
4.21.2
```

## 🔍 Deeper version

**The rule of each number:**

| Part | Increase it when… | Example |
|---|---|---|
| **MAJOR** | you make a **breaking change** (old code may stop working) | `4.21.2 → 5.0.0` |
| **MINOR** | you add features but stay **backward compatible** | `4.18.2 → 4.19.0` |
| **PATCH** | you only fix bugs, with no new features | `4.18.2 → 4.18.3` |

When MAJOR goes up, MINOR and PATCH reset to 0. When MINOR goes up, PATCH resets to 0.

**Range symbols in `package.json`:**

| You write | Allowed versions | Allows |
|---|---|---|
| `5.1.0` | exactly `5.1.0` | nothing new |
| `~5.1.0` | `>=5.1.0 <5.2.0` | patches |
| `^5.1.0` | `>=5.1.0 <6.0.0` | minors + patches |
| `^0.3.1` | `>=0.3.1 <0.4.0` | patches only (special 0.x rule) |
| `^0.0.3` | `>=0.0.3 <0.0.4` | exactly that patch |
| `*` or `latest` | anything | ⚠️ dangerous |
| `>=4.0.0 <6` | your own range | custom |

**The default.** `npm install express` saves the range with a `^`. Use `npm install express@5.1.0 -E` (or `--save-exact`) to save an exact version with no range.

**Why `0.x` is special.** Before `1.0.0`, a package is seen as "not stable yet". Any minor bump may break things. So `^` becomes careful and only allows patch updates.

**Pre-releases.** Versions like `5.0.0-beta.1` are test versions. Normal ranges skip them unless you ask for them directly.

**Ranges + lock file.** The range in `package.json` says what is *allowed*. `package-lock.json` says what was *actually* installed. With a lock file and `npm ci`, nothing changes until you choose to update. See [npm and package.json](topic:nodejs/npm-and-package-json).

**Semver is a promise, not a guarantee.** Package authors are humans. Sometimes a minor or patch release breaks things by accident. This is one more reason to keep the lock file and to run tests after updating.

## 🎯 Why do we use it?

- **You get safe fixes automatically.** With `^`, you get bug and security fixes without editing `package.json`.
- **You are protected from breaking changes.** `^` never jumps to a new major version, so your app won't suddenly break.
- **The number tells a story.** Seeing `5.0.0` warns you: read the migration guide before you upgrade.
- **Library authors** use it to tell their users how risky an update is.

## ⚠️ Common mistakes

- **Thinking `^` means "latest".** `^4.18.2` will never install `5.x`.
- **Forgetting the 0.x rule.** `^0.3.1` does not allow `0.4.0`.
- **Using `*` or `latest`** in `package.json`. Any install could bring a breaking major version.
- **Upgrading a major version without reading the changelog**, for example Express 4 → 5. Major means "something broke on purpose".

## 🗣️ How to answer in an interview

> "Semantic versioning means a version is MAJOR.MINOR.PATCH. A major bump means breaking changes. A minor bump adds features but stays backward compatible. A patch is only bug fixes.
>
> In package.json, the caret allows minor and patch updates, so ^4.18.2 means anything from 4.18.2 up to, but not including, 5.0.0. The tilde allows only patches, so ~4.18.2 stays below 4.19.0. There's a special rule for 0.x versions: ^0.3.1 only allows 0.3.x, because anything before 1.0 can break.
>
> The ranges say what's allowed. The lock file pins what's actually installed. So I commit the lock file, and I update majors on purpose, after reading the changelog and running the tests."

## 🔁 Follow-up questions

### What is the difference between `^` and `~`?

`^` allows minor and patch updates (it stays on the same major). `~` allows only patch updates (it stays on the same minor). So `^` is a bit more relaxed and `~` is stricter.

### Why does `npm install` add `^` by default?

Because, under semver, minor and patch updates should be safe. With `^` you automatically get bug fixes and security fixes. The lock file still controls exactly what is installed.

### When would you pin an exact version?

When a package has broken things in small updates before. Or for very critical tools, where you want to update only on purpose. Some teams pin everything and use a bot (like Dependabot or Renovate) to open update pull requests.

### How would you upgrade a package to a new major version safely?

Read the changelog or migration guide. Upgrade on a separate branch. Fix the breaking changes. Run all the tests. Then deploy to a test environment first.

## ✅ Quick check

### 1. `package.json` has `"mongoose": "^8.4.0"`. Which can npm install?

- A) `8.9.1`
- B) `9.0.0`
- C) `8.3.0`

:::answer
**A) `8.9.1`.** `^8.4.0` means `>=8.4.0` and `<9.0.0`. `9.0.0` is a new major, and `8.3.0` is too old.
:::

### 2. A library goes from `2.3.4` to `3.0.0`. What does that tell you?

:::answer
It has **breaking changes**. Read the changelog or migration guide before upgrading.
:::

### 3. Does `^0.3.1` allow `0.4.0`?

:::answer
**No.** For versions below `1.0.0`, `^` only allows patch updates: `>=0.3.1 <0.4.0`.
:::
