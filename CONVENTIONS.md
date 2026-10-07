# CONVENTIONS.md

Detailed conventions and patterns for this repository. If you work here (agent or human), follow these. A condensed checklist lives in [AGENTS.md](./AGENTS.md).

## 1. Tooling

- **Node.js ≥ 24**, npm.
- **TypeScript 6**, `strict: true`, module `commonjs`, target `ES2023`.
- **NestJS 12** (`@nestjs/config`, `@nestjs/core`, `@nestjs/platform-express`).
- **Validation:** zod 4.
- **Testing:** vitest 4 (`@vitest/coverage-v8`).
- **RabbitMQ:** `amqplib`.
- **Persistence:** TypeORM + PostgreSQL (`typeorm`, `@nestjs/typeorm`, `pg`).

## 2. Formatting & linting

- Prettier (`.prettierrc`): `tabWidth: 4`, `singleQuote: true`, `trailingComma: "all"`. Format with `npm run format`.
- ESLint (flat config `eslint.config.mjs`): project-aware via `projectService`. Notable rules: `@typescript-eslint/no-explicit-any` is **off**; `@typescript-eslint/no-floating-promises` is **warn**.
- Run `npm run lint` for `src/` and `libs/`.

### Destructuring inputs

When a function receives an input object — a request DTO (`application/dto/`), a transport payload (`infrastructure/http/dto/`), a deserialized wire message, a token payload — **pull its fields out with a destructuring statement** at the top of the body instead of reaching through the dot operator:

```ts
// yes
async execute(request: LoginRequest): Promise<void> {
    const { email, password } = request;
    …
}

// no
async execute(request: LoginRequest): Promise<void> {
    await this.repository.findByEmail(new UserEmail(request.email));
    …
}
```

This holds for a single field too (`const { refreshToken } = request;`), so the shape of a use case does not depend on how many fields the input happens to have.

The rule does **not** apply to:

- **Framework objects** owned by the library, e.g. the Express `Request`/`Response` (`request.url`, `request.cookies?.[name]`, `response.cookie(...)`).
- **Domain value objects and entities**, e.g. `user.id.toString()`, `entity.expiresAt.value` — property access is the domain API; wrapping a single read in a destructuring statement adds noise without adding clarity.

## 3. Module resolution & imports

- **Aliases** (tsconfig `paths`) are mandatory — never use long relative imports:

  | Alias | Target |
  |-------|--------|
  | `@auth/*` | `src/auth/*` |
  | `@shared/` | `libs/shared/src` |
  | `@shared/*` | `libs/shared/src/*` |

  The shared library alias is `@shared/`, **not** `@shared`.

- **CommonJS:** no `"type": "module"`, no `.js` extensions in imports, no `moduleResolution: bundler`. `src/main.ts` imports `tsconfig-paths/register` so the runtime resolves aliases.

## 4. Bounded-context layout (DDD)

Each BC under `src/<bc>/` follows the same layered structure:

```
application/
  dto/                 # request/response objects (e.g. create-user.request.ts)
  usecases/            # use cases (e.g. create-user.usecase.ts)
domain/
  events/              # domain events (e.g. user-created.event.ts)
  exceptions/
  repository/          # repository interfaces (e.g. user.repository.ts)
  services/            # service interfaces/tokens (e.g. password-hasher.service.ts)
  value-objects/
  <aggregate>.ts       # entities / aggregate roots
infrastructure/
  config/              # env-schema.ts + <bc>.config.ts
  http/controllers/    # Nest controllers (e.g. auth.controller.ts)
  http/dto/            # transport (HTTP) request/response DTOs, Swagger-annotated
  persistence/typeorm/ # TypeORM entities, mappers and repository adapters
  <adapters>/          # other ports & adapters (e.g. password-hasher/)
```

`<bc>.module.ts` wires everything at the root of the BC.

### Use cases & CQRS

Use cases act as **commands** for mutations and follow a light CQRS style:

