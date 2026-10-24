---
title: Microservices and transports (overview)
stack: nestjs
order: 24
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "@nestjs/microservices lets Nest apps talk to each other with messages instead of HTTP routes."
  - "A transport is how the messages travel: TCP, Redis, NATS, MQTT, RabbitMQ, Kafka or gRPC."
  - "@MessagePattern = request-response (the caller waits for a reply). @EventPattern = fire-and-forget event (no reply)."
  - "The caller uses a ClientProxy: send() for request-response, emit() for events."
  - A hybrid app serves normal HTTP routes and listens for messages at the same time.
cards:
  - q: What is a transport in NestJS microservices?
    a: The way messages travel between services, like TCP, Redis, NATS, RabbitMQ, Kafka or gRPC.
  - q: What is the difference between @MessagePattern and @EventPattern?
    a: "@MessagePattern handles request-response: the caller waits for a reply. @EventPattern handles events: no reply is sent."
  - q: Which ClientProxy methods match those patterns?
    a: send() for request-response (returns an Observable with the reply) and emit() for events.
  - q: What is a hybrid application in Nest?
    a: One Nest app that serves HTTP routes and also listens to a microservice transport, using app.connectMicroservice().
---

## 💡 What is it?

A **microservice** is a small app that does one job. Many of them work together. See [microservices](topic:architecture/microservices).

In Nest, the `@nestjs/microservices` package lets services send **messages** to each other. Instead of `@Get()` routes, handlers listen for message names.

The **transport** is how the message travels. It can be plain TCP or a message broker like RabbitMQ or Kafka.

## 🏠 Real-life example

Think of **a school office sending notes to classrooms**.

Sometimes the office asks a question and waits: "How many students are present?" Sometimes it just announces: "Tomorrow is a holiday." No reply needed.

- **The office** = the caller service, using a `ClientProxy`.
- **The classroom** = the microservice that handles messages.
- **"How many students?" and waiting** = `send()` + `@MessagePattern` (request-response).
- **"Tomorrow is a holiday"** = `emit()` + `@EventPattern` (an event, no reply).
- **The peon carrying notes, or the loudspeaker** = the transport (TCP, Redis, RabbitMQ, Kafka…).

## 🧑‍💻 Code example

Two small Nest apps talking over TCP. Install the package in a project made with `npx @nestjs/cli new ms-demo`:

```bash
npm install @nestjs/microservices
```

**Service A (the microservice)** — `src/math.main.ts`. Run it with `npx ts-node src/math.main.ts`.

```ts
import { Controller, Module } from '@nestjs/common';               // Nest basics
import { NestFactory } from '@nestjs/core';                        // creates apps
import { EventPattern, MessagePattern, Payload, Transport } from '@nestjs/microservices'; // message tools

@Controller()                                                      // a controller for messages
class MathController {                                             // handles incoming messages
  @MessagePattern('sum')                                           // request-response: listens for "sum"
  sum(@Payload() numbers: number[]) {                              // @Payload() = the message data
    return numbers.reduce((a, b) => a + b, 0);                     // the reply, sent back to the caller
  }                                                                // end of sum

  @EventPattern('user_created')                                    // event: listens for "user_created"
  onUserCreated(@Payload() user: { name: string }) {               // the event data
    console.log(`Welcome email queued for ${user.name}`);          // do some work; nothing is returned
  }                                                                // end of onUserCreated
}                                                                  // end of MathController

@Module({ controllers: [MathController] })                         // a module with that controller
class MathModule {}                                                // end of MathModule

async function bootstrap() {                                       // start-up function
  const app = await NestFactory.createMicroservice(MathModule, {   // a microservice, not an HTTP app
    transport: Transport.TCP,                                      // send messages over TCP
    options: { port: 4000 },                                       // listen on port 4000
  });                                                              // end of options
  await app.listen();                                              // start listening for messages
  console.log('Math service listening on 4000');                   // log it
}                                                                  // end of bootstrap
bootstrap();                                                       // run it
```

**Service B (the HTTP app that calls it)** — `src/app.module.ts`. Run it with `npm run start:dev`.

```ts
import { Controller, Get, Inject, Module } from '@nestjs/common';  // Nest basics
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices'; // client tools

@Controller()                                                      // normal HTTP controller
class AppController {                                              // handles HTTP requests
  constructor(@Inject('MATH') private math: ClientProxy) {}        // inject the client by its name "MATH"

  @Get('sum')                                                      // GET /sum
  sum() {                                                          // route handler
    return this.math.send('sum', [1, 2, 3]);                       // send "sum" and wait; Nest unwraps the reply
  }                                                                // end of sum

  @Get('signup')                                                   // GET /signup
  signup() {                                                       // route handler
    this.math.emit('user_created', { name: 'Asha' });              // fire an event; don't wait
    return { ok: true };                                           // reply to the browser at once
  }                                                                // end of signup
}                                                                  // end of AppController

@Module({                                                          // the root module
  imports: [ClientsModule.register([                               // register a client
    { name: 'MATH', transport: Transport.TCP, options: { port: 4000 } }, // name + where the service is
  ])],                                                             // end of imports
  controllers: [AppController],                                    // our HTTP controller
})                                                                 // end of module metadata
export class AppModule {}                                          // end of AppModule
```

