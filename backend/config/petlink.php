<?php

return [
    'demo_accounts_enabled' => (bool) env('PETLINK_DEMO_ACCOUNTS', false),
    'demo_passwords' => [
        'admin' => env('PETLINK_DEMO_PASSWORD_ADMIN'),
        'adopter' => env('PETLINK_DEMO_PASSWORD_ADOPTER'),
        'shelter' => env('PETLINK_DEMO_PASSWORD_SHELTER'),
        'veterinarian' => env('PETLINK_DEMO_PASSWORD_VETERINARIAN'),
        'foster' => env('PETLINK_DEMO_PASSWORD_FOSTER'),
    ],
    'pet_photo_disk' => env('PET_PHOTO_DISK', 'public'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
    'supabase_url' => env('SUPABASE_URL'),
    'supabase_storage_bucket' => env('SUPABASE_STORAGE_BUCKET', 'petlink-assets'),
    'supabase_storage_key' => env('SUPABASE_STORAGE_KEY'),
];
