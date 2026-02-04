# 🔐 OPEN AUTH

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" />
  <img src="https://img.shields.io/badge/license-MIT-blue" />
  <img src="https://img.shields.io/badge/version-v0.4.0--beta-orange" />
  <img src="https://img.shields.io/badge/NestJS-framework-red" />
  <img src="https://img.shields.io/badge/TypeScript-language-blue" />
  <img src="https://img.shields.io/badge/Mailer-SMTP-lightgrey" />
  <img src="https://img.shields.io/badge/i18n-ES%20%7C%20EN-green" />
  <img src="https://img.shields.io/badge/Open%20Source-Yes-success" />
  <img src="https://img.shields.io/badge/docs-Swagger-green" />

</p>

**OPEN AUTH** is an **open-source authentication server**, modular and extensible, built with **NestJS**. It is designed as a **professional reference implementation** and a **solid foundation** for **SaaS platforms, eCommerce projects, and modern APIs** that require secure and scalable authentication.

> 🎯 Goal: provide a complete, clear, and maintainable authentication system, production-ready and easy to extend.

---

## 📌 General Information

- **Project name:** OPEN AUTH
- **Type:** Backend / Authentication Server
- **Status:** Beta
- **Current version:** `v0.2.0-beta`
- **Framework:** NestJS
- **Language:** TypeScript
- **License:** MIT
- **Global API prefix:** `/api/v1`

---

## ✨ Key Features

- 🔑 JWT Authentication (Access + Refresh Tokens)
- 🔐 Local login (email / password)
- 🌐 OAuth authentication (Google, Facebook, GitHub)
- 👤 Full user management
- 🛂 Roles, permissions, and guards system
- 🧩 Modular and extensible architecture
- 🌍 Internationalization (i18n) ES / EN
- 📧 Email delivery with templates (Handlebars)
- 🗂️ Per-user session management
- 📚 Automatic API documentation with Swagger
- 🧪 Global standardized validation
- 🧱 PostgreSQL persistence with TypeORM

---

## 🧠 Project Philosophy

OPEN AUTH is not just a boilerplate. It is a **reference implementation** that aims to:

- Serve as a **reliable technical foundation** for real-world products
- Showcase **NestJS best practices**
- Enable **clean modular extensibility**
- Maintain clear boundaries between authentication, authorization, and domain logic

Ideal for:

- SaaS platforms
- eCommerce systems
- Public or private APIs
- Internal platforms

---

## 🏗️ High-Level Architecture

The system is organized into decoupled modules:

- `auth` → authentication, login, tokens, OAuth
- `users` → users, profiles, credentials
- `roles` → roles and permissions
- `sessions` → active user sessions
- `mails` → email delivery and templates
- `i18n` → internationalization

Each module has clear responsibilities and can evolve independently without impacting the rest of the system.

---

## 🔐 JWT Authentication

- Access Token + Refresh Token
- Per-user signing strategy:

```
JWT_SECRET + user_secret
```

This allows invalidating all sessions for a single user without affecting others.

---

## 🌐 OAuth & Multiple Credentials

Since `v0.2.0-beta`, OPEN AUTH supports **multiple authentication methods per user**.

### Supported Providers

- Google
- Facebook
- GitHub

### Credential Model

- `users`
- `credentials` → email / password
- `oauth_credentials` → external providers

A single user can have multiple login methods linked to the same account.

---

## 📡 Main Endpoints

### Authentication

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/sign-in`
- `GET  /api/v1/auth/verify-email/:token`
- `POST /api/v1/auth/refresh-token`

### OAuth

- `GET /api/v1/auth/google`
- `GET /api/v1/auth/google/callback`
- `GET /api/v1/auth/facebook`
- `GET /api/v1/auth/github`

### Users

- `GET    /api/v1/users`
- `GET    /api/v1/users/:id`
- `PATCH  /api/v1/users/:id`
- `DELETE /api/v1/users/:id`

---

## 📦 Standardized Responses

Common format for successful responses:

```json
{
  "statusCode": 200,
  "message": "OK",
  "description": "The operation completed successfully.",
  "data": {
    "data": {},
    "total": 1
  }
}
```

Designed to simplify frontend integration and internationalization.

---

## ⚙️ Quick Start

### Requirements

- Node.js ≥ 18
- pnpm
- PostgreSQL

```bash
pnpm install
pnpm run start:dev
```

---

## 🔧 Environment Variables

```ini
APP_PORT=8080
NAME_APP=OPEN AUTH

DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=openauth

JWT_SECRET=change_me
JWT_REFRESH_SECRET=change_me

DEFAULT_LOCALE=en
```

---

## 📚 Documentation

OPEN AUTH provides structured documentation to support usage, contribution, and long-term maintenance.

### Core

- 🏗️ Architecture — [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- 📜 Changelog — [`CHANGELOG.md`](CHANGELOG.md)

### Community & Governance

- 🤝 Contributing — [`CONTRIBUTING.md`](CONTRIBUTING.md)
- 📜 Code of Conduct — [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
- 🏛️ Governance — [`GOVERNANCE.md`](GOVERNANCE.md)

### Security & Support

- 🔐 Security Policy — [`SECURITY.md`](SECURITY.md)
- 🆘 Support — [`SUPPORT.md`](SUPPORT.md)

### API

- 📚 Swagger UI — `/api/docs`

---

## 👨‍💻 Author

<p align="center">
  <img src="https://avatars.githubusercontent.com/u/61439523?s=96&v=4" width="120" style="border-radius:50%" />
</p>

<p align="center">
  <strong>James Córdoba</strong><br />
  Software Engineer · Fullstack Developer
</p>

<div align="center">

[![Github](https://img.shields.io/badge/Github-0077B5?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Stiven-21)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/stiveen1821/)
[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=google-chrome&logoColor=white)](https://jam-dev-fullstack.onrender.com/)

</div>

Currently developed and maintained by a single author. Open to collaborators.

---

## 🤝 Contributions

Contributions are welcome:

- Issues
- Pull Requests
- Security reviews
- Documentation improvements

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before submitting changes.

---

## 🗺️ Roadmap

- [ ] End-to-end tests
- [ ] Advanced token management
- [ ] Device management module
- [ ] WebAuthn / Passkeys
- [ ] Stable v1.0.0 release

---

## 📄 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for details.
