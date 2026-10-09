---
title: Serving static files
stack: express
order: 17
level: Basic
mustKnow: false
askedFrequency: sometimes
summary:
  - Static files are files you send exactly as they are, like images, CSS, JavaScript bundles and HTML pages.
  - "In Express you serve a whole folder with one line: app.use(express.static('public'))."
  - "Build the folder path with path.join(__dirname, 'public'), so it works from any start folder."
  - "Use the maxAge option so browsers cache files, and a mount path like '/static' to keep URLs tidy."
  - In big production apps, a CDN or nginx usually serves static files, so Node can focus on the API.
cards:
  - q: What does express.static do?
    a: It is built-in middleware that serves files from a folder. If a file matches the URL, it sends it. If not, it calls next().
  - q: Why use path.join(__dirname, 'public') instead of just 'public'?
    a: "'public' is relative to the folder you start the app from. __dirname is the folder of the file, so the path always works."
  - q: What does app.use('/static', express.static('public')) change?
    a: The files are served under /static, so public/logo.png is at /static/logo.png.
  - q: Does express.static serve hidden files like .env?
    a: No. Dotfiles are ignored by default, so a request for /.env gets a 404.
  - q: Who should serve static files in a big production app?
    a: Usually a CDN or nginx, because they are faster and take load off Node. express.static is fine for small apps and development.
---

## 💡 What is it?

A **static file** is a file the server sends **exactly as it is**. Images, CSS files, JavaScript files and plain HTML pages are static files.

The server doesn't build or change them. It just finds the file and sends it.

Express has a built-in [middleware](glossary:middleware) for this, called `express.static`. With one line, it can serve a whole folder.

## 🏠 Real-life example

Think of a **school library's "free to take" shelf**.

On this shelf, there are printed notes and question papers. Anyone can walk up and take a copy. The librarian doesn't need to write anything new. They just hand over the paper that is already there.

- The **shelf** = the `public` folder.
- The **printed papers** = static files (images, CSS, HTML).
- **Asking for a paper by its name** = the URL, like `/style.css`.
- **The librarian handing it over** = `express.static` sending the file.
- If the paper is **not on the shelf**, the librarian sends you to the next desk. That's `next()`: Express tries the next route.

Some papers are **private**, like the teacher's answer key. They are never put on the shelf. In the same way, secret files like `.env` must never be inside the `public` folder.

## 🧑‍💻 Code example

Set up a folder:

```bash
npm init -y
npm install express
mkdir public
echo '<h1>Hello from a static file!</h1>' > public/index.html
echo 'body { color: navy; }' > public/style.css
```

Save this as `static.js`. Run it with `node static.js`.

```js
const path = require('node:path');                        // Node's built-in tool for building file paths
const express = require('express');                       // load Express

const app = express();                                    // create the app
const publicDir = path.join(__dirname, 'public');         // full path to the "public" folder next to this file

app.use(express.static(publicDir, { maxAge: '1d' }));     // serve files from public/; browsers may cache them for 1 day

app.get('/api/hello', (req, res) => {                     // a normal API route still works next to static files
  res.json({ message: 'Hi from the API' });               // send JSON back
});                                                       // end of the route

app.listen(3000, () => console.log('Open http://localhost:3000')); // start the server on port 3000
```

Try it in a second terminal:

```text
$ curl http://localhost:3000/
<h1>Hello from a static file!</h1>          ← "/" sends public/index.html

$ curl -I http://localhost:3000/style.css
HTTP/1.1 200 OK
Cache-Control: public, max-age=86400        ← 1 day = 86,400 seconds
Content-Type: text/css; charset=utf-8       ← Express set the type from ".css"

$ curl http://localhost:3000/api/hello
{"message":"Hi from the API"}

$ curl -o /dev/null -w "%{http_code}" http://localhost:3000/missing.png
404                                         ← no such file, and no route either
```

## 🔍 Deeper version

**How it works.** For each request, `express.static` checks: "Is there a file in this folder that matches the URL?"
- **Yes** → it sends the file, with the right `Content-Type`.
- **No** → it calls `next()`, so your next routes get a chance.

**Mount path.** You can put the files under a prefix:

```js
app.use('/static', express.static(publicDir)); // public/logo.png is now at /static/logo.png
```

**Order matters.** Middleware runs from top to bottom. If `express.static` comes first, a file called `public/users` would be served before your `/users` route. Most apps put static files under a prefix, or after the API routes.

**Helpful options:**

