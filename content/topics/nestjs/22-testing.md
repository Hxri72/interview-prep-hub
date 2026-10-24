---
title: "Testing: TestingModule, Jest and Supertest"
stack: nestjs
order: 22
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Test.createTestingModule() builds a small Nest app just for the test, with only the providers you list."
  - "Unit test: give the class fake dependencies with { provide: UsersRepo, useValue: fakeRepo } or .overrideProvider()."
  - "E2E test: create the full app with app.init(), then call real HTTP routes with Supertest."
  - Because of dependency injection, swapping a real service for a fake one is one line. No jest.mock on file paths.
  - New NestJS 12 projects use Vitest by default, but the TestingModule API is the same as with Jest.
cards:
  - q: What does Test.createTestingModule do?
    a: It builds an isolated Nest module for the test, with the providers you list, so Nest's DI works inside the test.
  - q: How do you replace a real provider with a fake in a Nest test?
    a: "List it as { provide: RealClass, useValue: fake } or call .overrideProvider(RealClass).useValue(fake) before compile()."
  - q: How do you test a Nest route end to end?
    a: Create the app from the testing module, call app.init(), then send requests with Supertest using app.getHttpServer().
  - q: What does moduleRef.get(SomeService) do?
    a: It takes the instance Nest created for that provider out of the test module, so you can call it or check it.
---

## 💡 What is it?

NestJS has a testing helper called `Test`. It builds a **small Nest app just for your test**.

You tell it which classes to include. You can swap real ones (like the database) for **fakes**.

For unit tests you use **Jest** (or Vitest). For HTTP tests you add **Supertest**, which sends fake requests to your app.

## 🏠 Real-life example

Think of a **driving test on a practice ground**.

The learner drives a real car. But the roads, signals and other cars are set up by the instructor. Nothing on the ground is dangerous.

- **The learner driver** = the class you are testing, like `UsersService`.
- **The practice ground** = the testing module from `Test.createTestingModule()`.
- **Cardboard cars and fake signals** = fake providers, like a fake repository.
- **The instructor placing them** = `useValue` or `.overrideProvider()`.
- **A real drive on the city road** = an e2e test with Supertest through the full app.

## 🧑‍💻 Code example

In a project made with `npx @nestjs/cli new test-demo`, add these two files. Run the test with `npx jest src/users/users.service.spec.ts`.

`src/users/users.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';    // Nest helpers

@Injectable()                                                      // Nest can inject this class
export class UsersRepo {                                           // the "database" part
  async findById(id: number): Promise<{ id: number; name: string } | null> { // look up a user
    throw new Error('real database not available in this demo');   // real DB code would go here
  }                                                                // end of findById
}                                                                  // end of UsersRepo

@Injectable()                                                      // Nest can inject this class
export class UsersService {                                        // the class we will test
  constructor(private repo: UsersRepo) {}                          // Nest injects the repo
  async getUser(id: number) {                                      // business logic
    const user = await this.repo.findById(id);                     // ask the repo
    if (!user) throw new NotFoundException('User not found');      // 404 if missing
    return user;                                                   // return the user
  }                                                                // end of getUser
}                                                                  // end of UsersService
```

`src/users/users.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';                            // Nest's testing helper
import { NotFoundException } from '@nestjs/common';                // the error we expect
import { UsersRepo, UsersService } from './users.service';         // the classes

describe('UsersService', () => {                                   // a group of tests
  let service: UsersService;                                       // the instance we test
  const fakeRepo = { findById: jest.fn() };                        // fake repo; jest.fn() = a spy function

  beforeEach(async () => {                                         // runs before each test
    const moduleRef = await Test.createTestingModule({             // build a small Nest module
      providers: [                                                 // providers inside it
        UsersService,                                              // the real service
        { provide: UsersRepo, useValue: fakeRepo },                // swap the real repo for the fake
      ],                                                           // end of providers
    }).compile();                                                  // compile = create all instances
    service = moduleRef.get(UsersService);                         // take the service out
  });                                                              // end of beforeEach

  it('returns the user', async () => {                             // test 1
    fakeRepo.findById.mockResolvedValue({ id: 1, name: 'Asha' });  // fake repo returns a user
    await expect(service.getUser(1)).resolves.toEqual({ id: 1, name: 'Asha' }); // check the result
  });                                                              // end of test 1

  it('throws 404 when missing', async () => {                      // test 2
    fakeRepo.findById.mockResolvedValue(null);                     // fake repo finds nothing
    await expect(service.getUser(99)).rejects.toBeInstanceOf(NotFoundException); // expect a 404 error
  });                                                              // end of test 2
});                                                                // end of describe
```

```text
PASS  src/users/users.service.spec.ts
  UsersService
    ✓ returns the user
    ✓ throws 404 when missing
```

