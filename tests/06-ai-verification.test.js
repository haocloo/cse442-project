/**
 * AI Payment Verification Tests (F09, F10, F11, F14)
 * Test cases: UTD-0019, UTD-0021, UTD-0022, UTD-0023, UTD-0024, UTD-0029
 */
import { describe, it, expect } from "vitest";
import { api } from "./helpers.js";

// ========== UTD-0021 ==========
describe("UTD-0021: View the status of a successfully processed receipt", () => {
  it("has at least one SUCCESS payment", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders");
    const successes = body.orderHistory.filter((o) => o.payment.remark.startsWith("SUCCESS"));
    expect(successes.length).toBeGreaterThanOrEqual(1);
  });
});

// ========== UTD-0022 ==========
describe("UTD-0022: View the status of a flagged receipt", () => {
  it("has at least one MISMATCH payment", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders");
    const mismatches = body.orderHistory.filter((o) => o.payment.remark.includes("MISMATCH"));
    expect(mismatches.length).toBeGreaterThanOrEqual(1);
  });

  it("has at least one DUPLICATE payment", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders");
    const duplicates = body.orderHistory.filter((o) => o.payment.remark.includes("DUPLICATE"));
    expect(duplicates.length).toBeGreaterThanOrEqual(1);
  });
});

// ========== F11: getReceiptGallery() ==========
describe("UTD-0023 (F11): getReceiptGallery() — all receipts (ac)", () => {
  it("returns analytics with all receipt image URLs", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/analytics");
    expect(body.analyticsOrders.length).toBeGreaterThanOrEqual(4);
    body.analyticsOrders.forEach((o) => expect(typeof o.receiptImage).toBe("string"));
  });
});

describe("UTD-0024 (F11): getReceiptGallery() — filtered by status (abd)", () => {
  it("all four payment statuses exist for gallery filtering", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/analytics");
    const statuses = new Set(body.analyticsOrders.map((o) => o.paymentStatus));
    expect(statuses.has("SUCCESS")).toBe(true);
    expect(statuses.has("MISMATCH")).toBe(true);
    expect(statuses.has("DUPLICATE")).toBe(true);
    expect(statuses.has("PENDING")).toBe(true);
  });

  it("filters by MISMATCH status returning only flagged receipts", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/analytics?paymentStatus=MISMATCH");
    expect(body.analyticsOrders.length).toBeGreaterThanOrEqual(1);
    body.analyticsOrders.forEach((o) => {
      expect(o.paymentStatus).toBe("MISMATCH");
      expect(o.isReviewed).toBeDefined();
    });
  });
});

// ========== UTD-0029 ==========
describe("UTD-0029: Manually adjust revenue, remark and verification status for flagged receipt", () => {
  it("adjusts revenue and marks reviewed", async () => {
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

  it("sets isReviewed after audit", async () => {
    console.log("");
    const { status, body } = await api("PUT", "/api/v1/orders/5422/analytics", {
      status: "REVIEWED",
      remark: "Confirmed duplicate - see Order #5400",
    });
    expect(status).toBe(200);
    expect(body.isReviewed).toBe(true);
  });

  it("returns unreviewed orders for audit", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/analytics");
    const flagged = body.analyticsOrders.filter((o) => !o.isReviewed);
    expect(flagged.length).toBeGreaterThanOrEqual(2);
  });
});


// ========== UTD-0019 (PENDING check) ==========
describe("UTD-0019: Receipt uploaded, order marked as PENDING", () => {
  it("has at least one PENDING payment", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders");
    const pending = body.orderHistory.filter((o) => o.payment.remark === "-");
    expect(pending.length).toBeGreaterThanOrEqual(1);
  });
});

