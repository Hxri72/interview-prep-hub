---
title: Testing React components (React Testing Library)
stack: react
order: 29
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - React Testing Library (RTL) tests components the way a user uses them — find text and buttons, click, check what appears.
  - "The pattern: render the component → find an element with screen.getByRole / getByText → act with userEvent → check with expect."
  - Prefer getByRole and getByText over test IDs or CSS classes. Don't test internal state.
  - "Use findBy… (async) for things that appear later, and queryBy… to check something is NOT there."
  - Mock network calls (fetch, API modules) so tests are fast and don't need the real server.
cards:
  - q: What is React Testing Library?
    a: A library to test React components like a user would — render them, find elements by role or text, click and type, then check what the screen shows.
  - q: getBy vs queryBy vs findBy?
    a: getBy throws if the element is missing. queryBy returns null (use it to check something is NOT there). findBy waits and returns a promise (use it for things that appear later).
  - q: Why prefer getByRole?
    a: It finds elements the way users and screen readers do, like "the button named Save". It also pushes you to write accessible HTML.
  - q: userEvent vs fireEvent?
    a: userEvent simulates a real user (focus, key presses, clicks in order). fireEvent fires a single DOM event. Prefer userEvent.
  - q: Should you test a component's state directly?
    a: No. Test what the user sees and does. Internal state can change while the behaviour stays the same.
---

## 💡 What is it?

**React Testing Library (RTL)** helps you write tests for React [components](glossary:component).

It tests a component **the way a user uses it**. You show the component, find a button by its name, click it, and check what appears on the screen.

You run these tests with a test runner like **Vitest** or **Jest**.

## 🏠 Real-life example

Think of **checking a new vending machine**.

You don't open the machine and look at the wires. You do what a customer does: put in a coin, press the button for "Juice", and check that juice comes out.

- The **vending machine** = your component.
- **Looking at the buttons** = `screen.getByRole('button', …)`.
- **Pressing a button** = `userEvent.click(…)`.
- **Checking the juice came out** = `expect(…).toBeInTheDocument()`.
- **Not opening the machine** = not testing internal state, only what the user sees.

## 🧑‍💻 Code example

Setup (in a new folder):

```bash
npm init -y
npm install react react-dom
npm install -D vitest jsdom @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Add `"type": "module"` to `package.json`. Then create these files and run `npx vitest run --reporter=verbose`.

```js
// vite.config.js
import { defineConfig } from 'vitest/config';            // Vitest's config helper
import react from '@vitejs/plugin-react';                 // lets Vitest understand JSX

export default defineConfig({                             // the config object
  plugins: [react()],                                     // turn on JSX support
  test: {                                                 // settings for the tests
    environment: 'jsdom',                                 // a fake browser (DOM) inside Node
    globals: true,                                        // use describe/it/expect without importing
    setupFiles: './src/setupTests.js',                    // run this file before the tests
  },                                                      // end of test settings
});                                                       // end of config
```

```js
// src/setupTests.js
import '@testing-library/jest-dom/vitest';                // adds matchers like toBeInTheDocument()
```

```jsx
// src/Counter.jsx
import { useState } from 'react';                         // bring in useState

export default function Counter() {                       // the component we will test
  const [count, setCount] = useState(0);                  // count starts at 0
  return (                                                // what it shows
    <div>                                                 {/* a wrapper */}
      <p>Count: {count}</p>                               {/* the current count */}
      <button onClick={() => setCount(count + 1)}>Add</button> {/* click → count + 1 */}
    </div>                                                // end of wrapper
  );                                                      // end of return
}                                                         // end of Counter
```

```jsx
// src/Counter.test.jsx
import { render, screen } from '@testing-library/react';  // render = show it, screen = find things
import userEvent from '@testing-library/user-event';       // simulates a real user
import Counter from './Counter';                           // the component under test

describe('Counter', () => {                                // a group of tests
  it('starts at 0', () => {                                // test 1
    render(<Counter />);                                   // show the component in the fake browser
    expect(screen.getByText('Count: 0')).toBeInTheDocument(); // "Count: 0" must be on the screen
  });                                                      // end of test 1

  it('adds 1 when the button is clicked', async () => {    // test 2 (async because clicking takes time)
    const user = userEvent.setup();                        // create a fake user
    render(<Counter />);                                   // show the component
    await user.click(screen.getByRole('button', { name: 'Add' })); // find the "Add" button and click it
    expect(screen.getByText('Count: 1')).toBeInTheDocument(); // now "Count: 1" must be on the screen
  });                                                      // end of test 2
});                                                        // end of the group
```

**Output** (Vitest 5):

```text
 ✓ src/Counter.test.jsx > Counter > starts at 0 13ms
 ✓ src/Counter.test.jsx > Counter > adds 1 when the button is clicked 62ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
