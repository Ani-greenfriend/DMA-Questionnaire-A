import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// createClient() throws synchronously on a missing/invalid URL, which would
// otherwise crash the whole app at module load — before React can render
// anything — leaving a blank page with no clue why. Surface it as data instead
// so the UI can show a real message (see App.jsx's 'config-error' status).
export const supabaseConfigError = !url || !key
  ? 'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY environment variables.'
  : null;

export const supabase = supabaseConfigError ? null : createClient(url, key);
