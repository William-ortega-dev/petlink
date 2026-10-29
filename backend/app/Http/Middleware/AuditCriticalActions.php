<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AuditCriticalActions
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $next($request);
        }

        return DB::transaction(function () use ($request, $next) {
            $response = $next($request);
            $user = $request->user();

            if ($user && $response->isSuccessful()) {
                $parameters = $request->route()?->parameters() ?? [];
                $subject = collect($parameters)->first(fn ($value) => is_object($value) && method_exists($value, 'getKey'));
                $subjectType = $subject ? class_basename($subject) : null;
                $subjectId = $subject?->getKey();

                AuditLog::create([
                    'actor_id' => $user->id,
                    'action' => strtoupper($request->method()).' '.$request->route()?->uri(),
                    'subject_type' => $subjectType,
                    'subject_id' => $subjectId,
                    'created_at' => now(),
                ]);
            }

            return $response;
        });
    }
}
