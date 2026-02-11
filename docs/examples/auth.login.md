### Login

POST /auth/login

Request:

```json
{
  "email": "user@test.com",
  "password": "Password123!"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email": "user@test.com",
    "user": "user",
    "role": "admin",
    "permissions": ["all"]
  },
  "meta": null,
  "error": null
}
```
