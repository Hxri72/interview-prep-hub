---
title: Child processes
stack: nodejs
order: 24
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - The child_process module lets Node start other programs (like git, ffmpeg or a Python script) and talk to them.
  - "spawn streams the output (good for big or long-running output); exec and execFile collect all output and give it to you at the end."
  - exec runs the command through a shell — never put user input into it, or attackers can run their own commands. Prefer execFile or spawn with an array of arguments.
  - fork starts another Node.js script with a built-in message channel (send / 'message').
  - A child process has its own memory and event loop, so a crash there doesn't crash your app.
cards:
  - q: spawn vs exec?
    a: spawn streams stdout/stderr as they arrive and has no output size limit. exec runs the command in a shell and buffers all output (default limit 1 MB) and gives it to a callback at the end.
  - q: Why is exec dangerous with user input?
    a: It runs through a shell, so input like "file.txt; rm -rf /" runs a second command. This is command injection. Use execFile or spawn with an arguments array.
  - q: What is fork() used for?
    a: To start another Node.js script as a child process with an IPC channel, so parent and child can send messages with send() and the 'message' event.
  - q: Child process vs worker thread?
    a: A child process is a separate program with its own memory — heavier but fully isolated, and it can be any language. A worker thread is lighter and runs JavaScript inside the same process.
---

## 💡 What is it?

Sometimes your Node app needs to run **another program**. For example: `git`, `ffmpeg` for videos, ImageMagick for images, or a Python script.

The **`child_process`** module lets Node start these programs. Each one runs as a separate **[process](glossary:process)** (a program running on its own, with its own memory). Node is the "parent" and the new program is the "child".

The parent can send input to the child, read its output, and find out when it has finished.

## 🏠 Real-life example

Think of **a school sending a student to a printing shop**.

- The school (your Node app) needs 500 question papers printed. It doesn't own a big printer.
- So it sends the job to the **printing shop** (another program, like ffmpeg). That's starting a **child process**.
- The shop has its own machines and staff. That's its **own memory**. If their printer jams, the school doesn't stop working. That's **isolation**.
- **spawn** = the shop sends papers back in bundles as they're printed. You get output bit by bit.
- **exec** = the shop sends all 500 papers together at the end. But the delivery van has a size limit (`maxBuffer`).
- **fork** = sending a **trained student from your own school** (another Node script) with a walkie-talkie, so you can keep chatting. That's the message channel.
- If you pass the shop a note written by a stranger, without checking it, they might do something you didn't want. That's **command injection**.

## 🧑‍💻 Code example

Save this as `child.js`. Run it with `node child.js`.

```js
const { execFile, spawn } = require('node:child_process');       // tools to start other programs

execFile('node', ['--version'], (err, stdout) => {               // run "node --version" and collect ALL its output
  if (err) return console.error('failed:', err.message);         // err is set if it couldn't start or exited with an error
  console.log('execFile got:', stdout.trim());                   // stdout = everything it printed, e.g. v24.11.0
});                                                              // end of the execFile callback

const script = 'for (let i = 1; i <= 3; i++) console.log("line " + i)'; // a tiny program for the child to run
const child = spawn('node', ['-e', script]);                     // start a child Node process; arguments go in an ARRAY
child.stdout.on('data', (chunk) => {                             // spawn gives output as a STREAM, chunk by chunk
  process.stdout.write(`spawn got: ${chunk}`);                   // print each chunk as soon as it arrives
});                                                              // end of the data handler
child.on('close', (code) => {                                    // runs when the child has finished
  console.log('spawn exit code:', code);                         // 0 means success; any other number means failure
});                                                              // end of the close handler
```

**Output** (your Node version, the line order and how the lines are split into chunks can be a little different):

```text
execFile got: v24.11.0
spawn got: line 1
line 2
line 3
spawn exit code: 0
```

**What to notice:**
- Both children ran **at the same time**. Node didn't wait for one to finish before starting the other.
- The lines from `spawn` arrive in chunks. Small output may come in one or two chunks. With big output, you get many.

## 🔍 Deeper version

**The four main functions:**

| Function | Uses a shell? | Output | Best for |
|---|---|---|---|
| `spawn(cmd, args)` | no (by default) | streams (`stdout`, `stderr`) | long-running jobs, big output (ffmpeg, big exports) |
| `execFile(file, args, cb)` | no | buffered, given at the end | short commands with small output (`git rev-parse HEAD`) |
| `exec(command, cb)` | **yes** | buffered, given at the end | quick shell one-liners with **no** user input |
| `fork(modulePath)` | no | streams + an **IPC** message channel | other Node.js scripts you want to talk to |

**IPC** means inter-process communication: a way for two processes to send messages to each other.

There are also `spawnSync`, `execSync` and `execFileSync`. They **block the event loop** until the child finishes. Use them only in scripts or at startup, never inside request handlers.

