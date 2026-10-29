import { z } from 'zod';

export const MAX_GUESTS = 200;
export const MAX_BUDGET_CENTS = 5_000_000;

export const partyTypes = [
  { value: 'birthday', label: 'Sünnipäev' },
  { value: 'anniversary', label: 'Aastapäev või juubel' },
  { value: 'baby-shower', label: 'Beebipidu' },
  { value: 'graduation', label: 'Lõpupidu' },
  { value: 'other', label: 'Muu tähistamine' },
] as const;

export const themes = [
  { value: 'adventure', label: 'Väike seikleja', audience: 'Lapsed ja pere' },
  { value: 'pirate', label: 'Piraadilaht', audience: 'Lapsed ja pere' },
  { value: 'western', label: 'Wild West', audience: 'Igas vanuses' },
  { value: 'nineties', label: '90ndate pidu', audience: 'Täiskasvanud ja noored' },
  { value: 'dinner', label: 'Õhtusöök küünlavalgel', audience: 'Täiskasvanud' },
  { value: 'custom', label: 'Mul on oma idee', audience: 'Sinu valik' },
] as const;

export const ageGroups = ['0–5 aastat', '6–12 aastat', '13–17 aastat', '18+ aastat', 'Eri vanuses'] as const;

export const plannerSteps = [
  'Sündmus',
  'Teema',
  'Tingimused',
  'Eelarve',
  'Soovitused',
  'Ülevaade',
] as const;

export type PartyType = (typeof partyTypes)[number]['value'];
export type ThemeId = (typeof themes)[number]['value'];
export type Audience = 'children' | 'adults' | 'mixed';
export type VenueType = 'indoor' | 'outdoor' | 'either';
export type VenueNeed = 'have-venue' | 'find-venue';
export type Priority = 'food' | 'activities' | 'decor' | 'convenience';
export type PricingModel =
  'fixed' | 'per_guest' | 'per_unit' | 'hourly' | 'from' | 'quote' | 'negotiable';
export type PriceSource = 'catalog' | 'personal-estimate' | 'supplier';
export type PriceStatus = 'estimate' | 'needs-quote' | 'confirmed';

export interface PlanCost {
  id: string;
  title: string;
  pricingModel: PricingModel;
  quantity: number;
  unitPriceCents: number | null;
  priceSource: PriceSource;
  status: PriceStatus;
}

export interface PlannerDraft {
  title: string;
  partyType: PartyType | '';
  audience: Audience | '';
  ageGroup: string;
  theme: ThemeId | '';
  customTheme: string;
  guestCount: number | null;
  eventDate: string;
  eventTime: string;
  location: string;
  venueType: VenueType | '';
  venueNeed: VenueNeed | '';
  budgetCents: number | null;
  priorities: Priority[];
  costs: PlanCost[];
}

export interface CostCalculation {
  cost: PlanCost;
  subtotalCents: number | null;
}

export interface BudgetCalculation {
  lines: CostCalculation[];
  knownSubtotalCents: number;
  estimatedSubtotalCents: number;
  confirmedSubtotalCents: number;
  hasUnpricedLines: boolean;
  remainingBudgetCents: number | null;
  isOverBudget: boolean;
  perGuestCents: number | null;
}

const positiveInt = z.number().int().positive();
const centsAmount = z.number().int().nonnegative().max(MAX_BUDGET_CENTS);
const isValidDate = (value: string): boolean => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};
const localToday = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;
};

export const partyStepSchema = z.object({
  title: z.string().trim().min(2, 'Lisa peole nimi.').max(80, 'Nimi võib olla kuni 80 tähemärki.'),
  partyType: z.enum(['birthday', 'anniversary', 'baby-shower', 'graduation', 'other'], {
    error: 'Vali sündmuse tüüp.',
  }),
  audience: z.enum(['children', 'adults', 'mixed'], { error: 'Vali peo sihtrühm.' }),
  ageGroup: z.enum(ageGroups, { error: 'Vali vanusevahemik.' }),
});

export const themeStepSchema = z
  .object({
    theme: z.enum(['adventure', 'pirate', 'western', 'nineties', 'dinner', 'custom'], {
      error: 'Vali peoteema.',
    }),
    customTheme: z.string().trim(),
  })
  .superRefine((value, context) => {
    if (value.theme === 'custom' && value.customTheme.length < 2) {
      context.addIssue({
        code: 'custom',
        path: ['customTheme'],
        message: 'Kirjelda oma teemaideed.',
      });
    }
  });

