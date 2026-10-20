---
title: "From typing code to a user seeing your app: the whole journey"
stack: web-fundamentals
order: 1
level: Basic
mustKnow: true
askedFrequency: common
summary:
  - "A web app makes a long trip: you write code → Git → a build turns it into plain files → you deploy → a user's browser asks for it → it runs."
  - The browser downloads HTML, CSS and JavaScript as plain files. Your server or Lambda only answers API calls with data.
  - "Before a request even reaches your server, DNS finds the address, then TCP and TLS open a safe connection."
  - Your JavaScript runs in two places. Browser code shows the screen. Server code (Node.js) reads the database and keeps secrets.
  - If you can tell this whole story in order, you can answer most "how does a web app work?" questions.
cards:
  - q: In one line, what happens when a user opens your React app?
    a: The browser finds your server with DNS, downloads index.html, CSS and the JS bundle, runs the JS to draw the screen, then calls your API for data.
  - q: What does the "build" step do?
    a: It turns your source code (TypeScript, JSX, many files) into a few plain, small JavaScript and CSS files that browsers can run.
  - q: Where do the frontend files and the backend live in a typical AWS setup?
    a: Frontend files sit in S3 and are served fast through CloudFront. The backend runs on servers or Lambda behind API Gateway and talks to the database.
  - q: Why does the browser make more than one request to show one page?
    a: The HTML points to other files (CSS, JS, images), and the JS then asks the API for data. Each is a separate HTTP request.
  - q: What is the difference between localhost and production?
    a: On localhost, a dev server on your own computer serves the app. In production, the built files and the backend run on cloud servers that users reach by domain name.
---

## 💡 What is it?

A web app is not one program in one place. It is **code that travels**. You write it, a build tool packs it, a server stores it, and a user's browser downloads and runs it.

This page is the **map** of that whole trip. Each step has its own page in this section. Read this one first, then go deeper.

## 🏠 Real-life example

Think of a **restaurant chain making a new dish**.

- The **chef writes a recipe** at home = you write code on your laptop.
- The recipe goes into the **company recipe book** = you push it to [Git](glossary:repository).
- The **central kitchen prepares ready packs** = the build step makes small, ready files.
- Packs are sent to **every branch** = you deploy to servers and a CDN (copies near users).
- A **customer finds the branch on a map** = DNS finds your server's address.
- The customer **orders at the counter** = the browser sends an HTTP request.
- The **kitchen cooks with stored ingredients** = the server reads the database.
- The **waiter brings the plate** = the response comes back.
- The customer **eats and asks for more** = the page runs JavaScript and calls the API again.

## 🧑‍💻 Code example

This tiny app shows the **three kinds of requests** every web app makes: the page, the JavaScript, and the data. Save it as `mini-app.js`. Run `node mini-app.js`. Then open `http://localhost:4803` in your browser.

```js
const http = require('node:http');                                  // built-in web server

const html = [                                                      // the page, one line per piece
  '<!doctype html>',                                                // "this is a modern HTML page"
  '<h1>Jobs</h1>',                                                  // a heading
  '<ul id="list"></ul>',                                            // an empty list; JavaScript fills it later
  '<script src="/app.js"></script>',                                // "now download and run app.js"
].join('\n');                                                       // glue the lines into one text
const appJs = [                                                     // the code that runs in the BROWSER
  "fetch('/api/jobs')",                                             // ask the server for data
  '  .then((r) => r.json())',                                       // turn the reply into an array
  "  .then((jobs) => { list.innerHTML = jobs.map((j) => '<li>' + j + '</li>').join(''); });", // show each job
].join('\n');                                                       // glue the lines into one text
const jobs = ['Node.js Developer', 'React Developer'];             // pretend this came from a database

http.createServer((req, res) => {                                   // one function handles every request
  if (req.url === '/') {                                            // 1) the browser asks for the page
    res.setHeader('Content-Type', 'text/html');                     //    say "this is HTML"
    return res.end(html);                                           //    send the page
  }                                                                 // end of page route
  if (req.url === '/app.js') {                                      // 2) the page asks for its JavaScript
    res.setHeader('Content-Type', 'text/javascript');               //    say "this is JavaScript"
    return res.end(appJs);                                          //    send the script
  }                                                                 // end of script route
  if (req.url === '/api/jobs') {                                    // 3) the script asks for data
    res.setHeader('Content-Type', 'application/json');              //    say "this is JSON"
    return res.end(JSON.stringify(jobs));                           //    send the data
  }                                                                 // end of API route
  res.statusCode = 404;                                             // anything else does not exist
  res.end('Not found');                                             // tell the browser
}).listen(4803, () => console.log('Open http://localhost:4803'));   // 4803 = the port number
```

I opened it in Chrome and recorded every request. This is the real result:

```text
requests: GET / → GET /app.js → GET /api/jobs
list: [ 'Node.js Developer', 'React Developer' ]
```

**What to notice:**
- One page needed **three requests**, one after another.
- The HTML arrived **first**, with an empty list.
- The browser ran the JavaScript, and **then** the data arrived and filled the list. A real React app works the same way, just with bigger files.

## 🔍 Deeper version

**The whole journey, step by step:**

```text
 YOUR LAPTOP                         THE CLOUD                                THE USER'S BROWSER
 ───────────                         ─────────                                ──────────────────
 1. Write code (TS, JSX)
 2. Run it on localhost  ───────────────────────────────────────────────►  (you test in your own browser)
 3. git push
 4. CI builds it ──► 5. Deploy:  frontend files → S3 + CDN
                                 backend → server / Lambda + API Gateway
                                                                          6. User types the URL
                                                    ◄─── DNS lookup ────  7. "Where is this site?"
                                                    ◄── TCP + TLS ──────  8. Open a safe connection
                                 CDN sends index.html, CSS, JS  ───────►  9. Parse HTML, download CSS/JS
                                                                         10. Run JS, draw the screen
                                 API ◄── HTTP request ──────────────────  11. fetch('/api/…')
                                 API ──► database ──► API ──────────────► 12. Show the data
                                                                         13. User clicks → back to 11
```

