<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Refugio extends Model
{
    protected $fillable = ['nombre', 'nit', 'correo_contacto', 'telefono_contacto', 'responsable_id', 'direccion_id', 'descripcion', 'activo'];
    protected function casts(): array { return ['activo' => 'boolean']; }
    public function responsable() { return $this->belongsTo(User::class, 'responsable_id'); }
    public function direccion() { return $this->belongsTo(Direccion::class, 'direccion_id'); }
    public function mascotas() { return $this->hasMany(Mascota::class); }
    public function donaciones() { return $this->hasMany(Donacion::class); }
}

