import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  getBearerToken,
  sanitizeSellerRequest,
  usernameToSellerEmail
} from "../src/server/sellers-admin.ts";
import * as sellersApi from "../src/server/sellers-admin.ts";

function createFakeSellerService({ users = [], profiles = [] } = {}) {
  const state = {
    users: users.map((user) => ({ ...user })),
    profiles: profiles.map((profile) => ({ ...profile })),
    created: [],
    updated: []
  };

  return {
    state,
    authAdmin: {
      async listUsers() {
        return { data: { users: state.users }, error: null };
      },
      async updateUserById(id, attributes) {
        state.updated.push({ id, attributes });
        const user = state.users.find((candidate) => candidate.id === id);
        if (!user) return { data: null, error: new Error("User not found") };

        user.email = attributes.email || user.email;
        user.user_metadata = attributes.user_metadata || user.user_metadata;
        if (attributes.password) user.password = attributes.password;

        return { data: { user }, error: null };
      },
      async createUser(attributes) {
        state.created.push(attributes);
        const user = {
          id: attributes.id || `user-${state.users.length + 1}`,
          email: attributes.email,
          user_metadata: attributes.user_metadata
        };
        state.users.push(user);
        return { data: { user }, error: null };
      }
    },
    prisma: {
      sellerProfile: {
        async findUnique({ where }) {
          return state.profiles.find((profile) => profile.id === where.id) || null;
        },
        async findFirst({ where }) {
          return state.profiles.find((profile) =>
            Object.entries(where).every(([field, value]) => profile[field] === value)
          ) || null;
        },
        async update({ where, data }) {
          const profile = state.profiles.find((candidate) => candidate.id === where.id);
          if (!profile) throw new Error("Profile not found");
          Object.assign(profile, data);
          return profile;
        },
        async upsert({ where, update, create }) {
          const existingIndex = state.profiles.findIndex((profile) => profile.id === where.id);
          if (existingIndex >= 0) {
            state.profiles[existingIndex] = { ...state.profiles[existingIndex], ...update };
            return state.profiles[existingIndex];
          }

          state.profiles.unshift({ ...create });
          return state.profiles[0];
        }
      }
    }
  };
}

describe("admin sellers API helpers", () => {
  it("maps seller usernames to the private seller email domain", () => {
    assert.equal(
      usernameToSellerEmail("  Lucas  "),
      "lucas@vendedor.denise-catalan.local"
    );
    assert.equal(usernameToSellerEmail("lucas@example.com"), "lucas@example.com");
  });

  it("extracts bearer tokens from Authorization headers", () => {
    const request = new Request("https://example.com/api/admin/sellers", {
      headers: {
        Authorization: "Bearer admin-token"
      }
    });

    assert.equal(getBearerToken(request), "admin-token");
  });

  it("sanitizes seller creation requests", () => {
    const request = sanitizeSellerRequest({
      action: "upsert",
      username: "  Lucas  ",
      fullName: "  Lucas Alvarez  ",
      password: "secret-pass",
      isActive: true
    });

    assert.deepEqual(request, {
      action: "upsert",
      username: "lucas",
      email: "lucas@vendedor.denise-catalan.local",
      fullName: "Lucas Alvarez",
      password: "secret-pass",
      isActive: true
    });
  });

  it("requires at least eight password characters when a password is supplied", () => {
    assert.throws(
      () => sanitizeSellerRequest({ username: "lucas", password: "short" }),
      /al menos 8 caracteres/
    );
  });

  it("keeps immutable seller identity for edit requests with an empty password", () => {
    const request = sanitizeSellerRequest({
      action: "upsert",
      sellerId: "seller-1",
      username: "  Lucas Nuevo  ",
      fullName: "Lucas Nuevo",
      password: "",
      isActive: true
    });

    assert.equal(request.sellerId, "seller-1");
    assert.equal(request.email, "lucas nuevo@vendedor.denise-catalan.local");
    assert.equal(request.password, "");
  });

  it("updates an edited seller by immutable id when username changes and password is empty", async () => {
    assert.equal(typeof sellersApi.upsertSeller, "function");
    const service = createFakeSellerService({
      users: [{ id: "seller-1", email: "lucas@vendedor.denise-catalan.local" }],
      profiles: [
        {
          id: "seller-1",
          username: "lucas",
          email: "lucas@vendedor.denise-catalan.local",
          full_name: "Lucas",
          is_active: true,
          created_by: "admin-1",
          created_at: "2026-01-01",
          updated_at: "2026-01-02"
        }
      ]
    });
    const seller = sanitizeSellerRequest({
      action: "upsert",
      sellerId: "seller-1",
      username: "lucas-renombrado",
      fullName: "Lucas Renombrado",
      password: "",
      isActive: true
    });

    const profile = await sellersApi.upsertSeller({
      adminUser: { id: "admin-1" },
      seller,
      authAdmin: service.authAdmin,
      prisma: service.prisma
    });

    assert.deepEqual(service.state.updated, [
      {
        id: "seller-1",
        attributes: {
          email: "lucas-renombrado@vendedor.denise-catalan.local",
          email_confirm: true,
          user_metadata: {
            username: "lucas-renombrado",
            full_name: "Lucas Renombrado"
          }
        }
      }
    ]);
    assert.equal(service.state.created.length, 0);
    assert.equal(profile.id, "seller-1");
    assert.equal(profile.username, "lucas-renombrado");
    assert.equal(profile.email, "lucas-renombrado@vendedor.denise-catalan.local");
  });

  it("rejects an edited seller username that belongs to another seller", async () => {
    assert.equal(typeof sellersApi.upsertSeller, "function");
    const service = createFakeSellerService({
      users: [
        { id: "seller-1", email: "lucas@vendedor.denise-catalan.local" },
        { id: "seller-2", email: "maria@vendedor.denise-catalan.local" }
      ],
      profiles: [
        {
          id: "seller-1",
          username: "lucas",
          email: "lucas@vendedor.denise-catalan.local",
          full_name: "Lucas",
          is_active: true
        },
        {
          id: "seller-2",
          username: "maria",
          email: "maria@vendedor.denise-catalan.local",
          full_name: "Maria",
          is_active: true
        }
      ]
    });
    const seller = sanitizeSellerRequest({
      action: "upsert",
      sellerId: "seller-1",
      username: "maria",
      fullName: "Lucas",
      password: "",
      isActive: true
    });

    await assert.rejects(
      () =>
        sellersApi.upsertSeller({
          adminUser: { id: "admin-1" },
          seller,
          authAdmin: service.authAdmin,
          prisma: service.prisma
        }),
      /Ya existe un vendedor/
    );
    assert.equal(service.state.updated.length, 0);
    assert.equal(service.state.created.length, 0);
  });
});
