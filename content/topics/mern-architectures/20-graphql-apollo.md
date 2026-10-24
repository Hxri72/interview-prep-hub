---
title: GraphQL with Apollo in a MERN app
stack: mern-architectures
order: 20
level: Intermediate
mustKnow: false
askedFrequency: sometimes
template: pattern
section: How frontend talks to backend
summary:
  - "In a GraphQL MERN app, React talks to one endpoint. Apollo Client sends queries, and Apollo Server answers them."
  - "The server has a schema (the types and fields it offers) and resolvers (functions that fetch each field, often with Mongoose)."
  - "Queries read data. Mutations change data. The client picks exactly the fields it needs."
  - "Apollo Client caches results by type and id, so the same data isn't fetched twice."
  - "Watch out for the N+1 problem (one database call per item). DataLoader batches those calls."
cards:
  - q: What are the two halves of a GraphQL server?
    a: The schema (types, queries and mutations it offers) and the resolvers (functions that return the data for each field).
  - q: Query vs mutation?
    a: A query reads data. A mutation creates, updates or deletes data.
  - q: What is the N+1 problem in GraphQL?
    a: One query for a list, then one more database call for each item's nested field. DataLoader fixes it by batching the calls.
  - q: How does Apollo Client avoid fetching the same data again?
    a: It keeps a normalized cache keyed by __typename and id, and reads from it before going to the network.
---

## 💡 What is it?

This is a MERN app that uses [GraphQL](glossary:graphql) instead of REST between React and the backend.

**Apollo** is the most popular GraphQL toolset. **Apollo Server** runs on Node and answers queries. **Apollo Client** runs in React and sends them.

MongoDB and Mongoose stay the same. Only the "talking" layer changes.

## 🏠 Real-life example

Think of a school library with one help desk.

- **The help desk** = the single `/graphql` endpoint.
- **The list of what the library offers** (books, authors, magazines) = the **schema**.
- **Your request slip:** "book titles and author names only" = the **query**.
- **Library helpers who each fetch one kind of thing** = **resolvers**.
- **The shelves** = MongoDB.
- **Your own notebook where you copy answers, so you don't ask twice** = Apollo Client's **cache**.

## 🗺️ The diagram

```text
React (Apollo Client)
  │  query { jobs { title company } }
  ▼
POST /graphql  ───────────►  Apollo Server (Node)
                               │
                               ├─ schema   : type Job { id, title, company }
                               └─ resolvers: Query.jobs → Job.find()
                                                │
                                                ▼
                                          MongoDB (Mongoose)
  ◄──────────── { "data": { "jobs": [ { "title": ..., "company": ... } ] } }
Apollo cache stores Job:1, Job:2 … for next time
```

## 🧑‍💻 Code example

A tiny Apollo Server. It keeps data in an array so you can run it without MongoDB.

Set up:

```bash
npm init -y
npm install @apollo/server graphql
```

Save as `server.mjs` and run `node server.mjs`. (`.mjs` = an ES module file, so `import` and top-level `await` work.)

```js
import { ApolloServer } from '@apollo/server';                       // the GraphQL server
import { startStandaloneServer } from '@apollo/server/standalone';   // a ready-made HTTP server for it

const jobs = [                                                       // fake data; in a real app this is MongoDB
  { id: '1', title: 'React Developer', company: 'Acme', salary: 0 }, // 0 = salary hidden
];                                                                   // end of jobs

const typeDefs = `#graphql
  type Job { id: ID!  title: String!  company: String! }   # the shape of one job (! = never null)
  type Query { jobs: [Job!]! }                              # reading: a list of jobs
  type Mutation { addJob(title: String!, company: String!): Job! } # writing: add a job
`;                                                                   // end of the schema

const resolvers = {                                                  // functions that fetch each field
  Query: {                                                           // resolvers for reads
    jobs: () => jobs,                                                // real app: () => Job.find()
  },                                                                 // end of Query
  Mutation: {                                                        // resolvers for writes
    addJob: (_, { title, company }) => {                             // _ = parent (unused); 2nd = arguments
      const job = { id: String(jobs.length + 1), title, company };   // build the new job
      jobs.push(job);                                                // real app: Job.create(...)
      return job;                                                    // send the new job back
    },                                                               // end of addJob
  },                                                                 // end of Mutation
};                                                                   // end of resolvers

const server = new ApolloServer({ typeDefs, resolvers });            // join schema + resolvers
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } }); // 4000 = port
console.log(`GraphQL ready at ${url}`);                              // print the URL
```

Try a query:

```bash
curl -X POST http://localhost:4000/ -H "Content-Type: application/json" \
  -d '{"query":"{ jobs { title } }"}'
```

```text
{"data":{"jobs":[{"title":"React Developer"}]}}
```

Only `title` came back. No `salary`, no `company`. That is the main idea of GraphQL.

In React (with `npm install @apollo/client graphql`):

