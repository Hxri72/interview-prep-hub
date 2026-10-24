---
title: JWT auth with @nestjs/jwt and Passport
stack: nestjs
order: 19
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "@nestjs/jwt gives you JwtService: signAsync() makes a token at login, verifyAsync() checks it later."
  - A guard reads the token (from the Authorization header or a cookie), verifies it, and puts the user on request.user.
  - "Make the auth guard global with APP_GUARD, and mark open routes like login with a @Public() decorator."
  - "Passport (@nestjs/passport + passport-jwt) is the other common way: a JwtStrategy plus AuthGuard('jwt')."
  - Read the secret from ConfigService, keep access tokens short-lived, and store them in HttpOnly cookies in browsers.
cards:
  - q: Which package signs and verifies JWTs in NestJS?
    a: "@nestjs/jwt. Its JwtService has signAsync() to create a token and verifyAsync() to check it."
  - q: Where does JWT checking usually happen in NestJS?
    a: In a guard. It verifies the token and attaches the user to request.user, or throws UnauthorizedException (401).
  - q: How do you protect every route but leave login open?
    a: Register the auth guard globally with APP_GUARD, and add a @Public() decorator (SetMetadata) that the guard checks with Reflector.
  - q: What do you get from Passport in NestJS?
    a: Ready-made strategies (JWT, local, Google…). You write a JwtStrategy with a validate() method and protect routes with AuthGuard('jwt').
---

## 💡 What is it?

A [JWT](glossary:jwt) is a signed token. The server gives it to the user at login. The user sends it back with every request to prove who they are.

In NestJS, `@nestjs/jwt` creates and checks these tokens. A [guard](topic:nestjs/guards) checks the token before your route runs. If the token is missing or wrong, the user gets a 401 error.

## 🏠 Real-life example

Think of **a hostel with a gate pass**.

- **The warden's office** signs a gate pass when you show your ID. That is the **login route**, which calls `signAsync()`.
- **The warden's stamp** on the pass can't be copied. That is the **signature**, made with the secret key.
- **The guard at the gate** checks the stamp every time you come back. That is the **auth guard**, which calls `verifyAsync()`.
- **The pass has a time limit.** After 10 pm it's no longer valid. That is the token's **expiry** (`expiresIn`).
- **The reception desk is open to everyone.** You don't need a pass to ask for one. That is a route marked **`@Public()`**.

## 🧑‍💻 Code example

Set up:

```bash
nest new jwt-demo
cd jwt-demo
npm install @nestjs/jwt
```

Replace `src/main.ts` with this code. Run it with `npm run start:dev`.

```ts
import { NestFactory } from '@nestjs/core';                            // creates the Nest app
import {                                                                // building blocks
  Module, Controller, Post, Get, Body, Req, Injectable, UseGuards,      // module, routes, decorators
  CanActivate, ExecutionContext, UnauthorizedException,                 // guard types and the 401 error
} from '@nestjs/common';                                                // end of the import list
import { JwtModule, JwtService } from '@nestjs/jwt';                    // the JWT package

@Injectable()                                                           // Nest can create this guard
class AuthGuard implements CanActivate {                                // checks the token before the route runs
  constructor(private readonly jwt: JwtService) {}                      // Nest injects JwtService

  async canActivate(context: ExecutionContext): Promise<boolean> {      // true = allowed, error = blocked
    const req = context.switchToHttp().getRequest();                    // get the Express request object
    const [type, token] = (req.headers.authorization ?? '').split(' '); // header looks like "Bearer <token>"
    if (type !== 'Bearer' || !token) throw new UnauthorizedException(); // no token → 401 Unauthorized
    try {                                                               // the token may be fake or expired
      req.user = await this.jwt.verifyAsync(token);                     // check signature + expiry; save the payload
    } catch {                                                           // verification failed
      throw new UnauthorizedException('Invalid or expired token');      // 401 with a message
    }                                                                   // end of try/catch
    return true;                                                        // token is good → let the request in
  }                                                                     // end of canActivate
}                                                                       // end of AuthGuard

@Controller('auth')                                                     // routes start with /auth
class AuthController {                                                  // login and profile routes
  constructor(private readonly jwt: JwtService) {}                      // Nest injects JwtService

  @Post('login')                                                        // POST /auth/login (open to everyone)
  async login(@Body() body: { email: string; password: string }) {      // read email + password from the body
    if (body.password !== 'secret123') throw new UnauthorizedException(); // demo only; real code checks a bcrypt hash
    const payload = { sub: 'u1', email: body.email, role: 'recruiter' };// sub = user id; keep the payload small
    return { accessToken: await this.jwt.signAsync(payload) };          // sign the token and send it back
  }                                                                     // end of login

  @Get('me')                                                            // GET /auth/me (protected)
  @UseGuards(AuthGuard)                                                 // run AuthGuard first
  me(@Req() req: { user: unknown }) {                                   // req.user was set by the guard
    return req.user;                                                    // send back who is logged in
  }                                                                     // end of me
}                                                                       // end of AuthController

@Module({                                                               // the root module
  imports: [                                                            // modules we use
    JwtModule.register({                                                // set up JwtService
      secret: 'dev-only-secret-change-me-please-32ch',                  // demo secret; read it from ConfigService in real apps
      signOptions: { expiresIn: '15m' },                                // tokens expire after 15 minutes
    }),                                                                 // end of register
  ],                                                                    // end of imports
  controllers: [AuthController],                                        // our controller
  providers: [AuthGuard],                                               // our guard
})                                                                      // end of the module settings
class AppModule {}                                                      // empty body

async function bootstrap() {                                            // start-up function
  const app = await NestFactory.create(AppModule);                      // build the app
  await app.listen(3000);                                               // 3000 = port
}                                                                       // end of bootstrap
bootstrap();                                                            // run it
```

