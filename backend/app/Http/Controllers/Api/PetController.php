<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EstadoMascota;
use App\Models\Mascota;
use App\Models\Refugio;
use App\Models\Raza;
use App\Models\FotoMascota;
use App\Support\PetPhotoStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PetController extends Controller
{
    public function managed(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isRole('Administrador', 'Refugio'), 403);
        $query = Mascota::with(['especie:id,nombre,icono', 'raza:id,nombre', 'estado:id,codigo,nombre', 'fotos', 'publicacion:id,mascota_id,titulo,estado'])
            ->orderByDesc('created_at');
        if (! $user->isAdministrator()) {
            $query->where('responsable_id', $user->id);
        }
        $page = $query->paginate(20);
        $photoStorage = app(PetPhotoStorage::class);
        $page->getCollection()->each(fn (Mascota $pet) => $pet->fotos->each(
            fn (FotoMascota $photo) => $photo->setAttribute('url', $photoStorage->url($photo->ruta)),
        ));

        return response()->json($page);
    }

    public function index(Request $request)
    {
        $query = \App\Models\PublicacionAdopcion::query()
            ->with(['mascota.especie:id,nombre,icono', 'mascota.raza:id,nombre', 'mascota.estado:id,codigo,nombre', 'mascota.fotos', 'mascota.refugio:id,nombre,correo_contacto,telefono_contacto,direccion_id'])
            ->where('estado', 'publicada')
            ->whereHas('mascota.estado', fn ($q) => $q->where('codigo', 'disponible'));

        if ($search = trim((string) $request->query('q', ''))) {
            $query->whereHas('mascota', fn ($q) => $q->where('nombre', 'ilike', '%'.$search.'%'));
        }
        foreach (['especie_id', 'sexo', 'tamano'] as $filter) {
            if ($request->filled($filter)) {
                $query->whereHas('mascota', fn ($q) => $q->where($filter, $request->query($filter)));
            }
        }

        $page = $query->orderByDesc('publicada_en')->paginate(min(max((int) $request->query('per_page', 12), 1), 30));
        $page->getCollection()->transform(fn ($publication) => $this->presentPet($publication->mascota, $publication));
        return response()->json($page);
    }

    public function show(Request $request, Mascota $mascota)
    {
        $mascota->load(['especie:id,nombre,icono', 'raza:id,nombre', 'estado:id,codigo,nombre', 'fotos', 'refugio:id,nombre,correo_contacto,telefono_contacto,direccion_id', 'refugio.direccion:id,departamento,municipio', 'responsable:id,name']);
        if ($request->user()) {
            $this->authorize('view', $mascota);
        } else {
            abort_unless($mascota->publicacion?->estado === 'publicada' && $mascota->estado?->codigo === 'disponible', 404);
        }
        $private = $request->user()?->isAdministrator() || $mascota->responsable_id === $request->user()?->id;
        return response()->json(['mascota' => $this->presentPet($mascota, $mascota->publicacion, $private)]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Mascota::class);
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'especie_id' => ['required', 'exists:especies,id'],
            'raza_id' => ['nullable', 'exists:razas,id'],
            'edad_estimada_anios' => ['nullable', 'integer', 'min:0', 'max:40'],
            'fecha_nacimiento' => ['nullable', 'date', 'before_or_equal:today'],
            'sexo' => ['nullable', Rule::in(['hembra', 'macho', 'desconocido'])],
            'tamano' => ['nullable', Rule::in(['pequeno', 'mediano', 'grande'])],
            'descripcion' => ['nullable', 'string', 'max:5000'],
            'notas_salud' => ['nullable', 'string', 'max:5000'],
            'codigo_identificacion' => ['nullable', 'string', 'max:80', 'unique:mascotas,codigo_identificacion'],
            'refugio_id' => ['nullable', 'exists:refugios,id'],
        ]);
        $this->assertBreedMatchesSpecies($data['raza_id'] ?? null, $data['especie_id']);
        $refugioId = null;
        if ($request->user()->isRole('Refugio')) {
            $refugioId = Refugio::where('responsable_id', $request->user()->id)->value('id');
        } elseif ($request->user()->isAdministrator()) {
            $refugioId = $data['refugio_id'] ?? null;
        }
        $mascota = Mascota::create($data + [
            'estado_id' => EstadoMascota::where('codigo', 'disponible')->value('id'),
            'responsable_id' => $request->user()->id,
            'refugio_id' => $refugioId,
        ]);
        return response()->json(['mascota' => $mascota->load(['especie', 'raza', 'estado'])], 201);
    }

    public function update(Request $request, Mascota $mascota)
    {
        $this->authorize('update', $mascota);
        if ($mascota->adopcion()->exists()) {
            abort(409, 'Una mascota adoptada no se puede cambiar desde la ficha.');
        }
        $data = $request->validate([
            'nombre' => ['sometimes', 'required', 'string', 'max:100'],
            'especie_id' => ['sometimes', 'required', 'exists:especies,id'],
            'raza_id' => ['sometimes', 'nullable', 'exists:razas,id'],
            'edad_estimada_anios' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:40'],
            'fecha_nacimiento' => ['sometimes', 'nullable', 'date', 'before_or_equal:today'],
            'sexo' => ['sometimes', 'nullable', Rule::in(['hembra', 'macho', 'desconocido'])],
            'tamano' => ['sometimes', 'nullable', Rule::in(['pequeno', 'mediano', 'grande'])],
            'descripcion' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'notas_salud' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'estado_id' => ['sometimes', 'required', 'exists:estados_mascota,id', Rule::notIn([EstadoMascota::where('codigo', 'adoptada')->value('id')])],
        ]);
        $speciesId = $data['especie_id'] ?? $mascota->especie_id;
        $breedId = array_key_exists('raza_id', $data) ? $data['raza_id'] : $mascota->raza_id;
        $this->assertBreedMatchesSpecies($breedId, $speciesId);
        $mascota->update($data);
        return response()->json(['mascota' => $mascota->fresh()->load(['especie', 'raza', 'estado'])]);
    }

    public function uploadPhoto(Request $request, Mascota $mascota)
    {
        $this->authorize('update', $mascota);
        $data = $request->validate([
            'foto' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'texto_alternativo' => ['nullable', 'string', 'max:180'],
            'principal' => ['sometimes', 'boolean'],
        ]);
        $photoStorage = app(PetPhotoStorage::class);
        $path = $photoStorage->store($request->file('foto'), $mascota->id);
        abort_unless($path, 503, 'No fue posible guardar la fotografía. Intenta de nuevo.');
        $makePrimary = filter_var($data['principal'] ?? false, FILTER_VALIDATE_BOOLEAN);
        try {
            $photo = DB::transaction(function () use ($mascota, $path, $data, $makePrimary) {
                $lockedPet = Mascota::whereKey($mascota->id)->lockForUpdate()->firstOrFail();
                if ($makePrimary) {
                    $lockedPet->fotos()->update(['principal' => false]);
                }
                return $lockedPet->fotos()->create([
                    'ruta' => $path,
                    'texto_alternativo' => $data['texto_alternativo'] ?? null,
                    'principal' => $makePrimary || ! $lockedPet->fotos()->exists(),
                    'orden' => (int) $lockedPet->fotos()->max('orden') + 1,
                ]);
            });
        } catch (\Throwable $exception) {
            $photoStorage->delete($path);
            throw $exception;
        }
        return response()->json(['foto' => ['id' => $photo->id, 'url' => $photoStorage->url($photo->ruta), 'principal' => $photo->principal]], 201);
    }

    public function setPrimaryPhoto(Request $request, Mascota $mascota, int $foto)
    {
        $this->authorize('update', $mascota);
        abort_if($mascota->adopcion()->exists(), 409, 'Las fotografías de una mascota adoptada no se pueden modificar.');
        $photo = $mascota->fotos()->whereKey($foto)->firstOrFail();

        DB::transaction(function () use ($mascota, $photo) {
            Mascota::whereKey($mascota->id)->lockForUpdate()->firstOrFail();
            $mascota->fotos()->update(['principal' => false]);
            $photo->update(['principal' => true]);
        });

        return response()->json(['message' => 'Fotografía principal actualizada.']);
    }

    public function deletePhoto(Request $request, Mascota $mascota, int $foto)
    {
        $this->authorize('update', $mascota);
        abort_if($mascota->adopcion()->exists(), 409, 'Las fotografías de una mascota adoptada no se pueden modificar.');
        $photo = $mascota->fotos()->whereKey($foto)->firstOrFail();
        $photoStorage = app(PetPhotoStorage::class);

        if (! $photoStorage->delete($photo->ruta)) {
            abort(503, 'No fue posible eliminar el archivo de fotografía.');
        }
        $wasPrimary = $photo->principal;
        $photo->delete();
        if ($wasPrimary) {
            $mascota->fotos()->orderBy('orden')->first()?->update(['principal' => true]);
        }

        return response()->json(['message' => 'Fotografía eliminada.']);
    }

    private function assertBreedMatchesSpecies(?int $breedId, int $speciesId): void
    {
        if ($breedId && ! Raza::whereKey($breedId)->where('especie_id', $speciesId)->exists()) {
            abort(422, 'La raza seleccionada no pertenece a la especie indicada.');
        }
    }

    private function presentPet(Mascota $pet, $publication = null, bool $includePrivate = false): array
    {
        $photoStorage = app(PetPhotoStorage::class);
        $mainPhoto = $pet->fotos->firstWhere('principal', true) ?? $pet->fotos->first();
        $photoUrl = $mainPhoto ? $photoStorage->url($mainPhoto->ruta) : null;
        return [
            'id' => $pet->id,
            'publicacion_id' => $publication?->id,
            'nombre' => $pet->nombre,
            'especie' => $pet->especie,
            'raza' => $pet->raza,
            'sexo' => $pet->sexo,
            'tamano' => $pet->tamano,
            'edad_estimada_anios' => $pet->edad_estimada_anios,
            'descripcion' => $pet->descripcion,
            'estado' => $pet->estado,
            'fotografia' => $photoUrl,
            'fotos' => $pet->fotos->map(fn ($photo) => ['id' => $photo->id, 'url' => $photoStorage->url($photo->ruta), 'texto_alternativo' => $photo->texto_alternativo, 'principal' => $photo->principal])->values(),
            'refugio' => $pet->refugio ? ['nombre' => $pet->refugio->nombre, 'correo_contacto' => $pet->refugio->correo_contacto, 'telefono_contacto' => $pet->refugio->telefono_contacto, 'municipio' => $pet->refugio->direccion?->municipio, 'departamento' => $pet->refugio->direccion?->departamento] : null,
            'responsable' => $pet->responsable?->name,
            'notas_salud' => $includePrivate ? $pet->notas_salud : null,
            'created_at' => $pet->created_at,
        ];
    }
}

