# Backend Framework Blueprint

## 1. Backend Philosophy
The backend is built around **Supabase** acting as the absolute single source of truth. We do not build massive Node.js/Express monoliths. We rely on Supabase for Auth, Database (PostgreSQL), Storage, and direct client queries. We only use Serverless Functions (Next.js API Routes / Edge Functions) for hidden secrets, AI orchestration, and complex multi-row transactions.

## 2. Authentication (GoTrue)
- **Flow**: All auth is handled via Supabase Auth.
- **Client Access**: The frontend retrieves the session via `supabase.auth.getSession()`.
- **User IDs**: Every user-owned table MUST contain a `user_id` column referencing `auth.users(id)`. This is non-negotiable.

## 3. Serverless API Routes (The BFF)
Next.js API routes (`/api/*`) are used exclusively for:
1. **AI Orchestration**: Hiding LLM API keys (OpenAI, Google GenAI, OpenRouter) from the client.
2. **Webhooks**: Listening to Stripe, GitHub, or 3rd party events.
3. **Complex Transactions**: Operations that require multiple inserts/updates where exposing the logic to the client poses a security risk or race condition.
- **Security Rule**: Every API route must explicitly verify the user's session token sent from the client before executing logic.

## 4. Supabase Client Strategy
- **Client Components (`@supabase/ssr` or `supabase-js`)**: Used for 90% of data fetching.
- **Service Role Key**: ONLY used in strict backend environments (Edge Functions / API Routes) when a system-level override is required (e.g., a cron job syncing data). Never expose the service role key to the client.

## 5. Storage (Supabase Buckets)
- **Buckets**: Organized logically (e.g., `avatars`, `attachments`).
- **Access Control**: Use Storage RLS policies. E.g., `(bucket_id = 'avatars' AND auth.uid() = user_id)`.
- **Delivery**: Always use Supabase public URLs or signed URLs for rendering images in the UI to leverage their CDN.

## 6. Realtime Subscriptions
- Use Supabase Realtime sparingly for chat apps or live dashboards. Do not turn on Realtime for every table as it drains connection limits. Always unsubscribe in the `useEffect` cleanup.
