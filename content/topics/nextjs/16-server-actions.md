---
title: Server Actions
stack: nextjs
order: 16
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "A Server Action is an async function marked 'use server'. A form or button can call it directly, with no API route."
  - "<form action={myAction}> sends the form data to the server function. It even works before JavaScript loads."
  - Treat every Server Action like a public API endpoint. Always validate the input and check the user's permission inside it.
  - "After saving, call revalidatePath or updateTag so the page shows the new data."
  - "Use Server Actions for your own app's forms and changes; use Route Handlers for outside callers like webhooks or mobile apps."
cards:
  - q: What is a Server Action?
    a: "An async function with 'use server' that runs on the server. Forms and buttons can call it directly, so you don't need to write a separate API route."
  - q: How does a form call a Server Action?
    a: "<form action={addCandidate}>. On submit, Next.js sends the FormData to the server function."
  - q: Is a Server Action safe because only my form calls it?
    a: No. It's a public HTTP endpoint. Anyone can call it, so validate the input and check authentication and authorisation inside it.
  - q: How does the page show new data after a Server Action saves something?
    a: Call revalidatePath('/candidates') or updateTag('candidates') in the action, so Next.js renders fresh data.
  - q: Server Action vs Route Handler — when to use which?
    a: Server Actions for forms and changes inside your own Next.js app. Route Handlers (route.ts) for outside callers like webhooks, mobile apps or other services.
---

## 💡 What is it?

A **Server Action** is an `async` function that runs **on the server**. You mark it with **`'use server'`**.

A form or a button can **call it directly**. You don't write a separate API route or a `fetch` call.

It's made for **changing data**: create, update or delete. For example, "add a candidate" or "close a job".

## 🏠 Real-life example

Think of the **suggestion box** at school.

You write your idea on a slip and drop it in the box. You don't need to find the principal's office or phone number. The box goes straight to the office.

- **The slip of paper** = the form data (`FormData`).
- **The suggestion box** = `<form action={...}>`.
- **The office that reads the slips** = the Server Action on the server.
- **The office checking it's from a real student and makes sense** = validation and permission checks. Anyone can drop a slip, so the office must check every one.
- **The notice board updated with the new idea** = `revalidatePath`, so the page shows the change.

## 🧑‍💻 Code example

In a Next.js 16 project, create these three files. (The list is kept in memory, so it resets when the server restarts. A real app would use a database.)

```ts
// app/candidates/store.ts
export const candidates: string[] = ['Asha', 'Rahul']; // a pretend database: a list in memory
```

```ts
// app/candidates/actions.ts
'use server'; // every function exported from this file is a Server Action

import { revalidatePath } from 'next/cache'; // tells Next.js a page's data changed
import { candidates } from './store'; // our pretend database

export async function addCandidate(formData: FormData) { // receives the submitted form
  const name = String(formData.get('name') ?? '').trim(); // read the "name" field; '' if missing
  if (name.length < 2) return; // validate: ignore names shorter than 2 letters
  candidates.push(name); // "save" the new candidate
  revalidatePath('/candidates'); // re-render /candidates with the new list
} // end of addCandidate
```

```tsx
// app/candidates/page.tsx
import { addCandidate } from './actions'; // the Server Action
import { candidates } from './store'; // read the list

export const dynamic = 'force-dynamic'; // render on every request (the list changes)

export default function CandidatesPage() { // a Server Component
  return ( // what the page shows
    <main> {/* page wrapper */}
      <ul>{candidates.map((c) => <li key={c}>{c}</li>)}</ul> {/* the current list */}
      <form action={addCandidate}> {/* submitting calls the Server Action */}
        <input name="name" placeholder="Candidate name" /> {/* becomes formData.get('name') */}
        <button type="submit">Add</button> {/* sends the form */}
      </form> {/* end of the form */}
    </main> // end of the wrapper
  ); // end of the returned JSX
} // end of CandidatesPage
```

Run `npm run build && npm start` and open `http://localhost:3000/candidates`.

**Real results (Next.js 16.4):**

```text
Page shows:            Asha, Rahul
Submit "Meena"         → Asha, Rahul, Meena
Submit "X" (1 letter)  → list unchanged (validation rejected it)

The rendered HTML contains a hidden input like name="$ACTION_ID_40a3…".
That's how a plain HTML form submit (even with JavaScript turned off) reaches the action.
```

## 🔍 Deeper version

**What happens on submit.** Next.js gives each Server Action an ID. The form posts the `FormData` plus that ID to the current page URL. The server runs the function. Then, because of `revalidatePath`, it sends back the updated page in the same response. With JavaScript loaded, this happens without a full page reload.

**Progressive enhancement.** A `<form action={serverAction}>` works **even before JavaScript loads** (or with it turned off), because it's a real HTML form post.

**Security: it's a public endpoint.** This is the most important point. Anyone can send a POST with the action ID. So inside every action:
1. **Authenticate**: who is calling? Read the session or cookie.
2. **Authorise**: are they allowed to do this?
3. **Validate**: check every field, for example with [Zod](topic:typescript/zod).

