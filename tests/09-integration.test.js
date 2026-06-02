/**
 * Integration Tests — White-Box (F17, F18, F19)
 * Test cases: ITD-001, ITD-002, ITD-003, ITD-004
 *
 * All tests call real /api/v1/* endpoints on localhost:3000.
 * Each describe block corresponds to one feature's white-box paths.
 */
import { describe, it, expect } from "vitest";
import { api } from "./helpers.js";

// ================================================================
// F17: Integration of Account Management for All Modules
// Function: handleLogin() — POST /api/v1/auth/login
// Decisions: D1=isAdminEmail?, D2=isMerchantEmail?
// Paths: 3 feasible (admin, merchant, customer)
// Test Case: ITD-001
// ================================================================
describe("F17 handleLogin() — Admin (abf), Merchant (acdg), Customer (aceh)", () => {
  it("(admin): admin email → role='admin'", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/login", {
      provider: "google",
      email: "haocloowork@gmail.com",
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user.role).toBe("admin");
    expect(body.user.id).toBe("usr_admin_1");
  });

  it("(merchant): non-student Gmail → role='merchant'", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/login", {
      provider: "google",
      email: "unclehooi@gmail.com",
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user.role).toBe("merchant");
    expect(body.user.id).toBe("usr_merchant_1");
  });

  it("(customer): student email → role='customer'", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/login", {
      provider: "google",
      email: "ali@student.usm.my",
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user.role).toBe("customer");
    expect(body.user.id).toBe("usr_customer_1");
  });

  it("(customer, default): no email → role='customer'", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/auth/login", {
      provider: "google",
    });
    expect(status).toBe(200);
    expect(body.user.role).toBe("customer");
  });
});

// ================================================================
// F18: Integration of Menu Validation During Checkout
// Function: handleCheckout() — POST /api/v1/orders
// Decisions: D1=isCartEmpty?, D2=isMenuOutdated?
// Paths: 3 feasible (empty cart, menu outdated, valid checkout)
// Test Case: ITD-002
// ================================================================
describe("F18 handleCheckout() — Empty cart (ab), Outdated (acd), Valid (ace)", () => {
  it("(empty cart): pattern empty → 400", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/orders", {
      deliveryDate: "2026-05-19",
      locationId: "09dbb1dd_b5d0_4ead_8201_288acc6807f5",
      pattern: {},
      payment: { total: 7.0, image: "/receipts/mock.webp", remark: "", userRemark: null },
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Cart is empty");
  });

  it("(menu outdated): cartCreatedAt < menuUpdatedAt → 409", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/orders", {
      deliveryDate: "2026-05-19",
      locationId: "09dbb1dd_b5d0_4ead_8201_288acc6807f5",
      pattern: {
        "b842bb9e_cc7c_4b72_aca8_fa364f3b9a0a|variant:1|add_on:97ddbc6e_3828_4922_a557_4ee9452f5ff2|remark:": 1,
      },
      payment: { total: 7.0, image: "/receipts/mock.webp", remark: "", userRemark: null },
      cartCreatedAt: "2026-05-19T09:00:00+08:00",
    });
    expect(status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.code).toBe("MENU_OUTDATED");
    expect(body.error).toContain("Menu Is Outdated");
  });

  it("(valid checkout): cart populated + menu fresh → 201", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/orders", {
      deliveryDate: "2026-05-19",
      locationId: "09dbb1dd_b5d0_4ead_8201_288acc6807f5",
      pattern: {
        "b842bb9e_cc7c_4b72_aca8_fa364f3b9a0a|variant:1|add_on:97ddbc6e_3828_4922_a557_4ee9452f5ff2|remark:": 1,
      },
      payment: { total: 7.0, image: "/receipts/mock-receipt.webp", remark: "", userRemark: "Extra spicy please" },
      cartCreatedAt: "2026-05-19T12:00:00+08:00",
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.orderId).toBe(5425);
  });
});

