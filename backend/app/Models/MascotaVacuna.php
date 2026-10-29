<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MascotaVacuna extends Model
{
    protected $table = 'mascota_vacuna';
    protected $fillable = ['mascota_id', 'vacuna_id', 'veterinario_id', 'aplicada_en', 'refuerzo_en', 'lote', 'observaciones'];
    protected function casts(): array { return ['aplicada_en' => 'date', 'refuerzo_en' => 'date']; }
    public function mascota() { return $this->belongsTo(Mascota::class); }
    public function vacuna() { return $this->belongsTo(Vacuna::class); }
    public function veterinario() { return $this->belongsTo(Veterinario::class); }
}

