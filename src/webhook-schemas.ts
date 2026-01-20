/**
 * Trustap Webhook Event Zod Schemas
 *
 * Strict discriminated union schemas for all basic_tx.* webhook events.
 * No fallback parsing - unknown events will fail loudly.
 */

import { z } from "zod/v4";
import type { TrustapWebhookEventCode } from "./state-machine.ts";

// ============================================================================
// Shared Sub-Schemas
// ============================================================================

/**
 * Tracking information attached to transactions after seller submits shipping details
 */
const trackingSchema = z.object({
  carrier: z.string(),
  tracking_code: z.string(),
});

/**
 * Complaint information when buyer raises an issue
 */
const complaintSchema = z.object({
  description: z.string(),
});

// ============================================================================
// Base Target Preview Schema
// ============================================================================

/**
 * Base fields present in all target_preview objects
 */
const baseTargetPreviewSchema = z.object({
  id: z.number(),
  status: z.string(),
  currency: z.string(),
  quantity: z.number(),
  price: z.number(),
  charge: z.number(),
  charge_seller: z.number(),
  description: z.string(),
  created: z.string(),
  is_payment_in_progress: z.boolean(),
  client_id: z.string(),
  buyer_id: z.string(),
  seller_id: z.string(),
});

// ============================================================================
// Event-Specific Target Preview Schemas
// ============================================================================

// --- Joined State ---
const joinedTargetPreviewSchema = baseTargetPreviewSchema.extend({
  joined: z.string(),
});

// --- Cancelled State ---
const cancelledTargetPreviewSchema = baseTargetPreviewSchema.extend({
  joined: z.string(),
  cancelled: z.string(),
});

// --- Rejected State ---
const rejectedTargetPreviewSchema = baseTargetPreviewSchema.extend({
  rejected: z.string().optional(),
  rejection_reason: z.string().optional(),
});

// --- Claimed State (transaction created but not yet joined) ---
const claimedTargetPreviewSchema = baseTargetPreviewSchema.extend({
  claimed: z.string().optional(),
});

// --- Paid State ---
const paidTargetPreviewSchema = baseTargetPreviewSchema.extend({
  joined: z.string(),
  paid: z.string(),
  tracking_details_window_started: z.string(),
  tracking_details_deadline: z.string(),
  charge_international_payment: z.number().optional(),
});

// --- Tracked State ---
const trackedTargetPreviewSchema = baseTargetPreviewSchema.extend({
  joined: z.string(),
  paid: z.string(),
  tracked: z.string(),
  tracking: trackingSchema,
  tracking_details_window_started: z.string(),
  tracking_details_deadline: z.string(),
  charge_international_payment: z.number().optional(),
});

// --- Delivered State ---
const deliveredTargetPreviewSchema = baseTargetPreviewSchema.extend({
  joined: z.string(),
  paid: z.string(),
  tracked: z.string(),
  tracking: trackingSchema,
  tracking_details_window_started: z.string(),
  tracking_details_deadline: z.string(),
  delivered: z.string(),
  complaint_period_deadline: z.string(),
  charge_international_payment: z.number().optional(),
});

// --- Complained State ---
const complainedTargetPreviewSchema = baseTargetPreviewSchema.extend({
  joined: z.string(),
  paid: z.string(),
  tracked: z.string(),
  tracking: trackingSchema,
  tracking_details_window_started: z.string(),
  tracking_details_deadline: z.string(),
  delivered: z.string(),
  complained: z.string(),
  complaint: complaintSchema,
  complaint_period_deadline: z.string(),
  charge_international_payment: z.number().optional(),
});

// --- Complaint Period Ended State ---
const complaintPeriodEndedTargetPreviewSchema = baseTargetPreviewSchema.extend({
  joined: z.string(),
  paid: z.string(),
  tracked: z.string(),
  tracking: trackingSchema,
  tracking_details_window_started: z.string(),
  tracking_details_deadline: z.string(),
  delivered: z.string(),
  complaint_period_ended: z.string(),
  complaint_period_deadline: z.string(),
  charge_international_payment: z.number().optional(),
});

// --- Funds Released State ---
const fundsReleasedTargetPreviewSchema = baseTargetPreviewSchema.extend({
  joined: z.string(),
  paid: z.string(),
  tracked: z.string(),
  tracking: trackingSchema,
  tracking_details_window_started: z.string(),
  tracking_details_deadline: z.string(),
  delivered: z.string(),
  complaint_period_ended: z.string(),
  complaint_period_deadline: z.string(),
  funds_released: z.string(),
  released_to_seller: z.boolean(),
  amount_released: z.number(),
  charge_international_payment: z.number().optional(),
});

