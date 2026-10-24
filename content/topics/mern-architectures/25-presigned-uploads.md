---
title: File uploads straight to S3 (presigned URLs)
stack: mern-architectures
order: 25
level: Intermediate
mustKnow: false
askedFrequency: common
template: pattern
section: State, auth and files
summary:
  - "Instead of sending files through Express, the browser uploads them straight to S3 using a presigned URL."
  - "Express only creates the presigned URL: a short-lived link that allows one upload to one key."
  - "This keeps big files off your server, so it stays fast and cheap, and it works well with Lambda's size limits."
  - "After the upload, the browser tells the API, and the API saves the file key in MongoDB."
  - "Always check the user, limit the file type and size, and make the URL expire in a few minutes."
cards:
  - q: What is a presigned URL?
    a: A short-lived S3 link, signed with your AWS credentials on the server, that lets the browser upload or download one specific file without having AWS keys.
  - q: Why not upload files through Express?
    a: Big files use server memory, bandwidth and time. Lambda also limits request size. Uploading straight to S3 avoids all of this.
  - q: Which AWS SDK v3 pieces create an upload URL?
    a: "PutObjectCommand from @aws-sdk/client-s3 and getSignedUrl from @aws-sdk/s3-request-presigner."
  - q: What should you store in MongoDB after the upload?
    a: The S3 object key (and maybe size and type), not the file itself and not the temporary URL.
  - q: How do you stop users uploading huge or wrong files?
    a: Check type and size before signing, use a short expiry, and for strict size limits use a presigned POST with a content-length-range condition.
---

## 💡 What is it?

Users often upload files: resumes, profile photos, videos. The simple way sends the file to Express, and Express sends it to storage. That makes your server carry every byte.

A **[presigned URL](glossary:presigned-url)** is a better way. Express creates a special short-lived link. The browser uploads the file **straight to Amazon S3** (AWS file storage) with that link. Your server never touches the file.

## 🏠 Real-life example

Think of **sending a big parcel through your school**.

The old way: you give the parcel to the school office. The office carries it to the post office. The office staff get tired, and the queue at the office grows.

The better way: the office gives you a **signed, dated permission slip**. It says "This student may drop one parcel in locker B-12 today until 4 pm". You walk to the post office yourself and drop it. Then you tell the office "Done, it's in B-12".

| School | App |
|---|---|
| School office | Your Express API |
| Post office lockers | Amazon S3 |
| Signed permission slip | Presigned URL |
| "Until 4 pm" | The URL's expiry time |
| "Locker B-12" | The S3 object key (file name/path) |
| "Done, it's in B-12" | The browser calls the API to save the key in MongoDB |

## 🗺️ The diagram

```text
 ┌─────────┐ 1. "I want to upload resume.pdf"  ┌──────────┐
 │ React   │ ────────────────────────────────▶ │ Express  │  checks login, type, size
 │ browser │ ◀──────── 2. presigned URL ─────── │   API    │  signs URL (5 min)
 └────┬────┘                                    └────┬─────┘
      │ 3. PUT file bytes directly                    │
      ▼                                               │
 ┌─────────┐                                          │
 │   S3    │                                          │
 └─────────┘                                          │
      │ 4. "Upload done, key = users/42/resume.pdf"   │
      └──────────────────────────────────────────────▶│ 5. save key in MongoDB
```

## 🧑‍💻 Code example

You need an AWS account, an S3 bucket, and AWS credentials on your machine. The bucket also needs a CORS rule that allows `PUT` from `http://localhost:5173`.

Set up:

```bash
npm init -y
npm install express @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Save as `upload-url.js`. Run with `BUCKET=my-bucket node upload-url.js`.

```js
const express = require('express');                                        // load Express
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');      // S3 client and the "upload" command
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');         // turns a command into a signed URL
const crypto = require('node:crypto');                                     // built-in, used for a random file name

const app = express();                                                     // create the app
app.use(express.json());                                                   // read JSON bodies
const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' }); // ap-south-1 = Mumbai region
const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg'];            // the only file types we accept
const MAX_BYTES = 5 * 1024 * 1024;                                         // 5 MB limit

app.post('/uploads/url', async (req, res) => {                             // step 1: ask for an upload URL
  const { contentType, size } = req.body;                                  // the browser tells us type and size
  if (!ALLOWED.includes(contentType)) return res.status(400).json({ error: 'File type not allowed' }); // 400 = bad request
  if (size > MAX_BYTES) return res.status(400).json({ error: 'File is larger than 5 MB' });           // reject big files early
  const key = `uploads/${crypto.randomUUID()}`;                            // random key, so users can't overwrite others
  const command = new PutObjectCommand({                                   // describe the one upload we allow
    Bucket: process.env.BUCKET,                                            // which bucket
    Key: key,                                                              // which file path inside the bucket
    ContentType: contentType,                                              // the upload must use this exact type
  });                                                                      // end of PutObjectCommand
  const url = await getSignedUrl(s3, command, { expiresIn: 300 });         // 300 seconds = link works for 5 minutes
  res.json({ url, key });                                                  // step 2: send the link and key back
});                                                                        // end of /uploads/url

app.post('/uploads/done', (req, res) => {                                  // step 4: browser says "upload finished"
  console.log('Save in MongoDB:', req.body.key);                           // a real app saves the key on the user's document
  res.status(201).json({ saved: req.body.key });                           // 201 = created
});                                                                        // end of /uploads/done

