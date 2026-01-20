/* eslint-disable sonarjs/no-hardcoded-passwords */
import type { CreateTrustapClientOptions } from "../../client-factory.ts";
import type { operations } from "../../schema.d.ts";

export const mockBasicAuth = {
  username: "test_api_key",
  password: "test_secret",
} as const;

export const mockOAuthToken = "test_oauth_token_abc123";

export const sampleChargeQuery: operations["basic.getCharge"]["parameters"]["query"] =
  {
    price: 1234,
    currency: "usd",
  };

export const sampleTransactionBody: operations["basic.createTransaction"]["requestBody"]["content"]["application/json"] =
  {
    charge: 250,
    charge_calculator_version: 1,
    charge_seller: 120,
    currency: "usd",
    description: "Test transaction",
    price: 1234,
    role: "buyer",
  };

export const sampleCarrierFacilityRequest: operations["basic.getCarrierFacilityOptions"]["requestBody"]["content"]["application/json"] =
  {
    country_code: "us",
    delivery_type: "parcel_locker",
    search_text: "Austin",
  };

export function createTestOptions(
  overrides: Partial<CreateTrustapClientOptions> = {},
): CreateTrustapClientOptions {
  const hasBasicOverride = Object.prototype.hasOwnProperty.call(
    overrides,
    "basicAuth",
  );
  const hasTokenOverride = Object.prototype.hasOwnProperty.call(
    overrides,
    "getAccessToken",
  );

  return {
    apiUrl: overrides.apiUrl ?? "https://test.trustap.com",
    basicAuth: hasBasicOverride ? overrides.basicAuth : mockBasicAuth,
    getAccessToken: hasTokenOverride
      ? overrides.getAccessToken
      : () => Promise.resolve(mockOAuthToken),
    authOverrides: overrides.authOverrides,
    basePath: overrides.basePath,
  };
}

export function encodeBasicAuth(username: string, password: string): string {
  const credentials = `${username}:${password}`;

  // Use btoa if available (browser, Deno), otherwise use Buffer (Node)
  if (typeof btoa !== "undefined") {
    return btoa(credentials);
  }

  const bufferGlobal = (
    globalThis as {
      Buffer?: {
        from: (input: string) => {
          toString: (encoding: "base64") => string;
        };
      };
    }
  ).Buffer;

  if (bufferGlobal) {
    return bufferGlobal.from(credentials).toString("base64");
  }

  throw new Error("No base64 encoder available in this environment");
}
