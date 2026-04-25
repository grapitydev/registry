import { Pool } from "pg";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Wait } from "testcontainers";
import { createApp } from "../../src/server";
import { PostgreSQLSpecStore } from "../../src/storage/postgresql";
import { defaultConfig } from "../../src/config";

export async function createTestApp() {
  const container = await new PostgreSqlContainer("postgres:16")
    .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections", 2))
    .start();
  const connectionUri = container.getConnectionUri();
  const store = new PostgreSQLSpecStore(connectionUri);
  await store.migrate();

  const pool = new Pool({ connectionString: connectionUri });
  const config = { ...defaultConfig, gracePeriodDays: 30 };
  const app = createApp(config, store);

  async function reset() {
    await pool.query("TRUNCATE specs, spec_versions, audit_log CASCADE");
  }

  async function cleanup() {
    await pool.end();
    await store.end();
    await container.stop();
  }

  return { app, store, reset, cleanup };
}

export function makeSpec(overrides: {
  paths?: Record<string, unknown>;
  title?: string;
} = {}): string {
  const paths = overrides.paths ?? {
    "/payments/{id}": {
      get: {
        operationId: "getPayment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Payment details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    amount: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return JSON.stringify({
    openapi: "3.1.0",
    info: { title: overrides.title ?? "Test API", version: "1.0.0" },
    paths,
  });
}

export async function pushSpec(
  app: ReturnType<typeof createApp>,
  body: Record<string, unknown>
) {
  const res = await app.request("/v1/specs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { res, body: await res.json() };
}