// ================================================================
// F10: Track Payment Verification Status
// Function: handleLambdaCallback() — POST /api/v1/lambda-callback
// Decisions: D1=isJwtValid?, D2=isOrderIdPresent?
// Paths: 3 feasible (success, no JWT, no orderId)
// Test Case: ITD-003
// ================================================================
describe("F10 handleLambdaCallback() — Success (abdeg), No JWT (ach), No ID (abdfi)", () => {
  it("accepts valid JWT + orderId and returns SUCCESS (abdeg)", async () => {
    console.log("");
    const { status, body } = await api(
      "POST",
      "/api/v1/lambda-callback",
      { orderId: 5425, remark: "SUCCESS", duplicateOrderIds: null },
      { headers: { Authorization: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.mock" } },
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.remark).toBe("SUCCESS");
  });

  it("accepts FAIL,DUPLICATE with cross-reference (abdeg)", async () => {
    console.log("");
    const { status, body } = await api(
      "POST",
      "/api/v1/lambda-callback",
      { orderId: 5422, remark: "FAIL,DUPLICATE", duplicateOrderIds: [5400] },
      { headers: { Authorization: "Bearer eyJhbGciOiJSUzI1NiJ9.mock" } },
    );
    expect(status).toBe(200);
    expect(body.duplicateOrderIds).toEqual([5400]);
  });

  it("rejects missing JWT with 401 (ach)", async () => {
    console.log("");
    const { status } = await api("POST", "/api/v1/lambda-callback", {
      orderId: 9999,
      remark: "TEST",
    });
    expect(status).toBe(401);
  });

  it("rejects missing orderId with 400 (abdfi)", async () => {
    console.log("");
    const { status, body } = await api(
      "POST",
      "/api/v1/lambda-callback",
      { remark: "MISSING_ORDER_ID" },
      { headers: { Authorization: "Bearer eyJ.mock" } },
    );
    expect(status).toBe(400);
    expect(body.error).toContain("orderId");
  });
});

// ================================================================
// F19a: Integration of Order Placement with History and Summary
// Function: handleLambdaCallback() — POST /api/v1/lambda-callback
// Decisions: D1=isJwtValid?, D2=isOrderIdPresent?
// Paths: 3 feasible (no JWT, no orderId, valid callback)
// Test Case: ITD-003
// ================================================================
describe("F19a handleLambdaCallback() — No JWT (ab), No orderId (acde), Valid (acdf)", () => {
  it("rejects missing JWT with 401 (ab)", async () => {
    console.log("");
    const { status } = await api("POST", "/api/v1/lambda-callback", {
      orderId: 9999,
      remark: "TEST",
    });
    expect(status).toBe(401);
  });

  it("rejects missing orderId with 400 (acde)", async () => {
    console.log("");
    const { status, body } = await api(
      "POST",
      "/api/v1/lambda-callback",
      { remark: "MISSING_ORDER_ID" },
      { headers: { Authorization: "Bearer eyJ.mock" } },
    );
    expect(status).toBe(400);
    expect(body.error).toContain("orderId");
  });

  it("accepts valid callback and returns SUCCESS (acdf)", async () => {
    console.log("");
    const { status, body } = await api(
      "POST",
      "/api/v1/lambda-callback",
      { orderId: 5425, remark: "SUCCESS", duplicateOrderIds: null },
      { headers: { Authorization: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.mock" } },
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.remark).toBe("SUCCESS");
  });
});

// ================================================================
// F19b: Integration of Order Placement with Summary Aggregation
// Function: getOrderSummary() — GET /api/v1/orders/summary
// Decision: D1=hasDateFilter?
// Paths: 2 (filtered by date, all dates)
// Test Case: ITD-004
// ================================================================
describe("F19b getOrderSummary() — Filtered (ab), All (ac)", () => {
  it("(date filter): summary filtered by specific date → returns only that date", async () => {
    console.log("");
    const { status, body } = await api("GET", "/api/v1/orders/summary?date=2025-10-30");
    expect(status).toBe(200);
    expect(body.deliverySummary).toBeInstanceOf(Array);
    body.deliverySummary.forEach((s) => expect(s.deliveryDate).toBe("2025-10-30"));
  });

  it("(all dates): no date filter → returns all delivery summaries", async () => {
    console.log("");
    const { status, body } = await api("GET", "/api/v1/orders/summary");
    expect(status).toBe(200);
    expect(body.deliverySummary.length).toBeGreaterThanOrEqual(2);
    // Verify 3-level hierarchy: location → menu → pattern
    body.deliverySummary.forEach((loc) => {
      expect(loc).toHaveProperty("locationName");
      expect(loc).toHaveProperty("menus");
      loc.menus.forEach((menu) => {
        expect(menu).toHaveProperty("menuName");
        expect(menu).toHaveProperty("patterns");
      });
    });
  });
});
