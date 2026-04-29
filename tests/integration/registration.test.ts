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
    expect(body.data.isNewSpec).toBe(true);
    expect(body.data.version.semver).toBe("1.0.0");
    expect(body.data.compatReport).toBeUndefined();
  });

  it("spec appears in list after push", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs");
    const list = await res.json() as any;
    expect(list.data.length).toBe(1);
    expect(list.data[0].name).toBe("payments-api");
  });

  it("GET /v1/specs/{name} returns spec with latestVersion", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api");
    const body = await res.json() as any;
    expect(res.status).toBe(200);
    expect(body.data.spec.name).toBe("payments-api");
    expect(body.data.latestVersion.semver).toBe("1.0.0");
  });
});

describe("Scenario 11: Platform team discovers all APIs", () => {
  it("returns empty list from empty registry", async () => {
    const res = await app.request("/v1/specs");
    const list = await res.json() as any;
    expect(list.data).toEqual([]);
  });

  it("filters by owner", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api", owner: "payments-team" });
    await pushSpec(app, { content: baseSpec, name: "users-api", owner: "platform-team" });

    const res = await app.request("/v1/specs?owner=payments-team");
    const list = await res.json() as any;
    expect(list.data.length).toBe(1);
    expect(list.data[0].name).toBe("payments-api");
  });

  it("filters by tags", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api", tags: ["payments", "public"] });
    await pushSpec(app, { content: baseSpec, name: "internal-api", tags: ["internal"] });

    const res = await app.request("/v1/specs?tags=public");
    const list = await res.json() as any;
    expect(list.data.length).toBe(1);
    expect(list.data[0].name).toBe("payments-api");
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

describe("Scenario 15: Version pagination", () => {
  it("returns default pagination with single version", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions");
    const page = await res.json() as any;

    expect(res.status).toBe(200);
    expect(page.data.length).toBe(1);
    expect(page.pagination.limit).toBe(10);
    expect(page.pagination.offset).toBe(0);
    expect(page.pagination.total).toBe(1);
    expect(page.pagination.hasMore).toBe(false);
  });

  it("returns empty page for unknown spec", async () => {
    const res = await app.request("/v1/specs/does-not-exist/versions");
    const page = await res.json() as any;

    expect(res.status).toBe(200);
    expect(page.data).toEqual([]);
    expect(page.pagination.total).toBe(0);
    expect(page.pagination.hasMore).toBe(false);
  });

  it("respects custom limit", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        ...JSON.parse(baseSpec).paths,
        "/payments/{id}/refunds": {
          get: {
            operationId: "getRefunds",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
    });
    await pushSpec(app, { content: specV2, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions?limit=1");
    const page = await res.json() as any;

    expect(page.data.length).toBe(1);
    expect(page.pagination.limit).toBe(1);
    expect(page.pagination.total).toBe(2);
    expect(page.pagination.hasMore).toBe(true);
  });

  it("respects offset", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        ...JSON.parse(baseSpec).paths,
        "/payments/{id}/refunds": {
          get: {
            operationId: "getRefunds",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
    });
    await pushSpec(app, { content: specV2, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions?offset=1");
    const page = await res.json() as any;

    expect(page.data.length).toBe(1);
    expect(page.data[0].semver).toBe("1.0.0");
    expect(page.pagination.offset).toBe(1);
    expect(page.pagination.hasMore).toBe(false);
  });

  it("clips limit to maximum of 25", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions?limit=100");
    const page = await res.json() as any;

    expect(page.pagination.limit).toBe(25);
  });
});
