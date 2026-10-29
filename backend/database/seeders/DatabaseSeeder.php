<?php

namespace Database\Seeders;

use App\Models\Direccion;
use App\Models\Especie;
use App\Models\EstadoMascota;
use App\Models\HogarTemporal;
use App\Models\Mascota;
use App\Models\PublicacionAdopcion;
use App\Models\Raza;
use App\Models\Refugio;
use App\Models\Role;
use App\Models\User;
use App\Models\Vacuna;
use App\Models\Veterinario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

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
            Role::updateOrCreate(['nombre' => $nombre], ['descripcion' => $descripcion]);
        }

        foreach ([['Perro', '🐶'], ['Gato', '🐱']] as [$nombre, $icono]) {
            Especie::updateOrCreate(['nombre' => $nombre], ['icono' => $icono, 'activo' => true]);
        }
        foreach ([['Perro', 'Criollo'], ['Perro', 'Labrador'], ['Perro', 'Beagle'], ['Gato', 'Criollo'], ['Gato', 'Siamés']] as [$especie, $raza]) {
            Raza::updateOrCreate(['especie_id' => Especie::where('nombre', $especie)->value('id'), 'nombre' => $raza], ['activo' => true]);
        }
        foreach ([
            ['disponible', 'Disponible', true], ['en_acogida', 'En hogar temporal', true],
            ['en_proceso', 'En proceso de adopción', true], ['adoptada', 'Adoptada', false],
            ['atencion_medica', 'En atención médica', false],
        ] as [$codigo, $nombre, $visible]) {
            EstadoMascota::updateOrCreate(['codigo' => $codigo], ['nombre' => $nombre, 'visible_publico' => $visible]);
        }
        foreach (['Rabia', 'Triple felina', 'Parvovirus', 'Moquillo'] as $vacuna) {
            Vacuna::updateOrCreate(['nombre' => $vacuna], ['activo' => true]);
        }

        $address = Direccion::updateOrCreate(
            ['departamento' => 'Cundinamarca', 'municipio' => 'Bogotá'],
            ['direccion_linea' => 'Calle 10 # 5-20', 'barrio' => 'Centro'],
        );
        $users = [];
        foreach ([
            ['Administración PetLink', 'admin@petlink.local', 'Administrador'],
            ['Refugio Patitas Bogotá', 'refugio@petlink.local', 'Refugio'],
            ['Adoptante Demo', 'adoptante@petlink.local', 'Adoptante'],
            ['Veterinaria Demo', 'veterinario@petlink.local', 'Veterinario'],
            ['Hogar Demo', 'hogar@petlink.local', 'Hogar temporal'],
        ] as [$name, $email, $role]) {
            $users[$role] = User::updateOrCreate(
                ['email' => $email],
                ['name' => $name, 'role_id' => Role::where('nombre', $role)->value('id'), 'direccion_id' => $address->id, 'telefono' => '3000000000', 'activo' => true, 'password' => Hash::make('PetLink2026!')],
            );
        }

        $shelterUser = $users['Refugio'];
        $refugio = Refugio::updateOrCreate(
            ['responsable_id' => $shelterUser->id],
            ['nombre' => 'Refugio Patitas Bogotá', 'correo_contacto' => $shelterUser->email, 'telefono_contacto' => $shelterUser->telefono, 'direccion_id' => $address->id, 'descripcion' => 'Refugio de demostración para validar PetLink.'],
        );
        Veterinario::updateOrCreate(
            ['usuario_id' => $users['Veterinario']->id],
            ['numero_licencia' => 'DEMO-MV-001', 'especialidad' => 'Medicina preventiva', 'clinica' => 'Clínica PetLink Demo', 'activo' => true],
        );
        HogarTemporal::updateOrCreate(
            ['responsable_id' => $users['Hogar temporal']->id],
            ['direccion_id' => $address->id, 'capacidad' => 2, 'acepta_perros' => true, 'acepta_gatos' => true, 'activo' => true],
        );
        foreach ([
            ['Luna', 'Gato', 'Criollo', 'hembra', 'pequeno', 2, 'DEMO-PL-001', 'Cariñosa, tranquila y lista para encontrar un hogar.'],
            ['Max', 'Perro', 'Criollo', 'macho', 'mediano', 3, 'DEMO-PL-002', 'Sociable y juguetón; disfruta los paseos y la compañía.'],
            ['Mora', 'Perro', 'Beagle', 'hembra', 'mediano', 1, 'DEMO-PL-003', 'Curiosa, activa y con mucha energía para compartir.'],
        ] as [$nombre, $especieNombre, $razaNombre, $sexo, $tamano, $edad, $codigo, $descripcion]) {
            $especie = Especie::where('nombre', $especieNombre)->firstOrFail();
            $mascota = Mascota::updateOrCreate(
                ['codigo_identificacion' => $codigo],
                ['nombre' => $nombre, 'especie_id' => $especie->id, 'raza_id' => Raza::where('especie_id', $especie->id)->where('nombre', $razaNombre)->value('id'), 'estado_id' => EstadoMascota::where('codigo', 'disponible')->value('id'), 'responsable_id' => $shelterUser->id, 'refugio_id' => $refugio->id, 'edad_estimada_anios' => $edad, 'sexo' => $sexo, 'tamano' => $tamano, 'descripcion' => $descripcion],
            );
            PublicacionAdopcion::updateOrCreate(
                ['mascota_id' => $mascota->id],
                ['publicada_por' => $shelterUser->id, 'titulo' => 'Conoce a '.$mascota->nombre, 'descripcion' => $mascota->descripcion, 'estado' => 'publicada'],
            );
        }
    }
}
