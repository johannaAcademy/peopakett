<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const email = ref('');
const password = ref('');
const fullName = ref('');
const pending = ref(false);
const message = ref('');
const formError = ref('');

const mode = computed(() => {
  if (route.path === '/account/reset') return 'password';
  if (route.path.endsWith('/register')) return 'register';
  if (route.path.endsWith('/forgot-password')) return 'reset';
  return 'login';
});

const copy = computed(() => {
  switch (mode.value) {
    case 'register':
      return {
        eyebrow: 'Tee oma peoplaanidele ruumi',
        title: 'Loo konto',
        submit: 'Loo konto',
        switchLabel: 'Konto on juba olemas?',
        switchTo: 'Logi sisse',
        switchPath: '/account/login',
      };
    case 'reset':
      return {
        eyebrow: 'Taasta ligipääs',
        title: 'Saada parooli taastamise link',
        submit: 'Saada taastamise link',
        switchLabel: 'Meenus parool?',
        switchTo: 'Logi sisse',
        switchPath: '/account/login',
      };
    case 'password':
      return {
        eyebrow: 'Uus parool',
        title: 'Määra uus parool',
        submit: 'Uuenda parool',
        switchLabel: 'Soovid sisse logida?',
        switchTo: 'Logi sisse',
        switchPath: '/account/login',
      };
    default:
      return {
        eyebrow: 'Tere tulemast tagasi',
        title: 'Logi sisse',
        submit: 'Logi sisse',
        switchLabel: 'Uus siin?',
        switchTo: 'Loo konto',
        switchPath: '/account/register',
      };
  }
});

const safeRedirect = (): string => {
  const redirect = route.query.redirect;
  if (typeof redirect !== 'string') return '/account';

  try {
    const target = new URL(redirect, window.location.origin);
    if (
      target.origin === window.location.origin &&
      ['/planner', '/account'].includes(target.pathname)
    ) {
      return `${target.pathname}${target.search}${target.hash}`;
    }
  } catch {
    return '/account';
  }
  return '/account';
};

const submit = async () => {
  formError.value = '';
  message.value = '';
  const emailResult = z.string().trim().email('Sisesta kehtiv e-posti aadress.').safeParse(email.value);
  if (mode.value !== 'password' && !emailResult.success) {
    formError.value = emailResult.error.issues[0]?.message ?? 'Kontrolli e-posti aadressi.';
    return;
  }
  if (mode.value === 'register' && fullName.value.trim().length < 2) {
    formError.value = 'Nimi peab olema vähemalt 2 tähemärki.';
    return;
  }
  if (mode.value === 'login' && password.value.length < 1) {
    formError.value = 'Sisesta parool.';
    return;
  }
  if ((mode.value === 'register' || mode.value === 'password') && password.value.length < 12) {
    formError.value = 'Parool peab olema vähemalt 12 tähemärki.';
    return;
  }

  pending.value = true;
  try {
    if (mode.value === 'register') {
      const result = await auth.signUp(email.value.trim(), password.value, fullName.value);
      if (result.session) {
        await router.replace(safeRedirect());
      } else {
        message.value =
          'Konto loomise link saadeti e-postile. Kinnita aadress enne sisselogimist.';
      }
    } else if (mode.value === 'login') {
      await auth.signIn(email.value.trim(), password.value);
      await router.replace(safeRedirect());
    } else if (mode.value === 'reset') {
      await auth.requestPasswordReset(email.value.trim());
      message.value = 'Kui selle aadressiga konto on olemas, saadetakse sinna taastamise link.';
    } else {
      await auth.updatePassword(password.value);
      message.value = 'Parool uuendati. Nüüd saad uue parooliga sisse logida.';
      password.value = '';
    }
  } catch (error) {
    formError.value =
      error instanceof Error ? error.message : 'Toiming ebaõnnestus. Proovi mõne aja pärast uuesti.';
  } finally {
    pending.value = false;
  }
};
</script>

