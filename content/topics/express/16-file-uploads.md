---
title: File uploads with multer
stack: express
order: 16
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Files are sent as multipart/form-data, which express.json() can't read. multer is the middleware that reads it and gives you req.file (or req.files).
  - Storage — diskStorage saves files to a folder; memoryStorage keeps them as a Buffer in RAM (good for sending on to S3 or cloud storage, but only for small files).
  - Always set limits (fileSize, number of files) and a fileFilter. Don't trust the file name or the mimetype the client sends.
  - In production, store files outside the app server (S3, GCS, Cloudinary) and save only the URL/key in the database. For big files, use pre-signed URLs so the browser uploads directly.
  - Handle MulterError (like LIMIT_FILE_SIZE) in the error handler and reply with a clear 400/413.
cards:
  - q: Why can't express.json() read a file upload?
    a: File uploads use the multipart/form-data format, not JSON. You need a multipart parser like multer (or busboy) to read it.
  - q: diskStorage vs memoryStorage?
    a: diskStorage writes the file to a folder on the server. memoryStorage keeps it in memory as a Buffer (req.file.buffer) — handy for uploading to S3, but big files can use up all the RAM.
  - q: How do you stop users from uploading huge files?
    a: "Set limits in multer, e.g. limits: { fileSize: 2 * 1024 * 1024 } for 2 MB. multer then throws a MulterError with code LIMIT_FILE_SIZE."
  - q: Is checking file.mimetype enough to be safe?
    a: No. The client sets it, so it can lie. For safety, check the real file content (magic bytes, e.g. with the file-type package), rename the file, and never run or serve it from a trusted path.
  - q: What is a pre-signed URL?
    a: A short-lived URL from S3/GCS that lets the browser upload a file straight to cloud storage. The file never passes through your Node server.
---

## 💡 What is it?

A **file upload** is when a user sends a file, like a resume PDF or a profile photo, to your server.

Browsers send files in a special format called **`multipart/form-data`**. It is a body split into parts: text fields and file data. Express can't read this format by itself.

**multer** is a [middleware](glossary:middleware) that reads it. After multer runs, the file is in **`req.file`** (one file) or **`req.files`** (many). The text fields are in `req.body`.

## 🏠 Real-life example

Think of **submitting documents at a school office**.

You give the clerk an **envelope**. Inside is a filled form (text) and a copy of your certificate (the file).

The clerk:
1. **opens the envelope** and separates the form from the certificate,
2. **checks the rules**: "only PDF, max 2 pages" → else returns it to you,
3. **stores the certificate** in a cupboard or sends it to the main office,
4. writes the **file number** in the register.

- The **envelope** = the `multipart/form-data` request.
- The **clerk** = multer.
- The **rules** = `limits` and `fileFilter`.
- The **cupboard** = disk storage. **Sending to the main office** = cloud storage like S3.
- The **register entry** = saving the file's URL in your database.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install express multer`. Save this as `app.js`. Run it with `node app.js`.

```js
const express = require('express');                                  // load Express
const multer = require('multer');                                    // load multer (version 2)
const path = require('node:path');                                   // helps build file paths safely
const crypto = require('node:crypto');                               // to make random file names
const app = express();                                               // create the app

const storage = multer.diskStorage({                                 // save uploaded files on disk
  destination: 'uploads/',                                           // the folder (multer creates it if missing)
  filename: (req, file, cb) => {                                     // decide the saved file name
    const ext = path.extname(file.originalname).toLowerCase();       // keep only the extension, e.g. ".pdf"
    cb(null, crypto.randomUUID() + ext);                             // random name → no clashes, no tricks
  },                                                                 // end of filename
});                                                                  // end of storage

const upload = multer({                                              // build the upload middleware
  storage,                                                           // use the disk storage above
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },                   // max 2 MB, and only 1 file
  fileFilter: (req, file, cb) => {                                   // decide if this file is allowed
    if (file.mimetype === 'application/pdf') return cb(null, true);  // PDF → accept
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname)); // anything else → reject
  },                                                                 // end of fileFilter
});                                                                  // end of multer()

app.post('/resume', upload.single('resume'), (req, res) => {         // read ONE file from the field "resume"
  res.status(201).json({                                             // 201 = created
    savedAs: req.file.filename,                                      // the random name on disk
    sizeKB: Math.round(req.file.size / 1024),                        // size in KB
    candidate: req.body.name,                                        // a normal text field from the same form
  });                                                                // end of json
});                                                                  // end of the route

app.use((err, req, res, next) => {                                   // error handler (4 arguments)
  if (err instanceof multer.MulterError) {                           // an upload problem
    return res.status(400).json({ code: err.code, message: err.message }); // e.g. LIMIT_FILE_SIZE
  }                                                                  // end of the if
  res.status(500).json({ message: 'Something went wrong' });         // anything else
});                                                                  // end of error handler

app.listen(3000, () => console.log('Running on port 3000'));          // start the server on port 3000
```

