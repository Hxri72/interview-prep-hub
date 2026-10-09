---
title: "Testing React components (React Testing Library)"
stack: testing
order: 8
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - React Testing Library (RTL) tests components the way a user uses them — by visible text, labels and roles, not internal state.
  - "Query priority: getByRole first, then getByLabelText, getByText; getByTestId only as a last resort."
  - "getBy = must be there now; queryBy = may be missing (returns null); findBy = waits for it to appear (async)."
  - user-event types and clicks like a real person. Always await its actions.
  - Mock the API with MSW, so the component's real fetch code runs against fake answers.
cards:
  - q: What is the main idea of React Testing Library?
    a: Test what the user sees and does — find elements by role, label and text, and interact with user-event — instead of testing internal state or component methods.
  - q: getBy vs queryBy vs findBy?
    a: getBy throws if the element isn't there now. queryBy returns null instead (good for "should NOT be there"). findBy returns a promise and waits until the element appears.
  - q: Which query should you try first?
    a: getByRole (with a name), because it matches how users and screen readers find elements. Use getByTestId only when nothing else fits.
  - q: What is MSW and why use it in component tests?
    a: Mock Service Worker intercepts network requests and returns fake responses. Your component's real fetch code runs unchanged, so the test is realistic.
  - q: Why use user-event instead of fireEvent?
    a: user-event simulates the full sequence a real user causes (focus, key down, input, key up, click), so it catches more real bugs.
---

## 💡 What is it?

**React Testing Library (RTL)** helps you test React [components](glossary:component).

Its main idea: **test the way a user uses the page.** A user doesn't know your state variables. They read text, find a field by its **label**, and click a **button**. So your test does the same.

The basics are in [Testing React components](topic:react/testing-rtl). This topic goes further: **which query to use**, **waiting for async results** with `findBy`, realistic typing and clicking with **user-event**, and faking the API with **MSW**.

## 🏠 Real-life example

Think of a **new student testing the school library's computer**.

The student doesn't open the computer to look at the wires. They:
- find the box that says **"Book name"** (a label),
- **type** "Harry Potter",
- **click** the "Search" button,
- **wait** a moment for results to appear,
- and check the book title shows up.

Mapping:

- **Looking at the wires** = testing internal state (don't).
- **Finding "Book name"** = `getByLabelText('Book name')`.
- **Typing and clicking** = `user.type(...)` and `user.click(...)`.
- **Waiting for results** = `await findByText(...)`.
- **A pretend library database** = MSW, the fake API.

If the test passes, a real user can do it too.

## 🧑‍💻 Code example

Setup in a Vite React project: `npm install --save-dev vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw`. Add `test: { environment: 'jsdom', setupFiles: ['./setup.js'] }` to `vitest.config.js`. Then run `npx vitest run`.

```js
// setup.js — runs before every test file
import '@testing-library/jest-dom/vitest';                          // adds matchers like toBeInTheDocument()
import { cleanup } from '@testing-library/react';                   // removes rendered components
import { afterEach } from 'vitest';                                 // Vitest hook
afterEach(() => cleanup());                                         // start every test with an empty page
```

```jsx
// CandidateSearch.jsx — type a skill, click Search, see matching candidates
import { useState } from 'react';                                   // React state hook

export default function CandidateSearch() {                         // the component we will test
  const [query, setQuery] = useState('');                           // what the user typed
  const [result, setResult] = useState(null);                       // null = nothing searched yet
  const [error, setError] = useState('');                           // error message, '' = no error

  async function search(e) {                                        // runs when the form is submitted
    e.preventDefault();                                             // stop the page from reloading
    setError('');                                                   // clear an old error
    const res = await fetch(`http://localhost/api/candidates?skill=${query}`); // ask the API
    if (!res.ok) return setError('Something went wrong');           // 500 etc. → show an error
    setResult(await res.json());                                    // save the list of candidates
  }                                                                 // end of search

  return (                                                          // what the user sees
    <form onSubmit={search}>                                        {/* a form, so Enter also works */}
      <label htmlFor="skill">Skill</label>                          {/* a label: good for users AND tests */}
      <input id="skill" value={query} onChange={(e) => setQuery(e.target.value)} /> {/* controlled input */}
      <button type="submit">Search</button>                         {/* the search button */}
      {error && <p role="alert">{error}</p>}                        {/* errors are announced to screen readers */}
      {result?.length === 0 && <p>No candidates found</p>}          {/* empty state */}
      <ul>{result?.map((c) => <li key={c.id}>{c.name}</li>)}</ul>  {/* the results list */}
    </form>                                                         // end of the form
  );                                                                // end of return
}                                                                   // end of component
```

```jsx
// CandidateSearch.test.jsx
import { render, screen } from '@testing-library/react';            // render a component, find things on screen
import userEvent from '@testing-library/user-event';                // acts like a real user (typing, clicking)
import { http, HttpResponse } from 'msw';                           // describe fake API answers
import { setupServer } from 'msw/node';                             // a fake API server for tests in Node
import { beforeAll, afterEach, afterAll, it, expect } from 'vitest'; // test functions
import CandidateSearch from './CandidateSearch';                    // the component under test

