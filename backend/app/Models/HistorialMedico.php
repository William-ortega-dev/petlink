<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistorialMedico extends Model
{
    protected $table = 'historial_medico';
    protected $fillable = ['mascota_id', 'registrado_por', 'veterinario_id', 'tipo', 'fecha_registro', 'titulo', 'descripcion'];
    protected function casts(): array { return ['fecha_registro' => 'date']; }
    public function mascota() { return $this->belongsTo(Mascota::class); }
    public function autor() { return $this->belongsTo(User::class, 'registrado_por'); }
    public function veterinario() { return $this->belongsTo(Veterinario::class); }
}

