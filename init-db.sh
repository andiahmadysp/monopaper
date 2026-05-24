#!/usr/bin/env bash

set -o errexit

if [ ! -f .env ]; then
    echo "Initializing..."

    # Configuring environment
    cp .env.example .env
    php artisan key:generate

    # Run database migrations
    php artisan migrate --seed

    # Caching configuration, routes, and views	
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
else
    echo "Already initialized, skipping..."
fi
