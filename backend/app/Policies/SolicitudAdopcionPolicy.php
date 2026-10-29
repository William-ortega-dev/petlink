<?php

namespace App\Policies;

use App\Models\SolicitudAdopcion;
use App\Models\User;

class SolicitudAdopcionPolicy
{
    public function view(User $user, SolicitudAdopcion $solicitud): bool
    {
        if ($user->isAdministrator() || $solicitud->adoptante_id === $user->id) {
            return true;
        }

        $pet = $solicitud->publicacion?->mascota;
        return $user->isRole('Refugio') && $pet?->responsable_id === $user->id;
    }

    public function review(User $user, SolicitudAdopcion $solicitud): bool
    {
        if ($user->isAdministrator()) {
            return true;
        }

        $pet = $solicitud->publicacion?->mascota;
        return $user->isRole('Refugio') && $pet?->responsable_id === $user->id;
    }
}

