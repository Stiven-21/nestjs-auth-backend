### Find All Users (Dynamic Query)

GET /users?page=1&limit=10&sort=name ASC&email=test@test.com

Este endpoint utiliza el `DynamicQueryService` para permitir filtrado, paginación y ordenamiento dinámico.

**Query Parameters:**

- `page`: Número de página (mínimo 1).
- `limit`: Cantidad de registros por página (mínimo 10).
- `sort`: Campo y dirección de ordenamiento (ej: `name ASC`, `email DESC`).
- `[field]`: Filtros dinámicos basados en las columnas de la entidad (ej: `email=gmail`, `name=John`).

**Request Example:**
`GET /users?page=1&limit=10&sort=id DESC&name=John`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "john.doe@example.com",
      "name": "John",
      "lastname": "Doe",
      "role": {
        "id": 1,
        "name": "admin"
      }
    }
  ],
  "meta": {
    "total": 1
  },
  "error": null
}
```

**Error Response (Ejemplo: Paginación inválida):**

```json
{
  "success": false,
  "data": null,
  "meta": null,
  "error": {
    "code": "BAD_REQUEST",
    "message": "The page must be a positive integer"
  }
}
```
