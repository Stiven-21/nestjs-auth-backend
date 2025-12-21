# NEXTCOMMERCE - Backend (NestJS)

backend construido con NestJS que provee autenticación, gestión de usuarios, roles, sesiones y plantillas de correo con i18n (inglés/español).

**Prefix base:** `api/v1` (definido en `src/main.ts`)

# NEXTCOMMERCE - Backend (NestJS)

**Versión:** v0.1.0-beta

## Descripción

Backend construido con NestJS que sirve como API para la plataforma Nextcommerce. Proporciona módulos modulares para autenticación, gestión de usuarios y roles, gestión de sesiones, envío de correos con plantillas Handlebars, soporte de internacionalización (es/en), validación, y documentación con Swagger. Está diseñado como una base extensible para un eCommerce.

## Estado de versionado

- Versión liberada inicialmente: **v0.1.0-beta**
- Notas: versión beta; varios endpoints y pruebas e2e pueden estar en progreso.

## Funcionalidades principales

- Autenticación JWT (access + refresh) usando `@nestjs/jwt`. El access token se firma combinando `JWT_SECRET` con un `user_secret` por usuario.
- Sistema de permisos y guards (`roles`, `permissions`, `superadmin`) para control de acceso.
- Gestión de usuarios: registro, inicio de sesión, actualización, listado con filtros/paginación (soporta `DynamicQueryDto`).
- Gestión de roles y tipos de identidad (`identity-types`).
- Gestión de sesiones por usuario y endpoints relacionados.
- Envío de correos con `@nestjs-modules/mailer` + Handlebars (`src/mails/templates`) para plantillas: registro, verificación, restablecimiento de contraseña, alertas de inicio de sesión, etc.
- Internacionalización con `nestjs-i18n` (locales en `src/i18n/locales/en` y `es`), con resolución por encabezado `x-custom-lang` o `Accept-Language`.
- Persistencia con TypeORM + PostgreSQL (configurable vía `.env`).
- Validación global con `class-validator` e integración i18n para mensajes de validación.
- Documentación automática con Swagger en `/api/docs`.

## Endpoints resumidos

Prefijo global: `/api/v1` (configurado en `src/main.ts`).

- Autenticación (`src/modules/auth`):
  - `POST /api/v1/auth/register` — Registrar usuario
  - `POST /api/v1/auth/sign-in` — Login (retorna `access_token` y `refresh_token`)
  - `GET /api/v1/auth/verify-email/:token` — Verificar email
  - Endpoints para reset de contraseña y refresh token

- Usuarios (`src/modules/users`):
  - `GET /api/v1/users` — Listar usuarios (filtros/paginación)
  - `GET /api/v1/users/:id`, `PATCH /api/v1/users/:id`, `DELETE /api/v1/users/:id`

- Roles (`src/modules/roles`):
  - `GET /api/v1/roles`, `GET /api/v1/roles/:id`

Ver el código en `src/modules/*` para endpoints completos y permisos requeridos.

## Instalación rápida

Requisitos: Node.js (>=18 recomendado) y `pnpm`.

```bash
pnpm install
```

## Scripts principales

```bash
pnpm run start       # arrancar
pnpm run start:dev   # desarrollo con watch
pnpm run build       # compilar
pnpm run start:prod  # ejecutar dist
pnpm run test        # tests
```

## Variables de entorno esenciales

Crear un `.env` en la raíz con al menos estas variables (ejemplo):

```ini
APP_PORT=8080
NAME_APP=Nextcommerce

# Database (TypeORM)
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=nextcommerce
DB_SSL=false

# JWT
JWT_SECRET=change_this_secret
JWT_REFRESH_SECRET=change_this_refresh_secret

# Mailer (SMTP)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-smtp-user
MAIL_PASSWORD=your-smtp-password
DEFAULT_REMITTER_MAIL=no-reply@example.com

# Otros
DEFAULT_LOCALE=en
```

## Notas para desarrolladores

- Prefijo global de API: `app.setGlobalPrefix('api/v1')` en `src/main.ts`.
- Validación global con `CustomValidationPipe` en `src/config/validation.config.ts`.
- Revisa `src/config/mails.config.ts` y `src/mails/mail.service.ts` para personalizar envíos.
- `synchronize: true` en TypeORM (`src/app.module.ts`) está activado para desarrollo; desactívalo en producción.

## Documentación

- Swagger UI: `/api/docs`.

## Changelog (breve)

- v0.1.0-beta — Versión inicial beta con módulos de autenticación, usuarios, roles, i18n y plantillas de correo.

## Próximos pasos sugeridos

- Completar endpoints pendientes en `tokens` y añadir pruebas e2e.
- Preparar release estable (v0.1.0) tras pruebas y revisión de seguridad.

## LICENSE

Licencia en `LICENSE` (MIT).
