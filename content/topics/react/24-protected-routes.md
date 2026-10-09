---
title: Protected routes and auth on the frontend
stack: react
order: 24
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A protected route is a wrapper that shows a page only to logged-in users, and redirects others to /login.
  - It can also check permissions (roles), and show a 403 page when the user is logged in but not allowed.
  - The frontend check is only for user experience. The backend must still verify every request.
  - With HttpOnly cookies, JavaScript can't read the token, so apps keep a readable "logged in" flag or ask the server "who am I?".
  - Wait for the user to load before deciding, or users flash to /login on every refresh.
cards:
  - q: What is a protected (private) route?
    a: A wrapper component around pages that need login. If there is no user, it redirects to /login. Otherwise it renders the page.
  - q: Is hiding a page on the frontend enough security?
    a: No. Anyone can call the API directly. The frontend check only improves the experience; the backend must check the token and permissions on every request.
  - q: With an HttpOnly cookie, how does the frontend know the user is logged in?
    a: JavaScript can't read HttpOnly cookies. So the app calls a "who am I" endpoint on load, or the server also sets a small readable flag cookie that only says "logged in".
  - q: Why do users sometimes flash to the login page on refresh?
    a: The route guard checks before the user data has loaded. Fix it by showing a loader until the "who am I" call finishes, then decide.
  - q: How do you send the user back to the page they wanted after login?
    a: Save the current location when redirecting (in state or a ?next= query), and navigate there after a successful login.
---

## 💡 What is it?

Some pages should only open for **logged-in** users, like a dashboard. Some should only open for users with the **right permission**, like "Manage jobs".

A **protected route** is a small wrapper [component](glossary:component). Before showing a page, it checks:
1. Is the user logged in? If not → send them to `/login`.
2. Do they have permission? If not → show a "403 — not allowed" page.

**Important:** this check is only for a nice user experience. The real security is on the backend.

## 🏠 Real-life example

Think of the **staff room door at school**.

A teacher stands at the door. If you're not staff, she says "Please go to the office first" = redirect to login. If you're a staff member but not a lab assistant, she lets you into the staff room but not the chemical store = logged in, but no permission (403).

But the chemical store **also has its own lock**. Even if someone sneaks past the teacher, they can't open it.

- **The teacher at the door** = the protected route on the frontend.
- **"Go to the office first"** = redirect to `/login`.
- **The staff ID card** = the login token (cookie).
- **The lock on the chemical store** = the backend checking every request.
- **The teacher checking the list of staff names before the day starts** = loading the user before deciding.

## 🧑‍💻 Code example

Make a Vite React app and install the router: `npm install react-router`. Paste this into `src/App.jsx`, then run `npm run dev`.

```jsx
import { createContext, useContext, useEffect, useState } from 'react';            // React tools
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router'; // router tools

const AuthContext = createContext(null);                                            // a shared box for the user

function AuthProvider({ children }) {                                               // holds the logged-in user
  const [user, setUser] = useState(null);                                           // null = nobody logged in
  const [loading, setLoading] = useState(true);                                     // true until we know who it is
  useEffect(() => {                                                                 // on first load, ask "who am I?"
    const t = setTimeout(() => {                                                    // pretend API call (500 ms)
      setUser(null);                                                                // pretend: not logged in yet
      setLoading(false);                                                            // now we know
    }, 500);                                                                        // end of fake delay
    return () => clearTimeout(t);                                                   // cleanup the timer
  }, []);                                                                           // [] = run once on mount
  const login = () => setUser({ name: 'Hari', permissions: ['JOBS.READ'] });       // pretend login with 1 permission
  return (                                                                          // share user + helpers
    <AuthContext.Provider value={{ user, loading, login }}>{children}</AuthContext.Provider> // give it to all children
  );                                                                                // end of return
}                                                                                   // end of AuthProvider

function RequireAuth({ permission }) {                                              // the protected route wrapper
  const { user, loading } = useContext(AuthContext);                                // read the shared user
  const location = useLocation();                                                   // the page they wanted
  if (loading) return <p>Checking login…</p>;                                       // wait — don't redirect too early
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;    // not logged in → login page
  if (permission && !user.permissions.includes(permission)) return <h2>403 — not allowed</h2>; // no permission
  return <Outlet />;                                                                // allowed → show the child page
}                                                                                   // end of RequireAuth

function Login() {                                                                  // the login page
  const { login } = useContext(AuthContext);                                        // get the login helper
  const navigate = useNavigate();                                                   // to move after login
  const from = useLocation().state?.from?.pathname || '/jobs';                      // where they wanted to go
  return <button onClick={() => { login(); navigate(from, { replace: true }); }}>Log in</button>; // log in, go back
}                                                                                   // end of Login

export default function App() {                                                     // root component
  return (                                                                          // the app
    <AuthProvider>                                                                  {/* make the user available everywhere */}
      <BrowserRouter>                                                               {/* the router */}
        <Routes>                                                                    {/* route table */}
          <Route path="/login" element={<Login />} />                               {/* public page */}
          <Route element={<RequireAuth permission="JOBS.READ" />}>                  {/* needs login + JOBS.READ */}
            <Route path="/jobs" element={<h2>Jobs page</h2>} />                     {/* protected page */}
          </Route>                                                                  {/* end of JOBS.READ group */}
          <Route element={<RequireAuth permission="BILLING.READ" />}>               {/* needs BILLING.READ */}
            <Route path="/billing" element={<h2>Billing page</h2>} />               {/* protected page */}
          </Route>                                                                  {/* end of BILLING.READ group */}
          <Route path="*" element={<Navigate to="/jobs" replace />} />              {/* anything else → /jobs */}
        </Routes>                                                                   {/* end of route table */}
      </BrowserRouter>                                                              {/* end of router */}
    </AuthProvider>                                                                 // end of provider
  );                                                                                // end of return
}                                                                                   // end of App
```

