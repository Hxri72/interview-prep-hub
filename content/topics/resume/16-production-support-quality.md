---
title: Production support, Swagger, Jest and code optimisation
template: story
stack: resume
order: 16
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Your confirmed work: backend code optimisation, Jest unit tests, and Swagger docs for the backend."
  - Production support means watching logs, finding the cause of live issues, and fixing them safely.
  - Unit tests check one function or service at a time, with databases and other services mocked.
  - Swagger (OpenAPI) documents every API endpoint so frontend developers know how to call it.
  - Prepare ONE optimisation story and ONE production bug story — interviewers almost always ask.
cards:
  - q: What do you test with Jest?
    a: "Unit tests for backend services and helpers: I call the function, mock the database and other services, and check the result. [FILL IN: one real test]"
  - q: Why mock the database in unit tests?
    a: So the test is fast, doesn't need a real database, and checks only the logic of the function.
  - q: What is Swagger used for?
    a: It documents each API endpoint — URL, method, inputs and outputs — so other developers can use the API without reading the code.
  - q: Tell me about an optimisation you made.
    a: "[FILL IN: what was slow → what you changed → result]"
  - q: What should never be written to logs?
    a: Passwords, tokens, API keys and personal data.
---

## 💡 What is it?

Your resume says you supported production services with **logging and error tracking**, documented APIs with **Swagger**, added **Jest** coverage, did code reviews and shipped through **GitHub Actions** in an Agile team.

**Confirmed work you did:**
- **Backend code optimisation**: making slow backend code faster.
- **Jest unit tests** for backend code.
- **Swagger docs** for the backend APIs.

## 🏠 Real-life example

Think of a **school bus service**.

- **Production support** = a driver who notices a strange noise, finds the cause and fixes it, so the kids still reach school.
- **Unit tests** = checking each part (brakes, lights) on its own before the bus goes out.
- **Swagger docs** = the bus timetable on the wall, so everyone knows which bus goes where.
- **Code optimisation** = finding a shorter route, so the same trip takes less time.

## 🧩 The problem

A live SaaS product must keep working for every customer. When something breaks, the team must find the cause quickly. When something is slow, users notice.

New code must not break old features. Frontend developers also need to know exactly how each API works.

## 🛠️ What I built

**Backend code optimisation:**
[FILL IN: your optimisation story — what was slow → how you found it → what you changed → the result.]

**How this usually goes (general knowledge):** common backend fixes are:
- adding the right database index
- fetching only the fields you need
- removing N+1 queries (one query per item in a loop)
- running independent calls in parallel with `Promise.all`
- caching data that rarely changes

**Jest unit tests:**
- Tests for backend services and helpers, with the database and other services mocked using `jest.mock`.

[FILL IN: one real test you wrote — what it checked.]

**Swagger docs:** API documentation for the backend endpoints.

[FILL IN: how you wrote it — annotations in code, or a separate spec file — and which endpoints.]

**CI and monitoring:**
[FILL IN: what the GitHub Actions workflow runs — lint, tests, scans, build?]
[FILL IN: the logging and error-tracking tools you used.]

## 🧗 The hard part

**General knowledge:** the hard part of production support is finding the real cause. One symptom, like "the page is slow", can come from the database, an external API, or the code itself. Good logs with request IDs make this much easier.

[FILL IN: the real hard part — a tricky bug or a slow piece of code.]

## 🏆 The result

[FILL IN: results — e.g. "the endpoint went from X s to Y ms", or "tests caught a bug before release".]

## 🗣️ How to answer in an interview

> "Besides features, I work on quality and production support. I write Jest unit tests for backend services, with the database and external services mocked, so tests are fast and check only the logic. I also documented backend APIs with Swagger, so frontend developers know each endpoint's inputs and outputs.
>
> I've also done backend code optimisation. For example, [FILL IN: what was slow]. I found the cause by [FILL IN: logs, timing, explain()]. I changed [FILL IN], and the result was [FILL IN].
>
> For production issues, I start from the logs, find the root cause, fix it, and then add a test or a check so it doesn't come back."

## 🔁 Follow-up questions

### Unit vs integration vs end-to-end tests?

A unit test checks one function with everything else mocked. An integration test checks several parts together, like an API with a real test database. An end-to-end test checks a full user flow in the browser.

### Tell me about a production bug you fixed.

Use this shape: symptom → how you found it in the logs → root cause → fix → what you changed so it doesn't happen again. [FILL IN: your real bug story.]

### What do you look for in a code review?

Correctness, edge cases, readability, security (input validation, no secrets), tests, and whether it follows the team's patterns.

### How do you keep Swagger docs up to date?

Generate them from code annotations or schemas where possible, and update them in the same pull request as the API change.

### What would you add to CI?

Lint, type-check, unit tests and a build on every pull request, so problems are caught before merging.

## 📚 Topics to revise

- [Jest basics](topic:testing/jest-basics)
- [Testing routes with Supertest](topic:express/supertest)
- [Logging and request IDs](topic:express/logging)
- [Error-handling middleware](topic:express/error-middleware)
- [GitHub Actions](topic:devops/github-actions)
- [Node.js performance tips](topic:nodejs/performance-tips)
