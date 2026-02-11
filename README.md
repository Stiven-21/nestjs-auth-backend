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

**NEST AUTH** es un servidor de autenticación de código abierto, modular y extensible, construido con **NestJS**. Está diseñado como una implementación de referencia profesional y una base sólida para plataformas SaaS, proyectos de comercio electrónico y APIs modernas que requieren una autenticación segura y escalable.

> 🎯 **Objetivo:** Proporcionar un sistema de autenticación completo, claro y mantenible, listo para producción y fácil de extender.

---

## 📌 Información General

- **Proyecto:** NEST AUTH
- **Tipo:** Backend / Servidor de Autenticación
- **Estado:** Beta
- **Versión Actual:** `v0.5.0`
- **Framework:** NestJS
- **Lenguaje:** TypeScript
- **Licencia:** MIT
- **Prefijo Global API:** `/api/v1`

---

## ✨ Características Principales

- 🔑 **Autenticación JWT:** Gestión de Access y Refresh Tokens con rotación.
- 🔐 **Login Local:** Registro e inicio de sesión con correo y contraseña.
- 🌐 **Autenticación OAuth:** Integración con Google, Facebook y GitHub.
- 👤 **Gestión de Usuarios:** Perfiles completos y control de credenciales.
- 🛂 **Roles y Permisos:** Sistema RBAC (Role-Based Access Control) con Guards personalizados.
- 🧩 **Arquitectura Modular:** Código desacoplado y fácil de mantener.
- 🌍 **Internacionalización (i18n):** Soporte nativo para Español e Inglés.
- 📧 **Envío de Correos:** Plantillas dinámicas con Handlebars.
- 🗂️ **Gestión de Sesiones:** Control detallado de dispositivos y sesiones por usuario.
- 📚 **Documentación Automática:** Integración total con Swagger.

---

## 🧠 Filosofía del Proyecto

NEST AUTH no es solo un boilerplate. Es una **implementación de referencia** que busca:

- Servir como una base técnica confiable para productos del mundo real.
- Mostrar las mejores prácticas de NestJS.
- Permitir una extensibilidad modular limpia.
- Mantener límites claros entre autenticación, autorización y lógica de dominio.

---

## 🏗️ Arquitectura de Alto Nivel

El sistema se organiza en módulos desacoplados:

- `auth` → Autenticación, login, tokens, OAuth, 2FA.
- `users` → Gestión de usuarios, perfiles y credenciales.
- `roles` → Control de roles y permisos granulares.
- `sessions` → Gestión de sesiones activas del usuario.
- `mails` → Entrega de correos y plantillas.

* `i18n` → Lógica de internacionalización.

---

## 🔐 Autenticación JWT y Seguridad

- **Tokens:** Access Token + Refresh Token.
- **Estrategia de Firma por Usuario:** Se utiliza un `JWT_SECRET` combinado con un `user_secret` único. Esto permite invalidar todas las sesiones de un usuario específico instantáneamente si es necesario, sin afectar a los demás.
- **Re-autenticación:** Para acciones críticas (como habilitar 2FA o cambiar contraseña), el sistema requiere un flujo de re-autenticación que genera un token temporal de alta seguridad.

---

## 🌐 OAuth & Credenciales Múltiples

NEST AUTH permite que un mismo usuario tenga múltiples métodos de autenticación vinculados a su cuenta.

### Proveedores Soportados

- Google
- Facebook
- GitHub

### Modelo de Credenciales

Un usuario puede registrarse con correo/contraseña y posteriormente vincular sus cuentas de redes sociales, permitiendo una experiencia de usuario flexible y moderna.

---

## 📦 Estándar de Respuestas

Todas las respuestas de la API siguen un formato consistente para facilitar la integración con el frontend.

### Respuesta de Éxito

```json
{
  "statusCode": 200,
  "message": "OK",
  "description": "La operación se completó exitosamente.",
  "data": {
    "data": { ... },
    "total": 1
  }
}
```

### Respuesta de Error

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "description": "Los datos proporcionados no son válidos."
}
```

_El sistema traduce automáticamente los campos `message` y `description` según el idioma del cliente._

---

## 📡 Endpoints Importantes

### Autenticación

- `POST /auth/register`: Registro de nuevos usuarios.
- `POST /auth/sign-in`: Inicio de sesión (soporta detección de dispositivos).
- `POST /auth/refresh-token`: Generación de un nuevo Access Token.
- `POST /auth/re-auth`: Validación de contraseña para acciones sensibles.

### Seguridad y 2FA

- `POST /auth/2fa/enable`: Iniciar activación de 2FA.
- `POST /auth/2fa/verify`: Verificación de código TOTP durante el login.

### Gestión de Usuarios y Sesiones

- `GET /users/profile/me`: Información del usuario actual.
- `POST /auth/logout-device/:deviceId`: Cierre de sesión en un dispositivo específico.
- `POST /auth/logout-all`: Cierre de todas las sesiones activas.

---

## ⚙️ Variables de Entorno

Configura tu archivo `.env` basándote en lo siguiente:

```ini
APP_PORT=8080
NAME_APP=NEST AUTH

# Base de Datos
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=openauth

# Seguridad JWT
JWT_SECRET=tu_secreto_aqui
JWT_REFRESH_SECRET=tu_otro_secreto_aqui

# Configuración Regional
DEFAULT_LOCALE=es
```

---

## 📚 Documentación

NEST AUTH proporciona documentación estructurada para facilitar el uso y mantenimiento:

- 🏗️ **Arquitectura** — [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- 📜 **Changelog** — [`CHANGELOG.md`](CHANGELOG.md)
- 📚 **Swagger UI** — Accesible en `/api/docs` tras iniciar el servidor.

---

## 🤝 Contribuciones y Comunidad

¡Las contribuciones son bienvenidas! Puedes ayudar mediante:

- Reporte de Issues.
- Pull Requests con nuevas funcionalidades o correcciones.
- Revisión de seguridad.
- Mejoras en la documentación.

Por favor, revisa [`CONTRIBUTING.md`](CONTRIBUTING.md) antes de enviar cambios.

---

## 👨‍💻 Autor

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

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
