---
title: "AWS basics: EC2, S3, Lambda, IAM"
stack: devops
order: 13
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "EC2 = rent a virtual server. S3 = store files (objects) in buckets. Lambda = run a function on demand, pay per request. IAM = who is allowed to do what."
  - Other services you'll hear often — API Gateway (HTTP front door), SQS (queue), CloudFront (CDN), CloudWatch (logs and metrics).
  - IAM follows least privilege — give each user, role or Lambda only the exact permissions it needs.
  - Code on AWS should use IAM roles, not hard-coded access keys.
  - In Node, use the AWS SDK for JavaScript v3 — import only the client you need, like @aws-sdk/client-s3.
cards:
  - q: What are EC2, S3 and Lambda in one line each?
    a: EC2 — a virtual server you rent. S3 — object storage for files in buckets. Lambda — run a function per event without managing servers, pay per request.
  - q: What is IAM and what is least privilege?
    a: IAM controls who can do what on AWS (users, roles, policies). Least privilege means giving only the permissions a job truly needs, nothing more.
  - q: Why use an IAM role instead of access keys in code?
    a: Roles give short-lived credentials automatically. Keys in code can leak through Git or logs and give attackers long-term access.
  - q: What do SQS, API Gateway and CloudFront do?
    a: SQS is a message queue for background work. API Gateway is the HTTP front door for Lambdas/APIs. CloudFront is a CDN that serves files fast from locations near users.
  - q: How do you give a browser a file from a private S3 bucket?
    a: Generate a short-lived presigned URL on the server. The browser downloads (or uploads) directly with it, and the bucket stays private.
---

## 💡 What is it?

**AWS** (Amazon Web Services) is the biggest cloud provider. It has **hundreds of services**, but four are the basics:

