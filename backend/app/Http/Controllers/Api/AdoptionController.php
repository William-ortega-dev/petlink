<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Adopcion;
use App\Models\EstadoMascota;
use App\Models\Mascota;
use App\Models\PublicacionAdopcion;
use App\Models\SeguimientoAdopcion;
use App\Models\SolicitudAdopcion;
use App\Notifications\PetLinkNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Illuminate\Validation\Rule;

class AdoptionController extends Controller
{
    public function mine(Request $request)
    {
        abort_unless($request->user()->isRole('Adoptante'), 403);
        $page = SolicitudAdopcion::with(['publicacion.mascota.especie:id,nombre', 'publicacion.mascota.fotos'])
            ->where('adoptante_id', $request->user()->id)->latest()->paginate(12);
        return response()->json($page);
    }

    public function apply(Request $request, PublicacionAdopcion $publicacion)
    {
        abort_unless($request->user()->isRole('Adoptante'), 403, 'Solo un perfil adoptante puede solicitar una adopción.');
        $data = $request->validate(['motivacion' => ['nullable', 'string', 'max:3000']]);
        try {
            $solicitud = DB::transaction(function () use ($request, $publicacion, $data) {
                $lockedPublication = PublicacionAdopcion::whereKey($publicacion->id)->lockForUpdate()->firstOrFail();
                $lockedPublication->load('mascota.estado');
                abort_unless($lockedPublication->estado === 'publicada' && $lockedPublication->mascota?->estado?->codigo === 'disponible', 409, 'La mascota ya no está disponible.');
                abort_if($lockedPublication->mascota->responsable_id === $request->user()->id, 403, 'No puedes solicitar la adopción de una mascota que administras.');
                abort_if(SolicitudAdopcion::where('publicacion_id', $lockedPublication->id)->where('adoptante_id', $request->user()->id)->exists(), 409, 'Ya presentaste una solicitud para esta mascota.');

                $solicitud = SolicitudAdopcion::create([
                    'publicacion_id' => $lockedPublication->id,
                    'adoptante_id' => $request->user()->id,
                    'motivacion' => $data['motivacion'] ?? null,
                    'estado' => 'pendiente',
                ]);
                $lockedPublication->mascota->responsable?->notify(new PetLinkNotification(
                    'Nueva solicitud de adopción',
                    'Una persona presentó una solicitud para '.$lockedPublication->mascota->nombre.'.',
                    '/panel#solicitudes-recibidas',
                    'solicitud.recibida',
                ));

                return $solicitud;
            });
        } catch (QueryException $exception) {
            if ($exception->getCode() === '23505') {
                abort(409, 'Ya presentaste una solicitud para esta mascota.');
            }
            throw $exception;
        }
        return response()->json(['solicitud' => $solicitud->load('publicacion.mascota:id,nombre')], 201);
    }

    public function forReview(Request $request)
    {
        abort_unless($request->user()->isRole('Administrador', 'Refugio'), 403);
        $query = SolicitudAdopcion::with(['publicacion.mascota:id,nombre,responsable_id,refugio_id', 'adoptante:id,name,email,telefono']);
        if (! $request->user()->isAdministrator()) {
            $query->whereHas('publicacion.mascota', fn ($q) => $q->where('responsable_id', $request->user()->id));
        }
        if ($request->filled('estado')) {
            $query->where('estado', $request->query('estado'));
        }
        return response()->json($query->latest()->paginate(20));
    }

    public function review(Request $request, SolicitudAdopcion $solicitud)
    {
        $this->authorize('review', $solicitud);
        $data = $request->validate([
            'estado' => ['required', Rule::in(['en_revision', 'aprobada', 'rechazada'])],
            'observacion_responsable' => ['nullable', 'string', 'max:3000'],
        ]);
        DB::transaction(function () use ($request, $solicitud, $data) {
            $lockedRequest = SolicitudAdopcion::whereKey($solicitud->id)->lockForUpdate()->firstOrFail();
            $publication = PublicacionAdopcion::whereKey($lockedRequest->publicacion_id)->lockForUpdate()->firstOrFail();
            $pet = Mascota::whereKey($publication->mascota_id)->lockForUpdate()->firstOrFail();
            $publication->setRelation('mascota', $pet);
            $lockedRequest->setRelation('publicacion', $publication);
            $this->authorize('review', $lockedRequest);
            $validTransitions = [
                'pendiente' => ['en_revision', 'rechazada'],
                'en_revision' => ['aprobada', 'rechazada'],
            ];
            if (! in_array($data['estado'], $validTransitions[$lockedRequest->estado] ?? [], true)) {
                abort(409, 'El estado de la solicitud no permite esa transición.');
            }
            $lockedRequest->update([
                'estado' => $data['estado'],
                'observacion_responsable' => $data['observacion_responsable'] ?? null,
                'revisada_por' => $request->user()->id,
                'revisada_en' => now(),
            ]);
            $lockedRequest->adoptante?->notify(new PetLinkNotification(
                'Actualización de solicitud',
                'Tu solicitud de adopción ahora está '.$data['estado'].'.',
                '/panel#mis-solicitudes',
                'solicitud.actualizada',
            ));
        });
        return response()->json(['solicitud' => $solicitud->fresh()->load(['publicacion.mascota:id,nombre', 'adoptante:id,name'])]);
    }

