---
title: pipe, pipeline and backpressure
stack: nodejs
order: 22
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - Backpressure means "the reader is faster than the writer, so slow the reader down" — otherwise data piles up in memory.
  - "write() returns false when the writable's buffer is full. Then you must wait for the 'drain' event before writing more."
  - .pipe() handles backpressure, but it does not pass errors along or close the other streams when one fails.
  - pipeline() from node:stream/promises handles backpressure, errors and cleanup for every stream, and you can await it.
  - Use pipeline() for file copies, gzip, uploads to storage and sending files in HTTP responses.
cards:
  - q: What is backpressure in Node.js streams?
    a: When data arrives faster than it can be written, the writable's buffer fills up. Backpressure is the signal to pause the reader until the writer catches up.
  - q: What does writable.write() returning false mean?
    a: The internal buffer has reached its highWaterMark. Stop writing and wait for the 'drain' event.
  - q: pipe() vs pipeline()?
    a: Both handle backpressure. pipeline() also forwards errors, destroys all streams if one fails, and tells you when everything is done (callback or promise).
  - q: How do you await a pipeline?
    a: "const { pipeline } = require('node:stream/promises'); await pipeline(source, transform, destination);"
---

## 💡 What is it?

When you connect [streams](topic:nodejs/streams), one stream often **reads faster** than the next one can **write**.

Reading a file from a fast disk is quick. Sending it over a slow mobile network is slow. If the reader doesn't slow down, the extra data piles up in memory. **[Backpressure](glossary:backpressure)** is the signal that says, "slow down, I'm full."

- `.pipe()` connects two streams and handles backpressure.
- `pipeline()` does the same, **plus** it handles errors and closes every stream properly. Use `pipeline()` in real code.

## 🏠 Real-life example

Think of an **assembly line in a biscuit factory**.

- The oven bakes biscuits quickly. The packing worker packs them slowly.
- If the oven keeps pushing biscuits, they pile up and fall on the floor. That's **memory filling up**.
- So the packing worker presses a **"stop" button** when their table is full. That's `write()` returning `false`.
- When the table has space again, they press **"go"**. That's the `'drain'` event.
- The **factory manager** watches the whole line. If one machine breaks, they stop **every** machine and clean up. That's `pipeline()`. With `.pipe()`, there's no manager. One machine breaks, and the others keep running.

## 🧑‍💻 Code example

This compresses a log file with gzip, using `pipeline`. Save it as `gzip.js`. Run it with `node gzip.js`.

```js
const fs = require('node:fs');                                    // file functions
const zlib = require('node:zlib');                                // compression tools (gzip)
const { pipeline } = require('node:stream/promises');             // the promise version of pipeline

async function main() {                                           // async, so we can use await
  fs.writeFileSync('app.log', 'GET /api/users 200\n'.repeat(200000)); // setup: a 3,800,000-byte test log file
  await pipeline(                                                 // connect the streams AND wait until all are done
    fs.createReadStream('app.log'),                               // 1) read the file in small chunks
    zlib.createGzip(),                                            // 2) compress each chunk with gzip
    fs.createWriteStream('app.log.gz'),                           // 3) write the compressed chunks to a new file
  );                                                              // pipeline handles backpressure and errors for all 3
  const before = fs.statSync('app.log').size;                     // original size in bytes
  const after = fs.statSync('app.log.gz').size;                   // compressed size in bytes
  console.log(`done: ${before} bytes → ${after} bytes`);          // the .gz file is much smaller
}                                                                 // end of main

main().catch((err) => {                                           // if ANY of the 3 streams fails, we land here
  console.error('pipeline failed:', err.message);                 // one place to handle every error
  process.exitCode = 1;                                           // mark the run as failed
});                                                               // end of catch
```

**Output** (the compressed size on your machine may be a little different):

```text
done: 3800000 bytes → 9267 bytes
```

**Try breaking it:** change `'app.log'` in the read stream to `'missing.log'`. You get one clean message: `pipeline failed: ENOENT: no such file or directory…`. And the write stream is closed for you.

## 🔍 Deeper version

**How backpressure works inside.** Every Writable has an internal buffer, and its size limit is the **highWaterMark**.
1. You call `writable.write(chunk)`.
2. If the buffer is still below the limit, `write()` returns `true`. Keep going.
3. If it reaches the limit, `write()` returns **`false`**. You should stop.
4. When the buffer has been flushed, the Writable emits **`'drain'`**. Now you can write again.

`write()` returning `false` is only a **request**. If you ignore it, Node still accepts the data, so memory keeps growing. Doing backpressure by hand looks like this:

```js
const { once } = require('node:events');            // helper: wait for one event as a promise
async function writeMany(writable, rows) {          // write many rows safely
  for (const row of rows) {                         // one row at a time
    if (!writable.write(row)) {                     // false = the buffer is full
      await once(writable, 'drain');                // wait until the writer has caught up
    }
  }
  writable.end();                                   // no more data
}
```

`pipe()` and `pipeline()` do exactly this for you.

**Why `.pipe()` is not enough:**
- If the source fails, the destination is **not** closed. It can stay open forever and leak a file handle or socket.
- Errors are **not** passed along. You need an `'error'` listener on **every** stream.
- There's no single "all done" callback.

**What `pipeline()` gives you:**
- backpressure between every pair of streams,
- one error result (a rejected promise or a callback error) if **any** stream fails,
- every stream is destroyed when there's an error, so nothing leaks,
- it finishes only when the last stream is completely done.

**Useful extras:**
- Pass a **signal** to cancel: `await pipeline(a, b, c, { signal: AbortSignal.timeout(30_000) })`.
- Use an **async generator** as a transform step: `pipeline(src, async function* (source) { for await (const c of source) yield c.toString().toUpperCase(); }, dest)`.

**In HTTP:** `await pipeline(fs.createReadStream(file), res)`. If the user closes the browser halfway, `res` fails, `pipeline` destroys the file stream, and the file handle is freed.

:::version[Version note]
`stream.pipeline` (callback version) was added in **Node.js 10**. The promise version, `require('node:stream/promises').pipeline`, came in **Node.js 15**. Use the promise version with async/await in new code.
:::

## 🎯 Why do we use it?

- **Stops memory from exploding.** Without backpressure, a fast disk read plus a slow client means the whole file ends up in memory anyway.
- **No leaks on errors.** `pipeline()` closes every file handle and socket when something fails.
- **Simple error handling.** One `try/catch` around `await pipeline(…)` covers every step.
- **It works for the common backend jobs**: compressing logs, exporting CSVs, uploading to cloud storage and serving large files.

## ⚠️ Common mistakes

- **Ignoring `write()`'s return value** in your own write loop. Memory grows without limit.
- **Using `.pipe()` with no error listeners.** A failed source leaves the destination open forever.
- **Forgetting to `await` the pipeline** (or pass a callback). Errors go unhandled, and code runs before the work is done.
- **Using the callback `pipeline` from `node:stream` with `await`.** You need the one from `node:stream/promises`.

## 🗣️ How to answer in an interview

> "Backpressure happens when a readable produces data faster than a writable can consume it. Each writable has a buffer limited by highWaterMark. When it's full, `write()` returns false. The producer should pause and wait for the `drain` event. Otherwise everything piles up in memory.
>
> `pipe()` handles that automatically. But it doesn't forward errors or destroy the other streams when one fails, so you can leak file descriptors. That's why I use `pipeline` from `stream/promises`. It handles backpressure across all the streams, rejects once if any of them fails, cleans everything up, and I can just await it in a try/catch. I'd use it for things like gzipping files, streaming uploads to storage, or sending a big file in an HTTP response."

## 🔁 Follow-up questions

### What happens if you ignore write() returning false?

The data is still accepted and kept in the writable's buffer. Memory keeps growing. With a big or endless source, the process can run out of memory and crash.

### Can pipeline() take more than two streams?

Yes. It takes any number: `pipeline(source, transform1, transform2, destination)`. Backpressure and errors are handled across all of them.

### How do you cancel a running pipeline?

Pass an `AbortSignal` in the options: `pipeline(a, b, { signal })`. When the signal aborts, all streams are destroyed and the promise rejects with an `AbortError`.

### How is backpressure related to a slow client downloading a file?

The response (`res`) writes to the network. If the client's connection is slow, `res`'s buffer fills up. `pipeline` pauses the file read stream until the client catches up. Memory stays flat.

## ✅ Quick check

### 1. `writable.write(chunk)` returns `false`. What should your code do?

:::answer
Stop writing and wait for the **`'drain'`** event, then continue. (Or let `pipe()`/`pipeline()` handle it for you.)
:::

### 2. Which one cleans up all streams if one fails?

- A) `a.pipe(b).pipe(c)`
- B) `await pipeline(a, b, c)`

:::answer
**B.** `pipeline` destroys every stream and gives you one error. `.pipe()` does neither.
:::

### 3. Where do you import the awaitable pipeline from?

:::answer
`require('node:stream/promises')` (or `import { pipeline } from 'node:stream/promises'`).
:::
