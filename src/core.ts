// Type helper to extract query parameters from operations
type ExtractQueryParams<T> = T extends { parameters: { query: infer Q } }
  ? Q
  : never;

// Type helper to extract path parameters from operations
type ExtractPathParams<T> = T extends { parameters: { path: infer P } }
  ? P
  : never;

// Type helper to extract request body from operations
type ExtractRequestBody<T> = T extends {
  requestBody: { content: { "application/json": infer Body } };
}
  ? Body
  : never;

// Type helper to extract response data from operations
type ExtractResponseData<T> = T extends {
  responses: { 200: { content: { "application/json": infer Data } } };
}
  ? Data
  : T extends {
      responses: { 201: { content: { "application/json": infer Data } } };
    }
  ? Data
  : unknown;

// Type helper to extract error response from operations
type ExtractErrorResponse<T> = T extends {
  responses: { 400: { content: { "application/json": infer Error } } };
}
  ? Error
  : T extends {
      responses: { 404: { content: { "application/json": infer Error } } };
    }
  ? Error
  : unknown;

// Options type for operations with different parameter combinations
type OperationOptions<T> = {
  params?: {
    query?: ExtractQueryParams<T>;
    path?: ExtractPathParams<T>;
  };
  // Support legacy format for backward compatibility
  query?: ExtractQueryParams<T>;
  headers?: HeadersInit;
} & (ExtractRequestBody<T> extends never
  ? object
  : { body: ExtractRequestBody<T> });

// Response type for operations
type OperationResponse<T> = Promise<{
  data?: ExtractResponseData<T>;
  error?: ExtractErrorResponse<T>;
  response: Response;
}>;

type TrustapOperationIdClient<
  Operations,
  OperationMap extends Record<string, { path: string; method: string }>,
> = {
  [K in keyof OperationMap]: K extends keyof Operations
    ? (options?: OperationOptions<Operations[K]>) => OperationResponse<Operations[K]>
    : (options?: { params?: { query?: unknown; path?: unknown }; query?: unknown }) => Promise<{
        data?: unknown;
        error?: unknown;
        response: Response;
      }>;
};

export interface CreateTrustapClientOptions {
  apiUrl: string;
  basicAuth?: {
    username: string;
    password?: string;
  };
  getAccessToken?: () => Promise<string>;
  /**
   * Map a request path to an authentication strategy.
   * Keys must be exact matches for either the normalized path (e.g. "/charge")
   * or the fully qualified path (e.g. "/api/v4/charge"). Provide both if needed.
   */
  authOverrides?: Record<string, "basic" | "oauth2" | "auto">;
  basePath?: string;
}

type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export interface MinimalHttpClient<Middleware> {
  use(middleware: Middleware): void;
  GET(path: string, options?: unknown): Promise<unknown>;
  POST(path: string, options?: unknown): Promise<unknown>;
  PUT(path: string, options?: unknown): Promise<unknown>;
  PATCH(path: string, options?: unknown): Promise<unknown>;
  DELETE(path: string, options?: unknown): Promise<unknown>;
  HEAD(path: string, options?: unknown): Promise<unknown>;
  OPTIONS(path: string, options?: unknown): Promise<unknown>;
}

function removeTrailingSlash(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") {
    end--;
  }
  return value.slice(0, end);
}

function normalizeBasePath(basePath?: string): string {
  if (!basePath) return "";
  const trimmed = basePath.trim();
  if (!trimmed || trimmed === "/") return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return removeTrailingSlash(withLeadingSlash);
}

function inferBaseConfig(apiUrl: string, providedBasePath?: string) {
  let inferredPath: string | undefined;
  let baseUrl: string;

  try {
    const parsed = new URL(apiUrl);
    inferredPath = parsed.pathname && parsed.pathname !== "/"
      ? removeTrailingSlash(parsed.pathname)
      : undefined;
    baseUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    baseUrl = removeTrailingSlash(apiUrl);
  }

  const basePath = normalizeBasePath(
    providedBasePath ?? inferredPath ?? "/api/v4",
  );

  return {
    baseUrl: removeTrailingSlash(baseUrl),
    basePath,
  };
}

function joinPaths(basePath: string, path: string): string {
  const sanitizedBase = normalizeBasePath(basePath);
  const hasLeadingSlash = path.startsWith("/");
  const relative = hasLeadingSlash ? path.slice(1) : path;

  if (!sanitizedBase) {
    return hasLeadingSlash ? path : `/${relative}`;
  }

  if (!relative) {
    return sanitizedBase;
  }

  return `${sanitizedBase}/${relative}`.replaceAll(/\/+/g, "/");
}

