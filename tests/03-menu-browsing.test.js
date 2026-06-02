/**
 * Module 2: Menu Browsing Tests (F06)
 * Test cases: UTD-0013, UTD-0014
 */
import { describe, it, expect } from "vitest";
import { api } from "./helpers.js";

// ========== UTD-0013 ==========
describe("F06 getRestaurantData() — Data found (abd) and No data (ace)", () => {
  it("includes contactInfo with WhatsApp groups (abd)", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/restaurant");
    expect(body.contactInfo.whatsappGroups.length).toBeGreaterThanOrEqual(1);
  });

  it("returns null when restaurant has no data (ace)", async () => {
    console.log("");
    const { status, body } = await api("GET", "/api/v1/restaurant?empty=true");
    expect(status).toBe(200);
    expect(body).toBeNull();
  });

  it("returns restaurant name and categories", async () => {
    console.log("");
    const { status, body } = await api("GET", "/api/v1/restaurant");
    expect(status).toBe(200);
    expect(body.name).toBe("Uncle Hooi Cafe");
    expect(body.categories.length).toBeGreaterThanOrEqual(2);
  });

  it("includes In USM, Outside USM, and Premium categories", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/restaurant");
    const names = body.categories.map((c) => c.name);
    expect(names).toContain("In USM");
    expect(names).toContain("Outside USM");
    expect(names).toContain("Premium");
  });

  it("includes orderSettings with isOrderOpen and deliveryDate", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/restaurant");
    expect(body.orderSettings).toHaveProperty("isOrderOpen");
    expect(body.orderSettings).toHaveProperty("deliveryDate");
  });
});

// ========== UTD-0013, UTD-0014 ==========
describe("F06 getRestaurantData() — Menu items (abd)", () => {
  it("returns all visible menu items (UTD-0013)", async () => {
    console.log("");
    const { status, body } = await api("GET", "/api/v1/menu-items");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    body.forEach((item) => expect(item.visible).toBe(true));
  });

  it("filters by category In USM", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/menu-items?category=cuisine");
    body.forEach((item) => {
      const has = item.category.some((c) => c.id === "cuisine");
      expect(has).toBe(true);
    });
  });

  it("filters by category Outside USM", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/menu-items?category=service");
    body.forEach((item) => {
      const has = item.category.some((c) => c.id === "service");
      expect(has).toBe(true);
    });
  });

  it("has bilingual item names", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/menu-items");
    const names = body.map((i) => i.name);
    expect(names.some((n) => n.includes("午餐"))).toBe(true);
    expect(names.some((n) => n.includes("晚餐"))).toBe(true);
  });

  it("has Lunch with Default + Vegetarian variants (UTD-0014)", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/menu-items");
    const lunch = body.find((i) => i.id === "b842bb9e_cc7c_4b72_aca8_fa364f3b9a0a");
    expect(lunch.variant).toHaveProperty("1");
    expect(lunch.variant).toHaveProperty("38375b8b_611c_4639_b919_1bcc1aef4984");
    expect(lunch.price).toBe(5.0);
  });

  it("has Premium Lunch at RM 7.50", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/menu-items");
    const premium = body.find((i) => i.id === "f432b072_b071_41e6_ae89_dee30de7cbfc");
    expect(premium.price).toBe(7.5);
    expect(premium.category[0].id).toBe("premium");
  });
});

// ========== UTD-0014 ==========
describe("F06 getRestaurantData() — Price calculation (abd)", () => {
  it("Lunch + Default + Add vege = RM 7.00", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/menu-items");
    const lunch = body.find((i) => i.id === "b842bb9e_cc7c_4b72_aca8_fa364f3b9a0a");
    const base = lunch.price;
    const variantExtra = lunch.variant["1"].extra;
    const addOnExtra = lunch.add_on["97ddbc6e_3828_4922_a557_4ee9452f5ff2"].extra;
    expect(base + variantExtra + addOnExtra).toBe(7.0);
  });
});
