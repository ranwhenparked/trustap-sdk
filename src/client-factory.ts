import type {
  CreateTrustapClientOptions,
  MinimalHttpClient,
} from "./core.ts";
import type { operations } from "./schema.d.ts";
import { createTrustapClientCore } from "./core.ts";
import { operationIdToPath } from "./operations-map.ts";
import { securityMap } from "./security-map.ts";



export interface TrustapClientDependencies<
  Middleware,
  Client extends MinimalHttpClient<Middleware>,
  PathClient,
> {
  createClient: (options: { baseUrl: string }) => Client;
  wrapAsPathBasedClient: (client: Client) => PathClient;
}

export function createTrustapClientWithDeps<
  Middleware,
  Client extends MinimalHttpClient<Middleware>,
  PathClient,
>(
  deps: TrustapClientDependencies<Middleware, Client, PathClient>,
  options: CreateTrustapClientOptions,
) {
  return createTrustapClientCore<
    operations,
    Middleware,
    Client,
    typeof operationIdToPath,
    PathClient
  >(
    {
      ...deps,
      operationIdToPath,
      securityMap,
    },
    options,
  );
}

export { type CreateTrustapClientOptions, type MinimalHttpClient} from "./core.ts";