import { describe, expect, it } from 'vitest';
import { calculateBudget, formatEuro } from './calculateBudget';
import type { PlanCost } from './model';

const cost = (overrides: Partial<PlanCost>): PlanCost => ({
  id: 'line-1',
  title: 'Testikulu',
  pricingModel: 'fixed',
  quantity: 1,
  unitPriceCents: 1_000,
  priceSource: 'personal-estimate',
  status: 'estimate',
  ...overrides,
});

describe('calculateBudget', () => {
  it('calculates fixed, per-guest, per-unit, hourly and from prices in integer cents', () => {
    const result = calculateBudget(
      [
        cost({ id: 'fixed', unitPriceCents: 2_999 }),
        cost({ id: 'guest', pricingModel: 'per_guest', quantity: 1, unitPriceCents: 1_250 }),
        cost({ id: 'unit', pricingModel: 'per_unit', quantity: 3, unitPriceCents: 199 }),
        cost({ id: 'hourly', pricingModel: 'hourly', quantity: 3, unitPriceCents: 5_000 }),
        cost({ id: 'from', pricingModel: 'from', quantity: 2, unitPriceCents: 2_500 }),
      ],
      4,
      50_000,
    );

    expect(result.lines.map((line) => line.subtotalCents)).toEqual([
      2_999, 5_000, 597, 15_000, 5_000,
    ]);
    expect(result.knownSubtotalCents).toBe(28_596);
    expect(result.remainingBudgetCents).toBe(21_404);
    expect(result.perGuestCents).toBe(7_149);
    expect(result.isOverBudget).toBe(false);
    expect(formatEuro(2_999)).toContain('29,99');
  });

  it('does not make up a total for quote-based and negotiable costs', () => {
    const result = calculateBudget(
      [
        cost({ id: 'known', unitPriceCents: 10_000 }),
        cost({
          id: 'quote',
          pricingModel: 'quote',
          unitPriceCents: null,
          priceSource: 'supplier',
          status: 'needs-quote',
        }),
        cost({
          id: 'negotiable',
          pricingModel: 'negotiable',
          unitPriceCents: null,
          priceSource: 'supplier',
          status: 'needs-quote',
        }),
      ],
      10,
      9_000,
    );

    expect(result.lines.map((line) => line.subtotalCents)).toEqual([10_000, null, null]);
    expect(result.hasUnpricedLines).toBe(true);
    expect(result.knownSubtotalCents).toBe(10_000);
    expect(result.remainingBudgetCents).toBe(-1_000);
    expect(result.isOverBudget).toBe(true);
  });

  it('rejects invalid quantities, guests, prices and budget amounts', () => {
    expect(() => calculateBudget([cost({ quantity: 0 })], 10, 10_000)).toThrow(TypeError);
    expect(() => calculateBudget([], 0, 10_000)).toThrow(RangeError);
    expect(() => calculateBudget([], 10, 50_000.5)).toThrow(RangeError);
    expect(() => calculateBudget([cost({ unitPriceCents: null })], 10, 10_000)).toThrow(TypeError);
  });
});
