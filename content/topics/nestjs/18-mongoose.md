---
title: MongoDB with @nestjs/mongoose
stack: nestjs
order: 18
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "@nestjs/mongoose connects Mongoose to Nest: MongooseModule.forRoot() opens the connection once in the root module."
  - "You describe a collection with a class: @Schema() on the class, @Prop() on each field, then SchemaFactory.createForClass()."
  - "Each feature module registers its models with MongooseModule.forFeature(), and services get a model with @InjectModel()."
  - "Use forRootAsync with ConfigService so the database URI comes from config, not from the code."
  - "For one database per tenant, you can keep one connection and switch with connection.useDb(name)."
cards:
  - q: How do you connect MongoDB in NestJS?
    a: Import MongooseModule.forRoot(uri) (or forRootAsync with ConfigService) in the root module.
  - q: How do you define a Mongoose schema in NestJS?
    a: Write a class with @Schema() and @Prop() decorators, then create the schema with SchemaFactory.createForClass(TheClass).
  - q: How does a service get a Mongoose model?
    a: The module registers it with MongooseModule.forFeature([{ name, schema }]), and the service injects it with @InjectModel(Name.name).
  - q: What does forFeature do?
    a: It registers models for one module, so that module's providers can inject them.
---

## 💡 What is it?

`@nestjs/mongoose` is the official package that connects **Mongoose** to NestJS. Mongoose is the library you use to talk to MongoDB from Node.

With it, you write schemas as TypeScript classes with [decorators](glossary:decorator). Then Nest gives the ready-made model to your services through [dependency injection](glossary:dependency-injection).

## 🏠 Real-life example

Think of **a school library**.

- **The library building and its main door** = the database connection. It opens once for the whole school. That is `MongooseModule.forRoot()`.
- **A shelf rule card** ("this shelf holds books: title, author, year") = the schema class with `@Schema()` and `@Prop()`.
- **Each department getting a key to its own shelves** = `MongooseModule.forFeature()` in each module.
- **A librarian who fetches books for you** = the service that gets the model with `@InjectModel()`.

The science teacher doesn't build a new library. They just ask the librarian for the right shelf.

## 🧑‍💻 Code example

You need MongoDB running. A free MongoDB Atlas cluster or `mongodb://localhost:27017` both work.

Set up:

```bash
nest new mongo-demo
cd mongo-demo
npm install @nestjs/mongoose mongoose
```

Replace `src/main.ts` with this code. Run it with `npm run start:dev`.

