import { createClient } from "@supabase/supabase-js";
import { readArg, readEnv, requiredEnv } from "./lib/env.mjs";

const ADMIN_EMAIL_DOMAIN = "admin.denise-catalan.local";

function usernameToAdminEmail(username) {
  const normalized = username.trim().toLowerCase();
  return normalized.includes("@") ? normalized : `${normalized}@${ADMIN_EMAIL_DOMAIN}`;
}

async function findUserByEmail(supabase, email) {
  const perPage = 1000;

  for (let page = 1; page < 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < perPage) return null;
  }

  return null;
}

const env = readEnv();
requiredEnv(env, ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

const rawUsername = readArg("username", env.ADMIN_USERNAME || "admin").trim().toLowerCase();
const password = readArg("password", env.ADMIN_PASSWORD || "");

if (!password || password.length < 8) {
  throw new Error("La contraseña es obligatoria y debe tener al menos 8 caracteres.");
}

const username = rawUsername.includes("@") ? rawUsername.split("@")[0] : rawUsername;
const email = usernameToAdminEmail(rawUsername);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

let user = await findUserByEmail(supabase, email);

if (user) {
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: { username }
  });
  if (error) throw error;
  user = data.user;
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username }
  });
  if (error) throw error;
  user = data.user;
}

const { error: profileError } = await supabase.from("admin_profiles").upsert({
  id: user.id,
  username,
  email,
  is_active: true
});

if (profileError) throw profileError;

console.log(`Admin ready: ${username}`);
console.log(`Login email: ${email}`);
