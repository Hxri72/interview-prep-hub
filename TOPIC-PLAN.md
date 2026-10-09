# Interview Prep Hub — Proposed Topic Plan (Phase 1)

Level: **B** = Basic, **I** = Intermediate, **A** = Advanced. ★ = must-know (`mustKnow: true`).
Topics are ordered from basics to advanced inside each stack. The number becomes the `order` in frontmatter.

Sources used: Resume, Resume Interview Question Bank, Backend Mastery Plan, Frontend Foundation & Responsive Design guide, TypeScript & Next.js guide, Arrays & DSA guide, AI for Software Engineers guide.

---

## CORE STACKS

### 1. JavaScript (38)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | How JavaScript runs (engine, browser vs Node) | B | |
| 2 | var, let and const | B | ★ |
| 3 | Data types: primitives vs objects (value vs reference) | B | ★ |
| 4 | Type coercion and `==` vs `===` | B | ★ |
| 5 | Truthy and falsy values | B | |
| 6 | Functions: declarations, expressions, arrow functions | B | ★ |
| 7 | Scope: global, function and block | B | ★ |
| 8 | Hoisting and the Temporal Dead Zone | B | ★ |
| 9 | Closures | I | ★ |
| 10 | The `this` keyword (normal vs arrow functions) | I | ★ |
| 11 | call, apply and bind | I | |
| 12 | Objects: create, read, update, loop | B | |
| 13 | Arrays and array methods (map, filter, reduce…) | B | ★ |
| 14 | Destructuring, spread and rest | B | ★ |
| 15 | Template literals, optional chaining `?.` and nullish coalescing `??` | B | |
| 16 | Shallow copy vs deep copy (`structuredClone`) | I | ★ |
| 17 | Higher-order functions and callbacks | B | |
| 18 | Prototypes and prototypal inheritance | I | |
| 19 | Classes (ES6+) | I | |
| 20 | Synchronous vs asynchronous code | B | ★ |
| 21 | Callbacks and callback hell | B | |
| 22 | Promises | I | ★ |
| 23 | async/await and error handling | I | ★ |
| 24 | Promise.all, allSettled, race and any | I | ★ |
| 25 | The event loop: call stack, microtasks, macrotasks | I | ★ |
| 26 | Modules: ES Modules vs CommonJS | I | |
| 27 | The DOM and DOM manipulation | B | |
| 28 | Events: bubbling, capturing and delegation | I | ★ |
| 29 | The fetch API and handling HTTP errors | B | |
| 30 | localStorage, sessionStorage and cookies | B | |
| 31 | Debounce and throttle (write from scratch) | I | ★ |
| 32 | Error handling: try/catch and custom errors | I | |
| 33 | Map, Set, WeakMap, WeakSet | I | |
| 34 | Currying and function composition | A | |
| 35 | Memoization | A | |
| 36 | Garbage collection and memory leaks | A | |
| 37 | Generators and iterators | A | |
| 38 | Polyfills: write your own map, bind, Promise.all | A | |

### 2. TypeScript (23)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | What TypeScript is and how it compiles to JavaScript | B | ★ |
| 2 | Basic types, arrays and tuples | B | |
| 3 | Type inference | B | |
| 4 | any, unknown, void and never | B | ★ |
| 5 | Type aliases vs interfaces | B | ★ |
| 6 | Optional and readonly properties | B | |
| 7 | Union and literal types | B | ★ |
| 8 | Intersection types | I | |
| 9 | Typing functions (parameters, return types, optional params) | B | |
| 10 | Type narrowing and type guards | I | ★ |
| 11 | Discriminated unions | I | |
| 12 | Generics | I | ★ |
| 13 | Generic constraints (`extends`) | I | |
| 14 | Utility types: Partial, Pick, Omit, Record, Readonly, ReturnType | I | ★ |
| 15 | keyof, typeof and indexed access types | I | |
| 16 | Enums vs string unions | I | |
| 17 | Type assertions (`as`) and the non-null `!` operator | I | |
| 18 | tsconfig.json and strict mode | B | |
| 19 | TypeScript with React (props, state, events, refs) | I | ★ |
| 20 | TypeScript with Express (typed req/res, extending Request) | I | |
| 21 | Runtime validation with Zod (types vanish at runtime) | I | ★ |
| 22 | Mapped and conditional types | A | |
| 23 | Declaration files (.d.ts) and @types packages | A | |

