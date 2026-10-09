---
title: "The fs module: sync vs callback vs promises"
stack: nodejs
order: 14
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - The fs (file system) module lets Node read, write, delete and watch files and folders.
  - "Every task comes in three styles: sync (readFileSync — waits and blocks), callback (readFile(path, cb)) and promise (fs/promises with await)."
  - Use the promise style (node:fs/promises + async/await) in servers. It doesn't block other users.
  - Sync functions are fine only at startup or in small scripts — never inside request handlers.
  - For big files, use streams (fs.createReadStream) instead of loading the whole file into memory.
cards:
  - q: What are the three styles of the fs module?
    a: "Sync (readFileSync — blocks until done), callback (readFile(path, (err, data) => …)) and promise (await readFile from node:fs/promises)."
  - q: Why avoid readFileSync inside an Express route?
    a: It blocks the single JavaScript thread until the whole file is read, so every other request has to wait.
  - q: How do you read a file with async/await?
    a: "import { readFile } from 'node:fs/promises'; const text = await readFile(path, 'utf8');"
  - q: What happens if you read a file without saying 'utf8'?
    a: You get a Buffer (raw bytes) instead of a string. Pass 'utf8' or call .toString() to get text.
  - q: How should you read a 2 GB log file?
    a: With a stream (fs.createReadStream), which reads it in small pieces, instead of readFile, which loads all 2 GB into memory.
---

## 💡 What is it?

**`fs`** stands for **[file system](glossary:file-system)**. It's a module built into Node.js. You use it to read files, write files, make folders and delete things.

Most `fs` functions come in **three styles**:
1. **Sync**: `readFileSync`. The program **waits** until the job is done.
2. **Callback**: `readFile(path, callback)`. Node calls your function when it's done.
3. **Promise**: `await readFile(path)` from `node:fs/promises`. This is the modern style.

## 🏠 Real-life example

Think of **ordering at a tea shop**. You want a cup of tea.

- **Sync style** = you stand at the counter and stare until your tea is ready. The people behind you can't order. The whole line waits.
- **Callback style** = you give your order and your phone number. You sit down. They **call you** when the tea is ready.
- **Promise style** = you get a **token number**. You sit down and do other things. When your number shows on the screen, you `await` it and pick up your tea.

- The **tea** = the file's data.
- The **kitchen** = the background workers (the [libuv](glossary:libuv) thread pool).
- **The people in the line** = other users of your server.

## 🧑‍💻 Code example

Save this as `files.mjs`. Run `node files.mjs`.

```js
import fs from 'node:fs';                                   // the fs module (sync + callback styles)
import { readFile, writeFile } from 'node:fs/promises';     // the promise style of the same functions

fs.writeFileSync('note.txt', 'Hello from Node!');           // 1) SYNC: write the file and WAIT until done
const text1 = fs.readFileSync('note.txt', 'utf8');          // 'utf8' = give me text, not raw bytes
console.log('sync:', text1);                                // runs only after the file was read

await writeFile('note2.txt', 'Hello again!');               // 2) PROMISE: wait for it, without blocking the thread
const text2 = await readFile('note2.txt', 'utf8');          // read it back with await
console.log('promise:', text2);                             // runs after the await finishes

fs.readFile('note.txt', 'utf8', (err, data) => {            // 3) CALLBACK: Node calls this function later
  if (err) return console.error('read failed:', err.message); // callbacks get the error first, then the data
  console.log('callback:', data);                           // runs when the file is ready
});                                                         // end of the callback
console.log('this line runs BEFORE the callback');          // the callback only STARTED reading; the code moves on
```

**Output:**

```text
sync: Hello from Node!
promise: Hello again!
this line runs BEFORE the callback
callback: Hello from Node!
```

**What to notice:** the callback version only *starts* reading the file. The code doesn't wait. It moves to the next line at once. The callback runs later, when the file is ready. The sync and promise versions both "wait", but only the sync one blocks everything else while it waits.

## 🔍 Deeper version

**The three styles side by side:**

| Style | Example | Blocks the thread? | Errors |
|---|---|---|---|
| Sync | `fs.readFileSync(p, 'utf8')` | ✅ yes | thrown → use `try/catch` |
| Callback | `fs.readFile(p, 'utf8', (err, data) => …)` | ❌ no | first argument `err` |
| Promise | `await fsp.readFile(p, 'utf8')` | ❌ no | rejected → `try/catch` around `await` |

**What happens under the hood.** The async versions send the work to **libuv's thread pool** (4 helper threads by default). Your JavaScript thread stays free to handle other requests. See [the libuv thread pool](topic:nodejs/libuv-thread-pool). The sync versions do the work **on the main thread**, so nothing else can run. See [blocking the event loop](topic:nodejs/blocking-the-event-loop).