```ts
import { NestFactory } from '@nestjs/core';                           // creates the Nest app
import { Module, Controller, Get, Post, Body, Injectable } from '@nestjs/common'; // building blocks
import { MongooseModule, InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose'; // Nest + Mongoose helpers
import { Model, HydratedDocument } from 'mongoose';                   // Mongoose types

@Schema({ timestamps: true })                                         // this class is a schema; timestamps = add createdAt/updatedAt
class Candidate {                                                     // one document in the "candidates" collection
  @Prop({ required: true })                                           // a field that must be present
  name: string;                                                       // the candidate's name

  @Prop({ required: true, unique: true, lowercase: true })            // unique = builds a unique index; lowercase = store in small letters
  email: string;                                                      // the candidate's email

  @Prop({ type: [String], default: [] })                              // an array of strings; [] = empty list by default
  skills: string[];                                                   // e.g. ['react', 'node']
}                                                                     // end of Candidate
type CandidateDocument = HydratedDocument<Candidate>;                 // a full Mongoose document of a Candidate
const CandidateSchema = SchemaFactory.createForClass(Candidate);      // turn the class into a real Mongoose schema

@Injectable()                                                         // Nest can create this service
class CandidatesService {                                             // the business logic
  constructor(                                                        // dependencies come in through the constructor
    @InjectModel(Candidate.name) private readonly candidateModel: Model<Candidate>, // ask Nest for the Candidate model
  ) {}                                                                // end of constructor

  create(data: Partial<Candidate>): Promise<CandidateDocument> {      // Partial = some or all fields
    return this.candidateModel.create(data);                          // insert one document
  }                                                                   // end of create

  findAll() {                                                         // list candidates
    return this.candidateModel.find().sort({ createdAt: -1 }).lean(); // -1 = newest first; lean = plain objects (faster)
  }                                                                   // end of findAll
}                                                                     // end of CandidatesService

@Controller('candidates')                                             // routes start with /candidates
class CandidatesController {                                          // the HTTP layer
  constructor(private readonly service: CandidatesService) {}         // Nest injects the service

  @Post()                                                             // POST /candidates
  create(@Body() body: Partial<Candidate>) {                          // read the JSON body (use a DTO in real code)
    return this.service.create(body);                                 // save and return the new candidate
  }                                                                   // end of create

  @Get()                                                              // GET /candidates
  findAll() {                                                         // list them
    return this.service.findAll();                                    // Nest sends the array as JSON
  }                                                                   // end of findAll
}                                                                     // end of CandidatesController

@Module({                                                             // a feature module for candidates
  imports: [MongooseModule.forFeature([{ name: Candidate.name, schema: CandidateSchema }])], // register the model here
  controllers: [CandidatesController],                                // its controller
  providers: [CandidatesService],                                     // its service
})                                                                    // end of the module settings
class CandidatesModule {}                                             // empty body; the decorator does the work

@Module({                                                             // the root module
  imports: [                                                          // modules this app uses
    MongooseModule.forRoot('mongodb://localhost:27017/prephub'),      // connect once; "prephub" = database name
    CandidatesModule,                                                 // our feature module
  ],                                                                  // end of imports
})                                                                    // end of the module settings
class AppModule {}                                                    // empty body

async function bootstrap() {                                          // start-up function
  const app = await NestFactory.create(AppModule);                    // build the app
  await app.listen(3000);                                             // 3000 = port
}                                                                     // end of bootstrap
bootstrap();                                                          // run it
```

Try it:

```text
$ curl -X POST -H "Content-Type: application/json" \
    -d '{"name":"Asha","email":"Asha@Example.com","skills":["react"]}' http://localhost:3000/candidates
{"name":"Asha","email":"asha@example.com","skills":["react"],"_id":"...","createdAt":"...","updatedAt":"...","__v":0}

$ curl http://localhost:3000/candidates
[{"_id":"...","name":"Asha","email":"asha@example.com","skills":["react"],...}]
```

## 🔍 Deeper version

**The pieces:**

| Piece | Where | Job |
|---|---|---|
| `MongooseModule.forRoot(uri)` | root module, once | opens the connection |
| `@Schema()` / `@Prop()` | schema class | describes fields, types, defaults, indexes |
| `SchemaFactory.createForClass()` | schema file | builds the real Mongoose schema |
| `MongooseModule.forFeature([...])` | each feature module | registers models for that module |
| `@InjectModel(Name.name)` | service constructor | gives you the `Model` |

**Config-driven connection.** Don't put the URI in code. Use `forRootAsync` with [ConfigService](topic:nestjs/config):

```ts
MongooseModule.forRootAsync({                                          // async setup: wait for config first
  inject: [ConfigService],                                             // Nest passes ConfigService to the factory
  useFactory: (config: ConfigService) => ({                            // build the options object
    uri: config.getOrThrow<string>('MONGO_URI'),                       // required; app won't start without it
  }),                                                                  // end of the options
});                                                                    // end of forRootAsync
```

**Indexes, hooks and references.** Everything from plain Mongoose still works on the schema object:

```ts
CandidateSchema.index({ email: 1 }, { unique: true });                 // 1 = ascending; unique = no duplicates
CandidateSchema.pre('save', function () { this.name = this.name.trim(); }); // runs before every save
```

For a reference to another collection, use `@Prop({ type: Types.ObjectId, ref: 'Job' })`. Then use `.populate('job')` in a query. See [populate](topic:mongodb/populate) and [indexes](topic:mongodb/indexes).

**Many tenants, one database each.** Some SaaS apps keep **one database per tenant** (customer company). With Nest you can inject the connection and switch database per request:

