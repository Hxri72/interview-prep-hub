---
title: Role-based access control (RBAC)
stack: rest-auth
order: 18
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "RBAC: users get roles (admin, recruiter, viewer), and roles get permissions (JOBS.READ, JOBS.DELETE)."
  - "Code checks PERMISSIONS, not role names: can('JOBS.DELETE'), not role === 'admin'. Adding a new role then needs no code change."
  - "A middleware factory like can('JOBS.DELETE') returns 403 if the user's role doesn't have that permission."
  - "Store role → permission mappings in the database so admins can change them, and cache them."
  - "RBAC answers 'what kind of action'. You still need ownership or tenant checks for 'which record'."
cards:
  - q: What is RBAC?
    a: Role-based access control. Users are given roles, roles are given permissions, and the app checks whether the user's role has the permission an action needs.
  - q: Why check permissions instead of role names?
    a: "If code says role === 'admin', adding a new role like 'hiring-manager' means changing code everywhere. With permissions, you just give the new role the right permissions."
  - q: What status code when a user lacks a permission?
    a: 403 Forbidden. They are authenticated but not allowed.
  - q: What does RBAC NOT cover by itself?
    a: Which specific record a user may touch. A recruiter may have JOBS.EDIT, but only for their own company's jobs, so you add ownership or tenant checks.
  - q: How should the frontend use roles and permissions?
    a: To hide or disable buttons and menu items for a nicer experience. The backend must still check every request.
---

## 💡 What is it?

**RBAC** stands for **Role-Based Access Control**. It is the most common way to do [authorisation](glossary:authorization).

- Each **user** has one or more **roles**, like `admin`, `recruiter` or `viewer`.
- Each **role** has a list of **permissions**, like `JOBS.READ` or `JOBS.DELETE`.
- Before an action, the app asks: **"Does this user's role have the permission this action needs?"** If not, it returns **403**.

## 🏠 Real-life example

Think of **a school's staff badges**.

Every staff member has a **badge colour**. Each colour opens certain rooms:
- **Red (principal):** every room.
- **Blue (teacher):** classrooms and the staff room.
- **Green (lab assistant):** only the science lab.

The doors don't care **who** you are, only your **badge colour**. If a new "sports coach" role starts, the school just decides which rooms the new colour opens. Nobody changes the locks.

- **Staff member** = user.
- **Badge colour** = role.
- **Rooms a colour opens** = permissions.
- **The door's card reader** = the `can('PERMISSION')` check.
- **A locked door** = 403 Forbidden.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install express`. Save as `rbac.js` and run `node rbac.js`.

```js
const express = require('express');                         // load Express
const app = express();                                      // create the app

const rolePermissions = {                                   // each role → a list of permissions ("MODULE.RIGHT")
  admin: ['JOBS.READ', 'JOBS.CREATE', 'JOBS.DELETE', 'USERS.MANAGE'], // admins can do everything here
  recruiter: ['JOBS.READ', 'JOBS.CREATE'],                  // recruiters can read and create jobs
  viewer: ['JOBS.READ'],                                    // viewers can only read
};                                                          // end of rolePermissions

app.use((req, res, next) => {                               // FAKE login for this demo only
  req.user = { role: req.headers['x-role'] };               // real apps take the role from a verified JWT
  next();                                                   // continue
});                                                         // end of fake login

function can(permission) {                                  // middleware factory: "does this user have permission X?"
  return (req, res, next) => {                              // the real middleware
    const allowed = rolePermissions[req.user.role] ?? [];   // the user's permission list (empty if unknown role)
    if (!allowed.includes(permission)) return res.status(403).json({ error: `Needs ${permission}` }); // not allowed → 403
    next();                                                 // allowed → continue
  };                                                        // end of middleware
}                                                           // end of can

app.get('/jobs', can('JOBS.READ'), (req, res) => res.json({ jobs: ['Node dev'] })); // needs JOBS.READ
app.delete('/jobs/:id', can('JOBS.DELETE'), (req, res) => res.json({ deleted: req.params.id })); // needs JOBS.DELETE

