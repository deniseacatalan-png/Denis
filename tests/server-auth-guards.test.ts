import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  assertAdminProfile,
  resolveInternalProfileForUser
} from "../src/server/auth/guards.ts";

function createProfilePrisma({
  adminProfile = null,
  sellerProfile = null
}: {
  adminProfile?: Record<string, unknown> | null;
  sellerProfile?: Record<string, unknown> | null;
}) {
  return {
    adminProfile: {
      async findFirst() {
        return adminProfile;
      }
    },
    sellerProfile: {
      async findFirst() {
        return sellerProfile;
      }
    }
  };
}

describe("server auth guards", () => {
  it("resolves active admins before seller profiles", async () => {
    const internalProfile = await resolveInternalProfileForUser(
      createProfilePrisma({
        adminProfile: {
          id: "admin-1",
          username: "denise",
          email: "denise@example.com",
          isActive: true
        },
        sellerProfile: {
          id: "admin-1",
          username: "shadow",
          email: "shadow@example.com",
          fullName: "Shadow",
          isActive: true
        }
      }),
      "admin-1"
    );

    assert.deepEqual(internalProfile, {
      role: "admin",
      profile: {
        id: "admin-1",
        username: "denise",
        email: "denise@example.com",
        fullName: "denise",
        isActive: true
      }
    });
  });

  it("resolves active sellers when no admin profile exists", async () => {
    const internalProfile = await resolveInternalProfileForUser(
      createProfilePrisma({
        sellerProfile: {
          id: "seller-1",
          username: "lucas",
          email: "lucas@example.com",
          fullName: "Lucas",
          isActive: true,
          createdBy: "admin-1",
          createdAt: new Date("2026-06-01T10:00:00.000Z"),
          updatedAt: new Date("2026-06-02T10:00:00.000Z")
        }
      }),
      "seller-1"
    );

    assert.equal(internalProfile?.role, "seller");
    assert.equal(internalProfile?.profile.fullName, "Lucas");
  });

  it("rejects sellers for admin-only operations", () => {
    assert.throws(
      () =>
        assertAdminProfile({
          role: "seller",
          profile: {
            id: "seller-1",
            username: "lucas",
            email: "lucas@example.com",
            fullName: "Lucas",
            isActive: true,
            createdBy: "",
            createdAt: "",
            updatedAt: ""
          }
        }),
      /permiso para administrar/
    );
  });

});