const server = setupServer(                                         // the fake API
  http.get('http://localhost/api/candidates', ({ request }) => {    // answer GET /api/candidates
    const skill = new URL(request.url).searchParams.get('skill');   // read ?skill=...
    if (skill === 'node') return HttpResponse.json([{ id: 1, name: 'Asha' }, { id: 2, name: 'Ravi' }]); // two matches
    return HttpResponse.json([]);                                   // any other skill → empty list
  }),                                                               // end of handler
);                                                                  // end of setupServer
beforeAll(() => server.listen());                                   // start intercepting fetch
afterEach(() => server.resetHandlers());                            // undo per-test overrides
afterAll(() => server.close());                                     // stop intercepting

it('shows candidates for a skill', async () => {                    // test 1: results
  const user = userEvent.setup();                                   // a fresh "user"
  render(<CandidateSearch />);                                      // draw the component in a fake browser (jsdom)
  await user.type(screen.getByLabelText('Skill'), 'node');          // find the input BY ITS LABEL, type "node"
  await user.click(screen.getByRole('button', { name: 'Search' })); // find the button BY ITS ROLE + NAME, click
  expect(await screen.findByText('Asha')).toBeInTheDocument();      // findBy = wait until it appears
  expect(screen.getAllByRole('listitem')).toHaveLength(2);          // two results
});                                                                 // end of test 1

it('shows the empty state', async () => {                           // test 2: no results
  const user = userEvent.setup();                                   // a fresh "user"
  render(<CandidateSearch />);                                      // draw the component
  await user.type(screen.getByLabelText('Skill'), 'cobol');         // a skill nobody has
  await user.click(screen.getByRole('button', { name: 'Search' })); // click Search
  expect(await screen.findByText('No candidates found')).toBeInTheDocument(); // empty message shown
});                                                                 // end of test 2

it('shows an error when the API fails', async () => {               // test 3: server error
  server.use(http.get('http://localhost/api/candidates', () => new HttpResponse(null, { status: 500 }))); // this test only: API returns 500
  const user = userEvent.setup();                                   // a fresh "user"
  render(<CandidateSearch />);                                      // draw the component
  await user.click(screen.getByRole('button', { name: 'Search' })); // click Search
  expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong'); // error is shown
});                                                                 // end of test 3
```

**Output** (Vitest 5, React 19.3, RTL 16, user-event 14, MSW 2.15; timings removed):

```text
 ✓ CandidateSearch.test.jsx > shows candidates for a skill
 ✓ CandidateSearch.test.jsx > shows the empty state
 ✓ CandidateSearch.test.jsx > shows an error when the API fails

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

## 🔍 Deeper version

**Query priority** (from the RTL docs — try them in this order):

| Priority | Query | Why |
|---|---|---|
| 1 | `getByRole('button', { name: 'Search' })` | How users and screen readers find things; also checks accessibility |
| 2 | `getByLabelText('Skill')` | Form fields, the way users read them |
| 3 | `getByPlaceholderText`, `getByText`, `getByDisplayValue` | Visible text |
| 4 | `getByAltText`, `getByTitle` | Images and titles |
| 5 | `getByTestId('...')` | Last resort, when nothing visible fits |

**Query types:**

| | Found now | Not found | Async? | Use for |
|---|---|---|---|---|
| `getBy…` | returns it | **throws** | no | must be there right now |
| `queryBy…` | returns it | returns `null` | no | checking something is **not** there |
| `findBy…` | resolves | rejects after ~1 s | **yes** | waiting for something to appear |
| `…AllBy…` | returns an array | — | — | many matches (list items) |

