<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\Mascota;
use App\Models\FotoMascota;
use App\Models\Especie;
use App\Models\EstadoMascota;
use App\Models\HogarTemporal;
use App\Models\AsignacionHogar;
use App\Models\PublicacionAdopcion;
use App\Models\SolicitudAdopcion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Http\UploadedFile;
use App\Notifications\PetLinkNotification;
use Tests\TestCase;

class PetLinkApiTest extends TestCase
{
    use RefreshDatabase;

    private array $demoPasswords = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->demoPasswords = [
            'admin' => bin2hex(random_bytes(24)),
            'adopter' => bin2hex(random_bytes(24)),
            'shelter' => bin2hex(random_bytes(24)),
            'veterinarian' => bin2hex(random_bytes(24)),
            'foster' => bin2hex(random_bytes(24)),
        ];
        config(['petlink.demo_passwords' => $this->demoPasswords]);
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
        $password = bin2hex(random_bytes(24));
        $response = $this->postJson('/api/auth/registro', [
            'name' => 'Ana Ejemplo',
            'email' => 'ana@example.test',
            'password' => $password,
            'password_confirmation' => $password,
        ]);

        $response->assertCreated()->assertJsonPath('user.role.nombre', 'Adoptante')->assertJsonStructure(['token', 'user' => ['id', 'email', 'role']]);
        $this->assertDatabaseHas('users', ['email' => 'ana@example.test']);
        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $response->json('user.id')]);
    }

    public function test_login_checks_password_and_returns_user_profile(): void
    {
        $response = $this->postJson('/api/auth/iniciar-sesion', [
            'email' => 'adoptante@petlink.test',
            'password' => $this->demoPasswords['adopter'],
        ]);

        $response->assertOk()->assertJsonPath('user.role.nombre', 'Adoptante')->assertJsonStructure(['token']);
        $this->assertArrayNotHasKey('password', $response->json('user'));
        $this->postJson('/api/auth/iniciar-sesion', ['email' => 'adoptante@petlink.test', 'password' => 'wrong-password'])->assertUnprocessable();
    }

    public function test_all_five_demo_accounts_can_log_in_with_hashed_passwords(): void
    {
        $accounts = [
            ['admin@petlink.test', $this->demoPasswords['admin'], 'Administrador'],
            ['adoptante@petlink.test', $this->demoPasswords['adopter'], 'Adoptante'],
            ['refugio@petlink.test', $this->demoPasswords['shelter'], 'Refugio'],
            ['veterinario@petlink.test', $this->demoPasswords['veterinarian'], 'Veterinario'],
            ['hogar@petlink.test', $this->demoPasswords['foster'], 'Hogar temporal'],
        ];

        foreach ($accounts as [$email, $password, $role]) {
            $user = User::where('email', $email)->firstOrFail();
            $this->assertTrue(Hash::check($password, $user->password));
            $this->postJson('/api/auth/iniciar-sesion', compact('email', 'password'))
                ->assertOk()
                ->assertJsonPath('user.role.nombre', $role)
                ->assertJsonMissingPath('user.password');
        }
    }

    public function test_only_administrators_can_open_user_administration(): void
    {
        $adopter = User::where('email', 'adoptante@petlink.test')->firstOrFail();
        $this->actingAs($adopter, 'sanctum')->getJson('/api/usuarios')->assertForbidden();

        $administrator = User::whereHas('role', fn ($query) => $query->where('nombre', 'Administrador'))->firstOrFail();
        $this->actingAs($administrator, 'sanctum')->getJson('/api/usuarios')->assertOk();
    }

    public function test_users_cannot_change_their_role_through_profile_and_admin_cannot_demote_self(): void
    {
        $adopter = User::where('email', 'adoptante@petlink.test')->firstOrFail();
        $adminRoleId = Role::where('nombre', 'Administrador')->value('id');
        $this->actingAs($adopter, 'sanctum')->putJson('/api/auth/perfil', ['role_id' => $adminRoleId])->assertOk();
        $this->assertSame('Adoptante', $adopter->fresh()->role->nombre);

        $administrator = User::where('email', 'admin@petlink.test')->firstOrFail();
        $this->actingAs($administrator, 'sanctum')->patchJson('/api/usuarios/'.$administrator->id, ['role_id' => $adopter->role_id])->assertStatus(409);
        $this->assertSame('Administrador', $administrator->fresh()->role->nombre);
    }

    public function test_administrator_cannot_deactivate_own_account(): void
    {
        $administrator = User::where('email', 'admin@petlink.test')->firstOrFail();
        $this->actingAs($administrator, 'sanctum')->patchJson('/api/usuarios/'.$administrator->id, ['activo' => false])->assertStatus(409);
        $this->assertTrue($administrator->fresh()->activo);
    }

    public function test_demo_seeder_is_idempotent_and_preserves_existing_accounts(): void
    {
        $admin = User::where('email', 'admin@petlink.test')->firstOrFail();
        $existingPassword = bin2hex(random_bytes(24));
        $admin->update(['name' => 'Nombre existente', 'password' => $existingPassword]);
        $userCount = User::count();
        $petCount = Mascota::count();

        $this->seed();

        $this->assertSame('Nombre existente', $admin->fresh()->name);
        $this->assertTrue(Hash::check($existingPassword, $admin->fresh()->password));
        $this->assertSame($userCount, User::count());
        $this->assertSame($petCount, Mascota::count());
    }

    public function test_each_demo_account_receives_its_own_dashboard_payload(): void
    {
        $expected = [
            ['admin@petlink.test', 'Administrador', 'usuarios'],
            ['adoptante@petlink.test', 'Adoptante', 'solicitudes'],
            ['refugio@petlink.test', 'Refugio', 'publicaciones_activas'],
            ['veterinario@petlink.test', 'Veterinario', 'citas_proximas'],
            ['hogar@petlink.test', 'Hogar temporal', 'asignaciones_activas'],
        ];

        foreach ($expected as [$email, $role, $stat]) {
            $this->actingAs(User::where('email', $email)->firstOrFail(), 'sanctum')
                ->getJson('/api/panel')
                ->assertOk()
                ->assertJsonPath('dashboard.role', $role)
                ->assertJsonStructure(['dashboard' => ['stats' => [$stat]]]);
        }
        $this->assertDatabaseHas('adopciones', ['mascota_id' => Mascota::where('codigo_identificacion', 'DEMO-PL-004')->value('id')]);
        $this->assertDatabaseHas('asignaciones_hogar', ['mascota_id' => Mascota::where('codigo_identificacion', 'DEMO-PL-005')->value('id'), 'estado' => 'activa']);
    }

    public function test_logout_revokes_the_bearer_token(): void
    {
        $login = $this->postJson('/api/auth/iniciar-sesion', ['email' => 'adoptante@petlink.test', 'password' => $this->demoPasswords['adopter']])->assertOk();
        $token = $login->json('token');
        $this->withToken($token)->postJson('/api/auth/cerrar-sesion')->assertOk();
        $this->withToken($token)->getJson('/api/auth/usuario')->assertUnauthorized();
    }

    public function test_veterinarian_cannot_view_or_create_donations(): void
    {
        $veterinarian = User::where('email', 'veterinario@petlink.test')->firstOrFail();
        $this->actingAs($veterinarian, 'sanctum')->getJson('/api/donaciones')->assertForbidden();
        $this->actingAs($veterinarian, 'sanctum')->postJson('/api/donaciones', ['tipo_aporte' => 'dinero', 'importe_cop' => 1000])->assertForbidden();
    }

    public function test_authorized_adopter_shelter_vet_and_foster_operations_succeed(): void
    {
        $adopter = $this->makeUser('Adoptante', 'adopter-action@example.test');
        $publication = PublicacionAdopcion::whereHas('mascota', fn ($query) => $query->where('codigo_identificacion', 'DEMO-PL-001'))->firstOrFail();
        $this->actingAs($adopter, 'sanctum')->postJson('/api/publicaciones/'.$publication->id.'/solicitudes', ['motivacion' => 'Quiero ofrecerle un hogar.'])->assertCreated();
        $this->assertDatabaseHas('solicitudes_adopcion', ['publicacion_id' => $publication->id, 'adoptante_id' => $adopter->id]);

        $refuge = User::where('email', 'refugio@petlink.test')->firstOrFail();
        $pet = $this->actingAs($refuge, 'sanctum')->postJson('/api/mascotas', [
            'nombre' => 'Nueva mascota de refugio',
            'especie_id' => Especie::where('nombre', 'Perro')->value('id'),
            'sexo' => 'desconocido',
            'tamano' => 'mediano',
        ])->assertCreated()->json('mascota');
        $this->actingAs($refuge, 'sanctum')->postJson('/api/mascotas/'.$pet['id'].'/publicaciones', ['titulo' => 'Una nueva oportunidad'])->assertCreated();

        $veterinarian = User::where('email', 'veterinario@petlink.test')->firstOrFail();
        $authorizedPet = Mascota::where('codigo_identificacion', 'DEMO-PL-001')->firstOrFail();
        $this->actingAs($veterinarian, 'sanctum')->postJson('/api/historial-medico', [
            'mascota_id' => $authorizedPet->id,
            'tipo' => 'consulta',
            'fecha_registro' => now()->toDateString(),
            'titulo' => 'Atención autorizada de prueba',
            'descripcion' => 'Registro de consulta para verificar el permiso.',
        ])->assertCreated();

        $foster = User::where('email', 'hogar@petlink.test')->firstOrFail();
        $ownAssignment = AsignacionHogar::where('hogar_id', $foster->hogarTemporal->id)->where('estado', 'activa')->firstOrFail();
        $this->actingAs($foster, 'sanctum')->patchJson('/api/asignaciones-hogar/'.$ownAssignment->id.'/finalizar')->assertOk();
        $this->assertDatabaseHas('asignaciones_hogar', ['id' => $ownAssignment->id, 'estado' => 'finalizada']);
    }

    public function test_adopter_cannot_manage_pets_or_review_someone_elses_request(): void
    {
        $adopter = User::where('email', 'adoptante@petlink.test')->firstOrFail();
        $this->actingAs($adopter, 'sanctum')->postJson('/api/mascotas', ['nombre' => 'Intruso', 'especie_id' => 1])->assertForbidden();

        $otherAdopter = $this->makeUser('Adoptante', 'otro-adoptante@example.test');
        $publication = PublicacionAdopcion::whereHas('mascota', fn ($query) => $query->where('codigo_identificacion', 'DEMO-PL-001'))->firstOrFail();
        $request = SolicitudAdopcion::create(['publicacion_id' => $publication->id, 'adoptante_id' => $otherAdopter->id, 'estado' => 'pendiente']);
        $this->actingAs($adopter, 'sanctum')->patchJson('/api/solicitudes/'.$request->id, ['estado' => 'rechazada'])->assertForbidden();
        $this->actingAs($adopter, 'sanctum')->getJson('/api/mis-solicitudes')->assertJsonMissing(['id' => $request->id]);
    }

    public function test_refuge_cannot_view_or_change_another_refuges_pet(): void
    {
        $refuge = User::where('email', 'refugio@petlink.test')->firstOrFail();
        $otherRefuge = $this->makeUser('Refugio', 'otro-refugio@example.test');
        $species = Especie::where('nombre', 'Perro')->firstOrFail();
        $state = EstadoMascota::where('codigo', 'disponible')->firstOrFail();
        $pet = Mascota::create(['nombre' => 'Mascota privada', 'especie_id' => $species->id, 'estado_id' => $state->id, 'responsable_id' => $otherRefuge->id]);

        $this->actingAs($refuge, 'sanctum')->getJson('/api/mis-mascotas')->assertOk()->assertJsonMissing(['id' => $pet->id]);
        $this->actingAs($refuge, 'sanctum')->putJson('/api/mascotas/'.$pet->id, ['nombre' => 'Cambiada'])->assertForbidden();
    }

    public function test_veterinarian_cannot_read_or_write_medical_records_without_an_authorized_appointment(): void
    {
        $veterinarian = User::where('email', 'veterinario@petlink.test')->firstOrFail();
        $unauthorizedPet = Mascota::where('codigo_identificacion', 'DEMO-PL-002')->firstOrFail();
        $this->actingAs($veterinarian, 'sanctum')->getJson('/api/mascotas/'.$unauthorizedPet->id.'/historial-medico')->assertForbidden();
        $this->actingAs($veterinarian, 'sanctum')->postJson('/api/historial-medico', [
            'mascota_id' => $unauthorizedPet->id,
            'tipo' => 'consulta',
            'fecha_registro' => now()->toDateString(),
            'titulo' => 'Intento no autorizado',
            'descripcion' => 'Debe rechazarse.',
        ])->assertForbidden();
    }

    public function test_foster_only_sees_and_closes_its_own_assignments(): void
    {
        $foster = User::where('email', 'hogar@petlink.test')->firstOrFail();
        $otherFoster = $this->makeUser('Hogar temporal', 'otro-hogar@example.test');
        $otherHome = HogarTemporal::create(['responsable_id' => $otherFoster->id, 'capacidad' => 1, 'acepta_perros' => true, 'acepta_gatos' => true, 'activo' => true]);
        $pet = Mascota::where('codigo_identificacion', 'DEMO-PL-003')->firstOrFail();
        $otherAssignment = AsignacionHogar::create(['hogar_id' => $otherHome->id, 'mascota_id' => $pet->id, 'asignada_por' => $pet->responsable_id, 'inicio' => now()->toDateString(), 'estado' => 'activa']);

        $this->actingAs($foster, 'sanctum')->getJson('/api/asignaciones-hogar')->assertOk()->assertJsonMissing(['id' => $otherAssignment->id]);
        $this->actingAs($foster, 'sanctum')->patchJson('/api/asignaciones-hogar/'.$otherAssignment->id.'/finalizar')->assertForbidden();
    }

    public function test_adoption_updates_notify_the_right_users_and_write_audit_logs(): void
    {
        $adopter = User::where('email', 'adoptante@petlink.test')->firstOrFail();
        $refuge = User::where('email', 'refugio@petlink.test')->firstOrFail();
        $publication = PublicacionAdopcion::whereHas('mascota', fn ($query) => $query->where('codigo_identificacion', 'DEMO-PL-001'))->firstOrFail();

        $this->actingAs($adopter, 'sanctum')->postJson('/api/publicaciones/'.$publication->id.'/solicitudes', ['motivacion' => 'Prueba de avisos y auditoría.'])->assertCreated();
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $refuge->id, 'type' => PetLinkNotification::class]);
        $this->assertDatabaseHas('audit_logs', ['actor_id' => $adopter->id, 'action' => 'POST api/publicaciones/{publicacion}/solicitudes']);

        $solicitud = SolicitudAdopcion::where('publicacion_id', $publication->id)->where('adoptante_id', $adopter->id)->firstOrFail();
        $this->actingAs($refuge, 'sanctum')->patchJson('/api/solicitudes/'.$solicitud->id, ['estado' => 'en_revision'])->assertOk();
        $this->actingAs($refuge, 'sanctum')->patchJson('/api/solicitudes/'.$solicitud->id, ['estado' => 'aprobada'])->assertOk();
        $this->actingAs($refuge, 'sanctum')->postJson('/api/solicitudes/'.$solicitud->id.'/formalizar')->assertCreated();
        $this->assertDatabaseHas('adopciones', ['solicitud_id' => $solicitud->id, 'adoptante_id' => $adopter->id]);

        $this->actingAs($adopter, 'sanctum')->getJson('/api/notificaciones')->assertOk()->assertJsonPath('unread_count', 3);
        $this->actingAs($refuge, 'sanctum')->getJson('/api/notificaciones')->assertOk()->assertJsonPath('unread_count', 1);
        $this->actingAs($refuge, 'sanctum')->getJson('/api/auditoria')->assertForbidden();
        $admin = User::where('email', 'admin@petlink.test')->firstOrFail();
        $this->actingAs($admin, 'sanctum')->getJson('/api/auditoria')->assertOk();
        $this->assertDatabaseHas('audit_logs', ['actor_id' => $refuge->id, 'action' => 'POST api/solicitudes/{solicitud}/formalizar']);
    }

    public function test_report_csv_is_limited_to_administrators_and_refuges(): void
    {
        $admin = User::where('email', 'admin@petlink.test')->firstOrFail();
        $refuge = User::where('email', 'refugio@petlink.test')->firstOrFail();
        $adopter = User::where('email', 'adoptante@petlink.test')->firstOrFail();

        $this->actingAs($admin, 'sanctum')->get('/api/reportes/resumen.csv')->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->actingAs($refuge, 'sanctum')->get('/api/reportes/resumen.csv')->assertOk();
        $this->actingAs($adopter, 'sanctum')->getJson('/api/reportes/resumen.csv')->assertForbidden();
    }

    public function test_veterinary_appointment_events_notify_the_assigned_vet_and_requester(): void
    {
        $adopter = User::where('email', 'adoptante@petlink.test')->firstOrFail();
        $vetUser = User::where('email', 'veterinario@petlink.test')->firstOrFail();
        $vet = $vetUser->veterinario;
        $pet = Mascota::where('codigo_identificacion', 'DEMO-PL-001')->firstOrFail();
        $scheduledAt = now()->addDays(30)->setTime(11, 0)->toIso8601String();

        $appointment = $this->actingAs($adopter, 'sanctum')->postJson('/api/citas', [
            'mascota_id' => $pet->id,
            'veterinario_id' => $vet->id,
            'programada_en' => $scheduledAt,
            'motivo' => 'Control preventivo',
        ])->assertCreated()->json('cita');
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $vetUser->id, 'type' => PetLinkNotification::class]);

        $this->actingAs($vetUser, 'sanctum')->patchJson('/api/citas/'.$appointment['id'], ['estado' => 'confirmada'])->assertOk();
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $adopter->id, 'type' => PetLinkNotification::class]);
        $this->assertDatabaseHas('citas_veterinarias', ['id' => $appointment['id'], 'estado' => 'confirmada']);
    }

    public function test_photo_upload_primary_selection_and_deletion_are_scoped_to_owned_pets(): void
    {
        Storage::fake('public');
        config(['petlink.pet_photo_disk' => 'public']);
        $refuge = User::where('email', 'refugio@petlink.test')->firstOrFail();
        $pet = Mascota::where('codigo_identificacion', 'DEMO-PL-001')->firstOrFail();

        $response = $this->actingAs($refuge, 'sanctum')->postJson('/api/mascotas/'.$pet->id.'/fotos', [
            'foto' => UploadedFile::fake()->image('pet.jpg'),
            'principal' => true,
        ])->assertCreated();
        $photo = FotoMascota::findOrFail($response->json('foto.id'));
        Storage::disk('public')->assertExists($photo->ruta);
        $second = $this->actingAs($refuge, 'sanctum')->postJson('/api/mascotas/'.$pet->id.'/fotos', [
            'foto' => UploadedFile::fake()->image('pet-second.jpg'),
        ])->assertCreated();
        $secondPhoto = FotoMascota::findOrFail($second->json('foto.id'));
        $this->actingAs($refuge, 'sanctum')->patchJson('/api/mascotas/'.$pet->id.'/fotos/'.$secondPhoto->id.'/principal')->assertOk();
        $this->assertDatabaseHas('fotos_mascota', ['id' => $photo->id, 'principal' => false]);
        $this->assertDatabaseHas('fotos_mascota', ['id' => $secondPhoto->id, 'principal' => true]);
        $this->actingAs($refuge, 'sanctum')->deleteJson('/api/mascotas/'.$pet->id.'/fotos/'.$photo->id)->assertOk();
        $this->assertDatabaseMissing('fotos_mascota', ['id' => $photo->id]);
        Storage::disk('public')->assertMissing($photo->ruta);
        $this->actingAs($refuge, 'sanctum')->deleteJson('/api/mascotas/'.$pet->id.'/fotos/'.$secondPhoto->id)->assertOk();
    }

    public function test_password_recovery_sends_a_link_without_revealing_account_existence(): void
    {
        Notification::fake();
        $user = User::where('email', 'adoptante@petlink.test')->firstOrFail();

        $known = $this->postJson('/api/auth/recuperar-contrasena', ['email' => $user->email])->assertOk();
        $unknown = $this->postJson('/api/auth/recuperar-contrasena', ['email' => 'missing@example.test'])->assertOk();
        $this->assertSame($known->json('message'), $unknown->json('message'));
        Notification::assertSentTo($user, ResetPassword::class);

        $token = Password::createToken($user);
        $this->postJson('/api/auth/restablecer-contrasena', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'NuevaClave2026!',
            'password_confirmation' => 'NuevaClave2026!',
        ])->assertOk();
        $this->assertTrue(Hash::check('NuevaClave2026!', $user->fresh()->password));
    }

    private function makeUser(string $roleName, string $email): User
    {
        return User::create([
            'name' => 'Usuario de prueba',
            'email' => $email,
            'role_id' => Role::where('nombre', $roleName)->value('id'),
            'activo' => true,
            'password' => 'PetLinkTest2026!',
        ]);
    }
}
