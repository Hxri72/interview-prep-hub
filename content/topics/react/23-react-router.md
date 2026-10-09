---
title: "React Router: routes, params, nested routes"
stack: react
order: 23
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - React Router shows a different component for each URL, without reloading the page.
  - "<Route path=\"/candidates/:id\"> matches any id; read it with useParams()."
  - "Nested routes share a layout: the parent renders <Outlet /> where the child page goes."
  - Use <Link> to move between pages, and useNavigate() to move in code (for example after saving).
  - "React Router v7 ships as the package react-router. v5 used Switch, component= and useHistory; v6+ uses Routes, element= and useNavigate."
cards:
  - q: What is client-side routing?
    a: The browser loads one HTML page once. When the URL changes, JavaScript swaps the component on screen instead of downloading a new page.
  - q: How do you read the id from /candidates/42?
    a: Define the route as /candidates/:id, then call const { id } = useParams() inside the page. id is the string "42".
  - q: What does Outlet do?
    a: It marks where a nested child route should appear inside a parent layout, like the content area next to a sidebar.
  - q: Link vs a normal anchor tag?
    a: Link changes the URL without a full page reload, so the app keeps its state and feels fast. A plain a tag reloads the whole app.
  - q: Name three changes from React Router v5 to v6/v7.
    a: Switch became Routes, component/render props became element, and useHistory became useNavigate. Nested routes use Outlet, and exact is no longer needed.
---

## 💡 What is it?

A React app is usually **one HTML page**. But users still expect different URLs: `/login`, `/candidates`, `/candidates/42`.

**React Router** is a library that maps each URL to a [component](glossary:component). When the URL changes, it swaps the component on screen. The page does **not** reload. This is called **client-side routing**.

## 🏠 Real-life example

Think of a **school building with one main gate**.

You enter once, through the main gate. Inside, the corridor has signs: "Library", "Lab", "Class 10-B". You walk to a room without leaving the building and entering again.

- **The main gate** = loading the one HTML page.
- **The signs on the corridor** = the routes (`/library`, `/lab`).
- **Room number on a door, like 10-B** = a URL parameter (`/class/:id`).
- **The corridor and notice board you always see** = a shared layout.
- **The room you are in right now** = the `<Outlet />`, where the current page appears.
- **Walking to another room** = clicking a `<Link>`. No need to go out and come back in.

## 🧑‍💻 Code example

Make a Vite React app, then install the router: `npm install react-router`

Paste this into `src/App.jsx`, then run `npm run dev`.

```jsx
import { BrowserRouter, Routes, Route, Link, Outlet, useParams, useNavigate } from 'react-router'; // router tools (v7 package)

function Layout() {                                                  // the shared frame for every page
  return (                                                           // what the layout shows
    <div>                                                            {/* page wrapper */}
      <nav>                                                          {/* the menu, always visible */}
        <Link to="/">Home</Link> | <Link to="/candidates">Candidates</Link> {/* move without reloading */}
      </nav>                                                         {/* end of menu */}
      <Outlet />                                                     {/* the current child page appears HERE */}
    </div>                                                           // end of wrapper
  );                                                                 // end of return
}                                                                    // end of Layout

function Candidates() {                                              // the list page at /candidates
  return (                                                           // what it shows
    <ul>                                                             {/* a list of links */}
      <li><Link to="/candidates/1">Asha</Link></li>                  {/* goes to /candidates/1 */}
      <li><Link to="/candidates/2">Ravi</Link></li>                  {/* goes to /candidates/2 */}
    </ul>                                                            // end of list
  );                                                                 // end of return
}                                                                    // end of Candidates

function CandidateDetail() {                                         // the detail page at /candidates/:id
  const { id } = useParams();                                        // read :id from the URL, e.g. "2" (a string)
  const navigate = useNavigate();                                    // a function to change the URL in code
  return (                                                           // what it shows
    <div>                                                            {/* detail wrapper */}
      <h2>Candidate #{id}</h2>                                       {/* show the id from the URL */}
      <button onClick={() => navigate('/candidates')}>Back</button>  {/* go back in code, e.g. after saving */}
    </div>                                                           // end of detail wrapper
  );                                                                 // end of return
}                                                                    // end of CandidateDetail

export default function App() {                                      // the root component
  return (                                                           // the route table
    <BrowserRouter>                                                  {/* uses real URLs like /candidates/2 */}
      <Routes>                                                       {/* pick ONE matching route */}
        <Route element={<Layout />}>                                 {/* parent: no path, just the shared layout */}
          <Route index element={<h2>Home page</h2>} />               {/* "/" — the default child */}
          <Route path="candidates" element={<Candidates />} />       {/* "/candidates" */}
          <Route path="candidates/:id" element={<CandidateDetail />} /> {/* ":id" = any value */}
          <Route path="*" element={<h2>404 — page not found</h2>} /> {/* any other URL */}
        </Route>                                                     {/* end of the layout parent */}
      </Routes>                                                      {/* end of the route table */}
    </BrowserRouter>                                                 // end of the router
  );                                                                 // end of return
}                                                                    // end of App
```

**What you see:**

