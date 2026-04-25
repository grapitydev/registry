export const SQLITE_MIGRATIONS_FOLDER = new URL(
  "../drizzle/migrations/sqlite",
  import.meta.url,
).pathname;

export const PG_MIGRATIONS_FOLDER = new URL(
  "../drizzle/migrations/pg",
  import.meta.url,
).pathname;
