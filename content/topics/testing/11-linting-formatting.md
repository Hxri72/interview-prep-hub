---
title: Linting and formatting (ESLint, Prettier)
stack: testing
order: 11
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - A linter (ESLint) finds likely bugs and bad patterns, like unused variables or == instead of ===.
  - A formatter (Prettier) only fixes how code looks — spaces, quotes, semicolons, line breaks.
  - "ESLint uses a \"flat config\" file, eslint.config.js, which is an array of config objects."
  - Run them automatically with husky + lint-staged before each commit, and again in CI.
  - Let Prettier own formatting and ESLint own code quality, so the two never fight.
cards:
  - q: What is the difference between a linter and a formatter?
    a: A linter finds possible bugs and bad patterns (unused variables, ==). A formatter only changes how code looks (spaces, quotes, line breaks).
  - q: What is ESLint's flat config?
    a: "The config file eslint.config.js, which exports an array of config objects. It replaced the old .eslintrc files and is the only format from ESLint 9 on."
  - q: How do you stop ESLint and Prettier from fighting?
    a: Let Prettier handle all formatting, and turn off ESLint's style rules with eslint-config-prettier.
  - q: What do husky and lint-staged do?
    a: Husky runs a script on a Git hook, like pre-commit. lint-staged runs the linter and formatter only on the files you are committing.
  - q: Why run linting in CI too, if it runs before commit?
    a: Git hooks can be skipped with --no-verify. CI is the final safety net for every pull request.
---

## 💡 What is it?

A **linter** reads your code and warns you about **likely bugs** and bad habits. The most common one for JavaScript is **ESLint**.

A **formatter** only fixes **how the code looks**: spaces, quotes, semicolons and line breaks. The most common one is **Prettier**.

Both run automatically, so the team doesn't argue about style in code reviews.

## 🏠 Real-life example

Think of handing in an **essay at school**.

- **The spell-and-grammar checker** = ESLint. It says, "This sentence has no verb", or "You used this word but it means nothing here". These are real mistakes.
- **The page layout tool** = Prettier. It fixes margins, font size and spacing. It doesn't change what you wrote.
- **The school rule "check before you submit"** = husky running both before every commit.
- **The teacher checking again at the desk** = CI checking every pull request.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install --save-dev eslint @eslint/js globals prettier`. Create the two files below. Run `npx eslint app.js`, then `npx prettier --check app.js`.

```js
// eslint.config.js
const js = require('@eslint/js');                 // ESLint's own recommended rules
const globals = require('globals');               // lists of known globals, like `process` in Node

module.exports = [                                // flat config = an array of config objects
  js.configs.recommended,                         // turn on the recommended rules
  {                                               // our own settings block
    files: ['**/*.js'],                           // apply this block to every .js file
    languageOptions: {                            // how to read the code
      ecmaVersion: 'latest',                      // understand the newest JavaScript syntax
      sourceType: 'commonjs',                     // files use require / module.exports
      globals: globals.node,                      // `process`, `__dirname` etc. are allowed
    },                                            // end of languageOptions
    rules: {                                      // extra rules for this project
      'no-unused-vars': 'error',                  // a variable you never use = error
      eqeqeq: 'error',                            // must use === instead of ==
    },                                            // end of rules
  },                                              // end of our block
];                                                // end of the config array
```

```js
// app.js — messy on purpose
const unused = 42; // a variable nobody uses (ESLint will complain)
function isAdmin(user) { // returns true if the user is an admin
  if (user.role == 'admin') { // == instead of === (ESLint will complain)
        return true // badly indented, no semicolon (Prettier will fix)
  } // end of if
  return false // not an admin
} // end of isAdmin
console.log(isAdmin({role:'admin'})); // no spaces inside { } (Prettier will fix)
```

**Output (real run):**

```text
$ npx eslint app.js
  1:7   error  'unused' is assigned a value but never used  no-unused-vars
  3:17  error  Expected '===' and instead saw '=='          eqeqeq
✖ 2 problems (2 errors, 0 warnings)

$ npx prettier --check app.js
[warn] app.js
[warn] Code style issues found in the above file. Run Prettier with --write to fix.
```

After `npx prettier --write app.js`, the indentation, semicolons, quotes (`"admin"`) and spaces (`{ role: "admin" }`) are fixed. But the `==` and the unused variable are **still there**. Prettier never changes what code *does*. That's ESLint's job, and you fix those yourself.

## 🔍 Deeper version

**What each tool owns:**

| Concern | Tool | Example |
|---|---|---|
| Possible bugs | ESLint | unused variables, `==`, missing `await`, unreachable code |
| React rules | ESLint plugin | `react-hooks/exhaustive-deps`, rules of hooks |
| TypeScript rules | `typescript-eslint` | no floating promises, no `any` |
| Spaces, quotes, line length | Prettier | `'` vs `"`, semicolons, wrapping |

