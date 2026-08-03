# Database Framework

## Source of Truth
Supabase / PostgreSQL is the source of truth for persisted data.

## Database Rules
- One canonical schema.
- No duplicate tables for the same concept.
- Use foreign keys correctly.
- Use timestamps consistently.
- Use RLS on every user-owned table.
- Add indexes for common queries.
- Use triggers where update timestamps are needed.
- Use enums or CHECK constraints when appropriate.

## Storage
Any image or file flow must define:
- bucket
- object path convention
- storage policy
- metadata table
- read path
- delete path

## Required Validation
Before accepting a schema:
- every frontend feature must have a storage location
- every write must have a matching read
- every owned record must be protected by auth.uid()
- every bucket must have matching policies
