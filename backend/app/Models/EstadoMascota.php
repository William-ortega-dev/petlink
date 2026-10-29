<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoMascota extends Model
{
    protected $table = 'estados_mascota';
    protected $fillable = ['codigo', 'nombre', 'visible_publico'];
    protected function casts(): array { return ['visible_publico' => 'boolean']; }
    public function mascotas() { return $this->hasMany(Mascota::class, 'estado_id'); }
}