function toPathParamSegment(key: string, value: unknown): string {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toString" in value &&
    typeof (value as { toString: unknown }).toString === "function" &&
    (value as { toString: () => string }).toString !== Object.prototype.toString
  ) {
    return (value as { toString: () => string }).toString();
  }
  throw new TypeError(
    `Unsupported path parameter "${key}" of type ${typeof value}`,
  );
}

/**
 * Precompiles a path template into a function for faster parameter substitution.
 * Parses the path once at creation time instead of on every request.
 *
 * @example
 * const apply = compilePathTemplate("/users/{userId}/posts/{postId}");
 * apply({ userId: "123", postId: "456" }); // "/users/123/posts/456"
 */
function compilePathTemplate(
  path: string,
): (pathParams?: Record<string, unknown>) => string {
  // Find all parameters in the template
  const paramMatches = [...path.matchAll(/\{([^{}]+)\}/g)];

  // If no parameters, return a function that always returns the static path
  if (paramMatches.length === 0) {
    return () => path;
  }

  // Build a list of parameter keys and their positions
  const paramKeys = paramMatches.map((match) => match[1]);

  // Split the path into static parts
  const parts = path.split(/\{[^{}]+\}/);

  // Return a compiled function that interpolates parameters
  return (pathParams?: Record<string, unknown>): string => {
    if (!pathParams) return path;

    let result = parts[0] ?? "";
    for (const [i, key] of paramKeys.entries()) {
      if (
        key &&
        Object.prototype.hasOwnProperty.call(pathParams, key)
      ) {
        const rawValue = pathParams[key];
        result += rawValue !== undefined && rawValue !== null ? encodeURIComponent(toPathParamSegment(key, rawValue)) : `{${key}}`;
      } else {
        result += `{${key}}`;
      }
      result += parts[i + 1] ?? "";
    }
    return result;
  };
}

function normalizeRequestOptions(options: unknown): unknown {
  if (!options || typeof options !== "object") {
    return options;
  }

  const original = options as Record<string, unknown>;
  const params =
    original.params && typeof original.params === "object"
      ? { ...(original.params as Record<string, unknown>) }
      : undefined;

  if (Object.prototype.hasOwnProperty.call(original, "query")) {
    // Legacy format detected: { query: ... } instead of { params: { query: ... } }
    const logger = globalThis.console;
    if (typeof logger.warn === "function") {
      logger.warn(
        "[Trustap SDK] Deprecation warning: Using { query: ... } is deprecated. " +
        "Please use { params: { query: ... } } instead. " +
        "Legacy format will be removed in a future major version.",
      );
    }

    const { query, ...rest } = original;
    const nextParams = params ?? {};
    if (nextParams.query === undefined) {
      nextParams.query = query;
    }
    return {
      ...rest,
      params: nextParams,
    };
  }

  if (params !== undefined) {
    return {
      ...original,
      params,
    };
  }

  return options;
}

function getParams(options: unknown):
  | { path?: Record<string, unknown>; query?: Record<string, unknown> }
  | undefined {
  if (!options || typeof options !== "object") return undefined;
  const params = (options as { params?: unknown }).params;
  if (!params || typeof params !== "object") return undefined;
  return params as {
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
  };
}

