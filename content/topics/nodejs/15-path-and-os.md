---
title: The path and os modules
stack: nodejs
order: 15
level: Basic
mustKnow: false
askedFrequency: sometimes
summary:
  - The path module builds and splits file paths safely, so the same code works on Windows (\) and Mac/Linux (/).
  - "path.join glues parts together; path.resolve makes a full (absolute) path; basename, dirname and extname split a path into pieces."
  - Never build paths by joining strings with '/'. Use path.join.
  - The os module tells you about the computer — CPU count, memory, operating system, home folder and line ending.
  - os.availableParallelism() (or os.cpus().length) is often used to decide how many worker processes to start.
cards:
  - q: Why use path.join instead of 'folder' + '/' + 'file'?
    a: It uses the right separator for the operating system (\ on Windows, / elsewhere), removes double slashes and handles ".." correctly.
  - q: What is the difference between path.join and path.resolve?
    a: path.join just glues the parts together. path.resolve always gives a full (absolute) path, starting from the current working directory if needed.
  - q: "What do basename, dirname and extname return for /app/src/user.js?"
    a: "basename → 'user.js', dirname → '/app/src', extname → '.js'."
  - q: What is the os module used for?
    a: To get information about the machine — CPU cores, total and free memory, OS type, hostname, home folder — for example to decide how many cluster workers to start.
---

## 💡 What is it?

**`path`** and **`os`** are two small modules built into Node.js.

- **`path`** helps you build and split **file paths**. A path is the address of a file, like `/app/src/user.js`. It works correctly on every operating system.
- **`os`** tells you about the **computer** your code runs on. For example, how many CPU cores it has, how much memory, and which operating system.

## 🏠 Real-life example

Think of **writing a postal address**.

In India you write: name, house, street, city, PIN. Another country might use a different order and different separators. A good **address helper** puts the parts in the right format for each country, so the letter always arrives.

