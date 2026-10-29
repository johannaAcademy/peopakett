import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

let client: SupabaseClient<Database> | null = null;

export const isSupabaseConfigured = (): boolean =>
  Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (client) {
    return client;
  }

  const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: anonKey } = import.meta.env;
  if (!url || !anonKey) {
    throw new Error('Supabase pole seadistatud. Lisa VITE_SUPABASE_URL ja VITE_SUPABASE_ANON_KEY.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('VITE_SUPABASE_URL ei ole korrektne URL.');
  }
  if (
    parsedUrl.protocol !== 'https:' &&
    !(parsedUrl.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsedUrl.hostname))
  ) {
    throw new Error('Supabase URL peab kasutama HTTPS-i (kohalikus arenduses on HTTP lubatud).');
  }

  client = createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return client;
};