```ts
// app/jobs/actions.ts — a safer pattern
'use server'; // Server Actions file
import { z } from 'zod'; // validation library
import { updateTag } from 'next/cache'; // clear the jobs cache
import { getCurrentUser } from '@/lib/auth'; // your own helper that reads the session cookie

const JobSchema = z.object({ title: z.string().min(3).max(100) }); // title must be 3–100 characters

export async function createJob(formData: FormData) { // called by a form
  const user = await getCurrentUser(); // 1. who is calling?
  if (!user || user.role !== 'recruiter') throw new Error('Not allowed'); // 2. are they allowed?
  const parsed = JobSchema.safeParse({ title: formData.get('title') }); // 3. validate the input
  if (!parsed.success) return { error: 'Title must be 3–100 characters' }; // send back a friendly error
  // await db.job.create({ data: parsed.data }); — save to your real database here
  updateTag('jobs'); // the job list cache is now out of date: clear it at once
  return { ok: true }; // success
} // end of createJob
```

**Showing errors and "Saving…".** In a Client Component, React 19's `useActionState(action, initialState)` gives you the action's returned value (like `{ error }`) and an `isPending` flag. `useFormStatus()` gives a submit button its pending state. See [react/forms-validation](topic:react/forms-validation).

**Refreshing data after a change:**

| Call | Effect |
|---|---|
| `revalidatePath('/candidates')` | Re-render that path with fresh data |
| `updateTag('jobs')` | Expire a tagged cache immediately (Server Actions only) |
| `redirect('/jobs')` | Send the user to another page after saving |

**Server Actions vs Route Handlers:**

| | Server Action | [Route Handler](topic:nextjs/route-handlers) (`route.ts`) |
|---|---|---|
| Who calls it | Your own Next.js pages | Anyone: webhooks, mobile apps, other services |
| How | `<form action>` or calling the function | `fetch('/api/...')` with a URL |
| Typical use | Create/update/delete from a form | Public API, Stripe webhooks |

For a big product, many teams still keep a separate Node/Express backend, and Next.js calls it.

## 🎯 Why do we use it?

- **Less code.** No API route, no `fetch`, no JSON parsing for simple forms.
- **Works without JavaScript.** Forms still submit on slow phones.
- **One round trip.** Save the data and get the updated page back together.
- **Type safety.** You call a typed function, not a URL string.

## ⚠️ Common mistakes

- **Trusting the input.** A Server Action is public. Always validate and check permissions inside it.
- **Forgetting to revalidate.** The data is saved, but the page still shows the old list.
- **Putting secrets in the returned value.** Whatever you return is sent to the browser.
- **Using a Server Action for an outside caller.** Webhooks and mobile apps need a Route Handler with a stable URL.

## 🗣️ How to answer in an interview

> "A Server Action is an async function marked 'use server' that runs on the server. A form can call it directly with action equals the function, so for simple create and update flows I don't need a separate API route or a fetch call. It even works before JavaScript loads, because it's a real form post.
>
> The key thing is security: a Server Action is a public HTTP endpoint. So inside it, I authenticate the user, check their permission, and validate the input with a schema like Zod — the same as any Express route. After saving, I call revalidatePath or updateTag so the page shows the new data, and in a client form I can show errors and a pending state with useActionState.
>
> I'd use Route Handlers instead for outside callers like Stripe webhooks or a mobile app. I haven't used Next.js in production yet; my backend experience is Node.js APIs, and the same validation and auth rules apply. [FILL IN: once you've built the practice project, mention your Server Action for adding a job.]"

## 🔁 Follow-up questions

### Do Server Actions replace a REST API?

Not fully. They're great for your own app's forms. Outside clients still need a real API, through Route Handlers or a separate backend.

### How do you show a loading state while the action runs?

In a Client Component, use `useActionState` (gives `isPending`) or `useFormStatus` inside the submit button.

### Can a Server Action be called from a button without a form?

Yes. Import it into a Client Component and call it in an event handler, usually inside `startTransition`.

### How are Server Actions protected against CSRF?

They only accept POST requests, and Next.js compares the request's Origin with the Host header. You should still check authentication and permissions yourself.

## ✅ Quick check

### 1. True or false: if only my own form calls a Server Action, I don't need to validate input.

:::answer
**False.** A Server Action is a public endpoint. Anyone can call it with any data, so always validate and check permissions.
:::

### 2. After the action saves a new candidate, the list still shows the old data. What's missing?

:::answer
A call to **`revalidatePath('/candidates')`** (or `updateTag` for a tagged cache) after saving.
:::

### 3. Stripe needs to send payment events to your Next.js app. Server Action or Route Handler?

- A) Server Action
- B) Route Handler

:::answer
**B.** Stripe is an outside caller that needs a stable URL. Use a Route Handler like `app/api/stripe/route.ts`.
:::
