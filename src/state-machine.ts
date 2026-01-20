/**
 * Trustap Transaction State Machine
 *
 * Defines valid states and transitions for Trustap transactions
 * States align with official Trustap API documentation
 */

export type TrustapTransactionState =
  | "created"
  | "joined"
  | "rejected"
  | "paid"
  | "cancelled"
  | "cancelled_with_payment"
  | "payment_refunded"
  | "tracked"
  | "delivered"
  | "complained"
  | "complaint_period_ended"
  | "funds_released";

export type TrustapWebhookEventCode = (typeof trustapWebhookEventCodes)[number];

const trustapWebhookEventCodes = [
  "basic_tx.joined",
  "basic_tx.rejected",
  "basic_tx.cancelled",
  "basic_tx.claimed",
  "basic_tx.listing_transaction_accepted",
  "basic_tx.listing_transaction_rejected",
  "basic_tx.payment_failed",
  "basic_tx.paid",
  "basic_tx.payment_refunded",
  "basic_tx.payment_review_flagged",
  "basic_tx.payment_review_finished",
  "basic_tx.tracking_details_submission_deadline_extended",
  "basic_tx.tracked",
  "basic_tx.delivered",
  "basic_tx.complained",
  "basic_tx.complaint_period_ended",
  "basic_tx.funds_released",
  "basic_tx.funds_refunded",
] as const satisfies readonly string[];

/**
 * Maps webhook event types to Trustap transaction states
 */
export function mapWebhookToTrustapState(
  eventType: string,
): TrustapTransactionState | null {
  if (
    !trustapWebhookEventCodes.includes(eventType as TrustapWebhookEventCode)
  ) {
    return null;
  }

  const eventStateMap: Record<string, TrustapTransactionState> = {
    "basic_tx.joined": "joined",
    "basic_tx.rejected": "rejected",
    "basic_tx.cancelled": "cancelled",
    "basic_tx.claimed": "created",
    "basic_tx.listing_transaction_accepted": "joined",
    "basic_tx.listing_transaction_rejected": "rejected",
    "basic_tx.payment_failed": "created",
    "basic_tx.paid": "paid",
    "basic_tx.payment_refunded": "payment_refunded",
    "basic_tx.payment_review_flagged": "paid",
    "basic_tx.payment_review_finished": "paid",
    "basic_tx.tracking_details_submission_deadline_extended": "tracked",
    "basic_tx.tracked": "tracked",
    "basic_tx.delivered": "delivered",
    "basic_tx.complained": "complained",
    "basic_tx.complaint_period_ended": "complaint_period_ended",
    "basic_tx.funds_released": "funds_released",
    "basic_tx.funds_refunded": "payment_refunded",
  };

  return eventStateMap[eventType] ?? null;
}
