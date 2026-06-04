/**
 * Restaurant Management Tests (F03, F04, F05, F15, F16)
 * Test cases: UTD-0006 through UTD-0012, UTD-0030, UTD-0031, ITD-005
 */
import { describe, it, expect } from "vitest";
import { api } from "./helpers.js";

// ================================================================
// F03: updateRestaurantInfo() — 2 paths: abd, ace
// ================================================================

describe("F03 updateRestaurantInfo() — Authorised (abd)", () => {
  it("updates restaurant info and returns updated fields", async () => {
    console.log("");
    const { status, body } = await api("PUT", "/api/v1/restaurant", {
      name: "Uncle Hooi Cafe",
      notice: "Uncle Hooi Cafe introduced another two newly Home-Made drinks.",
      contactInfo: {
        whatsappGroups: [{ name: "RST & Main Campus Group", link: "https://chat.whatsapp.com/CV395u2JLYtG49Wawyh1pL" }],
      },
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.updatedFields).toContain("name");
  });
});

describe("F03 updateRestaurantInfo() — Unauthorised (ace)", () => {
  it("rejects customer role with 403 (ace)", async () => {
    console.log("");
    const { status, body } = await api("PUT", "/api/v1/restaurant", { name: "Unauthorised Edit" }, { headers: { "x-role": "customer" } });
    expect(status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Access denied");
  });
});

// ========== F04: updateMenuItem() ==========
describe("UTD-0008: F04 updateMenuItem() — Create (abdegh)", () => {
  it("creates a new menu item (abdegh)", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/menu-items", {
      name: "午餐 Lunch",
      price: 5.0,
      category: [{ id: "in-usm", name: "In USM" }],
      desc: "Mushroom + Nestume Chicken + Burger's",
      variant: { 1: { name: "Default", extra: 1, sequence: 0 } },
      add_on: {
        "97ddbc6e_3828_4922_a557_4ee9452f5ff2": { name: "Add vege", extra: 1.0, visible: true, sequence: 0 },
      },
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(typeof body.id).toBe("string");
  });
});

describe("UTD-0009: F04 updateMenuItem() — Update (abdfih)", () => {
  it("updates price and category (abdfih)", async () => {
    console.log("");
    const id = "15f877d8_d57f_45c4_a436_0780a5868c8a";
    const { status, body } = await api("PUT", `/api/v1/menu-items/${id}`, {
      price: 5.5,
      category: [{ id: "outside-usm", name: "Outside USM" }],
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.updatedFields).toContain("price");
    expect(body.updatedFields).toContain("category");
  });
});

// ========== UTD-0010 ==========
describe("UTD-0010: F04 updateMenuItem() — Unauthorised (acj)", () => {
  it("rejects customer role with 403 (acj)", async () => {
    console.log("");
    const id = "15f877d8_d57f_45c4_a436_0780a5868c8a";
    const { status, body } = await api("PUT", `/api/v1/menu-items/${id}`, { price: 9.99 }, { headers: { "x-role": "customer" } });
    expect(status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Access denied");
  });
});

// ========== UTD-0011, UTD-0012 (F05: updateOrderSettings) ==========
describe("UTD-0011/UTD-0012: F05 updateOrderSettings() — Open (abdegh), Close (abdfh), Unauthorised (aci)", () => {
  it("opens orders and sets delivery date (abdegh)", async () => {
    console.log("");
    const { status, body } = await api("PUT", "/api/v1/orders/settings", {
      isOrderOpen: true,
      deliveryDate: "2026-05-19",
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.isOrderOpen).toBe(true);
    expect(body.deliveryDate).toBe("2026-05-19");
    expect(body.message).toContain("has started");
    expect(body.notificationsSent).toBe(15);
  });

  it("closes orders (abdfh)", async () => {
    console.log("");
    const { status, body } = await api("PUT", "/api/v1/orders/settings", {
      isOrderOpen: false,
      deliveryDate: "2026-05-19",
    });
    expect(status).toBe(200);
    expect(body.isOrderOpen).toBe(false);
    expect(body.message).toContain("closed");
    expect(body.notificationsSent).toBe(0);
  });

  it("rejects customer role with 403 (aci)", async () => {
    console.log("");
    const { status, body } = await api(
      "PUT",
      "/api/v1/orders/settings",
      { isOrderOpen: true, deliveryDate: "2026-05-19" },
      { headers: { "x-role": "customer" } },
    );
    expect(status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Access denied");
  });
});

// ========== UTD-0030 ==========
describe("F15 addLocation() — Add (abdeg), 403 (ach), 404 (abdfi)", () => {
  it("adds a new location to a category", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/locations", {
      categoryId: "in-usm",
      lat: 5.357,
      lng: 100.302,
      name: "Restu Saujana Cafe",
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.message).toContain("Location added");
    expect(body.location).toHaveProperty("id");
    expect(body.location.name).toBe("Restu Saujana Cafe");
  });

  it("rejects non-existent category with 404", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/locations", {
      categoryId: "nonexistent",
      lat: 5.0,
      lng: 100.0,
      name: "Nowhere",
    });
    expect(status).toBe(404);
    expect(body.error).toContain("Category not found");
  });

  it("blocks unauthorised roles with 403", async () => {
    console.log("");
    const { status } = await api(
      "POST",
      "/api/v1/locations",
      {
        categoryId: "in-usm",
        lat: 5.357,
        lng: 100.302,
        name: "Test",
      },
      { headers: { "x-role": "customer" } },
    );
    expect(status).toBe(403);
  });
});

// ========== UTD-0031 ==========
describe("F16 searchAddress() — Valid (abd), Too short (ace)", () => {
  it("geocodes a valid Penang address", async () => {
    console.log("");
    const { status, body } = await api("GET", "/api/v1/locations/search?q=Restu+Saujana+Cafe+Penang");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(body[0]).toHaveProperty("label");
      expect(body[0]).toHaveProperty("lat");
      expect(body[0]).toHaveProperty("lng");
    }
  });

  it("returns USM results (abd) for usm query", async () => {
    console.log("");
    const { status, body } = await api("GET", "/api/v1/locations/search?q=usm");
    expect(status).toBe(200);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].label).toMatch(/usm/i);
  });

  it("returns empty array for query shorter (ace) than 3 characters", async () => {
    console.log("");
    const { status, body } = await api("GET", "/api/v1/locations/search?q=Re");
    expect(status).toBe(200);
    expect(body).toEqual([]);
  });

  it("returns empty array for missing query (ace)", async () => {
    console.log("");
    const { status, body } = await api("GET", "/api/v1/locations/search");
    expect(status).toBe(200);
    expect(body).toEqual([]);
  });
});
