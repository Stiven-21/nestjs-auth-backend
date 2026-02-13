# 🐳 Docker Setup

NestAuth can run using Docker and Docker Compose. This setup provisions both the NestJS API and a PostgreSQL database in isolated containers, ensuring a consistent development and deployment environment.

---

## Requirements

- Docker Engine 24+
- Docker Compose v2+

---

## Services Overview

- **api** → NestJS application container
- **db** → PostgreSQL database container

---

## docker-compose.yml

```yaml
services:
  api:
    container_name: nest-auth
    build:
      context: .
      dockerfile: Dockerfile
    image: nest-auth:latest
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - '${APP_PORT}:${APP_PORT}'
    depends_on:
      db:
        condition: service_healthy

  db:
    container_name: auth_db
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_DATABASE}
    expose:
      - '5432'
    volumes:
      - nest_auth_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USERNAME} -d ${DB_DATABASE}']
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  nest_auth_postgres_data:
```

---

## Environment Configuration

Create a `.env` file in the project root before running Docker.

### Example `.env`

```env
APP_PORT=3000

DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=nest_auth
```

When running inside Docker, the database host must be set to `db`, which matches the service name defined in `docker-compose.yml`.

---

## Start Containers

Build and start all services:

```bash
docker compose up --build
```

Or using the project script:

```bash
pnpm docker:up
```

---

## Stop Containers

Stop and remove containers:

```bash
docker compose down
```

Or using the project script:

```bash
pnpm docker:down
```

---

## Data Persistence

PostgreSQL data is stored in a named Docker volume:

```
nest_auth_postgres_data
```

This ensures that database data persists even if containers are removed.

---

## Production Considerations

For production environments:

- Use strong, secure credentials
- Avoid using the `latest` tag for images
- Configure proper backup strategies for the database volume
- Consider adding a reverse proxy (e.g., NGINX or Traefik)
- Enable HTTPS at the infrastructure level

---

## Troubleshooting

If the API cannot connect to the database:

- Ensure `DB_HOST=db`
- Verify the `.env` file is correctly loaded
- Check container status with:

```bash
docker compose ps
```

To view logs:

```bash
docker compose logs -f
```

---

Your NestAuth application should now be running in a fully containerized environment.
