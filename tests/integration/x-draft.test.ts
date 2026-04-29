import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { createTestApp, makeSpec, pushSpec } from "./helpers";
import type { createApp } from "../../src/server";

const baseSpec = makeSpec();

const stableEndpoint = {
  get: {
    operationId: "getPayment",
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
    responses: { "200": { description: "ok", content: { "application/json": { schema: { type: "object", properties: { id: { type: "string" }, amount: { type: "number" } } } } } } },
  },
};

const specWithDraftEndpoint = makeSpec({
  paths: {
    "/payments/{id}": stableEndpoint,
    "/payments/refunds": {
      post: {
        operationId: "createRefund",
        "x-draft": true,
        parameters: [],
        responses: { "200": { description: "ok" } },
      },
    },
  },
});

const specWithDraftEndpointModified = makeSpec({
  paths: {
    "/payments/{id}": stableEndpoint,
    "/payments/refunds": {
      post: {
        operationId: "createRefund",
        "x-draft": true,
        parameters: [{ name: "currency", in: "query", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "ok" } },
      },
    },
  },
});

const specWithDraftEndpointRemoved = makeSpec({
  paths: {
    "/payments/{id}": stableEndpoint,
  },
});

const specWithDraftEndpointGraduated = makeSpec({
  paths: {
    "/payments/{id}": stableEndpoint,
    "/payments/refunds": {
      post: {
        operationId: "createRefund",
        parameters: [],
        responses: { "200": { description: "ok" } },
      },
    },
  },
});

const specWithDraftEndpointGraduatedAndModified = makeSpec({
  paths: {
    "/payments/{id}": stableEndpoint,
    "/payments/refunds": {
      post: {
        operationId: "createRefund",
        parameters: [{ name: "currency", in: "query", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "ok" } },
      },
    },
  },
});

const specWithStableEndpointMarkedDraft = makeSpec({
  paths: {
    "/payments/{id}": {
      get: {
        operationId: "getPayment",
        "x-draft": true,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
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

describe("Scenario 13: x-draft workflow", () => {
  it("13A: adding a new draft endpoint is a safe minor change", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specWithDraftEndpoint, name: "payments-api" });

    expect(res.status).toBe(201);
    expect(body.data.version.semver).toBe("1.1.0");
    expect(body.data.compatReport.classification).toBe("minor");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges.some((c: any) => c.rule === "endpoint-added")).toBe(true);
  });

  it("13B: iterating on a draft endpoint with a breaking change is safe", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    await pushSpec(app, { content: specWithDraftEndpoint, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specWithDraftEndpointModified, name: "payments-api" });

    expect(res.status).toBe(201);
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges.some((c: any) => c.rule === "draft-endpoint-changed")).toBe(true);
  });

  it("13C: removing a draft endpoint is safe with no grace period required", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    await pushSpec(app, { content: specWithDraftEndpoint, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specWithDraftEndpointRemoved, name: "payments-api" });

    expect(res.status).toBe(201);
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges.some((c: any) => c.rule === "draft-endpoint-changed")).toBe(true);
  });

  it("13D: graduating a draft endpoint with the same interface produces a patch bump", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    await pushSpec(app, { content: specWithDraftEndpoint, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specWithDraftEndpointGraduated, name: "payments-api" });

    expect(res.status).toBe(201);
    expect(body.data.version.semver).toBe("1.1.1");
    expect(body.data.compatReport.classification).toBe("patch");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
  });

  it("13E: graduating and modifying a draft endpoint in the same push is safe", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    await pushSpec(app, { content: specWithDraftEndpoint, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specWithDraftEndpointGraduatedAndModified, name: "payments-api" });

    expect(res.status).toBe(201);
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges.some((c: any) => c.rule === "draft-endpoint-changed")).toBe(true);
  });

  it("13F: marking a stable endpoint as draft is blocked with 409", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specWithStableEndpointMarkedDraft, name: "payments-api" });

    expect(res.status).toBe(409);
    expect(body.compatReport.breakingChanges[0].rule).toBe("stable-endpoint-marked-draft");
  });

  it("13F-force: force overrides the stable-to-draft block", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const { res, body } = await pushSpec(app, {
      content: specWithStableEndpointMarkedDraft,
      name: "payments-api",
      force: true,
      reason: "deliberate rework of payments endpoint",
    });

    expect(res.status).toBe(201);
    expect(body.data.version.forceReason).toBe("deliberate rework of payments endpoint");
  });
});