```jsx
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client'; // the client pieces
import { ApolloProvider, useQuery } from '@apollo/client/react';     // React bindings

const client = new ApolloClient({                                    // one client for the whole app
  link: new HttpLink({ uri: 'http://localhost:4000/' }),             // where the GraphQL server lives
  cache: new InMemoryCache(),                                        // the normalized cache
});                                                                  // end of client

const JOBS = gql`query { jobs { id title } }`;                        // ask for id + title only

function Jobs() {                                                    // a component that lists jobs
  const { data, loading, error } = useQuery(JOBS);                   // run the query; Apollo caches it
  if (loading) return <p>Loading…</p>;                               // still waiting
  if (error) return <p>Error!</p>;                                   // network or GraphQL error
  return <ul>{data.jobs.map((j) => <li key={j.id}>{j.title}</li>)}</ul>; // show titles
}                                                                    // end of Jobs

export default function App() {                                      // the root component
  return <ApolloProvider client={client}><Jobs /></ApolloProvider>;  // give every child the client
}                                                                    // end of App
```

:::version[Version note]
Apollo Client 4 (2025) moved the React hooks to `@apollo/client/react` and wants an explicit `link`. The code above works in Apollo Client 3 and 4. Apollo Server 5 moved the Express integration into a separate package, so check the docs when you mount Apollo inside Express.
:::

## 🔍 Deeper version

**Schema-first.** The schema is the contract. Each field has a type. `!` means "never null". Tools can read the schema and generate TypeScript types for the frontend.

**Resolvers with Mongoose.** Each resolver returns data or a Promise. A real one looks like `jobs: () => Job.find().lean()`. Nested fields get their own resolver, for example `Job.company: (job) => Company.findById(job.companyId)`.

**The N+1 problem.** A list of 50 jobs, each with a nested `company`, fires 1 query for jobs plus 50 for companies. **DataLoader** collects all 50 ids in one tick and runs one `Company.find({ _id: { $in: ids } })`.

**Caching.**
- On the server, POST requests skip the HTTP cache. People use persisted queries or a response cache instead.
- On the client, Apollo's `InMemoryCache` stores objects by `__typename` + `id` (for example `Job:1`). When a mutation returns `Job:1`, every screen showing it updates.

**Security.** Clients can write very deep or very large queries. Add **depth limits**, **cost limits**, and usually turn off **introspection** (schema browsing) in production. Do auth in the context (read the JWT once per request) and check permissions in resolvers.

**Errors.** GraphQL often returns HTTP 200 with an `errors` array. So monitoring must look inside the body, not only at status codes.

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| Client picks exact fields | More setup than plain Express routes |
| One request can build a whole screen | HTTP caching is harder |
| Typed schema, great tooling | N+1 problem needs DataLoader |
| Easy to add fields without new versions | Needs depth/cost limits for safety |
| Client cache updates screens automatically | Errors hide inside 200 responses |

## 🎯 When to choose it

- **A mobile app and a web app need different fields** from the same data.
- **Dashboards** where each widget needs a different slice of related data.
- **Many frontend teams** who want to add fields without asking the backend for new endpoints.
- **Not** for a simple CRUD admin panel or a public file-download API. REST is simpler there.

## ⚠️ Common mistakes

- **Querying the database inside every nested resolver** without DataLoader. One page can fire hundreds of queries.
- **No query limits.** A deep query can freeze the server.
- **Treating every 200 as success.** Always check the `errors` field.
- **Putting business logic in resolvers.** Keep resolvers thin. Call a service layer, like in [layered architecture](topic:mern-architectures/layered).

## 🗣️ How to answer in an interview

> "In a GraphQL MERN app, React uses Apollo Client and talks to one `/graphql` endpoint served by Apollo Server on Node.
>
> The server has a schema with types, queries and mutations, and resolvers that fetch the data, usually with Mongoose. The client asks for exactly the fields it needs, and Apollo Client keeps a normalized cache keyed by type and id.
>
> The main things I'd watch are the N+1 problem, which DataLoader solves by batching, and query depth and cost limits for security.
>
> I haven't used GraphQL in production. At work I built REST APIs in Node and TypeScript. But I'd pick GraphQL when many clients need different shapes of the same data."

## 🔁 Follow-up questions

### What is a resolver?

A function that returns the value for one field in the schema. Apollo calls it when a query asks for that field.

### How do you add authentication to Apollo Server?

Read the token (for example from an HttpOnly cookie) in the `context` function, once per request. Put the user in the context. Then check roles inside resolvers or in a shared helper.

### How does a mutation update the screen in Apollo Client?

If the mutation returns the changed object with its `id`, Apollo updates that object in the cache. Every component that shows it re-renders. For new items in a list, you update the cache or refetch the query.

### Does GraphQL replace REST everywhere?

No. File uploads, webhooks and health checks are still easier as plain REST routes. Many apps run both.

## ✅ Quick check

### 1. A query for 100 posts, each with an author, makes 101 database calls. What is this called, and what fixes it?

:::answer
The **N+1 problem**. **DataLoader** batches the 100 author lookups into one query.
:::

### 2. Which one changes data: a query or a mutation?

:::answer
A **mutation**. Queries only read.
:::

### 3. True or false: a GraphQL response with HTTP status 200 always means success.

:::answer
**False.** GraphQL can return 200 with an `errors` array. Always check it.
:::
