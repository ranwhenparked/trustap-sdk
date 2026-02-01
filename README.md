# trustap-sdk

[![npm version](https://img.shields.io/npm/v/@ranwhenparked/trustap-sdk.svg)](https://www.npmjs.com/package/@ranwhenparked/trustap-sdk)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Type-safe TypeScript SDK for the [Trustap API](https://trustap.com) with webhook validation.

## Overview

Trustap provides escrow and payment protection for peer-to-peer and marketplace transactions. This SDK offers:

- **Type-safe API client** built on [openapi-fetch](https://openapi-ts.dev/openapi-fetch/) with auto-generated types
- **Webhook validation** using Zod schemas with TypeScript exhaustiveness checking
- **Transaction state machine** for tracking transaction lifecycle
- **Dual runtime support** for Node.js and Deno

## Installation

```bash
npm install trustap-sdk
```

```bash
yarn add trustap-sdk
```

```bash
pnpm add trustap-sdk
```

## Quick Start

```typescript
import { createTrustapClient, TRUSTAP_BASE_URLS } from "trustap-sdk";

const client = createTrustapClient({
  baseUrl: TRUSTAP_BASE_URLS.production,
  auth: { type: "apiKey", apiKey: "your-api-key" },
});

// Calculate transaction fees
const { data, error } = await client.GET("/charge", {
  params: {
    query: { price: 10000, currency: "USD" },
  },
});
```

## Authentication

### API Key (Server-side)

Use API key authentication for server-to-server requests:

```typescript
const client = createTrustapClient({
  auth: { type: "apiKey", apiKey: process.env.TRUSTAP_API_KEY },
});
```

### OAuth (User-authenticated)

Use OAuth for requests on behalf of authenticated users:

```typescript
const client = createTrustapClient({
  auth: { type: "oauth", accessToken: userAccessToken },
});
```

## Client Usage

### Standard Client

```typescript
import { createTrustapClient } from "trustap-sdk";

const client = createTrustapClient({
  baseUrl: TRUSTAP_BASE_URLS.staging, // or .production
  auth: { type: "apiKey", apiKey: "..." },
});

// Fully typed request/response
const { data, error } = await client.GET("/me/transactions");
```

### Path-based Client

```typescript
import { createTrustapPathClient } from "trustap-sdk";

const client = createTrustapPathClient({ /* options */ });

// Alternative syntax
const { data } = await client["/me/transactions"].GET();
```

### Environments

```typescript
import { TRUSTAP_BASE_URLS } from "trustap-sdk";

TRUSTAP_BASE_URLS.staging    // https://dev.stage.trustap.com/api/v1
TRUSTAP_BASE_URLS.production // https://dev.trustap.com/api/v1
```

## Webhook Handling

### Parsing Events

```typescript
import { trustapWebhookEventSchema } from "trustap-sdk";

async function handleWebhook(req: Request) {
  const body = await req.json();
  const result = trustapWebhookEventSchema.safeParse(body);

  if (!result.success) {
    // Unknown or malformed event - fails loudly, no silent fallbacks
    console.error("Invalid webhook:", result.error);
    return;
  }

  const event = result.data;
  // event.code is narrowed to specific event types
}
```

### Type-safe Handlers

Create handlers with compile-time exhaustiveness checking:

```typescript
import { createOnlineWebhookHandlers, type TrustapWebhookEvent } from "trustap-sdk";

const handlers = createOnlineWebhookHandlers({
  "basic_tx.joined": (event) => {
    console.log("Seller joined:", event.target_preview.joined);
  },
  "basic_tx.paid": (event) => {
    console.log("Payment received:", event.target_preview.paid);
  },
  "basic_tx.tracked": (event) => {
    console.log("Tracking:", event.target_preview.tracking);
  },
  // TypeScript errors if any event type is missing
  // ... all 18 event types must be handled
});

function processEvent(event: TrustapWebhookEvent) {
  handlers[event.code](event as any);
}
```

### Switch with Exhaustiveness

```typescript
import { assertNever, type TrustapWebhookEvent } from "trustap-sdk";

function handleEvent(event: TrustapWebhookEvent) {
  switch (event.code) {
    case "basic_tx.joined":
      return handleJoined(event);
    case "basic_tx.paid":
      return handlePaid(event);
    // ... handle all cases
    default:
      assertNever(event); // Compile error if any case is missing
  }
}
```

### State Machine

Map webhook events to transaction states:

```typescript
import { mapWebhookToOnlineState } from "trustap-sdk";

const state = mapWebhookToOnlineState("basic_tx.paid");
// Returns: "paid"
```

## Subpath Imports

Import only what you need:

```typescript
// Full SDK
import { createTrustapClient, trustapWebhookEventSchema } from "trustap-sdk";

// Webhooks only (smaller bundle)
import { trustapWebhookEventSchema, createOnlineWebhookHandlers } from "trustap-sdk/webhooks";

// Types only (no runtime code)
import type { paths, components } from "trustap-sdk/types";
```

## Deno

```typescript
import { createTrustapClient } from "./mod.ts";

// Or from npm
import { createTrustapClient } from "npm:trustap-sdk";
```

## API Reference

This SDK's types are auto-generated from the [Trustap OpenAPI specification](https://docs.trustap.com). For endpoint documentation, see the [Trustap API docs](https://docs.trustap.com).

## License

ISC
