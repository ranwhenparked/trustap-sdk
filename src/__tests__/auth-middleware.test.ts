import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTrustapClientWithDeps } from "../client-factory.ts";
import type { TrustapClientDependencies } from "../client-factory.ts";
import { MockHttpClient } from "./helpers/mock-http-client.ts";
import type { MockMiddleware } from "./helpers/mock-http-client.ts";
import {
  createTestOptions,
  encodeBasicAuth,
  mockBasicAuth,
  mockOAuthToken,
  sampleCarrierFacilityRequest,
  sampleChargeQuery,
  sampleTransactionBody,
} from "./helpers/test-fixtures.ts";
import { runTrustapSuite } from "./helpers/run-guard.ts";

runTrustapSuite(import.meta.url, "Auth Middleware", () => {
  describe("Auth Middleware", () => {
    let mockClient: MockHttpClient;

    const createDeps = (): TrustapClientDependencies<
      MockMiddleware,
      MockHttpClient,
      Record<string, unknown>
    > => ({
      createClient: () => mockClient,
      wrapAsPathBasedClient: () => ({}),
    });

    const createClient = (
      overrides?: Parameters<typeof createTestOptions>[0],
    ) =>
      createTrustapClientWithDeps(
        createDeps(),
        createTestOptions(overrides ?? {}),
      );

    beforeEach(() => {
      mockClient = new MockHttpClient();
    });

    it("adds a Basic Authorization header when APIKey security is declared", async () => {
      const client = createClient({ getAccessToken: undefined });

      await client["basic.getCharge"]({
        params: { query: sampleChargeQuery },
      });

      const header = mockClient.requests[0]?.request.headers.get(
        "Authorization",
      );
      expect(header).toBe(
        `Basic ${encodeBasicAuth(
          mockBasicAuth.username,
          mockBasicAuth.password,
        )}`,
      );
    });

    it("reuses the encoded Basic credentials for repeated calls", async () => {
      const client = createClient({ getAccessToken: undefined });

      await client["basic.getCharge"]({
        params: { query: sampleChargeQuery },
      });
      await client["basic.getCharge"]({
        params: { query: sampleChargeQuery },
      });

      const first = mockClient.requests[0]?.request.headers.get(
        "Authorization",
      );
      const second = mockClient.requests[1]?.request.headers.get(
        "Authorization",
      );
      expect(first).toBe(second);
    });

    it("requests bearer tokens for OAuth-protected endpoints", async () => {
      const getAccessToken = vi.fn(() => Promise.resolve(mockOAuthToken));
      const client = createClient({
        basicAuth: undefined,
        getAccessToken,
      });

      await client["oauth.getUser"]({
        params: {
          path: { userId: "user_123" },
        },
      });

      const header = mockClient.requests[0]?.request.headers.get(
        "Authorization",
      );
      expect(header).toBe(`Bearer ${mockOAuthToken}`);
      expect(getAccessToken).toHaveBeenCalledTimes(1);
    });

    it("honors authOverrides using exact path matches", async () => {
      const client = createClient({
        authOverrides: {
          "/transactions": "basic",
        },
      });

      await client["basic.createTransaction"]({
        body: sampleTransactionBody,
      });

      const header = mockClient.requests[0]?.request.headers.get(
        "Authorization",
      );
      expect(header).toBe(
        `Basic ${encodeBasicAuth(
          mockBasicAuth.username,
          mockBasicAuth.password,
        )}`,
      );
    });

    it("uses explicit OAuth overrides when provided", async () => {
      const client = createClient({
        authOverrides: {
          "/transactions": "oauth2",
        },
        getAccessToken: () => Promise.resolve(mockOAuthToken),
      });

      await client["basic.createTransaction"]({
        body: sampleTransactionBody,
      });

      const header = mockClient.requests[0]?.request.headers.get(
        "Authorization",
      );
      expect(header).toBe(`Bearer ${mockOAuthToken}`);
    });

    it("does not override an Authorization header that is already present", async () => {
      const client = createClient({ getAccessToken: undefined });

      await client["basic.getCharge"]({
        headers: { Authorization: "Custom token" },
        params: { query: sampleChargeQuery },
      });

      const header = mockClient.requests[0]?.request.headers.get(
        "Authorization",
      );
      expect(header).toBe("Custom token");
    });

    it("skips auth headers when no credentials are configured", async () => {
      const client = createClient({
        basicAuth: undefined,
        getAccessToken: undefined,
      });

      await client["basic.getCarrierFacilityOptions"]({
        params: { path: { carrier_id: "carrier_1" } },
        body: sampleCarrierFacilityRequest,
      });

      const header = mockClient.requests[0]?.request.headers.get(
        "Authorization",
      );
      expect(header).toBeNull();
    });
  });
});
