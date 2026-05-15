import fs from "node:fs";
import path from "node:path";

export function readEnv(cwd = process.cwd()) {
  const fileEnv = {};

  for (const fileName of [".env", ".env.local"]) {
    const filePath = path.join(cwd, fileName);
    if (!fs.existsSync(filePath)) continue;

    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");

      fileEnv[key] = value;
    }
  }

  return {
    ...fileEnv,
    ...process.env
  };
}

export function requiredEnv(env, keys) {
  const missing = keys.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
  }
}

export function readArg(name, fallback = "") {
  const withEquals = `--${name}=`;
  const equalsArg = process.argv.find((arg) => arg.startsWith(withEquals));
  if (equalsArg) return equalsArg.slice(withEquals.length);

  const argIndex = process.argv.indexOf(`--${name}`);
  if (argIndex !== -1) return process.argv[argIndex + 1] || fallback;

  return fallback;
}
