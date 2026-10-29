import { createPinia, setActivePinia } from 'pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isSupabaseConfigured, getSupabaseClient } from './supabase';
import { useAuthStore } from '@/stores/auth';

describe('Supabase setup', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reports an actionable setup state when the public environment is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    setActivePinia(createPinia());

    expect(isSupabaseConfigured()).toBe(false);
    expect(() => getSupabaseClient()).toThrow('Supabase pole seadistatud');

    const auth = useAuthStore();
    await auth.initialize();
    expect(auth.status).toBe('unconfigured');
  });
});
