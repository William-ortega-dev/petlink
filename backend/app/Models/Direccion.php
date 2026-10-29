<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Direccion extends Model
{
    protected $table = 'direcciones';
    protected $fillable = ['departamento', 'municipio', 'direccion_linea', 'barrio', 'codigo_postal', 'latitud', 'longitud'];
    protected function casts(): array { return ['latitud' => 'decimal:7', 'longitud' => 'decimal:7']; }
    public function users() { return $this->hasMany(User::class, 'direccion_id'); }
    public function refugios() { return $this->hasMany(Refugio::class, 'direccion_id'); }
}

