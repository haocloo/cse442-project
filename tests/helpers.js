// Shared helpers for the Hooi Cafe Vitest test suite.
// All tests call the /api/v1/* endpoints on the Next.js dev server.

const BASE = 'http://localhost:3000';

// Fetch wrapper. Adds Origin and Host headers to satisfy CSRF middleware.
async function api(method, path, body = null, opts = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:3000',
    'Host': 'localhost:3000',
    ...opts.headers,
  };
  const res = await fetch(BASE + path, {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, body: data, headers: res.headers };
}

// Stub the session endpoint to return a specific role.
// This is the ONLY case where we mock an /api/v1/ endpoint.
async function loginAs(role) {
  const users = {
    customer: { id: 'usr_customer_1', name: 'Ali Bin Abu', email: 'ali@student.usm.my', phone: '0123456789', role: 'customer' },
    merchant:  { id: 'usr_merchant_1', name: 'Uncle Hooi', email: 'unclehooi@gmail.com', phone: '0129876543', role: 'merchant' },
    admin:     { id: 'usr_admin_1', name: 'Admin User', email: 'haocloowork@gmail.com', phone: '0101112222', role: 'admin' },
  };
  return users[role] || users.customer;
}

export { api, loginAs };