```text
$ curl -F "name=Hari" -F "resume=@cv.pdf" localhost:3000/resume
{"savedAs":"5b2c...e1.pdf","sizeKB":84,"candidate":"Hari"}               ← 201

$ curl -F "resume=@photo.png" localhost:3000/resume
{"code":"LIMIT_UNEXPECTED_FILE","message":"Unexpected file field"}      ← 400, not a PDF

$ curl -F "resume=@big.pdf" localhost:3000/resume
{"code":"LIMIT_FILE_SIZE","message":"File too large"}                   ← 400, over 2 MB
```

(`-F` makes curl send `multipart/form-data`. `@cv.pdf` means "attach this file".)

## 🔍 Deeper version

**multer's helpers:**

| Helper | Use it for | Result |
|---|---|---|
| `upload.single('resume')` | one file in one field | `req.file` |
| `upload.array('photos', 5)` | up to 5 files in one field | `req.files` (array) |
| `upload.fields([{ name: 'cv' }, { name: 'photo' }])` | several named fields | `req.files.cv`, `req.files.photo` |
| `upload.none()` | a multipart form with text only | `req.body` |

**What's in `req.file`:** `fieldname`, `originalname`, `mimetype`, `size`, and either `path`/`filename` (disk) or `buffer` (memory).

**Disk vs memory storage:**
- **diskStorage** writes files to the server's disk. That's simple, but on platforms like Railway, Docker or serverless, the disk is often **temporary**. Files vanish on the next deploy or restart, and other server copies can't see them.
- **memoryStorage** keeps the whole file in RAM as a [Buffer](glossary:buffer) (`req.file.buffer`). It's handy if you send it straight on to S3. But many large uploads at once can **use up all the memory** and crash the app.

**Production pattern: store files in the cloud.**
1. Upload the file to object storage: **AWS S3**, **Google Cloud Storage** or Cloudinary.
2. Save only the **key or URL** and some details (owner, size, type) in your database.
3. Serve the files through the storage service or a CDN, often with **signed URLs** for private files like resumes.

**Pre-signed URLs (best for big files).** The server creates a short-lived upload URL with the cloud SDK and gives it to the browser. The browser uploads **straight to S3/GCS**. Your Node server never handles the bytes. This saves memory, bandwidth and time. Afterwards, the frontend tells the API "upload done" so it can save the record.

**Streaming instead of buffering.** For big files through your own server, stream the upload to storage piece by piece. Don't hold it all in memory. See [streams](topic:nodejs/streams). Libraries like `busboy` (which multer is built on) or the S3 SDK's `Upload` helper support this.

**Security checklist:**
- **Limits**: `fileSize`, `files`, `fields`. Without them, one request can fill your disk.
- **Don't trust `mimetype` or the extension.** The client sets them. For important checks, read the first bytes of the file (its "magic number") with a package like `file-type`.
- **Rename files** (random UUID). Never use `originalname` as a path. A name like `../../app.js` could overwrite your code.
- **Never execute** uploaded files, and don't serve them from your app's own folder.
- Scan files for viruses if users share them with others.
- Protect private files: check that the logged-in user owns the file before giving a link.