| Option | What it does |
|---|---|
| `maxAge: '1d'` | Sets `Cache-Control`, so browsers keep the file for 1 day |
| `immutable: true` | Tells browsers "this file will never change". Use it with hashed names like `app.3f9a.js` |
| `index: 'index.html'` | Which file to send for a folder URL like `/` (this is the default) |
| `dotfiles: 'ignore'` | Hidden files like `.env` are not served (this is the default) |
| `etag: true` | Adds an ETag header, so the browser can ask "has it changed?" (on by default) |

**Serving a React app (single-page app).** A React app built with Vite makes a `dist` folder. You serve it with `express.static`. Then you add a "fallback" route that sends `index.html` for every other page URL. In **Express 5**, a catch-all route must have a name: `app.get('/{*splat}', …)`. See [Express 5 changes](topic:express/express-5).

**Production.** Node can serve files, but it's not its best job. In bigger apps:
- A **CDN** (a network of servers around the world) serves images and bundles from a location near the user.
- Or **nginx** sits in front of Node and serves the files.

Then Node only handles the API.

## 🎯 Why do we use it?

- **One line instead of many routes.** Without it, you'd write a route for every image and CSS file.
- **Correct headers for free.** It sets `Content-Type`, `ETag`, `Last-Modified` and caching headers.
- **Safe by default.** It blocks `../` tricks that try to read files outside the folder, and it hides dotfiles.
- **Frontend and backend in one app.** A small project can serve its React build and its API from the same server.

## ⚠️ Common mistakes

- **Using a relative path like `'public'`.** It breaks when you start the app from a different folder. Use `path.join(__dirname, 'public')`.
- **Putting secret files in the public folder.** Anything inside it can be downloaded. Keep `.env`, uploads from users, and backups out of it.
- **Serving uploaded user files with `express.static` without checks.** A user could upload an HTML file with a script inside. Store uploads in cloud storage, or check the file type.
- **Long caching on files that change.** If `style.css` is cached for a year, users won't see your fix. Use long caching only for files with a hash in the name.

## 🗣️ How to answer in an interview

> "Static files are files I send as they are: images, CSS, JS bundles and HTML. In Express I serve a whole folder with the built-in `express.static` middleware. I always build the path with `path.join(__dirname, 'public')`, so it works no matter where the app starts.
>
> If a file matches the URL, it sends it with the right content type and caching headers. If not, it calls next, so my API routes still work. I can mount it under a prefix like `/static`, and I set `maxAge` for caching. For hashed bundle files, I use long caching with `immutable`.
>
> For a small app that's enough. In production at scale, I'd put static files on a CDN or let nginx serve them, so Node only handles API requests."

[FILL IN: how static files or the React build were served in your SkillKeepr projects (CDN, nginx, cloud storage, Express) — only if you know.]

## 🔁 Follow-up questions

### What happens if a static file and a route have the same path?

The one registered **first** wins. If `express.static` is first and the file exists, the file is sent and the route never runs. If the file doesn't exist, `express.static` calls `next()` and the route runs.

### How do you serve a React (Vite) build from Express?

Serve the `dist` folder with `express.static`. Then add a fallback route after your API routes that sends `dist/index.html`. In Express 5, write it as `app.get('/{*splat}', (req, res) => res.sendFile(path.join(distDir, 'index.html')))`. This lets React Router handle page URLs.

### How does browser caching work with static files?

The server sends `Cache-Control: max-age=…`. The browser keeps the file for that long. After that, it asks again with the file's ETag. If nothing changed, the server replies **304 Not Modified** with no body, which saves data.

### Is it safe? Can someone request `/../server.js`?

`express.static` blocks path tricks like `../`, so users can't leave the folder. Dotfiles are ignored by default. The real danger is putting the wrong files *inside* the public folder.

## ✅ Quick check

### 1. With `app.use('/assets', express.static(path.join(__dirname, 'public')))`, what is the URL for `public/img/logo.png`?

- A) `/img/logo.png`
- B) `/assets/img/logo.png`
- C) `/public/img/logo.png`

:::answer
**B.** The mount path `/assets` is added in front. The folder name `public` is not part of the URL.
:::

### 2. A user requests `/report.pdf`, and that file is not in the public folder. What does `express.static` do?

:::answer
It calls `next()`. Express then tries the next middleware or route. If nothing matches, the user gets a **404**.
:::

### 3. Why is `express.static('public')` risky compared to `express.static(path.join(__dirname, 'public'))`?

:::answer
`'public'` is relative to the folder you **started** the app from (`process.cwd()`). If you start it from another folder, the files aren't found. `__dirname` always points to the folder of the file itself.
:::