### 3. HTML5 & CSS3 (20)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | How a web page loads (HTML, CSS, JavaScript) | B | |
| 2 | Semantic HTML (header, nav, main, section, article, footer) | B | ★ |
| 3 | Block vs inline elements | B | |
| 4 | Forms, labels and input types | B | |
| 5 | Accessibility basics (alt text, labels, ARIA, keyboard) | I | ★ |
| 6 | Meta tags and SEO basics | B | |
| 7 | CSS selectors and specificity | B | ★ |
| 8 | The box model and `box-sizing` | B | ★ |
| 9 | display, visibility and opacity | B | |
| 10 | position: static, relative, absolute, fixed, sticky | B | ★ |
| 11 | z-index and stacking context | I | |
| 12 | Colours, fonts and units overview | B | |
| 13 | CSS variables (custom properties) | B | |
| 14 | Pseudo-classes and pseudo-elements | B | |
| 15 | Centering anything in CSS | B | ★ |
| 16 | Transitions and animations | I | |
| 17 | Organising CSS: BEM, CSS Modules, CSS-in-JS | I | |
| 18 | Loading scripts: `async` vs `defer` | I | |
| 19 | Critical rendering path: reflow and repaint | A | |
| 20 | Web performance basics (Core Web Vitals) | A | |

### 4. Responsive Design (17)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | What responsive design is; mobile-first | B | ★ |
| 2 | The viewport meta tag | B | |
| 3 | Units: px, %, rem, em, vw, vh | B | ★ |
| 4 | min(), max() and clamp() | I | |
| 5 | Flexbox basics: direction, justify-content, align-items | B | ★ |
| 6 | Flexbox: wrap, gap and `flex: 1` | B | |
| 7 | CSS Grid basics: columns, `fr`, gap | B | ★ |
| 8 | Grid `repeat(auto-fit, minmax())` — responsive without media queries | I | ★ |
| 9 | Flexbox vs Grid: when to use which | B | ★ |
| 10 | Media queries: min-width vs max-width | B | ★ |
| 11 | Container queries | I | |
| 12 | Responsive images and video (object-fit, aspect-ratio, lazy loading) | B | |
| 13 | Responsive design with Tailwind breakpoints (sm → 2xl) | B | ★ |
| 14 | Responsive design with Material UI (xs → xl, Grid, useMediaQuery) | I | ★ |
| 15 | Matching Tailwind and MUI breakpoints in one project | I | |
| 16 | Common responsive layouts (navbar, sidebar → drawer, table → cards, dialogs) | I | |
| 17 | Testing responsive pages (DevTools widths, tap targets, no sideways scroll) | B | |

### 5. React.js (34)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | What React is and why we use it | B | ★ |
| 2 | JSX | B | |
| 3 | Components and props | B | ★ |
| 4 | State with useState | B | ★ |
| 5 | Props vs state | B | ★ |
| 6 | Rendering lists and keys | B | ★ |
| 7 | Conditional rendering | B | |
| 8 | Handling events | B | |
| 9 | Controlled vs uncontrolled components | B | ★ |
| 10 | Lifting state up | B | |
| 11 | Virtual DOM and reconciliation | B | ★ |
| 12 | Rules of hooks | B | |
| 13 | What causes a re-render | I | ★ |
| 14 | useEffect: dependencies and cleanup | I | ★ |
| 15 | useRef | I | |
| 16 | useMemo and useCallback | I | ★ |
| 17 | React.memo | I | ★ |
| 18 | Custom hooks (e.g. useFetch) | I | ★ |
| 19 | useReducer | I | |
| 20 | Forms and validation (React Hook Form + Zod/Yup) | I | |
| 21 | Calling APIs: loading, error and empty states | I | ★ |
| 22 | Race conditions and AbortController | I | |
| 23 | React Router: routes, params, nested routes | B | |
| 24 | Protected routes and auth on the frontend | I | ★ |
| 25 | Composition and children (avoiding prop drilling) | I | |
| 26 | Code splitting: React.lazy and Suspense | I | |
| 27 | Error boundaries | I | |
| 28 | StrictMode and effects running twice in development | I | |
| 29 | Testing React components (React Testing Library) | I | |
| 30 | Portals and forwarding refs | A | |
| 31 | Performance: Profiler and list virtualisation | A | ★ |
| 32 | useTransition and useDeferredValue | A | |
| 33 | Server state with TanStack Query (React Query) | A | |
| 34 | What's new in React 19 (Actions, `use`, ref as a prop) | A | |

