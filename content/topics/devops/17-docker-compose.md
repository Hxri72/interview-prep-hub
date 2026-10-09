---
title: "docker compose: app + MongoDB + Redis"
stack: devops
order: 17
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - docker compose starts several containers together from one YAML file, compose.yaml.
  - "One command, docker compose up, starts the API, MongoDB and Redis on one private network."
  - Containers find each other by service name, like mongodb://mongo:27017, not localhost.
  - "Use healthcheck plus depends_on: condition: service_healthy, so the API starts only after the database is ready."
  - Volumes keep database data safe when containers are removed.
cards:
  - q: What is docker compose used for?
    a: To run a multi-container app (API, database, cache) with one file and one command, mostly for local development and testing.
  - q: Inside compose, how does the API connect to MongoDB?
    a: By the service name, for example mongodb://mongo:27017. Compose puts all services on one network where names work like hostnames.
  - q: Does depends_on wait until the database is ready?
    a: "Only with a healthcheck and condition: service_healthy. Plain depends_on only waits for the container to start, not for the database to be ready."
  - q: Why add a volume to MongoDB?
    a: So the data lives outside the container. If you remove and recreate the container, the data is still there.
  - q: What's the difference between docker-compose and docker compose?
    a: docker-compose (with a dash) is the old v1 Python tool. docker compose (a space) is the current v2 plugin built into Docker.
---

## 💡 What is it?

Real apps need more than one program. Your API needs a database (MongoDB) and often a cache (Redis).

**docker compose** lets you describe all of them in one YAML file, `compose.yaml`. One command, `docker compose up`, starts them all together. Another command, `docker compose down`, stops them all.

## 🏠 Real-life example

Think of a **school function**.

- The **event plan on one sheet of paper** = `compose.yaml`.
- The **people on the plan**: the stage team, the sound team, the food team = services: `api`, `mongo` and `redis`.
- **"The show starts only after the sound check says OK"** = `depends_on` with a healthcheck.
- The **walkie-talkie channel** everyone shares = the compose network. People call each other by team name, not by phone number.
- The **storeroom** where props stay after the event = a volume. The data stays even when everyone goes home.

## 🧑‍💻 Code example

Put this file next to the Dockerfile from [the Dockerfile topic](topic:devops/dockerfile-node).

**`compose.yaml`**

```yaml
services:                                   # each item below is one container
  api:                                      # our Node.js API
    build: .                                # build the image from the Dockerfile in this folder
    ports:                                  # open a port to your laptop
      - "3000:3000"                         # laptop port 3000 → container port 3000
    environment:                            # settings passed to the app
      MONGO_URL: mongodb://mongo:27017/hiring   # "mongo" = the service name below, used like a hostname
      REDIS_URL: redis://redis:6379         # "redis" = the service name below
    depends_on:                             # start order rules
      mongo:                                # wait for the mongo service…
        condition: service_healthy          # …until its healthcheck says it is healthy
      redis:                                # wait for redis…
        condition: service_started          # …only until it has started
  mongo:                                    # the MongoDB database
    image: mongo:8                          # official MongoDB 8 image
    volumes:                                # keep the data outside the container
      - mongo-data:/data/db                 # named volume "mongo-data" → MongoDB's data folder
    healthcheck:                            # how compose checks that MongoDB is ready
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping')"]   # ask MongoDB to reply to a ping
      interval: 5s                          # check every 5 seconds
      timeout: 3s                           # a check fails if it takes longer than 3 seconds
      retries: 10                           # mark unhealthy after 10 failed checks in a row
  redis:                                    # the Redis cache
    image: redis:7-alpine                   # official small Redis 7 image
volumes:                                    # named volumes used above
  mongo-data:                               # created by Docker and kept between runs
```

Run it:

```bash
docker compose up --build      # build the API image and start all 3 services
docker compose ps              # list the services and their status
docker compose logs -f api     # follow the API's logs
docker compose down            # stop and remove the containers (the volume stays)
```

**Expected output** (Docker was not available when this page was written, so this is the typical result):

```text
[+] Running 4/4
 ✔ Network app_default    Created
 ✔ Container app-redis-1  Started
 ✔ Container app-mongo-1  Healthy
 ✔ Container app-api-1    Started
api-1  | Server running on port 3000
api-1  | Connected to MongoDB
```

Notice `mongo` shows **Healthy** before `api` starts. That's the healthcheck plus `depends_on` at work.

## 🔍 Deeper version

