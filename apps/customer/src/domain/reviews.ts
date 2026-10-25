/**
 * @file Verified reviews (ADR-0008): only a customer who completed an order
 * with a shop can rate it, once per order, from 1 to 5.
 */

/** Order fields that decide whether it can be reviewed. */
export interface ReviewableOrder {
  id: string
  status: string
  /** Weekly pack orders are not tied to one shop, so they are not rated. */
  packId?: string
}

/** Whether an order can be reviewed now: collected by the customer, not yet reviewed. */
export function canReview(order: ReviewableOrder, reviewedOrderIds: ReadonlySet<string>): boolean {
  return order.status === 'picked_up' && !order.packId && !reviewedOrderIds.has(order.id)
}

/** Whether a rating is valid: a whole number from 1 to 5. */
export const isValidRating = (rating: number): boolean =>
  Number.isInteger(rating) && rating >= 1 && rating <= 5

/** Average and count after adding ratings, rounded to one decimal. */
export function withRatings(
  base: { average: number; count: number },
  added: number[],
): { average: number; count: number } {
  const count = base.count + added.length
  if (!count) return { average: 0, count: 0 }
  const total = base.average * base.count + added.reduce((sum, r) => sum + r, 0)
  return { average: Math.round((total / count) * 10) / 10, count }
}
