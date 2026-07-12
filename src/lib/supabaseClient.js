import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly at startup rather than silently breaking every query later —
  // easier to debug than a wall of "fetch failed" errors from a null client.
  throw new Error(
    'Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file (see .env.example).',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)