- **EC2** — rent a **virtual server** (a computer in AWS's data centre).
- **S3** — **store files**, like images, resumes and videos.
- **Lambda** — run a **function** only when something happens. No server to manage.
- **IAM** — decides **who is allowed to do what**.

## 🏠 Real-life example

Think of a **big school campus**.

- **EC2** = renting a **classroom** for the whole year. It's yours; you clean and arrange it.
- **S3** = the **school library shelves**. You store books (files) in labelled sections (buckets).
- **Lambda** = a **guest teacher you call only for one lesson**. You pay only for that lesson.
- **IAM** = the **ID cards and keys**. A student's card opens the library, but not the staff room.
- **API Gateway** = the **front gate with a security guard** who sends visitors to the right room.
- **SQS** = the **suggestion box**. Notes wait there until someone reads them.
- **CloudFront** = **photocopies of the notice kept at every bus stop**, so people don't walk to the office.
- **CloudWatch** = the **CCTV and logbook** that record what happened.

## 🧑‍💻 Code example

**Part 1 — a Lambda handler you can run on your laptop.** Lambda just calls an exported function with an `event`. Save as `handler.mjs` and run `node handler.mjs`.

```js
export const handler = async (event) => {                       // Lambda calls this function for each request
  const name = event.queryStringParameters?.name ?? 'guest';    // API Gateway puts ?name=… here; default is 'guest'
  return {                                                      // API Gateway expects this response shape
    statusCode: 200,                                            // 200 = OK
    headers: { 'Content-Type': 'application/json' },            // tell the browser we send JSON
    body: JSON.stringify({ message: `Hello, ${name}` }),        // the body must be a string
  };                                                            // end of the response object
};                                                              // end of handler

const fakeEvent = { queryStringParameters: { name: 'Hari' } };  // a pretend API Gateway event for local testing
console.log(await handler(fakeEvent));                          // call it like Lambda would and print the result
```

**Output (real run):**

```text
{
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: '{"message":"Hello, Hari"}'
}
```

**Part 2 — upload to S3 and make a presigned URL** with the AWS SDK v3. Setup: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`, and AWS credentials (on Lambda/EC2 these come from the IAM role automatically). Save as `s3.mjs`.

```js
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'; // import only the S3 client
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';                      // helper to make presigned URLs

const s3 = new S3Client({ region: 'ap-south-1' });             // ap-south-1 = Mumbai region
const Bucket = 'my-demo-resumes';                              // bucket name (must already exist)
const Key = 'resumes/asha.txt';                                // the file's path inside the bucket

await s3.send(new PutObjectCommand({ Bucket, Key, Body: 'Asha – Node.js developer' })); // upload the file
const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket, Key }), { expiresIn: 300 }); // link valid for 300 s = 5 min
console.log('Uploaded. Temporary link:', url.slice(0, 60) + '…'); // print the start of the link
```

**Expected output** (needs real AWS credentials and a bucket, so not run here):

```text
Uploaded. Temporary link: https://my-demo-resumes.s3.ap-south-1.amazonaws.com/resumes/as…
```

## 🔍 Deeper version

**The core services:**

| Service | What it is | Typical use |
|---|---|---|
| **EC2** | Virtual servers | Long-running apps, Docker hosts, special tools |
| **S3** | Object storage (files in buckets) | Uploads, backups, static websites, logs |
| **Lambda** | Functions run per event | APIs, cron jobs, queue workers, S3 triggers |
| **IAM** | Identities and permissions | Users, roles, policies |
| **API Gateway** | Managed HTTP/WebSocket front door | Route requests to Lambda |
| **SQS** | Message queue | Background jobs, decoupling services |
| **CloudFront** | CDN | Serve a React app and files fast worldwide |
| **CloudWatch** | Logs, metrics, alarms | Lambda logs, dashboards, alerts |

**IAM in more detail.**
- **User** — a person (or old-style app) with a login or access keys.
- **Role** — a set of permissions that a service (Lambda, EC2) or person can **assume**. It gives **temporary** credentials.
- **Policy** — a JSON document listing allowed actions on resources.

A least-privilege policy for a Lambda that only reads one bucket's `resumes/` folder:

```text
Effect: Allow
Action: s3:GetObject                       ← only "read a file", not delete or list everything
Resource: arn:aws:s3:::my-demo-resumes/resumes/*   ← only this folder
```

**Presigned URLs.** Keep buckets **private**. When a browser needs a file, the server creates a **presigned URL** that works for a few minutes. Uploads work the same way, so big files go **straight from the browser to S3** without passing through your server.

**Lambda facts to know.** Max run time is **15 minutes**. You pay per request and per millisecond × memory. A **cold start** happens when AWS creates a new container. Supported Node runtimes include **Node.js 24**. See [serverless and Lambda](topic:architecture/serverless-lambda) and [serverless limits](topic:architecture/serverless-limits).

**SDK v3.** The modern AWS SDK for JavaScript is **modular**: you import `@aws-sdk/client-s3`, not the whole SDK. Every call is `client.send(new SomeCommand(input))`. v2 (`aws-sdk`) is old and in maintenance mode.

**At SkillKeepr**, the platform uses AWS heavily: many Lambda functions behind API Gateway, S3 for files (with presigned URLs), CloudFront for the React apps, SQS and other services for background work, and EC2 for a few Docker services. My voice agent is also hosted on AWS, and call recordings are stored in S3. [FILL IN: which AWS services you personally set up or changed.]

## 🎯 Why do we use it?

- **Ready building blocks.** Storage, queues, functions and CDNs are a few lines of code away.
- **Scale without servers.** Lambda and S3 grow with traffic automatically.
- **Pay for use.** Idle Lambdas cost nothing.
- **Security tools built in.** IAM, private networks and encryption are standard.

## ⚠️ Common mistakes

- **Hard-coding access keys** in code or `.env` files committed to Git. Use roles.
- **Giving `*` permissions** ("allow everything on everything") to save time.
- **Public S3 buckets** for private files. Use presigned URLs instead.
- **Forgetting the region** — the bucket is in Mumbai but the client points to Virginia.
- **Not setting a budget alert**, then getting a surprise bill.

## 🗣️ How to answer in an interview

> "The basics are EC2 for virtual servers, S3 for file storage, Lambda for running functions on demand, and IAM for permissions. Around them, API Gateway is the HTTP front door for Lambdas, SQS is a queue for background work, CloudFront is the CDN, and CloudWatch holds logs and metrics.
>
> For security, I follow least privilege: each Lambda gets a role with only the actions and resources it needs, and code never contains access keys — the role provides temporary credentials. Private files stay in private buckets and the browser gets short-lived presigned URLs.
>
> Our platform at work runs on AWS — Lambda behind API Gateway, S3 with presigned URLs, CloudFront for the frontends and queues for background jobs — and my voice agent stores its call recordings in S3."

## 🔁 Follow-up questions

### EC2 or Lambda — how do you choose?

Lambda for short, event-driven or spiky work (APIs, triggers, crons). EC2 (or containers) for long-running processes, jobs over 15 minutes, special software or steady heavy load.

### How does a Lambda read secrets?

From environment variables set at deploy time, or better, from AWS Secrets Manager or SSM Parameter Store at start-up, using its IAM role to get permission.

### What is the difference between S3 and a database?

S3 stores whole files (objects) by key; you can't query inside them easily. A database stores structured records you can search, filter and update field by field.

### How do you let a browser upload a 500 MB video?

Use S3 multipart upload with presigned URLs for each part. The browser uploads parts directly to S3, then the server completes the upload.

## ✅ Quick check

### 1. In the Lambda example, what does `body` contain when no `name` is sent?

:::answer
`'{"message":"Hello, guest"}'` — the `?? 'guest'` default is used.
:::

### 2. A Lambda only needs to read files from one folder. Which policy is best?

- A) `s3:*` on `*`
- B) `s3:GetObject` on `arn:aws:s3:::bucket/folder/*`

:::answer
**B.** Least privilege — only the action and the resource it needs.
:::

### 3. Which service would you use to run background jobs one by one from a waiting line?

:::answer
**SQS** (a queue), with a Lambda or worker reading messages from it.
:::
