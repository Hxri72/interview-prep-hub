---
title: "OAuth 2.0 and \"Login with Google\" (overview)"
stack: rest-auth
order: 19
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - OAuth 2.0 lets one app get limited access to a user's account on another service, without ever seeing the user's password.
  - "\"Login with Google\" uses OpenID Connect (OIDC): OAuth plus an ID token that says who the user is."
  - "The normal web flow is the authorization code flow: redirect to Google → user agrees → Google sends back a short code → your server swaps the code for tokens."
  - PKCE (a secret verifier + its hash) protects the code, so a stolen code is useless. Use it for every client today.
  - The "state" value stops CSRF attacks. Always verify the ID token (signature, audience, expiry) before trusting it.
cards:
  - q: What problem does OAuth 2.0 solve?
    a: It lets an app access a user's data on another service (like Google) with the user's permission, without the app ever getting the user's password.
  - q: What is the difference between OAuth 2.0 and OpenID Connect?
    a: OAuth 2.0 is about permission (access tokens to call APIs). OpenID Connect adds identity on top — an ID token that tells you who logged in. "Login with Google" uses OIDC.
  - q: Walk through the authorization code flow.
    a: "Your app redirects the user to Google → the user logs in and agrees → Google redirects back with a short code → your server sends the code (plus client secret / PKCE verifier) to Google → Google returns tokens."
  - q: What is PKCE and why use it?
    a: "Proof Key for Code Exchange. The app makes a random secret (verifier), sends only its hash (challenge) at the start, and the real verifier when swapping the code. A stolen code is useless without the verifier."
  - q: What is the "state" parameter for?
    a: A random value your app sends and checks when the user comes back. It stops CSRF — an attacker can't trick a user into finishing a login the user never started.
---

## 💡 What is it?

**OAuth 2.0** is a standard way for one app to get **limited access** to a user's account on another service. The user gives permission, and the app **never sees the user's password**.

**"Login with Google"** uses **OpenID Connect (OIDC)**. OIDC is OAuth 2.0 plus an extra **ID token**. That token tells your app **who** the user is (name, email).

Your app sends the user to Google. The user logs in **on Google's page** and clicks "Allow". Google then sends your app [tokens](glossary:token) it can trust.

## 🏠 Real-life example

Think of a **school trip permission slip**.

The trip organiser wants to take you to a museum. They don't ask for your parent's house key. Instead, they send a **permission slip**. Your parent signs it at home. The organiser gets only what the slip allows: "one day, this museum, this child".

- The **organiser** = your app (the "client").
- **You** = the user.
- Your **parent** = Google (the "authorization server"). Only they can say yes.
- The **house key** = your Google password. The organiser never gets it.
- The **signed slip** = the access token. It allows only certain things, for a short time.
- The **slip's list of rules** ("museum only, one day") = the **scope**.
- The **ID card printed on the slip** = the ID token. It says who you are.

## 🧑‍💻 Code example

This builds the **"Login with Google" URL** with PKCE, using only Node's built-in `crypto`. Save it as `pkce.js` and run `node pkce.js`. (The verifier is fixed here so your output matches. In real code, it must be random for every login.)

```js
const crypto = require('node:crypto');                         // Node's built-in crypto module

const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'; // a secret random string (fixed here so the output matches the RFC example)
const codeChallenge = crypto                                    // the challenge = a hash of the verifier
  .createHash('sha256')                                         // use the SHA-256 hash function
  .update(codeVerifier)                                         // feed in the verifier
  .digest('base64url');                                         // turn the bytes into URL-safe text

const params = new URLSearchParams({                           // the query string for Google's login page
  client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com',       // your app's id from Google Cloud Console
  redirect_uri: 'http://localhost:3000/auth/callback',          // where Google sends the user back
  response_type: 'code',                                        // "code" = authorization code flow
  scope: 'openid email profile',                                // openid = we want an ID token (who the user is)
  state: 'x7Kq2',                                               // random value to stop CSRF; checked on return
  code_challenge: codeChallenge,                                // PKCE: the hashed verifier
  code_challenge_method: 'S256',                                // PKCE: which hash we used
});                                                             // end of params

console.log('code_challenge:', codeChallenge);                  // show the challenge
console.log('https://accounts.google.com/o/oauth2/v2/auth?' + params); // the URL the "Login with Google" button opens
```

**Output:**

```text
code_challenge: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&response_type=code&scope=openid+email+profile&state=x7Kq2&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256
```

The challenge matches the example in the official PKCE standard (RFC 7636). The browser opens this URL, and the user logs in on Google's own page.

## 🔍 Deeper version

**The four roles in OAuth:**

| Role | In "Login with Google" |
|---|---|
| **Resource owner** | the user |
| **Client** | your app |
| **Authorization server** | Google's login and token service |
| **Resource server** | the API with the data (for example, Google Calendar) |

**The authorization code flow with PKCE, step by step:**
1. Your server makes a random `code_verifier`, a random `state`, and the `code_challenge` (SHA-256 of the verifier). It saves the verifier and state in the user's session. (Making and checking a hash uses a [hash](glossary:hash) function.)
2. The browser is sent to Google's `/authorize` URL (like the one above).
3. The user logs in and agrees to the **scopes** (what the app may see).
4. Google redirects to your `redirect_uri` with `?code=...&state=...`.
5. Your server checks that `state` matches the saved one. If not, it stops. This blocks [CSRF](glossary:csrf), where another site tricks the user's browser into finishing a login.
6. Your server POSTs to Google's **token endpoint** with the `code`, the `code_verifier`, the `client_id` and (for server apps) the `client_secret`.
7. Google returns an **access token**, an **ID token** and sometimes a **refresh token**.
8. Your server **verifies the ID token**, finds or creates the user, and starts **your own** session (cookie or your own JWT).

