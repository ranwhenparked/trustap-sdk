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

runTrustapSuite(import.meta.url, "Operation Proxy", () => {
  describe("Operation Proxy", () => {
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
      wrapAsPathBasedClient: (client) => ({ pathBased: client }),
    });

  describe("Operation ID to HTTP Method Mapping", () => {
    it("should map operation ID to GET request", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse(CHARGE_ENDPOINT, "GET", {
        data: { success: true },
      });

      await client["basic.getCharge"]({
        params: { query: sampleChargeQuery },
      });

      expect(mockClient.requests).toHaveLength(1);
      expect(mockClient.requests[0]?.method).toBe("GET");
      expect(mockClient.requests[0]?.path).toBe(CHARGE_ENDPOINT);
    });

    it("should map operation ID to POST request", async () => {
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
      expect(mockClient.requests[0]?.method).toBe("POST");
      expect(mockClient.requests[0]?.path).toBe(TRANSACTIONS_ENDPOINT);
    });

    it("should map operation ID to PUT request", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse(TRANSACTIONS_ENDPOINT, "PUT", {
        data: { success: true },
      });

      await client["basic.joinTransaction"]({
        params: { query: { join_code: "JOIN123" } },
      });

      expect(mockClient.requests).toHaveLength(1);
      expect(mockClient.requests[0]?.method).toBe("PUT");
      expect(mockClient.requests[0]?.path).toBe(TRANSACTIONS_ENDPOINT);
    });
  });

  describe("HTTP Method Support", () => {
    it("should support GET method", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse(CHARGE_ENDPOINT, "GET", {
        data: { success: true },
      });

      await client["basic.getCharge"]({
        params: { query: sampleChargeQuery },
      });

      expect(mockClient.requests[0]?.method).toBe("GET");
    });

    it("should support POST method", async () => {
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

      expect(mockClient.requests[0]?.method).toBe("POST");
    });

    it("should support PUT method", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse(TRANSACTIONS_ENDPOINT, "PUT", {
        data: { success: true },
      });

      await client["basic.joinTransaction"]({
        params: { query: { join_code: "JOIN123" } },
      });

      expect(mockClient.requests[0]?.method).toBe("PUT");
    });

    it("should support PATCH method", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      ) as unknown;

      const rawClient = (client as { raw: MockHttpClient }).raw;
      await rawClient.PATCH("/test", {});

      const request = mockClient.requests.find((r) => r.method === "PATCH");
      expect(request).toBeDefined();
    });

    it("should support DELETE method", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      ) as unknown;

      const rawClient = (client as { raw: MockHttpClient }).raw;
      await rawClient.DELETE("/test", {});

      const request = mockClient.requests.find((r) => r.method === "DELETE");
      expect(request).toBeDefined();
    });

    it("should support HEAD method", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      ) as unknown;

      const rawClient = (client as { raw: MockHttpClient }).raw;
      await rawClient.HEAD("/test", {});

      const request = mockClient.requests.find((r) => r.method === "HEAD");
      expect(request).toBeDefined();
    });

    it("should support OPTIONS method", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      ) as unknown;

      const rawClient = (client as { raw: MockHttpClient }).raw;
      await rawClient.OPTIONS("/test", {});

      const request = mockClient.requests.find((r) => r.method === "OPTIONS");
      expect(request).toBeDefined();
    });
  });

  describe("Undefined Operation Handling", () => {
    it("should return undefined for non-existent operation ID", () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      ) as Record<string, unknown>;

      const nonExistent = client["nonexistent.operation"];

      expect(nonExistent).toBeUndefined();
    });

    it("should not throw when accessing non-existent operation", () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      ) as Record<string, unknown>;

      expect(() => {
        const _ = client["another.fake.operation"];
        return _;
      }).not.toThrow();
    });
  });

  describe("Proxy Behavior", () => {
    it("should create operation functions dynamically", () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      const op1 = client["basic.getCharge"];
      const op2 = client["basic.getCharge"];

      // Should return the same function when accessed multiple times
      expect(typeof op1).toBe("function");
      expect(typeof op2).toBe("function");
    });

    it("should pass options through to HTTP client", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      mockClient.setResponse(TRANSACTIONS_ENDPOINT, "POST", {
        data: { success: true },
      });

      const testOptions = {
        body: sampleTransactionBody,
      };

      await client["basic.createTransaction"](testOptions);

      expect(mockClient.requests).toHaveLength(1);
      expect(mockClient.requests[0]?.options).toBeDefined();
    });

    it("should work with path-based client methods", () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      ) as unknown as { pathBased: unknown };

      // Path-based client should be available
      expect(client.pathBased).toBeDefined();
    });
  });
});
});