- **Commands (actions that change the resource) do NOT return data** (a priori): signature `async execute(input): Promise<void>`. Example: `CreateUserUseCase.execute`.
- **Transport vs application input**: the controller receives the HTTP DTO (`infrastructure/http/dto/`) and maps it to the application DTO before calling the use case — do not bind the use case to HTTP types.
- Data that must come back is read through **queries / read models / separate endpoints**, not as the command's return value.
- Command handlers stay side-effect driven: mutate via the repository, then publish domain events (`user.pullDomainEvents()` → `domainEventPublisher.publish(...)`).
- Only read-use cases return values.

## 5. Configuration & env validation

**One env var = one field, one BC owns it.** The pattern per BC:

1. `infrastructure/config/env-schema.ts` — the zod schema, the **single source of truth**:

   ```ts
   export const authEnvSchema = z.object({
       BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(31).default(10),
   });
   ```

2. `infrastructure/config/<bc>.config.ts` — `registerAs('<bc>', ...)` validates `process.env` with the schema (throws `Auth environment validation failed: …` on failure) and maps to a typed object:

   ```ts
   export default registerAs('auth', (): AuthConfig => {
       const result = authEnvSchema.safeParse(process.env);
       if (!result.success) {
           /* ... build details from result.error.issues ... */
           throw new Error(`Auth environment validation failed: ${details}`);
       }
       return { bcrypt: { rounds: result.data.BCRYPT_ROUNDS } };
   });
   ```

3. The BC module registers it: `imports: [ConfigModule.forFeature(authConfig)]`.

**Shared infrastructure envs** (`APP_PORT`, `RABBITMQ_*`, `DB_*`) are validated once at startup:

- `libs/shared/src/infrastructure/config/env-schema.ts` — `appEnvSchema`, `rabbitmqEnvSchema`, `databaseEnvSchema`.
- `libs/shared/src/infrastructure/config/shared.config.ts` — `registerAs('app')` / `registerAs('rabbitmq')` / `registerAs('database')` (same pattern as above).
- `libs/shared/src/infrastructure/config/env.validation.ts` — composes the schemas into `envSchema` and exposes `validateEnv`; wired via `ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })` in `SharedModule`.

**Fail-fast at bootstrap:** a BC's `registerAs` factory runs when an infra provider reads its namespace (e.g. `BcryptPasswordHasher` reads `config.getOrThrow('auth.bcrypt.rounds')` in its constructor). That is how per-BC validation is guaranteed at startup.

**Env files:** `.env` is gitignored; keep `.env.example` in sync and free of real secrets.

## 6. Dependency injection

- Define **abstract interfaces/tokens in `domain/`**, implement them in `infrastructure/`, bind with `useClass`.

  ```ts
  // domain/services/password-hasher.service.ts
  export const PASSWORD_HASHER_SERVICE = Symbol('PASSWORD_HASHER_SERVICE');

  // infrastructure/password-hasher/bcrypt-password-hasher.ts
  export class BcryptPasswordHasher implements PasswordHasherService { … }

  // auth.module.ts
  providers: [{ provide: PASSWORD_HASHER_SERVICE, useClass: BcryptPasswordHasher }]
  ```

- **Repositories** follow the same shape: repository interface/token in `domain/repository/`, TypeORM adapter in `infrastructure/persistence/typeorm/`, bound with `useClass` (`AuthCredentialRepository` → `TypeormAuthCredentialRepository`).
- Controllers → use cases → domain/application logic. Keep adapters out of `application/` and `domain/`.

## 7. Persistence (TypeORM)

The PostgreSQL data source is owned by `SharedModule` and configured **once**:

- `TypeOrmModule.forRootAsync` lives in `libs/shared/src/shared.module.ts` (it is `@Global()`), reading the `database` config namespace (`databaseEnvSchema` → `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_MIGRATIONS_RUN`). **Do not** register it in `src/app.module.ts` — that module only imports BC modules.
- Entities are registered per BC via `TypeOrmModule.forFeature([...])` (works with `autoLoadEntities: true`).

**Schema** is managed with **migrations**, not sync (`synchronize: false` in the data source — there is no `DB_SYNCHRONIZE` env):

