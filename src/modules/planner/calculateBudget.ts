import {
  costSchema,
  MAX_BUDGET_CENTS,
  MAX_GUESTS,
  type BudgetCalculation,
  type PlanCost,
} from './model';

const calculateLine = (cost: PlanCost, guestCount: number): number | null => {
  if (cost.pricingModel === 'quote' || cost.pricingModel === 'negotiable') {
    return null;
  }

  if (cost.unitPriceCents === null) {
    throw new Error(`Hinnaga real "${cost.title}" puudub ühikuhind.`);
  }

  const units = cost.pricingModel === 'per_guest' ? cost.quantity * guestCount : cost.quantity;
  const subtotalCents = units * cost.unitPriceCents;

  if (!Number.isSafeInteger(subtotalCents) || subtotalCents > MAX_BUDGET_CENTS) {
    throw new RangeError(`Rea "${cost.title}" summa ületab toetatud piiri.`);
  }

  return subtotalCents;
};

export const calculateBudget = (
  costs: PlanCost[],
  guestCount: number,
  budgetCents: number,
): BudgetCalculation => {
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > MAX_GUESTS) {
    throw new RangeError(`Külaliste arv peab olema vahemikus 1–${MAX_GUESTS}.`);
  }
  if (!Number.isSafeInteger(budgetCents) || budgetCents < 0 || budgetCents > MAX_BUDGET_CENTS) {
    throw new RangeError('Eelarve peab olema korrektne summa sentides.');
  }

  const lines = costs.map((cost) => {
    const parsedCost = costSchema.safeParse(cost);
    if (!parsedCost.success) {
      throw new TypeError(`Kulu "${cost.title}" andmed ei ole korrektsed.`);
    }

    return { cost: parsedCost.data, subtotalCents: calculateLine(parsedCost.data, guestCount) };
  });

  const knownSubtotalCents = lines.reduce((total, line) => total + (line.subtotalCents ?? 0), 0);
  if (!Number.isSafeInteger(knownSubtotalCents) || knownSubtotalCents > MAX_BUDGET_CENTS) {
    throw new RangeError('Teadaolevate kulude summa ületab toetatud piiri.');
  }

  const estimatedSubtotalCents = lines.reduce(
    (total, line) => total + (line.cost.status === 'estimate' ? (line.subtotalCents ?? 0) : 0),
    0,
  );
  const confirmedSubtotalCents = lines.reduce(
    (total, line) => total + (line.cost.status === 'confirmed' ? (line.subtotalCents ?? 0) : 0),
    0,
  );
  const hasUnpricedLines = lines.some((line) => line.subtotalCents === null);

  return {
    lines,
    knownSubtotalCents,
    estimatedSubtotalCents,
    confirmedSubtotalCents,
    hasUnpricedLines,
    remainingBudgetCents: budgetCents - knownSubtotalCents,
    isOverBudget: knownSubtotalCents > budgetCents,
    perGuestCents: Math.round(knownSubtotalCents / guestCount),
  };
};

export const formatEuro = (amountCents: number): string =>
  new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
