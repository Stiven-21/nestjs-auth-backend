# 📧 Mail Configuration

NestAuth supports transactional email sending.

---

## Supported Providers

You can configure any SMTP provider.

Example for Gmail:

```

MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=[your_email@gmail.com](mailto:your_email@gmail.com)
MAIL_PASSWORD=your_app_password
DEFAULT_REMITTER_MAIL=[no-reply@yourdomain.com](mailto:no-reply@yourdomain.com)

```

⚠️ If using Gmail, enable App Passwords instead of your real password.

---

## Features Using Mail

- Email verification
- Password reset
- Email change confirmation
- Security notifications

La configuración de correo es obligatoria para el funcionamiento de estas características.
