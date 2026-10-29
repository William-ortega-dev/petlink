<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Adopcion extends Model
{
    protected $fillable = ['solicitud_id', 'mascota_id', 'adoptante_id', 'formalizada_por', 'fecha_adopcion', 'estado', 'observaciones'];
    protected function casts(): array { return ['fecha_adopcion' => 'date']; }
    public function solicitud() { return $this->belongsTo(SolicitudAdopcion::class, 'solicitud_id'); }
    public function mascota() { return $this->belongsTo(Mascota::class); }
    public function adoptante() { return $this->belongsTo(User::class, 'adoptante_id'); }
    public function seguimientos() { return $this->hasMany(SeguimientoAdopcion::class, 'adopcion_id'); }
}

