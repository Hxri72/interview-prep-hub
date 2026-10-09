---
title: Authentication vs authorisation
stack: rest-auth
order: 10
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Authentication (authn) = WHO are you? It checks your identity, for example with a password or a token."
  - "Authorisation (authz) = WHAT are you allowed to do? It checks your role or permissions."
  - Authentication always comes first. You can't check permissions for someone you don't know.
  - "Failed authentication → 401 Unauthorized. Failed authorisation → 403 Forbidden."
  - The frontend can hide buttons, but the backend must check both on every request.
cards:
  - q: Authentication vs authorisation in one line each?
    a: "Authentication: who are you? (identity). Authorisation: what are you allowed to do? (permissions)."
  - q: Which status code for each failure?
    a: "401 Unauthorized when authentication fails (not logged in, bad token). 403 Forbidden when you are logged in but not allowed."
  - q: Which comes first?
    a: Authentication. The server must know who you are before it can check what you may do.
  - q: Is hiding a button in React enough to protect an action?
    a: No. Anyone can call the API directly. The backend must check authentication and authorisation on every request.
  - q: Give an example of each in an Express app.
    a: "A requireAuth middleware that verifies the JWT (authentication), then allowRole('admin') or can('JOBS.DELETE') that checks permissions (authorisation)."
---

## 💡 What is it?

These two words sound alike, but they mean different things.

- **[Authentication](glossary:authentication)** (short: **authn**) asks: **"Who are you?"** You prove your identity with a password, a token or a fingerprint.
- **[Authorisation](glossary:authorization)** (short: **authz**) asks: **"What are you allowed to do?"** The server checks your role or permissions.

Authentication always happens first.

## 🏠 Real-life example

Think of **going into a cinema**.

1. At the entrance, the guard checks your **ticket**. Now they know you are a real customer. That is **authentication**.
2. Your ticket says **Screen 2, seat F7**. You can't walk into Screen 1, or sit in the VIP lounge. That is **authorisation**.

- The **ticket check at the door** = authentication (who are you?).
- The **screen and seat written on the ticket** = authorisation (what may you do?).
- **No ticket** = 401: "we don't know you".
- **A valid ticket, but the wrong screen** = 403: "we know you, but you can't go here".

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install express`. Save as `auth-vs-authz.js` and run `node auth-vs-authz.js`. (CommonJS. Node 24 has `fetch` built in.)

```js
const express = require('express');                         // load Express
const app = express();                                      // create the app

const users = {                                             // fake "logged-in" users, keyed by token
  'token-asha': { name: 'Asha', role: 'recruiter' },        // Asha is a recruiter
  'token-ravi': { name: 'Ravi', role: 'admin' },            // Ravi is an admin
};                                                          // end of users

function authenticate(req, res, next) {                     // step 1: WHO are you?
  const token = req.headers.authorization?.replace('Bearer ', ''); // read "Authorization: Bearer <token>"
  const user = users[token];                                // find the user for this token
  if (!user) return res.status(401).json({ error: 'Please log in' }); // unknown → 401 Unauthorized
  req.user = user;                                          // remember the user for the next steps
  next();                                                   // identity is known → continue
}                                                           // end of authenticate

function authorize(role) {                                  // step 2: are you ALLOWED? (a factory)
  return (req, res, next) => {                              // the real middleware
    if (req.user.role !== role) return res.status(403).json({ error: 'Not allowed' }); // wrong role → 403 Forbidden
    next();                                                 // allowed → continue
  };                                                        // end of the middleware
}                                                           // end of authorize

app.delete('/jobs/:id', authenticate, authorize('admin'), (req, res) => { // who → allowed? → delete
  res.json({ deleted: req.params.id, by: req.user.name });  // success reply
});                                                         // end of route