Each step, and the page in this section that explains it:

| Step | What happens | Learn more |
|---|---|---|
| 1 | You write TypeScript and JSX in many small files | [How TS becomes JS](topic:web-fundamentals/typescript-compile), [How JSX becomes JS](topic:web-fundamentals/jsx-compile) |
| 2 | A dev server runs your app on your laptop | [localhost and the dev server](topic:web-fundamentals/localhost-dev-server) |
| 3–4 | Git stores it; a pipeline builds it | [What a bundler does](topic:web-fundamentals/what-is-bundler), [dev vs prod build](topic:web-fundamentals/dev-vs-prod-build) |
| 5 | Static files go to S3 + CDN; the backend goes to servers or Lambda | [Hosting the frontend](topic:web-fundamentals/hosting-frontend-aws), [Hosting the backend](topic:web-fundamentals/hosting-backend-aws) |
| 6–8 | DNS, TCP and TLS connect the browser to the server | [Life of an HTTP request](topic:web-fundamentals/http-request-life) |
| 9–10 | The browser reads HTML and CSS, runs JS and paints pixels | [JS in the browser](topic:web-fundamentals/browser-runtime), [HTML/CSS/JS to pixels](topic:web-fundamentals/browser-rendering) |
| 11–12 | The API runs Node.js code and reads the database | [JS in Node.js](topic:web-fundamentals/node-runtime), [Client and server](topic:web-fundamentals/client-server) |
| any | The browser saves files to load faster next time | [Browser caching](topic:web-fundamentals/browser-caching) |

**Two different "programs" run your app.** The browser runs the frontend bundle. Node.js runs the backend. They talk only through HTTP. That's why the two halves can be deployed, scaled and fixed separately.

**Where SkillKeepr fits (public, high level):** the React apps are built into static files served from S3 through CloudFront. The backend is many AWS Lambda functions behind API Gateway, using MongoDB. See [the platform architecture story](topic:resume/platform-architecture).

## 🎯 Why do we use it?

Knowing the whole journey helps you **find problems fast**:
- A blank page with no requests in the Network tab? The problem is **before** your code: DNS, the CDN or the build.
- The page loads but the list is empty? The **API call** failed. Check the request and its status code.
- It works on localhost but not in production? Something differs **between** the steps: an environment variable, a base URL or CORS.

Interviewers love this topic because it shows you understand the **system**, not just one framework.

## ⚠️ Common mistakes

- **Thinking React "runs on the server" in a normal SPA.** In a Vite or webpack React app, the server only sends files. React runs in the browser.
- **Forgetting that the page and the API are separate requests.** A fast page can still show an empty list if the API is slow.
- **Mixing up localhost and production.** On localhost the dev server does extra work, like on-the-fly compiling, which production doesn't do.
- **Skipping the network part.** DNS, TCP and TLS happen before your code runs, and they can be the slow part.

## 🗣️ How to answer in an interview

> "I think of a web app as a journey. I write TypeScript and React code, test it on localhost with a dev server, and push it to Git. A CI pipeline builds it: it compiles TypeScript and JSX, bundles the modules, and minifies the files.
>
> Then the frontend is deployed as static files, for example to S3 behind CloudFront, and the backend is deployed separately, for example as Lambda functions behind API Gateway.
>
> When a user opens the site, DNS finds the address, the browser opens a TCP and TLS connection, and downloads index.html, the CSS and the JS bundle. The browser runs the JavaScript, React draws the screen, and then the app calls the API. The API runs Node.js code, reads MongoDB, and returns JSON. If something breaks, I check where in this chain it broke — DNS, files, the API, or the data."

## 🔁 Follow-up questions

### What exactly is in the "build" output of a React app?

Usually one `index.html`, a few JavaScript files (your code plus libraries, often split into chunks), CSS files, and images. File names often contain a hash, like `index-a1b2c3.js`, so browsers can cache them safely. See [minification and hashed names](topic:web-fundamentals/minify-sourcemaps).

### Is the frontend and backend always on different servers?

No. A small app can serve both from one Node server, like the example above. Bigger apps usually split them. Static files go to a CDN, which is fast and cheap. The API runs where it can scale on its own.

### Where does Next.js fit in this picture?

Next.js can run React **on the server too**. The server sends ready HTML first, then the browser "hydrates" it to make it interactive. See [rendering types in Next.js](topic:nextjs/rendering-types).

### What would you check first if a user says "the site is down"?

Can the domain be resolved? Does the page (index.html) load? Do the JS files load? Does the API respond, and with which status code? The Network tab in DevTools answers most of these in one minute.

## ✅ Quick check

### 1. A user opens a React SPA. In which order do these happen?

- A) The API returns data, then index.html loads
- B) DNS lookup → index.html → JS bundle runs → API call
- C) JS bundle runs → DNS lookup → index.html

:::answer
**B.** The browser must find the server first (DNS), get the HTML, download and run the JS, and only then can the JS call the API.
:::

### 2. In the example, why is the list empty for a moment?

:::answer
The HTML arrives first with an empty `<ul>`. The list fills only after the browser downloads `app.js`, runs it, and the `/api/jobs` reply arrives. That gap is why apps show loading spinners.
:::

### 3. True or false: in a normal Vite or webpack React app, your React components run on the server.

:::answer
**False.** The server only sends the built files. Your components run in the user's browser. (Frameworks like Next.js can also run them on the server.)
:::
