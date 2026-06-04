# Supabase setup

## Variables de entorno

La app usa estos nombres exactos para conectarse con Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Esas dos variables son publicas y se usan en el frontend para leer/escribir segun las politicas RLS.

Para crear usuarios administradores o vendedores desde scripts/API server-side tambien hace falta:

```bash
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

`SUPABASE_SERVICE_ROLE_KEY` es privada: va en `.env.local` o en variables privadas de Vercel, nunca en el frontend ni con prefijo `NEXT_PUBLIC_`.

1. Apply `migrations/202605150001_initial_schema.sql` in the Supabase SQL editor or with the Supabase CLI.
2. Add the variables above locally in `.env.local`.
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

## Portal interno de vendedores

El portal de vendedores esta disponible en `/vendedor`. Los vendedores se crean desde `/admin`, en el panel "Vendedores".

Para que el alta de vendedores funcione en Vercel, agrega `SUPABASE_SERVICE_ROLE_KEY` como variable privada del proyecto. Esa key se usa solo en la ruta server-side `/api/admin/sellers`; no debe exponerse en variables publicas del frontend.

Los contactos cargados por vendedores quedan en `seller_contacts`, son compartidos entre usuarios internos activos y no se muestran en la pagina principal.

## Imagenes en Vercel Blob

Para subir imagenes desde el administrador o migrar las imagenes locales, crea un Blob store publico en Vercel y agrega `BLOB_READ_WRITE_TOKEN` al entorno del proyecto.

La migracion sube las imagenes de `public/images` a Vercel Blob y reemplaza las URLs en `property_images`:

```bash
BLOB_READ_WRITE_TOKEN=... SUPABASE_SERVICE_ROLE_KEY=... npm run images:migrate:blob
```

Tambien podes usar `SUPABASE_ACCESS_TOKEN` en lugar de `SUPABASE_SERVICE_ROLE_KEY`; el script lo usa solo para obtener la key del proyecto desde la API de Supabase.
