<?php

namespace Database\Seeders;

use App\Models\Direccion;
use App\Models\Adopcion;
use App\Models\AsignacionHogar;
use App\Models\CitaVeterinaria;
use App\Models\Donacion;
use App\Models\Especie;
use App\Models\EstadoMascota;
use App\Models\HogarTemporal;
use App\Models\HistorialMedico;
use App\Models\Mascota;
use App\Models\MascotaVacuna;
use App\Models\PublicacionAdopcion;
use App\Models\Raza;
use App\Models\Refugio;
use App\Models\Role;
use App\Models\SeguimientoAdopcion;
use App\Models\SolicitudAdopcion;
use App\Models\User;
use App\Models\Vacuna;
use App\Models\Veterinario;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $descripciones = [
            'Administrador' => 'Administración general de la plataforma.',
            'Adoptante' => 'Persona que busca adoptar y consultar sus procesos.',
            'Refugio' => 'Responsable de un refugio y sus publicaciones.',
            'Veterinario' => 'Profesional veterinario con acceso a registros autorizados.',
            'Hogar temporal' => 'Responsable de acogidas temporales.',
        ];
        foreach ($descripciones as $nombre => $descripcion) {
            Role::firstOrCreate(['nombre' => $nombre], ['descripcion' => $descripcion]);
        }

        foreach ([['Perro', '🐶'], ['Gato', '🐱']] as [$nombre, $icono]) {
            Especie::firstOrCreate(['nombre' => $nombre], ['icono' => $icono, 'activo' => true]);
        }
        foreach ([['Perro', 'Criollo'], ['Perro', 'Labrador'], ['Perro', 'Beagle'], ['Gato', 'Criollo'], ['Gato', 'Siamés']] as [$especie, $raza]) {
            Raza::firstOrCreate(['especie_id' => Especie::where('nombre', $especie)->value('id'), 'nombre' => $raza], ['activo' => true]);
        }
        foreach ([
            ['disponible', 'Disponible', true], ['en_acogida', 'En hogar temporal', true],
            ['en_proceso', 'En proceso de adopción', true], ['adoptada', 'Adoptada', false],
            ['atencion_medica', 'En atención médica', false],
        ] as [$codigo, $nombre, $visible]) {
            EstadoMascota::firstOrCreate(['codigo' => $codigo], ['nombre' => $nombre, 'visible_publico' => $visible]);
        }
        foreach (['Rabia', 'Triple felina', 'Parvovirus', 'Moquillo'] as $vacuna) {
            Vacuna::firstOrCreate(['nombre' => $vacuna], ['activo' => true]);
        }

        $isProduction = app()->environment(['production', 'prod']);
        $demoEnabled = ! $isProduction
            && (app()->environment(['local', 'testing']) || config('petlink.demo_accounts_enabled'));
        if (! $demoEnabled) {
            return;
        }

        $demoPasswords = config('petlink.demo_passwords', []);
        $accountDefinitions = [
            ['Administración PetLink', 'admin@petlink.test', 'Administrador', $demoPasswords['admin'] ?? null],
            ['Adoptante Demo', 'adoptante@petlink.test', 'Adoptante', $demoPasswords['adopter'] ?? null],
            ['Refugio Patitas Bogotá', 'refugio@petlink.test', 'Refugio', $demoPasswords['shelter'] ?? null],
            ['Veterinaria Demo', 'veterinario@petlink.test', 'Veterinario', $demoPasswords['veterinarian'] ?? null],
            ['Hogar Demo', 'hogar@petlink.test', 'Hogar temporal', $demoPasswords['foster'] ?? null],
        ];
        if (collect($accountDefinitions)->contains(fn ($account) => ! is_string($account[3]) || strlen($account[3]) < 16)) {
            return;
        }

        $address = Direccion::firstOrCreate(
            ['departamento' => 'Cundinamarca', 'municipio' => 'Bogotá'],
            ['direccion_linea' => 'Calle 10 # 5-20', 'barrio' => 'Centro'],
        );
        $users = [];
        foreach ($accountDefinitions as [$name, $email, $role, $password]) {
            $users[$role] = User::whereRaw('LOWER(email) = ?', [mb_strtolower($email)])->first()
                ?? User::firstOrCreate(
                    ['email' => $email],
                    ['name' => $name, 'role_id' => Role::where('nombre', $role)->value('id'), 'direccion_id' => $address->id, 'telefono' => '3000000000', 'activo' => true, 'password' => $password],
                );
        }

        foreach (['Administrador', 'Adoptante', 'Refugio', 'Veterinario', 'Hogar temporal'] as $expectedRole) {
            if (! $users[$expectedRole]->isRole($expectedRole)) {
                return;
            }
        }

        $shelterUser = $users['Refugio'];
        $legacyCodes = ['DEMO-PL-001', 'DEMO-PL-002', 'DEMO-PL-003', 'DEMO-PL-004', 'DEMO-PL-005'];
        $demoPrefix = Mascota::whereIn('codigo_identificacion', $legacyCodes)
            ->where('responsable_id', '!=', $shelterUser->id)
            ->exists() ? 'DEMO-PL-TEST-' : 'DEMO-PL-';
        $refugio = Refugio::firstOrCreate(
            ['responsable_id' => $shelterUser->id],
            ['nombre' => 'Refugio Patitas Bogotá', 'correo_contacto' => $shelterUser->email, 'telefono_contacto' => $shelterUser->telefono, 'direccion_id' => $address->id, 'descripcion' => 'Refugio de demostración para validar PetLink.'],
        );
        $demoLicense = Veterinario::where('numero_licencia', 'DEMO-MV-001')
            ->where('usuario_id', '!=', $users['Veterinario']->id)
            ->exists() ? 'DEMO-MV-TEST-001' : 'DEMO-MV-001';
        Veterinario::firstOrCreate(
            ['usuario_id' => $users['Veterinario']->id],
            ['numero_licencia' => $demoLicense, 'especialidad' => 'Medicina preventiva', 'clinica' => 'Clínica PetLink Demo', 'activo' => true],
        );
        HogarTemporal::firstOrCreate(
            ['responsable_id' => $users['Hogar temporal']->id],
            ['direccion_id' => $address->id, 'capacidad' => 2, 'acepta_perros' => true, 'acepta_gatos' => true, 'activo' => true],
        );
        foreach ([
            ['Luna', 'Gato', 'Criollo', 'hembra', 'pequeno', 2, $demoPrefix.'001', 'Cariñosa, tranquila y lista para encontrar un hogar.'],
            ['Max', 'Perro', 'Criollo', 'macho', 'mediano', 3, $demoPrefix.'002', 'Sociable y juguetón; disfruta los paseos y la compañía.'],
            ['Mora', 'Perro', 'Beagle', 'hembra', 'mediano', 1, $demoPrefix.'003', 'Curiosa, activa y con mucha energía para compartir.'],
        ] as [$nombre, $especieNombre, $razaNombre, $sexo, $tamano, $edad, $codigo, $descripcion]) {
            $especie = Especie::where('nombre', $especieNombre)->firstOrFail();
            $mascota = Mascota::firstOrCreate(
                ['codigo_identificacion' => $codigo],
                ['nombre' => $nombre, 'especie_id' => $especie->id, 'raza_id' => Raza::where('especie_id', $especie->id)->where('nombre', $razaNombre)->value('id'), 'estado_id' => EstadoMascota::where('codigo', 'disponible')->value('id'), 'responsable_id' => $shelterUser->id, 'refugio_id' => $refugio->id, 'edad_estimada_anios' => $edad, 'sexo' => $sexo, 'tamano' => $tamano, 'descripcion' => $descripcion],
            );
            PublicacionAdopcion::firstOrCreate(
                ['mascota_id' => $mascota->id],
                ['publicada_por' => $shelterUser->id, 'titulo' => 'Conoce a '.$mascota->nombre, 'descripcion' => $mascota->descripcion, 'estado' => 'publicada'],
            );
        }

        $adopter = $users['Adoptante'];
        $vet = Veterinario::where('usuario_id', $users['Veterinario']->id)->firstOrFail();
        foreach ([['Luna', '001', 'pendiente'], ['Max', '002', 'en_revision'], ['Mora', '003', 'aprobada']] as [$petName, $codeSuffix, $status]) {
            $pet = Mascota::where('codigo_identificacion', $demoPrefix.$codeSuffix)->where('responsable_id', $shelterUser->id)->firstOrFail();
            $publication = PublicacionAdopcion::where('mascota_id', $pet->id)->firstOrFail();
            SolicitudAdopcion::firstOrCreate(
                ['publicacion_id' => $publication->id, 'adoptante_id' => $adopter->id],
                ['motivacion' => 'Solicitud de demostración PetLink.', 'estado' => $status, 'revisada_por' => $status === 'pendiente' ? null : $shelterUser->id, 'revisada_en' => $status === 'pendiente' ? null : now()],
            );
        }

        $adoptedSpecies = Especie::where('nombre', 'Perro')->firstOrFail();
        $adoptedPet = Mascota::firstOrCreate(
            ['codigo_identificacion' => $demoPrefix.'004'],
            ['nombre' => 'Bongo', 'especie_id' => $adoptedSpecies->id, 'raza_id' => Raza::where('especie_id', $adoptedSpecies->id)->where('nombre', 'Criollo')->value('id'), 'estado_id' => EstadoMascota::where('codigo', 'adoptada')->value('id'), 'responsable_id' => $shelterUser->id, 'refugio_id' => $refugio->id, 'edad_estimada_anios' => 4, 'sexo' => 'macho', 'tamano' => 'mediano', 'descripcion' => 'Adopción de demostración PetLink.'],
        );
        $adoptedPublication = PublicacionAdopcion::firstOrCreate(
            ['mascota_id' => $adoptedPet->id],
            ['publicada_por' => $shelterUser->id, 'titulo' => 'Conoce a Bongo', 'descripcion' => 'Adopción de demostración PetLink.', 'estado' => 'cerrada', 'cerrada_en' => now()],
        );
        $formalizedRequest = SolicitudAdopcion::firstOrCreate(
            ['publicacion_id' => $adoptedPublication->id, 'adoptante_id' => $adopter->id],
            ['motivacion' => 'Solicitud de demostración PetLink.', 'estado' => 'formalizada', 'revisada_por' => $shelterUser->id, 'revisada_en' => now()],
        );
        $adoption = Adopcion::firstOrCreate(
            ['solicitud_id' => $formalizedRequest->id],
            ['mascota_id' => $adoptedPet->id, 'adoptante_id' => $adopter->id, 'formalizada_por' => $shelterUser->id, 'fecha_adopcion' => now()->toDateString(), 'estado' => 'activa', 'observaciones' => 'Adopción de demostración.'],
        );
        SeguimientoAdopcion::firstOrCreate(
            ['adopcion_id' => $adoption->id],
            ['registrado_por' => $shelterUser->id, 'fecha_programada' => now()->addDays(7)->toDateString(), 'resultado' => 'pendiente', 'observaciones' => 'Seguimiento de demostración.'],
        );

        $samplePet = Mascota::where('codigo_identificacion', $demoPrefix.'001')->firstOrFail();
        CitaVeterinaria::firstOrCreate(
            ['mascota_id' => $samplePet->id, 'veterinario_id' => $vet->id, 'solicitada_por' => $adopter->id],
            ['programada_en' => now()->addDays(2), 'duracion_minutos' => 30, 'estado' => 'confirmada', 'motivo' => 'Control preventivo de demostración.'],
        );
        HistorialMedico::firstOrCreate(
            ['mascota_id' => $samplePet->id, 'veterinario_id' => $vet->id, 'titulo' => 'Control preventivo demo'],
            ['registrado_por' => $users['Veterinario']->id, 'tipo' => 'consulta', 'fecha_registro' => now()->toDateString(), 'descripcion' => 'Revisión general registrada para mostrar el historial autorizado.'],
        );
        $rabies = Vacuna::where('nombre', 'Rabia')->firstOrFail();
        MascotaVacuna::firstOrCreate(
            ['mascota_id' => $samplePet->id, 'vacuna_id' => $rabies->id, 'veterinario_id' => $vet->id],
            ['aplicada_en' => now()->subMonths(2)->toDateString(), 'refuerzo_en' => now()->addMonths(10)->toDateString(), 'lote' => 'DEMO-RAB-01', 'observaciones' => 'Aplicación de demostración.'],
        );
        Donacion::firstOrCreate(
            ['donante_id' => $adopter->id, 'descripcion' => 'Aporte de demostración PetLink'],
            ['refugio_id' => $refugio->id, 'tipo_aporte' => 'dinero', 'importe_cop' => 25000, 'estado' => 'registrada', 'donada_en' => now()],
        );

        $fosterSpecies = Especie::where('nombre', 'Gato')->firstOrFail();
        $fosterPet = Mascota::firstOrCreate(
            ['codigo_identificacion' => $demoPrefix.'005'],
            ['nombre' => 'Nube', 'especie_id' => $fosterSpecies->id, 'raza_id' => Raza::where('especie_id', $fosterSpecies->id)->where('nombre', 'Criollo')->value('id'), 'estado_id' => EstadoMascota::where('codigo', 'en_acogida')->value('id'), 'responsable_id' => $shelterUser->id, 'refugio_id' => $refugio->id, 'edad_estimada_anios' => 1, 'sexo' => 'hembra', 'tamano' => 'pequeno', 'descripcion' => 'En hogar temporal de demostración.'],
        );
        $home = $users['Hogar temporal']->hogarTemporal()->firstOrFail();
        AsignacionHogar::firstOrCreate(
            ['hogar_id' => $home->id, 'mascota_id' => $fosterPet->id],
            ['asignada_por' => $shelterUser->id, 'inicio' => now()->subDays(3)->toDateString(), 'estado' => 'activa', 'notas' => 'Administrar alimentación y registrar novedades de cuidado.'],
        );
    }
}
