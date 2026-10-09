---
title: Using AI coding tools productively (Claude Code, Copilot, ChatGPT, Perplexity)
stack: ai
order: 8
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Pick the tool for the job: a coding agent (Claude Code) for multi-file tasks, in-editor completion (Copilot) for the line you're typing, a chat assistant (ChatGPT, Claude) for explaining and drafting, AI search (Perplexity) for research with sources."
  - "A good prompt has 4 parts: context → task → rules → output format."
  - Great daily uses are boilerplate, tests, refactors, understanding unfamiliar code, debugging ideas, docs and PR descriptions.
  - You stay responsible — read, test and understand every line before you commit it.
  - Never paste secrets or customer data into AI tools.
cards:
  - q: How do you use AI tools in your daily work?
    a: Claude Code and Copilot for boilerplate, tests, refactors and understanding code; ChatGPT and Perplexity for research and explanations. I review, test and understand everything before merging, and never share secrets.
  - q: What makes a good prompt for a coding tool?
    a: "Context (stack and files), a clear task, rules (constraints, error codes, style), and the output format you want."
  - q: When is a coding agent better than in-editor completion?
    a: For tasks across several files — adding a feature with tests, a refactor, or exploring an unfamiliar codebase. Completion is best for the line or function you're typing.
  - q: Why use Perplexity instead of a chat assistant for research?
    a: It searches the web and shows sources you can open and check, which matters for current versions and facts.
  - q: What should you never paste into an AI tool?
    a: API keys, passwords, tokens, customer or candidate personal data, and anything your company's policy forbids.
---

## 💡 What is it?

AI coding tools help you **write, understand and fix code faster**. Different tools are good at different jobs:

- **Coding agent** (like **Claude Code**): works inside your project. It can read files, run commands and make changes across many files.
- **In-editor completion** (like **GitHub Copilot**): finishes the line or function you're typing.
- **Chat assistant** (like **ChatGPT** or Claude): explains concepts, compares options, drafts docs.
- **AI search** (like **Perplexity**): researches with sources you can click and check.

You still **design, review and own** the code.

## 🏠 Real-life example

Think of **cooking with helpers in a busy kitchen**.

- **You** = the head chef. You decide the menu and taste every dish before it goes out.
- **Claude Code** = a capable assistant cook. "Prepare the whole biryani base" — they chop, cook and plate across many steps.
- **Copilot** = the helper who hands you the next spoon before you ask.
- **ChatGPT** = a cookbook you can talk to: "Why does my gravy split?"
- **Perplexity** = a friend who looks things up and shows you the recipe website, so you can check it.
- **Tasting before serving** = reading and testing the code before you merge it.

If a bad dish reaches the customer, the head chef is responsible — not the helper.

## 🧑‍💻 Code example

A good prompt has **4 parts: context → task → rules → output format**. This script builds one and compares it with a vague prompt. Save it as `prompt.js`. Run `node prompt.js`.

```js
// Build a good prompt from 4 parts: context → task → rules → output format
function buildPrompt({ context, task, rules, format }) {    // each part is plain text
  return [                                                  // join the parts with blank lines
    `Context: ${context}`,                                  // what the model needs to know about your project
    `Task: ${task}`,                                        // exactly what you want
    `Rules:\n- ${rules.join('\n- ')}`,                       // limits it must follow, one per line
    `Output format: ${format}`,                             // the shape of the answer
  ].join('\n\n');                                           // end of the joined prompt
}                                                           // end of buildPrompt
const bad = 'write login api';                              // a vague prompt → a vague answer
const good = buildPrompt({                                  // the same request, done properly
  context: 'Node.js 24 + Express 5 + Mongoose app with a User model.', // our stack
  task: 'Write a POST /auth/login route that checks the password with bcrypt and returns a JWT.', // the job
  rules: ['Use async/await', 'Return 401 for wrong email or password', 'Never return the password field'], // the limits
  format: 'One route file, then a 3-line explanation.',     // what we want back
});                                                         // end of the call
console.log('BAD:', bad);                                   // show the vague prompt
console.log('\nGOOD:\n' + good);                            // show the clear prompt
```

**Output:**

