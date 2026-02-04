# 🔐 Security Policy — NEST AUTH

## 📢 Reporting a Vulnerability

Security is a top priority for **NEST AUTH**. If you discover a security vulnerability, **please do not open a public issue**.

Instead, report it responsibly using one of the private channels below.

### 📬 Supported Reporting Channels

- 🐙 **GitHub (preferred):** contact the maintainer directly via profile
  👉 [https://github.com/Stiven-21](https://github.com/Stiven-21)

<!--
- 📧 **Email:** security@openauth.dev _(to be enabled)_
-->

When submitting a report, please include as much of the following information as possible:

- Clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact and attack scenarios
- Affected version(s)
- Proof of concept (if available)

---

## ⏱️ Response & Disclosure Process

Once a vulnerability report is received, the following process is followed:

1. **Acknowledgement** within approximately **48 hours**.
2. **Triage & severity assessment** (Low / Medium / High / Critical).
3. **Patch development and validation**.
4. **Release of a security fix** and notification to the reporter.

Coordinated disclosure is encouraged. Public disclosure should only occur **after a fix has been released**.

Response times may vary depending on the severity and complexity of the issue.

---

## 📌 Supported Versions

Only the versions listed below currently receive security updates.

| Version range | Status           | Notes                    |
| ------------- | ---------------- | ------------------------ |
| v0.4.x        | ✅ Supported     | Active beta release line |
| < v0.4        | ❌ Not supported | No security patches      |

> ⚠️ Only supported versions receive security fixes. Users are strongly encouraged to upgrade.

---

## 🚀 Security Fixes & Release Flow

Security patches follow the project’s release strategy:

- **Critical vulnerabilities** → immediate patch release (e.g. `v0.2.3`)
- **High severity issues** → patched in the next minor/patch release
- **Medium / Low severity** → bundled with regular maintenance releases

All security-related fixes are:

- Released as **patch versions** whenever possible
- Documented in the **CHANGELOG** with appropriate security notes
- Backported only to **supported versions**

---

## 🛡️ Security Practices

NEST AUTH applies the following security measures by default:

- Secure password hashing
- JWT access tokens with expiration
- Separate refresh token strategy
- Per-user token signing
- Role- and permission-based access control (guards)
- Strict input validation
- Clear separation between local and OAuth credentials

Despite these measures, **no system is 100% secure**, which is why continuous review and responsible disclosure are essential.

---

## 🤝 Security Acknowledgements

Responsible security research and disclosure are welcome.

With the reporter’s consent, security contributors may be acknowledged in:

- Release notes / changelog
- Project documentation

---

## 📄 Scope

This security policy applies **only** to the official **NEST AUTH** repository and its source code.

It does **not** cover:

- Insecure deployments
- Misconfiguration by end users
- Forks or third-party modifications

---

Thank you for helping keep **NEST AUTH** secure for everyone.
