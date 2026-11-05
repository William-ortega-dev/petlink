<?php

namespace Tests\Unit;

use App\Support\PetPhotoStorage;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PetPhotoStorageTest extends TestCase
{
    public function test_supabase_upload_uses_a_server_secret_and_returns_public_url(): void
    {
        config([
            'petlink.pet_photo_disk' => 'supabase',
            'petlink.supabase_url' => 'https://petlink-demo.supabase.co',
            'petlink.supabase_storage_bucket' => 'petlink-assets',
            'petlink.supabase_storage_key' => 'sb_secret_demo',
        ]);
        Http::fake(['https://petlink-demo.supabase.co/storage/v1/object/petlink-assets/*' => Http::response(['Key' => 'stored'], 200)]);

        $storage = new PetPhotoStorage;
        $path = $storage->store(UploadedFile::fake()->create('mascota.jpg', 100, 'image/jpeg'), 42);

        $this->assertNotFalse($path);
        $this->assertSame('https://petlink-demo.supabase.co/storage/v1/object/public/petlink-assets/'.$path, $storage->url($path));
        Http::assertSent(fn (Request $request) => $request->method() === 'POST'
            && str_contains($request->url(), '/storage/v1/object/petlink-assets/mascotas/42/')
            && $request->hasHeader('apikey', 'sb_secret_demo')
            && ! $request->hasHeader('Authorization'));
    }

    public function test_supabase_photo_delete_uses_storage_api(): void
    {
        config([
            'petlink.pet_photo_disk' => 'supabase',
            'petlink.supabase_url' => 'https://petlink-demo.supabase.co',
            'petlink.supabase_storage_bucket' => 'petlink-assets',
            'petlink.supabase_storage_key' => 'eyJdemo-service-role',
        ]);
        Http::fake([
            'https://petlink-demo.supabase.co/storage/v1/object/petlink-assets' => Http::response([], 200),
        ]);
        $storage = new PetPhotoStorage;
        $path = 'mascotas/42/foto.jpg';

        $this->assertTrue($storage->delete($path));
        Http::assertSent(fn (Request $request) => $request->method() === 'DELETE'
            && $request->url() === 'https://petlink-demo.supabase.co/storage/v1/object/petlink-assets'
            && $request->hasHeader('Authorization', 'Bearer eyJdemo-service-role')
            && $request->data() === ['prefixes' => [$path]]);
    }
}