<template>
  <section class="container page-shell auth-page" aria-labelledby="auth-title">
    <div class="auth-card">
      <p class="eyebrow">{{ copy.eyebrow }}</p>
      <h1 id="auth-title">{{ copy.title }}</h1>
      <p class="auth-intro">
        {{ mode === 'register' ? 'Salvesta plaanid ja jätka nendega hiljem.' : 'Sinu salvestatud peoplaanid on seotud sinu kontoga.' }}
      </p>

      <div v-if="auth.status === 'unconfigured'" class="config-message" role="status">
        <strong>Autentimine pole veel seadistatud.</strong>
        <p>
          Lisa projekti juurkausta `.env` fail ning määra `VITE_SUPABASE_URL` ja
          `VITE_SUPABASE_ANON_KEY`. Avalik anon-võti on turvaline ainult koos paigas RLS-reeglitega;
          ära lisa siia service-role võtit.
        </p>
      </div>
      <div v-else-if="auth.status === 'error'" class="form-error" role="alert">
        {{ auth.error }}
      </div>

      <form v-else class="auth-form" novalidate @submit.prevent="submit">
        <div v-if="mode === 'register'">
          <label class="field-label" for="full-name">Nimi</label>
          <input
            id="full-name"
            v-model="fullName"
            class="text-input"
            type="text"
            autocomplete="name"
            maxlength="80"
            required
          />
        </div>

        <div v-if="mode !== 'password'">
          <label class="field-label" for="email">E-posti aadress</label>
          <input
            id="email"
            v-model="email"
            class="text-input"
            type="email"
            autocomplete="email"
            required
          />
        </div>

        <div v-if="mode === 'login' || mode === 'register' || mode === 'password'">
          <label class="field-label" for="password">Parool</label>
          <input
            id="password"
            v-model="password"
            class="text-input"
            type="password"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            :minlength="mode === 'login' ? 1 : 12"
            required
          />
          <p v-if="mode !== 'login'" class="field-hint">Kasuta vähemalt 12 tähemärki.</p>
        </div>

        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <p v-if="message" class="form-success" role="status">{{ message }}</p>
        <p v-if="auth.error" class="form-error" role="alert">{{ auth.error }}</p>

        <button class="button button-primary auth-submit" type="submit" :disabled="pending">
          {{ pending ? 'Palun oota…' : copy.submit }}
        </button>
      </form>

      <router-link
        v-if="mode === 'login'"
        class="forgot-link"
        :to="{ path: '/account/forgot-password', query: route.query }"
      >
        Unustasid parooli?
      </router-link>

      <p class="auth-switch">
        {{ copy.switchLabel }}
        <router-link :to="{ path: copy.switchPath, query: route.query }">
          {{ copy.switchTo }}
        </router-link>
      </p>
    </div>
  </section>
</template>

<style scoped>
.auth-page {
  display: grid;
  min-height: 65vh;
  place-items: start center;
}

.auth-card {
  width: min(100%, 520px);
  padding: clamp(24px, 5vw, 42px);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--panel);
  box-shadow: var(--shadow);
}

.auth-card h1 {
  margin-bottom: 12px;
  font-size: clamp(2.2rem, 5vw, 3.2rem);
}

.auth-intro {
  margin-bottom: 26px;
  color: var(--muted);
  line-height: 1.6;
}

.auth-form,
.auth-form > div {
  display: grid;
  gap: 9px;
}

.auth-form {
  gap: 19px;
}

.auth-form .field-label {
  margin: 0;
}

.auth-submit {
  width: 100%;
  margin-top: 5px;
  cursor: pointer;
}

.auth-submit:disabled {
  opacity: 0.65;
  cursor: wait;
}

.field-hint {
  margin: 0;
  color: var(--muted);
  font-size: 0.78rem;
}

.form-error,
.config-message {
  padding: 12px 14px;
  border-radius: 12px;
  background: #fff0ed;
  color: #8d2923;
  font-size: 0.84rem;
  line-height: 1.55;
}

.config-message p {
  margin: 8px 0 0;
}

.form-success {
  padding: 12px 14px;
  border-radius: 12px;
  background: #edf6ef;
  color: #28603b;
  font-size: 0.84rem;
  line-height: 1.55;
}

.forgot-link {
  display: block;
  margin-top: 17px;
  color: var(--primary-dark);
  font-size: 0.84rem;
  text-align: center;
}

.auth-switch {
  margin: 22px 0 0;
  color: var(--muted);
  font-size: 0.86rem;
  text-align: center;
}

.auth-switch a {
  color: var(--primary-dark);
  font-weight: 750;
}
</style>
