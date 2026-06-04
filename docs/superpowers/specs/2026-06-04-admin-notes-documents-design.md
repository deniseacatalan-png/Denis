# Admin Notes And Documents Design

## Objetivo

Agregar notas multiples y documentos/imagenes adjuntos a las fichas internas de propiedades y clientes.

Cada nota y cada archivo debe conservar:

- Quien lo cargo.
- Si lo cargo un administrador o un vendedor.
- Fecha y hora de carga.
- Relacion directa con la propiedad o cliente correspondiente.

## Alcance Aprobado

Se implementa con tablas separadas, no con una tabla generica compartida.

Tablas nuevas:

- `property_notes`
- `client_notes`
- `property_documents`
- `client_documents`

La interfaz muestra primero los registros existentes. Cada seccion tiene un boton para desplegar el formulario:

- `Agregar nota`
- `Agregar documento o imagen`

El formulario permanece oculto hasta que el usuario lo pide. Despues de guardar, se recarga la lista y el formulario vuelve a quedar limpio.

## Modelo De Datos

### Notas

`property_notes`:

- `id`
- `property_id`
- `body`
- `created_by`
- `author_role`
- `author_name`
- `created_at`

`client_notes`:

- `id`
- `client_id`
- `body`
- `created_by`
- `author_role`
- `author_name`
- `created_at`

`author_role` acepta `admin` o `seller`. `author_name` guarda una foto simple del nombre visible al momento de crear la nota, para que el historial siga siendo entendible aunque despues cambie un perfil.

### Documentos E Imagenes

`property_documents`:

- `id`
- `property_id`
- `file_name`
- `file_url`
- `file_type`
- `file_size`
- `created_by`
- `author_role`
- `author_name`
- `created_at`

`client_documents`:

- `id`
- `client_id`
- `file_name`
- `file_url`
- `file_type`
- `file_size`
- `created_by`
- `author_role`
- `author_name`
- `created_at`

Los archivos se suben a Vercel Blob extendiendo el flujo existente de `/api/blob/upload`. Hoy esa ruta acepta solo imagenes bajo `properties/` y valida solo administradores; esta iteracion debe ampliarla para aceptar adjuntos internos de propiedades/clientes y validar administradores o vendedores segun corresponda.

Las rutas de Blob se separan por entidad:

- `property-documents/<property_id>/...`
- `client-documents/<client_id>/...`

Se aceptan estos tipos en la primera version:

- Imagenes: JPG, PNG, WEBP, AVIF.
- Documentos: PDF, DOC, DOCX, XLS, XLSX.

El limite por archivo es 25 MB, igual que la subida de imagenes existente. La UI debe mostrar si el archivo es imagen y permitir abrirlo en una pestaña nueva.

## Permisos

Las tablas nuevas tienen RLS habilitado.

Admins:

- Pueden ver y agregar notas/documentos en propiedades.
- Pueden ver y agregar notas/documentos en clientes.

Vendedores:

- Pueden ver y agregar notas/documentos en clientes desde el portal vendedor.
- No administran propiedades en esta iteracion, porque hoy no existe una vista de propiedades para vendedores.

En todos los inserts, `created_by` debe ser el usuario autenticado. `author_role` se deriva del perfil interno activo: `admin_profiles` o `seller_profiles`.

La ruta de subida de Blob debe usar el access token del usuario actual para resolver el perfil interno antes de emitir el token de subida. Para adjuntos de clientes, permite admin o vendedor activo. Para adjuntos de propiedades, permite admin activo.

## UI Admin

En `/admin/propiedades/:id`:

- La ficha mantiene los datos actuales de la propiedad.
- Se agrega una seccion `Notas`.
- Se agrega una seccion `Documentos e imagenes`.
- Cada seccion lista lo ya cargado con fecha/hora, autor y rol.
- El boton correspondiente despliega el formulario.

En `/admin/clientes/:id`:

- La ficha mantiene los datos actuales del cliente.
- Se agregan las mismas secciones de notas y documentos.
- Las notas existentes del campo historico `clients.notes` siguen mostrandose en la ficha del cliente como "Notas generales" hasta que se decida migrarlas.

## UI Vendedor

En la vista/formulario de cliente del portal vendedor:

- Se agregan las mismas secciones de notas y documentos para clientes.
- El vendedor ve quien cargo cada registro.
- Cuando el vendedor agrega algo, queda guardado como `author_role = seller`.

## Helpers Y Flujo De Datos

Se agrega un helper nuevo, por ejemplo `src/utils/supabase/activity.js`, con funciones especificas:

- `fetchPropertyNotes(propertyId)`
- `createPropertyNote(propertyId, body, author)`
- `fetchClientNotes(clientId)`
- `createClientNote(clientId, body, author)`
- `fetchPropertyDocuments(propertyId)`
- `createPropertyDocument(propertyId, fileMetadata, author)`
- `fetchClientDocuments(clientId)`
- `createClientDocument(clientId, fileMetadata, author)`

El componente de UI puede ser compartido para evitar duplicacion:

- `NotesPanel`
- `DocumentsPanel`

Cada panel recibe el tipo de entidad, el id, las funciones de carga/creacion y los datos del usuario interno actual.

## Estados Y Errores

- Si no hay notas, se muestra un estado vacio.
- Si no hay documentos, se muestra un estado vacio.
- Si falla la carga de listas, se muestra el error en la seccion afectada.
- Si falla la subida del archivo, no se crea el registro en la tabla de documentos.
- Si el archivo sube pero falla el insert del registro, se muestra un error claro para que el usuario pueda reintentar.
- Los botones quedan deshabilitados mientras se guarda o sube un archivo.

## Pruebas Y Verificacion

Pruebas esperadas:

- Helpers normalizan notas y documentos.
- Helpers crean payloads con texto recortado y validacion de campos requeridos.
- No se permite crear una nota vacia.
- No se permite crear un documento sin URL o nombre.

Verificacion manual:

- Crear nota en propiedad desde admin y verla en la ficha con autor, rol, fecha y hora.
- Subir documento o imagen en propiedad desde admin y abrirlo desde la lista.
- Crear nota en cliente desde admin y verla en la ficha.
- Subir documento o imagen en cliente desde admin.
- Crear nota/documento en cliente desde portal vendedor y confirmar que se ve como vendedor en admin.
- Ejecutar `npm test`.
- Ejecutar `npm run build`.

## Fuera De Alcance

- Edicion de notas existentes.
- Eliminacion de notas o documentos.
- Migrar automaticamente `clients.notes` a `client_notes`.
- Versionado de archivos.
- Carpetas o categorias avanzadas de documentos.
