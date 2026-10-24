/**
 * @file Consigne prices by subscription plan.
 *
 * Amounts are handled in cents to avoid rounding errors. Plans and prices
 * are placeholders in the demo (docs/PRODUCT.md, open questions 8 and 9).
 */
import type { SubscriptionPlan } from '@city-groom/demo-data'

/** "4.00" → 400 */
export const toCents = (amount: string): number => Math.round(Number.parseFloat(amount) * 100)

/** Price of one consigne booking for a plan. */
export interface ConsignePrice {
  /** Price without subscription, in cents. */
  baseCents: number
  /** Price with the plan's discount, in cents. */
  cents: number
}

/**
 * Price of a consigne booking.
 *
 * @param prices - Price per size without subscription ("4.00").
 * @param size - Compartment size.
 * @param plan - Customer's plan.
 * @returns The price, or null if the size is not offered for the consigne.
 */
export function consignePrice(
  prices: Record<string, string>,
  size: string,
  plan: SubscriptionPlan,
): ConsignePrice | null {
  const base = prices[size]
  if (base === undefined) return null
  const baseCents = toCents(base)
  return {
    baseCents,
    cents: Math.round(baseCents * (1 - Number.parseFloat(plan.consigne_discount))),
  }
}
