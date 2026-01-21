# @ranwhenparked/trustap-sdk

A lightweight typed [Trustap API](https://docs.trustap.com/apis/openapi) wrapper built with openapi-typescript + openapi-fetch.

## Installation

```bash
npm install @ranwhenparked/trustap-sdk
```

## Usage

### Path-based client

```ts
import { createTrustapClient } from "@ranwhenparked/trustap-sdk";

const trustap = createTrustapClient({
  apiUrl: process.env.TRUSTAP_API_URL!,
  basicAuth: {
    username: process.env.TRUSTAP_API_KEY!,
    password: "", // Trustap basic auth uses API key + empty password
  },
});

const { data, error } = await trustap["/users/me/balances"].GET({
  headers: { Authorization: `Bearer ${accessToken}` },
});

// Or verb-based via raw
const { data: d2 } = await trustap.raw.GET("/users/me/balances", {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

### Operation ID-based client

Call API methods directly by their operation ID with full type safety:

```ts
const { data, error } = await trustap["users.getBalances"]();

// With path parameters
const { data: tx } = await trustap["basic_client.getTransaction"]({
  params: {
    path: { client_id: "my-client", transaction_id: "123" },
  },
});

// With query parameters
const { data: transactions } = await trustap["basic_client.getTransactions"]({
  params: {
    path: { client_id: "my-client" },
    query: { status: "paid" },
  },
});
```

## Authentication

The SDK supports multiple authentication strategies:

### Basic Auth (Server-to-server)

Configure HTTP Basic auth for server-to-server endpoints:

```ts
const trustap = createTrustapClient({
  apiUrl: "https://api.trustap.com",
  basicAuth: {
    username: process.env.TRUSTAP_API_KEY!,
    password: "", // Trustap uses API key + empty password
  },
});
```

### OAuth2 Access Token

For user-context endpoints, provide a `getAccessToken` callback:

```ts
const trustap = createTrustapClient({
  apiUrl: "https://api.trustap.com",
  basicAuth: {
    username: process.env.TRUSTAP_API_KEY!,
    password: "",
  },
  getAccessToken: async () => {
    // Return the current user's OAuth2 access token
    return session.accessToken;
  },
});
```

The SDK automatically selects the correct auth strategy per endpoint based on the OpenAPI spec. For endpoints that support both, it prefers Basic auth for server-to-server calls.

### Auth Overrides

Override the automatic auth selection for specific endpoints:

```ts
const trustap = createTrustapClient({
  apiUrl: "https://api.trustap.com",
  basicAuth: { username: apiKey, password: "" },
  getAccessToken: async () => userAccessToken,
  authOverrides: {
    "/charge": "basic",           // Always use Basic auth
    "/users/me/balances": "oauth2", // Always use OAuth2
  },
});
```

## Webhook Schemas

Validate incoming Trustap webhooks with Zod schemas:

```ts
import {
  trustapWebhookEventSchema,
  type TrustapWebhookEvent,
} from "@ranwhenparked/trustap-sdk";

// Parse and validate webhook payload
const result = trustapWebhookEventSchema.safeParse(req.body);
if (!result.success) {
  console.error("Invalid webhook:", result.error);
  return;
}

const event: TrustapWebhookEvent = result.data;
console.log(event.code); // e.g., "basic_tx.paid"
```

### Exhaustive Handler Pattern

Use `createWebhookHandlers` for compile-time exhaustiveness checking:

```ts
import {
  createWebhookHandlers,
  type TrustapWebhookEvent,
} from "@ranwhenparked/trustap-sdk";

const handlers = createWebhookHandlers({
  "basic_tx.joined": (event) => {
    console.log("Transaction joined at:", event.target_preview.joined);
  },
  "basic_tx.paid": (event) => {
    console.log("Transaction paid at:", event.target_preview.paid);
  },
  "basic_tx.rejected": (event) => { /* ... */ },
  "basic_tx.cancelled": (event) => { /* ... */ },
  "basic_tx.claimed": (event) => { /* ... */ },
  "basic_tx.listing_transaction_accepted": (event) => { /* ... */ },
  "basic_tx.listing_transaction_rejected": (event) => { /* ... */ },
  "basic_tx.payment_failed": (event) => { /* ... */ },
  "basic_tx.payment_refunded": (event) => { /* ... */ },
  "basic_tx.payment_review_flagged": (event) => { /* ... */ },
  "basic_tx.payment_review_finished": (event) => { /* ... */ },
  "basic_tx.tracking_details_submission_deadline_extended": (event) => { /* ... */ },
  "basic_tx.tracked": (event) => { /* ... */ },
  "basic_tx.delivered": (event) => { /* ... */ },
  "basic_tx.complained": (event) => { /* ... */ },
  "basic_tx.complaint_period_ended": (event) => { /* ... */ },
  "basic_tx.funds_released": (event) => { /* ... */ },
  "basic_tx.funds_refunded": (event) => { /* ... */ },
});

// TypeScript will error if any event code is missing from handlers

function handleWebhook(event: TrustapWebhookEvent) {
  const handler = handlers[event.code];
  handler(event as never);
}
```

### Individual Event Types

Import specific event types for targeted handling:

```ts
import type {
  BasicTxPaidEvent,
  BasicTxFundsReleasedEvent,
} from "@ranwhenparked/trustap-sdk";
```

## State Machine

Map webhook events to transaction states:

```ts
import {
  mapWebhookToTrustapState,
  type TrustapTransactionState,
} from "@ranwhenparked/trustap-sdk";

const state = mapWebhookToTrustapState("basic_tx.paid");
// state: "paid"

const unknown = mapWebhookToTrustapState("unknown.event");
// unknown: null
```

### Available States

```ts
type TrustapTransactionState =
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
```

## Deno

For Deno projects, import from the Deno-specific entry point:

```ts
import { createTrustapClient } from "@ranwhenparked/trustap-sdk/deno";
```

## Development

### Generate types from OpenAPI spec

```bash
npm run generate
```

This pulls the latest OpenAPI schema from `https://docs.trustap.com/apis/trustap-openapi.yaml` and generates:

- `src/schema.d.ts` - TypeScript types for all API paths and operations
- `src/operations-map.ts` - Mapping of operation IDs to paths/methods
- `src/security-map.ts` - Security requirements per endpoint

Individual generation scripts:

```bash
npm run generate:types    # Generate schema.d.ts
npm run generate:ops      # Generate operations-map.ts
npm run generate:security # Generate security-map.ts
```