- The **address helper** = `path`. You give it the parts ("src", "user.js"). It writes them the right way for Windows (`\`) or Mac/Linux (`/`).
- **Reading a part of an address** ("which city is this?") = `path.basename` and `path.dirname`.
- A **card about your house** (how many rooms, how big, which city) = `os`. It tells you about the machine itself.

## 🧑‍💻 Code example

Save this as `paths.mjs`. Run `node paths.mjs`.

```js
import path from 'node:path';                                    // built-in module for file paths
import os from 'node:os';                                        // built-in module for computer info

const file = path.join('/app', 'src', '..', 'uploads', 'cv.pdf'); // glue parts; '..' means "go up one folder"
console.log('join:', file);                                       // '/app/uploads/cv.pdf'
console.log('base:', path.basename(file));                        // the last part (file name) → 'cv.pdf'
console.log('dir:', path.dirname(file));                          // the folder part → '/app/uploads'
console.log('ext:', path.extname(file));                          // the extension → '.pdf'
console.log('resolve:', path.resolve('logs', 'app.log'));         // full path, starting from the current folder
console.log('here:', path.join(import.meta.dirname, 'data.json')); // a file next to THIS script — the safe way

console.log('cores:', os.availableParallelism());                 // how many tasks can run at once (CPU cores)
console.log('memory GB:', (os.totalmem() / 1024 ** 3).toFixed(1)); // total RAM, bytes → gigabytes
console.log('platform:', os.platform());                          // 'darwin' (Mac), 'linux' or 'win32'
console.log('home:', os.homedir());                               // the user's home folder
```

**Output (on a Mac; yours will differ):**

```text
join: /app/uploads/cv.pdf
base: cv.pdf
dir: /app/uploads
ext: .pdf
resolve: /Users/hari/demo/logs/app.log
here: /Users/hari/demo/data.json
cores: 8
memory GB: 16.0
platform: darwin
home: /Users/hari
```

## 🔍 Deeper version

**`path` functions you'll use most:**

| Function | What it does | Example → result |
|---|---|---|
| `join(...parts)` | glues parts with the right separator and tidies `..` and `//` | `join('a', '../b', 'c.txt')` → `b/c.txt` |
| `resolve(...parts)` | gives a **full (absolute) path**; starts from `process.cwd()` if needed | `resolve('x.txt')` → `/current/folder/x.txt` |
| `basename(p, ext?)` | last part; can drop the extension | `basename('/a/cv.pdf', '.pdf')` → `cv` |
| `dirname(p)` | the folder part | `/a/cv.pdf` → `/a` |
| `extname(p)` | the extension | `.pdf` |
| `parse(p)` | everything in one object | `{ root, dir, base, name, ext }` |
| `relative(from, to)` | how to get from one path to another | `relative('/a/b', '/a/c')` → `../c` |
| `normalize(p)` | cleans up `..`, `.` and double slashes | `/a//b/../c` → `/a/c` |
| `sep` | the separator | `/` or `\` |

**`join` vs `resolve`:** `join` doesn't care if the result is relative or absolute. It just glues. `resolve` works from right to left until it has a full path. If a part starts with `/`, it starts again from there.

**Security: path traversal.** Never pass user input straight into a path. Say a user sends the file name `../../etc/passwd`. Then `path.join(uploadsDir, userInput)` points **outside** your uploads folder. Always check the result:

```js
const safe = path.resolve(uploadsDir, userInput);                // full path the user is asking for
if (!safe.startsWith(uploadsDir + path.sep)) {                   // is it still inside the uploads folder?
  throw new Error('Invalid file path');                          // no → refuse the request
}                                                                // end of the check
```

Better still, don't use user names for files at all. Save uploads with your own random names, like a UUID.

**Useful `os` functions:**

| Function | Gives you |
|---|---|
| `os.availableParallelism()` | how many tasks can run in parallel (preferred over `os.cpus().length`) |
| `os.cpus()` | details for each CPU core |
| `os.totalmem()`, `os.freemem()` | memory in bytes |
| `os.platform()`, `os.type()`, `os.release()` | operating system details |
| `os.hostname()` | the machine's name (useful in logs) |
| `os.homedir()`, `os.tmpdir()` | home folder, temporary-files folder |
| `os.EOL` | line ending: `\n` (Mac/Linux) or `\r\n` (Windows) |
| `os.loadavg()` | average CPU load (Mac/Linux only) |

:::version[Version note]
`os.availableParallelism()` was added in **Node 18.14 / 19.4**. It is cheaper and more accurate than `os.cpus().length`, especially inside containers.
:::

## 🎯 Why do we use it?

- **Code that works on every computer.** Your teammate may use Windows, while the server runs Linux. `path.join` handles both.
- **No broken paths.** It removes double slashes and `..` mistakes.
- **Safer file handling.** `path.resolve` + a prefix check stops path-traversal attacks.
- **Smart scaling.** `os.availableParallelism()` tells you how many cluster workers to start. See [cluster and PM2](topic:nodejs/cluster-and-pm2).
- **Better logs and health checks.** Add `os.hostname()` and memory numbers.

## ⚠️ Common mistakes

- **Building paths with `+ '/' +`.** It breaks on Windows and makes double slashes.
- **Using `process.cwd()` to find your own files.** Use `import.meta.dirname` (or `__dirname`) instead. See [global objects](topic:nodejs/global-objects).
- **Joining user input into a path without checking it.** This allows `../../` attacks.
- **Mixing up `join` and `resolve`.** `resolve('/a', '/b')` gives `/b`, not `/a/b`.

## 🗣️ How to answer in an interview

> "The path module builds and splits file paths in a way that works on every operating system. I use path.join to glue parts together, because it uses the right separator and cleans up double slashes and '..'. path.resolve gives a full absolute path. And basename, dirname and extname split a path into pieces.
>
> I always build paths from the file's own folder, using __dirname or import.meta.dirname, not from process.cwd. For user input, like file downloads, I resolve the path and check that it's still inside the allowed folder, to block path traversal.
>
> The os module gives information about the machine: CPU count, memory, platform and hostname. A common use is os.availableParallelism, to decide how many cluster workers to start."

## 🔁 Follow-up questions

### What is path traversal, and how do you prevent it?

It's an attack where the user sends something like `../../secret.env` as a file name, to read files outside the allowed folder. To stop it: resolve the full path and check that it starts with the allowed folder. Even better, never use user input as a file name.

### What does `path.resolve()` return with no arguments?

The current working directory, the same as `process.cwd()`.

### What is the difference between `path.posix` and `path.win32`?

`path` uses the rules of the current operating system. `path.posix` always uses `/` rules, and `path.win32` always uses `\` rules. They're useful when you handle paths for a *different* system, like URL paths, which always use `/`.

### Why might `os.cpus().length` give the wrong number in Docker?

A container may be limited to fewer CPUs than the machine has. `os.availableParallelism()` is designed to give a better number for how much work can really run in parallel.

## ✅ Quick check

### 1. What does `path.join('/app', 'src', '../uploads', 'a.png')` return (on Mac/Linux)?

:::answer
**`/app/uploads/a.png`.** The `..` goes up one folder from `src`, back to `/app`.
:::

### 2. What does `path.extname('report.final.pdf')` return?

- A) `.final.pdf`
- B) `.pdf`
- C) `pdf`

:::answer
**B) `.pdf`.** `extname` returns the part from the **last** dot, including the dot.
:::

### 3. A user asks to download `../../.env`. You do `path.join(uploadsDir, name)`. Is that safe?

:::answer
**No.** The path climbs out of `uploadsDir` and could expose secrets. Resolve the full path and check that it still starts with `uploadsDir`, or don't use user input as a file name at all.
:::
