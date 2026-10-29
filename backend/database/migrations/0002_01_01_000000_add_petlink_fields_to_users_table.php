<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->after('id')->constrained('roles')->restrictOnDelete();
            $table->string('telefono', 30)->nullable()->after('email');
            $table->foreignId('direccion_id')->nullable()->after('telefono')->constrained('direcciones')->nullOnDelete();
            $table->boolean('activo')->default(true)->after('direccion_id');
            $table->index(['role_id', 'activo']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role_id', 'activo']);
            $table->dropConstrainedForeignId('direccion_id');
            $table->dropConstrainedForeignId('role_id');
            $table->dropColumn(['telefono', 'activo']);
        });
    }
};

