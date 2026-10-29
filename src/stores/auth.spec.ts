import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './auth';

const mocks = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(),
  getSupabaseClient: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: mocks.isSupabaseConfigured,
  getSupabaseClient: mocks.getSupabaseClient,
}));

describe('auth initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.getSupabaseClient.mockReturnValue({
      auth: {
        getSession: mocks.getSession,
        onAuthStateChange: mocks.onAuthStateChange,
      },
      from: mocks.from,
    });
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });
    mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
    mocks.maybeSingle.mockResolvedValue({
      data: null,
      error: new Error('Temporary profile lookup failure'),
    });
  });

  it('subscribes to auth changes even when the initial profile lookup fails', async () => {
    const auth = useAuthStore();

    await auth.initialize();

    expect(auth.status).toBe('error');
    expect(auth.isAuthenticated).toBe(true);
    expect(mocks.onAuthStateChange).toHaveBeenCalledOnce();
  });
});
