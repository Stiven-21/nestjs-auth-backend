# 🔑 OAuth Setup Guide

NestAuth supports OAuth with:

- Google
- Facebook
- GitHub

OAuth configuration is required. Configure at least one provider and `OAUTH_STATE_SECRET`.

---

## 🌐 Google OAuth Setup

1. Go to Google Cloud Console
2. Create OAuth Credentials
3. Add authorized redirect URI:

```

[http://localhost:8000/api/v1/auth/google/callback](http://localhost:8000/api/v1/auth/google/callback)

```

4. Set environment variables:

```

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

```

---

## 📘 Facebook OAuth Setup

1. Go to Facebook Developers
2. Create App
3. Add Facebook Login product
4. Configure redirect URI

```

[http://localhost:8000/api/v1/auth/facebook/callback](http://localhost:8000/api/v1/auth/facebook/callback)

```

---

## 🐙 GitHub OAuth Setup

1. Go to GitHub Developer Settings
2. Create OAuth App
3. Set Authorization callback URL

```

[http://localhost:8000/api/v1/auth/github/callback](http://localhost:8000/api/v1/auth/github/callback)

```