**Networking.** Compose creates one network for the project. Every service can reach every other service by its **service name**. Inside the API container, `localhost` means the API container itself, **not** your laptop and not MongoDB. That's the number one beginner bug.

**Start order vs readiness:**

| Setting | What it waits for |
|---|---|
| `depends_on: [mongo]` (short form) | The mongo container has **started** |
| `condition: service_healthy` | Mongo's healthcheck **passes** |
| `condition: service_completed_successfully` | A one-time job (like a migration) **finished** |

Even with healthchecks, your app should still **retry** its first database connection. In production, databases restart and networks blip.

**Volumes:**
- **Named volume** (`mongo-data:/data/db`): Docker manages it. Best for database data.
- **Bind mount** (`./src:/app/src`): links a laptop folder into the container. Good for live code reload in development.
- `docker compose down -v` also deletes the named volumes, and with them your data. Be careful.

**Environment and secrets.** Compose reads a `.env` file in the same folder to fill in `${VARIABLES}` in the YAML. That's fine for local development. For production secrets, use a real [secret manager](topic:devops/secrets-management).

**Where compose fits.** Compose is great for local development, demos and CI test runs. In production, teams usually use a container platform such as AWS ECS, Kubernetes or a PaaS. Those platforms handle scaling, restarts across machines and rolling deploys.

:::version[Version note]
The old **`docker-compose`** command (v1, written in Python) is retired. Use **`docker compose`** (v2, a Docker plugin). The file is usually named **`compose.yaml`**, and the top-level `version:` key is no longer needed.
:::

## 🎯 Why do we use it?

- **One command to start everything.** New teammates run `docker compose up` instead of installing MongoDB and Redis by hand.
- **Same setup for everyone.** Same database version, same ports, same settings.
- **Easy integration tests.** CI can start the real database in a container, run the tests, then throw it away.
- **Clean laptop.** Stop and remove everything with one command.

## ⚠️ Common mistakes

- **Using `localhost` to reach the database** from inside the API container. Use the service name, `mongo`.
- **Thinking `depends_on` waits for "ready".** Without a healthcheck, it only waits for "started".
- **Running `docker compose down -v` by accident** and deleting your local data.
- **Putting real production secrets** in `compose.yaml` and committing it to Git.

## 🗣️ How to answer in an interview

> "docker compose lets me describe a multi-container app in one YAML file and start it with one command. For a typical Node API, I define three services: the API built from our Dockerfile, MongoDB and Redis. Compose puts them on one network, so the API connects with mongodb://mongo:27017, using the service name instead of localhost.
>
> I add a healthcheck to MongoDB and use depends_on with condition service_healthy, so the API starts only when the database actually answers. I still keep connection retries in the app, because production databases can restart. I use a named volume for the database data. I mainly use compose for local development and CI tests; production runs on a proper container platform or a managed service."

[FILL IN: whether you used docker compose for local development, and for which services. Only if true.]

## 🔁 Follow-up questions

### How would you run integration tests with compose in CI?

Start the database with `docker compose up -d mongo` and wait for it to be healthy. Then run the tests against it and remove everything with `docker compose down -v`. GitHub Actions can also use built-in "service containers" for this.

### What's the difference between a named volume and a bind mount?

A named volume is managed by Docker, which is best for database files. A bind mount links a real folder from your laptop, which is best for live-reloading code during development.

### Is docker compose good for production?

It can run on a single server, but it doesn't handle many machines, auto-scaling or rolling deploys. Most teams use ECS, Kubernetes or a managed platform for production.

### How do you change settings per environment?

Use a `.env` file for local values, or several files merged together, such as `compose.yaml` plus `compose.override.yaml`. Real secrets come from a secret manager.

## ✅ Quick check

### 1. Inside the `api` container, which URL reaches MongoDB?

- A) `mongodb://localhost:27017`
- B) `mongodb://mongo:27017`

:::answer
**B.** Inside a container, `localhost` is the container itself. Compose lets services reach each other by service name.
:::

### 2. You only wrote `depends_on: [mongo]`. The API crashes with "connection refused" on start. Why?

:::answer
The short form only waits until the mongo container **starts**, not until MongoDB is **ready**. Add a healthcheck and `condition: service_healthy`, and retry the connection in the app.
:::

### 3. Which command deletes your local MongoDB data?

- A) `docker compose down`
- B) `docker compose down -v`

:::answer
**B.** `-v` also removes the named volumes, where the data lives. Plain `down` keeps them.
:::