### 6. Redux & Context API (17)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | Why we need state management (prop drilling) | B | ★ |
| 2 | Context API: createContext, Provider, useContext | B | ★ |
| 3 | Context performance pitfalls and splitting context | I | ★ |
| 4 | Context + useReducer pattern | I | |
| 5 | Redux core idea: store, action, reducer | B | ★ |
| 6 | Redux data flow end to end | I | ★ |
| 7 | Immutability and why Redux needs it | B | |
| 8 | Redux Toolkit: configureStore and createSlice | B | ★ |
| 9 | useSelector and useDispatch | B | |
| 10 | Async logic with createAsyncThunk | I | ★ |
| 11 | Redux middleware (thunk, logger) | I | |
| 12 | Selectors and memoised selectors (createSelector) | I | |
| 13 | Redux DevTools and debugging | I | |
| 14 | Normalising state (createEntityAdapter) | A | |
| 15 | RTK Query basics | A | |
| 16 | Context vs Redux vs Zustand vs React Query: how to choose | I | ★ |
| 17 | redux-saga basics (used at SkillKeepr) | I | ★ |

### 7. Material UI & Tailwind CSS (17)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | Component library vs utility-first CSS | B | |
| 2 | Material UI: setup and core components | B | ★ |
| 3 | MUI layout: Box, Stack, Container | B | |
| 4 | The `sx` prop and the spacing scale (1 unit = 8px) | B | ★ |
| 5 | MUI theming: createTheme and ThemeProvider | I | ★ |
| 6 | MUI Grid (v7 `size` prop vs older `item xs`) | I | |
| 7 | Customising MUI components (styled, theme overrides) | I | |
| 8 | Dark mode in MUI | I | |
| 9 | Tailwind: the utility-first idea and setup (v4) | B | ★ |
| 10 | Tailwind spacing, colours and typography classes | B | ★ |
| 11 | Tailwind states: hover, focus, dark mode | I | |
| 12 | Customising Tailwind with `@theme` | I | |
| 13 | Reusing Tailwind styles (components, clsx, @apply) | I | |
| 14 | Using MUI and Tailwind together without conflicts | I | ★ |
| 15 | Ant Design overview (also on my resume) | B | |
| 16 | Accessibility in component libraries | I | |
| 17 | Bundle size and tree shaking for UI libraries | A | |

### 8. Next.js — beginner level (23)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | What Next.js is and why it exists | B | ★ |
| 2 | React (Vite) vs Next.js | B | ★ |
| 3 | Creating a project and the folder structure | B | |
| 4 | App Router vs Pages Router | B | ★ |
| 5 | File-based routing: folders and page.tsx | B | ★ |
| 6 | Dynamic routes `[id]` and awaiting `params` | B | |
| 7 | Layouts and nested layouts | B | |
| 8 | loading.tsx, error.tsx and not-found.tsx | B | |
| 9 | Route groups and private folders | I | |
| 10 | Server Components (the default) | B | ★ |
| 11 | Client Components and `'use client'` | B | ★ |
| 12 | Rendering types: SSG, SSR, ISR, CSR | I | ★ |
| 13 | Hydration and hydration errors | I | ★ |
| 14 | Data fetching and caching in Next.js 16 | I | |
| 15 | Streaming with Suspense | I | |
| 16 | Server Actions | I | ★ |
| 17 | Route Handlers (route.ts APIs) | I | |
| 18 | Link, useRouter and navigation | B | |
| 19 | next/image, next/font and metadata (SEO) | B | |
| 20 | Environment variables and `NEXT_PUBLIC_` | B | ★ |
| 21 | proxy.ts (called middleware.ts before v16) | I | |
| 22 | Authentication in Next.js (overview) | I | |
| 23 | Deploying Next.js (Vercel, Node server, Docker) | B | |

