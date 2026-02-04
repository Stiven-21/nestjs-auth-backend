# Changelog

Professional change log and release notes for **NEST AUTH**.

This project follows **Semantic Versioning (SemVer)**.  
`beta` versions may include internal changes without prior notice.

---

## [v0.4.0] — Advanced Authorization & Auditing

📅 2026-02-04

## Summary

This release introduces **fine-grained authorization** along with **auditing and critical security event logging**, laying the foundation for traceability, compliance, and advanced monitoring.

## Added

### Advanced authorization

- Fine-grained guards for action-level permission control (specific CRUD operations).
- Clear separation between roles and permissions.
- Dynamic permission evaluation per resource and action.

### Auditing & critical events

- Security-critical event logging:
  - `LOGIN_SUCCESS`
  - `LOGIN_FAILED`
  - `PASSWORD_CHANGED`
  - `2FA_ENABLED / 2FA_DISABLED`
  - `REFRESH_TOKEN_REVOKED`
- Audit trail for role and permission changes.
- Persistent event storage for later analysis and monitoring.

## Changes

- Authorization logic refactored for improved extensibility.
- Architecture prepared for integration with external logging or SIEM systems.
- Clearer separation of responsibilities between guards, services, and audit layers.

## Technical notes

- The audit system is designed to evolve (alerts, webhooks, dashboards).
- Define log retention policies according to the environment (development vs production).

---

## [v0.3.0] — Account Security & Sessions

📅 2026-02-01

## Summary

This release focuses on **advanced account security**, introducing **MFA**, **session management**, and **hardening against common attack vectors**.

## Added

### 2FA / MFA

- TOTP (Google Authenticator / Authy).
- Verification codes via email and SMS.
- Enable / disable per user.
- Backup codes.

### Session & refresh token management

- Dedicated database table for sessions / refresh tokens.
- Rotatable and revocable refresh tokens.
- Logout per device.
- Global logout (revoke all active refresh tokens).

### Hardening

- Rate limiting for:
  - Login
  - Password reset
  - 2FA flows
- Brute-force attack protection.
- Configurable password policies.

## Changes

- Authentication flow refactored to support multiple active sessions.
- Clear separation between authentication, session handling, and security layers.
- Improved refresh token lifecycle management.

## Technical notes

- Rate limiting should ideally be combined with external layers (NGINX, Cloudflare).
- Password policies can be hardened per environment.

---

## [v0.2.0-beta] — OAuth & Standardization

📅 2026-01-15

## Summary

Beta release introducing **OAuth authentication providers**, explicit credential model separation, and **standardized API responses with i18n support**.

## Added

- OAuth support for:
  - Google
  - Facebook
  - GitHub
- OAuth strategies, guards, and callback endpoints.
- Authentication method entities:
  - Local credentials
  - OAuth-linked accounts
- Automatic account linking when provider email matches an existing user.
- Environment-based configuration for OAuth providers.

## Changes

- Standardized API responses and errors via `ResponseFactory`.
- Integrated `nestjs-i18n` for localized messages.
- Improved and restructured documentation.
- Package version updated to `0.2.0-beta`.

## Fixes & refinements

- Dependency and configuration adjustments for OAuth strategies.
- Minor documentation and example fixes.

## Technical notes

- `synchronize: true` is enabled in TypeORM (disable in production).
- Permissive typing (`any`) in OAuth strategies — stricter typing recommended.
- Some service flows may not return explicit HTTP responses in all cases.

---

## [v0.1.0-beta] — Credentials Foundation

📅 Initial release

## Summary

Initial beta release establishing the **core authentication system**.

## Core features

- Local authentication: registration and login.
- Refresh token and password reset flows.
- Basic user, role, and permission management.
- Email delivery via `@nestjs-modules/mailer` with Handlebars templates.
- Internationalization (`en`, `es`) using `nestjs-i18n`.
- Persistence with TypeORM and PostgreSQL.
- Global validation and Swagger documentation.

## Final notes

This release marks the foundation of the project as a **reusable authentication service**.  
Not recommended for production use without additional security review.

---
