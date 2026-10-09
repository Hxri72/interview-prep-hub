---
title: "Docker: images and containers"
stack: devops
order: 15
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Docker packs your app with everything it needs (Node version, packages, files) into an image, so it runs the same everywhere.
  - An image is the recipe (read-only). A container is a running copy of that image. One image can start many containers.
  - A Dockerfile lists the steps to build an image. docker build makes the image; docker run starts a container.
  - Containers are not virtual machines — they share the host's kernel, so they start in seconds and use little memory.
  - Data inside a container is lost when it's removed — use volumes or a database for anything that must stay.
cards:
  - q: Image vs container?
    a: An image is a read-only package (the recipe). A container is a running instance of that image. You can run many containers from one image.
  - q: Why use Docker?
    a: The app runs the same on every machine — laptop, CI, server — because the runtime, packages and files travel together. No more "works on my machine".
  - q: Container vs virtual machine?
    a: A VM includes a full guest operating system and is heavy. A container shares the host's kernel and only packages the app and its libraries, so it's light and fast to start.
  - q: What does -p 3000:3000 mean in docker run?
    a: Map port 3000 on your computer (left) to port 3000 inside the container (right), so you can reach the app at localhost:3000.
  - q: How do you keep data when a container is removed?
    a: Use a volume (docker run -v …) or an external database/S3. The container's own filesystem is thrown away with it.
---

## 💡 What is it?

**Docker** packs your app **together with everything it needs** — the right Node version, the npm packages and your files — into one bundle called an **image**.

When you run the image, you get a **container**: a small, isolated box where your app runs.

Because everything travels together, the app **runs the same on every computer**.

## 🏠 Real-life example

Think of a **tiffin box packed by your mother**.

- The **packing list** ("rice, dal, one spoon, a napkin") = the **Dockerfile**.
- The **packed, sealed tiffin** = the **image**. It's ready and doesn't change.
- **Opening it and eating at school** = running a **container**.
- **Five identical tiffins for five friends** = five containers from one image.
- It tastes the same at school, at the park or on the bus = the app **runs the same everywhere**.
- After lunch, you wash the box — leftovers are gone = data inside a container is **lost when it's removed**.

## 🧑‍💻 Code example

A tiny Node app in Docker. You need Docker Desktop installed. Make a folder with these two files.

`server.js`:

```js
const http = require('node:http');                                  // Node's built-in web server
const port = process.env.PORT || 3000;                              // use PORT if given, else 3000
http.createServer((req, res) => res.end(`Hello from Node ${process.version} in Docker\n`)) // reply with the Node version
  .listen(port, () => console.log(`Listening on ${port}`));         // start the server and log the port
```

`Dockerfile` (no file extension):

```dockerfile
# start from the official Node 24 image, small "slim" version
FROM node:24-slim
# all next commands run inside /app in the image
WORKDIR /app
# copy our server file into the image
COPY server.js .
# document that the app listens on port 3000
EXPOSE 3000
# the command that runs when a container starts
CMD ["node", "server.js"]
```

Build the image and run a container:

```bash
docker build -t hello-node .              # build an image named hello-node from the Dockerfile in this folder (.)
docker run -d -p 3000:3000 --name web1 hello-node   # start a container in the background (-d), laptop 3000 → container 3000
curl http://localhost:3000                # call the app running inside the container
docker ps                                 # list running containers
docker logs web1                          # see what the app printed
docker stop web1 && docker rm web1        # stop and delete the container (the image stays)
```

**Expected output** (Docker isn't installed on the machine that wrote this page, so it wasn't run; IDs and times will differ):

```text
Hello from Node v24.x.x in Docker

CONTAINER ID   IMAGE        COMMAND            STATUS         PORTS                    NAMES
3f2a9c1b7d4e   hello-node   "node server.js"   Up 5 seconds   0.0.0.0:3000->3000/tcp   web1

Listening on 3000
```

Notice: the reply shows **Node v24**, even if your laptop has a different Node version. That's the point of Docker.

## 🔍 Deeper version

**Key words:**

| Word | Meaning |
|---|---|
| **Dockerfile** | Text file of build steps |
| **Image** | Read-only package built from a Dockerfile, made of **layers** |
| **Container** | A running (or stopped) instance of an image |
| **Registry** | Where images are stored and shared — Docker Hub, AWS ECR, GitHub Container Registry |
| **Tag** | A label for an image version, like `hello-node:1.2.0` |
| **Volume** | Storage that lives outside the container, so data survives |
| **Port mapping** | `-p host:container` to reach the app from outside |