- Migrations live in `libs/shared/src/infrastructure/persistence/typeorm/migrations/` (one `class …Migration implements MigrationInterface` per file, pure `queryRunner.query` SQL) and are **registered in the barrel** `…/typeorm/migrations/index.ts`, which both `SharedModule.forRootAsync` and the CLI `data-source.ts` import:
  - They are passed as **classes**, not as a file glob: TypeORM instantiates them (`ConnectionMetadataBuilder.buildMigrations`) and derives each timestamp from the trailing digits of the class name, so execution order matches the filename. Being real imports, webpack inlines them into the bundle — which is why a `*.{ts,js}` glob does not work: inside the bundle `__dirname` is `dist/` and no migration file is ever emitted there, so TypeORM silently matches nothing.
  - **A newly generated migration must be added to `migrations/index.ts`** or neither the app nor the CLI will see it.
- The CLI is the single source of truth for schema changes and must run **inside the `api` container** (the `.env` points `DB_HOST=postgres` at compose service names, resolvable only inside the compose network):
  ```bash
  docker compose exec api npm run migration:generate            # auto-names <timestamp>-migration.ts
  docker compose exec api npm run migration:generate -- <name>  # e.g. -- create-users → <timestamp>-create-users.ts
  docker compose exec api npm run migration:run                 # apply pending
  docker compose exec api npm run migration:revert              # undo the last one
  ```
  - `migration:generate` diffs the live DB against the entities and writes `<timestamp>-<name>.ts` (class `PascalCase(name) + timestamp`). It **exits non-zero with “No changes in database schema were found”** when the schema is already in sync — that is expected, not an error. Migrations must reflect **TypeORM-native DDL** (e.g. `CONSTRAINT "UQ_…" UNIQUE ("email")` for a `@Column({ unique: true })`, not a standalone `CREATE UNIQUE INDEX`) or every generate run will emit a spurious diff.
  - Files land on the host through the bind mounts (`libs/` and `scripts/`), so a freshly generated migration is immediately visible in the repo — register its class in `migrations/index.ts` before running `migration:run`.
- `DB_MIGRATIONS_RUN=true` makes the app run pending migrations automatically at bootstrap (`migrationsRun` in `forRootAsync`, using the same `migrations` array). The migration classes are part of the code, so this behaves identically under ts-node (e2e), under the webpack dev bundle and in the production image.

Per aggregate, three files under `src/<bc>/infrastructure/persistence/typeorm/`:

- `<aggregate>.entity.ts` — the TypeORM entity (`@Entity('users')`): explicit column `type`s, UUID primary key, snake_case DB names via `name:` when they differ from the property.
- `typeorm-<aggregate>.mapper.ts` — pure mapping domain ⇄ entity: `toEntity(user)` fills a fresh `UserEntity`; `toDomain(entity)` rehydrates the aggregate with its value objects (via their constructors). No decorators here.
- `typeorm-<aggregate>.repository.ts` — implements the domain repository interface (interface + token in `domain/repository/`), injected with `Repository<UserEntity>` (`@InjectRepository`) plus the mapper, and bound with `useClass` in the BC module providers.

Timestamps are UTC: use **`timestamptz`** columns (not naive `datetime`) so TypeORM round-trips real JS `Date`s for the `UserCreatedAt`/`UserUpdatedAt` value objects.

## 8. Exception hierarchy

Use **custom exceptions that extend the shared base classes** whenever possible, instead of throwing raw `Error`:

- **`DomainException`** — `@shared/domain/exceptions/domain-exception`; domain invariants (e.g. `InvalidEmail`, `InvalidIdentifier`, `InvalidPassword`).
- **`ApplicationException`** — `@shared/application/exceptions/application-exception`; use-case/application-level failures.
- **`InfrastructureException`** — `@shared/infrastructure/exceptions/infrastructure-exception`; adapter/infra failures (e.g. `RabbitMQConnectionFailedException`, `RabbitMQNotConnectedException`).

Guidelines:

- Keep the base classes in `libs/shared/src/{domain,application,infrastructure}/exceptions/`. Do not import a BC from shared.
- Define each custom exception **next to what raises it**, in the matching layer folder: BC-domain exceptions under `src/<bc>/domain/exceptions/`, domain shared ones under `libs/shared/src/domain/exceptions/`, infra ones alongside their adapter (e.g. `rabbitmq/exceptions/`).
- Set `this.name` to the class name and write descriptive messages (framework base classes already follow this; match them).
- Prefer one exception class per violated invariant (`InvalidUserAddressStreet`, `InvalidUserAddressCity`, …) over a single parameterized exception.

**HTTP transport** — every error surfaces as a uniform `HttpError` body (`{ path, status, message, timestamp }`, where `timestamp` is a `Date` serialized as ISO-8601), produced by the global `GlobalHttpExceptionHandler` (`libs/shared/src/infrastructure/http/filters/`, bound via `APP_FILTER` in `app.module.ts`). The filter is `@Catch(Error)`, so only `Error` instances reach it. Mapping rules:

- A Nest `HttpException` **keeps its own status** (`getStatus()`); no mapping is applied.
- Subclasses of `DomainException` → **400**, `ApplicationException` → **409**, `InfrastructureException` → **503**, resolved by `HTTP_ERROR_CODES` (`libs/shared/src/infrastructure/http/http-error-codes.ts`), a `ReadonlyMap<ExceptionClass, HttpStatus>` checked with `instanceof` (concrete exceptions registered first, then the base classes).
- Anything else (a raw `Error`) → **500**.

## 9. RabbitMQ & domain events

- **Event model:** extend `DomainEvent` from `@shared/domain/events/domain-event` (`aggregateId`, `body`, `eventId`, `occurredOn`, plus abstract `eventName(): string`). Keep events in `domain/events/` of the owning BC.
- **Wire format** (topic exchange, event name as routing key):

  ```json
  { "aggregateId": "…", "body": { … }, "eventId": "…", "occurredOn": "2026-09-25T…Z" }
  ```

  Produced by `RabbitmqDomainEventSerializer.toMessage`, consumed by `RabbitmqDomainEventDeserializer.fromMessage`.
- **Publishing:** inject `DOMAIN_EVENT_PUBLISHER` and call `publish(events)`.
- **Consuming:** decorate a handler with `@DomainEventConsumer({ eventName, eventClass, queue, exchange? })` (the decorator lives in shared infrastructure, `libs/shared/src/infrastructure/rabbitmq/domain-event-consumer.ts`, next to the registrar that reads it). `RabbitmqDomainEventConsumerRegistrar` discovers those providers, registers the handler in `DomainEventDispatcher`, and binds the queue on bootstrap.
  - **Placement:** consumers are driven adapters — they live in `infrastructure/` (e.g. `infrastructure/rabbitmq/<name>.consumer.ts`), never in `application/`.
  - **Naming:** `<UseCase>On<Event>` for the class (e.g. `UpdateAuthCredentialRolesOnUserRolesUpdated`) and the same name in snake_case for the queue (e.g. `update_auth_credential_roles_on_user_roles_updated`).
  - **Thin handlers:** the consumer maps the event to an application use case and delegates (`new UpdateAuthCredentialRolesRequest(aggregateId)` → `useCase.execute(...)`); all business logic lives in the use case, which is unit-tested on its own.
  - **Projections:** a BC may keep a read-only copy of another BC's data (e.g. roles in `AuthCredential`) and sync it exclusively through domain events. The consumer re-reads the source aggregate by `aggregateId` instead of trusting the event `body`.
- A live RabbitMQ instance is needed to actually publish/consume; the app can boot without it.

## 10. OpenAPI (Swagger)

The API exposes an OpenAPI document and UI via `@nestjs/swagger` v12.

