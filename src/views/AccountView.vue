<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { formatEuro } from '@/modules/planner/calculateBudget';
import { listSavedPlans, type SavedPlanSummary } from '@/modules/planner/repository';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const plans = ref<SavedPlanSummary[]>([]);
const plansLoading = ref(false);
const plansError = ref('');
const nameDraft = ref('');
const profileMessage = ref('');
const profileError = ref('');
const profileSaving = ref(false);

const loadPlans = async () => {
  if (!auth.isAuthenticated) {
    plans.value = [];
    return;
  }

  plansLoading.value = true;
  plansError.value = '';
  try {
    plans.value = await listSavedPlans();
  } catch (error) {
    plansError.value =
      error instanceof Error ? error.message : 'Peoplaanide laadimine ebaõnnestus.';
  } finally {
    plansLoading.value = false;
  }
};

const saveProfile = async () => {
  profileError.value = '';
  profileMessage.value = '';
  profileSaving.value = true;
  try {
    await auth.updateFullName(nameDraft.value);
    profileMessage.value = 'Profiilinimi salvestati.';
  } catch (error) {
    profileError.value =
      error instanceof Error ? error.message : 'Profiili uuendamine ebaõnnestus.';
  } finally {
    profileSaving.value = false;
  }
};

const signOut = async () => {
  profileError.value = '';
  try {
    await auth.signOut();
    await router.replace('/');
  } catch (error) {
    profileError.value =
      error instanceof Error ? error.message : 'Väljalogimine ebaõnnestus. Proovi uuesti.';
  }
};

const openPlan = (planId: string) => {
  void router.push({ path: '/planner', query: { plan: planId } });
};

watch(
  () => auth.fullName,
  (value) => {
    nameDraft.value = value;
  },
  { immediate: true },
);

watch(
  () => auth.isAuthenticated,
  () => {
    void loadPlans();
  },
);

onMounted(() => {
  if (auth.isAuthenticated) {
    void loadPlans();
  }
});
</script>

<template>
  <section class="container page-shell account-page" aria-labelledby="account-title">
    <header class="account-header">
      <div>
        <p class="eyebrow">Sinu peod ühes kohas</p>
        <h1 id="account-title">Minu konto</h1>
      </div>
      <button
        v-if="auth.isAuthenticated"
        class="button button-secondary"
        type="button"
        @click="signOut"
      >
        Logi välja
      </button>
    </header>

    <div v-if="auth.status === 'unconfigured'" class="account-panel">
      <h2>Supabase pole seadistatud</h2>
      <p>Kontole ligipääsuks lisa `.env` faili Supabase URL ja anon-võti.</p>
      <router-link class="button button-primary" to="/account/login">Logi sisse</router-link>
    </div>
    <div v-else-if="auth.status === 'loading'" class="account-panel" role="status">
      Konto laadimine…
    </div>
    <div v-else-if="auth.status === 'error'" class="account-panel error-message" role="alert">
      {{ auth.error }}
    </div>
    <div v-else-if="!auth.isAuthenticated" class="account-panel">
      <h2>Salvesta ja jätka oma peoplaane</h2>
      <p>Logi sisse või loo konto, et oma mustandeid turvaliselt vaadata.</p>
      <div class="account-actions">
        <router-link class="button button-primary" to="/account/login">Logi sisse</router-link>
        <router-link class="button button-secondary" to="/account/register">Loo konto</router-link>
      </div>
    </div>
    <template v-else>
      <p v-if="auth.error" class="error-message account-panel" role="alert">{{ auth.error }}</p>
      <section class="account-panel profile-panel" aria-labelledby="profile-title">
        <div>
          <p class="eyebrow">Profiil</p>
          <h2 id="profile-title">{{ auth.email }}</h2>
          <p class="muted-copy">Sinu kontoandmed ja salvestatud peoplaanid on privaatsed.</p>
        </div>
        <form class="profile-form" @submit.prevent="saveProfile">
          <label for="profile-name">Nimi</label>
          <div class="profile-name-row">
            <input id="profile-name" v-model="nameDraft" class="text-input" maxlength="80" />
            <button class="button button-secondary" type="submit" :disabled="profileSaving">
              {{ profileSaving ? 'Salvestan…' : 'Salvesta nimi' }}
            </button>
          </div>
          <p v-if="profileMessage" class="success-message" role="status">{{ profileMessage }}</p>
          <p v-if="profileError" class="error-message" role="alert">{{ profileError }}</p>
        </form>
      </section>

      <section class="plans-section" aria-labelledby="plans-title">
        <div class="plans-heading">
          <div>
            <p class="eyebrow">Sinu mustandid</p>
            <h2 id="plans-title">Salvestatud peoplaanid</h2>
          </div>
          <router-link class="button button-primary" to="/planner">Loo uus plaan</router-link>
        </div>

        <p v-if="plansLoading" class="account-panel" role="status">Peoplaanide laadimine…</p>
        <p v-else-if="plansError" class="error-message account-panel" role="alert">
          {{ plansError }}
        </p>
        <div v-else-if="plans.length" class="saved-plan-grid">
          <article v-for="plan in plans" :key="plan.id" class="saved-plan-card">
            <div class="saved-plan-top">
              <span class="plan-status">Mustand</span>
              <span>{{ new Date(`${plan.eventDate}T12:00:00`).toLocaleDateString('et-EE') }}</span>
            </div>
            <h3>{{ plan.title }}</h3>
            <dl>
              <div><dt>Teema</dt><dd>{{ plan.theme }}</dd></div>
              <div><dt>Külalisi</dt><dd>{{ plan.guestCount }}</dd></div>
              <div><dt>Eelarve</dt><dd>{{ formatEuro(plan.budgetCents) }}</dd></div>
            </dl>
            <button class="text-button" type="button" @click="openPlan(plan.id)">
              Ava ja muuda <span aria-hidden="true">→</span>
            </button>
          </article>
        </div>
        <div v-else class="account-panel empty-plans">
          <h3>Sul pole veel salvestatud peoplaane.</h3>
          <p>Alusta planeerimist tasuta ning salvesta mustand siia siis, kui oled sisse loginud.</p>
          <router-link class="text-button" to="/planner">Alusta planeerimist →</router-link>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.account-header,
