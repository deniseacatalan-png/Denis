import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { readEnv, requiredEnv } from "./lib/env.mjs";

const { Pool } = pg;

const ADMIN_EMAIL_DOMAIN = "admin.denise-catalan.local";
const SELLER_EMAIL_DOMAIN = "vendedor.denise-catalan.local";

const TEST_ACCOUNTS = {
  admin: {
    username: "admin",
    fullName: "Admin Test",
    password: "TestAdmin2026!"
  },
  seller: {
    username: "vendedor",
    fullName: "Vendedor Test",
    password: "TestVendedor2026!"
  },
  client: {
    email: "cliente.test@denise-catalan.local",
    fullName: "Cliente Test",
    phone: "+54 9 2972 000000",
    password: "TestCliente2026!",
    propertySubmission: {
      id: "00000000-0000-4000-8000-000000000101",
      title: "Propiedad de prueba portal clientes",
      operation: "venta",
      status: "en_revision",
      propertyType: "Casa",
      address: "Calle de Prueba 123",
      zone: "Centro",
      price: "USD 250.000",
      area: "180 m2",
      rooms: "4 ambientes",
      bedrooms: 3,
      bathrooms: 2,
      description: "Fixture para probar el alta y seguimiento de propiedades desde el portal de clientes.",
      adminMessage: "Solicitud de prueba recibida para validar el panel de clientes."
    }
  }
};

function usernameToEmail(username, domain) {
  const normalized = username.trim().toLowerCase();
  return normalized.includes("@") ? normalized : `${normalized}@${domain}`;
}

async function findUserByEmail(authAdmin, email) {
  const perPage = 1000;
  const normalizedEmail = email.toLowerCase();

  for (let page = 1; page < 20; page += 1) {
    const { data, error } = await authAdmin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail);
    if (user) return user;
    if (data.users.length < perPage) return null;
  }

  return null;
}

async function upsertAuthUser(authAdmin, { email, password, userMetadata = {} }) {
  const existingUser = await findUserByEmail(authAdmin, email);

  if (existingUser) {
    const { data, error } = await authAdmin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: userMetadata
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await authAdmin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata
  });
  if (error) throw error;
  return data.user;
}

async function upsertAdminProfile(db, { id, username, email }) {
  await db.query(
    `
      insert into public.admin_profiles (id, username, email, is_active)
      values ($1, $2, $3, true)
      on conflict (id) do update
      set username = excluded.username,
          email = excluded.email,
          is_active = true,
          updated_at = now()
    `,
    [id, username, email]
  );
}

async function upsertSellerProfile(db, { id, username, email, fullName, createdBy }) {
  await db.query(
    `
      insert into public.seller_profiles (id, username, email, full_name, is_active, created_by)
      values ($1, $2, $3, $4, true, $5)
      on conflict (id) do update
      set username = excluded.username,
          email = excluded.email,
          full_name = excluded.full_name,
          is_active = true,
          updated_at = now()
    `,
    [id, username, email, fullName, createdBy]
  );
}

async function upsertClientPortalProfile(db, { userId, email, fullName, phone }) {
  await db.query(
    `
      insert into public.client_portal_profiles (user_id, email, full_name, phone, is_active)
      values ($1, $2, $3, $4, true)
      on conflict (user_id) do update
      set email = excluded.email,
          full_name = excluded.full_name,
          phone = excluded.phone,
          is_active = true,
          updated_at = now()
    `,
    [userId, email, fullName, phone]
  );
}

