---
title: The cluster module and PM2
stack: nodejs
order: 25
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - One Node process uses only one CPU core for your JavaScript. A server with 8 cores wastes 7 of them.
  - The cluster module starts many copies (workers) of your app. They all share one port.
  - PM2 is a process manager. It runs your app, restarts it when it crashes, and can run it in cluster mode with one command.
  - Workers don't share memory. Keep shared data (sessions, cache) in Redis or a database.
  - In Docker or Kubernetes, you usually run one process per container and add more containers instead.
cards:
  - q: Why use the cluster module?
    a: One Node process uses one CPU core for JavaScript. Cluster starts one worker per core, so the app uses all cores.
  - q: Do cluster workers share memory?
    a: No. Each worker is a separate process with its own memory. Shared data must live in Redis or a database.
  - q: What is PM2?
    a: A process manager for Node. It keeps the app running, restarts it on crash, runs cluster mode, shows logs and does zero-downtime reloads.
  - q: What does `pm2 start app.js -i max` do?
    a: Starts the app in cluster mode with one worker for each CPU core.
  - q: Cluster vs worker threads?
    a: Cluster = many processes to handle more requests. Worker threads = extra threads inside one process for heavy CPU jobs.
---

## 💡 What is it?

One Node.js process runs your JavaScript on **one CPU core**. A CPU core is one "brain" inside the processor. Most servers have 4, 8 or more cores.

The **cluster module** is built into Node. It starts several copies of your app, called **workers**. Each worker can use a different core. All workers listen on the same port.

**PM2** is a popular tool that does this for you. It also restarts your app if it crashes.

## 🏠 Real-life example

Think of a **school canteen with one counter**.

One person serves all the students. There are 8 counters in the room, but 7 are empty. The line is very long.

So the principal opens all 8 counters. A teacher at the door sends each new student to a free counter.

- **One counter** = one Node process.
- **The 8 counters** = the CPU cores.
- **Each person serving** = a worker.
- **The teacher at the door** = the primary process, which shares out the requests.
- **The canteen manager** who replaces a server who falls sick = PM2.

Each counter has its own cash box. They don't share money. In the same way, workers don't share memory.

## 🧑‍💻 Code example

Save this as `cluster.js`. Run it with `node cluster.js`. Then open http://localhost:3000 a few times.

```js
const cluster = require('node:cluster');                 // built-in module to start many copies of the app
const http = require('node:http');                       // built-in module to make a web server
const os = require('node:os');                           // built-in module to read info about the computer

if (cluster.isPrimary) {                                 // true only in the first process (the "manager")
  const cores = os.availableParallelism();               // how many CPU cores we can use, e.g. 8
  console.log(`Primary ${process.pid} starting ${cores} workers`); // process.pid = this process's ID number
  for (let i = 0; i < cores; i++) cluster.fork();        // start one worker for each core
  cluster.on('exit', (worker) => {                       // runs when a worker dies
    console.log(`Worker ${worker.process.pid} died. Starting a new one.`); // tell us which one died
    cluster.fork();                                      // start a replacement, so the app keeps working
  });                                                    // end of the exit handler
} else {                                                 // this part runs inside each worker
  http.createServer((req, res) => {                      // make a simple web server
    res.end(`Hello from worker ${process.pid}\n`);       // reply with this worker's ID
  }).listen(3000);                                       // all workers share port 3000
  console.log(`Worker ${process.pid} is ready`);         // say that this worker started
}                                                        // end of the worker part
```

**Output (the numbers will be different on your computer):**

```text
Primary 4120 starting 8 workers
Worker 4121 is ready
Worker 4122 is ready
...
```

If you refresh the browser many times, you may see different worker IDs. That shows different workers are answering.

## 🔍 Deeper version

**How cluster works.** The primary process uses `cluster.fork()` to start workers. Each worker is a full, separate Node process. It has its own memory, its own event loop and its own V8 engine. Workers talk to the primary through **IPC** (inter-process communication, a way for processes to send messages to each other).

**How requests are shared.** On Linux and macOS, the primary accepts new connections. Then it hands them to workers in turn. This is called **round-robin** ("one each, in a circle"). On Windows, the operating system decides.

**Workers share nothing.** This is the most important point:
- An in-memory cache in worker 1 is not seen by worker 2.
- Sessions stored in memory break, because the next request may go to another worker.
- WebSockets (Socket.IO) need "sticky sessions" or a Redis adapter.

