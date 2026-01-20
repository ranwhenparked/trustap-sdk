import { afterAll, afterEach, beforeAll, vi } from "vitest";

beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response("{}", {
      status: 200,
      headers: { "content-type": "application/json" },
    }))),
  );
});

// Per-test setup - clear mocks after each test to prevent state leakage
afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// Test utilities
export function createMockRequest(
  url: string,
  options?: RequestInit,
): Request {
  return new Request(url, options);
}

export function createMockResponse(
  body?: unknown,
  options?: ResponseInit,
): Response {
  const responseBody = body
    ? JSON.stringify(body)
    : undefined;
  return new Response(responseBody, {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
    ...options,
  });
}