Try it:

```text
$ curl http://localhost:3000/auth/me
{"message":"Unauthorized","statusCode":401}

$ curl -X POST -H "Content-Type: application/json" \
    -d '{"email":"asha@example.com","password":"secret123"}' http://localhost:3000/auth/login
{"accessToken":"eyJhbGciOiJIUzI1NiIs..."}

$ curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." http://localhost:3000/auth/me
{"sub":"u1","email":"asha@example.com","role":"recruiter","iat":1792800000,"exp":1792800900}
```

`iat` = issued at, and `exp` = expires at. Both are times in seconds.

## 🔍 Deeper version

**Secret from config.** Never hard-code the secret. Use `registerAsync` with [ConfigService](topic:nestjs/config):

```ts
JwtModule.registerAsync({                                               // async setup: wait for config
  global: true,                                                         // JwtService usable in every module
  inject: [ConfigService],                                              // Nest passes ConfigService in
  useFactory: (config: ConfigService) => ({                             // build the options
    secret: config.getOrThrow<string>('JWT_SECRET'),                    // required secret from env
    signOptions: { expiresIn: '15m' },                                  // short-lived access token
  }),                                                                   // end of the options
});                                                                     // end of registerAsync
```

**Protect everything by default.** Forgetting `@UseGuards` on one route is a security hole. So make the guard global, and mark open routes:

```ts
export const IS_PUBLIC = 'isPublic';                                    // the metadata key
export const Public = () => SetMetadata(IS_PUBLIC, true);              // @Public() puts isPublic = true on a route

// in AppModule providers:
{ provide: APP_GUARD, useClass: AuthGuard }                            // APP_GUARD = run this guard on every route

// at the top of AuthGuard.canActivate:
const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ // read the flag
  context.getHandler(),                                                 // from the method first
  context.getClass(),                                                   // then from the controller
]);                                                                     // end of the lookup
if (isPublic) return true;                                              // public route → skip the token check
```

`Reflector` reads [metadata](glossary:metadata) that decorators stored. Roles work the same way: `@Roles('admin')` plus a `RolesGuard`. See [guards](topic:nestjs/guards).

**Tokens in cookies.** For browser apps, an **HttpOnly cookie** is safer than `localStorage`. JavaScript on the page can't read an HttpOnly cookie, so an XSS attack can't steal it. Set it at login with `res.cookie('access_token', token, { httpOnly: true, secure: true, sameSite: 'lax' })`. Then read it in the guard from `req.cookies.access_token`, after adding the `cookie-parser` middleware. See [token storage](topic:rest-auth/token-storage).

**The Passport way.** Many Nest projects use Passport, a popular auth library with many "strategies":