### 9. Node.js (31)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | What Node.js is and why we use it | B | ★ |
| 2 | Node.js vs browser JavaScript | B | |
| 3 | Inside Node: V8 and libuv | I | |
| 4 | Single thread and non-blocking I/O | B | ★ |
| 5 | The Node.js event loop and its phases | I | ★ |
| 6 | process.nextTick vs setImmediate vs setTimeout | I | |
| 7 | Blocking the event loop and how to avoid it | I | ★ |
| 8 | The libuv thread pool (UV_THREADPOOL_SIZE) | A | |
| 9 | Modules: CommonJS vs ES Modules | B | ★ |
| 10 | npm, package.json and package-lock.json | B | |
| 11 | Semantic versioning (^ and ~) | B | |
| 12 | Global objects: process, __dirname, globalThis | B | |
| 13 | Environment variables and dotenv | B | ★ |
| 14 | The fs module: sync vs callback vs promises | B | |
| 15 | The path and os modules | B | |
| 16 | The http module: a server without Express | B | |
| 17 | EventEmitter and custom events | I | |
| 18 | Callbacks, Promises and async/await in Node | I | ★ |
| 19 | Error handling in Node (sync, async, unhandled rejections) | I | ★ |
| 20 | Buffers and encoding (utf8, base64) | I | |
| 21 | Streams: readable, writable, transform | I | ★ |
| 22 | pipe, pipeline and backpressure | A | |
| 23 | Worker threads | A | |
| 24 | Child processes | A | |
| 25 | The cluster module and PM2 | I | |
| 26 | Memory, garbage collection and memory leaks | A | ★ |
| 27 | Profiling and debugging Node (--inspect) | A | |
| 28 | Graceful shutdown (SIGTERM) | I | |
| 29 | Security basics for Node apps | I | |
| 30 | Node.js performance tips | A | |
| 31 | Modern Node features (built-in fetch, test runner, --watch, running TypeScript) | I | |

### 10. Express.js (24)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | What Express is and why we use it | B | ★ |
| 2 | Creating a server and your first route | B | |
| 3 | Routing: methods, paths and express.Router | B | ★ |
| 4 | The req and res objects | B | |
| 5 | Route params vs query strings vs body | B | ★ |
| 6 | Middleware and next() | B | ★ |
| 7 | Built-in and third-party middleware (json, cors, helmet, morgan) | B | |
| 8 | Writing custom middleware (auth, roles, logging) | I | ★ |
| 9 | Error-handling middleware | I | ★ |
| 10 | Async errors: async wrapper and custom AppError class | I | ★ |
| 11 | Project structure: routes → controllers → services → models | I | ★ |
| 12 | Request validation with Joi or Zod | I | |
| 13 | One consistent response and error format | I | |
| 14 | CORS in Express | I | ★ |
| 15 | Security middleware: helmet, rate limiting, sanitising | I | ★ |
| 16 | File uploads with multer | I | |
| 17 | Serving static files | B | |
| 18 | Logging with morgan, pino or winston + request IDs | I | |
| 19 | Pagination, filtering and sorting in routes | I | |
| 20 | Express 5: what changed from Express 4 | I | |
| 21 | Testing routes with Supertest | I | |
| 22 | Health checks and graceful shutdown | I | |
| 23 | Dependency injection basics in Express | A | |
| 24 | Performance: compression, caching headers, clustering | A | |

### 11. REST APIs & Authentication (27)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | What an API is and what REST means | B | ★ |
| 2 | HTTP methods: GET, POST, PUT, PATCH, DELETE | B | ★ |
| 3 | HTTP status codes you must know | B | ★ |
| 4 | PUT vs PATCH, 401 vs 403, 400 vs 422 | B | ★ |
| 5 | Designing resource URLs and nested routes | I | ★ |
| 6 | Idempotency and safe methods | I | |
| 7 | Pagination: offset vs cursor | I | |
| 8 | API versioning without breaking clients | I | |
| 9 | Headers, content types and the CORS preflight | I | |
| 10 | Authentication vs authorisation | B | ★ |
| 11 | Password hashing with bcrypt | B | ★ |
| 12 | Sessions and cookies vs tokens | I | |
| 13 | JWT: structure and how it works | B | ★ |
| 14 | JWT login flow end to end | I | ★ |
| 15 | Access tokens and refresh tokens (rotation) | I | ★ |
| 16 | Where to store tokens: httpOnly cookie vs localStorage | I | ★ |
| 17 | Logout and token revocation | A | |
| 18 | Role-based access control (RBAC) | I | |
| 19 | OAuth 2.0 and "Login with Google" (overview) | I | |
| 20 | API keys and service-to-service auth | I | |
| 21 | Webhooks: what they are and how to receive them | I | ★ |
| 22 | Verifying webhook signatures (why the raw body) | I | ★ |
| 23 | Idempotency keys and duplicate events | A | ★ |
| 24 | WebSockets vs HTTP; Socket.IO basics | I | ★ |
| 25 | Polling, long polling, SSE and WebSockets compared | I | |
| 26 | API documentation with Swagger / OpenAPI | B | |
| 27 | API security: rate limiting and OWASP API Top 10 | A | |

