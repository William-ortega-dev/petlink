<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'telefono', 'direccion_id', 'role_id', 'activo', 'password'];
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['email_verified_at' => 'datetime', 'password' => 'hashed', 'activo' => 'boolean'];
    }

    public function role() { return $this->belongsTo(Role::class, 'role_id'); }
    public function direccion() { return $this->belongsTo(Direccion::class, 'direccion_id'); }
    public function mascotas() { return $this->hasMany(Mascota::class, 'responsable_id'); }
    public function refugio() { return $this->hasOne(Refugio::class, 'responsable_id'); }
    public function solicitudes() { return $this->hasMany(SolicitudAdopcion::class, 'adoptante_id'); }
    public function adopciones() { return $this->hasMany(Adopcion::class, 'adoptante_id'); }
    public function donaciones() { return $this->hasMany(Donacion::class, 'donante_id'); }
    public function veterinario() { return $this->hasOne(Veterinario::class, 'usuario_id'); }
    public function hogarTemporal() { return $this->hasOne(HogarTemporal::class, 'responsable_id'); }

    public function isRole(string ...$names): bool
    {
        return in_array($this->role?->nombre, $names, true);
    }

    public function isAdministrator(): bool
    {
        return $this->isRole('Administrador');
    }
}
