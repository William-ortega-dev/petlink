<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Veterinario extends Model
{
    protected $fillable = ['usuario_id', 'numero_licencia', 'especialidad', 'clinica', 'activo'];
    protected function casts(): array { return ['activo' => 'boolean']; }
    public function usuario() { return $this->belongsTo(User::class, 'usuario_id'); }
    public function citas() { return $this->hasMany(CitaVeterinaria::class, 'veterinario_id'); }
}

