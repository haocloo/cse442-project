/**
 * System / E2E Tests — White-Box (F20, F21)
 * Test cases: STD-001, STD-002
 *
 * All tests call real /api/v1/* endpoints on localhost:3000.
 * Each describe block corresponds to one feature's white-box paths.
 */
import { describe, it, expect } from "vitest";
import { api } from "./helpers.js";

// ================================================================
// F20: E2E Order Placement by an Unauthenticated User
// Function: verifyAndRegisterUser() — POST /api/v1/auth/verify-email
//   combined with POST /api/v1/auth/verify-code
// Decisions: D1=isValidUsmEmail?, D2=isCodeSixDigits?
// Paths: 3 feasible (invalid email, invalid code, valid flow)
// Test Case: STD-001
// ================================================================
describe("F20 verifyAndRegisterUser() — Invalid email (ab), Invalid code (acd), Valid (ace)", () => {
  it("(invalid email): non-USM email → 400", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/verify-email", {
      email: "user@gmail.com",
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Only @student.usm.my emails");
  });

  it("(invalid code): USM email but wrong code length → 400", async () => {
    console.log("");
    // Step 1: Valid email verification
    const s1 = await api("POST", "/api/v1/auth/verify-email", {
      email: "newstudent@student.usm.my",
    });
    expect(s1.status).toBe(200);
    expect(s1.body.success).toBe(true);

    // Step 2: Invalid code (only 4 digits)
    const s2 = await api("POST", "/api/v1/auth/verify-code", {
      email: "newstudent@student.usm.my",
      code: "1234",
    });
    expect(s2.status).toBe(400);
    expect(s2.body.success).toBe(false);
    expect(s2.body.error).toContain("Code must be 6 digits");
  });

  it("(valid flow): valid email + valid code → full order placement", async () => {
    console.log("");
    // Step 1: Verify email
    const s1 = await api("POST", "/api/v1/auth/verify-email", {
      email: "newstudent@student.usm.my",
    });
    expect(s1.status).toBe(200);

    // Step 2: Verify code
    const s2 = await api("POST", "/api/v1/auth/verify-code", {
      email: "newstudent@student.usm.my",
      code: "654321",
    });
    expect(s2.status).toBe(200);

    // Step 3: Register
    const s3 = await api("POST", "/api/v1/auth/register", {
      name: "New Student",
      phone: "0129998887",
      email: "newstudent@student.usm.my",
      provider: "google",
    });
    expect(s3.status).toBe(200);

    // Step 4: Login
    const s4 = await api("POST", "/api/v1/auth/login", {
      provider: "google",
      email: "newstudent@student.usm.my",
    });
    expect(s4.body.user.role).toBe("customer");

    // Step 5: Browse menu
    const s5 = await api("GET", "/api/v1/menu-items");
    expect(Array.isArray(s5.body)).toBe(true);

    // Step 6: Place order
    const s6 = await api("POST", "/api/v1/orders", {
      deliveryDate: "2026-05-19",
      locationId: "09dbb1dd_b5d0_4ead_8201_288acc6807f5",
      pattern: {
        "b842bb9e_cc7c_4b72_aca8_fa364f3b9a0a|variant:1|add_on:|remark:": 1,
      },
      payment: { total: 6.0, image: "/receipts/mock-receipt.webp", remark: "", userRemark: null },
      cartCreatedAt: "2026-05-19T12:00:00+08:00",
    });
    expect(s6.status).toBe(201);

    // Step 7: View order history
    const s7 = await api("GET", "/api/v1/orders");
    expect(s7.body.orderHistory.length).toBeGreaterThanOrEqual(1);
  });
});

// ================================================================
// F21: E2E Auditing of a Fraudulent Payment
// Function: auditFlaggedReceipt() — PUT /api/v1/orders/:id/analytics
// Decisions: D1=isStatusInvalid?, D2=hasAdjustedTotal?
// Paths: 3 feasible (invalid status, reviewed with adjustment, reviewed without adjustment)
// Test Case: STD-002
// ================================================================
describe("F21 auditFlaggedReceipt() — Invalid status (ab), With adjustment (acdf), Without (aceg)", () => {
  it("(invalid status): status is not REVIEWED → 400", async () => {
    console.log("");
    const { status, body } = await api("PUT", "/api/v1/orders/5422/analytics", {
      status: "PENDING",
      remark: "test",
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Invalid status");
  });

  it("(reviewed with adjustment): REVIEWED + adjustedTotal → 200 with adjustment", async () => {
    console.log("");
    const { status, body } = await api("PUT", "/api/v1/orders/5424/analytics", {
      status: "REVIEWED",
      adjustedTotal: 6.0,
      remark: "ok noted",
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.isReviewed).toBe(true);
    expect(body.adjustedTotal).toBe(6.0);
    expect(body.message).toContain("revenue adjustment");
  });

  it("(reviewed without adjustment): REVIEWED only → 200 without adjustment message", async () => {
    console.log("");
    const { status, body } = await api("PUT", "/api/v1/orders/5422/analytics", {
      status: "REVIEWED",
      remark: "Confirmed duplicate - see Order #5400",
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.isReviewed).toBe(true);
    expect(body.adjustedTotal).toBeNull();
    expect(body.message).toContain("no revenue adjustment");
  });

  // Full E2E fraud flow (checkout → callback → audit)
  it("E2E fraud flow: checkout → duplicate callback → audit reviewed", async () => {
    console.log("");
    // Step 1: Place order
    const { body: orderBody } = await api("POST", "/api/v1/orders", {
      deliveryDate: "2026-05-19",
      locationId: "loc_damai",
      pattern: {
        "15f877d8_d57f_45c4_a436_0780a5868c8a|variant:1|add_on:|remark:": 1,
      },
      payment: { total: 6.0, image: "/receipts/reused.webp", remark: "", userRemark: null },
      cartCreatedAt: "2026-05-19T12:00:00+08:00",
    });
    expect(orderBody.success).toBe(true);

    // Step 2: Lambda callback detects duplicate
    const { status, body } = await api(
      "POST",
      "/api/v1/lambda-callback",
      { orderId: orderBody.orderId, remark: "FAIL,DUPLICATE", duplicateOrderIds: [5400] },
      { headers: { Authorization: "Bearer eyJ.mock-jwt-for-testing" } },
    );
    expect(status).toBe(200);
    expect(body.remark).toBe("FAIL,DUPLICATE");

    // Step 3: Merchant audits and marks reviewed
    const audit = await api("PUT", `/api/v1/orders/${orderBody.orderId}/analytics`, {
      status: "REVIEWED",
      remark: "ok noted",
    });
    expect(audit.status).toBe(200);
    expect(audit.body.isReviewed).toBe(true);
  });
});
