import { describe, it, expect, expectTypeOf } from "vitest";
import { createTrustapClient } from "../index.ts";
import type { operations } from "../schema.d.ts";
import {
  sampleChargeQuery,
  sampleTransactionBody,
} from "./helpers/test-fixtures.ts";
import { runTrustapSuite } from "./helpers/run-guard.ts";

const TEST_API_URL = "https://test.api";
const TEST_CREDENTIALS_USERNAME = "test";
const TEST_CREDENTIALS_PASSWORD = Buffer.from("test").toString("base64");

runTrustapSuite(import.meta.url, "TypeScript Type Integration", () => {
  describe("TypeScript Type Integration", () => {
    describe("Operation Parameter Types", () => {
      it("should extract proper parameter types from operations", () => {
        const client = createTrustapClient({
          apiUrl: TEST_API_URL,
          basicAuth: { username: TEST_CREDENTIALS_USERNAME, password: TEST_CREDENTIALS_PASSWORD },
        });

        // Test that basic.getCharge has proper types
        const chargeRequest = client["basic.getCharge"]({
          params: {
            query: {
              price: 1000,
              currency: "usd",
            },
          },
        });

        expect(chargeRequest).toBeDefined();
      });

      it("should support backward compatible legacy format", () => {
        const client = createTrustapClient({
          apiUrl: TEST_API_URL,
          basicAuth: { username: TEST_CREDENTIALS_USERNAME, password: TEST_CREDENTIALS_PASSWORD },
        });

        // Test backward compatibility with legacy format
        const chargeRequestLegacy = client["basic.getCharge"]({
          query: sampleChargeQuery,
        });

        expect(chargeRequestLegacy).toBeDefined();
      });
    });

    describe("Operation Type Assertions", () => {
      it("should correctly type operation query parameters", () => {
        // Type assertion tests
        type BasicGetChargeOperation = operations["basic.getCharge"];
        type QueryParams = BasicGetChargeOperation["parameters"]["query"];

        // Ensure the types are correct at compile time
        const validParams: QueryParams = {
          price: 1000,
          currency: "usd",
        };

        expect(validParams).toEqual({
          price: 1000,
          currency: "usd",
        });
      });

      it("should enforce required parameters", () => {
        type BasicGetChargeOperation = operations["basic.getCharge"];
        type QueryParams = BasicGetChargeOperation["parameters"]["query"];

        // This should compile if price and currency are required
        const params: QueryParams = {
          price: 2500,
          currency: "gbp",
        };

        expect(params.price).toBe(2500);
        expect(params.currency).toBe("gbp");
      });
    });

    describe("Response Type Inference", () => {
      it("should infer proper response types", () => {
        const client = createTrustapClient({
          apiUrl: TEST_API_URL,
          basicAuth: { username: TEST_CREDENTIALS_USERNAME, password: TEST_CREDENTIALS_PASSWORD },
        });

        // Type should be inferred as Promise<{ data?: ..., error?: ..., response: Response }>
        type ResponseType = ReturnType<(typeof client)["basic.getCharge"]>;
        expectTypeOf<ResponseType>().toExtend<
          Promise<{
            data?: unknown;
            error?: unknown;
            response: Response;
          }>
        >();

        // Verify it's a Promise
        const isPromise = (value: unknown): value is Promise<unknown> =>
          value instanceof Promise ||
          (typeof value === "object" && value !== null && "then" in value);

        const result = client["basic.getCharge"]();
        expect(isPromise(result)).toBe(true);
      });
    });

    describe("Path Parameter Types", () => {
      it("should enforce path parameter types", () => {
        const client = createTrustapClient({
          apiUrl: TEST_API_URL,
          getAccessToken: () => Promise.resolve("token"),
        });

        // userId should be properly typed
        const userRequest = client["oauth.getUser"]({
          params: {
            path: {
              userId: "user-123",
            },
          },
        });

        expect(userRequest).toBeDefined();
      });
    });

    describe("Body Parameter Types", () => {
      it("should enforce request body types", () => {
        const client = createTrustapClient({
          apiUrl: TEST_API_URL,
          basicAuth: { username: TEST_CREDENTIALS_USERNAME, password: TEST_CREDENTIALS_PASSWORD },
        });

        // Body should be properly typed
        const transactionRequest = client["basic.createTransaction"]({
          body: sampleTransactionBody,
        });

        expect(transactionRequest).toBeDefined();
      });
    });

    describe("Mixed Parameter Types", () => {
      it("should handle operations with path, query, and body parameters", () => {
        const client = createTrustapClient({
          apiUrl: TEST_API_URL,
          getAccessToken: () => Promise.resolve("token"),
        });

        // Should accept all parameter types
        const updateRequest = client["oauth.updateUser"]({
          params: {
            path: {
              userId: "user-456",
            },
            query: sampleChargeQuery,
          },
          body: sampleTransactionBody,
        } as Parameters<(typeof client)["oauth.updateUser"]>[0]);

        expect(updateRequest).toBeDefined();
      });
    });
  });
});