```text
$ curl http://localhost:3000/sum
6
$ curl http://localhost:3000/signup
{"ok":true}

Math service terminal:
Welcome email queued for Asha
```

## 🔍 Deeper version

**Two message styles:**

| | Request-response | Event-based |
|---|---|---|
| Handler | `@MessagePattern('name')` | `@EventPattern('name')` |
| Caller | `client.send(pattern, data)` | `client.emit(pattern, data)` |
| Reply? | Yes, the caller gets an Observable with the result | No |
| Use for | "Get me this data" | "This happened", others react |

`send()` returns an RxJS **Observable** (a stream of values). It is lazy: nothing is sent until someone subscribes. Returning it from a controller is fine, because Nest subscribes for you. In a service, use `await firstValueFrom(client.send(...))`.

**Built-in transports:**

| Transport | What it is | Good for |
|---|---|---|
| TCP | Direct connection | Simple demos, internal calls |
| Redis | Pub/sub through Redis | Simple broadcasting |
| NATS | Light, fast message broker | Many small services |
| MQTT | Light protocol for devices | IoT |
| RabbitMQ | Message broker with [queues](glossary:queue) | Reliable work queues |
| Kafka | Event log, stores messages | High-volume event streams |
| gRPC | Fast binary RPC with `.proto` contracts | Strict, typed service-to-service calls |

Others, like AWS SQS, need a **custom transporter** or a community package.

**Hybrid apps.** One app can serve HTTP and listen for messages:

```ts
const app = await NestFactory.create(AppModule);                   // normal HTTP app
app.connectMicroservice({ transport: Transport.TCP, options: { port: 4000 } }); // also listen on TCP
await app.startAllMicroservices();                                 // start the message listeners
await app.listen(3000);                                            // start HTTP on 3000
```

**Things that stay the same.** [Guards](topic:nestjs/guards), [pipes](topic:nestjs/pipes), [interceptors](topic:nestjs/interceptors) and [exception filters](topic:nestjs/exception-filters) also work for message handlers. Throw `RpcException` instead of `HttpException`, because there is no HTTP status code.

**Hard parts that Nest doesn't solve for you:** retries, duplicate messages ([idempotent consumers](topic:architecture/idempotent-consumers)), timeouts, and tracing a request across services.

## 🎯 Why do we use it?

- **Same Nest style everywhere.** Controllers, DI and decorators work for messages too.
- **Swap the transport easily.** Moving from TCP to RabbitMQ is mostly a config change.
- **Loose coupling.** With events, the sender doesn't need to know who listens.

## ⚠️ Common mistakes

- **Using `send()` for events.** The caller waits for a reply that never comes. Use `emit()`.
- **Calling `send()` without subscribing.** Nothing is sent, because Observables are lazy. Return it or use `firstValueFrom`.
- **Throwing `HttpException` in a message handler.** Use `RpcException`.
- **Splitting into microservices too early.** A [modular monolith](topic:architecture/modular-monolith) is often enough.

## 🗣️ How to answer in an interview

> "NestJS has a microservices package where services talk with messages instead of HTTP. The transport is pluggable: TCP, Redis, NATS, RabbitMQ, Kafka, gRPC and others.
>
> There are two styles. `@MessagePattern` is request-response: the caller uses `client.send()` and gets an Observable with the reply. `@EventPattern` is fire-and-forget: the caller uses `client.emit()`. You can also run a hybrid app that serves HTTP and listens to a transport.
>
> I haven't used Nest microservices in production. At my current job we do background work on AWS with SQS, Step Functions and EventBridge crons. So I know the event-driven side, like why handlers must be safe to run twice."

## 🔁 Follow-up questions

### Why does `send()` return an Observable instead of a Promise?

Nest uses RxJS. An Observable can carry many values and supports timeouts and retries with operators. Use `firstValueFrom()` to turn it into a Promise.

### How do you add a timeout to a microservice call?

Pipe the Observable through the RxJS `timeout()` operator, like `client.send(...).pipe(timeout(5000))`. 5000 = 5 seconds.

### When would you choose Kafka over RabbitMQ?

Kafka keeps a log of events, so many consumers can read and replay them. RabbitMQ is a classic work queue, where each message goes to one worker and then disappears.

### How do errors work in message handlers?

Throw an `RpcException`. The caller's Observable gets an error. You can write an RPC exception filter to shape it.

## ✅ Quick check

### 1. After an order is placed, you want the email service to react. You don't need a reply. Which pair fits?

- A) `send()` + `@MessagePattern`
- B) `emit()` + `@EventPattern`

:::answer
**B.** It's an event: no reply is needed.
:::

### 2. Predict: a service runs `this.client.send('sum', [1, 2]);` and does nothing else. Is the message sent?

:::answer
**No.** The Observable is lazy. Nothing is sent until someone subscribes, for example with `await firstValueFrom(...)`.
:::

### 3. What does `app.connectMicroservice()` give you?

:::answer
A **hybrid app**: the same app serves HTTP routes and listens for messages on a transport.
:::
