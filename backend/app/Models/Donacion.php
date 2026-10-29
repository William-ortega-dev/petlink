<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Donacion extends Model
{
    protected $fillable = ['donante_id', 'refugio_id', 'tipo_aporte', 'importe_cop', 'descripcion', 'estado', 'donada_en'];
    protected function casts(): array { return ['importe_cop' => 'decimal:2', 'donada_en' => 'datetime']; }
    public function donante() { return $this->belongsTo(User::class, 'donante_id'); }
    public function refugio() { return $this->belongsTo(Refugio::class); }
}

