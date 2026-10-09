---
title: Writing a Dockerfile for a Node.js app
stack: devops
order: 16
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A Dockerfile is a recipe. Docker follows it, step by step, to build an image of your app.
  - "Use a small base image (node:24-alpine), copy package files first, then run npm ci, then copy the code. This keeps builds fast."
  - "Multi-stage builds: build in one stage, copy only what you need into a small final stage."
  - Run the app as a non-root user, and keep secrets out of the image.
  - A .dockerignore file stops node_modules, .env and .git from going into the image.
cards:
  - q: Why copy package.json before the rest of the code?
    a: Docker caches each step. If only your code changes, the slow npm ci step is reused from cache, so builds are much faster.
  - q: What is a multi-stage build?
    a: A Dockerfile with two or more FROM lines. You build in the first stage and copy only the finished files into a small final stage, so the final image is small and has no build tools.
  - q: Why use npm ci --omit=dev in the image?
    a: npm ci installs exactly what package-lock.json says. --omit=dev skips test and build tools, so the image is smaller and safer.
  - q: Why run as a non-root user?
    a: If someone breaks into the app, they get a limited user instead of full control of the container.
  - q: What goes in .dockerignore?
    a: Things the image should never contain, like node_modules, .env files with secrets, .git and logs.
---

## 💡 What is it?

A **Dockerfile** is a text file with steps. Docker reads it and builds an **image**. An image is a packed box with your app, Node.js and everything it needs.

Then you can run that image anywhere. It works the same on your laptop, on a teammate's laptop and on a server.

## 🏠 Real-life example

Think of a **recipe card for a tiffin box**.

- The **recipe card** = the Dockerfile.
- The **steps on the card** (take rice, add curry, close the lid) = the lines in the Dockerfile.
- The **packed tiffin box** = the image.
- **Opening the box and eating** = running a container from the image.
- **Cooking in the big kitchen, then packing only the food** = a multi-stage build. The pots and pans stay in the kitchen. Only the food goes in the box.
- A **list of things that must never go in the box** (dirty spoons, the grocery bill) = `.dockerignore`.

Anyone with the same recipe card gets the same tiffin.

## 🧑‍💻 Code example

Make a folder with an Express app (`npm init -y`, `npm install express`, and a `server.js` that listens on port 3000). Add these two files.

**`.dockerignore`**

```text
node_modules
.env
.git
npm-debug.log
```

**`Dockerfile`**

```dockerfile
# ---------- stage 1: install production packages ----------
FROM node:24-alpine AS deps
# start from a small official image with Node 24 (alpine = tiny Linux)
WORKDIR /app
# all next commands run inside the /app folder
COPY package.json package-lock.json ./
# copy ONLY the package files first, so Docker can cache the install step
RUN npm ci --omit=dev
# install exact versions from the lock file, skipping devDependencies

# ---------- stage 2: the small final image ----------
FROM node:24-alpine
# a fresh, clean image — nothing from stage 1 comes along unless we copy it
ENV NODE_ENV=production
# tell Node and libraries that this is production
WORKDIR /app
# work inside /app again
COPY --from=deps /app/node_modules ./node_modules
# take only the installed packages from stage 1
COPY . .
# copy our code (.dockerignore keeps secrets and junk out)
USER node
# switch from root to the built-in, low-power "node" user
EXPOSE 3000
# note for readers and tools: the app listens on port 3000
CMD ["node", "server.js"]
# start the app; the array form makes Node get stop signals directly
```

Build and run it:

```bash
docker build -t hiring-api .            # build an image named "hiring-api"; the dot means "use this folder"
docker run -p 3000:3000 hiring-api     # run it; map laptop port 3000 to container port 3000
```

**Expected output** (Docker was not available when this page was written, so this is the typical result):

```text
[+] Building 12.4s (11/11) FINISHED
 => [deps 3/3] RUN npm ci --omit=dev
 => [stage-1 4/5] COPY --from=deps /app/node_modules ./node_modules
 => naming to docker.io/library/hiring-api
Server running on port 3000
```

Change one line in `server.js` and build again. The `npm ci` step now says `CACHED`, so the build takes about a second.

## 🔍 Deeper version

**Layer caching.** Every line in a Dockerfile makes a **layer**. Docker reuses a layer if that line and everything before it didn't change. So the order matters:

| Order | What happens when you edit code |
|---|---|
| `COPY . .` then `RUN npm ci` | Every code change re-installs all packages (slow) |
| `COPY package*.json` → `RUN npm ci` → `COPY . .` | Packages are cached; only the code layer is rebuilt (fast) |

