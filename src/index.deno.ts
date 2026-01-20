import type {
  DenoHttpClient,
  Middleware,
  PathBasedClient,
} from "./client-deno.ts";
import { createClient, wrapAsPathBasedClient } from "./client-deno.ts";

import { createTrustapClientWithDeps } from "./client-factory.ts";
import type { CreateTrustapClientOptions } from "./client-factory.ts";

export function createTrustapClient(options: CreateTrustapClientOptions) {
  return createTrustapClientWithDeps<
    Middleware,
    DenoHttpClient,
    PathBasedClient
  >(
    {
      createClient,
      wrapAsPathBasedClient,
    },
    options,
  );
}

export * from "./state-machine.ts";

// Export webhook schemas and types
export * from "./webhook-schemas.ts";
