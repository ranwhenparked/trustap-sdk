import type { MinimalHttpClient } from "../../core.ts";

/**
 * Middleware for intercepting and transforming HTTP requests and responses in tests.
 *
 * Contract:
 * - `onRequest` MUST return a Request object (either the input request or a new one).
 *   It MUST NOT return null/undefined or mutate the input request.
 *   If middleware throws, the error bubbles up and fails the test.
 *
 * - `onResponse` MUST return a Response object (either the input response or a new one).
 *   It MUST NOT return null/undefined or mutate the input response.
 *   If middleware throws, the error bubbles up and fails the test.
 *
 * - Middleware can be synchronous or asynchronous (return Promise).
 *
 * - To skip processing, return the input request/response unchanged.
 *
 * Example:
 * ```typescript
 * const authMiddleware: MockMiddleware = {
 *   onRequest: ({ request }) => {
 *     const headers = new Headers(request.headers);
 *     headers.set('Authorization', 'Bearer token');
 *     return new Request(request, { headers });
 *   }
 * };
 * ```
 */
export interface MockMiddleware {
  onRequest?: (options: { request: Request }) => Request | Promise<Request>;
  onResponse?: (options: {
    request: Request;
    response: Response;
  }) => Response | Promise<Response>;
}

interface MockRequestRecord {
  path: string;
  method: string;
  options?: unknown;
  request: Request;
  response: Response;
}

interface MockResult {
  data?: unknown;
  error?: unknown;
  status?: number;
  headers?: Record<string, string>;
}

const defaultResponse = (): Response =>
  Response.json({ success: true }, {
    status: 200,
    headers: { "content-type": "application/json" },
  });

export class MockHttpClient implements MinimalHttpClient<MockMiddleware> {
  private middleware: MockMiddleware[] = [];
  private responses = new Map<string, MockResult>();
  public requests: MockRequestRecord[] = [];

  use(middleware: MockMiddleware): void {
    this.middleware.push(middleware);
  }

  setResponse(path: string, method: string, result: MockResult): void {
    this.responses.set(`${method.toUpperCase()}:${path}`, result);
  }

  private createRequestInit(method: string, options?: unknown): RequestInit {
    const init: RequestInit = { method: method.toUpperCase() };
    if (
      options &&
      typeof options === "object" &&
      "headers" in (options as Record<string, unknown>)
    ) {
      const provided = (options as { headers?: HeadersInit }).headers;
      if (provided) {
        init.headers = new Headers(provided);
      }
    }
    return init;
  }

  private async processRequestMiddleware(
    request: Request,
  ): Promise<Request> {
    let processed = request;
    for (const middleware of this.middleware) {
      if (middleware.onRequest) {
        const result = middleware.onRequest({ request: processed });
        processed = result instanceof Promise ? await result : result;
      }
    }
    return processed;
  }

  private buildMockResponse(
    preset: MockResult | undefined,
  ): Response {
    if (!preset) {
      return defaultResponse();
    }
    return Response.json(
      preset.data ?? preset.error ?? { success: true },
      {
        status: preset.status ?? (preset.error ? 400 : 200),
        headers: {
          "content-type": "application/json",
          ...preset.headers,
        },
      },
    );
  }

  private async processResponseMiddleware(
    request: Request,
    response: Response,
  ): Promise<Response> {
    let processed = response;
    for (const middleware of this.middleware) {
      if (middleware.onResponse) {
        const result = middleware.onResponse({
          request,
          response: processed,
        });
        processed = result instanceof Promise ? await result : result;
      }
    }
    return processed;
  }

  private async dispatch(
    path: string,
    method: string,
    options?: unknown,
  ): Promise<{ data?: unknown; error?: unknown; response: Response }> {
    const init = this.createRequestInit(method, options);
    let request = new Request(`https://mock.local${path}`, init);
    request = await this.processRequestMiddleware(request);

    const key = `${method.toUpperCase()}:${path}`;
    const preset = this.responses.get(key);
    const response = this.buildMockResponse(preset);
    const finalResponse = await this.processResponseMiddleware(request, response);

    const record: MockRequestRecord = {
      path,
      method: method.toUpperCase(),
      options,
      request,
      response: finalResponse,
    };
    this.requests.push(record);

    // Return either data OR error, never both (matches real fetch client behavior)
    if (preset?.error !== undefined) {
      return {
        error: preset.error,
        response: finalResponse,
      };
    }

    return {
      data: preset?.data,
      response: finalResponse,
    };
  }

  GET(path: string, options?: unknown) {
    return this.dispatch(path, "GET", options);
  }
  POST(path: string, options?: unknown) {
    return this.dispatch(path, "POST", options);
  }
  PUT(path: string, options?: unknown) {
    return this.dispatch(path, "PUT", options);
  }
  PATCH(path: string, options?: unknown) {
    return this.dispatch(path, "PATCH", options);
  }
  DELETE(path: string, options?: unknown) {
    return this.dispatch(path, "DELETE", options);
  }
  HEAD(path: string, options?: unknown) {
    return this.dispatch(path, "HEAD", options);
  }
  OPTIONS(path: string, options?: unknown) {
    return this.dispatch(path, "OPTIONS", options);
  }
}
