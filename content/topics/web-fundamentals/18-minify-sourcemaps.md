---
title: Minification, source maps and hashed file names
stack: web-fundamentals
order: 18
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "Minification rewrites code to be smaller: it removes spaces and comments, shortens local names, and deletes code that can never run."
  - "Compression (gzip, brotli) is different. The server squeezes the file for the trip, and the browser unsqueezes it. Use both."
  - "A source map is a separate .map file that links the minified code back to your original lines, so DevTools and error trackers show readable stack traces."
  - "Don't publish source maps openly in production if your code is private. Upload them privately to your error-tracking tool."
  - "Hashed file names (index-CSd6dRXR.js) change only when the content changes, so browsers can cache files for a year safely."
cards:
  - q: What does a minifier do?
    a: Removes whitespace and comments, shortens local variable names, and deletes dead code — the program works the same but the file is smaller.
  - q: Minification vs gzip — what's the difference?
    a: Minification changes the code itself. Gzip/brotli compress the file during download and the browser decompresses it. They work together.
  - q: What is a source map?
    a: A .map file that maps each position in the minified code back to the original file, line and column, so errors and DevTools are readable.
  - q: Why do built files have a hash in the name?
    a: The hash comes from the file's content. New content gets a new name, so you can cache files forever and still ship updates instantly.
  - q: Should source maps be public in production?
    a: Usually not, if the code is private. Upload them to your error tracker instead, or keep them off the public server.
---

## 💡 What is it?

Before your app goes live, the build tool makes the JavaScript **as small as possible**. This is **minification**.

Small, ugly code is hard to debug. So the build can also make a **source map**: a "translation" file that points back to your original code.

It also gives each file a **hashed name**, like `index-CSd6dRXR.js`, so browsers can cache it safely.

## 🏠 Real-life example

Think of **sending a long letter by courier**.

- **Minification** = rewriting the letter in short form. "the Senior Recruiter of the Kochi office" becomes "S.R." inside the letter. Blank lines and side notes are removed. The meaning stays the same.
- **Compression (gzip/brotli)** = folding the letter tightly so it fits a small envelope. At the other end it's unfolded. The words don't change.
- **Source map** = a separate key that says "S.R. means the Senior Recruiter, line 4 of the original". You keep this key in your office.
- **Hashed file name** = a version stamp on the envelope. A new letter gets a new stamp, so nobody confuses it with the old one.

## 🧑‍💻 Code example

Make a folder, run `npm init -y`, then `npm install -D esbuild`. Save this as `jobs.js`:

```js
// Calculates statistics for a list of job applications.
export function summariseApplications(applications) { // input: an array of application objects
  const totalApplications = applications.length; // how many applications
  const shortlistedApplications = applications.filter((application) => application.status === 'shortlisted'); // only shortlisted
  const averageExperienceInYears = // average years of experience
    totalApplications === 0 ? 0 : applications.reduce((sum, application) => sum + application.experience, 0) / totalApplications; // 0 if empty
  if (false) { console.log('this debug line can never run'); } // dead code: false is never true
  return { totalApplications, shortlisted: shortlistedApplications.length, averageExperienceInYears }; // the summary object
} // end of summariseApplications
```

Minify it with a source map, and compare sizes:

```bash
npx esbuild jobs.js --minify --sourcemap --format=esm --outfile=dist/jobs.min.js # minify + write dist/jobs.min.js.map
cat dist/jobs.min.js # look at the result
node -e "const fs=require('fs'),z=require('zlib'); for (const f of ['jobs.js','dist/jobs.min.js']) { const b=fs.readFileSync(f); console.log(f, b.length, z.gzipSync(b).length, z.brotliCompressSync(b).length) }" # raw, gzip, brotli sizes in bytes
```

Real output:

```text
function o(e){const t=e.length,n=e.filter(s=>s.status==="shortlisted"),r=t===0?0:e.reduce((s,i)=>s+i.experience,0)/t;return{totalApplications:t,shortlisted:n.length,averageExperienceInYears:r}}export{o as summariseApplications};
//# sourceMappingURL=jobs.min.js.map

jobs.js 823 376 303
dist/jobs.min.js 266 215 171
```

The three numbers are bytes: **raw size**, **gzip size**, **brotli size**.

**What to notice:**
- Local names became one letter: `applications` → `e`, `totalApplications` → `t`.
- The **export name** stayed `summariseApplications`, because other files use that name.
- The object keys (`totalApplications`) stayed too. They are part of the result.
- The `if (false) {…}` dead code is **gone**.
- The last line tells the browser where the source map lives.
- Size went **823 → 266 bytes** from minifying (most of the saving is comments and long names), and **171 bytes** with brotli on top.

## 🔍 Deeper version

**What a minifier does, step by step.**

| Trick | Example |
|---|---|
| Remove whitespace and comments | new lines, indents, `// notes` disappear |
| Rename local variables | `totalApplications` → `t` (only names nobody outside can see) |
| Remove dead code | `if (false) {…}`, unused functions (with tree shaking) |
| Shorten syntax | `5000` → `5e3`, `true` → `!0` |
| Inline constants | `const DEBUG = false; if (DEBUG)…` → removed |

