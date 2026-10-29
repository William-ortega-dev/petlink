<?php

use App\Http\Controllers\Api\AdoptionController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DomainController;
use App\Http\Controllers\Api\PetController;
use App\Http\Controllers\Api\PublicationController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok', 'application' => 'PetLink']));

Route::prefix('catalogos')->group(function () {
    Route::get('/especies', [CatalogController::class, 'species']);
    Route::get('/estados-mascota', [CatalogController::class, 'petStates']);
    Route::get('/razas', [CatalogController::class, 'breeds']);
    Route::get('/vacunas', [DomainController::class, 'vaccines']);
});
Route::get('/refugios', [CatalogController::class, 'refuges']);
Route::get('/veterinarios', [CatalogController::class, 'veterinarians']);
Route::get('/mascotas', [PetController::class, 'index']);
Route::get('/mascotas/{mascota}', [PetController::class, 'show']);

Route::post('/auth/registro', [AuthController::class, 'register'])->middleware('throttle:6,1');
Route::post('/auth/iniciar-sesion', [AuthController::class, 'login'])->middleware('throttle:8,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/cerrar-sesion', [AuthController::class, 'logout']);
    Route::get('/auth/usuario', [AuthController::class, 'me']);
    Route::put('/auth/perfil', [AuthController::class, 'updateProfile']);
    Route::put('/auth/contrasena', [AuthController::class, 'updatePassword']);
    Route::get('/panel', [DashboardController::class, 'show']);

    Route::post('/mascotas', [PetController::class, 'store']);
    Route::get('/mis-mascotas', [PetController::class, 'managed']);
    Route::put('/mascotas/{mascota}', [PetController::class, 'update']);
    Route::post('/mascotas/{mascota}/fotos', [PetController::class, 'uploadPhoto']);
    Route::get('/mascotas/{mascota}/historial-medico', [DomainController::class, 'medicalHistory']);
    Route::post('/mascotas/{mascota}/publicaciones', [PublicationController::class, 'store']);
    Route::put('/publicaciones/{publicacion}', [PublicationController::class, 'update']);

    Route::get('/mis-solicitudes', [AdoptionController::class, 'mine']);
    Route::post('/publicaciones/{publicacion}/solicitudes', [AdoptionController::class, 'apply']);
    Route::get('/solicitudes/para-revisar', [AdoptionController::class, 'forReview']);
    Route::patch('/solicitudes/{solicitud}', [AdoptionController::class, 'review']);
    Route::post('/solicitudes/{solicitud}/formalizar', [AdoptionController::class, 'formalize']);
    Route::get('/adopciones', [AdoptionController::class, 'adoptions']);

    Route::post('/catalogos/especies', [CatalogController::class, 'storeSpecies']);
    Route::post('/catalogos/razas', [CatalogController::class, 'storeBreed']);
    Route::post('/refugios', [CatalogController::class, 'storeRefuge']);
    Route::get('/usuarios', [CatalogController::class, 'users']);
    Route::patch('/usuarios/{usuario}', [CatalogController::class, 'updateUser']);
    Route::get('/roles', [CatalogController::class, 'roles']);

    Route::get('/citas', [DomainController::class, 'appointments']);
    Route::post('/citas', [DomainController::class, 'bookAppointment']);
    Route::patch('/citas/{cita}', [DomainController::class, 'updateAppointment']);
    Route::post('/historial-medico', [DomainController::class, 'addMedicalRecord']);
    Route::post('/vacunas', [DomainController::class, 'createVaccine']);
    Route::post('/vacunaciones', [DomainController::class, 'addVaccineApplication']);
    Route::post('/veterinarios', [DomainController::class, 'createVeterinarian']);

    Route::get('/hogar-temporal', [DomainController::class, 'myHousehold']);
    Route::get('/hogares-temporales', [DomainController::class, 'availableHomes']);
    Route::post('/hogar-temporal', [DomainController::class, 'registerHousehold']);
    Route::get('/asignaciones-hogar', [DomainController::class, 'assignments']);
    Route::post('/asignaciones-hogar', [DomainController::class, 'assignToHousehold']);
    Route::patch('/asignaciones-hogar/{asignacion}/finalizar', [DomainController::class, 'closeAssignment']);

    Route::get('/donaciones', [DomainController::class, 'myDonations']);
    Route::post('/donaciones', [DomainController::class, 'storeDonation']);
    Route::get('/seguimientos', [DomainController::class, 'followUps']);
    Route::post('/adopciones/{adopcion}/seguimientos', [DomainController::class, 'createFollowUp']);
    Route::patch('/seguimientos/{seguimiento}', [DomainController::class, 'updateFollowUp']);
});