**Access token vs ID token:**
- **Access token**: lets your app **call an API** (like Google Calendar). It's meant for the API, not for you to read.
- **ID token**: a **JWT** about the user (`sub`, `email`, `name`). Verify its signature (with Google's public keys), `iss`, `aud` (must be your client id) and `exp` before trusting it.
- Use `sub` (the user's stable id at Google) as the link to your user record. The email can change.

**Why the "code" step?** The code travels through the browser, where it's easier to steal. It's short-lived and useless alone. The real tokens are fetched **server-to-server**, so they never pass through the browser address bar.

**Flows to know by name:**
- **Authorization code + PKCE**: web apps, SPAs and mobile apps. This is the default today.
- **Client credentials**: one server talking to another, with no user. (See [API keys and service-to-service auth](topic:rest-auth/api-keys).)
- **Implicit flow**: old. Tokens came back directly in the URL. **Don't use it.**
- **Password grant**: the app collects the user's password. **Don't use it.**

:::version[Version note]
**OAuth 2.1** (a draft that pulls together today's best practice) makes **PKCE required for all clients** and removes the implicit and password flows. Even before 2.1 is final, security guidance already recommends PKCE everywhere, including server apps that also have a client secret.
:::

**In Node.js**, you rarely write all of this by hand. Libraries like `openid-client` or Passport strategies (`passport-google-oauth20`) handle discovery, PKCE, token exchange and ID token checks. But interviewers want you to know the steps.

## 🎯 Why do we use it?

- **Users don't share passwords** with every app. They log in only on the provider's page.
- **Less password risk for you.** With "Login with Google", you don't store or hash a password at all.
- **Limited, revocable access.** Scopes limit what the app can do. The user can remove access any time from their Google account.
- **Faster sign-up.** One click instead of a new password and an email check.
- **Integrations.** The same flow connects apps to calendars, ATS systems and CRMs on behalf of a user.

## ⚠️ Common mistakes

- **Skipping the `state` check.** This opens the door to CSRF (login CSRF).
- **Trusting the ID token without verifying it** (signature, `aud`, `iss`, `exp`).
- **Using the email as the user's permanent id** instead of `sub`.
- **Putting the client secret in frontend code.** Anything in the browser is public. Use PKCE, and do the token exchange on the server.
- **Using the old implicit flow** because an old tutorial showed it.

## 🗣️ How to answer in an interview

> "OAuth 2.0 lets an app get limited access to a user's account on another service without seeing their password. For 'Login with Google' we use OpenID Connect, which is OAuth plus an ID token that says who the user is.
>
> The flow I'd use is the authorization code flow with PKCE. My server makes a random code verifier and state, and redirects the user to Google with the hashed verifier. The user logs in on Google and agrees to the scopes. Google redirects back with a short-lived code. My server checks the state, then swaps the code plus the verifier for tokens, server to server.
>
> Then I verify the ID token — signature, audience, issuer and expiry — and use the `sub` claim to find or create the user. After that, I start my own session with an HttpOnly cookie. I never use the implicit flow, and I never put a client secret in the frontend."

[FILL IN: any OAuth integration you worked on (for example connecting an ATS, calendar or CRM account). Only add it if it's true.]

## 🔁 Follow-up questions

### Is OAuth for authentication or authorization?

OAuth 2.0 itself is for **authorization**: giving an app access to an API. **Authentication** (knowing who the user is) comes from **OpenID Connect** on top of it, through the ID token. See [authentication vs authorization](topic:rest-auth/authn-vs-authz).

### Why not just send the access token back in the URL?

URLs end up in browser history, logs and the `Referer` header. A short-lived code in the URL is less risky. The real tokens are fetched server-to-server, and PKCE makes a stolen code useless.

### After "Login with Google", should I keep using Google's access token as my app's session?

No. Google's tokens are for calling **Google's** APIs. After you verify who the user is, create **your own** session or JWT for your API.

### How does a server-to-server integration authenticate with no user present?

With the **client credentials** flow: the service sends its own client id and secret to get an access token. Or with API keys, depending on the provider.

### Where do you store refresh tokens from a provider?

On the **server only**, **encrypted** in the database, linked to the user or company. Never in the browser.

## ✅ Quick check

### 1. Which flow should a new single-page app use for "Login with Google"?

- A) Implicit flow
- B) Authorization code flow with PKCE
- C) Password grant

:::answer
**B.** Authorization code with PKCE is the recommended flow for SPAs, mobile apps and server apps. Implicit and password grant are outdated.
:::

### 2. An attacker steals the `code` from the redirect URL. With PKCE, can they get tokens?

:::answer
**No.** To swap the code for tokens, Google also needs the original `code_verifier`. Only the real app has it. Google checks that its hash equals the `code_challenge` sent at the start.
:::

### 3. Which claim should you use to link a Google login to your user record: `email` or `sub`?

:::answer
**`sub`.** It's Google's stable, unique id for that user. Emails can change, so they are not a safe permanent link.
:::
