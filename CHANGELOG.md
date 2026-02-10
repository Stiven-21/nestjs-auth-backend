# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.4.0](https://github.com/Stiven-21/nestjs-auth-backend/compare/v0.2.0-nestjs-auth-backend-beta...v0.4.0) (2026-02-10)


### 🚀 Features

* add 2FA backup codes ([a2321d5](https://github.com/Stiven-21/nestjs-auth-backend/commit/a2321d50b750e9982ae054c874d7c03023eb063e))
* **audit-log:** initialize entity for critical event logging ([84a2630](https://github.com/Stiven-21/nestjs-auth-backend/commit/84a26301fddfd4a2890ab98cdba8c478b1b507c8))
* **auth:** add session management with rotatable refresh tokens and logout support ([b32b0e5](https://github.com/Stiven-21/nestjs-auth-backend/commit/b32b0e58ac0490c912770e055436ed5f3bf45b64))
* **auth:** fix reauth bugs and update [@auth](https://github.com/auth)() decorator to support reauth: true ([68b38ae](https://github.com/Stiven-21/nestjs-auth-backend/commit/68b38ae9a575c32005804a4e54c5394e494ebd0e))
* **auth:** full password reset an re-authentication required for critical actiond - password change ([13b188a](https://github.com/Stiven-21/nestjs-auth-backend/commit/13b188ad47eb10b8681752158a34833b4229bcd5))
* **auth:** implement auth_session and auth_refresh_token tables\n\n- auth_session stores user devices to allow revoking specific sessions\n- auth_refresh_token revokes refresh tokens when a token is refreshed ([8c22207](https://github.com/Stiven-21/nestjs-auth-backend/commit/8c22207ce896930ca1549f5ae40b0e38339d1c52))
* **auth:** release v0.3.0 security & sessions hardening ([c8df370](https://github.com/Stiven-21/nestjs-auth-backend/commit/c8df370c49555ae7ae7d268bc413ea5966729fde))
* **auth:** release v0.3.0 security & sessions hardening ([2199a28](https://github.com/Stiven-21/nestjs-auth-backend/commit/2199a28683accfcb55a246ca6cddeed9c5c7501c))
* **auth:** release v0.3.0 security & sessions hardening ([87b10ff](https://github.com/Stiven-21/nestjs-auth-backend/commit/87b10ff87cb795303c7d9da84a5f36d556bde9e8))
* initial implementation of security and session management ([6e1fdab](https://github.com/Stiven-21/nestjs-auth-backend/commit/6e1fdab15bb3b1d10dc6cd746ff926570054d75d))
* **oauth:** implement login, registration and account linking flows ([db57949](https://github.com/Stiven-21/nestjs-auth-backend/commit/db579497e754b06df47f2f132a26c7851ca84fc7))
* **oauth:** link accounts with different emails and support oauth account deletion ([7e07e12](https://github.com/Stiven-21/nestjs-auth-backend/commit/7e07e127b3af00e4a15027785a03b3b27707f9bd))
* **oauth:** oauth improvements and first steps to link accounts with multiple emails ([86695b3](https://github.com/Stiven-21/nestjs-auth-backend/commit/86695b3eae59df4a896bb59e1c4bc1997eefa1a9))
* **security:** add 2FA with TOTP, initial OTP support, account enable/disable, and recovery codes ([924043a](https://github.com/Stiven-21/nestjs-auth-backend/commit/924043a2e01e336153aff9a5f8a7d483ab77f63d))
* **security:** enable OTP two-factor authentication ([2892a75](https://github.com/Stiven-21/nestjs-auth-backend/commit/2892a7536ba1fec5e532555a1e40bbf2b998558d))
* **security:** implement audit logs for critical events - log successful and failed login attempts and 2FA enable/disable events ([d2377eb](https://github.com/Stiven-21/nestjs-auth-backend/commit/d2377eba904e953fc6e2cd5c02a3451796a964a0))
* **user:** enforce email authorization prior to email update ([926db29](https://github.com/Stiven-21/nestjs-auth-backend/commit/926db29e5a468e92b5d0a2edcc9050955ca6fcdf))
* **v0.4.0:** advanced authorization and auditing ([394fbdf](https://github.com/Stiven-21/nestjs-auth-backend/commit/394fbdf0ae9131ff89ba285c552d7b01f73e63be))


### 📚 Documentation

* **roadmap:** v0.5.0 checked ([b3ed341](https://github.com/Stiven-21/nestjs-auth-backend/commit/b3ed341b825b235d95fa56bf9fc610097d9b75b5))

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