**Layers and caching.** Each Dockerfile instruction makes a **layer**. Docker caches layers, so if a step and everything before it haven't changed, it's reused. That's why Node Dockerfiles copy `package.json` **first**, run `npm ci`, and copy the source code **after** — changing code then doesn't reinstall all packages. See [a Dockerfile for Node.js](topic:devops/dockerfile-node).

**Containers vs virtual machines:**

| | Virtual machine | Container |
|---|---|---|
| Includes | A full guest OS + app | Only the app + its libraries |
| Shares the host kernel? | No | Yes |
| Start time | Minutes | Seconds |
| Size | GBs | Often tens to hundreds of MBs |
| Isolation | Stronger | Good, but lighter |

**Containers should be stateless.** Treat a container as **disposable**. Logs go to stdout, files to S3 or a volume, data to a database. Then you can replace or scale containers freely.

**Where containers run in the cloud:** AWS ECS/Fargate, Lambda (container images), Google Cloud Run, Kubernetes, Railway, or a plain EC2 server with Docker. Many apps run several containers together locally with [docker compose](topic:devops/docker-compose).

**At SkillKeepr**, some services that need heavy native tools run as Docker containers on EC2, while the main API is serverless. [FILL IN: how much you've used Docker yourself — local development, writing Dockerfiles, or deploying containers.]

## 🎯 Why do we use it?

- **Same everywhere.** Laptop, CI and production run the identical image.
- **Fast onboarding.** A new developer runs one command instead of installing ten tools.
- **Isolation.** Two apps can use different Node versions on the same machine.
- **Easy deploys and rollbacks.** Deploy image `v1.3`; roll back by running `v1.2` again.
- **Packing heavy tools.** Things like ffmpeg or LibreOffice come inside the image.

## ⚠️ Common mistakes

- **Copying `node_modules` from your laptop** into the image. Add a `.dockerignore` and install inside the image.
- **Storing important data inside the container.** It disappears when the container is removed.
- **Using `:latest` everywhere.** You can't tell which version is running. Use version tags.
- **Putting secrets in the Dockerfile or image.** Pass them as environment variables at run time.
- **Huge images** from full base images and dev dependencies. Use `-slim`/`alpine` and multi-stage builds.

## 🗣️ How to answer in an interview

> "Docker packages an application with its runtime, dependencies and files into an image, so it runs the same on every machine. An image is the read-only recipe, and a container is a running instance of it — I can start many containers from one image.
>
> I write a Dockerfile with steps like FROM a Node base image, copy package.json, install dependencies, copy the code and set the start command. Then docker build creates the image and docker run starts it, with -p to map ports and environment variables for secrets.
>
> Containers are lighter than virtual machines because they share the host's kernel. They should be stateless — data goes to a database, S3 or a volume — which makes scaling and rollbacks easy."

[FILL IN: a real place you used Docker — local MongoDB/Redis, a Dockerfile you wrote, or a containerised service.]

## 🔁 Follow-up questions

### What is the difference between CMD and RUN?

`RUN` executes **while building** the image (e.g. `RUN npm ci`). `CMD` sets the command that runs **when a container starts** (e.g. `CMD ["node", "server.js"]`).

### What is a .dockerignore file?

Like `.gitignore` for Docker builds. It stops files like `node_modules`, `.env` and `.git` from being sent into the build, making builds faster and safer.

### How do containers talk to each other?

On the same Docker network, by service or container name (e.g. `mongodb://mongo:27017`). Docker compose creates that network for you.

### What is a multi-stage build?

A Dockerfile with several `FROM` stages. You build in a full image, then copy only the final output into a small runtime image, so the final image is smaller and has no build tools.

## ✅ Quick check

### 1. You run the same image three times. How many containers do you have?

:::answer
**Three.** One image can start many containers.
:::

### 2. In `docker run -p 8080:3000 hello-node`, which URL opens the app on your laptop?

:::answer
**http://localhost:8080.** The left number is your computer's port; the right is the container's.
:::

### 3. You saved uploaded files inside a container, then ran `docker rm`. What happened to the files?

:::answer
They are **gone**. Use a volume, a database or S3 for anything that must survive.
:::