```

If you change the last check to `'Count: 2'`, the test fails with:

```text
TestingLibraryElementError: Unable to find an element with the text: Count: 2.
```

## 🔍 Deeper version

**The three query types:**

| Query | If not found | Use it for |
|---|---|---|
| `getBy…` | throws an error | things that must be there now |
| `queryBy…` | returns `null` | checking something is **not** there |
| `findBy…` | waits, then throws | things that appear later (after a fetch) |

Each has an `…All` version, like `getAllByRole`, that returns a list.

**Which query to prefer (the official order):**
1. `getByRole` — "the button named Save", "the heading", "the textbox". This matches how users and screen readers see the page.
2. `getByLabelText` — form fields by their `<label>`.
3. `getByText` — normal text.
4. `getByTestId` — last choice, only when nothing else works.

**Async UI.** When data loads from an API, use `await screen.findByText('Hari')`. It waits (1 second by default) until the text appears. For other async checks, use `await waitFor(() => expect(…))`.

**Mocking the network.** Tests should not call a real server. Common options:
- Mock your API module with `vi.mock('./api')` (Vitest) or `jest.mock('./api')`.
- Use **MSW (Mock Service Worker)** to fake HTTP responses at the network level. Your component code doesn't change.

**Wrapping providers.** If a component needs Redux, a router or a theme, render it inside those providers. Teams usually write a custom `render` helper that adds them once.

**What NOT to test:** internal state, private functions or CSS class names. They can change while the behaviour stays the same, and then your tests break for no reason.

**Vitest vs Jest.** Both work with RTL in almost the same way. Vitest is the natural choice for Vite projects because it reuses the same config. Jest is common in older and Webpack-based projects. See [Jest basics](topic:testing/jest-basics).

## 🎯 Why do we use it?

- **Confidence to change code.** If you refactor a component, the tests tell you if the user experience broke.
- **Tests that don't break for no reason.** Because RTL tests behaviour, not internals, a refactor that keeps behaviour keeps the tests green.
- **Better accessibility.** `getByRole` only works if your HTML is accessible, so tests push you towards proper buttons and labels.

## ⚠️ Common mistakes

- **Using `getBy` for something that appears later.** It fails at once. Use `findBy`.
- **Using `getBy` to check something is missing.** It throws. Use `expect(screen.queryByText('Error')).not.toBeInTheDocument()`.
- **Testing implementation details**, like a state value or a class name.
- **Forgetting `await`** with `userEvent` (v14) or `findBy`. The check then runs too early.

## 🗣️ How to answer in an interview

> "I test React components with React Testing Library, using Vitest or Jest as the runner. The idea is to test like a user: I render the component, find elements by role or text, act with userEvent, and assert what's on the screen. I avoid testing internal state or class names, so refactors don't break the tests.
>
> I prefer getByRole because it matches how users and screen readers see the page. For elements that appear after a fetch, I use findBy, and to check something is absent I use queryBy. I mock the network, either by mocking the API module or with MSW, so tests are fast and don't depend on a server. When a component needs Redux or a router, I wrap it with a custom render helper."

[FILL IN: if you wrote frontend tests at SkillKeepr, name one component you tested. Your confirmed testing work is Jest unit tests on the backend.]

## 🔁 Follow-up questions

### Unit vs integration tests for React?

A unit test checks one small component alone. An integration test renders a bigger part — a page with its children and a mocked API — and checks a full user flow. RTL is good at both.

### How do you test a component that fetches data?

Mock the API (with `vi.mock`/`jest.mock` or MSW). Render the component, check the loading state, then `await screen.findByText(...)` for the data. Also test the error case by making the mock fail.

### How do you test a custom hook?

Use `renderHook` from `@testing-library/react`. It renders the hook inside a tiny test component and gives you `result.current`. Wrap state changes in `act()`.

### What is `act()`?

It tells React to finish all updates before your checks run. RTL's `render`, `userEvent` and `findBy` already use it, so you rarely call it yourself.

## ✅ Quick check

### 1. You want to check that an error message is NOT shown. Which line is right?

- A) `expect(screen.getByText('Error')).toBeNull()`
- B) `expect(screen.queryByText('Error')).not.toBeInTheDocument()`
- C) `expect(screen.findByText('Error')).toBeFalsy()`

:::answer
**B.** `queryBy` returns `null` when the element is missing. `getBy` would throw before the check runs. `findBy` returns a promise.
:::

### 2. A list loads from an API after 300 ms. Which query should you use to check the first item?

:::answer
**`await screen.findByText('...')`.** `findBy` waits for the element to appear. `getBy` would fail immediately, before the data arrives.
:::