async function upsertClientPortalFixtures(db, { userId, fixtures }) {
  await db.query(
    `
      insert into public.client_property_submissions (
        id,
        user_id,
        title,
        operation,
        intent,
        status,
        property_type,
        address,
        zone,
        price,
        area,
        rooms,
        bedrooms,
        bathrooms,
        description,
        features,
        admin_message
      )
      values ($1, $2, $3, $4, 'ofrecer', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, '{}'::jsonb, $15)
      on conflict (id) do update
      set user_id = excluded.user_id,
          title = excluded.title,
          operation = excluded.operation,
          intent = excluded.intent,
          status = excluded.status,
          property_type = excluded.property_type,
          address = excluded.address,
          zone = excluded.zone,
          price = excluded.price,
          area = excluded.area,
          rooms = excluded.rooms,
          bedrooms = excluded.bedrooms,
          bathrooms = excluded.bathrooms,
          description = excluded.description,
          features = excluded.features,
          admin_message = excluded.admin_message,
          updated_at = now()
    `,
    [
      fixtures.propertySubmission.id,
      userId,
      fixtures.propertySubmission.title,
      fixtures.propertySubmission.operation,
      fixtures.propertySubmission.status,
      fixtures.propertySubmission.propertyType,
      fixtures.propertySubmission.address,
      fixtures.propertySubmission.zone,
      fixtures.propertySubmission.price,
      fixtures.propertySubmission.area,
      fixtures.propertySubmission.rooms,
      fixtures.propertySubmission.bedrooms,
      fixtures.propertySubmission.bathrooms,
      fixtures.propertySubmission.description,
      fixtures.propertySubmission.adminMessage
    ]
  );

}

const env = readEnv();
requiredEnv(env, ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

const databaseUrl = env.DIRECT_URL || env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Falta DIRECT_URL o DATABASE_URL para guardar perfiles de prueba.");
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const pool = new Pool({
  connectionString: databaseUrl
});

try {
  const db = await pool.connect();

  try {
    await db.query("begin");

    const adminEmail = usernameToEmail(TEST_ACCOUNTS.admin.username, ADMIN_EMAIL_DOMAIN);
    const adminUser = await upsertAuthUser(supabase.auth.admin, {
      email: adminEmail,
      password: TEST_ACCOUNTS.admin.password,
      userMetadata: {
        username: TEST_ACCOUNTS.admin.username,
        full_name: TEST_ACCOUNTS.admin.fullName
      }
    });
    await upsertAdminProfile(db, {
      id: adminUser.id,
      username: TEST_ACCOUNTS.admin.username,
      email: adminEmail
    });

    const sellerEmail = usernameToEmail(TEST_ACCOUNTS.seller.username, SELLER_EMAIL_DOMAIN);
    const sellerUser = await upsertAuthUser(supabase.auth.admin, {
      email: sellerEmail,
      password: TEST_ACCOUNTS.seller.password,
      userMetadata: {
        username: TEST_ACCOUNTS.seller.username,
        full_name: TEST_ACCOUNTS.seller.fullName
      }
    });
    await upsertSellerProfile(db, {
      id: sellerUser.id,
      username: TEST_ACCOUNTS.seller.username,
      email: sellerEmail,
      fullName: TEST_ACCOUNTS.seller.fullName,
      createdBy: adminUser.id
    });

    const clientUser = await upsertAuthUser(supabase.auth.admin, {
      email: TEST_ACCOUNTS.client.email,
      password: TEST_ACCOUNTS.client.password,
      userMetadata: {
        full_name: TEST_ACCOUNTS.client.fullName
      }
    });
    await upsertClientPortalProfile(db, {
      userId: clientUser.id,
      email: TEST_ACCOUNTS.client.email,
      fullName: TEST_ACCOUNTS.client.fullName,
      phone: TEST_ACCOUNTS.client.phone
    });
    await upsertClientPortalFixtures(db, {
      userId: clientUser.id,
      fixtures: TEST_ACCOUNTS.client
    });

    await db.query("commit");

    console.log("Cuentas de prueba listas:");
    console.log(`- Admin: ${TEST_ACCOUNTS.admin.username} (${adminEmail})`);
    console.log(`- Vendedor: ${TEST_ACCOUNTS.seller.username} (${sellerEmail})`);
    console.log(`- Cliente portal: ${TEST_ACCOUNTS.client.email}`);
      console.log("- Fixtures cliente: 1 propiedad enviada");
  } catch (error) {
    await db.query("rollback");
    throw error;
  } finally {
    db.release();
  }
} finally {
  await pool.end();
}
