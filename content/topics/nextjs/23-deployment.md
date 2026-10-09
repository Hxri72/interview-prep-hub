---
title: "Deploying Next.js (Vercel, Node server, Docker)"
stack: nextjs
order: 23
level: Basic
mustKnow: false
askedFrequency: sometimes
summary:
  - "Every deployment starts the same way: npm run build makes an optimised production build, and npm start runs it."
  - Vercel (made by the Next.js team) is the easiest host. Connect the Git repo, and each push deploys.
  - You can also run it on any Node.js server (EC2, Railway, Render) with next build + next start.
  - "For Docker, set output: 'standalone' in next.config.ts. Next.js then makes a small folder with server.js and only the files it needs."
  - "output: 'export' makes a fully static site (no server). It only works if you don't need server features."
cards:
  - q: What are the two commands to run Next.js in production?
    a: npm run build (next build) to create the production build, then npm start (next start) to run it.
  - q: What does output 'standalone' do?
    a: It creates .next/standalone with a server.js and only the node_modules files the app needs, so Docker images are much smaller.
  - q: What must you copy next to a standalone build?
    a: The public folder and .next/static. They are not copied into .next/standalone automatically.
  - q: When can you use output 'export'?
    a: When the app is fully static — no Server Actions, no request-time server code. It outputs plain HTML/CSS/JS to the out folder.
  - q: Which Node.js version does Next.js 16 need?
    a: Node.js 20.9 or newer.
---

## 💡 What is it?

Deploying means **putting your app on a server so real users can open it**.

Every Next.js deployment starts with two commands:
- **`npm run build`** creates an optimised production version.
- **`npm start`** runs that version.

Then you pick **where** to run it:
- **Vercel**, the easiest option, made by the Next.js team.
- **Any Node.js server**, like EC2, Railway or Render.
- **Docker**, using the small `standalone` output.

## 🏠 Real-life example

Think of **a school annual-day drama**.

- **Rehearsals** = `npm run dev`. Messy, with a script in hand and many retakes.
- **Final dress rehearsal and packing the props** = `npm run build`. Everything is checked and packed neatly.
- **The actual show** = `npm start`. It runs the packed version for the audience.
- **Booking a ready-made auditorium with lights and staff** = Vercel. They handle almost everything.
- **Using your own school hall** = your own Node.js server. You set up everything yourself.
- **Packing the whole stage into a travel box to perform anywhere** = Docker with `standalone`.

## 🧑‍💻 Code example

Turn on standalone output, build, then run the small server.

**`next.config.ts`**

```ts
import type { NextConfig } from 'next';                          // the type for the config object

const nextConfig: NextConfig = {                                 // our Next.js settings
  output: 'standalone',                                          // make a small self-contained server folder
};                                                               // end of settings

export default nextConfig;                                       // Next.js reads this export
```

**Build and run it** (in the terminal):

```bash
# 1. make the production build (this also creates .next/standalone)
npm run build
# 2. copy static files: standalone does NOT include these by itself
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
# 3. start the small server on port 3000 (PORT and HOSTNAME are read by server.js)
PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

Real output from a Next.js 16 test app:

```text
$ ls .next/standalone
node_modules  package.json  server.js

$ PORT=4311 node .next/standalone/server.js
▲ Next.js 16.4.0
- Local:  http://127.0.0.1:4311
✓ Ready in 0ms

$ curl http://127.0.0.1:4311/api/jobs
[{"id":1,"title":"Node.js Developer"}]
```

## 🔍 Deeper version

**The options compared:**

| Where | How | Good for | Watch out for |
|---|---|---|---|
| **Vercel** | Connect the Git repo; every push deploys; preview URLs per branch | Fastest start; all Next.js features work | Cost at high traffic; vendor-specific extras |
| **Node server** (EC2, Railway, Render) | `next build` then `next start` (often with PM2) | Full control; simple | You handle scaling, HTTPS, restarts |
| **Docker** (`output: 'standalone'`) | Copy the standalone folder into a small image | Kubernetes, ECS, Cloud Run, any container host | Remember to copy `public` and `.next/static` |
| **Static export** (`output: 'export'`) | `next build` writes plain files to `out/` | Simple sites on S3, GitHub Pages or a CDN | No Server Actions or request-time server code |

**What `standalone` does.** Next.js traces which files the server really imports and copies only those into `.next/standalone`, with a tiny `server.js`. Docker images become much smaller than copying all of `node_modules`.

**A simple `Dockerfile` using the standalone output.** Dockerfile comments must sit on their own line, so each step has a comment line above it:

```dockerfile
# build stage: install everything and build the app
FROM node:24-alpine AS build
# work inside /app in the container
WORKDIR /app
# copy package files first (better layer caching)
COPY package*.json ./
# install exact versions from the lockfile
RUN npm ci
# copy the rest of the source code
COPY . .
# create the production build (.next/standalone)
RUN npm run build

