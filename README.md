## @ranwhenparked/trustap-sdk

A lightweight typed Trustap API wrapper built with openapi-typescript + openapi-fetch.

### Generate types

```
npm run generate
```

This pulls the latest OpenAPI schema from `https://docs.trustap.com/_spec/apis/openapi.yaml` and outputs `src/schema.d.ts` and `src/operations-map.ts`.

### Usage

```ts
import { createTrustapClient } from "@rwp/trustap-sdk";

const trustap = createTrustapClient({
  apiUrl: process.env.TRUSTAP_API_URL!,
  basicAuth: {
    username: process.env.TRUSTAP_API_KEY!,
    password: "", // Trustap basic auth uses API key + empty password
  },
});

// Path-based client
const { data, error } = await trustap["/users/me/balances"].GET({
  headers: { Authorization: `Bearer ${accessToken}` },
});

// Or verb-based via raw
const { data: d2 } = await trustap.raw.GET("/users/me/balances", {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

Auth: supply OAuth access token via `Authorization: Bearer` header per request. For server-to-server endpoints, configure HTTP Basic auth via `basicAuth` (username: API key, password: empty).
