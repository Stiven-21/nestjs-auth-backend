### Register

POST /auth/register

Request:

```json
{
  "name": "John",
  "lastname": "Doe",
  "documentTypeId": 1,
  "document": "123456789",
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "john.doe@example.com",
    "name": "John",
    "lastname": "Doe"
  },
  "meta": null,
  "error": null
}
```
