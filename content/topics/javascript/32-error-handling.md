---
title: "Error handling: try/catch and custom errors"
stack: javascript
order: 32
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "try runs risky code, catch handles the error, finally always runs (error or not)."
  - throw stops the function and sends an error up to the nearest catch.
  - Make custom error classes with extends Error to add a clear name and extra data (like a field or status code).
  - "Wrap low-level errors with new Error('message', { cause: err }) so you keep the original reason."
  - try/catch only catches async errors when you await the promise inside the try.
cards:
  - q: What does finally do?
    a: It runs after try (and catch) every time, whether there was an error or not. Use it for cleanup, like closing a file or hiding a loading spinner.
  - q: Why create a custom error class?
    a: To give errors a clear name and extra data, like a field or HTTP status. Then code can check err instanceof ValidationError and react differently.
  - q: What is the cause option on Error?
    a: "new Error('Could not load', { cause: err }) keeps the original error inside the new one, so you don't lose the real reason."
  - q: Does try/catch catch an error from a promise you didn't await?
    a: No. The promise rejects later, after the try block has finished. You must await it inside the try, or use .catch().
  - q: Should you throw strings, like throw 'oops'?
    a: No. Always throw Error objects. They have a stack trace and a name, which makes debugging much easier.
---

## 💡 What is it?

Sometimes code fails: broken JSON, a missing file, bad user input. JavaScript tells you by **throwing an error**.

You handle errors with **try / catch / finally**:
- `try` runs code that might fail.
- `catch` runs only if something failed. It receives the error.
- `finally` runs **every time**, for cleanup.

You can also make your **own error types**, like `ValidationError`, to explain exactly what went wrong.

## 🏠 Real-life example

Think of a **school science experiment**.

- **Doing the experiment carefully** = `try`.
- **Something spills** = an error is **thrown**.
- **The teacher with the first-aid kit** = `catch`. They handle the problem so the class can continue.
- **Cleaning the lab bench at the end, whether it went well or not** = `finally`.
- **Writing "Acid spill at bench 3" instead of just "Problem"** = a **custom error** with a clear name and details.
- **Writing "Spill — because the beaker had a crack"** = the error's **cause**.

## 🧑‍💻 Code example

Save this as `errors.js`. Run it with `node errors.js`.

```js
class ValidationError extends Error {                     // our own error type, built on the normal Error
  constructor(message, field) {                           // message = what went wrong; field = which input
    super(message);                                       // let Error set up the message and the stack trace
    this.name = 'ValidationError';                        // a clear name instead of plain "Error"
    this.field = field;                                   // extra data: which field failed
  }                                                       // end of constructor
}                                                         // end of ValidationError

function parseAge(text) {                                 // turns text like "27" into a number
  const age = Number(text);                               // Number('abc') gives NaN (Not a Number)
  if (Number.isNaN(age)) {                                // the text was not a number
    throw new ValidationError('Age must be a number', 'age'); // stop here and throw our error
  }                                                       // end of the check
  return age;                                             // all good → give back the number
}                                                         // end of parseAge

function loadProfile(json) {                              // reads a profile from a JSON string
  try {                                                   // code that might fail
    const data = JSON.parse(json);                        // throws SyntaxError if the JSON is broken
    return { ...data, age: parseAge(data.age) };          // may throw ValidationError
  } catch (err) {                                         // runs if anything above threw
    if (err instanceof ValidationError) throw err;        // already a clear error → pass it on unchanged
    throw new Error('Could not load profile', { cause: err }); // wrap other errors, keep the original as "cause"
  } finally {                                             // runs every time, error or not
    console.log('finished trying:', json);                // e.g. close a file or stop a spinner
  }                                                       // end of try/catch/finally
}                                                         // end of loadProfile

for (const input of ['{"age":"27"}', '{"age":"abc"}', '{age:}']) { // one good input, two bad ones
  try {                                                   // call loadProfile safely
    console.log('OK:', loadProfile(input).age);           // print the age if it worked
  } catch (err) {                                         // something went wrong
    console.log(`${err.name}: ${err.message}`, err.cause ? `(cause: ${err.cause.name})` : ''); // show the error and its cause
  }                                                       // end of try/catch
}                                                         // end of the loop
```

**Output:**

```text
finished trying: {"age":"27"}
OK: 27
finished trying: {"age":"abc"}
ValidationError: Age must be a number 
finished trying: {age:}
Error: Could not load profile (cause: SyntaxError)
```

Notice: `finally` printed every time, even when an error was thrown or a value was returned.

## 🔍 Deeper version

**The built-in error types:**

| Type | When you see it |
|---|---|
| `Error` | the general type; everything else extends it |
| `TypeError` | using a value the wrong way, like `null.name` or calling a non-function |
| `ReferenceError` | using a variable that doesn't exist |
| `SyntaxError` | broken code, or `JSON.parse` on broken JSON |
| `RangeError` | a number out of range, like `new Array(-1)` |
| `AggregateError` | several errors at once, e.g. from `Promise.any` |

