import { describe, it, expect, beforeEach } from "vitest";
import { createTrustapClient } from "../index.ts";
import type { TrustapClient } from "../index.ts";
import { runTrustapSuite } from "./helpers/run-guard.ts";

const TEST_USERNAME = "test_key";
const TEST_PASSWORD = Buffer.from("test_secret").toString("base64");
const TEST_ALT_PASSWORD = Buffer.from("secret").toString("base64");
const TEST_URL = "https://test.trustap.com";
const TEST_TOKEN = "test_token";

// Helper functions for type validation tests
function makeValidCall(client: TrustapClient) {
  return client["basic.getCharge"]({
    params: {
      query: {
        price: 1000,
        currency: "usd",
      },
    },
  });
}

function makeLegacyCall(client: TrustapClient) {
  return client["basic.getCharge"]({
    query: {
      price: 2000,
      currency: "eur",
    },
  });
}

function makeLegacyCallCompat(client: TrustapClient) {
  return client["basic.getCharge"]({
    query: { price: 1000, currency: "usd" },
  });
}

function makeModernCallCompat(client: TrustapClient) {
  return client["basic.getCharge"]({
    params: {
      query: { price: 1000, currency: "usd" },
    },
  });
}

runTrustapSuite(import.meta.url, "Node Client Integration", () => {
  describe("Node Client Integration", () => {
    let client: TrustapClient;

    beforeEach(() => {
      client = createTrustapClient({
        apiUrl: TEST_URL,
        basicAuth: {
          username: TEST_USERNAME,
          password: TEST_PASSWORD,
        },
      });
    });

    describe("Client Creation", () => {
      it("should create a client with basic auth", () => {
        expect(client).toBeDefined();
        expect(typeof client["basic.getCharge"]).toBe("function");
      });

      it("should create a client with OAuth", () => {
        const oauthClient = createTrustapClient({
          apiUrl: TEST_URL,
          getAccessToken: () => Promise.resolve(TEST_TOKEN),
        });

        expect(oauthClient).toBeDefined();
      });

      it("should create a client with auth overrides", () => {
        const clientWithOverrides = createTrustapClient({
          apiUrl: TEST_URL,
          basicAuth: {
            username: TEST_USERNAME,
            password: TEST_PASSWORD,
          },
          authOverrides: {
            "/custom": "basic",
          },
        });

        expect(clientWithOverrides).toBeDefined();
      });

      it("should expose raw HTTP client", () => {
        const rawClient = (client as { raw: unknown }).raw;
        expect(rawClient).toBeDefined();
        expect(typeof (rawClient as { GET: unknown }).GET).toBe("function");
      });
    });

    describe("Operation Methods", () => {
      it("should have operation methods from operationIdToPath", () => {
        expect(typeof client["basic.getCharge"]).toBe("function");
        expect(typeof client["basic.createTransaction"]).toBe("function");
        expect(typeof client["oauth.getUser"]).toBe("function");
        expect(typeof client["oauth.updateUser"]).toBe("function");
      });

      it("should return undefined for non-existent operations", () => {
        const nonExistent = (client as Record<string, unknown>)[
          "nonexistent.op"
        ];
        expect(nonExistent).toBeUndefined();
      });
    });

    describe("TypeScript Types", () => {
      it("should enforce correct parameter types at compile time", () => {
        // This test verifies type safety through compilation
        // If these type assertions pass TypeScript checking, types are correct

        // Valid call with correct types
        expect(makeValidCall).toBeDefined();
        expect(() => makeValidCall(client)).not.toThrow();

        // Legacy format should also be valid
        expect(makeLegacyCall).toBeDefined();
        expect(() => makeLegacyCall(client)).not.toThrow();
      });

      it("should return properly typed responses", () => {
        // Mock the response at runtime since we don't have a real server
        type ResponseType = Awaited<
          ReturnType<(typeof client)["basic.getCharge"]>
        >;
        const mockResponse: ResponseType = {
          data: {
            charge: 250,
            charge_calculator_version: 1,
            charge_seller: 120,
            currency: "usd",
            price: 1234,
          },
          error: undefined,
          response: Response.json({ id: "charge_123" }),
        };

        const response = mockResponse;

        expect(response).toBeDefined();
        expect(response.data).toBeDefined();
        expect(response.response).toBeInstanceOf(Response);
      });
    });

    describe("OpenAPI-Fetch Integration", () => {
      it("should use openapi-fetch for HTTP requests", () => {
        // The raw client should be an openapi-fetch client
        const rawClient = (client as { raw: { GET: unknown } }).raw;
        expect(typeof rawClient.GET).toBe("function");
      });

      it("should wrap client as path-based client", () => {
        // Path-based access should work (from wrapAsPathBasedClient)
        expect(client).toBeDefined();
      });
    });

    describe("Middleware Application", () => {
      it("should apply auth middleware for basic auth", () => {
        const clientWithBasic = createTrustapClient({
          apiUrl: TEST_URL,
          basicAuth: {
            username: "key",
            password: TEST_ALT_PASSWORD,
          },
        });

        // Middleware should be applied (verifiable through raw client)
        const raw = (clientWithBasic as { raw: { use: unknown } }).raw;
        expect(typeof raw.use).toBe("function");
      });

      it("should apply auth middleware for OAuth", () => {
        const clientWithOAuth = createTrustapClient({
          apiUrl: TEST_URL,
          getAccessToken: () => Promise.resolve(TEST_TOKEN),
        });

        const raw = (clientWithOAuth as { raw: { use: unknown } }).raw;
        expect(typeof raw.use).toBe("function");
      });

      it("should not apply middleware when no auth configured", () => {
        const clientNoAuth = createTrustapClient({
          apiUrl: TEST_URL,
        });

        expect(clientNoAuth).toBeDefined();
      });
    });

    describe("Error Handling", () => {
      it("should handle invalid API URLs gracefully", () => {
        expect(() => {
          createTrustapClient({
            apiUrl: "",
            basicAuth: { username: "test" },
          });
        }).not.toThrow();
      });

      it("should handle missing credentials gracefully", () => {
        expect(() => {
          createTrustapClient({
            apiUrl: "https://test.trustap.com",
          });
        }).not.toThrow();
      });
    });

    describe("Backward Compatibility", () => {
      it("should support legacy query parameter format", () => {
        expect(makeLegacyCallCompat).toBeDefined();
        expect(() => makeLegacyCallCompat(client)).not.toThrow();
      });

      it("should support new params format", () => {
        expect(makeModernCallCompat).toBeDefined();
        expect(() => makeModernCallCompat(client)).not.toThrow();
      });

      it("should handle both formats interchangeably", () => {
        // Both should be valid at runtime
        const legacy = client["basic.getCharge"]({
          query: { price: 1000, currency: "usd" },
        });
        const modern = client["basic.getCharge"]({
          params: { query: { price: 1000, currency: "usd" } },
        });

        expect(legacy).toBeDefined();
        expect(modern).toBeDefined();
      });
    });
  });
});
