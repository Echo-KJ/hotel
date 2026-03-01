import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for client-side operations
 * Use this in Client Components, hooks, and client-side code
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Singleton instance for client-side usage
 * Import this directly in your components
 */
export const supabase = createClient();
