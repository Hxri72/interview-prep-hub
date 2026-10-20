---
title: "Hosting a frontend on AWS: S3, CloudFront, Route 53 and certificates"
stack: web-fundamentals
order: 24
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "The usual AWS setup for a React SPA: a private S3 bucket stores the files, CloudFront (the CDN) serves them, Route 53 points your domain at CloudFront, and ACM gives the HTTPS certificate."
  - The bucket stays private. Only CloudFront may read it, through Origin Access Control (OAC).
  - The certificate for CloudFront must be created in the us-east-1 region.
  - "Cache rule: hashed JS/CSS files for a year (immutable); index.html with no-cache. Map 403/404 to index.html for SPA routes."
  - "Deploy = build, aws s3 sync --delete to the bucket, then a CloudFront invalidation so edges fetch the new files."
cards:
  - q: Which AWS services host a React SPA?
    a: S3 stores the files, CloudFront serves them from edge locations, Route 53 handles the domain, and ACM provides the HTTPS certificate.
  - q: Why keep the S3 bucket private?
    a: So people can't skip CloudFront and its security and caching. CloudFront reads the bucket through Origin Access Control.
  - q: Where must the ACM certificate for CloudFront live?
    a: In us-east-1 (N. Virginia), no matter where your bucket is.
  - q: What are the deploy steps?
    a: npm run build, aws s3 sync dist/ s3://bucket --delete, then aws cloudfront create-invalidation for /index.html (or /*).
  - q: Which files get long caching and which don't?
    a: Hashed JS/CSS get max-age=31536000, immutable. index.html gets no-cache, so users always find the newest file names.
---

## 💡 What is it?

A built React app is just files. On AWS, the common way to put them online uses four services:

- **S3**: storage for the files.
- **CloudFront**: a [CDN](topic:system-design/cdn) that serves the files fast from many places in the world.
- **Route 53**: AWS's DNS. It points your domain at CloudFront.
- **ACM** (AWS Certificate Manager): free certificates for HTTPS.

## 🏠 Real-life example

Think of a **book company with a main warehouse and local shops**.

- The **main warehouse** = the S3 bucket. All the books (files) are stored here. Customers can't walk in.
- The **local shops in every city** = CloudFront edge locations. They keep copies of popular books near customers.
- The **only van allowed into the warehouse** = Origin Access Control. Only CloudFront may fetch from S3.
- The **shop's address in the phone book** = Route 53. It tells people where your shop is.
- The **official stamp on the shop door** = the ACM certificate. It proves the shop is genuine (the HTTPS padlock).
- **Telling shops "throw away the old edition"** = a CloudFront invalidation after you deploy.

## 🧑‍💻 Code example

Before uploading, you decide the cache rule for each file. This small script prints that plan for a `dist/` folder. Run it with `node plan.mjs`.

```js
import { readdirSync } from 'node:fs'; // to list the build files
import path from 'node:path'; // to work with file paths
const files = readdirSync('dist', { recursive: true }).filter((f) => path.extname(f)); // every file in the build folder
for (const file of files) { // decide the cache rule for each file
  const hashed = /-[A-Za-z0-9_]{8}\.(js|css)$/.test(file); // names like index-CnceAJRU.js have a content hash
  const rule = file === 'index.html' // index.html points to the newest hashed files
    ? 'no-cache' // always check for a new version
    : hashed // hashed files never change (a change makes a new name)
      ? 'public, max-age=31536000, immutable' // keep for 1 year (31536000 seconds)
      : 'public, max-age=3600'; // other files: keep for 1 hour
  console.log(file.padEnd(28), '→', rule); // show the plan
} // end of loop
```

Real output for a small build:

```text
favicon.svg                  → public, max-age=3600
index.html                   → no-cache
assets/index-Bx2a9Lmw.css    → public, max-age=31536000, immutable
assets/index-CnceAJRU.js     → public, max-age=31536000, immutable
```

The deploy commands that use this plan (AWS CLI v2). They need AWS credentials, so the output below is **expected output**, not a real run:

```bash
npm run build                                                         # make the production files in dist/
aws s3 sync dist/assets s3://my-app-bucket/assets --delete \
  --cache-control "public, max-age=31536000, immutable"              # hashed files: cache 1 year; --delete removes old files
aws s3 cp dist/index.html s3://my-app-bucket/index.html \
  --cache-control "no-cache"                                          # index.html: always revalidate
aws cloudfront create-invalidation --distribution-id E123ABC --paths "/index.html"  # tell edges to drop the old index.html
```

```text
upload: dist/assets/index-CnceAJRU.js to s3://my-app-bucket/assets/index-CnceAJRU.js
delete: s3://my-app-bucket/assets/index-OLDhash1.js
upload: dist/index.html to s3://my-app-bucket/index.html
{ "Invalidation": { "Id": "I2J3...", "Status": "InProgress" } }
```

## 🔍 Deeper version

**The full request path:**

