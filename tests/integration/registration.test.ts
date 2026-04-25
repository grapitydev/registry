import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { createTestApp, makeSpec, pushSpec } from "./helpers";
import type { createApp } from "../../src/server";

const baseSpec = makeSpec();

let app: ReturnType<typeof createApp>;
let reset: () => Promise<void>;
let cleanup: () => Promise<void>;

beforeAll(async () => {
  ({ app, reset, cleanup } = await createTestApp());
}, 120_000);

beforeEach(async () => {
  await reset();
});

afterAll(async () => {
  await cleanup();
});

describe("Scenario 1: Brand new API registration", () => {
  it("pushes first version and returns 201 with isNewSpec: true", async () => {
    const { res, body } = await pushSpec(app, {
      content: baseSpec,
      name: "payments-api",
      owner: "platform-team",
      tags: ["payments", "public"],
    });

    expect(res.status).toBe(201);
    expect(body.isNewSpec).toBe(true);
    expect(body.version.semver).toBe("1.0.0");
    expect(body.compatReport).toBeUndefined();
  });

  it("spec appears in list after push", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs");
    const list = await res.json() as any[];
    expect(list.length).toBe(1);
    expect(list[0].name).toBe("payments-api");
  });

  it("GET /v1/specs/{name} returns spec with latestVersion", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api");
    const body = await res.json() as any;
    expect(res.status).toBe(200);
    expect(body.spec.name).toBe("payments-api");
    expect(body.latestVersion.semver).toBe("1.0.0");
  });
});

describe("Scenario 11: Platform team discovers all APIs", () => {
  it("returns empty list from empty registry", async () => {
    const res = await app.request("/v1/specs");
    const list = await res.json();
    expect(list).toEqual([]);
  });

  it("filters by owner", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api", owner: "payments-team" });
    await pushSpec(app, { content: baseSpec, name: "users-api", owner: "platform-team" });

    const res = await app.request("/v1/specs?owner=payments-team");
    const list = await res.json() as any[];
    expect(list.length).toBe(1);
    expect(list[0].name).toBe("payments-api");
  });

  it("filters by tags", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api", tags: ["payments", "public"] });
    await pushSpec(app, { content: baseSpec, name: "internal-api", tags: ["internal"] });

    const res = await app.request("/v1/specs?tags=public");
    const list = await res.json() as any[];
    expect(list.length).toBe(1);
    expect(list[0].name).toBe("payments-api");
  });
});

describe("Scenario 12: Error cases", () => {
  it("GET /v1/specs/{name} returns 404 for unknown spec", async () => {
    const res = await app.request("/v1/specs/does-not-exist");
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.error).toBe("not_found");
  });

  it("GET /v1/specs/{name}/versions/{semver} returns 404 for unknown version", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const res = await app.request("/v1/specs/payments-api/versions/9.9.9");
    expect(res.status).toBe(404);
  });

  it("GET /v1/specs/{name}/compat/{semver} returns 404 for first version", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const res = await app.request("/v1/specs/payments-api/compat/1.0.0");
    expect(res.status).toBe(404);
  });

  it("POST /v1/specs with missing content returns 400", async () => {
    const { res } = await pushSpec(app, { name: "payments-api" });
    expect(res.status).toBe(400);
  });

  it("POST /v1/specs with missing name returns 400", async () => {
    const { res } = await pushSpec(app, { content: baseSpec });
    expect(res.status).toBe(400);
  });
});
