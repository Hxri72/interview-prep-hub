---
title: "Practice: file upload service"
stack: system-design
order: 19
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Don't send big files through your API server. Give the browser a short-lived presigned URL and let it upload straight to object storage like S3.
  - For big files, use multipart upload — the file goes in parts, in parallel, and a failed part can be retried alone.
  - After upload, a storage event or queue starts background work (virus scan, parsing, thumbnails).
  - Track each file's status (initialized → uploaded → processing → completed or failed) in the database.
  - Check type and size before and after upload, and keep files private with time-limited download links.
cards:
  - q: What is a presigned URL?
    a: A temporary link signed by your server that lets the browser upload (or download) one specific file directly to storage, until it expires.
  - q: Why upload directly to S3 instead of through the API?
    a: The API server doesn't hold big files in memory, request time limits don't matter, and storage handles the heavy traffic.
  - q: What is multipart upload?
    a: Splitting a big file into parts that are uploaded separately, often in parallel, then combined. A failed part can be retried without starting again.
  - q: How does processing start after the upload?
    a: The storage service sends an event (for example S3 ObjectCreated) that triggers a function or adds a job to a queue.
  - q: How do you stop people uploading harmful files?
    a: Limit size and type in the presigned request, check the real file type after upload, run a virus scan, and only then mark the file as usable.
---

## 💡 What is it?

A **file upload service** lets users send files like resumes, videos or images.

The modern way is: the browser asks your API for permission, then **uploads straight to storage** (like Amazon S3) with a **presigned URL**. Your API never carries the heavy file. After the upload, **background workers** scan and process it.

## 🏠 Real-life example

Think of **sending a big parcel through school**.

- You don't carry the parcel into the principal's office. You ask the office for a **signed delivery slip**.
- The slip says: "Allowed: one parcel, to locker 12, **until 4 pm**".
- You take the parcel **straight to the storeroom**. The storekeeper checks the signature and the time, then accepts it.
- A huge parcel is sent in **several boxes**. If one box falls, you resend only that box.
- Later, a teacher **checks the parcel** is safe before anyone can open it.

Map it:
- **Signed delivery slip** = the presigned URL.
- **"Until 4 pm"** = the expiry time.
- **Storeroom** = object storage (S3).
- **Several boxes** = multipart upload.
- **Teacher checking the parcel** = the virus scan and processing.

## 🧑‍💻 Code example

A small model of the presigned-URL idea: the server signs a path and an expiry with a secret; storage checks both. Save as `presign.js` and run `node presign.js`.

```js
const crypto = require('node:crypto');                      // Node's built-in tool for signatures
const SECRET = 'server-only-secret';                        // known only to the server and the storage

function presign(key, expiresAt) {                          // server: make a temporary upload link
  const sig = crypto.createHmac('sha256', SECRET)           // sign with the secret...
    .update(`${key}:${expiresAt}`).digest('hex');           // ...the file path and the expiry time
  return `/upload/${key}?expires=${expiresAt}&sig=${sig.slice(0, 16)}`; // short sig only to keep output tidy
}                                                           // end of presign

function storageAccepts(url, now) {                         // storage: check the link before saving bytes
  const u = new URL(url, 'https://files.example.com');      // read the parts of the link
  const key = u.pathname.replace('/upload/', '');           // which file it is for
  const expires = Number(u.searchParams.get('expires'));    // when it stops working
  const expected = crypto.createHmac('sha256', SECRET)      // recompute the signature
    .update(`${key}:${expires}`).digest('hex').slice(0, 16); // same input → same signature
  if (now > expires) return 'rejected: link expired';       // too late
  if (u.searchParams.get('sig') !== expected) return 'rejected: bad signature'; // someone edited the link
  return `accepted: saving ${key}`;                         // good link → store the file
}                                                           // end of storageAccepts

const url = presign('tenant-acme/resumes/meena.pdf', 1000); // link valid until time 1000
console.log(url);                                           // what the browser receives
console.log(storageAccepts(url, 900));                      // upload in time
console.log(storageAccepts(url, 1200));                     // upload too late
console.log(storageAccepts(url.replace('meena', 'ravi'), 900)); // someone changes the file name
```

**Output:**

```text
/upload/tenant-acme/resumes/meena.pdf?expires=1000&sig=61e429573614e16c
accepted: saving tenant-acme/resumes/meena.pdf
rejected: link expired
rejected: bad signature
```

Real S3 presigned URLs work the same way, using the AWS [signature](glossary:signature) process. You create them with the AWS SDK (`@aws-sdk/s3-request-presigner`).

## 🔍 Deeper version

