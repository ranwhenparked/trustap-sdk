/**
 * Trustap Transaction State Machines
 *
 * Defines valid states and transitions for Trustap transactions.
 * Supports both Online (shipped) and Face-to-Face transaction types.
 * States align with official Trustap API documentation.
 */

// =============================================================================
// Online Transaction States
// =============================================================================

export type TrustapOnlineTransactionState =
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

export const onlineStateTransitions: Record<
  TrustapOnlineTransactionState,
  readonly TrustapOnlineTransactionState[]
> = {
  created: ["joined", "cancelled"],
  joined: ["cancelled", "paid"],
  rejected: [],
  paid: ["tracked", "cancelled_with_payment"],
  cancelled: [],
  cancelled_with_payment: ["payment_refunded"],
  payment_refunded: [],
  tracked: ["delivered"],
  delivered: ["funds_released", "complained", "complaint_period_ended"],
  complained: ["funds_released", "payment_refunded"],
  complaint_period_ended: ["funds_released"],
  funds_released: [],
} as const;

export function isValidOnlineTransition(
  from: TrustapOnlineTransactionState,
  to: TrustapOnlineTransactionState,
): boolean {
  return onlineStateTransitions[from].includes(to);
}

// =============================================================================
// Face-to-Face Transaction States
// =============================================================================

export type TrustapF2FTransactionState =
  | "created"
  | "joined"
  | "rejected" // Not in lifecycle docs, but webhook exists
  | "deposit_paid"
  | "cancelled"
  | "deposit_accepted"
  | "remainder_skipped"
  | "cancelled_with_deposit"
  | "deposit_refunded"
  | "buyer_handover_confirmed"
  | "seller_handover_confirmed"
  | "complained"
  | "funds_released"
  | "complaint_period_ended";

export const f2fStateTransitions: Record<
  TrustapF2FTransactionState,
  readonly TrustapF2FTransactionState[]
> = {
  created: ["joined", "rejected", "cancelled"],
  joined: ["cancelled", "deposit_paid"],
  rejected: [], // Terminal state (not in lifecycle docs)
  deposit_paid: ["deposit_accepted", "cancelled_with_deposit", "remainder_skipped"],
  cancelled: [],
  deposit_accepted: ["remainder_skipped", "cancelled_with_deposit"],
  remainder_skipped: ["buyer_handover_confirmed", "seller_handover_confirmed", "complained"],
  cancelled_with_deposit: ["deposit_refunded"],
  deposit_refunded: [],
  buyer_handover_confirmed: ["complained", "complaint_period_ended"],
  seller_handover_confirmed: ["complained", "complaint_period_ended", "funds_released"],
  complained: ["funds_released"],
  funds_released: [],
  complaint_period_ended: ["funds_released"],
} as const;

export function isValidF2FTransition(
  from: TrustapF2FTransactionState,
  to: TrustapF2FTransactionState,
): boolean {
  return f2fStateTransitions[from].includes(to);
}

// =============================================================================
// F2F Webhook Event Mapping
// =============================================================================

export type TrustapF2FWebhookEventCode = (typeof f2fWebhookEventCodes)[number];

/**
 * F2F webhook event codes.
 *
 * Note: Some events lack sample payloads in Trustap docs (marked with comments).
 */
const f2fWebhookEventCodes = [
  "p2p_tx.joined",
  "p2p_tx.rejected", // No sample payload available
  "p2p_tx.cancelled",
  "p2p_tx.claimed", // No sample payload available
  "p2p_tx.deposit_payment_failed",
  "p2p_tx.deposit_paid",
  "p2p_tx.deposit_review_flagged", // No sample payload available
  "p2p_tx.deposit_review_finished", // No sample payload available
  "p2p_tx.deposit_refunded",
  "p2p_tx.deposit_accepted",
  "p2p_tx.priced", // No sample payload available
  "p2p_tx.remainder_skipped", // No sample payload available
  "p2p_tx.remainder_paid", // No sample payload available
  "p2p_tx.remainder_review_flagged", // No sample payload available
  "p2p_tx.remainder_review_finished", // No sample payload available
  "p2p_tx.buyer_handover_confirmed",
  "p2p_tx.seller_handover_confirmed",
  "p2p_tx.complained",
  "p2p_tx.funds_released",
  "p2p_tx.funds_refunded", // No sample payload available
] as const satisfies readonly string[];

/**
 * Maps F2F webhook event types to transaction states
 */
export function mapWebhookToF2FState(
  eventType: string,
): TrustapF2FTransactionState | null {
  if (!f2fWebhookEventCodes.includes(eventType as TrustapF2FWebhookEventCode)) {
    return null;
  }

  const eventStateMap: Record<string, TrustapF2FTransactionState> = {
    "p2p_tx.joined": "joined",
    "p2p_tx.rejected": "rejected",
    "p2p_tx.cancelled": "cancelled",
    "p2p_tx.claimed": "created",
    "p2p_tx.deposit_payment_failed": "joined", // Payment failed, stays in joined
    "p2p_tx.deposit_paid": "deposit_paid",
    "p2p_tx.deposit_review_flagged": "deposit_paid",
    "p2p_tx.deposit_review_finished": "deposit_paid",
    "p2p_tx.deposit_refunded": "deposit_refunded",
    "p2p_tx.deposit_accepted": "deposit_accepted",
    "p2p_tx.priced": "deposit_accepted", // Priced after deposit accepted
    "p2p_tx.remainder_skipped": "remainder_skipped",
    "p2p_tx.remainder_paid": "remainder_skipped", // After remainder paid, ready for handover
    "p2p_tx.remainder_review_flagged": "remainder_skipped",
    "p2p_tx.remainder_review_finished": "remainder_skipped",
    "p2p_tx.buyer_handover_confirmed": "buyer_handover_confirmed",
    "p2p_tx.seller_handover_confirmed": "seller_handover_confirmed",
    "p2p_tx.complained": "complained",
    "p2p_tx.funds_released": "funds_released",
    "p2p_tx.funds_refunded": "deposit_refunded",
  };

  return eventStateMap[eventType] ?? null;
}

// =============================================================================
// Online Webhook Event Mapping
// =============================================================================

export type TrustapOnlineWebhookEventCode =
  (typeof onlineWebhookEventCodes)[number];

const onlineWebhookEventCodes = [
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
 * Maps webhook event types to Online transaction states
 */
export function mapWebhookToOnlineState(
  eventType: string,
): TrustapOnlineTransactionState | null {
  if (
    !onlineWebhookEventCodes.includes(eventType as TrustapOnlineWebhookEventCode)
  ) {
    return null;
  }

  const eventStateMap: Record<string, TrustapOnlineTransactionState> = {
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
