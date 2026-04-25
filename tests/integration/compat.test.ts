import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { createTestApp, makeSpec, pushSpec } from "./helpers";
import type { createApp } from "../../src/server";

const PAST_DATE = "2024-01-01";
const FUTURE_DATE = "2027-12-31";

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

function specWithLegacyDeprecated(sunsetDate: string) {
  return makeSpec({
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
          deprecated: true,
          "x-sunset": sunsetDate,
          responses: { "200": { description: "ok" } },
        },
      },
    },
  });
}

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

describe("Scenario 2: Safe change — new endpoint added", () => {
  it("bumps to minor version and returns safe change in compat report", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specWithNewEndpoint, name: "payments-api" });

    expect(res.status).toBe(201);
    expect(body.isNewSpec).toBe(false);
    expect(body.version.semver).toBe("1.1.0");
    expect(body.compatReport.classification).toBe("minor");
    expect(body.compatReport.breakingChanges).toHaveLength(0);
    expect(body.compatReport.safeChanges.length).toBeGreaterThan(0);
  });

  it("compat report is retrievable via GET /v1/specs/{name}/compat/{semver}", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    await pushSpec(app, { content: specWithNewEndpoint, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/compat/1.1.0");
    const body = await res.json() as any;
    expect(res.status).toBe(200);
    expect(body.compatReport.classification).toBe("minor");
  });

  it("versions are listed newest first", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    await pushSpec(app, { content: specWithNewEndpoint, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions");
    const versions = await res.json() as any[];
    expect(versions[0].semver).toBe("1.1.0");
    expect(versions[1].semver).toBe("1.0.0");
  });
});

describe("Scenario 3: Deprecate an endpoint with a future sunset date", () => {
  it("deprecation is a minor change — nothing removed yet", async () => {
    await pushSpec(app, { content: specWithLegacyEndpoint, name: "payments-api" });
    const { res, body } = await pushSpec(app, {
      content: specWithLegacyDeprecated(FUTURE_DATE),
      name: "payments-api",
    });

    expect(res.status).toBe(201);
    expect(body.version.semver).toBe("1.1.0");
    expect(body.compatReport.classification).toBe("minor");
    expect(body.compatReport.breakingChanges).toHaveLength(0);
  });

  it("deprecated content is retrievable via spec serving endpoint", async () => {
    await pushSpec(app, { content: specWithLegacyEndpoint, name: "payments-api" });
    await pushSpec(app, { content: specWithLegacyDeprecated(FUTURE_DATE), name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions/1.1.0/spec.json");
    const content = await res.json() as any;
    expect(res.status).toBe(200);
    expect(content.paths["/payments/legacy"].post.deprecated).toBe(true);
    expect(content.paths["/payments/legacy"].post["x-sunset"]).toBe(FUTURE_DATE);
  });
});

describe("Scenario 4: Remove deprecated endpoint before sunset (blocked)", () => {
  it("returns 409 when endpoint removed before sunset date", async () => {
    await pushSpec(app, { content: specWithLegacyEndpoint, name: "payments-api" });
    await pushSpec(app, { content: specWithLegacyDeprecated(FUTURE_DATE), name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specWithoutLegacy, name: "payments-api" });

    expect(res.status).toBe(409);
    expect(body.compatReport.breakingChanges.length).toBeGreaterThan(0);
    expect(body.compatReport.breakingChanges[0].rule).toBe("endpoint-removed-before-sunset");
  });

  it("latest version unchanged after blocked push", async () => {
    await pushSpec(app, { content: specWithLegacyEndpoint, name: "payments-api" });
    await pushSpec(app, { content: specWithLegacyDeprecated(FUTURE_DATE), name: "payments-api" });
    await pushSpec(app, { content: specWithoutLegacy, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api");
    const body = await res.json() as any;
    expect(body.latestVersion.semver).toBe("1.1.0");
  });
});

describe("Scenario 5: Remove deprecated endpoint after sunset (allowed)", () => {
  it("allows removal when sunset date has passed and bumps to major", async () => {
    await pushSpec(app, { content: specWithLegacyEndpoint, name: "payments-api" });
    await pushSpec(app, { content: specWithLegacyDeprecated(PAST_DATE), name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specWithoutLegacy, name: "payments-api" });

    expect(res.status).toBe(201);
    expect(body.version.semver).toBe("2.0.0");
    expect(body.compatReport.classification).toBe("major");
  });

  it("version list shows all versions newest first", async () => {
    await pushSpec(app, { content: specWithLegacyEndpoint, name: "payments-api" });
    await pushSpec(app, { content: specWithLegacyDeprecated(PAST_DATE), name: "payments-api" });
    await pushSpec(app, { content: specWithoutLegacy, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions");
    const versions = await res.json() as any[];
    expect(versions.map((v: any) => v.semver)).toEqual(["2.0.0", "1.1.0", "1.0.0"]);
  });
});

describe("Scenario 6: Remove endpoint never marked deprecated (blocked)", () => {
  it("returns 409 with endpoint-removed-without-deprecation rule", async () => {
    await pushSpec(app, { content: specWithLegacyEndpoint, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specWithoutLegacy, name: "payments-api" });

    expect(res.status).toBe(409);
    expect(body.compatReport.breakingChanges[0].rule).toBe("endpoint-removed-without-deprecation");
  });
});
