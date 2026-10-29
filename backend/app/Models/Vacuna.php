<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vacuna extends Model
{
    protected $fillable = ['nombre', 'especie_recomendada', 'descripcion', 'activo'];
    protected function casts(): array { return ['activo' => 'boolean']; }
    public function aplicaciones() { return $this->hasMany(MascotaVacuna::class, 'vacuna_id'); }
}