**1. Requirements**
- Upload resumes (≤ 10 MB) and videos (≤ 2 GB), many at once for bulk uploads.
- Resume after a network drop. Show progress.
- Files private to their tenant. Scan for viruses. Parse resumes, compress videos.
- Show status per file and a final report for bulk uploads.

**2. API**

```text
POST /api/uploads/initialize   { files: [{ name, size, type }] }   → { uploadId, parts: [{ partNumber, url }] }
(browser) PUT <part url>        ← bytes of each part, straight to S3
POST /api/uploads/:id/complete  { parts: [{ partNumber, eTag }] }   → { status: "uploaded" }
GET  /api/uploads/:id           → { status: "processing" | "completed" | "failed", report? }
```

**3. Data model**
- `uploads`: `id`, `tenantId`, `userId`, `key` (storage path), `size`, `type`, `status`, `batchId`, `error`.
- Store files under a per-tenant prefix, like `tenant-acme/resumes/…`.

**4. Architecture**

```text
Browser ──1. initialize──► API (checks quota, type, size; creates multipart upload; signs part URLs)
   │
   └──2. PUT parts in parallel──► S3 (private bucket)
   │
   └──3. complete──► API ──► S3 combines parts
                                │ ObjectCreated event
                                ▼
                          Queue ──► Workers: virus scan → parse / compress → save results
                                                       └► status updates (WebSocket or polling)
```

- **Multipart:** parts are usually 5 MB–100 MB; S3 needs at least 5 MB per part except the last. Failed parts are retried alone. Clean up unfinished uploads with a lifecycle rule.
- **Processing:** an S3 event triggers a function or queue job. Heavy tools (video encoding, document conversion) may need containers, not short-lived functions. See [serverless limits](topic:architecture/serverless-limits).
- **Security:** limit content type and size in the signed request, re-check the real file type after upload, scan before use, keep the bucket private, and give **short-lived presigned download URLs**.
- **Idempotency:** the same file can trigger processing twice. Use the file key or a hash to skip repeats.

**5. Trade-offs**

| Choice | Option A | Option B |
|---|---|---|
| Upload path | Through the API (simple, small files only) | Direct to S3 (scales, a bit more setup) |
| Status updates | Polling (simple) | WebSocket push (live, more moving parts) |
| Processing | Serverless function (no servers) | Container worker (big tools, long jobs) |

**At SkillKeepr (public-safe):** bulk resume uploads use presigned multipart uploads straight to S3; an S3 event puts each file on a queue, workers parse it, and progress is pushed to the browser. [FILL IN: did you work on any part of the upload or parsing flow?]

## 🎯 Why do we use it?

Big files through an API server use lots of memory, hit request time limits and slow down every other user. Direct-to-storage uploads with background processing are faster, cheaper and more reliable. See [large upload crash](topic:debugging/large-upload-crash).

## ⚠️ Common mistakes

- **Long-lived or public upload links.** Anyone with the link can upload or read files.
- **Trusting the file name or the browser's content type.** Check the real type after upload.
- **Processing inside the upload request.** The user waits and requests time out.
- **No cleanup for abandoned multipart uploads.** You pay for parts nobody finished.

## 🗣️ How to answer in an interview

> "I don't send big files through the API. The browser asks the API to start an upload. The API checks quota, size and type, then returns short-lived presigned URLs. For large files I use multipart upload, so parts go to S3 in parallel and a failed part can be retried alone. When all parts are done, the browser tells the API to complete the upload.
>
> S3 then fires an event that puts a job on a queue. Workers virus-scan the file, then parse or compress it, and update the file's status in the database. The user sees progress by polling or WebSocket. Files stay in a private bucket under a per-tenant path, and downloads use short-lived presigned links.
>
> [FILL IN: your real involvement, if any.]"

## 🔁 Follow-up questions

### How do you show upload progress?

The browser knows how many bytes it sent for each part, so it can show upload progress. Processing progress comes from the status in the database, by polling or a WebSocket push.

### How do you resume after a network drop?

Keep the upload ID and the list of finished parts. Ask for new URLs only for the missing parts, then complete the upload.

### How would you speed up 5,000 resume uploads?

Upload in parallel from the browser, process with more workers (within partner rate limits), and skip duplicates by hashing files.

## ✅ Quick check

### 1. In the code, why was the third upload rejected?

:::answer
The time (1200) was after the expiry (1000). Presigned links only work until they expire.
:::

### 2. Why was the last upload rejected even though it was in time?

:::answer
The file name was changed in the URL. The signature was made for `meena.pdf`, so it doesn't match `ravi.pdf`. The link can't be reused for another file.
:::

### 3. Where should a 2 GB video go: through your Express API, or straight to S3?

:::answer
**Straight to S3**, with multipart upload. Through the API it would use lots of memory and likely hit time limits.
:::
