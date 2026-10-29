<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CitaVeterinaria extends Model
{
    protected $table = 'citas_veterinarias';
    protected $fillable = ['mascota_id', 'veterinario_id', 'solicitada_por', 'programada_en', 'duracion_minutos', 'estado', 'motivo', 'notas'];
    protected function casts(): array { return ['programada_en' => 'datetime']; }
    public function mascota() { return $this->belongsTo(Mascota::class); }
    public function veterinario() { return $this->belongsTo(Veterinario::class); }
    public function solicitante() { return $this->belongsTo(User::class, 'solicitada_por'); }
}