**maxBuffer.** `exec` and `execFile` keep all output in memory. The default limit is **1 MB** (`1024 * 1024` bytes). If the program prints more, the child is killed with an error. For big output, use `spawn`.

**Command injection (security).** `exec` passes your string to a shell (`/bin/sh` or `cmd.exe`). The shell understands `;`, `&&`, `|` and `$()`:

```js
exec(`convert ${req.query.file} out.png`);              // DANGEROUS: file = "a.png; rm -rf ~" runs a second command
execFile('convert', [req.query.file, 'out.png']);       // SAFER: the input is one argument, never parsed by a shell
```

Even with `execFile`, still validate the input (for example, allow only known file names).

**Stopping a child.** Use the `timeout` option, an `AbortSignal` (`{ signal }`), or `child.kill('SIGTERM')`. When your app shuts down, stop its children too, or they keep running ("orphan" processes).

**fork and messages:**

```js
const child = fork('report.js');                   // start another Node script with an IPC channel
child.send({ month: '2026-09' });                  // parent → child message
child.on('message', (result) => console.log(result)); // child → parent message (the child calls process.send())
```

**Child process vs worker thread:**
- A child process has its **own memory and its own process**. A crash can't take down your app. It can run **any** language. But it's heavier to start.
- A [worker thread](topic:nodejs/worker-threads) is lighter and shares the same process. It only runs JavaScript.

**Async usage.** `const { promisify } = require('node:util'); const execFileP = promisify(execFile); const { stdout } = await execFileP('git', ['rev-parse', 'HEAD']);`

## 🎯 Why do we use it?

- **Reuse powerful tools** that aren't written in JavaScript: ffmpeg (video and audio), ImageMagick (images), LibreOffice (documents to PDF), git, or a Python machine-learning script.
- **Isolation.** If the child crashes or leaks memory, your main server keeps running.
- **Use other CPU cores** for heavy work in a fully separate process.
- **Automation scripts:** build tools, deploy scripts and CLIs often run other commands.

## ⚠️ Common mistakes

- **Putting user input into `exec`.** This is a classic command-injection hole. Use `execFile` or `spawn` with an arguments array, and validate the input.
- **Using `exec` for big output.** It fails when output passes `maxBuffer`. Use `spawn` and stream it.
- **Using `execSync` inside a request handler.** It blocks the whole server until the command finishes.
- **Not handling `'error'` and the exit code.** A missing program (`ENOENT`) or a non-zero exit code goes unnoticed.

## 🗣️ How to answer in an interview

> "The `child_process` module lets Node start other programs as separate processes. There are four main functions. `spawn` streams stdout and stderr, so it's best for long-running jobs or big output. `execFile` runs a program directly and gives me the buffered output at the end. `exec` does the same but through a shell. And `fork` starts another Node script with an IPC channel, so we can send messages both ways.
>
> The main thing I'm careful about is security. `exec` uses a shell, so user input in the command string allows command injection. I'd use `execFile` or `spawn` with an arguments array and validate the input. I'd also avoid the sync versions inside request handlers, because they block the event loop.
>
> Compared to worker threads, child processes are heavier but fully isolated, and they can run any language, like ffmpeg or a Python script."

## 🔁 Follow-up questions

### What does `stdio: 'inherit'` do in spawn?

The child uses the parent's own terminal input and output. Its logs appear directly in your console, and you don't read them with `.on('data')`. It's handy for build scripts.

### How do you get the exit code of a child process?

Listen for the `'close'` (or `'exit'`) event: `child.on('close', (code, signal) => …)`. `0` means success. With `execFile` or `exec`, a non-zero code gives an `err` in the callback, with `err.code` set.

### What is an orphan or zombie process?

A child that keeps running after its parent has died, or a finished child that was never cleaned up. Avoid it by killing children on shutdown (handle `SIGTERM`) and always listening for their exit.

### Can a child process share memory with the parent?

No. Processes have separate memory. They communicate through stdin/stdout, IPC messages (with `fork`), files, or the network. That separation is what gives you isolation.

## ✅ Quick check

### 1. You need to convert a 2 GB video with ffmpeg and show progress as it runs. Which function?

- A) `exec`
- B) `spawn`
- C) `execSync`

:::answer
**B) `spawn`.** It streams the output (progress lines) as they arrive, with no buffer limit. `exec` buffers everything and `execSync` blocks the server.
:::

### 2. Why is `exec('ls ' + userInput)` dangerous?

:::answer
`exec` runs the string in a shell. Input like `; rm -rf ~` adds a second command. This is **command injection**. Use `execFile('ls', [userInput])` and validate the input.
:::

### 3. Which function gives you a built-in message channel to another Node.js script?

:::answer
**`fork()`.** The parent uses `child.send()` and `child.on('message')`. The child uses `process.send()` and `process.on('message')`.
:::