Common minifiers: **Terser** (classic, used by webpack), **esbuild**, **SWC**, and **Oxc** (Vite 8's default).

**Minification vs compression.**

| | Minification | Compression (gzip / brotli) |
|---|---|---|
| When | at build time | when the server sends the file |
| Changes the code? | yes | no — the browser restores the exact bytes |
| Who does it | the bundler | the web server or CDN (e.g. CloudFront) |
| Header | — | `Content-Encoding: br` or `gzip` |

Use **both**. Brotli usually beats gzip for text files.

**How a source map works.** The `.map` file is JSON. It has the original file names, often their full source text (`sourcesContent`), and a compact `mappings` string. Real start of the file:

```text
{
  "version": 3,
  "sources": ["../jobs.js"],
  "sourcesContent": ["// Calculates statistics for a list of job applications.\nexport function summariseApplications(appli..."],
  "mappings": "..."
}
```

When an error happens at, say, "line 1, column 57" of the minified file, DevTools or an error tracker looks that position up in `mappings`. It then shows the matching line in `jobs.js`, with your real names.

**Source maps and privacy.** `sourcesContent` contains your **whole original code**. If the `.map` file is public, anyone can read your source. Common choices:
- Don't generate maps for production (`build.sourcemap: false`, Vite's default).
- Generate **hidden** maps (no `sourceMappingURL` comment), and upload them only to the error tracker (Sentry and similar).
- Keep maps public only for open-source apps.

Real numbers: building the small Vite app from the [Vite topic](topic:web-fundamentals/vite) with `--sourcemap` gave a **219 kB** JS file and a **1,044 kB** map. Maps are big, so never ship them to users by accident.

**Hashed file names (cache busting).** The hash is calculated from the file's **content**. I tested it with real Vite builds:

```text
before:                      index-CSd6dRXR.js
after a one-character edit:  index-Ca7D2zQk.js
after undoing the edit:      index-CSd6dRXR.js   ← same content, same name again
```

So the server can tell browsers: "cache files in `/assets/` for one year" (`Cache-Control: max-age=31536000, immutable`). `index.html` itself is **not** hashed and is cached briefly. It points to the new file names after each deploy. See [browser caching](topic:web-fundamentals/browser-caching).

## 🎯 Why do we use it?

- **Faster loading.** Fewer bytes mean faster downloads, especially on phones with slow networks.
- **Debuggable production errors.** Source maps turn `o is not a function at 1:57` into a real file and line.
- **Instant updates with long caching.** Hashed names let browsers keep files for a year, yet users get new code right after a deploy.

## ⚠️ Common mistakes

- **Publishing full source maps by accident.** Your private code becomes readable. Check what your build uploads.
- **Thinking minification hides or protects code.** It doesn't. Minified code can be read and formatted again. Never put secrets in frontend code.
- **Caching `index.html` for a long time.** Users keep loading old file names. Cache `index.html` briefly (or not at all) and the hashed assets for a long time.
- **Confusing minify with gzip.** Turning on gzip doesn't minify, and minifying doesn't compress. You want both.

## 🗣️ How to answer in an interview

> "In a production build, the bundler minifies the JavaScript. It removes whitespace and comments, renames local variables to short names, and drops dead code. Exported names and object keys stay the same. On top of that, the server or CDN compresses files with brotli or gzip during download. That's separate, because the browser gets back the exact same bytes.
>
> Because minified code is unreadable, we generate source maps. A `.map` file links every position in the bundle back to the original file and line, so error trackers show real stack traces. The map contains the original source, so for private apps I'd keep it off the public server and upload it to the error tracker. Finally, files get content hashes in their names, so we can cache them for a year and still ship updates, because new content means a new file name."

[FILL IN: how your team handled production errors from minified code — e.g. source maps in an error tracker. Only if true.]

## 🔁 Follow-up questions

### If the hash changes every build, won't users download everything again?

No, only files whose **content** changed get a new hash. Bundlers also split vendor code (React, libraries) into its own chunk. It changes rarely, so it stays cached across many deploys.

### What's tree shaking, and how is it related?

Tree shaking removes **exports nobody imports**, across files. Minification works inside the code that's left. Together they shrink the bundle. See [tree shaking](glossary:tree-shaking).

### Why do some minifiers keep function names?

Some code depends on `fn.name`, for example for logging or dependency injection. Options like `keep_fnames` keep those names, at a small size cost.

### What's an "eval" source map in webpack?

A fast development-only style: each module is wrapped in `eval()` with its map inside. It's quick to rebuild, but too big and slow for production.

## ✅ Quick check

### 1. Which of these does a minifier change?

- A) The name of a local variable inside a function
- B) The name of an exported function
- C) A key in a returned object

:::answer
**A only.** Exported names and object keys are visible to other code, so they must stay the same. Local names are safe to shorten.
:::

### 2. A file is minified and then served with brotli. What does the browser end up running?

:::answer
**The minified code.** Brotli only squeezes the file for the trip. The browser decompresses it back to the exact minified bytes.
:::

### 3. You change one CSS colour and rebuild. What happens to the hashed file names?

:::answer
**Only the files whose content changed get a new hash** — here, the CSS file. Unchanged JavaScript keeps its old name and stays cached.
:::
