<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PublicacionAdopcion extends Model
{
    protected $table = 'publicaciones_adopcion';
    protected $fillable = ['mascota_id', 'publicada_por', 'titulo', 'descripcion', 'estado', 'publicada_en', 'cerrada_en'];
    protected function casts(): array { return ['publicada_en' => 'datetime', 'cerrada_en' => 'datetime']; }
    public function mascota() { return $this->belongsTo(Mascota::class); }
    public function autor() { return $this->belongsTo(User::class, 'publicada_por'); }
    public function solicitudes() { return $this->hasMany(SolicitudAdopcion::class, 'publicacion_id'); }
}

