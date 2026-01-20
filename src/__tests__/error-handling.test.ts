import { beforeEach, describe, expect, it } from "vitest";

import { createTrustapClientWithDeps } from "../client-factory.ts";
import type { TrustapClientDependencies } from "../client-factory.ts";
import { MockHttpClient } from "./helpers/mock-http-client.ts";
import type { MockMiddleware } from "./helpers/mock-http-client.ts";
import { createTestOptions } from "./helpers/test-fixtures.ts";
import { runTrustapSuite } from "./helpers/run-guard.ts";

const CHARGE_ENDPOINT = "/api/v4/charge";

runTrustapSuite(import.meta.url, "Error Handling", () => {
  describe("Error Handling", () => {
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

    describe("Network Failures", () => {
      it("handles network errors when middleware throws", async () => {
        const client = createClient({ getAccessToken: undefined });

        // Simulate network failure by adding middleware that throws
        mockClient.use({
          onRequest: () => {
            throw new Error("Network connection failed");
          },
        });

        await expect(client["basic.getCharge"]()).rejects.toThrow(
          "Network connection failed",
        );
      });

      it("handles errors in response middleware", async () => {
        const client = createClient({ getAccessToken: undefined });

        mockClient.use({
          onResponse: () => {
            throw new Error("Response processing failed");
          },
        });

        await expect(client["basic.getCharge"]()).rejects.toThrow(
          "Response processing failed",
        );
      });
    });

    describe("HTTP Error Responses", () => {
      it("returns error for 400 Bad Request", async () => {
        const client = createClient({ getAccessToken: undefined });

        mockClient.setResponse(CHARGE_ENDPOINT, "GET", {
          error: { message: "Invalid parameters" },
          status: 400,
        });

        const result = await client["basic.getCharge"]();

        expect(result.error).toEqual({ message: "Invalid parameters" });
        expect(result.data).toBeUndefined();
        expect(result.response.status).toBe(400);
      });

      it("returns error for 401 Unauthorized", async () => {
        const client = createClient({ getAccessToken: undefined });

        mockClient.setResponse(CHARGE_ENDPOINT, "GET", {
          error: { message: "Unauthorized" },
          status: 401,
        });

        const result = await client["basic.getCharge"]();

        expect(result.error).toEqual({ message: "Unauthorized" });
        expect(result.data).toBeUndefined();
        expect(result.response.status).toBe(401);
      });

      it("returns error for 403 Forbidden", async () => {
        const client = createClient({ getAccessToken: undefined });

        mockClient.setResponse(CHARGE_ENDPOINT, "GET", {
          error: { message: "Forbidden" },
          status: 403,
        });

        const result = await client["basic.getCharge"]();

        expect(result.error).toEqual({ message: "Forbidden" });
        expect(result.data).toBeUndefined();
        expect(result.response.status).toBe(403);
      });

      it("returns error for 404 Not Found", async () => {
        const client = createClient({ getAccessToken: undefined });

        mockClient.setResponse(CHARGE_ENDPOINT, "GET", {
          error: { message: "Not found" },
          status: 404,
        });

        const result = await client["basic.getCharge"]();

        expect(result.error).toEqual({ message: "Not found" });
        expect(result.data).toBeUndefined();
        expect(result.response.status).toBe(404);
      });

      it("returns error for 500 Internal Server Error", async () => {
        const client = createClient({ getAccessToken: undefined });

        mockClient.setResponse(CHARGE_ENDPOINT, "GET", {
          error: { message: "Internal server error" },
          status: 500,
        });

        const result = await client["basic.getCharge"]();

        expect(result.error).toEqual({ message: "Internal server error" });
        expect(result.data).toBeUndefined();
        expect(result.response.status).toBe(500);
      });

      it("returns error for 503 Service Unavailable", async () => {
        const client = createClient({ getAccessToken: undefined });

        mockClient.setResponse(CHARGE_ENDPOINT, "GET", {
          error: { message: "Service unavailable" },
          status: 503,
        });

        const result = await client["basic.getCharge"]();

        expect(result.error).toEqual({ message: "Service unavailable" });
        expect(result.data).toBeUndefined();
        expect(result.response.status).toBe(503);
      });
    });

    describe("Malformed Responses", () => {
      it("handles responses with invalid JSON", async () => {
        const client = createClient({ getAccessToken: undefined });

        // Mock a response that will fail JSON parsing
        mockClient.use({
          onResponse: () => {
            return new Response("Invalid JSON {{{", {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          },
        });

        const result = await client["basic.getCharge"]();

        // Response should still be returned even if body parsing might fail later
        expect(result.response).toBeInstanceOf(Response);
        expect(result.response.status).toBe(200);
      });

      it("handles responses with missing content-type", async () => {
        const client = createClient({ getAccessToken: undefined });

        mockClient.use({
          onResponse: () => {
            return Response.json({ data: "test" }, {
              status: 200,
              // No content-type header
            });
          },
        });

        const result = await client["basic.getCharge"]();

        expect(result.response).toBeInstanceOf(Response);
        expect(result.response.status).toBe(200);
      });

      it("handles empty response bodies", async () => {
        const client = createClient({ getAccessToken: undefined });

        mockClient.use({
          onResponse: () => {
            return new Response(null, {
              status: 204,
              headers: { "content-type": "application/json" },
            });
          },
        });

        const result = await client["basic.getCharge"]();

        expect(result.response).toBeInstanceOf(Response);
        expect(result.response.status).toBe(204);
      });
    });

    describe("Authentication Errors", () => {
      it("handles OAuth token retrieval failures", async () => {
        const client = createClient({
          basicAuth: undefined,
          getAccessToken: () =>
            Promise.reject(new Error("Failed to get access token")),
        });

        await expect(
          client["oauth.getUser"]({
            params: { path: { userId: "user_123" } },
          }),
        ).rejects.toThrow("Failed to get access token");
      });

      it("continues when OAuth token is null or empty", async () => {
        const client = createClient({
          basicAuth: undefined,
          getAccessToken: () => Promise.resolve(""),
        });

        // Should not throw, just proceed without auth header
        const result = await client["oauth.getUser"]({
          params: { path: { userId: "user_123" } },
        });

        expect(result.response).toBeInstanceOf(Response);

        // Verify no Authorization header was set
        const authHeader = mockClient.requests[0]?.request.headers.get(
          "Authorization",
        );
        expect(authHeader).toBeNull();
      });
    });

    describe("Path Parameter Errors", () => {
      it("handles missing required path parameters", async () => {
        const client = createClient({
          basicAuth: undefined,
          getAccessToken: () => Promise.resolve("token"),
        });

        // Call with missing userId parameter
        await client["oauth.getUser"]({
          params: { path: {} },
        });

        // Path should contain the unreplaced placeholder
        const requestPath = mockClient.requests[0]?.path;
        expect(requestPath).toContain("{userId}");
      });

      it("handles null path parameters", async () => {
        const client = createClient({
          basicAuth: undefined,
          getAccessToken: () => Promise.resolve("token"),
        });

        await client["oauth.getUser"]({
          params: { path: { userId: null } },
        });

        // Path should contain the unreplaced placeholder
        const requestPath = mockClient.requests[0]?.path;
        expect(requestPath).toContain("{userId}");
      });

      it("handles undefined path parameters", async () => {
        const client = createClient({
          basicAuth: undefined,
          getAccessToken: () => Promise.resolve("token"),
        });

        await client["oauth.getUser"]({
          params: { path: { userId: undefined } },
        });

        // Path should contain the unreplaced placeholder
        const requestPath = mockClient.requests[0]?.path;
        expect(requestPath).toContain("{userId}");
      });
    });
  });
});
