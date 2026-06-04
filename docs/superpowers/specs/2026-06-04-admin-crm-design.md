# Admin CRM Design

## Objetivo

Mejorar `/admin` para que funcione como un CRM liviano con navegacion clara entre Propiedades, Clientes y Vendedores.

El admin debe permitir:

- Ver un resumen inicial del negocio.
- Entrar a listados por entidad.
- Crear, ver y editar registros en paginas separadas.
- Ver todos los clientes cargados por todos los vendedores.
- Renombrar la tabla `seller_contacts` a `clients`, porque representa clientes del negocio y no solo contactos de vendedores.

## Alcance Aprobado

Se implementa la opcion C: admin tipo CRM.

Rutas principales:

- `/admin`: dashboard/resumen.
- `/admin/propiedades`: listado de propiedades.
- `/admin/clientes`: listado de clientes.
- `/admin/vendedores`: listado de vendedores.

Rutas de detalle y edicion:

- `/admin/propiedades/nueva`
- `/admin/propiedades/:id`
- `/admin/propiedades/:id/editar`
- `/admin/clientes/nuevo`
- `/admin/clientes/:id`
- `/admin/clientes/:id/editar`
- `/admin/vendedores/nuevo`
- `/admin/vendedores/:id`
- `/admin/vendedores/:id/editar`

## Arquitectura

La app actual es React/Vite y no usa React Router. Se mantiene ese enfoque para evitar una dependencia nueva. `AdminApp` resuelve la vista activa desde `window.location.pathname` y navega con links internos normales.

Componentes propuestos:

- `AdminShell`: sesion, header, navbar, carga inicial y acciones globales.
- `AdminDashboard`: metricas, actividad reciente y accesos rapidos.
- `AdminPropertiesList`: busqueda, filtros, ordenamiento basico y acciones Ver/Editar.
- `AdminPropertyView`: vista de lectura de una propiedad.
- `AdminPropertyEdit`: formulario de propiedad existente, con mapa, imagenes y ficha tecnica.
- `AdminClientsList`: todos los clientes, con filtros por vendedor, operacion y estado.
- `AdminClientView`: vista de lectura del cliente y relacion con el vendedor/admin que lo creo.
- `AdminClientEdit`: formulario de cliente.
- `AdminSellersList`: vendedores con estado y acciones.
- `AdminSellerView`: vista de lectura del vendedor.
- `AdminSellerEdit`: formulario de vendedor con password opcional al editar.

Si el archivo queda demasiado grande, se separaran componentes en archivos dentro de `src/admin/` manteniendo responsabilidades claras.

## Modelo De Datos

Se renombra `public.seller_contacts` a `public.clients`.

La tabla `clients` conserva la informacion existente:

- `id`
- `created_by`
- `updated_by`
- `full_name`
- `phone`
- `email`
- `operation`
- `zone`
- `budget`
- `rooms`
- `status`
- `notes`
- `created_at`
- `updated_at`

`created_by` y `updated_by` siguen apuntando a usuarios de Supabase Auth. En la UI admin se cruzan con `seller_profiles` y `admin_profiles` cuando haya datos disponibles para mostrar quien creo o actualizo el cliente.

La migracion debe:

- Renombrar la tabla.
- Renombrar indices, triggers y policies asociados para que usen el nombre `clients`.
- Mantener RLS habilitado.
- Mantener permisos para `authenticated`.
- Actualizar las policies para que admins y vendedores puedan leer, crear y actualizar clientes segun las reglas actuales.

## Flujos

Dashboard:

- Muestra cantidad de propiedades, publicadas, clientes, vendedores activos y actividad reciente.
- Los accesos rapidos llevan a crear propiedad, cliente o vendedor.

Propiedades:

- El listado permite buscar por titulo, ubicacion o categoria.
- Cada fila muestra categoria, publicacion y acciones `Ver` y `Editar`.
- La edicion reutiliza el formulario actual.
- El orden por drag and drop se mantiene en el listado de propiedades.

Clientes:

- El listado muestra todos los clientes de todos los vendedores.
- Filtros: vendedor, operacion y estado.
- Cada fila muestra nombre, operacion, estado, zona, fecha y creador cuando se pueda resolver.
- La pagina de vista muestra todos los datos y notas.
- La pagina de edicion permite modificar datos comerciales, estado y notas.

Vendedores:

- El listado muestra nombre, usuario/email, estado y acciones.
- La vista muestra datos principales y cantidad de clientes creados.
- La edicion permite cambiar nombre, usuario, estado y password opcional.
- Crear vendedor mantiene la API serverless actual porque necesita permisos de service role.

## Estados Y Errores

- Si la sesion expira, se muestra un mensaje para volver a iniciar sesion.
- Si una ruta apunta a un registro inexistente, se muestra "No encontrado" con link al listado.
- Si Supabase devuelve error, se muestra en la pagina activa.
- Los estados de carga se muestran cerca de la seccion afectada.
- No se borra informacion de usuario fuera de las acciones explicitas existentes.

## Pruebas Y Verificacion

Verificacion esperada:

- `npm test`
- `npm run build`
- Abrir `/admin`, `/admin/propiedades`, `/admin/clientes` y `/admin/vendedores` en navegador.
- Verificar rutas de `Ver`, `Editar` y `Nuevo` en cada entidad.
- Verificar que el portal vendedor siga cargando y guardando clientes usando la tabla renombrada.
- Verificar que RLS permita a admins ver todos los clientes y a vendedores seguir trabajando con clientes.

## Fuera De Alcance Para Esta Iteracion

- Graficos avanzados.
- Auditoria historica completa.
- Asignacion formal de clientes a multiples vendedores.
- Eliminacion masiva.
- Importacion/exportacion.
- React Router u otra libreria de routing.
