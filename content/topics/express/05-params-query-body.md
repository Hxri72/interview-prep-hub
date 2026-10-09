---
title: Route params vs query strings vs body
stack: express
order: 5
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Route params (req.params) are part of the path and point to ONE thing: /students/7 → { id: '7' }."
  - "Query strings (req.query) come after ? and are optional extras like filters, sorting and paging: ?page=2&sort=name."
  - "The body (req.body) carries the data you create or update, usually JSON in POST, PUT and PATCH. It needs express.json()."
  - Params and query values are always strings. Convert and validate them before use.
  - "Rule of thumb: WHICH item → params. HOW to show the list → query. WHAT to save → body."
cards:
  - q: When do you use a route param?
    a: "To identify one specific resource in the path, like /students/7 or /orders/42/items/3."
  - q: When do you use a query string?
    a: "For optional settings on a request, mostly on lists: filters, search, sorting and paging, like ?status=active&page=2."
  - q: When do you use the request body?
    a: "To send the data you want to create or update, usually as JSON in POST, PUT or PATCH requests."
  - q: Why is req.body undefined even though the client sent JSON?
    a: "The JSON body parser is missing. Add app.use(express.json()) before your routes. The client must also send Content-Type: application/json."
  - q: What type are values in req.params and req.query?
    a: "Strings (or arrays of strings for repeated query keys). ?page=2 gives '2', so convert with Number() and validate."
---

## 💡 What is it?

A client can send data to your server in **three places**:

1. **Route params**: inside the path. `/students/7` → `req.params.id` is `'7'`.
2. **Query string**: after the `?`. `/students?page=2` → `req.query.page` is `'2'`.
3. **Body**: the "package" sent with the request, usually JSON. You read it with `req.body`.

Each place has its own job. Choosing the right one makes your [API](glossary:api) clear and easy to use.

## 🏠 Real-life example

Think of **ordering food on a delivery app**.

- **"Restaurant number 7"** → which restaurant you mean. That's a **route param**: `/restaurants/7`.
- **"Show only veg dishes, cheapest first, page 2"** → extra settings for the menu list. That's the **query string**: `?veg=true&sort=price&page=2`.
- **Your actual order** (2 dosas, 1 coffee, your address) → the real data you send. That's the **body**.

- **Params** = *which* thing.
- **Query** = *how* you want the list shown (optional).
- **Body** = *what* you are sending to be saved.

You wouldn't write your full order inside the restaurant number. And you wouldn't send "page 2" as your food order. Each piece of information has its place.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install express`. Save as `shop.js`. It uses CommonJS. Run with `node shop.js`.

```js
const express = require('express');                         // load Express
const app = express();                                      // create the app
app.use(express.json());                                    // read JSON bodies into req.body

const dishes = [                                            // fake data for restaurant 7
  { id: 1, name: 'Dosa', veg: true, price: 60 },            // a veg dish, ₹60
  { id: 2, name: 'Chicken curry', veg: false, price: 180 }, // a non-veg dish, ₹180
  { id: 3, name: 'Idli', veg: true, price: 40 },            // a veg dish, ₹40
];                                                          // end of the list

app.get('/restaurants/:restaurantId/dishes', (req, res) => { // PARAM: which restaurant
  const { restaurantId } = req.params;                      // '7' — always a string
  const onlyVeg = req.query.veg === 'true';                 // QUERY: ?veg=true → the string 'true'
  const sort = req.query.sort;                              // QUERY: ?sort=price (optional)
  let list = onlyVeg ? dishes.filter((d) => d.veg) : dishes; // keep only veg dishes if asked
  if (sort === 'price') list = [...list].sort((a, b) => a.price - b.price); // cheapest first
  res.json({ restaurantId, count: list.length, list });     // send the result
});                                                         // end of the GET route

app.post('/restaurants/:restaurantId/orders', (req, res) => { // PARAM: which restaurant
  const { items, address } = req.body;                      // BODY: the order data
  if (!Array.isArray(items) || !address) {                  // check the body has what we need
    return res.status(400).json({ error: 'items (array) and address are required' }); // 400 = bad request
  }                                                         // end of the check
  res.status(201).json({ restaurantId: req.params.restaurantId, items, address }); // 201 = created
});                                                         // end of the POST route

app.listen(3000, () => console.log('http://localhost:3000')); // start on port 3000
```

```text
$ curl "http://localhost:3000/restaurants/7/dishes?veg=true&sort=price"
{"restaurantId":"7","count":2,"list":[{"id":3,"name":"Idli","veg":true,"price":40},{"id":1,"name":"Dosa","veg":true,"price":60}]}

$ curl -X POST http://localhost:3000/restaurants/7/orders -H "Content-Type: application/json" -d '{"items":["Dosa","Coffee"],"address":"MG Road"}'
{"restaurantId":"7","items":["Dosa","Coffee"],"address":"MG Road"}

