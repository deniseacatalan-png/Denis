import { createBrowserClient } from "@supabase/ssr";

const env = import.meta.env || {};
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