### 12. MongoDB & Mongoose (31)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | What MongoDB is: documents and collections | B | ★ |
| 2 | SQL vs NoSQL: when to choose MongoDB | B | ★ |
| 3 | BSON, _id and ObjectId | B | |
| 4 | CRUD operations | B | ★ |
| 5 | Query operators ($eq, $in, $gt, $regex…) | B | |
| 6 | Update operators ($set, $inc, $push, $pull) | B | |
| 7 | Projection, sort, limit and skip | B | |
| 8 | Mongoose: connecting, schemas and models | B | ★ |
| 9 | Schema types, validation and defaults | B | |
| 10 | Mongoose CRUD methods | B | |
| 11 | Data modelling: embedding vs referencing | I | ★ |
| 12 | One-to-many and many-to-many relationships | I | |
| 13 | populate() | I | |
| 14 | Mongoose middleware (pre/post hooks) | I | |
| 15 | Virtuals, instance methods and statics | I | |
| 16 | lean(), select() and query performance | I | |
| 17 | Indexes: what they are and how they work | I | ★ |
| 18 | Compound indexes and the ESR rule | I | ★ |
| 19 | Unique, partial, TTL and text indexes | I | |
| 20 | explain('executionStats'): COLLSCAN vs IXSCAN | I | ★ |
| 21 | Aggregation pipeline basics: $match, $group, $sort, $project | I | ★ |
| 22 | $lookup and $unwind; populate vs $lookup | I | ★ |
| 23 | Pagination at scale: cursor vs skip | I | |
| 24 | Multi-tenant data design (tenantId on everything) | I | ★ |
| 25 | NoSQL injection and security | I | |
| 26 | The cost of indexes | A | |
| 27 | Advanced aggregation: $facet and $bucket | A | |
| 28 | Transactions and ACID in MongoDB | A | |
| 29 | Atomic updates, race conditions and optimistic locking | A | |
| 30 | Connection pooling, replica sets and sharding (overview) | A | |
| 31 | MongoDB Atlas and Atlas Vector Search (overview) | A | |

### 13. PostgreSQL & SQL (23)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | What a relational database is | B | ★ |
| 2 | Tables, rows, columns and primary keys | B | |
| 3 | PostgreSQL data types | B | |
| 4 | SELECT, WHERE, ORDER BY, LIMIT | B | ★ |
| 5 | INSERT, UPDATE, DELETE | B | |
| 6 | Aggregates: COUNT, SUM, AVG, GROUP BY, HAVING | B | ★ |
| 7 | Foreign keys and constraints | B | |
| 8 | SQL injection and how to prevent it | B | ★ |
| 9 | Joins: INNER, LEFT, RIGHT, FULL | I | ★ |
| 10 | Self joins | I | |
| 11 | Subqueries | I | |
| 12 | CTEs (WITH) | I | |
| 13 | Normalisation: 1NF, 2NF, 3NF | I | ★ |
| 14 | When to denormalise | I | |
| 15 | Indexes in PostgreSQL (B-tree, composite) | I | ★ |
| 16 | EXPLAIN ANALYZE | I | |
| 17 | ACID and transactions | I | ★ |
| 18 | Using PostgreSQL from Node.js (pg, parameterised queries) | I | ★ |
| 19 | ORMs: Prisma vs Sequelize vs raw SQL | I | |
| 20 | Common SQL interview queries (2nd highest salary, duplicates, top N per group) | I | ★ |
| 21 | Isolation levels and row locking | A | |
| 22 | Window functions (ROW_NUMBER, RANK) | A | |
| 23 | JSONB in PostgreSQL | A | |

