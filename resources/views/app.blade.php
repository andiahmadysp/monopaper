<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Favicon and PWA -->
        <link rel="apple-touch-icon" sizes="180x180" href="/logo/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/logo/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/logo/favicon-16x16.png">
        <link rel="manifest" href="/logo/site.webmanifest">
        <link rel="shortcut icon" href="/logo/favicon.ico">
        <meta name="apple-mobile-web-app-title" content="{{ config('app.name', 'Laravel') }}">
        <meta name="application-name" content="{{ config('app.name', 'Laravel') }}">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="theme-color" content="#ffffff">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
