import { describe, expect, it } from 'vitest';
import { budgetStepSchema, conditionsStepSchema, partyStepSchema, themeStepSchema } from './model';

const futureDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

const pastDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

describe('planner validation', () => {
  it('requires a title, event type, audience and age range', () => {
    expect(
      partyStepSchema.safeParse({
        title: ' ',
        partyType: '',
        audience: '',
        ageGroup: '',
      }).success,
    ).toBe(false);
    expect(
      partyStepSchema.safeParse({
        title: 'Mia pidu',
        partyType: 'birthday',
        audience: 'children',
        ageGroup: '6–12 aastat',
      }).success,
    ).toBe(true);
  });

  it('requires a description when the user chooses a custom theme', () => {
    expect(themeStepSchema.safeParse({ theme: 'custom', customTheme: '' }).success).toBe(false);
    expect(themeStepSchema.safeParse({ theme: 'custom', customTheme: 'Metsapidu' }).success).toBe(
      true,
    );
  });

  it('rejects invalid date, past date, invalid time and guest counts above the limit', () => {
    const validConditions = {
      guestCount: 20,
      eventDate: futureDate(),
      eventTime: '14:30',
      location: 'Tartu',
      venueType: 'indoor',
      venueNeed: 'have-venue',
    };

    expect(conditionsStepSchema.safeParse(validConditions).success).toBe(true);
    expect(
      conditionsStepSchema.safeParse({ ...validConditions, eventDate: '2026-02-31' }).success,
    ).toBe(false);
    expect(
      conditionsStepSchema.safeParse({ ...validConditions, eventDate: pastDate() }).success,
    ).toBe(false);
    expect(conditionsStepSchema.safeParse({ ...validConditions, eventTime: '25:70' }).success).toBe(
      false,
    );
    expect(conditionsStepSchema.safeParse({ ...validConditions, guestCount: 201 }).success).toBe(
      false,
    );
  });

  it('requires a usable budget and at least one priority', () => {
    expect(budgetStepSchema.safeParse({ budgetCents: 4_999, priorities: ['food'] }).success).toBe(
      false,
    );
    expect(budgetStepSchema.safeParse({ budgetCents: 10_000, priorities: [] }).success).toBe(false);
    expect(budgetStepSchema.safeParse({ budgetCents: 10_000, priorities: ['food'] }).success).toBe(
      true,
    );
  });
});
