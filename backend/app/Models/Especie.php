<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Especie extends Model
{
    protected $fillable = ['nombre', 'icono', 'activo'];
    protected function casts(): array { return ['activo' => 'boolean']; }
    public function razas() { return $this->hasMany(Raza::class); }
    public function mascotas() { return $this->hasMany(Mascota::class); }
}

