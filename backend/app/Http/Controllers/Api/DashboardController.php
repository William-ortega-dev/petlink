<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Adopcion;
use App\Models\CitaVeterinaria;
use App\Models\Donacion;
use App\Models\AsignacionHogar;
use App\Models\HistorialMedico;
use App\Models\MascotaVacuna;
use App\Models\Mascota;
use App\Models\PublicacionAdopcion;
use App\Models\SolicitudAdopcion;
use App\Models\SeguimientoAdopcion;
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
                'hogares_temporales_activos' => \App\Models\HogarTemporal::where('activo', true)->count(),
                'citas_programadas' => CitaVeterinaria::whereIn('estado', ['programada', 'confirmada'])->count(),
                'registros_medicos' => HistorialMedico::count(),
                'vacunaciones_registradas' => MascotaVacuna::count(),
                'seguimientos_pendientes' => SeguimientoAdopcion::where('resultado', 'pendiente')->count(),
            ];
            $data['solicitudes_por_estado'] = SolicitudAdopcion::selectRaw('estado, count(*) as total')->groupBy('estado')->orderBy('estado')->get();
            $data['citas_recientes'] = CitaVeterinaria::with(['mascota:id,nombre', 'veterinario.usuario:id,name'])->latest('programada_en')->limit(8)->get();
            $data['historial_medico_reciente'] = HistorialMedico::with(['mascota:id,nombre', 'autor:id,name'])->latest('fecha_registro')->limit(8)->get();
            $data['vacunas_recientes'] = MascotaVacuna::with(['mascota:id,nombre', 'vacuna:id,nombre', 'veterinario.usuario:id,name'])->latest('aplicada_en')->limit(8)->get();
            $data['donaciones_recientes'] = Donacion::with(['refugio:id,nombre', 'donante:id,name'])->latest('donada_en')->limit(8)->get();
            $data['seguimientos_recientes'] = SeguimientoAdopcion::with(['adopcion.mascota:id,nombre', 'adopcion.adoptante:id,name'])->latest('fecha_programada')->limit(8)->get();
        } elseif ($user->isRole('Refugio')) {
            $data['stats'] = [
                'mascotas' => Mascota::where('responsable_id', $user->id)->count(),
                'publicaciones_activas' => PublicacionAdopcion::where('estado', 'publicada')->whereHas('mascota', fn ($q) => $q->where('responsable_id', $user->id))->count(),
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
            $appointments = CitaVeterinaria::where('veterinario_id', $veterinarioId);
            $data['stats'] = [
                'citas_proximas' => (clone $appointments)->whereIn('estado', ['programada', 'confirmada'])->where('programada_en', '>=', now())->count(),
                'citas_hoy' => (clone $appointments)->whereIn('estado', ['programada', 'confirmada'])->whereDate('programada_en', today())->count(),
                'atenciones_realizadas' => (clone $appointments)->where('estado', 'realizada')->count(),
                'mascotas_autorizadas' => $veterinarioId ? CitaVeterinaria::where('veterinario_id', $veterinarioId)->whereIn('estado', ['programada', 'confirmada', 'realizada'])->distinct('mascota_id')->count('mascota_id') : 0,
            ];
            $data['citas'] = $veterinarioId ? (clone $appointments)->with('mascota:id,nombre')->whereIn('estado', ['programada', 'confirmada', 'realizada'])->orderBy('programada_en')->limit(30)->get() : collect();
            $authorizedPetAppointments = fn ($query) => $query->where('veterinario_id', $veterinarioId)->whereIn('estado', ['programada', 'confirmada', 'realizada']);
            $data['historial_reciente'] = $veterinarioId ? HistorialMedico::with('mascota:id,nombre')->whereHas('mascota.citas', $authorizedPetAppointments)->latest('fecha_registro')->limit(10)->get() : collect();
            $data['vacunas_recientes'] = $veterinarioId ? MascotaVacuna::with(['mascota:id,nombre', 'vacuna:id,nombre'])->whereHas('mascota.citas', $authorizedPetAppointments)->latest('aplicada_en')->limit(10)->get() : collect();
        } elseif ($user->isRole('Hogar temporal')) {
            $homeId = $user->hogarTemporal?->id;
            $assignments = AsignacionHogar::where('hogar_id', $homeId);
            $data['stats'] = [
                'asignaciones_activas' => (clone $assignments)->where('estado', 'activa')->count(),
                'acogidas_finalizadas' => (clone $assignments)->where('estado', 'finalizada')->count(),
                'mascotas_bajo_cuidado' => (clone $assignments)->where('estado', 'activa')->distinct('mascota_id')->count('mascota_id'),
                'proxima_fecha' => (clone $assignments)->where('estado', 'activa')->whereDate('inicio', '>=', today())->min('inicio'),
            ];
            $data['asignaciones'] = $homeId ? (clone $assignments)->with('mascota:id,nombre')->latest('inicio')->limit(20)->get() : collect();
        }

        return response()->json(['dashboard' => $data]);
    }
}

