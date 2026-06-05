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

## Portal de clientes: Auth por email

El portal publico de clientes esta disponible en `/clientes` y soporta Google, email/contrasenia, signup y recuperacion de contrasenia con Supabase Auth.

En Supabase Dashboard > Authentication > Providers:

1. Habilitar `Email`.
2. Mantener `Confirm email` habilitado para usuarios reales.
3. Habilitar Google si tambien se usa el acceso social.

En Authentication > URL Configuration:

```text
Site URL:
https://www.denisecatalanbienesraices.com.ar

Redirect URLs:
https://www.denisecatalanbienesraices.com.ar/clientes
https://www.denisecatalanbienesraices.com.ar/clientes/restablecer
http://localhost:3000/**
http://localhost:3001/**
https://*-denisea-catalan*.vercel.app/**
```

La app usa estos redirects desde el frontend:

- Signup email: `/clientes`
- Recuperacion de contrasenia: `/clientes/restablecer`
- Google OAuth: `/clientes`

En Authentication > Email Templates, usar `{{ .ConfirmationURL }}` para los links principales de `Confirm signup` y `Reset password`. Si se arma un link custom con `{{ .RedirectTo }}`, debe apuntar al redirect recibido por la app.

Los templates versionados estan en `email-templates/`:

- `email-templates/confirm-signup.html`
- `email-templates/reset-password.html`

Subjects recomendados:

```text
Confirm sign up: Confirmá tu email | Denise Catalán
Reset password: Restablecé tu contraseña | Denise Catalán
```

Para usuarios reales hay que configurar un SMTP propio en Authentication > SMTP Settings. El SMTP por defecto de Supabase sirve para pruebas, pero no envia libremente a cualquier destinatario del proyecto en produccion. Usar una cuenta transaccional como Resend, Brevo, SendGrid, Postmark o AWS SES, con un remitente tipo `no-reply@<dominio>`.

## Imagenes en Vercel Blob

Para subir imagenes desde el administrador o migrar las imagenes locales, crea un Blob store publico en Vercel y agrega `BLOB_READ_WRITE_TOKEN` al entorno del proyecto.

La migracion sube las imagenes de `public/images` a Vercel Blob y reemplaza las URLs en `property_images`:

```bash
BLOB_READ_WRITE_TOKEN=... SUPABASE_SERVICE_ROLE_KEY=... npm run images:migrate:blob
```

Tambien podes usar `SUPABASE_ACCESS_TOKEN` en lugar de `SUPABASE_SERVICE_ROLE_KEY`; el script lo usa solo para obtener la key del proyecto desde la API de Supabase.
