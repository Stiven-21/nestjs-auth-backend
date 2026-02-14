# 🌱 Database Seeders Documentation

## 📌 Overview

Seeders are scripts used to populate the database with initial or required data.

In this project, seeders are used to:

- Populate system identity types (CC, TI, NIT, etc.)
- Create default roles (e.g., SUPER_ADMIN, ADMIN, USER)
- Create an initial SUPER_ADMIN user via environment variables
- Initialize system policies (e.g., Password Policy)

Seeders are **idempotent**, meaning they can be executed multiple times without creating duplicate records.

---

# 🏗 Seeder Architecture

```
src/
 └── database/
     ├── data-source.ts
     ├── migrations/
     └── seeders/
          ├── seed.ts
          ├── identity-types.seeder.ts
          ├── role.seeder.ts
          ├── user.seeder.ts
          └── policity-password.seeder.ts
```

---

# 🚀 How to Run Seeders

## 1️⃣ Make sure migrations were executed first

```bash
pnpm migration:run
```

## 2️⃣ Configure Environment Variables

The super admin seeder requires the following variables in your `.env` file:

```env
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=strongpassword123
```

## 3️⃣ Run seeders

```bash
pnpm seed
```

The script initializes the DataSource, runs all seeders sequentially, and then closes the connection.

---

# 🔁 Seeder Execution Flow

When running `pnpm seed`, the system executes:

1.  **Identity Types Seeder**: Populates the `IdentityType` entity with standard Colombian identification types (CC, TI, CE, NIT, etc.).
2.  **Role Seeder**: Creates base roles (`super_admin`, `admin`, `user`) with their respective permissions.
3.  **User Seeder**:
    - Checks if a `super_admin` exists.
    - If not, creates one using `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`.
    - Validates email format and password length (8-32 characters).
    - Hashes the password using bcrypt.
4.  **Policy Password Seeder**: Initializes the default password policy if it doesn't exist.

---

# 🔐 Security Notes

- Passwords are hashed using **bcrypt** (10 rounds) before saving.
- Credentials MUST be provided through environment variables.
- Seeders perform existence checks to prevent duplicate insertions or errors.

---

# ⚠ Common Errors

## ❌ Missing Environment Variables

If `SUPER_ADMIN_EMAIL` or `SUPER_ADMIN_PASSWORD` are not set, the user seeder will skip creation and log an error.

## ❌ DataSource not initialized

Ensure `AppDataSource.initialize()` is called (handled automatically in `seed.ts`).

## ❌ Relation not found

Ensure migrations were executed before running seeders to create the necessary tables.

---

# 🏆 Best Practices

- Keep seeders modular (one per domain/entity).
- Make seeders idempotent.
- Always run migrations before seeders.
- Avoid inserting large fake datasets in production.

---

# 🔄 Recommended Local Setup Flow

When cloning the repository:

```bash
pnpm install
pnpm migration:run
pnpm seed
pnpm start:dev
```

---

# ✅ Summary

Seeders provide a controlled, repeatable way to initialize the system with required data. They are safe to re-run and designed to support development and staging environments efficiently.
