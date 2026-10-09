---
title: A large file upload crashes the server
template: scenario
stack: debugging
order: 29
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - The usual cause is keeping the whole file in memory (multer memoryStorage, or reading the body as one buffer).
  - Quick fix — set size and file-count limits, check the file type, and stream to disk or cloud storage instead of memory.
  - Best fix for big files — the browser uploads straight to S3 with presigned URLs. The server never touches the bytes.
  - For very big files, use S3 multipart upload: the file goes in parts, in parallel, and failed parts can be retried.
  - Prevent it with limits on every upload route, monitoring of memory, and tests with large files.
cards:
  - q: Why does a large upload crash a Node server?
    a: The whole file is held in memory (for example multer memoryStorage). A few big uploads at once use up the memory and the process crashes.
  - q: What are the quick fixes in Express?
    a: "Set multer limits (fileSize, files), filter file types, and use diskStorage or stream to cloud storage instead of memoryStorage."
  - q: What is a presigned URL?
    a: A short-lived, signed link from S3 that lets the browser upload one file directly to S3, without sending the bytes through your server.
  - q: When do you use S3 multipart upload?
    a: For big files (S3 needs multipart above 5 GB, and it's recommended from about 100 MB). The file is split into parts that upload in parallel and can be retried one by one.
  - q: How do you know the upload finished?
    a: The browser calls your API to "complete" the upload, or an S3 event (ObjectCreated) triggers your backend.
---

## 💡 What is it?

Small uploads work fine. But when someone uploads a **big file** — a long video or a big ZIP of resumes — the server **crashes or freezes**.

You may see **"JavaScript heap out of memory"** in the logs. Or the server restarts, and other users get errors too.

The usual cause: the server **loads the whole file into memory** before doing anything with it.

## 🏠 Real-life example

Think of **moving books into the school library**.

Bad way: one helper tries to **carry all 500 books in his arms** at once. He drops everything and falls.

Better way: he uses a **trolley and makes many small trips**.

Best way: the delivery truck **drives straight to the library's back door**. The helper only signs the paper.

- **Carrying everything at once** = holding the whole file in memory.
- **The trolley, many small trips** = **streaming** in chunks.
- **A rule: "max 50 books per delivery"** = a **size limit**.
- **The truck at the back door** = the browser uploading **straight to S3**.
- **Signing the paper** = the server only creates a **presigned URL** and records the upload.

## 🔎 Detect

- **Crash logs:** `FATAL ERROR: ... JavaScript heap out of memory`, or the container killed for using too much memory (OOM = out of memory).
- **Memory graph:** memory jumps when a big upload starts.
- **Timing:** it happens only with big files, or when several people upload at once.
- **Other users** see errors at the same time, because the whole process restarted.

## 🐞 Debug

1. **Reproduce it.** Upload a big test file (for example 500 MB) to a local or staging server. Watch memory with `process.memoryUsage()` or your monitoring tool.
2. **Find where the bytes go.** Is multer using `memoryStorage()`? Is the code reading the request into one [buffer](glossary:buffer)? Is a `Buffer.concat` collecting everything?
3. **Check the limits.** Is there any `fileSize` limit? A limit on the number of files?
4. **Check what happens next.** Is the file sent to S3 by reading it fully first (`fs.readFileSync`)? That loads it into memory again.
5. **Check timeouts.** A 2 GB upload through your server can take longer than your proxy or load balancer allows.

## 🔧 Fix

**Before:** the whole file in memory, no limits.

```js
// ❌ BEFORE — every upload sits fully in RAM
const multer = require('multer');                               // upload middleware for Express
const upload = multer({ storage: multer.memoryStorage() });     // keeps the WHOLE file in memory, no size limit

app.post('/resumes', upload.single('file'), async (req, res) => { // accept one file in the "file" field
  await s3.putObject({ Bucket: 'resumes', Key: req.file.originalname, Body: req.file.buffer }); // the full buffer
  res.json({ ok: true });                                       // reply after the upload
});                                                             // end of the route
```

**Quick fix:** limits + a type filter + disk storage (still through the server).

```js
// ✅ QUICK FIX — limits, a type check, and disk instead of memory
const upload = multer({                                         // configure multer
  storage: multer.diskStorage({ destination: '/tmp/uploads' }), // write to a temp folder, not RAM
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },             // max 10 MB per file, only 1 file per request
  fileFilter: (req, file, cb) => {                              // runs before the file is saved
    const ok = ['application/pdf', 'application/msword'].includes(file.mimetype); // allow PDF and Word only
    cb(ok ? null : new Error('Only PDF or Word files'), ok);    // reject anything else
  },                                                            // end of fileFilter
});                                                             // end of multer options
```

A file over the limit makes multer throw a `LIMIT_FILE_SIZE` error. Turn it into a `413 Payload Too Large` in your error middleware. See [file uploads with multer](topic:express/file-uploads).

**Best fix for big files:** the browser uploads **straight to S3** with a presigned URL.

```js
// ✅ BEST FIX — npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');     // the AWS S3 client
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');        // makes signed, short-lived URLs
const crypto = require('node:crypto');                                    // to make a random file name
const s3 = new S3Client({ region: 'ap-south-1' });                        // the S3 region (Mumbai here)

app.post('/uploads/presign', async (req, res) => {                        // step 1: browser asks for an upload URL
  if (req.body.contentType !== 'video/mp4') {                             // allow only the types you expect
    return res.status(400).json({ message: 'Only MP4 videos' });           // 400 = bad request
  }                                                                       // end of the type check
  const key = `videos/${crypto.randomUUID()}.mp4`;                        // a random name, never the user's file name
  const url = await getSignedUrl(                                         // create the signed URL
    s3,                                                                   // using our S3 client
    new PutObjectCommand({ Bucket: 'my-uploads', Key: key, ContentType: 'video/mp4' }), // what the URL allows
    { expiresIn: 300 },                                                   // the URL works for 300 seconds (5 minutes)
  );                                                                      // end of getSignedUrl
  res.json({ url, key });                                                 // browser now PUTs the file to url directly
});                                                                       // end of the route
```

In the browser, the upload goes straight to S3:

```js
const { url, key } = await (await fetch('/uploads/presign', {           // ask our API for a URL
  method: 'POST',                                                       // POST because it creates something
  headers: { 'Content-Type': 'application/json' },                      // we send JSON
  body: JSON.stringify({ contentType: file.type }),                     // tell the API the file type
})).json();                                                             // read the reply as JSON
await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } }); // bytes go to S3, not our server
await fetch('/uploads/complete', {                                      // tell our API the upload is done
  method: 'POST',                                                       // POST to record it
  headers: { 'Content-Type': 'application/json' },                      // we send JSON
  body: JSON.stringify({ key }),                                        // which file finished
});                                                                     // end of the completion call
```

**For very big files**, use **S3 multipart upload**. The server creates the upload and gives the browser one presigned URL per part (for example, 10 MB each). The browser uploads parts in parallel, retries only failed parts, and then the server calls "complete". A single upload can be up to 5 GB. Bigger files must use multipart, and AWS recommends multipart from about 100 MB.

:::note
In serverless setups (like AWS Lambda behind API Gateway), the request body has a small size limit, so presigned direct-to-S3 uploads are the normal way to handle files.
:::

## 🛡️ Prevent

- **A size limit on every upload route** — no exceptions.
- **Never `memoryStorage()` for files that can be big.** Use direct-to-S3 uploads or streams. See [streams](topic:nodejs/streams).
- **Check type and size on the server too.** The browser's checks can be skipped.
- **Random file names** in storage. Never trust the user's file name.
- **Monitor memory** and alert before it reaches the limit.
- **Clean up** half-finished multipart uploads with an S3 lifecycle rule, so you don't pay for them.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "Large uploads usually crash Node because the whole file is held in memory. Quick fix: multer limits, a type filter, and disk or streaming instead of memoryStorage. The real fix for big files is uploading directly from the browser to S3 with presigned URLs — multipart for very large files — so the server never touches the bytes."

**Full version:**

> "I'd see 'heap out of memory' or an OOM kill in the logs, right when big uploads happen. I reproduce it with a large file on staging and watch memory. Usually multer is using memoryStorage, so a 500 MB video becomes a 500 MB buffer — and three at once crash the process.
>
> The quick fix is limits on every upload route — `fileSize` and `files` — a file-type filter, and disk storage or streaming instead of memory. Oversized files get a clean 413.
>
> For big files, the better design is direct-to-S3. The browser asks my API for a presigned URL, uploads straight to S3, and then tells the API it's done, or an S3 event tells us. For very large files I use S3 multipart, so parts upload in parallel and failed parts can be retried. The server only handles small JSON requests, so it stays fast and stable."

[FILL IN: SkillKeepr uploads bulk resumes and interview videos straight to S3 with presigned multipart URLs. Say which part you worked on, if any. Only if true.]

## 🔁 Follow-up questions

### Is a presigned URL safe? Anyone with the link can upload.

It is safe enough when it is short-lived (a few minutes), allows only **one** key and content type, and is only given to a logged-in user after your checks. Check the file again after upload, for example its size and type.

### How do you know when a direct upload finished?

Either the browser calls a "complete" endpoint, or S3 sends an event (`ObjectCreated`) that triggers your backend, for example a Lambda that queues the file for processing.

### How do you show upload progress?

`XMLHttpRequest` has an `upload.onprogress` event (plain `fetch` does not show upload progress). With multipart, you can also count finished parts.

### Why not just raise the server's memory?

It only moves the limit. Ten users uploading at once will hit it again, and you pay for memory all the time. Not holding files in memory solves the real problem.

## ✅ Quick check

### 1. What does `limits: { fileSize: 10 * 1024 * 1024 }` mean?

:::answer
Each file can be at most **10 MB** (10 × 1024 × 1024 bytes). A bigger file makes multer throw a `LIMIT_FILE_SIZE` error.
:::

### 2. Which design keeps a 2 GB video completely off your server?

- A) multer `diskStorage`
- B) multer `memoryStorage`
- C) a presigned S3 URL used by the browser

:::answer
**C.** With a presigned URL, the browser sends the bytes straight to S3. A and B both send the whole file through your server first.
:::

### 3. Why use a random key like `videos/<uuid>.mp4` instead of the user's file name?

:::answer
User file names can clash (two `resume.pdf` files), contain strange characters, or try tricks like `../`. A random name is unique and safe.
:::
