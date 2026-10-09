---
title: "Streams: readable, writable, transform"
stack: nodejs
order: 21
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - A stream handles data piece by piece (in chunks) instead of loading it all into memory at once.
  - "Four types: Readable (you read from it), Writable (you write to it), Duplex (both), Transform (changes data as it passes through)."
  - HTTP requests and responses, files, sockets, gzip and process.stdout are all streams in Node.
  - Streams keep memory low and start sending data sooner — a 2 GB file can be copied using only a few MB of memory.
  - Connect streams with pipeline() (it handles errors and cleanup), and always listen for 'error'.
cards:
  - q: What is a stream in Node.js?
    a: A way to read or write data in small pieces (chunks) over time, instead of holding all of it in memory at once.
  - q: Name the four types of streams.
    a: Readable (e.g. fs.createReadStream), Writable (e.g. fs.createWriteStream, res), Duplex (e.g. a TCP socket), Transform (e.g. zlib.createGzip).
  - q: Why stream a large file instead of using fs.readFile?
    a: readFile loads the whole file into memory. Streaming reads small chunks, so memory stays low and the user starts receiving data right away.
  - q: Which events does a Readable stream emit?
    a: "'data' for each chunk, 'end' when there is no more data, 'error' if something fails, and 'close' when it's fully closed."
  - q: Is an Express req a stream?
    a: Yes. req is a Readable stream (the request body) and res is a Writable stream (the response).
---

## 💡 What is it?

A **[stream](glossary:stream)** is a way to handle data **piece by piece**, instead of all at once.

Each piece is called a **[chunk](glossary:chunk)**. You start working on the first chunk while the next chunks are still arriving.

This matters for big data. Reading a 2 GB file all at once needs 2 GB of memory. Streaming it needs only a few MB, because only a few chunks are in memory at any time.

## 🏠 Real-life example

Think of **water from a tap**.

- You don't wait for the whole tank to empty into a bucket before you use it. Water flows **a little at a time**, and you use it as it comes.
- The **water tank** = a Readable stream (data comes out of it).
- The **bucket or the plants you water** = a Writable stream (data goes into it).
- A **water filter** in the middle = a Transform stream. Water goes in, cleaner water comes out.
- The **pipes** joining them = `pipe()` or `pipeline()`.
- If the bucket is nearly full, you **turn the tap down**. That's called backpressure. (See [pipeline and backpressure](topic:nodejs/pipeline-and-backpressure).)

## 🧑‍💻 Code example

This makes a test file, then copies it into a new file in UPPERCASE, using streams. Save it as `streams.js`. Run it with `node streams.js`.

```js
const fs = require('node:fs');                                   // file functions
const { Transform } = require('node:stream');                    // Transform = a stream that changes data as it passes

fs.writeFileSync('big.txt', 'hello stream\n'.repeat(100000));    // setup: a 1,300,000-byte test file (13 bytes × 100,000 lines)

let chunks = 0;                                                  // counts how many chunks pass through
const upper = new Transform({                                    // a transform stream that makes text UPPERCASE
  transform(chunk, encoding, done) {                             // Node calls this for EVERY chunk
    chunks++;                                                    // count this chunk
    done(null, chunk.toString().toUpperCase());                  // done(error, newData): null = no error; send the new text on
  },                                                             // end of transform
});                                                              // end of the Transform stream

const reader = fs.createReadStream('big.txt');                   // Readable: reads the file in 64 KB chunks
const writer = fs.createWriteStream('big-upper.txt');            // Writable: writes chunks into a new file

reader.pipe(upper).pipe(writer);                                 // connect them: file → UPPERCASE → new file

writer.on('finish', () => {                                      // 'finish' = all data has been written
  console.log('chunks:', chunks);                                // how many pieces the file was split into
  console.log('first line:', fs.readFileSync('big-upper.txt', 'utf8').split('\n')[0]); // check the result
});                                                              // end of the finish handler
```

**Output:**

```text
chunks: 20
first line: HELLO STREAM
```

**Why 20 chunks?** The file read stream uses 64 KB chunks (65,536 bytes). 1,300,000 ÷ 65,536 = 19.8, so it needs 20 chunks. The whole file was **never** in memory at once.

(This simple example uses `.pipe()`. In real code, use `pipeline()`, because it also handles errors. See the next topic.)

## 🔍 Deeper version

**The four types:**

| Type | Data goes… | Examples |
|---|---|---|
| **Readable** | out of it | `fs.createReadStream`, an HTTP request (`req`), `process.stdin` |
| **Writable** | into it | `fs.createWriteStream`, an HTTP response (`res`), `process.stdout` |
| **Duplex** | both ways, separately | a TCP socket, a WebSocket |
| **Transform** | in, changed, out | `zlib.createGzip()`, `crypto.createCipheriv()`, a CSV parser |

All streams are [EventEmitters](topic:nodejs/event-emitter).

