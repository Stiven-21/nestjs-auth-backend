# Architecture

## Summary

This repository contains the backend implementation of an authentication and user management service built with NestJS and TypeScript. The codebase is organized into clear modules with separation between the API layer, application logic, domain model and infrastructure. The main implementation root is `backend/src`.

## Architectural Goals

- Prioritize security (credential hashing, secure handling of secrets).
- Maintain separation of concerns across layers.
- Enable extensibility via modules and strategies (OAuth, 2FA).
- Support scalable deployments and stateless API design.

## High-level Layered View

```
┌────────────────────────────┐
│        Client Layer        │
│  (Web / Mobile / API Users)│
└──────────────┬─────────────┘
               │
┌──────────────▼─────────────┐
│        API Layer           │
│  Controllers in modules/*  │
└──────────────┬─────────────┘
               │
┌──────────────▼─────────────┐
│    Application Layer       │
│  Services / Use Cases      │
└──────────────┬─────────────┘
               │
┌──────────────▼─────────────┐
│       Domain Layer         │
│  Entities / DTOs / Repos   │
└──────────────┬─────────────┘
               │
┌──────────────▼─────────────┐
│    Infrastructure Layer    │
│  Config / Mail / I18n / ORM│
└────────────────────────────┘
```

## Main Components and Locations

- **Domain modules**: `src/modules/auth`, `src/modules/users`, `src/modules/roles` — controllers, services, DTOs and entities live per-module.
- **Internationalization (i18n)**: translations under `src/i18n/locales`, generated resources in `src/common/generated/i18n.generated.ts`, and middleware at `src/middlewares/i18n.middleware.ts`.
- **Mailing**: `src/mails/mail.module.ts`, `src/mails/mail.service.ts`, and templates in `src/mails/templates/`.
- **OAuth configuration**: `src/config/google-oauth.config.ts`, `src/config/facebook-oauth.config.ts`, `src/config/github-oauth.config.ts`.
- **Common utilities**: `src/common` contains enums, exception handlers (`src/common/exceptions`), helpers, interfaces and utilities like `typeorm.utils.ts`.
- **Shared providers**: `src/providers/language.provider.ts` and modules in `src/shared`.
- **Dynamic query service**: `src/common/services/query/dynamic.service.ts` and related DTOs.
- **Project scripts and config**: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `tsconfig.build.json`, and Husky hooks in the repository root.

## Core Domains and Responsibilities

- **User and identity management** (`src/modules/users`): user entities, credential handling, email change audit, session and token management.
- **Authentication** (`src/modules/auth`): login flows, credential validation, token issuance, and strategy/guard implementations located in `strategies/` and `guards/`.
- **Authorization** (`src/modules/roles` and service logic): role and permission evaluation to control access to endpoints and operations.
- **MFA / 2FA**: challenge and verification flows supported; related enums are defined in `src/common/enum` (e.g. `two-factor-type.enum.ts`).
- **Security & compliance**: centralized error handling (`src/common/exceptions`), standardized response construction (`response.factory.ts`) and validation settings (`src/config/validation.config.ts`).

## Data Modeling and Persistence

- Entities are colocated in each module under `src/modules/*/entities`.
- Observed practices: secrets are not stored in plaintext, credentials are hashed, and soft deletes are used where applicable.
- TypeORM integration helpers are available under `src/common/utils/typeorm.utils.ts`.

## Authentication Flow (summary)

1. Client sends a request to a controller in `src/modules/auth`.
2. Credentials are validated and security checks (rate limits, brute-force protections) are applied.
3. If enabled, a MFA challenge flow is executed.
4. Tokens or session records are issued and a standardized response is returned.

## External Integrations and Infrastructure

- **OAuth providers**: configured in `src/config/*-oauth.config.ts`.
- **Email**: templates and mail service under `src/mails`.
- **Internationalization**: resources kept in `src/i18n/locales` and generated artifacts under `src/common/generated`.

## Observability and Error Handling

- Centralized error handling and response shaping in `src/common/exceptions` and `response.factory.ts`.
- i18n-aware messages for errors and successes via generated resources.

## Quality, CI and Development

- End-to-end tests: `test/jest-e2e.json` and `test/app.e2e-spec.ts`.
- CI workflows in `.github/workflows` (`node.js.yml`, `release.yml`).
- Husky hooks enforce commit quality locally.

## Operational Considerations

- Environment variables in the project root (`.env`) configure database connections and external providers.
- The API is designed to be stateless; sessions/tokens may be persisted externally depending on deployment.

## Note

This document reflects the current implementation under `backend/src` and the main conventions and responsibilities observed in the codebase.
