/**
 * Order Summary Tests (F12)
 * Test cases: UTD-0025, UTD-0026
 */
import { describe, it, expect } from "vitest";
import { api } from "./helpers.js";

// ========== UTD-0025 ==========
describe("F12 serverGetOrderGroups() — Single path", () => {
  it("returns delivery summary", async () => {
    console.log("");
    const { status, body } = await api("GET", "/api/v1/orders/summary");
    expect(status).toBe(200);
    expect(body.deliverySummary).toBeInstanceOf(Array);
    expect(body.deliverySummary.length).toBeGreaterThanOrEqual(2);
  });

  it("filters by date", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders/summary?date=2025-10-30");
    body.deliverySummary.forEach((s) => expect(s.deliveryDate).toBe("2025-10-30"));
  });

  it("returns empty for date with no orders", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders/summary?date=2099-01-01");
    expect(body.deliverySummary).toHaveLength(0);
  });
});

// ========== UTD-0025 ==========
describe("F12 serverGetOrderGroups() — Hierarchy", () => {
  it("groups by location -> menu -> pattern", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders/summary");
    body.deliverySummary.forEach((loc) => {
      expect(loc).toHaveProperty("locationName");
      expect(loc).toHaveProperty("menus");
      loc.menus.forEach((menu) => {
        expect(menu).toHaveProperty("menuName");
        expect(menu).toHaveProperty("patterns");
        menu.patterns.forEach((pat) => {
          expect(pat).toHaveProperty("variantLabel");
          expect(pat).toHaveProperty("patternQty");
          expect(pat).toHaveProperty("users");
        });
      });
    });
  });

  it("aggregates identical patterns into one entry", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders/summary?date=2025-10-30");
    const restu = body.deliverySummary.find((s) => s.locationName === "Restu Saujana Cafe");
    const lunchDefaultVege = restu.menus.find((m) => m.menuName === "午餐 Lunch").patterns.find((p) => p.variantLabel === "Default + Add vege");
    expect(lunchDefaultVege.patternQty).toBe(2);
    expect(lunchDefaultVege.users).toHaveLength(2);
  });
});

// ========== UTD-0026 ==========
describe("F12 serverGetOrderGroups() — Customer list", () => {
  it("includes user name, phone, and quantity per pattern", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders/summary");
    const users = body.deliverySummary[0].menus[0].patterns[0].users;
    users.forEach((u) => {
      expect(u).toHaveProperty("userName");
      expect(u).toHaveProperty("userPhone");
      expect(u).toHaveProperty("qty");
    });
  });

  it("includes preparation remarks from customers", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders/summary?date=2025-10-30");
    const restu = body.deliverySummary.find((s) => s.locationName === "Restu Saujana Cafe");
    const users = restu.menus[0].patterns[0].users;
    expect(users.some((u) => u.remark && u.remark.length > 0)).toBe(true);
  });

  it("has Malaysian mobile format for WhatsApp quick-links", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/orders/summary");
    const users = body.deliverySummary[0].menus[0].patterns[0].users;
    users.forEach((u) => expect(u.userPhone).toMatch(/^01\d{8,9}$/));
  });
});