export const conditionsStepSchema = z.object({
  guestCount: positiveInt.max(MAX_GUESTS, `Külalisi saab olla kuni ${MAX_GUESTS}.`),
  eventDate: z
    .string()
    .min(1, 'Vali peo kuupäev.')
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), 'Sisesta kehtiv kuupäev.')
    .refine(isValidDate, 'Sisesta kehtiv kuupäev.')
    .refine((value) => value >= localToday(), 'Kuupäev ei saa olla minevikus.'),
  eventTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Sisesta kehtiv algusaeg.')
    .min(1, 'Vali peo algusaeg.'),
  location: z.string().trim().min(2, 'Lisa asukoht või piirkond.').max(120),
  venueType: z.enum(['indoor', 'outdoor', 'either'], { error: 'Vali peo asukoha tüüp.' }),
  venueNeed: z.enum(['have-venue', 'find-venue'], { error: 'Anna teada, kas vajad peokohta.' }),
});

export const budgetStepSchema = z.object({
  budgetCents: centsAmount.min(5_000, 'Eelarve peab olema vähemalt 50 €.'),
  priorities: z
    .array(z.enum(['food', 'activities', 'decor', 'convenience']))
    .min(1, 'Vali vähemalt üks prioriteet.'),
});

export const costSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1).max(100),
    pricingModel: z.enum([
      'fixed',
      'per_guest',
      'per_unit',
      'hourly',
      'from',
      'quote',
      'negotiable',
    ]),
    quantity: positiveInt.max(10_000),
    unitPriceCents: centsAmount.nullable(),
    priceSource: z.enum(['catalog', 'personal-estimate', 'supplier']),
    status: z.enum(['estimate', 'needs-quote', 'confirmed']),
  })
  .superRefine((cost, context) => {
    const needsQuote = cost.pricingModel === 'quote' || cost.pricingModel === 'negotiable';
    if (needsQuote && (cost.unitPriceCents !== null || cost.status !== 'needs-quote')) {
      context.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'Hinnapakkumist vajaval real puudub hind kuni tarnija kinnitamiseni.',
      });
    }
    if (!needsQuote && cost.unitPriceCents === null) {
      context.addIssue({
        code: 'custom',
        path: ['unitPriceCents'],
        message: 'Lisa hinnanguline hind või vali pakkumist vajav hinnastamine.',
      });
    }
  });

export const costsStepSchema = z.object({
  costs: z.array(costSchema).max(100, 'Lisa plaani kuni 100 kulurida.'),
});

export const defaultPlannerDraft = (): PlannerDraft => ({
  title: '',
  partyType: '',
  audience: '',
  ageGroup: '',
  theme: '',
  customTheme: '',
  guestCount: 20,
  eventDate: '',
  eventTime: '',
  location: '',
  venueType: '',
  venueNeed: '',
  budgetCents: 100_000,
  priorities: ['food', 'activities'],
  costs: [],
});

export const validatePlannerDraft = (draft: PlannerDraft) => {
  const event = partyStepSchema.parse({
    title: draft.title,
    partyType: draft.partyType,
    audience: draft.audience,
    ageGroup: draft.ageGroup,
  });
  const theme = themeStepSchema.parse({
    theme: draft.theme,
    customTheme: draft.customTheme,
  });
  const conditions = conditionsStepSchema.parse({
    guestCount: draft.guestCount,
    eventDate: draft.eventDate,
    eventTime: draft.eventTime,
    location: draft.location,
    venueType: draft.venueType,
    venueNeed: draft.venueNeed,
  });
  const budget = budgetStepSchema.parse({
    budgetCents: draft.budgetCents,
    priorities: draft.priorities,
  });
  const costs = costsStepSchema.parse({ costs: draft.costs });

  return {
    ...draft,
    ...event,
    ...theme,
    ...conditions,
    ...budget,
    ...costs,
  };
};

export const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'food', label: 'Söök ja jook' },
  { value: 'activities', label: 'Tegevused ja meelelahutus' },
  { value: 'decor', label: 'Dekoratsioonid ja teema' },
  { value: 'convenience', label: 'Mugavus ja teenused' },
];
