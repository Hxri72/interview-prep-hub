---
template: chapter
title: Bulk resume upload and parsing
stack: skillkeepr-story
order: 7
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Priya drops 200 resumes at once. The platform turns each file into a candidate profile.
  - Files go straight from the browser to S3 using presigned upload links, so the API server never carries the bytes.
  - An S3 event puts each file on a queue. Background workers parse them one by one, with a fallback parser.
  - Progress is pushed to the browser over a WebSocket, and a report lists what worked and what failed.
cards:
  - q: Why upload files directly from the browser to S3?
    a: Big files would make the API server slow and use a lot of memory. A presigned URL lets the browser send bytes straight to S3, and the server only handles small JSON requests.
  - q: Why put parsing on a queue?
    a: Parsing is slow and can fail. A queue lets workers process files one at a time, retry failures, and keep the website fast.
  - q: How does the recruiter see progress?
    a: The backend pushes progress messages over a WebSocket, so the screen updates without refreshing.
  - q: What happens to a file that can't be parsed?
    a: It is retried a limited number of times, then marked as failed and listed in the upload report.
---

## 💡 What happens in this chapter

Priya has a folder of **200 resumes** from a job fair. She drags them all into SkillKeepr at once.

A few minutes later, each resume is a **candidate profile** with name, skills and experience. A small report shows which files worked and which failed.

## 🏠 Real-life example

Think of a **school exam paper checking centre**.

Students don't hand papers to the principal. They drop them into a big collection box. Teachers take papers one by one, check them, and put up marks on a board.

- **Students dropping papers in the box** = the browser uploading files straight to S3.
- **The collection box** = S3 storage.
- **A bell that rings for each new paper** = the S3 event.
- **The line of papers waiting** = the queue (SQS).
- **Teachers checking one paper at a time** = parser workers.
- **A second teacher for hard-to-read papers** = the fallback parser.
- **The marks board** = live progress over WebSocket, then the report.

## 🗺️ The flow

```text
Priya's browser
   │ 1. ask the API: "I want to upload 200 files"
   ▼
API (Lambda) ── 2. returns presigned multipart upload links (no file bytes pass here)
   │
Browser ── 3. uploads file parts straight to S3, in parallel
   │
   ▼
S3 ── 4. "new file" event
   │
   ▼
Queue (SQS) ── 5. one message per file
   │
   ▼
Parser worker ── 6. parse with the in-house parser
   │                 └─ slow or failed → fallback parser
   │ 7. create candidate profile in MongoDB
   │ 8. push progress over WebSocket ──► Priya's screen updates live
   ▼
Upload report: done / failed (stuck items are cleaned up by a scheduled job)
```

## 🧱 Tech used

| Piece | Technology | Learn it here |
|---|---|---|
| Uploading big files safely | S3 presigned multipart uploads | [File upload service](topic:system-design/file-upload-service) |
| Not crashing the server | Never buffer whole files in the API | [A large upload crashes the server](topic:debugging/large-upload-crash) |
| Starting work when a file lands | S3 event → queue | [Event-driven architecture](topic:architecture/event-driven) |
| Slow work in the background | SQS queue + worker | [Queues and background jobs](topic:system-design/queues-background-jobs) |
| Retrying and duplicates | Idempotent workers | [A background job runs twice](topic:debugging/background-job-twice) |
| Live progress | WebSocket push | [WebSockets vs HTTP](topic:rest-auth/websockets) |
| Long jobs in Lambda | Time limits, workers | [Serverless limits](topic:architecture/serverless-limits) |

## 🧑‍💻 Key code idea

A tiny worker: take files from a queue, **retry** a limited number of times, and send **progress** after each file. Save it as `resume-worker.js` and run `node resume-worker.js`.

