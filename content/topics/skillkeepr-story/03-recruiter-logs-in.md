---
template: chapter
title: A recruiter opens the site and logs in
stack: skillkeepr-story
order: 3
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Priya opens Acme's address. DNS points it to CloudFront, which sends the React app's static files from S3.
  - The app reads the tenant ("acme") from the subdomain and sends it with every API call.
  - "Login: API Gateway → a Lambda function checks the user → the server signs a JWT that contains the tenant → it is set in HttpOnly cookies."
  - On every later request, the server checks the token and rejects it if its tenant doesn't match the request's tenant.
  - The app then loads Priya's permissions and shows only the pages her role allows.
cards:
  - q: How does the frontend know which company Priya belongs to?
    a: It reads the tenant from the subdomain of the address and sends it with every API request.
  - q: Where is the login token stored?
    a: In HttpOnly cookies set by the server. JavaScript can't read them, which protects them from XSS.
  - q: Why put the tenantId inside the JWT?
    a: So a token from one company can't be used against another company. The server compares the token's tenant with the request's tenant and refuses a mismatch.
  - q: What happens on each API call after login?
    a: The browser sends the cookies automatically. The server verifies the token, checks the tenant, checks the user's permission, then runs the request.
  - q: Is hiding a page in the frontend enough security?
    a: No. The frontend hides pages for a nicer experience, but the backend checks permissions on every request.
---

## 💡 What happens in this chapter

Priya types her company's address and logs in.

A lot happens in a few seconds. The browser finds the server, downloads the React app, works out which company this is, and sends her email and password. The server checks them and gives her a **login pass** (a JWT) inside safe cookies.

After that, every click sends the pass automatically. The server checks it every single time.

## 🏠 Real-life example

Think of **entering an office building with security**.

- **Finding the building from its address** = DNS finding the server.
- **The reception desk that hands you a visitor form** = CloudFront and S3 sending the React app.
- **The floor name on your form ("Acme, 5th floor")** = the tenant from the subdomain.
- **Security checking your ID card** = the server checking email and password.
- **A badge that says your name AND your floor** = the JWT with your user id and tenant inside.
- **Badge kept in a sealed holder you can't open** = HttpOnly cookies. Scripts on the page can't read them.
- **A guard at every door who checks the floor on your badge** = the tenant check on every request. An Acme badge doesn't open Globex's floor.

## 🗺️ The flow

```text
1. Priya types acme.<platform domain>
       │
2. DNS → CloudFront (CDN) → S3 bucket
       │  sends index.html + JS + CSS (the React app)
3. React app starts in the browser
       │  reads tenant "acme" from the address
4. Priya submits the login form (Mantine form)
       │  POST /login   + tenant header   (cookies allowed)
5. API Gateway → Lambda (login function)
       ├─ connect to Acme's database
       ├─ find the user, check the password
       ├─ check: user active? account allowed?
       └─ sign a JWT { user id, role, tenantId: "acme" }
6. Response sets HttpOnly cookies (the tokens) + a small readable "logged-in" flag
       │
7. React loads Priya's details and permissions
       │
8. Private routes: show only pages her role allows
       │
9. Every later API call: cookies sent automatically
       └─ server: verify token → tenant matches? → permission OK? → run
```

## 🧱 Tech used

| Piece | Technology | Learn it |
|---|---|---|
| Finding the site | DNS, CloudFront, S3 | [Life of an HTTP request](topic:web-fundamentals/http-request-life), [Hosting a frontend on AWS](topic:web-fundamentals/hosting-frontend-aws) |
| Serving the app | Static SPA files | [How a React SPA is served](topic:web-fundamentals/spa-serving) |
| Who is logging in | Authentication | [Authentication vs authorisation](topic:rest-auth/authn-vs-authz) |
| The login pass | JWT | [JWT: structure](topic:rest-auth/jwt), [JWT login flow](topic:rest-auth/jwt-login-flow) |
| Where the pass lives | HttpOnly cookies | [Where to store tokens](topic:rest-auth/token-storage) |
| Cookies across subdomains | Same-origin rules, CORS with credentials | [Same-origin policy](topic:web-fundamentals/same-origin-policy) |
| What she can do | Roles and permissions | [Role-based access control](topic:rest-auth/rbac) |
| Pages she can open | Private routes | [Protected routes](topic:react/protected-routes) |
| Backend | API Gateway + Lambda | [Serverless and Lambda](topic:architecture/serverless-lambda) |

## 🧑‍💻 Key code idea

A JWT that carries the tenant, and a check that refuses a token from another company. Run `npm install jsonwebtoken`, save as `login.js`, then run `node login.js`.

