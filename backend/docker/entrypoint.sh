#!/bin/sh
set -eu

port="${PORT:-10000}"
sed -i "s/^Listen 80$/Listen ${port}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${port}>/" /etc/apache2/sites-enabled/000-default.conf

run_migrations="${RUN_MIGRATIONS:-false}"
run_seeders="${RUN_SEEDERS:-false}"
if [ "$run_migrations" = "true" ] || [ "$run_seeders" = "true" ]; then
    expected_target="${DB_DATABASE:-}@${DB_HOST:-}:${DB_PORT:-5432}"
    if [ "${APP_ENV:-}" != "production" ] || [ "${DB_CONNECTION:-}" != "pgsql" ] || [ "${PETLINK_MIGRATION_TARGET:-}" != "$expected_target" ]; then
        echo "Refusing database changes: APP_ENV, PostgreSQL connection, and PETLINK_MIGRATION_TARGET confirmation must match."
        exit 1
    fi
fi

if [ "$run_migrations" = "true" ]; then
    echo "Applying Laravel migrations to confirmed database target ${expected_target}."
    php artisan migrate --force
fi

if [ "$run_seeders" = "true" ]; then
    echo "Seeding production roles and catalogs on confirmed database target ${expected_target}; demo accounts remain disabled."
    php artisan db:seed --force
fi

exec "$@"
