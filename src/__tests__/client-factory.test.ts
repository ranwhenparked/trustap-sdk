import { beforeEach, describe, expect, it } from "vitest";

import { createTrustapClientWithDeps } from "../client-factory.ts";
import type { TrustapClientDependencies } from "../client-factory.ts";
import { MockHttpClient } from "./helpers/mock-http-client.ts";
import type { MockMiddleware } from "./helpers/mock-http-client.ts";
import {
  createTestOptions,
  encodeBasicAuth,
  mockBasicAuth,
  sampleChargeQuery,
} from "./helpers/test-fixtures.ts";
import { runTrustapSuite } from "./helpers/run-guard.ts";

runTrustapSuite(import.meta.url, "Client Factory", () => {
  describe("Client Factory", () => {
    let mockClient: MockHttpClient;

    const createDeps = (): TrustapClientDependencies<
      MockMiddleware,
      MockHttpClient,
      { pathBased: MockHttpClient }
    > => ({
      createClient: () => mockClient,
      wrapAsPathBasedClient: (client) => ({ pathBased: client }),
    });

    beforeEach(() => {
      mockClient = new MockHttpClient();
    });

    it("creates a client that exposes operation-id functions", () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      expect(client).toBeDefined();
      expect(typeof client["basic.getCharge"]).toBe("function");
    });

    it("routes requests using the generated operations map", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

      await client["basic.getCharge"]({
        params: { query: sampleChargeQuery },
      });

      expect(mockClient.requests).toHaveLength(1);
      expect(mockClient.requests[0]?.path).toBe("/api/v4/charge");
      expect(mockClient.requests[0]?.method).toBe("GET");
    });

    it("applies auth middleware sourced from the security map", async () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      );

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

    it("exposes the underlying HTTP client via the raw property", () => {
      const client = createTrustapClientWithDeps(
        createDeps(),
        createTestOptions({ getAccessToken: undefined }),
      ) as { raw: MockHttpClient };

      expect(client.raw).toBe(mockClient);
    });

    it("merges the path-based wrapper onto the returned client", () => {
      const deps: TrustapClientDependencies<
        MockMiddleware,
        MockHttpClient,
        { byPath: MockHttpClient }
      > = {
        createClient: () => mockClient,
        wrapAsPathBasedClient: (client) => ({ byPath: client }),
      };

      const client = createTrustapClientWithDeps(
        deps,
        createTestOptions({ getAccessToken: undefined }),
      ) as { byPath: MockHttpClient };

      expect(client.byPath).toBe(mockClient);
    });
  });
});