const server = app.listen(3000, async () => {               // start on port 3000, then test it
  const call = async (token) => {                           // helper: DELETE /jobs/7 with a token
    const headers = token ? { Authorization: `Bearer ${token}` } : {}; // add the header only if we have a token
    const res = await fetch('http://localhost:3000/jobs/7', { method: 'DELETE', headers }); // send the request
    console.log(res.status, JSON.stringify(await res.json())); // print status + body
  };                                                        // end of helper
  await call();                                             // no token
  await call('token-asha');                                 // recruiter
  await call('token-ravi');                                 // admin
  server.close();                                           // stop the server
});                                                         // end of listen
```

**Output:**

```text
401 {"error":"Please log in"}
403 {"error":"Not allowed"}
200 {"deleted":"7","by":"Ravi"}
```

- No token → the server doesn't know you → **401**.
- Asha is known, but she is a recruiter → **403**.
- Ravi is known **and** an admin → **200**.

## 🔍 Deeper version

**Ways to authenticate:**

| Method | How it works |
|---|---|
| Password | The user sends email + password. The server compares it with a [hash](glossary:hash) ([bcrypt](topic:rest-auth/bcrypt)). |
| Session cookie | After login, the browser sends a [session](glossary:session) ID in a [cookie](glossary:cookie). See [sessions vs tokens](topic:rest-auth/sessions-vs-tokens). |
| Token ([JWT](glossary:jwt)) | After login, every request carries a signed token. See [JWT](topic:rest-auth/jwt). |
| OAuth / "Login with Google" | Another service confirms who you are. See [OAuth](topic:rest-auth/oauth). |
| API key | A secret key for machine-to-machine calls. See [API keys](topic:rest-auth/api-keys). |
| MFA | A second proof, like a one-time code. It is added on top of a password. |

**Ways to authorise:**
- **Role-based (RBAC):** each user has a role, and each role has permissions. This is the most common. See [RBAC](topic:rest-auth/rbac).
- **Ownership checks:** "you can edit only *your own* profile". You compare `req.user.id` with the record's owner.
- **Attribute-based (ABAC):** rules use many facts together, like department, time or plan.

**Ownership is easy to forget.** Say a recruiter may edit jobs. That doesn't mean they may edit **another company's** jobs. In a [multi-tenant](glossary:multi-tenant) app, every check also includes the tenant. This bug has a name: **IDOR** (Insecure Direct Object Reference). It means changing an ID in the URL shows someone else's data.

**401 vs 403, the exact meaning:**
- **401 Unauthorized** really means "unauthenticated". The name is old and confusing. Send it when the token is missing, wrong or expired. The client should log in again.
- **403 Forbidden** means "I know who you are, and the answer is no". Logging in again won't help.

See [PUT vs PATCH, 401 vs 403](topic:rest-auth/put-patch-401-403-400-422).

**Where it lives in Express.** Authentication is a [middleware](glossary:middleware) that runs before protected routes. Authorisation is a second middleware, or a check inside the service code. See [custom middleware](topic:express/custom-middleware).

## 🎯 Why do we use it?

- **To protect data.** Only real users get in, and each one sees only what they should.
- **To keep two concerns separate.** "Is this token real?" is one job. "Can this role delete jobs?" is another. Separate code is easier to test and change.
- **To give the right error.** 401 tells the frontend "send the user to login". 403 tells it "show 'you don't have access'".

## ⚠️ Common mistakes

- **Mixing up 401 and 403.** A logged-in user without permission should get 403, not 401. Otherwise the frontend keeps sending them to the login page.
- **Only checking roles, not ownership.** A recruiter can open `/jobs/123` from another company by changing the ID.
- **Trusting the frontend.** Hiding the "Delete" button is nice for the user. It is not security.
- **Reading the role from the request body.** The role must come from a verified token or the database, never from what the client sends.

## 🗣️ How to answer in an interview

> "Authentication answers 'who are you?', and authorisation answers 'what are you allowed to do?'. Authentication always comes first. In an Express API, I usually have an auth middleware that verifies the JWT and puts the user on `req.user`. If that fails, I return 401. Then a second check looks at the user's role or permissions for that route. If they're not allowed, I return 403.
>
> I also check ownership, not just roles. For example, a recruiter should only see jobs from their own company. And I never rely on the frontend hiding buttons. The backend checks on every request.
>
> [FILL IN: one line on how SkillKeepr does it, if you're comfortable sharing — e.g. 'our auth uses HttpOnly JWT cookies, and the tenant is locked inside the JWT, so a token can't be used on another company's site'.]"

## 🔁 Follow-up questions

### Why is it called "401 Unauthorized" if it's about authentication?

It's an old naming mistake in the HTTP standard. 401 really means "not authenticated". Most people say "401 = not logged in, 403 = not allowed".

### Where should the permission check happen: in middleware or in the service?

Both are fine. Route-level checks ("needs JOBS.DELETE") fit well in middleware. Checks that need the data, like "is this job yours?", usually go in the service, after you load the record.

### What is IDOR?

Insecure Direct Object Reference. The API trusts an ID from the URL without checking that the user may access it. Fix: always add an ownership or tenant check to the query.

### Can a user be authenticated but have no permissions at all?

Yes. A new user may log in fine but have no role yet. Every protected action then returns 403.

## ✅ Quick check

### 1. A logged-in recruiter calls `DELETE /users/5`, which only admins can do. Which status code?

- A) 401
- B) 403
- C) 404

:::answer
**B) 403.** The server knows who they are (authenticated), but they are not allowed (not authorised).
:::

### 2. The token in the request has expired. Which status code?

:::answer
**401.** An expired token means the server can't confirm who you are anymore. The client should refresh the token or log in again.
:::

### 3. True or false: if the React app hides the "Delete" button for recruiters, the backend doesn't need a role check.

:::answer
**False.** Anyone can call the API with curl or Postman. The backend must check permissions on every request.
:::
