# 🔐 NEST AUTH — Version Roadmap

This roadmap outlines the planned evolution of **NEST AUTH**, a robust, reusable authentication backend designed as a standalone service for integration into other projects.

---

## ✅ v0.1.0-beta — Credentials Base

- Register / login with credentials
- i18n configuration
- Mailer (verification and basic notification emails)
- Password reset with token and expiration
- Basic roles and permissions (create, edit, delete users with super admin)
- Permission guards (NestJS)
- Initial documentation (Swagger)

---

## ✅ v0.2.0 — OAuth + Permissions Improvements

- OAuth login / registration (Google, Facebook, GitHub)
- Linking OAuth accounts to existing users (same email)
- Enhanced permission guards:
  - Edit / delete users only if super admin or global permission
- Critical event alerts:
  - Login
  - Email change
  - Password reset
- Updated Swagger documentation

---

## ✅ v0.3.0 — Account Security & Sessions

- **2FA / MFA**
  - TOTP (Google Authenticator / Authy)
  - SMS / email codes
  - Enable / disable per user
  - Backup codes
- **Session & Refresh Token Management**
  - Add `auth_sessions` or `refresh_tokens` table in DB
  - Rotatable and revocable refresh tokens
  - Logout per device
  - Global logout (revoke all refresh tokens)
- **Hardening**
  - Rate limiting (login / password reset / 2FA)
  - Brute-force protection
  - Configurable password policies

---

## ✅ v0.4.0 — Advanced Authorization & Auditing

- Fine-grained roles and permission control:
  - More precise guards for specific CRUD actions
  - Audit logs for role and permission changes
- Critical event logging:
  - LOGIN_SUCCESS / LOGIN_FAILED
  - PASSWORD_CHANGED
  - 2FA enabled/disabled
  - Revoked refresh tokens

---

## ✅ v0.5.0 — Complete Account Flows

- Full password reset (API-only)
- Email change with confirmation
- Re-authentication required for critical actions:
  - Password change
  - Enabling 2FA
- OAuth enhancements:
  - Linking OAuth accounts with different emails
  - Logout and revocation of OAuth tokens

---

## ⏳ v0.6.0 — Developer Experience & Documentation

- Final Swagger / OpenAPI and consolidated endpoints
- Example requests / responses for integration
- Documented environment variables
- Standardized JSON responses
- Docker-ready / easy development setup
- Optional i18n configuration

---

## ⏳ v0.7.0 — Testing & Stability

- Unit + e2e tests:
  - Login / registration / OAuth flows
  - Refresh tokens + logout
  - 2FA flows
  - Guards / roles / permissions
- Versioned database migrations
- Development seeds
- Structured logging and consistent error handling

---

## 🚀 v1.0.0 — Stable Release

**Release criteria:**

- Fully functional credentials and OAuth authentication
- 2FA / MFA operational
- Rotatable and revocable refresh tokens
- Device-specific and global logout
- Solid roles and permissions
- Complete account recovery flows
- Basic auditing and hardening implemented
- API fully documented and versioned (Swagger)
- Core tests passing
- No breaking changes in existing endpoints

---

## 🌟 Optional post-v1.0.0 (Enterprise-ready)

- WebAuthn / Passkeys
- SSO / SAML
- Multi-tenant authentication
- Risk-based authentication
- Device fingerprinting / geo-detection
