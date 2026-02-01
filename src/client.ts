import createClient, {
  createPathBasedClient,
  mergeHeaders,
  type Client,
  type ClientOptions,
  type PathBasedClient,
} from "openapi-fetch";
import type { paths } from "./generated/types.ts";

export const TRUSTAP_BASE_URLS = {
  staging: "https://dev.stage.trustap.com/api/v1",
  production: "https://dev.trustap.com/api/v1",
} as const;

export type TrustapClient = Client<paths>;
export type TrustapPathClient = PathBasedClient<paths>;

export type TrustapAuth =
  | { type: "apiKey"; apiKey: string }
  | { type: "oauth"; accessToken: string };

export type TrustapClientOptions = Omit<ClientOptions, "baseUrl" | "headers"> & {
  baseUrl?: string;
  headers?: ClientOptions["headers"];
  auth?: TrustapAuth;
};

export function createApiKeyAuthHeader(apiKey: string): string {
  return `Basic ${encodeBase64(`${apiKey}:`)}`;
}

export function createBearerAuthHeader(accessToken: string): string {
  return `Bearer ${accessToken}`;
}

export function createTrustapClient(options: TrustapClientOptions = {}): TrustapClient {
  const { baseUrl = TRUSTAP_BASE_URLS.staging, headers, auth, ...rest } = options;
  const authHeader = resolveAuthHeader(auth);
  const clientOptions: ClientOptions = { baseUrl, ...rest };

  if (authHeader) {
    clientOptions.headers = withAuthHeader(headers, authHeader);
  } else if (headers) {
    clientOptions.headers = headers;
  }

  return createClient<paths>(clientOptions);
}

export function createTrustapPathClient(
  options: TrustapClientOptions = {},
): TrustapPathClient {
  const { baseUrl = TRUSTAP_BASE_URLS.staging, headers, auth, ...rest } = options;
  const authHeader = resolveAuthHeader(auth);
  const clientOptions: ClientOptions = { baseUrl, ...rest };

  if (authHeader) {
    clientOptions.headers = withAuthHeader(headers, authHeader);
  } else if (headers) {
    clientOptions.headers = headers;
  }

  return createPathBasedClient<paths>(clientOptions);
}

function resolveAuthHeader(auth?: TrustapAuth): string | undefined {
  if (!auth) return undefined;
  return auth.type === "apiKey"
    ? createApiKeyAuthHeader(auth.apiKey)
    : createBearerAuthHeader(auth.accessToken);
}

function withAuthHeader(
  headers: ClientOptions["headers"] | undefined,
  value: string,
): Headers {
  return mergeHeaders(headers, { Authorization: value });
}

const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function encodeBase64(input: string): string {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(input);
  }

  const bytes = new TextEncoder().encode(input);
  let output = "";

  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i] ?? 0;
    const b2 = bytes[i + 1] ?? 0;
    const b3 = bytes[i + 2] ?? 0;
    const hasB2 = i + 1 < bytes.length;
    const hasB3 = i + 2 < bytes.length;
    const triplet = (b1 << 16) | (b2 << 8) | b3;

    output += BASE64_ALPHABET[(triplet >> 18) & 0x3f];
    output += BASE64_ALPHABET[(triplet >> 12) & 0x3f];
    output += hasB2 ? BASE64_ALPHABET[(triplet >> 6) & 0x3f] : "=";
    output += hasB3 ? BASE64_ALPHABET[triplet & 0x3f] : "=";
  }

  return output;
}
