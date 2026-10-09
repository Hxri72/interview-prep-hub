---
title: "Cloud basics: IaaS, PaaS, SaaS"
stack: devops
order: 12
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Cloud computing means renting computers, storage and services over the internet, and paying for what you use.
  - "IaaS = you rent raw servers (EC2). PaaS = you give code, they run it (Railway, Elastic Beanstalk). SaaS = you use a finished app (Gmail, Stripe dashboard)."
  - Serverless (like AWS Lambda) is even more managed — you give a function, and pay only when it runs.
  - The more managed the service, the less work you do — but the less control you have.
  - Big clouds are AWS, Microsoft Azure and Google Cloud (GCP); they run in regions made of availability zones.
cards:
  - q: What is cloud computing?
    a: Renting computing power, storage and ready-made services over the internet from a provider like AWS, instead of buying your own servers. You pay for what you use.
  - q: IaaS vs PaaS vs SaaS?
    a: IaaS — you rent servers and manage the OS and app (EC2). PaaS — you give code and the platform runs it (Railway). SaaS — you just use finished software (Gmail, Slack).
  - q: Where does serverless fit?
    a: Between PaaS and SaaS — you write functions, the provider runs and scales them, and you pay per request (AWS Lambda). Sometimes called FaaS.
  - q: What is a region and an availability zone?
    a: A region is a geographic area (e.g. Mumbai). It has several availability zones — separate data centres — so one failure doesn't take everything down.
  - q: What is the shared responsibility model?
    a: The cloud provider secures the hardware and data centres. You secure what you put on it — your code, data, access rules and settings.
---

## 💡 What is it?

**Cloud computing** means **renting** computers, storage and ready-made services **over the internet**.

You don't buy servers. You use what you need and **pay for what you use**, like an electricity bill.

There are three main levels: **IaaS**, **PaaS** and **SaaS**. They differ in **how much the provider does for you**.

## 🏠 Real-life example

Think about **getting pizza for a class party**.

- **Make it at home from scratch** = your own servers (on-premises). You buy the oven, the flour, everything.
- **Rent a kitchen with an oven** = **IaaS**. The kitchen is ready, but you still make the dough, sauce and toppings yourself.
- **Give your recipe to a pizza shop** = **PaaS**. They bake it with their oven and staff. You only decide the recipe.
- **Order a ready pizza from the menu** = **SaaS**. You just eat it. You don't decide anything about how it's made.

The more someone else does, the **less work** for you — but the **less control** you have over the result.

## 🧑‍💻 Code example

The same small app, deployed three different ways. The commands show who does what. Save the app as `app.js` (it needs only Node, no packages).

```js
const http = require('node:http');                             // Node's built-in web server module
const port = process.env.PORT || 3000;                         // platforms give PORT; 3000 for local runs
http.createServer((req, res) => {                              // create a server that handles every request
  res.end(`Hello from ${process.env.HOST_TYPE || 'my laptop'}\n`); // reply with where it's running
}).listen(port, () => console.log(`Running on ${port}`));      // start listening and log the port
```

Run it locally:

```bash
HOST_TYPE=laptop node app.js        # start the app; HOST_TYPE is just a label
curl http://localhost:3000          # in another terminal: call it
```

```text
Running on 3000
Hello from laptop
```

**IaaS (an EC2 server) — you do almost everything:**

```bash
ssh ubuntu@<server-ip>                # log in to the rented server
sudo apt update && sudo apt install -y nodejs   # YOU install and update the OS packages and Node
node app.js &                          # YOU start the app and keep it running (pm2, systemd…)
# YOU also set up HTTPS, the firewall, backups and OS security patches
```

**PaaS (Railway, Render, Elastic Beanstalk) — you give code:**

```bash
railway up                             # upload code; the platform builds, runs and gives a URL
```

**Serverless (AWS Lambda) — you give a function:**

```bash
# you upload just a handler function; AWS runs it per request and scales to zero when idle
```

## 🔍 Deeper version

**Who manages what:**

