# Kysely Migration Example

A minimal, working example of [Kysely's migration system](https://kysely.dev/docs/migrations). Demonstrates a complete database schema setup with two related tables: `authors` and `books`, including a foreign key constraint.

In this example we use SQLite for simplicity, but the same principles apply to other databases supported by Kysely (PostgreSQL, MySQL, etc.).

## Overview

This project shows how to structure and run Kysely migrations in a TypeScript project.

## How Migrations Work

Each migration file exports two functions:

- **`up`:** Applies the migration (creates tables, adds columns, etc.)
- **`down`:** Reverts it (drops tables, removes columns, etc.)

Kysely runs migrations in **alphabetical order by filename**, so naming conventions matter. Using a date prefix (`YYYY-MM-DD`) is the recommended approach to keep them ordered chronologically.

> ⚠️ **Important:** If two migration files share the same date prefix, make sure their suffixes sort correctly. An incorrect alphabetical order can cause migrations to run out of sequence or fail unexpectedly.

## Getting Started

1. Install dependencies:
```bash
   npm install
```

2. Run migrations:
```bash
   npm run migrate:up
```

3. To roll back:
```bash
   npm run migrate:down
```

*(Adjust commands to match your actual scripts.)*

## Further Reading

- [Kysely Migration Docs](https://kysely.dev/docs/migrations)