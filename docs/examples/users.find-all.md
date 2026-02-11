### Find All Users

GET /users

Response:

```json
{
  "statusCode": 200,
  "message": "Success",
  "description": "The request has been successfully completed.",
  "data": {
    "data": [
      {
        "id": 1,
        "email": "admin@test.com",
        "name": "Admin",
        "lastname": "User",
        "role": "admin"
      },
      {
        "id": 2,
        "email": "user@test.com",
        "name": "Regular",
        "lastname": "User",
        "role": "user"
      }
    ],
    "total": 2
  }
}
```
