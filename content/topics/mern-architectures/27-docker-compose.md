---
title: Docker Compose for a MERN app
stack: mern-architectures
order: 27
level: Intermediate
mustKnow: false
askedFrequency: common
template: pattern
section: Deployment
summary:
  - "Docker Compose starts the whole MERN app (MongoDB, the Express API and the React app) with one command: docker compose up."
  - "Each part runs in its own container, described as a 'service' in a compose.yaml file."
  - "Services talk to each other by service name, e.g. the API connects to mongodb://mongo:27017."
  - "A named volume keeps MongoDB data safe when containers are removed."
  - "Compose is mainly for local development and simple single-server setups; production usually uses ECS, Kubernetes or a PaaS."
cards:
  - q: What does Docker Compose do?
    a: It starts several containers together from one YAML file, with their networks, ports, environment variables and volumes.
  - q: How does the API container reach the MongoDB container?
    a: By the service name as the hostname, e.g. mongodb://mongo:27017, because Compose puts all services on one network.
  - q: Why use a named volume for MongoDB?
    a: So the database files survive when the container is stopped or removed.
  - q: Does depends_on wait until MongoDB is ready?
    a: Only if you add a healthcheck and use condition service_healthy. Plain depends_on only waits for the container to start.
  - q: Which command starts and builds everything?
    a: "docker compose up --build (add -d to run it in the background)."
---

## 💡 What is it?

A MERN app has three parts: MongoDB, the Express API, and the React app. On a new laptop, setting all three up takes time.

**Docker** packs each part into a [container](glossary:container): a box with the app and everything it needs. **Docker Compose** starts all the boxes together from one file, with one command.

So a new teammate runs `docker compose up` and gets the whole app running.

## 🏠 Real-life example

Think of **a school function**. You need a sound system, a stage, and a food counter.

Without a plan, the teacher calls each vendor one by one. Each one needs different instructions. With an **event plan sheet**, one page lists every vendor, where they stand, what they need, and who talks to whom. The organiser hands over the sheet, and everything is set up together.

| School function | Docker Compose |
|---|---|
| The event plan sheet | `compose.yaml` |
| Each vendor | A service (mongo, api, web) |
| Each vendor's own van with their equipment | A container |
| "Sound team, talk to the stage team on channel 2" | Services call each other by name on a shared network |
| The storeroom that keeps things after the event | A volume (keeps MongoDB data) |
| "Organiser, start everything!" | `docker compose up` |

## 🗺️ The diagram

```text
 Your laptop
 ┌──────────────────────── docker compose network ────────────────────────┐
 │                                                                        │
 │  ┌──────────┐   http://localhost:5173    ┌──────────┐                  │
 │  │   web    │◀──────── browser ──────────│  (you)   │                  │
 │  │ React +  │                            └──────────┘                  │
 │  │  Vite    │── /api calls ──▶ localhost:4000                          │
 │  └──────────┘                     │                                    │
 │                              ┌──────────┐  mongodb://mongo:27017  ┌─────────┐
 │                              │   api    │────────────────────────▶│  mongo  │
 │                              │ Express  │                         │ MongoDB │
 │                              └──────────┘                         └────┬────┘
 │                                                                        │
 └────────────────────────────────────────────────────────────── volume: mongo-data
```

## 🧑‍💻 Code example

Folder layout:

```text
my-mern-app/
├── compose.yaml
├── api/        (Express app: package.json, server.js, Dockerfile)
└── web/        (React + Vite app: package.json, src/, Dockerfile)
```

`api/Dockerfile`:

```dockerfile
# start from the official Node 24 image (small "alpine" Linux version)
FROM node:24-alpine
# all following commands run inside /app in the container
WORKDIR /app
# copy only the package files first, so Docker can cache the install step
COPY package*.json ./
# install exact versions from package-lock.json, without dev tools
RUN npm ci --omit=dev
# now copy the rest of the source code
COPY . .
# document that the app listens on port 4000
EXPOSE 4000
# the command that starts the API
CMD ["node", "server.js"]
```

`compose.yaml` at the root:

```yaml
services:                                   # each entry below is one container
  mongo:                                    # service name; also the hostname others use
    image: mongo:8                          # official MongoDB 8 image
    volumes:                                # keep data outside the container
      - mongo-data:/data/db                 # named volume -> MongoDB's data folder
    healthcheck:                            # how Compose knows Mongo is ready
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.runCommand({ ping: 1 })"]  # ping the server
      interval: 5s                          # check every 5 seconds
      retries: 10                           # give up after 10 failed checks

  api:                                      # the Express backend
    build: ./api                            # build the image from api/Dockerfile
    ports:                                  # open ports to your laptop
      - "4000:4000"                         # laptop port 4000 -> container port 4000
    environment:                            # env variables for the API
      PORT: "4000"                          # the port Express listens on
      MONGO_URL: mongodb://mongo:27017/app  # "mongo" = the service name above; "app" = database name
    depends_on:                             # start order
      mongo:                                # wait for the mongo service
        condition: service_healthy          # ...until its healthcheck passes

  web:                                      # the React frontend (Vite dev server)
    build: ./web                            # build from web/Dockerfile
    ports:                                  # open the Vite port
      - "5173:5173"                         # laptop 5173 -> container 5173
    environment:                            # env variables for Vite
      VITE_API_URL: http://localhost:4000   # the BROWSER calls the API, so use localhost, not "api"
    depends_on:                             # start after the API
      - api                                 # plain start order is enough here

volumes:                                    # named volumes used above
  mongo-data:                               # Docker creates and keeps this one
```