### 14. Architecture (17)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | What software architecture means | B | |
| 2 | Monolith: pros and cons | B | ★ |
| 3 | Microservices: pros and cons | B | ★ |
| 4 | When (and when not) to split a monolith | I | ★ |
| 5 | Modular monolith | I | |
| 6 | Layered / clean architecture | I | |
| 7 | Service communication: REST vs events and queues | I | ★ |
| 8 | API gateway | I | |
| 9 | Serverless and AWS Lambda | I | ★ |
| 10 | Serverless limits: cold starts and time limits | I | |
| 11 | Event-driven architecture | I | ★ |
| 12 | Multi-tenant architecture | I | ★ |
| 13 | State machines in backend design | I | |
| 14 | Gap analysis and architecture decision records (ADRs) | I | |
| 15 | At-least-once delivery and idempotent consumers | A | |
| 16 | Shared database vs database per tenant | A | |
| 17 | Resilience: timeouts, retries with backoff, circuit breakers | A | |

### 15. Cloud & DevOps (22)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | Git basics: commit, branch, merge | B | ★ |
| 2 | Branching workflow and pull requests | B | ★ |
| 3 | Merge vs rebase | B | ★ |
| 4 | Resolving merge conflicts | B | |
| 5 | Useful Git commands: stash, reset, revert, cherry-pick | I | |
| 6 | What CI/CD means | B | ★ |
| 7 | GitHub Actions: workflows, jobs and steps | I | ★ |
| 8 | Secrets and environment variables in CI | I | |
| 9 | Environments: dev, staging, production | B | |
| 10 | Deploying to Railway | B | |
| 11 | Rolling back a bad deployment | I | |
| 12 | Cloud basics: IaaS, PaaS, SaaS | B | |
| 13 | AWS basics: EC2, S3, Lambda, IAM | B | |
| 14 | GCP basics: Cloud Run, Speech-to-Text, Text-to-Speech | B | |
| 15 | Docker: images and containers | B | ★ |
| 16 | Writing a Dockerfile for a Node.js app | I | |
| 17 | docker compose: app + MongoDB + Redis | I | |
| 18 | Managing secrets across environments | I | ★ |
| 19 | Logging, monitoring and alerts | I | |
| 20 | Health checks and uptime | B | |
| 21 | Domains, DNS and HTTPS basics | B | |
| 22 | Scaling deployments: horizontal scaling and load balancers | I | |

### 16. Testing & Quality (16)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | Why we test; the testing pyramid | B | ★ |
| 2 | Unit vs integration vs end-to-end tests | B | ★ |
| 3 | Jest basics: describe, it, expect | B | ★ |
| 4 | Matchers and async tests | I | |
| 5 | Mocking: jest.mock, spies and test doubles | I | ★ |
| 6 | Testing Express APIs with Supertest | I | ★ |
| 7 | Test databases and mongodb-memory-server | I | |
| 8 | Testing React components (React Testing Library) | I | |
| 9 | Code coverage and its limits | B | |
| 10 | Test-driven development (TDD) | B | |
| 11 | Linting and formatting (ESLint, Prettier) | B | |
| 12 | Code reviews: what to look for | B | ★ |
| 13 | Logging: levels, structure, what never to log | I | ★ |
| 14 | Error tracking and monitoring tools | I | |
| 15 | Production support: handling a live incident | I | ★ |
| 16 | Clean code and SOLID basics | I | |

---

## INTERVIEW SECTIONS

### 17. Resume Deep-Dive (16)
Each page: problem → what I built → hard part → result, plus likely follow-ups. Missing details become `[FILL IN: ...]`.
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | SkillKeepr: what the product does and my role | B | ★ |
| 2 | Drawing the platform architecture | I | ★ |
| 3 | Multi-tenant platform: API design to production | I | ★ |
| 4 | Stripe subscription billing with secure webhooks | I | ★ |
| 5 | Reusable backend modules (~30% faster development) | I | |
| 6 | Workable ATS integration via Unified API | I | ★ |
| 7 | AI voice agent microservice on GCP (Twilio + STT/TTS) | I | ★ |
| 8 | Voice agent: the LLM-driven phase-based state machine | A | ★ |
| 9 | xAI Grok Voice as a premium voice option | I | |
| 10 | OpenAI chatbot with schema-validated structured outputs | I | ★ |
| 11 | Gap analysis: monolith vs proposed three-service design | I | ★ |
| 12 | Build-vs-buy evaluation for the voice stack | I | ★ |
| 13 | MongoDB aggregation and indexing on multi-tenant data | I | ★ |
| 14 | Recruiter & candidate UIs (React, Redux, Context, MUI, Tailwind, Ant Design) | I | |
| 15 | Monolith, microservices and AWS Lambda work | I | |
| 16 | Production support, Swagger, Jest and GitHub Actions | I | |