```text
BAD: write login api

GOOD:
Context: Node.js 24 + Express 5 + Mongoose app with a User model.

Task: Write a POST /auth/login route that checks the password with bcrypt and returns a JWT.

Rules:
- Use async/await
- Return 401 for wrong email or password
- Never return the password field

Output format: One route file, then a 3-line explanation.
```

The "good" prompt removes guessing. The tool knows your stack, the exact job, your rules and what to give back.

## 🔍 Deeper version

**Which tool for which job:**

| Job | Best fit | Why |
|---|---|---|
| Add a feature across 5 files, with tests | Coding agent (Claude Code) | Reads the codebase, edits files, runs tests |
| Finish the function I'm typing | In-editor completion (Copilot) | Fast, stays in your flow |
| "Explain this regex / this error" | Chat assistant | Good at explanations |
| "What changed in Express 5?" | AI search (Perplexity) or official docs | Current info with sources |
| Write a PR description or README | Chat assistant or agent | Fast first draft from the diff |

**Habits that make AI tools work well:**
- **Give context:** name the stack, versions, the relevant files and your conventions. Many agents can read a project instructions file (for example a `CLAUDE.md`) on every run.
- **Small steps:** ask for one change at a time and review each diff. Big "do everything" requests are harder to check.
- **Plan first:** for bigger tasks, ask for a plan, correct it, then let it code.
- **Make it prove things:** ask it to write and run tests, or show the command output.
- **Use it to learn:** "Explain this file step by step", then "quiz me".

**Where AI shines:** boilerplate (routes, schemas, validation), test cases including edge cases, refactors, converting JavaScript to TypeScript, first drafts of docs.

**Where to be careful:** security code (auth, payments, permissions), unfamiliar architecture decisions, and anything you don't understand yet. See [reviewing AI code](topic:ai/reviewing-ai-code).

**Company rules:** follow your company's policy on which tools are allowed and what data may be shared. Never paste secrets or customer data.

## 🎯 Why do we use it?

- **Speed:** boilerplate and tests take minutes instead of hours.
- **Learning:** you can understand a new codebase or library much faster.
- **Quality:** a second pair of eyes for reviews and edge cases.

Companies now expect developers to use AI well — fast, but still careful.

## ⚠️ Common mistakes

- **Vague prompts** like "fix this" with no context.
- **Merging code you don't understand.** If you can't explain it in review, don't commit it.
- **Pasting API keys, `.env` files or candidate data** into a chat.
- **Trusting version-specific answers** without checking the official docs.

## 🗣️ How to answer in an interview

> "I use different tools for different jobs. Claude Code is my coding agent for multi-file work — adding a feature with tests, refactors, or understanding an unfamiliar part of the codebase. Copilot helps while I type, mostly boilerplate. I use ChatGPT for explanations and drafting, and Perplexity for research, because it shows sources I can check.
>
> I write prompts with context, a clear task, rules and the output format I want, and I work in small steps so each change is easy to review. I always read and test the output, and I never paste secrets or customer data. It makes me faster, but I'm still responsible for every line I merge. [FILL IN: one real example — e.g. a feature or test suite you built faster with Claude Code at SkillKeepr]."

## 🔁 Follow-up questions

### How do you make sure AI-generated code is correct?

Read every line, run it, write or run tests including edge cases, and check security-sensitive parts carefully. See [reviewing AI code](topic:ai/reviewing-ai-code).

### When should you not use AI tools?

For core logic you don't understand yet, security-sensitive code without careful review, and architecture decisions where you need to think through trade-offs yourself.

### How do you give a coding agent context about your project?

Point it to the relevant files, describe the stack and conventions, and keep a project instructions file it reads automatically. Clear context gives code that fits your project.

### Has AI changed how you learn?

Yes. I use it to explain unfamiliar code step by step and to quiz me. I still confirm important facts in the official docs.

## ✅ Quick check

### 1. Name the 4 parts of a good prompt, in order.

:::answer
**Context → task → rules → output format.**
:::

### 2. You need to rename a function used in 12 files and update the tests. Which tool fits best?

- A) In-editor completion
- B) A coding agent like Claude Code
- C) AI search

:::answer
**B.** A coding agent can find every usage across files, make the changes and run the tests.
:::

### 3. True or false: it's fine to paste your `.env` file into a chat so the AI can debug the config.

:::answer
**False.** Never paste secrets. Share the variable names and the error, not the values.
:::