.plans-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 20px;
  margin-bottom: 24px;
}

.account-header h1 {
  margin-bottom: 0;
  font-size: clamp(2.5rem, 5vw, 4rem);
}

.account-panel {
  padding: clamp(22px, 4vw, 34px);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--panel);
  box-shadow: var(--shadow);
}

.account-panel h2 {
  font-size: 1.5rem;
}

.account-panel p,
.muted-copy {
  color: var(--muted);
  line-height: 1.6;
}

.account-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.profile-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.profile-panel .eyebrow,
.plans-heading .eyebrow {
  margin-bottom: 9px;
}

.profile-panel h2 {
  overflow-wrap: anywhere;
}

.profile-form {
  display: grid;
  align-content: start;
  gap: 9px;
}

.profile-form label {
  font-size: 0.84rem;
  font-weight: 750;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-name-row .text-input {
  min-width: 0;
}

.profile-name-row .button {
  flex: 0 0 auto;
  padding: 0.8rem 1rem;
  font-size: 0.82rem;
}

.success-message,
.error-message {
  margin: 0;
  color: #28603b;
  font-size: 0.82rem;
}

.error-message {
  color: #a3312a;
}

.plans-section {
  margin-top: 48px;
}

.plans-heading h2 {
  margin-bottom: 0;
  font-size: clamp(1.8rem, 4vw, 2.7rem);
}

.saved-plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.saved-plan-card {
  padding: 21px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel);
}

.saved-plan-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: var(--muted);
  font-size: 0.74rem;
}

.plan-status {
  padding: 5px 9px;
  border-radius: 999px;
  background: #f5f0ec;
  color: #665c57;
  font-weight: 700;
}

.saved-plan-card h3 {
  margin-bottom: 14px;
  font-size: 1.16rem;
}

.saved-plan-card dl {
  display: grid;
  gap: 9px;
  margin: 0 0 18px;
}

.saved-plan-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.82rem;
}

.saved-plan-card dt {
  color: var(--muted);
}

.saved-plan-card dd {
  margin: 0;
  font-weight: 700;
}

.text-button {
  padding: 0;
  font-weight: 750;
}

.empty-plans {
  text-align: center;
}

.empty-plans h3 {
  font-size: 1.2rem;
}

@media (max-width: 700px) {
  .profile-panel {
    grid-template-columns: 1fr;
  }

  .plans-heading,
  .account-header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .profile-name-row {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
