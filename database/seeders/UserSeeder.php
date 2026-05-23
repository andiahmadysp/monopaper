<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insert([
            'password'   => Hash::make(env('DASHBOARD_PASSWORD', 'secret')),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
