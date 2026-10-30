# PetLink

PetLink conecta personas adoptantes con refugios y responsables de mascotas en Colombia. Incluye un catálogo público, solicitudes y formalización de adopciones, además de módulos para refugios, veterinarios y hogares temporales.

## Estado

La aplicación usa una API Laravel y un cliente React independiente. PostgreSQL es el único motor configurado. Este equipo tiene PostgreSQL 18 en localhost:5432; psql.exe está instalado pero no está en PATH. PHP tiene la DLL `pdo_pgsql`, pero no la carga por defecto. Al habilitarla solo para la ejecución de PHPUnit, el servidor rechazó la contraseña local del usuario `petlink` al conectar con la base de pruebas `petlink_test`; no se modificaron credenciales ni datos.

El enlace de Lucidchart del prompt no fue accesible. El esquema es una propuesta inicial basada en las entidades sugeridas y debe compararse con el MER antes de usar PetLink con datos reales.

## Tecnologías y estructura

- PHP 8.2, Laravel 12, Eloquent ORM y Laravel Sanctum 4.
- PostgreSQL 16 o posterior como único motor de base de datos.
- React 19, Vite 8, React Router 7, Axios y Bootstrap 5.
- PHPUnit y ESLint.
- backend/: API, migraciones, modelos, políticas y seeders Laravel.
- frontend/: interfaz React en español.
- docs/modelo-datos.md y docs/api.md: esquema y rutas propuestas.
- docker-compose.yml: PostgreSQL opcional para desarrollo local.

Herramientas detectadas: PHP 8.2.12, Composer 2.8.12, Node 24.11.1, npm 11.6.2, Docker CLI 29.7.2 y servicio PostgreSQL 18. El cliente psql.exe existe, pero su carpeta no está en PATH; Docker Desktop/daemon no está activo.

## Requisitos en Windows

PHP 8.2+, Composer, extensiones PHP pdo_pgsql y pgsql habilitadas, PostgreSQL 16+ o Docker Desktop en ejecución, Node.js 20.19+ y npm.

### Habilitar PostgreSQL para PHP de XAMPP

PHP usa C:\xampp\php\php.ini y las DLL están en C:\xampp\php\ext. Edita el archivo y habilita estas líneas (si están comentadas, quita el punto y coma):

~~~ini
extension=pdo_pgsql
extension=pgsql
~~~

En una terminal nueva, comprueba:

~~~powershell
php -m | findstr /I "pdo_pgsql pgsql"
~~~

La salida debe incluir ambos módulos.

### Iniciar PostgreSQL

Con Docker Desktop instalado y en ejecución:

~~~powershell
cd .
docker compose up -d postgres
~~~

Compose crea la base petlink, el usuario petlink y la contraseña local de ejemplo petlink_dev_password. Solo se debe usar para desarrollo.

Alternativamente, el servicio PostgreSQL 18 local ya está activo. Tras iniciar sesión como un usuario administrador de PostgreSQL, crea el rol y las bases de desarrollo/pruebas. En este equipo se puede invocar psql con su ruta completa:

~~~powershell
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h 127.0.0.1 -d postgres
~~~

Cuando psql muestre su indicador, ejecuta allí estas sentencias SQL:

~~~sql
CREATE USER petlink WITH PASSWORD 'petlink_dev_password';
CREATE DATABASE petlink OWNER petlink;
CREATE DATABASE petlink_test OWNER petlink;
~~~

Si petlink ya existe, omite CREATE USER o restablece su contraseña solo si administras esa instancia. Si las bases ya existen, omite sus comandos. La contraseña del ejemplo es solo para desarrollo.

## Instalar y ejecutar

En PowerShell:

~~~powershell
cd .\backend
Copy-Item .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
~~~

El ejemplo usa PostgreSQL en 127.0.0.1:5432, base petlink y usuario petlink. Ajusta la contraseña si es necesario. No compartas .env ni uses credenciales de ejemplo en producción.

Backend, en una terminal:

~~~powershell
cd .\backend
php artisan serve --host 127.0.0.1 --port 8000
~~~

La API queda en http://127.0.0.1:8000/api; /api/health verifica que Laravel responda.

Frontend, en otra terminal:

~~~powershell
cd .\frontend
Copy-Item .env.example .env
npm ci
npm run dev
~~~

Vite suele mostrar http://localhost:5173. VITE_API_URL está en frontend/.env y apunta a http://127.0.0.1:8000/api.

## Verificación y pruebas

Con PostgreSQL disponible, php artisan migrate:status lista las migraciones ejecutadas y http://127.0.0.1:8000/api/mascotas devuelve las mascotas sembradas. El catálogo y sus filtros consumen esas rutas.

PHPUnit apunta a la base separada petlink_test. Créala antes de ejecutar:

~~~powershell
cd .\backend
php artisan test
~~~

Las pruebas usan RefreshDatabase sobre petlink_test; no apuntes PHPUnit a una base con datos que quieras conservar.

Comprobaciones frontend:

~~~powershell
cd .\frontend
npm run lint
npm run build
~~~