So keep shared data in **Redis** or the database. Your app must be **stateless** (it keeps no user data in memory between requests).

**PM2.** PM2 is a process manager. It does the cluster work for you, plus more:

| Command | What it does |
|---|---|
| `pm2 start app.js -i max` | cluster mode, one worker per core |
| `pm2 reload app` | restarts workers one by one, with no downtime |
| `pm2 logs` | shows the logs of all workers |
| `pm2 monit` | live CPU and memory for each worker |
| `pm2 startup` + `pm2 save` | starts your apps again after the server reboots |

You can also write the settings in an `ecosystem.config.js` file.

**Cluster vs worker threads.**

| | cluster | worker threads |
|---|---|---|
| What it makes | separate **processes** | threads inside **one** process |
| Memory | not shared | can share some memory (`SharedArrayBuffer`) |
| Best for | serving more requests | one heavy CPU job |

See [worker threads](topic:nodejs/worker-threads).

**Containers.** In Docker or Kubernetes, people usually run **one Node process per container**. To scale, they add more containers behind a load balancer. The platform restarts crashed containers. So you often don't need cluster or PM2 there.

:::version[Version note]
`cluster.isPrimary` replaced the old name `cluster.isMaster` in Node 16. `os.availableParallelism()` is newer than `os.cpus().length` and is the better choice today.
:::

## 🎯 Why do we use it?

- **To use all CPU cores.** One process can't use more than one core for your JavaScript.
- **To stay up.** If one worker crashes, the others keep serving. A new worker starts.
- **To deploy with no downtime.** PM2 reloads workers one by one, so users never see an error page.

## ⚠️ Common mistakes

- **Keeping sessions or cache in memory** while running many workers. Each worker has its own memory, so users get random logouts.
- **Starting more workers than cores.** They fight for CPU time and the app gets slower, not faster.
- **Using cluster for one heavy CPU job.** Cluster helps with many requests. For one big job, use worker threads or a queue.
- **Running PM2 cluster mode inside many containers.** You end up with too many processes. Pick one way to scale.

## 🗣️ How to answer in an interview

> "A single Node process runs my JavaScript on one CPU core. To use all cores on a server, I can use the cluster module. The primary process forks one worker per core, and all workers share the same port. The primary hands out connections round-robin on Linux.
>
> The key point is that workers are separate processes. They don't share memory. So the app must be stateless, and things like sessions and cache go into Redis.
>
> In practice, I'd use PM2 instead of writing cluster code myself. `pm2 start app.js -i max` runs one worker per core. PM2 restarts crashed workers and can reload them one by one with no downtime. In Docker or Kubernetes, I'd usually run one process per container and scale by adding containers."

[FILL IN: how your Node services were run in production at SkillKeepr (PM2, Railway, containers, Lambda?). Only add what is true.]

## 🔁 Follow-up questions

### Why do sessions break when you add cluster?

Each worker has its own memory. A user logs in on worker 1, and the session is saved there. The next request may go to worker 2, which doesn't know the user. Fix: store sessions in Redis, or use JWTs that don't need server memory.

### What is a zero-downtime reload?

PM2 restarts workers **one at a time**. While one worker restarts, the others keep serving. So users never get an error. The command is `pm2 reload <app>`.

### Do you still need cluster in Kubernetes?

Usually not. You run one Node process per container (pod). To handle more load, you add more pods. Kubernetes restarts crashed pods and balances the traffic.

### How many workers should you start?

About one per CPU core. Use `os.availableParallelism()`. More workers than cores makes them fight for the CPU.

## ✅ Quick check

### 1. You store a cart in a JavaScript object inside the app. You run 4 cluster workers. What happens?

:::answer
Users see their cart appear and disappear. Each worker has its own copy of the object. Requests go to different workers. Store the cart in Redis or the database.
:::

### 2. Which command starts an app in PM2 cluster mode with one worker per core?

- A) `pm2 start app.js --watch`
- B) `pm2 start app.js -i max`
- C) `node --cluster app.js`

:::answer
**B.** `-i max` means "as many instances as there are CPU cores".
:::

### 3. True or false: cluster workers share one event loop.

:::answer
**False.** Each worker is a separate process with its own event loop and its own memory.
:::
