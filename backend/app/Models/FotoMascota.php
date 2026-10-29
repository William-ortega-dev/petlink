<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FotoMascota extends Model
{
    protected $table = 'fotos_mascota';
    protected $fillable = ['mascota_id', 'ruta', 'texto_alternativo', 'principal', 'orden'];
    protected function casts(): array { return ['principal' => 'boolean', 'orden' => 'integer']; }
    public function mascota() { return $this->belongsTo(Mascota::class); }
}