**When is sync OK?**
- At **startup**, for example reading a config file once before the server starts.
- In small **command-line scripts**, where nobody else is waiting.
- **Never** inside a request handler.

**Common functions** (each has sync, callback and promise forms):

| Task | Promise version |
|---|---|
| read / write / add to a file | `readFile`, `writeFile`, `appendFile` |
| make a folder | `mkdir(path, { recursive: true })` |
| list a folder | `readdir(path)` |
| file info (size, dates) | `stat(path)` |
| delete | `rm(path, { recursive: true, force: true })`, `unlink(path)` |
| rename / move | `rename(from, to)` |
| does it exist? | `access(path)` (throws if not), or `fs.existsSync(path)` |

**Text vs bytes.** Without an encoding, `readFile` gives a **[Buffer](glossary:buffer)**, which is raw bytes. Pass `'utf8'` to get a string. See [Buffers](topic:nodejs/buffers).

**Big files → streams.** `readFile` loads the **whole** file into memory. For a 2 GB file, that can crash your server. `fs.createReadStream()` reads it in small pieces (64 KB by default) instead. See [streams](topic:nodejs/streams).

**Use paths relative to your file**, not to the folder you ran the command from: `path.join(import.meta.dirname, 'data.json')`. See [the path module](topic:nodejs/path-and-os).

**"Check, then use" is a trap.** Don't call `existsSync()` and *then* `readFile()`. The file can be deleted between the two lines. Just try to read it, and handle the `ENOENT` ("file not found") error.

## 🎯 Why do we use it?

- **Servers need files.** Reading config and templates, saving uploads, writing logs and exporting reports.
- **Scripts need files.** Build scripts, data migrations and small tools all read and write files.
- **The promise style keeps the server fast.** Many users can be served while files are being read in the background.
- It's **built in**. There's nothing to install.

## ⚠️ Common mistakes

- **Using `readFileSync` in a route.** Every other user waits while the file is read.
- **Forgetting `'utf8'`.** You get `<Buffer 48 65 6c …>` instead of text.
- **Not handling errors.** A missing file throws `ENOENT`. Without `try/catch`, it can crash the request (or the app).
- **Reading huge files with `readFile`.** Use a stream instead, so memory stays small.

## 🗣️ How to answer in an interview

> "The fs module is Node's built-in way to work with files. Most functions come in three styles. There's sync, like readFileSync, which blocks the thread. There's the callback style, with an error-first callback. And there's the promise style from node:fs/promises, which I use with async/await.
>
> In a server I always use the promise or callback style. The async versions run in libuv's thread pool, so the main thread can keep serving other requests. readFileSync inside a route would block every user. Sync is fine only at startup or in small scripts.
>
> For big files I use streams, like createReadStream piped to the response, so I don't load the whole file into memory. And I build paths from the file's own folder with path.join, not from the current working directory."

[FILL IN: a real place you used fs in a SkillKeepr service (e.g. reading templates, writing exports or handling uploads), if any. Only add it if it's true.]

## 🔁 Follow-up questions

### What is an "error-first callback"?

It's the Node callback rule: the **first** argument is always the error (or `null`), and the result comes next. `(err, data) => { if (err) … }`. Always check `err` first.

### How do you turn an old callback function into a promise?

Use `util.promisify`: `const readFileP = util.promisify(fs.readFile);`. But for `fs`, just use `node:fs/promises`. It already has promise versions of everything.

### How do you check if a file exists?

`fs.existsSync(path)` is fine in scripts. In async code, don't check first. Just do the real operation (`readFile`) and catch the `ENOENT` error. This avoids the "the file changed between my two lines" problem.

### How would you send a big file to the user in Express?

Use a stream: `fs.createReadStream(filePath).pipe(res)`. Or use the helper `res.sendFile(path)`, which streams for you. Either way, the file never sits fully in memory.

## ✅ Quick check

### 1. Which line should you avoid inside an Express route?

- A) `await readFile('a.txt', 'utf8')`
- B) `fs.readFileSync('a.txt', 'utf8')`
- C) `fs.readFile('a.txt', 'utf8', cb)`

:::answer
**B.** `readFileSync` blocks the single thread until the file is read, so every other request waits.
:::

### 2. What does this print?

```js
const data = fs.readFileSync('hi.txt');   // no encoding given
console.log(data);                        // ?
```

:::answer
A **Buffer**, like `<Buffer 68 69>`, not the text. Pass `'utf8'` or call `data.toString()` to get `'hi'`.
:::

### 3. You need to process a 3 GB CSV file. `readFile` or `createReadStream`?

:::answer
**`createReadStream`.** It reads the file in small pieces, so memory use stays small. `readFile` would try to load all 3 GB at once.
:::