# run stage: a small image with only what's needed
FROM node:24-alpine
# work inside /app
WORKDIR /app
# tell Node and Next.js this is production
ENV NODE_ENV=production
# copy the standalone server and its trimmed node_modules
COPY --from=build /app/.next/standalone ./
# copy static build files (JS/CSS chunks)
COPY --from=build /app/.next/static ./.next/static
# copy the public folder (images, favicon)
COPY --from=build /app/public ./public
# the app listens on port 3000
EXPOSE 3000
# start the server
CMD ["node", "server.js"]
```

**A monorepo trap (seen while testing).** If a parent folder has another `package-lock.json`, Next.js may guess the wrong project root. `server.js` then lands in a nested folder. Fix it by setting `outputFileTracingRoot` in `next.config.ts`. Next.js prints a warning about this.

**Self-hosting checklist:**
- Node.js **20.9+** (required by Next.js 16).
- Environment variables: server secrets at runtime; `NEXT_PUBLIC_` ones at **build** time. See [environment variables](topic:nextjs/env-variables).
- A reverse proxy or load balancer for HTTPS.
- If you run **several instances**, they need a shared cache for some features (like incremental regeneration), and the same build.
- Image optimisation runs on your server (it uses the `sharp` package).

:::version[Version note]
Next.js 16 needs **Node.js 20.9 or newer** (from the `engines` field of the 16.4 package). Old guides may show `target: 'serverless'` or `next export` as a command. Both are gone. Today you use `output: 'standalone'` or `output: 'export'` in the config.
:::

## 🎯 Why do we use it?

- **Production builds are fast.** `next build` minifies code, pre-renders static pages and splits bundles. `npm run dev` is never for real users.
- **Choice of host.** Vercel is the quickest. Your own server or Docker gives control, and can be cheaper at scale.
- **Small Docker images.** `standalone` keeps images small, so deploys and cold starts are faster.

## ⚠️ Common mistakes

- **Running `npm run dev` in production.** It's slow and not optimised. Use `build` + `start`.
- **Forgetting to copy `public` and `.next/static`** into a standalone build. The pages load without images, CSS or JS.
- **Expecting `NEXT_PUBLIC_` changes to apply without rebuilding.** They're baked in at build time.
- **Using `output: 'export'` with Server Actions or other server features.** The build fails or the features don't work.

## 🗣️ How to answer in an interview

> "Deployment always starts with next build, which makes an optimised production build, and next start to run it. The easiest host is Vercel: connect the repo and every push deploys, with preview URLs per branch.
>
> For self-hosting, any Node 20.9+ server works with build and start. For Docker, I'd set output to standalone. Next.js then produces a small server.js with only the files it needs, and I copy the public folder and .next/static next to it in a multi-stage Dockerfile. If the site is fully static, output export gives plain files for S3 or a CDN.
>
> I haven't deployed Next.js in production yet. But I deploy Node.js services and React apps, and I've used Railway for personal projects, so the build-and-run idea is familiar."

[FILL IN: once you've deployed the practice project, say where (e.g. Vercel) and add the live link.]

## 🔁 Follow-up questions

### Why does the Dockerfile use two stages?

The first stage has all the build tools and dev dependencies. The second stage copies only the finished standalone output. So the final image is small and contains no source code or build tools.

### How would you deploy to AWS?

Common choices: a Docker image on ECS/Fargate or App Runner, an EC2 instance with `next start` and PM2, or AWS Amplify Hosting. A static export can go to S3 + CloudFront.

### What changes when you run several instances behind a load balancer?

They must use the same build. Features that cache on disk, like incremental regeneration, need a shared cache handler so all instances agree. Also keep server secrets in the platform's settings, not in the image.

### What does `next start` need that a static export doesn't?

A running Node.js server. It handles server rendering, Route Handlers, Server Actions, image optimisation and proxy. A static export has none of these. It's just files.

## ✅ Quick check

### 1. You run `node .next/standalone/server.js` and the page loads with no CSS. What did you forget?

:::answer
To copy `.next/static` (and `public`) into the standalone folder. Standalone doesn't include them by itself.
:::

### 2. Which config makes a plain HTML/CSS/JS site in an `out/` folder?

- A) `output: 'standalone'`
- B) `output: 'export'`
- C) No setting; `npm run dev` does it

:::answer
**B) `output: 'export'`.** Standalone still needs a Node.js server.
:::

### 3. True or false: `npm run dev` is fine for production if traffic is low.

:::answer
**False.** Dev mode is slow, unoptimised and shows dev-only overlays. Always use `next build` + `next start` (or a standalone/static output).
:::