So "the error is gone" is `expect(screen.queryByRole('alert')).not.toBeInTheDocument()`. With `getByRole` it would throw.

**user-event vs fireEvent.** `fireEvent.click` sends one event. `user.click` sends what a real click causes: pointer events, focus changes, then click. `user.type` types key by key. Always `await` user-event calls, and create the user with `userEvent.setup()` at the start of each test.

**Why MSW instead of mocking `fetch`?** With MSW, your component's **real** `fetch` code runs, including URL building and `res.ok` checks. Only the network answer is fake. The same handlers can also be reused in the browser during development. `server.use(...)` overrides one handler for one test, like the 500 case above.

**`act()` warnings.** RTL wraps `render` and user-event in `act()` for you. If you see an `act` warning, something updated **after** the test stopped looking. Usually you're missing an `await findBy…`.

**Jest or Vitest?** RTL works with both. Vite projects usually use Vitest, which has the same `describe`/`it`/`expect` style. In Jest you set `testEnvironment: 'jsdom'` instead.

**At SkillKeepr.** The frontend has Jest with Testing Library set up, with a custom render helper that wraps components in their providers. [FILL IN: whether you wrote frontend tests, and for which screens.]

## 🎯 Why do we use it?

- **Tests survive refactors.** If you rename a state variable or split a component, the user still sees the same page, so the test still passes.
- **Catches real bugs:** a missing label, a button that never enables, an error message that never shows.
- **Better accessibility for free.** If `getByRole` and `getByLabelText` can't find your element, a screen reader probably can't either.
- **Realistic API behaviour.** With MSW, the loading, success, empty and error states are all easy to test.

## ⚠️ Common mistakes

- **Using `getBy` to check something is NOT there.** It throws. Use `queryBy…` with `.not.toBeInTheDocument()`.
- **Using `getBy` for async content.** The data isn't there yet. Use `await findBy…`.
- **Forgetting `await` on user-event.** The next line runs before typing finishes.
- **`getByTestId` everywhere.** The tests pass, but they don't check what users really see, and they don't help accessibility.
- **Testing implementation details,** like reading component state or calling internal functions.

## 🗣️ How to answer in an interview

> "I test React components with React Testing Library, the way a user would. I render the component, find elements by role and label — for example getByRole('button', { name: 'Search' }) — and interact with user-event, which types and clicks like a real person.
>
> For anything that appears after an API call, I use await findBy, which waits. To check something is not shown, I use queryBy, because getBy would throw. I avoid getByTestId unless nothing visible fits.
>
> For APIs, I use MSW to intercept requests and return fake answers, so the component's real fetch code runs. I test the success, empty and error states, and override the handler per test to return a 500.
>
> [FILL IN: frontend testing you did at SkillKeepr, if any.]"

## 🔁 Follow-up questions

### How do you test a component that uses Redux or React Router?

Write a custom `render` helper that wraps the component in its providers — a real store and a `MemoryRouter`. Then every test can render with one line. This is the recommended pattern.

### How do you test a loading spinner?

Right after the action, check `screen.getByText('Loading…')` (or `getByRole('progressbar')`). Then `await findByText('Asha')`, and check the spinner is gone with `queryBy…`.

### What is `waitFor`?

`await waitFor(() => expect(…))` retries a check until it passes or times out. `findBy…` is `getBy…` + `waitFor` built in. Prefer `findBy` when you're waiting for an element.

### Should you use snapshot tests for components?

Sparingly. Big snapshots change often and get approved without reading. Specific checks like "the error message shows" are clearer.

## ✅ Quick check

### 1. Which query should you use to check that an error message is NOT shown?

- A) `getByRole('alert')`
- B) `queryByRole('alert')`
- C) `findByRole('alert')`

:::answer
**B.** `queryBy…` returns `null` when nothing is found, so `expect(screen.queryByRole('alert')).not.toBeInTheDocument()` works. `getBy` would throw.
:::

### 2. The candidate list appears after an API call. Why does `screen.getByText('Asha')` fail right after the click?

:::answer
The data hasn't arrived yet. `getBy` only looks once. Use `await screen.findByText('Asha')`, which waits for it to appear.
:::

### 3. Which is the best way to find a "Save" button?

- A) `getByTestId('save-btn')`
- B) `getByRole('button', { name: 'Save' })`
- C) `container.querySelector('.btn-primary')`

:::answer
**B.** It finds the button the way users and screen readers do, and it doesn't break when CSS classes change.
:::
