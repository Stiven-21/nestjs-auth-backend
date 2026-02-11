# 🌎 Environment Variables

This document describes all environment variables used by NestAuth.

---

## 🧩 APP Configuration

| Variable     | Required | Default               | Example           | Description                                |
| ------------ | -------- | --------------------- | ----------------- | ------------------------------------------ |
| APP_NAME     | Yes      | NestAuth              | MyAuth            | Application name shown in Swagger and logs |
| APP_PORT     | Yes      | 8000                  | 3000              | Port where API runs                        |
| NODE_ENV     | Yes      | development           | production        | Application environment                    |
| URL_FRONTEND | Yes      | http://localhost:3000 | https://myapp.com | Frontend base URL                          |

---

## 🗄 Database Configuration

| Variable    | Required | Default   | Example  | Description           |
| ----------- | -------- | --------- | -------- | --------------------- |
| DB_TYPE     | Yes      | postgres  | postgres | Database type         |
| DB_HOST     | Yes      | localhost | db       | Database host         |
| DB_PORT     | Yes      | 5432      | 5432     | Database port         |
| DB_USERNAME | Yes      | -         | postgres | Database user         |
| DB_PASSWORD | Yes      | -         | secret   | Database password     |
| DB_DATABASE | Yes      | -         | auth_db  | Database name         |
| DB_SSL      | No       | false     | true     | Enable SSL connection |

---

## 🔐 JWT Configuration

| Variable               | Required | Default | Description                       |
| ---------------------- | -------- | ------- | --------------------------------- |
| JWT_SECRET             | Yes      | -       | Secret for signing access tokens  |
| JWT_REFRESH_SECRET     | Yes      | -       | Secret for signing refresh tokens |
| JWT_ACCESS_EXPIRATION  | Yes      | 15m     | Access token lifetime             |
| JWT_REFRESH_EXPIRATION | Yes      | 2d      | Refresh token lifetime            |

---

## 📧 Mail Configuration

| Variable              | Required | Description          |
| --------------------- | -------- | -------------------- |
| MAIL_HOST             | Yes      | SMTP host            |
| MAIL_PORT             | Yes      | SMTP port            |
| MAIL_SECURE           | Yes      | true/false           |
| MAIL_USER             | Yes      | SMTP username        |
| MAIL_PASSWORD         | Yes      | SMTP password        |
| DEFAULT_REMITTER_MAIL | Yes      | Default sender email |

---

## 🔑 OAuth Configuration

| Variable              | Required | Description                       |
| --------------------- | -------- | --------------------------------- |
| OAUTH_STATE_SECRET    | Yes      | Secret for validating OAuth state |
| GOOGLE_CLIENT_ID      | Yes      | Google OAuth Client ID            |
| GOOGLE_CLIENT_SECRET  | Yes      | Google OAuth Client Secret        |
| GOOGLE_CALLBACK_URL   | Yes      | Google OAuth callback URL         |
| FACEBOOK_APP_ID       | Yes      | Facebook App ID                   |
| FACEBOOK_APP_SECRET   | Yes      | Facebook App Secret               |
| FACEBOOK_CALLBACK_URL | Yes      | Facebook OAuth callback URL       |
| GITHUB_CLIENT_ID      | Yes      | GitHub OAuth Client ID            |
| GITHUB_CLIENT_SECRET  | Yes      | GitHub OAuth Client Secret        |
| GITHUB_CALLBACK_URL   | Yes      | GitHub OAuth callback URL         |