// --- Payment Refunded State ---
const paymentRefundedTargetPreviewSchema = baseTargetPreviewSchema.extend({
  joined: z.string(),
  paid: z.string().optional(),
  refunded: z.string().optional(),
  refund_amount: z.number().optional(),
  charge_international_payment: z.number().optional(),
});

// ============================================================================
// Metadata Schemas
// ============================================================================

const emptyMetadataSchema = z.looseObject({});

const paymentFailedMetadataSchema = z.looseObject({
  failure_code: z.string(),
});

// ============================================================================
// Event Envelope Schemas
// ============================================================================

// Helper to create event schema
function createEventSchema<
  TCode extends string,
  TPreview extends z.ZodType,
  TMetadata extends z.ZodType = typeof emptyMetadataSchema,
>(code: TCode, targetPreviewSchema: TPreview, metadataSchema?: TMetadata) {
  return z.object({
    code: z.literal(code),
    user_id: z.string().nullable(),
    target_id: z.string(),
    target_preview: targetPreviewSchema,
    time: z.string(),
    metadata: metadataSchema ?? emptyMetadataSchema,
  });
}

// --- Individual Event Schemas ---

export const basicTxJoinedEventSchema = createEventSchema(
  "basic_tx.joined",
  joinedTargetPreviewSchema,
);

export const basicTxRejectedEventSchema = createEventSchema(
  "basic_tx.rejected",
  rejectedTargetPreviewSchema,
);

export const basicTxCancelledEventSchema = createEventSchema(
  "basic_tx.cancelled",
  cancelledTargetPreviewSchema,
);

export const basicTxClaimedEventSchema = createEventSchema(
  "basic_tx.claimed",
  claimedTargetPreviewSchema,
);

export const basicTxListingTransactionAcceptedEventSchema = createEventSchema(
  "basic_tx.listing_transaction_accepted",
  joinedTargetPreviewSchema,
);

export const basicTxListingTransactionRejectedEventSchema = createEventSchema(
  "basic_tx.listing_transaction_rejected",
  rejectedTargetPreviewSchema,
);

export const basicTxPaymentFailedEventSchema = createEventSchema(
  "basic_tx.payment_failed",
  joinedTargetPreviewSchema,
  paymentFailedMetadataSchema,
);

export const basicTxPaidEventSchema = createEventSchema(
  "basic_tx.paid",
  paidTargetPreviewSchema,
);

export const basicTxPaymentRefundedEventSchema = createEventSchema(
  "basic_tx.payment_refunded",
  paymentRefundedTargetPreviewSchema,
);

export const basicTxPaymentReviewFlaggedEventSchema = createEventSchema(
  "basic_tx.payment_review_flagged",
  paidTargetPreviewSchema,
);

export const basicTxPaymentReviewFinishedEventSchema = createEventSchema(
  "basic_tx.payment_review_finished",
  paidTargetPreviewSchema,
);

export const basicTxTrackingDetailsSubmissionDeadlineExtendedEventSchema = createEventSchema(
  "basic_tx.tracking_details_submission_deadline_extended",
  paidTargetPreviewSchema,
);

export const basicTxTrackedEventSchema = createEventSchema(
  "basic_tx.tracked",
  trackedTargetPreviewSchema,
);

export const basicTxDeliveredEventSchema = createEventSchema(
  "basic_tx.delivered",
  deliveredTargetPreviewSchema,
);

export const basicTxComplainedEventSchema = createEventSchema(
  "basic_tx.complained",
  complainedTargetPreviewSchema,
);

export const basicTxComplaintPeriodEndedEventSchema = createEventSchema(
  "basic_tx.complaint_period_ended",
  complaintPeriodEndedTargetPreviewSchema,
);

export const basicTxFundsReleasedEventSchema = createEventSchema(
  "basic_tx.funds_released",
  fundsReleasedTargetPreviewSchema,
);

export const basicTxFundsRefundedEventSchema = createEventSchema(
  "basic_tx.funds_refunded",
  paymentRefundedTargetPreviewSchema,
);

// ============================================================================
// Discriminated Union
// ============================================================================

/**
 * All possible Trustap webhook event schemas as a discriminated union.
 * Unknown events will fail validation - no fallback parsing.
 */
