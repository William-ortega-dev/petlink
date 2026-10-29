<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AsignacionHogar extends Model
{
    protected $table = 'asignaciones_hogar';
    protected $fillable = ['hogar_id', 'mascota_id', 'asignada_por', 'inicio', 'fin', 'estado', 'notas'];
    protected function casts(): array { return ['inicio' => 'date', 'fin' => 'date']; }
    public function hogar() { return $this->belongsTo(HogarTemporal::class, 'hogar_id'); }
    public function mascota() { return $this->belongsTo(Mascota::class); }
    public function asignador() { return $this->belongsTo(User::class, 'asignada_por'); }
}

