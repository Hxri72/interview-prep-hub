---
title: Controllers and routing
stack: nestjs
order: 5
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - A controller is a class with @Controller('path'). It handles incoming requests and returns responses.
  - Method decorators (@Get, @Post, @Put, @Patch, @Delete) map HTTP methods and paths to methods.
  - Whatever the method returns is sent as the response. Objects become JSON automatically.
  - "Default status codes: 200 for most methods, 201 for POST. Change them with @HttpCode()."
  - Keep controllers thin. They read the request and call a service; the service holds the logic.
cards:
  - q: What does a NestJS controller do?
    a: Receives HTTP requests for a path, reads the request data, calls a service, and returns the response.
  - q: What status code does a @Post() route return by default?
    a: 201 Created. Other methods return 200. Use @HttpCode() to change it.
  - q: How do you send JSON from a controller?
    a: Just return an object or array. Nest serialises it to JSON for you.
  - q: Why avoid @Res() in controllers?
    a: With @Res() you take over the response yourself, so Nest's automatic JSON, interceptors and some features are skipped.
---

## 💡 What is it?

A **controller** handles incoming HTTP requests. It's a class marked with `@Controller('path')`.

Inside it, each method gets a decorator like `@Get()` or `@Post()`. That links a URL and HTTP method to the method.

Whatever the method **returns** becomes the response. If you return an object, Nest sends it as JSON.

## 🏠 Real-life example

Think of **a bank with counters**.

- **The bank branch** = the module.
- **One counter, like "Loans"** = a **controller** at the path `/loans`.
- **The windows at that counter: "apply", "check status", "close"** = methods with `@Post()`, `@Get(':id')`, `@Delete(':id')`.
- **The counter clerk** = the controller method. They take your form and pass it on.
- **The loan officer in the back room** = the **service**. They do the real checks.
- **The receipt you get back** = the return value, sent as the response.

A good clerk doesn't approve loans themselves. In the same way, a controller passes the work to a service.

## 🧑‍💻 Code example

In a `nest new` project, save as `src/books.controller.ts`. Add `BooksController` to `controllers` in `src/app.module.ts`. Run `npm run start:dev`.

```ts
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common'; // load decorators

const books = [{ id: 1, title: 'Wings of Fire' }];            // a fake in-memory "table" with one book

@Controller('books')                                          // every route here starts with /books
export class BooksController {                                // the controller class
  @Get()                                                      // GET /books
  findAll(@Query('search') search?: string) {                 // read ?search=... from the URL (optional)
    if (!search) return books;                                // no search → return all books (200)
    return books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase())); // simple text match
  }                                                           // end of findAll

  @Get(':id')                                                 // GET /books/:id (:id = a value in the path)
  findOne(@Param('id', ParseIntPipe) id: number) {            // read :id and convert it to a number
    return books.find((b) => b.id === id) ?? null;            // the book, or null if not found
  }                                                           // end of findOne

  @Post()                                                     // POST /books (201 Created by default)
  create(@Body() body: { title: string }) {                   // read the JSON body
    const book = { id: books.length + 1, title: body.title }; // make a new book with the next id
    books.push(book);                                         // save it in our fake table
    return book;                                              // send the new book back as JSON
  }                                                           // end of create

  @Delete(':id')                                              // DELETE /books/:id
  @HttpCode(204)                                              // 204 = success, no body
  remove(@Param('id', ParseIntPipe) id: number) {             // read and convert :id
    const index = books.findIndex((b) => b.id === id);        // find the book's position (-1 = not found)
    if (index !== -1) books.splice(index, 1);                 // remove 1 item at that position
  }                                                           // end of remove
}                                                             // end of BooksController
```

```text
$ curl -X POST -H "Content-Type: application/json" -d '{"title":"Malgudi Days"}' http://localhost:3000/books
{"id":2,"title":"Malgudi Days"}            ← status 201

$ curl "http://localhost:3000/books?search=wings"
[{"id":1,"title":"Wings of Fire"}]

$ curl -i -X DELETE http://localhost:3000/books/2
HTTP/1.1 204 No Content
```

To keep it short, the logic lives in the controller here. In real code it belongs in a service. See [providers](topic:nestjs/providers).

## 🔍 Deeper version

**Routing decorators:**

| Decorator | HTTP method | Example |
|---|---|---|
| `@Get(path?)` | GET | `@Get(':id')` |
| `@Post(path?)` | POST | `@Post()` |
| `@Put(path?)` / `@Patch(path?)` | PUT / PATCH | `@Patch(':id')` |
| `@Delete(path?)` | DELETE | `@Delete(':id')` |
| `@All(path?)` | any method | rarely used |

