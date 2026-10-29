<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class PetPhotoStorage
{
    public function store(UploadedFile $file, int $petId): string|false
    {
        if (! $this->usesSupabase()) {
            return $file->store('mascotas/'.$petId, config('petlink.pet_photo_disk', 'public'));
        }

        $path = $file->hashName('mascotas/'.$petId);
        $content = file_get_contents($file->getRealPath());
        if ($content === false) {
            return false;
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders($this->headers() + [
                    'Content-Type' => $file->getMimeType() ?: 'application/octet-stream',
                    'x-upsert' => 'false',
                ])
                ->withBody($content, $file->getMimeType() ?: 'application/octet-stream')
                ->post($this->objectEndpoint($path));
        } catch (ConnectionException) {
            return false;
        }

        return $response->successful() ? $path : false;
    }

    public function url(string $path): string
    {
        if (! $this->usesSupabase()) {
            return Storage::disk(config('petlink.pet_photo_disk', 'public'))->url($path);
        }

        return $this->publicObjectUrl($path);
    }

    public function delete(string $path): bool
    {
        if (! $this->usesSupabase()) {
            return Storage::disk(config('petlink.pet_photo_disk', 'public'))->delete($path);
        }

        $bucketEndpoint = rtrim((string) config('petlink.supabase_url'), '/').'/storage/v1/object/'.rawurlencode((string) config('petlink.supabase_storage_bucket'));
        try {
            $response = Http::timeout(20)
                ->withHeaders($this->headers())
                ->delete($bucketEndpoint, ['prefixes' => [$path]]);
        } catch (ConnectionException) {
            return false;
        }

        return $response->successful();
    }

    private function usesSupabase(): bool
    {
        return config('petlink.pet_photo_disk') === 'supabase';
    }

    private function objectEndpoint(string $path): string
    {
        return rtrim((string) config('petlink.supabase_url'), '/').'/storage/v1/object/'.rawurlencode((string) config('petlink.supabase_storage_bucket')).'/'.$this->encodePath($path);
    }

    private function publicObjectUrl(string $path): string
    {
        return rtrim((string) config('petlink.supabase_url'), '/').'/storage/v1/object/public/'.rawurlencode((string) config('petlink.supabase_storage_bucket')).'/'.$this->encodePath($path);
    }

    private function encodePath(string $path): string
    {
        return implode('/', array_map('rawurlencode', explode('/', $path)));
    }

    private function headers(): array
    {
        $key = (string) config('petlink.supabase_storage_key');
        $headers = ['apikey' => $key, 'Accept' => 'application/json'];

        // Legacy Supabase service-role JWTs also need a bearer header. New sb_secret keys are not JWTs.
        if (str_starts_with($key, 'eyJ')) {
            $headers['Authorization'] = 'Bearer '.$key;
        }

        return $headers;
    }
}
