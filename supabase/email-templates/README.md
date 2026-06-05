# Supabase Auth email templates

Templates de email para Supabase Auth, versionados fuera del Dashboard.

## Confirm sign up

Subject:

```text
Confirmá tu email | Denise Catalán
```

Body:

```html
supabase/email-templates/confirm-signup.html
```

## Reset password

Subject:

```text
Restablecé tu contraseña | Denise Catalán
```

Body:

```html
supabase/email-templates/reset-password.html
```

## Notas

- Mantener `{{ .ConfirmationURL }}` intacto: Supabase lo reemplaza por el link real.
- El logo usa la URL pública `https://www.denisecatalanbienesraices.com.ar/ISO%20DC.png`.
- Los estilos son inline para compatibilidad con clientes de email.
