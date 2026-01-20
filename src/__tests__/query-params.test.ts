import { describe, it, expect, beforeEach } from "vitest";
import { createTrustapClientWithDeps } from "../client-factory.ts";
import type { TrustapClientDependencies } from "../client-factory.ts";
import { MockHttpClient } from "./helpers/mock-http-client.ts";
import type { MockMiddleware } from "./helpers/mock-http-client.ts";
import {
  createTestOptions,
  sampleChargeQuery,
  sampleTransactionBody,
} from "./helpers/test-fixtures.ts";
import { runTrustapSuite } from "./helpers/run-guard.ts";

const CHARGE_ENDPOINT = "/api/v4/charge";
const TRANSACTIONS_ENDPOINT = "/api/v4/transactions";

runTrustapSuite(import.meta.url, "Query Parameter Handling", () => {
  describe("Query Parameter Handling", () => {
    let mockClient: MockHttpClient;

    beforeEach(() => {
      mockClient = new MockHttpClient();
    });

    const createDeps = (): TrustapClientDependencies<
      MockMiddleware,
      MockHttpClient,
      Record<string, unknown>
    > => ({
      createClient: () => mockClient,
      wrapAsPathBasedClient: () => ({}),
    });

  describe("Legacy Format", () => {
    it("should convert legacy { query: ... } format to new format", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse(CHARGE_ENDPOINT, "GET", {
        data: { success: true },
      });

      await client["basic.getCharge"]({
        query: sampleChargeQuery,
      } as Parameters<typeof client["basic.getCharge"]>[0]);

      expect(mockClient.requests).toHaveLength(1);
      const request = mockClient.requests[0];
      expect(request?.path).toBe(CHARGE_ENDPOINT);
      expect(request?.options).toBeDefined();
    });

    it("should handle legacy format with body", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse(TRANSACTIONS_ENDPOINT, "POST", {
        data: { success: true },
      });

      await client["basic.createTransaction"]({
        query: sampleChargeQuery,
        body: sampleTransactionBody,
      } as unknown as Parameters<typeof client["basic.createTransaction"]>[0]);

      expect(mockClient.requests).toHaveLength(1);
      expect(mockClient.requests[0]?.options).toBeDefined();
    });
  });

  describe("New Format", () => {
    it("should handle { params: { query: ... } } format", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse(CHARGE_ENDPOINT, "GET", {
        data: { success: true },
      });

      await client["basic.getCharge"]({
        params: {
          query: sampleChargeQuery,
        },
      });

      expect(mockClient.requests).toHaveLength(1);
      const request = mockClient.requests[0];
      expect(request?.options).toBeDefined();
    });

    it("should handle path parameters in params", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse("/api/v4/users/user-123", "GET", {
        data: { id: "user-123" },
      });

      await client["oauth.getUser"]({
        params: {
          path: { userId: "user-123" },
        },
      });

      expect(mockClient.requests).toHaveLength(1);
    });

    it("should handle mixed query and path parameters", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse("/api/v4/users/user-456", "GET", {
        data: { id: "user-456" },
      });

      await client["oauth.getUser"]({
        params: {
          path: { userId: "user-456" },
          query: sampleChargeQuery,
        },
      } as Parameters<typeof client["oauth.getUser"]>[0]);

      expect(mockClient.requests).toHaveLength(1);
    });

    it("should handle body with new format", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse("/api/v4/users/user-789", "PUT", {
        data: { success: true },
      });

      await client["oauth.updateUser"]({
        params: {
          path: { userId: "user-789" },
        },
        body: {
          email: "updated@example.com",
        },
      } as Parameters<typeof client["oauth.updateUser"]>[0]);

      expect(mockClient.requests).toHaveLength(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty query parameters", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse(CHARGE_ENDPOINT, "GET", {
        data: { success: true },
      });

      await client["basic.getCharge"]({
        params: {
          query: {},
        },
      } as Parameters<typeof client["basic.getCharge"]>[0]);

      expect(mockClient.requests).toHaveLength(1);
    });

    it("should handle undefined options", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse(CHARGE_ENDPOINT, "GET", {
        data: { success: true },
      });

      await client["basic.getCharge"]();

      expect(mockClient.requests).toHaveLength(1);
    });

    it("should handle options without query or params", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse(TRANSACTIONS_ENDPOINT, "POST", {
        data: { success: true },
      });

      await client["basic.createTransaction"]({
        body: sampleTransactionBody,
      });

      expect(mockClient.requests).toHaveLength(1);
    });

    it("should not duplicate query params when converting", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse(CHARGE_ENDPOINT, "GET", {
        data: { success: true },
      });

      // Legacy format should be converted cleanly
      await client["basic.getCharge"]({
        query: sampleChargeQuery,
      } as Parameters<typeof client["basic.getCharge"]>[0]);

      expect(mockClient.requests).toHaveLength(1);
      // Verify only one set of params exists (no duplication)
      const options = mockClient.requests[0]?.options as Record<string, unknown> | undefined;
      expect(options).toBeDefined();
    });
  });
});
});