const server = app.listen(3000, async () => {               // start, then test three roles
  for (const role of ['viewer', 'recruiter', 'admin']) {    // try each role
    const r = await fetch('http://localhost:3000/jobs/7', { method: 'DELETE', headers: { 'x-role': role } }); // try to delete
    console.log(role.padEnd(9), '→', r.status, JSON.stringify(await r.json())); // print the result
  }                                                         // end of loop
  server.close();                                           // stop the server
});                                                         // end of listen
```

**Output:**

```text
viewer    → 403 {"error":"Needs JOBS.DELETE"}
recruiter → 403 {"error":"Needs JOBS.DELETE"}
admin     → 200 {"deleted":"7"}
```

**Never** read the role from a request header in a real app. Here it's only to keep the demo short. Real apps read it from a verified token or the database.

## 🔍 Deeper version

**The data model:**

```text
users ──< user_roles >── roles ──< role_permissions >── permissions
```

- In SQL: a `users`, `roles`, `permissions` table plus two join tables.
- In MongoDB: a `roles` collection like `{ name: 'recruiter', permissions: ['JOBS.READ', 'JOBS.CREATE'] }`, and `roleId` on the user.

**Permission naming.** A simple pattern is `MODULE.ACTION`, for example `JOBS.CREATE`, `JOBS.DELETE`, `USERS.MANAGE`. Some teams use one letter per right, like C/R/U/D for create/read/update/delete. Pick one style and use it in the backend **and** the frontend.

**Check permissions, not roles.**
- ❌ `if (user.role === 'admin' || user.role === 'manager')` gets copied all over the code.
- ✅ `can('JOBS.DELETE')`. Adding a new role is a data change, not a code change.

**Where to keep permissions at runtime:**
- Put only `roleId` (or `role`) in the [JWT](topic:rest-auth/jwt). Look up the role's permissions from a **cache** (in memory or Redis). The token stays small, and permission changes apply quickly.
- Or put the permission list in the token. This is faster, but changes wait until the token expires.

**RBAC is not the whole story:**
- **Ownership:** "edit only your own profile" → compare `req.user.id` with the record.
- **Tenancy:** in a [multi-tenant](glossary:multi-tenant) app, a recruiter of company A must never see company B's jobs, whatever their role.
- **Plan or feature gates:** "this module is only in the paid plan" is a separate check from the role.
- **ABAC** (attribute-based access control) combines many facts, like department, region or time. Use it when roles alone get too complicated.

**The frontend mirrors it.** The same permission strings decide which menu items and buttons show. For example, a route config entry can say `requires: 'JOBS.CREATE'`. This is only for a nicer UI. The backend is the real gate. See [authentication vs authorisation](topic:rest-auth/authn-vs-authz).

**Role explosion.** If every customer wants slightly different rights, you end up with dozens of roles. Fixes: let admins build **custom roles** from a permission list, or move some rules to ABAC.

## 🎯 Why do we use it?

- **Simple to reason about:** "recruiters can create jobs" is easy to explain to product and customers.
- **Easy to change:** new roles and rights are data, not code.
- **Consistent:** one `can()` function guards every route the same way.
- **Auditable:** you can list exactly who can do what.

## ⚠️ Common mistakes

- **Hard-coding role names** in many places instead of checking permissions.
- **Trusting the role sent by the client** (body, header or query) instead of the verified token or database.
- **Forgetting ownership and tenant checks.** RBAC says "may edit jobs", not "may edit *this* job".
- **Hiding UI but not protecting the API.**
- **Stale permissions inside long-lived tokens.** A demoted admin stays admin until the token expires.

## 🗣️ How to answer in an interview

> "RBAC means users get roles, and roles get permissions. In the code, I check permissions, not role names. So a route says `can('JOBS.DELETE')`, and the middleware looks up the user's role, gets its permission list, and returns 403 if the permission is missing. This way, adding a new role like 'hiring manager' is a data change, not a code change.
>
> I usually keep only the role ID in the JWT and cache the role-to-permission mapping, so changes apply quickly. The frontend uses the same permission strings to hide menu items, but the backend always does the real check.
>
> RBAC alone isn't enough, though. I also check ownership and tenancy, so a recruiter can edit jobs, but only their own company's jobs.
>
> [FILL IN: one line about how roles and permissions work at SkillKeepr, at a high level, if you know it.]"

## 🔁 Follow-up questions

### How would you add a "Hiring Manager" role that can only read jobs?

Create the role in the database, give it `JOBS.READ`, and assign it to users. No code changes are needed if routes check permissions. Add it to seed data, so new environments have it too.

### Should permissions go inside the JWT?

It's a trade-off. Inside the token, checks need no lookup, but changes wait until the token expires. Only the role in the token plus a cached lookup is a little slower, but changes apply quickly. For most apps, I prefer the second.

### RBAC vs ABAC?

RBAC decides by role. ABAC decides by attributes, like "user.department === job.department and time is in office hours". ABAC is more flexible but harder to manage. Many systems use RBAC plus a few attribute checks.

### How do you test RBAC?

Write tests for each role against the important routes: allowed → 2xx, not allowed → 403, not logged in → 401. Supertest makes this quick. See [testing routes with Supertest](topic:express/supertest).

## ✅ Quick check

### 1. A viewer calls `DELETE /jobs/7`. With the code above, what is the status?

:::answer
**403.** The viewer role only has `JOBS.READ`, not `JOBS.DELETE`.
:::

### 2. Which is the better check?

- A) `if (req.user.role === 'admin')`
- B) `can('JOBS.DELETE')`

:::answer
**B.** It checks a permission, so any role that has `JOBS.DELETE` works, and new roles don't need code changes.
:::

### 3. A recruiter with `JOBS.EDIT` changes the job ID in the URL to another company's job. RBAC passes. What check is missing?

:::answer
An **ownership/tenant check**: confirm the job belongs to the recruiter's company before editing. RBAC alone only says "may edit jobs", not "may edit this job".
:::