**Important events:**
- Readable: `'data'` (a chunk arrived), `'end'` (no more data), `'error'`, `'close'`
- Writable: `'drain'` (ready for more data), `'finish'` (all data written), `'error'`, `'close'`

**Two reading modes.** A Readable starts **paused**. It switches to **flowing** when you add a `'data'` listener, call `.pipe()`, or call `.resume()`. In flowing mode, chunks arrive as fast as they can be read.

**Reading with `for await`.** This is the easiest modern way to read a stream:

```js
let total = 0;                                         // total bytes
for await (const chunk of fs.createReadStream('big.txt')) { // get one chunk at a time
  total += chunk.length;                               // work on this chunk
}                                                      // the loop ends when the stream ends
```

**highWaterMark.** This is the size of the stream's internal buffer, in bytes. It's how much data is held before the stream slows down. File read streams use 64 KB. In **object mode** (`objectMode: true`), streams pass JavaScript objects instead of bytes. Then highWaterMark counts objects (default 16).

:::version[Version note]
Since **Node.js 22**, the default highWaterMark for most streams is **64 KB**. Before that, it was 16 KB. File read streams were already 64 KB.
:::

**Real backend uses:**
- **Downloads:** stream a file or a database export to `res`, so the user starts downloading at once.
- **Uploads:** stream the request body straight to cloud storage (like S3), instead of saving the whole file in memory.
- **Big CSV or log processing:** read, transform and write line by line.
- **Compression:** `res` with `zlib.createGzip()` in the middle.

**`.pipe()` vs `pipeline()`.** `.pipe()` handles backpressure. But it does **not** pass errors along or clean up the other streams when one fails. That can leak file handles. Use `pipeline()` from `node:stream/promises`. See [pipeline and backpressure](topic:nodejs/pipeline-and-backpressure).

## 🎯 Why do we use it?

- **Low memory.** Ten users downloading a 500 MB file with `readFile` would need 5 GB of memory. With streams, it's a few MB each.
- **Faster start.** The user gets the first bytes right away, instead of waiting for the whole file to load.
- **Handle data bigger than memory.** You can process a 10 GB log file on a server with 1 GB of memory.
- **Composable.** You can join small, single-purpose streams: read → unzip → parse → filter → write.

## ⚠️ Common mistakes

- **Using `fs.readFile` for very large files** or for downloads. Memory jumps and the server can crash.
- **No `'error'` listener.** A missing file or a closed connection crashes the app.
- **Using `.pipe()` in production code** and thinking errors are handled. They aren't. Use `pipeline()`.
- **Calling `chunk.toString()` on each chunk** of text with multi-byte characters. A character can be split across chunks. Use `setEncoding('utf8')` (see [Buffers](topic:nodejs/buffers)).

## 🗣️ How to answer in an interview

> "A stream processes data in chunks over time, instead of loading everything into memory. There are four types: Readable, Writable, Duplex and Transform. Many core things in Node are streams: HTTP requests and responses, files, sockets, zlib and stdout. They're all EventEmitters, with events like `data`, `end`, `finish` and `error`.
>
> The main benefit is memory and speed. For example, to send a big file or a CSV export, I'd stream it to the response instead of using `readFile`. Memory stays flat, and the user starts getting data right away. Same for uploads: stream them to storage instead of buffering them.
>
> In production code, I connect streams with `pipeline` from `stream/promises`, not `.pipe`. `pipeline` handles backpressure, passes errors along, and closes every stream if one fails."

[FILL IN: any place you streamed files, exports or uploads at SkillKeepr. Only add it if it's true.]

## 🔁 Follow-up questions

### What is the difference between Duplex and Transform?

Both can be read from and written to. In a **Duplex**, the two sides are independent. A TCP socket sends and receives different data. In a **Transform**, the output is **made from** the input, like gzip compressing what you write into it.

### How would you send a large file to the user in Express?

Use `await pipeline(fs.createReadStream(path), res)`. Set the `Content-Type` and `Content-Disposition` headers first. Or use `res.download()`, which streams for you.

### How do you read a big file line by line?

Use the `readline` module with a read stream: `for await (const line of readline.createInterface({ input: fs.createReadStream(path) }))`. Memory stays small, even for huge files.

### What does objectMode do?

It lets a stream pass JavaScript objects instead of Buffers or strings. For example, a CSV parser can output one object per row. In object mode, highWaterMark counts objects, not bytes.

## ✅ Quick check

### 1. Which type of stream is `zlib.createGzip()`?

- A) Readable
- B) Writable
- C) Transform

:::answer
**C) Transform.** You write normal data into it, and you read compressed data out of it.
:::

### 2. You need to send a 1 GB video file to users. `fs.readFile` or a stream?

:::answer
**A stream.** `fs.readFile` puts the whole 1 GB in memory, for every request. A stream sends it in small chunks, so memory stays low and the video starts quickly.
:::

### 3. True or false: `readable.pipe(writable)` automatically destroys both streams and reports the error if the readable fails.

:::answer
**False.** `.pipe()` does not forward errors or clean up. That's why you use `pipeline()`.
:::
