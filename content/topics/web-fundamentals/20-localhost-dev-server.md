---
title: localhost, ports and what npm run dev does
stack: web-fundamentals
order: 20
level: Basic
mustKnow: true
askedFrequency: common
summary:
  - "localhost (127.0.0.1, or ::1 in IPv6) means 'this same computer'. Requests to it never leave your machine."
  - "A port is a door number on the computer. Each running server listens on its own port, like 5173 for Vite or 3000 for Express."
  - "Listening on 127.0.0.1 = only this computer can connect. Listening on 0.0.0.0 = other devices on your Wi-Fi can connect too (e.g. your phone)."
  - "npm run dev just runs the command in package.json's scripts, using tools from node_modules/.bin. A dev server serves files, compiles them on request, watches for changes and can proxy /api calls to the backend."
  - "'Port already in use' (EADDRINUSE) means another program owns that port. Find it with lsof -i :PORT, stop it, or use another port."
cards:
  - q: What is localhost?
    a: A name for 'this same computer'. It points to 127.0.0.1 (IPv4) or ::1 (IPv6), so the request never leaves your machine.
  - q: What is a port?
    a: A number from 0 to 65535 that says which program on a computer should get the network traffic, like a door number in a building.
  - q: 127.0.0.1 vs 0.0.0.0 when a server listens — what's the difference?
    a: 127.0.0.1 accepts only connections from the same computer. 0.0.0.0 accepts connections on every network interface, so other devices can reach it.
  - q: What does `npm run dev` actually do?
    a: It looks up "dev" in package.json scripts and runs that command (like vite) with node_modules/.bin added to the PATH.
  - q: "How do you fix \"EADDRINUSE: address already in use :::3000\"?"
    a: Another process is on that port. Find it with lsof -i :3000, stop it (kill PID), or start your server on a different port.
---

## 💡 What is it?

When you code, your app runs **on your own laptop**. **localhost** means "this same computer".

A **[port](glossary:port)** is a number that picks **which program** gets a request, like `5173` or `3000`.

`npm run dev` starts a **dev server**. It's a small local web server that shows your app at an address like `http://localhost:5173`.

## 🏠 Real-life example

Think of a **big apartment building**.

- **The building** = your computer. Its address is `127.0.0.1`, or simply "localhost" — "this building".
- **The flat numbers** = ports. Flat 5173 is the frontend (Vite). Flat 3000 is the backend (Express). Flat 27017 is MongoDB.
- **Only one family per flat.** If a second family tries to move into flat 3000, they're told "already taken". That's `EADDRINUSE`.
- **Front door locked to outsiders (127.0.0.1)** = only people inside the building can visit.
- **Front door open to the street (0.0.0.0)** = neighbours from outside can visit too, like your phone on the same Wi-Fi.
- **The watchman who forwards parcels (dev-server proxy)** = he takes a parcel for flat 3000 at the front desk and delivers it, so visitors only talk to one desk.

## 🧑‍💻 Code example

No packages needed. Save this as `servers.mjs`:

```js
import http from 'node:http'; // Node's built-in web server module
const handler = (req, res) => res.end(`hello from ${req.socket.localAddress}:${req.socket.localPort}\n`); // reply with the address that answered
http.createServer(handler).listen(4321, '127.0.0.1', () => console.log('A: listening on 127.0.0.1:4321 (this computer only)')); // loopback only
http.createServer(handler).listen(4322, '0.0.0.0', () => console.log('B: listening on 0.0.0.0:4322 (all network cards)')); // every network interface
```

Start it with `node servers.mjs`. In a second terminal, try:

```bash
curl -sS http://localhost:4321/      # server A, from the same computer (-sS = quiet, but show errors)
curl -sS http://127.0.0.1:4322/      # server B, from the same computer
ipconfig getifaddr en0               # macOS: this laptop's Wi-Fi address (Linux: hostname -I)
curl -sS http://192.168.1.6:4321/    # server A, through the Wi-Fi address
curl -sS http://192.168.1.6:4322/    # server B, through the Wi-Fi address
lsof -nP -i :4321 -sTCP:LISTEN       # which program owns port 4321?
node -e "require('http').createServer().listen(4321,'127.0.0.1').on('error',e=>console.log(e.code, e.message))" # try a second server on the same port
```

