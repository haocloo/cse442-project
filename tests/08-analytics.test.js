/**
 * Business Analytics Dashboard Tests (F13, F14)
 * Test cases: UTD-0023, UTD-0027, UTD-0028, UTD-0029
 */
import { describe, it, expect } from "vitest";
import { api } from "./helpers.js";

// ========== UTD-0027 ==========
describe("F13 getAnalyticsData() — Single path", () => {
  it("returns analytics orders", async () => {
    console.log("");
    const { status, body } = await api("GET", "/api/v1/analytics");
    expect(status).toBe(200);
    expect(body.analyticsOrders).toBeInstanceOf(Array);
    expect(body.analyticsOrders.length).toBeGreaterThanOrEqual(4);
  });

  it("filters by date range", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/analytics?from=2025-10-29&to=2025-10-30");
    body.analyticsOrders.forEach((o) => {
      expect(o.deliveryDate).toSatisfy((d) => d >= "2025-10-29" && d <= "2025-10-30");
    });
  });
});

// ========== UTD-0027 ==========
describe("F13 getAnalyticsData() — KPIs", () => {
  it("calculates Total Accountable Revenue", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/analytics");
    const revenue = body.analyticsOrders.reduce((sum, o) => {
      if (o.adjustedTotal != null) return sum + o.adjustedTotal;
      if (o.isReviewed && o.paymentStatus === "SUCCESS") return sum + o.total;
      return sum;
    }, 0);
    expect(revenue).toBeGreaterThanOrEqual(0);
  });

  it("calculates Total Orders count", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/analytics");
    expect(body.analyticsOrders.length).toBeGreaterThanOrEqual(4);
  });

  it("identifies Flagged Payments", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/analytics");
    const flagged = body.analyticsOrders.filter((o) => o.paymentStatus !== "SUCCESS" && !o.isReviewed);
    expect(flagged.length).toBeGreaterThanOrEqual(1);
  });

  it("tracks Corrections Made", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/analytics");
    const corrections = body.analyticsOrders.filter((o) => o.adjustedTotal != null).reduce((sum, o) => sum + (o.adjustedTotal - o.total), 0);
    expect(corrections).toBe(-1.0);
  });
});

// ========== UTD-0028 ==========
describe("F13 getAnalyticsData() — Charts", () => {
  it("has orders in both In USM and Outside USM", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/analytics");
    const cats = new Set(body.analyticsOrders.map((o) => o.locationCategory));
    expect(cats.has("In USM")).toBe(true);
    expect(cats.has("Outside USM")).toBe(true);
  });

  it("has all four payment statuses", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/analytics");
    const statuses = new Set(body.analyticsOrders.map((o) => o.paymentStatus));
    expect(statuses.has("SUCCESS")).toBe(true);
    expect(statuses.has("MISMATCH")).toBe(true);
    expect(statuses.has("DUPLICATE")).toBe(true);
    expect(statuses.has("PENDING")).toBe(true);
  });
});

// ========== UTD-0029 ==========
describe("F14 updateOrderAnalytics() — Audit (abdeg), 403 (ach), 404 (abdfi)", () => {
  it("adjusts revenue and marks reviewed (abdeg)", async () => {
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
  });

  it("sets isReviewed after audit (abdeg)", async () => {
    console.log("");
    const { status, body } = await api("PUT", "/api/v1/orders/5422/analytics", {
      status: "REVIEWED",
      remark: "Confirmed duplicate - see Order #5400",
    });
    expect(status).toBe(200);
    expect(body.isReviewed).toBe(true);
  });

  it("rejects customer role with 403 (ach)", async () => {
    console.log("");
    const { status, body } = await api(
      "PUT",
      "/api/v1/orders/5424/analytics",
      { status: "REVIEWED", remark: "test" },
      { headers: { "x-role": "customer" } }
    );
    expect(status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Access denied");
  });

  it("returns 404 for non-existent order (abdfi)", async () => {
    console.log("");
    const { status, body } = await api("PUT", "/api/v1/orders/99999/analytics", {
      status: "REVIEWED",
      remark: "test",
    });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toContain("not found");
  });
});

// ========== UTD-0023, UTD-0029 ==========
describe("UTD-0023/UTD-0029: Flagged receipts", () => {
  it("returns unreviewed orders for audit", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/analytics");
    const flagged = body.analyticsOrders.filter((o) => !o.isReviewed);
    expect(flagged.length).toBeGreaterThanOrEqual(2);
  });

  it("includes receipt image URLs", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/analytics");
    body.analyticsOrders.forEach((o) => expect(typeof o.receiptImage).toBe("string"));
  });
});
