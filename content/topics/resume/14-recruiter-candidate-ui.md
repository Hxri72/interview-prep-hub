---
title: "Recruiter & candidate UIs (React, Redux, Mantine)"
template: story
stack: resume
order: 14
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "SkillKeepr has an admin portal (recruiters and hiring managers) and a talent portal (candidates). Both are React apps."
  - "State: Redux with redux-saga for API calls and multi-step flows. Pages are code-split and load on demand."
  - "UI library: Mantine (components, @mantine/form for forms, Mantine hooks), with a shared theme."
  - Ant Design and Tailwind are from your early career, not SkillKeepr.
  - "Context API: you're learning it now. Talk about it from your practice project, not as SkillKeepr work."
cards:
  - q: Which portals does SkillKeepr have?
    a: An admin portal for recruiters and hiring managers, and a talent portal for candidates. There is also a cloud-admin portal for SkillKeepr staff.
  - q: How is state managed in the SkillKeepr frontend?
    a: Redux, with redux-saga handling API calls and multi-step flows like "ask for confirmation, then save".
  - q: Why redux-saga instead of thunks?
    a: "Sagas handle complex flows well: cancelling an old search with takeLatest, waiting for a user's confirm click, or running uploads in parallel."
  - q: Which UI library does SkillKeepr use?
    a: "Mantine: its components, @mantine/form for forms, and hooks like useDebouncedValue, with a shared theme for colours and fonts."
  - q: Where did you use Ant Design and Tailwind?
    a: "Early in my career, before SkillKeepr. [FILL IN: which project]"
---

:::warning[Two resume words to keep honest]
- **Mantine, not Material UI:** the SkillKeepr UIs use **Mantine**. Update the resume's "Material UI" to "Mantine".
- **Context API:** you're learning it now. Build the [Context API practice project](topic:redux-context/context-practice-project), then talk about it as something you built while learning, not as SkillKeepr work.
:::

## 💡 What is it?

SkillKeepr has two main web apps built with React:
- the **admin portal**, for recruiters and hiring managers, and
- the **talent portal**, for candidates.

They use **Redux** with **redux-saga** for state and API calls. Each page loads its code only when it's opened.

The UI library is **Mantine**. Forms use `@mantine/form`, and many small features use Mantine hooks. Ant Design and Tailwind CSS are from your **early career**, before SkillKeepr.

## 🏠 Real-life example

Think of a **school with two entrances**.

Teachers use the staff entrance. Students use the student entrance. Inside, both share the same building, the same office records and the same rules.

- **Staff entrance** = the admin portal (recruiters).
- **Student entrance** = the talent portal (candidates).
- **The school office records** = the Redux store.
- **The office clerk who handles requests in order** = redux-saga.

## 🧩 The problem

Recruiters need many screens: jobs, candidates, interviews, calendars, settings and billing. Candidates need a profile builder, interview invitations and recorded interviews.

These screens share data and run multi-step flows. One example: "ask the user to confirm, then call the API, then show a message". The UI must stay fast even with many pages.

[FILL IN: which screens or features you worked on.]

## 🛠️ What I built

**The frontend setup (team-level facts):**
- **React + TypeScript** single-page apps.
- **Redux + redux-saga:** each page has its own reducer and saga, added when the page loads.
- **React Router** for pages, with protected routes that check login and permissions.
- **Code splitting** with `React.lazy`, so each page loads only when it's needed.
- **UI library:** **Mantine**, with a shared theme (colours, fonts), `@mantine/form` for forms and Mantine hooks such as `useDebouncedValue` for search boxes.

[FILL IN: 2–3 features you built on the UI — e.g. a list page with filters and pagination, a form, a dashboard.]
[FILL IN: how you kept styling consistent — a shared theme, shared components.]

## 🧗 The hard part

**Common hard parts on screens like these:**
- Keeping list pages fast with filters, search and server-side pagination.
- Debouncing search boxes, so you don't call the API on every key press.
- Cancelling old requests when the user types again (redux-saga's `takeLatest` helps).

[FILL IN: the real hard part for you.]

## 🏆 The result

[FILL IN: a result you can share — a feature shipped, a page made faster, a bug fixed, feedback from recruiters.]

## 🗣️ How to answer in an interview

> "At SkillKeepr there are two main React apps: an admin portal for recruiters and hiring managers, and a talent portal for candidates. We use Redux with redux-saga. Sagas handle API calls and multi-step flows, like waiting for a confirm click before saving. Every page is code-split, so it loads only when opened.
>
> I worked on [FILL IN: features]. For the UI we use Mantine with a shared theme, so screens look consistent, and `@mantine/form` for forms.
>
> One challenge was [FILL IN]. I solved it by [FILL IN]. Earlier in my career I also used Ant Design and Tailwind CSS on [FILL IN: project]."

## 🔁 Follow-up questions

### What is the Redux data flow?

A component dispatches an action. A saga or reducer reacts. The reducer returns new state. Components read the state with `useSelector` and re-render.

### Redux vs Context — when would you use each?

Context is good for small, rarely changing data like the theme or the logged-in user. Redux suits big shared data that changes often, with dev tools and middleware. (Only claim Context experience if you have it.)

### How do you protect routes on the frontend?

A wrapper route checks if the user is logged in and has the right permission. If not, it redirects to login or shows a "not allowed" page. The backend still checks every request.

### How do you make a slow page faster?

Profile it with React DevTools. Then fix the cause: memoise expensive work, avoid re-renders, paginate or virtualise long lists, and lazy-load heavy parts.

### Why redux-saga and not RTK Query or React Query?

[FILL IN: if you know the team's reason.] In general, sagas fit complex step-by-step flows. Newer projects often use RTK Query or TanStack Query for simple data fetching and caching.

## 📚 Topics to revise

- [What causes a re-render](topic:react/what-causes-a-re-render)
- [useEffect: dependencies and cleanup](topic:react/use-effect)
- [Context vs Redux: how to choose](topic:redux-context/how-to-choose)
- [Mantine setup and core components](topic:mantine-tailwind/mantine-setup)
- [Forms with @mantine/form](topic:mantine-tailwind/mantine-form)
- [Responsive design with Mantine](topic:responsive-design/mantine-breakpoints)
- [Debounce and throttle](topic:javascript/debounce-throttle)
- [Responsive design basics](topic:responsive-design/what-is-responsive-design)
