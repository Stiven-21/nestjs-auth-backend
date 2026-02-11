### Get Current Profile

GET /users/profile/me

Response:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@test.com",
    "name": "John",
    "lastname": "Doe",
    "document": "123456789",
    "role": {
      "id": 1,
      "name": "admin"
    },
    "oauth": {
      "id": 1,
      "provider": "google",
      "providerId": "123456789",
      "avatar": "https://example.com/avatar.jpg"
    }
  },
  "meta": null,
  "error": null
}
```
