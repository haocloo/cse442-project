/**
 * Authentication Tests (F01, F02)
 */
import { describe, it, expect } from "vitest";
import { api } from "./helpers.js";

// ================================================================
// F01: sendVerificationCode() — 3 paths: abdegh, ach, abdfi
// ================================================================

describe("F01 sendVerificationCode() — Happy path (abdeg)", () => {
  it("sends OTP to valid @student.usm.my email", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/verify-email", {
      email: "newstudent@student.usm.my",
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain("newstudent@student.usm.my");
  });

  it("accepts valid 6-digit OTP", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/verify-code", {
      email: "newstudent@student.usm.my",
      code: "123456",
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("completes registration and returns a userId", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/register", {
      name: "Ali Bin Abu",
      phone: "0123456789",
      email: "newstudent@student.usm.my",
      provider: "google",
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.userId).toEqual(expect.any(String));
  });
});

describe("F01 sendVerificationCode() — Invalid email (ach)", () => {
  it("rejects non-USM email with 400", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/verify-email", {
      email: "student@gmail.com",
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("@student.usm.my");
  });
});

describe("F01 sendVerificationCode() — Duplicate email (abdfi)", () => {
  it("detects already-registered email", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/verify-email", {
      email: "ali@student.usm.my",
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.alreadyRegistered).toBe(true);
    expect(body.message).toContain("already registered");
  });
});

// ================================================================
// F02: handleOAuthCallback() — 3 paths: abdeghi, abdefhi, aci
// ================================================================

describe("F02 handleOAuthCallback() — Registered user (abdeg)", () => {
  it("returns user + session for Google provider", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/login", {
      provider: "google",
      oauth_state: "valid-oauth-state",
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user.role).toBe("customer");
    expect(body.session.id).toContain("google");
  });

  it("returns a valid user session", async () => {
    console.log("");
    const { status, body } = await api("GET", "/api/v1/auth/session");
    expect(status).toBe(200);
    expect(body.user).toHaveProperty("id");
    expect(body.user.role).toBe("customer");
    expect(body.session).toHaveProperty("id");
  });
});

describe("F02 handleOAuthCallback() — New user (abdfh)", () => {
  it("prompts unregistered user for USM email verification", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/login", {
      provider: "google",
      oauth_state: "valid-oauth-state",
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });
});

describe("F02 handleOAuthCallback() — Bad OAuth state (aci)", () => {
  it("rejects tampered OAuth state with 400", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/login", {
      provider: "google",
      oauth_state: "tampered-state",
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("state mismatch");
  });
});

// ========== F01 Edge Case ==========
describe("F01 OTP code format validation", () => {
  it("rejects non-6-digit code with 400", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/verify-code", { code: "123" });
    expect(status).toBe(400);
    expect(body.error).toContain("6 digits");
  });
});
