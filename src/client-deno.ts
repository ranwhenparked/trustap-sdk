/**
 * Deno-compatible HTTP client for Trustap API
 * This module provides a minimal implementation that works with Web APIs
 */

export interface Middleware {
  onRequest?(options: { request: Request }): Request | Promise<Request>;
  onResponse?(options: {
    request: Request;
    response: Response;
  }): Response | Promise<Response>;
}

interface ClientOptions {
  baseUrl: string;
}

interface RequestOptions {
  params?: {
    query?: Record<string, string | number | boolean>;
    path?: Record<string, string | number>;
  };
  body?: unknown;
  headers?: Record<string, string>;
}

export class DenoHttpClient {
  private baseUrl: string;
  private middleware: Middleware[] = [];

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
  }

  use(middleware: Middleware) {
    this.middleware.push(middleware);
  }

  private async buildRequest(
    path: string,
    method: string,
    options: RequestOptions = {},
  ): Promise<Request> {
    let url = this.baseUrl + path;

    // Handle path parameters
    if (options.params?.path) {
      for (const [key, value] of Object.entries(options.params.path)) {
        url = url.replace(`{${key}}`, String(value));
      }
    }

    // Handle query parameters
    if (options.params?.query) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.params.query)) {
        searchParams.set(key, String(value));
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }

    const headers = new Headers(options.headers);

    // Set content-type for body requests
    if (options.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    let request = new Request(url, {
      method: method.toUpperCase(),
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // Apply middleware
    for (const middleware of this.middleware) {
      if (middleware.onRequest) {
        request = await middleware.onRequest({ request });
      }
    }

    return request;
  }

  private async handleResponse(request: Request, response: Response) {
    let finalResponse = response;

    // Apply response middleware
    for (const middleware of this.middleware) {
      if (middleware.onResponse) {
        finalResponse = await middleware.onResponse({
          request,
          response: finalResponse,
        });
      }
    }

    if (!finalResponse.ok) {
      let errorData: unknown;
      try {
        errorData = await finalResponse.json();
      } catch {
        errorData = { message: finalResponse.statusText };
      }

      const error = new Error(
        `HTTP ${finalResponse.status}: ${finalResponse.statusText}`,
      ) as Error & { response: Response; data: unknown };
      error.response = finalResponse;
      error.data = errorData;
      throw error;
    }

    // Try to parse as JSON, fall back to text
    try {
      const data: unknown = await finalResponse.json();
      return { data, response: finalResponse };
    } catch {
      const data: unknown = await finalResponse.text();
      return { data, response: finalResponse };
    }
  }

  async GET(path: string, options?: RequestOptions) {
    const request = await this.buildRequest(path, "GET", options);
    const response = await fetch(request);
    return this.handleResponse(request, response);
  }

  async POST(path: string, options?: RequestOptions) {
    const request = await this.buildRequest(path, "POST", options);
    const response = await fetch(request);
    return this.handleResponse(request, response);
  }

  async PUT(path: string, options?: RequestOptions) {
    const request = await this.buildRequest(path, "PUT", options);
    const response = await fetch(request);
    return this.handleResponse(request, response);
  }

  async PATCH(path: string, options?: RequestOptions) {
    const request = await this.buildRequest(path, "PATCH", options);
    const response = await fetch(request);
    return this.handleResponse(request, response);
  }

  async DELETE(path: string, options?: RequestOptions) {
    const request = await this.buildRequest(path, "DELETE", options);
    const response = await fetch(request);
    return this.handleResponse(request, response);
  }

  async HEAD(path: string, options?: RequestOptions) {
    const request = await this.buildRequest(path, "HEAD", options);
    const response = await fetch(request);
    return this.handleResponse(request, response);
  }

  async OPTIONS(path: string, options?: RequestOptions) {
    const request = await this.buildRequest(path, "OPTIONS", options);
    const response = await fetch(request);
    return this.handleResponse(request, response);
  }
}

export function createClient(options: ClientOptions) {
  return new DenoHttpClient(options);
}

// Simple path-based client wrapper for compatibility
export type PathBasedClient = Record<
  string,
  Record<string, (options: RequestOptions) => Promise<unknown>>
>;

export function wrapAsPathBasedClient(client: DenoHttpClient): PathBasedClient {
  return new Proxy({} as PathBasedClient, {
    get(target, prop) {
      const path = String(prop);
      return new Proxy({} as Record<string, unknown>, {
        get(target, method) {
          const httpMethod = String(method).toUpperCase();
          return (options: RequestOptions) => {
            switch (httpMethod) {
              case "GET": {
                return client.GET(path, options);
              }
              case "POST": {
                return client.POST(path, options);
              }
              case "PUT": {
                return client.PUT(path, options);
              }
              case "PATCH": {
                return client.PATCH(path, options);
              }
              case "DELETE": {
                return client.DELETE(path, options);
              }
              case "HEAD": {
                return client.HEAD(path, options);
              }
              case "OPTIONS": {
                return client.OPTIONS(path, options);
              }
              default: {
                throw new Error(`Unsupported HTTP method: ${httpMethod}`);
              }
            }
          };
        },
      });
    },
  });
}
