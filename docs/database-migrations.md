# Database Migrations Guide

This project uses TypeORM to manage database schema changes through migrations.

Migrations ensure controlled, versioned, and reproducible database evolution across environments.

---

# 🔎 Core Principles

- `synchronize: true` is strictly forbidden in production.
- All schema changes must go through migrations.
- Migrations must be committed to version control.
- Never edit a migration after it has been executed in production.

---

# 📌 Available Commands

## Generate a Migration (Automatic)

```bash
pnpm migration:generate src/database/migrations/DescriptiveName
```

### When to Use

- After creating a new entity
- After modifying a column
- After adding relationships
- After changing indexes

### What It Does

- Compares current entities with the database
- Generates SQL required to synchronize differences
- Creates a timestamped migration file

### Important

Always review the generated SQL before running it.

---

## Run Migrations

```bash
pnpm migration:run
```

### When to Use

- After generating a migration
- During application startup in production
- Inside CI/CD pipelines

### What It Does

- Executes all pending migrations
- Records executed migrations in the `migrations` table

---

## Revert Last Migration

```bash
pnpm migration:revert
```

### When to Use

- To undo a faulty migration
- During development rollback

⚠️ Only reverts the most recent migration.

---

## Create Empty Migration (Manual)

```bash
pnpm migration:create src/database/migrations/CustomMigration
```

### When to Use

- Complex SQL operations
- Custom index creation
- Data seeding
- Engine-specific optimizations

This command creates an empty migration file.
You must manually implement the `up()` and `down()` methods.

---

# 🚀 Standard Development Workflow

1. Modify or create entities.
2. Generate migration:

```bash
pnpm migration:generate src/database/migrations/UpdateFeature
```

3. Review generated SQL.
4. Execute migration:

```bash
pnpm migration:run
```

---

# 🏭 Production Workflow

In production environments:

```bash
pnpm migration:run
```

Never:

- Use `synchronize: true`
- Generate migrations in production
- Modify schema manually

---

# ⚠️ Common Errors & Solutions

## "No changes in database schema were found"

### Cause

- Database already matches entities
- Wrong database connection
- Entities not detected

### Solution

- Verify environment variables
- Confirm database connection
- Check entities path configuration

---

## "Migration executed successfully but no tables created"

### Cause

- Migration file is empty
- Connected to the wrong database

### Solution

- Inspect migration `up()` method
- Verify DB host, port, and name

---

## "Unknown arguments: d"

### Cause

- Incorrect script configuration for `migration:create`

### Solution

- Ensure `migration:create` does not use `-d`

---

# 🧠 Best Practices

- One logical change per migration
- Use descriptive migration names
- Review SQL before execution
- Never modify executed migrations
- Keep migrations under version control

---

# 🔐 Environment Strategy

Recommended structure:

```
.env.development
.env.test
.env.production
```

Migration execution should always use the environment-specific configuration.

---

# 🏗 CI/CD Recommendation

Before application startup in production pipeline:

```bash
pnpm migration:run
```

This guarantees schema consistency before service boot.

---

# 🎯 Summary

Migrations are the single source of truth for database structure.
They provide safety, reproducibility, and production stability.

All schema changes must go through this workflow.