### 18. Debugging Scenarios (33)
Every page uses Detect → Debug → Fix → Prevent.
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | How to answer any debugging question (Detect → Debug → Fix → Prevent) | B | ★ |
| | **Frontend** | | |
| 2 | A component re-renders unnecessarily | I | ★ |
| 3 | The page takes 6 seconds to load | I | ★ |
| 4 | A 5,000-row list scrolls slowly | I | |
| 5 | Typing in a search box feels slow | I | |
| 6 | useEffect runs in an infinite loop | I | ★ |
| 7 | The UI shows old data after saving a form | I | |
| 8 | Search shows results for the wrong query (race condition) | I | |
| 9 | Browser memory keeps growing (frontend memory leak) | A | ★ |
| 10 | State update on an unmounted component | I | |
| 11 | Works locally, broken in production | I | ★ |
| 12 | Users get logged out randomly | I | |
| 13 | White screen after one component crashes | I | |
| 14 | Layout breaks on mobile | B | |
| 15 | A 20-field form is slow and hard to maintain | I | |
| 16 | Prop drilling through 5 levels | B | |
| 17 | An API call runs twice in development | B | |
| | **Backend** | | |
| 18 | One API endpoint is slow (2–5 seconds) | I | ★ |
| 19 | The server becomes unresponsive under load | A | ★ |
| 20 | Server memory grows until it crashes (memory leak) | A | ★ |
| 21 | Duplicate webhook events create duplicate records | I | ★ |
| 22 | A user sees another tenant's data | A | ★ |
| 23 | Intermittent 500 errors | I | |
| 24 | App crashes on an unhandled promise rejection | I | |
| 25 | Two users update the same record and one change is lost | A | |
| 26 | A third-party API (Stripe, Twilio, Workable) is down or slow | I | ★ |
| 27 | Someone is hammering the login endpoint | I | |
| 28 | A query is fast in development but times out in production | I | |
| 29 | A large file upload crashes the server | I | |
| 30 | Auth errors after a deploy | I | |
| 31 | A background job runs twice or never finishes | A | |
| 32 | CORS error when the frontend calls the API | B | ★ |
| 33 | "I was charged but have no access" (Stripe) | A | ★ |

### 19. Arrays & DSA (41)
Every problem solved with array methods AND plain loops, with time/space complexity.
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | How to approach any coding problem in an interview (7 steps) | B | ★ |
| 2 | Big O in simple words (time and space) | B | ★ |
| 3 | Array methods cheat sheet: which ones change the original | B | ★ |
| 4 | Set and Map for problem solving | B | |
| 5 | Recursion basics | B | |
| 6 | Find the largest and smallest number | B | |
| 7 | Sum and average | B | |
| 8 | Reverse an array | B | |
| 9 | Check if an array is sorted | B | |
| 10 | Remove duplicates | B | ★ |
| 11 | Count frequency of each item | B | ★ |
| 12 | Find the second largest number | B | ★ |
| 13 | Move zeros to the end | B | ★ |
| 14 | Find the missing number (1 to n) | B | ★ |
| 15 | Find duplicate values | B | |
| 16 | First non-repeating item | B | |
| 17 | Chunk an array into groups of k | B | |
| 18 | Flatten a nested array | I | ★ |
| 19 | Merge two sorted arrays | I | |
| 20 | Intersection of two arrays | I | |
| 21 | Rotate an array by k | I | |
| 22 | Two Sum | B | ★ |
| 23 | Reverse a string and check a palindrome | B | ★ |
| 24 | Valid anagram | B | |
| 25 | Pattern: hash map / Set | I | ★ |
| 26 | Pattern: two pointers | I | ★ |
| 27 | Pattern: sliding window | I | ★ |
| 28 | Pattern: Kadane's algorithm | I | ★ |
| 29 | Pattern: prefix sum | I | |
| 30 | Pattern: binary search | I | ★ |
| 31 | Pattern: stack (valid brackets) | I | ★ |
| 32 | Best time to buy and sell stock | I | ★ |
| 33 | Maximum subarray (Kadane) | I | ★ |
| 34 | Product of array except self | I | |
| 35 | Longest substring without repeating characters | I | |
| 36 | Group anagrams | I | |
| 37 | Top K frequent elements | I | |
| 38 | Container with most water | I | |
| 39 | 3Sum | A | |
| 40 | Sorting algorithms overview (bubble, merge, quick) | I | |
| 41 | What to say in the coding round (phrases and mistakes) | B | ★ |