```text
User types app.example.com
  → Route 53: alias record → CloudFront distribution
  → CloudFront edge (near the user), HTTPS with the ACM certificate
      ├─ file in edge cache and still fresh → returned at once
      └─ not cached → CloudFront fetches from the private S3 bucket (via OAC) → caches → returns
```

**Setup checklist:**

| Step | Detail |
|---|---|
| S3 bucket | Block all public access. No "static website hosting" needed when using CloudFront with OAC |
| CloudFront distribution | Origin = the bucket, with **Origin Access Control (OAC)**. The bucket policy allows only this distribution |
| Default root object | `index.html`, so `/` works |
| SPA fallback | Custom error responses: 403 and 404 → `/index.html`, status 200. See [How a React SPA is served](topic:web-fundamentals/spa-serving) |
| HTTPS | ACM certificate in **us-east-1**, attached to the distribution. Redirect HTTP to HTTPS |
| Domain | Route 53 **alias** A/AAAA record → the distribution. See [Domains, DNS and HTTPS](topic:devops/dns-https) |
| Optional | AWS WAF to block bad traffic, compression on, HTTP/2 and HTTP/3 |

**Why OAC.** OAC (Origin Access Control) replaced the older OAI. The bucket stays fully private, and CloudFront signs its requests to S3. People can't bypass CloudFront to read files directly.

**Why invalidate only `index.html`?** Hashed files get new names on every deploy, so edges have never cached them. Only `index.html` keeps the same name. Invalidating `/*` also works, but it's slower and may cost more past the free monthly quota.

**Many sites, one distribution.** Several subdomains can point to the same CloudFront distribution. A small edge function (CloudFront Functions or Lambda@Edge) can rewrite the request to the right folder in the bucket.

**Cost basics.** You pay for S3 storage, CloudFront data transfer and requests, Route 53 hosted zones and queries, and invalidations past the free quota. ACM public certificates are free. Static hosting like this is usually cheap for small apps. Check the AWS pricing pages for current numbers.

**At SkillKeepr (public-safe level):** the React apps are hosted on S3 behind CloudFront. A deploy syncs the build to S3 and invalidates CloudFront. Tenant subdomains point at a shared distribution. [FILL IN: your own part in this setup, if any.] See [the platform architecture story](topic:resume/platform-architecture).

## 🎯 Why do we use it?

- **Fast everywhere:** files are served from an edge close to each user.
- **Cheap and scalable:** no server to run, and CloudFront handles big traffic spikes.
- **Secure:** private bucket, HTTPS, optional WAF.
- **Simple deploys:** upload files, invalidate, done.

## ⚠️ Common mistakes

- **Making the bucket public** instead of using OAC.
- **Creating the certificate in the wrong region.** CloudFront only sees ACM certificates from us-east-1.
- **Caching `index.html` for a long time.** Users keep loading old code after a deploy.
- **Forgetting the 403/404 → `index.html` rule.** Deep links fail on refresh.
- **Forgetting `--delete`.** Old files pile up in the bucket forever.

## 🗣️ How to answer in an interview

> "For a React SPA on AWS, I build the app and upload the static files to a private S3 bucket. CloudFront sits in front as the CDN, and reads the bucket through Origin Access Control, so the bucket is never public. Route 53 has an alias record pointing the domain at the distribution, and an ACM certificate in us-east-1 gives HTTPS.
>
> For caching, hashed JS and CSS get a one-year immutable cache, and index.html gets no-cache. That way users always pick up the newest file names. I add custom error responses so 403 and 404 return index.html, which makes deep links work. A deploy is npm run build, aws s3 sync with --delete, and a CloudFront invalidation for index.html. At SkillKeepr, our React apps are also hosted on S3 behind CloudFront."

## 🔁 Follow-up questions

### S3 static website hosting or CloudFront?

S3 website hosting is public and HTTP-only on its own. CloudFront adds HTTPS with your domain, edge caching, a private bucket and WAF. For real apps, use CloudFront.

### How do you deploy automatically?

A CI pipeline (like [GitHub Actions](topic:devops/github-actions)) runs the build, then the `aws s3 sync` and `create-invalidation` commands. It uses a role with limited S3 and CloudFront permissions, ideally through OIDC instead of long-lived keys.

### How do you roll back a bad frontend deploy?

Re-upload the previous build (kept as a CI artifact or in a versioned bucket), then invalidate `index.html`. The old hashed files point to the old code.

### How would you serve different apps on different subdomains?

Point each subdomain at a distribution. Either use one distribution per app, or one shared distribution with an edge function that picks the right folder from the host name.

## ✅ Quick check

### 1. In which region must the ACM certificate for CloudFront be created?

:::answer
**us-east-1** (N. Virginia).
:::

### 2. After a deploy, which file must you invalidate in CloudFront?

- A) Every hashed JS file
- B) `index.html`
- C) Nothing

:::answer
**B.** Hashed files have new names, so they were never cached. `index.html` keeps the same name, so the edge may still hold the old one.
:::

### 3. Why map 403 to `/index.html`, not only 404?

:::answer
With a private bucket, S3 returns **403** for a missing key. Deep links like `/jobs/42` come back as 403, so that code must also fall back to `index.html`.
:::
