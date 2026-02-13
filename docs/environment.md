# 🌎 Environment Variables

This document describes all environment variables used by NestAuth, including optional internationalization (i18n) behavior.

---

## 🧩 APP Configuration

| Variable     | Required | Default     | Example                                | Description                                |
| ------------ | -------- | ----------- | -------------------------------------- | ------------------------------------------ |
| APP_NAME     | No       | NestAuth    | MyAuth                                 | Application name shown in Swagger and logs |
| APP_PORT     | No       | 8000        | 3000                                   | Port where API runs                        |
| NODE_ENV     | No       | development | production                             | Application environment                    |
| URL_FRONTEND | Yes      | -           | [https://myapp.com](https://myapp.com) | Frontend base URL                          |

---

## 🗄 Database Configuration

| Variable    | Required | Default   | Example  | Description                                             |
| ----------- | -------- | --------- | -------- | ------------------------------------------------------- |
| DB_TYPE     | No       | postgres  | postgres | Database type                                           |
| DB_HOST     | Yes      | localhost | db       | Database host                                           |
| DB_PORT     | No       | 5432      | 5432     | Database port                                           |
| DB_USERNAME | Yes      | -         | postgres | Database user                                           |
| DB_PASSWORD | Yes      | -         | secret   | Database password                                       |
| DB_DATABASE | Yes      | -         | auth_db  | Database name                                           |
| DB_SSL      | No       | false     | true     | Enable SSL connection (recommended for cloud providers) |

---

## 🔐 JWT Configuration

| Variable               | Required | Default | Description                       |
| ---------------------- | -------- | ------- | --------------------------------- |
| JWT_SECRET             | Yes      | -       | Secret for signing access tokens  |
| JWT_REFRESH_SECRET     | Yes      | -       | Secret for signing refresh tokens |
| JWT_ACCESS_EXPIRATION  | No       | 15m     | Access token lifetime             |
| JWT_REFRESH_EXPIRATION | No       | 2d      | Refresh token lifetime            |

---

## 📧 Mail Configuration

| Variable              | Required | Default | Description                                      |
| --------------------- | -------- | ------- | ------------------------------------------------ |
| MAIL_HOST             | Yes      | -       | SMTP host                                        |
| MAIL_PORT             | Yes      | -       | SMTP port                                        |
| MAIL_SECURE           | Yes      | -       | Use TLS connection (true for 465, false for 587) |
| MAIL_USER             | Yes      | -       | SMTP username                                    |
| MAIL_PASSWORD         | Yes      | -       | SMTP password                                    |
| DEFAULT_REMITTER_MAIL | Yes      | -       | Default sender email                             |

---

## 🔑 OAuth Configuration

> Only required if the corresponding provider is enabled.

| Variable              | Required | Default | Description                       |
| --------------------- | -------- | ------- | --------------------------------- |
| OAUTH_STATE_SECRET    | Yes      | -       | Secret for validating OAuth state |
| GOOGLE_CLIENT_ID      | No       | -       | Google OAuth Client ID            |
| GOOGLE_CLIENT_SECRET  | No       | -       | Google OAuth Client Secret        |
| GOOGLE_CALLBACK_URL   | No       | -       | Google OAuth callback URL         |
| FACEBOOK_APP_ID       | No       | -       | Facebook App ID                   |
| FACEBOOK_APP_SECRET   | No       | -       | Facebook App Secret               |
| FACEBOOK_CALLBACK_URL | No       | -       | Facebook OAuth callback URL       |
| GITHUB_CLIENT_ID      | No       | -       | GitHub OAuth Client ID            |
| GITHUB_CLIENT_SECRET  | No       | -       | GitHub OAuth Client Secret        |
| GITHUB_CALLBACK_URL   | No       | -       | GitHub OAuth callback URL         |

---

## 🌍 Internationalization (i18n)

Internationalization support is optional.

If i18n is not enabled or the related configuration is not present:

- The system automatically falls back to production defaults.
- Only English (`en`) will be used internally.
- Any language sent from the frontend will be ignored.
- The default language will always be `en`.

When i18n is enabled:

- The system supports the languages defined in:

```
src/common/constants/i18n.constant.ts
```

```ts
export const SUPPORTED_LANGUAGES = ['es', 'en'];
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: AppLanguage = 'en';
```

### Language Resolution Rules

- If the frontend sends a supported language (`en` or `es`), it will be used.
- If the frontend sends a language not included in `SUPPORTED_LANGUAGES`, the system automatically falls back to the default language (`en`).
- If no language is provided, the default language (`en`) is used.

---

## ➕ Adding a New Language

To add a new language (for example `fr`):

### 1️⃣ Update Supported Languages

Modify:

```
src/common/constants/i18n.constant.ts
```

Add the new language to `SUPPORTED_LANGUAGES`:

```ts
export const SUPPORTED_LANGUAGES = ['es', 'en', 'fr'];
```

---

### 2️⃣ Create Locale Folder

Create a new folder inside:

```
src/i18n/locales/
```

Example:

```
src/i18n/locales/fr/
```

---

### 3️⃣ Create Translation Files

Inside the new language folder, replicate all JSON files from an existing language (e.g., `en`) and translate their content:

- entities.json
- errors.json
- messages.json
- pagination.json
- property.json
- status.json
- validator.json

Each file must maintain the same structure and keys to ensure consistency across translations.

---

The system will automatically recognize the new language once it is added to `SUPPORTED_LANGUAGES` and the corresponding locale files are present.
