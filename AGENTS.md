# AGENTS.md

## Tech stack

- NestJS 12 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`) on Node.js, TypeScript (strict, ES2023)
- ESM project (`"type": "module"`, `module: nodenext`): relative imports **must** end in `.js` (e.g. `import { AppService } from './app.service.js'`)
- Decorators with `emitDecoratorMetadata` and `experimentalDecorators`; `reflect-metadata` and `rxjs` are core deps
- Tests: Vitest + supertest (unit and integration; no e2e). Lint: oxlint (type-aware). Format: Prettier
- Observability: NestJS Observe (see below)

## Commands

- `npm run start:dev`: run with watch
- `npm run build`: `nest build`
- `npm run lint`: oxlint, type-aware, on `src/`
- `npm run format`: Prettier on `src/`
- `npm test`: unit tests (`*.spec.ts` in `src/`)

Run lint and tests before finishing a task.

## Conventions

Follow the official NestJS conventions and documentation strictly. When unsure, do what the NestJS docs and `nest generate` schematics do.

- **Structure**: feature modules under `src/<feature>/`, one folder per feature, each with its own `<feature>.module.ts`, `.controller.ts`, `.service.ts`, `dto/`, and `entities/`. Import feature modules into `AppModule`. Prefer `nest g resource <name>` / `nest g module|controller|service` over hand-writing boilerplate.
- **File naming**: kebab-case with a role suffix: `create-user.dto.ts`, `users.service.ts`, `users.controller.ts`, `roles.guard.ts`, `logging.interceptor.ts`, `parse-id.pipe.ts`, `all-exceptions.filter.ts`. Classes are PascalCase with the same suffix (`UsersService`).
- **Controllers** only handle HTTP: routing, params, status codes, and delegating to services. No business logic.
- **Providers/services** hold business logic and are `@Injectable()`. Use constructor injection; never instantiate providers with `new`.
- **DTOs** are classes (not interfaces) so they survive at runtime for validation. Use `class-validator` / `class-transformer` with a global `ValidationPipe` (`whitelist: true`, `transform: true`) when validation is added.
- **Cross-cutting concerns** use the Nest building blocks: guards (authz), pipes (validation/transform), interceptors (logging/mapping), exception filters (error shaping). Throw built-in HTTP exceptions (`NotFoundException`, `BadRequestException`, ...) from services, not raw `Error` or manual `res.status()`.
- **Configuration** goes through `@nestjs/config` (`ConfigModule`/`ConfigService`), not scattered `process.env` reads, once it is added. Never commit `.env`.
- **Modules**: export only what other modules need; use `forwardRef` only as a last resort. Avoid circular dependencies.
- **Logging** via Nest's `Logger`, not `console.log`.
- **Async**: always `await` or return promises (`typescript/no-floating-promises` is an error).
- **Style**: Prettier (single quotes, trailing commas). Avoid `any` where a real type is easy, though the lint rule is off.

## Testing

- Unit tests sit next to the code as `<name>.spec.ts` and use `Test.createTestingModule` from `@nestjs/testing`. Mock dependencies via providers (`useValue`/`useFactory`).
- Integration tests sit next to the code as `<name>.integration.spec.ts` and use supertest against an `INestApplication` built from the feature module, with external dependencies (e.g. the database) overridden.
- Every new controller/service gets a unit spec; every new endpoint gets an integration test.

## Production data: NestJS Observe

This app reports its traces, errors, logs and metrics to [NestJS Observe](https://observe.nestjs.com) through `ObserveModule` in `src/app.module.ts`. Its key pair comes from `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in `.env`, which `npx @nestjs/observe link` writes.

When a task depends on how the app behaves in production - an error users hit, a slow endpoint, a failing job, whether a release made things worse - work from that data, not from the code alone:

- The Observe MCP server answers those questions directly: errors with their traces and logs, slow operations, jobs, and what a release changed (`find_regressions`, `diff_release`). It is included on the Pro plan and above. In Claude Code: `claude mcp add observe --transport http https://observe-api.nestjs.com/mcp`, and the client opens a browser to approve. Other clients: https://www.observe.nestjs.com/documentation/mcp
- Without it, the user can open the request or error in the Observe dashboard and click **Copy agent prompt**, which hands over that page's trace, stack and logs as text.
