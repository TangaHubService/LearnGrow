import { describe, it, expect } from "vitest";
import { AppError } from "../http/errors.js";

describe("AppError", () => {
  it("creates error with correct status code and message", () => {
    const error = new AppError(404, "Not found", "NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Not found");
    expect(error.code).toBe("NOT_FOUND");
    expect(error).toBeInstanceOf(Error);
  });

  it("defaults code to APP_ERROR", () => {
    const error = new AppError(500, "Server error");
    expect(error.code).toBe("APP_ERROR");
  });
});
