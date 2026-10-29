<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  budgetStepSchema,
  conditionsStepSchema,
  costsStepSchema,
  MAX_BUDGET_CENTS,
  MAX_GUESTS,
  ageGroups,
  partyStepSchema,
  partyTypes,
  plannerSteps,
  priorityOptions,
  themeStepSchema,
  themes,
  type Audience,
  type PlanCost,
  type Priority,
  type PricingModel,
  type PriceStatus,
  type PriceSource,
} from '@/modules/planner/model';
import { calculateBudget, formatEuro } from '@/modules/planner/calculateBudget';
import { useAuthStore } from '@/stores/auth';
import { usePlannerStore } from '@/stores/planner';

const auth = useAuthStore();
const plannerStore = usePlannerStore();
const route = useRoute();
const router = useRouter();
const draft = plannerStore.draft;
const currentStep = ref(0);
const errors = reactive<Record<string, string>>({});
const customCostTitle = ref('');
const customCostModel = ref<PricingModel>('per_unit');
const customCostQuantity = ref(1);
const customCostUnitPrice = ref<number | null>(null);
const customCostError = ref('');
let nextCostId = 0;

const audienceOptions: { value: Audience; label: string }[] = [
  { value: 'children', label: 'Lastepidu' },
  { value: 'adults', label: 'Täiskasvanute pidu' },
  { value: 'mixed', label: 'Segavanuses seltskond' },
];

