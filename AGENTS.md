# AGENTS.md

Guidance for AI agents and contributors working in this repository.

## Project in one line

A NestJS 12 (TypeScript 6, CommonJS) personal finance API organized as **bounded contexts** under `src/<bc>/` (DDD layering: `application` / `domain` / `infrastructure`) plus a shared library under `libs/shared`.

## Repo layout

- `src/<bc>/` — bounded contexts (`auth`; add more as the domain grows).
- `libs/shared/` — reusable infrastructure (`config`, `http`, `persistence`, `rabbitmq`, `domain-event` building blocks). Imported via the `@shared/*` alias.
- Sample BC to mimic: `src/auth/`.

## Endpoints

Interactive docs at `/docs` (OpenAPI JSON at `/docs-json`). Current surface:

| Method | Path           | BC   | Description       |
|--------|----------------|------|-------------------|
| POST   | `/auth/register` | auth | Register a new user (201, empty body) |
| POST   | `/auth/login`    | auth | Log in, sets the auth cookies (204, no body) |
| POST   | `/auth/refresh`  | auth | Rotate the auth cookies (204, no body) |
| POST   | `/auth/logout`   | auth | Revoke the refresh token, clear cookies (204) |
| GET    | `/auth/me`       | auth | Return the authenticated user (200, cookie auth) |

All routes are private by default: the global `JwtAuthGuard` (`APP_GUARD`) requires a valid access cookie, and only the four `@Public()` endpoints above are open.

Keep this table in sync whenever endpoints change.

## Commands — run these before finishing any task

```bash
npx tsc --noEmit   # type check (fast, catches most issues)
npm run lint       # eslint src/ + libs/ + tests/
npm run test       # vitest unit tests (tests/unit)
npm run test:e2e   # cucumber e2e (tests/e2e, testcontainers; plain cucumber-js, no build step)
npm run build      # nest build (webpack)
```

Your changes must pass all of them. `npm run format` applies Prettier (tabWidth 4).

Schema changes: add a migration under `libs/shared/src/infrastructure/persistence/typeorm/migrations/` **and register its class in that folder's `index.ts`** (the barrel is the single list shared by `SharedModule` and the CLI data source — see §7 in `CONVENTIONS.md`; an unregistered migration is invisible to both). The migration CLI runs **inside the `api` container**, never on the host: `docker compose exec api npm run migration:generate [-- <name>]` (auto-named; exits non-zero when the schema already matches) / `npm run migration:run` / `npm run migration:revert`.

## Mandatory conventions

- **Path aliases**: imports use tsconfig `paths` aliases — `@auth/*`, …, `@shared/*` (note: the shared library alias is `@shared/`, NOT `@shared`). Never use long relative paths.
- **CommonJS**: the project is CommonJS (`module: commonjs`) with **no `"type": "module"`** — do NOT add `.js` extensions to imports, do NOT convert to ESM, do NOT add `"moduleResolution": "bundler"`.
- **No new dependencies** without checking `package.json` first (Nest 12, zod 4, amqplib, vitest, ts-node, passport, `@nestjs/jwt`, cookie-parser already present).
- **Config pattern per BC**:
  - `infrastructure/config/env-schema.ts` → exports the BC's zod schema for its envs (single source of truth).
  - `infrastructure/config/<name>.config.ts` → `registerAs('<bc>', ...)` factory that `safeParse(process.env)`, throws a descriptive error on failure, and maps to the config object.
  - The BC module registers it via `ConfigModule.forFeature(<bc>Config)`.
  - Do NOT move per-BC env validation into `SharedModule`; shared validates only its own infra envs (`APP_PORT`, `APP_CORS_ORIGIN`, `RABBITMQ_*`, `DB_*`) via `env.validation.ts` / `validateEnv`.