Real output (`192.168.1.6` was my laptop's Wi-Fi address — yours will differ):

```text
A: listening on 127.0.0.1:4321 (this computer only)
B: listening on 0.0.0.0:4322 (all network cards)
hello from 127.0.0.1:4321
hello from 127.0.0.1:4322
192.168.1.6
curl: (7) Failed to connect to 192.168.1.6 port 4321 after 1 ms: Couldn't connect to server
hello from 192.168.1.6:4322
COMMAND   PID       USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    29060 hariprasad   12u  IPv4 0x17f065235be43f21      0t0  TCP 127.0.0.1:4321 (LISTEN)
EADDRINUSE listen EADDRINUSE: address already in use 127.0.0.1:4321
```

**What to notice:**
- Server A **failed to connect** through the Wi-Fi address, because it only listens on `127.0.0.1`.
- Server B answered on both, so a **phone on the same Wi-Fi** could open it.
- `lsof` shows the **PID** (process ID). `kill 29060` would free the port.

## 🔍 Deeper version

**The special addresses.**

| Address | Meaning |
|---|---|
| `localhost` | a **name**; your computer turns it into 127.0.0.1 or ::1 |
| `127.0.0.1` | IPv4 **loopback**: traffic goes out and straight back in, never onto the network |
| `::1` | the same loopback in IPv6 |
| `0.0.0.0` (when listening) | "listen on **every** network interface I have" |
| `192.168.x.x` / `10.x.x.x` | your private address on the home or office network |

:::tip[localhost can be IPv4 or IPv6]
On new Node versions, `localhost` may resolve to `::1` first. If a server only listens on `127.0.0.1` and the client tries `::1`, you get "connection refused". Using `127.0.0.1` explicitly avoids the confusion.
:::

**Ports you'll meet.**

| Port | Usually |
|---|---|
| 80 / 443 | HTTP / HTTPS on real websites (no need to type them) |
| 3000 | Express, Next.js, Create React App |
| 5173 | Vite dev server |
| 4173 | `vite preview` |
| 8080 | common backup web port |
| 27017 | MongoDB |
| 5432 | PostgreSQL |
| 6379 | Redis |

Ports below 1024 usually need admin rights. That's why dev servers use high numbers.

**What `npm run dev` does, step by step.**
1. npm reads `"scripts": { "dev": "vite" }` in `package.json`.
2. It adds `node_modules/.bin` to the PATH for this command. That folder holds the tools you installed: `vite`, `tsc`, `esbuild`, `babel`, and others.
3. It runs `vite`. Vite reads its config, picks a port (5173, or the next free one), and starts listening.
4. The dev server then:
   - **serves** `index.html` and your files,
   - **compiles** JSX/TypeScript **on request** ([Vite](topic:web-fundamentals/vite)),
   - **watches** files and pushes updates to the browser ([hot reload](topic:web-fundamentals/hot-reload)),
   - optionally **proxies** API calls to your backend.

**Frontend + backend together, with a proxy.** The React app runs on `localhost:5173`, and Express on `localhost:3000`. Different ports mean **different origins**, so the browser would apply **CORS** rules. A dev-server proxy avoids that:

```js
import { defineConfig } from 'vite'; // Vite's config helper
import react from '@vitejs/plugin-react'; // React support
export default defineConfig({ // the config object
  plugins: [react()], // JSX + Fast Refresh
  server: { port: 4210, proxy: { '/api': 'http://127.0.0.1:4323' } }, // dev port 4210; send /api/* to the backend on 4323
}); // end of config
```

Real test: a tiny backend on port 4323, and the browser-style request to the **dev server's own port** (other headers left out):

```text
$ curl -i http://localhost:4210/api/jobs
HTTP/1.1 200 OK
content-type: application/json
{"path":"/api/jobs","jobs":3}
```

The browser only talked to `localhost:4210`. The dev server forwarded the call. No CORS needed in development. In production you set up CORS or serve both from one domain. See [CORS in Express](topic:express/cors).

**Custom hostnames with `/etc/hosts`.** Some apps read information from the **hostname**. A multi-tenant app might use `acme.app.local` for the tenant "acme". You can map a fake name to your own computer:

```text
# /etc/hosts  (edit with: sudo nano /etc/hosts)
127.0.0.1   acme.app.local
```

Now `http://acme.app.local:3000` reaches your local server. SkillKeepr developers do this locally because the **tenant comes from the hostname** (public-safe).

## 🎯 Why do we use it?

- **Safe, fast testing.** Everything runs on your laptop, with no internet and no real users.
- **Several programs side by side.** Ports let the frontend, backend and database run together.
- **Testing on a real phone.** Listening on `0.0.0.0` (Vite: `--host`) lets your phone open the dev site over Wi-Fi.
- **Knowing this fixes common blockers fast:** "port in use", "connection refused", CORS errors in dev.

## ⚠️ Common mistakes

- **Leaving an old server running.** The next start fails with `EADDRINUSE`. Find it with `lsof -i :PORT` and stop it.
- **Opening `localhost` on your phone.** On the phone, localhost means **the phone itself**. Use your laptop's Wi-Fi address and listen on `0.0.0.0`.
- **Binding to `0.0.0.0` on café Wi-Fi.** Anyone on that network can reach your dev server. Only expose it when you need to.
- **Calling the backend's full URL from the frontend in dev.** It triggers CORS. Use relative `/api` paths with a dev proxy.

## 🗣️ How to answer in an interview

> "localhost is the loopback address, 127.0.0.1 or ::1, so requests never leave my machine. Ports decide which program gets the traffic — Vite usually on 5173, Express on 3000, MongoDB on 27017. If a server listens on 127.0.0.1, only my computer can reach it. If it listens on 0.0.0.0, other devices on the network can, which is how I test on my phone.
>
> `npm run dev` just runs the dev script from package.json with node_modules/.bin on the PATH. The dev server serves my files, compiles JSX and TypeScript on request, watches for changes and pushes updates to the browser. To avoid CORS between the frontend and backend ports, I proxy `/api` through the dev server. When a port is already in use, I find the process with `lsof -i :PORT` and stop it."

[FILL IN: your local setup at SkillKeepr — e.g. how many services you run locally, and whether you used a custom hostname for tenants.]

## 🔁 Follow-up questions

### Why does Vite say "Port 5173 is in use, trying another one…"?

Another program (maybe another Vite app) already owns 5173. By default Vite moves to the next free port. Use `--strictPort` if you'd rather fail than switch.

### What's the difference between `http://localhost:3000` and `https://localhost:3000`?

The protocol. Most dev servers use plain HTTP. HTTPS needs a certificate. Some features (like secure cookies, service workers or the camera) need HTTPS or `localhost`. Browsers treat `localhost` as a "secure context" even on HTTP.

### How does the dev server proxy differ from production?

The proxy exists only in development. In production, either the frontend and the API share one domain (with a CDN or gateway routing `/api`), or the API sets proper CORS headers.

### What happens to my dev server when I close the terminal?

The process stops, and the port is freed. To keep a backend running in production you use a process manager (PM2), a container, or a serverless platform instead.

## ✅ Quick check

### 1. A server listens on `127.0.0.1:3000`. Can your phone on the same Wi-Fi open it?

:::answer
**No.** 127.0.0.1 only accepts connections from the same computer. Listen on `0.0.0.0` (and use the laptop's Wi-Fi address on the phone).
:::

### 2. `npm run dev` prints `EADDRINUSE: address already in use :::5000`. What's the first thing to do?

:::answer
Find what's using port 5000 (`lsof -i :5000`), then stop that process or pick another port. (On macOS, port 5000 is often taken by AirPlay Receiver.)
:::

### 3. Your React app on `localhost:5173` calls `fetch('/api/jobs')`, and Vite proxies `/api` to `localhost:3000`. Which origin does the browser think it talked to?

:::answer
**`http://localhost:5173`** — the dev server. The browser never sees port 3000, so no CORS check is needed.
:::