    public function formalize(Request $request, SolicitudAdopcion $solicitud)
    {
        $this->authorize('review', $solicitud);
        $adopcion = DB::transaction(function () use ($request, $solicitud) {
            $lockedRequest = SolicitudAdopcion::whereKey($solicitud->id)->lockForUpdate()->firstOrFail();
            abort_unless($lockedRequest->estado === 'aprobada', 409, 'La solicitud debe estar aprobada antes de formalizarla.');
            $publication = PublicacionAdopcion::whereKey($lockedRequest->publicacion_id)->lockForUpdate()->firstOrFail();
            $pet = Mascota::whereKey($publication->mascota_id)->lockForUpdate()->firstOrFail();
            $publication->setRelation('mascota', $pet);
            $lockedRequest->setRelation('publicacion', $publication);
            $this->authorize('review', $lockedRequest);
            abort_unless($publication->estado === 'publicada' && $pet->estado_id === EstadoMascota::where('codigo', 'disponible')->value('id'), 409, 'La mascota ya no está disponible para adopción.');
            abort_if(Adopcion::where('mascota_id', $pet->id)->exists(), 409, 'Esta mascota ya tiene una adopción formalizada.');

            $adopcion = Adopcion::create([
                'solicitud_id' => $lockedRequest->id,
                'mascota_id' => $pet->id,
                'adoptante_id' => $lockedRequest->adoptante_id,
                'formalizada_por' => $request->user()->id,
                'fecha_adopcion' => now()->timezone('America/Bogota')->toDateString(),
                'estado' => 'activa',
            ]);
            $pet->update(['estado_id' => EstadoMascota::where('codigo', 'adoptada')->value('id')]);
            $publication->update(['estado' => 'cerrada', 'cerrada_en' => now()]);
            $lockedRequest->update(['estado' => 'formalizada', 'revisada_por' => $request->user()->id, 'revisada_en' => now()]);
            $competingRequests = SolicitudAdopcion::where('publicacion_id', $publication->id)
                ->where('id', '!=', $lockedRequest->id)
                ->whereIn('estado', ['pendiente', 'en_revision', 'aprobada'])
                ->lockForUpdate()
                ->get();
            foreach ($competingRequests as $competingRequest) {
                $competingRequest->update([
                    'estado' => 'rechazada',
                    'observacion_responsable' => 'La mascota fue adoptada por otra familia.',
                    'revisada_por' => $request->user()->id,
                    'revisada_en' => now(),
                ]);
                $competingRequest->adoptante?->notify(new PetLinkNotification(
                    'Solicitud cerrada',
                    'La mascota '.$pet->nombre.' fue adoptada y tu solicitud se cerró.',
                    '/panel#mis-solicitudes',
                    'solicitud.actualizada',
                ));
            }
            SeguimientoAdopcion::create([
                'adopcion_id' => $adopcion->id,
                'registrado_por' => $request->user()->id,
                'fecha_programada' => now()->timezone('America/Bogota')->addDays(7)->toDateString(),
                'resultado' => 'pendiente',
                'observaciones' => 'Primer seguimiento después de la adopción.',
            ]);
            $lockedRequest->adoptante?->notify(new PetLinkNotification(
                'Adopción formalizada',
                'La adopción de '.$pet->nombre.' quedó formalizada. Ya puedes consultar tus seguimientos.',
                '/panel#mis-adopciones',
                'adopcion.formalizada',
            ));
            return $adopcion;
        });

        return response()->json(['adopcion' => $adopcion->load(['mascota:id,nombre', 'adoptante:id,name'])], 201);
    }

    public function adoptions(Request $request)
    {
        $query = Adopcion::with(['mascota:id,nombre', 'adoptante:id,name', 'seguimientos']);
        $user = $request->user();
        if ($user->isRole('Adoptante')) {
            $query->where('adoptante_id', $user->id);
        } elseif ($user->isRole('Refugio')) {
            $query->whereHas('mascota', fn ($q) => $q->where('responsable_id', $user->id));
        } else {
            abort_unless($user->isAdministrator(), 403);
        }
        return response()->json($query->latest('fecha_adopcion')->paginate(12));
    }
}