:::version[Version note]
**multer 2** (2025) fixed security issues found in multer 1.x. Its API (`single`, `array`, `fields`, `diskStorage`, `memoryStorage`) is the same, so old tutorials still mostly apply. Just upgrade from 1.x.
:::

**Status codes.** Use 400 for a wrong field or a wrong type. For size errors, you can use **413 Payload Too Large**, which is more exact. Always reply in your normal [error format](topic:express/response-format).

## 🎯 Why do we use it?

- Real apps need files: **resumes, profile photos, documents, CSV imports**.
- multer does the hard part. It reads the multipart format **as a stream**, splits fields from files, and enforces limits.
- With cloud storage, files are safe across deploys and available to every server.

## ⚠️ Common mistakes

- **No size limit.** One big upload can fill the disk or the memory and crash the server.
- **Using `originalname` as the saved name.** This causes clashes and path tricks. Always rename.
- **memoryStorage for big files.** Ten 500 MB uploads at once means 5 GB of RAM.
- **Saving files on the app server's disk in production** (Docker, Railway, serverless). They disappear on redeploy, and other copies of the app can't see them.
- **The field name doesn't match**: `upload.single('resume')` but the form sends `file`. multer then throws "Unexpected file field".

## 🗣️ How to answer in an interview

> "Files come as multipart/form-data, which express.json can't parse. So I use multer. upload.single gives me req.file, and upload.array or fields handle several files. I always set limits, like file size and number of files, plus a fileFilter for allowed types. Since the mimetype comes from the client, for sensitive cases I also check the real file signature. I rename every file with a UUID, so the original name can't be used for path tricks. MulterErrors like LIMIT_FILE_SIZE go to the error handler and return a clear 400.
>
> In production I don't keep files on the app server, because containers and platforms like Railway lose local files on redeploy. I upload to S3 or GCS and store only the key in the database. For large files, I'd generate a pre-signed URL so the browser uploads directly to storage, and Node never holds the file in memory."

[FILL IN: any real file upload feature at SkillKeepr (e.g. resumes or candidate documents) and where the files were stored. Only add it if it's true.]

## 🔁 Follow-up questions

### How do you upload directly to S3 from the browser?

The API checks the user and creates a **pre-signed PUT URL** with the AWS SDK. It is valid for a few minutes, for one exact key and content type. The browser uploads the file to that URL. Then it calls the API to save the file record. Node never handles the file itself.

### How do you validate that a file is really a PDF?

Don't rely on the `mimetype` or the `.pdf` extension, because the client controls both. Read the first bytes of the file. A real PDF starts with `%PDF`. Packages like `file-type` check these magic numbers for many formats.

### What happens with memoryStorage when many users upload large files?

Each file is held fully in RAM until your code finishes. Many big uploads at the same time can use up the memory and crash the process. Use disk storage, streaming, or pre-signed direct uploads instead.

### How do you handle multiple files with different field names?

Use `upload.fields([{ name: 'cv', maxCount: 1 }, { name: 'photo', maxCount: 1 }])`. Then read `req.files.cv[0]` and `req.files.photo[0]`.

## ✅ Quick check

### 1. A form sends a file with the field name `photo`, but the route uses `upload.single('avatar')`. What happens?

:::answer
multer throws a `MulterError` with the code **`LIMIT_UNEXPECTED_FILE`** ("Unexpected file field"). The field names must match.
:::

### 2. Which storage is safest for a 1 GB video upload on a busy server?

- A) memoryStorage
- B) diskStorage on the app server
- C) A pre-signed URL so the browser uploads straight to cloud storage

:::answer
**C.** The file never passes through your server's memory or disk, and it stays safe across deploys. A puts 1 GB in RAM per upload. B fills the server's disk and is lost on redeploy.
:::

### 3. True or false: if `file.mimetype === 'image/png'`, the file is definitely a PNG.

:::answer
**False.** The client sends the mimetype, so it can lie. Check the real file content (magic bytes) for anything important.
:::