:::version[Version note]
New projects made with NestJS 12 (August 2026) use **Vitest** instead of Jest. Swap `jest.fn()` for `vi.fn()`. The `Test.createTestingModule()` code stays the same.
:::

## 🔍 Deeper version

**Unit vs integration vs e2e in Nest:**

| Test type | What is real | What is fake | Tool |
|---|---|---|---|
| Unit | One class | All its dependencies | `Test.createTestingModule` + Jest |
| Integration | A few classes together | External things (DB, mail) | Testing module with some real providers |
| E2E | The whole app over HTTP | Maybe only the DB or third-party APIs | Supertest + `app.init()` |

See [unit, integration and e2e](topic:testing/unit-integration-e2e).

**Overriding in a bigger module.** If you import a whole module, override one provider:

```ts
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],                                  // the real app
})
  .overrideProvider(UsersRepo).useValue(fakeRepo)        // swap only the repo
  .overrideGuard(AuthGuard).useValue({ canActivate: () => true }) // let every request in
  .compile();                                            // build it
```

You can also use `.overrideInterceptor()`, `.overridePipe()` and `.overrideFilter()`.

**E2E with Supertest.** The `nest new` project has a `test/` folder for this:

```ts
import request from 'supertest';                          // sends HTTP requests in tests
const app = moduleRef.createNestApplication();            // a full Nest app
await app.init();                                         // run startup (no real port needed)
await request(app.getHttpServer())                        // the underlying HTTP server
  .get('/users/1')                                        // call the route
  .expect(200)                                            // 200 = OK
  .expect({ id: 1, name: 'Asha' });                       // check the body
await app.close();                                        // shut down after tests
```

If you use a global `ValidationPipe` in `main.ts`, add it here too with `app.useGlobalPipes(...)`. `main.ts` does not run in tests.

**Database choices for e2e.** Options are an in-memory MongoDB (`mongodb-memory-server`), a test database in Docker, or faking the repository. See [test databases](topic:testing/test-databases).

**Testing controllers.** Usually you fake the service and check the controller calls it with the right values. Most logic should sit in services, so most tests target services.

## 🎯 Why do we use it?

- **DI makes fakes easy.** You swap a provider by its token. No `jest.mock('../path')`.
- **Real wiring is tested.** The testing module checks that Nest can build your classes and their dependencies.
- **Safe changes.** E2E tests catch broken routes, guards and pipes before production.

## ⚠️ Common mistakes

- **Forgetting a dependency in `providers`.** Nest throws "Nest can't resolve dependencies of UsersService". Add the provider or a fake.
- **Not adding global pipes in e2e tests.** Validation passes in tests but fails in production, or the other way round.
- **Not calling `app.close()`.** Jest says "did not exit" because the DB connection is still open.
- **Sharing mock state between tests.** Reset mocks in `beforeEach` with `jest.clearAllMocks()`.

## 🗣️ How to answer in an interview

> "In NestJS I'd use `Test.createTestingModule` to build a small module for each test. For a unit test of a service I list the real service and replace its dependencies with `{ provide: UsersRepo, useValue: fakeRepo }`, then `compile()` and get the instance with `moduleRef.get()`.
>
> For e2e tests I create the full app, call `app.init()`, and hit routes with Supertest through `app.getHttpServer()`. I use `overrideProvider` or `overrideGuard` to fake the database or skip auth.
>
> At my current job I write Jest unit tests for our Node.js backend, so the Jest side is familiar. I haven't used Nest in production, but its DI makes the faking cleaner than module mocking."

## 🔁 Follow-up questions

### What is the difference between `get()` and `resolve()` on a module ref?

`get()` returns a singleton (default-scoped) provider. `resolve()` is for request-scoped or transient providers, which get a fresh instance.

### Why does a test fail with "Nest can't resolve dependencies"?

The class asks for something that is not in the testing module. Add the real provider, a fake with `useValue`, or import the module that exports it.

### How do you test a guard?

Unit test it by calling `canActivate()` with a fake `ExecutionContext`. Or e2e test a protected route with and without a valid token.

### Should e2e tests hit the real database?

Not a shared one. Use an in-memory or Docker test database, and clean it between tests.

## ✅ Quick check

### 1. Which line swaps the real `MailService` for a fake?

- A) `providers: [MailService, fakeMail]`
- B) `providers: [{ provide: MailService, useValue: fakeMail }]`

:::answer
**B.** `provide` says which token to fill, and `useValue` says what to put there.
:::

### 2. Your e2e test sends an invalid body, but gets 201 instead of 400. Why?

:::answer
The global `ValidationPipe` is set in `main.ts`, which doesn't run in tests. Add `app.useGlobalPipes(new ValidationPipe())` in the test setup too.
:::

### 3. True or false: you need `app.listen()` to test routes with Supertest.

:::answer
**False.** `app.init()` is enough. Supertest uses `app.getHttpServer()` directly.
:::
