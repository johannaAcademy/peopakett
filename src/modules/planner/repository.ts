import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';
import {
  costSchema,
  type PlannerDraft,
  validatePlannerDraft,
} from './model';

const savedDetailsSchema = z.object({
  customTheme: z.string(),
  venueNeed: z.enum(['have-venue', 'find-venue']),
  priorities: z.array(z.enum(['food', 'activities', 'decor', 'convenience'])),
  costs: z.array(costSchema),
});

const savedPlanSchema = z.object({
  event_type: z.enum(['birthday', 'anniversary', 'baby-shower', 'graduation', 'other']),
  audience: z.enum(['children', 'adults', 'mixed']),
  age_group: z.string().min(1).max(40),
  theme: z.enum(['adventure', 'pirate', 'western', 'nineties', 'dinner', 'custom']),
  guest_count: z.number().int().min(1).max(200),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/),
  location: z.string().min(2).max(120),
  venue_type: z.enum(['indoor', 'outdoor', 'either']),
  budget_cents: z.number().int().min(5_000).max(5_000_000),
});

export interface SavedPlanSummary {
  id: string;
  partyId: string;
  title: string;
  theme: string;
  eventDate: string;
  guestCount: number;
  budgetCents: number;
  updatedAt: string;
}

export const savePlannerDraft = async (
  draft: PlannerDraft,
  planId: string | null,
): Promise<string> => {
  const validDraft = validatePlannerDraft(draft);
  const payload = JSON.parse(JSON.stringify(validDraft)) as Json;
  const { data, error } = await getSupabaseClient().rpc('save_party_draft', {
    p_plan_id: planId,
    p_draft: payload,
  });

  if (error) {
    throw new Error(`Peoplaani salvestamine ebaõnnestus: ${error.message}`);
  }
  if (!data) {
    throw new Error('Peoplaani salvestamine ei tagastanud plaani tunnust.');
  }
  return data;
};

export const listSavedPlans = async (): Promise<SavedPlanSummary[]> => {
  const client = getSupabaseClient();
  const { data: plans, error } = await client
    .from('party_plans')
    .select('id, party_id, theme, event_date, guest_count, budget_cents, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Peoplaanide laadimine ebaõnnestus: ${error.message}`);
  }
  if (plans.length === 0) {
    return [];
  }

  const partyIds = [...new Set(plans.map((plan) => plan.party_id))];
  const { data: parties, error: partiesError } = await client
    .from('parties')
    .select('id, title')
    .in('id', partyIds);

  if (partiesError) {
    throw new Error(`Peoplaanide nimede laadimine ebaõnnestus: ${partiesError.message}`);
  }

  const titles = new Map(parties.map((party) => [party.id, party.title]));
  return plans.map((plan) => {
    const title = titles.get(plan.party_id);
    if (!title) {
      throw new Error(`Peoplaanil ${plan.id} puudub seotud sündmus.`);
    }

    return {
      id: plan.id,
      partyId: plan.party_id,
      title,
      theme: plan.theme,
      eventDate: plan.event_date,
      guestCount: plan.guest_count,
      budgetCents: plan.budget_cents,
      updatedAt: plan.updated_at,
    };
  });
};

export const loadSavedPlan = async (planId: string): Promise<PlannerDraft> => {
  const client = getSupabaseClient();
  const { data: plan, error } = await client
    .from('party_plans')
    .select(
      'id, party_id, event_type, audience, age_group, theme, guest_count, event_date, event_time, location, venue_type, budget_cents, details',
    )
    .eq('id', planId)
    .maybeSingle();

  if (error) {
    throw new Error(`Peoplaani laadimine ebaõnnestus: ${error.message}`);
  }
  if (!plan) {
    throw new Error('Peoplaani ei leitud või sul pole sellele ligipääsu.');
  }
  const parsedPlan = savedPlanSchema.safeParse(plan);
  if (!parsedPlan.success) {
    throw new Error('Salvestatud peoplaani väljad on vigased ja seda ei saa avada.');
  }

  const details = savedDetailsSchema.safeParse(plan.details);
  if (!details.success) {
    throw new Error('Salvestatud peoplaani lisainfo on vigane ja seda ei saa avada.');
  }

  const { data: party, error: partyError } = await client
    .from('parties')
    .select('title')
    .eq('id', plan.party_id)
    .maybeSingle();

  if (partyError) {
    throw new Error(`Sündmuse nime laadimine ebaõnnestus: ${partyError.message}`);
  }
  if (!party) {
    throw new Error('Peoplaaniga seotud sündmust ei leitud.');
  }

  return {
    title: party.title,
    partyType: parsedPlan.data.event_type,
    audience: parsedPlan.data.audience,
    ageGroup: parsedPlan.data.age_group,
    theme: parsedPlan.data.theme,
    customTheme: details.data.customTheme,
    guestCount: parsedPlan.data.guest_count,
    eventDate: parsedPlan.data.event_date,
    eventTime: parsedPlan.data.event_time.slice(0, 5),
    location: parsedPlan.data.location,
    venueType: parsedPlan.data.venue_type,
    venueNeed: details.data.venueNeed,
    budgetCents: parsedPlan.data.budget_cents,
    priorities: details.data.priorities,
    costs: details.data.costs,
  };
};
