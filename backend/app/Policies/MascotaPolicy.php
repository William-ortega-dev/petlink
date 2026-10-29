<?php

namespace App\Policies;

use App\Models\Mascota;
use App\Models\User;

class MascotaPolicy
{
    public function view(User $user, Mascota $mascota): bool
    {
        if ($user->isAdministrator() || $mascota->responsable_id === $user->id) {
            return true;
        }

        if ($user->isRole('Hogar temporal')) {
            return $mascota->asignacionesHogar()->whereHas('hogar', fn ($query) => $query->where('responsable_id', $user->id))->where('estado', 'activa')->exists();
        }

        return $mascota->publicacion()->where('estado', 'publicada')->whereHas('mascota.estado', fn ($query) => $query->where('codigo', 'disponible'))->exists();
    }

    public function create(User $user): bool
    {
        return $user->isRole('Administrador', 'Refugio');
    }

    public function update(User $user, Mascota $mascota): bool
    {
        return $user->isAdministrator() || ($user->isRole('Refugio') && $mascota->responsable_id === $user->id);
    }

    public function delete(User $user, Mascota $mascota): bool
    {
        return $user->isAdministrator() && ! $mascota->adopcion()->exists();
    }
}

