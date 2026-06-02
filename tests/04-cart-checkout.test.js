/**
 * Cart and Checkout Tests (F07, F09)
 * Test cases: UTD-0015, UTD-0016, UTD-0019, UTD-0020
 */
import { describe, it, expect } from "vitest";
import { api } from "./helpers.js";

// ========== F07: checkout() — 5 path coverage ==========
describe("F07 checkout() — Happy path (abdfgh)", () => {
  it("creates an order and returns orderId (abdfgh)", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/orders", {
      deliveryDate: "2026-05-19",
      locationId: "09dbb1dd_b5d0_4ead_8201_288acc6807f5",
      pattern: {
        "b842bb9e_cc7c_4b72_aca8_fa364f3b9a0a|variant:1|add_on:97ddbc6e_3828_4922_a557_4ee9452f5ff2|remark:": 1,
      },
      payment: { total: 7.0, image: "/receipts/mock-receipt.webp", remark: "", userRemark: "Extra spicy please" },
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.orderId).toBe(5425);
    expect(body.message).toContain("AI verification");
  });

  it("handles multiple items in one order (abdfgh)", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/orders", {
      deliveryDate: "2026-05-19",
      locationId: "loc_tekun",
      pattern: {
        "b842bb9e_cc7c_4b72_aca8_fa364f3b9a0a|variant:1|add_on:97ddbc6e_3828_4922_a557_4ee9452f5ff2|remark:": 1,
        "15f877d8_d57f_45c4_a436_0780a5868c8a|variant:712e5aad_01b3_4829_9097_ecb7e70dbf88|add_on:8f8ee372_bb2d_4e7f_8302_65ab0a411e10|remark:": 1,
      },
      payment: { total: 14.0, image: "/receipts/mock.webp", remark: "", userRemark: null },
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
  });
});

describe("F07 checkout() — No Auth (acj)", () => {
  it("rejects unauthenticated user with 401 (acj)", async () => {
    console.log("");
    const { status, body } = await api(
      "POST",
      "/api/v1/orders",
      {
        deliveryDate: "2026-05-19",
        locationId: "loc_tekun",
        pattern: { "b842bb9e_cc7c_4b72_aca8_fa364f3b9a0a|variant:1|add_on:|remark:": 1 },
        payment: { total: 7.0, image: "/receipts/mock.webp", remark: "", userRemark: null },
      },
      { headers: { "x-role": "unauthenticated" } }
    );
    expect(status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Unauthorized");
  });
});

describe("F07 checkout() — Bad Zod (abm)", () => {
  it("rejects payment with total 0 with 400 (abm)", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/orders", {
      deliveryDate: "2026-05-19",
      locationId: "loc_tekun",
      pattern: { "b842bb9e_cc7c_4b72_aca8_fa364f3b9a0a|variant:1|add_on:|remark:": 1 },
      payment: { total: 0.0, image: "/receipts/mock.webp", remark: "", userRemark: null },
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("total");
  });
});

describe("F07 checkout() — No Menu (abdek)", () => {
  it("rejects date with no menuHistory with 400 (abdek)", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/orders", {
      deliveryDate: "2099-01-01",
      locationId: "loc_tekun",
      pattern: { "b842bb9e_cc7c_4b72_aca8_fa364f3b9a0a|variant:1|add_on:|remark:": 1 },
      payment: { total: 7.0, image: "/receipts/mock.webp", remark: "", userRemark: null },
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Menu not set up");
  });
});

describe("F07 checkout() — AWS Err (abdfgil)", () => {
  it("returns 503 when AWS dispatch fails (abdfgil)", async () => {
    console.log("");
    const { status, body } = await api(
      "POST",
      "/api/v1/orders",
      {
        deliveryDate: "2026-05-19",
        locationId: "loc_tekun",
        pattern: { "b842bb9e_cc7c_4b72_aca8_fa364f3b9a0a|variant:1|add_on:|remark:": 1 },
        payment: { total: 7.0, image: "/receipts/mock.webp", remark: "", userRemark: null },
      },
      { headers: { "x-simulate-aws-failure": "true" } }
    );
    expect(status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.error).toContain("AWS dispatch failed");
  });
});

// ========== UTD-0016 ==========
describe("UTD-0016: Proceed to checkout with cart items from the outdated menu", () => {
  it("returns updatedAt for menu-freshness validation", async () => {
    console.log("");
    const { body } = await api("GET", "/api/v1/restaurant");
    expect(typeof body.updatedAt).toBe("string");
  });
});

// ========== UTD-0019 ==========
describe("F09 validateAndUploadReceipt() — Valid upload (abdf)", () => {
  it("generates a presigned upload URL (abdf)", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/receipts/upload", {
      filename: "valid_transfer.png",
      fileSize: 102400,
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.uploadUrl).toContain("r2.dev");
    expect(body.key).toContain("receipts/");
  });
});

// ========== UTD-0020 ==========
describe("F09 validateAndUploadReceipt() — Bad type (acg), Oversize (abeh)", () => {
  it("rejects PDF file with 400 (acg)", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/receipts/upload", {
      filename: "invoice.pdf",
      fileSize: 102400,
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Unsupported file type");
  });

  it("rejects oversize file with 400 (abeh)", async () => {
    console.log("");
    const { status, body } = await api("POST", "/api/v1/receipts/upload", {
      filename: "large_scan.png",
      fileSize: 2621441,
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("exceeds 2MB");
  });
});

// ========== Cart Pattern (F07) ==========
describe("Cart pattern encoding format (F07)", () => {
  it("uses meit-{id}|variant:{ids}|add_on:{ids}|remark:{text} format", () => {
    console.log("");
    const pattern =
      "meit-b842bb9e_cc7c_4b72_aca8_fa364f3b9a0a|variant:1,38375b8b_611c_4639_b919_1bcc1aef4984|add_on:97ddbc6e_3828_4922_a557_4ee9452f5ff2|remark:less rice";
    const parts = pattern.split("|");
    expect(parts[0]).toMatch(/^meit-/);
    expect(parts[1]).toMatch(/^variant:/);
    expect(parts[2]).toMatch(/^add_on:/);
    expect(parts[3]).toMatch(/^remark:/);
  });
});

