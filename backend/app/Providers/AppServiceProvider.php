<?php

namespace App\Providers;

use App\Models\Mascota;
use App\Models\SolicitudAdopcion;
use App\Policies\MascotaPolicy;
use App\Policies\SolicitudAdopcionPolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Mascota::class, MascotaPolicy::class);
        Gate::policy(SolicitudAdopcion::class, SolicitudAdopcionPolicy::class);
        ResetPassword::createUrlUsing(fn ($user, string $token) => rtrim(config('petlink.frontend_url'), '/').'/recuperar-contrasena?'.http_build_query([
            'token' => $token,
            'email' => $user->getEmailForPasswordReset(),
        ]));
    }
}