**Multi-stage builds.** Put heavy work in early stages: TypeScript compiling, bundling, installing dev tools. The final stage copies only the result, such as `dist/` and production `node_modules`. The final image has no compiler, no test tools and no source maps you don't need. Smaller images download faster and have fewer security holes.

**Picking a base image:**
- `node:24-alpine`: very small. It uses a different C library (musl), so a few native packages may need extra build steps.
- `node:24-slim`: Debian-based and a bit bigger. Native packages usually just work.
- Pin the major version (`node:24`). Never use `node:latest`; it can change under you.

**Security basics:**
- `USER node` so the app doesn't run as root.
- Never `COPY .env` or bake secrets in with `ENV`. Anyone with the image can read them. Pass secrets at run time (see [managing secrets](topic:devops/secrets-management)).
- Scan images for known bugs with a tool like `docker scout` or Trivy.

**Stop signals.** `CMD ["node", "server.js"]` (the "exec form") makes Node process number 1, so it gets the stop signal (SIGTERM) when the container stops. If you use `CMD npm start`, npm may not pass the signal on, and your [graceful shutdown](topic:nodejs/graceful-shutdown) never runs.

**Health checks.** You can add a `HEALTHCHECK` line, or let the platform (ECS, Kubernetes, a load balancer) call a `/health` route. See [health checks](topic:devops/health-checks).

## 🎯 Why do we use it?

- **"Works on my machine" goes away.** The same image runs in development, testing and production.
- **Fast, repeatable deploys.** The server just pulls the image and runs it. Nothing is installed by hand.
- **Small, safe images.** Multi-stage builds and `.dockerignore` keep out secrets and tools you don't need.
- **Easy scaling.** Start more containers from the same image when traffic grows.

## ⚠️ Common mistakes

- **Copying all code before `npm ci`.** Every small code change re-installs everything.
- **Forgetting `.dockerignore`.** Your laptop's `node_modules` (built for macOS) and your `.env` secrets end up in the image.
- **Running as root.** It's the default, so you must switch to `USER node`.
- **Using `npm install` instead of `npm ci`.** You can get different package versions than your lock file says.

## 🗣️ How to answer in an interview

> "A Dockerfile is the recipe Docker uses to build an image of the app. For a Node.js API, I start from a small official image like node:24-alpine. I copy package.json and the lock file first and run npm ci with --omit=dev, and only then copy the source code. That order matters, because Docker caches layers, so code changes don't re-install every package.
>
> I use multi-stage builds when there's a build step, like compiling TypeScript. The first stage builds, and the final stage only copies the output and production packages, so the image stays small. I also add a .dockerignore so node_modules, .env and .git never go in, run the app as the non-root node user, and pass secrets at run time instead of baking them into the image."

[FILL IN: whether you wrote or changed Dockerfiles at work or in personal projects, and for which service.]

## 🔁 Follow-up questions

### What's the difference between an image and a container?

An image is the packed, read-only box. A container is a running copy of that image. You can start many containers from one image. See [Docker basics](topic:devops/docker-basics).

### Why is my image 1 GB? How do you make it smaller?

Use a slim or alpine base image. Use a multi-stage build so build tools stay behind. Install with `--omit=dev`. Add a `.dockerignore`. Check which layers are big with `docker history`.

### How do you pass secrets to a container?

At run time, as environment variables or mounted files from a secret manager. For example `docker run --env-file`, or the platform's secret settings. Never put them in the Dockerfile.

### What's the difference between CMD and ENTRYPOINT?

`ENTRYPOINT` is the fixed program that always runs. `CMD` gives default arguments, which you can change when you run the container. For a simple Node app, `CMD ["node", "server.js"]` is enough.

### Why does the order of lines matter?

Docker caches each layer. When a line changes, that layer and every layer after it rebuild. So put things that change rarely (base image, packages) first, and your code last.

## ✅ Quick check

### 1. You change one line in `server.js`. Which Dockerfile keeps the `npm ci` step cached?

- A) `COPY . .` then `RUN npm ci`
- B) `COPY package*.json ./` then `RUN npm ci` then `COPY . .`

:::answer
**B.** The package files didn't change, so Docker reuses the cached install layer. Only the last `COPY` reruns.
:::

### 2. Where should your Stripe secret key go?

- A) An `ENV STRIPE_SECRET_KEY=...` line in the Dockerfile
- B) Passed at run time from a secret manager or an env file that is not in the image

:::answer
**B.** Anything in the Dockerfile is saved inside the image, and anyone who can pull the image can read it.
:::

### 3. True or false: in a multi-stage build, everything from the first stage is in the final image.

:::answer
**False.** Only what you `COPY --from=` the earlier stage goes into the final image. The rest is thrown away.
:::
