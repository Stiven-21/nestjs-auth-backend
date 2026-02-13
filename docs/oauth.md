# 🔑 OAuth Setup Guide

NestAuth provides optional OAuth authentication with support for:

- Google
- Facebook
- GitHub

OAuth can be used for:

- User registration
- User login
- Linking an existing account to an OAuth provider

At least one provider must be fully configured to enable OAuth functionality.

---

## 🔐 OAUTH_STATE_SECRET

```env
OAUTH_STATE_SECRET=your_secure_random_secret
```

This secret is required when OAuth is enabled.

It is used to:

- Validate the OAuth `state` parameter
- Prevent CSRF attacks
- Generate encrypted linking tokens for secure account linking

The value must be strong, random, and different across environments.

---

## ⚙️ Provider Configuration Rules

Each provider requires three environment variables:

- CLIENT_ID / APP_ID
- CLIENT_SECRET / APP_SECRET
- CALLBACK_URL

Although these variables are optional globally, the system enforces strict validation:

- If none of the provider variables are defined → the provider is disabled.
- If one variable is defined → all three must be defined.
- Partial configurations will cause the application to fail during startup.

This validation applies independently to Google, Facebook, and GitHub.

---

# 🌐 Google OAuth Setup

## 1️⃣ Create OAuth Credentials

1. Go to **Google Cloud Console**
2. Navigate to **APIs & Services → Credentials**
3. Create **OAuth 2.0 Client ID**

## 2️⃣ Add Authorized Redirect URI

```
http://localhost:8000/api/v1/auth/google/callback
```

Replace `localhost` with your production backend domain when deploying.

## 3️⃣ Environment Variables

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback
```

---

# 📘 Facebook OAuth Setup

## 1️⃣ Create App

1. Go to **Facebook Developers**
2. Create a new App
3. Add the **Facebook Login** product

## 2️⃣ Configure Redirect URI

```
http://localhost:8000/api/v1/auth/facebook/callback
```

## 3️⃣ Environment Variables

```env
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=http://localhost:8000/api/v1/auth/facebook/callback
```

---

# 🐙 GitHub OAuth Setup

## 1️⃣ Create OAuth App

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps**
2. Create a new OAuth App

## 2️⃣ Set Authorization Callback URL

```
http://localhost:8000/api/v1/auth/github/callback
```

## 3️⃣ Environment Variables

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:8000/api/v1/auth/github/callback
```

---

# 🚀 OAuth Endpoints

## 🔓 Register / Login with OAuth

Authentication is handled through:

```
GET /api/v1/auth/{provider}
```

Example:

```
GET /api/v1/auth/google
```

This endpoint supports both:

- New user registration
- Existing user login

The provider determines whether the user should be created or authenticated.

---

## 🔗 Link OAuth to Existing Account

Authenticated users can link an OAuth provider to their existing account using:

```
GET /api/v1/auth/link/{provider}
```

Example:

```
GET /api/v1/auth/link/google
```

### Linking Behavior

- The currently authenticated user initiates the linking process.
- An encrypted state token is generated using `OAUTH_STATE_SECRET`.
- After successful OAuth validation, the provider account is attached to the existing user.
- Email addresses do not need to match.

This mechanism allows flexible account linking regardless of provider email differences.

---

# 🔄 Callback Flow

After authentication, the provider redirects to:

```
/api/v1/auth/{provider}/callback
```

The callback URL must exactly match the value configured in:

```
{PROVIDER}_CALLBACK_URL
```

The backend then:

1. Validates the OAuth response
2. Validates the encrypted state
3. Registers, authenticates, or links the account
4. Returns the appropriate authentication response

---

# 🔐 Production Recommendations

For production environments:

- Always use HTTPS
- Use strong, unique secrets
- Do not commit OAuth credentials
- Ensure callback URLs match the deployed backend domain
- Rotate secrets when necessary

---

OAuth is fully modular. Providers can be enabled or disabled independently based on environment configuration.
