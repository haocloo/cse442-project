/**
 * Order History Tests (F08, F10)
 * Test cases: UTD-0017, UTD-0018, UTD-0021, UTD-0022
 */
import { describe, it, expect } from "vitest";
import { api } from "./helpers.js";

// ========== UTD-0017 ==========
describe("F08 getUserOrderHistory() — Single path using a specific date range", () => {
  it("returns all orders", async () => {
    console.log("");
    const { status, body } = await api("GET", "/api/v1/orders");
    expect(status).toBe(200);
    expect(body.orderHistory).toBeInstanceOf(Array);
    expect(body.orderHistory.length).toBeGreaterThanOrEqual(3);
  });

  it("includes menuHistory for pattern resolution", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders");
    expect(body.menuHistory).toHaveProperty("2025-10-30");
    const menu = body.menuHistory["2025-10-30"];
    expect(menu.menuItems).toBeInstanceOf(Array);
    expect(menu.categories).toBeInstanceOf(Array);
  });

  it("filters by date range", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders?from=2025-10-29&to=2025-10-30");
    body.orderHistory.forEach((o) => {
      expect(o.deliveryDate).toSatisfy((d) => d >= "2025-10-29" && d <= "2025-10-30");
    });
  });

  it("excludes orders outside date window", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders?from=2025-10-31&to=2025-10-31");
    body.orderHistory.forEach((o) => expect(o.deliveryDate).toBe("2025-10-31"));
  });
});

// ========== UTD-0018 ==========
describe("F08 getUserOrderHistory() — Order details of a specific past order", () => {
  it("has order #5423 with PENDING status", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders");
    const order = body.orderHistory.find((o) => o.orderId === 5423);
    expect(order.payment.remark).toBe("-");
    expect(order.payment.isReviewed).toBe(false);
  });

  it("encodes variant and add-on selections in pattern key", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders");
    const order = body.orderHistory.find((o) => o.orderId === 5420);
    const patterns = Object.keys(order.pattern);
    expect(patterns[0]).toMatch(/variant:/);
    expect(patterns[0]).toMatch(/add_on:/);
    expect(patterns[0]).toMatch(/remark:/);
  });
});

// ========== UTD-0021 ==========
describe("UTD-0021: View the status of a successfully processed receipt", () => {
  it("has order #5420 with SUCCESS", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders");
    const order = body.orderHistory.find((o) => o.orderId === 5420);
    expect(order.payment.remark).toBe("SUCCESS");
    expect(order.payment.isReviewed).toBe(true);
    expect(order.total).toBe(14.0);
  });
});

// ========== UTD-0022 ==========
describe("UTD-0022: View the status of a flagged receipt", () => {
  it("has order #5421 with MISMATCH and AI remark", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders");
    const order = body.orderHistory.find((o) => o.orderId === 5421);
    expect(order.payment.remark).toContain("FAIL,MISMATCH");
    expect(order.payment.remark).toContain("Payment time");
    expect(order.payment.isReviewed).toBe(false);
  });

  it("has order #5422 with DUPLICATE and cross-reference", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders");
    const order = body.orderHistory.find((o) => o.orderId === 5422);
    expect(order.payment.remark).toContain("DUPLICATE");
    expect(order.payment.duplicateOrderIds).toEqual([5400]);
  });
});
