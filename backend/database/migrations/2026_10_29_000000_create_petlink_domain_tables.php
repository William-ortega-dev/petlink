<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refugios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 140);
            $table->string('nit', 25)->nullable()->unique();
            $table->string('correo_contacto')->nullable();
            $table->string('telefono_contacto', 30)->nullable();
            $table->foreignId('responsable_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('direccion_id')->nullable()->constrained('direcciones')->nullOnDelete();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestampsTz();
            $table->index(['activo', 'nombre']);
        });

        Schema::create('especies', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 60)->unique();
            $table->string('icono', 50)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestampsTz();
        });

        Schema::create('razas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('especie_id')->constrained('especies')->restrictOnDelete();
            $table->string('nombre', 80);
            $table->boolean('activo')->default(true);
            $table->timestampsTz();
            $table->unique(['especie_id', 'nombre']);
        });

        Schema::create('estados_mascota', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 30)->unique();
            $table->string('nombre', 60);
            $table->boolean('visible_publico')->default(false);
            $table->timestampsTz();
        });

        Schema::create('mascotas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->foreignId('especie_id')->constrained('especies')->restrictOnDelete();
            $table->foreignId('raza_id')->nullable()->constrained('razas')->nullOnDelete();
            $table->foreignId('estado_id')->constrained('estados_mascota')->restrictOnDelete();
            $table->foreignId('responsable_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('refugio_id')->nullable()->constrained('refugios')->nullOnDelete();
            $table->date('fecha_nacimiento')->nullable();
            $table->smallInteger('edad_estimada_anios')->nullable();
            $table->string('sexo', 16)->nullable();
            $table->string('tamano', 16)->nullable();
            $table->text('descripcion')->nullable();
            $table->text('notas_salud')->nullable();
            $table->string('codigo_identificacion', 80)->nullable()->unique();
            $table->timestampTz('registrada_en')->useCurrent();
            $table->timestampsTz();
            $table->index(['estado_id', 'especie_id', 'tamano']);
            $table->index(['responsable_id', 'estado_id']);
        });
        DB::statement("ALTER TABLE mascotas ADD CONSTRAINT mascotas_edad_check CHECK (edad_estimada_anios IS NULL OR edad_estimada_anios BETWEEN 0 AND 40)");
        DB::statement("ALTER TABLE mascotas ADD CONSTRAINT mascotas_sexo_check CHECK (sexo IS NULL OR sexo IN ('hembra', 'macho', 'desconocido'))");
        DB::statement("ALTER TABLE mascotas ADD CONSTRAINT mascotas_tamano_check CHECK (tamano IS NULL OR tamano IN ('pequeno', 'mediano', 'grande'))");

        Schema::create('fotos_mascota', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mascota_id')->constrained('mascotas')->cascadeOnDelete();
            $table->string('ruta', 500);
            $table->string('texto_alternativo', 180)->nullable();
            $table->boolean('principal')->default(false);
            $table->unsignedSmallInteger('orden')->default(0);
            $table->timestampsTz();
            $table->index(['mascota_id', 'principal']);
        });

        Schema::create('publicaciones_adopcion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mascota_id')->unique()->constrained('mascotas')->restrictOnDelete();
            $table->foreignId('publicada_por')->constrained('users')->restrictOnDelete();
            $table->string('titulo', 160);
            $table->text('descripcion')->nullable();
            $table->string('estado', 20)->default('publicada');
            $table->timestampTz('publicada_en')->useCurrent();
            $table->timestampTz('cerrada_en')->nullable();
            $table->timestampsTz();
            $table->index(['estado', 'publicada_en']);
        });

        Schema::create('solicitudes_adopcion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publicacion_id')->constrained('publicaciones_adopcion')->restrictOnDelete();
            $table->foreignId('adoptante_id')->constrained('users')->restrictOnDelete();
            $table->text('motivacion')->nullable();
            $table->string('estado', 20)->default('pendiente');
            $table->text('observacion_responsable')->nullable();
            $table->foreignId('revisada_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('revisada_en')->nullable();
            $table->timestampsTz();
            $table->unique(['publicacion_id', 'adoptante_id']);
            $table->index(['adoptante_id', 'estado']);
        });
        DB::statement("ALTER TABLE solicitudes_adopcion ADD CONSTRAINT solicitudes_estado_check CHECK (estado IN ('pendiente', 'en_revision', 'aprobada', 'rechazada', 'formalizada'))");

        Schema::create('adopciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('solicitud_id')->unique()->constrained('solicitudes_adopcion')->restrictOnDelete();
            $table->foreignId('mascota_id')->unique()->constrained('mascotas')->restrictOnDelete();
            $table->foreignId('adoptante_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('formalizada_por')->constrained('users')->restrictOnDelete();
            $table->date('fecha_adopcion');
            $table->string('estado', 20)->default('activa');
            $table->text('observaciones')->nullable();
            $table->timestampsTz();
            $table->index(['adoptante_id', 'fecha_adopcion']);
        });

        Schema::create('hogares_temporales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('responsable_id')->unique()->constrained('users')->restrictOnDelete();
            $table->foreignId('direccion_id')->nullable()->constrained('direcciones')->nullOnDelete();
            $table->unsignedSmallInteger('capacidad')->default(1);
            $table->boolean('acepta_perros')->default(true);
            $table->boolean('acepta_gatos')->default(true);
            $table->text('notas')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestampsTz();
        });

        Schema::create('asignaciones_hogar', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hogar_id')->constrained('hogares_temporales')->restrictOnDelete();
            $table->foreignId('mascota_id')->constrained('mascotas')->restrictOnDelete();
            $table->foreignId('asignada_por')->constrained('users')->restrictOnDelete();
            $table->date('inicio');
            $table->date('fin')->nullable();
            $table->string('estado', 20)->default('activa');
            $table->text('notas')->nullable();
            $table->timestampsTz();
            $table->index(['hogar_id', 'estado']);
            $table->index(['mascota_id', 'estado']);
        });
        DB::statement("ALTER TABLE asignaciones_hogar ADD CONSTRAINT asignaciones_fechas_check CHECK (fin IS NULL OR fin >= inicio)");

        Schema::create('veterinarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->unique()->constrained('users')->restrictOnDelete();
            $table->string('numero_licencia', 60)->unique();
            $table->string('especialidad', 100)->nullable();
            $table->string('clinica', 140)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestampsTz();
        });

        Schema::create('citas_veterinarias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mascota_id')->constrained('mascotas')->restrictOnDelete();
            $table->foreignId('veterinario_id')->constrained('veterinarios')->restrictOnDelete();
            $table->foreignId('solicitada_por')->constrained('users')->restrictOnDelete();
            $table->timestampTz('programada_en');
            $table->unsignedSmallInteger('duracion_minutos')->default(30);
            $table->string('estado', 20)->default('programada');
            $table->string('motivo', 180)->nullable();
            $table->text('notas')->nullable();
            $table->timestampsTz();
            $table->index(['veterinario_id', 'programada_en', 'estado']);
            $table->index(['mascota_id', 'programada_en']);
        });

        Schema::create('historial_medico', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mascota_id')->constrained('mascotas')->restrictOnDelete();
            $table->foreignId('registrado_por')->constrained('users')->restrictOnDelete();
            $table->foreignId('veterinario_id')->nullable()->constrained('veterinarios')->nullOnDelete();
            $table->string('tipo', 60);
            $table->date('fecha_registro');
            $table->string('titulo', 160);
            $table->text('descripcion');
            $table->timestampsTz();
            $table->index(['mascota_id', 'fecha_registro']);
        });

        Schema::create('vacunas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->unique();
            $table->string('especie_recomendada', 60)->nullable();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestampsTz();
        });

        Schema::create('mascota_vacuna', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mascota_id')->constrained('mascotas')->restrictOnDelete();
            $table->foreignId('vacuna_id')->constrained('vacunas')->restrictOnDelete();
            $table->foreignId('veterinario_id')->nullable()->constrained('veterinarios')->nullOnDelete();
            $table->date('aplicada_en');
            $table->date('refuerzo_en')->nullable();
            $table->string('lote', 80)->nullable();
            $table->text('observaciones')->nullable();
            $table->timestampsTz();
            $table->index(['mascota_id', 'aplicada_en']);
        });

        Schema::create('donaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donante_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('refugio_id')->nullable()->constrained('refugios')->nullOnDelete();
            $table->string('tipo_aporte', 20);
            $table->decimal('importe_cop', 14, 2)->nullable();
            $table->string('descripcion', 180)->nullable();
            $table->string('estado', 20)->default('registrada');
            $table->timestampTz('donada_en')->useCurrent();
            $table->timestampsTz();
            $table->index(['donante_id', 'donada_en']);
            $table->index(['refugio_id', 'estado']);
        });
        DB::statement("ALTER TABLE donaciones ADD CONSTRAINT donaciones_importe_check CHECK (importe_cop IS NULL OR importe_cop >= 0)");
        DB::statement("ALTER TABLE donaciones ADD CONSTRAINT donaciones_tipo_check CHECK (tipo_aporte IN ('dinero', 'especie', 'servicio'))");

        Schema::create('seguimientos_adopcion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('adopcion_id')->constrained('adopciones')->restrictOnDelete();
            $table->foreignId('registrado_por')->constrained('users')->restrictOnDelete();
            $table->date('fecha_programada');
            $table->date('fecha_realizada')->nullable();
            $table->string('resultado', 20)->default('pendiente');
            $table->text('observaciones')->nullable();
            $table->timestampsTz();
            $table->index(['adopcion_id', 'fecha_programada']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seguimientos_adopcion');
        Schema::dropIfExists('donaciones');
        Schema::dropIfExists('mascota_vacuna');
        Schema::dropIfExists('vacunas');
        Schema::dropIfExists('historial_medico');
        Schema::dropIfExists('citas_veterinarias');
        Schema::dropIfExists('veterinarios');
        Schema::dropIfExists('asignaciones_hogar');
        Schema::dropIfExists('hogares_temporales');
        Schema::dropIfExists('adopciones');
        Schema::dropIfExists('solicitudes_adopcion');
        Schema::dropIfExists('publicaciones_adopcion');
        Schema::dropIfExists('fotos_mascota');
        Schema::dropIfExists('mascotas');
        Schema::dropIfExists('estados_mascota');
        Schema::dropIfExists('razas');
        Schema::dropIfExists('especies');
        Schema::dropIfExists('refugios');
    }
};