```js
const queue = ['rahul.pdf', 'meena.docx', 'broken.pdf'];  // files waiting after the S3 upload event
const MAX_TRIES = 2;                                       // try each file at most 2 times

function parse(file, attempt) {                            // pretend parser: fails on a bad file
  if (file === 'broken.pdf') throw new Error('cannot read file'); // this file always fails
  if (file === 'meena.docx' && attempt === 1) throw new Error('parser timed out'); // first try times out
  return { name: file.split('.')[0], skills: ['Node.js'] }; // the parsed candidate
}                                                          // end of parse

function sendProgress(msg) {                               // stands in for a WebSocket push to the browser
  console.log('progress →', msg);                          // the recruiter sees this live
}                                                          // end of sendProgress

const report = { done: [], failed: [] };                   // the final upload report
for (const file of queue) {                                // the worker takes one file at a time
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) { // retry loop
    try {                                                  // try to parse
      const candidate = parse(file, attempt);              // parse the resume
      report.done.push(candidate.name);                    // save the candidate (database step skipped here)
      sendProgress(`${file} parsed (try ${attempt})`);     // tell the browser
      break;                                               // success → next file
    } catch (err) {                                        // parsing failed
      if (attempt === MAX_TRIES) {                         // no tries left
        report.failed.push(`${file}: ${err.message}`);     // record the failure for the report
        sendProgress(`${file} failed`);                    // tell the browser
      }                                                    // otherwise loop and try again
    }                                                      // end of try/catch
  }                                                        // end of retry loop
}                                                          // end of the queue loop
console.log(report);                                       // what the recruiter sees at the end
```

```text
progress → rahul.pdf parsed (try 1)
progress → meena.docx parsed (try 2)
progress → broken.pdf failed
{
  done: [ 'rahul', 'meena' ],
  failed: [ 'broken.pdf: cannot read file' ]
}
```

Meena's file timed out once, then worked on the retry. The broken file failed twice and was put in the report — the other files were not blocked.

## 🧗 Hard parts and trade-offs

- **Big files.** Sending files through the API would use memory and hit request limits. Direct-to-S3 uploads avoid that, but need presigned URLs and a "finalise" step.
- **Slow and unreliable parsing.** Parsers can time out. A queue, retries and a fallback parser keep things moving. Too many retries waste money, so there is a limit.
- **The same message twice.** Queues can deliver a message more than once. Workers must be safe to repeat — for example, don't create the same candidate twice.
- **Stuck items.** If a worker crashes mid-way, an item can stay "in progress". A scheduled clean-up job finds and fixes these.

## 🙋 My part

- This chapter describes how the **platform** handles bulk uploads.
- My own work on this feature: [FILL IN: only if you worked on it — e.g. an endpoint, the worker, the report. If not, say "I know how it works, but another developer built it."].

## 🗣️ How to explain it in an interview

> "For bulk resume upload, files never go through our API server. The browser asks the backend for presigned multipart upload links and sends the file parts straight to S3. When a file lands, an S3 event puts a message on an SQS queue. Background workers take one file at a time and parse it, with a fallback parser if the main one times out. Each parsed resume becomes a candidate in MongoDB, and progress is pushed to the recruiter's screen over a WebSocket. At the end, there's a report of what worked and what failed.
>
> The main ideas are: keep big files away from the API, do slow work in the background with retries, and make workers safe to run twice."

[FILL IN: add one sentence about your own part, or keep it as "how our platform does it".]

## 🔁 Follow-up questions

### Why multipart upload?

A big file is split into parts that upload in parallel. If one part fails, only that part is sent again, not the whole file.

### What if the same file is processed twice?

Make the worker idempotent: check if this file or this candidate (by email) was already handled before creating anything. See [idempotency keys](topic:rest-auth/idempotency-keys).

### Why not parse inside the upload request?

Parsing can take many seconds. The user would wait, and the request could time out. A queue lets the upload finish fast while workers do the slow part.

### How do you limit how fast workers run?

Limit how many workers run at once, so the parser and database aren't overloaded. See [rate limiting](topic:system-design/rate-limiting).

## 📚 Topics to revise

- [File upload service design](topic:system-design/file-upload-service)
- [Queues and background jobs](topic:system-design/queues-background-jobs)
- [A background job runs twice or never finishes](topic:debugging/background-job-twice)
- [WebSockets vs HTTP](topic:rest-auth/websockets)
- [Streams in Node.js](topic:nodejs/streams)
