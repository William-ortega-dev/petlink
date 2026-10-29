# Preparar una demostración pública gratuita

## Estado

El repositorio está preparado para un frontend React estático en Vercel y una API Laravel en Docker/Render. La base PostgreSQL y las fotografías se proponen en Supabase. No se crearon recursos externos ni se publicó la aplicación porque hacen falta acceso a las cuentas del proveedor, valores privados del proyecto y una decisión explícita para subir estos nuevos commits al remoto.

La configuración no ejecuta migraciones ni seeders automáticamente por defecto. Tampoco crea cuentas de demostración en producción. El inicio de sesión de cinco roles en una demo pública requiere un plan de cuentas de presentación autorizado y no reutiliza las contraseñas locales conocidas.

## Servicios y límites revisados el 29 de octubre de 2026

- [Render Free](https://render.com/docs/free) admite servicios web Docker, pero los detiene tras 15 minutos sin tráfico y tardan alrededor de un minuto en iniciar de nuevo. El filesystem es efímero; el plan no permite discos persistentes. Los servicios gratuitos comparten 750 horas mensuales por espacio de trabajo. La base PostgreSQL gratuita de Render se elimina después de 30 días, así que no se usa en esta propuesta.
- [Vercel Hobby](https://vercel.com/docs/plans/hobby) es gratuito y está dirigido a proyectos personales/no comerciales. Sus límites de uso pueden pausar despliegues al agotarse la cuota. Esta opción corresponde a una presentación académica individual, no a un servicio comercial.
- [Supabase Free](https://supabase.com/docs/guides/platform/billing-on-supabase) ofrece PostgreSQL con 500 MB por base, dos proyectos activos y 1 GB de almacenamiento de archivos según sus límites actuales. Los proyectos con actividad baja pueden pausarse tras siete días; conservan los datos y se pueden restaurar durante un año. Supabase indica actualmente que conserva hasta siete copias diarias de proyectos Free, accesibles después de cambiar a un plan pago, pero advierte que esa práctica puede cambiar. No tomes esa retención como estrategia de respaldo: exporta copias propias a un destino privado.
- Render solo admite IPv4; [Supabase indica](https://supabase.com/docs/guides/database/connecting-to-postgres) que su conexión directa gratuita es IPv6. Para Render se debe copiar desde Supabase el **session pooler** IPv4, puerto 5432, con TLS obligatorio (`DB_SSLMODE=require`). No compongas a mano el host ni el usuario del pooler.
- [Supabase Storage tiene una API de archivos](https://supabase.com/docs/guides/storage/quickstart) y protocolo S3. La app usa la API de Storage desde el backend: se eligió ese camino porque su S3 no admite encabezados ACL y el adaptador S3 de Flysystem los envía. La clave elevada solo queda en Render. Un bucket público permite leer por URL cualquier objeto que contenga, así que no almacenes documentos privados allí.

Ningún plan gratuito implica una garantía de continuidad o respaldos apropiados para producción. Render puede suspender servicios por consumo de cuotas o tráfico de salida elevado; Vercel puede pausar al alcanzar límites. Revisa los paneles de uso de cada cuenta.

## Cambios incluidos en el repositorio

- `backend/Dockerfile` empaqueta Laravel 12, Apache y `pdo_pgsql`; Apache escucha el puerto `PORT` de Render.
- `backend/render.yaml` declara un web service gratuito y deja secretos como variables manuales (`sync: false`). El plan no crea una base ni un bucket.
- `backend/docker/entrypoint.sh` deja migraciones y seeders desactivados por omisión. Para habilitarlos exige `APP_ENV=production`, `DB_CONNECTION=pgsql` y que `PETLINK_MIGRATION_TARGET` coincida con `DB_DATABASE@DB_HOST:DB_PORT`.
- `frontend/vercel.json` compila el SPA y reescribe las rutas profundas a `index.html`.
- `PET_PHOTO_DISK` separa almacenamiento local de desarrollo (`public`) del API remoto Supabase (`supabase`). También se conserva el disco S3 de Laravel para otros proveedores compatibles.
- `DB_SSLMODE` hace explícito el requisito de TLS.
- `GET /api/health` responde `database=connected` solo cuando una consulta simple a PostgreSQL funciona. Ante fallo devuelve un 503 genérico, sin credenciales ni detalles internos.

## Procedimiento manual

### 1. Publica los cambios del repositorio

Los commits de esta actualización deben estar en GitHub antes de conectar Vercel y Render al repositorio. El remoto existente es público. Sube solo después de revisar y autorizar expresamente el `push`; este trabajo no lo hace automáticamente.

### 2. Crea PostgreSQL y almacenamiento en Supabase

1. Crea un proyecto Free nuevo en Supabase, en una región razonablemente cercana a Render. No uses datos personales reales.
2. En **Connect**, elige **Session pooler** y copia host, puerto, usuario, base y contraseña. Los valores típicos son puerto `5432` y base `postgres`, pero usa siempre los datos que muestre tu proyecto.
3. En Storage crea un bucket público llamado, por ejemplo, `petlink-assets`. La lectura de sus fotos será pública.
4. En **Settings > API Keys** crea o copia una clave **secret** para el backend. Si solo tienes disponible la clave legacy `service_role`, también funciona. Ambas pueden omitir RLS y acceder a Storage; no las pongas en Git ni en Vercel.
5. Conserva estos valores en un gestor seguro. No los pegues en mensajes públicos.

### 3. Crea el backend en Render

1. En Render crea un Blueprint desde el repositorio y fija **Blueprint Path** en `backend/render.yaml`.
2. Completa las variables `APP_KEY`, `APP_URL`, `FRONTEND_URL`, `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `SUPABASE_URL` y `SUPABASE_STORAGE_KEY` en el panel privado del servicio.
3. Para `APP_KEY`, ejecuta localmente `cd backend; php artisan key:generate --show` y pega el resultado únicamente en el panel de Render.
4. Usa `DB_HOST`, `DB_USERNAME` y demás valores del Session pooler. Mantén `DB_SSLMODE=require` y `DB_CONNECTION=pgsql`.
5. Para Supabase Storage define `SUPABASE_URL=https://<project-ref>.supabase.co`, `SUPABASE_STORAGE_BUCKET=petlink-assets` y `PET_PHOTO_DISK=supabase`. `SUPABASE_STORAGE_KEY` es la clave secret del proyecto o el legacy service_role. El backend usa la API del bucket para subir y borrar fotos; el navegador usa URLs públicas. Nunca mandes la clave al frontend.
6. Configura `APP_URL` con la URL HTTPS de Render. `FRONTEND_URL` debe ser el origen HTTPS exacto que Vercel asigna, sin ruta final.
7. Deja `PETLINK_DEMO_ACCOUNTS=false`. No configures las contraseñas demo locales en esta aplicación pública.
8. Confirma la base destino antes de migrar. El guard espera `PETLINK_MIGRATION_TARGET` con el texto exacto `<DB_DATABASE>@<DB_HOST>:<DB_PORT>`. Si los datos son correctos, configura temporalmente `RUN_MIGRATIONS=true` y vuelve a desplegar; el contenedor muestra el destino y ejecuta `php artisan migrate --force`. Después cambia `RUN_MIGRATIONS=false`.
9. Cuando las tablas ya existan, configura temporalmente `RUN_SEEDERS=true` junto con la confirmación anterior y despliega para insertar roles y catálogos. En `APP_ENV=production` el seeder no crea cuentas demo ni mascotas de prueba. Luego deja ambos interruptores en `false`.
10. Verifica `https://<servicio>.onrender.com/api/health`. El resultado esperado es HTTP 200 con `database: connected`.

El Session pooler debe permitir migraciones de Laravel. Si un proveedor limita conexiones de sesión, no cambies a transacciones en modo pooler sin verificar las restricciones de estado de sesión de PostgreSQL.

### 4. Crea el frontend en Vercel

1. Importa el mismo repositorio y configura **Root Directory** como `frontend`.
2. Vercel usa `frontend/vercel.json`, `npm run build` y `dist`.
3. Configura `VITE_API_URL=https://<servicio>.onrender.com/api` como variable de entorno de producción y despliega.
4. Copia el origen HTTPS asignado a Vercel y úsalo en Render como `FRONTEND_URL`. Verifica que CORS no permita otros orígenes.
5. Vuelve a probar `/api/health`, inicio de sesión, lectura del catálogo y recarga directa de `/mascotas` y `/panel`.

### 5. Correo y acceso de presentación

Laravel ya tiene rutas de recuperación de contraseña. El `MAIL_MAILER=log` de la configuración de Render solo registra el enlace en los logs; no lo envía por correo. Si se requiere recuperación pública, configura un SMTP/transporte real en el panel del backend y verifica la entrega antes de anunciar esa función.

No hay cuentas con rol de administrador sembradas en producción. El registro público crea adoptantes. Para presentar los cinco paneles, define una estrategia de acceso temporal que no publique credenciales predecibles y pide autorización antes de crear o divulgar esas cuentas. No habilites el selector de desarrollo ni `PETLINK_DEMO_ACCOUNTS` en producción.

## Verificación posterior

La preparación local no confirma que los servicios estén publicados. Tras tener acceso, comprueba manualmente:

1. La URL de Vercel y la recarga de rutas profundas.
2. `GET /api/health` devuelve 200 y `database=connected`.
3. CORS acepta el origen de Vercel y rechaza otros.
4. El registro/inicio/cierre de sesión y los permisos se verifican con cuentas de demostración controladas.
5. Las operaciones de adopción escriben y leen datos desde PostgreSQL.
6. La carga, URL pública, selección y eliminación de una foto operan sobre el bucket de Supabase Storage.
7. El reporte CSV y las notificaciones se persisten en PostgreSQL.
8. Si se configuró SMTP, el enlace de restablecimiento llega y funciona una sola vez.

Fuentes oficiales consultadas: [Render Free](https://render.com/docs/free), [Render Laravel con Docker](https://render.com/docs/deploy-php-laravel-docker), [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Supabase límites Free](https://supabase.com/docs/guides/platform/billing-on-supabase), [copias de proyectos Free](https://supabase.com/kb/troubleshooting/will-backups-be-accessible-from-the-dashboard-immediately-after-upgrading-to-a-paid-plan-hXY4rs), [pausa por inactividad](https://supabase.com/docs/guides/platform/free-project-pausing), [conexiones PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres), [Storage S3](https://supabase.com/docs/guides/storage/s3/authentication) y [fallback de SPA Vite](https://vercel.com/docs/frameworks/frontend/vite).
