# 🔐 NEST AUTH

<div align="center">
  <img src="./assets/nest_auth.png" width="auto" height="auto">
</div>

<div align="center">

  <img src="https://img.shields.io/badge/build-passing-brightgreen" />
  <img src="https://img.shields.io/badge/license-MIT-blue" />
  <img src="https://img.shields.io/badge/version-v0.5.0-orange" />
  <img src="https://img.shields.io/badge/NestJS-framework-red" />
  <img src="https://img.shields.io/badge/TypeScript-language-blue" />
  <img src="https://img.shields.io/badge/Mailer-SMTP-lightgrey" />
  <img src="https://img.shields.io/badge/i18n-ES%20%7C%20EN-green" />
  <img src="https://img.shields.io/badge/Open%20Source-Yes-success" />
  <img src="https://img.shields.io/badge/docs-Swagger-green" />

</div>

**NEST AUTH** is an open-source, modular, and extensible authentication server built with **NestJS**. It is designed as a professional reference implementation and a solid foundation for SaaS platforms, e-commerce projects, and modern APIs requiring secure and scalable authentication.

> 🎯 **Goal:** To provide a complete, clear, and maintainable authentication system, production-ready and easy to extend.

---

## 📌 General Information

- **Project:** NEST AUTH
- **Type:** Backend / Authentication Server
- **Status:** Beta
- **Current Version:** `v0.5.0`
- **Framework:** NestJS
- **Language:** TypeScript
- **License:** MIT
- **Global API Prefix:** `/api/v1`

---

## ✨ Key Features

- 🔑 **JWT Authentication:** Access and Refresh Token management with rotation and advanced security.
- 🔐 **Local Login:** Secure registration and login with credential hashing.
- 🌐 **OAuth Authentication:** Modular integration with Google, Facebook, and GitHub.
- 👤 **User Management:** Full profiles, change auditing, and credential control.
- 🛂 **Roles & Permissions:** RBAC (Role-Based Access Control) system with granular Guards.
- 🧩 **Modular Architecture:** Layer-based design (API, Application, Domain, Infrastructure) for maximum maintainability.
- 🌍 **Internationalization (i18n):** Native and dynamic support for Spanish and English.
- 📧 **Mail Delivery:** Transactional notification system using SMTP and Handlebars templates.
- 🗂️ **Session Management:** Detailed control of devices, active sessions, and per-user security.
- 📚 **Automated Documentation:** Full integration with Swagger (OpenAPI).

---

## 🏗️ Architecture & Design

The project follows a clean layered architecture to ensure separation of concerns:

- **API Layer:** Controllers in `src/modules/*` handling incoming requests.
- **Application Layer:** Services and use cases containing business logic.
- **Domain Layer:** Entities, DTOs, and repositories defining the data model.
- **Infrastructure Layer:** Mail, i18n, TypeORM configurations, and shared services.

For more details, see the [Architecture Guide](docs/ARCHITECTURE.md).

---

## 🐳 Docker Deployment

Run the complete environment (API + PostgreSQL) quickly and in isolation:

### Requirements

- Docker Engine 24+
- Docker Compose v2+

### Quick Start

1. Configure your `.env` (ensure `DB_HOST=db`).
2. Start the containers:
   ```bash
   pnpm docker:up
   ```
   _Or directly with:_ `docker compose up --build -d`

For more information, see the [Docker Guide](docs/docker.md).

---

## 📧 Mail Configuration

The system uses SMTP for critical features such as account verification and password recovery.

**Required Variables:**

- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `DEFAULT_REMITTER_MAIL`.

> ⚠️ **Note:** The system will fail to start if any mail configuration is missing, ensuring security features are always available.

See the [Mail Configuration Guide](docs/mail.md) for examples (Gmail, etc.).

---

## 🌐 OAuth & Account Linking

NEST AUTH allows multiple authentication methods linked to a single identity.

- **Providers:** Google, Facebook, GitHub.
- **Security:** `state` validation via `OAUTH_STATE_SECRET` to prevent CSRF attacks.
- **Flexibility:** Securely link OAuth providers to existing accounts.

Implementation details in the [OAuth Guide](docs/oauth.md).

---

## ⚙️ Environment Variables

The system is highly configurable. Below are the main variables:

| Variable             | Description                              |
| :------------------- | :--------------------------------------- |
| `APP_PORT`           | API Port (default 8000)                  |
| `URL_FRONTEND`       | Frontend base URL for redirects and CORS |
| `DB_*`               | PostgreSQL connection settings           |
| `JWT_SECRET`         | Secret for Access Tokens                 |
| `JWT_REFRESH_SECRET` | Secret for Refresh Tokens                |
| `OAUTH_STATE_SECRET` | Secret for OAuth flow validation         |

For an exhaustive list and detailed explanations, check the [Environment Variables Guide](docs/environment.md).

---

## 📡 Key Endpoints

### Authentication & Security

- `POST /auth/register`: User registration.
- `POST /auth/sign-in`: Login with device detection.
- `POST /auth/refresh-token`: Session renewal.
- `POST /auth/2fa/enable`: Two-factor authentication management.

### Profile & Sessions

- `GET /users/profile/me`: Authenticated user data.
- `POST /auth/logout-device/:deviceId`: Remote session termination.
- `POST /auth/logout-all`: Invalidate all active sessions.

---

## 🚀 API Usage Examples

### User Registration

`POST /api/v1/auth/register`

**Request:**

```json
{
  "name": "John",
  "lastname": "Doe",
  "documentTypeId": 1,
  "document": "123456789",
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "john.doe@example.com",
    "name": "John",
    "lastname": "Doe"
  },
  "meta": null,
  "error": null
}
```

### User Login (Sign-in)

`POST /api/v1/auth/sign-in`

**Request:**

```json
{
  "email": "user@test.com",
  "password": "Password123!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email": "user@test.com",
    "user": "user",
    "role": "admin",
    "permissions": ["all"]
  },
  "meta": null,
  "error": null
}
```

---

## 📚 Additional Documentation

- 🏗️ **Detailed Architecture** — [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- 🐳 **Docker Guide** — [`docs/docker.md`](docs/docker.md)
- 📧 **Mail Configuration** — [`docs/mail.md`](docs/mail.md)
- 🔑 **OAuth Guide** — [`docs/oauth.md`](docs/oauth.md)
- 📜 **Changelog** — [`CHANGELOG.md`](CHANGELOG.md)
- 📚 **Swagger UI** — Accessible at `/api/docs` after starting the server.

---

## 🤝 Contributions

Contributions are welcome! Please review [`CONTRIBUTING.md`](CONTRIBUTING.md) before getting started.

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

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
