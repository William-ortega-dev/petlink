<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EstadoMascota;
use App\Models\Mascota;
use App\Models\PublicacionAdopcion;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PublicationController extends Controller
{
    public function store(Request $request, Mascota $mascota)
    {
        $this->authorize('update', $mascota);
        abort_unless($mascota->estado?->codigo === 'disponible' && ! $mascota->adopcion()->exists(), 409, 'Solo se publican mascotas disponibles.');
        $data = $request->validate([
            'titulo' => ['required', 'string', 'max:160'],
            'descripcion' => ['nullable', 'string', 'max:5000'],
        ]);
        if ($mascota->publicacion()->exists()) {
            abort(409, 'Esta mascota ya tiene una publicación.');
        }
        $publication = PublicacionAdopcion::create($data + [
            'mascota_id' => $mascota->id,
            'publicada_por' => $request->user()->id,
            'estado' => 'publicada',
            'publicada_en' => now(),
        ]);
        return response()->json(['publicacion' => $publication->load('mascota:id,nombre')], 201);
    }

    public function update(Request $request, PublicacionAdopcion $publicacion)
    {
        $publicacion->load('mascota.estado');
        $this->authorize('update', $publicacion->mascota);
        $data = $request->validate([
            'titulo' => ['sometimes', 'required', 'string', 'max:160'],
            'descripcion' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'estado' => ['sometimes', 'required', Rule::in(['publicada', 'cerrada'])],
        ]);
        if (($data['estado'] ?? null) === 'publicada' && $publicacion->mascota->estado?->codigo !== 'disponible') {
            abort(409, 'La publicación solo se puede abrir si la mascota está disponible.');
        }
        if (($data['estado'] ?? null) === 'cerrada') {
            $data['cerrada_en'] = now();
        } elseif (($data['estado'] ?? null) === 'publicada') {
            $data['cerrada_en'] = null;
        }
        $publicacion->update($data);
        return response()->json(['publicacion' => $publicacion->fresh()->load('mascota:id,nombre')]);
    }
}