```js
const jwt = require('jsonwebtoken');                       // library to sign and check JWTs
const SECRET = 'demo-secret-only';                         // signing key (real apps load it from a secret store)
function login(user, tenant) {                             // runs after the password check passes
  return jwt.sign(                                         // create a signed token
    { id: user.id, roleId: user.roleId, tenantId: tenant }, // the facts inside: who, what role, which company
    SECRET,                                                // sign with the server's secret
    { expiresIn: '1h' },                                   // 1h = the token stops working after one hour
  );                                                       // end of jwt.sign
}                                                          // end of login
function authorize(cookieToken, tenantHeader) {            // runs before every protected API call
  try {                                                    // jwt.verify throws if the token is bad
    const payload = jwt.verify(cookieToken, SECRET);       // check the signature and the expiry
    if (payload.tenantId !== tenantHeader) return '403 tenant mismatch'; // token from another company → refuse
    return `200 ok (user ${payload.id}, tenant ${payload.tenantId})`; // all good → continue to the handler
  } catch (err) {                                          // bad signature or expired token
    return `401 ${err.message}`;                           // 401 = not logged in
  }                                                        // end of try/catch
}                                                          // end of authorize
const token = login({ id: 'u42', roleId: 'recruiter' }, 'acme'); // Priya logs in at acme
console.log(authorize(token, 'acme'));                     // same company → allowed
console.log(authorize(token, 'globex'));                   // her token used on another company → blocked
console.log(authorize(token + 'x', 'acme'));               // a tampered token → rejected
```

```text
200 ok (user u42, tenant acme)
403 tenant mismatch
401 invalid signature
```

Three cases, three answers: same company → allowed, **another company → 403**, changed token → **401**.

## 🧗 Hard parts and trade-offs

- **Cookies vs a token in localStorage.** HttpOnly cookies can't be read by scripts, so an XSS bug can't steal them. But cookies need CORS set up with credentials, and `SameSite` rules to block cross-site requests (see [token storage](topic:rest-auth/token-storage)).
- **Cookies across subdomains.** The app and the API live on different subdomains. The cookie must be set for the shared parent domain, or the browser won't send it.
- **The frontend can't read the token.** So the app keeps a small readable "logged-in" flag, and asks the server for the user's details and permissions.
- **Frontend checks are for comfort only.** Hiding a page is nice, but the backend must check permissions on **every** request.
- **Expiry.** Short tokens are safer but log people out more. Refresh tokens balance this (see [refresh tokens](topic:rest-auth/refresh-tokens)).

## 🙋 My part

- I worked on the **shared authentication modules** in our common backend library, **together with the team**. [FILL IN: which part of auth you touched — for example the permission checks, the token helpers, or tests.]
- I did not build the whole login flow alone. Don't claim that.

## 🗣️ How to explain it in an interview

> "When a recruiter opens her company's subdomain, DNS points to CloudFront, which serves our React app from S3. The app reads the tenant from the subdomain and sends it with every API call.
>
> On login, the request goes through API Gateway to a Lambda function. It connects to that company's database, checks the user and the account status, and signs a JWT that contains the user id, the role and the tenant. The token goes back in HttpOnly cookies, so JavaScript can't read it. On every later request the server verifies the token and rejects it if the tenant inside doesn't match the request's tenant. Then it checks the user's permission for that action.
>
> I worked on our shared authentication modules with the team, so I know this flow well."

## 🔁 Follow-up questions

### Why HttpOnly cookies and not localStorage?

Scripts can't read HttpOnly cookies, so an XSS attack can't steal the token. localStorage is readable by any script on the page. See [where to store tokens](topic:rest-auth/token-storage).

### What stops a token from Acme being used on Globex's subdomain?

The tenant is inside the signed token. The server compares it with the request's tenant and returns 403 on a mismatch.

### What's the difference between 401 and 403 here?

401 means "you're not logged in" (bad or expired token). 403 means "we know who you are, but you're not allowed" (wrong tenant or missing permission). See [401 vs 403](topic:rest-auth/put-patch-401-403-400-422).

### How does logout work with cookies?

The server clears the cookies, and the frontend clears its stored state and goes to the login page. [FILL IN: how your team handles logout and token expiry.]

### Why does the frontend need CORS with credentials?

The app and the API are on different origins. The browser only sends cookies on cross-origin calls when the request allows credentials and the server allows that exact origin. See [same-origin policy](topic:web-fundamentals/same-origin-policy).

## 📚 Topics to revise

- [Life of an HTTP request](topic:web-fundamentals/http-request-life)
- [JWT login flow end to end](topic:rest-auth/jwt-login-flow)
- [Where to store tokens](topic:rest-auth/token-storage)
- [Role-based access control](topic:rest-auth/rbac)
- [Protected routes](topic:react/protected-routes)
- [Same-origin policy](topic:web-fundamentals/same-origin-policy)
