# ── Stage 1: Frontend Build ───────────────────────────────────
FROM node:24-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Stage 2: Backend Build ────────────────────────────────────
FROM composer:latest AS backend-builder
WORKDIR /var/www/monopaper
COPY . .
RUN composer install --prefer-dist --optimize-autoloader --no-dev --no-interaction

# ── Stage 3: Final Runtime ────────────────────────────────────
FROM php:8.4-fpm

RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libwebp-dev \
    zip \
    unzip \
    libzip-dev \
    libicu-dev \
    sqlite3 \
    libsqlite3-dev

RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-configure intl \
    && docker-php-ext-install pdo_sqlite mbstring exif pcntl bcmath gd zip intl

RUN apt-get clean \
    && apt-get purge --autoremove -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/monopaper

COPY . /var/www/monopaper
COPY --from=frontend-builder /app/public/build ./public/build
COPY --from=backend-builder /var/www/monopaper/vendor ./vendor

RUN chown -R www-data:www-data /var/www/monopaper/storage /var/www/monopaper/bootstrap/cache
