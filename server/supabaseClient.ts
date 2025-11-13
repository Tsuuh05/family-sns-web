import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('SUPABASE_ANON_KEY');
  
  throw new Error(
    `[Supabase] Missing required environment variables: ${missingVars.join(', ')}. ` +
    `Please set these variables in your deployment environment.`
  );
}

console.log('[Supabase] Initialized successfully with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
