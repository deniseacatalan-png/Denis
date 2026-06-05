import type { User } from "@supabase/supabase-js";

import { getPrisma } from "./prisma";
import { sellerProfileToViewModel, type SellerProfileViewModel } from "./view-models";
import { createSupabaseServiceClient, getBearerToken } from "./auth/supabase";

export { getBearerToken };

export const SELLER_EMAIL_DOMAIN = "vendedor.denise-catalan.local";

export class SellerRouteError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizeUsername(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function textValue(value: unknown) {
  return String(value || "").trim();
}

export function usernameToSellerEmail(username: string) {
  const normalized = normalizeUsername(username);
  return normalized.includes("@") ? normalized : `${normalized}@${SELLER_EMAIL_DOMAIN}`;
}

export function sanitizeSellerRequest(body: any = {}) {
  const action = body.action === "set_active" ? "set_active" : "upsert";
  const sellerId = textValue(body.sellerId || body.seller_id || body.id);
  const currentEmail = normalizeUsername(body.currentEmail || body.current_email || body.originalEmail || body.original_email);
  const rawUsername = normalizeUsername(body.username);
  const rawEmail = normalizeUsername(body.email);
  const username = rawUsername || (rawEmail.includes("@") ? rawEmail.split("@")[0] : rawEmail);
  const email = rawEmail || usernameToSellerEmail(username);
  const fullName = textValue(body.fullName || body.full_name || username);
  const password = textValue(body.password);
  const isActive = body.isActive ?? body.is_active ?? true;

  if (action === "upsert") {
    if (!username) {
      throw new SellerRouteError("El usuario del vendedor es obligatorio.");
    }

    if (password && password.length < 8) {
      throw new SellerRouteError("La contraseña debe tener al menos 8 caracteres.");
    }
  }

  const sanitizedSeller: any = {
    action,
    username,
    email,
    fullName,
    password,
    isActive: Boolean(isActive)
  };

  if (sellerId) sanitizedSeller.sellerId = sellerId;
  if (currentEmail) sanitizedSeller.currentEmail = currentEmail;

  return sanitizedSeller;
}

async function findUserByEmail(authAdmin: any, email: string): Promise<User | null> {
  const perPage = 1000;

  for (let page = 1; page < 20; page += 1) {
    const { data, error } = await authAdmin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((candidate: User) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < perPage) return null;
  }

  return null;
}

async function ensureSellerIdentityIsAvailable(prisma: any, authAdmin: any, seller: any) {
  const matchingUser = await findUserByEmail(authAdmin, seller.email);
  if (matchingUser && matchingUser.id !== seller.sellerId) {
    throw new SellerRouteError("Ya existe un vendedor con ese usuario o email.", 409);
  }

  const matchingUsernameProfile = seller.username
    ? await prisma.sellerProfile.findFirst({
        where: {
          username: seller.username
        },
        select: {
          id: true
        }
      })
    : null;

  if (matchingUsernameProfile && matchingUsernameProfile.id !== seller.sellerId) {
    throw new SellerRouteError("Ya existe un vendedor con ese usuario o email.", 409);
  }

  const matchingEmailProfile = seller.email
    ? await prisma.sellerProfile.findFirst({
        where: {
          email: seller.email
        },
        select: {
          id: true
        }
      })
    : null;

  if (matchingEmailProfile && matchingEmailProfile.id !== seller.sellerId) {
    throw new SellerRouteError("Ya existe un vendedor con ese usuario o email.", 409);
  }
}

async function updateSellerById({ seller, prisma, authAdmin }: { seller: any; prisma: any; authAdmin: any }) {
  const existingProfile = await prisma.sellerProfile.findUnique({
    where: {
      id: seller.sellerId
    }
  });

  if (!existingProfile) {
    throw new SellerRouteError("No encontramos ese vendedor.", 404);
  }

  await ensureSellerIdentityIsAvailable(prisma, authAdmin, seller);

  const attributes: any = {
    email: seller.email,
    email_confirm: true,
    user_metadata: {
      username: seller.username,
      full_name: seller.fullName
    }
  };

  if (seller.password) {
    attributes.password = seller.password;
  }

  const { error } = await authAdmin.updateUserById(seller.sellerId, attributes);
  if (error) throw error;

  const profile = await prisma.sellerProfile.update({
    where: {
      id: seller.sellerId
    },
    data: {
      username: seller.username,
      email: seller.email,
      fullName: seller.fullName,
      isActive: seller.isActive
    }
  });

  return sellerProfileToViewModel(profile);
}

export async function upsertSeller({
  adminUser,
  seller,
  prisma = getPrisma(),
  authAdmin = createSupabaseServiceClient().auth.admin
}: {
  adminUser: { id: string };
  seller: any;
  prisma?: any;
  authAdmin?: any;
}): Promise<SellerProfileViewModel> {
  if (seller.sellerId) {
    return updateSellerById({ seller, prisma, authAdmin });
  }

  await ensureSellerIdentityIsAvailable(prisma, authAdmin, seller);

  let user = await findUserByEmail(authAdmin, seller.email);

  if (user) {
    const attributes: any = {
      email_confirm: true,
      user_metadata: {
        username: seller.username,
        full_name: seller.fullName
      }
    };

    if (seller.password) {
      attributes.password = seller.password;
    }

    const { data, error } = await authAdmin.updateUserById(user.id, attributes);
    if (error) throw error;
    user = data.user;
  } else {
    if (!seller.password) {
      throw new SellerRouteError("La contraseña es obligatoria para crear un vendedor.");
    }

    const { data, error } = await authAdmin.createUser({
      email: seller.email,
      password: seller.password,
      email_confirm: true,
      user_metadata: {
        username: seller.username,
        full_name: seller.fullName
      }
    });

    if (error) throw error;
    user = data.user;
  }

  const profile = await prisma.sellerProfile.upsert({
    where: {
      id: user.id
    },
    update: {
      username: seller.username,
      email: seller.email,
      fullName: seller.fullName,
      isActive: seller.isActive
    },
    create: {
      id: user.id,
      username: seller.username,
      email: seller.email,
      fullName: seller.fullName,
      isActive: seller.isActive,
      createdBy: adminUser.id
    }
  });

  return sellerProfileToViewModel(profile);
}

export async function setSellerActive({
  sellerId,
  isActive,
  prisma = getPrisma()
}: {
  sellerId: string;
  isActive: boolean;
  prisma?: any;
}) {
  if (!sellerId) {
    throw new SellerRouteError("Falta el vendedor a actualizar.");
  }

  const profile = await prisma.sellerProfile.update({
    where: {
      id: sellerId
    },
    data: {
      isActive: Boolean(isActive)
    }
  });

  return sellerProfileToViewModel(profile);
}

export async function listSellerProfiles() {
  const rows = await getPrisma().sellerProfile.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  return rows.map(sellerProfileToViewModel);
}