Every `Error` has `name`, `message` and `stack`. The **stack trace** shows which functions were running when it was thrown.

**Custom error classes.** Extending `Error` gives you a clear `name` and extra fields. Backends often add an HTTP status:

```js
class AppError extends Error {                      // an error type for API responses
  constructor(message, statusCode = 500) {          // statusCode defaults to 500 (server error)
    super(message);                                 // set the message and stack
    this.name = 'AppError';                         // clear name
    this.statusCode = statusCode;                   // e.g. 404 for "not found"
  }                                                 // end of constructor
}                                                   // end of AppError
throw new AppError('Candidate not found', 404);    // the error middleware can send status 404
```

The Express error middleware can then read `err.statusCode` (see [Async errors and AppError](topic:express/async-errors)).

**Error `cause`.** `new Error('Could not load profile', { cause: err })` wraps a low-level error inside a clearer one. Logs and debuggers can show both. You get a clear message **and** the real reason.

**Async errors.** `try/catch` only catches a promise's error if you **`await` it inside the `try`**:

```js
try {                                    // start the try block
  fetchData();                           // NOT awaited → the rejection happens later, outside this try
} catch (e) {}                           // never runs for that rejection

try {                                    // start the try block
  await fetchData();                     // awaited → a rejection is thrown right here
} catch (e) { console.log('caught'); }   // this runs
```

Rejections that nobody catches become "unhandled rejections". In Node, they crash the process by default (see [Error handling in Node](topic:nodejs/error-handling)). In the browser, they show up in the console and in the `unhandledrejection` event.

**Good habits:**
- Catch errors only where you can **do something** (retry, show a message, add context). Otherwise let them bubble up to one central handler.
- Don't swallow errors with an empty `catch {}`. At least log them.
- Never show stack traces or internal details to end users.

## 🎯 Why do we use it?

- **The app keeps running.** One bad input shouldn't crash the whole page or server.
- **Clear messages.** Users see "Age must be a number", not a white screen.
- **Easier debugging.** Custom names, extra fields and `cause` tell you exactly what happened and where.
- **Cleanup always happens** with `finally`. Spinners stop, files close, locks are released.

## ⚠️ Common mistakes

- **Empty catch blocks** that hide errors. The bug is still there, now just invisible.
- **Throwing strings** (`throw 'oops'`). Strings have no stack trace and no name. Throw `Error` objects.
- **Forgetting `await` inside `try`.** The error escapes the `try` and becomes an unhandled rejection.
- **Catching everything everywhere.** Too many local catches make the code messy and errors get lost. Handle them in one central place when you can.

## 🗣️ How to answer in an interview

> "I use try/catch for code that can fail, and finally for cleanup that must always run, like hiding a loader or closing a connection. With async code, I make sure to await the promise inside the try, otherwise the rejection escapes.
>
> I always throw Error objects, not strings, because they carry a stack trace. For domain errors I create custom classes that extend Error, like ValidationError or an AppError with a statusCode. That lets a central handler, such as Express error middleware, decide the response with an instanceof check.
>
> When I catch a low-level error and rethrow a clearer one, I pass the original as the cause option, so the logs keep the real reason. And I only catch errors where I can actually handle them. Everything else goes to one central handler and gets logged."

## 🔁 Follow-up questions

### Why set `this.name` in a custom error class?

Without it, the name is just `"Error"`, so logs and messages look the same for every error type. Setting `this.name = 'ValidationError'` makes the logs clear. The `instanceof` check works either way.

### What happens if `finally` has a `return`?

A `return` inside `finally` replaces any earlier `return` or thrown error. The error is silently lost. That's why you should avoid `return` in `finally`.

### How do you handle errors in a promise chain without async/await?

Add `.catch(err => ...)` at the end of the chain. One `.catch` handles a rejection from any `.then` above it. `.finally()` also exists for cleanup.

### How do you catch errors in React rendering?

Use an **error boundary** component. A `try/catch` inside a component can't catch errors thrown while rendering child components. Error boundaries show a fallback UI instead of a white screen.

## ✅ Quick check

### 1. What does this print?

```js
function test() {                       // a small function
  try {                                 // start the try block
    return 'from try';                  // return a value
  } finally {                           // cleanup block
    console.log('cleanup');             // print a message
  }                                     // end of try/finally
}                                       // end of test
console.log(test());                    // ?
```

:::answer
**`cleanup`, then `from try`.** `finally` runs before the function actually returns, even after a `return`.
:::

### 2. Does this `catch` run when `loadData()` rejects?

```js
try {                                   // start the try block
  loadData();                           // returns a promise that rejects (not awaited)
} catch (e) {                           // catch block
  console.log('caught');                // does this print?
}                                       // end of try/catch
```

:::answer
**No.** Without `await`, the promise rejects **after** the `try` block has finished. Write `await loadData()` inside an `async` function, or use `.catch()`.
:::

### 3. Which is better: `throw 'Not found'` or `throw new Error('Not found')`?

:::answer
**`throw new Error('Not found')`.** Error objects have a name and a stack trace that shows where the problem happened. A string has neither.
:::
