# Changelog

All notable changes to this package are documented here.

## [3.1.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v3.1.0) - 2026-10-06

### Added

- Added `POST /v2/transactions/{transaction_id}/items` for adding items to a transaction, with recurring billing support.
- Added `GET /v2/users/{user_id}/account_status` for fetching a user's payout account status.
- Added `TransactionItem`, `TransactionItemBody`, `BillingType`, `RecurringPeriod`, and `AccountPayout` schemas.
- Added the `deposit_not_accepted` error code to transaction tracking responses.

### Deprecated

- Restored `POST /v2/transactions/{transaction_id}/confirm_handover` as a deprecated endpoint.

## [3.0.1](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v3.0.1) - 2026-09-01

### Fixed

- Added the JSON content type to bodyless POST requests, including path-based client calls.

## [3.0.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v3.0.0) - 2026-08-27

### Breaking changes

- Removed the `confirm_handover` endpoint and the `buyer_handover_confirmed` and `seller_handover_confirmed` transaction statuses.
- Aligned generated types and webhook schemas with the removed handover states.

### Changed

- Delivery confirmation now supports any transaction user rather than only the buyer.

## [2.2.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v2.2.0) - 2026-08-18

- Added generated types for listing experiences and retrieving transaction buyer details.
- Synced the generated SDK with the latest Trustap API v2 OpenAPI specification.

## [2.1.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v2.1.0) - 2026-07-22

- Added event-specific types for webhook target previews.
- Allowed partial target previews in webhook payloads.

## [2.0.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v2.0.0) - 2026-07-11

### Breaking changes

- Rebuilt the SDK for Trustap API v2 and its unified transaction resource.
- Replaced legacy webhook handling with typed API v2 `tx.*` events, `tx_` transaction IDs, and transaction state mapping.
- Removed the API v1 face-to-face path constants.

### Added

- Added API-key and OAuth client authentication for the v2 sandbox and production environments.
- Added Zod webhook validation and tests.

## [0.9.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v0.9.0) - 2026-06-24

- Added CZK currency and transaction payout ID types from the updated API specification.
- Pinned specification updates to the versioned Trustap API v1 source.

## [0.8.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v0.8.0) - 2026-06-17

- Added per-transaction F2F charge calculation.
- Added complaint and order-issue categories plus expanded postage pricing types.
- Synced managed-user headers, operation IDs, and errors with the OpenAPI specification.

## [0.7.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v0.7.0) - 2026-06-11

- Made guest-user first and last names optional.
- Added postage pricing fields and updated F2F operation IDs and error types.
- Synced generated types with the latest OpenAPI specification.

## [0.6.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v0.6.0) - 2026-05-29

- Republished the 0.5.0 SDK contents under version 0.6.0; no SDK behavior changed.

## [0.5.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v0.5.0) - 2026-05-29

- Added F2F shipping delivery-confirmation endpoints and path constants.
- Added `contains_shipping`, transaction image URLs, and AED, BRL, CAD, CHF, DKK, and RSD currency types.
- Synced generated types with the latest OpenAPI specification.

## [0.4.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v0.4.0) - 2026-05-17

- Added typed constants for all Trustap F2F transaction paths with compile-time coverage checking.
- Added payout, buyer and seller details, and complaint-period endpoints from the updated OpenAPI specification.
- Updated package documentation for the scoped npm package and F2F API.

## [0.3.1](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v0.3.1) - 2026-02-22

- Fixed base URLs to avoid duplicating the `/api/v1` prefix in requests.

## [0.3.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v0.3.0) - 2026-02-22

### Breaking changes

- Moved `/api/v1` from server URLs into generated path keys.
- Removed the remainder Stripe client-secret endpoint.
- Renamed the create-listing operation and the join-code path parameter.

### Added

- Added client charge fields, the `reader` access role, and lookup by transaction join code.

## [0.2.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v0.2.0) - 2026-02-01

- Reworked the package structure and exports for npm consumption.
- Added F2F transaction support and automated OpenAPI update checks.
- Published under the `@ranwhenparked/trustap-sdk` package name.

## [0.1.0](https://github.com/ranwhenparked/trustap-sdk/releases/tag/v0.1.0) - 2026-02-01

- Initial release with generated Trustap API types, TypeScript client exports, and Deno support.