```text
/                → menu + "Home page"
/candidates      → menu + Asha, Ravi
click "Ravi"     → URL /candidates/2 → menu + "Candidate #2" (no page reload)
click "Back"     → URL /candidates
/anything-else   → menu + "404 — page not found"
```

## 🔍 Deeper version

**Matching.** In v6 and v7, `<Routes>` picks the **best** match, not the first one. So `/candidates/new` wins over `/candidates/:id` if both exist. You don't need `exact` any more.

**Params and query strings.**
- `useParams()` reads path parts like `:id`. Values are always **strings**.
- `useSearchParams()` reads and sets `?page=2&status=shortlisted`. Good for filters and pagination, because the URL can be shared and bookmarked.

**Nested routes and layouts.** A parent route renders `<Outlet />`. Child routes appear inside it. This is how you build "sidebar + content" layouts. Relative paths (`path="candidates"` without `/`) are joined to the parent's path.

**Navigation.**
- `<Link to="...">` for normal links.
- `<NavLink>` adds an "active" style to the current menu item.
- `useNavigate()` for code, for example `navigate('/login', { replace: true })`. `replace` means the Back button won't return to the old page.

**Lazy pages.** Each route's page can be loaded only when visited, with `React.lazy`. See [code splitting](topic:react/code-splitting).

**Hosting.** With `BrowserRouter`, the server must return `index.html` for every URL. Otherwise a refresh on `/candidates/2` gives a 404. Static hosts without that option (like GitHub Pages) often use `HashRouter` (`/#/candidates/2`) instead.

**Three modes in v7.** **Declarative** (`<BrowserRouter>`, shown above), **data** (`createBrowserRouter` + `<RouterProvider>`, adds `loader` and `action` functions per route), and **framework** (the former Remix, with file routes and server rendering).

:::version[Version note]
**v5 → v6 (2021):** `<Switch>` became `<Routes>`. `component=` and `render=` became `element={<Page />}`. `useHistory()` became `useNavigate()`. `exact` was removed. Nested routes use `<Outlet />`.
**v7 (late 2024):** the main package is now `react-router`; `react-router-dom` only re-exports it. v7 also merged in Remix as "framework mode". Many older apps still run v5, so know both styles.
:::

## 🎯 Why do we use it?

- **Real URLs.** Users can bookmark, share and refresh a page. The Back button works.
- **Fast navigation.** No full page reload, so the app keeps its state and feels quick.
- **Organised code.** Each page is its own component. Layouts are shared, not copied.
- **Lazy loading per page.** Users download only the pages they open.

## ⚠️ Common mistakes

- **Using `<a href>` for internal links.** It reloads the whole app and loses state. Use `<Link>`.
- **Forgetting params are strings.** `id === 2` is false when `id` is `"2"`. Convert with `Number(id)`.
- **No server fallback.** Refreshing a deep URL gives 404 on the server. Return `index.html`, or use `HashRouter`.
- **Mixing v5 and v6+ syntax.** For example `<Route component={X}>` inside `<Routes>` doesn't work.
- **Keeping filters only in state.** Put them in the URL with `useSearchParams`, so a refresh keeps them.

## 🗣️ How to answer in an interview

> "React Router maps URLs to components, so a single-page app has real URLs without full page reloads. I define a route table with Routes and Route. For details pages I use params like /candidates/:id and read them with useParams. For filters and pagination I use search params, so the URL can be shared.
>
> For layouts I use nested routes: the parent renders the menu and an Outlet, and child pages appear inside. I use Link and NavLink for navigation, and useNavigate after actions like saving. Pages are usually lazy-loaded with React.lazy.
>
> I've worked with the v5 style too: Switch, component props and useHistory. In v6 and v7 those became Routes, element and useNavigate, and v7 ships as the react-router package."

[FILL IN: how routing was organised in the SkillKeepr UI you worked on — for example a route config with public and private pages.]

## 🔁 Follow-up questions

### How do you redirect a user in React Router v6/v7?

In JSX, render `<Navigate to="/login" replace />`. In code, call `navigate('/login', { replace: true })`. In data mode, a `loader` can `throw redirect('/login')`.

### How do you handle a 404 page?

Add a catch-all route `path="*"` at the end of a route group. It matches any URL nothing else matched.

### What is the difference between BrowserRouter and HashRouter?

`BrowserRouter` uses clean URLs like `/candidates/2`. It needs the server to return `index.html` for every path. `HashRouter` uses `/#/candidates/2`. The part after `#` never reaches the server, so it works on any static host.

### How do you protect a route so only logged-in users can see it?

Wrap the private routes in a component that checks the user and redirects to `/login` if needed. The backend must still check every request. See [protected routes](topic:react/protected-routes).

## ✅ Quick check

### 1. URL is `/candidates/7`. Route is `path="candidates/:id"`. What is `typeof useParams().id`?

:::answer
**`"string"`.** URL params are always strings. Convert with `Number(id)` if you need a number.
:::

### 2. Where does a nested child route appear on screen?

- A) At the bottom of the page
- B) Where the parent renders `<Outlet />`
- C) In a new browser tab

:::answer
**B.** The parent's `<Outlet />` is the slot for the matching child route.
:::

### 3. Which is the v6/v7 replacement for v5's `useHistory()`?

:::answer
**`useNavigate()`.** It returns a function: `navigate('/path')`.
:::
