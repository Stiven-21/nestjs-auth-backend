### Find One Audit Log

GET /audit-log/:id

Response:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "event": "USER_LOGIN",
    "description": "User logged into the system",
    "ip": "127.0.0.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2026-02-10T20:00:00.000Z",
    "userId": 1
  },
  "meta": null,
  "error": null
}
```