```ts
@Injectable()                                                           // Nest can create it
export class JwtStrategy extends PassportStrategy(Strategy) {          // Strategy comes from passport-jwt
  constructor(config: ConfigService) {                                  // inject config
    super({                                                             // options for passport-jwt
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),         // where to find the token
      secretOrKey: config.getOrThrow('JWT_SECRET'),                     // the secret to verify with
    });                                                                 // end of super
  }                                                                     // end of constructor
  validate(payload: { sub: string; role: string }) {                    // called after the token is verified
    return { userId: payload.sub, role: payload.role };                 // this becomes request.user
  }                                                                     // end of validate
}                                                                       // end of JwtStrategy
// protect a route with: @UseGuards(AuthGuard('jwt'))                  // AuthGuard here comes from @nestjs/passport
```

| | Plain `@nestjs/jwt` guard | Passport |
|---|---|---|
| Extra packages | none | `@nestjs/passport`, `passport`, `passport-jwt` |
| Code | short, all yours | a bit more setup |
| Many login types (Google, local, SAML) | you write each one | ready-made strategies |

**Refresh tokens.** Keep the access token short (5–15 minutes). Give a longer refresh token, store it safely, and rotate it on each use. See [refresh tokens](topic:rest-auth/refresh-tokens).

:::version[Version note]
Recent NestJS docs show the plain `@nestjs/jwt` guard first, and Passport as a separate recipe. Both are still fully supported.
:::

## 🎯 Why do we use it?

- **Stateless auth.** The server checks the signature. It doesn't need to look up a session for every request.
- **One place for the check.** The guard protects any route you attach it to, or all routes when global.
- **User data on every request.** After the guard, `request.user` has the user ID and role for the handler and other guards.

## ⚠️ Common mistakes

- **Hard-coding the secret** or using a short one. Read a long random secret from config.
- **Putting private data in the payload.** A JWT is signed, not encrypted. Anyone can read the payload with base64 decoding.
- **Forgetting the guard on one route.** Use a global guard plus `@Public()` instead.
- **Very long-lived access tokens.** If stolen, they work for days. Use short access tokens and refresh tokens.

## 🗣️ How to answer in an interview

> "In NestJS I use `@nestjs/jwt`. At login, after checking the password hash, I call `signAsync` with a small payload: the user ID, role and tenant. The secret comes from `ConfigService` through `registerAsync`.
>
> To check the token I write a guard. It reads the token from an HttpOnly cookie or the Bearer header, calls `verifyAsync`, and sets `request.user`. If it fails, it throws `UnauthorizedException`. I register it globally with `APP_GUARD` and mark open routes with a `@Public()` decorator. Roles are a second guard that reads `@Roles` metadata with `Reflector`. Passport with a `JwtStrategy` is the other common option.
>
> I haven't used Nest in production. But at SkillKeepr, auth uses HttpOnly JWT cookies, the tenant is locked inside the JWT, and I worked on the shared authentication modules with my team. So I know this flow well. In Nest it maps neatly onto a global guard."

## 🔁 Follow-up questions

### Why use a guard and not middleware for JWT checks?

A guard knows which route will run. So it can read `@Public()` or `@Roles()` metadata. Middleware can't see that. Guards also throw normal Nest exceptions that the filters handle.

### What should go inside the JWT payload?

Only small, non-secret data: the user ID (`sub`), role and maybe the tenant ID. No passwords, no personal details, because anyone can decode the payload.

### How do you log a user out with JWTs?

Clear the cookie on the client. For real revocation, keep refresh tokens in the database and delete them, or keep a short block-list of token IDs. See [logout and revocation](topic:rest-auth/logout-revocation).

### How would you add role checks?

Make a `@Roles('admin')` decorator with `SetMetadata`. Then add a `RolesGuard` that reads it with `Reflector` and compares it to `request.user.role`. It runs after the auth guard.

## ✅ Quick check

### 1. The token is valid but expired. What does `verifyAsync` do?

:::answer
**It throws an error** (a `TokenExpiredError`). The guard catches it and throws `UnauthorizedException`, so the user gets a **401**.
:::

### 2. True or false: the JWT payload is encrypted, so it's safe to store the user's phone number in it.

:::answer
**False.** A normal JWT is only **signed**, not encrypted. Anyone can read the payload. The signature only stops people from changing it.
:::

### 3. What does `{ provide: APP_GUARD, useClass: AuthGuard }` do?

:::answer
It makes `AuthGuard` a **global guard**, so it runs on every route. Nest also injects its dependencies, like `JwtService` and `Reflector`.
:::
