<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mascota extends Model
{
    protected $table = 'mascotas';
    protected $fillable = ['nombre', 'especie_id', 'raza_id', 'estado_id', 'responsable_id', 'refugio_id', 'fecha_nacimiento', 'edad_estimada_anios', 'sexo', 'tamano', 'descripcion', 'notas_salud', 'codigo_identificacion', 'registrada_en'];
    protected function casts(): array { return ['fecha_nacimiento' => 'date', 'registrada_en' => 'datetime', 'edad_estimada_anios' => 'integer']; }
    public function especie() { return $this->belongsTo(Especie::class); }
    public function raza() { return $this->belongsTo(Raza::class); }
    public function estado() { return $this->belongsTo(EstadoMascota::class, 'estado_id'); }
    public function responsable() { return $this->belongsTo(User::class, 'responsable_id'); }
    public function refugio() { return $this->belongsTo(Refugio::class); }
    public function fotos() { return $this->hasMany(FotoMascota::class, 'mascota_id')->orderBy('orden'); }
    public function publicacion() { return $this->hasOne(PublicacionAdopcion::class, 'mascota_id'); }
    public function solicitudes() { return $this->hasManyThrough(SolicitudAdopcion::class, PublicacionAdopcion::class, 'mascota_id', 'publicacion_id'); }
    public function adopcion() { return $this->hasOne(Adopcion::class, 'mascota_id'); }
    public function citas() { return $this->hasMany(CitaVeterinaria::class, 'mascota_id'); }
    public function historialMedico() { return $this->hasMany(HistorialMedico::class, 'mascota_id'); }
    public function vacunasAplicadas() { return $this->hasMany(MascotaVacuna::class, 'mascota_id'); }
    public function asignacionesHogar() { return $this->hasMany(AsignacionHogar::class, 'mascota_id'); }
}