export const trustapWebhookEventSchema = z.discriminatedUnion("code", [
  basicTxJoinedEventSchema,
  basicTxRejectedEventSchema,
  basicTxCancelledEventSchema,
  basicTxClaimedEventSchema,
  basicTxListingTransactionAcceptedEventSchema,
  basicTxListingTransactionRejectedEventSchema,
  basicTxPaymentFailedEventSchema,
  basicTxPaidEventSchema,
  basicTxPaymentRefundedEventSchema,
  basicTxPaymentReviewFlaggedEventSchema,
  basicTxPaymentReviewFinishedEventSchema,
  basicTxTrackingDetailsSubmissionDeadlineExtendedEventSchema,
  basicTxTrackedEventSchema,
  basicTxDeliveredEventSchema,
  basicTxComplainedEventSchema,
  basicTxComplaintPeriodEndedEventSchema,
  basicTxFundsReleasedEventSchema,
  basicTxFundsRefundedEventSchema,
]);

/**
 * Type for any Trustap webhook event
 */
export type TrustapWebhookEvent = z.infer<typeof trustapWebhookEventSchema>;

// ============================================================================
// Exhaustive Handler Types
// ============================================================================

/**
 * Handler function type for a specific event
 */
type WebhookEventHandler<T extends TrustapWebhookEvent> = (
  event: T,
) => Promise<void> | void;

/**
 * Exhaustive handler map type - TypeScript will error if any event is missing.
 * Use this to ensure all webhook events are handled.
 */
export type TrustapWebhookHandlers = {
  [K in TrustapWebhookEventCode]: WebhookEventHandler<
    Extract<TrustapWebhookEvent, { code: K }>
  >;
};

/**
 * Helper to create handlers with compile-time exhaustiveness checking.
 *
 * @example
 * const handlers = createWebhookHandlers({
 *   "basic_tx.joined": (event) => { console.log(event.target_preview.joined); },
 *   "basic_tx.paid": (event) => { console.log(event.target_preview.paid); },
 *   // ... TypeScript errors if any event code is missing
 * });
 */
export function createWebhookHandlers(
  handlers: TrustapWebhookHandlers,
): TrustapWebhookHandlers {
  return handlers;
}

/**
 * Exhaustive switch helper for use in processors.
 * Call in default case to get compile-time error if any case is missing.
 *
 * @example
 * function handleEvent(event: TrustapWebhookEvent) {
 *   switch (event.code) {
 *     case "basic_tx.joined": return handleJoined(event);
 *     case "basic_tx.paid": return handlePaid(event);
 *     // ... all cases
 *     default: assertNever(event);
 *   }
 * }
 */
export function assertNever(x: never): never {
  throw new Error(`Unhandled webhook event: ${JSON.stringify(x)}`);
}

// ============================================================================
// Individual Event Type Exports
// ============================================================================

export type BasicTxJoinedEvent = z.infer<typeof basicTxJoinedEventSchema>;
export type BasicTxRejectedEvent = z.infer<typeof basicTxRejectedEventSchema>;
export type BasicTxCancelledEvent = z.infer<typeof basicTxCancelledEventSchema>;
export type BasicTxClaimedEvent = z.infer<typeof basicTxClaimedEventSchema>;
export type BasicTxListingTransactionAcceptedEvent = z.infer<typeof basicTxListingTransactionAcceptedEventSchema>;
export type BasicTxListingTransactionRejectedEvent = z.infer<typeof basicTxListingTransactionRejectedEventSchema>;
export type BasicTxPaymentFailedEvent = z.infer<typeof basicTxPaymentFailedEventSchema>;
export type BasicTxPaidEvent = z.infer<typeof basicTxPaidEventSchema>;
export type BasicTxPaymentRefundedEvent = z.infer<typeof basicTxPaymentRefundedEventSchema>;
export type BasicTxPaymentReviewFlaggedEvent = z.infer<typeof basicTxPaymentReviewFlaggedEventSchema>;
export type BasicTxPaymentReviewFinishedEvent = z.infer<typeof basicTxPaymentReviewFinishedEventSchema>;
export type BasicTxTrackingDetailsSubmissionDeadlineExtendedEvent = z.infer<typeof basicTxTrackingDetailsSubmissionDeadlineExtendedEventSchema>;
export type BasicTxTrackedEvent = z.infer<typeof basicTxTrackedEventSchema>;
export type BasicTxDeliveredEvent = z.infer<typeof basicTxDeliveredEventSchema>;
export type BasicTxComplainedEvent = z.infer<typeof basicTxComplainedEventSchema>;
export type BasicTxComplaintPeriodEndedEvent = z.infer<typeof basicTxComplaintPeriodEndedEventSchema>;
export type BasicTxFundsReleasedEvent = z.infer<typeof basicTxFundsReleasedEventSchema>;
export type BasicTxFundsRefundedEvent = z.infer<typeof basicTxFundsRefundedEventSchema>;