**What you see:**

```text
Open /jobs        → "Checking login…" for 0.5 s → redirected to /login
Click "Log in"    → back on /jobs → "Jobs page"
Open /billing     → "403 — not allowed" (the user has JOBS.READ only)
```

(After a full page refresh, the fake user is gone again, because it lives only in memory.)

## 🔍 Deeper version

**Frontend checks are not security.** The browser runs code the user controls. Anyone can call your API with `curl`. So the backend must check **every request**: is the token valid, and does this user have this permission? The frontend guard only stops people from seeing screens they can't use. See [authentication vs authorisation](topic:rest-auth/authn-vs-authz) and [RBAC](topic:rest-auth/rbac).

**Where is the token?**
- **HttpOnly cookie** (recommended): JavaScript can't read it, so [XSS](glossary:xss) can't steal it. The browser sends it automatically with `credentials: 'include'`. To know "am I logged in?", the app calls a "who am I" endpoint on load. Or the server sets a second, readable cookie that only holds a flag like `isLoggedIn=true`. The flag is not a secret. The real check is still the HttpOnly token on the server.
- **localStorage**: easy to read, but any XSS bug can steal it.

See [where to store tokens](topic:rest-auth/token-storage).

**The "flash to login" bug.** On refresh, `user` starts as `null` until "who am I" returns. If the guard checks too early, it redirects to `/login`. Always keep a `loading` state and show a loader first.

**Permission checks in the UI.** Store the user's permission list (like `JOBS.READ`, `JOBS.CREATE`) after login. Use it in three places:
1. route guards (whole pages),
2. the menu (hide links the user can't open),
3. buttons (hide or disable "Delete" if the user can't delete).

**Return to the wanted page.** Pass the current location in `state` (or `?next=`) when redirecting to `/login`. After login, `navigate(from, { replace: true })`. `replace` keeps `/login` out of the Back history.

**401 during use.** Tokens expire. When any API returns `401`, clear the user and redirect to `/login`. Do this once, in your API wrapper. See [users get logged out randomly](topic:debugging/random-logouts).

:::version[Version note]
In **React Router v5**, protected routes were usually a `PrivateRoute` component using `<Route render={...}>` and `<Redirect>`. In **v6/v7**, the common pattern is a layout route that renders `<Outlet />` or `<Navigate>`, as shown above.
:::

## 🎯 Why do we use it?

- **Better experience.** Users don't see pages that will only fail with errors.
- **Clean menus.** Each role sees only what it can use.
- **Smooth login.** Users land back on the page they wanted.
- **One place for the rule.** The guard wraps whole groups of routes, so you don't repeat checks in every page.

## ⚠️ Common mistakes

- **Trusting the frontend guard as security.** The backend must check every request.
- **Redirecting before the user has loaded.** Users flash to `/login` on every refresh.
- **Storing the token in localStorage without thinking about XSS.** Prefer HttpOnly cookies.
- **Only hiding the menu link.** Users can still type the URL. Guard the route too.
- **Forgetting `replace`.** The Back button then sends the user back to `/login` after logging in.

## 🗣️ How to answer in an interview

> "I protect routes with a wrapper component. It reads the current user from context or the store. While the user is loading, it shows a loader. If there's no user, it redirects to login and remembers the page they wanted. If the user lacks the permission for that route, it shows a 403 page. Otherwise it renders the child routes.
>
> I use the same permission list to hide menu items and buttons. But I'm clear that this is only user experience. The backend verifies the token and permission on every request.
>
> For storage I prefer HttpOnly cookies, so JavaScript can't read the token. Then the frontend learns the login state from a 'who am I' call or a small readable flag cookie. A 401 from any API clears the user and sends them to login."

[FILL IN: if true — at SkillKeepr the UI used a private-route wrapper that checked the login flag and the user's permission strings before showing a page. Confirm and describe your part.]

## 🔁 Follow-up questions

### How do you handle different roles, like admin and recruiter?

Give each user a list of permissions after login. Each protected route says which permission it needs. The guard checks `permissions.includes(required)`. The backend checks the same permission on its side.

### Where should the user data live — Context or Redux?

Login state changes rarely, so Context is fine. If the app already uses Redux, keep it in the Redux store. The guard reads it the same way.

### What if the token expires while the user is on a page?

The next API call returns `401`. The API wrapper catches it, clears the user and redirects to `/login`. With refresh tokens, it can try one silent refresh first.

### Can a user change the readable "logged in" flag cookie to get in?

They can change it, and the UI might show a page shell. But every API call still needs the real HttpOnly token, so the server returns `401` and no data leaks. That's why the backend check matters.

## ✅ Quick check

### 1. True or false: if the frontend hides the Billing page, a user without permission can never read billing data.

:::answer
**False.** They can call the billing API directly. The backend must check the permission on every request.
:::

### 2. Users get sent to `/login` for a split second on every refresh. What is the likely bug?

:::answer
The guard decides before the user has loaded. Add a `loading` state and show a loader until the "who am I" call finishes.
:::

### 3. Logged in, but missing the permission for a page. Which response fits best?

- A) Redirect to `/login`
- B) Show a 403 "not allowed" page
- C) Show a blank page

:::answer
**B.** The user is known (authenticated) but not allowed (not authorised), which is a 403.
:::