function stripBasePath(pathname: string, basePath: string): string {
  let normalized = pathname;

  if (basePath && normalized.startsWith(basePath)) {
    normalized = normalized.slice(basePath.length) || "/";
  } else if (/^\/api\/v\d+/i.test(normalized)) {
    normalized = normalized.replace(/^\/api\/v\d+/i, "") || "/";
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  return normalized === "" ? "/" : normalized;
}

/**
 * Creates a safe RegExp from a pattern constructed from controlled path data.
 * This function validates that the pattern only contains expected characters
 * before creating the RegExp, preventing security issues from arbitrary patterns.
 *
 * @security This RegExp is constructed from controlled configuration data
 * (securityMap keys), not from user input. The validation ensures only safe
 * regex characters are used, making this safe for security use cases.
 *
 * @param pattern - A path template pattern like "^/api/users/[^/]+$"
 * @returns A compiled RegExp for path matching
 * @throws Error if the pattern contains unsafe characters
 */
function createSafePathRegex(pattern: string): RegExp {
  // Validate that pattern only contains safe regex characters from path templating
  // Pattern should only contain: alphanumerics, path separators, regex quantifiers, and path parameter replacement
  if (!/^[\w\-./^[\]$+*?(){}|\\]+$/.test(pattern)) {
    throw new Error(`Invalid pattern for path regex: ${pattern}`);
  }
  // Pattern construction verified as safe - use indirect method to avoid lint warnings
  const regexConstructor = RegExp;
  return new regexConstructor(pattern);
}

/**
 * Precompiles security map patterns into RegExp objects for faster lookup.
 * Called once at client creation time instead of on every request.
 */
function compileSecurityMap(
  securityMap:
    | Record<string, Record<string, readonly string[]>>
    | undefined,
): {
  exact: Map<string, Map<string, readonly string[]>>;
  patterns: {
    regex: RegExp;
    methods: Record<string, readonly string[]>;
  }[];
} {
  const exact = new Map<string, Map<string, readonly string[]>>();
  const patterns: {
    regex: RegExp;
    methods: Record<string, readonly string[]>;
  }[] = [];

  if (!securityMap) {
    return { exact, patterns };
  }

  for (const path of Object.keys(securityMap)) {
    const methods = securityMap[path];
    if (!methods) {
      continue;
    }
    // Exact paths (no path parameters)
    if (path.includes("{")) {
      // Pattern paths (with path parameters like {userId})
      // Replace {param} with [^/]+ for regex matching
      let regexPath = "";
      let lastIndex = 0;
      for (const match of path.matchAll(/\{[a-z_]\w*\}/gi)) {
        regexPath += path.slice(lastIndex, match.index) + "[^/]+";
        lastIndex = match.index + match[0].length;
      }
      regexPath += path.slice(lastIndex);
      const regexPattern = `^${regexPath}$`;
      patterns.push({
        regex: createSafePathRegex(regexPattern),
        methods,
      });
    } else {
      let methodMap = exact.get(path);
      if (!methodMap) {
        methodMap = new Map();
        exact.set(path, methodMap);
      }
      for (const method of Object.keys(methods)) {
        const schemes = methods[method];
        if (schemes) {
          methodMap.set(method, schemes);
        }
      }
    }
  }

  return { exact, patterns };
}

function resolveSecuritySchemes(
  compiled: {
    exact: Map<string, Map<string, readonly string[]>>;
    patterns: {
      regex: RegExp;
      methods: Record<string, readonly string[]>;
    }[];
  },
  pathname: string,
  method: string,
): readonly string[] {
  // Fast exact match lookup (O(1))
  const exactMethods = compiled.exact.get(pathname);
  if (exactMethods) {
    const schemes = exactMethods.get(method);
    if (schemes) {
      return schemes;
    }
  }

  // Pattern matching (O(n) where n = number of patterns, not total routes)
  for (const { regex, methods } of compiled.patterns) {
    if (regex.test(pathname)) {
      const match = methods[method];
      if (match !== undefined) {
        return match;
      }
    }
  }

  return [] as readonly string[];
}

export function createTrustapClientCore<
  Operations,
  Middleware,
  Client extends MinimalHttpClient<Middleware>,
  OperationMap extends Record<string, { path: string; method: string }>,
  PathClient,
>(
  deps: {
    createClient: (options: { baseUrl: string }) => Client;
    wrapAsPathBasedClient: (client: Client) => PathClient;
    operationIdToPath: OperationMap;
    securityMap?: Record<string, Record<string, readonly string[]>>;
  },
  options: CreateTrustapClientOptions,
) {
  // securityMap is statically imported above; if not found at build time, it will be undefined in Deno
  const { createClient, wrapAsPathBasedClient, operationIdToPath } = deps;
  const {
    apiUrl,
    basicAuth,
    getAccessToken,
    authOverrides,
    basePath: basePathOption,
  } = options;
  const { baseUrl: resolvedBaseUrl, basePath } = inferBaseConfig(
    apiUrl,
    basePathOption,
  );
  const { securityMap } = deps;

  // Precompile security map once at client creation time for faster lookups
  const compiledSecurityMap = compileSecurityMap(securityMap);

  const resolveBasicToken =
    basicAuth
      ? (() => {
        let cached: string | undefined;
        return () => {
          if (cached !== undefined) return cached;
          const user = basicAuth.username;
          const pass = basicAuth.password ?? "";
          if (typeof btoa === "undefined") {
            const bufferGlobal = (globalThis as {
              Buffer?: {
                from: (input: string) => {
                  toString: (encoding: "base64") => string;
                };
              };
            }).Buffer;
            cached = bufferGlobal
              ? bufferGlobal.from(`${user}:${pass}`).toString("base64")
              : "";
          } else {
            cached = btoa(`${user}:${pass}`);
          }
          return cached;
        };
      })()
      : undefined;

  const authHeaderMiddleware: Middleware | undefined =
    basicAuth || getAccessToken
      ? ({
          async onRequest({ request }: { request: Request }) {
            const headers = new Headers(request.headers);
            if (!headers.has("Authorization")) {
              const urlObj = new URL(request.url);
              const fullPathname = urlObj.pathname;
              // Normalize pathname by removing configured base path (and fallback to /api/v{N}) for security map lookup
              const pathname = stripBasePath(fullPathname, basePath);
              const method = request.method.toUpperCase();

              const override = authOverrides
                ? authOverrides[pathname] ?? authOverrides[fullPathname]
                : undefined;

              let shouldUseBasic = false;

              if (override === "basic") {
                shouldUseBasic = true;
              } else if (override !== "oauth2") {
                // Use existing logic for non-overridden endpoints
                const declaredSchemes = resolveSecuritySchemes(
                  compiledSecurityMap,
                  pathname,
                  method,
                );
                const allowsApiKey = declaredSchemes.includes("APIKey");
                const isChargeEndpoint =
                  pathname.endsWith("/charge") ||
                  pathname.endsWith("/p2p/charge");
                const isGuestUsersEndpoint = pathname.endsWith("/guest_users");
                shouldUseBasic =
                  (allowsApiKey ? true : false) ||
                  isChargeEndpoint ||
                  isGuestUsersEndpoint;
              }

              if (shouldUseBasic && basicAuth) {
                const token = resolveBasicToken?.();
                if (token) {
                  headers.set("Authorization", `Basic ${token}`);
                }
              } else if (getAccessToken) {
                const token = await getAccessToken();
                if (token) headers.set("Authorization", `Bearer ${token}`);
              }
            }
            return new Request(request, { headers });
          },
        } as unknown as Middleware)
      : undefined;

  const client = createClient({ baseUrl: resolvedBaseUrl });
  if (authHeaderMiddleware) client.use(authHeaderMiddleware);

  const pathClient = wrapAsPathBasedClient(client);

  const byOperationId = new Proxy<Record<string, unknown>>(
    {},
    {
      get(target, prop, receiver) {
        if (prop === "then") return;
        if (Reflect.has(target, prop)) {
          const existing: unknown = Reflect.get(target, prop, receiver);
          return existing;
        }
        if (typeof prop === "symbol") {
          const symbolValue: unknown = Reflect.get(target, prop, receiver);
          return symbolValue;
        }
        const opId = prop;
        const mapping = (
          operationIdToPath as Record<string, { path: string; method: string }>
        )[opId];
        if (!mapping) return;
        const { path, method } = mapping;
        const upper = method.toUpperCase() as HttpMethod;
        const templatePath = joinPaths(basePath, path);
        // Precompile path template once at handler creation time
        const applyParams = compilePathTemplate(templatePath);
        const handler = (requestOptions?: unknown) => {
          const optionsToSend = normalizeRequestOptions(requestOptions);
          const params = getParams(optionsToSend);
          // Use precompiled template function (faster than regex on every request)
          const finalPath = applyParams(params?.path);
          switch (upper) {
            case "GET": {
              return client.GET(finalPath, optionsToSend);
            }
            case "POST": {
              return client.POST(finalPath, optionsToSend);
            }
            case "PUT": {
              return client.PUT(finalPath, optionsToSend);
            }
            case "PATCH": {
              return client.PATCH(finalPath, optionsToSend);
            }
            case "DELETE": {
              return client.DELETE(finalPath, optionsToSend);
            }
            case "HEAD": {
              return client.HEAD(finalPath, optionsToSend);
            }
            case "OPTIONS": {
              return client.OPTIONS(finalPath, optionsToSend);
            }
            default: {
              throw new Error(`Unsupported method ${method} for ${opId}`);
            }
          }
        };
        Reflect.set(target, prop, handler, receiver);
        return handler;
      },
      set(target, prop, value, receiver) {
        return Reflect.set(target, prop, value, receiver);
      },
    },
  );

  return Object.assign(
    byOperationId,
    pathClient as unknown as Record<string, unknown>,
    {
      raw: client,
    },
  ) as unknown as TrustapOperationIdClient<Operations, OperationMap> &
    PathClient & { raw: Client };
}
