<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Raza extends Model
{
    protected $fillable = ['especie_id', 'nombre', 'activo'];
    protected function casts(): array { return ['activo' => 'boolean']; }
    public function especie() { return $this->belongsTo(Especie::class); }
    public function mascotas() { return $this->hasMany(Mascota::class); }
}

