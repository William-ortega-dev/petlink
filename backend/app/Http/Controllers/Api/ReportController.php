<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Adopcion;
use App\Models\AsignacionHogar;
use App\Models\CitaVeterinaria;
use App\Models\Mascota;
use App\Models\PublicacionAdopcion;
use App\Models\SolicitudAdopcion;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function summaryCsv(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isAdministrator() || $user->isRole('Refugio'), 403);

        $pets = Mascota::query();
        $requests = SolicitudAdopcion::query()->whereHas('publicacion.mascota');
        $adoptions = Adopcion::query()->whereHas('mascota');
        $appointments = CitaVeterinaria::query()->whereHas('mascota');
        $assignments = AsignacionHogar::query()->whereHas('mascota');
        $publications = PublicacionAdopcion::query()->whereHas('mascota');

        if (! $user->isAdministrator()) {
            $pets->where('responsable_id', $user->id);
            $requests->whereHas('publicacion.mascota', fn ($query) => $query->where('responsable_id', $user->id));
            $adoptions->whereHas('mascota', fn ($query) => $query->where('responsable_id', $user->id));
            $appointments->whereHas('mascota', fn ($query) => $query->where('responsable_id', $user->id));
            $assignments->whereHas('mascota', fn ($query) => $query->where('responsable_id', $user->id));
            $publications->whereHas('mascota', fn ($query) => $query->where('responsable_id', $user->id));
        }

        $rows = [
            ['Indicador', 'Valor'],
            ['Mascotas bajo responsabilidad', $pets->count()],
            ['Publicaciones activas', (clone $publications)->where('estado', 'publicada')->count()],
            ['Solicitudes pendientes', (clone $requests)->whereIn('estado', ['pendiente', 'en_revision'])->count()],
            ['Adopciones formalizadas', $adoptions->count()],
            ['Citas veterinarias', $appointments->count()],
            ['Asignaciones temporales', $assignments->count()],
        ];

        return response()->streamDownload(function () use ($rows) {
            $stream = fopen('php://output', 'w');
            fwrite($stream, "\xEF\xBB\xBF");
            foreach ($rows as $row) {
                fputcsv($stream, $row, ',', '"', '\\');
            }
            fclose($stream);
        }, 'petlink-resumen.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