The final URL = global prefix + controller path + method path. With `app.setGlobalPrefix('api')`, `@Controller('books')` and `@Get(':id')` give `/api/books/:id`.

**Reading request data** (more in [DTOs and request data](topic:nestjs/dtos-and-request-data)):

| Decorator | Express equivalent |
|---|---|
| `@Param('id')` | `req.params.id` |
| `@Query('page')` | `req.query.page` |
| `@Body()` | `req.body` |
| `@Headers('authorization')` | `req.headers.authorization` |
| `@Req()` / `@Res()` | the raw `req` / `res` objects |

**Responses.**
- Return a value → Nest sends it. Objects and arrays become JSON. A returned promise is awaited first.
- Status is **200** by default, but **201** for `@Post()`. Change it with `@HttpCode(204)`.
- Set headers with `@Header('Cache-Control', 'no-store')`, and redirects with `@Redirect(url, 301)`.
- To return an error, **throw** an exception, like `throw new NotFoundException('Book not found')`. That sends a 404. See [exception filters](topic:nestjs/exception-filters).

**Route order.** Routes are matched in the order they are declared. Put fixed paths like `@Get('popular')` **before** `@Get(':id')`. Otherwise `popular` is treated as an id.

**`@Res()` and passthrough.** Using `@Res()` puts you in "Express mode": you must call `res.json()` yourself, and interceptors can't change the result. If you only need to set a cookie, use `@Res({ passthrough: true })`. Then you can still return a value normally.

**Versioning.** `app.enableVersioning()` lets you serve `/v1/books` and `/v2/books` with `@Version('2')` on a controller or method.

## 🎯 Why do we use it?

- **Clear mapping.** You can see the URL, method and handler in one place.
- **Less boilerplate.** No `res.status().json()` on every route; just return the data.
- **Built-in hooks.** Because Nest controls the response, pipes, guards, interceptors and filters can all plug in.
- **Thin layer.** It keeps HTTP details separate from business logic in services.

## ⚠️ Common mistakes

- **Business logic in the controller.** Database calls and rules belong in a service, so you can reuse and test them.
- **`@Get(':id')` above `@Get('popular')`.** The fixed route is never reached.
- **Using `@Res()` and also returning a value.** The request hangs or the return value is ignored. Pick one style.
- **Returning `null` for "not found".** That sends 200 with an empty body. Throw `NotFoundException` to send a proper 404.

## 🗣️ How to answer in an interview

> "A controller is a class with `@Controller()` that handles requests for a path. Each method uses a decorator like `@Get`, `@Post` or `@Delete` with an optional sub-path. I read input with `@Param`, `@Query` and `@Body`, usually with DTOs and pipes for validation.
>
> I just return data and Nest serialises it to JSON. The default status is 200, or 201 for POST, and I change it with `@HttpCode`. For errors I throw built-in exceptions like `NotFoundException`.
>
> I keep controllers thin. They handle HTTP and call a service that has the business logic. I avoid `@Res()` because it bypasses interceptors; if I need to set a cookie I use `passthrough: true`.
>
> It's the same separation I follow in Express-style handlers at work, where the handler only reads the request and calls service code."

## 🔁 Follow-up questions

### How do you make a controller method async?

Mark it `async` and return a promise, for example `async findAll() { return this.booksService.findAll(); }`. Nest waits for the promise and sends the result.

### How do you return a 404 from a controller?

Throw `new NotFoundException('Book not found')`. Nest's built-in exception filter turns it into a 404 JSON response.

### What's the difference between `@Put` and `@Patch`?

`@Put` usually replaces the whole resource. `@Patch` updates only the fields you send. Nest just maps the HTTP method; the meaning depends on your code.

### How do you add `/api` before every route?

Call `app.setGlobalPrefix('api')` in `main.ts` before `app.listen()`.

## ✅ Quick check

### 1. What status code does this return on success?

```ts
@Post()                         // POST route
create(@Body() body: any) {     // read the body
  return { ok: true };          // return an object
}                               // end of create
```

:::answer
**201 Created.** `@Post()` routes return 201 by default.
:::

### 2. A controller has `@Get(':id')` first and `@Get('popular')` second. What happens with `GET /books/popular`?

:::answer
It matches **`@Get(':id')`** with `id = 'popular'`. With `ParseIntPipe` it returns a 400 error. Move `@Get('popular')` above `@Get(':id')`.
:::

### 3. What's the right way to send "not found"?

- A) `return null`
- B) `throw new NotFoundException()`
- C) `console.log('not found')`

:::answer
**B.** It sends a proper **404** response through Nest's exception filter.
:::
