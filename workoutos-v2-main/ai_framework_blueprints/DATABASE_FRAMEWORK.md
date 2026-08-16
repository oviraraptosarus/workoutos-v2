# Database Framework Blueprint

## 1. Single Source of Truth
PostgreSQL (via Supabase) is the absolute single source of truth for all structured application data.

## 2. Table Design & Normalization
- **Primary Keys**: Every table must have an `id` column (UUID, default `gen_random_uuid()`).
- **Foreign Keys**: Always enforce referential integrity.
  - Example: `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`.
- **Timestamps**: Every table should have `created_at` (default `now()`) and `updated_at`.
- **Soft Deletes**: Avoid soft deletes unless auditing is legally required. Use `ON DELETE CASCADE` aggressively to prevent orphaned rows and keep the database clean.

## 3. Row Level Security (RLS)
Security lives in the database, not the API. RLS must be enabled on EVERY table.
- **Select Policies**: `(auth.uid() = user_id)`
- **Insert Policies**: `(auth.uid() = user_id)`
- **Update Policies**: `(auth.uid() = user_id)`
- **Delete Policies**: `(auth.uid() = user_id)`
- **Bypass**: Only the `service_role` key (used strictly in backend Node environments) bypasses RLS.

## 4. Migrations & Drift Control
- **Never mutate schema directly in the UI**: Schema changes must be written as SQL migration files.
- **Idempotency**: Migrations should be idempotent if possible (e.g., `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
- **Data Types**: 
  - Use `text` for strings, `jsonb` for unstructured data or arrays of objects.
  - Use `boolean` for toggles, `timestamp with time zone` for dates.
  - Avoid ENUMs in Postgres unless the list is perfectly immutable; use `text` with application-level validation or a check constraint for flexibility.

## 5. Fetching (PostgREST)
- Do not write massive SQL joins in the database. Use Supabase's PostgREST syntax on the frontend to fetch relational data:
  ```ts
  const { data } = await supabase.from('projects').select('*, tasks(*)');
  ```
- **Error Handling**: Every Supabase query MUST be checked for errors.
  ```ts
  const { data, error } = await supabase.from('x').select();
  if (error) throw new Error(`DB Error: ${error.message}`);
  ```
