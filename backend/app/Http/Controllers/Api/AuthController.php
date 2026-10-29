<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Direccion;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'confirmed', Password::min(10)->letters()->numbers()],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => mb_strtolower($data['email']),
            'telefono' => $data['telefono'] ?? null,
            'role_id' => Role::where('nombre', 'Adoptante')->value('id'),
            'activo' => true,
            'password' => $data['password'],
        ]);

        return $this->tokenResponse($user, 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', mb_strtolower($data['email']))->first();
        if (! $user || ! Hash::check($data['password'], $user->password) || ! $user->activo) {
            throw ValidationException::withMessages(['email' => ['El correo o la contraseña no son válidos.']]);
        }

        return $this->tokenResponse($user);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['message' => 'Sesión cerrada.']);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()->load('role:id,nombre')]);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email:rfc', 'max:255', 'unique:users,email,'.$request->user()->id],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:30'],
            'direccion' => ['sometimes', 'array:departamento,municipio,direccion_linea,barrio,codigo_postal'],
            'direccion.departamento' => ['required_with:direccion', 'string', 'max:80'],
            'direccion.municipio' => ['required_with:direccion', 'string', 'max:100'],
            'direccion.direccion_linea' => ['required_with:direccion', 'string', 'max:180'],
            'direccion.barrio' => ['nullable', 'string', 'max:100'],
            'direccion.codigo_postal' => ['nullable', 'string', 'max:12'],
        ]);
        if (isset($data['email'])) {
            $data['email'] = mb_strtolower($data['email']);
        }
        DB::transaction(function () use ($request, $data) {
            $user = $request->user();
            if (isset($data['direccion'])) {
                $addressData = $data['direccion'];
                $address = $user->direccion;
                if ($address) {
                    $address->update($addressData);
                } else {
                    $address = Direccion::create($addressData);
                    $user->direccion_id = $address->id;
                }
                $user->unsetRelation('direccion');
            }
            unset($data['direccion']);
            $user->update($data);
            $user->save();
        });
        return response()->json(['user' => $request->user()->fresh()->load('role:id,nombre')]);
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(10)->letters()->numbers()],
        ]);
        if (! Hash::check($data['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages(['current_password' => ['La contraseña actual no coincide.']]);
        }

        $request->user()->update(['password' => $data['password']]);
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Contraseña actualizada. Inicia sesión de nuevo.']);
    }

    private function tokenResponse(User $user, int $status = 200)
    {
        return response()->json([
            'token' => $user->createToken('petlink-web')->plainTextToken,
            'user' => $user->load('role:id,nombre'),
        ], $status);
    }
}