**Stop the fight.** Some ESLint rules also care about style. If both tools have opinions, they undo each other. The fix is to add `eslint-config-prettier` **last** in the config. It turns off every ESLint rule that Prettier already handles.

**Flat config.** `eslint.config.js` exports an **array**. Each object can target files with `files` and add `rules`, `plugins` and `languageOptions`. Later objects override earlier ones.

:::version[Version note]
**ESLint 9** made flat config the default, and the old `.eslintrc.*` format was removed later. The current major is **ESLint 10**. The flat-config example above works the same way.
:::

**Auto-run before every commit (husky + lint-staged):**

```json
{
  "scripts": { "prepare": "husky" },
  "lint-staged": {
    "*.{js,ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

With `.husky/pre-commit` containing `npx lint-staged`, every commit lints and formats **only the staged files**, so it's fast. Many teams also run `tsc --noEmit` (a type check) in the same hook.

**In CI.** Run `eslint .` and `prettier --check .` on every pull request. Hooks can be skipped with `git commit --no-verify`, but CI can't be skipped. Some teams add a code-quality scanner, like SonarQube, for bigger checks such as duplicated code and security hotspots.

## 🎯 Why do we use it?

- **Catch bugs before running the code.** An unused variable or `==` is often a real mistake.
- **No style arguments.** The formatter decides, so code reviews focus on logic.
- **Same look everywhere.** Every file looks the same, so the code is easier to read.
- **Cleaner diffs.** When formatting is automatic, a pull request shows only real changes.

## ⚠️ Common mistakes

- **Letting ESLint and Prettier both handle style.** They fight. Use `eslint-config-prettier`.
- **Only running locally.** Someone skips the hook, and messy code gets in. Run it in CI too.
- **Disabling rules with `// eslint-disable` everywhere.** Fix the code, or change the rule for the whole team.
- **Running lint on the whole project in the pre-commit hook.** It gets slow. Use lint-staged so only changed files are checked.

## 🗣️ How to answer in an interview

> "ESLint is the linter. It catches likely bugs, like unused variables, `==` instead of `===`, or missing hook dependencies in React. Prettier is the formatter. It only fixes how code looks. I let Prettier own all formatting and add `eslint-config-prettier` so the two don't fight.
>
> Both run automatically. Husky with lint-staged lints and formats the staged files before every commit, often together with a TypeScript type check. And CI runs them again on every pull request, because hooks can be skipped. That way code reviews are about logic, not spaces and quotes."

At SkillKeepr, husky pre-commit hooks run a type check and lint, and code-quality scans run in GitHub Actions. [FILL IN: what you personally set up or fixed in this tooling, if anything.]

## 🔁 Follow-up questions

### What does `eslint --fix` do?

It automatically fixes the problems that are safe to fix, like `let` that should be `const`. Problems that need a human decision, like an unused variable, are only reported.

### What is `react-hooks/exhaustive-deps`?

A rule from the React hooks ESLint plugin. It warns when a `useEffect`, `useMemo` or `useCallback` is missing a dependency, which prevents stale-value bugs.

### Why use lint-staged instead of linting everything before commit?

Speed. It only checks the files you're committing, so the hook takes seconds, not minutes.

### Is Biome an alternative?

Yes. Biome is a newer, very fast tool that does linting and formatting in one. Many projects still use ESLint + Prettier because of the big plugin ecosystem.

## ✅ Quick check

### 1. Which tool will change `==` to `===` in the example above: ESLint or Prettier?

:::answer
**Neither changes it automatically here.** ESLint *reports* it (`eqeqeq`). Prettier never changes what code does, only how it looks. You fix it yourself.
:::

### 2. What does `eslint-config-prettier` do?

- A) Runs Prettier inside ESLint
- B) Turns off ESLint rules that conflict with Prettier
- C) Formats code faster

:::answer
**B.** It switches off ESLint's style rules, so only Prettier decides formatting.
:::

### 3. Why run ESLint in CI if husky already runs it before each commit?

:::answer
Hooks can be skipped (`git commit --no-verify`) or not installed. CI checks every pull request, so it can't be skipped.
:::