```ts
constructor(@InjectConnection() private readonly connection: Connection) {} // the main Mongoose connection

forTenant(tenantId: string) {                                          // tenantId comes from the request
  const db = this.connection.useDb(`tenant_${tenantId}`, { useCache: true }); // reuse the same socket pool; cache = don't rebuild
  return db.model(Candidate.name, CandidateSchema);                    // the Candidate model in that tenant's database
}                                                                      // end of forTenant
```

`useDb` doesn't open a new connection pool. It shares the existing one. See [multi-tenant design](topic:mongodb/multi-tenant-design).

**Multiple connections.** If you really need two clusters, give each `forRoot` a `connectionName`. Then use the same name in `forFeature` and `@InjectModel(Name.name, 'thatName')`.

**Transactions.** Inject the connection, start a session with `connection.startSession()`, and pass `{ session }` to each query. See [transactions](topic:mongodb/transactions).

:::version[Version note]
Use Mongoose 8 or newer with current `@nestjs/mongoose`. Old options like `useNewUrlParser` and `useUnifiedTopology` are gone. Don't add them.
:::

## 🎯 Why do we use it?

- **One connection, shared.** The connection opens once and every module reuses it.
- **Models by injection.** Services ask for a model. In tests you can pass a fake model instead.
- **Typed schemas.** The class gives you TypeScript types and the schema in one place.
- **It fits Nest modules.** Each feature module registers only the models it needs.

## ⚠️ Common mistakes

- **Forgetting `forFeature` in the module.** Then Nest says it can't resolve the dependency `CandidateModel`.
- **Using a different name in `forFeature` and `@InjectModel`.** Use `Candidate.name` in both places.
- **Hard-coding the URI.** Use `forRootAsync` with `ConfigService`.
- **Returning full documents everywhere.** For read-only lists, `.lean()` is faster and uses less memory.

## 🗣️ How to answer in an interview

> "With NestJS I use `@nestjs/mongoose`. I connect once in the root module with `MongooseModule.forRootAsync`, reading the URI from `ConfigService`. I define each schema as a class with `@Schema` and `@Prop`, and build it with `SchemaFactory.createForClass`. Each feature module registers its models with `forFeature`, and the service injects the model with `@InjectModel`.
>
> I've used Mongoose in production with Node and TypeScript, so the schemas, indexes, hooks and aggregations are the same. Nest only changes how the model reaches the service: by injection instead of a direct import.
>
> At SkillKeepr the data is in MongoDB with one database per tenant. In Nest, I'd handle that with one shared connection and `connection.useDb` per tenant, with the tenant coming from the request."

## 🔁 Follow-up questions

### What's the difference between forRoot and forFeature?

`forRoot` opens the database connection, once for the whole app. `forFeature` registers specific models inside one module, so its providers can inject them.

### How would you test a service that uses @InjectModel?

In the testing module, provide a fake for the token `getModelToken(Candidate.name)` with `useValue`. Then the service gets your fake model, with no real database.

### Does useDb open a new connection for each tenant?

No. It reuses the same connection pool and only points to another database. With `useCache: true`, it also reuses the same object for that database name.

### Is TypeORM or Prisma better than Mongoose in Nest?

They are for different needs. Mongoose is the usual choice for MongoDB. TypeORM and Prisma are common for SQL databases like PostgreSQL. Nest has packages for all of them.

## ✅ Quick check

### 1. A service has `@InjectModel(Job.name)`, but its module has no `forFeature` for Job. What happens?

:::answer
**The app fails at start-up.** Nest says it can't resolve the dependency `JobModel`, because no module registered it.
:::

### 2. Where does `MongooseModule.forRoot()` usually go?

- A) In every feature module
- B) Once, in the root module
- C) In the service

:::answer
**B) Once, in the root module.** Feature modules use `forFeature`.
:::

### 3. What does `@Prop({ unique: true })` do?

:::answer
It asks Mongoose to build a **unique index** on that field. It's an index, not a validation rule, so duplicates fail with a MongoDB error (code 11000).
:::
