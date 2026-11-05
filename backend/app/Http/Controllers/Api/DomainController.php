<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Adopcion;
use App\Models\AsignacionHogar;
use App\Models\CitaVeterinaria;
use App\Models\Donacion;
use App\Models\EstadoMascota;
use App\Models\HistorialMedico;
use App\Models\HogarTemporal;
use App\Models\Mascota;
use App\Models\MascotaVacuna;
use App\Models\SeguimientoAdopcion;
use App\Models\User;
use App\Models\Vacuna;
use App\Models\Veterinario;
use App\Notifications\PetLinkNotification;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DomainController extends Controller
{
    public function appointments(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isRole('Administrador', 'Veterinario', 'Adoptante', 'Refugio'), 403);
        $query = CitaVeterinaria::with(['mascota:id,nombre', 'veterinario.usuario:id,name']);
        if ($user->isRole('Veterinario')) {
            abort_unless($user->veterinario, 403, 'No hay un perfil veterinario asociado a esta cuenta.');
            $query->where('veterinario_id', $user->veterinario->id);
        } elseif (! $user->isAdministrator()) {
            $query->where(fn ($q) => $q->where('solicitada_por', $user->id)->orWhereHas('mascota', fn ($pet) => $pet->where('responsable_id', $user->id)));
        }
        return response()->json($query->orderBy('programada_en')->paginate(20));
    }

    public function bookAppointment(Request $request)
    {
        $data = $request->validate([
            'mascota_id' => ['required', 'exists:mascotas,id'],
            'veterinario_id' => ['required', 'exists:veterinarios,id'],
            'programada_en' => ['required', 'date', 'after:now'],
            'duracion_minutos' => ['sometimes', 'integer', 'min:15', 'max:180'],
            'motivo' => ['nullable', 'string', 'max:180'],
        ]);
        $pet = Mascota::findOrFail($data['mascota_id']);
        $user = $request->user();
        abort_unless($user->isRole('Adoptante', 'Refugio', 'Administrador'), 403);
        if ($user->isRole('Adoptante')) {
            abort_unless($pet->publicacion()->where('estado', 'publicada')->exists() || $pet->adopcion()->where('adoptante_id', $user->id)->exists(), 403);
        } elseif ($user->isRole('Refugio')) {
            abort_unless($pet->responsable_id === $user->id, 403);
        }
        $start = Carbon::parse($data['programada_en']);
        $duration = (int) ($data['duracion_minutos'] ?? 30);
        $end = $start->copy()->addMinutes($duration);
        $appointment = DB::transaction(function () use ($data, $user, $pet, $start, $duration, $end) {
            $veterinarian = Veterinario::whereKey($data['veterinario_id'])->where('activo', true)->lockForUpdate()->firstOrFail();
            $conflict = CitaVeterinaria::where('veterinario_id', $veterinarian->id)
                ->whereIn('estado', ['programada', 'confirmada'])
                ->where('programada_en', '<', $end)
                ->whereRaw("programada_en + (duracion_minutos * interval '1 minute') > ?", [$start])
                ->exists();
            abort_if($conflict, 409, 'El veterinario ya tiene una cita en ese horario.');

            return CitaVeterinaria::create([
                'mascota_id' => $pet->id,
                'veterinario_id' => $veterinarian->id,
                'solicitada_por' => $user->id,
                'programada_en' => $start,
                'duracion_minutos' => $duration,
                'estado' => 'programada',
                'motivo' => $data['motivo'] ?? null,
            ]);
        });
        $appointment->load('veterinario.usuario')->veterinario?->usuario?->notify(new PetLinkNotification(
            'Nueva cita veterinaria',
            'Se solicitó una cita para '.$pet->nombre.'.',
            '/panel#agenda-veterinaria',
            'cita.solicitada',
        ));
        return response()->json(['cita' => $appointment->load(['mascota:id,nombre', 'veterinario.usuario:id,name'])], 201);
    }

    public function updateAppointment(Request $request, CitaVeterinaria $cita)
    {
        $user = $request->user();
        $isVet = $user->isRole('Veterinario') && $user->veterinario?->id === $cita->veterinario_id;
        abort_unless($user->isAdministrator() || $isVet || $cita->solicitada_por === $user->id, 403);
        $data = $request->validate([
            'estado' => ['sometimes', Rule::in(['confirmada', 'cancelada', 'realizada'])],
            'notas' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'programada_en' => ['sometimes', 'required', 'date', 'after:now'],
            'duracion_minutos' => ['sometimes', 'integer', 'min:15', 'max:180'],
            'motivo' => ['sometimes', 'nullable', 'string', 'max:180'],
        ]);
        $updated = DB::transaction(function () use ($request, $cita, $data, $user) {
            $lockedAppointment = CitaVeterinaria::whereKey($cita->id)->lockForUpdate()->firstOrFail();
            $isAssignedVet = $user->isRole('Veterinario') && $user->veterinario?->id === $lockedAppointment->veterinario_id;
            abort_unless($user->isAdministrator() || $isAssignedVet || $lockedAppointment->solicitada_por === $user->id, 403);

            if (isset($data['estado']) && ! ($user->isAdministrator() || $isAssignedVet) && $data['estado'] !== 'cancelada') {
                abort(403);
            }
            abort_if(isset($data['notas']) && ! ($user->isAdministrator() || $isAssignedVet), 403, 'Solo el veterinario asignado puede registrar notas clínicas.');
            if (isset($data['estado'])) {
                $transitions = [
                    'programada' => ['confirmada', 'cancelada', 'realizada'],
                    'confirmada' => ['cancelada', 'realizada'],
                ];
                abort_unless(in_array($data['estado'], $transitions[$lockedAppointment->estado] ?? [], true), 409, 'La cita ya no permite esa transición.');
            }
            if (isset($data['programada_en']) || isset($data['duracion_minutos'])) {
                abort_unless(in_array($lockedAppointment->estado, ['programada', 'confirmada'], true), 409, 'La cita ya no se puede reprogramar.');
                $veterinarian = Veterinario::whereKey($lockedAppointment->veterinario_id)->lockForUpdate()->firstOrFail();
                $start = isset($data['programada_en']) ? Carbon::parse($data['programada_en']) : $lockedAppointment->programada_en;
                $duration = (int) ($data['duracion_minutos'] ?? $lockedAppointment->duracion_minutos);
                $end = $start->copy()->addMinutes($duration);
                $conflict = CitaVeterinaria::where('veterinario_id', $veterinarian->id)
                    ->whereKeyNot($lockedAppointment->id)
                    ->whereIn('estado', ['programada', 'confirmada'])
                    ->where('programada_en', '<', $end)
                    ->whereRaw("programada_en + (duracion_minutos * interval '1 minute') > ?", [$start])
                    ->exists();
                abort_if($conflict, 409, 'El veterinario ya tiene una cita en ese horario.');
                $data['programada_en'] = $start;
                $data['duracion_minutos'] = $duration;
            }

            $lockedAppointment->update($data);
            if ($data !== []) {
                $lockedAppointment->load(['mascota:id,nombre', 'veterinario.usuario', 'solicitante']);
                $target = $lockedAppointment->solicitada_por === $user->id
                    ? $lockedAppointment->veterinario?->usuario
                    : $lockedAppointment->solicitante;
                $target?->notify(new PetLinkNotification(
                    'Cita veterinaria actualizada',
                    'La cita de '.$lockedAppointment->mascota?->nombre.' fue actualizada. Estado: '.$lockedAppointment->estado.'.',
                    $target?->isRole('Veterinario') ? '/panel#agenda-veterinaria' : '/panel#mis-citas',
                    'cita.actualizada',
                ));
            }

            return $lockedAppointment->fresh()->load(['mascota:id,nombre', 'veterinario.usuario:id,name']);
        });

        return response()->json(['cita' => $updated]);
    }

    public function medicalHistory(Request $request, Mascota $mascota)
    {
        abort_unless($this->canSeeMedicalHistory($request->user(), $mascota), 403);
        return response()->json([
            'registros' => $mascota->historialMedico()->with('autor:id,name')->orderByDesc('fecha_registro')->get(),
            'vacunas' => $mascota->vacunasAplicadas()->with('vacuna:id,nombre', 'veterinario.usuario:id,name')->orderByDesc('aplicada_en')->get(),
        ]);
    }

    public function addMedicalRecord(Request $request)
    {
        $data = $request->validate([
            'mascota_id' => ['required', 'exists:mascotas,id'],
            'tipo' => ['required', 'string', 'max:60'],
            'fecha_registro' => ['required', 'date', 'before_or_equal:today'],
            'titulo' => ['required', 'string', 'max:160'],
            'descripcion' => ['required', 'string', 'max:5000'],
        ]);
        $user = $request->user();
        abort_unless($user->isAdministrator() || ($user->isRole('Veterinario') && $user->veterinario), 403);
        $vetId = $user->isAdministrator() ? null : $user->veterinario->id;
        if ($vetId) {
            abort_unless(CitaVeterinaria::where('mascota_id', $data['mascota_id'])->where('veterinario_id', $vetId)->whereIn('estado', ['confirmada', 'realizada'])->exists(), 403, 'El veterinario necesita una cita confirmada o realizada para esta mascota.');
        }
        $record = HistorialMedico::create($data + ['registrado_por' => $user->id, 'veterinario_id' => $vetId]);
        return response()->json(['registro' => $record], 201);
    }

    public function vaccines()
    {
        return response()->json(['data' => Vacuna::where('activo', true)->orderBy('nombre')->get(['id', 'nombre', 'especie_recomendada', 'descripcion'])]);
    }

    public function createVaccine(Request $request)
    {
        abort_unless($request->user()->isAdministrator(), 403);
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:100', 'unique:vacunas,nombre'],
            'especie_recomendada' => ['nullable', 'string', 'max:60'],
            'descripcion' => ['nullable', 'string', 'max:3000'],
        ]);
        return response()->json(['vacuna' => Vacuna::create($data + ['activo' => true])], 201);
    }

    public function addVaccineApplication(Request $request)
    {
        $data = $request->validate([
            'mascota_id' => ['required', 'exists:mascotas,id'],
            'vacuna_id' => ['required', 'exists:vacunas,id'],
            'aplicada_en' => ['required', 'date', 'before_or_equal:today'],
            'refuerzo_en' => ['nullable', 'date', 'after:aplicada_en'],
            'lote' => ['nullable', 'string', 'max:80'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
        ]);
        $user = $request->user();
        abort_unless($user->isAdministrator() || ($user->isRole('Veterinario') && $user->veterinario), 403);
        $vetId = $user->isAdministrator() ? null : $user->veterinario->id;
        if ($vetId) {
            abort_unless(CitaVeterinaria::where('mascota_id', $data['mascota_id'])->where('veterinario_id', $vetId)->whereIn('estado', ['confirmada', 'realizada'])->exists(), 403);
        }
        $application = MascotaVacuna::create($data + ['veterinario_id' => $vetId]);
        return response()->json(['vacuna_aplicada' => $application->load('vacuna:id,nombre')], 201);
    }

    public function createVeterinarian(Request $request)
    {
        abort_unless($request->user()->isAdministrator(), 403);
        $data = $request->validate([
            'usuario_id' => ['required', 'exists:users,id', 'unique:veterinarios,usuario_id'],
            'numero_licencia' => ['required', 'string', 'max:60', 'unique:veterinarios,numero_licencia'],
            'especialidad' => ['nullable', 'string', 'max:100'],
            'clinica' => ['nullable', 'string', 'max:140'],
        ]);
        abort_unless(User::whereKey($data['usuario_id'])->whereHas('role', fn ($q) => $q->where('nombre', 'Veterinario'))->exists(), 422, 'El usuario seleccionado no tiene el rol de veterinario.');
        return response()->json(['veterinario' => Veterinario::create($data)], 201);
    }

    public function myHousehold(Request $request)
    {
        $user = $request->user();
        if ($user->isRole('Hogar temporal')) {
            $home = $user->hogarTemporal()->with(['asignaciones.mascota:id,nombre', 'direccion'])->first();
            return response()->json(['hogar' => $home]);
        }
        abort_unless($user->isAdministrator(), 403);
        return response()->json(['data' => HogarTemporal::with(['responsable:id,name,email', 'direccion'])->paginate(20)]);
    }

    public function availableHomes(Request $request)
    {
        abort_unless($request->user()->isRole('Administrador', 'Refugio'), 403);
        $query = HogarTemporal::with('responsable:id,name')
            ->withCount(['asignaciones as espacios_ocupados' => fn ($q) => $q->where('estado', 'activa')])
            ->where('activo', true)
            ->orderBy('id');
        $homes = $query->get()->map(fn ($home) => [
            'id' => $home->id,
            'responsable' => ['name' => $home->responsable?->name],
            'capacidad' => $home->capacidad,
            'espacios_ocupados' => $home->espacios_ocupados,
            'acepta_perros' => $home->acepta_perros,
            'acepta_gatos' => $home->acepta_gatos,
        ]);
        return response()->json(['data' => $homes]);
    }

    public function registerHousehold(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isRole('Hogar temporal'), 403);
        $data = $request->validate([
            'capacidad' => ['sometimes', 'integer', 'min:1', 'max:20'],
            'acepta_perros' => ['sometimes', 'boolean'],
            'acepta_gatos' => ['sometimes', 'boolean'],
            'notas' => ['nullable', 'string', 'max:2000'],
        ]);
        $home = HogarTemporal::updateOrCreate(['responsable_id' => $user->id], $data + ['activo' => true]);
        return response()->json(['hogar' => $home], 201);
    }

    public function assignments(Request $request)
    {
        $user = $request->user();
        $query = AsignacionHogar::with(['mascota:id,nombre', 'hogar.responsable:id,name']);
        if ($user->isRole('Hogar temporal')) {
            abort_unless($user->hogarTemporal, 403, 'Registra primero tu hogar temporal.');
            $query->where('hogar_id', $user->hogarTemporal->id);
        } elseif ($user->isRole('Refugio')) {
            $query->whereHas('mascota', fn ($q) => $q->where('responsable_id', $user->id));
        } elseif (! $user->isAdministrator()) {
            abort(403);
        }
        return response()->json($query->latest('inicio')->paginate(20));
    }

    public function assignToHousehold(Request $request)
    {
        $data = $request->validate([
            'hogar_id' => ['required', 'exists:hogares_temporales,id'],
            'mascota_id' => ['required', 'exists:mascotas,id'],
            'inicio' => ['required', 'date'],
            'fin' => ['nullable', 'date', 'after_or_equal:inicio'],
            'notas' => ['nullable', 'string', 'max:2000'],
        ]);
        $user = $request->user();
        abort_unless($user->isRole('Administrador', 'Refugio'), 403);
        $assignment = DB::transaction(function () use ($data, $user) {
            $pet = Mascota::whereKey($data['mascota_id'])->lockForUpdate()->firstOrFail();
            $home = HogarTemporal::whereKey($data['hogar_id'])->lockForUpdate()->firstOrFail();
            $pet->loadMissing('especie');
            abort_unless($user->isAdministrator() || $pet->responsable_id === $user->id, 403);
            abort_unless($home->activo && $pet->estado?->codigo !== 'adoptada', 409, 'La mascota o el hogar no está disponible para una asignación.');
            if ($pet->especie?->nombre === 'Perro') {
                abort_unless($home->acepta_perros, 409, 'Este hogar no acepta perros.');
            }
            if ($pet->especie?->nombre === 'Gato') {
                abort_unless($home->acepta_gatos, 409, 'Este hogar no acepta gatos.');
            }
            abort_if(AsignacionHogar::where('mascota_id', $pet->id)->where('estado', 'activa')->exists(), 409, 'La mascota ya tiene un hogar temporal activo.');
            abort_if(AsignacionHogar::where('hogar_id', $home->id)->where('estado', 'activa')->count() >= $home->capacidad, 409, 'El hogar temporal llegó a su capacidad.');
            return AsignacionHogar::create($data + ['asignada_por' => $user->id, 'estado' => 'activa']);
        });
        return response()->json(['asignacion' => $assignment->load(['mascota:id,nombre', 'hogar.responsable:id,name'])], 201);
    }

    public function closeAssignment(Request $request, AsignacionHogar $asignacion)
    {
        $user = $request->user();
        $ownHome = $user->isRole('Hogar temporal') && $user->hogarTemporal?->id === $asignacion->hogar_id;
        $petManager = $user->isRole('Refugio') && $asignacion->mascota()->where('responsable_id', $user->id)->exists();
        abort_unless($user->isAdministrator() || $ownHome || $petManager, 403);
        abort_unless($asignacion->estado === 'activa', 409);
        $asignacion->update(['estado' => 'finalizada', 'fin' => now()->toDateString()]);
        return response()->json(['asignacion' => $asignacion->fresh()]);
    }

    public function myDonations(Request $request)
    {
        $user = $request->user();
        $query = Donacion::with('refugio:id,nombre')->latest('donada_en');
        if ($user->isRole('Adoptante')) {
            $query->where('donante_id', $user->id);
        } elseif ($user->isRole('Refugio')) {
            $refugeId = $user->refugio?->id;
            $query->where('refugio_id', $refugeId ?? 0);
        } elseif (! $user->isAdministrator()) {
            abort(403);
        }
        return response()->json($query->paginate(20));
    }

    public function storeDonation(Request $request)
    {
        abort_unless($request->user()->isRole('Adoptante', 'Administrador'), 403);
        $data = $request->validate([
            'tipo_aporte' => ['required', Rule::in(['dinero', 'especie', 'servicio'])],
            'importe_cop' => ['required_if:tipo_aporte,dinero', 'nullable', 'numeric', 'min:0.01', 'max:999999999999.99'],
            'refugio_id' => ['nullable', 'exists:refugios,id'],
            'descripcion' => ['nullable', 'string', 'max:180'],
        ]);
        $donation = Donacion::create($data + ['donante_id' => $request->user()->id, 'estado' => 'registrada', 'donada_en' => now()]);
        return response()->json(['donacion' => $donation], 201);
    }

    public function followUps(Request $request)
    {
        $user = $request->user();
        $query = SeguimientoAdopcion::with(['adopcion.mascota:id,nombre', 'adopcion.adoptante:id,name']);
        if ($user->isRole('Adoptante')) {
            $query->whereHas('adopcion', fn ($q) => $q->where('adoptante_id', $user->id));
        } elseif ($user->isRole('Refugio')) {
            $query->whereHas('adopcion.mascota', fn ($q) => $q->where('responsable_id', $user->id));
        } elseif (! $user->isAdministrator()) {
            abort(403);
        }
        return response()->json($query->orderBy('fecha_programada')->paginate(20));
    }

    public function createFollowUp(Request $request, Adopcion $adopcion)
    {
        $user = $request->user();
        abort_unless($user->isAdministrator() || ($user->isRole('Refugio') && $adopcion->mascota()->where('responsable_id', $user->id)->exists()), 403);
        $data = $request->validate(['fecha_programada' => ['required', 'date'], 'observaciones' => ['nullable', 'string', 'max:3000']]);
        $followUp = SeguimientoAdopcion::create($data + ['adopcion_id' => $adopcion->id, 'registrado_por' => $user->id, 'resultado' => 'pendiente']);
        return response()->json(['seguimiento' => $followUp], 201);
    }

    public function updateFollowUp(Request $request, SeguimientoAdopcion $seguimiento)
    {
        $user = $request->user();
        $manager = $seguimiento->adopcion->mascota->responsable_id === $user->id && $user->isRole('Refugio');
        abort_unless($user->isAdministrator() || $manager, 403);
        $data = $request->validate([
            'resultado' => ['sometimes', Rule::in(['pendiente', 'completado', 'requiere_atencion'])],
            'fecha_realizada' => ['sometimes', 'nullable', 'date'],
            'observaciones' => ['sometimes', 'nullable', 'string', 'max:3000'],
        ]);
        $seguimiento->update($data);
        return response()->json(['seguimiento' => $seguimiento->fresh()]);
    }

    private function canSeeMedicalHistory(User $user, Mascota $pet): bool
    {
        if ($user->isAdministrator() || ($user->isRole('Refugio') && $pet->responsable_id === $user->id)) {
            return true;
        }
        if ($user->isRole('Adoptante') && $pet->adopcion()->where('adoptante_id', $user->id)->exists()) {
            return true;
        }
        if ($user->isRole('Veterinario') && $user->veterinario) {
            return CitaVeterinaria::where('mascota_id', $pet->id)
                ->where('veterinario_id', $user->veterinario->id)
                ->whereIn('estado', ['programada', 'confirmada', 'realizada'])
                ->exists();
        }
        return false;
    }
}