const priorities = priorityOptions;
const today = new Date();
const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
  today.getDate(),
).padStart(2, '0')}`;
let loadingPlanId: string | null = null;

const budgetEuros = computed({
  get: () => (draft.budgetCents === null ? null : draft.budgetCents / 100),
  set: (value: number | null) => {
    draft.budgetCents = value !== null && Number.isFinite(value) ? Math.round(value * 100) : null;
    clearError('budgetCents');
  },
});

const costTemplates: {
  id: string;
  title: string;
  description: string;
  pricingModel: PricingModel;
  quantity: number;
  unitPriceCents: number | null;
  priceSource: PriceSource;
  status: PriceStatus;
}[] = [
  {
    id: 'complete-plan',
    title: 'Complete Party Plan',
    description: 'Digitaalne peoplaan · hind 29 €',
    pricingModel: 'fixed',
    quantity: 1,
    unitPriceCents: 2_900,
    priceSource: 'catalog',
    status: 'estimate',
  },
  {
    id: 'party-website',
    title: 'Party Website',
    description: 'Peoveeb · hind 100 €',
    pricingModel: 'fixed',
    quantity: 1,
    unitPriceCents: 10_000,
    priceSource: 'catalog',
    status: 'estimate',
  },
  {
    id: 'party-host',
    title: 'Kostümeeritud peojuht',
    description: '50 €/h · minimaalselt 3 tundi',
    pricingModel: 'hourly',
    quantity: 3,
    unitPriceCents: 5_000,
    priceSource: 'catalog',
    status: 'estimate',
  },
  {
    id: 'party-box',
    title: 'Party Box',
    description: 'Tooted ja kohaletoimetamine vajavad pakkumist',
    pricingModel: 'quote',
    quantity: 1,
    unitPriceCents: null,
    priceSource: 'supplier',
    status: 'needs-quote',
  },
];

const recommendations = computed(() => {
  const suggestions: string[] = [];

  if (draft.audience === 'children' || draft.audience === 'mixed') {
    suggestions.push(
      'Planeeri tegevuste vahele rahulikum söögipaus ja laste vanusele sobivad mängud.',
    );
  } else {
    suggestions.push('Lisa kavasse tervitus, ühine hetk ja piisavalt aega vabaks suhtluseks.');
  }
  if (draft.venueType === 'outdoor') {
    suggestions.push('Õuepeo puhul mõtle läbi vihmaplaan ja varjualune.');
  }
  if (draft.venueNeed === 'find-venue') {
    suggestions.push(
      'Alusta peokoha päringutest varakult; saadavus vajab teenusepakkuja kinnitust.',
    );
  }
  if ((draft.guestCount ?? 0) >= 30) {
    suggestions.push('Suurema seltskonna puhul planeeri serveerimine ja liikumisruum eraldi.');
  }
  if (draft.priorities.includes('convenience')) {
    suggestions.push('Mugavuse prioriteedi korral võrdle peojuhi või abiliste pakkumisi.');
  }
  if (suggestions.length < 3) {
    suggestions.push('Koosta enne pidu lühike ettevalmistuste kontrollnimekiri.');
  }

  return suggestions;
});

const budget = computed(() =>
  calculateBudget(draft.costs, draft.guestCount ?? 0, draft.budgetCents ?? 0),
);

const selectedTheme = computed(() => themes.find((theme) => theme.value === draft.theme)?.label);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('et-EE', { dateStyle: 'long' }).format(new Date(`${date}T12:00:00`));

const clearError = (key: string) => {
  delete errors[key];
};

const validateStep = (): boolean => {
  Object.keys(errors).forEach((key) => delete errors[key]);

  const schemas = [
    () =>
      partyStepSchema.safeParse({
        title: draft.title,
        partyType: draft.partyType,
        audience: draft.audience,
        ageGroup: draft.ageGroup,
      }),
    () =>
      themeStepSchema.safeParse({
        theme: draft.theme,
        customTheme: draft.customTheme,
      }),
    () =>
      conditionsStepSchema.safeParse({
        guestCount: draft.guestCount,
        eventDate: draft.eventDate,
        eventTime: draft.eventTime,
        location: draft.location,
        venueType: draft.venueType,
        venueNeed: draft.venueNeed,
      }),
    () =>
      budgetStepSchema.safeParse({
        budgetCents: draft.budgetCents,
        priorities: draft.priorities,
      }),
    () => costsStepSchema.safeParse({ costs: draft.costs }),
  ];

  if (currentStep.value === plannerSteps.length - 1) {
    return true;
  }

  const result = schemas[currentStep.value]();
  if (result.success) {
    return true;
  }

  result.error.issues.forEach((issue) => {
    const key = String(issue.path[0] ?? 'form');
    errors[key] ??= issue.message;
  });
  return false;
};

const goNext = () => {
  if (validateStep() && currentStep.value < plannerSteps.length - 1) {
    currentStep.value += 1;
    scrollToStep();
  }
};

const goBack = () => {
  if (currentStep.value > 0) {
    currentStep.value -= 1;
    Object.keys(errors).forEach((key) => delete errors[key]);
    scrollToStep();
  }
};

const scrollToStep = () => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
};

const goToStep = (step: number) => {
  if (step < currentStep.value) {
    currentStep.value = step;
    Object.keys(errors).forEach((key) => delete errors[key]);
  }
};

const togglePriority = (value: Priority) => {
  draft.priorities = draft.priorities.includes(value)
    ? draft.priorities.filter((priority) => priority !== value)
    : [...draft.priorities, value];
  clearError('priorities');
};

const addTemplate = (template: (typeof costTemplates)[number]) => {
  if (draft.costs.some((cost) => cost.id === template.id)) {
    return;
  }

  draft.costs.push({
    id: template.id,
    title: template.title,
    pricingModel: template.pricingModel,
    quantity: template.quantity,
    unitPriceCents: template.unitPriceCents,
    priceSource: template.priceSource,
    status: template.status,
  });
};

const addCustomCost = () => {
  customCostError.value = '';
  const quoteRequired = customCostModel.value === 'quote' || customCostModel.value === 'negotiable';
  const cost: PlanCost = {
    id: `personal-${++nextCostId}`,
    title: customCostTitle.value.trim(),
    pricingModel: customCostModel.value,
    quantity: customCostQuantity.value,
    unitPriceCents: quoteRequired
      ? null
      : customCostUnitPrice.value === null
        ? null
        : Math.round(customCostUnitPrice.value * 100),
    priceSource: quoteRequired ? 'supplier' : 'personal-estimate',
    status: quoteRequired ? 'needs-quote' : 'estimate',
  };
  const result = costsStepSchema.safeParse({ costs: [...draft.costs, cost] });

  if (!customCostTitle.value.trim()) {
    customCostError.value = 'Lisa kulu nimetus.';
    return;
  }
  if (!result.success) {
    customCostError.value = result.error.issues[0]?.message ?? 'Kontrolli kogust ja ühikuhinda.';
    return;
  }

  draft.costs.push(cost);
  customCostTitle.value = '';
  customCostQuantity.value = 1;
  customCostUnitPrice.value = null;
  clearError('costs');
};

const removeCost = (id: string) => {
  draft.costs = draft.costs.filter((cost) => cost.id !== id);
};

const resetPlanner = () => {
  plannerStore.reset();
  currentStep.value = 0;
  Object.keys(errors).forEach((key) => delete errors[key]);
  nextCostId = 0;
  if (route.query.plan) {
    void router.replace('/planner');
  }
};

const loadPlanFromQuery = async () => {
  const planId = route.query.plan;
  if (typeof planId !== 'string' || auth.status === 'loading' || loadingPlanId === planId) {
    return;
  }
  if (!auth.isAuthenticated) {
    await router.replace({
      path: '/account/login',
      query: { redirect: route.fullPath },
    });
    return;
  }

  loadingPlanId = planId;
  try {
    await plannerStore.openSavedDraft(planId);
    currentStep.value = plannerSteps.length - 1;
  } catch {
    // The store exposes the load failure in the planner UI.
  } finally {
    loadingPlanId = null;
  }
};

const saveCurrentDraft = async () => {
  if (!auth.isAuthenticated) {
    await router.push({
      path: '/account/login',
      query: { redirect: route.fullPath },
    });
    return;
  }

  try {
    await plannerStore.saveDraft();
  } catch {
    // The store exposes validation and persistence errors in the planner UI.
  }
};

watch(
  () => [auth.status, route.query.plan] as const,
  () => void loadPlanFromQuery(),
  { immediate: true },
);
</script>

<template>
  <section class="container page-shell planner-page" aria-labelledby="planner-title">
    <header class="planner-intro">
      <p class="eyebrow">Alusta tasuta · konto pole vajalik</p>
      <h1 id="planner-title">Sinu pidu, sinu plaan.</h1>
      <p class="intro">
        Liigu samm-sammult läbi peo olulisemad valikud. Hinnad on planeerimise eelvaade ega kinnita
        tarnija saadavust või lõplikku pakkumist.
      </p>
    </header>

    <div class="planner-layout">
      <aside class="planner-sidebar" aria-label="Planeerimise sammud">
        <p class="sidebar-title">Peoplaani sammud</p>
        <ol class="planner-step-list">
          <li v-for="(step, index) in plannerSteps" :key="step">
            <button
              type="button"
              :class="{ active: currentStep === index, complete: currentStep > index }"
              :aria-current="currentStep === index ? 'step' : undefined"
              :disabled="index > currentStep"
              @click="goToStep(index)"
            >
              <span class="step-index">{{ currentStep > index ? '✓' : `0${index + 1}` }}</span>
              <span>{{ step }}</span>
            </button>
          </li>
        </ol>
        <div class="privacy-note">
          <span aria-hidden="true">⌁</span>
          <p>
            Praegu on plaan ainult selles vaates. Mustandi salvestamine lisandub järgmises etapis.
          </p>
        </div>
      </aside>

      <div class="planner-main">
        <div class="planner-progress-header">
          <span>Samm {{ currentStep + 1 }} / {{ plannerSteps.length }}</span>
          <span>{{ plannerSteps[currentStep] }}</span>
        </div>
        <div
          class="planner-progress-track"
          role="progressbar"
          :aria-label="`Planeerimine: samm ${currentStep + 1} kuuest`"
          :aria-valuemin="1"
          :aria-valuemax="plannerSteps.length"
          :aria-valuenow="currentStep + 1"
        >
          <span :style="{ width: `${((currentStep + 1) / plannerSteps.length) * 100}%` }"></span>
        </div>

        <div class="planner-card">
          <div v-if="currentStep === 0" class="step-content">
            <p class="eyebrow">Samm 1 · sündmus</p>
            <h2>Millist sündmust tähistad?</h2>
            <p class="step-intro">Anna plaanile nimi ja vali, kellele pidu on mõeldud.</p>

            <label class="field-label" for="party-title">Peo nimi</label>
            <input
              id="party-title"
              v-model="draft.title"
              class="text-input"
              type="text"
              maxlength="80"
              placeholder="Näiteks Mia 7. sünnipäev"
              autocomplete="off"
              @input="clearError('title')"
            />
            <p v-if="errors.title" class="field-error" role="alert">{{ errors.title }}</p>

            <fieldset class="choice-fieldset">
              <legend>Sündmuse tüüp</legend>
              <div class="choice-grid choice-grid--compact">
                <label v-for="partyType in partyTypes" :key="partyType.value" class="choice-card">
                  <input
                    v-model="draft.partyType"
                    type="radio"
                    name="partyType"
                    :value="partyType.value"
                    @change="clearError('partyType')"
                  />
                  <span>{{ partyType.label }}</span>
                </label>
              </div>
              <p v-if="errors.partyType" class="field-error" role="alert">{{ errors.partyType }}</p>
            </fieldset>

            <fieldset class="choice-fieldset">
              <legend>Kes peol osalevad?</legend>
              <div class="choice-grid">
                <label v-for="option in audienceOptions" :key="option.value" class="choice-card">
                  <input
                    v-model="draft.audience"
                    type="radio"
                    name="audience"
                    :value="option.value"
                    @change="clearError('audience')"
                  />
                  <span>{{ option.label }}</span>
                </label>
              </div>
              <p v-if="errors.audience" class="field-error" role="alert">{{ errors.audience }}</p>
            </fieldset>

            <label class="field-label" for="age-group">Vanusevahemik</label>
            <select
              id="age-group"
              v-model="draft.ageGroup"
              class="text-input"
              @change="clearError('ageGroup')"
            >
              <option value="" disabled>Vali vanusevahemik</option>
              <option v-for="age in ageGroups" :key="age" :value="age">{{ age }}</option>
            </select>
            <p v-if="errors.ageGroup" class="field-error" role="alert">{{ errors.ageGroup }}</p>
          </div>

          <div v-else-if="currentStep === 1" class="step-content">
            <p class="eyebrow">Samm 2 · teema</p>
            <h2>Leia peole sobiv meeleolu.</h2>
            <p class="step-intro">Vali valmis idee või lisa enda teema.</p>

            <fieldset class="choice-fieldset">
              <legend>Peoteema</legend>
              <div class="theme-options">
                <label
                  v-for="theme in themes"
                  :key="theme.value"
                  class="theme-option"
                  :class="{ selected: draft.theme === theme.value }"
                >
                  <input
                    v-model="draft.theme"
                    type="radio"
                    name="theme"
                    :value="theme.value"
                    @change="clearError('theme')"
                  />
                  <span>
                    <strong>{{ theme.label }}</strong>
                    <small>{{ theme.audience }}</small>
                  </span>
                  <span class="theme-check" aria-hidden="true">{{
                    draft.theme === theme.value ? '✓' : ''
                  }}</span>
                </label>
              </div>
              <p v-if="errors.theme" class="field-error" role="alert">{{ errors.theme }}</p>
            </fieldset>

            <div v-if="draft.theme === 'custom'" class="custom-theme-field">
              <label class="field-label" for="custom-theme">Kirjelda oma teemaideed</label>
              <input
                id="custom-theme"
                v-model="draft.customTheme"
                class="text-input"
                type="text"
                maxlength="80"
                placeholder="Näiteks metsloomade piknik"
                @input="clearError('customTheme')"
              />
              <p v-if="errors.customTheme" class="field-error" role="alert">
                {{ errors.customTheme }}
              </p>
            </div>
          </div>

          <div v-else-if="currentStep === 2" class="step-content">
            <p class="eyebrow">Samm 3 · tingimused</p>
            <h2>Kus ja millal pidu toimub?</h2>
            <p class="step-intro">Need valikud aitavad plaani sinu olukorraga sobitada.</p>

            <div class="form-grid">
              <div>
                <label class="field-label" for="guest-count">Külaliste arv</label>
                <input
                  id="guest-count"
                  v-model.number="draft.guestCount"
                  class="text-input"
                  type="number"
                  min="1"
                  :max="MAX_GUESTS"
                  step="1"
                  required
                  @input="clearError('guestCount')"
                />
                <p v-if="errors.guestCount" class="field-error" role="alert">
                  {{ errors.guestCount }}
                </p>
              </div>
              <div>
                <label class="field-label" for="event-date">Kuupäev</label>
                <input
                  id="event-date"
                  v-model="draft.eventDate"
                  class="text-input"
                  type="date"
                  :min="minDate"
                  required
                  @input="clearError('eventDate')"
                />
                <p v-if="errors.eventDate" class="field-error" role="alert">
                  {{ errors.eventDate }}
                </p>
              </div>
              <div>
                <label class="field-label" for="event-time">Algusaeg</label>
                <input
                  id="event-time"
                  v-model="draft.eventTime"
                  class="text-input"
                  type="time"
                  required
                  @input="clearError('eventTime')"
                />
                <p v-if="errors.eventTime" class="field-error" role="alert">
                  {{ errors.eventTime }}
                </p>
              </div>
              <div>
                <label class="field-label" for="location">Asukoht või piirkond</label>
                <input
                  id="location"
                  v-model="draft.location"
                  class="text-input"
                  type="text"
                  maxlength="120"
                  placeholder="Näiteks Tartu"
                  autocomplete="address-level2"
                  @input="clearError('location')"
                />
                <p v-if="errors.location" class="field-error" role="alert">
                  {{ errors.location }}
                </p>
              </div>
            </div>

            <fieldset class="choice-fieldset">
              <legend>Millises keskkonnas?</legend>
              <div class="choice-grid">
                <label class="choice-card">
                  <input
                    v-model="draft.venueType"
                    type="radio"
                    name="venueType"
                    value="indoor"
                    @change="clearError('venueType')"
                  />
                  <span>Siseruumis</span>
                </label>
                <label class="choice-card">
                  <input
                    v-model="draft.venueType"
                    type="radio"
                    name="venueType"
                    value="outdoor"
                    @change="clearError('venueType')"
                  />
                  <span>Õues</span>
                </label>
                <label class="choice-card">
                  <input
                    v-model="draft.venueType"
                    type="radio"
                    name="venueType"
                    value="either"
                    @change="clearError('venueType')"
                  />
                  <span>Veel lahtine</span>
                </label>
              </div>
              <p v-if="errors.venueType" class="field-error" role="alert">
                {{ errors.venueType }}
              </p>
            </fieldset>

            <fieldset class="choice-fieldset">
              <legend>Peokoha olukord</legend>
              <div class="choice-grid">
                <label class="choice-card">
                  <input
                    v-model="draft.venueNeed"
                    type="radio"
                    name="venueNeed"
                    value="have-venue"
                    @change="clearError('venueNeed')"
                  />
                  <span>Peokoht on olemas</span>
                </label>
                <label class="choice-card">
                  <input
                    v-model="draft.venueNeed"
                    type="radio"
                    name="venueNeed"
                    value="find-venue"
                    @change="clearError('venueNeed')"
                  />
                  <span>Vajan peokoha ideid</span>
                </label>
              </div>
              <p v-if="errors.venueNeed" class="field-error" role="alert">
                {{ errors.venueNeed }}
              </p>
            </fieldset>
          </div>

          <div v-else-if="currentStep === 3" class="step-content">
            <p class="eyebrow">Samm 4 · eelarve</p>
            <h2>Mis on sinu eelarve?</h2>
            <p class="step-intro">
              See aitab soovitusi suunata. Sisesta kogu summa eurodes ning vali peo prioriteedid.
            </p>

            <label class="field-label" for="budget-total">Kogu eelarve (€)</label>
            <div class="money-input-wrap">
              <input
                id="budget-total"
                v-model.number="budgetEuros"
                class="text-input"
                type="number"
                min="50"
                :max="MAX_BUDGET_CENTS / 100"
                step="0.01"
                required
                @input="clearError('budgetCents')"
              />
              <span>EUR</span>
            </div>
            <p class="field-hint">Lubatud vahemik 50–50 000 €.</p>
            <p v-if="errors.budgetCents" class="field-error" role="alert">
              {{ errors.budgetCents }}
            </p>

            <fieldset class="choice-fieldset">
              <legend>Mis on sinu jaoks kõige olulisem? Vali vähemalt üks.</legend>
              <div class="priority-grid">
                <label
                  v-for="priority in priorities"
                  :key="priority.value"
                  class="priority-option"
                  :class="{ selected: draft.priorities.includes(priority.value) }"
                >
                  <input
                    type="checkbox"
                    :checked="draft.priorities.includes(priority.value)"
                    @change="togglePriority(priority.value)"
                  />
                  <span>{{ priority.label }}</span>
                </label>
              </div>
              <p v-if="errors.priorities" class="field-error" role="alert">
                {{ errors.priorities }}
              </p>
            </fieldset>

            <div class="budget-reminder">
              <strong>Pea meeles</strong>
              <p>
                Kuluarvestus on sinu planeerimise eelvaade. Maksud, tarne ja teenusepakkuja lõplik
                hind lisatakse alles kinnitatud tingimuste alusel.
              </p>
            </div>
          </div>

          <div v-else-if="currentStep === 4" class="step-content">
            <p class="eyebrow">Samm 5 · soovitused</p>
            <h2>Ideed sinu peo jaoks.</h2>
            <p class="step-intro">
              Soovitused lähtuvad sinu valikutest ega ole teenusepakkuja pakkumine.
            </p>

            <div class="recommendation-list">
              <p v-for="suggestion in recommendations" :key="suggestion">
                <span aria-hidden="true">✦</span>{{ suggestion }}
              </p>
            </div>

            <div class="cost-picker">
              <h3>Lisa plaani teadaolevad teenused</h3>
              <p class="field-hint">
                Kataloogi hinnad on eelvaateks. Teenuse saadavus ja hind vajavad enne ostu
                kinnitamist serveripoolset kontrolli.
              </p>
              <div class="template-grid">
                <article v-for="template in costTemplates" :key="template.id" class="template-card">
                  <div>
                    <strong>{{ template.title }}</strong>
                    <p>{{ template.description }}</p>
                  </div>
                  <button
                    type="button"
                    class="small-button"
                    :disabled="draft.costs.some((cost) => cost.id === template.id)"
                    @click="addTemplate(template)"
                  >
                    {{ draft.costs.some((cost) => cost.id === template.id) ? 'Lisatud' : 'Lisa' }}
                  </button>
                </article>
              </div>
            </div>

            <div class="custom-cost-form">
              <h3>Lisa muu kulu või enda hinnang</h3>
              <div class="form-grid">
                <div>
                  <label class="field-label" for="cost-title">Kulu nimetus</label>
                  <input
                    id="cost-title"
                    v-model="customCostTitle"
                    class="text-input"
                    type="text"
                    maxlength="100"
                    placeholder="Näiteks toit külalistele"
                    @input="customCostError = ''"
                  />
                </div>
                <div>
                  <label class="field-label" for="cost-model">Hinnastamise viis</label>
                  <select
                    id="cost-model"
                    v-model="customCostModel"
                    class="text-input"
                    @change="customCostError = ''"
                  >
                    <option value="fixed">Fikseeritud summa</option>
                    <option value="per_guest">Hind külalise kohta</option>
                    <option value="per_unit">Hind ühiku kohta</option>
                    <option value="hourly">Hind tunni kohta</option>
                    <option value="from">Hind alates</option>
                    <option value="quote">Tarnija pakkumise alusel</option>
                    <option value="negotiable">Kokkulepitav hind</option>
                  </select>
                </div>
                <div>
                  <label class="field-label" for="cost-quantity">
                    {{ customCostModel === 'hourly' ? 'Tundide arv' : 'Kogus' }}
                  </label>
                  <input
                    id="cost-quantity"
                    v-model.number="customCostQuantity"
                    class="text-input"
                    type="number"
                    min="1"
                    max="10000"
                    step="1"
                  />
                </div>
                <div>
                  <label class="field-label" for="cost-unit-price">Ühikuhind (€)</label>
                  <input
                    id="cost-unit-price"
                    v-model.number="customCostUnitPrice"
                    class="text-input"
                    type="number"
                    min="0"
                    max="50000"
                    step="0.01"
                    :disabled="customCostModel === 'quote' || customCostModel === 'negotiable'"
                    :placeholder="
                      customCostModel === 'quote' || customCostModel === 'negotiable'
                        ? 'Ootab pakkumist'
                        : 'Sisesta enda hinnang'
                    "
                  />
                </div>
              </div>
              <p v-if="customCostError" class="field-error" role="alert">{{ customCostError }}</p>
              <button class="button button-secondary" type="button" @click="addCustomCost">
                Lisa kulu
              </button>
            </div>

            <div v-if="draft.costs.length" class="selected-costs">
              <h3>Valitud read</h3>
              <ul>
                <li v-for="cost in draft.costs" :key="cost.id">
                  <span>
                    <strong>{{ cost.title }}</strong>
                    <small
                      >{{ cost.pricingModel.replace('_', ' ') }} · {{ cost.quantity }} üh.</small
                    >
                  </span>
                  <span class="cost-preview">
                    {{
                      cost.unitPriceCents === null
                        ? 'Küsi pakkumist'
                        : formatEuro(
                            cost.pricingModel === 'per_guest'
                              ? cost.unitPriceCents * cost.quantity * (draft.guestCount ?? 0)
                              : cost.unitPriceCents * cost.quantity,
                          )
                    }}
                  </span>
                  <button
                    type="button"
                    class="remove-button"
                    :aria-label="`Eemalda ${cost.title}`"
                    @click="removeCost(cost.id)"
                  >
                    Eemalda
                  </button>
                </li>
              </ul>
            </div>
            <p v-if="errors.costs" class="field-error" role="alert">{{ errors.costs }}</p>
          </div>

          <div v-else class="step-content review-step">
            <p class="eyebrow">Samm 6 · ülevaade</p>
            <h2>{{ draft.title }}</h2>
            <p class="step-intro">Vaata valikud üle. Tagasi liikudes saad neid igal ajal muuta.</p>

            <section class="review-section" aria-labelledby="review-event">
              <div class="review-heading">
                <h3 id="review-event">Sündmus</h3>
                <button type="button" class="text-button" @click="goToStep(0)">Muuda</button>
              </div>
              <dl class="review-grid">
                <div>
                  <dt>Tüüp</dt>
                  <dd>{{ partyTypes.find((type) => type.value === draft.partyType)?.label }}</dd>
                </div>
                <div>
                  <dt>Seltskond</dt>
                  <dd>
                    {{ audienceOptions.find((option) => option.value === draft.audience)?.label }}
                  </dd>
                </div>
                <div>
                  <dt>Vanus</dt>
                  <dd>{{ draft.ageGroup }}</dd>
                </div>
                <div>
                  <dt>Teema</dt>
                  <dd>{{ draft.theme === 'custom' ? draft.customTheme : selectedTheme }}</dd>
                </div>
                <div>
                  <dt>Külalisi</dt>
                  <dd>{{ draft.guestCount }}</dd>
                </div>
                <div>
                  <dt>Millal</dt>
                  <dd>{{ formatDate(draft.eventDate) }} · {{ draft.eventTime }}</dd>
                </div>
                <div>
                  <dt>Asukoht</dt>
                  <dd>{{ draft.location }}</dd>
                </div>
                <div>
                  <dt>Eelarve</dt>
                  <dd>{{ formatEuro(draft.budgetCents ?? 0) }}</dd>
                </div>
              </dl>
            </section>

            <section class="review-section" aria-labelledby="review-costs">
              <div class="review-heading">
                <h3 id="review-costs">Kuluarvestus</h3>
                <button type="button" class="text-button" @click="goToStep(4)">Muuda ridu</button>
              </div>
              <p v-if="!budget.lines.length" class="empty-costs">
                Sa pole veel kuluridu lisanud. Sinu eelarve on
                {{ formatEuro(draft.budgetCents ?? 0) }}.
              </p>
              <ul v-else class="review-cost-list">
                <li v-for="line in budget.lines" :key="line.cost.id">
                  <span>
                    <strong>{{ line.cost.title }}</strong>
                    <small>
                      {{ line.cost.pricingModel.replace('_', ' ') }}
                      <template v-if="line.cost.priceSource === 'personal-estimate'">
                        · sinu hinnang</template
                      >
                      <template v-else-if="line.cost.status === 'needs-quote'">
                        · vajab pakkumist</template
                      >
                      <template v-else> · eelvaate hind</template>
                    </small>
                  </span>
                  <strong>
                    {{
                      line.subtotalCents === null
                        ? 'Hind selgub pakkumisel'
                        : formatEuro(line.subtotalCents)
                    }}
                  </strong>
                </li>
              </ul>
              <div class="budget-total">
                <span>Teadaolevad kulud</span>
                <strong>{{ formatEuro(budget.knownSubtotalCents) }}</strong>
              </div>
              <div v-if="budget.estimatedSubtotalCents" class="budget-total secondary-total">
                <span>Sellest hinnangulised</span>
                <strong>{{ formatEuro(budget.estimatedSubtotalCents) }}</strong>
              </div>
              <div class="budget-total" :class="{ 'over-budget': budget.isOverBudget }">
                <span>{{
                  budget.isOverBudget ? 'Ületab eelarvet' : 'Eelarvest jääb teadaolevalt'
                }}</span>
                <strong>{{ formatEuro(Math.abs(budget.remainingBudgetCents ?? 0)) }}</strong>
              </div>
              <div class="budget-total">
                <span>Teadaolev kulu külalise kohta</span>
                <strong>{{ formatEuro(budget.perGuestCents ?? 0) }}</strong>
              </div>
              <p v-if="budget.hasUnpricedLines" class="quote-warning">
                Mõni rida vajab tarnija pakkumist. Seetõttu ei ole lõplik kogusumma veel teada.
              </p>
              <p v-if="budget.isOverBudget" class="over-budget-note">
                Teadaolevad kulud ületavad sinu eelarvet. Muuda eelarvet või eemalda kuluridu.
              </p>
            </section>

            <div class="preview-disclaimer">
              See on brauseris koostatud planeerimise eelvaade, mitte salvestatud tellimus ega
              pakkumine. Hinnad ei sisalda automaatselt makse ega kohaletoimetamist ning neid ei ole
              serveris kinnitatud.
            </div>
            <div class="save-draft-panel">
              <div>
                <strong>
                  {{ plannerStore.savedPlanId ? 'Salvesta plaani muudatused' : 'Soovid plaani alles hoida?' }}
                </strong>
                <p>
                  {{ auth.isAuthenticated
                    ? 'Mustand salvestatakse sinu kontole ning on nähtav ainult sulle.'
                    : 'Logi sisse või loo konto, et mustand oma kontole salvestada.' }}
                </p>
              </div>
              <button
                class="button button-primary"
                type="button"
                :disabled="plannerStore.isSaving"
                @click="saveCurrentDraft"
              >
                {{
                  plannerStore.isSaving
                    ? 'Salvestan…'
                    : auth.isAuthenticated
                      ? plannerStore.savedPlanId
                        ? 'Salvesta muudatused'
                        : 'Salvesta mustand'
                      : 'Logi sisse ja salvesta'
                }}
              </button>
              <p v-if="plannerStore.saveMessage" class="save-success" role="status">
                {{ plannerStore.saveMessage }}
                <router-link to="/account">Vaata minu kontot</router-link>
              </p>
              <p v-if="plannerStore.saveError" class="field-error" role="alert">
                {{ plannerStore.saveError }}
              </p>
            </div>
            <button
              class="button button-secondary restart-button"
              type="button"
              @click="resetPlanner"
            >
              Alusta uut plaani
            </button>
          </div>

          <div class="planner-actions">
            <button
              v-if="currentStep > 0"
              class="button button-secondary"
              type="button"
              @click="goBack"
            >
              Tagasi
            </button>
            <span v-else></span>
            <button
              v-if="currentStep < plannerSteps.length - 1"
              class="button button-primary"
              type="button"
              @click="goNext"
            >
              Jätka
            </button>
            <router-link v-else class="button button-primary" to="/pricing">
              Vaata pakette
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.planner-intro {
  max-width: 760px;
  margin-bottom: 32px;
}

.planner-intro h1 {
  margin-bottom: 15px;
  font-size: clamp(2.6rem, 5vw, 4.3rem);
}

.planner-layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  align-items: start;
  gap: 25px;
}

.planner-sidebar,
.planner-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow);
}

.planner-sidebar {
  position: sticky;
  top: 105px;
  padding: 22px 18px;
}

.sidebar-title {
  margin: 0 0 16px;
  font-size: 0.87rem;
  font-weight: 800;
}

.planner-step-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.planner-step-list button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 11px 9px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  text-align: left;
  font-size: 0.87rem;
}

.planner-step-list button.active {
  background: #fff0e7;
  color: var(--text);
  font-weight: 750;
}

.planner-step-list button.complete {
  color: #43856a;
}

.planner-step-list button:disabled {
  cursor: default;
}

.step-index {
  display: grid;
  width: 29px;
  height: 29px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: #fff;
  font-size: 0.7rem;
  font-weight: 800;
}

.active .step-index {
  border-color: transparent;
  background: var(--primary);
  color: white;
}

.privacy-note {
  display: flex;
  gap: 9px;
  margin-top: 21px;
  padding: 12px;
  border-radius: 13px;
  background: #f7f3ef;
}

.privacy-note > span {
  color: var(--primary-dark);
  font-weight: 800;
}

.privacy-note p {
  margin: 0;
  color: var(--muted);
  font-size: 0.72rem;
  line-height: 1.5;
}

.planner-main {
  min-width: 0;
}

.planner-progress-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin: 0 4px 9px;
  color: var(--muted);
  font-size: 0.78rem;
}

.planner-progress-header span:last-child {
  color: var(--text);
  font-weight: 700;
}

.planner-progress-track {
  height: 7px;
  overflow: hidden;
  margin: 0 4px 18px;
  border-radius: 99px;
  background: #eee5df;
}

.planner-progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--primary), #ffbd87);
  transition: width 0.25s ease;
}

.planner-card {
  padding: clamp(22px, 4vw, 38px);
}

.step-content {
  min-height: 440px;
}

.step-content > h2 {
  margin-bottom: 10px;
  font-size: clamp(1.9rem, 4vw, 2.7rem);
}

.step-content > .eyebrow {
  margin-bottom: 12px;
}

.step-intro {
  margin: 0 0 25px;
  color: var(--muted);
  line-height: 1.65;
}

.field-label,
.choice-fieldset legend {
  display: block;
  margin: 20px 0 8px;
  color: var(--text);
  font-size: 0.87rem;
  font-weight: 750;
}

.choice-fieldset {
  min-width: 0;
  margin: 22px 0 0;
  padding: 0;
  border: 0;
}

.choice-fieldset legend {
  margin-top: 0;
}

.text-input {
  width: 100%;
  min-height: 47px;
  padding: 11px 13px;
  border: 1px solid #d9cfca;
  border-radius: 12px;
  background: #fff;
  color: var(--text);
  font: inherit;
  font-size: 0.9rem;
}

.text-input:focus {
  border-color: var(--primary-dark);
}

.text-input:disabled {
  background: #f6f2ef;
  color: var(--muted);
}

.choice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.choice-grid--compact {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.choice-card,
.priority-option {
  display: flex;
  min-height: 49px;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: white;
  cursor: pointer;
  font-size: 0.84rem;
  line-height: 1.4;
}

.choice-card:has(input:checked),
.priority-option.selected {
  border-color: rgba(223, 91, 59, 0.56);
  background: #fff6f1;
}

.choice-card input,
.priority-option input {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  accent-color: var(--primary-dark);
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.theme-option {
  display: flex;
  min-height: 72px;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: white;
  cursor: pointer;
}

.theme-option.selected {
  border-color: rgba(223, 91, 59, 0.56);
  background: #fff6f1;
}

.theme-option input {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  accent-color: var(--primary-dark);
}

.theme-option input:focus-visible + span {
  outline: 3px solid #6f3829;
  outline-offset: 3px;
}

.theme-option > span:nth-child(2) {
  display: grid;
  flex: 1;
  gap: 4px;
}

.theme-option strong {
  font-size: 0.87rem;
}

.theme-option small {
  color: var(--muted);
  font-size: 0.73rem;
}

.theme-check {
  color: var(--primary-dark);
  font-weight: 800;
}

.custom-theme-field {
  margin-top: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 15px;
}

.form-grid .field-label {
  margin-top: 0;
}

.priority-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.money-input-wrap {
  position: relative;
}

.money-input-wrap input {
  padding-right: 60px;
}

.money-input-wrap > span {
  position: absolute;
  top: 50%;
  right: 14px;
  color: var(--muted);
  font-size: 0.75rem;
  transform: translateY(-50%);
}

.field-hint {
  margin: 7px 0 0;
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.5;
}

.field-error {
  margin: 7px 0 0;
  color: #a3312a;
  font-size: 0.8rem;
  line-height: 1.5;
}

.budget-reminder,
.preview-disclaimer {
  margin-top: 24px;
  padding: 15px 17px;
  border-radius: 14px;
  background: #f8f2ed;
}

.budget-reminder strong {
  font-size: 0.84rem;
}

.budget-reminder p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.8rem;
  line-height: 1.6;
}

.recommendation-list {
  display: grid;
  gap: 9px;
  margin-bottom: 28px;
}

.recommendation-list p {
  display: flex;
  gap: 10px;
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8f3ed;
  color: var(--muted);
  font-size: 0.83rem;
  line-height: 1.5;
}

.recommendation-list span {
  color: var(--primary-dark);
}

.cost-picker h3,
.custom-cost-form h3,
.selected-costs h3 {
  margin-bottom: 8px;
  font-size: 1.08rem;
  letter-spacing: -0.035em;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.template-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: white;
}

.template-card strong {
  font-size: 0.82rem;
}

.template-card p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 0.72rem;
  line-height: 1.45;
}

.small-button,
.text-button,
.remove-button {
  border: 0;
  background: transparent;
  color: var(--primary-dark);
  cursor: pointer;
  font: inherit;
  font-size: 0.77rem;
  font-weight: 750;
}

.small-button {
  flex: 0 0 auto;
  padding: 7px 10px;
  border: 1px solid rgba(223, 91, 59, 0.2);
  border-radius: 999px;
}

.small-button:disabled {
  border-color: var(--line);
  color: var(--muted);
  cursor: default;
}

.custom-cost-form {
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid var(--line);
}

.custom-cost-form .button {
  margin-top: 14px;
}

.selected-costs {
  margin-top: 26px;
}

.selected-costs ul,
.review-cost-list {
  display: grid;
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.selected-costs li,
.review-cost-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
}

.selected-costs li > span:first-child,
.review-cost-list li > span:first-child {
  display: grid;
  gap: 4px;
}

.selected-costs strong,
.review-cost-list strong {
  font-size: 0.83rem;
}

.selected-costs small,
.review-cost-list small {
  color: var(--muted);
  font-size: 0.72rem;
}

.cost-preview {
  flex: 0 0 auto;
  font-size: 0.82rem;
  font-weight: 750;
}

.planner-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.review-step {
  min-height: 0;
}

.review-section {
  margin-top: 26px;
}

.review-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.review-heading h3 {
  margin: 0;
  font-size: 1.05rem;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px 20px;
  margin: 16px 0 0;
  padding: 17px;
  border-radius: 14px;
  background: #f8f3ef;
}

.review-grid div {
  min-width: 0;
}

.review-grid dt {
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 0.72rem;
}

.review-grid dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 0.84rem;
  font-weight: 700;
}

.empty-costs {
  margin: 14px 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.budget-total {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 2px;
  border-bottom: 1px solid var(--line);
  font-size: 0.84rem;
}

.budget-total strong {
  flex: 0 0 auto;
}

.secondary-total {
  color: var(--muted);
  font-size: 0.78rem;
}

.over-budget {
  color: #a3312a;
  font-weight: 750;
}

.quote-warning,
.over-budget-note {
  margin: 13px 0 0;
  color: #8a5123;
  font-size: 0.82rem;
  line-height: 1.55;
}

.over-budget-note {
  color: #a3312a;
}

.preview-disclaimer {
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.6;
}

.save-draft-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px 20px;
  margin-top: 18px;
  padding: 17px;
  border: 1px solid rgba(223, 91, 59, 0.18);
  border-radius: 15px;
  background: #fff8f4;
}

.save-draft-panel strong {
  font-size: 0.88rem;
}

.save-draft-panel p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.5;
}

.save-draft-panel .button {
  grid-column: 2;
  grid-row: 1;
  white-space: nowrap;
}

.save-success {
  grid-column: 1 / -1;
  margin: 0;
  color: #28603b;
  font-size: 0.82rem;
}

.save-success a {
  margin-left: 5px;
  color: #28603b;
  font-weight: 750;
}

.restart-button {
  margin-top: 14px;
}

@media (max-width: 850px) {
  .planner-layout {
    grid-template-columns: 1fr;
  }

  .planner-sidebar {
    position: static;
    padding: 15px;
  }

  .planner-step-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .planner-step-list button {
    gap: 7px;
    font-size: 0.75rem;
  }

  .step-index {
    width: 25px;
    height: 25px;
  }

  .privacy-note {
    margin-top: 13px;
  }

  .step-content {
    min-height: 0;
  }
}

@media (max-width: 560px) {
  .planner-step-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .theme-options,
  .form-grid,
  .priority-grid,
  .template-grid,
  .review-grid {
    grid-template-columns: 1fr;
  }

  .planner-card {
    padding: 22px 17px;
  }

  .planner-actions .button {
    padding: 0.82rem 1.1rem;
  }

  .selected-costs li,
  .review-cost-list li {
    flex-wrap: wrap;
  }

  .save-draft-panel {
    grid-template-columns: 1fr;
  }

  .save-draft-panel .button {
    grid-column: auto;
    grid-row: auto;
    justify-self: start;
  }
}
</style>
