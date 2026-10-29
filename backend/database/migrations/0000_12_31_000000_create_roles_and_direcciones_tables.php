<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 40)->unique();
            $table->string('descripcion')->nullable();
            $table->timestampsTz();
        });

        Schema::create('direcciones', function (Blueprint $table) {
            $table->id();
            $table->string('departamento', 80);
            $table->string('municipio', 100);
            $table->string('direccion_linea', 180);
            $table->string('barrio', 100)->nullable();
            $table->string('codigo_postal', 12)->nullable();
            $table->decimal('latitud', 10, 7)->nullable();
            $table->decimal('longitud', 10, 7)->nullable();
            $table->timestampsTz();
            $table->index(['departamento', 'municipio']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('direcciones');
        Schema::dropIfExists('roles');
    }
};

