# PetLink

PetLink conecta personas adoptantes con refugios y responsables de mascotas en Colombia. Incluye un catálogo público, solicitudes y formalización de adopciones, además de módulos para refugios, veterinarios y hogares temporales.

## Estado

La aplicación se creó desde cero con una API Laravel y un cliente React independiente. PostgreSQL es el único motor configurado. Este equipo sí tiene PostgreSQL 18 corriendo en localhost:5432; psql.exe está instalado pero no está en PATH. La cuenta de ejemplo petlink no autenticó y pdo_pgsql no se carga por defecto, así que las migraciones y pruebas de integración no pudieron usar esa instancia.

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

Resultados de verificación de esta ejecución: Composer validó el manifiesto; el lint y la compilación Vite terminaron correctamente; todos los archivos PHP del proyecto pasaron php -l y Laravel registró 53 rutas API. El intento completo de php artisan test dejó 2 pruebas de ejemplo aprobadas y 4 pruebas de integración bloqueadas porque PHP no cargaba pdo_pgsql. Al cargar las DLL solo para una comprobación, PHP alcanzó PostgreSQL 18 en localhost:5432, pero el servidor rechazó la contraseña de ejemplo. No se han verificado las migraciones ni las operaciones contra esa base.

## Cuentas demo

El seeder idempotente crea estas cuentas locales, todas con contraseña PetLink2026!:

| Perfil | Correo |
| --- | --- |
| Administrador | admin@petlink.local |
| Refugio | refugio@petlink.local |
| Adoptante | adoptante@petlink.local |
| Veterinario | veterinario@petlink.local |
| Hogar temporal | hogar@petlink.local |

Son solo para demostración.

## Funcionalidades implementadas

- Registro de adoptantes, inicio/cierre de sesión, perfil y cambio de contraseña.
- Tokens Sanctum Bearer con expiración de 120 minutos, rutas privadas y políticas para mascotas y solicitudes.
- Catálogo paginado, búsqueda y filtros, detalle, fotografías y publicaciones.
- Solicitudes con transiciones revisadas y formalización transaccional; al formalizar se cierra la publicación, cambia el estado de la mascota y se resuelven solicitudes competidoras.
- Paneles con datos de la API para administrador, adoptante, refugio, veterinario y hogar temporal.
- Gestión base de refugios, hogares y asignaciones; citas con comprobación de horario; historial médico y vacunas; registro de donaciones sin cobros; seguimientos.
- Migraciones PostgreSQL con claves, índices y restricciones; seeders repetibles.
- Interfaz responsive en español conectada a la API.

## Pendiente y límites conocidos

- Ejecutar migraciones, seeders y pruebas después de habilitar pdo_pgsql y configurar credenciales válidas para el servicio PostgreSQL local.
- Comparar el esquema con el MER original.
- Configurar SMTP para recuperación de contraseña; no hay credenciales de correo.
- Las fotos se cargan desde la API; los datos demo usan ilustraciones de respaldo.
- Donaciones solo registran aportes; no hay pasarela de pagos.
- Antes de desplegar, cambiar credenciales demo, secretos, CORS, URL pública, almacenamiento y reglas operativas.

