import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

function describeEnvVar(name, value) {
  if (!value) return `${name}: MISSING`;
  return `${name}: present (${value.length} chars, starts "${value.slice(0, 12)}…")`;
}

// createClient() throws synchronously on a missing/invalid URL, which would
// otherwise crash the whole app at module load — before React can render
// anything — leaving a blank page with no clue why. Surface it as data instead
// so the UI can show a real message (see App.jsx's 'config-error' status).
// The per-variable breakdown (vs. a flat "missing" string) is deliberate: it's
// the only way to tell, from the deployed page itself, which of the two is
// actually absent at build time when a Netlify deploy's env vars don't behave
// as the dashboard says they should.
export const supabaseConfigError = !url || !key
  ? `${describeEnvVar('VITE_SUPABASE_URL', url)} / ${describeEnvVar('VITE_SUPABASE_ANON_KEY', key)}`
  : null;

export const supabase = supabaseConfigError ? null : createClient(url, key);
