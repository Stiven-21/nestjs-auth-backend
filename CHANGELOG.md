# Changelog

Registro profesional de cambios y notas de lanzamiento.

## [v0.2.0-beta] - 2026-01-15

## Resumen

Versión beta que incorpora soporte para autenticación mediante proveedores externos (OAuth), separación explícita de modelos de credenciales, y estandarización del formato de respuestas API con soporte i18n.

## Añadido

- Soporte OAuth para Google, Facebook y GitHub (estrategias, guards y endpoints de callback).
- Entidades para gestión de métodos de autenticación: cuentas con credenciales locales y cuentas vinculadas a proveedores OAuth.
- Flujo de vinculación automática de cuentas cuando el proveedor retorna un email coincidente con un usuario existente.
- Variables de entorno y configuración de proveedores OAuth (clientes, secretos, callbacks).

## Cambios

- Estandarización de respuestas y errores mediante una fábrica central (`ResponseFactory`) y uso de `nestjs-i18n` para mensajes localizados.
- Documentación renovada para orientar el proyecto como servidor de autenticación open-source y mejorar ejemplos de uso.
- Actualización de la versión del paquete a `0.2.0-beta`.

## Correcciones y refinamientos

- Correcciones menores en ejemplos de documentación y descripciones de endpoints.
- Ajustes en dependencias y configuración para soportar estrategias OAuth.

## Conocidos / Observaciones técnicas

- Algunos métodos de servicio pueden no devolver una respuesta HTTP explícita en todos los flujos (p. ej. `resetPasswordToken`, `refreshToken`) — esto puede causar respuestas inconsistentes en casos de error.
- Existen áreas con tipado permisivo en estrategias OAuth y DTOs que se beneficiarían de un tipado TypeScript más estricto.
- `synchronize` está habilitado en la configuración de TypeORM: deshabilitar en entornos de producción y usar migraciones para gestión de esquema.

## [v0.1.0-beta] - Inicial

## Resumen

Versión inicial beta que establece la base del sistema de autenticación.

## Funcionalidades principales

- Autenticación local: registro, inicio de sesión, refresh token y restablecimiento de contraseña.
- Gestión de usuarios y roles con permisos básicos.
- Envío de correos mediante `@nestjs-modules/mailer` y plantillas Handlebars.
- Internacionalización con `nestjs-i18n` (soporte para `en` y `es`).
- Persistencia con TypeORM y PostgreSQL, validación global y documentación Swagger.

## Notas finales

Esta publicación corresponde a versiones en estado beta; se recomienda seguir las prácticas de seguridad habituales antes de desplegar en producción (revisión de secretos, uso de migraciones, auditoría de dependencias y pruebas de integración).

- Actualizaciones de documentación y ejemplos corregidos en `README.md`.
- Creación de `CHANGELOG.md` (este archivo) para registrar cambios.

### Issues detectados / pendientes (observaciones importantes)

Los siguientes puntos fueron detectados durante el análisis y están por corregir o revisar (no todos fueron modificados automáticamente):

- `console.log(user)` permanece en `src/modules/auth/auth.service.ts` — reemplazar por `Logger` para evitar exposición de datos en logs.
- `AuthService.resetPasswordToken` realiza acciones (actualizar contraseña, marcar token usado, enviar correo) pero no retorna explícitamente un `okResponse` (falta respuesta consistente al cliente).
- `AuthService.refreshToken` captura errores de `jwtService.verify` y llama a `internalServerError(...)` pero la ejecución continúa; idealmente debe retornar/arrojar una excepción clara (`badRequestError` o `unauthorizedError`).
- Algunas estrategias OAuth y usos de `any` (por ejemplo `profile: any`) están sin tipar; se recomienda crear interfaces `GoogleProfile`, `GithubProfile`, `FacebookProfile`.
- `synchronize: true` en `TypeOrmModule.forRoot` (en `src/app.module.ts`) está habilitado — debe desactivarse en producción y preferir migraciones.
- Controladores vacíos detectados (por ejemplo `tokens` y `credentials` controllers) — evaluar si exponer endpoints administrativos o de verificación.

Si quieres, puedo aplicar parches automáticos para las correcciones prioritarias: sustituir `console.log` por `Logger.debug`, añadir retornos en `resetPasswordToken` y ajustar el manejo de error en `refreshToken`. También puedo tipar estrategias OAuth en un cambio separado si lo autorizas.

## [v0.1.0-beta] - Inicial

### Añadido

- Versión inicial beta con módulos básicos:
  - Autenticación local (registro, login, refresh token, reset password).
  - Gestión de usuarios y roles.
  - Envío de emails con `@nestjs-modules/mailer` y plantillas Handlebars.
  - Internacionalización (`nestjs-i18n`) con locales `en` y `es`.
  - Integración con TypeORM + PostgreSQL.
  - Validación global y documentación Swagger.

---

> Nota: Este changelog resume las entradas más relevantes para las versiones beta. Para releases futuras, se recomienda seguir el formato SemVer y añadir detalles de seguridad y breaking changes cuando apliquen.
