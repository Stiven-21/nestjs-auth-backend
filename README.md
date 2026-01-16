# OpenAuth — Servidor de Autenticación (NestJS)

Proyecto open-source que provee un sistema de autenticación modular y reutilizable, implementado con NestJS. Está pensado como una referencia y base para que otros proyectos integren funcionalidades de autenticación segura: login local (email/password), OAuth (Google, Facebook, GitHub), gestión de usuarios, permisos, sesiones y envío de correos con plantillas. El proyecto incluye i18n (es/en), validación estandarizada y respuestas uniformes para facilitar su consumo por frontends.

**Prefix base:** `api/v1` (definido en `src/main.ts`)

**Versión:** v0.2.0-beta

## Descripción

Backend construido con NestJS que sirve como API para la plataforma Nextcommerce. Proporciona módulos modulares para autenticación, gestión de usuarios y roles, gestión de sesiones, envío de correos con plantillas Handlebars, soporte de internacionalización (es/en), validación, y documentación con Swagger. Está diseñado como una base extensible para un eCommerce.

## Estado de versionado

- Historial de versiones:
  - **v0.1.0-beta** — Versión inicial beta con módulos de autenticación, usuarios, roles, i18n y plantillas de correo.
  - **v0.2.0-beta** — Añadido OAuth (Google, Facebook, GitHub) y separación de credenciales/OAuth para permitir múltiples formas de inicio de sesión vinculadas a una cuenta.

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

## OAuth y modelo de credenciales (v0.2.0-beta)

En la versión `v0.2.0-beta` se añadió soporte para autenticación vía OAuth providers: Google, Facebook y GitHub. Además, las credenciales locales (email/contraseña) y las credenciales OAuth se almacenan en tablas separadas para permitir que una misma cuenta de usuario tenga vinculadas múltiples formas de inicio de sesión.

Estructura general (conceptual):

- Tabla `credentials`: almacena credenciales locales (hash de contraseña, tipo 'local').
- Tabla `oauth_credentials`: almacena registros de proveedores OAuth (provider, provider_user_id, access_token, refresh_token opcional).
- Ambas tablas se relacionan con la entidad `users` para permitir vinculación multi-proveedor.

Flujo OAuth resumido:

1. El cliente redirige al endpoint de autorización del backend: `GET /api/v1/auth/google` (o `/facebook`, `/github`).
2. El backend usa el guard OAuth correspondiente (`GoogleOauthGuard`, `FacebookOauthGuard`, `GithubOauthGuard`) para iniciar el flujo con el proveedor.
3. Tras autenticarse en el proveedor, el callback (`/api/v1/auth/google/callback`, etc.) invoca `authService.loginById(req, id, i18n)` que genera `access_token` y `refresh_token` (mismo formato que login local).
4. Si el proveedor devuelve un email ya existente, se vincula el `oauth_credentials` al mismo `user.id`. Si no existe, se crea el usuario y se vincula.

Endpoints OAuth:

- `GET /api/v1/auth/google` — Inicia flujo Google OAuth
- `GET /api/v1/auth/google/callback` — Callback Google
- `GET /api/v1/auth/facebook` — Inicia flujo Facebook OAuth
- `GET /api/v1/auth/facebook/callback` — Callback Facebook
- `GET /api/v1/auth/github` — Inicia flujo Github OAuth
- `GET /api/v1/auth/github/callback` — Callback Github

Credenciales y configuración (env)

Separar credenciales en `.env` en dos bloques: credenciales de SMTP/JWT/DB y credenciales OAuth por proveedor. Ejemplo:

```ini
# Bloque general
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# OAuth Google
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_GOOGLE_CALLBACK_URL=https://your-backend.example.com/api/v1/auth/google/callback

# OAuth Facebook
OAUTH_FACEBOOK_CLIENT_ID=...
OAUTH_FACEBOOK_CLIENT_SECRET=...
OAUTH_FACEBOOK_CALLBACK_URL=https://your-backend.example.com/api/v1/auth/facebook/callback

# OAuth Github
OAUTH_GITHUB_CLIENT_ID=...
OAUTH_GITHUB_CLIENT_SECRET=...
OAUTH_GITHUB_CALLBACK_URL=https://your-backend.example.com/api/v1/auth/github/callback
```

Nota: el proyecto incluye guards y estrategias OAuth en `src/modules/auth/guards/oauth/*` y la gestión de credenciales en `src/modules/users/credentials`.

