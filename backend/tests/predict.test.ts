import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { computePrediction } from "../src/engine/heuristicEngine.js";

const app = createApp();
const DEMO_PASSWORD = "demo1234";

describe("Heuristic Engine", () => {
  it("returns a low risk for healthy parameters", () => {
    const result = computePrediction("heart-disease", {
      age: 30,
      systolic: 115,
      diastolic: 75,
      glucose: 90,
      bmi: 22,
    });
    expect(result.riskLevel).toBe("Low");
    expect(result.riskPercentage).toBeLessThan(40);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.disclaimer).toContain("decision-support");
  });

  it("returns a high risk for extreme unhealthy parameters", () => {
    const result = computePrediction("heart-disease", {
      age: 75,
      systolic: 190,
      diastolic: 120,
      glucose: 300,
      bmi: 40,
      cholesterol: 320,
      heartRate: 120,
    });
    expect(result.riskLevel).toBe("High");
    expect(result.riskPercentage).toBeGreaterThanOrEqual(70);
  });

  it("returns a deterministic result (same input -> same output)", () => {
    const a = computePrediction("diabetes", { glucose: 150, bmi: 30, age: 55, systolic: 135, diastolic: 90 });
    const b = computePrediction("diabetes", { glucose: 150, bmi: 30, age: 55, systolic: 135, diastolic: 90 });
    expect(a).toEqual(b);
  });

  it("throws for unsupported disease type", () => {
    expect(() => computePrediction("unknown" as never, {})).toThrow();
  });
});

describe("API - Health", () => {
  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("API - Prediction", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/predict").send({
      diseaseType: "heart-disease",
      parameters: { age: 40, systolic: 120, diastolic: 80, glucose: 95, bmi: 24 },
    });
    expect(res.status).toBe(401);
  });

  it("accepts authenticated patient role", async () => {
const login = await request(app).post("/api/auth/login").send({ email: "patient@demo.com", password: DEMO_PASSWORD });
    const token = login.body.token;

    const res = await request(app)
      .post("/api/predict/heart")
      .set("Authorization", `Bearer ${token}`)
      .send({ age: 45, bmi: 26, bloodPressureSystolic: 130, bloodPressureDiastolic: 85, bloodGlucose: 110 });

    expect(res.status).toBe(200);
    expect(res.body.riskPercentage).toBeDefined();
    expect(res.body.riskLevel).toBeDefined();
    expect(res.body.confidence).toBeDefined();
  });

it("rejects invalid parameters", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: "patient@demo.com", password: DEMO_PASSWORD });
    const token = login.body.token;

    const res = await request(app)
      .post("/api/predict/heart")
      .set("Authorization", `Bearer ${token}`)
      .send({ age: 999, bmi: 26, bloodPressureSystolic: 130, bloodPressureDiastolic: 85, bloodGlucose: 110 });

    expect(res.status).toBe(400);
  });
});

describe("API - RBAC", () => {
it("denies patient access to admin-only route", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: "patient@demo.com", password: DEMO_PASSWORD });
    const res = await request(app)
      .get("/api/admin/only")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(403);
  });

  it("allows admin access to admin-only route", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: "admin@demo.com", password: DEMO_PASSWORD });
    const res = await request(app)
      .get("/api/admin/only")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
  });
});

describe("API - Swagger", () => {
  it("serves openapi spec JSON", async () => {
    const res = await request(app).get("/api-docs.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.0");
    expect(res.body.info.title).toContain("TeleMedicine");
  });
});