| Layer | On-premises | IaaS (EC2) | PaaS (Railway) | Serverless (Lambda) | SaaS (Gmail) |
|---|---|---|---|---|---|
| Hardware, data centre | You | Provider | Provider | Provider | Provider |
| Operating system | You | **You** | Provider | Provider | Provider |
| Runtime (Node) | You | **You** | Provider | Provider | Provider |
| Scaling | You | **You** (or auto-scaling setup) | Mostly provider | Provider | Provider |
| Your code | You | You | You | You (functions) | Provider |
| Your data and access rules | You | You | You | You | You (who can see what) |

**Shared responsibility.** The provider secures the **cloud itself** (buildings, hardware, network). You secure **what you put in the cloud** — your code, your data, IAM permissions, open ports. Most cloud breaches are customer mistakes, like a public S3 bucket.

**Regions and availability zones.** A **region** is a geographic area, like Mumbai or Frankfurt. Each region has several **availability zones (AZs)** — separate data centres with their own power. Running across 2+ AZs means one data-centre problem doesn't take your app down. You pick a region close to users, and one that meets data laws.

**Pricing models.**
- **On-demand** — pay per second/hour, no commitment.
- **Reserved / savings plans** — commit for 1–3 years for a big discount.
- **Spot** — spare capacity, very cheap, but can be taken back with short notice.
- **Serverless** — pay per request and run time; zero cost when idle.

**The big three:** AWS, Microsoft Azure and Google Cloud (GCP). Most services have an equivalent in each (AWS Lambda ≈ Google Cloud Run functions ≈ Azure Functions).

**At SkillKeepr**, the platform runs on AWS with mostly managed and serverless services (Lambda, API Gateway, S3, SQS and more). My voice agent is also hosted on AWS and calls Google Cloud's speech APIs. See [AWS basics](topic:devops/aws-basics) and [GCP basics](topic:devops/gcp-basics).

## 🎯 Why do we use it?

- **No big upfront cost.** Start with a few dollars, not a server room.
- **Scale up and down.** Add servers in minutes for a traffic spike, remove them after.
- **Managed services.** Databases, queues and AI APIs are ready to use, so the team builds features, not infrastructure.
- **Global reach.** Run close to users in many regions.

## ⚠️ Common mistakes

- **Thinking the cloud provider secures everything.** Your settings and permissions are your job.
- **Leaving things running.** Forgotten servers and test databases keep billing you. Set budgets and alerts.
- **Picking IaaS when PaaS is enough.** You end up patching servers instead of building features.
- **Using one availability zone for production.** One outage takes you down.

## 🗣️ How to answer in an interview

> "Cloud computing means renting compute, storage and managed services over the internet and paying for what you use. The levels differ in how much the provider manages. With IaaS, like EC2, I rent a server and manage the OS, runtime and scaling. With PaaS, like Railway, I give code and the platform runs it. With SaaS I just use finished software. Serverless, like Lambda, goes further: I give functions and pay only when they run.
>
> The trade-off is control versus effort — more managed means less work but less control. And security is shared: the provider secures the hardware, I secure my code, data and permissions.
>
> Our platform at work runs on AWS, mostly on managed and serverless services, and I've used Railway for personal projects."

## 🔁 Follow-up questions

### When would you choose IaaS over PaaS or serverless?

When you need full control of the OS or long-running processes, special software (like ffmpeg or LibreOffice), or steady heavy load where a reserved server is cheaper.

### What is "multi-cloud" and is it a good idea?

Using more than one cloud provider. It can avoid lock-in or use a provider's best service (e.g. GCP speech APIs from an AWS app). But running core systems across clouds adds a lot of complexity.

### What is vendor lock-in?

Depending so much on one provider's special services that moving away is very hard. Managed services save time but increase lock-in — it's a trade-off.

### How do you control cloud costs?

Budgets and alerts, tagging resources by team or project, deleting unused resources, right-sizing servers, and using serverless or spot where it fits.

## ✅ Quick check

### 1. Gmail, Slack and the Stripe dashboard are examples of what?

:::answer
**SaaS** — finished software you just use.
:::

### 2. You rent an EC2 server. Who installs OS security patches?

- A) AWS
- B) You

:::answer
**B. You.** With IaaS, the OS and everything above it is your job.
:::

### 3. Why run production in at least two availability zones?

:::answer
So if **one data centre fails**, the app keeps running in the other.
:::