$ curl -X POST http://localhost:3000/restaurants/7/orders -H "Content-Type: application/json" -d '{}'
{"error":"items (array) and address are required"}
```

## 🔍 Deeper version

**Side-by-side:**

| | Route params | Query string | Body |
|---|---|---|---|
| Where | in the path: `/students/7` | after `?`: `?page=2&sort=name` | inside the request, after the headers |
| Read with | `req.params` | `req.query` | `req.body` (needs a parser) |
| Required? | yes, part of the route | optional | depends on the route |
| Used for | **identifying** one resource | **filtering, sorting, paging, search** | **creating / updating** data |
| Typical methods | all | mostly `GET` | `POST`, `PUT`, `PATCH` |
| Size limit | URL length (a few KB) | URL length | set by the parser (`express.json` default is 100 KB) |
| Shows up in logs and history | yes | yes | usually no |

**Everything in the URL is a string.** `?page=2` gives `'2'`. `?active=false` gives the string `'false'`, which is **truthy** in JavaScript! Always convert:
- `Number(req.query.page) || 1`
- `req.query.active === 'true'`

A key that appears twice, like `?tag=a&tag=b`, gives an **array** `['a', 'b']`. Validation libraries (Zod, Joi) can convert and check types for you.

**Body parsers.** The body arrives as a [stream](glossary:stream) of bytes. A parser middleware reads it and fills `req.body`:
- `express.json()` for `Content-Type: application/json`.
- `express.urlencoded()` for normal HTML form posts.
- `multer` for file uploads (`multipart/form-data`). See [file uploads](topic:express/file-uploads).

A parser only works if the client sends the **matching `Content-Type` header**. Otherwise it skips the body.

**Never put secrets in the URL.** Passwords, tokens and personal data in params or query end up in server logs, browser history and proxy logs. Send them in the body or in headers, over HTTPS.

**`GET` with a body?** Technically possible, but many tools and proxies drop it. For a search with complex filters, use query params. If they're too big, use `POST /students/search` with a body.

:::version[Version note]
**Express 5:**
- `req.body` is `undefined` (not `{}`) if no parser ran. So `req.body.name` throws instead of giving `undefined`.
- The default query parser is "simple". `?filter[status]=active` now gives `{ 'filter[status]': 'active' }`, not a nested object. To get nested objects again, use `app.set('query parser', 'extended')`.
- `express.urlencoded()` now defaults to `extended: false`.
:::

## 🎯 Why do we use it?

Clear rules make an API **predictable**. A frontend developer can guess the URL without reading docs:
- `GET /students/7` → one student.
- `GET /students?status=active&page=2` → a filtered page of students.
- `POST /students` with a JSON body → create a student.

It also helps with **caching** and **sharing**. A GET URL with query params can be bookmarked, shared and cached. A body can't.

## ⚠️ Common mistakes

- **Forgetting `express.json()`**, or the client not sending `Content-Type: application/json`. Then `req.body` is `undefined`.
- **Treating query values as numbers or booleans.** `'false'` is truthy. `'10' > '9'` is `false` because strings compare letter by letter.
- **Putting filters in the path**, like `/students/active/page/2`. Use the query string: `/students?status=active&page=2`.
- **Sending passwords or tokens in the URL.** They get saved in logs.

## 🗣️ How to answer in an interview

> "Route params are part of the path and identify a specific resource, like /students/:id, read with req.params. Query strings come after the question mark and are optional modifiers, like filters, sorting, search and pagination, read with req.query. The body carries the payload for creating or updating, usually JSON in POST, PUT or PATCH. I read it with req.body after the express.json middleware.
>
> Params and query values always arrive as strings. So I validate and convert them, usually with a schema library like Zod or Joi. That also guards against things like 'false' being truthy.
>
> I keep sensitive data out of the URL, because URLs end up in logs and browser history. And in Express 5, req.body is undefined without a parser, and nested query objects need the extended query parser."

## 🔁 Follow-up questions

### Which would you use for pagination: params or query?

Query: `GET /students?page=2&limit=20`. Paging is optional and doesn't identify a resource. Params are for identity, like `/students/7`.

### Why is `req.body` empty or undefined?

Usually one of three things: no `express.json()` middleware, the middleware is added **after** the route, or the client didn't send `Content-Type: application/json`. In Express 5 it's `undefined` when no parser ran.

### How do you limit the size of the request body?

`app.use(express.json({ limit: '1mb' }))`. The default is 100 KB. Bigger bodies get a `413 Payload Too Large` error. This protects the server from very large requests.

### How do you validate params, query and body together?

Use a validation middleware with a schema for each part, for example with Zod or Joi. It checks the types, converts strings to numbers, and returns `400` with clear messages if something is wrong. See [validation](topic:express/validation).

## ✅ Quick check

### 1. Match each to params, query or body.

- A) The ID of the order to cancel
- B) Show only orders from the last 7 days
- C) The new delivery address to save

:::answer
**A → params** (`/orders/:id`). **B → query** (`?days=7`). **C → body** (`{ "address": "…" }`).
:::

### 2. For `GET /students?active=false`, this code returns active students. Why?

```js
if (req.query.active) {               // checks the query value
  return res.json(activeStudents);    // send active students
}
```

:::answer
`req.query.active` is the **string** `'false'`. Any non-empty string is truthy in JavaScript, so the `if` is true. Compare it properly: `req.query.active === 'true'`.
:::

### 3. True or false: `req.params.id` for `/students/7` is the number `7`.

:::answer
**False.** It is the string `'7'`. Convert it with `Number(req.params.id)` if you need a number.
:::
