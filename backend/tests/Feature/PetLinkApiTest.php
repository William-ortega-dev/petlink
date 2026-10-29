<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PetLinkApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_public_catalog_returns_database_pets(): void
    {
        $this->getJson('/api/mascotas')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.estado.codigo', 'disponible');
    }

    public function test_registration_creates_an_adopter_and_returns_a_sanctum_token(): void
    {
        $response = $this->postJson('/api/auth/registro', [
            'name' => 'Ana Ejemplo',
            'email' => 'ana@example.test',
            'password' => 'Adopta2026!',
            'password_confirmation' => 'Adopta2026!',
        ]);

        $response->assertCreated()->assertJsonPath('user.role.nombre', 'Adoptante')->assertJsonStructure(['token', 'user' => ['id', 'email', 'role']]);
        $this->assertDatabaseHas('users', ['email' => 'ana@example.test']);
        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $response->json('user.id')]);
    }

    public function test_login_checks_password_and_returns_user_profile(): void
    {
        $response = $this->postJson('/api/auth/iniciar-sesion', [
            'email' => 'adoptante@petlink.local',
            'password' => 'PetLink2026!',
        ]);

        $response->assertOk()->assertJsonPath('user.role.nombre', 'Adoptante')->assertJsonStructure(['token']);
        $this->postJson('/api/auth/iniciar-sesion', ['email' => 'adoptante@petlink.local', 'password' => 'wrong-password'])->assertUnprocessable();
    }

    public function test_only_administrators_can_open_user_administration(): void
    {
        $adopter = User::where('email', 'adoptante@petlink.local')->firstOrFail();
        $this->actingAs($adopter, 'sanctum')->getJson('/api/usuarios')->assertForbidden();

        $administrator = User::whereHas('role', fn ($query) => $query->where('nombre', 'Administrador'))->firstOrFail();
        $this->actingAs($administrator, 'sanctum')->getJson('/api/usuarios')->assertOk();
    }
}