Ejemplo de tabla (conceptual)

| Tipo                | Campo clave                               | Descripción                                      |
| ------------------- | ----------------------------------------- | ------------------------------------------------ |
| `credentials`       | `user_id`, `type='local'`                 | Hash de contraseña, salt, fecha de creación      |
| `oauth_credentials` | `user_id`, `provider`, `provider_user_id` | Token del proveedor, datos para refrescar sesión |

Cómo vincular múltiples métodos de inicio de sesión

- Si el usuario inicia sesión con OAuth y ya existe un `user.email` igual, el sistema vincula automáticamente el `oauth_credentials` a ese `user`.
- Es posible implementar endpoints para listar y desvincular proveedores conectados desde `src/modules/users/credentials`.

## Endpoints resumidos

Prefijo global: `/api/v1` (configurado en `src/main.ts`).

- Autenticación (`src/modules/auth`):
  - `POST /api/v1/auth/register` — Registrar usuario
  - `POST /api/v1/auth/sign-in` — Login (retorna `access_token` y `refresh_token`)
  - `GET /api/v1/auth/verify-email/:token` — Verificar email
  - Endpoints para reset de contraseña y refresh token
  - OAuth: `GET /api/v1/auth/{google,facebook,github}` y sus callbacks que devuelven `access_token` / `refresh_token`.

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

## Respuestas estandarizadas y manejo de excepciones

El proyecto usa una fábrica de respuestas que estandariza el formato de respuestas exitosas y de error. Esto facilita el consumo desde clientes frontend y la internacionalización de mensajes.

Formato de respuesta exitosa (ejemplo 200):

```json
{
  "statusCode": 200,
  "message": "OK",
  "description": "La operación se completó correctamente.",
  "data": {
    "data": {
      /* payload específico */
    },
    "total": 1
  }
}
```

Nota: la fábrica usa `i18n.t('status.<code>.message')` y `i18n.t('status.<code>.description')` para poblar `message` y `description`.

Formato de error estándar (ejemplo 400):

```json
HTTP/1.1 400 Bad Request
{
  "statusCode": 400,
  "message": "Bad Request",
  "description": "Descripción detallada del error (i18n)."
}
```

Los helpers disponibles generan errores específicos via `ResponseFactory.error(...)` y lanzan `HttpException` con la estructura anterior. Helpers comunes:

- `notFoundError(...)` — 404
- `conflictError(...)` — 409
- `badRequestError(...)` — 400
- `unauthorizedError(...)` — 401
- `forbiddenError(...)` — 403
- `internalServerError(...)` — 500

Ejemplo práctico: login exitoso (cURL)

```bash
curl -X POST http://localhost:8080/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass1234"}'
```

Respuesta esperada (200):

```json
{
  "statusCode": 200,
  "message": "OK",
  "description": "Operación exitosa.",
  "data": {
    "data": {
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "email": "user@example.com",
      "user": "Nombre Apellido",
      "role": "admin",
      "permissions": ["users:read", "users:update:id"]
    },
    "total": 1
  }
}
```

Ejemplo de error (contraseña incorrecta):

```json
HTTP/1.1 400 Bad Request
{
  "statusCode": 400,
  "message": "Bad Request",
  "description": "Contraseña incorrecta."
}
```

Ejemplo flujo OAuth (Google)

1. Cliente navega a: `GET https://your-backend.example.com/api/v1/auth/google` — redirección al provider.
2. Provider redirige a: `GET https://your-backend.example.com/api/v1/auth/google/callback?code=...`.
3. Callback devuelve la respuesta estándar con tokens (igual formato que login local).

Cabe destacar que la respuesta final provista por `authService.loginById` usa `okResponse(...)` y por tanto sigue el esquema estandarizado.

## Changelog (breve)

## Documentación

- Swagger UI: `/api/docs`.

## Changelog (breve)

- v0.1.0-beta — Versión inicial beta con módulos de autenticación, usuarios, roles, i18n y plantillas de correo.
- v0.2.0-beta — Añadido OAuth (Google, Facebook, Github) y separación de credenciales/OAuth.

## Próximos pasos sugeridos

- Completar endpoints pendientes en `tokens` y añadir pruebas e2e.
- Preparar release estable (v0.1.0) tras pruebas y revisión de seguridad.

## LICENSE

Licencia en `LICENSE` (MIT).