- **Mount:** `SwaggerModule.setup('docs', app, document)` inline in `src/main.ts` (built with `DocumentBuilder`). UI at `http://localhost:3000/docs`, raw JSON at `/docs-json`. Do not split it into a separate file.
- **Document every endpoint** with manual decorators (no CLI plugin):
  - **Controllers:** `@ApiTags('Auth')` (BC name, capitalized) + `@ApiOperation({ summary, description? })` + response decorators (`@ApiCreatedResponse`, `@ApiBadRequestResponse`, `@ApiOkResponse`, …).
  - **DTOs are layer-scoped**: transport DTOs (HTTP body) live in `infrastructure/http/dto/` and carry the Swagger decorators (`@ApiProperty`, class properties `readonly foo!: string`); application DTOs (`application/dto/`) are the use-case inputs — plain types/value objects, **no Swagger decorators**.
  - **CQRS commands** that mutate return `Promise<void>`: document the empty response, e.g. `@ApiCreatedResponse({ description: 'User created' })`.
- Version placeholder from `package.json`; keep title/description meaningful.
- New BCs: annotate their controller(s) and DTOs (see checklist §13).

## 11. Testing

Tests live under `tests/`, split by scope:

- **Unit tests:** `tests/unit/**/*.spec.ts` (vitest, aliases resolved via `vite-tsconfig-paths`, config in `vitest.config.ts`). Mirror the source path under `tests/unit/` (e.g. `tests/unit/src/auth/…`). Mock external I/O; prefer exercising pure functions/usecases.
- **E2E tests:** `tests/e2e/` with **Cucumber** (`@cucumber/cucumber`) + **Testcontainers** + supertest:
  - Gherkin features in `tests/e2e/features/`, step definitions in `tests/e2e/step_definitions/`, bootstrap in `tests/e2e/support/` (`context.ts` starts PostgreSQL + RabbitMQ containers and boots the real Nest app in-process; `hooks.ts` truncates `users` between scenarios).
  - `DB_MIGRATIONS_RUN=true` builds the schema from migrations; no `synchronize`. ts-node loads the barrel and the real `.ts` migration classes in place.
  - `cucumber.js` runs the `.ts` sources **in place** — `requireModule: ['ts-node/register', 'tsconfig-paths/register']` plus `require` on the `tests/e2e/**/*.ts` globs. `npm run test:e2e` is therefore just `cucumber-js`: no precompile, no `dist-e2e/`, no `tsconfig.e2e.json`, and always the current working tree. Two rules follow: load support/step files with `require`, never `import` (both hooks are CommonJS-only and `import` would bypass them); and never swap ts-node for tsx/esbuild — only tsc honours `emitDecoratorMetadata`, and without the resulting `design:paramtypes` Nest DI injects `undefined` and `NestFactory.create` aborts with `process.exit(1)` and no output. ts-node type-checks as it goes (no `TS_NODE_TRANSPILE_ONLY`) and reads `tsconfig.json`, so run `npx tsc --noEmit` before pushing e2e changes.
- Run with `npm test` (unit) / `npm run test:e2e` (cucumber + testcontainers) / `npm run test:cov` (unit coverage).

## 12. Commits

- Conventional Commits, lowercase, repo style:

  ```
  feat(auth): …
  refactor(config): …
  chore: …
  test: …
  build(deps): …
  ```

- **One concern per commit.** Run `git status`, `git diff`, `git log --oneline -10` before staging; stage only intended files; never commit `.env`.
- Push only when explicitly asked.

## 13. Adding a new BC checklist

1. Scaffold `src/<bc>/{application,domain,infrastructure}` with `domain/repository`, `domain/services`, `domain/value-objects`, `infrastructure/http/controllers`, `infrastructure/persistence/typeorm`.
2. Add the path alias `@<bc>/*` in `tsconfig.json` `paths`.
3. Create `infrastructure/config/env-schema.ts` + `infrastructure/config/<bc>.config.ts` following §5, and register `ConfigModule.forFeature(<bc>Config)` in the module.
4. Ensure at least one infra provider reads the BC config namespace so validation fails fast at bootstrap.
5. Register its entities with `TypeOrmModule.forFeature([...])` in the BC module (see §7).
6. Wire the BC in `src/app.module.ts`.
7. Annotate controllers + DTOs with Swagger decorators (`@ApiTags`, `@ApiOperation`, responses, `@ApiProperty`).
8. Verify with `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run build`.