import type { User } from "@supabase/supabase-js";

import { getPrisma } from "../prisma";
import { getSupabaseUserFromRequest } from "./supabase";
import { AuthRouteError } from "../http-errors";
import { sellerProfileToViewModel, type InternalProfile } from "../view-models";

type ProfilePrisma = {
  adminProfile: {
    findFirst(args?: unknown): Promise<any>;
  };
  sellerProfile: {
    findFirst(args?: unknown): Promise<any>;
  };
};

export async function resolveInternalProfileForUser(
  prisma: ProfilePrisma,
  userId: string
): Promise<InternalProfile | null> {
  if (!userId) return null;

  const adminProfile = await prisma.adminProfile.findFirst({
    where: {
      id: userId,
      isActive: true
    }
  });

  if (adminProfile) {
    const username = adminProfile.username || "";

    return {
      role: "admin",
      profile: {
        id: adminProfile.id,
        username,
        email: adminProfile.email || "",
        fullName: username || "Administrador",
        isActive: Boolean(adminProfile.isActive ?? adminProfile.is_active)
      }
    };
  }

  const sellerProfile = await prisma.sellerProfile.findFirst({
    where: {
      id: userId,
      isActive: true
    }
  });

  if (!sellerProfile) return null;

  return {
    role: "seller",
    profile: sellerProfileToViewModel(sellerProfile)
  };
}

export function assertAdminProfile(internalProfile: InternalProfile | null): asserts internalProfile is Extract<
  InternalProfile,
  { role: "admin" }
> {
  if (internalProfile?.role !== "admin") {
    throw new AuthRouteError("El usuario no tiene permiso para administrar este recurso.", 403);
  }
}

export function assertInternalProfile(internalProfile: InternalProfile | null): asserts internalProfile is InternalProfile {
  if (!internalProfile) {
    throw new AuthRouteError("El usuario no esta activo para acceder al portal interno.", 403);
  }
}

export type AuthenticatedInternalUser = {
  user: User;
  internalProfile: InternalProfile;
};

export async function requireInternalUser(request: Request): Promise<AuthenticatedInternalUser> {
  const user = await getSupabaseUserFromRequest(request);
  const internalProfile = await resolveInternalProfileForUser(getPrisma(), user.id);
  assertInternalProfile(internalProfile);

  return {
    user,
    internalProfile
  };
}

export async function requireAdmin(request: Request): Promise<AuthenticatedInternalUser> {
  const authenticated = await requireInternalUser(request);
  assertAdminProfile(authenticated.internalProfile);

  return authenticated;
}

export async function requireActiveSellerOrAdmin(request: Request): Promise<AuthenticatedInternalUser> {
  return requireInternalUser(request);
}