Run it from the root folder:

```bash
docker compose up --build      # build images and start all three
docker compose logs -f api     # follow the API's logs
docker compose down            # stop and remove containers (data stays in the volume)
```

## 🔍 Deeper version

**Container-to-container vs browser-to-container.** This confuses many people.
- The **API container** talks to Mongo inside Docker's network. So it uses the service name: `mongo:27017`.
- The **browser** runs on your laptop, outside Docker. So it calls the API on `localhost:4000`, through the published port.

**`depends_on` is about start order, not readiness.** Without `condition: service_healthy`, the API can start before MongoDB accepts connections. Add a healthcheck, or let Mongoose retry.

**Dev vs prod images.**
- In dev you often mount your code as a **bind mount** (`./api:/app`) and run `nodemon` or `node --watch`, so changes reload without a rebuild.
- In prod, the web service shouldn't run the Vite dev server. Use a **multi-stage build**: stage 1 runs `npm run build`, stage 2 copies `dist/` into Nginx. Or serve it from S3 + CloudFront.

**Compose in production.** On one server, `docker compose up -d` is fine for small apps. For many servers, auto-scaling and rolling updates, teams use ECS, Kubernetes, or a PaaS that accepts Docker images. See [deployment options](topic:mern-architectures/deployment-options).

More Docker basics: [Docker basics](topic:devops/docker-basics), [a Dockerfile for Node](topic:devops/dockerfile-node), [Docker Compose](topic:devops/docker-compose).

:::version[Version note]
Compose v2 is the `docker compose` command (with a space), built into Docker. The old `docker-compose` tool is retired. The top-level `version:` key in the file is no longer needed.
:::

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| One command starts the whole stack | Docker uses a lot of RAM on laptops |
| Same versions for everyone ("works on my machine" goes away) | File watching and hot reload can be slow on Mac/Windows |
| Easy to add Redis, a queue, or Mongo Express later | Not a full production orchestrator |
| Great for running integration tests in CI | One more tool for the team to learn |

## 🎯 When to choose it

- **A team of 3+ developers** who need the same MongoDB, Redis and Node versions.
- **Onboarding**: new people run one command on day one.
- **Integration tests in CI** that need a real MongoDB.
- **Small production apps on one VPS.**
- **Skip it** for a solo project where `npm run dev` and a free Atlas cluster already work well.

## ⚠️ Common mistakes

- **Using `localhost` inside the API to reach Mongo.** Inside a container, `localhost` is the container itself. Use `mongo`.
- **No volume for MongoDB.** `docker compose down` then deletes all your data.
- **Copying `node_modules` into the image.** Add a `.dockerignore` with `node_modules`, so the image installs its own Linux versions.
- **Putting real secrets in `compose.yaml`** and committing it. Use an `.env` file that is in `.gitignore`.

## 🗣️ How to answer in an interview

> "I use Docker Compose to run the full MERN stack locally with one command. The compose file has three services: mongo with a named volume for data, the Express API built from its Dockerfile, and the React app.
>
> Inside the Docker network, services reach each other by name. So the API's connection string is `mongodb://mongo:27017`, while the browser still calls the API on localhost through a published port. I add a healthcheck on Mongo and `depends_on` with `service_healthy`, so the API starts only when the database is ready.
>
> For production I wouldn't run the Vite dev server. I'd build static files and serve them from a CDN, and run the API on ECS, a PaaS, or serverless."

[FILL IN: whether you have used Docker or Docker Compose in a real project. If only in personal practice, say so honestly.]

## 🔁 Follow-up questions

### What's the difference between an image and a container?

An image is the packed recipe (read-only). A container is a running copy of that image. One image can run as many containers.

### What's the difference between a volume and a bind mount?

A named volume is storage that Docker manages, good for database data. A bind mount links a folder on your laptop into the container, good for live code reload in dev.

### How do you pass secrets to Compose?

Put them in a `.env` file next to `compose.yaml` (not committed) and reference them as `${JWT_SECRET}`. Or use `env_file:` on a service.

### How do you view the database inside Compose?

Add a `ports: ["27017:27017"]` mapping to mongo and connect with MongoDB Compass from your laptop. Or add a `mongo-express` service.

## ✅ Quick check

### 1. Inside the api container, which connection string works: `mongodb://localhost:27017` or `mongodb://mongo:27017`?

:::answer
**`mongodb://mongo:27017`.** `localhost` inside a container means that container itself. The service name is the hostname on the Compose network.
:::

### 2. You run `docker compose down` and start again. Your MongoDB data is gone. What did you forget?

:::answer
A **volume** for `/data/db`. Without it, the data lived only inside the removed container.
:::

### 3. True or false: plain `depends_on: [mongo]` waits until MongoDB accepts connections.

:::answer
**False.** It only waits for the container to start. Use a healthcheck plus `condition: service_healthy`.
:::
