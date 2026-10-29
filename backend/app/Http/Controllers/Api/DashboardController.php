<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Adopcion;
use App\Models\CitaVeterinaria;
use App\Models\Donacion;
use App\Models\Mascota;
use App\Models\PublicacionAdopcion;
use App\Models\SolicitudAdopcion;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $role = $user->role?->nombre;
        $data = ['role' => $role, 'name' => $user->name];

        if ($user->isAdministrator()) {
            $data['stats'] = [
                'usuarios' => User::count(),
                'mascotas' => Mascota::count(),
                'publicaciones_activas' => PublicacionAdopcion::where('estado', 'publicada')->count(),
                'solicitudes_pendientes' => SolicitudAdopcion::whereIn('estado', ['pendiente', 'en_revision'])->count(),
                'adopciones' => Adopcion::count(),
                'donaciones_registradas_cop' => Donacion::sum('importe_cop'),
            ];
        } elseif ($user->isRole('Refugio')) {
            $data['stats'] = [
                'mascotas' => Mascota::where('responsable_id', $user->id)->count(),
                'publicaciones_activas' => PublicacionAdopcion::where('publicada_por', $user->id)->where('estado', 'publicada')->count(),
                'solicitudes_pendientes' => SolicitudAdopcion::whereHas('publicacion.mascota', fn ($q) => $q->where('responsable_id', $user->id))->whereIn('estado', ['pendiente', 'en_revision'])->count(),
                'adopciones' => Adopcion::whereHas('mascota', fn ($q) => $q->where('responsable_id', $user->id))->count(),
            ];
            $data['solicitudes_recientes'] = SolicitudAdopcion::with(['publicacion.mascota:id,nombre', 'adoptante:id,name'])->whereHas('publicacion.mascota', fn ($q) => $q->where('responsable_id', $user->id))->latest()->limit(5)->get();
        } elseif ($user->isRole('Adoptante')) {
            $data['stats'] = [
                'solicitudes' => $user->solicitudes()->count(),
                'adopciones' => $user->adopciones()->count(),
                'seguimientos_pendientes' => \App\Models\SeguimientoAdopcion::whereHas('adopcion', fn ($q) => $q->where('adoptante_id', $user->id))->where('resultado', 'pendiente')->count(),
            ];
            $data['solicitudes_recientes'] = $user->solicitudes()->with('publicacion.mascota:id,nombre')->latest()->limit(5)->get();
        } elseif ($user->isRole('Veterinario')) {
            $veterinarioId = $user->veterinario?->id;
            $data['citas'] = $veterinarioId ? CitaVeterinaria::with('mascota:id,nombre')->where('veterinario_id', $veterinarioId)->whereIn('estado', ['programada', 'confirmada'])->where('programada_en', '>=', now())->orderBy('programada_en')->limit(10)->get() : collect();
        } elseif ($user->isRole('Hogar temporal')) {
            $data['asignaciones'] = $user->hogarTemporal?->asignaciones()->with('mascota:id,nombre')->where('estado', 'activa')->get() ?? collect();
        }

        return response()->json(['dashboard' => $data]);
    }
}

