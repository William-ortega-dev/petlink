<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Especie;
use App\Models\EstadoMascota;
use App\Models\Raza;
use App\Models\Refugio;
use App\Models\Role;
use App\Models\User;
use App\Models\Veterinario;
use Illuminate\Http\Request;
use App\Models\Direccion;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CatalogController extends Controller
{
    public function species(Request $request)
    {
        $query = Especie::query();
        if (! $request->user()?->isAdministrator()) {
            $query->where('activo', true);
        }
        return response()->json(['data' => $query->orderBy('nombre')->get(['id', 'nombre', 'icono', 'activo'])]);
    }

    public function petStates(Request $request)
    {
        return response()->json(['data' => EstadoMascota::orderBy('id')->get(['id', 'codigo', 'nombre', 'visible_publico'])]);
    }

    public function breeds(Request $request)
    {
        $query = Raza::with('especie:id,nombre')->orderBy('nombre');
        if (! $request->user()?->isAdministrator()) {
            $query->where('activo', true);
        }
        if ($request->filled('especie_id')) {
            $query->where('especie_id', $request->integer('especie_id'));
        }
        return response()->json(['data' => $query->get(['id', 'especie_id', 'nombre'])]);
    }

    public function refuges()
    {
        return response()->json(['data' => Refugio::with('direccion:id,departamento,municipio')->where('activo', true)->orderBy('nombre')->get(['id', 'nombre', 'correo_contacto', 'telefono_contacto', 'direccion_id', 'descripcion'])]);
    }

    public function veterinarians()
    {
        return response()->json(['data' => Veterinario::with('usuario:id,name')->where('activo', true)->orderBy('id')->get(['id', 'usuario_id', 'especialidad', 'clinica'])]);
    }

    public function storeSpecies(Request $request)
    {
        abort_unless($request->user()->isAdministrator(), 403);
        $data = $request->validate(['nombre' => ['required', 'string', 'max:60', 'unique:especies,nombre'], 'icono' => ['nullable', 'string', 'max:50']]);
        return response()->json(['especie' => Especie::create($data)], 201);
    }

    public function updateSpecies(Request $request, Especie $especie)
    {
        abort_unless($request->user()->isAdministrator(), 403);
        $data = $request->validate([
            'nombre' => ['sometimes', 'required', 'string', 'max:60', 'unique:especies,nombre,'.$especie->id],
            'icono' => ['sometimes', 'nullable', 'string', 'max:50'],
            'activo' => ['sometimes', 'required', 'boolean'],
        ]);
        $especie->update($data);
        return response()->json(['especie' => $especie->fresh()]);
    }

    public function storeBreed(Request $request)
    {
        abort_unless($request->user()->isAdministrator(), 403);
        $data = $request->validate(['especie_id' => ['required', 'exists:especies,id'], 'nombre' => ['required', 'string', 'max:80']]);
        $request->validate(['nombre' => ['unique:razas,nombre,NULL,id,especie_id,'.$data['especie_id']]]);
        return response()->json(['raza' => Raza::create($data)], 201);
    }

    public function updateBreed(Request $request, Raza $raza)
    {
        abort_unless($request->user()->isAdministrator(), 403);
        $data = $request->validate([
            'nombre' => ['sometimes', 'required', 'string', 'max:80', Rule::unique('razas', 'nombre')->where(fn ($query) => $query->where('especie_id', $raza->especie_id))->ignore($raza->id)],
            'activo' => ['sometimes', 'required', 'boolean'],
        ]);
        $raza->update($data);
        return response()->json(['raza' => $raza->fresh()]);
    }

    public function updatePetState(Request $request, EstadoMascota $estado)
    {
        abort_unless($request->user()->isAdministrator(), 403);
        $data = $request->validate([
            'nombre' => ['sometimes', 'required', 'string', 'max:60'],
            'visible_publico' => ['sometimes', 'required', 'boolean'],
        ]);
        $estado->update($data);
        return response()->json(['estado' => $estado->fresh()]);
    }

    public function storeRefuge(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isRole('Administrador', 'Refugio'), 403);
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:140'],
            'nit' => ['nullable', 'string', 'max:25', 'unique:refugios,nit'],
            'correo_contacto' => ['nullable', 'email', 'max:255'],
            'telefono_contacto' => ['nullable', 'string', 'max:30'],
            'descripcion' => ['nullable', 'string', 'max:3000'],
            'direccion' => ['nullable', 'array:departamento,municipio,direccion_linea,barrio,codigo_postal'],
            'direccion.departamento' => ['required_with:direccion', 'string', 'max:80'],
            'direccion.municipio' => ['required_with:direccion', 'string', 'max:100'],
            'direccion.direccion_linea' => ['required_with:direccion', 'string', 'max:180'],
            'direccion.barrio' => ['nullable', 'string', 'max:100'],
            'direccion.codigo_postal' => ['nullable', 'string', 'max:12'],
        ]);
        if (! $user->isAdministrator() && $user->refugio()->exists()) {
            abort(409, 'Este usuario ya administra un refugio.');
        }
        $refugio = DB::transaction(function () use ($data, $user) {
            $address = isset($data['direccion']) ? Direccion::create($data['direccion']) : null;
            unset($data['direccion']);
            return Refugio::create($data + ['responsable_id' => $user->id, 'direccion_id' => $address?->id]);
        });
        return response()->json(['refugio' => $refugio], 201);
    }

    public function users(Request $request)
    {
        abort_unless($request->user()->isAdministrator(), 403);
        $query = User::with('role:id,nombre')->orderBy('name');
        if ($request->filled('q')) {
            $needle = '%'.trim((string) $request->query('q')).'%';
            $query->where(fn ($q) => $q->where('name', 'ilike', $needle)->orWhere('email', 'ilike', $needle));
        }
        return response()->json($query->paginate(25));
    }

    public function updateUser(Request $request, User $usuario)
    {
        abort_unless($request->user()->isAdministrator(), 403);
        $data = $request->validate([
            'role_id' => ['sometimes', 'required', 'exists:roles,id'],
            'activo' => ['sometimes', 'required', 'boolean'],
        ]);
        DB::transaction(function () use ($data, $usuario, $request) {
            $usuario = User::whereKey($usuario->id)->lockForUpdate()->firstOrFail();
            abort_if($usuario->id === $request->user()->id && array_key_exists('role_id', $data), 409, 'No puedes cambiar tu propio rol.');
            abort_if($usuario->id === $request->user()->id && array_key_exists('activo', $data) && ! $data['activo'], 409, 'No puedes desactivar tu propia cuenta.');

            $adminRoleId = Role::where('nombre', 'Administrador')->value('id');
            $removesActiveAdmin = $usuario->role_id === $adminRoleId && $usuario->activo
                && ((array_key_exists('role_id', $data) && (int) $data['role_id'] !== (int) $adminRoleId)
                    || (array_key_exists('activo', $data) && ! $data['activo']));
            if ($removesActiveAdmin) {
                Role::whereKey($adminRoleId)->lockForUpdate()->firstOrFail();
                abort_if(User::where('role_id', $adminRoleId)->where('activo', true)->count() <= 1, 409, 'Debe quedar al menos un administrador activo.');
            }

            $usuario->update($data);
            if (array_key_exists('activo', $data) && ! $data['activo']) {
                $usuario->tokens()->delete();
            }
        });
        $usuario->refresh();
        return response()->json(['usuario' => $usuario->fresh()->load('role:id,nombre')]);
    }

    public function roles(Request $request)
    {
        abort_unless($request->user()->isAdministrator(), 403);
        return response()->json(['data' => Role::orderBy('nombre')->get(['id', 'nombre', 'descripcion'])]);
    }
}

