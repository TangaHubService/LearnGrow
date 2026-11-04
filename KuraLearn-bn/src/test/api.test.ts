import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("Health Check", () => {
  it("GET /health returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });
});

describe("Auth Routes", () => {
  it("POST /api/v1/auth/login with missing body returns 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/v1/auth/login with invalid credentials returns 401", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "none@test.com", password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("POST /api/v1/auth/register with invalid data returns 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "invalid", password: "12" });
    expect(res.status).toBe(400);
  });

  it("GET /api/v1/auth/me without token returns 401", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("Protected Routes", () => {
  it("GET /api/v1/teacher/dashboard without auth returns 401", async () => {
    const res = await request(app).get("/api/v1/teacher/dashboard");
    expect(res.status).toBe(401);
  });
});

describe("Error Handling", () => {
  it("GET /nonexistent-route returns 404", async () => {
    const res = await request(app).get("/nonexistent-route");
    expect(res.status).toBe(404);
  });
});
