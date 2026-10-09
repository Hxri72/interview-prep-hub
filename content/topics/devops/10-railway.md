---
title: Deploying to Railway
stack: devops
order: 10
level: Basic
mustKnow: false
askedFrequency: sometimes
summary:
  - Railway is a PaaS — you give it your code, it builds and runs it, and gives you a public URL. No servers to manage.
  - Connect a GitHub repo (or use the Railway CLI), and every push to the main branch deploys again.
  - Your app must listen on the PORT environment variable that Railway gives it.
  - Secrets go in Railway's Variables tab, never in the code. Databases like Postgres or MongoDB can be added in a few clicks.
  - Great for personal projects and small apps; big companies usually move to AWS/GCP for more control.
cards:
  - q: What is Railway?
    a: A platform-as-a-service. You connect your code, and it builds, runs and hosts it with a public URL, without you managing servers.
  - q: Why must a Node app read process.env.PORT on Railway?
    a: Railway decides the port at runtime and sends traffic there. If the app hard-codes 3000, Railway can't reach it.
  - q: Where do secrets go on Railway?
    a: In the service's Variables tab (environment variables). Railway injects them when the app starts. Never commit them to Git.
  - q: How does a deploy happen?
    a: Push to the connected GitHub branch, or run `railway up`. Railway builds the code (auto-detecting Node), runs the start command and switches traffic to the new version.
  - q: When would you move off Railway?
    a: When you need more control — VPCs, specific AWS services, strict compliance, or cheaper pricing at large scale.
---

## 💡 What is it?

**Railway** is a hosting platform. You give it your code. It **builds** it, **runs** it, and gives you a **public web address**.

You don't set up servers yourself. This kind of service is called a **PaaS** (Platform as a Service). See [cloud basics](topic:devops/cloud-basics).

I used Railway to deploy my **personal projects**.

## 🏠 Real-life example

Think of a **school canteen that cooks your lunch box for you**.

- You bring the **recipe and ingredients** = your code.
- The canteen has the **kitchen, stove and staff** = Railway's servers.
- You don't buy a stove or hire a cook = no servers to manage.
- They give you a **token number** to collect your food = the public URL.
- Secret family spices stay in a **sealed packet**, not written on the recipe = environment variables.

You just focus on the recipe. The kitchen work is done for you.

## 🧑‍💻 Code example

A tiny Express app that is ready for Railway. Setup: `npm init -y`, `npm install express`, then save as `server.js`.

```js
const express = require('express');                   // load Express
const app = express();                                // create the app

app.get('/', (req, res) => {                          // home route
  res.json({ message: 'Hello from Railway', env: process.env.APP_ENV || 'local' }); // APP_ENV comes from Railway Variables
});                                                   // end of home route

app.get('/health', (req, res) => res.send('ok'));     // health check route — the platform can ping this

const port = process.env.PORT || 3000;                // Railway gives PORT; 3000 is only for your laptop
app.listen(port, () => console.log(`Listening on ${port}`)); // start the server on that port
```

In `package.json`, add a start command so Railway knows how to run it:

```bash
npm pkg set scripts.start="node server.js"   # Railway runs `npm start` for Node apps
```

Deploy with the Railway CLI (or connect the GitHub repo in the dashboard):

```bash
npm install -g @railway/cli   # install the Railway command-line tool
railway login                 # opens the browser to log in
railway init                  # create a new project for this folder
railway up                    # upload the code, build it and deploy it
railway variables --set "APP_ENV=production"   # add an environment variable (a secret would go here too)
railway domain                # create a public *.up.railway.app URL
```

**Local run first (real output):**

```text
$ PORT=4000 APP_ENV=test node server.js
Listening on 4000
$ curl http://localhost:4000/
{"message":"Hello from Railway","env":"test"}
```

**Expected after deploy** (the URL is different for every project):

```text
$ curl https://my-app-production.up.railway.app/
{"message":"Hello from Railway","env":"production"}
```

## 🔍 Deeper version

**How Railway builds your app.** It looks at your repo and auto-detects the language. For Node it runs `npm install` (or `npm ci`) and then your `start` script. Its builder is called **Railpack** (it replaced the older Nixpacks builder). If you add a `Dockerfile`, Railway uses it instead, so you control the image fully.

**Services and projects.** A Railway **project** holds several **services**: your API, a database (Postgres, MySQL, MongoDB, Redis), a worker. Services in one project can talk over a **private network**, so the database doesn't need a public address.

**Variables.** Each service has variables. You can reference another service's variable, like `${{Postgres.DATABASE_URL}}`, so the database URL is filled in automatically.

**Deploys.**
- Connect a GitHub repo → each push to the chosen branch deploys again.
- Each deploy is a new **immutable** version. You can **roll back** to an older deploy from the dashboard.
- Pull requests can get their own preview environments.

**Limits to know.**

| Railway is good for | Think twice when |
|---|---|
| Personal projects, demos, small APIs | You need a VPC, IAM roles, many cloud services |
| Fast setup, zero server work | Strict compliance rules |
| A database in one click | Very large scale, where raw cloud is cheaper |

Pricing changes, so check the current plan before you rely on a free tier.

## 🎯 Why do we use it?

- **Speed.** From code to a live URL in minutes.
- **No server work.** No OS updates, no Nginx setup, no SSH.
- **Easy extras.** A database, logs and a domain are a few clicks away.
- **Good for learning and side projects.** You can show a live link on your resume.

## ⚠️ Common mistakes

- **Hard-coding the port** (`app.listen(3000)`). The app starts but Railway can't reach it.
- **Committing `.env`** instead of using the Variables tab.
- **No start script**, so Railway doesn't know how to run the app.
- **Expecting files to stay on disk.** The container's disk is reset on redeploy. Use a volume, a database or S3 for uploads.

## 🗣️ How to answer in an interview

> "I've used Railway for my personal projects. It's a platform-as-a-service: I connect a GitHub repo, it detects Node, installs dependencies and runs my start script, and gives me a public URL. Every push to main deploys again.
>
> Two things matter for a Node app: it must listen on the PORT variable Railway provides, and secrets go in Railway's variables, not in the code. I can add a database in the same project and connect it over the private network.
>
> At work our platform runs on AWS, because we need more control — many services, VPCs and IAM. Railway is great for quick, small deployments."

[FILL IN: name one personal project you deployed on Railway and what it does.]

## 🔁 Follow-up questions

### What happens to uploaded files when Railway redeploys?

They are lost, because each deploy starts from a fresh container. Store files in a volume, a database or object storage like S3.

### How do you roll back on Railway?

Open the service's deployments list and redeploy an older successful deploy. For code, you can also `git revert` and push.

### How is Railway different from AWS?

Railway hides the servers and gives you a simple dashboard. AWS gives you many building blocks (EC2, Lambda, S3, VPC, IAM) with much more control and more work. See [AWS basics](topic:devops/aws-basics).

### How do you see logs?

In the service's Deployments → Logs view, or with `railway logs` in the CLI.

## ✅ Quick check

### 1. Your app logs "Listening on 3000" on Railway but the URL shows an error. What is the likely bug?

:::answer
The app **hard-codes port 3000** instead of using `process.env.PORT`. Railway sends traffic to the port it assigns.
:::

### 2. Where should the database password go?

- A) In `server.js`
- B) In a committed `.env` file
- C) In Railway's Variables for the service

:::answer
**C.** Railway injects variables at start-up. Never put secrets in code or Git.
:::

### 3. Is Railway IaaS, PaaS or SaaS?

:::answer
**PaaS.** You bring the code; the platform runs it. You don't manage servers.
:::
