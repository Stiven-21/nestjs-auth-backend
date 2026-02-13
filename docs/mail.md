# 📧 Mail Configuration

NestAuth uses SMTP for transactional email delivery.

Mail configuration is mandatory for features that require email communication. Without a properly configured mail provider, the system cannot verify accounts, process password recovery, or send security-related notifications.

---

## ⚙️ Required Environment Variables

The following variables must be defined to enable mail functionality:

```env
MAIL_HOST=
MAIL_PORT=
MAIL_SECURE=
MAIL_USER=
MAIL_PASSWORD=
DEFAULT_REMITTER_MAIL=
```

### Validation Rules

- All mail variables are required.
- If any variable is missing, the application will fail during startup.
- Partial configurations are not allowed.

---

## 🔐 Variable Description

| Variable              | Description                                                    |
| --------------------- | -------------------------------------------------------------- |
| MAIL_HOST             | SMTP server host                                               |
| MAIL_PORT             | SMTP server port (see supported ports below)                   |
| MAIL_SECURE           | Use TLS connection (true for implicit TLS, false for STARTTLS) |
| MAIL_USER             | SMTP authentication username                                   |
| MAIL_PASSWORD         | SMTP authentication password                                   |
| DEFAULT_REMITTER_MAIL | Default sender email address                                   |

---

## 🔌 Supported SMTP Ports

NestAuth supports the standard SMTP ports:

- **465** → Implicit TLS (recommended for secure connections)
- **587** → STARTTLS (recommended alternative)
- **25** → Not recommended for production environments

### Port and Security Mapping

| Port | MAIL_SECURE Value | Recommendation  |
| ---- | ----------------- | --------------- |
| 465  | true              | Recommended     |
| 587  | false             | Recommended     |
| 25   | false             | Not recommended |

Using secure ports (465 or 587) is strongly recommended in all environments.

---

## 📩 Example: Gmail Configuration

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
DEFAULT_REMITTER_MAIL=no-reply@yourdomain.com
```

If using Gmail:

- Enable 2-Step Verification
- Generate an App Password
- Do not use your primary account password

---

## ✉️ Features That Depend on Mail

The following features require a working mail configuration:

- Account email verification
- Password reset and recovery
- Email change confirmation
- Risk or security notifications

If mail is not configured, these features cannot function.

---

## 🚀 Production Recommendations

For production environments:

- Use a dedicated transactional email provider (e.g., SendGrid, Mailgun, Amazon SES)
- Store credentials securely using environment variables or secret managers
- Configure SPF, DKIM, and DMARC for your domain
- Ensure outbound SMTP ports (465 or 587) are allowed by your hosting provider or firewall
- Use environment-specific credentials for staging and production

Mail configuration is a critical part of the authentication system and should be properly secured in all environments.
