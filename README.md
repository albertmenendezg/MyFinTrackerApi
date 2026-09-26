# MyFinTracker API

Personal finance backend built with [NestJS](https://nestjs.com) (Node.js + TypeScript), organized following **Domain-Driven Design (DDD)** principles split into **bounded contexts**, backed by a shared infrastructure library (`libs/shared`).

## Stack

- **Framework:** NestJS 12
- **Language:** TypeScript 6 (strict, CommonJS)
- **Validation & config:** zod 4 + `@nestjs/config`
- **Messaging:** RabbitMQ (`amqplib`) with domain-event publishing/consuming
- **Persistence:** TypeORM + PostgreSQL (schema via **migrations**)
- **Security:** bcrypt password hashing
- **Testing:** vitest (unit, `tests/unit`) + Cucumber/Testcontainers/supertest (e2e, `tests/e2e`)
- **Lint/format:** ESLint (flat config) + Prettier
- **Build:** `nest build` (webpack)

## Architecture

The application is composed of **bounded contexts** (BCs) under `src/`, each self-contained with a DDD layering:

```
src/<bc>/
├── application/          # use cases, DTOs, application events
├── domain/               # entities, value objects, repository/service interfaces, domain events
└── infrastructure/       # config, HTTP controllers, adapter implementations (repos, hashers)
```

Shared, reusable building blocks live in the `libs/shared` library:

```
libs/shared/src/
├── application/events/     # domain event dispatcher + consumer decorator
├── domain/                 # aggregate root, domain events, value objects
└── infrastructure/
    ├── config/             # env schemas & shared config (app, rabbitmq, database)
    ├── persistence/        # typeorm data source + migrations
    └── rabbitmq/           # client, publisher, serializer/deserializer, consumer registrar
```

### Bounded contexts

| BC     | Responsibility                        |
|--------|---------------------------------------|
| `auth` | User registration, password hashing   |

Bounded contexts are added as the domain grows; `src/auth/` is the reference to mimic.

### Configuration

Environment variables follow a **per-BC responsibility** model:

- **Shared infrastructure envs** (`APP_PORT`, `RABBITMQ_*`, `DB_*`) are validated globally at startup by `SharedModule` via `env.validation.ts`.
- **Each BC owns its env schema** (`env-schema.ts`) and validates it inside its own `registerAs` config factory, failing fast at bootstrap the moment an infrastructure provider reads its config namespace.

See [CONVENTIONS.md](./CONVENTIONS.md) for the full config pattern.

### Messaging (RabbitMQ)

Domain events are published to a topic exchange and consumed by BCs:

- Events extend `DomainEvent` (`aggregateId`, `body`, `eventId`, `occurredOn`, `eventName()`).
- `RabbitmqDomainEventSerializer` / `RabbitmqDomainEventDeserializer` define the wire format `{ aggregateId, body, eventId, occurredOn }` (with `occurredOn` as an ISO string).
- Consumers are discovered by the `@DomainEventConsumer(...)` decorator and wired to RabbitMQ queues by `RabbitmqDomainEventConsumerRegistrar` on application bootstrap.
- The event name is used as the routing key; the client connects eagerly at bootstrap, so a live RabbitMQ instance is required to start the app and for publishing/consuming.

## Getting started

Requirements: **Node.js ≥ 24**, npm.

```bash
npm install
cp .env.example .env   # adjust values
```

## Scripts

| Command              | Description                          |
|----------------------|--------------------------------------|
| `npm run start`      | Start the application                |
| `npm run start:dev`  | Start in watch mode                  |
| `npm run start:prod` | Run the compiled build               |
| `npm run build`      | Compile with `nest build` (webpack)  |
| `npm run lint`       | ESLint over `src/`, `libs/`, `tests/` |
| `npm run format`     | Prettier over `src/`, `libs/`, `tests/` |
| `npm test`           | Run unit tests (vitest, `tests/unit`) |
| `npm run test:e2e`   | Run e2e tests (Cucumber + Testcontainers) |
| `npm run test:cov`   | Run unit tests with coverage         |
| `npm run migration:run` | Apply pending DB migrations (run inside the `api` container) |
| `npm run migration:revert` | Revert the last migration (run inside the `api` container) |
| `npm run migration:generate` | Generate a migration from entities; auto-named (`-- <name>` optional) |

Use `npx tsc --noEmit` for a type-only check.

## Run with Docker (development)

```bash
cp .env.example .env   # required by docker compose
docker compose up -d --build                  # API (development stage) + RabbitMQ + PostgreSQL
```

- API (OpenAPI UI): <http://localhost:3000/docs> (from `APP_PORT` in `.env`)
- RabbitMQ management: <http://localhost:15672> (`guest` / `guest`)
- PostgreSQL: <http://localhost:5432> (port from `DB_PORT` in `.env`)

`.env` is the single source of dev values: the `api` service consumes it verbatim (`env_file`, no `environment` overrides); the `postgres` service sets its `POSTGRES_*` credentials in plain text. Keep the service names (`DB_HOST=postgres`, `RABBITMQ_URL=amqp://rabbitmq:5672`) when running via compose, and set them to `localhost` when running the API from your host.

The `api` service builds the Dockerfile `development` stage (`nest start --watch`), bind-mounting `src/`, `libs/`, `scripts/`, `package.json` and `package-lock.json` for hot reload. It reads the project `.env` (`env_file`, required) and connects eagerly to the broker and the database; it waits for `rabbitmq` and `postgres` to be healthy (`depends_on`). The development stage runs as the image `node` user (`UID 1000`), so files it creates inside a bind mount (e.g. generated migrations) land with your host user's ownership. Stop everything with `docker compose down` (add `-v` to drop the PostgreSQL and RabbitMQ data volumes).

### Database migrations

The schema comes from **migrations** in `libs/shared/src/infrastructure/persistence/typeorm/migrations/`, auto-detected by a TypeORM glob (no manual registration). They are driven through the `typeorm` CLI, which must run **inside the `api` container** (`.env` targets the compose service names, only reachable in the compose network):

```bash
docker compose exec api npm run migration:generate            # auto-names <timestamp>-migration.ts
docker compose exec api npm run migration:generate -- <name>  # e.g. -- create-transactions
docker compose exec api npm run migration:run                 # apply pending
docker compose exec api npm run migration:revert              # undo the last one
```

`migration:generate` diffs the live DB against the entities and prints “No changes in database schema were found” (non-zero exit) when nothing drifted — that is expected. Generated files appear on your host right away through the `libs/` bind mount, ready to review. Note the dev webpack bundle does **not** run migrations at bootstrap, so use the CLI, not `DB_MIGRATIONS_RUN`, to evolve the schema in dev. See [CONVENTIONS.md §7](./CONVENTIONS.md) for details.

For a production image use the `runtime` stage:

```bash
docker build --target runtime -t my-fintracker-api:prod .
```

## Endpoints

OpenAPI docs are served at `/docs` (JSON at `/docs-json`). Current surface:

| Method | Path              | BC   | Description            |
|--------|-------------------|------|------------------------|
| POST   | `/auth/register`  | auth | Register a new user    |

## Environment variables

| Variable                  | Required | Default | Validated | Description                     |
|---------------------------|----------|---------|-----------|---------------------------------|
| `APP_PORT`                | no       | `3000`  | 1–65535   | HTTP listening port            |
| `BCRYPT_ROUNDS`           | no       | `10`    | 4–31      | bcrypt cost for auth hashing    |
| `RABBITMQ_URL`            | yes      | –       | non-empty | RabbitMQ AMQP connection URL    |
| `RABBITMQ_EXCHANGE_NAME`  | yes      | –       | non-empty | Topic exchange name             |
| `RABBITMQ_EXCHANGE_TYPE`  | yes      | –       | non-empty | Exchange type (e.g. `topic`)    |
| `DB_HOST`                 | no       | `localhost` | non-empty | PostgreSQL host             |
| `DB_PORT`                 | no       | `5432`  | 1–65535   | PostgreSQL port (container side)  |
| `DB_USER`                 | yes      | –       | non-empty | PostgreSQL user                  |
| `DB_PASSWORD`             | yes      | –       | non-empty | PostgreSQL password              |
| `DB_NAME`                 | yes      | –       | non-empty | Database name                    |
| `DB_MIGRATIONS_RUN`       | no       | `false` | `true`/`false` | Run pending migrations at bootstrap |

`.env` is gitignored; commit only `.env.example`.

## Contributing

Agents and contributors should read [AGENTS.md](./AGENTS.md) (working conventions) and [CONVENTIONS.md](./CONVENTIONS.md) (detailed conventions and patterns).