import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { createTestApp, makeSpec, pushSpec } from "./helpers";
import type { createApp } from "../../src/server";

const baseSpec = makeSpec();

const specWithLegacyEndpoint = makeSpec({
  paths: {
    "/payments/{id}": {
      get: {
        operationId: "getPayment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "ok", content: { "application/json": { schema: { type: "object", properties: { id: { type: "string" }, amount: { type: "number" } } } } } } },
      },
    },
    "/payments/legacy": {
      post: {
        operationId: "legacyPayment",
        responses: { "200": { description: "ok" } },
      },
    },
  },
});

const specWithoutLegacy = makeSpec({
  paths: {
    "/payments/{id}": {
      get: {
        operationId: "getPayment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "ok", content: { "application/json": { schema: { type: "object", properties: { id: { type: "string" }, amount: { type: "number" } } } } } } },
      },
    },
  },
});

const specWithNewEndpoint = makeSpec({
  paths: {
    "/payments/{id}": {
      get: {
        operationId: "getPayment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "ok", content: { "application/json": { schema: { type: "object", properties: { id: { type: "string" }, amount: { type: "number" } } } } } } },
      },
    },
    "/payments/{id}/refunds": {
      get: {
        operationId: "getPaymentRefunds",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "ok" } },
      },
    },
  },
});

const specWithBreakingChange = makeSpec({
  paths: {
    "/payments/{id}": {
      get: {
        operationId: "getPayment",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "currency", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "ok", content: { "application/json": { schema: { type: "object", properties: { id: { type: "string" }, amount: { type: "number" } } } } } } },
      },
    },
  },
});

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

describe("Scenario 7: Emergency removal with force", () => {
  it("force: true bypasses grace period and records forceReason", async () => {
    await pushSpec(app, { content: specWithLegacyEndpoint, name: "payments-api" });
    const { res, body } = await pushSpec(app, {
      content: specWithoutLegacy,
      name: "payments-api",
      force: true,
      reason: "security fix CVE-2026-1234",
    });

    expect(res.status).toBe(201);
    expect(body.data.version.forceReason).toBe("security fix CVE-2026-1234");
    expect(body.data.version.semver).toBe("2.0.0");
  });
});

describe("Scenario 8: Explicit major version declaration", () => {
  it("accepts breaking changes when declaring a valid major version", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const { res, body } = await pushSpec(app, {
      content: specWithBreakingChange,
      name: "payments-api",
      version: "2.0.0",
    });

    expect(res.status).toBe(201);
    expect(body.data.version.semver).toBe("2.0.0");
    expect(body.data.compatReport.classification).toBe("major");
  });

  it("rejects breaking changes when version declared is not a major bump", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const { res } = await pushSpec(app, {
      content: specWithBreakingChange,
      name: "payments-api",
      version: "1.3.0",
    });

    expect(res.status).toBe(409);
  });
});

describe("Scenario 10: Prerelease workflow", () => {
  it("starts at 0.1.0 with prerelease: true", async () => {
    const { res, body } = await pushSpec(app, {
      content: baseSpec,
      name: "notifications-api",
      prerelease: true,
    });

    expect(res.status).toBe(201);
    expect(body.data.version.semver).toBe("0.1.0");
    expect(body.data.version.isPrerelease).toBe(true);
  });

  it("subsequent prerelease push increments minor", async () => {
    await pushSpec(app, { content: baseSpec, name: "notifications-api", prerelease: true });
    const { body } = await pushSpec(app, {
      content: specWithNewEndpoint,
      name: "notifications-api",
      prerelease: true,
    });

    expect(body.data.version.semver).toBe("0.2.0");
  });

  it("pushing without prerelease graduates to 1.0.0", async () => {
    await pushSpec(app, { content: baseSpec, name: "notifications-api", prerelease: true });
    const { res, body } = await pushSpec(app, {
      content: specWithNewEndpoint,
      name: "notifications-api",
    });

    expect(res.status).toBe(201);
    expect(body.data.version.semver).toBe("1.0.0");
    expect(body.data.version.isPrerelease).toBe(false);
  });

  it("returns 422 when pushing prerelease after a release version", async () => {
    await pushSpec(app, { content: baseSpec, name: "notifications-api", prerelease: true });
    await pushSpec(app, { content: specWithNewEndpoint, name: "notifications-api" });
    const { res } = await pushSpec(app, {
      content: baseSpec,
      name: "notifications-api",
      prerelease: true,
    });

    expect(res.status).toBe(422);
  });
});