app.listen(3000, () => console.log('API on 3000'));                        // start on port 3000
```

The browser side (inside a React event handler):

```js
async function uploadFile(file) {                                          // file comes from <input type="file">
  const r = await fetch('/uploads/url', {                                  // step 1: ask our API for a link
    method: 'POST',                                                        // POST because we send a body
    headers: { 'Content-Type': 'application/json' },                       // the body is JSON
    body: JSON.stringify({ contentType: file.type, size: file.size }),     // tell the API the type and size
  });                                                                      // end of fetch options
  const { url, key } = await r.json();                                     // step 2: get the signed link
  await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file }); // step 3: send bytes to S3
  await fetch('/uploads/done', {                                           // step 4: tell our API it's done
    method: 'POST',                                                        // POST with a body
    headers: { 'Content-Type': 'application/json' },                       // JSON again
    body: JSON.stringify({ key }),                                         // only the key, never the file
  });                                                                      // end of fetch options
}                                                                          // end of uploadFile
```

## 🔍 Deeper version

**Through the server vs presigned:**

| | Through Express (multer) | Presigned URL |
|---|---|---|
| Who carries the bytes | Your server | S3 directly |
| Server memory/bandwidth | High | Almost none |
| Works with Lambda | Hard: API Gateway limits the body to about 10 MB | Yes |
| Server can inspect the file first | Yes | Only after upload (e.g. an S3 event) |
| Setup | Simple | Needs S3 CORS and the extra "done" call |

See [file uploads with multer](topic:express/file-uploads) for the first way.

**PUT vs POST presigned.**
- A **presigned PUT** (above) is simple. It locks the key and content type.
- A **presigned POST** (`createPresignedPost` from `@aws-sdk/s3-presigned-post`) can add *conditions*, like `content-length-range`. S3 then refuses files outside your size limit. Use it when you can't trust the browser's `size`.

**After the upload.** You can't trust the browser's "done" call alone. Common extras:
- An **S3 event** (S3 sends a message when a new file lands) triggers a Lambda. It can scan the file, make thumbnails, or start parsing.
- Big jobs, like parsing many resumes, go on a [queue](glossary:queue). See [event-driven backend with queues](topic:mern-architectures/event-driven-queues).

**Downloads** work the same way. Keep the bucket private, and create a `GetObjectCommand` presigned URL when a logged-in user wants to view a file.

**Multipart uploads.** Files over about 100 MB should be split into parts. S3 multipart upload lets you sign each part and retry only failed parts.

The full system design is in [file upload service](topic:system-design/file-upload-service).

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| Server stays fast; no big bodies in Node memory | More moving parts: sign, upload, confirm |
| Works with serverless and its size limits | You must set CORS on the bucket |
| S3 handles huge files and parallel uploads | You can't check the file content before it lands |
| Cheaper: less server bandwidth | A leaked URL works until it expires, so keep it short |

## 🎯 When to choose it

- **Resume, image or video uploads** in any app that will grow.
- **Serverless backends** (Lambda + API Gateway), where big request bodies aren't possible.
- **Bulk uploads**, like many resumes at once, followed by background processing.
- **Not needed** for a tiny internal tool with small files on one server. multer is fine there.

## ⚠️ Common mistakes

- **Making the bucket public** to "fix" access errors. Keep it private and use presigned GET URLs.
- **Letting the user choose the key.** They could overwrite someone else's file. Create the key on the server.
- **Very long expiry times**, like 7 days. Use minutes for uploads.
- **Saving the presigned URL in MongoDB.** It stops working soon. Save the key, and sign a fresh URL when needed.

## 🗣️ How to answer in an interview

> "For uploads I prefer presigned URLs. The React app first calls the API with the file type and size. The API checks the user and the limits, creates a random S3 key, and returns a presigned PUT URL that expires in a few minutes.
>
> The browser uploads the file straight to S3. Then it calls the API again, and the API saves the key in MongoDB. So large files never pass through Node, which matters a lot on Lambda because of the request size limit.
>
> For strict size limits I'd use a presigned POST with a content-length-range condition. For heavy work after upload, like parsing resumes, I'd trigger it from an S3 event or a queue."

[FILL IN: how resume files reach S3 in SkillKeepr's bulk resume parsing feature, if you know it — don't claim presigned URLs unless the code uses them.]

## 🔁 Follow-up questions

### Can someone reuse the presigned URL to upload again?

Yes, until it expires, but only to that same key with that content type. Keep expiry short, and the key random.

### How do you know the upload really finished?

The browser's "done" call is the simple way. For a reliable signal, use an S3 event notification that triggers a Lambda or puts a message on SQS.

### Why does the browser get a CORS error when uploading to S3?

The bucket has no CORS rule for your site's origin. Add one that allows `PUT` from your frontend's URL.

### How do you show a private file to the user?

The API checks the user's access, then returns a presigned GET URL for that key with a short expiry.

## ✅ Quick check

### 1. Your API runs on Lambda behind API Gateway. Users must upload 50 MB videos. What design do you choose?

:::answer
Presigned URLs (multipart for very big files). API Gateway can't take a 50 MB body, and the file should not pass through Lambda.
:::

### 2. What should you save in MongoDB: the file, the presigned URL, or the S3 key?

:::answer
**The S3 key.** The file stays in S3, and the URL expires. You create a fresh URL from the key when needed.
:::

### 3. True or false: to use presigned URLs, the browser needs AWS access keys.

:::answer
**False.** Only the server has the keys. It signs the URL, and the signature inside the URL is the permission.
:::
