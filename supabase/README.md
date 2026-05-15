# Supabase setup

1. Apply `migrations/202605150001_initial_schema.sql` in the Supabase SQL editor or with the Supabase CLI.
2. Add `SUPABASE_SERVICE_ROLE_KEY` locally in `.env.local`. Never expose it in the frontend or deploy it as a public variable.
3. Create the admin user:

```bash
npm run admin:create -- --username denise --password "una-contrasenia-segura"
```

4. Load the current KML data:

```bash
npm run db:seed
```

You can also paste `seed.sql` into the Supabase SQL editor after running the migration.

The admin panel is available at `/admin`. The login form accepts the username you created above and the password from the command.

## Imagenes en Vercel Blob

Para subir imagenes desde el administrador o migrar las imagenes locales, crea un Blob store publico en Vercel y agrega `BLOB_READ_WRITE_TOKEN` al entorno del proyecto.

La migracion sube las imagenes de `public/images` a Vercel Blob y reemplaza las URLs en `property_images`:

```bash
BLOB_READ_WRITE_TOKEN=... SUPABASE_SERVICE_ROLE_KEY=... npm run images:migrate:blob
```

Tambien podes usar `SUPABASE_ACCESS_TOKEN` en lugar de `SUPABASE_SERVICE_ROLE_KEY`; el script lo usa solo para obtener la key del proyecto desde la API de Supabase.