- **DI style**: define abstract interfaces/tokens in `domain/` (e.g. `PASSWORD_HASHER_SERVICE`, `USER_REPOSITORY`), implement them in `infrastructure/`, and bind with `useClass` in the module `providers`. Repositories likewise (`UserRepository` → `TypeormUserRepository`).
- **Persistence (TypeORM)**: `TypeOrmModule.forRootAsync` lives in `SharedModule` (global), not in `app.module.ts`; BCs register entities via `TypeOrmModule.forFeature([...])`. Per aggregate use `infrastructure/persistence/typeorm/{entities,mappers,repositories}/...` — mapper is `toEntity`/`toDomain`, repository implements the domain interface. Timestamps: `timestamptz` (UTC). Schema comes from migrations (`libs/shared/src/infrastructure/persistence/typeorm/`), not from `synchronize` (default `false`).
- **CQRS (commands)**: use cases / handler actions that mutate a resource return `Promise<void>` (no data). Reads happen through queries or read endpoints, never as a command's return value.
- **Swagger/OpenAPI**: every endpoint is documented manually with `@nestjs/swagger` — `@ApiTags('Auth')` (BC name capitalized), `@ApiOperation`, response decorators, and `@ApiProperty` on transport DTO fields in `infrastructure/http/dto/` (class properties, not ctor params). Application DTOs (`application/dto/`) carry no Swagger decorators. UI is served at `/docs`, wired inline in `src/main.ts`; new endpoints must keep it in sync.
- **Exceptions**: prefer custom exceptions extending the shared bases `DomainException` / `ApplicationException` / `InfrastructureException` (`@shared/{domain,application,infrastructure}/exceptions/`) instead of raw `Error`. Define them in the layer that raises them.
- **Auth (cookies)**: access and refresh JWTs are returned **only** as `httpOnly` cookies — never in a response body (`204` is the expected success status on login/refresh/logout). Routing is deny-by-default: the global `JwtAuthGuard` (`APP_GUARD` in `app.module.ts`) guards every route and only `@Public()` handlers (register, login, refresh, logout) are open. Payloads carry `type: 'access' | 'refresh'` and the strategy rejects the wrong one. Refresh tokens are persisted as SHA-256 hashes in `refresh_tokens` (the raw token is never stored) and **rotated on every `/auth/refresh`**: the presented token is revoked, published as `refresh_token.revoked`, and a new pair is issued. Only the cookie **names** come from config (`JWT_COOKIE_NAME` / `JWT_REFRESH_COOKIE_NAME`, read as `auth.cookies.{access,refresh}.name`). The attributes — `httpOnly: true`, `sameSite: 'lax'`, `secure: false`, and `path` (`/` for access, `/auth` for the refresh token) — are **hardcoded in `AuthCookieService` on purpose**; they are security decisions, not deployment settings, so do not turn them into env vars. `secure: false` therefore suits HTTP only (local) — deploying behind HTTPS means flipping it in that class.
- **HTTP errors**: every error is returned as a uniform `HttpError` body (`{ path, status, message, timestamp }`) by the global `GlobalHttpExceptionHandler` (registered as `APP_FILTER` in `app.module.ts`, `@Catch(Error)`). A `HttpException` keeps its own status; subclasses of `DomainException` / `ApplicationException` / `InfrastructureException` map to 400 / 409 / 503 via the `HTTP_ERROR_CODES` map (`instanceof` lookup, concrete exceptions registered before the bases); anything else defaults to 500. Do not import BC exceptions from `libs/shared`.
- **Formatting**: 4-space indentation, single quotes, trailing commas (Prettier config). Match surrounding code exactly.
- **Do not add code comments** unless the surrounding code style requires them.

## Gotchas

- `src/main.ts` starts with `import 'tsconfig-paths/register'` so CommonJS runtime resolves aliases.
- `RabbitMQClient` connects eagerly at bootstrap (`onModuleInit`) with the exchange ensured, and TypeORM opens a PostgreSQL connection at start — a live broker and DB are required to start the app. `docker compose up` (see `Dockerfile`/`docker-compose.yml`) provides broker + database + app.
- `.env` is gitignored — never read secrets from it into docs/commits; keep `.env.example` up to date instead. `docker compose` injects `.env` verbatim (`env_file`, required) into the `api` service with no overrides — the `.env` must therefore point at the service names (`DB_HOST=postgres`, `RABBITMQ_URL=amqp://rabbitmq:5672`); host-side runs use `localhost`. The `postgres` service sets its `POSTGRES_*` credentials in plain text via an `environment` block.
- vitest resolves aliases via `vite-tsconfig-paths`; unit specs are `tests/unit/**/*.spec.ts`.
- E2e is Cucumber + Testcontainers under `tests/e2e/`, and `npm run test:e2e` is **plain `cucumber-js`** — no build step, no `dist-e2e/`, no `tsconfig.e2e.json`. `cucumber.js` loads the `.ts` sources in place via `requireModule: ['ts-node/register', 'tsconfig-paths/register']`, so it always runs the current working tree. Two rules follow from that: load support/step files with `require`, never `import` (ts-node and tsconfig-paths are CommonJS-only, and `import` bypasses both); and keep ts-node as the loader — ts-node type-checks the whole graph as it goes (no `TS_NODE_TRANSPILE_ONLY`) and reads `tsconfig.json`, so a type error in the sources fails the run.
- **Never load the e2e sources through tsx/esbuild.** Only tsc honours `emitDecoratorMetadata`, and Nest DI reads the resulting `design:paramtypes`: without it the constructor arguments resolve to `undefined` and `NestFactory.create` dies through its default teardown with `process.exit(1)` and **no output at all**. If `test:e2e` ever exits 1 silently, suspect this before anything else.
- The usual cause of that silent exit 1 is **not** missing metadata but a bootstrap error hidden by `NestFactory.create(AppModule, { logger: false })` in `tests/e2e/support/context.ts`: with no logger Nest swallows the error and just exits 1. To see it, run the context by hand with `logger: ['error'], abortOnError: false`. A failing `--dry-run` that is green while the real run dies silently also means the steps parse fine and `BeforeAll` is what dies.
- The e2e suite reads its environment from the committed **`.env.test`** (via `process.loadEnvFile`, so no dotenv dependency), loaded by `ApiContext.start()` before the app module is imported. Only `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` and `RABBITMQ_URL` are set programmatically, because they depend on the per-run testcontainer ports. `.env.test` must be loaded *before* `import('../../../src/app.module')`: `ConfigModule.forRoot` loads `.env` with dotenv, which never overwrites variables already present in `process.env`, so `.env.test` wins.

## Committing

- Only commit when asked.
- Follow Conventional Commits in the repo's style (lowercase): e.g. `feat(auth): …`, `refactor(config): …`, `chore: …`, `test: …`, `build(deps): …`.
- **Group commits by responsibility** (one concern per commit); run `git status`, `git diff`, `git log --oneline -10` first; stage only intended files; never commit `.env`.
- Do not push unless asked.