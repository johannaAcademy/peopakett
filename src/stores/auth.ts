import { defineStore } from 'pinia';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase';

type AuthStatus = 'loading' | 'ready' | 'unconfigured' | 'error';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    status: 'loading' as AuthStatus,
    user: null as User | null,
    fullName: '',
    error: '',
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
    email: (state) => state.user?.email ?? '',
  },
  actions: {
    setSession(session: Session | null) {
      this.user = session?.user ?? null;
      if (!this.user) {
        this.fullName = '';
      }
    },
    async loadProfile() {
      if (!this.user) {
        this.fullName = '';
        return;
      }

      const { data, error } = await getSupabaseClient()
        .from('profiles')
        .select('full_name')
        .eq('id', this.user.id)
        .maybeSingle();
      if (error) {
        throw new Error(`Profiili laadimine ebaõnnestus: ${error.message}`);
      }
      if (!data) {
        throw new Error('Kasutajaprofiili ei leitud. Palun logi välja ja proovi uuesti.');
      }
      this.fullName = data.full_name ?? '';
    },
    async initialize() {
      if (this.initialized) {
        return;
      }
      this.initialized = true;

      if (!isSupabaseConfigured()) {
        this.status = 'unconfigured';
        return;
      }

      try {
        const client = getSupabaseClient();
        const { data, error } = await client.auth.getSession();
        if (error) {
          throw error;
        }
        this.setSession(data.session);
        this.status = 'ready';

        client.auth.onAuthStateChange((_event, session) => {
          this.setSession(session);
          this.status = 'ready';
          this.error = '';
          window.setTimeout(() => {
            void this.loadProfile().catch((error: unknown) => {
              this.error = this.errorMessage(error);
            });
          }, 0);
        });

        if (this.user) {
          await this.loadProfile();
        }
      } catch (error) {
        this.status = 'error';
        this.error = this.errorMessage(error);
      }
    },
    async signIn(email: string, password: string) {
      this.error = '';
      try {
        const { data, error } = await getSupabaseClient().auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          throw error;
        }
        this.setSession(data.session);
        await this.loadProfile();
      } catch (error) {
        this.error = this.errorMessage(error);
        throw error;
      }
    },
    async signUp(email: string, password: string, fullName: string) {
      this.error = '';
      try {
        const { data, error } = await getSupabaseClient().auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });
        if (error) {
          throw error;
        }
        this.setSession(data.session);
        if (data.session) {
          await this.loadProfile();
        }
        return data;
      } catch (error) {
        this.error = this.errorMessage(error);
        throw error;
      }
    },
    async requestPasswordReset(email: string) {
      this.error = '';
      try {
        const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/account/reset`,
        });
        if (error) {
          throw error;
        }
      } catch (error) {
        this.error = this.errorMessage(error);
        throw error;
      }
    },
    async updatePassword(password: string) {
      this.error = '';
      try {
        const { error } = await getSupabaseClient().auth.updateUser({ password });
        if (error) {
          throw error;
        }
      } catch (error) {
        this.error = this.errorMessage(error);
        throw error;
      }
    },
    async updateFullName(fullName: string) {
      if (!this.user) {
        throw new Error('Profiili muutmiseks logi sisse.');
      }

      this.error = '';
      try {
        const value = fullName.trim();
        if (value.length < 2 || value.length > 80) {
          throw new Error('Nimi peab olema 2–80 tähemärki pikk.');
        }
        const { error } = await getSupabaseClient()
          .from('profiles')
          .update({ full_name: value })
          .eq('id', this.user.id);
        if (error) {
          throw error;
        }
        this.fullName = value;
      } catch (error) {
        this.error = this.errorMessage(error);
        throw error;
      }
    },
    async signOut() {
      this.error = '';
      try {
        const { error } = await getSupabaseClient().auth.signOut();
        if (error) {
          throw error;
        }
        this.setSession(null);
      } catch (error) {
        this.error = this.errorMessage(error);
        throw error;
      }
    },
    errorMessage(error: unknown): string {
      if (error instanceof Error || isAuthError(error)) {
        return error.message;
      }
      return 'Toiming ebaõnnestus ootamatu vea tõttu. Proovi uuesti.';
    },
  },
});

const isAuthError = (error: unknown): error is AuthError =>
  typeof error === 'object' &&
  error !== null &&
  'message' in error &&
  typeof error.message === 'string';