Verificación de esta actualización: la sintaxis PHP, `composer validate --strict --no-check-publish`, `npm run lint` y `npm run build` pasaron; Laravel registró 65 rutas API; las 3 pruebas unitarias pasaron. PHPUnit descubrió 22 pruebas de integración: una prueba de ejemplo pasó y 21 no pudieron conectar porque PostgreSQL rechazó la contraseña local del usuario `petlink` para `petlink_test`. No se verificaron migraciones, persistencia PostgreSQL ni flujos de API contra la base de datos. Configura credenciales válidas para esa base de pruebas antes de considerar esos checks completados.

## Cuentas demo de desarrollo

En `APP_ENV=local` o `APP_ENV=testing`, `php artisan migrate --seed` crea cuentas y datos de demostración relacionados solo cuando las cinco contraseñas están configuradas. Define valores aleatorios de al menos 16 caracteres en `backend/.env` (`PETLINK_DEMO_PASSWORD_ADMIN`, `PETLINK_DEMO_PASSWORD_ADOPTER`, `PETLINK_DEMO_PASSWORD_SHELTER`, `PETLINK_DEMO_PASSWORD_VETERINARIAN` y `PETLINK_DEMO_PASSWORD_FOSTER`). El seeder usa `firstOrCreate`: no duplica ni cambia usuarios que ya existan. En otro entorno controlado se necesita además `PETLINK_DEMO_ACCOUNTS=true`; producción siempre los omite. Las contraseñas se guardan con el cast `hashed` del modelo y nunca se devuelven por la API.

Para que el selector de `Vite dev` rellene el formulario habitual, copia `frontend/.env.example` como `frontend/.env.local` y coloca allí los mismos cinco valores con el prefijo `VITE_`. Ese archivo es local y está ignorado por Git. El selector solo aparece durante desarrollo y la autenticación sigue pasando por la API. No configures esas variables en el frontend de producción.

## Funcionalidades implementadas

- Registro de adoptantes, inicio/cierre de sesión, perfil, cambio y recuperación de contraseña. La recuperación usa el broker de Laravel y requiere configurar un transport de correo real para que el enlace llegue al usuario.
- Tokens Sanctum Bearer con expiración de 120 minutos, rutas privadas y políticas para mascotas y solicitudes.
- Catálogo paginado, búsqueda y filtros, detalle, fotografías y publicaciones.
- Solicitudes con transiciones revisadas y formalización transaccional; al formalizar se cierra la publicación, cambia el estado de la mascota y se resuelven solicitudes competidoras.
- Paneles con datos de la API para administrador, adoptante, refugio, veterinario y hogar temporal.
- Notificaciones internas persistentes para nuevas solicitudes, decisiones de adopción y cambios de citas; cada cuenta solo consulta y marca sus avisos.
- Auditoría de operaciones autenticadas de escritura, consultable únicamente por administradores; no almacena contraseñas ni cuerpos de solicitudes.
- Reporte CSV con cifras actuales de PostgreSQL, global para administrador y limitado a las mascotas del refugio responsable.
- Gestión de fotografías con validación de formato/tamaño, selección de imagen principal y eliminación autorizada.
- Gestión base de refugios, hogares y asignaciones; citas con comprobación de horario; historial médico y vacunas; registro de donaciones sin cobros; seguimientos.
- Migraciones PostgreSQL con claves, índices y restricciones; seeders repetibles.
- Interfaz responsive en español conectada a la API.

## Pendiente y límites conocidos

- Ejecutar migraciones, seeders y pruebas con `pdo_pgsql` habilitado y credenciales válidas para PostgreSQL. Esta actualización añade migraciones aditivas para notificaciones y auditoría; no modifica PK/FK existentes.
- Comparar el esquema con el MER original.
- Configurar SMTP para entregar los enlaces de recuperación; el entorno local usa `MAIL_MAILER=log` y deja el enlace en el log de Laravel.
- En despliegue, configurar un bucket público de Supabase Storage y `PET_PHOTO_DISK=supabase`; la clave elevada queda únicamente en Laravel. El disco local sirve para desarrollo y no persiste en un host efímero.
- Donaciones solo registran aportes; no hay pasarela de pagos.
- Antes de desplegar, cambiar credenciales demo, secretos, CORS, URL pública, almacenamiento y reglas operativas.

## Despliegue de demostración

Hay una configuración inicial para Laravel en Render (`backend/Dockerfile`, `backend/render.yaml`) y para el SPA en Vercel (`frontend/vercel.json`). El procedimiento manual, variables y límites actuales están en [docs/despliegue-gratuito.md](docs/despliegue-gratuito.md). No se han creado servicios, conectado cuentas ni publicado la aplicación.

Render Free puede suspender el backend al estar inactivo y el filesystem local es efímero. La propuesta usa Supabase para PostgreSQL y almacenamiento de fotos; la base gratuita puede pausarse tras una semana con baja actividad. Vercel Hobby está destinado a proyectos personales/no comerciales. Estos planes sirven para una demostración y no ofrecen garantías de producción.

