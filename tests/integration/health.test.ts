import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { createTestApp } from "./helpers";
import type { createApp } from "../../src/server";

let app: ReturnType<typeof createApp>;
let cleanup: () => Promise<void>;

beforeAll(async () => {
  ({ app, cleanup } = await createTestApp());
}, 120_000);

afterAll(async () => {
  await cleanup();
});

describe("GET /v1/health", () => {
  it("returns 200 always", async () => {
    const res = await app.request("/v1/health");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe("ok");
    expect(typeof body.uptime).toBe("number");
  });
});
