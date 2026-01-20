import type { Middleware, PathBasedClient } from "openapi-fetch";
import createClient, { wrapAsPathBasedClient } from "openapi-fetch";

import { createTrustapClientWithDeps } from "./client-factory.ts";
import type {
  CreateTrustapClientOptions,
  MinimalHttpClient,
} from "./client-factory.ts";
import type { paths } from "./schema.d.ts";

;
;
export type TrustapClient = ReturnType<typeof createTrustapClient>;

export function createTrustapClient(options: CreateTrustapClientOptions) {
  return createTrustapClientWithDeps<
    Middleware,
    MinimalHttpClient<Middleware>,
    PathBasedClient<paths>
  >(
    {
      createClient: (opts) =>
        createClient<paths>(opts) as unknown as MinimalHttpClient<Middleware>,
      wrapAsPathBasedClient: wrapAsPathBasedClient as unknown as (
        client: MinimalHttpClient<Middleware>,
      ) => PathBasedClient<paths>,
    },
    options,
  );
}

// Export state machine utilities
export * from "./state-machine.ts";

// Export webhook schemas and types
export * from "./webhook-schemas.ts";
