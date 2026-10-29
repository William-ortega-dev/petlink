<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HogarTemporal extends Model
{
    protected $table = 'hogares_temporales';
    protected $fillable = ['responsable_id', 'direccion_id', 'capacidad', 'acepta_perros', 'acepta_gatos', 'notas', 'activo'];
    protected function casts(): array { return ['acepta_perros' => 'boolean', 'acepta_gatos' => 'boolean', 'activo' => 'boolean']; }
    public function responsable() { return $this->belongsTo(User::class, 'responsable_id'); }
    public function direccion() { return $this->belongsTo(Direccion::class); }
    public function asignaciones() { return $this->hasMany(AsignacionHogar::class, 'hogar_id'); }
}

