<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SolicitudAdopcion extends Model
{
    protected $table = 'solicitudes_adopcion';
    protected $fillable = ['publicacion_id', 'adoptante_id', 'motivacion', 'estado', 'observacion_responsable', 'revisada_por', 'revisada_en'];
    protected function casts(): array { return ['revisada_en' => 'datetime']; }
    public function publicacion() { return $this->belongsTo(PublicacionAdopcion::class, 'publicacion_id'); }
    public function adoptante() { return $this->belongsTo(User::class, 'adoptante_id'); }
    public function revisor() { return $this->belongsTo(User::class, 'revisada_por'); }
    public function adopcion() { return $this->hasOne(Adopcion::class, 'solicitud_id'); }
}

