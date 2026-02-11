# 🐳 Docker Setup

NestAuth can run with Docker and Docker Compose.

---

## Example docker-compose.yml

```yaml
version: '3.9'

services:
  api:
    build: .
    ports:
      - '8000:8000'
    env_file:
      - .env
    depends_on:
      - db

  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: auth_db
    ports:
      - '5432:5432'
```

````

---

## Run Docker

```bash
docker compose up --build
```

---

## Notes

- Ensure `.env` file exists before running
- Adjust DB_HOST to `db` when using Docker
- Use production-ready secrets in production

```

---

✅ All documentation files are ready to copy into:

```

docs/environment.md
docs/oauth.md
docs/mail.md
docs/docker.md

```

```
````