### 20. System Design Basics (20)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | How to approach a system design question | B | ★ |
| 2 | Functional vs non-functional requirements | B | |
| 3 | What happens when you type a URL (DNS, client-server) | B | ★ |
| 4 | Designing a REST API for a feature | I | ★ |
| 5 | Designing a database schema | I | ★ |
| 6 | Vertical vs horizontal scaling | B | ★ |
| 7 | Load balancers and stateless services | I | |
| 8 | Caching: browser, CDN, server and database | I | ★ |
| 9 | Redis and cache-aside; cache invalidation | I | ★ |
| 10 | CDNs | B | |
| 11 | Database scaling: indexes, read replicas, sharding | I | |
| 12 | Queues and background jobs (BullMQ + Redis) | I | ★ |
| 13 | Rate limiting | I | |
| 14 | Reliability: timeouts, retries, circuit breakers | I | |
| 15 | Real-time at scale: WebSockets with a Redis adapter | A | |
| 16 | CAP theorem in simple words | A | |
| 17 | Practice: URL shortener | I | ★ |
| 18 | Practice: interview-reminder notification system (email + SMS) | I | ★ |
| 19 | Practice: file upload service | I | |
| 20 | Practice: job board / college admission portal | I | |

### 21. AI for Software Engineers (26)
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | AI, machine learning, deep learning and LLMs | B | ★ |
| 2 | How an LLM writes text (next-token prediction) | B | ★ |
| 3 | Tokens and cost | B | ★ |
| 4 | The context window | B | |
| 5 | Temperature and other model settings | B | |
| 6 | Hallucination and how to reduce it | B | ★ |
| 7 | Training vs inference vs fine-tuning | I | |
| 8 | Using AI coding tools productively (Claude Code, Copilot, ChatGPT, Perplexity) | B | ★ |
| 9 | Reviewing AI-generated code safely | I | ★ |
| 10 | Calling an LLM API from Node.js | I | ★ |
| 11 | Streaming responses | I | |
| 12 | Prompt engineering basics (context → task → rules → format) | B | ★ |
| 13 | System prompts, few-shot and step-by-step prompting | I | |
| 14 | Structured outputs with JSON Schema and Zod | I | ★ |
| 15 | Tool calling (function calling) | I | ★ |
| 16 | Embeddings and vector databases | I | |
| 17 | RAG (Retrieval-Augmented Generation) | I | ★ |
| 18 | AI agents | I | ★ |
| 19 | Agentic AI and multi-agent systems | A | |
| 20 | MCP (Model Context Protocol) | I | ★ |
| 21 | LangChain | I | |
| 22 | LangGraph | A | |
| 23 | Evals: testing AI features | A | |
| 24 | Prompt injection and guardrails | A | ★ |
| 25 | Controlling AI cost and latency in production | A | |
| 26 | Voice AI: speech-to-text, text-to-speech and real-time pipelines | A | |

### 22. HR & Behavioural (19)
Sample answers based on my resume; personal details I must supply become `[FILL IN: ...]`.
| # | Topic | Level | ★ |
|---|---|---|---|
| 1 | The STAR method for behavioural answers | B | ★ |
| 2 | Tell me about yourself (60 seconds) | B | ★ |
| 3 | Walk me through your journey (Physics → MERN → SkillKeepr) | B | |
| 4 | Why are you looking for a change? | B | ★ |
| 5 | Why this company? | B | |
| 6 | What are your strengths? | B | ★ |
| 7 | What are your weaknesses? | B | ★ |
| 8 | Salary expectations | B | ★ |
| 9 | Notice period and joining date | B | ★ |
| 10 | The hardest problem you solved | I | ★ |
| 11 | A mistake you made in production | I | |
| 12 | A disagreement with a teammate or lead | I | |
| 13 | A feature is due tomorrow and you find a serious bug | I | |
| 14 | Requirements are unclear — what do you do? | B | |
| 15 | How you learn a new technology quickly | B | |
| 16 | How your Agile/Scrum team works | B | |
| 17 | What would you do differently if you rebuilt the platform? | I | |
| 18 | Where do you see yourself in 3 years? | B | |
| 19 | Questions to ask the interviewer | B | ★ |

---

**Total: 22 stacks, about 534 topics.**
