<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeguimientoAdopcion extends Model
{
    protected $table = 'seguimientos_adopcion';
    protected $fillable = ['adopcion_id', 'registrado_por', 'fecha_programada', 'fecha_realizada', 'resultado', 'observaciones'];
    protected function casts(): array { return ['fecha_programada' => 'date', 'fecha_realizada' => 'date']; }
    public function adopcion() { return $this->belongsTo(Adopcion::class, 'adopcion_id'); }
    public function autor() { return $this->belongsTo(User::class, 'registrado_por'); }
}

