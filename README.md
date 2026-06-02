# Hooi Cafe Test Suite (Vitest)

## Quick Start

```bash
# Terminal 1 - Start the Next.js dev server
cd ../uncle-hooi-aman-damai
bun run dev          # -> localhost:3000
# or `npm run dev` if you prefer npm

# Terminal 2 - Run tests (runs files sequentially by prefix)
cd ../cse442-project
bun install
bun test
# or `npm test` if you prefer npm
```

## Test Files (Execute in This Order)

Files are prefixed 01-10 so they run in sequence. Within each
file, tests execute top-to-bottom.

### Unit Tests (F01--F16)

| File | Features | Test Cases |
|------|----------|------------|
| `01-authentication.test.js` | F01, F02 | UTD-0001--0005 |
| `02-restaurant-management.test.js` | F03, F04, F05 | UTD-0006--0012, ITD-005 |
| `03-menu-browsing.test.js` | F06 | UTD-0013, UTD-0014 |
| `04-cart-checkout.test.js` | F07, F09 | UTD-0015, UTD-0016, UTD-0019, UTD-0020 |
| `05-order-history.test.js` | F08, F10 | UTD-0017, UTD-0018, UTD-0021, UTD-0022 |
| `06-ai-verification.test.js` | F09, F10, F11, F14 | UTD-0021--0024, UTD-0029 |
| `07-order-summary.test.js` | F12 | UTD-0025, UTD-0026 |
| `08-analytics.test.js` | F13, F14 | UTD-0027, UTD-0028, UTD-0029 |

### Integration Tests (F17--F19)

| File | Features | Test Cases |
|------|----------|------------|
| `09-integration.test.js` | F17, F18, F19 | ITD-001, ITD-002, ITD-003, ITD-004 |

### System / E2E Tests (F20--F21)

| File | Features | Test Cases |
|------|----------|------------|
| `10-e2e.test.js` | F20, F21 | STD-001, STD-002 |

## Coverage Summary

| Level | Count | IDs |
|-------|-------|-----|
| Unit (F01-F16) | 31 | UTD-0001 through UTD-0031 |
| Integration (F17-F19) | 4 | ITD-001 through ITD-004 |
| System (F20-F21) | 2 | STD-001, STD-002 |
| **Total** | **37 test cases** | across 10 files, 77 individual `it()` blocks |
